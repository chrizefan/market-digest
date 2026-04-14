'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, ChevronRight, Filter, FileText, Search, X } from 'lucide-react';

import PageHeader from '@/components/page-header';
import DeltaDaySummary from '@/components/library/DeltaDaySummary';
import LibraryDocumentBody from '@/components/library/LibraryDocumentBody';
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

  /** Dated run outputs for the Daily tab (excludes knowledge-base reference docs). */
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

  if (loading)
    return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  return (
    <>
      <PageHeader title="Research" />
      <div className="p-10 max-w-[1600px] mx-auto w-full max-md:p-4 space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3">
          <button
            type="button"
            onClick={() => setTab('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'daily'
                ? 'bg-fin-blue/15 text-fin-blue border border-fin-blue/40'
                : 'text-text-secondary border border-transparent hover:bg-white/[0.04] hover:text-text-primary'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setTab('knowledge')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'knowledge'
                ? 'bg-fin-blue/15 text-fin-blue border border-fin-blue/40'
                : 'text-text-secondary border border-transparent hover:bg-white/[0.04] hover:text-text-primary'
            }`}
          >
            Knowledge base
          </button>
        </div>

        {tab === 'knowledge' ? (
          <>
            <p className="text-xs text-text-muted max-w-2xl">
              Reference library: deep dives, research papers, and recurring notes across all dates. Use the Daily tab
              for snapshot-specific outputs.
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
                Run-day artifacts only (digest, exploration, deltas). Long-form reference lives under Knowledge base.
              </p>
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
                    setActiveFile(digestDocForDate);
                    setActiveLoading(true);
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

              {activeFile ? (
                <div className="glass-card p-0 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText size={14} className="text-fin-blue" />
                      <span className="font-mono">{canonicalResearchTitle(activeFile)}</span>
                      {effDate &&
                      !deltaMetaByDate[effDate] &&
                      (activeFile.runType || '').toLowerCase() === 'delta' ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted border border-border-subtle">
                          delta file
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFile(null);
                        setLibraryDoc(null);
                        replaceQuery((p) => {
                          p.delete('docKey');
                        });
                      }}
                      className="text-text-muted hover:text-white"
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
              ) : grouped.length > 0 ? (
                grouped.map(([cat, files]) => (
                  <div key={cat} className="glass-card p-0 overflow-hidden">
                    <div className="px-5 py-3 bg-bg-secondary border-b border-border-subtle">
                      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{cat}</h3>
                    </div>
                    <div className="divide-y divide-border-subtle">
                      {files.map((f, i) => {
                        const deltaDay = Boolean(effDate && deltaMetaByDate[effDate]);
                        const isDocDelta = (f.runType || '').toLowerCase() === 'delta';
                        const showRowDeltaHint = !deltaDay && isDocDelta;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={async () => {
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
                            className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                          >
                            <FileText size={14} className="text-fin-blue/60 shrink-0" />
                            <span className="font-mono text-sm">{canonicalResearchTitle(f)}</span>
                            {showRowDeltaHint ? (
                              <span
                                className="text-[10px] font-mono text-text-muted shrink-0"
                                title="Published as a delta refresh for this date"
                              >
                                delta
                              </span>
                            ) : null}
                            <span className="ml-auto text-[11px] text-text-muted">{f.phase ?? ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card p-10 text-center text-text-muted text-sm">
                  No files found for this date{filterCat ? ` in "${filterCat}"` : ''}.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ResearchClient() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlDate = searchParams.get('date');
  const urlDocKey = searchParams.get('docKey');

  return <ResearchPageInner urlTab={urlTab} urlDate={urlDate} urlDocKey={urlDocKey} />;
}
