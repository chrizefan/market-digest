'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Badge, formatPct, pnlColor } from '@/components/ui';
import type { Position, Thesis } from '@/lib/types';
import type { HoldingTechnicalSnapshot } from '@/lib/types';
import PositionPriceChart from '@/components/portfolio/PositionPriceChart';
import { formatAllocationCategory } from './palette-and-format';

function thesisNames(ids: string[], thesisById: Map<string, Thesis>): string {
  if (!ids.length) return '—';
  return ids.map((id) => thesisById.get(id)?.name ?? id).join(', ');
}

export default function PositionsTab(props: {
  positions: Position[];
  thesisById: Map<string, Thesis>;
  holdingTechnicals: Record<string, HoldingTechnicalSnapshot>;
  lastUpdated: string | null;
}) {
  const { positions, thesisById, holdingTechnicals, lastUpdated } = props;
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
        <h3 className="text-lg font-semibold">Positions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1040px]">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Ticker</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-right px-4 py-3">Weight</th>
              <th className="text-right px-4 py-3">Δ</th>
              <th className="text-right px-4 py-3">Day</th>
              <th className="text-right px-4 py-3">P&amp;L</th>
              <th className="text-right px-4 py-3">Contrib</th>
              <th className="text-right px-4 py-3" title="RSI(14) from price_technicals">
                RSI
              </th>
              <th className="text-right px-4 py-3" title="% vs SMA50">
                vs50
              </th>
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
              const tech = holdingTechnicals[p.ticker];
              const chartFrom =
                p.entry_date || lastUpdated || new Date().toISOString().slice(0, 10);
              return (
                <Fragment key={p.ticker + String(i)}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Badge variant="blue">{p.ticker}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[140px] truncate">{p.name}</td>
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
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                      {tech?.rsi_14 != null && !Number.isNaN(tech.rsi_14) ? tech.rsi_14.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                      {tech?.pct_vs_sma50 != null && !Number.isNaN(tech.pct_vs_sma50)
                        ? formatPct(tech.pct_vs_sma50)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatAllocationCategory(p.category)}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary max-w-[160px]">
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
                      <td colSpan={14} className="px-6 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="flex items-center gap-2 text-base font-semibold mb-2">
                              <Info size={16} className="text-fin-blue" /> Investment thesis
                            </h4>
                            <p className="text-text-muted leading-relaxed text-sm">
                              {p.rationale || 'No rationale provided in digest.'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-base font-semibold mb-3">Position details</h4>
                            {tech ? (
                              <p className="text-xs text-text-muted mb-3">
                                Technicals as of <span className="font-mono text-text-secondary">{tech.date}</span>
                                {' — '}
                                RSI(14){' '}
                                <span className="font-mono text-text-primary">
                                  {tech.rsi_14 != null ? tech.rsi_14.toFixed(1) : '—'}
                                </span>
                                {', '}
                                vs SMA50{' '}
                                <span className="font-mono text-text-primary">
                                  {tech.pct_vs_sma50 != null ? formatPct(tech.pct_vs_sma50) : '—'}
                                </span>
                              </p>
                            ) : null}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                  Asset class
                                </span>
                                <span className="text-sm font-medium">{formatAllocationCategory(p.category)}</span>
                              </div>
                              <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                  Linked theses
                                </span>
                                <span className="text-sm space-x-1">
                                  {p.thesis_ids?.length > 0 ? (
                                    p.thesis_ids.map((id, j) => (
                                      <Badge key={j} variant="blue" className="mr-1 text-[0.7rem]">
                                        {thesisById.get(id)?.name ?? id}
                                      </Badge>
                                    ))
                                  ) : (
                                    '—'
                                  )}
                                </span>
                              </div>
                            </div>
                            {p.pm_notes && (
                              <div>
                                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                  PM notes
                                </span>
                                <p className="text-text-muted text-sm leading-relaxed">{p.pm_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-6 border-t border-border-subtle pt-6">
                          <h4 className="text-sm font-semibold mb-3">Price &amp; events</h4>
                          <PositionPriceChart key={`${p.ticker}|${chartFrom}`} ticker={p.ticker} fromDate={chartFrom} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {positions.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-10 text-text-muted">
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
