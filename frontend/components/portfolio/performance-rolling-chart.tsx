'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function PerformanceRollingChart({
  data,
}: {
  data: Array<{ date: string; sharpe: number | null; volAnn: number | null }>;
}) {
  const hasSharpe = data.some((d) => d.sharpe != null && !Number.isNaN(d.sharpe));
  if (!hasSharpe) {
    return (
      <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">
        Need more trading days in range for 21-day rolling estimates.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(d: string) => d?.slice(5)}
        />
        <YAxis
          yAxisId="sharpe"
          tick={{ fill: '#71717a', fontSize: 11 }}
          label={{ value: 'Sharpe', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }}
        />
        <YAxis
          yAxisId="vol"
          orientation="right"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
          label={{ value: 'Ann. vol', angle: 90, position: 'insideRight', fill: '#71717a', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
          formatter={(val, name) => {
            const n = typeof val === 'number' ? val : val != null ? Number(val) : NaN;
            const nm = String(name);
            if (Number.isNaN(n)) return ['—', nm];
            if (nm === 'Rolling vol (ann.)') return [`${n.toFixed(1)}%`, nm];
            return [n.toFixed(2), nm];
          }}
        />
        <Legend />
        <Line
          yAxisId="sharpe"
          type="monotone"
          dataKey="sharpe"
          name="Rolling Sharpe (21d)"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          yAxisId="vol"
          type="monotone"
          dataKey="volAnn"
          name="Rolling vol (ann.)"
          stroke="#06b6d4"
          strokeWidth={1.5}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
