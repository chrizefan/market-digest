'use client';

import { useEffect, useState } from 'react';
import { diffLines } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getDigestMarkdownDiffPair } from '@/lib/queries';

type Mode = 'review' | 'formatted';

export default function DigestDocumentView({
  docDate,
  fallbackMarkdown,
}: {
  docDate: string;
  fallbackMarkdown: string;
}) {
  const [mode, setMode] = useState<Mode>('review');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState<Awaited<ReturnType<typeof getDigestMarkdownDiffPair>>>(null);

  useEffect(() => {
    let cancelled = false;
    getDigestMarkdownDiffPair(docDate)
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
  }, [docDate]);

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

  if (!pair) {
    return (
      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
      </div>
    );
  }

  const parts = diffLines(pair.beforeMarkdown, pair.afterMarkdown);
  const hasDiff = parts.some((p) => p.added || p.removed);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-text-muted">
          Compared to <span className="font-mono text-fin-blue">{pair.compareDate}</span>
          {pair.changeCount > 0 ? (
            <span className="text-text-muted"> · {pair.changeCount} path{pair.changeCount !== 1 ? 's' : ''} in delta</span>
          ) : null}
        </span>
        <div className="flex rounded-md border border-border-subtle overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('review')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'review' ? 'bg-fin-blue/25 text-fin-blue' : 'text-text-muted hover:text-white bg-bg-secondary'
            }`}
          >
            Review changes
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
            <p className="text-text-muted text-sm mb-3">No line-level changes vs prior snapshot (view formatted digest).</p>
          ) : (
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              Inline diff · removed (red) · added (green)
            </p>
          )}
          <div className="rounded-lg border border-border-subtle bg-bg-secondary/40 font-mono text-[12px] leading-relaxed max-h-[min(62vh,720px)] overflow-auto">
            {parts.map((part, i) => {
              if (part.added) {
                return (
                  <span
                    key={i}
                    className="block whitespace-pre-wrap px-3 py-0.5 bg-emerald-950/50 text-emerald-100 border-l-2 border-emerald-500/80"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span
                    key={i}
                    className="block whitespace-pre-wrap px-3 py-0.5 bg-red-950/45 text-red-100/95 border-l-2 border-red-500/70 line-through decoration-red-300/50"
                  >
                    {part.value}
                  </span>
                );
              }
              return (
                <span key={i} className="block whitespace-pre-wrap px-3 py-0.5 text-text-secondary/90">
                  {part.value}
                </span>
              );
            })}
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
