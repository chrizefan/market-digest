'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Change } from 'diff';
import { diffLines, diffWords } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  loadDigestLibraryDiff,
  type DigestCompareKind,
  type DigestDiffContext,
} from '@/lib/queries';

type Mode = 'review' | 'split' | 'formatted';

function isTableLine(s: string): boolean {
  const t = s.trimStart();
  return t.startsWith('|');
}

/** Collapse adjacent removed+added line hunks for word-level highlighting. */
function lineDiffToItems(parts: Change[]): LineDiffItem[] {
  const items: LineDiffItem[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.added) {
      items.push({ kind: 'added', text: p.value });
      continue;
    }
    if (p.removed) {
      const next = parts[i + 1];
      if (next?.added) {
        items.push({ kind: 'wordSwap', oldText: p.value, newText: next.value });
        i += 1;
      } else {
        items.push({ kind: 'removed', text: p.value });
      }
      continue;
    }
    items.push({ kind: 'equal', text: p.value });
  }
  return items;
}

type LineDiffItem =
  | { kind: 'equal'; text: string }
  | { kind: 'removed'; text: string }
  | { kind: 'added'; text: string }
  | { kind: 'wordSwap'; oldText: string; newText: string };

function WordSwapBlock({ oldText, newText }: { oldText: string; newText: string }) {
  const wparts = diffWords(oldText, newText);
  const mono = isTableLine(oldText) || isTableLine(newText);
  return (
    <div
      className={`whitespace-pre-wrap px-3 py-1 border-l-2 border-amber-500/50 bg-bg-secondary/60 leading-relaxed text-text-secondary/95 ${
        mono ? 'font-mono text-[12px]' : 'text-sm font-sans'
      }`}
    >
      {wparts.map((w, j) => {
        if (w.added) {
          return (
            <span
              key={j}
              className="bg-emerald-950/55 text-emerald-100 rounded-sm px-0.5 border-b border-emerald-500/60"
            >
              {w.value}
            </span>
          );
        }
        if (w.removed) {
          return (
            <span
              key={j}
              className="bg-red-950/50 text-red-100/95 line-through decoration-red-300/50 rounded-sm px-0.5"
            >
              {w.value}
            </span>
          );
        }
        return <span key={j}>{w.value}</span>;
      })}
    </div>
  );
}

