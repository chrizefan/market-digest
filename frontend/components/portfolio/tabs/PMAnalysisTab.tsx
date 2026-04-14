'use client';

import { Calendar, FileText, X } from 'lucide-react';
import LibraryDocumentBody from '@/components/library/LibraryDocumentBody';
import MiniCalendar, { type MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import type { Doc } from '@/lib/types';
import type { LibraryDocumentResult } from '@/lib/queries';

export default function PMAnalysisTab(props: {
  historyTimelineDates: string[];
  portfolioHistoryRunKindByDate: Map<string, MiniCalendarRunKind>;
  effHistoryDate: string | null;
  onSelectHistoryDate: (iso: string) => void;
  historyLatestDate: string | null;
  onClearHistoryDate: () => void;
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
    pmDocsForHistory,
    portfolioDocDates,
    positionHistoryDates,
    pmActiveFile,
    pmLibraryDoc,
    pmLoading,
    onOpenPmDocument,
    onClosePmDocument,
  } = props;

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

      <div className="flex-1 min-w-0 space-y-6">
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
                  No PM documents on this date; sleeve and thesis sections on the Theses tab still reflect this
                  snapshot.
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
                  <button
                    key={d.id}
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
                );
              })}
            </div>
          )}
        </div>

        {pmActiveFile ? (
          <div className="glass-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <FileText size={14} className="text-fin-amber shrink-0" />
                <span className="font-mono truncate">{pmActiveFile.title || pmActiveFile.filename}</span>
              </div>
              <button
                type="button"
                onClick={onClosePmDocument}
                className="text-text-muted hover:text-white shrink-0"
                aria-label="Close document"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 max-w-none text-sm leading-relaxed overflow-auto max-h-[70vh]">
              {pmLoading || !pmLibraryDoc ? (
                <div className="text-text-secondary">Loading document…</div>
              ) : (
                <LibraryDocumentBody
                  view={pmLibraryDoc.view}
                  markdown={pmLibraryDoc.markdown}
                  payload={pmLibraryDoc.payload}
                  documentKey={pmLibraryDoc.document_key}
                  docDate={pmLibraryDoc.date}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
