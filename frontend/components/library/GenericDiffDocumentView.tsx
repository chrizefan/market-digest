'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Change } from 'diff';
import { diffLines, diffWords } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDocumentDiff, type DocumentDiffPair } from '@/lib/queries';

type Mode = 'review' | 'split' | 'formatted';

function isTableLine(s: string): boolean {
  return s.trimStart().startsWith('|');
}

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

function compareModeLabel(pair: DocumentDiffPair): string {
  if (pair.compareMode === 'baseline_doc') {
    return `Baseline (${pair.compareDate})`;
  }
  return `Previous day (${pair.compareDate})`;
}

function compareModeTitle(pair: DocumentDiffPair): string {
  if (pair.compareMode === 'baseline_doc') {
    return `Showing delta vs baseline document "${pair.compareKey}" from ${pair.compareDate}`;
  }
  return `Showing diff vs previous day's version from ${pair.compareDate}`;
}

export default function GenericDiffDocumentView({
  docDate,
  documentKey,
  payload,
  fallbackMarkdown,
}: {
  docDate: string;
  documentKey: string;
  payload: Record<string, unknown> | null;
  fallbackMarkdown: string;
}) {
  const [mode, setMode] = useState<Mode>('review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState<DocumentDiffPair | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setError(null);
    loadDocumentDiff(docDate, documentKey, payload)
      .then((p) => {
        if (!cancelled) setPair(p);
      })
      .catch((e) => {
        if (!cancelled) {
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
  }, [docDate, documentKey, payload]);

  const lineItems = useMemo(() => {
    if (!pair) return [];
    return lineDiffToItems(diffLines(pair.beforeMarkdown, pair.afterMarkdown));
  }, [pair]);

  const hasDiff = useMemo(() => lineItems.some((it) => it.kind !== 'equal'), [lineItems]);

  if (loading) {
    return <p className="text-text-muted text-sm">Loading diff…</p>;
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

  if (!pair) {
    return (
      <div className="space-y-3">
        <p className="text-text-muted text-xs">
          No prior version found to compare against — showing current document.
        </p>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center text-xs">
        <span className="text-text-muted shrink-0" title={compareModeTitle(pair)}>
          Diff vs{' '}
          <span className="font-mono text-fin-blue">{compareModeLabel(pair)}</span>
        </span>

        <div className="flex flex-wrap rounded-md border border-border-subtle overflow-hidden lg:ml-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode('review')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'review'
                ? 'bg-fin-blue/25 text-fin-blue'
                : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Inline diff
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle ${
              mode === 'split'
                ? 'bg-fin-blue/25 text-fin-blue'
                : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Side-by-side
          </button>
          <button
            type="button"
            onClick={() => setMode('formatted')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border-subtle ${
              mode === 'formatted'
                ? 'bg-fin-blue/25 text-fin-blue'
                : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Current
          </button>
        </div>
      </div>

      {/* Inline diff */}
      {mode === 'review' && (
        <div>
          {!hasDiff ? (
            <p className="text-text-muted text-sm mb-3">
              No text changes vs prior version (try side-by-side or current view).
            </p>
          ) : (
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              Line diff with word highlights where a line was replaced · removed (red) · added
              (green)
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
      )}

      {/* Side-by-side */}
      {mode === 'split' && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Prior version (left) · current (right)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[min(62vh,720px)] overflow-auto">
            <div className="rounded-lg border border-border-subtle bg-bg-secondary/30 p-3 min-h-0 overflow-auto">
              <p className="text-[10px] font-mono text-text-muted mb-2">
                {pair.compareMode === 'baseline_doc' ? 'Baseline' : 'Prior day'} — {pair.compareDate}
              </p>
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
      )}

      {/* Current (formatted) */}
      {mode === 'formatted' && (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{pair.afterMarkdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
