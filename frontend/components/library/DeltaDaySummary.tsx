'use client';

import type { DeltaRequestMeta } from '@/lib/types';

/**
 * Compact banner: deltas ran this day; details appear inline when opening highlighted files (digest = review diff).
 */
export default function DeltaDaySummary({
  meta,
  digestAvailable,
  onOpenDigest,
}: {
  meta: DeltaRequestMeta;
  digestAvailable: boolean;
  onOpenDigest: () => void;
}) {
  const pathCount = new Set([...meta.changed_paths, ...meta.op_paths].filter(Boolean)).size;
  const opCount = meta.op_paths.length;
  const baseline = meta.baseline_date?.trim();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-fin-blue/25 bg-fin-blue/[0.07] px-4 py-3 text-sm">
      <span className="font-semibold text-fin-blue">Updates applied</span>
      <span className="text-xs text-text-secondary">
        {pathCount} path{pathCount !== 1 ? 's' : ''} touched
        {opCount > 0 ? (
          <>
            {' '}
            · {opCount} op{opCount !== 1 ? 's' : ''}
          </>
        ) : null}
      </span>
      <span className="text-xs text-text-muted w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
        Files with a badge were updated. Open the <strong className="text-text-secondary">digest</strong> to diff vs
        the previous digest or the delta baseline
        {baseline ? (
          <>
            {' '}
            (<span className="font-mono text-text-secondary">{baseline}</span>)
          </>
        ) : null}
        .
      </span>
      {digestAvailable ? (
        <button
          type="button"
          onClick={onOpenDigest}
          className="text-xs px-3 py-1.5 rounded-md bg-fin-blue/20 text-fin-blue hover:bg-fin-blue/30 transition-colors shrink-0"
        >
          Open digest
        </button>
      ) : null}
    </div>
  );
}
