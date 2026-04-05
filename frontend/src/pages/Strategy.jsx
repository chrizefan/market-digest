import { ShieldAlert, AlertTriangle, ArrowUpRight, ArrowDownRight, Wind } from 'lucide-react';

export default function Strategy({ data }) {
  const { strategy } = data.portfolio;

  const getRegimeColor = (label) => {
    if (label === 'bullish') return 'var(--accent-green)';
    if (label === 'bearish') return 'var(--accent-red)';
    if (label === 'caution') return 'var(--accent-amber)';
    return 'var(--accent-blue)';
  };

  const regColor = getRegimeColor(strategy.regime_label);

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

      {/* Actionable & Risks Split */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ArrowUpRight color="var(--accent-green)" />
            <h3 className="text-h3" style={{ margin: 0 }}>Actionable Summary</h3>
          </div>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1', lineHeight: 1.8 }}>
            {strategy.actionable?.map((arg, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{arg}</li>
            )) || <li>No actionable items extracted.</li>}
          </ul>
        </div>
        
        <div className="glass-card" style={{ background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle color="var(--accent-red)" />
            <h3 className="text-h3" style={{ margin: 0 }}>Risk Radar</h3>
          </div>
          <ul style={{ paddingLeft: '20px', color: '#fca5a5', lineHeight: 1.8 }}>
            {strategy.risks?.map((risk, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{risk}</li>
            )) || <li>No immediate risks flagged.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
