import type { Doc } from '@/lib/types';

export const ALLOCATION_PALETTE = [
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

export function formatAllocationCategory(cat: string | null | undefined): string {
  if (!cat) return '—';
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const PM_DOC_ORDER = [
  'deliberation.md',
  'deliberation.json',
  'deliberation-transcript.json',
  'rebalance-decision.json',
  'portfolio-recommendation.json',
  'opportunity-screener.json',
] as const;

export function pmDocSortKey(path: string): number {
  const low = path.toLowerCase();
  if (low.startsWith('pm-allocation-memo/')) return 0;
  if (low.includes('deliberation-transcript-index/')) return 1;
  if (low.startsWith('deliberation-transcript/')) return 2;
  if (low.startsWith('asset-recommendations/')) return 3;
  if (low.startsWith('thesis-vehicle-map/')) return 4;
  if (low.startsWith('market-thesis-exploration/')) return 5;
  const file = low.split('/').pop() || low;
  const i = (PM_DOC_ORDER as readonly string[]).indexOf(file);
  return i === -1 ? 50 : 10 + i;
}

export function sortPmDocs(docs: Doc[]): Doc[] {
  return [...docs].sort((a, b) => {
    const ka = pmDocSortKey(a.path);
    const kb = pmDocSortKey(b.path);
    if (ka !== kb) return ka - kb;
    return a.path.localeCompare(b.path);
  });
}
