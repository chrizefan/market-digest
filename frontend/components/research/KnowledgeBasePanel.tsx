'use client';

import { useMemo, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';
import type { Doc } from '@/lib/types';
import {
  RESEARCH_CATEGORY_ORDER,
  canonicalResearchTitle,
  categorizeResearchDoc,
  isKnowledgeBaseDoc,
} from '@/lib/research-doc-categorize';
import LibraryDocumentBody from '@/components/library/LibraryDocumentBody';
import { getLibraryDocumentById, type LibraryDocumentResult } from '@/lib/queries';

export default function KnowledgeBasePanel({ docs }: { docs: Doc[] }) {
  const kbDocs = useMemo(() => docs.filter(isKnowledgeBaseDoc), [docs]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<Doc | null>(null);
  const [libraryDoc, setLibraryDoc] = useState<LibraryDocumentResult | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);

  const categoryList = useMemo(() => {
    const set = new Set(kbDocs.map((d) => categorizeResearchDoc(d)));
    const list = [...set];
    return list.sort((a, b) => {
      const ia = RESEARCH_CATEGORY_ORDER.indexOf(a as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      const ib = RESEARCH_CATEGORY_ORDER.indexOf(b as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    });
  }, [kbDocs]);

  const filtered = useMemo(() => {
    let list = kbDocs;
    if (filterCat) list = list.filter((d) => categorizeResearchDoc(d) === filterCat);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => {
      const title = (d.title || '').toLowerCase();
      const path = (d.path || '').toLowerCase();
      const seg = (d.segment || '').toLowerCase();
      return title.includes(q) || path.includes(q) || seg.includes(q);
    });
  }, [kbDocs, filterCat, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, Doc[]> = {};
    for (const d of filtered) {
      const cat = categorizeResearchDoc(d);
      (map[cat] = map[cat] || []).push(d);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
    return Object.entries(map).sort(([a], [b]) => {
      const ia = RESEARCH_CATEGORY_ORDER.indexOf(a as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      const ib = RESEARCH_CATEGORY_ORDER.indexOf(b as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    });
  }, [filtered]);

  async function openDoc(f: Doc) {
    setActiveLoading(true);
    setActiveFile(f);
    setLibraryDoc(null);
    try {
      setLibraryDoc(await getLibraryDocumentById(f.id));
    } catch {
      setLibraryDoc({
        id: f.id,
        date: f.date,
        document_key: f.path,
        view: 'markdown',
        markdown: '_Failed to load content._',
        payload: null,
      });
    } finally {
      setActiveLoading(false);
    }
  }

  function closeDoc() {
    setActiveFile(null);
    setLibraryDoc(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="relative max-w-md flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base…"
            className="w-full rounded-md border border-border-subtle bg-bg-secondary/80 pl-8 pr-2 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-fin-blue/50"
            aria-label="Search knowledge base"
          />
        </div>
      </div>

      {kbDocs.length > 0 && categoryList.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCat(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !filterCat
                ? 'border-fin-blue/40 bg-fin-blue/15 text-fin-blue'
                : 'border-border-subtle text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
            }`}
          >
            All types
          </button>
          {categoryList.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCat(c === filterCat ? null : c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                c === filterCat
                  ? 'border-fin-blue/40 bg-fin-blue/15 text-fin-blue'
                  : 'border-border-subtle text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {activeFile ? (
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <FileText size={14} className="text-fin-blue shrink-0" />
              <span className="font-mono truncate">{canonicalResearchTitle(activeFile)}</span>
              {activeFile.date ? (
                <span className="text-[11px] text-text-muted shrink-0 font-mono">{activeFile.date}</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeDoc}
              className="text-text-muted hover:text-white shrink-0"
              aria-label="Close document"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-6 max-w-none text-sm leading-relaxed overflow-auto max-h-[70vh]">
            {activeLoading || !libraryDoc ? (
              <div className="text-text-secondary">Loading document…</div>
            ) : (
              <LibraryDocumentBody
                view={libraryDoc.view}
                markdown={libraryDoc.markdown}
                payload={libraryDoc.payload}
                documentKey={libraryDoc.document_key}
                docDate={libraryDoc.date}
              />
            )}
          </div>
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted text-sm">
          {kbDocs.length === 0
            ? 'No knowledge base documents in this workspace yet.'
            : filterCat
              ? `No documents in “${filterCat}” with the current search.`
              : 'No documents match your search.'}
        </div>
      ) : (
        grouped.map(([cat, files]) => (
          <div key={cat} className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-bg-secondary border-b border-border-subtle">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{cat}</h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => openDoc(f)}
                  className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <FileText size={14} className="text-fin-blue/60 shrink-0" />
                  <span className="font-mono text-sm truncate">{canonicalResearchTitle(f)}</span>
                  <span className="ml-auto text-[11px] text-text-muted font-mono shrink-0">{f.date ?? ''}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
