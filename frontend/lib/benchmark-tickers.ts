/**
 * ETFs used for Performance page comparison charts. Must stay in sync with
 * `BENCHMARKS` in scripts/update_tearsheet.py and populated in price_history
 * (e.g. scripts/preload-history.py --supabase).
 */
export const DASHBOARD_BENCHMARK_TICKERS = ['SPY', 'QQQ', 'TLT', 'GLD'] as const;
