'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Position } from '@/lib/types';
import PositionPriceChart from '@/components/portfolio/PositionPriceChart';

export function PositionPnlTable({
  positions,
  priceChartAnchorDate,
}: {
  positions: Position[];
  /** When set, rows expand to show price + events through this as-of date. */
  priceChartAnchorDate?: string | null;
}) {
  const showCharts = Boolean(priceChartAnchorDate);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (!positions.length) return null;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
        <h3 className="text-lg font-semibold">Position P&amp;L</h3>
        <p className="text-text-muted text-sm mt-1">
          Unrealized return per position (entry price to latest close).
          {showCharts ? ' Expand a row for price history and position events in the selected range.' : null}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4">Ticker</th>
              <th className="text-right px-6 py-4">Weight</th>
              <th className="text-right px-6 py-4">Entry</th>
              <th className="text-right px-6 py-4">Current</th>
              <th className="text-right px-6 py-4">P&amp;L %</th>
              <th className="text-right px-6 py-4">Contribution</th>
              {showCharts ? <th className="px-6 py-4 w-10" aria-label="Expand" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {positions.map((p, i) => {
              const entry = p.entry_price;
              const curr = p.current_price;
              const pnlPct =
                p.unrealized_pnl_pct != null && !Number.isNaN(p.unrealized_pnl_pct)
                  ? p.unrealized_pnl_pct
                  : entry && curr && entry > 0
                    ? ((curr - entry) / entry) * 100
                    : null;
              const contrib =
                p.contribution_pct != null && !Number.isNaN(p.contribution_pct)
                  ? p.contribution_pct
                  : pnlPct != null
                    ? (pnlPct * (p.weight_actual || 0)) / 100
                    : null;
              const isOpen = showCharts && expandedRow === i;
              const skipChart = String(p.ticker).toUpperCase() === 'CASH';

              return (
                <Fragment key={`${p.ticker}-${i}`}>
                  <tr
                    onClick={() => {
                      if (!showCharts || skipChart) return;
                      setExpandedRow(isOpen ? null : i);
                    }}
                    className={
                      showCharts && !skipChart
                        ? `cursor-pointer transition-colors hover:bg-white/[0.02] ${isOpen ? 'bg-white/[0.02]' : ''}`
                        : 'hover:bg-white/[0.02] transition-colors'
                    }
                  >
                    <td className="px-6 py-3 font-semibold">{p.ticker}</td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums">
                      {p.weight_actual?.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-text-secondary">
                      {entry ? `$${entry.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums">
                      {curr ? `$${curr.toFixed(2)}` : '—'}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-mono tabular-nums font-semibold ${
                        pnlPct != null ? (pnlPct >= 0 ? 'text-fin-green' : 'text-fin-red') : ''
                      }`}
                    >
                      {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-text-secondary">
                      {contrib != null ? `${contrib >= 0 ? '+' : ''}${contrib.toFixed(2)}%` : '—'}
                    </td>
                    {showCharts ? (
                      <td className="px-6 py-3 text-text-muted">
                        {skipChart ? null : isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                    ) : null}
                  </tr>
                  {isOpen && priceChartAnchorDate && !skipChart ? (
                    <tr className="bg-white/[0.02]">
                      <td colSpan={7} className="px-6 py-5 border-t border-border-subtle">
                        <PositionPriceChart ticker={p.ticker} anchorDate={priceChartAnchorDate} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
