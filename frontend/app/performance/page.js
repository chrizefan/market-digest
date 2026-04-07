'use client';

import { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { StatCard, formatPct, pnlColor } from '@/components/ui';
import {
  TrendingUp, DollarSign, PieChart, Activity,
  Target, Zap, AlertTriangle, Shield,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, ComposedChart,
} from 'recharts';

export default function PerformancePage() {
  const { data, loading, error } = useDashboard();
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  const { portfolio, positions, ratios, benchmarks, calculated: metrics } = data;
  const bench = selectedBenchmark || portfolio.meta.benchmarks?.[0] || 'SPY';

  // Build chart data: merge portfolio NAV + benchmark into rows
  const chartData = useMemo(() => {
    const bHist = benchmarks[bench]?.history || [];
    const snapMap = {};
    (portfolio.snapshots || []).forEach(s => { snapMap[s.date] = s.nav; });

    const baseB = bHist[0]?.price || 1;
    return bHist.map(h => ({
      date: h.date,
      benchmark: ((h.price / baseB) * 100).toFixed(2) * 1,
      portfolio: snapMap[h.date] ?? null,
    }));
  }, [benchmarks, bench, portfolio.snapshots]);

  return (
    <>
      <PageHeader title="Performance" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">

        {/* Top 4 KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Portfolio P&L" value={formatPct(metrics.portfolio_pnl)} valueClass={pnlColor(metrics.portfolio_pnl)} icon={TrendingUp} iconColor="text-fin-blue" />
          <StatCard label="Cash Reserve" value={`${metrics.cash_pct?.toFixed(1) ?? '—'}%`} icon={DollarSign} iconColor="text-fin-green" />
          <StatCard label="Invested Capital" value={`${metrics.total_invested?.toFixed(1) ?? '—'}%`} icon={PieChart} iconColor="text-fin-amber" />
          <StatCard label="Active Signals" value={positions.length + ratios.length} icon={Activity} iconColor="text-fin-purple" />
        </div>

        {/* Performance Chart */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Performance vs Benchmark</h3>
            <select
              className="bg-black/50 border border-border-subtle text-text-primary px-4 py-2 rounded-lg text-sm outline-none focus:border-fin-blue"
              value={bench}
              onChange={e => setSelectedBenchmark(e.target.value)}
            >
              {Object.keys(benchmarks).map(b => (
                <option key={b} value={b}>vs {b}</option>
              ))}
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '0.85rem' }}
                />
                <Legend />
                <Area type="monotone" dataKey="portfolio" name="Portfolio NAV" stroke="#3B82F6" fill="rgba(59,130,246,0.1)" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="benchmark" name={bench} stroke="#a1a1aa" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom 4 Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Sharpe Ratio"
            value={metrics.sharpe ? metrics.sharpe.toFixed(2) : '—'}
            icon={Target} iconColor="text-fin-blue"
            subtitle="Risk-adjusted return"
          />
          <StatCard
            label="Ann. Volatility"
            value={metrics.volatility ? `${(metrics.volatility * 100).toFixed(2)}%` : '—'}
            icon={Zap} iconColor="text-fin-amber"
            subtitle="Annualized std deviation"
          />
          <StatCard
            label="Max Drawdown"
            value={metrics.max_drawdown ? `${(metrics.max_drawdown * 100).toFixed(2)}%` : '—'}
            icon={AlertTriangle} iconColor="text-fin-red"
            subtitle="Peak to trough decline"
          />
          <StatCard
            label={`Alpha vs ${bench}`}
            value={metrics.alpha != null ? formatPct(metrics.alpha * 100) : '—'}
            valueClass={pnlColor(metrics.alpha)}
            icon={Shield} iconColor="text-fin-purple"
            subtitle="Excess return (annualized)"
          />
        </div>
      </div>
    </>
  );
}
