/**
 * Domain types — assembled shapes returned by the data layer and consumed by
 * components. These are derived from Supabase table rows but are NOT raw rows;
 * they add computed fields and restructure data for frontend consumption.
 */

// ---------------------------------------------------------------------------
// Supabase raw row re-exports (aliased for internal use)
// ---------------------------------------------------------------------------
import type { TableRow } from './database.types';

export type SnapshotRow = TableRow<'daily_snapshots'>;
export type PositionRow = TableRow<'positions'>;
export type ThesisRow = TableRow<'theses'>;
export type DocumentRow = TableRow<'documents'>;
export type NavHistoryRow = TableRow<'nav_history'>;
export type PortfolioMetricsRow = TableRow<'portfolio_metrics'>;

// ---------------------------------------------------------------------------
// Assembled domain types (transformed by queries.ts)
// ---------------------------------------------------------------------------

/** A single holding as returned to components. */
export interface Position {
  ticker: string;
  name: string;
  type: 'LONG' | 'SHORT';
  weight_actual: number;
  current_price: number | null;
  entry_price: number | null;
  entry_date: string | null;
  rationale: string;
  thesis_ids: string[];
  category: string;
  pm_notes: string;
  stats: Record<string, unknown>;
  /** Filled by refresh_performance_metrics.py after close (optional). */
  unrealized_pnl_pct?: number | null;
  day_change_pct?: number | null;
  since_entry_return_pct?: number | null;
  contribution_pct?: number | null;
  metrics_as_of?: string | null;
}

/** Active investment thesis as returned to components. */
export interface Thesis {
  id: string;
  name: string;
  vehicle: string | null;
  invalidation: string | null;
  status: string | null;
  notes: string | null;
}

/** The current regime/strategy as assembled from the latest snapshot. */
export interface PortfolioStrategy {
  regime: string;
  regime_label: 'bullish' | 'bearish' | 'caution' | 'neutral' | string;
  summary: string;
  actionable: string[];
  risks: string[];
  theses: Thesis[];
  next_review: string;
}

/** A proposed change to the portfolio. */
export interface ProposedPosition {
  ticker: string;
  weight_pct: number;
  action: string;
}

/** A rebalancing instruction. */
export interface RebalanceAction {
  ticker: string;
  current_pct: number;
  recommended_pct: number;
  action: string;
}

/** Current position as stored in portfolio_management. */
export interface CurrentPosition {
  ticker: string;
  name: string;
  category: string;
  weight_pct: number;
  thesis_ids: string[];
  entry_date: string | null;
  entry_price_usd: number | null;
  notes: string;
}

/** Benchmark data for a single ticker. */
export interface BenchmarkData {
  current: number | null;
  history: Array<{ date: string; price: number }>;
}

/** Map of benchmark ticker → BenchmarkData. */
export type BenchmarkHistoryMap = Record<string, BenchmarkData>;

/** A single NAV data point for charts. */
export interface NavChartPoint {
  date: string;
  nav: number;
}

/** Chart row for the Performance page NAV chart — portfolio + optional benchmark columns. */
export interface PerfChartPoint {
  date: string;
  portfolio: number | null;
  [benchmark: string]: number | null | string;
}

/** Portfolio meta / identity fields. */
export interface PortfolioMeta {
  name: string;
  base_currency: string;
  last_updated: string | null;
  benchmarks: string[];
  inception_date?: string;
}

/** Top-level portfolio object. */
export interface Portfolio {
  meta: PortfolioMeta;
  snapshots: NavChartPoint[];
  strategy: PortfolioStrategy;
}

/** Portfolio management block. */
export interface PortfolioManagement {
  current_positions: CurrentPosition[];
  proposed_positions: ProposedPosition[];
  constraints: Record<string, unknown>;
  rebalance_actions: RebalanceAction[];
  pnl_fx_impact: number | null;
}

/** Computed summary metrics for the performance page. */
export interface CalculatedMetrics {
  portfolio_pnl: number;
  total_invested: number;
  cash_pct: number;
  sharpe: number;
  volatility: number;
  max_drawdown: number;
  alpha: number;
}

/** A document record as returned to the Research Library. */
export interface Doc {
  id: string;
  date: string;
  title: string;
  type: string | null;
  phase: number | null;
  category: string | null;
  segment: string | null;
  sector: string | null;
  runType: string | null;
  path: string;
  // Enriched fields added by the Library page
  filename?: string;
  cadence?: string;
  content?: string;
}

/** The complete data object returned by getFullDashboardData(). */
export interface DashboardData {
  portfolio: Portfolio;
  positions: Position[];
  portfolio_management: PortfolioManagement;
  ratios: Array<{ long_ticker: string; short_ticker: string; net_weight: number }>;
  docs: Doc[];
  benchmarks: BenchmarkHistoryMap;
  calculated: CalculatedMetrics;
}

// ---------------------------------------------------------------------------
// Advanced Statistics (performance page)
// ---------------------------------------------------------------------------

export interface PerformanceMetrics {
  tradingDays: number;
  totalReturn: number;
  annReturn: number;
  annVol: number;
  sharpe: number;
  sortino: number;
  maxDd: number;
  ddStart: string;
  ddEnd: string;
  currDd: number;
  winRate: number;
  upDays: number;
  downDays: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  calmar: number;
  bestDay: number;
  worstDay: number;
  beta: number | null;
  correlation: number | null;
  alphaAnn: number | null;
  trackingError: number | null;
  infoRatio: number | null;
}

// ---------------------------------------------------------------------------
// Component-level prop interfaces
// ---------------------------------------------------------------------------

export interface MiniCalendarProps {
  dates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
}

export interface PositionPnlTableProps {
  positions: Position[];
}

export interface AdvancedStatsProps {
  metrics: CalculatedMetrics;
  snaps: NavChartPoint[];
  benchmarks: BenchmarkHistoryMap;
}
