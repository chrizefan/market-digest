/**
 * Theoretical portfolio performance from digest target weights + prices + rebalance rules.
 * Close-to-close: apply asset returns, then optionally rebalance to targets and subtract costs.
 */

import type { TargetWeights } from './digest-targets';
import { normalizeTargetWeights } from './digest-targets';

export type RebalanceStrategy =
  | 'daily_benchmark'
  | 'drift_band'
  | 'calendar_weekly'
  | 'calendar_monthly'
  | 'hybrid';

export type SimulationCostParams = {
  /** Flat cost per traded ticker (subtracted from portfolio value; same units as V). */
  fixedUsdPerTrade: number;
  /** Basis points on turnover notional (turnover/100 * V). */
  bpsOnNotional: number;
};

export type SimulationParams = {
  strategy: RebalanceStrategy;
  /** Drift band in percentage points vs target (e.g. 5). */
  driftBandPp: number;
  cost: SimulationCostParams;
};

export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  strategy: 'daily_benchmark',
  driftBandPp: 5,
  cost: { fixedUsdPerTrade: 0, bpsOnNotional: 0 },
};

export type PerformanceSimulationInput = {
  /** Sorted ascending trading dates (aligned with NAV). */
  dates: string[];
  /** Target weights (pp) per date after forward-fill from digest snapshots. */
  targetsByDate: Map<string, TargetWeights>;
  /** ticker UPPER -> date -> close */
  closeByTickerDate: Map<string, Map<string, number>>;
  params?: Partial<SimulationParams>;
};

export type PerformanceSimulationResult = {
  valueIndex: Array<{ date: string; value: number | null }>;
  totalCostDragPoints: number;
};

function ensureCashInTargets(w: TargetWeights): TargetWeights {
  const raw = { ...w };
  let sum = 0;
  for (const v of Object.values(raw)) {
    if (typeof v === 'number' && !Number.isNaN(v)) sum += v;
  }
  if (sum < 99.5) {
    raw.CASH = (raw.CASH ?? 0) + Math.max(0, 100 - sum);
  }
  return normalizeTargetWeights(raw);
}

function unionTickers(targetsByDate: Map<string, TargetWeights>): string[] {
  const s = new Set<string>();
  for (const w of targetsByDate.values()) {
    for (const k of Object.keys(w)) {
      s.add(k.toUpperCase());
    }
  }
  const arr = [...s].sort((a, b) => a.localeCompare(b));
  return arr;
}

function weightVector(tickers: string[], wMap: TargetWeights): number[] {
  return tickers.map((t) => {
    const v = wMap[t];
    return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  });
}

/** Normalize to fractions that sum to 1. */
function normalizeFrac(v: number[]): number[] {
  const s = v.reduce((a, b) => a + b, 0);
  if (s <= 0) return v.map(() => 0);
  return v.map((x) => x / s);
}

function getClose(m: Map<string, number> | undefined, d: string, fallback: number): number {
  if (!m) return fallback;
  const x = m.get(d);
  return x != null && x > 0 ? x : fallback;
}

function forwardFillCloseMapsToDates(
  dates: string[],
  tickers: string[],
  closeByTickerDate: Map<string, Map<string, number>>
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const t of tickers) {
    if (t === 'CASH') continue;
    const src = closeByTickerDate.get(t);
    if (!src || src.size === 0) continue;

    // Seed with earliest known close (by date string sort, ISO YYYY-MM-DD).
    const sortedDates = [...src.keys()].sort();
    const seed = src.get(sortedDates[0]);
    if (seed == null || !(seed > 0)) continue;

    const filled = new Map<string, number>();
    let last = seed;
    for (const d of dates) {
      const v = src.get(d);
      if (v != null && v > 0) last = v;
      filled.set(d, last);
    }
    out.set(t, filled);
  }
  return out;
}

/** w: fractions summing to 1. Returns portfolio value multiplier from d0→d1 close. */
function grossReturnFactor(
  w: number[],
  tickers: string[],
  d0: string,
  d1: string,
  closeByTickerDate: Map<string, Map<string, number>>
): number {
  let num = 0;
  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i];
    if (t === 'CASH') {
      num += w[i];
      continue;
    }
    const p0 = getClose(closeByTickerDate.get(t), d0, 1);
    const p1 = getClose(closeByTickerDate.get(t), d1, p0);
    const r = p0 > 0 ? p1 / p0 : 1;
    num += w[i] * r;
  }
  return num;
}

function driftWeights(
  w: number[],
  tickers: string[],
  d0: string,
  d1: string,
  closeByTickerDate: Map<string, Map<string, number>>
): number[] {
  const raw = tickers.map((t, i) => {
    if (t === 'CASH') return w[i];
    const p0 = getClose(closeByTickerDate.get(t), d0, 1);
    const p1 = getClose(closeByTickerDate.get(t), d1, p0);
    const r = p0 > 0 ? p1 / p0 : 1;
    return w[i] * r;
  });
  return normalizeFrac(raw);
}

/** Max absolute diff in percentage points (0–100 scale). */
function maxAbsDiffPp(aFrac: number[], bFrac: number[]): number {
  let m = 0;
  for (let i = 0; i < aFrac.length; i++) {
    m = Math.max(m, Math.abs(aFrac[i] - bFrac[i]) * 100);
  }
  return m;
}

/** One-way turnover fraction (0–1): half of L1 distance in weight space. */
function turnoverHalfFrac(wFromFrac: number[], wToFrac: number[]): number {
  let s = 0;
  for (let i = 0; i < wFromFrac.length; i++) {
    s += Math.abs(wFromFrac[i] - wToFrac[i]);
  }
  return s / 2;
}

