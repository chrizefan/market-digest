---
name: mcp-data-fetch
description: >
  Sandbox-compatible market data fetch using MCP tool connections (Alpha Vantage, FRED, CoinGecko,
  Frankfurter) instead of yfinance Python scripts. Produces the same quotes.json and macro.json
  output schema that downstream skills expect. Use when yfinance/pandas-ta are unavailable (sandbox,
  CI environments) or when fetch-market-data.sh fails.
  Triggers: "fetch data via MCP", "sandbox data fetch", or automatically when the orchestrator
  Data Layer Check detects missing data files and shell scripts cannot run.
---

# SKILL-mcp-data-fetch — Sandbox Market Data via MCP Tools

This skill replaces the Python-based data fetch (`fetch-quotes.py` + `fetch-macro.py`) with
direct MCP tool calls. It produces **identical output files** (`quotes.json`, `macro.json`,
`quotes-summary.md`, `macro-summary.md`) so downstream skills work without changes.

**When to use**: Any environment where `yfinance` or `pandas-ta` cannot be installed or cannot
reach Yahoo Finance APIs (sandboxed agents, CI, restricted networks).

**When NOT to use**: If `./scripts/fetch-market-data.sh` succeeds, prefer it — it produces richer
data (full technicals, 3-month OHLCV history, Bollinger Bands, ATR).

---

## MCP Tool → Data Mapping

| Data Need | MCP Tool | Notes |
|-----------|----------|-------|
| US Treasury yield curve | `mcp_fred_fred_series_observations` | Series: DGS1MO, DGS3MO, DGS6MO, DGS1, DGS2, DGS3, DGS5, DGS7, DGS10, DGS20, DGS30 |
| VIX | `mcp_fred_fred_series_observations` | Series: VIXCLS |
| Yield curve spreads | `mcp_fred_fred_series_observations` | Series: T10Y2Y (2s10s), T10Y3M (3m10y) |
| Stock/ETF prices | `mcp_alpha-vantage_get_stock_price` | 1 call per ticker — prioritize portfolio + benchmarks |
| Technical indicators | `mcp_alpha-vantage_get_technical_indicator` | RSI, SMA, EMA, MACD — 1 call per ticker×indicator |
| BTC, ETH prices | `mcp_coingecko_execute` | Single call gets both |
| FX rates | `mcp_frankfurter-f_get_latest_exchange_rates` | Single call for all pairs (base=USD) |
| Inflation breakevens | `mcp_fred_fred_series_observations` | T10YIE, T5YIE, DFII10 |

---

## Rate Limit Awareness

| MCP Server | Free Tier Limit | Strategy |
|------------|----------------|----------|
| **FRED** | 120 requests/min | Generous — fetch all macro series freely |
| **Frankfurter** | Unlimited | Single call returns all FX rates |
| **CoinGecko** | ~30 calls/min | Single call for BTC + ETH is sufficient |
| **Alpha Vantage** | 25 calls/day (free) | **Budget carefully** — see priority tiers below |

### Alpha Vantage Call Budget (25 calls/day free tier)

| Tier | Tickers | Calls | Priority |
|------|---------|-------|----------|
| **1 — Portfolio** | Current holdings from `config/portfolio.json` | ~7 | MUST fetch |
| **2 — Benchmarks** | SPY, QQQ, IWM, DXY (DX-Y.NYB) | ~4 | MUST fetch |
| **3 — Sector ETFs** | XLK, XLF, XLE, XLV, XLI, XLP, XLB, XLC, XLRE, XLU, XLY | ~11 | Fetch if budget allows |
| **4 — Technicals** | RSI for portfolio tickers | ~7 | Fetch if budget allows |

**With 25 calls**: Fetch Tier 1 + Tier 2 prices (11 calls) + RSI for portfolio tickers (7 calls) = 18 calls. Remaining 7 for sector ETFs.

**If you have a premium key**: Fetch all ~60 watchlist tickers + full technicals.

---

## Step-by-Step Procedure

### Step 0 — Setup

Determine today's date and create the data output directory:
```
DATE = $(date +%Y-%m-%d)   # or the target date
Output path: outputs/daily/{DATE}/data/
```

Create the directory if it doesn't exist.

---

### Step 1 — Yield Curve (FRED)

Fetch the latest observation for each Treasury maturity:

