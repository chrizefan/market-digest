---
name: data-fetch
description: >
  Systematic market data fetch. Downloads live quotes, technicals, and macro series using free
  public APIs (yfinance + US Treasury XML) before the analysis pipeline starts. Produces structured
  JSON + human-readable markdown summaries in outputs/daily/YYYY-MM-DD/data/. Downstream skills
  read these files FIRST instead of web-browsing for prices and yields.
  Triggers: automatically as Step 0 of every daily pipeline via cowork-daily-prompt.txt.
  Manual: "fetch market data", "refresh data", "run fetch-market-data.sh".
---

# SKILL-data-fetch — Systematic Market Data Layer

This skill describes the data layer that grounds every pipeline run in accurate, systematic numbers.
The fetch scripts run before any analysis phase and produce files that agents read as authoritative
numerical anchors — replacing ad-hoc web browsing for prices, RSI, yield curve levels, and VIX.

---

## Why This Layer Exists

Without it, agents web-browse for each price individually — which is slow, inconsistent, and can
produce stale or incorrect values from article summaries rather than actual price feeds. With this
layer, every agent reads the same source-of-truth JSON/Markdown files fetched right before the run.

---

## Scripts

| Script | What It Does |
|--------|-------------|
| `scripts/preload-history.py` | **One-time / weekly**: bulk-downloads 2yr OHLCV for all watchlist tickers and caches them as CSV files in `data/price-history/`. Run once to seed the cache; re-run with `--refresh` to update stale tickers. |
| `scripts/fetch-quotes.py [date]` | **Daily**: loads cached history, fetches only the latest missing days, appends to cache, then computes RSI(14), MACD, SMA20/50/200, ATR(14), Bollinger Bands via pandas-ta. Falls back to 3-month bulk download if no cache exists. |
| `scripts/fetch-macro.py [date]` | Fetches full US yield curve (US Treasury public XML API, no auth) + VIX, SKEW, crude, gold, NatGas, BTC, ETH, FX pairs via yfinance |
| `scripts/fetch-market-data.sh [date]` | Orchestrator — auto-seeds cache on first run, then runs both fetch scripts, validates outputs, prints summary. Pass `--preload` to force a full cache rebuild. |

---

## How to Run

```bash
# First-time setup — preload 2yr price history cache:
python3 scripts/preload-history.py              # all watchlist tickers, 2yr
python3 scripts/preload-history.py --period 5y   # deeper history
python3 scripts/preload-history.py --ticker SPY  # single ticker
python3 scripts/preload-history.py --refresh     # only update stale (>7d) tickers

# Standard daily run (today) — incremental update from cache:
./scripts/fetch-market-data.sh

# Specific date:
./scripts/fetch-market-data.sh 2026-04-06

# Force full cache rebuild:
./scripts/fetch-market-data.sh --preload

# Dependencies (one-time setup):
pip install -r requirements.txt
```

### Price History Cache

The cache lives at `data/price-history/{TICKER}.csv` — one CSV per ticker with columns: Date, Open, High, Low, Close, Volume. Benefits:

- **SMA200 accuracy**: with 2yr of data, the 200-day SMA is fully warmed up (3-month window only had ~63 trading days)
- **True 52-week high/low**: the range high/low now reflects the actual cached window, not just 3 months
- **Speed**: daily runs download 1–5 new rows per ticker instead of ~63 rows × 70 tickers
- **Resilience**: if yfinance is rate-limited, the cache still provides yesterday's data for technicals

The cache directory is in `.gitignore` (derived data). Run `preload-history.py` to regenerate.

### Sandbox / CI Alternative (no yfinance)

When `fetch-market-data.sh` fails (sandboxed agents, CI, missing yfinance), use the MCP-based
data fetch instead. See **`skills/SKILL-mcp-data-fetch.md`** for full instructions.

MCP data fetch uses FRED (yield curve, VIX), Frankfurter (FX), CoinGecko (crypto), and
Alpha Vantage (stock/ETF prices + technicals) to produce the same `quotes.json` and `macro.json`
output schema. Coverage is slightly reduced (fewer tickers, limited technicals) but sufficient
for high-quality analysis.

---

## Supabase as Primary Data Source (post-April 2026)

