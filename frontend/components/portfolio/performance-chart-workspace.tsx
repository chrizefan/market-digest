'use client';

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
  Bar,
  BarChart,
  Cell,
} from 'recharts';
import type { BenchmarkHistoryMap, NavChartPoint, PerfChartPoint } from '@/lib/types';
import type { Position } from '@/lib/types';
import { PerformanceDrawdownChart } from '@/components/portfolio/performance-drawdown-chart';
import { PerformanceCashInvestedChart } from '@/components/portfolio/performance-cash-invested-chart';
import { PerformanceRollingChart } from '@/components/portfolio/performance-rolling-chart';
import type { PerformanceChartView } from '@/lib/performance-series';
import { buildDailyReturnsWithNavIndex } from '@/lib/performance-series';

const BENCH_COLORS: Record<string, string> = {
  SPY: '#a1a1aa',
  QQQ: '#8b5cf6',
  IWM: '#f472b6',
  EEM: '#22c55e',
  TLT: '#06b6d4',
  GLD: '#f59e0b',
  IBIT: '#f97316',
};

const VIEW_OPTIONS: { id: PerformanceChartView; label: string; hint: string }[] = [
  { id: 'nav', label: 'NAV & comparables', hint: 'Portfolio vs ETFs (indexed to window start)' },
  { id: 'daily_returns', label: 'Daily returns + NAV', hint: 'Bar = day %, line = cumulative NAV (100 base)' },
  { id: 'drawdown', label: 'Drawdown', hint: 'Underwater % from running peak' },
  { id: 'allocation', label: 'Weights (snapshot)', hint: 'Current book by ticker' },
  { id: 'cash', label: 'Cash vs invested', hint: 'From nav history when present' },
  { id: 'rolling', label: 'Rolling risk', hint: '21-day Sharpe & ann. vol' },
];

