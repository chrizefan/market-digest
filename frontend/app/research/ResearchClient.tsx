'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Brain,
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  FileText,
  Search,
  Newspaper,
} from 'lucide-react';

import { SubpageStickyTabBar, SUBPAGE_MAX, subpageTabButtonClass } from '@/components/subpage-tab-bar';
import DeltaDaySummary from '@/components/library/DeltaDaySummary';
import DocumentExpandInline from '@/components/library/DocumentExpandInline';
import AtlasLoader from '@/components/AtlasLoader';
import { useDashboard } from '@/lib/dashboard-context';
import { docMatchesLibraryScope } from '@/lib/library-doc-tier';
import { getLibraryDocumentById, type LibraryDocumentResult } from '@/lib/queries';
import type { Doc } from '@/lib/types';
import MiniCalendar, { type MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import {
  RESEARCH_CATEGORY_ORDER,
  canonicalResearchTitle,
  categorizeResearchDoc,
  isDailyResearchDoc,
} from '@/lib/research-doc-categorize';
import KnowledgeBasePanel from '@/components/research/KnowledgeBasePanel';

/** Extract a plain-text preview from digest markdown (first substantive paragraph, ≤160 chars). */
function digestPreviewSnippet(markdown: string | null | undefined): string | null {
  if (!markdown) return null;
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('```')) continue;
    const plain = trimmed.replace(/[*_`~[\]()]/g, '').trim();
    if (plain.length < 20) continue;
    return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
  }
  return null;
}

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

type ResearchTab = 'daily' | 'knowledge';

function ResearchPageInner({
  urlTab,
  urlDate,
  urlDocKey,
}: {
  urlTab: string | null;
  urlDate: string | null;
  urlDocKey: string | null;
}) {
  const { data, loading, error } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<Doc | null>(null);
  const [libraryDoc, setLibraryDoc] = useState<LibraryDocumentResult | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const autoDigestOpenedRef = useRef(false);

  const tab: ResearchTab = urlTab === 'knowledge' ? 'knowledge' : 'daily';

  const replaceQuery = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setTab = useCallback(
    (next: ResearchTab) => {
      replaceQuery((p) => {
        p.set('tab', next);
        if (next === 'knowledge') {
          p.delete('date');
          p.delete('docKey');
        }
      });
    },
    [replaceQuery]
  );

  const docs = useMemo<Doc[]>(() => data?.docs || [], [data]);
  const deltaMetaByDate = useMemo(
    () => data?.delta_request_meta_by_date ?? {},
    [data?.delta_request_meta_by_date]
  );
  const snapshotRunTypeByDate = useMemo(
    () => data?.snapshot_run_type_by_date ?? {},
    [data?.snapshot_run_type_by_date]
  );

  const researchDocs = useMemo(
    () => docs.filter((d) => docMatchesLibraryScope(d, 'research')),
    [docs]
  );

  /** Dated artifacts from automated research runs (excludes evergreen Knowledge docs). */
  const dailyResearchDocs = useMemo(() => researchDocs.filter(isDailyResearchDoc), [researchDocs]);

  const docsByDate = useMemo(() => {
    const m = new Map<string, Doc[]>();
    for (const d of dailyResearchDocs) {
      if (!d.date) continue;
      const arr = m.get(d.date) || [];
      arr.push(d);
      m.set(d.date, arr);
    }
    return m;
  }, [dailyResearchDocs]);

  const dates = useMemo<string[]>(() => {
    const set = new Set(dailyResearchDocs.map((d) => d.date).filter(Boolean));
    return [...set].sort().reverse();
  }, [dailyResearchDocs]);

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
    () => (effDate ? dailyResearchDocs.filter((d) => d.date === effDate) : []),
    [dailyResearchDocs, effDate]
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
    if (!urlDocKey || tab !== 'daily') return;
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
  }, [urlDocKey, researchDocs, effDate, tab]);

  /** Landing on Daily Digest: open the digest for the latest run automatically (Koyfin-style). */
  useEffect(() => {
    if (tab !== 'daily' || urlDocKey || !digestDocForDate || !effDate || !latestDate) return;
    if (effDate !== latestDate) return;
    if (autoDigestOpenedRef.current) return;
    autoDigestOpenedRef.current = true;
    replaceQuery((p) => {
      p.set('tab', 'daily');
      p.set('date', effDate);
      p.set('docKey', digestDocForDate.path);
    });
  }, [tab, urlDocKey, digestDocForDate, effDate, latestDate, replaceQuery]);

  if (loading) return <AtlasLoader />;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  return (
    <div className="flex min-h-full flex-col">
      <SubpageStickyTabBar aria-label="Research workspace">
        <button type="button" onClick={() => setTab('daily')} className={subpageTabButtonClass(tab === 'daily')}>
          <Newspaper size={16} aria-hidden />
          Daily Digest
        </button>
        <button
          type="button"
          onClick={() => setTab('knowledge')}
          className={subpageTabButtonClass(tab === 'knowledge')}
        >
          <Brain size={16} aria-hidden />
          Knowledge Base
        </button>
      </SubpageStickyTabBar>

      <div className={`${SUBPAGE_MAX} flex-1 space-y-4 py-4 md:py-5`}>
        {tab === 'knowledge' ? (
          <>
            <p className="text-xs text-text-muted max-w-2xl">
              Curated reference material—deep dives, papers, and standing notes that persist across dates. For
              digest, deltas, and other artifacts from each automated run, use the Daily Digest tab.
            </p>
            <KnowledgeBasePanel docs={researchDocs} />
          </>
        ) : (
          <div className="flex gap-6 max-lg:flex-col">
            <div className="w-56 shrink-0 space-y-4 max-lg:w-full max-lg:flex max-lg:gap-4 max-lg:flex-wrap">
              <MiniCalendar
                dates={dates}
                runKindByDate={runKindByDate}
                selected={effDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setActiveFile(null);
                  setLibraryDoc(null);
                  replaceQuery((p) => {
                    p.set('tab', 'daily');
                    p.set('date', d);
                    p.delete('docKey');
                  });
                }}
              />

              {latestDate && effDate && effDate !== latestDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    setActiveFile(null);
                    setLibraryDoc(null);
                    replaceQuery((p) => {
                      p.set('tab', 'daily');
                      p.delete('date');
                      p.delete('docKey');
                    });
                  }}
                  className="w-full text-xs py-2 rounded-lg border border-border-subtle text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Jump to latest ({latestDate})
                </button>
              ) : null}

              <div className="glass-card p-3 space-y-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
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
                  {showFilters ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
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

            <div className="flex-1 min-w-0 space-y-4">
              <p className="text-xs text-text-muted max-w-2xl">
                Artifacts from each dated research run: digest, exploration, deltas, and related pipeline outputs.
                Evergreen reference lives under Knowledge.
              </p>

              {effDate && deltaMetaByDate[effDate] ? (
                <DeltaDaySummary
                  meta={deltaMetaByDate[effDate]}
                  digestAvailable={!!digestDocForDate}
                  onOpenDigest={() => {
                    if (!digestDocForDate) return;
                    if (activeFile?.id === digestDocForDate.id) {
                      setActiveFile(null);
                      setLibraryDoc(null);
                      replaceQuery((p) => {
                        p.delete('docKey');
                      });
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
                    replaceQuery((p) => {
                      p.set('tab', 'daily');
                      if (effDate) p.set('date', effDate);
                      p.set('docKey', digestDocForDate.path);
                    });
                  }}
                />
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Calendar size={16} className="text-fin-blue shrink-0" />
                <h2 className="text-lg font-semibold">{effDate || 'No date selected'}</h2>
                <span className="text-xs text-text-muted">
                  {dateDocs.length} file{dateDocs.length !== 1 ? 's' : ''}
                </span>
                {latestDate ? (
                  <span className="text-[10px] font-mono text-text-muted ml-auto sm:ml-0">
                    Latest run: {latestDate}
                  </span>
                ) : null}
              </div>

              {activeFileHidden && activeFile ? (
                <div className="glass-card p-0 overflow-hidden">
                  <DocumentExpandInline
                    hideTitleBar={(activeFile.path || '').toLowerCase() === 'digest'}
                    title={canonicalResearchTitle(activeFile)}
                    subtitle={activeFile.date ?? null}
                    badge={
                      effDate &&
                      !deltaMetaByDate[effDate] &&
                      (activeFile.runType || '').toLowerCase() === 'delta' ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted border border-border-subtle shrink-0">
                          delta file
                        </span>
                      ) : null
                    }
                    loading={activeLoading}
                    libraryDoc={libraryDoc}
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
                        const deltaDay = Boolean(effDate && deltaMetaByDate[effDate]);
                        const isDocDelta = (f.runType || '').toLowerCase() === 'delta';
                        const showRowDeltaHint = !deltaDay && isDocDelta;
                        const expanded = activeFile?.id === f.id;
                        return (
                          <div key={f.id}>
                            <button
                              type="button"
                              onClick={async () => {
                                if (activeFile?.id === f.id) {
                                  setActiveFile(null);
                                  setLibraryDoc(null);
                                  replaceQuery((p) => {
                                    p.delete('docKey');
                                  });
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
                                replaceQuery((p) => {
                                  p.set('tab', 'daily');
                                  if (f.date) p.set('date', f.date);
                                  p.set('docKey', f.path);
                                });
                              }}
                              className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors ${
                                expanded ? 'bg-fin-blue/[0.06]' : ''
                              }`}
                            >
                              <FileText size={14} className="text-fin-blue/60 shrink-0 mt-0.5" />
                              <span className="min-w-0 flex-1">
                                <span className="block font-mono text-sm">{canonicalResearchTitle(f)}</span>
                                {(() => {
                                  const isDigest = (f.path || '').toLowerCase() === 'digest';
                                  const snippet =
                                    isDigest && !expanded && libraryDoc?.document_key === f.path
                                      ? digestPreviewSnippet(libraryDoc.markdown)
                                      : null;
                                  return snippet ? (
                                    <span className="block text-[11px] text-text-muted truncate mt-0.5 pr-2">
                                      {snippet}
                                    </span>
                                  ) : null;
                                })()}
                              </span>
                              {showRowDeltaHint ? (
                                <span
                                  className="text-[10px] font-mono text-text-muted shrink-0"
                                  title="Published as a delta refresh for this date"
                                >
                                  delta
                                </span>
                              ) : null}
                              <span className="shrink-0 text-[11px] text-text-muted">{f.phase ?? ''}</span>
                            </button>
                            {expanded ? (
                              <DocumentExpandInline
                                hideTitleBar
                                title={canonicalResearchTitle(f)}
                                subtitle={f.date ?? null}
                                loading={activeLoading}
                                libraryDoc={libraryDoc}
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
        )}
      </div>
    </div>
  );
}

export default function ResearchClient() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlDate = searchParams.get('date');
  const urlDocKey = searchParams.get('docKey');

  return <ResearchPageInner urlTab={urlTab} urlDate={urlDate} urlDocKey={urlDocKey} />;
}
