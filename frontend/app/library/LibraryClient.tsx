'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, ChevronDown, ChevronRight, Filter, FileText, X } from 'lucide-react';

import PageHeader from '@/components/page-header';
import { useDashboard } from '@/lib/dashboard-context';
import { getDocumentContentById } from '@/lib/queries';
import type { Doc } from '@/lib/types';

/* ── Mini Calendar ── */
interface MiniCalendarProps {
  dates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
}

function MiniCalendar({ dates, selected, onSelect }: MiniCalendarProps) {
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
        <button onClick={prev} className="text-text-muted hover:text-white text-sm px-1">
          ‹
        </button>
        <span className="text-sm font-medium">
          {monthNames[month]} {year}
        </span>
        <button onClick={next} className="text-text-muted hover:text-white text-sm px-1">
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
          return (
            <button
              key={i}
              disabled={!has}
              onClick={() => has && onSelect(iso)}
              className={[
                'w-7 h-7 rounded-full text-[11px] flex items-center justify-center transition-colors',
                sel ? 'bg-fin-blue text-white font-bold' : '',
                has && !sel ? 'text-fin-blue hover:bg-fin-blue/20 cursor-pointer' : '',
                !has ? 'text-text-muted/30 cursor-default' : '',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ── */
const CADENCES = ['Daily', 'Weekly', 'Monthly'] as const;
type Cadence = (typeof CADENCES)[number];

const CATEGORY_ORDER = [
  'Digest',
  'Portfolio',
  'Positions',
  'Deep Dives',
  'Weekly / Monthly',
  'Evolution',
  'Market Analysis',
  'Equities',
  'Sectors',
  'Intelligence',
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

function LibraryPageInner({ urlDate, urlDocKey }: { urlDate: string | null; urlDocKey: string | null }) {
  const { data, loading, error } = useDashboard();
  const [cadence, setCadence] = useState<Cadence>('Daily');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<Doc | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const docs = useMemo<Doc[]>(() => data?.docs || [], [data]);

  const cadenceDocs = useMemo<Record<Cadence, Doc[]>>(() => {
    const map: Record<Cadence, Doc[]> = { Daily: [], Weekly: [], Monthly: [] };
    docs.forEach((d) => {
      const c = (d.cadence || 'daily').toLowerCase();
      if (c === 'weekly') map.Weekly.push(d);
      else if (c === 'monthly') map.Monthly.push(d);
      else map.Daily.push(d);
    });
    return map;
  }, [docs]);

  const activeDocs = useMemo<Doc[]>(() => cadenceDocs[cadence] || [], [cadenceDocs, cadence]);

  const dates = useMemo<string[]>(() => {
    const set = new Set(activeDocs.map((d) => d.date));
    return [...set].sort().reverse();
  }, [activeDocs]);

  const effDate = selectedDate && dates.includes(selectedDate) ? selectedDate : dates[0] || null;

  const dateDocs = useMemo<Doc[]>(() => {
    let list = activeDocs.filter((d) => d.date === effDate);
    if (filterCat) list = list.filter((d) => categorizeDoc(d) === filterCat);
    return list;
  }, [activeDocs, effDate, filterCat]);

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

  const categoryList = useMemo<string[]>(() => {
    const set = new Set(activeDocs.filter((d) => d.date === effDate).map((d) => categorizeDoc(d)));
    const list = [...set];
    return list.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a as (typeof CATEGORY_ORDER)[number]);
      const ib = CATEGORY_ORDER.indexOf(b as (typeof CATEGORY_ORDER)[number]);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    });
  }, [activeDocs, effDate]);

  useEffect(() => {
    if (urlDate && dates.includes(urlDate)) {
      setSelectedDate(urlDate);
      setActiveFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDate, dates.join('|')]);

  useEffect(() => {
    if (!urlDocKey) return;
    const match = activeDocs.find((d) => d.date === effDate && d.path === urlDocKey);
    if (match) setActiveFile(match);
  }, [urlDocKey, activeDocs, effDate]);

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
            {/* Cadence tabs */}
            <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
              {CADENCES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCadence(c);
                    setSelectedDate(null);
                    setActiveFile(null);
                  }}
                  className={[
                    'flex-1 text-xs py-2 rounded-md font-medium transition-colors',
                    c === cadence ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:text-white',
                  ].join(' ')}
                >
                  {c}
                </button>
              ))}
            </div>

            <MiniCalendar
              dates={dates}
              selected={effDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setActiveFile(null);
              }}
            />

            {/* Filters */}
            <div className="glass-card p-3">
              <button
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

            {/* Quick date list */}
            <div className="glass-card p-3 max-h-44 overflow-y-auto">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Recent Dates</p>
              {dates.slice(0, 15).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDate(d);
                    setActiveFile(null);
                  }}
                  className={`block w-full text-left text-xs px-2 py-1 rounded font-mono ${
                    d === effDate ? 'text-fin-blue bg-fin-blue/10 font-semibold' : 'text-text-muted hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
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

            {/* Viewer */}
            {activeFile ? (
              <div className="glass-card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-fin-blue" />
                    <span className="font-mono">{activeFile.title || activeFile.filename}</span>
                  </div>
                  <button
                    onClick={() => setActiveFile(null)}
                    className="text-text-muted hover:text-white"
                    aria-label="Close document"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-6 prose prose-invert max-w-none text-sm leading-relaxed overflow-auto max-h-[70vh]">
                  {activeLoading ? (
                    <div className="text-text-secondary">Loading document…</div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeFile.content || '_No content available._'}
                    </ReactMarkdown>
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
                    {files.map((f, i) => (
                      <button
                        key={i}
                        onClick={async () => {
                          setActiveLoading(true);
                          setActiveFile({ ...f, content: f.content });
                          try {
                            const row = await getDocumentContentById(f.id);
                            setActiveFile({ ...f, content: row.content || '' });
                          } catch {
                            setActiveFile({ ...f, content: '_Failed to load content._' });
                          } finally {
                            setActiveLoading(false);
                          }
                        }}
                        className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <FileText size={14} className="text-fin-blue/60 shrink-0" />
                        <span className="font-mono text-sm">{f.title || f.filename}</span>
                        <span className="ml-auto text-[11px] text-text-muted">{f.phase || ''}</span>
                      </button>
                    ))}
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

  // Keep the Suspense boundary *inside* the client component too, so the page
  // can show a fallback quickly during client-side navigation updates.
  // NOTE: `useSearchParams()` is used within the subtree; this component itself
  // is wrapped in a server Suspense boundary in `page.tsx` for prerender safety.
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>}>
      <LibraryPageInner urlDate={urlDate} urlDocKey={urlDocKey} />
    </Suspense>
  );
}

