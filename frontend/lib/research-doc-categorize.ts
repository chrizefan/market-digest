import type { Doc } from './types';

export const RESEARCH_CATEGORY_ORDER = [
  'Digest',
  'Research Papers',
  'Deep Dives',
  'Market Analysis',
  'Equities',
  'Sectors',
  'Intelligence',
  'Positions',
  'Weekly / Monthly',
  'Portfolio',
  'Evolution',
  'Other',
] as const;

/**
 * Returns a stable, date-independent display name for a document.
 */
export function canonicalResearchTitle(d: Doc): string {
  const raw = d.title || d.filename || d.path || '';
  const clean = raw
    .replace(/\s*—\s*\d{4}-\d{2}-\d{2}$/, '')
    .replace(/^Sector Delta\s*—\s*/i, '')
    .replace(/\s+Delta$/i, '')
    .trim();
  return clean || raw;
}

export function categorizeResearchDoc(d: Doc): string {
  const key = (d.path || d.filename || '').toLowerCase();
  const seg = (d.segment || '').toLowerCase();
  const type = (d.type || '').toLowerCase();

  if (key === 'digest') return 'Digest';
  if (key.startsWith('research/papers/')) return 'Research Papers';
  if (key.startsWith('research/deep-dives/') || key.startsWith('research/themes/') || key.startsWith('deep-dives/'))
    return 'Deep Dives';
  if (key.startsWith('research/')) return 'Deep Dives';
  if (key.startsWith('weekly/') || key.startsWith('monthly/')) return 'Weekly / Monthly';
  if (key.startsWith('evolution/')) return 'Evolution';
  if (seg.includes('rebalance') || seg.includes('deliberation') || seg.includes('portfolio') || seg.includes('opportunity'))
    return 'Portfolio';
  if (key.startsWith('positions/') || seg.includes('position')) return 'Positions';
  if (type.includes('weekly') || type.includes('monthly')) return 'Weekly / Monthly';
  if (type.includes('deep dive')) return 'Deep Dives';
  if (
    seg.includes('macro') ||
    seg.includes('bonds') ||
    seg.includes('commodities') ||
    seg.includes('forex') ||
    seg.includes('crypto') ||
    seg.includes('international')
  )
    return 'Market Analysis';
  if (seg.includes('equities') || seg.includes('us-equities')) return 'Equities';
  if (d.category?.toLowerCase() === 'sector' || seg.includes('sector')) return 'Sectors';
  if (seg.includes('alt') || seg.includes('institutional')) return 'Intelligence';
  return 'Other';
}

export function isKnowledgeBaseDoc(d: Doc): boolean {
  const cat = categorizeResearchDoc(d);
  return cat === 'Deep Dives' || cat === 'Weekly / Monthly';
}
