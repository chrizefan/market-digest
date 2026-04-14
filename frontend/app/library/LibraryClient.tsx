'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, ChevronRight, Filter, FileText, Search } from 'lucide-react';

import { SUBPAGE_MAX } from '@/components/subpage-tab-bar';
import DeltaDaySummary from '@/components/library/DeltaDaySummary';
import DocumentExpandInline from '@/components/library/DocumentExpandInline';
import { useDashboard } from '@/lib/dashboard-context';
import {
  countDeltaTouchesForDoc,
  countResearchChangelogTouchesForDoc,
  docMatchesLibraryScope,
} from '@/lib/library-doc-tier';
import { getLibraryDocumentById, type LibraryDocumentResult } from '@/lib/queries';
import type { Doc } from '@/lib/types';
import MiniCalendar, { type MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import {
  RESEARCH_CATEGORY_ORDER,
  canonicalResearchTitle,
  categorizeResearchDoc,
} from '@/lib/research-doc-categorize';

type RunDayKind = MiniCalendarRunKind;

function aggregateRunKindForDate(docsOnDate: Doc[]): RunDayKind {
  let sawBaseline = false;
  let sawDelta = false;
  for (const d of docsOnDate) {
    const rt = (d.runType || '').toLowerCase();
    if (rt === 'baseline') sawBaseline = true;
    else if (rt === 'delta') sawDelta = true;
  }
  if (sawBaseline && sawDelta) return 'baseline';
  if (sawBaseline) return 'baseline';
  if (sawDelta) return 'delta';
  return 'unknown';
}

function LibraryPageInner({ urlDate, urlDocKey }: { urlDate: string | null; urlDocKey: string | null }) {
  const { data, loading, error } = useDashboard();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<Doc | null>(null);
  const [libraryDoc, setLibraryDoc] = useState<LibraryDocumentResult | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const docs = useMemo<Doc[]>(() => data?.docs || [], [data]);
  const deltaMetaByDate = useMemo(
    () => data?.delta_request_meta_by_date ?? {},
    [data?.delta_request_meta_by_date]
  );
  const researchChangelogByDate = useMemo(
    () => data?.research_changelog_by_date ?? {},
    [data?.research_changelog_by_date]
  );
  const snapshotRunTypeByDate = useMemo(
    () => data?.snapshot_run_type_by_date ?? {},
    [data?.snapshot_run_type_by_date]
  );

  const researchDocs = useMemo(
    () => docs.filter((d) => docMatchesLibraryScope(d, 'research')),
    [docs]
  );

  const docsByDate = useMemo(() => {
    const m = new Map<string, Doc[]>();
    for (const d of researchDocs) {
      if (!d.date) continue;
      const arr = m.get(d.date) || [];
      arr.push(d);
      m.set(d.date, arr);
    }
    return m;
  }, [researchDocs]);

  const dates = useMemo<string[]>(() => {
    const set = new Set(researchDocs.map((d) => d.date).filter(Boolean));
    return [...set].sort().reverse();
  }, [researchDocs]);

  const runKindByDate = useMemo(() => {
    const m = new Map<string, RunDayKind>();
    for (const date of dates) {
      const onDay = docsByDate.get(date) ?? [];
      let kind = aggregateRunKindForDate(onDay);
      if (kind === 'unknown') {
        const snap = snapshotRunTypeByDate[date];
        if (snap === 'baseline' || snap === 'delta') kind = snap;
      }
      m.set(date, kind);
    }
    return m;
  }, [dates, docsByDate, snapshotRunTypeByDate]);

  const effDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] || null;

  const docsForEffDate = useMemo<Doc[]>(
    () => (effDate ? researchDocs.filter((d) => d.date === effDate) : []),
    [researchDocs, effDate]
  );

  const dateDocs = useMemo<Doc[]>(() => {
    let list = docsForEffDate;
    if (filterCat) list = list.filter((d) => categorizeResearchDoc(d) === filterCat);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const title = (d.title || '').toLowerCase();
        const path = (d.path || '').toLowerCase();
        const seg = (d.segment || '').toLowerCase();
        return title.includes(q) || path.includes(q) || seg.includes(q);
      });
    }
    return list;
  }, [docsForEffDate, filterCat, searchQuery]);

  const grouped = useMemo<[string, Doc[]][]>(() => {
    const map: Record<string, Doc[]> = {};
    dateDocs.forEach((d) => {
      const cat = categorizeResearchDoc(d);
      (map[cat] = map[cat] || []).push(d);
    });
    return Object.entries(map).sort(([a], [b]) => {
      const ia = RESEARCH_CATEGORY_ORDER.indexOf(a as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      const ib = RESEARCH_CATEGORY_ORDER.indexOf(b as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    });
  }, [dateDocs]);

  const digestDocForDate = useMemo(
    () => docsForEffDate.find((d) => (d.path || '').toLowerCase() === 'digest') ?? null,
    [docsForEffDate]
  );

  const categoryList = useMemo<string[]>(() => {
    const set = new Set(docsForEffDate.map((d) => categorizeResearchDoc(d)));
    const list = [...set];
    return list.sort((a, b) => {
      const ia = RESEARCH_CATEGORY_ORDER.indexOf(a as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      const ib = RESEARCH_CATEGORY_ORDER.indexOf(b as (typeof RESEARCH_CATEGORY_ORDER)[number]);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    });
  }, [docsForEffDate]);

  const latestDate = dates[0] || null;

  const activeFileHidden =
    activeFile != null && !dateDocs.some((d) => d.id === activeFile.id);

  useEffect(() => {
    if (urlDate && dates.includes(urlDate)) {
      setSelectedDate(urlDate);
      setActiveFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDate, dates.join('|')]);

  useEffect(() => {
    if (!urlDocKey) return;
    const match = researchDocs.find((d) => d.date === effDate && d.path === urlDocKey);
    if (match) {
      setActiveFile(match);
      setLibraryDoc(null);
      setActiveLoading(true);
      getLibraryDocumentById(match.id)
        .then(setLibraryDoc)
        .catch(() =>
          setLibraryDoc({
            id: match.id,
            date: match.date,
            document_key: match.path,
            view: 'markdown',
            markdown: '_Failed to load document._',
            payload: null,
          })
        )
        .finally(() => setActiveLoading(false));
    }
  }, [urlDocKey, researchDocs, effDate]);

  if (loading)
    return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data)
    return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  return (
    <div className={`${SUBPAGE_MAX} py-4 md:py-5`}>
        <div className="flex gap-6 max-lg:flex-col">
          {/* ── Left: Calendar + filters ── */}
          <div className="w-56 shrink-0 space-y-4 max-lg:w-full max-lg:flex max-lg:gap-4 max-lg:flex-wrap">
            <MiniCalendar
              dates={dates}
              runKindByDate={runKindByDate}
              selected={effDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setActiveFile(null);
                setLibraryDoc(null);
              }}
            />

            {latestDate && effDate !== latestDate ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setActiveFile(null);
                  setLibraryDoc(null);
                }}
                className="w-full text-xs py-2 rounded-lg border border-border-subtle text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Jump to latest ({latestDate})
              </button>
            ) : null}

            {/* Filters + search */}
            <div className="glass-card p-3 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, path…"
                  className="w-full rounded-md border border-border-subtle bg-bg-secondary/80 pl-8 pr-2 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-fin-blue/50"
                  aria-label="Search documents"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-xs text-text-muted w-full"
              >
                <Filter size={12} />
                <span>Category filters</span>
                {showFilters ? (
                  <ChevronDown size={12} className="ml-auto" />
                ) : (
                  <ChevronRight size={12} className="ml-auto" />
                )}
              </button>
              {showFilters && (
                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => setFilterCat(null)}
                    className={`block w-full text-left text-xs px-2 py-1 rounded ${
                      !filterCat ? 'text-fin-blue bg-fin-blue/10' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {categoryList.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFilterCat(c === filterCat ? null : c)}
                      className={`block w-full text-left text-xs px-2 py-1 rounded ${
                        c === filterCat ? 'text-fin-blue bg-fin-blue/10' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: File list + viewer ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Date header */}
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-fin-blue" />
              <h2 className="text-lg font-semibold">{effDate || 'No date selected'}</h2>
              <span className="text-xs text-text-muted">
                {dateDocs.length} file{dateDocs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {effDate && deltaMetaByDate[effDate] ? (
              <DeltaDaySummary
                meta={deltaMetaByDate[effDate]}
                digestAvailable={!!digestDocForDate}
                onOpenDigest={() => {
                  if (!digestDocForDate) return;
                  if (activeFile?.id === digestDocForDate.id) {
                    setActiveFile(null);
                    setLibraryDoc(null);
                    return;
                  }
                  setActiveFile(digestDocForDate);
                  setActiveLoading(true);
                  setLibraryDoc(null);
                  getLibraryDocumentById(digestDocForDate.id)
                    .then(setLibraryDoc)
                    .catch(() =>
                      setLibraryDoc({
                        id: digestDocForDate.id,
                        date: digestDocForDate.date,
                        document_key: digestDocForDate.path,
                        view: 'markdown',
                        markdown: '_Failed to load digest._',
                        payload: null,
                      })
                    )
                    .finally(() => setActiveLoading(false));
                }}
              />
            ) : null}

            {activeFileHidden && activeFile ? (
              <div className="glass-card p-0 overflow-hidden">
                <DocumentExpandInline
                  title={canonicalResearchTitle(activeFile)}
                  subtitle={activeFile.date ?? null}
                  badge={
                    (activeFile.runType || '').toLowerCase() === 'delta' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 shrink-0">
                        Δ updated
                      </span>
                    ) : null
                  }
                  loading={activeLoading}
                  libraryDoc={libraryDoc}
                  onCollapse={() => {
                    setActiveFile(null);
                    setLibraryDoc(null);
                  }}
                />
              </div>
            ) : null}

            {grouped.length > 0 ? (
              grouped.map(([cat, files]) => (
                <div key={cat} className="glass-card p-0 overflow-hidden">
                  <div className="px-5 py-3 bg-bg-secondary border-b border-border-subtle">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{cat}</h3>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {files.map((f) => {
                      const dm = effDate ? deltaMetaByDate[effDate] : null;
                      const cl = effDate ? researchChangelogByDate[effDate] : null;
                      const touchDelta =
                        dm && effDate
                          ? countDeltaTouchesForDoc(f.path, dm.changed_paths, dm.op_paths)
                          : 0;
                      const touchChangelog = countResearchChangelogTouchesForDoc(f.path, cl);
                      // A document is "touched" if it is itself a delta doc (run_type=delta)
                      // OR the legacy delta-request/research-changelog paths point to it.
                      const isDocDelta = (f.runType || '').toLowerCase() === 'delta';
                      const touchCount = touchDelta + touchChangelog;
                      const touched = isDocDelta || touchCount > 0;
                      const expanded = activeFile?.id === f.id;
                      return (
                        <div key={f.id}>
                          <button
                            type="button"
                            onClick={async () => {
                              if (activeFile?.id === f.id) {
                                setActiveFile(null);
                                setLibraryDoc(null);
                                return;
                              }
                              setActiveLoading(true);
                              setActiveFile(f);
                              setLibraryDoc(null);
                              try {
                                const row = await getLibraryDocumentById(f.id);
                                setLibraryDoc(row);
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
                            }}
                            className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors ${
                              expanded ? 'bg-fin-blue/[0.06]' : ''
                            }`}
                          >
                            <span className="relative flex h-2 w-2 shrink-0">
                              {touched ? (
                                <span
                                  className="absolute inset-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                  title="Updated today"
                                />
                              ) : (
                                <span className="absolute inset-0 rounded-full bg-transparent" />
                              )}
                            </span>
                            <FileText size={14} className="text-fin-blue/60 shrink-0" />
                            <span className="font-mono text-sm">{canonicalResearchTitle(f)}</span>
                            {/* Delta badge: Δ for run_type=delta docs; numeric count for legacy path-touch system */}
                            {isDocDelta ? (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30"
                                title="Updated on this delta day"
                              >
                                Δ
                              </span>
                            ) : touchCount > 0 ? (
                              <span
                                className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30"
                                title="Delta paths touching this document"
                              >
                                {touchCount}
                              </span>
                            ) : null}
                            <span className="ml-auto text-[11px] text-text-muted">{f.phase ?? ''}</span>
                          </button>
                          {expanded ? (
                            <DocumentExpandInline
                              title={canonicalResearchTitle(f)}
                              subtitle={f.date ?? null}
                              badge={
                                isDocDelta ? (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 shrink-0">
                                    Δ updated
                                  </span>
                                ) : null
                              }
                              loading={activeLoading}
                              libraryDoc={libraryDoc}
                              onCollapse={() => {
                                setActiveFile(null);
                                setLibraryDoc(null);
                              }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : !activeFileHidden ? (
              <div className="glass-card p-10 text-center text-text-muted text-sm">
                No files found for this date{filterCat ? ` in "${filterCat}"` : ''}.
              </div>
            ) : null}
          </div>
        </div>
    </div>
  );
}

export default function LibraryClient() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const urlDocKey = searchParams.get('docKey');

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>}>
      <LibraryPageInner urlDate={urlDate} urlDocKey={urlDocKey} />
    </Suspense>
  );
}
