'use client';

import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui';
import {
  AlertTriangle, ArrowUpRight, Target, TrendingUp, ArrowRightLeft,
} from 'lucide-react';

export default function StrategyPage() {
  const { data, loading, error } = useDashboard();

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  const { strategy } = data.portfolio;
  const pm = data.portfolio_management || {};
  const theses = strategy.theses || [];
  const proposed = pm.proposed_positions || [];
  const rebalance = pm.rebalance_actions || [];

  const regimeLabel = strategy.regime_label || 'neutral';
  const regimeColors = {
    bullish:  { text: 'text-fin-green', border: 'border-fin-green/40' },
    bearish:  { text: 'text-fin-red',   border: 'border-fin-red/40' },
    caution:  { text: 'text-fin-amber', border: 'border-fin-amber/40' },
    neutral:  { text: 'text-fin-blue',  border: 'border-fin-blue/40' },
  };
  const rc = regimeColors[regimeLabel] || regimeColors.neutral;

  function statusColor(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('confirmed') || s.includes('active')) return 'text-fin-green';
    if (s.includes('monitoring') || s.includes('watch')) return 'text-fin-amber';
    if (s.includes('invalidated') || s.includes('broken') || s.includes('challenged')) return 'text-fin-red';
    return 'text-text-muted';
  }

  function actionColor(action) {
    const a = (action || '').toLowerCase();
    if (a.includes('exit')) return 'text-fin-red';
    if (a.includes('add') || a.includes('new')) return 'text-fin-green';
    if (a === 'hold') return 'text-text-muted';
    return 'text-fin-amber';
  }

  return (
    <>
      <PageHeader title="Strategy & Thesis" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">

        {/* Regime Banner */}
        <div className={`glass-card p-6 border-l-4 ${rc.border}`}>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${rc.text}`}>Current Macro Regime</p>
              <h2 className="text-xl font-bold">{strategy.regime}</h2>
              <p className="text-text-secondary mt-2 leading-relaxed max-w-2xl text-sm">
                {strategy.summary}
              </p>
            </div>
            <Badge variant="default" className="h-fit shrink-0">
              Next Review: {strategy.next_review}
            </Badge>
          </div>
        </div>

        {/* Thesis Tracker */}
        {theses.length > 0 && (
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
              <Target size={16} className="text-fin-blue" />
              <h3 className="text-sm font-semibold">Active Theses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle">
                    <th className="text-left px-5 py-3">ID</th>
                    <th className="text-left px-5 py-3">Thesis</th>
                    <th className="text-left px-5 py-3">Vehicle</th>
                    <th className="text-left px-5 py-3">Invalidation</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {theses.map((t, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono text-fin-blue">{t.id}</td>
                      <td className="px-5 py-3 font-medium">{t.name}</td>
                      <td className="px-5 py-3 font-mono text-text-secondary text-[0.85rem]">{t.vehicle}</td>
                      <td className="px-5 py-3 text-text-muted text-[0.85rem]">{t.invalidation}</td>
                      <td className={`px-5 py-3 font-semibold ${statusColor(t.status)}`}>{t.status}</td>
                      <td className="px-5 py-3 text-text-secondary text-[0.85rem]">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Proposed + Rebalance */}
        {(proposed.length > 0 || rebalance.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proposed.length > 0 && (
              <div className="glass-card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
                  <TrendingUp size={16} className="text-fin-amber" />
                  <h3 className="text-sm font-semibold">Proposed Positions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle">
                        <th className="text-left px-5 py-3">Ticker</th>
                        <th className="text-right px-5 py-3">Weight</th>
                        <th className="text-left px-5 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {proposed.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3 font-semibold">{p.ticker}</td>
                          <td className="px-5 py-3 text-right">{p.weight_pct}%</td>
                          <td className={`px-5 py-3 ${actionColor(p.action)}`}>{p.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {rebalance.length > 0 && (
              <div className="glass-card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-fin-blue" />
                  <h3 className="text-sm font-semibold">Rebalance Actions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle">
                        <th className="text-left px-5 py-3">Ticker</th>
                        <th className="text-right px-5 py-3">Current</th>
                        <th className="text-right px-5 py-3">Target</th>
                        <th className="text-left px-5 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {rebalance.map((r, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3 font-semibold">{r.ticker}</td>
                          <td className="px-5 py-3 text-right">{r.current_pct}%</td>
                          <td className="px-5 py-3 text-right">{r.recommended_pct}%</td>
                          <td className={`px-5 py-3 ${actionColor(r.action)}`}>{r.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actionable + Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight size={16} className="text-fin-green" />
              <h3 className="text-sm font-semibold">Actionable Summary</h3>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary leading-relaxed pl-4 list-disc">
              {(strategy.actionable?.length > 0)
                ? strategy.actionable.map((a, i) => <li key={i}>{a}</li>)
                : <li className="text-text-muted">No actionable items extracted.</li>
              }
            </ul>
          </div>
          <div className="glass-card p-5 bg-gradient-to-b from-fin-red/5 to-transparent">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-fin-red" />
              <h3 className="text-sm font-semibold">Risk Radar</h3>
            </div>
            <ul className="space-y-2 text-sm text-red-300 leading-relaxed pl-4 list-disc">
              {(strategy.risks?.length > 0)
                ? strategy.risks.map((r, i) => <li key={i}>{r}</li>)
                : <li className="text-text-muted">No immediate risks flagged.</li>
              }
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
