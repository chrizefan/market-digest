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
| `scripts/fetch-quotes.py [date]` | Downloads 3-month OHLCV for all ~60 watchlist tickers and computes RSI(14), MACD, SMA20/50/200, ATR(14), Bollinger Bands via pandas-ta |
| `scripts/fetch-macro.py [date]` | Fetches full US yield curve (US Treasury public XML API, no auth) + VIX, SKEW, crude, gold, NatGas, BTC, ETH, FX pairs via yfinance |
| `scripts/fetch-market-data.sh [date]` | Runs both scripts, validates outputs, prints summary. Use this as the single entry point. |

---

## How to Run

```bash
# Standard (today):
./scripts/fetch-market-data.sh

# Specific date:
./scripts/fetch-market-data.sh 2026-04-06

# Dependencies (one-time setup):
pip install -r requirements.txt
```

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
| `high_3mo` / `low_3mo` | 3-month high / low |
| `pct_from_high` | % below 3-month high |
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

No API keys required. All data sources are free and public.
