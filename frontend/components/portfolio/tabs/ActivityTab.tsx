'use client';

import { useMemo, useState } from 'react';
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

/** ISO date YYYY-MM-DD + calendar days (UTC-safe for portfolio dates). */
function addCalendarDays(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

type RangePreset = '7d' | '30d' | 'all';

export default function ActivityTab(props: {
  activityEvents: DashboardPositionEvent[];
  thesisById: Map<string, Thesis>;
  /** Latest portfolio snapshot date — used for “today” NEW badges and range anchor. */
  lastRunDate: string | null;
}) {
  const { activityEvents, thesisById, lastRunDate } = props;
  const [preset, setPreset] = useState<RangePreset>('7d');
  const [includeHolds, setIncludeHolds] = useState(false);

  const anchorDate = lastRunDate ?? activityEvents[0]?.date ?? null;

  const visibleEvents = useMemo(
    () => (includeHolds ? activityEvents : activityEvents.filter((ev) => ev.event !== 'HOLD')),
    [activityEvents, includeHolds]
  );

  const filteredEvents = useMemo(() => {
    if (preset === 'all' || !anchorDate) return visibleEvents;
    const days = preset === '7d' ? 7 : 30;
    const cutoff = addCalendarDays(anchorDate, -days);
    return visibleEvents.filter((ev) => ev.date >= cutoff);
  }, [visibleEvents, preset, anchorDate]);

  const rangeSummary = useMemo(() => {
    if (preset === 'all')
      return `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} (all)`;
    if (!anchorDate) return `${filteredEvents.length} in window`;
    const days = preset === '7d' ? 7 : 30;
    return `${filteredEvents.length} in last ${days} days`;
  }, [preset, filteredEvents.length, anchorDate]);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="border-b border-border-subtle bg-bg-secondary px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Activity</h3>
            <p className="mt-1 text-xs text-text-muted md:hidden">
              Swipe horizontally for full columns, or use a larger screen.
            </p>
            <p className="mt-1 text-[11px] text-text-muted font-mono">{rangeSummary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Show</span>
            {(['7d', '30d', 'all'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setPreset(k)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                  preset === k
                    ? 'border-fin-blue/40 bg-fin-blue/15 text-fin-blue'
                    : 'border-border-subtle text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                {k === '7d' ? '7 days' : k === '30d' ? '30 days' : 'All'}
              </button>
            ))}
            <label className="ml-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-muted select-none">
              <input
                type="checkbox"
                className="accent-fin-blue"
                checked={includeHolds}
                onChange={(e) => setIncludeHolds(e.target.checked)}
              />
              Holds
            </label>
          </div>
        </div>
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
            {filteredEvents.map((ev, i) => {
              const thesisName = ev.thesis_id ? thesisById.get(ev.thesis_id)?.name ?? ev.thesis_id : null;
              const detailParts = [
                ev.reason ? `Reason: ${ev.reason}` : null,
                thesisName ? `Thesis: ${thesisName}` : ev.thesis_id ? `Thesis id: ${ev.thesis_id}` : null,
                ev.price != null ? `Price: $${Number(ev.price).toFixed(2)}` : null,
              ].filter(Boolean);
              const rowTitle = detailParts.length ? detailParts.join('\n') : undefined;
              const isNewDay = Boolean(lastRunDate && ev.date === lastRunDate);
              return (
                <tr key={`${ev.date}-${ev.ticker}-${i}`} className="hover:bg-white/[0.02]" title={rowTitle}>
                  <td className="px-3 py-3 font-mono text-xs text-text-secondary md:px-5">
                    <span className="inline-flex items-center gap-2">
                      {ev.date}
                      {isNewDay ? (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-fin-amber/20 text-fin-amber border border-fin-amber/30">
                          New
                        </span>
                      ) : null}
                    </span>
                  </td>
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
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-text-muted">
                  {activityEvents.length === 0
                    ? 'No trades or rebalances in view.'
                    : `No activity in this window (${preset === '7d' ? '7' : preset === '30d' ? '30' : ''} days). Try a wider range.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
