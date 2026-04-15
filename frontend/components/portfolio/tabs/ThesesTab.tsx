'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { SectionTitle } from '@/components/ui';
import MiniCalendar, { type MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import { SleeveStackedChart } from '@/components/portfolio/sleeve-stacked-chart';
import type { Thesis } from '@/lib/types';
import type { SleeveStackMode } from '@/lib/portfolio-aggregates';

export default function ThesesTab(props: {
  historyTimelineDates: string[];
  portfolioHistoryRunKindByDate: Map<string, MiniCalendarRunKind>;
  effHistoryDate: string | null;
  onSelectHistoryDate: (iso: string) => void;
  historyLatestDate: string | null;
  onClearHistoryDate: () => void;
  historyMode: SleeveStackMode;
  setHistoryMode: (m: SleeveStackMode) => void;
  sleeveData: Array<Record<string, number | string>>;
  sleeveKeys: string[];
  formatSleeveKey: (k: string) => string;
  showHistoryDateBanner: boolean;
  dateParam: string | null;
  thesisBookRowsForHistoryDate: { id: string; thesis: Thesis | null; weight: number }[];
  researchStripLinksForHistoryDate: { label: string; docKey: string }[];
  lastUpdated: string | null;
  portfolioDocDates: Set<string>;
  positionHistoryDates: Set<string>;
}) {
  const {
    historyTimelineDates,
    portfolioHistoryRunKindByDate,
    effHistoryDate,
    onSelectHistoryDate,
    historyLatestDate,
    onClearHistoryDate,
    historyMode,
    setHistoryMode,
    sleeveData,
    sleeveKeys,
    formatSleeveKey,
    showHistoryDateBanner,
    dateParam,
    thesisBookRowsForHistoryDate,
    researchStripLinksForHistoryDate,
    lastUpdated,
    portfolioDocDates,
    positionHistoryDates,
  } = props;

  const router = useRouter();

  const selectHistoryDate = useCallback(
    (iso: string) => {
      onSelectHistoryDate(iso);
    },
    [onSelectHistoryDate]
  );

  const clearHistoryDate = useCallback(() => {
    onClearHistoryDate();
  }, [onClearHistoryDate]);

  function thesisDetailHref(id: string): string {
    return `/portfolio/theses/${encodeURIComponent(id)}`;
  }

  return (
    <div className="flex gap-6 max-lg:flex-col">
      <div className="w-56 shrink-0 space-y-4 max-lg:w-full max-lg:flex max-lg:gap-4 max-lg:flex-wrap">
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-text-muted px-0.5">History</p>
          {historyTimelineDates.length > 0 ? (
            <MiniCalendar
              dates={historyTimelineDates}
              runKindByDate={portfolioHistoryRunKindByDate}
              selected={effHistoryDate}
              onSelect={selectHistoryDate}
            />
          ) : (
            <div className="glass-card p-4 text-xs text-text-muted">No dated history yet.</div>
          )}
        </div>
        {historyLatestDate && effHistoryDate && effHistoryDate !== historyLatestDate ? (
          <button
            type="button"
            onClick={clearHistoryDate}
            className="w-full text-xs py-2 rounded-lg border border-border-subtle text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Jump to latest ({historyLatestDate})
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-0.5">
            <Calendar size={15} className="text-fin-blue shrink-0" aria-hidden />
            <span className="text-xs font-medium text-text-muted font-mono">{effHistoryDate ?? '—'}</span>
            {effHistoryDate &&
            !portfolioDocDates.has(effHistoryDate) &&
            positionHistoryDates.has(effHistoryDate) ? (
              <span className="text-xs text-text-muted ml-2">
                No portfolio documents indexed for this date; sleeve chart uses position history.
              </span>
            ) : null}
          </div>

          {researchStripLinksForHistoryDate.length > 0 && effHistoryDate ? (
            <div className="glass-card px-4 py-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Global thesis docs</span>
              {researchStripLinksForHistoryDate.map((l) => (
                <Link
                  key={l.docKey}
                  href={`/research?tab=daily&date=${encodeURIComponent(effHistoryDate)}&docKey=${encodeURIComponent(l.docKey)}`}
                  className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] text-fin-blue hover:bg-fin-blue/10 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="space-y-4">
            {effHistoryDate && lastUpdated && effHistoryDate !== lastUpdated ? (
              <p className="text-xs text-text-muted px-1">
                Weights as of <span className="font-mono text-text-secondary">{effHistoryDate}</span>. Thesis
                text from digest <span className="font-mono text-text-secondary">{lastUpdated}</span>.
              </p>
            ) : null}

            <div className="glass-card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Theses</h3>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">{effHistoryDate ?? '—'}</p>
                </div>
                <p className="text-[11px] text-text-muted">Click a row to open the thesis page</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-0 text-sm md:min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-4 py-3 text-left md:px-5">Thesis</th>
                      <th className="px-4 py-3 text-right md:px-5">Weight</th>
                      <th className="hidden px-5 py-3 text-left md:table-cell">Vehicle</th>
                      <th className="px-4 py-3 text-left md:px-5">Status</th>
                      <th className="hidden px-5 py-3 text-left lg:table-cell">Invalidation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {thesisBookRowsForHistoryDate.map((row) => {
                      const label =
                        row.id === '_unlinked' ? 'Unlinked positions' : row.thesis?.name ?? row.id;
                      const status = row.thesis?.status?.toLowerCase() ?? '';
                      const statusAccent =
                        status.includes('active') || status.includes('open')
                          ? 'border-l-2 border-l-fin-green/70'
                          : status.includes('watch') || status.includes('monitor')
                            ? 'border-l-2 border-l-fin-amber/70'
                            : status.includes('invalid') || status.includes('exit') || status.includes('closed')
                              ? 'border-l-2 border-l-fin-red/70'
                              : row.id === '_unlinked'
                                ? 'border-l-2 border-l-white/10'
                                : 'border-l-2 border-l-transparent';
                      return (
                          <tr
                            key={row.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              router.push(thesisDetailHref(row.id));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                router.push(thesisDetailHref(row.id));
                              }
                            }}
                            className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${statusAccent}`}
                          >
                            <td className="px-4 py-3 font-medium md:px-5">{label}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums md:px-5">
                              {row.weight.toFixed(1)}%
                            </td>
                            <td className="hidden px-5 py-3 font-mono text-xs text-text-secondary md:table-cell">
                              {row.thesis?.vehicle ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary md:px-5">
                              {row.thesis?.status ?? '—'}
                            </td>
                            <td
                              className="hidden max-w-[200px] truncate px-5 py-3 text-xs text-text-muted lg:table-cell"
                              title={row.thesis?.invalidation ?? undefined}
                            >
                              {row.thesis?.invalidation ?? '—'}
                            </td>
                          </tr>
                      );
                    })}
                    {thesisBookRowsForHistoryDate.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-text-muted">
                          No theses in latest snapshot
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle className="mb-0">Sleeves</SectionTitle>
              <div className="flex rounded-lg border border-border-subtle overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setHistoryMode('ticker')}
                  className={`px-3 py-1.5 font-medium ${historyMode === 'ticker' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                >
                  Ticker
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMode('category')}
                  className={`px-3 py-1.5 font-medium border-l border-border-subtle ${historyMode === 'category' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                >
                  Category
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMode('thesis')}
                  className={`px-3 py-1.5 font-medium border-l border-border-subtle ${historyMode === 'thesis' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                >
                  Thesis
                </button>
              </div>
            </div>
            {showHistoryDateBanner ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fin-blue/30 bg-fin-blue/10 px-3 py-2 text-xs">
                <span className="text-text-secondary">
                  <span className="font-mono text-text-primary">{dateParam}</span>
                  <span className="text-text-muted"> — chart or calendar</span>
                </span>
                <button
                  type="button"
                  onClick={onClearHistoryDate}
                  className="shrink-0 px-2 py-1 rounded border border-border-subtle hover:bg-white/[0.06] text-text-primary"
                >
                  Clear
                </button>
              </div>
            ) : null}
            <div className="h-[380px]" aria-label="Sleeve weights stacked over time">
              <SleeveStackedChart
                data={sleeveData}
                keys={sleeveKeys}
                formatKey={formatSleeveKey}
                selectedDate={effHistoryDate}
                onChartDateSelect={selectHistoryDate}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
