import type { NavChartPoint } from './types';

/** Minimum daily observations before annualized Sharpe/Sortino/Calmar are shown (unstable below this). */
export const MIN_TRADING_DAYS_FOR_ANNUALIZED_RISK_RATIOS = 30;

/** Daily simple returns from consecutive NAV levels. */
export function dailySimpleReturnsFromNavs(navs: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < navs.length; i++) {
    if (navs[i - 1] > 0) out.push((navs[i] - navs[i - 1]) / navs[i - 1]);
  }
  return out;
}

function sampleStdDaily(returns: number[]): number {
  const n = returns.length;
  if (n < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(Math.max(0, variance));
}

/**
 * Sharpe ratio (Rf = 0), matching pandas `returns.std()` (sample, ddof=1) and
 * `scripts/update_tearsheet.py`: (mean daily × 252) / (std daily × √252).
 *
 * With few days or very small daily volatility, this ratio can be huge even when
 * total return is modest — use `MIN_TRADING_DAYS_FOR_ANNUALIZED_RISK_RATIOS` in UI.
 */
export function sharpeRatioFromDailyReturns(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = sampleStdDaily(returns);
  if (std === 0) return 0;
  return (mean / std) * Math.sqrt(252);
}

/** Sample std of daily returns, annualized, as a percentage. */
export function annualizedVolatilityPctFromDailyReturns(returns: number[]): number {
  if (returns.length < 2) return 0;
  return sampleStdDaily(returns) * Math.sqrt(252) * 100;
}

/**
 * Sortino (MAR = 0): annualized mean return / annualized downside deviation.
 * Downside deviation: sqrt(mean(min(0, r)²)) over all days (population RMS of negative parts).
 *
 * If there is almost no downside volatility, the ratio is undefined / misleading — return NaN.
 */
export function sortinoRatioFromDailyReturns(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downMs = returns.reduce((s, r) => s + Math.min(0, r) ** 2, 0) / returns.length;
  const dd = Math.sqrt(downMs);
  if (dd < 1e-12) return Number.NaN;
  return (mean / dd) * Math.sqrt(252);
}

export function computeRiskRatiosFromNavSnaps(snaps: NavChartPoint[]): {
  sharpe: number | null;
  sortino: number | null;
  annVolPct: number;
} | null {
  if (!snaps?.length || snaps.length < 2) return null;
  const returns = dailySimpleReturnsFromNavs(snaps.map((s) => s.nav));
  if (returns.length < 2) return null;
  const n = returns.length;
  const ok = n >= MIN_TRADING_DAYS_FOR_ANNUALIZED_RISK_RATIOS;
  const s = sortinoRatioFromDailyReturns(returns);
  return {
    sharpe: ok ? sharpeRatioFromDailyReturns(returns) : null,
    sortino: ok && Number.isFinite(s) ? s : null,
    annVolPct: annualizedVolatilityPctFromDailyReturns(returns),
  };
}
