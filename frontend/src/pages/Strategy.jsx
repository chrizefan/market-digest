import { AlertTriangle, ArrowUpRight, Target, TrendingUp, ArrowRightLeft } from 'lucide-react';

export default function Strategy({ data }) {
  const { strategy } = data.portfolio;
  const pm = data.portfolio_management || {};

  const getRegimeColor = (label) => {
    if (label === 'bullish') return 'var(--accent-green)';
    if (label === 'bearish') return 'var(--accent-red)';
    if (label === 'caution') return 'var(--accent-amber)';
    return 'var(--accent-blue)';
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('confirmed')) return 'var(--accent-green)';
    if (s.includes('monitoring') || s.includes('watch')) return 'var(--accent-amber)';
    if (s.includes('invalidated') || s.includes('broken')) return 'var(--accent-red)';
    return 'var(--text-muted)';
  };

  const regColor = getRegimeColor(strategy.regime_label || 'neutral');
  const theses = strategy.theses || [];
  const proposed = pm.proposed_positions || [];
  const rebalance = pm.rebalance_actions || [];

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-card" style={{ marginBottom: '24px', borderLeft: `4px solid ${regColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="text-label" style={{ color: regColor, marginBottom: '8px' }}>Current Macro Regime</div>
            <h2 className="text-h2" style={{ margin: 0 }}>{strategy.regime}</h2>
          </div>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
            Next Review: {strategy.next_review}
          </div>
        </div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {strategy.summary}
        </p>
      </div>

      {/* Thesis Tracker */}
      {theses.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target color="var(--accent-blue)" size={20} />
              <h3 className="text-h3" style={{ margin: 0 }}>Active Theses</h3>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{ borderSpacing: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ paddingTop: '14px', paddingBottom: '14px' }}>ID</th>
                  <th>Thesis</th>
                  <th>Vehicle</th>
                  <th>Invalidation</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {theses.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.vehicle}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.invalidation}</td>
                    <td>
                      <span style={{ color: getStatusColor(t.status), fontWeight: 600, fontSize: '0.85rem' }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proposed Positions & Rebalance */}
      {(proposed.length > 0 || rebalance.length > 0) && (
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          {proposed.length > 0 && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp color="var(--accent-amber)" size={18} />
                  <h3 className="text-h3" style={{ margin: 0, fontSize: '1rem' }}>Proposed Positions</h3>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="modern-table" style={{ borderSpacing: 0, width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingTop: '12px', paddingBottom: '12px' }}>Ticker</th>
                      <th style={{ textAlign: 'right' }}>Weight</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposed.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.ticker}</td>
                        <td style={{ textAlign: 'right' }}>{p.weight_pct}%</td>
                        <td style={{
                          color: p.action?.toLowerCase().includes('exit') ? 'var(--accent-red)' :
                                 p.action?.toLowerCase().includes('add') ? 'var(--accent-green)' :
                                 'var(--text-secondary)'
                        }}>{p.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {rebalance.length > 0 && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowRightLeft color="var(--accent-blue)" size={18} />
                  <h3 className="text-h3" style={{ margin: 0, fontSize: '1rem' }}>Rebalance Actions</h3>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="modern-table" style={{ borderSpacing: 0, width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingTop: '12px', paddingBottom: '12px' }}>Ticker</th>
                      <th style={{ textAlign: 'right' }}>Current</th>
                      <th style={{ textAlign: 'right' }}>Target</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebalance.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.ticker}</td>
                        <td style={{ textAlign: 'right' }}>{r.current_pct}%</td>
                        <td style={{ textAlign: 'right' }}>{r.recommended_pct}%</td>
                        <td style={{
                          color: r.action === 'HOLD' ? 'var(--text-muted)' :
                                 r.action?.includes('ADD') ? 'var(--accent-green)' :
                                 r.action?.includes('EXIT') ? 'var(--accent-red)' :
                                 'var(--accent-amber)'
                        }}>{r.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actionable & Risks Split */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ArrowUpRight color="var(--accent-green)" />
            <h3 className="text-h3" style={{ margin: 0 }}>Actionable Summary</h3>
          </div>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: 1.8 }}>
            {(strategy.actionable?.length > 0)
              ? strategy.actionable.map((arg, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{arg}</li>
                ))
              : <li style={{ color: 'var(--text-muted)' }}>No actionable items extracted.</li>
            }
          </ul>
        </div>
        
        <div className="glass-card" style={{ background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle color="var(--accent-red)" />
            <h3 className="text-h3" style={{ margin: 0 }}>Risk Radar</h3>
          </div>
          <ul style={{ paddingLeft: '20px', color: '#fca5a5', lineHeight: 1.8 }}>
            {(strategy.risks?.length > 0)
              ? strategy.risks.map((risk, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{risk}</li>
                ))
              : <li style={{ color: 'var(--text-muted)' }}>No immediate risks flagged.</li>
            }
          </ul>
        </div>
      </div>
    </div>
  );
}
