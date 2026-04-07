'use client';

import { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { StatCard, formatPct, pnlColor } from '@/components/ui';
import {
  TrendingUp, BarChart3, Activity,
  Target, ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Line,
} from 'recharts';
import { Position, BenchmarkHistoryMap, NavChartPoint, PerfChartPoint, CalculatedMetrics } from '@/lib/types';

/* ── helpers ── */

function MetricCard({ label, value, fmt, color, sub }: MetricProps) {
  return (
    <div className="bg-bg-secondary rounded-lg p-4 border border-border-subtle">
      <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">{label}</span>
      <span className={`text-lg font-bold tabular-nums ${color || ''}`}>
        {fmt && value != null ? fmt(value as number) : value}
      </span>
      {sub && <span className="text-xs text-text-muted block mt-1">{sub}</span>}
    </div>
  );
}

function fmtNav(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toFixed(2);
}

function dayReturn(snaps: NavChartPoint[]): number | null {
  if (!snaps || snaps.length < 2) return null;
  const prev = snaps[snaps.length - 2].nav;
  const curr = snaps[snaps.length - 1].nav;
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

/* ── PositionPnlTable ── */

interface PositionPnlTableProps {
  positions: Position[];
}

function PositionPnlTable({ positions }: PositionPnlTableProps) {
  if (!positions.length) return null;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
        <h3 className="text-lg font-semibold">Position P&L</h3>
        <p className="text-text-muted text-sm mt-1">Unrealized return per position (entry price to latest close)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4">Ticker</th>
              <th className="text-right px-6 py-4">Weight</th>
              <th className="text-right px-6 py-4">Entry</th>
              <th className="text-right px-6 py-4">Current</th>
              <th className="text-right px-6 py-4">P&L %</th>
              <th className="text-right px-6 py-4">Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {positions.map((p, i) => {
              const entry = p.entry_price;
              const curr = p.current_price;
              const pnlPct = entry && curr && entry > 0 ? ((curr - entry) / entry) * 100 : null;
              const contrib = pnlPct != null ? (pnlPct * (p.weight_actual || 0)) / 100 : null;
              return (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 font-semibold">{p.ticker}</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">{p.weight_actual?.toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums text-text-secondary">{entry ? `$${entry.toFixed(2)}` : '—'}</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">{curr ? `$${curr.toFixed(2)}` : '—'}</td>
                  <td className={`px-6 py-3 text-right font-mono tabular-nums font-semibold ${pnlPct != null ? (pnlPct >= 0 ? 'text-fin-green' : 'text-fin-red') : ''}`}>
                    {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums text-text-secondary">
                    {contrib != null ? `${contrib >= 0 ? '+' : ''}${contrib.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── AdvancedStats ── */

interface AdvancedStatsProps {
  metrics: CalculatedMetrics;
  snaps: NavChartPoint[];
  benchmarks: BenchmarkHistoryMap;
}

interface ComputedStats {
  tradingDays: number;
  totalReturn: number;
  annReturn: number;
  annVol: number;
  sharpe: number;
  sortino: number;
  maxDd: number;
  ddStart: string;
  ddEnd: string;
  currDd: number;
  winRate: number;
  upDays: number;
  downDays: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  calmar: number;
  bestDay: number;
  worstDay: number;
  beta: number | null;
  correlation: number | null;
  alphaAnn: number | null;
  trackingError: number | null;
  infoRatio: number | null;
}

interface MetricProps {
  label: string;
  value: number | string | null | undefined;
  fmt?: (v: number) => string;
  color?: string;
  sub?: string;
}

function AdvancedStats({ metrics: _metrics, snaps, benchmarks }: AdvancedStatsProps) {
  const stats = useMemo<ComputedStats | null>(() => {
    if (!snaps || snaps.length < 2) return null;

    const navs: number[] = snaps.map(s => s.nav);
    const returns: number[] = [];
    for (let i = 1; i < navs.length; i++) {
      if (navs[i - 1] > 0) returns.push((navs[i] - navs[i - 1]) / navs[i - 1]);
    }
    if (!returns.length) return null;

    const tradingDays = returns.length;
    const firstNav = navs[0];
    const lastNav = navs[navs.length - 1];
    const totalReturn = (lastNav / firstNav - 1) * 100;
    const annFactor = tradingDays > 0 ? 252 / tradingDays : 1;
    const annReturn = ((1 + totalReturn / 100) ** annFactor - 1) * 100;

    const meanDaily = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - meanDaily) ** 2, 0) / returns.length;
    const dailyVol = Math.sqrt(variance);
    const annVol = dailyVol * Math.sqrt(252) * 100;

    const sharpe = annVol > 0 ? annReturn / annVol : 0;

    const downReturns = returns.filter(r => r < 0);
    const downVar = downReturns.length > 0
      ? downReturns.reduce((s, r) => s + r ** 2, 0) / downReturns.length
      : 0;
    const downDev = Math.sqrt(downVar) * Math.sqrt(252) * 100;
    const sortino = downDev > 0 ? annReturn / downDev : 0;

    let peak = firstNav;
    let maxDd = 0;
    let ddStart = snaps[0].date;
    let ddEnd = snaps[0].date;
    let tempStart = snaps[0].date;
    for (let i = 0; i < navs.length; i++) {
      const nav = navs[i];
      if (nav > peak) {
        peak = nav;
        tempStart = snaps[i].date;
      }
      const dd = (nav - peak) / peak;
      if (dd < maxDd) {
        maxDd = dd;
        ddStart = tempStart;
        ddEnd = snaps[i].date;
      }
    }

    const upDays = returns.filter(r => r > 0).length;
    const downDays = returns.filter(r => r < 0).length;
    const winRate = tradingDays > 0 ? (upDays / tradingDays) * 100 : 0;
    const avgWin = upDays > 0 ? (returns.filter(r => r > 0).reduce((a, b) => a + b, 0) / upDays) * 100 : 0;
    const avgLoss = downDays > 0 ? (downReturns.reduce((a, b) => a + b, 0) / downDays) * 100 : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin * upDays / (avgLoss * downDays)) : 0;

    const calmar = maxDd !== 0 ? annReturn / (Math.abs(maxDd) * 100) : 0;
    const bestDay = Math.max(...returns) * 100;
    const worstDay = Math.min(...returns) * 100;
    const currDd = peak > 0 ? ((lastNav - peak) / peak) * 100 : 0;

    let beta: number | null = null;
    let correlation: number | null = null;
    let alphaAnn: number | null = null;
    let trackingError: number | null = null;
    let infoRatio: number | null = null;

    const spyHist = benchmarks?.SPY?.history || [];
    if (spyHist.length > 1) {
      const spyMap: Record<string, number> = {};
      spyHist.forEach(h => { spyMap[h.date] = h.price; });
      const pairedReturns: { port: number; spy: number }[] = [];
      for (let i = 1; i < snaps.length; i++) {
        const d = snaps[i].date;
        const dPrev = snaps[i - 1].date;
        const currNav = navs[i];
        const prevNav = navs[i - 1];
        if (spyMap[d] != null && spyMap[dPrev] != null && spyMap[dPrev] > 0 && prevNav > 0) {
          pairedReturns.push({
            port: (currNav - prevNav) / prevNav,
            spy: (spyMap[d] - spyMap[dPrev]) / spyMap[dPrev],
          });
        }
      }
      if (pairedReturns.length > 5) {
        const pMean = pairedReturns.reduce((a, b) => a + b.port, 0) / pairedReturns.length;
        const sMean = pairedReturns.reduce((a, b) => a + b.spy, 0) / pairedReturns.length;
        let cov = 0, sVar = 0;
        pairedReturns.forEach(r => {
          cov += (r.port - pMean) * (r.spy - sMean);
          sVar += (r.spy - sMean) ** 2;
        });
        cov /= pairedReturns.length;
        sVar /= pairedReturns.length;
        beta = sVar > 0 ? cov / sVar : 0;

        const pStd = Math.sqrt(pairedReturns.reduce((a, b) => a + (b.port - pMean) ** 2, 0) / pairedReturns.length);
        const sStd = Math.sqrt(sVar);
        correlation = pStd > 0 && sStd > 0 ? cov / (pStd * sStd) : 0;
        alphaAnn = (pMean * 252 - beta * sMean * 252) * 100;

        const diffs = pairedReturns.map(r => r.port - r.spy);
        const diffMean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const diffVar = diffs.reduce((s, d) => s + (d - diffMean) ** 2, 0) / diffs.length;
        trackingError = Math.sqrt(diffVar) * Math.sqrt(252) * 100;
        infoRatio = trackingError > 0 ? (diffMean * 252 * 100) / trackingError : 0;
      }
    }

    return {
      tradingDays, totalReturn, annReturn, annVol, sharpe, sortino,
      maxDd: maxDd * 100, ddStart, ddEnd, currDd,
      winRate, upDays, downDays, avgWin, avgLoss, profitFactor,
      calmar, bestDay, worstDay,
      beta, correlation, alphaAnn, trackingError, infoRatio,
    };
  }, [snaps, benchmarks]);

  if (!stats) {
    return <div className="px-6 py-8 text-center text-text-muted text-sm">Insufficient data for advanced statistics</div>;
  }

  const fPct = (v: number) => v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '—';
  const fNum = (v: number) => v != null ? v.toFixed(2) : '—';
  const pcol = (v: number | null | undefined) => v != null ? (v >= 0 ? 'text-fin-green' : 'text-fin-red') : '';

  return (
    <div className="px-6 pb-6 space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Returns</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Return" value={stats.totalReturn} fmt={fPct} color={pcol(stats.totalReturn)} />
          <MetricCard label="Annualized Return" value={stats.annReturn} fmt={fPct} color={pcol(stats.annReturn)} />
          <MetricCard label="Best Day" value={stats.bestDay} fmt={fPct} color="text-fin-green" />
          <MetricCard label="Worst Day" value={stats.worstDay} fmt={fPct} color="text-fin-red" />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Risk</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Ann. Volatility" value={stats.annVol} fmt={fPct} />
          <MetricCard label="Max Drawdown" value={stats.maxDd} fmt={fPct} color="text-fin-red" sub={`${stats.ddStart} → ${stats.ddEnd}`} />
          <MetricCard label="Current Drawdown" value={stats.currDd} fmt={fPct} color={pcol(stats.currDd)} />
          <MetricCard label="Trading Days" value={stats.tradingDays} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Risk-Adjusted</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Sharpe Ratio" value={stats.sharpe} fmt={fNum} sub="Rf = 0%" />
          <MetricCard label="Sortino Ratio" value={stats.sortino} fmt={fNum} sub="Downside deviation" />
          <MetricCard label="Calmar Ratio" value={stats.calmar} fmt={fNum} sub="Return / MaxDD" />
          <MetricCard label="Profit Factor" value={stats.profitFactor} fmt={fNum} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Win / Loss</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Win Rate" value={stats.winRate} fmt={fPct} />
          <MetricCard label="Up Days" value={stats.upDays} />
          <MetricCard label="Avg Win" value={stats.avgWin} fmt={fPct} color="text-fin-green" />
          <MetricCard label="Avg Loss" value={stats.avgLoss} fmt={fPct} color="text-fin-red" />
        </div>
      </div>

      {stats.beta != null && (
        <div>
          <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">vs SPY</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Beta" value={stats.beta} fmt={fNum} />
            <MetricCard label="Correlation" value={stats.correlation} fmt={fNum} />
            <MetricCard label="Alpha (ann.)" value={stats.alphaAnn} fmt={fPct} color={pcol(stats.alphaAnn)} />
            <MetricCard label="Info Ratio" value={stats.infoRatio} fmt={fNum} sub={`TE: ${stats.trackingError?.toFixed(2)}%`} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */

const BENCH_COLORS: Record<string, string> = {
  SPY: '#a1a1aa', QQQ: '#8b5cf6', TLT: '#06b6d4', GLD: '#f59e0b', IWM: '#f472b6',
};

export default function PerformancePage() {
  const { data, loading, error } = useDashboard();
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['SPY']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const positions = useMemo(() => data?.positions ?? [], [data]);
  const benchmarks = useMemo(() => data?.benchmarks ?? {}, [data]);
  const metrics = data?.calculated;
  const snaps = useMemo(() => data?.portfolio?.snapshots ?? [], [data]);
  const latestNav = snaps.length ? snaps[snaps.length - 1].nav : 100;
  const dailyRet = dayReturn(snaps);
  const availBenchmarks = useMemo(() => Object.keys(benchmarks), [benchmarks]);

  const chartData = useMemo<PerfChartPoint[]>(() => {
    const snapMap: Record<string, number | null> = {};
    snaps.forEach(s => { snapMap[s.date] = s.nav; });

    const dateSet = new Set(snaps.map(s => s.date));
    if (showBenchmarks) {
      selectedBenchmarks.forEach(b => {
        (benchmarks[b]?.history || []).forEach(h => dateSet.add(h.date));
      });
    }
    const allDates = [...dateSet].sort();

    const bases: Record<string, number> = {};
    if (showBenchmarks) {
      selectedBenchmarks.forEach(b => {
        const hist = benchmarks[b]?.history || [];
        if (hist.length) bases[b] = hist[0].price;
      });
    }

    const benchMaps: Record<string, Record<string, number>> = {};
    if (showBenchmarks) {
      selectedBenchmarks.forEach(b => {
        const m: Record<string, number> = {};
        (benchmarks[b]?.history || []).forEach(h => { m[h.date] = h.price; });
        benchMaps[b] = m;
      });
    }

    return allDates.map(d => {
      const row: PerfChartPoint = { date: d, portfolio: snapMap[d] ?? null };
      if (showBenchmarks) {
        selectedBenchmarks.forEach(b => {
          const p = benchMaps[b]?.[d];
          row[b] = p != null && bases[b] ? +((p / bases[b]) * 100).toFixed(2) : null;
        });
      }
      return row;
    });
  }, [snaps, benchmarks, showBenchmarks, selectedBenchmarks]);

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data || !metrics) return <div className="flex items-center justify-center h-screen text-fin-red">{error || 'Failed to load'}</div>;

  const toggleBenchmark = (b: string) => {
    setSelectedBenchmarks(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    );
  };

  return (
    <>
      <PageHeader title="Performance" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio NAV"
            value={fmtNav(latestNav)}
            icon={TrendingUp} iconColor="text-fin-blue"
            subtitle="Base 100"
          />
          <StatCard
            label="Total Return"
            value={formatPct(metrics.portfolio_pnl)}
            valueClass={pnlColor(metrics.portfolio_pnl)}
            icon={BarChart3} iconColor="text-fin-green"
            subtitle="Since inception"
          />
          <StatCard
            label="Daily P&L"
            value={dailyRet != null ? formatPct(dailyRet) : '—'}
            valueClass={pnlColor(dailyRet)}
            icon={Activity} iconColor="text-fin-amber"
            subtitle="Last trading day"
          />
          <StatCard
            label="Active Positions"
            value={positions.length}
            icon={Target} iconColor="text-fin-purple"
          />
        </div>

        {/* NAV Chart */}
        <div className="glass-card p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">Portfolio NAV</h3>
            <button
              onClick={() => setShowBenchmarks(!showBenchmarks)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-border-subtle hover:border-fin-blue transition-colors text-text-secondary hover:text-text-primary"
            >
              {showBenchmarks ? <EyeOff size={14} /> : <Eye size={14} />}
              {showBenchmarks ? 'Hide Comparables' : 'Show Comparables'}
            </button>
          </div>

          {showBenchmarks && (
            <div className="flex flex-wrap gap-2 mb-4">
              {availBenchmarks.map(b => {
                const active = selectedBenchmarks.includes(b);
                return (
                  <button key={b} onClick={() => toggleBenchmark(b)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-semibold tracking-wide ${
                      active
                        ? 'border-fin-blue bg-fin-blue/15 text-fin-blue'
                        : 'border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-glow'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}

          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(d: string) => d?.slice(5)} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '0.85rem' }}
                  formatter={(val: number, name: string) => [`${Number(val).toFixed(2)}`, name]}
                />
                <Legend />
                <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke="#3B82F6" fill="rgba(59,130,246,0.08)" strokeWidth={2} dot={false} connectNulls />
                {showBenchmarks && selectedBenchmarks.map(b => (
                  <Line key={b} type="monotone" dataKey={b} name={b} stroke={BENCH_COLORS[b] || '#a1a1aa'} strokeDasharray="5 5" strokeWidth={1.5} dot={false} connectNulls />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Position P&L Table */}
        <PositionPnlTable positions={positions} />

        {/* Advanced Statistics */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <h3 className="text-lg font-semibold">Advanced Statistics</h3>
            {showAdvanced ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
          </button>
          {showAdvanced && <AdvancedStats metrics={metrics} snaps={snaps} benchmarks={benchmarks} />}
        </div>
      </div>
    </>
  );
}
