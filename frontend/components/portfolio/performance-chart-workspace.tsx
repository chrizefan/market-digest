'use client';

import { useMemo, useState } from 'react';
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
import type { NavChartPoint, PerfChartPoint } from '@/lib/types';
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

function lineColorForTicker(t: string): string {
  if (BENCH_COLORS[t]) return BENCH_COLORS[t];
  let h = 0;
  for (let i = 0; i < t.length; i++) {
    h = t.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 62% 58%)`;
}

const VIEW_OPTIONS: { id: PerformanceChartView; label: string; hint: string }[] = [
  { id: 'nav', label: 'NAV & comparables', hint: 'Portfolio vs any symbol in price_history' },
  { id: 'daily_returns', label: 'Daily returns + NAV', hint: 'Bar = day %, line = cumulative NAV (100 base)' },
  { id: 'drawdown', label: 'Drawdown', hint: 'Underwater % from running peak' },
  { id: 'allocation', label: 'Weights (snapshot)', hint: 'Current book by ticker' },
  { id: 'cash', label: 'Cash vs invested', hint: 'From nav history when present' },
  { id: 'rolling', label: 'Rolling risk', hint: '21-day Sharpe & ann. vol' },
];

function NavComparableChart({
  data,
  comparableKeys,
}: {
  data: PerfChartPoint[];
  comparableKeys: string[];
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
        {comparableKeys.map((b) => (
          <Line
            key={b}
            type="monotone"
            dataKey={b}
            name={b}
            stroke={lineColorForTicker(b)}
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

function ComparablePicker({
  universe,
  selected,
  maxComparables,
  onAdd,
  onRemove,
  loading,
  error,
}: {
  universe: string[];
  selected: string[];
  maxComparables: number;
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const qq = q.trim().toUpperCase();
    if (!qq) return universe;
    return universe.filter((t) => t.includes(qq));
  }, [universe, q]);

  const list = filtered.length > 180 ? filtered.slice(0, 180) : filtered;
  const truncated = filtered.length > 180;

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-fin-red leading-snug">{error}</p>}
      {loading && (
        <p className="text-xs text-text-muted animate-pulse">Loading closes from price_history…</p>
      )}

      <div>
        <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Active comparables ({selected.length}/{maxComparables})
        </span>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {selected.length === 0 && (
            <span className="text-xs text-text-muted">None — add at least one ticker below.</span>
          )}
          {selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-fin-blue/10 text-fin-blue border-fin-blue/35"
            >
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                className="hover:text-white opacity-80 hover:opacity-100 leading-none"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
          Search & add from price_history
        </label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type ticker (e.g. SPY, QQQ)…"
          className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-fin-blue/50"
          autoComplete="off"
        />
      </div>

      <div className="max-h-44 overflow-y-auto rounded-lg border border-border-subtle bg-bg-secondary/40 p-1">
        {list.length === 0 ? (
          <p className="text-xs text-text-muted px-2 py-3 text-center">No matches.</p>
        ) : (
          list.map((t) => {
            const on = selected.includes(t);
            const atCap = selected.length >= maxComparables;
            return (
              <button
                key={t}
                type="button"
                onClick={() => (on ? onRemove(t) : onAdd(t))}
                disabled={!on && atCap}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                  on
                    ? 'bg-fin-blue/20 text-fin-blue'
                    : atCap
                      ? 'text-text-muted cursor-not-allowed opacity-50'
                      : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary'
                }`}
              >
                {t}
                {on ? ' · selected' : atCap ? ' · max reached' : ''}
              </button>
            );
          })
        )}
      </div>
      {truncated && (
        <p className="text-[10px] text-text-muted">Showing first 180 matches — refine search to see more.</p>
      )}
    </div>
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

const MAX_COMPARABLES = 8;

export function PerformanceChartWorkspace({
  view,
  onViewChange,
  chartData,
  selectedComparables,
  onAddComparable,
  onRemoveComparable,
  tickerUniverse,
  comparableLoading,
  comparableError,
  snaps,
  drawdownData,
  rollingData,
  positions,
}: {
  view: PerformanceChartView;
  onViewChange: (v: PerformanceChartView) => void;
  chartData: PerfChartPoint[];
  selectedComparables: string[];
  onAddComparable: (ticker: string) => void;
  onRemoveComparable: (ticker: string) => void;
  tickerUniverse: string[];
  comparableLoading: boolean;
  comparableError: string | null;
  snaps: NavChartPoint[];
  drawdownData: Array<{ date: string; drawdown: number }>;
  rollingData: Array<{ date: string; sharpe: number | null; volAnn: number | null }>;
  positions: Position[];
}) {
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
            <ComparablePicker
              universe={tickerUniverse}
              selected={selectedComparables}
              maxComparables={MAX_COMPARABLES}
              onAdd={onAddComparable}
              onRemove={onRemoveComparable}
              loading={comparableLoading}
              error={comparableError}
            />
          </div>
        )}
      </div>

      <div className="p-4">
        {view === 'nav' && (
          <>
            <p className="text-text-muted text-xs mb-3 leading-relaxed">
              Portfolio and each comparable are indexed to <strong className="text-text-secondary">100</strong> on the
              first day of the range. Series are loaded live from <code className="text-text-secondary">price_history</code>{' '}
              for your selection (SPY by default when available).
            </p>
            <div className="h-[400px] w-full">
              <NavComparableChart data={chartData} comparableKeys={selectedComparables} />
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
