'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown } from 'lucide-react';
import { SectionTitle } from '@/components/ui';
import { renderDocumentMarkdownFromPayload } from '@/lib/render-document-from-payload';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ALLOCATION_PALETTE } from './palette-and-format';
import type { PipelineObservabilityBundle } from '@/lib/types';

type PieSliceDatum = { name: string; value: number; tooltipExtra?: string };

type SummaryAllocationMode = 'ticker' | 'category' | 'thesis';

export default function AllocationsTab(props: {
  lastUpdated: string | null;
  researchStripLinks: { label: string; docKey: string }[];
  pmStripLinks: { label: string; docKey: string }[];
  hasPipelineObservability: boolean;
  pipe: PipelineObservabilityBundle | null;
  processObsMarkdown: { memo: string | null; vehicle: string | null; index: string | null };
  deliberationIndexRows: {
    ticker: string;
    document_key: string;
    converged: boolean | null;
    rounds: string;
  }[];
  summaryAllocationMode: SummaryAllocationMode;
  setSummaryAllocationMode: (m: SummaryAllocationMode) => void;
  pieDataBucketed: PieSliceDatum[];
  categoryBarData: { key: string; name: string; value: number }[];
  thesisBarRich: { name: string; value: number; status: string | null }[];
}) {
  const {
    lastUpdated,
    researchStripLinks,
    pmStripLinks,
    hasPipelineObservability,
    pipe,
    processObsMarkdown,
    deliberationIndexRows,
    summaryAllocationMode,
    setSummaryAllocationMode,
    pieDataBucketed,
    categoryBarData,
    thesisBarRich,
  } = props;

  return (
    <>
      {(researchStripLinks.length > 0 || pmStripLinks.length > 0) && (
        <div className="glass-card px-5 py-4 space-y-3">
          {researchStripLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-text-muted uppercase tracking-wider">Research</span>
              <div className="flex flex-wrap gap-2">
                {researchStripLinks.map((l) => (
                  <Link
                    key={l.docKey}
                    href={`/research?tab=daily&date=${encodeURIComponent(String(lastUpdated))}&docKey=${encodeURIComponent(l.docKey)}`}
                    className="text-xs px-3 py-1.5 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {pmStripLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-text-muted uppercase tracking-wider">PM &amp; process</span>
              <div className="flex flex-wrap gap-2">
                {pmStripLinks.map((l) => (
                  <Link
                    key={l.docKey}
                    href={`/portfolio?tab=pm_analysis&date=${encodeURIComponent(String(lastUpdated))}&docKey=${encodeURIComponent(l.docKey)}`}
                    className="text-xs px-3 py-1.5 rounded-md bg-fin-amber/10 text-fin-amber hover:bg-fin-amber/20 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <span className="text-xs text-text-muted block">as of {lastUpdated}</span>
        </div>
      )}

      {hasPipelineObservability && lastUpdated && pipe?.snapshot_date === lastUpdated ? (
        <div className="glass-card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary">
            <h3 className="text-sm font-semibold">Pipeline observability</h3>
            <p className="text-xs text-text-muted mt-1">
              Thesis → vehicles → analyst → deliberation → PM memo, rendered from published JSON for{' '}
              <span className="font-mono text-text-secondary">{pipe.snapshot_date}</span>.
            </p>
          </div>
          <div className="p-5 space-y-6">
            {processObsMarkdown.memo ? (
              <details open className="group">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary list-none flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                  PM allocation memo
                </summary>
                <div className="mt-3 prose prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{processObsMarkdown.memo}</ReactMarkdown>
                </div>
              </details>
            ) : null}
            {processObsMarkdown.vehicle ? (
              <details open className="group border-t border-border-subtle/80 pt-5">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary list-none flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                  Thesis → vehicle map
                </summary>
                <div className="mt-3 prose prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{processObsMarkdown.vehicle}</ReactMarkdown>
                </div>
              </details>
            ) : null}
            {processObsMarkdown.index ? (
              <details open className="group border-t border-border-subtle/80 pt-5">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary list-none flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                  Deliberation session index
                </summary>
                <div className="mt-3 prose prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{processObsMarkdown.index}</ReactMarkdown>
                </div>
              </details>
            ) : null}
            {deliberationIndexRows.length > 0 ? (
              <div className="border-t border-border-subtle/80 pt-5">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Open a per-ticker transcript
                </h4>
                <div className="overflow-x-auto rounded-lg border border-border-subtle">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle bg-bg-secondary/50">
                        <th className="text-left px-3 py-2">Ticker</th>
                        <th className="text-left px-3 py-2">Converged</th>
                        <th className="text-right px-3 py-2">Rounds</th>
                        <th className="text-left px-3 py-2">Transcript</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {deliberationIndexRows.map((row) => (
                        <tr key={row.document_key || row.ticker}>
                          <td className="px-3 py-2 font-mono font-medium">{row.ticker || '—'}</td>
                          <td className="px-3 py-2 text-text-secondary">
                            {row.converged === true ? 'Yes' : row.converged === false ? 'No' : '—'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-text-secondary">{row.rounds}</td>
                          <td className="px-3 py-2">
                            {row.document_key ? (
                              <Link
                                href={`/portfolio?tab=pm_analysis&date=${encodeURIComponent(lastUpdated)}&docKey=${encodeURIComponent(row.document_key)}`}
                                className="text-fin-amber text-xs hover:underline"
                              >
                                Open in PM analysis
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {pipe.asset_recommendations.length > 0 ? (
              <div className="border-t border-border-subtle/80 pt-5 space-y-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Analyst reports (by ticker)
                </h4>
                <div className="space-y-2">
                  {pipe.asset_recommendations.map((doc) => {
                    const md = renderDocumentMarkdownFromPayload(doc.payload);
                    if (!md) return null;
                    return (
                      <details key={doc.document_key} className="group rounded-lg border border-border-subtle bg-bg-secondary/30">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold font-mono list-none flex items-center gap-2">
                          <ChevronDown
                            size={16}
                            className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                            aria-hidden
                          />
                          {doc.ticker}
                        </summary>
                        <div className="px-4 pb-4 prose prose-invert max-w-none text-sm leading-relaxed border-t border-border-subtle/60 pt-3">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
                          <Link
                            href={`/portfolio?tab=pm_analysis&date=${encodeURIComponent(lastUpdated)}&docKey=${encodeURIComponent(doc.document_key)}`}
                            className="inline-block mt-3 text-xs text-fin-amber hover:underline not-prose"
                          >
                            Open raw document in PM analysis
                          </Link>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {pipe.deliberation_transcripts.length > 0 ? (
              <div className="border-t border-border-subtle/80 pt-5 space-y-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Deliberation transcripts (by ticker)
                </h4>
                <div className="space-y-2">
                  {pipe.deliberation_transcripts.map((doc) => {
                    const md = renderDocumentMarkdownFromPayload(doc.payload);
                    if (!md) return null;
                    return (
                      <details key={doc.document_key} className="group rounded-lg border border-border-subtle bg-bg-secondary/30">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold font-mono list-none flex items-center gap-2">
                          <ChevronDown
                            size={16}
                            className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                            aria-hidden
                          />
                          {doc.ticker}
                        </summary>
                        <div className="px-4 pb-4 prose prose-invert max-w-none text-sm leading-relaxed border-t border-border-subtle/60 pt-3">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
                          <Link
                            href={`/portfolio?tab=pm_analysis&date=${encodeURIComponent(lastUpdated)}&docKey=${encodeURIComponent(doc.document_key)}`}
                            className="inline-block mt-3 text-xs text-fin-amber hover:underline not-prose"
                          >
                            Open structured view in PM analysis
                          </Link>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle className="mb-0">Current allocation</SectionTitle>
          <div className="flex rounded-lg border border-border-subtle overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setSummaryAllocationMode('ticker')}
              className={`px-3 py-1.5 font-medium ${summaryAllocationMode === 'ticker' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
            >
              Ticker
            </button>
            <button
              type="button"
              onClick={() => setSummaryAllocationMode('category')}
              className={`px-3 py-1.5 font-medium border-l border-border-subtle ${summaryAllocationMode === 'category' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
            >
              Category
            </button>
            <button
              type="button"
              onClick={() => setSummaryAllocationMode('thesis')}
              className={`px-3 py-1.5 font-medium border-l border-border-subtle ${summaryAllocationMode === 'thesis' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
            >
              Thesis
            </button>
          </div>
        </div>
        <div className="h-[320px]">
          {summaryAllocationMode === 'ticker' &&
            (pieDataBucketed.length === 0 ? (
              <p className="text-text-muted text-sm py-12 text-center">No positions</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataBucketed}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieDataBucketed.map((_, i) => (
                      <Cell key={i} fill={ALLOCATION_PALETTE[i % ALLOCATION_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as PieSliceDatum;
                      return (
                        <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg max-w-xs">
                          <p className="font-medium text-text-primary">{p.name}</p>
                          <p className="text-text-secondary tabular-nums">{p.value.toFixed(1)}%</p>
                          {p.tooltipExtra ? (
                            <p className="text-text-muted mt-1.5 text-[11px] leading-snug">{p.tooltipExtra}</p>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={8}
                    formatter={(val: string) => <span className="text-text-secondary text-xs ml-1">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ))}
          {summaryAllocationMode === 'category' &&
            (categoryBarData.length === 0 ? (
              <p className="text-text-muted text-sm py-12 text-center">No positions</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={categoryBarData}
                  margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 'auto']}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as { name: string; value: number };
                      return (
                        <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium text-text-primary">{row.name}</p>
                          <p className="text-text-secondary tabular-nums">{Number(row.value).toFixed(1)}% weight</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Weight %" />
                </BarChart>
              </ResponsiveContainer>
            ))}
          {summaryAllocationMode === 'thesis' &&
            (thesisBarRich.length === 0 ? (
              <p className="text-text-muted text-sm py-12 text-center">No thesis-linked weights</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={thesisBarRich}
                  margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 'auto']}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as {
                        name: string;
                        value: number;
                        status: string | null;
                      };
                      return (
                        <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg max-w-xs">
                          <p className="font-medium text-text-primary">{row.name}</p>
                          <p className="text-text-secondary tabular-nums">{Number(row.value).toFixed(1)}% weight</p>
                          {row.status ? (
                            <p className="text-text-muted mt-1 text-[11px]">Status: {row.status}</p>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ))}
        </div>
      </div>
    </>
  );
}
