'use client';

import type { Position } from '@/lib/types';

export function PositionPnlTable({ positions }: { positions: Position[] }) {
  if (!positions.length) return null;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
        <h3 className="text-lg font-semibold">Position P&amp;L</h3>
        <p className="text-text-muted text-sm mt-1">
          Unrealized return per position (entry price to latest close)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4">Ticker</th>
              <th className="text-right px-6 py-4">Weight</th>
              <th className="text-right px-6 py-4">Entry</th>
              <th className="text-right px-6 py-4">Current</th>
              <th className="text-right px-6 py-4">P&amp;L %</th>
              <th className="text-right px-6 py-4">Contribution</th>
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
              return (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
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
                    className={`px-6 py-3 text-right font-mono tabular-nums font-semibold ${pnlPct != null ? (pnlPct >= 0 ? 'text-fin-green' : 'text-fin-red') : ''}`}
                  >
                    {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums text-text-secondary">
                    {contrib != null ? `${contrib >= 0 ? '+' : ''}${contrib.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
