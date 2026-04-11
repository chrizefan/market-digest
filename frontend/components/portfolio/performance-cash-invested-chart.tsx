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
import type { NavChartPoint } from '@/lib/types';

export function PerformanceCashInvestedChart({ snaps }: { snaps: NavChartPoint[] }) {
  const hasAny = snaps.some(
    (s) => s.cash_pct != null && !Number.isNaN(Number(s.cash_pct))
  );
  if (!hasAny) {
    return (
      <div className="h-[240px] flex items-center justify-center text-text-muted text-sm">
        Cash / invested breakdown not available in nav history yet.
      </div>
    );
  }

  const data = snaps.map((s) => ({
    date: s.date,
    cash_pct: s.cash_pct != null ? Number(s.cash_pct) : null,
    invested_pct: s.invested_pct != null ? Number(s.invested_pct) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(d: string) => d?.slice(5)}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
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
            return !Number.isNaN(n) ? [`${n.toFixed(1)}%`, String(name)] : ['—', String(name)];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="invested_pct"
          name="Invested %"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="cash_pct"
          name="Cash %"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
