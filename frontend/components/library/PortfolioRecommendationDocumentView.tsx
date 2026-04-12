'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type RecRow = {
  ticker?: string;
  category?: string | null;
  weight_pct?: number | null;
  action?: string;
  thesis_id?: string | null;
  conviction?: string | null;
  rationale?: string | null;
};

type Bucket = {
  bucket?: string;
  allocation_pct?: number | null;
  notes?: string;
};

type ConditionalPlan = {
  label?: string;
  probability_pct?: number | null;
  actions?: Array<{
    action?: string;
    from_pct?: number | null;
    to_pct?: number | null;
    rationale?: string;
  }>;
};

type MonitorRow = {
  asset?: string;
  hold_signal?: string | null;
  exit_signal?: string | null;
  add_signal?: string | null;
};

function pct(n: unknown): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toFixed(2)}%`;
}

export default function PortfolioRecommendationDocumentView({
  payload,
  fallbackMarkdown,
}: {
  payload: Record<string, unknown> | null;
  fallbackMarkdown: string;
}) {
  const body =
    payload && typeof payload.body === 'object' && payload.body !== null && !Array.isArray(payload.body)
      ? (payload.body as Record<string, unknown>)
      : null;
  const meta =
    payload && typeof payload.meta === 'object' && payload.meta !== null && !Array.isArray(payload.meta)
      ? (payload.meta as Record<string, unknown>)
      : null;

  const decisionSummary = body?.decision_summary != null ? String(body.decision_summary).trim() : '';
  const recommended: RecRow[] = Array.isArray(body?.recommended_portfolio) ? (body.recommended_portfolio as RecRow[]) : [];
  const buckets: Bucket[] = Array.isArray(body?.allocation_buckets) ? (body.allocation_buckets as Bucket[]) : [];
  const plans: ConditionalPlan[] = Array.isArray(body?.conditional_plans) ? (body.conditional_plans as ConditionalPlan[]) : [];
  const monitoring: MonitorRow[] = Array.isArray(body?.monitoring_levels) ? (body.monitoring_levels as MonitorRow[]) : [];

  if (!body || (!decisionSummary && !recommended.length && !buckets.length)) {
    return (
      <div className="prose prose-invert max-w-none text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-sm">
      {meta && (meta.kind || meta.regime || meta.posture || meta.conviction) ? (
        <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-4 flex flex-wrap gap-x-6 gap-y-2 text-text-secondary text-xs">
          {meta.kind ? (
            <span>
              <span className="text-text-muted uppercase tracking-wider mr-1">Kind</span>
              <span className="text-white">{String(meta.kind)}</span>
            </span>
          ) : null}
          {meta.regime ? (
            <span>
              <span className="text-text-muted uppercase tracking-wider mr-1">Regime</span>
              {String(meta.regime)}
            </span>
          ) : null}
          {meta.posture ? (
            <span>
              <span className="text-text-muted uppercase tracking-wider mr-1">Posture</span>
              {String(meta.posture)}
            </span>
          ) : null}
          {meta.conviction ? (
            <span>
              <span className="text-text-muted uppercase tracking-wider mr-1">Conviction</span>
              {String(meta.conviction)}
            </span>
          ) : null}
          {Array.isArray(meta.triggers) && meta.triggers.length > 0 ? (
            <div className="w-full mt-1">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Triggers</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {(meta.triggers as unknown[]).map((t, i) => (
                  <li key={i}>{String(t)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {decisionSummary ? (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Decision summary</h3>
          <div className="prose prose-invert max-w-none text-text-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{decisionSummary}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {recommended.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Recommended portfolio</h3>
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-text-muted text-left border-b border-border-subtle bg-bg-secondary/80">
                  <th className="px-3 py-2 font-medium">Ticker</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium text-right">Weight</th>
                  <th className="px-3 py-2 font-medium">Thesis</th>
                  <th className="px-3 py-2 font-medium">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recommended.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-mono font-semibold text-fin-blue">{row.ticker ?? '—'}</td>
                    <td className="px-3 py-2">{row.action ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(row.weight_pct)}</td>
                    <td className="px-3 py-2 text-text-muted font-mono text-[11px]">{row.thesis_id ?? '—'}</td>
                    <td className="px-3 py-2 text-text-secondary max-w-[280px]">
                      {row.rationale ? (
                        <div className="prose prose-invert max-w-none prose-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{row.rationale}</ReactMarkdown>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {body.total_pct != null ? (
            <p className="text-[11px] text-text-muted mt-2 tabular-nums">Total target: {pct(body.total_pct)}</p>
          ) : null}
        </div>
      ) : null}

      {buckets.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Allocation buckets</h3>
          <ul className="space-y-3">
            {buckets.map((b, i) => (
              <li key={i} className="rounded-lg border border-border-subtle bg-bg-secondary/40 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{b.bucket ?? '—'}</span>
                  <span className="text-fin-amber tabular-nums text-sm">{pct(b.allocation_pct)}</span>
                </div>
                {b.notes ? (
                  <div className="prose prose-invert max-w-none text-xs text-text-secondary mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.notes}</ReactMarkdown>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plans.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Conditional plans</h3>
          <div className="space-y-4">
            {plans.map((plan, i) => (
              <div key={i} className="rounded-lg border border-border-subtle p-4 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-medium">{plan.label ?? 'Plan'}</span>
                  {plan.probability_pct != null ? (
                    <span className="text-[11px] text-text-muted tabular-nums">~{pct(plan.probability_pct)} prob.</span>
                  ) : null}
                </div>
                <ul className="space-y-2 text-xs text-text-secondary">
                  {(plan.actions ?? []).map((a, j) => (
                    <li key={j} className="border-l-2 border-fin-blue/40 pl-3">
                      <span className="text-white">{a.action ?? '—'}</span>
                      {(a.from_pct != null || a.to_pct != null) && (
                        <span className="text-text-muted tabular-nums ml-2">
                          {pct(a.from_pct)} → {pct(a.to_pct)}
                        </span>
                      )}
                      {a.rationale ? (
                        <div className="prose prose-invert max-w-none mt-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.rationale}</ReactMarkdown>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {monitoring.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Monitoring levels</h3>
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="text-text-muted text-left border-b border-border-subtle bg-bg-secondary/80">
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium">Hold</th>
                  <th className="px-3 py-2 font-medium">Exit</th>
                  <th className="px-3 py-2 font-medium">Add</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {monitoring.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono">{row.asset ?? '—'}</td>
                    <td className="px-3 py-2 text-text-secondary max-w-[200px]">{row.hold_signal ?? '—'}</td>
                    <td className="px-3 py-2 text-text-secondary max-w-[200px]">{row.exit_signal ?? '—'}</td>
                    <td className="px-3 py-2 text-text-secondary max-w-[200px]">{row.add_signal ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
