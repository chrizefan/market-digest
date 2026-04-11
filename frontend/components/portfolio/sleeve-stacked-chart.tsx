'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
];

interface SleeveStackedChartProps {
  data: Array<Record<string, number | string>>;
  keys: string[];
  formatKey: (key: string) => string;
}

export function SleeveStackedChart({ data, keys, formatKey }: SleeveStackedChartProps) {
  if (!data.length || !keys.length) {
    return (
      <div className="h-[320px] flex items-center justify-center text-text-muted text-sm">
        Not enough history to chart sleeves.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickFormatter={(d: string) => d?.slice(5)}
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
          formatter={(val: number, name: string) => [`${Number(val).toFixed(1)}%`, name]}
        />
        <Legend formatter={(value: string) => <span className="text-text-secondary text-xs">{value}</span>} />
        {keys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stackId="sleeves"
            stroke={PALETTE[i % PALETTE.length]}
            fill={PALETTE[i % PALETTE.length]}
            fillOpacity={0.65}
            name={formatKey(k)}
            connectNulls
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
