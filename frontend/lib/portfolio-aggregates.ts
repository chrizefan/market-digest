import type { Position, PositionHistoryRow, Thesis } from './types';

export type SleeveStackMode = 'category' | 'thesis';

function sleeveKey(row: PositionHistoryRow, mode: SleeveStackMode): string {
  if (mode === 'thesis') return row.thesis_id || '_unlinked';
  if (row.ticker === 'CASH') return 'cash';
  return row.category || 'uncategorized';
}

/** Stacked % weights by date for Recharts (one row per date, dynamic keys). */
export function buildSleeveStackSeries(
  rows: PositionHistoryRow[],
  mode: SleeveStackMode
): { data: Array<Record<string, number | string>>; keys: string[] } {
  const byDate = new Map<string, Map<string, number>>();
  const allKeys = new Set<string>();
  for (const r of rows) {
    const k = sleeveKey(r, mode);
    allKeys.add(k);
    if (!byDate.has(r.date)) byDate.set(r.date, new Map());
    const m = byDate.get(r.date)!;
    m.set(k, (m.get(k) ?? 0) + r.weight_pct);
  }
  const dates = [...byDate.keys()].sort();
  const keys = [...allKeys].sort((a, b) => {
    if (a === '_unlinked') return 1;
    if (b === '_unlinked') return -1;
    return a.localeCompare(b);
  });
  const data = dates.map((date) => {
    const row: Record<string, number | string> = { date };
    const m = byDate.get(date)!;
    for (const key of keys) {
      row[key] = Math.round((m.get(key) ?? 0) * 1000) / 1000;
    }
    return row;
  });
  return { data, keys };
}

export function thesisStackLabel(key: string, theses: Thesis[]): string {
  if (key === '_unlinked') return 'Unlinked';
  const t = theses.find((x) => x.id === key);
  return t?.name ?? key;
}

export function categoryStackLabel(key: string): string {
  if (key === 'cash') return 'Cash';
  if (key === 'uncategorized') return 'Uncategorized';
  return key.replace(/_/g, ' ');
}

/** Current weight % per thesis_id from live positions. */
export function aggregateWeightByThesis(positions: Position[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of positions) {
    const ids = p.thesis_ids?.length ? p.thesis_ids : ['_unlinked'];
    const share = (p.weight_actual ?? 0) / ids.length;
    for (const id of ids) {
      const k = id || '_unlinked';
      m.set(k, (m.get(k) ?? 0) + share);
    }
  }
  return m;
}
