'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchPositionPriceChart } from '@/lib/queries';
import { buildPositionContributionToNavSeries, type PositionContributionPoint } from '@/lib/position-contribution-series';
import type { NavChartPoint, PositionHistoryRow, PositionPriceChartData, PositionPriceChartEvent } from '@/lib/types';

function subtractIsoDays(iso: string, days: number): string {
  const parts = iso.split('-').map(Number);
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const t = Date.UTC(y, m - 1, d);
  const next = new Date(t - days * 86400000);
  return next.toISOString().slice(0, 10);
}

const ENTRY_PADDING_DAYS = 45;
const FALLBACK_LOOKBACK_DAYS = 730;

function eventDotColor(ev: PositionPriceChartEvent['event']): string {
  if (ev === 'OPEN') return '#22c55e';
  if (ev === 'EXIT') return '#ef4444';
  if (ev === 'REBALANCE') return '#60a5fa';
  return '#71717a';
}

function eventLabelClass(ev: PositionPriceChartEvent['event']): string {
  if (ev === 'OPEN') return 'text-fin-green';
  if (ev === 'EXIT') return 'text-fin-red';
  if (ev === 'REBALANCE') return 'text-fin-blue';
  return 'text-text-muted';
}

function rowOnOrAfter(rows: PositionContributionPoint[], iso: string): PositionContributionPoint | null {
  const exact = rows.find((r) => r.date === iso);
  if (exact) return exact;
  return rows.find((r) => r.date >= iso) ?? null;
}

type ScatterRow = PositionContributionPoint & {
  event: PositionPriceChartEvent['event'];
  markPrice: number | null;
  weight_pct: number | null;
  prev_weight_pct: number | null;
  weight_change_pct: number | null;
  reason: string | null;
};

function ContribTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PositionContributionPoint & Partial<ScatterRow> }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if ('event' in p && p.event) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[0.82rem] shadow-lg max-w-xs">
        <p className={`font-mono font-semibold ${eventLabelClass(p.event)}`}>
          {p.event}
        </p>
        <p className="text-text-secondary mt-1 font-mono">{p.date}</p>
        <p className="text-text-primary tabular-nums mt-0.5">Cumulative: {p.cumPp.toFixed(2)} pp</p>
        {p.weight_pct != null ? (
          <p className="text-text-muted mt-1 tabular-nums">Weight after: {p.weight_pct.toFixed(2)}%</p>
        ) : null}
        {p.reason ? <p className="text-text-muted mt-1.5 text-[11px] leading-snug">{p.reason}</p> : null}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[0.82rem] shadow-lg">
      <p className="font-mono text-text-secondary">{p.date}</p>
      <p className="text-text-primary tabular-nums mt-0.5">Cumulative: {p.cumPp.toFixed(2)} pp</p>
      <p className="text-text-muted tabular-nums text-[11px] mt-1">Step: {p.dailyPp.toFixed(3)} pp</p>
    </div>
  );
}

