/**
 * Parse digest `snapshot.portfolio.proposed_positions` and forward-fill targets onto NAV dates.
 */

/** Weights as percentage points (0–100), ticker UPPER keys. */
export type TargetWeights = Record<string, number>;

export function parseProposedPositionsFromSnapshot(snapshot: unknown): TargetWeights | null {
  if (snapshot == null || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const s = snapshot as Record<string, unknown>;
  const port = s.portfolio;
  if (port == null || typeof port !== 'object' || Array.isArray(port)) return null;
  const pp = (port as Record<string, unknown>).proposed_positions;
  if (!Array.isArray(pp) || pp.length === 0) return null;
  const out: TargetWeights = {};
  for (const x of pp) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const ticker = String(o.ticker || '')
      .trim()
      .toUpperCase();
    const w = Number(o.weight_pct ?? NaN);
    if (!ticker || Number.isNaN(w)) continue;
    out[ticker] = w;
  }
  return Object.keys(out).length ? out : null;
}

/** Normalize so weights sum to 100 (digest targets may be slightly off). */
export function normalizeTargetWeights(w: TargetWeights): TargetWeights {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...w };
  const scale = 100 / sum;
  const out: TargetWeights = {};
  for (const [k, v] of Object.entries(w)) {
    out[k] = v * scale;
  }
  return out;
}

/**
 * For each date in `navDates` (sorted ascending), assign the latest known snapshot weights
 * with `snapshotDate <= navDate`.
 */
export function forwardFillTargetsForNavDates(
  navDates: string[],
  snapshotRows: Array<{ date: string; weights: TargetWeights }>
): Map<string, TargetWeights> {
  const sorted = [...snapshotRows].sort((a, b) => a.date.localeCompare(b.date));
  const out = new Map<string, TargetWeights>();
  let j = 0;
  /** Earliest snapshot seeds dates before the first published digest row. */
  let last: TargetWeights | null =
    sorted.length > 0 ? normalizeTargetWeights(sorted[0].weights) : null;
  for (const d of navDates) {
    while (j < sorted.length && sorted[j].date <= d) {
      last = normalizeTargetWeights(sorted[j].weights);
      j++;
    }
    if (last) out.set(d, { ...last });
  }
  return out;
}

export function unionTickerKeys(maps: Iterable<TargetWeights>): string[] {
  const s = new Set<string>();
  for (const m of maps) {
    for (const k of Object.keys(m)) {
      if (k === 'CASH') continue;
      s.add(k);
    }
  }
  return [...s].sort();
}
