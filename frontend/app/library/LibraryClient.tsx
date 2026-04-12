'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, ChevronRight, Filter, FileText, X } from 'lucide-react';

import PageHeader from '@/components/page-header';
import DeltaDaySummary from '@/components/library/DeltaDaySummary';
import LibraryDocumentBody from '@/components/library/LibraryDocumentBody';
import { useDashboard } from '@/lib/dashboard-context';
import { countDeltaTouchesForDoc, docMatchesLibraryScope } from '@/lib/library-doc-tier';
import { getLibraryDocumentById, type LibraryDocumentResult } from '@/lib/queries';
import type { Doc } from '@/lib/types';

type RunDayKind = 'baseline' | 'delta' | 'unknown';

/* ── Mini Calendar ── */
interface MiniCalendarProps {
  dates: string[];
  runKindByDate: Map<string, RunDayKind>;
  selected: string | null;
  onSelect: (date: string) => void;
}

function MiniCalendar({ dates, runKindByDate, selected, onSelect }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const { year, month } = viewMonth;
  const dateSet = new Set(dates);
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function prev() {
    setViewMonth((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
    );
  }
  function next() {
    setViewMonth((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="text-text-muted hover:text-white text-sm px-1">
          ‹
        </button>
        <span className="text-sm font-medium">
          {monthNames[month]} {year}
        </span>
        <button type="button" onClick={next} className="text-text-muted hover:text-white text-sm px-1">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-text-muted pb-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
          const has = dateSet.has(iso);
          const sel = iso === selected;
          const kind = has ? runKindByDate.get(iso) ?? 'unknown' : 'unknown';

          const dayBtn = [
            'w-7 h-7 rounded-full text-[11px] flex items-center justify-center transition-colors',
            !has ? 'text-text-muted/30 cursor-default' : 'cursor-pointer',
          ];

          if (sel) {
            dayBtn.push('bg-fin-blue text-white font-bold ring-2 ring-fin-blue ring-offset-2 ring-offset-[#0a0a0a]');
          } else if (has) {
            if (kind === 'baseline') {
              dayBtn.push('bg-fin-amber/25 text-fin-amber border border-fin-amber/50 hover:bg-fin-amber/35');
            } else if (kind === 'delta') {
              dayBtn.push('text-fin-blue hover:bg-fin-blue/20');
            } else {
              dayBtn.push('text-text-secondary border border-border-subtle/80 hover:bg-white/[0.06]');
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={!has}
              onClick={() => has && onSelect(iso)}
              className={dayBtn.join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5 text-[10px] text-text-muted">
        <p className="uppercase tracking-wider">Run type</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fin-amber/80 border border-fin-amber" />
            <span>Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fin-blue/80" />
            <span>Delta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-border-subtle bg-bg-secondary" />
            <span>Unknown</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
const CATEGORY_ORDER = [
  'Digest',
  'Market Analysis',
  'Equities',
  'Sectors',
  'Intelligence',
  'Positions',
  'Deep Dives',
  'Weekly / Monthly',
  'Portfolio',
  'Evolution',
  'Other',
] as const;

function categorizeDoc(d: Doc): string {
  const key = (d.path || d.filename || '').toLowerCase();
  const seg = (d.segment || '').toLowerCase();
  const type = (d.type || '').toLowerCase();

  if (key === 'digest') return 'Digest';
  if (key.startsWith('weekly/') || key.startsWith('monthly/')) return 'Weekly / Monthly';
  if (key.startsWith('deep-dives/')) return 'Deep Dives';
  if (key.startsWith('evolution/')) return 'Evolution';
  if (seg.includes('rebalance') || seg.includes('deliberation') || seg.includes('portfolio') || seg.includes('opportunity'))
    return 'Portfolio';
  if (key.startsWith('positions/') || seg.includes('position')) return 'Positions';
  if (type.includes('weekly') || type.includes('monthly')) return 'Weekly / Monthly';
  if (type.includes('deep dive')) return 'Deep Dives';
  if (
    seg.includes('macro') ||
    seg.includes('bonds') ||
    seg.includes('commodities') ||
    seg.includes('forex') ||
    seg.includes('crypto') ||
    seg.includes('international')
  )
    return 'Market Analysis';
  if (seg.includes('equities') || seg.includes('us-equities')) return 'Equities';
  if (d.category?.toLowerCase() === 'sector' || seg.includes('sector')) return 'Sectors';
  if (seg.includes('alt') || seg.includes('institutional')) return 'Intelligence';
  return 'Other';
}

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
    if (filterCat) list = list.filter((d) => categorizeDoc(d) === filterCat);
    return list;
  }, [docsForEffDate, filterCat]);

  const grouped = useMemo<[string, Doc[]][]>(() => {
    const map: Record<string, Doc[]> = {};
    dateDocs.forEach((d) => {
      const cat = categorizeDoc(d);
      (map[cat] = map[cat] || []).push(d);
    });
    return Object.entries(map).sort(([a], [b]) => {
      const ia = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
      const ib = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    });
  }, [dateDocs]);

  const digestDocForDate = useMemo(
    () => docsForEffDate.find((d) => (d.path || '').toLowerCase() === 'digest') ?? null,
    [docsForEffDate]
  );

  const categoryList = useMemo<string[]>(() => {
    const set = new Set(docsForEffDate.map((d) => categorizeDoc(d)));
    const list = [...set];
    return list.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
      const ib = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
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
    <>
      <PageHeader title="Research Library" />
      <div className="p-10 max-w-[1600px] mx-auto w-full max-md:p-4">
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

            {/* Filters */}
            <div className="glass-card p-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-xs text-text-muted w-full"
              >
                <Filter size={12} />
                <span>Filters</span>
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
                }}
              />
            ) : null}

            {/* Viewer */}
            {activeFile ? (
              <div className="glass-card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-fin-blue" />
                    <span className="font-mono">{activeFile.title || activeFile.filename}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFile(null);
                      setLibraryDoc(null);
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
                      const dm = effDate ? deltaMetaByDate[effDate] : null;
                      const touchCount =
                        dm && effDate
                          ? countDeltaTouchesForDoc(f.path, dm.changed_paths, dm.op_paths)
                          : 0;
                      const touched = touchCount > 0;
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
                          }}
                          className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="relative flex h-2 w-2 shrink-0">
                            {touched ? (
                              <span
                                className="absolute inset-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                title="Touched by delta this day"
                              />
                            ) : (
                              <span className="absolute inset-0 rounded-full bg-transparent" />
                            )}
                          </span>
                          <FileText size={14} className="text-fin-blue/60 shrink-0" />
                          <span className="font-mono text-sm">{f.title || f.filename}</span>
                          {touchCount > 0 ? (
                            <span
                              className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30"
                              title="Delta paths touching this document"
                            >
                              {touchCount}
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
      </div>
    </>
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
