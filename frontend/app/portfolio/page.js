'use client';

import { useState, useMemo } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { Badge, SectionTitle } from '@/components/ui';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PALETTE = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899','#6366F1','#14B8A6'];

const CATEGORY_LABELS = {
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
};

function formatCategory(cat) {
  return CATEGORY_LABELS[cat] || (cat ? cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');
}

export default function PortfolioPage() {
  const { data, loading, error } = useDashboard();
  const [expandedRow, setExpandedRow] = useState(null);

  if (loading) return <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen text-fin-red">{error}</div>;

  const { positions, ratios, calculated: metrics } = data;

  // Build pie chart data
  const pieData = useMemo(() => {
    const slices = positions.map(p => ({ name: p.ticker, value: p.weight_actual }));
    ratios.forEach(r => slices.push({ name: `${r.long_ticker}/${r.short_ticker}`, value: r.net_weight }));
    if (metrics.cash_pct > 0) slices.push({ name: 'CASH', value: metrics.cash_pct });
    return slices;
  }, [positions, ratios, metrics.cash_pct]);

  return (
    <>
      <PageHeader title="Asset Allocation" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">

        {/* Doughnut */}
        <div className="glass-card p-6">
          <SectionTitle>Current Allocation</SectionTitle>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius="55%" outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '0.85rem' }}
                  formatter={(val) => `${val.toFixed(1)}%`}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span className="text-text-secondary text-xs ml-1">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Positions Table */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
            <h3 className="text-lg font-semibold">Active Positions & Thesis</h3>
            <p className="text-text-muted text-sm mt-1">Click a row to expand thesis rationale and PM notes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Ticker</th>
                  <th className="text-left px-6 py-4">Name</th>
                  <th className="text-right px-6 py-4">Weight</th>
                  <th className="text-right px-6 py-4">Entry</th>
                  <th className="text-right px-6 py-4">Current</th>
                  <th className="text-right px-6 py-4">P&L</th>
                  <th className="text-left px-6 py-4">Category</th>
                  <th className="px-6 py-4 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {positions.map((p, i) => {
                  const isExpanded = expandedRow === i;
                  const pnlPct = p.entry_price && p.current_price && p.entry_price > 0
                    ? ((p.current_price - p.entry_price) / p.entry_price) * 100 : null;
                  return (
                    <tbody key={i}>
                      <tr
                        onClick={() => setExpandedRow(isExpanded ? null : i)}
                        className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                      >
                        <td className="px-6 py-4"><Badge variant="blue">{p.ticker}</Badge></td>
                        <td className="px-6 py-4">{p.name}</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums">{p.weight_actual?.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums text-text-secondary">{p.entry_price ? `$${p.entry_price.toFixed(2)}` : '—'}</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums">{p.current_price ? `$${p.current_price.toFixed(2)}` : '—'}</td>
                        <td className={`px-6 py-4 text-right font-mono tabular-nums font-semibold ${pnlPct != null ? (pnlPct >= 0 ? 'text-fin-green' : 'text-fin-red') : ''}`}>
                          {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{formatCategory(p.category)}</td>
                        <td className="px-6 py-4 text-text-muted">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan="8" className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="flex items-center gap-2 text-base font-semibold mb-2">
                                  <Info size={16} className="text-fin-blue" /> Investment Thesis
                                </h4>
                                <p className="text-text-muted leading-relaxed text-sm">
                                  {p.rationale || 'No rationale provided in digest.'}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-base font-semibold mb-3">Position Details</h4>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                    <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Asset Class</span>
                                    <span className="text-sm font-medium">{formatCategory(p.category)}</span>
                                  </div>
                                  <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                    <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Linked Theses</span>
                                    <span className="text-sm">
                                      {p.thesis_ids?.length > 0
                                        ? p.thesis_ids.map((id, j) => <Badge key={j} variant="blue" className="mr-1 text-[0.7rem]">{id}</Badge>)
                                        : '—'}
                                    </span>
                                  </div>
                                </div>
                                {p.pm_notes && (
                                  <div>
                                    <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">PM Notes</span>
                                    <p className="text-text-muted text-sm leading-relaxed">{p.pm_notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
                {positions.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-10 text-text-muted">No active positions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
