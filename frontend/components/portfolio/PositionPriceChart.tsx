'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchPositionPriceChart } from '@/lib/queries';
import type { PositionPriceChartData, PositionPriceChartEvent } from '@/lib/types';

function eventDotColor(ev: PositionPriceChartEvent['event']): string {
  if (ev === 'OPEN') return '#22c55e';
  if (ev === 'EXIT') return '#ef4444';
  if (ev === 'REBALANCE') return '#60a5fa';
  return '#71717a';
}

function subtractIsoDays(iso: string, days: number): string {
  const parts = iso.split('-').map(Number);
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const t = Date.UTC(y, m - 1, d);
  const next = new Date(t - days * 86400000);
  return next.toISOString().slice(0, 10);
}

type Row = { date: string; close: number };

/** Map event to first trading row on/after event date (aligns marker to line). */
function rowOnOrAfter(rows: Row[], iso: string): Row | null {
  const exact = rows.find((r) => r.date === iso);
  if (exact) return exact;
  return rows.find((r) => r.date >= iso) ?? null;
}

const positionChartCache = new Map<string, PositionPriceChartData>();

const LOOKBACK_PRESETS: { label: string; days: number }[] = [
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: '2y', days: 730 },
  { label: '5y', days: 1825 },
];

type ScatterRow = Row & {
  event: PositionPriceChartEvent['event'];
  markPrice: number | null;
  weight_pct: number | null;
  prev_weight_pct: number | null;
  weight_change_pct: number | null;
  reason: string | null;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Row & Partial<ScatterRow> }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ScatterRow;
  if ('event' in p && p.event) {
    return (
      <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg max-w-xs">
        <p className="font-mono text-text-primary font-semibold" style={{ color: eventDotColor(p.event) }}>
          {p.event}
        </p>
        <p className="text-text-secondary mt-1 font-mono">{p.date}</p>
        <p className="text-text-secondary tabular-nums mt-0.5">
          Price: {p.markPrice != null ? `$${p.markPrice.toFixed(2)}` : p.close != null ? `$${p.close.toFixed(2)}` : '—'}
        </p>
        {p.weight_pct != null ? (
          <p className="text-text-muted mt-1 tabular-nums">Weight after: {p.weight_pct.toFixed(2)}%</p>
        ) : null}
        {p.weight_change_pct != null ? (
          <p className="text-text-muted tabular-nums">Δ weight: {p.weight_change_pct > 0 ? '+' : ''}{p.weight_change_pct.toFixed(2)}pp</p>
        ) : null}
        {p.reason ? <p className="text-text-muted mt-1.5 text-[11px] leading-snug">{p.reason}</p> : null}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg">
      <p className="font-mono text-text-secondary">{p.date}</p>
      <p className="text-text-primary tabular-nums mt-0.5">${Number(p.close).toFixed(2)}</p>
    </div>
  );
}

function parseIsoUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function EventTimelineStrip({
  markers,
  firstDate,
  lastDate,
}: {
  markers: ScatterRow[];
  firstDate: string;
  lastDate: string;
}) {
  const t0 = parseIsoUtc(firstDate);
  const t1 = parseIsoUtc(lastDate);
  const span = Math.max(1, t1 - t0);

  return (
    <div className="relative mt-2 h-7 rounded-md border border-border-subtle bg-bg-secondary/40 overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border-subtle/80" aria-hidden />
      {markers.map((m, i) => {
        const td = parseIsoUtc(m.date);
        const pct = ((td - t0) / span) * 100;
        return (
          <button
            key={`${m.date}-${m.event}-${i}`}
            type="button"
            title={`${m.date} · ${m.event}`}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-fin-blue/50"
            style={{ left: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: eventDotColor(m.event) }}
          />
        );
      })}
    </div>
  );
}

