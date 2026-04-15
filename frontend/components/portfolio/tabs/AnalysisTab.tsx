'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { SectionTitle } from '@/components/ui';
import MiniCalendar, { type MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import DocumentExpandInline from '@/components/library/DocumentExpandInline';
import { SleeveStackedChart } from '@/components/portfolio/sleeve-stacked-chart';
import StrategyThesisPanel from '@/components/portfolio/StrategyThesisPanel';
import type { Doc, Thesis } from '@/lib/types';
import type { LibraryDocumentResult } from '@/lib/queries';
import type { SleeveStackMode } from '@/lib/portfolio-aggregates';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalysisTab(props: {
  historyTimelineDates: string[];
  portfolioHistoryRunKindByDate: Map<string, MiniCalendarRunKind>;
  effHistoryDate: string | null;
  onSelectHistoryDate: (iso: string) => void;
  historyLatestDate: string | null;
  onClearHistoryDate: () => void;
  highlightThesisParam: string | null;
  thesisHref: (thesisId: string) => string;
  clearThesisHref: string;
  historyMode: SleeveStackMode;
  setHistoryMode: (m: SleeveStackMode) => void;
  sleeveData: Array<Record<string, number | string>>;
  sleeveKeys: string[];
  formatSleeveKey: (k: string) => string;
  showHistoryDateBanner: boolean;
  dateParam: string | null;
  thesisBarForChartForHistoryDate: { name: string; value: number }[];
  thesisBookRowsForHistoryDate: { id: string; thesis: Thesis | null; weight: number }[];
  researchStripLinksForHistoryDate: { label: string; docKey: string }[];
  lastUpdated: string | null;
  pmDocsForHistory: Doc[];
  portfolioDocDates: Set<string>;
  positionHistoryDates: Set<string>;
  pmActiveFile: Doc | null;
  pmLibraryDoc: LibraryDocumentResult | null;
  pmLoading: boolean;
  onOpenPmDocument: (doc: Doc) => void;
  onClosePmDocument: () => void;
}) {
  const {
    historyTimelineDates,
    portfolioHistoryRunKindByDate,
    effHistoryDate,
    onSelectHistoryDate,
    historyLatestDate,
    onClearHistoryDate,
    highlightThesisParam,
    thesisHref,
    clearThesisHref,
    historyMode,
    setHistoryMode,
    sleeveData,
    sleeveKeys,
    formatSleeveKey,
    showHistoryDateBanner,
    dateParam,
    thesisBarForChartForHistoryDate,
    thesisBookRowsForHistoryDate,
    researchStripLinksForHistoryDate,
    lastUpdated,
    pmDocsForHistory,
    portfolioDocDates,
    positionHistoryDates,
    pmActiveFile,
    pmLibraryDoc,
    pmLoading,
    onOpenPmDocument,
    onClosePmDocument,
  } = props;

  const [expandedThesisId, setExpandedThesisId] = useState<string | null>(null);

  return (
    <div className="flex gap-6 max-lg:flex-col">
      <div className="w-56 shrink-0 space-y-4 max-lg:w-full max-lg:flex max-lg:gap-4 max-lg:flex-wrap">
        {historyTimelineDates.length > 0 ? (
          <MiniCalendar
            dates={historyTimelineDates}
            runKindByDate={portfolioHistoryRunKindByDate}
            selected={effHistoryDate}
            onSelect={onSelectHistoryDate}
          />
        ) : (
          <div className="glass-card p-4 text-xs text-text-muted">No dated history yet.</div>
        )}
        {historyLatestDate && effHistoryDate && effHistoryDate !== historyLatestDate ? (
          <button
            type="button"
            onClick={onClearHistoryDate}
            className="w-full text-xs py-2 rounded-lg border border-border-subtle text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Jump to latest ({historyLatestDate})
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 space-y-10">
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">1 · Thesis &amp; strategy</p>
          <StrategyThesisPanel
            highlightThesisId={highlightThesisParam}
            thesisHref={thesisHref}
            clearThesisHref={clearThesisHref}
          />
        </section>

        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            2 · Portfolio / sleeve evolution
          </p>
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle className="mb-0">Sleeve evolution</SectionTitle>
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
                  Viewing snapshot <span className="font-mono text-text-primary">{dateParam}</span>
                  <span className="text-text-muted"> — click the chart or calendar to change.</span>
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
                aggregateOtherNote={historyMode === 'ticker'}
                selectedDate={effHistoryDate}
                onChartDateSelect={onSelectHistoryDate}
              />
            </div>
          </div>

          <div className="space-y-4">
            {effHistoryDate && lastUpdated && effHistoryDate !== lastUpdated ? (
              <p className="text-xs text-text-muted px-1">
                Weights below are for <span className="font-mono text-text-secondary">{effHistoryDate}</span>. Thesis
                names, notes, and metadata are from the latest digest snapshot (
                <span className="font-mono text-text-secondary">{lastUpdated}</span>).
              </p>
            ) : null}
            <div className="glass-card p-6">
              <SectionTitle className="mb-1">Weight by thesis</SectionTitle>
              <p className="text-xs text-text-muted mb-4">
                Book aggregated from position history for{' '}
                <span className="font-mono text-text-secondary">{effHistoryDate ?? '—'}</span>.
              </p>
              <div className="h-[280px]">
                {thesisBarForChartForHistoryDate.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-12">No thesis-linked weights on this date</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={thesisBarForChartForHistoryDate}
                      margin={{ left: 8, right: 16, top: 8, bottom: 48 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        interval={0}
                        angle={-24}
                        textAnchor="end"
                        height={56}
                      />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                        }}
                        formatter={(val: number) => [`${Number(val).toFixed(1)}%`, 'Weight']}
                      />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary">
                <h3 className="text-sm font-semibold">Thesis tracker</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-0 text-sm md:min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-4 py-3 text-left md:px-5">Thesis</th>
                      <th className="px-4 py-3 text-right md:px-5">Weight</th>
                      <th className="hidden px-5 py-3 text-left md:table-cell">Vehicle</th>
                      <th className="px-4 py-3 text-left md:px-5">Status</th>
                      <th className="hidden px-5 py-3 text-left lg:table-cell">Invalidation</th>
                      <th className="w-10 px-2 py-3 md:px-5" aria-label="Expand" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {thesisBookRowsForHistoryDate.map((row) => {
                      const isOpen = expandedThesisId === row.id;
                      const label =
                        row.id === '_unlinked' ? 'Unlinked positions' : row.thesis?.name ?? row.id;
                      return (
                        <Fragment key={row.id}>
                          <tr
                            onClick={() => setExpandedThesisId(isOpen ? null : row.id)}
                            className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-medium md:px-5">{label}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums md:px-5">
                              {row.weight.toFixed(1)}%
                            </td>
                            <td className="hidden px-5 py-3 font-mono text-xs text-text-secondary md:table-cell">
                              {row.thesis?.vehicle ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary md:px-5">{row.thesis?.status ?? '—'}</td>
                            <td
                              className="hidden max-w-[200px] truncate px-5 py-3 text-xs text-text-muted lg:table-cell"
                              title={row.thesis?.invalidation ?? undefined}
                            >
                              {row.thesis?.invalidation ?? '—'}
                            </td>
                            <td className="px-2 py-3 text-text-muted md:px-5">
                              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-white/[0.02]">
                              <td colSpan={6} className="border-t border-border-subtle px-4 py-5 md:px-6">
                                {row.id === '_unlinked' ? (
                                  <p className="text-text-muted text-sm leading-relaxed">
                                    Positions on this date are not linked to a named thesis in position history.
                                  </p>
                                ) : (
                                  <>
                                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                      Summary
                                    </h4>
                                    <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                      {row.thesis?.notes?.trim() || 'No summary in snapshot.'}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                      <div className="rounded-lg border border-border-subtle bg-bg-secondary/80 p-3">
                                        <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                          Vehicle
                                        </span>
                                        <p className="text-sm mt-1">{row.thesis?.vehicle ?? '—'}</p>
                                      </div>
                                      <div className="rounded-lg border border-border-subtle bg-bg-secondary/80 p-3">
                                        <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                          Status
                                        </span>
                                        <p className="text-sm mt-1">{row.thesis?.status ?? '—'}</p>
                                      </div>
                                      <div className="rounded-lg border border-border-subtle bg-bg-secondary/80 p-3">
                                        <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                          Invalidation
                                        </span>
                                        <p className="text-sm mt-1 leading-snug">{row.thesis?.invalidation ?? '—'}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                                {researchStripLinksForHistoryDate.length > 0 && effHistoryDate ? (
                                  <div className="mt-5 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-text-muted">Research</span>
                                    {researchStripLinksForHistoryDate.map((l) => (
                                      <Link
                                        key={l.docKey}
                                        href={`/research?tab=daily&date=${encodeURIComponent(effHistoryDate)}&docKey=${encodeURIComponent(l.docKey)}`}
                                        className="text-xs px-2.5 py-1 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                                      >
                                        {l.label}
                                      </Link>
                                    ))}
                                    <Link
                                      href="/research?tab=daily"
                                      className="text-xs text-fin-blue/80 hover:text-fin-blue hover:underline"
                                    >
                                      Open research
                                    </Link>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </Fragment>
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

        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            3 · PM deliberation &amp; decisions
          </p>
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar size={16} className="text-fin-amber shrink-0" aria-hidden />
                <h3 className="text-sm font-semibold">Portfolio management artifacts</h3>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Deliberation, rebalance decisions, recommendations, and screener output for{' '}
                <span className="font-mono text-text-secondary">{effHistoryDate ?? '—'}</span>.
                {effHistoryDate &&
                pmDocsForHistory.length === 0 &&
                !portfolioDocDates.has(effHistoryDate) &&
                positionHistoryDates.has(effHistoryDate) ? (
                  <span className="block mt-1">
                    No PM documents on this date; thesis and sleeve sections above still reflect this snapshot.
                  </span>
                ) : null}
              </p>
            </div>
            {pmDocsForHistory.length === 0 ? (
              <div className="px-5 py-10 text-center text-text-muted text-sm">
                No portfolio process documents for this date.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {pmDocsForHistory.map((d) => {
                  const active = pmActiveFile?.id === d.id;
                  return (
                    <div key={d.id}>
                      <button
                        type="button"
                        onClick={() => onOpenPmDocument(d)}
                        className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors ${
                          active ? 'bg-fin-amber/5' : ''
                        }`}
                      >
                        <FileText size={14} className="text-fin-amber/70 shrink-0" />
                        <span className="font-mono text-sm">{d.title || d.filename || d.path}</span>
                        <span className="ml-auto text-[11px] text-text-muted">{d.phase ?? ''}</span>
                      </button>
                      {active && pmActiveFile ? (
                        <DocumentExpandInline
                          accent="amber"
                          hideTitleBar
                          title={pmActiveFile.title || pmActiveFile.filename || pmActiveFile.path}
                          subtitle={pmActiveFile.date ?? null}
                          loading={pmLoading}
                          libraryDoc={pmLibraryDoc}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