```
FRED Series → Label mapping:
  DGS1MO  → 1M
  DGS3MO  → 3M
  DGS6MO  → 6M
  DGS1    → 1Y
  DGS2    → 2Y
  DGS3    → 3Y
  DGS5    → 5Y
  DGS7    → 7Y
  DGS10   → 10Y
  DGS20   → 20Y
  DGS30   → 30Y
```

For each series, call:
```
mcp_fred_fred_series_observations(
  series_id: "DGS10",
  sort_order: "desc",
  limit: 5
)
```

Take the most recent non-"." observation value. FRED uses "." for missing data.

**Compute spreads**:
- `2s10s` = DGS10 − DGS2
- `3m10y` = DGS10 − DGS3MO
- `5s30s` = DGS30 − DGS5
- `2s30s` = DGS30 − DGS2

**Flag inversions**: Any spread < 0 is inverted.

---

### Step 2 — VIX & Volatility (FRED)

```
mcp_fred_fred_series_observations(series_id: "VIXCLS", sort_order: "desc", limit: 5)
```

Note: FRED's VIXCLS may lag 1 business day. If the value seems stale, note this in the summary.

---

### Step 3 — FX Rates (Frankfurter)

Single call gets all needed FX rates:
```
mcp_frankfurter-f_get_latest_exchange_rates(
  base_currency: "USD",
  symbols: ["CAD", "EUR", "JPY", "GBP", "CNY", "CHF"]
)
```

This returns rates as USD→target. To match the yfinance convention:
- `usdcad` = result.CAD (direct)
- `eurusd` = 1 / result.EUR (invert — Frankfurter returns USD→EUR)
- `usdjpy` = result.JPY (direct)
- `gbpusd` = 1 / result.GBP (invert)

**Note**: Frankfurter does not provide DXY (Dollar Index). For DXY, use Alpha Vantage: `get_stock_price(symbol: "DX-Y.NYB")` or note "DXY unavailable in MCP mode".

---

### Step 4 — Crypto Prices (CoinGecko)

```
mcp_coingecko_execute(
  intent: "Get BTC and ETH current prices with 24h change",
  code: `
async function run(client) {
  const data = await client.simple.price.get({
    vs_currencies: 'usd',
    ids: 'bitcoin,ethereum',
    include_24hr_change: true,
    include_market_cap: true,
  });
  return data;
}
`
)
```

Map results:
- `btc.price` = data.bitcoin.usd
- `btc.pct_1d` = data.bitcoin.usd_24h_change
- `eth.price` = data.ethereum.usd
- `eth.pct_1d` = data.ethereum.usd_24h_change

---

### Step 5 — Stock/ETF Prices (Alpha Vantage)

Read `config/portfolio.json` to get current holdings. Read `config/watchlist.md` for the full universe.

**Priority order** (stop when hitting rate limit):

**Tier 1 — Portfolio positions** (always fetch):
For each ticker in portfolio.json:
```
mcp_alpha-vantage_get_stock_price(symbol: "IAU")
```

**Tier 2 — Key benchmarks** (always fetch):
```
SPY, QQQ, IWM
```

**Tier 3 — Sector ETFs** (if budget allows):
```
XLK, XLF, XLE, XLV, XLI, XLP, XLB, XLC, XLRE, XLU, XLY
```

**Tier 4 — Remaining watchlist tickers** (if premium tier):
All other tickers from `config/watchlist.md`.

---

### Step 6 — Technical Indicators (Alpha Vantage, optional)

If API budget remains, fetch RSI for portfolio tickers:
```
mcp_alpha-vantage_get_technical_indicator(
  symbol: "XLE",
  indicator: "RSI",
  interval: "daily"
)
```

Also useful: SMA (50-day and 200-day):
```
mcp_alpha-vantage_get_technical_indicator(symbol: "XLE", indicator: "SMA", interval: "daily")
```

For each ticker with RSI data, determine:
- `above_sma50`: price > SMA50
- `above_sma200`: price > SMA200
- `trend`: UPTREND if price > SMA50 > SMA200, DOWNTREND if price < SMA50 < SMA200

**If no API budget for technicals**: Set technical fields to `null` in quotes.json. The agent
can still perform analysis using price data alone.

---

### Step 7 — Commodities (Alpha Vantage / FRED)

Commodities via ETF proxies (uses Alpha Vantage `get_stock_price`):
- Gold: `GLD` or `IAU`
- Oil: `USO` or `DBO`
- Silver: `SLV`
- Natural Gas: `UNG`

These may already be covered in Step 5 if they're in the portfolio. Don't double-fetch.

