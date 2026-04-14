'use client';

import { useDashboard } from '@/lib/dashboard-context';
import { SUBPAGE_MAX } from '@/components/subpage-tab-bar';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Target,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { StatCard, Badge, formatPct, pnlColor } from '@/components/ui';

const REGIME_COLORS: Record<string, string> = {
  bullish: 'text-fin-green border-fin-green/40',
  bearish: 'text-fin-red border-fin-red/40',
  caution: 'text-fin-amber border-fin-amber/40',
  neutral: 'text-fin-blue border-fin-blue/40',
};

const REGIME_SURFACE: Record<string, string> = {
  bullish: 'bg-gradient-to-br from-fin-green/[0.12] via-transparent to-transparent',
  bearish: 'bg-gradient-to-br from-fin-red/[0.12] via-transparent to-transparent',
  caution: 'bg-gradient-to-br from-fin-amber/[0.12] via-transparent to-transparent',
  neutral: 'bg-gradient-to-br from-fin-blue/[0.10] via-transparent to-transparent',
};

export default function OverviewPage() {
  const { data, loading, error } = useDashboard();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-text-secondary text-lg">Loading…</div>
    );
  if (error || !data)
    return <div className="flex items-center justify-center h-screen text-fin-red">{error || 'Failed to load'}</div>;

  const { portfolio, positions, calculated: metrics, docs, snapshot_context_bullets: contextBullets } = data;
  const { strategy } = portfolio;
  const regimeLabel = strategy.regime_label || 'neutral';
  const regimeStyle = REGIME_COLORS[regimeLabel] || REGIME_COLORS.neutral;
  const regimeSurface = REGIME_SURFACE[regimeLabel] || REGIME_SURFACE.neutral;

  const latestDate = portfolio.meta.last_updated || null;
  const latestRunDocs = latestDate ? docs.filter((d) => d.date === latestDate) : [];
  const latestRunDocByKey = new Map(latestRunDocs.map((d) => [d.path, d]));
  const researchQuickLinks = [{ label: 'Digest', docKey: 'digest' }].filter((x) => latestRunDocByKey.has(x.docKey));
  const pmQuickLinks = [
    { label: 'Deliberation', keys: ['deliberation.md', 'deliberation.json'] as const },
    { label: 'Rebalance', keys: ['rebalance-decision.json'] as const },
  ].flatMap((c) => {
    const docKey = c.keys.find((k) => latestRunDocByKey.has(k));
    return docKey ? [{ label: c.label, docKey }] : [];
  });

  return (
    <div className={`${SUBPAGE_MAX} space-y-8 py-4 md:py-6`}>
        <div className={`glass-card p-6 sm:p-8 border-l-4 ${regimeSurface} ${regimeStyle.split(' ')[1]}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1 w-full">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${regimeStyle.split(' ')[0]}`}>
                Current regime
              </p>
              <h2 className="text-2xl font-bold tracking-tight">{strategy.regime}</h2>
              <p className="text-text-secondary mt-3 leading-relaxed text-sm sm:text-base max-w-none">
                {strategy.summary}
              </p>
              {contextBullets.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-xs text-text-muted border-t border-border-subtle/80 pt-4">
                  {contextBullets.map((b, i) => (
                    <li key={i} className="pl-3 border-l-2 border-fin-blue/30">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="shrink-0 lg:text-right">
              <Badge variant="default">Next review: {strategy.next_review}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio P&L"
            value={formatPct(metrics.portfolio_pnl)}
            valueClass={pnlColor(metrics.portfolio_pnl)}
            icon={TrendingUp}
            iconColor="text-fin-blue"
          />
          <StatCard
            label="Cash reserve"
            value={`${metrics.cash_pct?.toFixed(1) ?? '—'}%`}
            icon={DollarSign}
            iconColor="text-fin-green"
          />
          <StatCard
            label="Invested capital"
            value={`${metrics.total_invested?.toFixed(1) ?? '—'}%`}
            icon={PieChart}
            iconColor="text-fin-amber"
          />
          <StatCard
            label="Active positions"
            value={positions.length}
            icon={Activity}
            iconColor="text-fin-purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
              <Target size={16} className="text-fin-blue" />
              <h3 className="text-sm font-semibold">Current positions</h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {positions.slice(0, 8).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-semibold text-fin-blue shrink-0">{p.ticker}</span>
                    <span className="text-sm text-text-secondary truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-semibold tabular-nums">
                      {p.weight_actual?.toFixed(1)}%
                    </span>
                    {typeof p.weight_delta === 'number' && p.weight_delta !== 0 && (
                      <div
                        className={`text-[11px] font-mono tabular-nums ${p.weight_delta > 0 ? 'text-fin-green' : 'text-fin-red'}`}
                      >
                        {p.weight_delta > 0 ? '+' : ''}
                        {p.weight_delta.toFixed(1)}pp
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

          <div className="space-y-4">
            {(researchQuickLinks.length > 0 || pmQuickLinks.length > 0) && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold">Latest research &amp; PM</h3>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link href="/research?tab=daily" className="text-xs text-fin-blue hover:underline">
                      Research
                    </Link>
                    <Link
                      href={
                        latestDate
                          ? `/portfolio?tab=analysis&date=${encodeURIComponent(latestDate)}`
                          : '/portfolio?tab=analysis'
                      }
                      className="text-xs text-fin-amber hover:underline"
                    >
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
                          href={`/research?tab=daily&date=${encodeURIComponent(String(latestDate || ''))}&docKey=${encodeURIComponent(l.docKey)}`}
                          className="text-xs px-3 py-1 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {pmQuickLinks.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">PM &amp; process</p>
                    <div className="flex flex-wrap gap-2">
                      {pmQuickLinks.map((l) => (
                        <Link
                          key={l.docKey}
                          href={`/portfolio?tab=analysis&date=${encodeURIComponent(String(latestDate || ''))}&docKey=${encodeURIComponent(l.docKey)}`}
                          className="text-xs px-3 py-1 rounded-md bg-fin-amber/10 text-fin-amber hover:bg-fin-amber/20 transition-colors"
                        >
                          {l.label}
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
                <h3 className="text-sm font-semibold">Actionable summary</h3>
              </div>
              <ul className="space-y-2 text-sm text-text-secondary pl-4 list-disc">
                {strategy.actionable?.length > 0 ? (
                  strategy.actionable.map((a, i) => <li key={i}>{a}</li>)
                ) : (
                  <li className="text-text-muted">No actionable items.</li>
                )}
              </ul>
            </div>

            <div className="glass-card p-5 bg-gradient-to-b from-fin-red/5 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-fin-red" />
                <h3 className="text-sm font-semibold">Risk radar</h3>
              </div>
              <ul className="space-y-2 text-sm text-red-300 pl-4 list-disc">
                {strategy.risks?.length > 0 ? (
                  strategy.risks.map((r, i) => <li key={i}>{r}</li>)
                ) : (
                  <li className="text-text-muted">No immediate risks flagged.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {strategy.theses?.length > 0 && (
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-2">
              <Shield size={16} className="text-fin-amber" />
              <h3 className="text-sm font-semibold">Current theses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                    <th className="px-4 py-3 text-left md:px-5">ID</th>
                    <th className="px-4 py-3 text-left md:px-5">Thesis</th>
                    <th className="hidden px-5 py-3 text-left sm:table-cell">Vehicle</th>
                    <th className="px-4 py-3 text-left md:px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {strategy.theses.map((t, i) => {
                    const s = (t.status || '').toLowerCase();
                    const statusColor = s.includes('confirmed')
                      ? 'text-fin-green'
                      : s.includes('monitoring') || s.includes('watch')
                        ? 'text-fin-amber'
                        : s.includes('invalidated') || s.includes('broken')
                          ? 'text-fin-red'
                          : 'text-text-muted';
                    return (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono md:px-5">
                          <Link
                            href={`/portfolio?tab=analysis&thesis=${encodeURIComponent(t.id)}`}
                            className="text-fin-blue hover:underline"
                          >
                            {t.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium md:px-5">{t.name}</td>
                        <td className="hidden px-5 py-3 font-mono text-text-secondary sm:table-cell">{t.vehicle}</td>
                        <td className={`px-4 py-3 font-semibold md:px-5 ${statusColor}`}>{t.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href="/portfolio"
            className="glass-card p-5 border border-border-subtle hover:border-fin-blue/35 transition-colors group"
          >
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-fin-blue mb-1">Portfolio</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Allocations, performance, analysis (theses + PM), and activity.
            </p>
          </Link>
          <Link
            href="/research?tab=daily"
            className="glass-card p-5 border border-border-subtle hover:border-fin-blue/35 transition-colors group"
          >
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-fin-blue mb-1">Research</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Daily run documents and the knowledge base.
            </p>
          </Link>
        </div>

        <p className="text-center text-xs text-text-muted">
          <Link href="/architecture" className="text-fin-blue/90 hover:text-fin-blue hover:underline">
            How Atlas works (architecture)
          </Link>
        </p>
    </div>
  );
}
