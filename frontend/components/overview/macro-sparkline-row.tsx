'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import type { MacroSeriesPoint } from '@/lib/types';

const LABELS: Record<string, string> = {
  VIXCLS: 'VIX',
  DGS10: '10Y yield',
  DEXUSEU: 'USD/EUR',
  DTWEXBGS: 'USD index',
};

export default function MacroSparklineRow({
  series,
}: {
  series: Record<string, MacroSeriesPoint[]>;
}) {
  const ids = Object.keys(series).filter((k) => (series[k]?.length ?? 0) >= 2);
  if (ids.length === 0) return null;

  return (
    <div className="glass-card px-5 py-4">
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Macro pulse</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ids.slice(0, 4).map((sid) => {
          const pts = series[sid];
          const data = pts.map((p) => ({ x: p.obs_date, y: p.value }));
          return (
            <div key={sid} className="min-w-0">
              <p className="text-xs font-medium text-text-secondary mb-1 truncate">
                {LABELS[sid] ?? sid}
              </p>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <YAxis domain={['auto', 'auto']} hide width={0} />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke="rgb(96, 165, 250)"
                      dot={false}
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
