'use client';

import { useMemo, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { StatCard, formatPct, pnlColor } from '@/components/ui';
import {
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
} from 'recharts';
import type { NavChartPoint, PerfChartPoint } from '@/lib/types';
import { PositionPnlTable } from '@/components/portfolio/position-pnl-table';
import { AdvancedStatsPanel } from '@/components/portfolio/advanced-stats-panel';
import { PerformanceDateRange } from '@/components/portfolio/performance-date-range';
import { PerformanceDrawdownChart } from '@/components/portfolio/performance-drawdown-chart';
import { PerformanceCashInvestedChart } from '@/components/portfolio/performance-cash-invested-chart';
import { PerformanceRollingChart } from '@/components/portfolio/performance-rolling-chart';
import { ServerMetricsStrip } from '@/components/portfolio/server-metrics-strip';
import {
  filterByDateRange,
  parseDateRangeKey,
  buildDrawdownSeries,
  buildRollingSharpeVol,
  type DateRangeKey,
} from '@/lib/performance-series';

const BENCH_COLORS: Record<string, string> = {
  SPY: '#a1a1aa',
  QQQ: '#8b5cf6',
  TLT: '#06b6d4',
  GLD: '#f59e0b',
  IWM: '#f472b6',
};

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

function periodReturnPct(snaps: NavChartPoint[]): number | null {
  if (!snaps || snaps.length < 2) return null;
  const first = snaps[0].nav;
  const last = snaps[snaps.length - 1].nav;
  if (!first || first <= 0) return null;
  return ((last / first - 1) * 100);
}

function PerformanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const range = parseDateRangeKey(searchParams.get('range'));

  const setRange = useCallback(
    (k: DateRangeKey) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set('range', k);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const { data, loading, error } = useDashboard();
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['SPY']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const positions = useMemo(() => data?.positions ?? [], [data]);
  const positionHistory = useMemo(() => data?.position_history ?? [], [data]);
  const benchmarks = useMemo(() => data?.benchmarks ?? {}, [data]);
  const metrics = data?.calculated;
  const serverMetrics = data?.server_portfolio_metrics ?? null;
  const allSnaps = useMemo(() => data?.portfolio?.snapshots ?? [], [data]);

  const snaps = useMemo(() => filterByDateRange(allSnaps, range), [allSnaps, range]);

  const latestNav = snaps.length ? snaps[snaps.length - 1].nav : 100;
  const dailyRet = dayReturn(snaps);
  const rangeReturn = periodReturnPct(snaps);
  const availBenchmarks = useMemo(() => Object.keys(benchmarks), [benchmarks]);

  const chartData = useMemo<PerfChartPoint[]>(() => {
    const snapMap: Record<string, number | null> = {};
    snaps.forEach((s) => {
      snapMap[s.date] = s.nav;
    });

    const inceptionDate = snaps.length ? snaps[0].date : null;
    const dateSet = new Set(snaps.map((s) => s.date));
    if (showBenchmarks) {
      selectedBenchmarks.forEach((b) => {
        (benchmarks[b]?.history || [])
          .filter((h) => !inceptionDate || h.date >= inceptionDate)
          .forEach((h) => dateSet.add(h.date));
      });
    }
    const allDates = [...dateSet].filter((d) => !inceptionDate || d >= inceptionDate).sort();

    const bases: Record<string, number> = {};
    if (showBenchmarks) {
      selectedBenchmarks.forEach((b) => {
        const hist = (benchmarks[b]?.history || []).filter(
          (h) => !inceptionDate || h.date >= inceptionDate
        );
        if (hist.length) bases[b] = hist[0].price;
      });
    }

    const benchMaps: Record<string, Record<string, number>> = {};
    if (showBenchmarks) {
      selectedBenchmarks.forEach((b) => {
        const m: Record<string, number> = {};
        (benchmarks[b]?.history || [])
          .filter((h) => !inceptionDate || h.date >= inceptionDate)
          .forEach((h) => {
            m[h.date] = h.price;
          });
        benchMaps[b] = m;
      });
    }

    return allDates.map((d) => {
      const row: PerfChartPoint = { date: d, portfolio: snapMap[d] ?? null };
      if (showBenchmarks) {
        selectedBenchmarks.forEach((b) => {
          const p = benchMaps[b]?.[d];
          row[b] = p != null && bases[b] ? +((p / bases[b]) * 100).toFixed(2) : null;
        });
      }
      return row;
    });
  }, [snaps, benchmarks, showBenchmarks, selectedBenchmarks]);

  const positionWeightChartData = useMemo(() => {
    if (!positionHistory.length || !snaps.length) return [];
    const minD = snaps[0].date;
    const maxD = snaps[snaps.length - 1].date;
    const tickers = [...new Set(positions.map((p) => p.ticker))];
    const byDate: Record<string, Record<string, number>> = {};
    for (const row of positionHistory) {
      if (row.date < minD || row.date > maxD) continue;
      if (!tickers.includes(row.ticker)) continue;
      if (!byDate[row.date]) byDate[row.date] = {};
      byDate[row.date][row.ticker] = row.weight_pct;
    }
    return Object.keys(byDate)
      .sort()
      .map((date) => ({ date, ...byDate[date] }));
  }, [positionHistory, positions, snaps]);

  const drawdownData = useMemo(() => buildDrawdownSeries(snaps), [snaps]);
  const rollingData = useMemo(() => buildRollingSharpeVol(snaps, 21), [snaps]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>
    );
  if (error || !data || !metrics)
    return (
      <div className="flex items-center justify-center h-screen text-fin-red">
        {error || 'Failed to load'}
      </div>
    );

  const toggleBenchmark = (b: string) => {
    setSelectedBenchmarks((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const totalReturnLabel = range === 'itd' ? 'Since inception' : 'Selected range';
  const totalReturnValue =
    range === 'itd' ? formatPct(metrics.portfolio_pnl) : formatPct(rangeReturn);

  return (
    <>
      <PageHeader title="Performance" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">
            Charts and risk stats respect the selected window (benchmarks re-based to window start).
          </p>
          <PerformanceDateRange value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio NAV"
            value={fmtNav(latestNav)}
            icon={TrendingUp}
            iconColor="text-fin-blue"
            subtitle="End of range"
          />
          <StatCard
            label="Total Return"
            value={totalReturnValue}
            valueClass={pnlColor(range === 'itd' ? metrics.portfolio_pnl : rangeReturn)}
            icon={BarChart3}
            iconColor="text-fin-green"
            subtitle={totalReturnLabel}
          />
          <StatCard
            label="Daily P&L"
            value={dailyRet != null ? formatPct(dailyRet) : '—'}
            valueClass={pnlColor(dailyRet)}
            icon={Activity}
            iconColor="text-fin-amber"
            subtitle="Last day in range"
          />
          <StatCard
            label="Active Positions"
            value={positions.length}
            icon={Target}
            iconColor="text-fin-purple"
          />
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">Portfolio NAV</h3>
            <button
              type="button"
              onClick={() => setShowBenchmarks(!showBenchmarks)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-border-subtle hover:border-fin-blue transition-colors text-text-secondary hover:text-text-primary"
            >
              {showBenchmarks ? <EyeOff size={14} /> : <Eye size={14} />}
              {showBenchmarks ? 'Hide Comparables' : 'Show Comparables'}
            </button>
          </div>

          {showBenchmarks && (
            <div className="flex flex-wrap gap-2 mb-4">
              {availBenchmarks.map((b) => {
                const active = selectedBenchmarks.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBenchmark(b)}
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
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={(d: string) => d?.slice(5)}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                  formatter={(val: number, name: string) => [`${Number(val).toFixed(2)}`, name]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio"
                  stroke="#3B82F6"
                  fill="rgba(59,130,246,0.08)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                {showBenchmarks &&
                  selectedBenchmarks.map((b) => (
                    <Line
                      key={b}
                      type="monotone"
                      dataKey={b}
                      name={b}
                      stroke={BENCH_COLORS[b] || '#a1a1aa'}
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                    />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Drawdown (underwater)</h3>
            <div className="h-[260px]">
              <PerformanceDrawdownChart data={drawdownData} />
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Cash vs invested</h3>
            <div className="h-[260px]">
              <PerformanceCashInvestedChart snaps={snaps} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">Rolling risk (21 trading days)</h3>
          <p className="text-text-muted text-sm mb-4">Sharpe uses Rf = 0; vol is annualized.</p>
          <div className="h-[280px]">
            <PerformanceRollingChart data={rollingData} />
          </div>
        </div>

        <PositionPnlTable positions={positions} />

        {positionWeightChartData.length > 1 && positions.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Position weights (history in range)</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={positionWeightChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(d: string) => d?.slice(5)}
                  />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    }}
                    formatter={(val: number, name: string) => [`${Number(val).toFixed(1)}%`, name]}
                  />
                  <Legend />
                  {positions.map((p, i) => (
                    <Line
                      key={p.ticker}
                      type="monotone"
                      dataKey={p.ticker}
                      name={p.ticker}
                      stroke={
                        ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'][
                          i % 7
                        ]
                      }
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <h3 className="text-lg font-semibold">Advanced statistics</h3>
            {showAdvanced ? (
              <ChevronUp size={18} className="text-text-muted" />
            ) : (
              <ChevronDown size={18} className="text-text-muted" />
            )}
          </button>
          {showAdvanced && serverMetrics && <ServerMetricsStrip m={serverMetrics} />}
          {showAdvanced && <AdvancedStatsPanel snaps={snaps} benchmarks={benchmarks} />}
        </div>
      </div>
    </>
  );
}

export default function PerformanceInner() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-text-secondary">
          Loading…
        </div>
      }
    >
      <PerformanceContent />
    </Suspense>
  );
}