function NavComparableChart({
  data,
  benchmarkKeys,
}: {
  data: PerfChartPoint[];
  benchmarkKeys: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(d: string) => d?.slice(5)}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          domain={['auto', 'auto']}
          label={{
            value: 'Indexed (100 = window start)',
            angle: -90,
            position: 'insideLeft',
            fill: '#71717a',
            fontSize: 10,
          }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
          formatter={(val: number, name: string) => {
            if (val == null || Number.isNaN(Number(val))) return ['—', name];
            return [`${Number(val).toFixed(2)}`, name];
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="portfolio"
          name="Portfolio NAV"
          stroke="#3B82F6"
          fill="rgba(59,130,246,0.12)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        {benchmarkKeys.map((b) => (
          <Line
            key={b}
            type="monotone"
            dataKey={b}
            name={b}
            stroke={BENCH_COLORS[b] || '#94a3b8'}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function DailyReturnsComboChart({ snaps }: { snaps: NavChartPoint[] }) {
  const data = buildDailyReturnsWithNavIndex(snaps);
  if (data.length < 2) {
    return (
      <div className="h-full min-h-[280px] flex items-center justify-center text-text-muted text-sm">
        Need at least two NAV points in this range.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(d: string) => d?.slice(5)}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
          label={{ value: 'Daily %', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#71717a', fontSize: 11 }}
          domain={['auto', 'auto']}
          label={{
            value: 'NAV index',
            angle: 90,
            position: 'insideRight',
            fill: '#71717a',
            fontSize: 10,
          }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="dailyPct" name="Daily return %" maxBarSize={16} radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.dailyPct == null
                  ? '#3f3f46'
                  : entry.dailyPct >= 0
                    ? 'rgba(34,197,94,0.75)'
                    : 'rgba(239,68,68,0.75)'
              }
            />
          ))}
        </Bar>
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="navIndex"
          name="NAV (indexed)"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function AllocationBarChart({ positions }: { positions: Position[] }) {
  const rows = [...positions]
    .filter((p) => (p.weight_actual ?? 0) > 0)
    .map((p) => ({ name: p.ticker, weight: p.weight_actual ?? 0 }))
    .sort((a, b) => b.weight - a.weight);
  if (!rows.length) {
    return (
      <div className="h-full min-h-[280px] flex items-center justify-center text-text-muted text-sm">
        No positions to chart.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={rows}
        margin={{ left: 48, right: 16, top: 8, bottom: 8 }}
      >
        <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={44} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
          formatter={(v: number) => [`${Number(v).toFixed(1)}%`, 'Weight']}
        />
        <Bar dataKey="weight" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Weight %" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceChartWorkspace({
  view,
  onViewChange,
  chartData,
  selectedBenchmarks,
  onToggleBenchmark,
  availBenchmarks,
  snaps,
  benchmarks,
  drawdownData,
  rollingData,
  positions,
}: {
  view: PerformanceChartView;
  onViewChange: (v: PerformanceChartView) => void;
  chartData: PerfChartPoint[];
  selectedBenchmarks: string[];
  onToggleBenchmark: (ticker: string) => void;
  availBenchmarks: string[];
  snaps: NavChartPoint[];
  benchmarks: BenchmarkHistoryMap;
  drawdownData: Array<{ date: string; drawdown: number }>;
  rollingData: Array<{ date: string; sharpe: number | null; volAnn: number | null }>;
  positions: Position[];
}) {
  const benchWithData = availBenchmarks.filter(
    (b) => (benchmarks[b]?.history?.length ?? 0) > 1
  );

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-border-subtle bg-bg-secondary/60 space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Chart</span>
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onViewChange(opt.id)}
                title={opt.hint}
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors max-w-[200px] ${
                  view === opt.id
                    ? 'border-fin-blue bg-fin-blue/15 text-fin-blue'
                    : 'border-border-subtle text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                }`}
              >
                <span className="block">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {view === 'nav' && (
          <div className="pt-2 border-t border-border-subtle/80">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                Comparables (indexed like portfolio)
              </span>
              <span className="text-[10px] text-text-muted">
                From price_history · no data = line may be sparse
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {benchWithData.length === 0 && (
                <span className="text-xs text-amber-400/90">
                  No benchmark series loaded. Sync tickers in price_history (see benchmark-tickers.ts).
                </span>
              )}
              {benchWithData.map((b) => {
                const on = selectedBenchmarks.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onToggleBenchmark(b)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold tracking-wide transition-colors ${
                      on
                        ? 'border-fin-blue bg-fin-blue/15 text-fin-blue'
                        : 'border-border-subtle text-text-muted hover:text-text-secondary'
                    }`}
                    style={on ? { borderColor: `${BENCH_COLORS[b] || '#60a5fa'}66` } : undefined}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {view === 'nav' && (
          <>
            <p className="text-text-muted text-xs mb-3 leading-relaxed">
              Portfolio NAV and each comparable are re-based to <strong className="text-text-secondary">100</strong>{' '}
              on the first day of this range so you can compare shape and magnitude. Toggle ETFs above; SPY &amp; QQQ
              are on by default when data exists.
            </p>
            <div className="h-[400px] w-full">
              <NavComparableChart
                data={chartData}
                benchmarkKeys={selectedBenchmarks.filter((b) => benchWithData.includes(b))}
              />
            </div>
          </>
        )}

        {view === 'daily_returns' && (
          <>
            <p className="text-text-muted text-xs mb-3">
              Green / red bars are single-day portfolio returns; blue line is cumulative NAV indexed to 100 at the
              start of the range.
            </p>
            <div className="h-[400px] w-full">
              <DailyReturnsComboChart snaps={snaps} />
            </div>
          </>
        )}

        {view === 'drawdown' && (
          <div className="h-[400px] w-full">
            <PerformanceDrawdownChart data={drawdownData} />
          </div>
        )}

        {view === 'allocation' && (
          <>
            <p className="text-text-muted text-xs mb-3">Current weights from the latest position snapshot.</p>
            <div className="h-[400px] w-full">
              <AllocationBarChart positions={positions} />
            </div>
          </>
        )}

        {view === 'cash' && (
          <div className="h-[400px] w-full">
            <PerformanceCashInvestedChart snaps={snaps} />
          </div>
        )}

        {view === 'rolling' && (
          <>
            <p className="text-text-muted text-xs mb-3">Sharpe uses Rf = 0; vol is annualized.</p>
            <div className="h-[400px] w-full">
              <PerformanceRollingChart data={rollingData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
