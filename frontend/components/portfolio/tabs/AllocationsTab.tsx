'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SectionTitle } from '@/components/ui';
import { ALLOCATION_PALETTE, type PieSliceDatum } from './palette-and-format';
import type { Position, Thesis } from '@/lib/types';
import AllocationsPositionsTable from '@/components/portfolio/AllocationsPositionsTable';

function PieBlock({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: PieSliceDatum[];
  emptyMessage: string;
}) {
  return (
    <div className="glass-card p-4 flex flex-col min-h-[300px]">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 text-center">{title}</h3>
      <div className="flex-1 min-h-[240px]">
        {data.length === 0 ? (
          <p className="text-text-muted text-sm py-12 text-center">{emptyMessage}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="72%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={ALLOCATION_PALETTE[i % ALLOCATION_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as PieSliceDatum;
                  return (
                    <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg max-w-xs">
                      <p className="font-medium text-text-primary">{p.name}</p>
                      <p className="text-text-secondary tabular-nums">{p.value.toFixed(1)}%</p>
                      {p.tooltipExtra ? (
                        <p className="text-text-muted mt-1.5 text-[11px] leading-snug">{p.tooltipExtra}</p>
                      ) : null}
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: '10px' }}
                formatter={(val: string) => <span className="text-text-secondary">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function AllocationsTab(props: {
  lastUpdated: string | null;
  pieTicker: PieSliceDatum[];
  pieCategory: PieSliceDatum[];
  pieThesis: PieSliceDatum[];
  positions: Position[];
  thesisById: Map<string, Thesis>;
}) {
  const { lastUpdated, pieTicker, pieCategory, pieThesis, positions, thesisById } = props;

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle className="mb-4">Allocation mix</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PieBlock title="By ticker" data={pieTicker} emptyMessage="No positions" />
          <PieBlock title="By category" data={pieCategory} emptyMessage="No category data" />
          <PieBlock title="By thesis" data={pieThesis} emptyMessage="No thesis-linked weights" />
        </div>
      </div>

      <AllocationsPositionsTable positions={positions} thesisById={thesisById} lastUpdated={lastUpdated} />
    </div>
  );
}
