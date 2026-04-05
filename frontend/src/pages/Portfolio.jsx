import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899'];

export default function Portfolio({ data }) {
  const { positions, ratios, calculated } = data;
  const metrics = calculated;
  
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (index) => {
    if (expandedRow === index) {
      setExpandedRow(null);
    } else {
      setExpandedRow(index);
    }
  };

  // Allocation Data
  const allocLabels = positions.map(p => p.ticker).concat(ratios.map(r => `${r.long_ticker}/${r.short_ticker}`));
  const allocDataPoints = positions.map(p => p.weight_actual).concat(ratios.map(r => r.net_weight));
  if (metrics.cash_pct > 0) {
    allocLabels.push('CASH');
    allocDataPoints.push(metrics.cash_pct);
  }

  const donutConfig = {
    data: {
      labels: allocLabels,
      datasets: [{ data: allocDataPoints, backgroundColor: PALETTE, borderWidth: 1, borderColor: '#1A1D2E' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { position: 'right', labels: { color: '#a1a1aa', font: {family: 'Outfit'} } } }
    }
  };

  const formatStat = (val, isPct = false) => {
    if (val === null || val === undefined) return '—';
    if (isPct) return `${(val * 100).toFixed(2)}%`;
    return typeof val === 'number' ? val.toFixed(2) : val;
  };

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 className="text-h3">Current Asset Allocation</h3>
        <div style={{ height: '300px', marginTop: '16px' }}>
          <Doughnut data={donutConfig.data} options={donutConfig.options} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <h3 className="text-h3" style={{ margin: 0 }}>Active Positions & Thesis</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Click a row to expand for details and technical specs</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ borderSpacing: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{paddingTop: '16px', paddingBottom: '16px'}}>Ticker</th>
                <th>Name</th>
                <th style={{textAlign: 'right'}}>Weight</th>
                <th style={{textAlign: 'right'}}>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => {
                const isExpanded = expandedRow === i;
                return (
                  <React.Fragment key={i}>
                    <tr 
                      onClick={() => toggleRow(i)} 
                      style={{ 
                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)', 
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                      className="hover-row"
                    >
                      <td><span className="badge badge-blue">{p.ticker}</span></td>
                      <td>{p.name}</td>
                      <td style={{textAlign: 'right'}} className="num-cell">{p.weight_actual.toFixed(1)}%</td>
                      <td style={{textAlign: 'right'}} className="num-cell">${p.current_price?.toFixed(2) || '—'}</td>
                      <td>
                        <span className="badge badge-outline-green">Active</span>
                      </td>
                      <td style={{textAlign: 'right', color: 'var(--text-muted)'}}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan="6" style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 300px' }}>
                              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={16} /> Investment Thesis
                              </h4>
                              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                {p.rationale || 'No rationale provided in digest.'}
                              </p>
                            </div>
                            <div style={{ flex: '1 1 300px' }}>
                              <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.1rem' }}>Technical Specifications</h4>
                              <div className="grid-2" style={{ gap: '12px' }}>
                                <div className="stat-box">
                                  <span className="text-label">Sector</span>
                                  <span className="stat-value-small">{p.stats?.sector || '—'}</span>
                                </div>
                                <div className="stat-box">
                                  <span className="text-label">Industry</span>
                                  <span className="stat-value-small">{p.stats?.industry || '—'}</span>
                                </div>
                                <div className="stat-box">
                                  <span className="text-label">Beta</span>
                                  <span className="stat-value-small">{formatStat(p.stats?.beta)}</span>
                                </div>
                                <div className="stat-box">
                                  <span className="text-label">Trailing P/E</span>
                                  <span className="stat-value-small">{formatStat(p.stats?.trailingPE)}</span>
                                </div>
                                <div className="stat-box">
                                  <span className="text-label">Dividend Yield</span>
                                  <span className="stat-value-small">{formatStat(p.stats?.dividendYield, true)}</span>
                                </div>
                                <div className="stat-box">
                                  <span className="text-label">52-Week Range</span>
                                  <span className="stat-value-small">
                                    {(p.stats?.fiftyTwoWeekLow && p.stats?.fiftyTwoWeekHigh) 
                                      ? `$${p.stats?.fiftyTwoWeekLow.toFixed(2)} - $${p.stats?.fiftyTwoWeekHigh.toFixed(2)}` 
                                      : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>No active positions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