A GitHub Actions workflow runs every trading day at **6:00 PM ET** (right after the data settles
post-close). It fetches OHLCV for all 56 watchlist tickers and computes 35 TA indicators, writing
both into Supabase. This is the **fastest and most reliable** data source for digest runs.

### Tables

| Table | Contents | Refresh |
|-------|----------|---------|
| `price_history` | OHLCV rows per ticker per date | Daily, 6 PM ET |
| `price_technicals` | 35 TA indicators per ticker per date | Daily, after price_history |

### Key indicator columns in `price_technicals`

| Column | Description |
|--------|-------------|
| `sma_20`, `sma_50`, `sma_200` | Simple moving averages |
| `ema_12`, `ema_26`, `ema_50` | Exponential moving averages |
| `pct_vs_sma20`, `pct_vs_sma50`, `pct_vs_sma200` | % price deviation from each MA |
| `rsi_7`, `rsi_14`, `rsi_21` | RSI at 3 lookback periods |
| `macd`, `macd_signal`, `macd_hist` | MACD line, signal, histogram |
| `roc_5`, `roc_10`, `roc_21` | Rate of change (5, 10, 21 days) |
| `atr_14`, `atr_pct` | ATR dollar and % of price |
| `bb_upper`, `bb_middle`, `bb_lower` | Bollinger Bands (20-period, 2σ) |
| `bb_pct_b`, `bb_bandwidth` | %B (0–1 position) and bandwidth |
| `hist_vol_21` | 21-day realized vol (annualized) |
| `stoch_k`, `stoch_d` | Stochastic %K and %D |
| `adx_14`, `dmi_plus`, `dmi_minus` | ADX trend strength + DMI ±14 |
| `zscore_50`, `zscore_200` | Price z-score vs 50-day and 200-day rolling mean |

### Example MCP queries (use `mcp_supabase_execute_sql`)

```sql
-- Latest indicators for all tickers
SELECT * FROM price_technicals
WHERE date = (SELECT MAX(date) FROM price_technicals);

-- Single ticker detail
SELECT * FROM price_technicals
WHERE ticker = 'SPY'
ORDER BY date DESC
LIMIT 5;

-- Check freshness
SELECT MAX(date) AS latest_date, COUNT(DISTINCT ticker) AS tickers
FROM price_technicals;

-- Screening: RSI oversold + above 200-day MA
SELECT ticker, date, rsi_14, pct_vs_sma200
FROM price_technicals
WHERE date = (SELECT MAX(date) FROM price_technicals)
  AND rsi_14 < 35
  AND pct_vs_sma200 > 0
ORDER BY rsi_14;
```

