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

type Row = { date: string; close: number; [k: string]: string | number | null | undefined };

const positionChartCache = new Map<string, PositionPriceChartData>();

export default function PositionPriceChart({
  ticker,
  fromDate,
}: {
  ticker: string;
  fromDate: string;
}) {
  const cacheKey = `${String(ticker).toUpperCase()}|${fromDate}`;
  const [data, setData] = useState<PositionPriceChartData | null>(
    () => positionChartCache.get(cacheKey) ?? null
  );
  const [loading, setLoading] = useState(() => !positionChartCache.has(cacheKey));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (positionChartCache.has(cacheKey)) return;
    let cancelled = false;
    fetchPositionPriceChart(ticker, fromDate)
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
  }, [ticker, fromDate, cacheKey]);

  const chartRows = useMemo<Row[]>(() => {
    if (!data?.priceHistory?.length) return [];
    return data.priceHistory.map((p) => ({ date: p.date, close: p.close }));
  }, [data]);

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

  const markers = (data?.events ?? []).filter((e) => e.event !== 'HOLD');

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        <span className="font-mono text-text-secondary">{ticker}</span> close from {fromDate}
      </p>
      <div className="h-[240px] w-full">
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
        <ul className="text-[11px] text-text-muted space-y-1 max-h-24 overflow-y-auto">
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
    </div>
  );
}
