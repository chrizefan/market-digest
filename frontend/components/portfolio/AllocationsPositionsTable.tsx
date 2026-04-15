'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge, pnlColor } from '@/components/ui';
import type { Position, Thesis } from '@/lib/types';
import PositionPriceChart from '@/components/portfolio/PositionPriceChart';
import { formatAllocationCategory } from '@/components/portfolio/tabs/palette-and-format';

function thesisNames(ids: string[], thesisById: Map<string, Thesis>): string {
  if (!ids.length) return '—';
  return ids.map((id) => thesisById.get(id)?.name ?? id).join(', ');
}

export default function AllocationsPositionsTable(props: {
  positions: Position[];
  thesisById: Map<string, Thesis>;
  lastUpdated: string | null;
}) {
  const { positions, thesisById, lastUpdated } = props;
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...positions].sort((a, b) => (b.weight_actual ?? 0) - (a.weight_actual ?? 0)),
    [positions]
  );

  const maxWeight = sorted.length ? (sorted[0].weight_actual ?? 0) : 0;

  const showTargetVsActual = useMemo(
    () => sorted.some((p) => p.weight_target != null),
    [sorted]
  );

  const colCount = showTargetVsActual ? 11 : 9;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="border-b border-border-subtle bg-bg-secondary px-4 py-4 md:px-6 md:py-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Positions</h3>
          <p className="text-xs text-text-muted mt-1 max-w-3xl leading-relaxed">
            Holdings ranked by weight. Emphasis is on sleeve mix, thesis linkage, and how weights changed — not
            day-trading P&amp;L (see Performance for return attribution).
            {showTargetVsActual ? (
              <>
                {' '}
                <span className="text-text-secondary">
                  Target and drift columns reflect the latest digest proposed weights vs what is modeled as held.
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            Sorted by allocation · background bar shows relative weight
          </span>
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            Click a row for details
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-sm md:min-w-[920px]">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="pl-2 pr-2 py-3 text-left md:pl-4">Ticker</th>
              <th className="hidden max-w-[140px] px-2 py-3 text-left md:table-cell">Name</th>
              <th className="px-2 py-3 text-right md:px-3">Weight</th>
              <th className="hidden px-3 py-3 text-right md:table-cell">Δ weight</th>
              {showTargetVsActual ? (
                <>
                  <th className="hidden px-3 py-3 text-right sm:table-cell">Target</th>
                  <th className="hidden px-3 py-3 text-right md:table-cell">vs target</th>
                </>
              ) : null}
              <th className="hidden px-3 py-3 text-left lg:table-cell">Category</th>
              <th className="hidden max-w-[200px] px-3 py-3 text-left xl:table-cell">Thesis</th>
              <th className="hidden px-3 py-3 text-right lg:table-cell">Avg entry</th>
              <th className="px-2 py-3 text-right md:px-3">Last</th>
              <th className="w-8 px-2 py-3 md:px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sorted.map((p: Position) => {
              const isExpanded = expandedTicker === p.ticker;
              const anchorDate = p.entry_date || lastUpdated || new Date().toISOString().slice(0, 10);
              const w = p.weight_actual ?? 0;
              const pctOfMax = maxWeight > 0 ? (w / maxWeight) * 100 : 0;
              const bar = `linear-gradient(90deg, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.16) ${pctOfMax}%, rgba(255,255,255,0) ${pctOfMax}%)`;

              return (
                <>
                  <tr
                    onClick={() => setExpandedTicker(isExpanded ? null : p.ticker)}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                    style={{ backgroundImage: bar, backgroundRepeat: 'no-repeat' }}
                  >
                        <td className="pl-2 pr-2 py-3 md:pl-4">
                          <Badge variant="blue">{p.ticker}</Badge>
                        </td>
                        <td className="hidden max-w-[140px] truncate px-2 py-3 text-text-secondary md:table-cell">{p.name}</td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums font-medium md:px-3">
                          {p.weight_actual?.toFixed(1)}%
                        </td>
                        <td
                          className={`hidden px-3 py-3 text-right font-mono tabular-nums text-xs md:table-cell ${
                            typeof p.weight_delta === 'number' ? pnlColor(p.weight_delta) : 'text-text-muted'
                          }`}
                        >
                          {typeof p.weight_delta === 'number'
                            ? `${p.weight_delta > 0 ? '+' : ''}${p.weight_delta.toFixed(1)}pp`
                            : '—'}
                        </td>
                        {showTargetVsActual ? (
                          <>
                            <td className="hidden px-3 py-3 text-right font-mono tabular-nums text-xs text-text-secondary sm:table-cell">
                              {p.weight_target != null ? `${p.weight_target.toFixed(1)}%` : '—'}
                            </td>
                            <td
                              className={`hidden px-3 py-3 text-right font-mono tabular-nums text-xs md:table-cell ${
                                p.weight_target != null
                                  ? pnlColor((p.weight_actual ?? 0) - p.weight_target)
                                  : 'text-text-muted'
                              }`}
                              title={
                                p.weight_target != null
                                  ? `Actual ${(p.weight_actual ?? 0).toFixed(2)}% − target ${p.weight_target.toFixed(2)}%`
                                  : undefined
                              }
                            >
                              {p.weight_target != null
                                ? `${(p.weight_actual ?? 0) - p.weight_target >= 0 ? '+' : ''}${((p.weight_actual ?? 0) - p.weight_target).toFixed(1)}pp`
                                : '—'}
                            </td>
                          </>
                        ) : null}
                        <td className="hidden px-3 py-3 text-xs text-text-secondary lg:table-cell">
                          {formatAllocationCategory(p.category)}
                        </td>
                        <td className="hidden max-w-[200px] px-3 py-3 text-xs text-text-secondary xl:table-cell">
                          {thesisNames(p.thesis_ids, thesisById)}
                        </td>
                        <td className="hidden px-3 py-3 text-right font-mono tabular-nums text-xs text-text-secondary lg:table-cell">
                          {p.entry_price ? `$${p.entry_price.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-xs md:px-3">
                          {p.current_price ? `$${p.current_price.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-2 py-3 text-text-muted md:px-3">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan={colCount} className="px-4 py-5 md:px-6 md:py-6">
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                              <div className="space-y-3 text-sm">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Position context</h4>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                  <div>
                                    <dt className="text-text-muted">Category</dt>
                                    <dd className="text-text-secondary mt-0.5">{formatAllocationCategory(p.category)}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-text-muted">Thesis</dt>
                                    <dd className="text-text-secondary mt-0.5">{thesisNames(p.thesis_ids, thesisById)}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-text-muted">Weight</dt>
                                    <dd className="font-mono tabular-nums mt-0.5">{p.weight_actual?.toFixed(2)}%</dd>
                                  </div>
                                  <div>
                                    <dt className="text-text-muted">Δ vs prior snapshot</dt>
                                    <dd
                                      className={`font-mono tabular-nums mt-0.5 ${
                                        typeof p.weight_delta === 'number' ? pnlColor(p.weight_delta) : ''
                                      }`}
                                    >
                                      {typeof p.weight_delta === 'number'
                                        ? `${p.weight_delta > 0 ? '+' : ''}${p.weight_delta.toFixed(2)}pp`
                                        : '—'}
                                    </dd>
                                  </div>
                                  {p.weight_target != null ? (
                                    <div>
                                      <dt className="text-text-muted">Target (digest)</dt>
                                      <dd className="font-mono tabular-nums mt-0.5">{p.weight_target.toFixed(2)}%</dd>
                                    </div>
                                  ) : null}
                                  {p.weight_target != null ? (
                                    <div>
                                      <dt className="text-text-muted">Drift vs target</dt>
                                      <dd
                                        className={`font-mono tabular-nums mt-0.5 ${pnlColor(
                                          (p.weight_actual ?? 0) - p.weight_target
                                        )}`}
                                      >
                                        {(p.weight_actual ?? 0) - p.weight_target >= 0 ? '+' : ''}
                                        {((p.weight_actual ?? 0) - p.weight_target).toFixed(2)}pp
                                      </dd>
                                    </div>
                                  ) : null}
                                  <div>
                                    <dt className="text-text-muted">Avg entry</dt>
                                    <dd className="font-mono tabular-nums mt-0.5">
                                      {p.entry_price != null ? `$${p.entry_price.toFixed(2)}` : '—'}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-text-muted">Last close</dt>
                                    <dd className="font-mono tabular-nums mt-0.5">
                                      {p.current_price != null ? `$${p.current_price.toFixed(2)}` : '—'}
                                    </dd>
                                  </div>
                                </dl>
                                {p.rationale ? (
                                  <p className="text-text-muted text-sm leading-relaxed pt-2 border-t border-border-subtle">
                                    {p.rationale}
                                  </p>
                                ) : null}
                              </div>
                              <div className="border-t border-border-subtle pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6 border-border-subtle">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                                  Price &amp; position events
                                </h4>
                                <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
                                  Markers show opens, exits, and rebalance points on the price path (hover for weight
                                  changes). Use the range chips and brush to zoom; the strip below is the same events on
                                  a compact timeline.
                                </p>
                                <PositionPriceChart ticker={p.ticker} anchorDate={anchorDate} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                </>
              );
            })}
            {positions.length === 0 && (
              <tr>
                <td colSpan={colCount} className="text-center py-10 text-text-muted">
                  No active positions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
