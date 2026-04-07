'use client';

import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import {
  TrendingUp, DollarSign, PieChart, Activity, AlertTriangle,
  ArrowUpRight, Target, Shield,
} from 'lucide-react';
import { StatCard, Badge, formatPct, pnlColor } from '@/components/ui';

const REGIME_COLORS: Record<string, string> = {
  bullish: 'text-fin-green border-fin-green/40',
  bearish: 'text-fin-red border-fin-red/40',
  caution: 'text-fin-amber border-fin-amber/40',
  neutral: 'text-fin-blue border-fin-blue/40',
};

export default function OverviewPage() {
  const { data, loading, error } = useDashboard();

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary text-lg">initializing digiquant-atlas_</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error || 'Failed to load'}</div>;

  const { portfolio, positions, calculated: metrics } = data;
  const { strategy } = portfolio;
  const regimeLabel = strategy.regime_label || 'neutral';
  const regimeStyle = REGIME_COLORS[regimeLabel] || REGIME_COLORS.neutral;

  return (
    <>
      <PageHeader title="Overview" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">

        {/* Regime Banner */}
        <div className={`glass-card p-6 border-l-4 ${regimeStyle.split(' ')[1]}`}>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${regimeStyle.split(' ')[0]}`}>
                Current Regime
              </p>
              <h2 className="text-xl font-bold">{strategy.regime}</h2>
              <p className="text-text-secondary mt-2 leading-relaxed max-w-2xl text-sm">
                {strategy.summary}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="default">Next Review: {strategy.next_review}</Badge>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio P&L"
            value={formatPct(metrics.portfolio_pnl)}
            valueClass={pnlColor(metrics.portfolio_pnl)}
            icon={TrendingUp}
            iconColor="text-fin-blue"
          />
          <StatCard
            label="Cash Reserve"
            value={`${metrics.cash_pct?.toFixed(1) ?? '—'}%`}
            icon={DollarSign}
            iconColor="text-fin-green"
          />
          <StatCard
            label="Invested Capital"
            value={`${metrics.total_invested?.toFixed(1) ?? '—'}%`}
            icon={PieChart}
            iconColor="text-fin-amber"
          />
          <StatCard
            label="Active Positions"
            value={positions.length}
            icon={Activity}
            iconColor="text-fin-purple"
          />
        </div>

        {/* Two-column: Positions + Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Positions */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
              <Target size={16} className="text-fin-blue" />
              <h3 className="text-sm font-semibold">Top Positions</h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {positions.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="blue">{p.ticker}</Badge>
                    <span className="text-sm text-text-secondary truncate max-w-[160px]">{p.name}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold tabular-nums">
                    {p.weight_actual?.toFixed(1)}%
                  </span>
                </div>
              ))}
              {positions.length === 0 && (
                <p className="text-center py-8 text-text-muted text-sm">No active positions</p>
              )}
            </div>
          </div>

          {/* Actionable + Risks */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight size={16} className="text-fin-green" />
                <h3 className="text-sm font-semibold">Actionable Summary</h3>
              </div>
              <ul className="space-y-2 text-sm text-text-secondary pl-4 list-disc">
                {(strategy.actionable?.length > 0)
                  ? strategy.actionable.map((a, i) => <li key={i}>{a}</li>)
                  : <li className="text-text-muted">No actionable items.</li>
                }
              </ul>
            </div>

            <div className="glass-card p-5 bg-gradient-to-b from-fin-red/5 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-fin-red" />
                <h3 className="text-sm font-semibold">Risk Radar</h3>
              </div>
              <ul className="space-y-2 text-sm text-red-300 pl-4 list-disc">
                {(strategy.risks?.length > 0)
                  ? strategy.risks.map((r, i) => <li key={i}>{r}</li>)
                  : <li className="text-text-muted">No immediate risks flagged.</li>
                }
              </ul>
            </div>
          </div>
        </div>

        {/* Active Theses Summary */}
        {strategy.theses?.length > 0 && (
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
              <Shield size={16} className="text-fin-amber" />
              <h3 className="text-sm font-semibold">Active Theses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle">
                    <th className="text-left px-5 py-3">ID</th>
                    <th className="text-left px-5 py-3">Thesis</th>
                    <th className="text-left px-5 py-3">Vehicle</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {strategy.theses.map((t, i) => {
                    const s = (t.status || '').toLowerCase();
                    const statusColor = s.includes('confirmed') ? 'text-fin-green' :
                      s.includes('monitoring') || s.includes('watch') ? 'text-fin-amber' :
                      s.includes('invalidated') || s.includes('broken') ? 'text-fin-red' :
                      'text-text-muted';
                    return (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-mono text-fin-blue">{t.id}</td>
                        <td className="px-5 py-3 font-medium">{t.name}</td>
                        <td className="px-5 py-3 font-mono text-text-secondary">{t.vehicle}</td>
                        <td className={`px-5 py-3 font-semibold ${statusColor}`}>{t.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