For gold/silver/oil futures prices (more accurate), use FRED if available:
- Gold: `GOLDAMGBD228NLBM` (London Gold Fixing)
- WTI Crude: `DCOILWTICO`
- Brent: `DCOILBRENTEU`

---

### Step 8 — Write macro.json

Assemble all macro data into the standard schema:

```json
{
  "date": "YYYY-MM-DD",
  "fetched_at": "YYYY-MM-DD HH:MM ET",
  "source": "MCP tools (FRED + Frankfurter + CoinGecko + Alpha Vantage)",
  "yield_curve": {
    "source": "FRED (DGSxx series)",
    "curve_date": "YYYY-MM-DD",
    "yields": {
      "1M": 5.21, "3M": 5.18, "6M": 5.05, "1Y": 4.82,
      "2Y": 4.55, "3Y": 4.40, "5Y": 4.30, "7Y": 4.35,
      "10Y": 4.42, "20Y": 4.68, "30Y": 4.60
    }
  },
  "spreads": {
    "2s10s": -0.13,
    "3m10y": -0.76,
    "5s30s": 0.30,
    "2s30s": 0.05
  },
  "inversions": ["2s10s INVERTED (-0.13)", "3m10Y INVERTED (-0.76)"],
  "series": {
    "vix": {"symbol": "VIXCLS", "price": 18.5, "pct_1d": null, "as_of": "2025-01-10"},
    "crude": {"symbol": "DCOILWTICO", "price": 72.50, "pct_1d": null, "as_of": "2025-01-10"},
    "gold": {"symbol": "GOLDAMGBD228NLBM", "price": 2680.0, "pct_1d": null, "as_of": "2025-01-10"},
    "btc": {"symbol": "BTC-USD", "price": 94500.0, "pct_1d": 2.1, "as_of": "2025-01-10"},
    "eth": {"symbol": "ETH-USD", "price": 3350.0, "pct_1d": 1.5, "as_of": "2025-01-10"},
    "usdcad": {"symbol": "USDCAD", "price": 1.3650, "pct_1d": null, "as_of": "2025-01-10"},
    "eurusd": {"symbol": "EURUSD", "price": 1.0285, "pct_1d": null, "as_of": "2025-01-10"},
    "usdjpy": {"symbol": "USDJPY", "price": 157.80, "pct_1d": null, "as_of": "2025-01-10"},
    "gbpusd": {"symbol": "GBPUSD", "price": 1.2210, "pct_1d": null, "as_of": "2025-01-10"},
    "dxy": {"symbol": "DX-Y.NYB", "price": 109.5, "pct_1d": null, "as_of": "2025-01-10"},
    "hyg": {"symbol": "HYG", "price": 78.50, "pct_1d": null, "as_of": "2025-01-10"},
    "lqd": {"symbol": "LQD", "price": 105.20, "pct_1d": null, "as_of": "2025-01-10"},
    "tlt": {"symbol": "TLT", "price": 87.50, "pct_1d": null, "as_of": "2025-01-10"},
    "bil": {"symbol": "BIL", "price": 91.70, "pct_1d": null, "as_of": "2025-01-10"},
    "spy": {"symbol": "SPY", "price": 585.00, "pct_1d": null, "as_of": "2025-01-10"}
  }
}
```

Write to: `outputs/daily/{DATE}/data/macro.json`

