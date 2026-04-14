'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge, formatPct, pnlColor } from '@/components/ui';
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
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="border-b border-border-subtle bg-bg-secondary px-4 py-4 md:px-6 md:py-5">
        <h3 className="text-lg font-semibold">Positions</h3>
        <p className="text-xs text-text-muted mt-1">
          Weight, day move, P&amp;L and contribution. Expand a row for price history and position events.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-sm md:min-w-[900px]">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left md:px-4">Ticker</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Name</th>
              <th className="px-3 py-3 text-right md:px-4">Weight</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Δ</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">Day</th>
              <th className="px-3 py-3 text-right md:px-4">P&amp;L</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Contrib</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Category</th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">Thesis</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">Entry</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">Current</th>
              <th className="w-8 px-2 py-3 md:px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {positions.map((p: Position, i: number) => {
              const isExpanded = expandedRow === i;
              const pnlPct =
                p.unrealized_pnl_pct != null && !Number.isNaN(p.unrealized_pnl_pct)
                  ? p.unrealized_pnl_pct
                  : p.entry_price && p.current_price && p.entry_price > 0
                    ? ((p.current_price - p.entry_price) / p.entry_price) * 100
                    : null;
              const anchorDate = p.entry_date || lastUpdated || new Date().toISOString().slice(0, 10);
              return (
                <Fragment key={p.ticker + String(i)}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                  >
                    <td className="px-3 py-3 md:px-4">
                      <Badge variant="blue">{p.ticker}</Badge>
                    </td>
                    <td className="hidden max-w-[160px] truncate px-4 py-3 md:table-cell">{p.name}</td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums md:px-4">
                      {p.weight_actual?.toFixed(1)}%
                    </td>
                    <td
                      className={`hidden px-4 py-3 text-right font-mono tabular-nums text-xs md:table-cell ${typeof p.weight_delta === 'number' ? pnlColor(p.weight_delta) : 'text-text-muted'}`}
                    >
                      {typeof p.weight_delta === 'number'
                        ? `${p.weight_delta > 0 ? '+' : ''}${p.weight_delta.toFixed(1)}pp`
                        : '—'}
                    </td>
                    <td
                      className={`hidden px-4 py-3 text-right font-mono tabular-nums text-xs lg:table-cell ${pnlColor(p.day_change_pct)}`}
                    >
                      {p.day_change_pct != null ? formatPct(p.day_change_pct) : '—'}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-mono text-xs font-semibold tabular-nums md:px-4 ${pnlPct != null ? pnlColor(pnlPct) : ''}`}
                    >
                      {pnlPct != null ? formatPct(pnlPct) : '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary sm:table-cell">
                      {p.contribution_pct != null ? formatPct(p.contribution_pct) : '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-text-secondary md:table-cell">
                      {formatAllocationCategory(p.category)}
                    </td>
                    <td className="hidden max-w-[180px] px-4 py-3 text-xs text-text-secondary lg:table-cell">
                      {thesisNames(p.thesis_ids, thesisById)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary lg:table-cell">
                      {p.entry_price ? `$${p.entry_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-xs lg:table-cell">
                      {p.current_price ? `$${p.current_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-2 py-3 text-text-muted md:px-4">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-white/[0.02]">
                      <td colSpan={12} className="px-4 py-5 md:px-6 md:py-6">
                        {p.rationale ? (
                          <p className="text-text-muted text-sm leading-relaxed mb-4 max-w-4xl">{p.rationale}</p>
                        ) : null}
                        <div className="border-t border-border-subtle pt-4">
                          <h4 className="text-sm font-semibold mb-3">Price &amp; events</h4>
                          <PositionPriceChart ticker={p.ticker} anchorDate={anchorDate} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {positions.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center py-10 text-text-muted">
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
