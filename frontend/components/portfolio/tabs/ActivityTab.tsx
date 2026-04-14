'use client';

import { Badge, formatPct, pnlColor } from '@/components/ui';
import type { DashboardPositionEvent, Thesis } from '@/lib/types';

function eventBadgeVariant(
  ev: DashboardPositionEvent['event']
): 'green' | 'red' | 'amber' | 'default' {
  if (ev === 'OPEN') return 'green';
  if (ev === 'EXIT') return 'red';
  if (ev === 'REBALANCE') return 'amber';
  return 'default';
}

export default function ActivityTab(props: {
  activityEvents: DashboardPositionEvent[];
  thesisById: Map<string, Thesis>;
}) {
  const { activityEvents, thesisById } = props;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="border-b border-border-subtle bg-bg-secondary px-4 py-4 md:px-6 md:py-5">
        <h3 className="text-lg font-semibold">Activity</h3>
        <p className="mt-1 text-xs text-text-muted md:hidden">Swipe horizontally for full columns, or use a larger screen.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-sm md:min-w-[920px]">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left md:px-5">Date</th>
              <th className="px-3 py-3 text-left md:px-5">Ticker</th>
              <th className="px-3 py-3 text-left md:px-5">Event</th>
              <th className="hidden px-5 py-3 text-right md:table-cell">Prior wt</th>
              <th className="px-3 py-3 text-right md:px-5">Weight</th>
              <th className="hidden px-5 py-3 text-right sm:table-cell">Δ wt</th>
              <th className="hidden px-5 py-3 text-right lg:table-cell">Since event</th>
              <th className="hidden max-w-[200px] px-5 py-3 text-left lg:table-cell">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {activityEvents.map((ev, i) => {
              const thesisName = ev.thesis_id ? thesisById.get(ev.thesis_id)?.name ?? ev.thesis_id : null;
              const detailParts = [
                ev.reason ? `Reason: ${ev.reason}` : null,
                thesisName ? `Thesis: ${thesisName}` : ev.thesis_id ? `Thesis id: ${ev.thesis_id}` : null,
                ev.price != null ? `Price: $${Number(ev.price).toFixed(2)}` : null,
              ].filter(Boolean);
              const rowTitle = detailParts.length ? detailParts.join('\n') : undefined;
              return (
                <tr key={`${ev.date}-${ev.ticker}-${i}`} className="hover:bg-white/[0.02]" title={rowTitle}>
                  <td className="px-3 py-3 font-mono text-xs text-text-secondary md:px-5">{ev.date}</td>
                  <td className="px-3 py-3 font-semibold md:px-5">{ev.ticker}</td>
                  <td className="px-3 py-3 md:px-5">
                    <Badge variant={eventBadgeVariant(ev.event)}>{ev.event}</Badge>
                  </td>
                  <td
                    className="hidden px-5 py-3 text-right font-mono tabular-nums text-xs text-text-secondary md:table-cell"
                    title={ev.prev_weight_pct != null ? `Previous weight: ${ev.prev_weight_pct.toFixed(2)}%` : undefined}
                  >
                    {ev.prev_weight_pct != null ? `${ev.prev_weight_pct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-xs md:px-5" title="Weight after this event">
                    {ev.weight_pct != null ? `${ev.weight_pct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="hidden px-5 py-3 text-right font-mono tabular-nums text-xs text-text-secondary sm:table-cell">
                    {ev.weight_change_pct != null
                      ? `${ev.weight_change_pct > 0 ? '+' : ''}${ev.weight_change_pct.toFixed(2)}pp`
                      : '—'}
                  </td>
                  <td
                    className={`hidden px-5 py-3 text-right font-mono tabular-nums text-xs lg:table-cell ${pnlColor(ev.cumulative_return_since_event_pct)}`}
                    title={
                      ev.cumulative_return_since_event_pct != null
                        ? `Return from event date to last refresh`
                        : undefined
                    }
                  >
                    {ev.cumulative_return_since_event_pct != null
                      ? formatPct(ev.cumulative_return_since_event_pct)
                      : '—'}
                  </td>
                  <td
                    className="hidden max-w-[220px] truncate px-5 py-3 text-xs text-text-muted lg:table-cell"
                    title={ev.reason ?? undefined}
                  >
                    {ev.reason ?? '—'}
                  </td>
                </tr>
              );
            })}
            {activityEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-text-muted">
                  No trades or rebalances in view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
