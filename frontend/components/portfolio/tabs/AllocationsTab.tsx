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
  centerValue,
  centerLabel,
}: {
  title: string;
  data: PieSliceDatum[];
  emptyMessage: string;
  centerValue?: string;
  centerLabel?: string;
}) {
  return (
    <div className="glass-card p-4 flex flex-col min-h-[300px]">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 text-center">
        {title}
      </h3>
      <div className="flex-1 min-h-[240px]">
        {data.length === 0 ? (
          <p className="text-text-muted text-sm py-12 text-center">{emptyMessage}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="44%"
                innerRadius="40%"
                outerRadius="68%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={ALLOCATION_PALETTE[i % ALLOCATION_PALETTE.length]} />
                ))}
              </Pie>
              {/* Center label using custom active shape approach */}
              {centerValue && (
                <text
                  x="50%"
                  y="44%"
                  textAnchor="middle"
                  dy="-6"
                  style={{ fontSize: 17, fontWeight: 700, fill: '#e6e6e6', fontFamily: 'monospace' }}
                >
                  {centerValue}
                </text>
              )}
              {centerLabel && (
                <text
                  x="50%"
                  y="44%"
                  textAnchor="middle"
                  dy="12"
                  style={{ fontSize: 9, fill: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  {centerLabel}
                </text>
              )}
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
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                formatter={(val: string) => <span className="text-text-secondary">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function CategoryBar({ name, value, max, color }: { name: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="w-28 shrink-0 text-xs text-text-secondary truncate text-right">{name}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-mono tabular-nums text-text-secondary">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AllocationsTab(props: {
  lastUpdated: string | null;
  pieTicker: PieSliceDatum[];
  pieCategory: PieSliceDatum[];
  pieThesis: PieSliceDatum[];
  categoryBarData: { key: string; name: string; value: number }[];
  positions: Position[];
  thesisById: Map<string, Thesis>;
}) {
  const { lastUpdated, pieTicker, pieCategory, pieThesis, categoryBarData, positions, thesisById } = props;

  // Compute center values
  const totalInvested = positions.reduce((s, p) => s + (p.weight_actual ?? 0), 0);
  const positionCount = positions.length;
  const uniqueTheses = new Set(positions.flatMap((p) => p.thesis_ids ?? [])).size;

  const catMax = categoryBarData.length ? categoryBarData[0].value : 0;

  return (
    <div className="space-y-6">
      {/* Positions table — now FIRST for at-a-glance scanning */}
      <AllocationsPositionsTable positions={positions} thesisById={thesisById} lastUpdated={lastUpdated} />

      {/* Category comparison bars */}
      {categoryBarData.length > 0 && (
        <div className="glass-card p-5">
          <SectionTitle className="mb-1">By category</SectionTitle>
          <p className="text-xs text-text-muted mb-4">
            Allocation weight across asset categories.
          </p>
          <div className="space-y-2.5 max-w-xl">
            {categoryBarData.map((row, i) => (
              <CategoryBar
                key={row.key}
                name={row.name}
                value={row.value}
                max={catMax}
                color={ALLOCATION_PALETTE[i % ALLOCATION_PALETTE.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Allocation mix charts */}
      <div>
        <SectionTitle className="mb-1">Allocation breakdown</SectionTitle>
        <p className="text-xs text-text-muted mb-4 max-w-3xl">
          Capital split across tickers, asset categories, and investment theses.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PieBlock
            title="By ticker"
            data={pieTicker}
            emptyMessage="No positions"
            centerValue={`${positionCount}`}
            centerLabel={positionCount === 1 ? 'position' : 'positions'}
          />
          <PieBlock
            title="By category"
            data={pieCategory}
            emptyMessage="No category data"
            centerValue={`${totalInvested.toFixed(0)}%`}
            centerLabel="invested"
          />
          <PieBlock
            title="By thesis"
            data={pieThesis}
            emptyMessage="No thesis-linked weights"
            centerValue={`${uniqueTheses}`}
            centerLabel={uniqueTheses === 1 ? 'thesis' : 'theses'}
          />
        </div>
      </div>
    </div>
  );
}
