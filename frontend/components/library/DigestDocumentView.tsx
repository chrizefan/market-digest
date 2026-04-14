'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Change } from 'diff';
import { diffLines, diffWords } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchDigestDiffContext,
  loadDigestLibraryDiff,
  type DigestCompareKind,
  type DigestDiffContext,
} from '@/lib/queries';

type ViewMode = 'compiled' | 'inline' | 'split';

function isTableLine(s: string): boolean {
  const t = s.trimStart();
  return t.startsWith('|');
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

function comparePresetLabel(kind: DigestCompareKind, ctx: DigestDiffContext | null): string {
  if (kind === 'delta_baseline') return ctx?.deltaBaselineDate ? `Delta baseline (${ctx.deltaBaselineDate})` : 'Delta baseline';
  if (kind === 'custom_date') return 'Custom snapshot date';
  return ctx?.previousDigestDate ? `Previous digest (${ctx.previousDigestDate})` : 'Previous digest';
}

export default function DigestDocumentView({
  docDate,
  fallbackMarkdown,
}: {
  docDate: string;
  fallbackMarkdown: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('compiled');
  const [compareKind, setCompareKind] = useState<DigestCompareKind>('previous_digest');
  const [customCompareDate, setCustomCompareDate] = useState('');
  const [contextLoading, setContextLoading] = useState(true);
  const [pairLoading, setPairLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<DigestDiffContext | null>(null);
  const [pair, setPair] = useState<Awaited<ReturnType<typeof loadDigestLibraryDiff>>['pair']>(null);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- fetch lifecycle: show loading until anchors resolve */
    setContextLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchDigestDiffContext(docDate)
      .then((ctx) => {
        if (!cancelled) setContext(ctx);
      })
      .catch((e) => {
        if (!cancelled) {
          setContext(null);
          setError(e instanceof Error ? e.message : 'Failed to load digest context');
        }
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [docDate]);

  useEffect(() => {
    if (viewMode === 'compiled') return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- fetch lifecycle for diff pair */
    setPairLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    const customArg = compareKind === 'custom_date' ? customCompareDate : undefined;
    loadDigestLibraryDiff(docDate, compareKind, customArg)
      .then(({ pair: p }) => {
        if (!cancelled) setPair(p);
      })
      .catch((e) => {
        if (!cancelled) {
          setPair(null);
          setError(e instanceof Error ? e.message : 'Failed to load diff');
        }
      })
      .finally(() => {
        if (!cancelled) setPairLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [docDate, compareKind, customCompareDate, viewMode]);

  const lineItems = useMemo(() => {
    if (!pair) return [];
    return lineDiffToItems(diffLines(pair.beforeMarkdown, pair.afterMarkdown));
  }, [pair]);

  const hasDiff = useMemo(() => lineItems.some((it) => it.kind !== 'equal'), [lineItems]);

  const canComparePrevious = !!context?.previousDigestDate;
  const canCompareBaseline = !!context?.deltaBaselineDate;
  const customReady = compareKind !== 'custom_date' || /^\d{4}-\d{2}-\d{2}$/.test(customCompareDate.trim());

  if (contextLoading) {
    return <p className="text-text-muted text-sm">Loading digest…</p>;
  }

  if (error && !context) {
    return (
      <div className="space-y-3">
        <p className="text-fin-red text-xs">{error}</p>
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const toolbar = context ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end text-xs">
      <label className="flex flex-col gap-1 min-w-[200px]">
        <span className="text-text-muted">Compare to</span>
        <select
          value={compareKind}
          onChange={(e) => setCompareKind(e.target.value as DigestCompareKind)}
          className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-1.5 text-xs text-text-primary"
        >
          <option value="previous_digest" disabled={!canComparePrevious}>
            {comparePresetLabel('previous_digest', context)}
          </option>
          <option value="delta_baseline" disabled={!canCompareBaseline}>
            {comparePresetLabel('delta_baseline', context)}
          </option>
          <option value="custom_date">Custom snapshot date…</option>
        </select>
      </label>
      {compareKind === 'custom_date' ? (
        <label className="flex flex-col gap-1 min-w-[160px]">
          <span className="text-text-muted">Snapshot date</span>
          <input
            type="date"
            value={customCompareDate}
            onChange={(e) => setCustomCompareDate(e.target.value)}
            className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-1.5 text-xs text-text-primary font-mono"
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-1 min-w-[180px]">
        <span className="text-text-muted">View</span>
        <select
          value={viewMode}
          onChange={(e) => {
            const v = e.target.value as ViewMode;
            setViewMode(v);
            if (v === 'compiled') {
              setPair(null);
              setPairLoading(false);
              setError(null);
            }
          }}
          className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-1.5 text-xs text-text-primary"
        >
          <option value="compiled">Current (compiled)</option>
          <option value="inline">Inline diff</option>
          <option value="split">Side-by-side</option>
        </select>
      </label>
      {context.changeCount > 0 ? (
        <span className="text-text-muted sm:ml-auto sm:self-center">
          {context.changeCount} path{context.changeCount !== 1 ? 's' : ''} in delta-request
        </span>
      ) : null}
    </div>
  ) : null;

  if (viewMode === 'compiled') {
    return (
      <div className="space-y-4">
        {toolbar}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (!customReady) {
    return (
      <div className="space-y-4">
        {toolbar}
        <p className="text-text-muted text-sm">Choose a snapshot date to compare.</p>
      </div>
    );
  }

  if (pairLoading) {
    return (
      <div className="space-y-4">
        {toolbar}
        <p className="text-text-muted text-sm">Loading comparison…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        {toolbar}
        <p className="text-fin-red text-xs">{error}</p>
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="space-y-4">
        {toolbar}
        <p className="text-text-muted text-sm">
          {compareKind === 'delta_baseline' && canCompareBaseline
            ? 'Could not load snapshots for the delta baseline date, or the current digest is empty.'
            : compareKind === 'custom_date'
              ? 'No digest snapshot for that date, or the current digest is empty.'
              : compareKind === 'previous_digest' && canComparePrevious
                ? 'Could not load markdown for the prior snapshot or this date (check daily_snapshots).'
                : 'No comparison snapshot available for this choice.'}
        </p>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toolbar}
      <p className="text-text-muted text-[11px]">
        Showing diff vs <span className="font-mono text-fin-blue">{pair.compareDate}</span>
        {pair.changeCount > 0 ? (
          <span>
            {' '}
            · {pair.changeCount} path{pair.changeCount !== 1 ? 's' : ''} in delta-request
          </span>
        ) : null}
      </p>

      {viewMode === 'inline' ? (
        <div>
          {!hasDiff ? (
            <p className="text-text-muted text-sm mb-3">No text changes vs comparison snapshot.</p>
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
      ) : (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
            Comparison (left) · current (right)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[min(62vh,720px)] overflow-auto">
            <div className="rounded-lg border border-border-subtle bg-bg-secondary/30 p-3 min-h-0 overflow-auto">
              <p className="text-[10px] font-mono text-text-muted mb-2">Compare — {pair.compareDate}</p>
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
    </div>
  );
}
