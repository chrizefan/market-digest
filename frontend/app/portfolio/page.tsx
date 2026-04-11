'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { Badge, SectionTitle, formatPct, pnlColor } from '@/components/ui';
import { ChevronDown, ChevronUp, Info, BookOpen, Layers, History, Activity } from 'lucide-react';
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
import type { Position, Thesis, DashboardPositionEvent } from '@/lib/types';
import { SleeveStackedChart } from '@/components/portfolio/sleeve-stacked-chart';
import {
  buildSleeveStackSeries,
  thesisStackLabel,
  categoryStackLabel,
  aggregateWeightByThesis,
  type SleeveStackMode,
} from '@/lib/portfolio-aggregates';

const PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
];

const CATEGORY_LABELS: Record<string, string> = {
  commodity_gold: 'Commodity — Gold',
  commodity_oil: 'Commodity — Oil',
  commodity_silver: 'Commodity — Silver',
  equity_sector: 'Equity Sector',
  equity_broad: 'Broad Equity',
  fixed_income_cash: 'Cash',
  fixed_income_short: 'Short Duration',
  fixed_income_long: 'Long Duration',
  fixed_income_tips: 'TIPS',
  crypto: 'Crypto',
  international: 'International',
  cash: 'Cash',
  uncategorized: 'Uncategorized',
};

