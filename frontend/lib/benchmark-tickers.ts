/**
 * ETFs used for Performance page comparison charts. Must stay in sync with
 * `BENCHMARKS` in scripts/update_tearsheet.py and populated in price_history
 * (e.g. scripts/preload-history.py --supabase).
 *
 * IBIT: BTC spot ETF proxy. EEM: emerging markets. IWM: small-cap.
 */
export const DASHBOARD_BENCHMARK_TICKERS = [
  'SPY',
  'QQQ',
  'IWM',
  'EEM',
  'TLT',
  'GLD',
  'IBIT',
] as const;
