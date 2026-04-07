-- ============================================================================
-- digiquant-atlas: Supabase Schema
-- Run via Supabase SQL Editor or `supabase db push`
-- ============================================================================

-- 1. daily_snapshots — one row per daily run
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL UNIQUE,
  run_type      text NOT NULL CHECK (run_type IN ('baseline', 'delta')),
  baseline_date date,
  regime        jsonb NOT NULL,
  market_data   jsonb NOT NULL,
  segment_biases jsonb,
  actionable    text[],
  risks         text[],
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_snapshots(date DESC);

-- 2. positions — one row per ticker per day
CREATE TABLE IF NOT EXISTS positions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  ticker        text NOT NULL,
  name          text,
  category      text,
  weight_pct    numeric NOT NULL,
  action        text,
  thesis_id     text,
  rationale     text,
  current_price numeric,
  entry_price   numeric,
  entry_date    date,
  pm_notes      text,
  UNIQUE(date, ticker)
);
CREATE INDEX IF NOT EXISTS idx_positions_date ON positions(date DESC);
CREATE INDEX IF NOT EXISTS idx_positions_ticker ON positions(ticker, date DESC);

-- 3. theses — one row per thesis per day
CREATE TABLE IF NOT EXISTS theses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  thesis_id     text NOT NULL,
  name          text NOT NULL,
  vehicle       text,
  invalidation  text,
  status        text,
  notes         text,
  UNIQUE(date, thesis_id)
);
CREATE INDEX IF NOT EXISTS idx_theses_date ON theses(date DESC);

-- 4. position_events — append-only change ledger
CREATE TABLE IF NOT EXISTS position_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date            date NOT NULL,
  ticker          text NOT NULL,
  event           text NOT NULL CHECK (event IN ('OPEN', 'EXIT', 'REBALANCE', 'HOLD')),
  weight_pct      numeric,
  prev_weight_pct numeric,
  price           numeric,
  thesis_id       text,
  reason          text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(date, ticker)
);
CREATE INDEX IF NOT EXISTS idx_events_date ON position_events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_ticker ON position_events(ticker, date DESC);

-- 5. documents — markdown content index (lazy-loaded by frontend)
CREATE TABLE IF NOT EXISTS documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  title         text NOT NULL,
  doc_type      text,
  phase         int,
  category      text,
  segment       text,
  sector        text,
  run_type      text,
  file_path     text NOT NULL,
  content       text,
  UNIQUE(date, file_path)
);
CREATE INDEX IF NOT EXISTS idx_docs_date ON documents(date DESC);
CREATE INDEX IF NOT EXISTS idx_docs_category ON documents(category);

-- 6. nav_history — portfolio NAV time series
CREATE TABLE IF NOT EXISTS nav_history (
  date          date PRIMARY KEY,
  nav           numeric NOT NULL,
  cash_pct      numeric,
  invested_pct  numeric
);

-- 7. benchmark_history — comparison benchmarks
CREATE TABLE IF NOT EXISTS benchmark_history (
  date          date NOT NULL,
  ticker        text NOT NULL,
  price         numeric NOT NULL,
  PRIMARY KEY (date, ticker)
);

-- 8. portfolio_metrics — computed rolling metrics
CREATE TABLE IF NOT EXISTS portfolio_metrics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL UNIQUE,
  pnl_pct       numeric,
  sharpe        numeric,
  volatility    numeric,
  max_drawdown  numeric,
  alpha         numeric,
  cash_pct      numeric,
  total_invested numeric,
  generated_at  timestamptz DEFAULT now()
);

-- ============================================================================
-- Row Level Security — anon = read-only, service_role = full access
-- ============================================================================

ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read" ON daily_snapshots;
DROP POLICY IF EXISTS "anon_read" ON positions;
DROP POLICY IF EXISTS "anon_read" ON theses;
DROP POLICY IF EXISTS "anon_read" ON position_events;
DROP POLICY IF EXISTS "anon_read" ON documents;
DROP POLICY IF EXISTS "anon_read" ON nav_history;
DROP POLICY IF EXISTS "anon_read" ON benchmark_history;
DROP POLICY IF EXISTS "anon_read" ON portfolio_metrics;

CREATE POLICY "anon_read" ON daily_snapshots FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON positions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON theses FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON position_events FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON documents FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON nav_history FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON benchmark_history FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON portfolio_metrics FOR SELECT TO anon USING (true);