**When to use Supabase vs local scripts:**
- **Supabase first**: If `MAX(date)` is within the last 3 calendar days (covers weekends and
  US market holidays — e.g. Monday morning will see Friday's close as latest_date), query
  Supabase — no scripts needed.
- **Local scripts fallback**: If `MAX(date)` is 4+ calendar days old (workflow failed or
  hasn't been configured), run `./scripts/fetch-market-data.sh`.
- **MCP fallback**: If scripts are unavailable (sandbox), follow `SKILL-mcp-data-fetch.md`.

---

## Outputs

All files written to `outputs/daily/YYYY-MM-DD/data/`:

| File | Contents |
|------|---------|
| `quotes.json` | Full technical snapshot for every watchlist ticker (JSON array) |
| `quotes-summary.md` | Human-readable table sorted by 1D%, plus UPTREND/DOWNTREND/MIXED buckets |
| `macro.json` | Yield curve 1M–30Y, spreads, VIX, SKEW, commodities, crypto, FX (JSON) |
| `macro-summary.md` | Human-readable yield curve table + spread signals + all macro series |

---

## Data Dictionary — quotes.json

Each entry in `snapshots[]` contains:

| Field | Description |
|-------|-------------|
| `ticker` | Ticker symbol |
| `price` | Latest close price (~15min delayed) |
| `pct_1d` | 1-day % change |
| `high_range` / `low_range` | Range high / low (full cached window — up to 2yr when preloaded) |
| `pct_from_high` | % below range high |
| `volume` | Today's volume |
| `volume_ratio` | Today's volume ÷ 20-day average (>1.3 = elevated) |
| `rsi14` | RSI with 14-period lookback |
| `macd_signal` | BULLISH_CROSS / BEARISH_CROSS / BULLISH / BEARISH |
| `macd_hist` | MACD histogram value |
| `sma20` / `sma50` / `sma200` | Simple moving averages |
| `atr14` | 14-day Average True Range (dollar volatility) |
| `bb_upper` / `bb_lower` | Bollinger Bands (20-period, 2 std dev) |
| `above_sma50` | `true` / `false` — price above 50-day MA |
| `above_sma200` | `true` / `false` — price above 200-day MA |
| `trend` | UPTREND / DOWNTREND / ABOVE50 / BELOW50 / NEUTRAL |

---

## Data Dictionary — macro.json

| Field | Description |
|-------|-------------|
| `yield_curve.yields` | Dict of maturity → yield % (1M, 2M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y) |
| `yield_curve.curve_date` | Date of yield data (prior business day) |
| `spreads.2s10s` | 10Y minus 2Y yield (negative = inverted) |
| `spreads.3m10y` | 10Y minus 3M yield (most reliable recession predictor) |
| `spreads.5s30s` | 30Y minus 5Y |
| `inversions[]` | List of currently inverted spread labels |
| `series.vix.price` | VIX level |
| `series.skew.price` | SKEW index |
| `series.crude.price` | WTI crude front-month futures |
| `series.brent.price` | Brent crude futures |
| `series.gold.price` | Gold futures |
| `series.natgas.price` | Natural gas futures |
| `series.btc.price` | BTC/USD |
| `series.eth.price` | ETH/USD |
| `series.usdcad.price` | USD/CAD exchange rate |
| `series.eurusd.price` | EUR/USD |
| `series.usdjpy.price` | USD/JPY |
| `series.dxy.price` | US Dollar Index |
| `series.hyg.price` | HYG (High Yield ETF) — proxy for credit risk appetite |
| `series.lqd.price` | LQD (Investment Grade ETF) |
| `series.tlt.price` | TLT (20Y Treasury ETF) |

---

## Agent Instructions

When the data files exist, **always read them first** before web-searching for numbers:

1. **For prices, RSI, MACD, trend**: Read `quotes-summary.md` — find the ticker row.
2. **For yield curve, VIX, commodities, FX**: Read `macro-summary.md` — values are in tables.
3. **Web search only for**:
   - News catalysts and narrative (why prices moved)
   - Economic calendar actual vs. consensus
   - Fed speeches, analyst upgrades/downgrades
   - Earnings reactions and forward guidance
   - Data not in the files (e.g., breadth indicators, McClellan oscillator)

### Technical Score (for Opportunity Screener)
When scoring tickers in `SKILL-opportunity-screener.md`, add a **Technical Score (±1)**:
- **+1** if: `above_sma50 = true` AND `rsi14` between 40–65 AND `macd_signal` is BULLISH or BULLISH_CROSS AND `volume_ratio >= 1.2`
- **-1** if: `above_sma200 = false` AND (`rsi14 < 35` OR `rsi14 > 72`) AND `macd_signal` is BEARISH or BEARISH_CROSS
- **0** otherwise (mixed signals)

---

## Freshness & Limitations

| Data | Delay | Notes |
|------|-------|-------|
| Yahoo Finance quotes | ~15 min | Pre-market/after-hours not included in `close` |
| Technical indicators | Computed from close prices | Intraday moves not reflected until next close |
| US Treasury yield curve | Prior business day | Published by Treasury after ~3pm ET |
| Yield curve freshness note | Script annotates `curve_date` | Always check this field |

**If `data/` folder is missing**: run `./scripts/fetch-market-data.sh` before proceeding with any
analysis phase. The scripts complete in under 2 minutes on a standard connection.

---

## Dependency Installation

```bash
pip install -r requirements.txt
# Installs: yfinance, pandas, numpy, pandas-ta, requests
```

No API keys required for yfinance mode. All data sources are free and public.

### MCP Mode Dependencies

MCP mode requires active MCP server connections (configured in the agent's environment):
- **FRED** — requires API key (free at https://fred.stlouisfed.org/docs/api/api_key.html)
- **Alpha Vantage** — requires API key (free tier: 25 calls/day)
- **CoinGecko** — free tier, no key required
- **Frankfurter** — free, no key required

See `skills/SKILL-mcp-data-fetch.md` for detailed MCP data fetch instructions.
