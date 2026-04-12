'use client';

import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import {
  TrendingUp, DollarSign, PieChart, Activity, AlertTriangle,
  ArrowUpRight, Target, Shield, Database, ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { StatCard, Badge, formatPct, pnlColor } from '@/components/ui';
import { NavSparkline } from '@/components/portfolio/nav-sparkline';
import MacroSparklineRow from '@/components/overview/macro-sparkline-row';

const REGIME_COLORS: Record<string, string> = {
  bullish: 'text-fin-green border-fin-green/40',
  bearish: 'text-fin-red border-fin-red/40',
  caution: 'text-fin-amber border-fin-amber/40',
  neutral: 'text-fin-blue border-fin-blue/40',
};

export default function OverviewPage() {
  const { data, loading, error } = useDashboard();

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary text-lg">Loading…</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error || 'Failed to load'}</div>;

  const {
    portfolio,
    positions,
    calculated: metrics,
    docs,
    position_events: positionEvents,
    server_portfolio_metrics: serverM,
    snapshot_context_bullets: contextBullets,
    macro_series_preview: macroPreview,
  } = data;
  const { strategy } = portfolio;
  const regimeLabel = strategy.regime_label || 'neutral';
  const regimeStyle = REGIME_COLORS[regimeLabel] || REGIME_COLORS.neutral;

  const latestDate = portfolio.meta.last_updated || null;
  const latestDeepDives = docs
    .filter((d) => d.type === 'Deep Dive')
    .slice(0, 3);
  const latestRunDocs = latestDate
    ? docs.filter((d) => d.date === latestDate)
    : [];
  const latestRunDocByKey = new Map(latestRunDocs.map((d) => [d.path, d]));
  const researchQuickLinks = [{ label: 'Digest', docKey: 'digest' }].filter((x) =>
    latestRunDocByKey.has(x.docKey)
  );
  const pmQuickLinks = [
    { label: 'Deliberation', keys: ['deliberation.md', 'deliberation.json'] as const },
    { label: 'Rebalance', keys: ['rebalance-decision.json'] as const },
  ].flatMap((c) => {
    const docKey = c.keys.find((k) => latestRunDocByKey.has(k));
    return docKey ? [{ label: c.label, docKey }] : [];
  });

  const runType = portfolio.meta.latest_snapshot_run_type;
  const recentEvents = positionEvents.slice(0, 6);

  return (
    <>
      <PageHeader title="Overview" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">

        {/* As-of trust bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border-subtle bg-bg-secondary/50 px-4 py-3 text-xs text-text-secondary">
          <span>
            <span className="text-text-muted uppercase tracking-wider mr-2">Data as of</span>
            <span className="font-mono text-text-primary">{latestDate ?? '—'}</span>
          </span>
          {runType ? (
            <Badge variant={runType === 'baseline' ? 'default' : 'blue'} className="text-[10px]">
              {runType === 'baseline' ? 'Baseline run' : 'Delta run'}
            </Badge>
          ) : null}
          {serverM?.as_of_date ? (
            <span className="text-text-muted">
              Metrics as of <span className="font-mono text-text-secondary">{serverM.as_of_date}</span>
            </span>
          ) : null}
          {serverM?.generated_at ? (
            <span className="text-text-muted">
              Computed <span className="font-mono text-text-secondary">{serverM.generated_at}</span>
            </span>
          ) : null}
          <Link
            href="/architecture"
            className="ml-auto inline-flex items-center gap-1.5 text-fin-blue hover:underline shrink-0"
          >
            <Database size={14} aria-hidden />
            How Atlas works
          </Link>
        </div>

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
              {contextBullets.length > 0 ? (
                <ul className="mt-4 space-y-1 text-xs text-text-muted border-t border-border-subtle/80 pt-3">
                  {contextBullets.map((b, i) => (
                    <li key={i} className="pl-3 border-l-2 border-fin-blue/30">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
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

        {/* Risk / quality metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border-subtle bg-bg-secondary/40 px-4 py-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Sharpe</p>
            <p className="text-lg font-mono font-semibold tabular-nums">
              {metrics.sharpe != null && !Number.isNaN(metrics.sharpe) ? metrics.sharpe.toFixed(2) : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-secondary/40 px-4 py-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Volatility</p>
            <p className="text-lg font-mono font-semibold tabular-nums">
              {metrics.volatility != null && !Number.isNaN(metrics.volatility)
                ? formatPct(metrics.volatility)
                : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-secondary/40 px-4 py-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Max drawdown</p>
            <p className={`text-lg font-mono font-semibold tabular-nums ${pnlColor(metrics.max_drawdown)}`}>
              {metrics.max_drawdown != null && !Number.isNaN(metrics.max_drawdown)
                ? formatPct(metrics.max_drawdown)
                : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-secondary/40 px-4 py-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Alpha</p>
            <p className={`text-lg font-mono font-semibold tabular-nums ${pnlColor(metrics.alpha)}`}>
              {metrics.alpha != null && !Number.isNaN(metrics.alpha) ? formatPct(metrics.alpha) : '—'}
            </p>
          </div>
        </div>

        {portfolio.snapshots.length >= 2 && (
          <div className="glass-card px-5 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="text-[10px] text-text-muted uppercase tracking-wider shrink-0">
                NAV trend
              </span>
              <div className="h-14 w-full min-w-[160px] max-w-[320px]">
                <NavSparkline snaps={portfolio.snapshots} />
              </div>
            </div>
            <Link
              href="/performance"
              className="text-sm text-fin-blue hover:underline font-medium shrink-0"
            >
              Full performance →
            </Link>
          </div>
        )}

        <MacroSparklineRow series={macroPreview} />

        {recentEvents.length > 0 && (
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-fin-amber" />
                <h3 className="text-sm font-semibold">Recent activity</h3>
              </div>
              <Link href="/portfolio?tab=activity" className="text-xs text-fin-blue hover:underline shrink-0">
                Full ledger →
              </Link>
            </div>
            <ul className="divide-y divide-border-subtle">
              {recentEvents.map((ev, i) => (
                <li key={`${ev.date}-${ev.ticker}-${ev.event}-${i}`} className="px-5 py-2.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono text-[11px] text-text-muted shrink-0">{ev.date}</span>
                  <Badge variant="blue" className="text-[10px]">
                    {ev.ticker}
                  </Badge>
                  <span className="text-text-secondary text-xs font-medium">{ev.event}</span>
                  {ev.reason ? (
                    <span className="text-text-muted text-xs truncate min-w-0 flex-1">{ev.reason}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

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
                  <div className="text-right">
                    <span className="text-sm font-mono font-semibold tabular-nums">
                      {p.weight_actual?.toFixed(1)}%
                    </span>
                    {typeof p.weight_delta === 'number' && p.weight_delta !== 0 && (
                      <div className={`text-[11px] font-mono tabular-nums ${p.weight_delta > 0 ? 'text-fin-green' : 'text-fin-red'}`}>
                        {p.weight_delta > 0 ? '+' : ''}{p.weight_delta.toFixed(1)}pp
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {positions.length === 0 && (
                <p className="text-center py-8 text-text-muted text-sm">No active positions</p>
              )}
            </div>
          </div>

          {/* Actionable + Risks */}
          <div className="space-y-4">
            {(researchQuickLinks.length > 0 || pmQuickLinks.length > 0 || latestDeepDives.length > 0) && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold">Latest research &amp; PM</h3>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link href="/library" className="text-xs text-fin-blue hover:underline">
                      Research library
                    </Link>
                    <Link href="/portfolio?tab=pm_process" className="text-xs text-fin-amber hover:underline">
                      PM &amp; process
                    </Link>
                  </div>
                </div>
                {researchQuickLinks.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Research</p>
                    <div className="flex flex-wrap gap-2">
                      {researchQuickLinks.map((l) => (
                        <Link
                          key={l.docKey}
                          href={`/library?date=${encodeURIComponent(String(latestDate || ''))}&docKey=${encodeURIComponent(l.docKey)}`}
                          className="text-xs px-3 py-1 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {pmQuickLinks.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">PM &amp; process</p>
                    <div className="flex flex-wrap gap-2">
                      {pmQuickLinks.map((l) => (
                        <Link
                          key={l.docKey}
                          href={`/portfolio?tab=pm_process&docKey=${encodeURIComponent(l.docKey)}`}
                          className="text-xs px-3 py-1 rounded-md bg-fin-amber/10 text-fin-amber hover:bg-fin-amber/20 transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {latestDeepDives.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Deep dives</p>
                    <div className="space-y-1">
                      {latestDeepDives.map((d) => (
                        <Link
                          key={d.id}
                          href={`/library?date=${encodeURIComponent(d.date)}&docKey=${encodeURIComponent(d.path)}`}
                          className="block text-sm text-text-secondary hover:text-white truncate"
                        >
                          {d.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
                        <td className="px-5 py-3 font-mono">
                          <Link
                            href={`/strategy?thesis=${encodeURIComponent(t.id)}`}
                            className="text-fin-blue hover:underline"
                          >
                            {t.id}
                          </Link>
                        </td>
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
