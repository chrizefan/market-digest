'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { fetchPositionPriceChart } from '@/lib/queries';
import type { PositionPriceChartData } from '@/lib/types';

function eventLineColor(ev: PositionPriceChartData['events'][0]['event']): string {
  if (ev === 'OPEN') return '#22c55e';
  if (ev === 'EXIT') return '#ef4444';
  if (ev === 'REBALANCE') return '#3b82f6';
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

type Row = { date: string; close: number; [k: string]: string | number | null | undefined };

const positionChartCache = new Map<string, PositionPriceChartData>();

const DEFAULT_LOOKBACK = 400;

function ChartBody({
  ticker,
  rangeStart,
  lookbackDays,
}: {
  ticker: string;
  rangeStart: string;
  lookbackDays: number;
}) {
  const cacheKey = `${String(ticker).toUpperCase()}|${rangeStart}`;
  const [data, setData] = useState<PositionPriceChartData | null>(
    () => positionChartCache.get(cacheKey) ?? null
  );
  const [loading, setLoading] = useState(() => !positionChartCache.has(cacheKey));
  const [err, setErr] = useState<string | null>(null);

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

  const chartEnd = chartRows.length ? chartRows[chartRows.length - 1].date : null;

  const markers = useMemo(() => {
    const evs = (data?.events ?? []).filter((e) => e.event !== 'HOLD');
    if (!chartRows.length) return evs;
    const first = chartRows[0].date;
    const last = chartRows[chartRows.length - 1].date;
    return evs.filter((e) => e.date >= first && e.date <= last);
  }, [data?.events, chartRows]);

  if (loading) {
    return (
      <div className="h-[220px] rounded-lg border border-border-subtle bg-bg-secondary/40 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading price chart…
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
        closes from <span className="font-mono text-text-secondary">{rangeStart}</span>
        {chartEnd ? (
          <>
            {' '}
            to <span className="font-mono text-text-secondary">{chartEnd}</span>
          </>
        ) : null}
        <span className="text-text-muted"> (~{lookbackDays}d lookback before anchor)</span>
      </p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} minTickGap={24} />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={56}
              tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(0) : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: '#141414',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`$${Number(v).toFixed(2)}`, 'Close']}
              labelFormatter={(l) => String(l)}
            />
            <Line type="monotone" dataKey="close" stroke="#60a5fa" dot={false} strokeWidth={2} name="Close" />
            {markers.map((ev, i) => (
              <ReferenceLine
                key={`${ev.date}-${ev.event}-${i}`}
                x={ev.date}
                stroke={eventLineColor(ev.event)}
                strokeDasharray="4 4"
                label={{
                  value: ev.event,
                  fill: eventLineColor(ev.event),
                  fontSize: 10,
                  position: 'insideTop',
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {markers.length > 0 ? (
        <ul className="text-[11px] text-text-muted space-y-1 max-h-28 overflow-y-auto mt-3">
          {markers.map((ev, i) => (
            <li key={`${ev.date}-${i}`} className="flex flex-wrap gap-x-2">
              <span className="font-mono text-text-secondary">{ev.date}</span>
              <span style={{ color: eventLineColor(ev.event) }}>{ev.event}</span>
              {ev.price != null ? <span>${ev.price.toFixed(2)}</span> : null}
              {ev.reason ? <span className="truncate max-w-[280px]">{ev.reason}</span> : null}
            </li>
          ))}
        </ul>
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
  const [lookbackDays, setLookbackDays] = useState(DEFAULT_LOOKBACK);
  const rangeStart = useMemo(() => subtractIsoDays(anchorDate, lookbackDays), [anchorDate, lookbackDays]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setLookbackDays((d) => d + 365)}
          className="px-3 py-1.5 rounded-md border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-white/[0.04] text-[11px] font-medium"
        >
          Load more history (+1y)
        </button>
      </div>
      <ChartBody key={`${ticker}|${rangeStart}`} ticker={ticker} rangeStart={rangeStart} lookbackDays={lookbackDays} />
    </div>
  );
}