**Fields that may be `null` in MCP mode**: `pct_1d` for most series (FRED/Frankfurter don't easily provide 1-day change). `skew` (not available via FRED). This is acceptable — downstream skills treat `null` as "not available".

---

### Step 9 — Write quotes.json

Assemble all stock/ETF data:

```json
{
  "date": "YYYY-MM-DD",
  "fetched_at": "YYYY-MM-DD HH:MM ET",
  "source": "MCP tools (Alpha Vantage)",
  "ticker_count": 15,
  "success_count": 15,
  "snapshots": [
    {
      "ticker": "SPY",
      "price": 585.00,
      "pct_1d": null,
      "high_3mo": null,
      "low_3mo": null,
      "pct_from_high": null,
      "volume": null,
      "volume_ratio": null,
      "rsi14": 55.2,
      "macd_signal": null,
      "macd_hist": null,
      "sma20": null,
      "sma50": 575.00,
      "sma200": 550.00,
      "atr14": null,
      "bb_upper": null,
      "bb_lower": null,
      "above_sma50": true,
      "above_sma200": true,
      "trend": "UPTREND"
    }
  ]
}
```

Write to: `outputs/daily/{DATE}/data/quotes.json`

**Fields that will be `null` in MCP mode**: `high_3mo`, `low_3mo`, `pct_from_high`, `volume`, `volume_ratio`, `macd_signal`, `macd_hist`, `sma20`, `atr14`, `bb_upper`, `bb_lower`. These require full OHLCV history or pandas-ta computations. Downstream skills handle nulls gracefully.

---

### Step 10 — Write Summary Markdown Files

#### macro-summary.md

Write a human-readable summary following the same format as `fetch-macro.py` output:

```markdown
# Macro Data Snapshot — YYYY-MM-DD HH:MM ET

> **Data sources**: FRED (yield curve, VIX) + Frankfurter (FX) + CoinGecko (crypto) + Alpha Vantage (equities).
> **Mode**: MCP sandbox fetch (technicals may be limited).

---

## Yield Curve (US Treasuries)
> Source: FRED DGS series (as of YYYY-MM-DD)

| Maturity | Yield |
|----------|-------|
| 1M | X.XXX% |
...

### Key Spreads
| Spread | Value | Signal |
|--------|-------|--------|
| 2s10s | +X.XXX% | ✅ Normal / ⚠️ INVERTED |
...

---

## Volatility
| Index | Level | 1D Change |
|-------|-------|-----------|
| VIX | XX.X | – |

---

## Commodities
| Name | Price | 1D Change |
|------|-------|-----------|
| WTI Crude | $XX.XX | – |
...

## Crypto
| Name | Price | 24H Change |
|------|-------|------------|
| BTC | $XX,XXX | +X.X% |
| ETH | $X,XXX | +X.X% |

## FX
| Pair | Rate | 1D Change |
|------|------|-----------|
| USD/CAD | X.XXXX | – |
...
```

Write to: `outputs/daily/{DATE}/data/macro-summary.md`

#### quotes-summary.md

```markdown
# Quotes Snapshot — YYYY-MM-DD HH:MM ET

> **XX** tickers fetched via MCP (Alpha Vantage). Technicals limited to RSI + SMA where available.
> Mode: Sandbox MCP fetch. For full technicals, run fetch-market-data.sh locally.

---

## Full Quotes Table

| Ticker | Price | 1D% | Trend | RSI14 | vs SMA50 | vs SMA200 |
|--------|-------|-----|-------|-------|----------|-----------|
| SPY | 585.00 | – | ↑ UPTREND | 55 | ✅ | ✅ |
...
```

Write to: `outputs/daily/{DATE}/data/quotes-summary.md`

---

## Completeness Comparison

| Feature | yfinance (fetch-market-data.sh) | MCP (this skill) |
|---------|---------------------------------|-------------------|
| Tickers covered | ~60 (full watchlist) | ~15–25 (prioritized) |
| Price data | ✅ latest close | ✅ real-time quote |
| 1D % change | ✅ computed from OHLCV | ⚠️ limited (crypto only) |
| RSI(14) | ✅ pandas-ta | ⚠️ Alpha Vantage (if budget) |
| MACD | ✅ pandas-ta | ❌ not available |
| SMA 20/50/200 | ✅ pandas-ta | ⚠️ Alpha Vantage (if budget) |
| ATR, Bollinger | ✅ pandas-ta | ❌ not available |
| Volume ratio | ✅ computed | ❌ not available |
| Yield curve | ✅ Treasury XML API | ✅ FRED (more reliable) |
| VIX | ✅ yfinance (^VIX) | ✅ FRED (VIXCLS, may lag 1 day) |
| SKEW | ✅ yfinance (^SKEW) | ❌ not in FRED |
| Crypto | ✅ yfinance (BTC-USD, ETH-USD) | ✅ CoinGecko (with 24h change) |
| FX rates | ✅ yfinance (pair=X) | ✅ Frankfurter (real-time) |
| Commodities futures | ✅ yfinance (CL=F, GC=F) | ⚠️ ETF proxies or FRED daily |

**Bottom line**: MCP mode provides sufficient data for high-quality analysis. The main gaps are
intraday technicals (MACD, Bollinger, ATR) and volume data. These are supplementary — the agent
can still determine trend direction from price vs SMA and RSI.

---

## Fallback Hierarchy

The orchestrator Data Layer Check follows this priority:

1. **Local Python scripts** (`./scripts/fetch-market-data.sh`) — richest data, preferred
2. **MCP tool fetch** (this skill) — sandbox-compatible, covers essentials
3. **Web search** — last resort for individual data points during analysis phases
