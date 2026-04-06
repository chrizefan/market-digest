import { useState, useMemo, useEffect } from 'react';
import { marked } from 'marked';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

const PHASE_LABELS = {
  1: 'Alt Data',
  2: 'Institutional',
  3: 'Macro',
  4: 'Asset Classes',
  5: 'Equities & Sectors',
  6: 'Memory & Bias',
  7: 'Synthesis & Portfolio',
  8: 'Dashboard',
  9: 'Evolution',
};

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

export default function DigestTimeline({ docs }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedDates, setExpandedDates] = useState(new Set());

  // Filter state
  const [phaseFilter, setPhaseFilter] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState(new Set());
  const [sectorFilter, setSectorFilter] = useState(new Set());

  // Available filter options derived from data
  const filterOptions = useMemo(() => {
    const phases = new Set();
    const categories = new Set();
    const sectors = new Set();
    docs.forEach(d => {
      if (d.phase) phases.add(d.phase);
      if (d.category) categories.add(d.category);
      if (d.sector) sectors.add(d.sector);
    });
    return {
      phases: [...phases].sort((a, b) => a - b),
      categories: [...categories].sort(),
      sectors: [...sectors].sort(),
    };
  }, [docs]);

  // Filtered & grouped docs
  const { dateGroups, filteredCount } = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = docs.filter(d => {
      if (q && !(d.title || '').toLowerCase().includes(q) &&
          !(d.segment || '').toLowerCase().includes(q) &&
          !(d.path || '').toLowerCase().includes(q) &&
          !(d.sector || '').toLowerCase().includes(q))
        return false;
      if (phaseFilter.size > 0 && (!d.phase || !phaseFilter.has(d.phase)))
        return false;
      if (categoryFilter.size > 0 && (!d.category || !categoryFilter.has(d.category)))
        return false;
      if (sectorFilter.size > 0 && !sectorFilter.has(d.sector))
        return false;
      return true;
    });

    // Group by date
    const groups = {};
    filtered.forEach(doc => {
      const date = doc.date || 'Unknown';
      if (!groups[date]) groups[date] = { date, docs: [], runType: null };
      groups[date].docs.push(doc);
      if (doc.runType === 'baseline' || doc.runType === 'delta') {
        groups[date].runType = groups[date].runType || doc.runType;
      }
    });

    // Sort dates descending; sort docs within each date by phase
    const sorted = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach(g => g.docs.sort((a, b) => (a.phase || 99) - (b.phase || 99)));

    return { dateGroups: sorted, filteredCount: filtered.length };
  }, [docs, search, phaseFilter, categoryFilter, sectorFilter]);

  // Auto-expand first date on load
  useEffect(() => {
    if (dateGroups.length > 0 && expandedDates.size === 0) {
      setExpandedDates(new Set([dateGroups[0].date]));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDoc = useMemo(
    () => docs.find(d => d.path === selectedPath),
    [docs, selectedPath]
  );

  const toggleDate = (date) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

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

  const renderMarkdown = (content) => {
    return { __html: marked.parse(content || '') };
  };

  // Group docs within a date by phase
  const groupByPhase = (dateDocs) => {
    const phaseGroups = {};
    dateDocs.forEach(doc => {
      const key = doc.phase || 'other';
      if (!phaseGroups[key]) phaseGroups[key] = [];
      phaseGroups[key].push(doc);
    });
    return Object.entries(phaseGroups).sort(([a], [b]) => {
      if (a === 'other') return 1;
      if (b === 'other') return -1;
      return Number(a) - Number(b);
    });
  };

  return (
    <div className="library-layout">
      {/* Timeline Sidebar */}
      <div className="library-sidebar glass-card" style={{ padding: '16px 8px' }}>
        {/* Search */}
        <div style={{ position: 'relative', margin: '0 8px 12px 8px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="modern-select"
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>

        {/* Filter sections */}
        <div style={{ margin: '0 8px 12px 8px' }}>
          {/* Phase chips */}
          {filterOptions.phases.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div className="doc-folder-label" style={{ margin: '0 0 6px 0' }}>Phase</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {filterOptions.phases.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleFilter(setPhaseFilter, p)}
                    className={`filter-chip ${phaseFilter.has(p) ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category chips */}
          {filterOptions.categories.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div className="doc-folder-label" style={{ margin: '0 0 6px 0' }}>Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {filterOptions.categories.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleFilter(setCategoryFilter, c)}
                    className={`filter-chip ${categoryFilter.has(c) ? 'active' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sector chips */}
          {filterOptions.sectors.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div className="doc-folder-label" style={{ margin: '0 0 6px 0' }}>Sector</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {filterOptions.sectors.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleFilter(setSectorFilter, s)}
                    className={`filter-chip ${sectorFilter.has(s) ? 'active' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear + stats row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {filteredCount} files · {dateGroups.length} dates
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'none', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', fontSize: '0.7rem', padding: '3px 8px',
                  borderRadius: '4px', cursor: 'pointer',
                }}
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Date Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Timeline spine */}
          {dateGroups.length > 1 && (
            <div style={{ position: 'absolute', left: '18px', top: '20px', bottom: '20px', width: '1px', background: 'var(--border-subtle)', zIndex: 0 }} />
          )}

          {dateGroups.map(group => {
            const isExpanded = expandedDates.has(group.date);
            const dotColor = group.runType === 'baseline' ? 'var(--accent-blue)' :
                             group.runType === 'delta' ? 'var(--accent-green)' : 'var(--text-muted)';
            const runLabel = group.runType === 'baseline' ? 'Baseline' :
                             group.runType === 'delta' ? 'Delta' : '';

            return (
              <div key={group.date} style={{ marginBottom: '2px' }}>
                {/* Date header */}
                <div
                  onClick={() => toggleDate(group.date)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                    position: 'relative', zIndex: 1,
                  }}
                  className="doc-item"
                >
                  {/* Timeline dot */}
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: dotColor,
                    border: '2px solid var(--bg-primary)',
                    flexShrink: 0, boxShadow: `0 0 6px ${dotColor}40`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Space Mono', monospace" }}>
                      {group.date}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {runLabel && <span style={{ color: dotColor }}>{runLabel}</span>}
                      {runLabel && ' · '}{group.docs.length} file{group.docs.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronDown size={14} color="var(--text-muted)" />
                    : <ChevronRight size={14} color="var(--text-muted)" />
                  }
                </div>

                {/* Expanded file list grouped by phase */}
                {isExpanded && (
                  <div style={{ marginLeft: '24px', paddingLeft: '16px', borderLeft: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                    {groupByPhase(group.docs).map(([phase, phaseDocs]) => (
                      <div key={phase} style={{ marginBottom: '10px' }}>
                        <div style={{
                          fontSize: '0.68rem', fontWeight: 600, marginBottom: '4px', marginTop: '6px',
                          fontFamily: "'Space Mono', monospace", letterSpacing: '0.03em',
                          color: CATEGORY_COLORS[phaseDocs[0]?.category] || 'var(--text-muted)',
                        }}>
                          {phase !== 'other' ? `Phase ${phase} — ${PHASE_LABELS[phase] || ''}` : 'Other'}
                        </div>
                        {phaseDocs.map(doc => (
                          <div
                            key={doc.path}
                            onClick={() => setSelectedPath(doc.path)}
                            className={`doc-item ${selectedPath === doc.path ? 'active' : ''}`}
                            style={{ padding: '5px 10px', marginBottom: '1px' }}
                          >
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              fontSize: '0.82rem',
                              color: selectedPath === doc.path ? 'var(--accent-blue)' : 'var(--text-primary)',
                            }}>
                              <span>{doc.title}</span>
                              {doc.sector && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--accent-green)', opacity: 0.8 }}>
                                  [{doc.sector}]
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {dateGroups.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No files match the current filters.
            </div>
          )}
        </div>
      </div>

      {/* Content Viewer */}
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
            <div
              className="md-content"
              dangerouslySetInnerHTML={renderMarkdown(selectedDoc.content)}
            />
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