function legCountFrac(wFrom: number[], wTo: number[]): number {
  let n = 0;
  for (let i = 0; i < wFrom.length; i++) {
    if (Math.abs(wFrom[i] - wTo[i]) > 1e-6) n++;
  }
  return n;
}

function isUtcFriday(iso: string): boolean {
  const d = new Date(`${iso}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 5;
}

function isFirstMonthTradingDay(iso: string, prevIso: string | null): boolean {
  if (!prevIso) return true;
  return iso.slice(0, 7) !== prevIso.slice(0, 7);
}

function calendarHit(
  strategy: 'calendar_weekly' | 'calendar_monthly',
  d: string,
  prevDate: string | null,
  tradingDayIndex: number
): boolean {
  if (strategy === 'calendar_monthly') {
    return isFirstMonthTradingDay(d, prevDate);
  }
  if (isUtcFriday(d)) return true;
  return tradingDayIndex > 0 && tradingDayIndex % 5 === 0;
}

function shouldRebalance(
  strategy: RebalanceStrategy,
  driftBandPp: number,
  wDrift: number[],
  wTargetVec: number[],
  d: string,
  prevDate: string | null,
  tradingDayIndex: number
): boolean {
  if (strategy === 'daily_benchmark') return true;
  if (strategy === 'drift_band') {
    return maxAbsDiffPp(wDrift, wTargetVec) >= driftBandPp;
  }
  if (strategy === 'calendar_weekly') {
    return calendarHit('calendar_weekly', d, prevDate, tradingDayIndex);
  }
  if (strategy === 'calendar_monthly') {
    return calendarHit('calendar_monthly', d, prevDate, tradingDayIndex);
  }
  if (strategy === 'hybrid') {
    if (maxAbsDiffPp(wDrift, wTargetVec) >= driftBandPp) return true;
    return (
      calendarHit('calendar_weekly', d, prevDate, tradingDayIndex) ||
      calendarHit('calendar_monthly', d, prevDate, tradingDayIndex)
    );
  }
  return false;
}

/**
 * Run single-path simulation. Missing target for a date skips that day (null value).
 */
/** Build ticker→date→close maps from `fetchComparablePriceHistory` output. */
export function buildCloseMapFromBenchmarkHistory(
  bench: Record<string, { history?: Array<{ date: string; price: number }> }>,
  tickers: string[]
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const t of tickers) {
    const h = bench[t]?.history;
    if (!h?.length) continue;
    const m = new Map<string, number>();
    for (const row of h) {
      m.set(row.date, row.price);
    }
    out.set(t.toUpperCase(), m);
  }
  return out;
}

export function runPerformanceSimulation(input: PerformanceSimulationInput): PerformanceSimulationResult {
  const { dates, targetsByDate, closeByTickerDate } = input;
  const p: SimulationParams = { ...DEFAULT_SIMULATION_PARAMS, ...input.params, cost: { ...DEFAULT_SIMULATION_PARAMS.cost, ...input.params?.cost } };

  if (dates.length < 2) {
    return { valueIndex: dates.map((d) => ({ date: d, value: 100 })), totalCostDragPoints: 0 };
  }

  const tickers = unionTickers(targetsByDate);
  if (tickers.length === 0) {
    return { valueIndex: dates.map((d) => ({ date: d, value: null })), totalCostDragPoints: 0 };
  }
  const filledCloses = forwardFillCloseMapsToDates(dates, tickers, closeByTickerDate);

  const valueIndex: Array<{ date: string; value: number | null }> = [];
  let V = 100;
  const V0 = 100;
  let totalCost = 0;

  const t0 = targetsByDate.get(dates[0]);
  if (!t0) {
    return { valueIndex: dates.map((d) => ({ date: d, value: null })), totalCostDragPoints: 0 };
  }

  let w = normalizeFrac(weightVector(tickers, ensureCashInTargets(t0)));
  valueIndex.push({ date: dates[0], value: 100 });

  for (let i = 1; i < dates.length; i++) {
    const d0 = dates[i - 1];
    const d1 = dates[i];
    const tgtRaw = targetsByDate.get(d1);
    if (!tgtRaw) {
      valueIndex.push({ date: d1, value: null });
      continue;
    }
    const wTargetMap = ensureCashInTargets(tgtRaw);
    const wTargetVec = normalizeFrac(weightVector(tickers, wTargetMap));

    const g = grossReturnFactor(w, tickers, d0, d1, filledCloses);
    V *= g;
    const wDrift = driftWeights(w, tickers, d0, d1, filledCloses);

    const rebalance = shouldRebalance(
      p.strategy,
      p.driftBandPp,
      wDrift,
      wTargetVec,
      d1,
      d0,
      i
    );

    if (rebalance) {
      const to = turnoverHalfFrac(wDrift, wTargetVec);
      const costBps = V * to * (p.cost.bpsOnNotional / 10000);
      const legs = legCountFrac(wDrift, wTargetVec);
      const costFixed = legs * p.cost.fixedUsdPerTrade;
      const cost = costBps + costFixed;
      V -= cost;
      totalCost += cost;
      w = [...wTargetVec];
    } else {
      w = [...wDrift];
    }

    valueIndex.push({ date: d1, value: V0 > 0 ? +((V / V0) * 100).toFixed(4) : null });
  }

  return { valueIndex, totalCostDragPoints: totalCost };
}
