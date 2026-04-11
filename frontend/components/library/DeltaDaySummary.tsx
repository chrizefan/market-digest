'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { DeltaRequestMeta } from '@/lib/types';
import { getLibrarySnapshotDiff } from '@/lib/queries';

export default function DeltaDaySummary({
  date,
  meta,
  digestAvailable,
  onOpenDigest,
}: {
  date: string;
  meta: DeltaRequestMeta;
  digestAvailable: boolean;
  onOpenDigest: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<Awaited<ReturnType<typeof getLibrarySnapshotDiff>>>(null);

  const loadDiff = useCallback(async () => {
    setDiffLoading(true);
    setDiffError(null);
    try {
      const d = await getLibrarySnapshotDiff(date);
      setDiffData(d);
    } catch (e) {
      setDiffError(e instanceof Error ? e.message : 'Failed to load diff');
      setDiffData(null);
    } finally {
      setDiffLoading(false);
    }
  }, [date]);

  const toggleDiff = async () => {
    if (!diffOpen && diffData === null && !diffLoading) {
      await loadDiff();
    }
    setDiffOpen((v) => !v);
  };

  const opCount = meta.op_paths.length;
  const pathCount = new Set([...meta.changed_paths, ...meta.op_paths]).size;

  return (
    <div className="glass-card p-0 overflow-hidden border-fin-blue/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left px-5 py-3 bg-fin-blue/10 border-b border-border-subtle"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="text-sm font-semibold text-fin-blue">Delta applied this day</span>
        <span className="text-xs text-text-muted ml-auto font-mono">{date}</span>
      </button>
      {open ? (
        <div className="px-5 py-4 space-y-4 text-sm">
          <p className="text-text-secondary text-xs">
            Baseline:{' '}
            <span className="font-mono text-fin-blue">{meta.baseline_date || '—'}</span> · {pathCount} path
            {pathCount !== 1 ? 's' : ''}
            {opCount ? ` · ${opCount} op${opCount !== 1 ? 's' : ''}` : ''}
          </p>
          {meta.changed_paths.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Changed paths</p>
              <div className="flex flex-wrap gap-1.5">
                {meta.changed_paths.map((p) => (
                  <span
                    key={p}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-bg-secondary border border-border-subtle text-text-secondary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!digestAvailable}
              onClick={onOpenDigest}
              className="text-xs px-3 py-1.5 rounded-md bg-fin-blue/20 text-fin-blue hover:bg-fin-blue/30 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Open digest
            </button>
            {pathCount > 0 ? (
              <button
                type="button"
                onClick={() => void toggleDiff()}
                className="text-xs px-3 py-1.5 rounded-md bg-bg-secondary text-text-secondary hover:text-white border border-border-subtle transition-colors"
              >
                {diffOpen ? 'Hide snapshot diffs' : 'Show snapshot diffs'}
              </button>
            ) : null}
          </div>

          {diffOpen ? (
            <div className="border-t border-border-subtle pt-4 space-y-3">
              {diffLoading ? <p className="text-text-muted text-xs">Loading snapshots…</p> : null}
              {diffError ? <p className="text-fin-red text-xs">{diffError}</p> : null}
              {!diffLoading && !diffError && diffData === null ? (
                <p className="text-text-muted text-xs">No comparable snapshots or delta paths for this date.</p>
              ) : null}
              {diffData
                ? diffData.diffs.map((d) => (
                    <div key={d.path} className="rounded-md border border-border-subtle overflow-hidden">
                      <div className="px-3 py-1.5 bg-bg-secondary text-[10px] font-mono text-fin-blue break-all">
                        {d.path}
                      </div>
                      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
                        <div className="p-2">
                          <p className="text-[10px] uppercase text-text-muted mb-1">
                            Before ({diffData.compareDate})
                          </p>
                          <pre className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                            {d.beforeText}
                          </pre>
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] uppercase text-text-muted mb-1">
                            After ({diffData.targetDate})
                          </p>
                          <pre className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                            {d.afterText}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
