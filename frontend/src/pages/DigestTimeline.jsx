import { useState, useMemo, useEffect } from 'react';
import { marked } from 'marked';
import { ChevronDown, ChevronRight, ChevronLeft, Search, X, Calendar, FileText } from 'lucide-react';

const CATEGORY_COLORS = {
  'alt-data': 'var(--accent-blue)',
  'institutional': 'var(--accent-blue)',
  'macro': 'var(--accent-amber)',
  'asset-class': 'var(--accent-green)',
  'equity': 'var(--accent-blue)',
  'sector': 'var(--accent-green)',
  'synthesis': '#f472b6',
  'portfolio': '#f472b6',
  'evolution': 'var(--text-secondary)',
  'memory': 'var(--text-muted)',
  'rollup': 'var(--accent-amber)',
  'deep-dive': 'var(--accent-blue)',
  'output': 'var(--text-secondary)',
  'delta': 'var(--accent-amber)',
};

const CATEGORY_LABELS = {
  'synthesis': 'Synthesis',
  'alt-data': 'Alternative Data',
  'institutional': 'Institutional',
  'macro': 'Macro',
  'asset-class': 'Asset Classes',
  'equity': 'Equities',
  'sector': 'Sectors',
  'portfolio': 'Portfolio',
  'output': 'Other Outputs',
  'rollup': 'Rollup',
  'delta': 'Deltas',
};

const CATEGORY_ORDER = ['synthesis', 'alt-data', 'institutional', 'macro', 'asset-class', 'equity', 'sector', 'portfolio', 'output', 'rollup', 'delta'];

const CADENCE_TABS = ['Daily', 'Weekly', 'Monthly'];