function formatCategory(cat: string | null | undefined): string {
  if (!cat) return '—';
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface AllocationDatum {
  name: string;
  value: number;
}

type TabId = 'summary' | 'thesis' | 'history' | 'activity';

function eventBadgeVariant(
  ev: DashboardPositionEvent['event']
): 'green' | 'red' | 'amber' | 'default' {
  if (ev === 'OPEN') return 'green';
  if (ev === 'EXIT') return 'red';
  if (ev === 'REBALANCE') return 'amber';
  return 'default';
}

function thesisNames(ids: string[], thesisById: Map<string, Thesis>): string {
  if (!ids.length) return '—';
  return ids
    .map((id) => thesisById.get(id)?.name ?? id)
    .join(', ');
}

export default function PortfolioPage() {
  const { data, loading, error } = useDashboard();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [tab, setTab] = useState<TabId>('summary');
  const [historyMode, setHistoryMode] = useState<SleeveStackMode>('category');

  const positions = useMemo(() => data?.positions ?? [], [data]);
  const ratios = useMemo(() => data?.ratios ?? [], [data]);
  const metrics = data?.calculated;
  const theses = useMemo(() => data?.portfolio?.strategy?.theses ?? [], [data]);
  const positionHistory = useMemo(() => data?.position_history ?? [], [data]);
  const positionEvents = useMemo(() => data?.position_events ?? [], [data]);
  const lastUpdated = data?.portfolio?.meta?.last_updated ?? null;

  const thesisById = useMemo(() => new Map(theses.map((t) => [t.id, t])), [theses]);

  const pieData = useMemo<AllocationDatum[]>(() => {
    const slices: AllocationDatum[] = positions.map((p) => ({
      name: p.ticker,
      value: p.weight_actual ?? 0,
    }));
    ratios.forEach((r) =>
      slices.push({ name: `${r.long_ticker}/${r.short_ticker}`, value: r.net_weight ?? 0 })
    );
    if ((metrics?.cash_pct ?? 0) > 0) slices.push({ name: 'CASH', value: metrics?.cash_pct ?? 0 });
    return slices;
  }, [positions, ratios, metrics?.cash_pct]);

  const categoryBarData = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of positions) {
      const key = p.ticker === 'CASH' ? 'cash' : p.category || 'uncategorized';
      m.set(key, (m.get(key) ?? 0) + (p.weight_actual ?? 0));
    }
    return [...m.entries()]
      .map(([key, value]) => ({
        key,
        name: formatCategory(key === 'cash' ? 'cash' : key === 'uncategorized' ? 'uncategorized' : key),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  const byThesisWeight = useMemo(() => aggregateWeightByThesis(positions), [positions]);

  const thesisBookRows = useMemo(() => {
    const rows: {
      id: string;
      thesis: Thesis | null;
      weight: number;
    }[] = [];
    for (const t of theses) {
      rows.push({ id: t.id, thesis: t, weight: byThesisWeight.get(t.id) ?? 0 });
    }
    const unlinked = byThesisWeight.get('_unlinked') ?? 0;
    if (unlinked > 0.005) {
      rows.push({ id: '_unlinked', thesis: null, weight: unlinked });
    }
    return rows.sort((a, b) => b.weight - a.weight);
  }, [theses, byThesisWeight]);

  const thesisBarForChart = useMemo(
    () =>
      thesisBookRows
        .filter((r) => r.weight > 0)
        .map((r) => ({
          name:
            r.id === '_unlinked'
              ? 'Unlinked'
              : r.thesis?.name ?? r.id,
          value: r.weight,
        })),
    [thesisBookRows]
  );

  const { data: sleeveData, keys: sleeveKeys } = useMemo(
    () => buildSleeveStackSeries(positionHistory, historyMode),
    [positionHistory, historyMode]
  );

  const formatSleeveKey = (k: string) =>
    historyMode === 'thesis' ? thesisStackLabel(k, theses) : categoryStackLabel(k);

  const researchLinks = useMemo(
    () =>
      lastUpdated
        ? [
            { label: 'Digest', docKey: 'digest' },
            { label: 'Deliberation', docKey: 'deliberation.md' },
            { label: 'Rebalance', docKey: 'rebalance-decision.json' },
          ]
        : [],
    [lastUpdated]
  );

  const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
    { id: 'summary', label: 'Summary', icon: Layers },
    { id: 'thesis', label: 'Thesis book', icon: BookOpen },
    { id: 'history', label: 'History', icon: History },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>
    );
  if (error || !data || !metrics)
    return (
      <div className="flex items-center justify-center h-screen text-fin-red">
        {error || 'Failed to load'}
      </div>
    );

  return (
    <>
      <PageHeader title="Asset Allocation" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-fin-blue/15 text-fin-blue border border-fin-blue/40'
                  : 'text-text-secondary border border-transparent hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'summary' && (
          <>
            {researchLinks.length > 0 && (
              <div className="glass-card px-5 py-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-text-muted uppercase tracking-wider">Research</span>
                <div className="flex flex-wrap gap-2">
                  {researchLinks.map((l) => (
                    <Link
                      key={l.docKey}
                      href={`/library?date=${encodeURIComponent(String(lastUpdated))}&docKey=${encodeURIComponent(l.docKey)}`}
                      className="text-xs px-3 py-1.5 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
                <span className="text-xs text-text-muted">as of {lastUpdated}</span>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <SectionTitle>Current allocation (by ticker)</SectionTitle>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                        }}
                        formatter={(val: number) => `${val.toFixed(1)}%`}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        iconSize={8}
                        formatter={(val: string) => (
                          <span className="text-text-secondary text-xs ml-1">{val}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <SectionTitle>By category (current)</SectionTitle>
                <div className="h-[320px]">
                  {categoryBarData.length === 0 ? (
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
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fill: '#a1a1aa', fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                          }}
                          formatter={(val: number) => [`${Number(val).toFixed(1)}%`, 'Weight']}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Weight %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
                <h3 className="text-lg font-semibold">Positions</h3>
                <p className="text-text-muted text-sm mt-1">
                  Expand a row for rationale, PM notes, and thesis detail. Δ vs prior snapshot.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Ticker</th>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-right px-4 py-3">Weight</th>
                      <th className="text-right px-4 py-3">Δ</th>
                      <th className="text-right px-4 py-3">Day</th>
                      <th className="text-right px-4 py-3">P&amp;L</th>
                      <th className="text-right px-4 py-3">Contrib</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Thesis</th>
                      <th className="text-right px-4 py-3">Entry</th>
                      <th className="text-right px-4 py-3">Current</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {positions.map((p: Position, i: number) => {
                      const isExpanded = expandedRow === i;
                      const pnlPct =
                        p.unrealized_pnl_pct != null && !Number.isNaN(p.unrealized_pnl_pct)
                          ? p.unrealized_pnl_pct
                          : p.entry_price && p.current_price && p.entry_price > 0
                            ? ((p.current_price - p.entry_price) / p.entry_price) * 100
                            : null;
                      return (
                        <Fragment key={p.ticker + String(i)}>
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : i)}
                            className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <Badge variant="blue">{p.ticker}</Badge>
                            </td>
                            <td className="px-4 py-3 max-w-[140px] truncate">{p.name}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {p.weight_actual?.toFixed(1)}%
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono tabular-nums text-xs ${typeof p.weight_delta === 'number' ? pnlColor(p.weight_delta) : 'text-text-muted'}`}
                            >
                              {typeof p.weight_delta === 'number'
                                ? `${p.weight_delta > 0 ? '+' : ''}${p.weight_delta.toFixed(1)}pp`
                                : '—'}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono tabular-nums text-xs ${pnlColor(p.day_change_pct)}`}
                            >
                              {p.day_change_pct != null ? formatPct(p.day_change_pct) : '—'}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono tabular-nums font-semibold text-xs ${pnlPct != null ? pnlColor(pnlPct) : ''}`}
                            >
                              {pnlPct != null ? formatPct(pnlPct) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                              {p.contribution_pct != null ? formatPct(p.contribution_pct) : '—'}
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-xs">
                              {formatCategory(p.category)}
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary max-w-[160px]">
                              {thesisNames(p.thesis_ids, thesisById)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary text-xs">
                              {p.entry_price ? `$${p.entry_price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                              {p.current_price ? `$${p.current_price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-text-muted">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-white/[0.02]">
                              <td colSpan={12} className="px-6 py-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="flex items-center gap-2 text-base font-semibold mb-2">
                                      <Info size={16} className="text-fin-blue" /> Investment thesis
                                    </h4>
                                    <p className="text-text-muted leading-relaxed text-sm">
                                      {p.rationale || 'No rationale provided in digest.'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-semibold mb-3">Position details</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                      <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                        <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                          Asset class
                                        </span>
                                        <span className="text-sm font-medium">
                                          {formatCategory(p.category)}
                                        </span>
                                      </div>
                                      <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                        <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                          Linked theses
                                        </span>
                                        <span className="text-sm space-x-1">
                                          {p.thesis_ids?.length > 0 ? (
                                            p.thesis_ids.map((id, j) => (
                                              <Badge key={j} variant="blue" className="mr-1 text-[0.7rem]">
                                                {thesisById.get(id)?.name ?? id}
                                              </Badge>
                                            ))
                                          ) : (
                                            '—'
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    {p.pm_notes && (
                                      <div>
                                        <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                          PM notes
                                        </span>
                                        <p className="text-text-muted text-sm leading-relaxed">{p.pm_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-10 text-text-muted">
                          No active positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'thesis' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <SectionTitle>Weight by thesis (current book)</SectionTitle>
              <div className="h-[280px]">
                {thesisBarForChart.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-12">No thesis-linked weights</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={thesisBarForChart} margin={{ left: 8, right: 16, top: 8, bottom: 48 }}>
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
                <h3 className="text-sm font-semibold">Thesis tracker + exposure</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle">
                      <th className="text-left px-5 py-3">Thesis</th>
                      <th className="text-right px-5 py-3">Weight</th>
                      <th className="text-left px-5 py-3">Vehicle</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Invalidation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {thesisBookRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium">
                          {row.id === '_unlinked' ? 'Unlinked positions' : row.thesis?.name ?? row.id}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums font-semibold">
                          {row.weight.toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 font-mono text-text-secondary text-xs">
                          {row.thesis?.vehicle ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-text-secondary text-xs">
                          {row.thesis?.status ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-text-muted text-xs max-w-md">
                          {row.thesis?.invalidation ?? '—'}
                        </td>
                      </tr>
                    ))}
                    {thesisBookRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-text-muted">
                          No theses in latest snapshot
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle className="mb-0">Sleeve evolution (% of book)</SectionTitle>
              <div className="flex rounded-lg border border-border-subtle overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setHistoryMode('category')}
                  className={`px-3 py-1.5 font-medium ${historyMode === 'category' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                >
                  By category
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMode('thesis')}
                  className={`px-3 py-1.5 font-medium border-l border-border-subtle ${historyMode === 'thesis' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                >
                  By thesis
                </button>
              </div>
            </div>
            <p className="text-text-muted text-sm">
              Stacked areas sum to ~100% per day (excluding any non-position cash rows in history).
            </p>
            <div className="h-[380px]" aria-label="Sleeve weights stacked over time">
              <SleeveStackedChart data={sleeveData} keys={sleeveKeys} formatKey={formatSleeveKey} />
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
              <h3 className="text-lg font-semibold">Execution &amp; changes</h3>
              <p className="text-text-muted text-sm mt-1">
                Recent rows from <code className="text-text-secondary">position_events</code> (newest
                first).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Ticker</th>
                    <th className="text-left px-5 py-3">Event</th>
                    <th className="text-right px-5 py-3">Weight</th>
                    <th className="text-right px-5 py-3">Δ wt</th>
                    <th className="text-right px-5 py-3">Since event</th>
                    <th className="text-left px-5 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {positionEvents.map((ev, i) => (
                    <tr key={`${ev.date}-${ev.ticker}-${i}`} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono text-xs text-text-secondary">{ev.date}</td>
                      <td className="px-5 py-3 font-semibold">{ev.ticker}</td>
                      <td className="px-5 py-3">
                        <Badge variant={eventBadgeVariant(ev.event)}>{ev.event}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-xs">
                        {ev.weight_pct != null ? `${ev.weight_pct.toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                        {ev.weight_change_pct != null
                          ? `${ev.weight_change_pct > 0 ? '+' : ''}${ev.weight_change_pct.toFixed(2)}pp`
                          : '—'}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono tabular-nums text-xs ${pnlColor(ev.cumulative_return_since_event_pct)}`}
                      >
                        {ev.cumulative_return_since_event_pct != null
                          ? formatPct(ev.cumulative_return_since_event_pct)
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-text-muted text-xs max-w-md">{ev.reason ?? '—'}</td>
                    </tr>
                  ))}
                  {positionEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-text-muted">
                        No position events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