export default function DigestDocumentView({
  docDate,
  fallbackMarkdown,
}: {
  docDate: string;
  fallbackMarkdown: string;
}) {
  const [mode, setMode] = useState<Mode>('review');
  const [compareKind, setCompareKind] = useState<DigestCompareKind>('previous_digest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<DigestDiffContext | null>(null);
  const [pair, setPair] = useState<Awaited<ReturnType<typeof loadDigestLibraryDiff>>['pair']>(null);

  useEffect(() => {
    let cancelled = false;
    // Re-enter loading when date or compare target changes (stale diff until fetch completes).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setLoading(true);
    setError(null);
    loadDigestLibraryDiff(docDate, compareKind)
      .then(({ context: ctx, pair: p }) => {
        if (!cancelled) {
          setContext(ctx);
          setPair(p);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setContext(null);
          setPair(null);
          setError(e instanceof Error ? e.message : 'Failed to load diff');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [docDate, compareKind]);

  const lineItems = useMemo(() => {
    if (!pair) return [];
    return lineDiffToItems(diffLines(pair.beforeMarkdown, pair.afterMarkdown));
  }, [pair]);

  const hasDiff = useMemo(() => lineItems.some((it) => it.kind !== 'equal'), [lineItems]);

  if (loading) {
    return <p className="text-text-muted text-sm">Loading digest…</p>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-fin-red text-xs">{error}</p>
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const showCompareChrome = context !== null;
  const canComparePrevious = !!context?.previousDigestDate;
  const canCompareBaseline = !!context?.deltaBaselineDate;

  if (!pair) {
    return (
      <div className="space-y-4">
        {showCompareChrome ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center text-xs">
            <span className="text-text-muted shrink-0">Compare digest to</span>
            <div className="flex flex-wrap rounded-md border border-border-subtle overflow-hidden">
              <button
                type="button"
                disabled={!canComparePrevious}
                onClick={() => setCompareKind('previous_digest')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  compareKind === 'previous_digest'
                    ? 'bg-fin-blue/25 text-fin-blue'
                    : 'text-text-muted hover:text-white bg-bg-secondary'
                }`}
                title={
                  canComparePrevious
                    ? 'Latest prior daily snapshot (usually yesterday)'
                    : 'No earlier snapshot for this date'
                }
              >
                Previous digest
                {context?.previousDigestDate ? (
                  <span className="font-mono text-[10px] text-text-muted ml-1">{context.previousDigestDate}</span>
                ) : null}
              </button>
              <button
                type="button"
                disabled={!canCompareBaseline}
                onClick={() => setCompareKind('delta_baseline')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed ${
                  compareKind === 'delta_baseline'
                    ? 'bg-fin-blue/25 text-fin-blue'
                    : 'text-text-muted hover:text-white bg-bg-secondary'
                }`}
                title={
                  canCompareBaseline
                    ? 'Weekly / delta baseline from delta-request or snapshot row'
                    : 'No baseline_date on this run'
                }
              >
                Delta baseline
                {context?.deltaBaselineDate ? (
                  <span className="font-mono text-[10px] text-text-muted ml-1">{context.deltaBaselineDate}</span>
                ) : null}
              </button>
            </div>
            {context && context.changeCount > 0 ? (
              <span className="text-text-muted">
                {context.changeCount} path{context.changeCount !== 1 ? 's' : ''} in delta-request
              </span>
            ) : null}
          </div>
        ) : null}
        {compareKind === 'delta_baseline' && canCompareBaseline ? (
          <p className="text-text-muted text-sm">
            Could not load snapshots for the delta baseline date, or the current digest is empty.
          </p>
        ) : compareKind === 'previous_digest' && canComparePrevious ? (
          <p className="text-text-muted text-sm">
            {`Could not load markdown for the prior snapshot or today's row (check daily_snapshots).`}
          </p>
        ) : compareKind === 'previous_digest' && !canComparePrevious ? (
          <p className="text-text-muted text-sm">No earlier digest snapshot to compare.</p>
        ) : null}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center text-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-text-muted shrink-0">Compare digest to</span>
          <div className="flex flex-wrap rounded-md border border-border-subtle overflow-hidden">
            <button
              type="button"
              disabled={!canComparePrevious}
              onClick={() => setCompareKind('previous_digest')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                compareKind === 'previous_digest'
                  ? 'bg-fin-blue/25 text-fin-blue'
                  : 'text-text-muted hover:text-white bg-bg-secondary'
              }`}
              title={
                canComparePrevious
                  ? 'Latest prior daily snapshot (usually yesterday)'
                  : 'No earlier snapshot for this date'
              }
            >
              Previous digest
              {context?.previousDigestDate ? (
                <span className="font-mono text-[10px] text-text-muted ml-1">{context.previousDigestDate}</span>
              ) : null}
            </button>
            <button
              type="button"
              disabled={!canCompareBaseline}
              onClick={() => setCompareKind('delta_baseline')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed ${
                compareKind === 'delta_baseline'
                  ? 'bg-fin-blue/25 text-fin-blue'
                  : 'text-text-muted hover:text-white bg-bg-secondary'
              }`}
              title={
                canCompareBaseline
                  ? 'Weekly / delta baseline from delta-request or snapshot row'
                  : 'No baseline_date on this run'
              }
            >
              Delta baseline
              {context?.deltaBaselineDate ? (
                <span className="font-mono text-[10px] text-text-muted ml-1">{context.deltaBaselineDate}</span>
              ) : null}
            </button>
          </div>
        </div>
        <span className="text-text-muted lg:ml-auto">
          Showing diff vs <span className="font-mono text-fin-blue">{pair.compareDate}</span>
          {pair.changeCount > 0 ? (
            <span>
              {' '}
              · {pair.changeCount} path{pair.changeCount !== 1 ? 's' : ''} in delta-request
            </span>
          ) : null}
        </span>
        <div className="flex flex-wrap rounded-md border border-border-subtle overflow-hidden w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode('review')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'review' ? 'bg-fin-blue/25 text-fin-blue' : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Inline diff
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle ${
              mode === 'split' ? 'bg-fin-blue/25 text-fin-blue' : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Side-by-side
          </button>
          <button
            type="button"
            onClick={() => setMode('formatted')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle ${
              mode === 'formatted' ? 'bg-fin-blue/25 text-fin-blue' : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Formatted digest
          </button>
        </div>
      </div>

      {mode === 'review' ? (
        <div>
          {!hasDiff ? (
            <p className="text-text-muted text-sm mb-3">No changes vs prior snapshot (try formatted or side-by-side).</p>
          ) : (
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              Line diff with word highlights where a line was replaced · removed (red) · added (green)
            </p>
          )}
          <div className="rounded-lg border border-border-subtle bg-bg-secondary/40 text-sm leading-relaxed max-h-[min(62vh,720px)] overflow-auto">
            {lineItems.map((item, i) => {
              if (item.kind === 'wordSwap') {
                return <WordSwapBlock key={i} oldText={item.oldText} newText={item.newText} />;
              }
              const mono = isTableLine(item.text);
              const fontClass = mono ? 'font-mono text-[12px]' : 'font-sans';
              if (item.kind === 'added') {
                return (
                  <span
                    key={i}
                    className={`block whitespace-pre-wrap px-3 py-0.5 bg-emerald-950/50 text-emerald-100 border-l-2 border-emerald-500/80 ${fontClass}`}
                  >
                    {item.text}
                  </span>
                );
              }
              if (item.kind === 'removed') {
                return (
                  <span
                    key={i}
                    className={`block whitespace-pre-wrap px-3 py-0.5 bg-red-950/45 text-red-100/95 border-l-2 border-red-500/70 line-through decoration-red-300/50 ${fontClass}`}
                  >
                    {item.text}
                  </span>
                );
              }
              return (
                <span
                  key={i}
                  className={`block whitespace-pre-wrap px-3 py-0.5 text-text-secondary/90 ${fontClass}`}
                >
                  {item.text}
                </span>
              );
            })}
          </div>
        </div>
      ) : mode === 'split' ? (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Prior snapshot (left) · current (right)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[min(62vh,720px)] overflow-auto">
            <div className="rounded-lg border border-border-subtle bg-bg-secondary/30 p-3 min-h-0 overflow-auto">
              <p className="text-[10px] font-mono text-text-muted mb-2">Prior — {pair.compareDate}</p>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{pair.beforeMarkdown}</ReactMarkdown>
              </div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-secondary/30 p-3 min-h-0 overflow-auto">
              <p className="text-[10px] font-mono text-text-muted mb-2">Current — {pair.targetDate}</p>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{pair.afterMarkdown}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{pair.afterMarkdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