// ── Mini Calendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ availableDates, selectedDate, onSelectDate, currentMonth, onMonthChange }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const datesThisMonth = new Set(availableDates.filter(d => d.startsWith(monthStr)));

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <button onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={12} /></button>
        <span>{monthName}</span>
        <button onClick={nextMonth} aria-label="Next month"><ChevronRight size={12} /></button>
      </div>
      <div className="cal-weekdays">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="cal-days">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} className="cal-day-empty" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasData = datesThisMonth.has(dateStr);
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              disabled={!hasData}
              onClick={() => hasData && onSelectDate(dateStr)}
              className={`cal-day${hasData ? ' has-data' : ''}${isSelected ? ' selected' : ''}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DigestTimeline({ docs }) {
  const [cadenceTab, setCadenceTab] = useState('Daily');
  const [selectedPath, setSelectedPath] = useState(null);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [phaseFilter, setPhaseFilter] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState(new Set());
  const [sectorFilter, setSectorFilter] = useState(new Set());

  // Calendar / date selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Split docs by cadence determined from path
  const docsByType = useMemo(() => ({
    Daily: docs.filter(d => (d.path || '').includes('/daily/')),
    Weekly: docs.filter(d => (d.path || '').includes('/weekly/')),
    Monthly: docs.filter(d => (d.path || '').includes('/monthly/')),
  }), [docs]);

  const cadenceDocs = useMemo(() => docsByType[cadenceTab] || [], [docsByType, cadenceTab]);

  const availableDates = useMemo(
    () => [...new Set(cadenceDocs.map(d => d.date).filter(Boolean))],
    [cadenceDocs]
  );

  // Auto-select most recent date when switching tabs
  useEffect(() => {
    const sorted = [...availableDates].sort().reverse();
    if (sorted.length > 0) {
      setSelectedDate(sorted[0]);
      const d = new Date(sorted[0] + 'T00:00:00');
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      setSelectedDate(null);
    }
    setSelectedPath(null);
  }, [cadenceTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter options from docs in this cadence
  const filterOptions = useMemo(() => {
    const phases = new Set();
    const categories = new Set();
    const sectors = new Set();
    cadenceDocs.forEach(d => {
      if (d.phase) phases.add(d.phase);
      if (d.category) categories.add(d.category);
      if (d.sector) sectors.add(d.sector);
    });
    return {
      phases: [...phases].sort((a, b) => a - b),
      categories: [...categories].sort(),
      sectors: [...sectors].sort(),
    };
  }, [cadenceDocs]);

  // Docs for the selected date, filtered
  const filteredDocs = useMemo(() => {
    if (!selectedDate) return [];
    const q = search.toLowerCase();
    return cadenceDocs.filter(d => {
      if (d.date !== selectedDate) return false;
      if (q && !(d.title || '').toLowerCase().includes(q) &&
          !(d.segment || '').toLowerCase().includes(q) &&
          !(d.path || '').toLowerCase().includes(q) &&
          !(d.sector || '').toLowerCase().includes(q)) return false;
      if (phaseFilter.size > 0 && (!d.phase || !phaseFilter.has(d.phase))) return false;
      if (categoryFilter.size > 0 && (!d.category || !categoryFilter.has(d.category))) return false;
      if (sectorFilter.size > 0 && !sectorFilter.has(d.sector)) return false;
      return true;
    });
  }, [cadenceDocs, selectedDate, search, phaseFilter, categoryFilter, sectorFilter]);

  // For Weekly/Monthly: group all cadence docs by date (no calendar)
  const allDateGroups = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = cadenceDocs.filter(d => {
      if (q && !(d.title || '').toLowerCase().includes(q) &&
          !(d.path || '').toLowerCase().includes(q)) return false;
      if (phaseFilter.size > 0 && (!d.phase || !phaseFilter.has(d.phase))) return false;
      if (categoryFilter.size > 0 && (!d.category || !categoryFilter.has(d.category))) return false;
      return true;
    });
    const groups = {};
    filtered.forEach(doc => {
      const key = doc.date || doc.path || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [cadenceDocs, search, phaseFilter, categoryFilter]);

  const selectedDoc = useMemo(
    () => docs.find(d => d.path === selectedPath),
    [docs, selectedPath]
  );

  const toggleFilter = (setter, value) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setPhaseFilter(new Set());
    setCategoryFilter(new Set());
    setSectorFilter(new Set());
  };

  const hasActiveFilters = search || phaseFilter.size > 0 || categoryFilter.size > 0 || sectorFilter.size > 0;

  const renderMarkdown = (content) => ({ __html: marked.parse(content || '') });

  // Group docs by category with a defined order
  const groupByCategory = (items) => {
    const groups = {};
    items.forEach(doc => {
      const key = doc.category || 'output';
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  };

  return (
    <div className="library-layout">
      {/* ── Sidebar ── */}
      <div className="library-sidebar glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Cadence tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {CADENCE_TABS.map(tab => {
            const count = [...new Set(docsByType[tab].map(d => d.date).filter(Boolean))].length;
            return (
              <button
                key={tab}
                onClick={() => setCadenceTab(tab)}
                style={{
                  flex: 1, padding: '11px 6px', background: 'none', border: 'none',
                  borderBottom: cadenceTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  color: cadenceTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}
              >
                {tab}
                {count > 0 && (
                  <span style={{
                    fontSize: '0.65rem', opacity: 0.7, background: cadenceTab === tab ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                    padding: '1px 5px', borderRadius: '8px',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="modern-select"
              style={{ width: '100%', paddingLeft: '30px', fontSize: '0.8rem' }}
            />
          </div>

          {/* Collapsible Filters */}
          <div style={{ marginBottom: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              onClick={() => setFiltersOpen(p => !p)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: 'none',
                cursor: 'pointer', color: hasActiveFilters ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                FILTERS
                {hasActiveFilters && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }} />
                )}
              </span>
              {filtersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {filtersOpen && (
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {filterOptions.phases.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Phase</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {filterOptions.phases.map(p => (
                        <button key={p} onClick={() => toggleFilter(setPhaseFilter, p)} className={`filter-chip ${phaseFilter.has(p) ? 'active' : ''}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                )}

                {filterOptions.categories.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Category</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {filterOptions.categories.map(c => (
                        <button key={c} onClick={() => toggleFilter(setCategoryFilter, c)} className={`filter-chip ${categoryFilter.has(c) ? 'active' : ''}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {filterOptions.sectors.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Sector</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {filterOptions.sectors.map(s => (
                        <button key={s} onClick={() => toggleFilter(setSectorFilter, s)} className={`filter-chip ${sectorFilter.has(s) ? 'active' : ''}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilters && (
                  <button onClick={clearFilters} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                    <X size={10} /> Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── DAILY: Calendar + file list ── */}
          {cadenceTab === 'Daily' && (
            <>
              <MiniCalendar
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelectDate={(d) => { setSelectedDate(d); setSelectedPath(null); }}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />

              {selectedDate ? (
                <div style={{ marginTop: '14px' }}>
                  {/* Date title row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Calendar size={13} color="var(--accent-blue)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Mono', monospace" }}>
                        {selectedDate}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{filteredDocs.length} files</span>
                  </div>

                  {groupByCategory(filteredDocs).map(([cat, catDocs]) => (
                    <div key={cat} style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: '4px', padding: '0 2px',
                        color: CATEGORY_COLORS[cat] || 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <span style={{ flex: 1 }}>{CATEGORY_LABELS[cat] || cat}</span>
                        <span style={{ opacity: 0.5, fontWeight: 400 }}>{catDocs.length}</span>
                      </div>
                      {catDocs.map(doc => (
                        <div
                          key={doc.path}
                          onClick={() => setSelectedPath(doc.path)}
                          className={`doc-item ${selectedPath === doc.path ? 'active' : ''}`}
                          style={{ padding: '6px 8px', marginBottom: '1px', display: 'flex', alignItems: 'flex-start', gap: '7px' }}
                        >
                          <FileText
                            size={11}
                            style={{ flexShrink: 0, marginTop: '2px', color: selectedPath === doc.path ? 'var(--accent-blue)' : CATEGORY_COLORS[cat] || 'var(--text-muted)', opacity: 0.7 }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontSize: '0.8rem',
                              color: selectedPath === doc.path ? 'var(--accent-blue)' : 'var(--text-primary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {doc.title}
                            </div>
                            {doc.sector && (
                              <div style={{ fontSize: '0.63rem', color: 'var(--accent-green)', opacity: 0.8, marginTop: '1px' }}>
                                {doc.sector}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {filteredDocs.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>
                      No files match the current filters.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px 0' }}>
                  No daily files found.
                </div>
              )}
            </>
          )}

          {/* ── WEEKLY / MONTHLY: date list ── */}
          {cadenceTab !== 'Daily' && (
            <div>
              {allDateGroups.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '32px 0' }}>
                  No {cadenceTab.toLowerCase()} files found.
                </div>
              )}
              {allDateGroups.map(([date, dateDocs]) => {
                const isOpen = selectedDate === date;
                return (
                  <div key={date} style={{ marginBottom: '4px' }}>
                    <div
                      onClick={() => { setSelectedDate(isOpen ? null : date); setSelectedPath(null); }}
                      className="doc-item"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px',
                        background: isOpen ? 'rgba(59,130,246,0.06)' : 'transparent',
                        border: `1px solid ${isOpen ? 'rgba(59,130,246,0.25)' : 'transparent'}`,
                      }}
                    >
                      <Calendar size={12} color={cadenceTab === 'Weekly' ? 'var(--accent-amber)' : 'var(--accent-green)'} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Space Mono', monospace", color: 'var(--text-primary)' }}>{date}</div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{dateDocs.length} file{dateDocs.length !== 1 ? 's' : ''}</div>
                      </div>
                      {isOpen ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
                    </div>

                    {isOpen && (
                      <div style={{ marginLeft: '6px', marginTop: '2px', marginBottom: '6px', paddingLeft: '10px', borderLeft: '1px solid var(--border-subtle)' }}>
                        {dateDocs.map(doc => (
                          <div
                            key={doc.path}
                            onClick={() => setSelectedPath(doc.path)}
                            className={`doc-item ${selectedPath === doc.path ? 'active' : ''}`}
                            style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '7px' }}
                          >
                            <FileText size={11} style={{ flexShrink: 0, color: selectedPath === doc.path ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.8rem', color: selectedPath === doc.path ? 'var(--accent-blue)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Content Viewer ── */}
      <div className="library-content glass-card">
        {selectedDoc ? (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', alignItems: 'center' }}>
              {selectedDoc.phase && <span className="badge badge-blue">Phase {selectedDoc.phase}</span>}
              {selectedDoc.category && <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>{selectedDoc.category}</span>}
              <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>{selectedDoc.date}</span>
              {selectedDoc.sector && <span className="badge badge-green">{selectedDoc.sector}</span>}
              {selectedDoc.runType && (
                <span className={`badge ${selectedDoc.runType === 'baseline' ? 'badge-blue' : 'badge-amber'}`}>
                  {selectedDoc.runType}
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", marginLeft: 'auto' }}>
                {selectedDoc.path}
              </span>
            </div>
            <div className="md-content" dangerouslySetInnerHTML={renderMarkdown(selectedDoc.content)} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            Select a file from the timeline to view
          </div>
        )}
      </div>
    </div>
  );
}