function ChartBody({
  ticker,
  rangeStart,
  lookbackDays,
}: {
  ticker: string;
  rangeStart: string;
  lookbackDays: number;
}) {
  const cacheKey = `${String(ticker).toUpperCase()}|${rangeStart}|v2`;
  const [data, setData] = useState<PositionPriceChartData | null>(() => positionChartCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(() => !positionChartCache.has(cacheKey));
  const [err, setErr] = useState<string | null>(null);
  const [brushStart, setBrushStart] = useState(0);
  const [brushEnd, setBrushEnd] = useState(0);

  useEffect(() => {
    if (positionChartCache.has(cacheKey)) return;
    let cancelled = false;
    fetchPositionPriceChart(ticker, rangeStart)
      .then((d) => {
        if (!cancelled) {
          positionChartCache.set(cacheKey, d);
          setData(d);
        }
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
  }, [ticker, rangeStart, cacheKey]);

  const chartRows = useMemo<Row[]>(() => {
    if (!data?.priceHistory?.length) return [];
    return data.priceHistory.map((p) => ({ date: p.date, close: p.close }));
  }, [data]);

  useEffect(() => {
    if (!chartRows.length) return;
    /* eslint-disable react-hooks/set-state-in-effect -- brush must span new series when price range reloads */
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
          date: tr.date,
          close: tr.close,
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

  const chartEnd = chartRows.length ? chartRows[chartRows.length - 1].date : null;

  if (loading) {
    return (
      <div className="h-[220px] rounded-lg border border-border-subtle bg-bg-secondary/40 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading price history…
      </div>
    );
  }
  if (err) {
    return (
      <div className="h-[220px] rounded-lg border border-border-subtle bg-bg-secondary/40 flex items-center justify-center text-xs text-fin-red px-4 text-center">
        {err}
      </div>
    );
  }
  if (!chartRows.length) {
    return (
      <div className="h-[160px] rounded-lg border border-border-subtle bg-bg-secondary/40 flex items-center justify-center text-xs text-text-muted">
        No price history for this range.
      </div>
    );
  }

  return (
    <>
      <p className="text-xs text-text-muted mb-2">
        <span className="font-mono text-text-secondary">{ticker}</span>
        {' · '}
        <span className="font-mono text-text-secondary">{rangeStart}</span>
        {chartEnd ? (
          <>
            {' → '}
            <span className="font-mono text-text-secondary">{chartEnd}</span>
          </>
        ) : null}
        <span className="text-text-muted"> (~{lookbackDays}d lookback)</span>
      </p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} minTickGap={28} />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={56}
              tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(0) : String(v))}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="close" stroke="#60a5fa" dot={false} strokeWidth={2} name="Close" isAnimationActive={false} />
            <Scatter
              data={scatterInView}
              dataKey="close"
              fill="#60a5fa"
              isAnimationActive={false}
              shape={(raw: unknown) => {
                const props = raw as { cx?: number; cy?: number; payload?: ScatterRow };
                const { cx, cy, payload } = props;
                if (cx == null || cy == null || !payload?.event) return <g />;
                const r = payload.event === 'REBALANCE' ? 5 : 6;
                return (
                  <circle cx={cx} cy={cy} r={r} fill={eventDotColor(payload.event)} stroke="#0a0a0a" strokeWidth={1.5} />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-14 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartRows} margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Line type="monotone" dataKey="close" stroke="#3b82f666" dot={false} strokeWidth={1} isAnimationActive={false} />
            <Brush
              dataKey="date"
              height={22}
              stroke="#3b82f6"
              fill="rgba(59,130,246,0.12)"
              travellerWidth={8}
              startIndex={brushStart}
              endIndex={brushEnd}
              onChange={onBrushChange}
              tickFormatter={() => ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {markers.length > 0 && chartRows.length > 0 ? (
        <EventTimelineStrip markers={markers} firstDate={chartRows[0].date} lastDate={chartRows[chartRows.length - 1].date} />
      ) : null}
    </>
  );
}

export default function PositionPriceChart({
  ticker,
  anchorDate,
}: {
  ticker: string;
  anchorDate: string;
}) {
  const [lookbackDays, setLookbackDays] = useState(400);
  const rangeStart = useMemo(() => subtractIsoDays(anchorDate, lookbackDays), [anchorDate, lookbackDays]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-text-muted mr-1">Range</span>
        {LOOKBACK_PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => setLookbackDays(p.days)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              lookbackDays === p.days
                ? 'border-fin-blue/50 bg-fin-blue/15 text-fin-blue'
                : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <ChartBody key={`${ticker}|${rangeStart}|${lookbackDays}`} ticker={ticker} rangeStart={rangeStart} lookbackDays={lookbackDays} />
    </div>
  );
}