function ChartBody({
  ticker,
  rangeStart,
  rangeLabel,
  firstEntryDate,
  navSnaps,
  positionHistory,
  anchorDate,
}: {
  ticker: string;
  rangeStart: string;
  rangeLabel: string;
  firstEntryDate: string | null;
  navSnaps: NavChartPoint[];
  positionHistory: PositionHistoryRow[];
  anchorDate: string;
}) {
  const [data, setData] = useState<PositionPriceChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [brushStart, setBrushStart] = useState(0);
  const [brushEnd, setBrushEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetchPositionPriceChart(ticker, rangeStart)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null);
          setErr(e instanceof Error ? e.message : 'Failed to load chart');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker, rangeStart]);

  const chartRows = useMemo<PositionContributionPoint[]>(() => {
    if (!data?.priceHistory?.length) return [];
    const navFiltered = navSnaps
      .filter((s) => s.date >= rangeStart && s.date <= anchorDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    return buildPositionContributionToNavSeries(
      navFiltered,
      positionHistory,
      ticker,
      data.priceHistory.map((p) => ({ date: p.date, close: p.close }))
    );
  }, [data?.priceHistory, navSnaps, positionHistory, ticker, rangeStart, anchorDate]);

  useEffect(() => {
    if (!chartRows.length) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setBrushStart(0);
    setBrushEnd(chartRows.length - 1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [chartRows]);

  const visibleRows = useMemo(() => {
    if (!chartRows.length) return [];
    const end = Math.min(brushEnd, chartRows.length - 1);
    const start = Math.max(0, Math.min(brushStart, end));
    return chartRows.slice(start, end + 1);
  }, [chartRows, brushStart, brushEnd]);

  const markers = useMemo(() => {
    const evs = (data?.events ?? []).filter((e) => e.event !== 'HOLD');
    if (!chartRows.length) return [] as ScatterRow[];
    const first = chartRows[0].date;
    const last = chartRows[chartRows.length - 1].date;
    const inRange = evs.filter((e) => e.date >= first && e.date <= last);
    return inRange
      .map((ev) => {
        const tr = rowOnOrAfter(chartRows, ev.date);
        if (!tr) return null;
        const row: ScatterRow = {
          ...tr,
          event: ev.event,
          markPrice: ev.price,
          weight_pct: ev.weight_pct,
          prev_weight_pct: ev.prev_weight_pct,
          weight_change_pct: ev.weight_change_pct,
          reason: ev.reason,
        };
        return row;
      })
      .filter((x): x is ScatterRow => x != null);
  }, [data?.events, chartRows]);

  const scatterInView = useMemo(() => {
    if (!visibleRows.length || !markers.length) return [] as ScatterRow[];
    const d0 = visibleRows[0].date;
    const d1 = visibleRows[visibleRows.length - 1].date;
    return markers.filter((m) => m.date >= d0 && m.date <= d1);
  }, [visibleRows, markers]);

  const onBrushChange = useCallback((e: { startIndex?: number; endIndex?: number }) => {
    if (e.startIndex !== undefined) setBrushStart(e.startIndex);
    if (e.endIndex !== undefined) setBrushEnd(e.endIndex);
  }, []);

  const resetView = useCallback(() => {
    if (!chartRows.length) return;
    setBrushStart(0);
    setBrushEnd(chartRows.length - 1);
  }, [chartRows]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartRows.length) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const n = chartRows.length;
      if (n < 2) return;
      let start = Math.max(0, Math.min(brushStart, brushEnd));
      let end = Math.max(start, Math.min(n - 1, Math.max(brushStart, brushEnd)));
      const span = end - start + 1;
      const mid = (start + end) / 2;

      e.preventDefault();

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const step = Math.max(1, Math.floor(span * 0.12));
        const dir = e.deltaX > 0 ? 1 : -1;
        let ns = start + dir * step;
        let ne = ns + span - 1;
        if (ns < 0) {
          ne -= ns;
          ns = 0;
        }
        if (ne > n - 1) {
          ns -= ne - (n - 1);
          ne = n - 1;
        }
        if (ns < 0) ns = 0;
        setBrushStart(ns);
        setBrushEnd(ne);
        return;
      }

      const zoomIn = e.deltaY < 0;
      let newSpan = zoomIn ? Math.max(5, Math.floor(span * 0.88)) : Math.min(n, Math.ceil(span * 1.12));
      newSpan = Math.max(3, Math.min(n, newSpan));
      let newStart = Math.round(mid - newSpan / 2);
      let newEnd = newStart + newSpan - 1;
      if (newStart < 0) {
        newEnd -= newStart;
        newStart = 0;
      }
      if (newEnd > n - 1) {
        newStart -= newEnd - (n - 1);
        newEnd = n - 1;
      }
      if (newStart < 0) newStart = 0;
      setBrushStart(newStart);
      setBrushEnd(newEnd);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [chartRows, brushStart, brushEnd]);

  const entryLineDate = useMemo(() => {
    if (!firstEntryDate || !visibleRows.length) return null;
    const a = visibleRows[0].date;
    const b = visibleRows[visibleRows.length - 1].date;
    if (firstEntryDate < a || firstEntryDate > b) return null;
    return rowOnOrAfter(visibleRows, firstEntryDate)?.date ?? null;
  }, [firstEntryDate, visibleRows]);

  const chartEnd = chartRows.length ? chartRows[chartRows.length - 1].date : null;

  if (loading) {
    return (
      <div className="h-[240px] rounded-xl border border-border-subtle bg-bg-secondary/30 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading series…
      </div>
    );
  }
  if (err) {
    return (
      <div className="h-[200px] rounded-xl border border-border-subtle bg-bg-secondary/30 flex items-center justify-center text-xs text-fin-red px-4 text-center">
        {err}
      </div>
    );
  }
  if (!chartRows.length) {
    return (
      <div className="h-[160px] rounded-xl border border-border-subtle bg-bg-secondary/30 flex items-center justify-center text-xs text-text-muted px-4 text-center">
        Not enough overlapping NAV steps and price history to plot contribution.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-border-subtle bg-bg-secondary/20 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3 pb-1">
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-wider">Contribution to portfolio</p>
          <p className="text-sm font-medium text-text-primary mt-0.5">
            <span className="font-mono text-fin-blue">{ticker}</span>
            <span className="text-text-muted font-normal"> · </span>
            <span className="text-text-secondary text-xs font-mono">{rangeLabel}</span>
          </p>
          {chartEnd ? (
            <p className="text-[10px] text-text-muted mt-1 font-mono">
              {chartRows[0].date} → {chartEnd}
            </p>
          ) : null}
          <p className="text-[10px] text-text-muted mt-1 max-w-xl leading-snug">
            Cumulative attributed return (pp) from this holding (weight × asset return between NAV snapshots). Events
            align to the contribution path.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={resetView}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-border-subtle text-text-secondary hover:bg-white/[0.04] hover:text-text-primary transition-colors"
          >
            Fit all
          </button>
          <p className="text-[10px] text-text-muted text-right max-w-[220px] leading-snug">
            Drag range below · Scroll zoom · Horizontal pan
          </p>
        </div>
      </div>

      <div className="h-[min(320px,42vh)] min-h-[220px] w-full px-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleRows} margin={{ top: 12, right: 14, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(d: string) => (d?.length >= 10 ? d.slice(5) : d)}
              minTickGap={32}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#71717a', fontSize: 11 }}
              width={56}
              tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(1) : String(v))}
              label={{
                value: 'pp vs portfolio',
                angle: -90,
                position: 'insideLeft',
                fill: '#71717a',
                fontSize: 10,
              }}
            />
            <Tooltip content={<ContribTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.12)' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
            {entryLineDate ? (
              <ReferenceLine
                x={entryLineDate}
                stroke="rgba(34,197,94,0.45)"
                strokeDasharray="4 4"
                label={{ value: 'Entry', fill: '#71717a', fontSize: 10 }}
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="cumPp"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="cumPp"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
              name="Cumulative pp"
              isAnimationActive={false}
            />
            <Scatter
              data={scatterInView}
              dataKey="cumPp"
              fill="#3b82f6"
              isAnimationActive={false}
              shape={(raw: unknown) => {
                const props = raw as { cx?: number; cy?: number; payload?: ScatterRow };
                const { cx, cy, payload } = props;
                if (cx == null || cy == null || !payload?.event) return <g />;
                const r = payload.event === 'REBALANCE' ? 4 : 5;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={eventDotColor(payload.event)}
                    stroke="#0a0a0a"
                    strokeWidth={1.5}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-16 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartRows} margin={{ top: 2, right: 14, left: 4, bottom: 2 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Line
              type="monotone"
              dataKey="cumPp"
              stroke="#3b82f666"
              dot={false}
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Brush
              dataKey="date"
              height={28}
              stroke="#3b82f6"
              fill="rgba(59,130,246,0.08)"
              travellerWidth={10}
              startIndex={brushStart}
              endIndex={brushEnd}
              onChange={onBrushChange}
              tickFormatter={(d: string) => (typeof d === 'string' && d.length >= 7 ? d.slice(5) : '')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function PositionContributionChart({
  ticker,
  anchorDate,
  firstEntryDate,
  navSnaps,
  positionHistory,
}: {
  ticker: string;
  anchorDate: string;
  firstEntryDate?: string | null;
  navSnaps: NavChartPoint[];
  positionHistory: PositionHistoryRow[];
}) {
  const rangeStart = useMemo(() => {
    if (firstEntryDate) return subtractIsoDays(firstEntryDate, ENTRY_PADDING_DAYS);
    return subtractIsoDays(anchorDate, FALLBACK_LOOKBACK_DAYS);
  }, [firstEntryDate, anchorDate]);

  const rangeLabel = useMemo(() => {
    if (firstEntryDate) return `Since first activity (−${ENTRY_PADDING_DAYS}d pad)`;
    return `${FALLBACK_LOOKBACK_DAYS}d lookback`;
  }, [firstEntryDate]);

  return (
    <ChartBody
      key={`${ticker}|${rangeStart}|contrib`}
      ticker={ticker}
      rangeStart={rangeStart}
      rangeLabel={rangeLabel}
      firstEntryDate={firstEntryDate ?? null}
      navSnaps={navSnaps}
      positionHistory={positionHistory}
      anchorDate={anchorDate}
    />
  );
}
