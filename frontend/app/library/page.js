'use client';

import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Calendar, ChevronDown, ChevronRight, Filter, FileText, X,
} from 'lucide-react';

/* ── Mini Calendar ── */
function MiniCalendar({ dates, selected, onSelect }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const { year, month } = viewMonth;
  const dateSet = new Set(dates);
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function pad(n) { return String(n).padStart(2, '0'); }

  function prev() {
    setViewMonth(v => v.month === 0
      ? { year: v.year - 1, month: 11 }
      : { ...v, month: v.month - 1 });
  }
  function next() {
    setViewMonth(v => v.month === 11
      ? { year: v.year + 1, month: 0 }
      : { ...v, month: v.month + 1 });
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="text-text-muted hover:text-white text-sm px-1">‹</button>
        <span className="text-sm font-medium">{monthNames[month]} {year}</span>
        <button onClick={next} className="text-text-muted hover:text-white text-sm px-1">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-text-muted pb-1">{d}</div>
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
const CADENCES = ['Daily', 'Weekly', 'Monthly'];

const CATEGORIES = {
  'Market Analysis': ['macro', 'bonds', 'commodities', 'forex', 'crypto', 'international'],
  'Equities':        ['us-equities', 'equities'],
  'Sectors':         ['sector', 'technology', 'healthcare', 'financials', 'energy', 'industrials',
                      'consumer-discretionary', 'consumer-staples', 'utilities', 'materials',
                      'real-estate', 'communication-services'],
  'Intelligence':    ['alt-data', 'institutional'],
  'Digest':          ['digest', 'DIGEST'],
};

function categorize(filename) {
  const lower = (filename || '').toLowerCase();
  for (const [cat, keys] of Object.entries(CATEGORIES)) {
    if (keys.some(k => lower.includes(k))) return cat;
  }
  return 'Other';
}

export default function LibraryPage() {
  const { data, loading, error } = useDashboard();
  const [cadence, setCadence] = useState('Daily');
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [filterCat, setFilterCat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const docs = useMemo(() => data?.docs || [], [data]);

  /* Group docs by cadence */
  const cadenceDocs = useMemo(() => {
    const map = { Daily: [], Weekly: [], Monthly: [] };
    docs.forEach(d => {
      const c = (d.cadence || 'daily').toLowerCase();
      if (c === 'weekly') map.Weekly.push(d);
      else if (c === 'monthly') map.Monthly.push(d);
      else map.Daily.push(d);
    });
    return map;
  }, [docs]);

  const activeDocs = cadenceDocs[cadence] || [];

  /* Unique dates for the current cadence */
  const dates = useMemo(() => {
    const set = new Set(activeDocs.map(d => d.date));
    return [...set].sort().reverse();
  }, [activeDocs]);

  /* Effective selected date */
  const effDate = selectedDate && dates.includes(selectedDate)
    ? selectedDate
    : dates[0] || null;

  /* Docs for this date, optionally filtered */
  const dateDocs = useMemo(() => {
    let list = activeDocs.filter(d => d.date === effDate);
    if (filterCat) list = list.filter(d => categorize(d.filename) === filterCat);
    return list;
  }, [activeDocs, effDate, filterCat]);

  /* Group by category */
  const grouped = useMemo(() => {
    const map = {};
    dateDocs.forEach(d => {
      const cat = categorize(d.filename);
      (map[cat] = map[cat] || []).push(d);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [dateDocs]);

  const categoryList = useMemo(() => {
    const set = new Set(activeDocs.filter(d => d.date === effDate).map(d => categorize(d.filename)));
    return [...set].sort();
  }, [activeDocs, effDate]);

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  return (
    <>
      <PageHeader title="Research Library" />
      <div className="p-10 max-w-[1600px] mx-auto w-full max-md:p-4">
        <div className="flex gap-6 max-lg:flex-col">
          {/* ── Left: Calendar + filters ── */}
          <div className="w-56 shrink-0 space-y-4 max-lg:w-full max-lg:flex max-lg:gap-4 max-lg:flex-wrap">
            {/* Cadence tabs */}
            <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
              {CADENCES.map(c => (
                <button
                  key={c}
                  onClick={() => { setCadence(c); setSelectedDate(null); setActiveFile(null); }}
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
              onSelect={d => { setSelectedDate(d); setActiveFile(null); }}
            />

            {/* Filters */}
            <div className="glass-card p-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-xs text-text-muted w-full"
              >
                <Filter size={12} />
                <span>Filters</span>
                {showFilters ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
              </button>
              {showFilters && (
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => setFilterCat(null)}
                    className={`block w-full text-left text-xs px-2 py-1 rounded ${!filterCat ? 'text-fin-blue bg-fin-blue/10' : 'text-text-muted hover:text-white'}`}
                  >
                    All
                  </button>
                  {categoryList.map(c => (
                    <button
                      key={c}
                      onClick={() => setFilterCat(c === filterCat ? null : c)}
                      className={`block w-full text-left text-xs px-2 py-1 rounded ${c === filterCat ? 'text-fin-blue bg-fin-blue/10' : 'text-text-muted hover:text-white'}`}
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
              {dates.slice(0, 15).map(d => (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setActiveFile(null); }}
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
              <span className="text-xs text-text-muted">{dateDocs.length} file{dateDocs.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Viewer */}
            {activeFile ? (
              <div className="glass-card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-fin-blue" />
                    <span className="font-mono">{activeFile.filename}</span>
                  </div>
                  <button onClick={() => setActiveFile(null)} className="text-text-muted hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-6 prose prose-invert max-w-none text-sm leading-relaxed overflow-auto max-h-[70vh]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeFile.content || '_No content available._'}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              /* File list grouped by category */
              grouped.length > 0 ? (
                grouped.map(([cat, files]) => (
                  <div key={cat} className="glass-card p-0 overflow-hidden">
                    <div className="px-5 py-3 bg-bg-secondary border-b border-border-subtle">
                      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{cat}</h3>
                    </div>
                    <div className="divide-y divide-border-subtle">
                      {files.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveFile(f)}
                          className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <FileText size={14} className="text-fin-blue/60 shrink-0" />
                          <span className="font-mono text-sm">{f.filename}</span>
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
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

MiniCalendar.propTypes = {
  dates: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
