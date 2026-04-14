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
      <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
        <h3 className="text-lg font-semibold">Positions</h3>
        <p className="text-xs text-text-muted mt-1">
          Weight, day move, P&amp;L and contribution. Expand a row for price history and position events.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Ticker</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-right px-4 py-3">Weight</th>
              <th className="text-right px-4 py-3">Δ</th>
              <th className="text-right px-4 py-3">Day</th>
              <th className="text-right px-4 py-3">P&amp;L</th>
              <th className="text-right px-4 py-3">Contrib</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Thesis</th>
              <th className="text-right px-4 py-3">Entry</th>
              <th className="text-right px-4 py-3">Current</th>
              <th className="px-4 py-3 w-8" />
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
                    <td className="px-4 py-3">
                      <Badge variant="blue">{p.ticker}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {p.weight_actual?.toFixed(1)}%
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums text-xs ${typeof p.weight_delta === 'number' ? pnlColor(p.weight_delta) : 'text-text-muted'}`}
                    >
                      {typeof p.weight_delta === 'number'
                        ? `${p.weight_delta > 0 ? '+' : ''}${p.weight_delta.toFixed(1)}pp`
                        : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono tabular-nums text-xs ${pnlColor(p.day_change_pct)}`}>
                      {p.day_change_pct != null ? formatPct(p.day_change_pct) : '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums font-semibold text-xs ${pnlPct != null ? pnlColor(pnlPct) : ''}`}
                    >
                      {pnlPct != null ? formatPct(pnlPct) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                      {p.contribution_pct != null ? formatPct(p.contribution_pct) : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatAllocationCategory(p.category)}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary max-w-[180px]">
                      {thesisNames(p.thesis_ids, thesisById)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary text-xs">
                      {p.entry_price ? `$${p.entry_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                      {p.current_price ? `$${p.current_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-white/[0.02]">
                      <td colSpan={12} className="px-6 py-6">
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
