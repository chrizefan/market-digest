#!/usr/bin/env python3
import argparse
import json, sys, re, os
from datetime import datetime
from pathlib import Path

# --- Optional heavy dependencies (graceful fallback for CI / sandbox) ---------
try:
    import yfinance as yf
    import pandas as pd
    import numpy as np
    _HAS_YFINANCE = True
except ImportError:
    _HAS_YFINANCE = False

try:
    import pandas_ta as ta  # optional but recommended — pip install pandas-ta
    _HAS_PANDAS_TA = True
except ImportError:
    _HAS_PANDAS_TA = False

try:
    from supabase import create_client
    _HAS_SUPABASE = True
except ImportError:
    _HAS_SUPABASE = False

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / "config" / "supabase.env")
    load_dotenv()  # also loads .env from cwd (lower priority)
except ImportError:
    pass

ROOT = Path(__file__).parent.parent
OUTPUT_JSON = ROOT / "frontend" / "public" / "dashboard-data.json"
DAILY_DIR = ROOT / "outputs" / "daily"
PORTFOLIO_JSON = ROOT / "config" / "portfolio.json"

# Benchmarks for comparison
BENCHMARKS = ["SPY", "QQQ", "TLT", "GLD"]


def load_portfolio_json():
    """Load config/portfolio.json and return (positions, proposed_positions, constraints, investor_currency).

    Returns authoritative portfolio data written by the PM agent.
    positions[] = user-confirmed actual holdings
    proposed_positions[] = agent-recommended target (from Phase 7D)
    investor_currency = home currency for FX impact computation (default: USD)
    """
    if not PORTFOLIO_JSON.exists():
        return [], [], {}, "USD"
    try:
        with open(PORTFOLIO_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        positions = data.get("positions", [])
        proposed = data.get("proposed_positions", [])
        constraints = data.get("constraints", {})
        investor_currency = data.get("investor_currency", "USD").upper()
        return positions, proposed, constraints, investor_currency
    except Exception as e:
        print(f"   Warning: could not read portfolio.json — {e}")
        return [], [], {}, "USD"


def load_rebalance_decision(date_str):
    """Load the rebalance-decision.md from a daily output folder and extract the proposed portfolio table."""
    rebal_path = DAILY_DIR / date_str / "rebalance-decision.md"
    if not rebal_path.exists():
        return None
    try:
        content = rebal_path.read_text(encoding="utf-8")
        # Try to extract the rebalance table rows
        # Format: | Ticker | Current% | Recommended% | Change | Action | Urgency | Rationale |
        rows = []
        for m in re.finditer(
            r"\|\s*([A-Z]{2,5})\s*\|\s*(\d+)%?\s*\|\s*(\d+)%?\s*\|\s*[^\|]+\|\s*(\w+)\s*\|",
            content
        ):
            rows.append({
                "ticker": m.group(1),
                "current_pct": int(m.group(2)),
                "recommended_pct": int(m.group(3)),
                "action": m.group(4),
            })
        return rows if rows else None
    except Exception:
        return None

def get_digest_files():
    """Find all daily digest markdown files, handling flat, v2 nested, and v3 three-tier cadence.

    For v3 folders (with _meta.json):
      - Baseline folders: use DIGEST.md directly (it IS the materialized file)
      - Delta folders: use DIGEST.md (the materialized file produced by the agent)
    Both cases produce the same result since the agent always materializes DIGEST.md.
    Legacy flat .md files and v2 nested folders without _meta.json are also supported.
    """
    files = []
    if not DAILY_DIR.exists():
        return files

    for item in DAILY_DIR.iterdir():
        if item.is_file() and item.suffix == ".md" and re.match(r"\d{4}-\d{2}-\d{2}", item.stem):
            # Legacy flat file
            files.append(item)
        elif item.is_dir():
            digest = item / "DIGEST.md"
            if digest.exists() and digest.stat().st_size > 0:
                files.append(digest)

    # Sort chronologically by date in filename/foldername
    def extract_date(p):
        m = re.search(r"(\d{4}-\d{2}-\d{2})", str(p))
        return m.group(1) if m else "1970-01-01"

    files.sort(key=extract_date)
    return files

def parse_digest(filepath):
    """Extract positioning, regime, bias, and lists from a digest markdown file."""
    content = filepath.read_text(encoding="utf-8")
    
    m_date = re.search(r"(\d{4}-\d{2}-\d{2})", str(filepath))
    date_str = m_date.group(1) if m_date else "Unknown"

    data = {
        "date": date_str,
        "positions": [],
        "regime": "Unknown",
        "regime_label": "neutral",
        "bias": "Unknown",
        "regime_summary": "",
        "actionable": [],
        "risks": [],
        "theses": [],
    }

    # Extract Target Allocation — supports both bullet and table formats
    # Format A: bullet list  - **IAU** (Gold): 20% — rationale
    alloc_pattern = r"-\s*\*\*([A-Z]+)\*\*(?:\s*\((.*?)\))?:\s*(\d+)%(?:\s*(?:—|-)\s*(.*))?"
    for match in re.finditer(alloc_pattern, content):
        ticker = match.group(1)
        name = (match.group(2) or ticker).strip()
        weight = float(match.group(3))
        rationale = (match.group(4) or "").strip()
        data["positions"].append({
            "ticker": ticker,
            "name": name.title() if ticker == name else name,
            "weight": weight,
            "rationale": rationale
        })

    # Format B: markdown table  | BIL | 32% | Stable | HOLD | rationale |
    if not data["positions"]:
        portfolio_match = re.search(r"## Portfolio Positioning", content)
        if portfolio_match:
            section = content[portfolio_match.end():]
            next_h2 = re.search(r"\n## ", section)
            if next_h2:
                section = section[:next_h2.start()]
            # Parse table rows: | TICKER | NN% | ... | action | rationale |
            table_pat = r"^\|\s*([A-Z]{2,5})\s*\|\s*(\d+)%?\s*\|(.+)\|"
            for m in re.finditer(table_pat, section, re.MULTILINE):
                ticker = m.group(1)
                weight = float(m.group(2))
                cells = [c.strip() for c in m.group(3).split("|")]
                # cells layout varies — last is rationale, second-to-last is action
                action = cells[-2] if len(cells) >= 2 else ""
                rationale = cells[-1] if cells else ""
                data["positions"].append({
                    "ticker": ticker,
                    "name": ticker,
                    "weight": weight,
                    "action": action,
                    "rationale": rationale,
                })

    # Extract Regime & Bias
    regime_match = re.search(r"\*\*Overall Bias\*\*:\s*([^\n]+)", content)
    if regime_match:
        full_bias = regime_match.group(1).strip()
        # Parse out pure bias if separated by dash (e.g. "TRANSITIONAL — Inflationary")
        data["bias"] = full_bias.split("—")[0].strip() if "—" in full_bias else full_bias
        data["regime"] = full_bias
        
        # Derive regime_label for frontend color coding
        bias_lower = data["bias"].lower()
        if any(w in bias_lower for w in ["bullish", "risk-on"]):
            data["regime_label"] = "bullish"
        elif any(w in bias_lower for w in ["bearish", "risk-off"]):
            data["regime_label"] = "bearish"
        elif any(w in bias_lower for w in ["caution", "mixed", "conflicted", "transitional"]):
            data["regime_label"] = "caution"
        else:
            data["regime_label"] = "neutral"
        
        # Grab next paragraph
        para = content[regime_match.end():].lstrip().split("\n\n")[0]
        data["regime_summary"] = para.strip()

    # Generic list extractor
    def extract_list_under_heading(heading_re):
        head_match = re.search(heading_re, content)
        if not head_match: return []
        sub_content = content[head_match.end():].lstrip()
        # Read lines until next H2 (## )
        lines = []
        for line in sub_content.splitlines():
            if line.startswith("## "): break
            if line.strip().startswith("- ") or re.match(r"\d+\.\s+", line.strip()):
                lines.append(line.strip())
        return [re.sub(r"^(-\s*|\d+\.\s*)", "", l) for l in lines] # strip bullet prefixes

    data["actionable"] = extract_list_under_heading(r"## (?:⚡\s*)?Actionable Summary")
    data["risks"] = extract_list_under_heading(r"## (?:🚨\s*)?Risk Radar")

    # Extract Thesis Tracker table
    thesis_match = re.search(r"## (?:📋\s*)?Thesis Tracker", content)
    if thesis_match:
        table_content = content[thesis_match.end():]
        # Stop at next heading
        next_heading = re.search(r"\n## ", table_content)
        if next_heading:
            table_content = table_content[:next_heading.start()]
        # Parse markdown table rows (skip header and separator)
        rows = [l.strip() for l in table_content.splitlines() if l.strip().startswith("|") and not re.match(r"^\|[-\s|]+\|$", l.strip())]
        if len(rows) >= 2:
            rows = rows[1:]  # skip header row
        for row in rows:
            cells = [c.strip() for c in row.split("|")[1:-1]]
            if len(cells) >= 5:
                data["theses"].append({
                    "id": cells[0],
                    "name": cells[1],
                    "vehicle": cells[2],
                    "invalidation": cells[3],
                    "status": cells[4],
                    "notes": cells[5] if len(cells) > 5 else "",
                })

    return data


def _load_prefetched_prices(root):
    """Load latest pre-fetched quotes.json as a {ticker: {price, rsi14, ...}} dict.

    Used as fallback when yfinance is unavailable (CI/sandbox).
    """
    daily_dir = root / "outputs" / "daily"
    if not daily_dir.exists():
        return {}
    # Find the newest day folder with data/quotes.json
    for day_dir in sorted(daily_dir.iterdir(), reverse=True):
        quotes_file = day_dir / "data" / "quotes.json"
        if quotes_file.exists():
            try:
                raw = json.loads(quotes_file.read_text(encoding="utf-8"))
                snapshots = raw.get("snapshots", [])
                return {s["ticker"]: s for s in snapshots if "error" not in s}
            except Exception:
                continue
    return {}


def fetch_prices(tickers, start_date, price_field="Close"):
    """Fetch daily prices from start_date to today (default: Close).

    For simulation we use Open (market-open execution); for display / FX we use Close.
    """
    ohlc = fetch_ohlc_matrix(tickers, start_date)
    return ohlc.get(price_field, pd.DataFrame())


def fetch_ohlc_matrix(tickers, start_date):
    """Return dict with 'Open', 'Close' DataFrames (columns=tickers) and 'trading_days' set.

    Prices are forward-filled over the full calendar date range so every day has
    an entry for the portfolio NAV chart.  'trading_days' is the set of dates
    when exchanges were actually open (from yfinance); use it to filter returns
    when computing annualised stats (Sharpe, alpha, volatility).
    """
    empty = {"Open": pd.DataFrame(), "Close": pd.DataFrame(), "trading_days": set()}
    if not _HAS_YFINANCE or not tickers:
        return empty

    start_dt = pd.to_datetime(start_date) - pd.Timedelta(days=5)
    tickers = list(tickers)

    try:
        raw = yf.download(
            tickers, start=start_dt.strftime("%Y-%m-%d"), progress=False, threads=True
        )
    except Exception as e:
        print(f"  Warning: OHLC fetch failed — {e}")
        return empty

    if raw is None or (hasattr(raw, "empty") and raw.empty):
        return empty

    # Capture the raw yfinance trading-day index before any reindexing.
    trading_days: set = set(raw.index.normalize())

    def _frame_for(field: str) -> pd.DataFrame:
        try:
            part = raw[field]
        except (KeyError, TypeError):
            return pd.DataFrame()
        if isinstance(part, pd.Series):
            frame = part.to_frame(name=tickers[0]).ffill()
        else:
            frame = part.ffill()
        # Expand to full calendar range: every calendar day carries the last known price.
        # Non-trading days get the same price as the prior trading close (return = 0).
        if not frame.empty:
            full_range = pd.date_range(frame.index.min(), frame.index.max(), freq="D")
            frame = frame.reindex(full_range).ffill()
        return frame

    return {"Open": _frame_for("Open"), "Close": _frame_for("Close"), "trading_days": trading_days}

def compute_technicals_for_tickers(tickers: list) -> dict:
    """Compute RSI, MACD signal, SMA50/200 position, ATR for a list of tickers.

    Returns dict: ticker → technicals dict.
    Silently skips if pandas-ta is not installed.
    """
    if not _HAS_PANDAS_TA or not _HAS_YFINANCE or not tickers:
        return {}

    result = {}
    try:
        raw = yf.download(tickers, period="6mo", progress=False, threads=True)["Close"]
        if raw is None or (hasattr(raw, "empty") and raw.empty):
            return {}
        if len(tickers) == 1:
            raw = raw.to_frame(name=tickers[0])
    except Exception as e:
        print(f"   Warning: technicals download failed — {e}")
        return {}

    for ticker in tickers:
        try:
            if ticker not in raw.columns:
                continue
            series = raw[ticker].dropna()
            if len(series) < 20:
                continue
            # Reconstruct minimal OHLCV (only Close needed for these indicators)
            df = pd.DataFrame({"close": series})
            df.ta.rsi(length=14, append=True)
            df.ta.macd(fast=12, slow=26, signal=9, append=True)
            df.ta.sma(length=50, append=True)
            df.ta.sma(length=200, append=True)
            df.ta.atr(length=14, append=True)  # needs OHLC — will be None/NaN without it

            row = df.iloc[-1]
            prev = df.iloc[-2] if len(df) >= 2 else row

            def sf(val, d=2):
                try:
                    f = float(val)
                    return round(f, d) if pd.notna(f) and np.isfinite(f) else None
                except (TypeError, ValueError):
                    return None

            price = sf(series.iloc[-1])
            sma50 = sf(row.get("SMA_50"))
            sma200 = sf(row.get("SMA_200"))
            rsi = sf(row.get("RSI_14"))
            macd_hist = sf(row.get("MACDh_12_26_9"))
            prev_macd_hist = sf(prev.get("MACDh_12_26_9"))

            if macd_hist is not None and prev_macd_hist is not None:
                if macd_hist > 0 and prev_macd_hist <= 0:
                    macd_signal = "BULLISH_CROSS"
                elif macd_hist < 0 and prev_macd_hist >= 0:
                    macd_signal = "BEARISH_CROSS"
                elif macd_hist > 0:
                    macd_signal = "BULLISH"
                else:
                    macd_signal = "BEARISH"
            else:
                macd_signal = None

            if price and sma50 and sma200:
                if price > sma50 > sma200:
                    trend = "UPTREND"
                elif price < sma50 < sma200:
                    trend = "DOWNTREND"
                else:
                    trend = "NEUTRAL"
            else:
                trend = None

            result[ticker] = {
                "rsi14": rsi,
                "macd_signal": macd_signal,
                "macd_hist": macd_hist,
                "sma50": sma50,
                "sma200": sma200,
                "above_sma50": bool(price > sma50) if price and sma50 else None,
                "above_sma200": bool(price > sma200) if price and sma200 else None,
                "trend": trend,
            }
        except Exception as e:
            pass  # silently skip individual ticker failures

    return result


def simulate_portfolio(digests):
    """
    Simulate portfolio NAV and cash over time based on daily digests.
    Assumes base 100 starting on the first digest's date.
    Requires yfinance + pandas.

    Execution model (simulation): rebalances take effect at the **start** of the
    session; daily returns are **open-to-open** Mon–Fri using OHLC Open. Marks for
    display (current_price) use Close on the last bar.
    """
    if not digests or not _HAS_YFINANCE:
        return [], [], {}, digests[-1] if digests else None

    # Gather all unique tickers excluding CASH
    all_tickers = set()
    for d in digests:
        for p in d["positions"]:
            if p["ticker"] != "CASH":
                all_tickers.add(p["ticker"])
    
    start_date = digests[0]["date"]
    benchmarks_list = BENCHMARKS
    all_symbols = list(all_tickers.union(set(benchmarks_list)))
    
    print(f"   Fetching OHLC for {len(all_symbols)} tickers from {start_date} (NAV: open-to-open)...")
    ohlc = fetch_ohlc_matrix(all_symbols, start_date)
    opens = ohlc.get("Open", pd.DataFrame())
    closes = ohlc.get("Close", pd.DataFrame())
    trading_days: set = ohlc.get("trading_days", set())

    if opens.empty:
        return [], [], {}, digests[-1] if digests else None

    prices = opens  # simulation path uses Open

    # Build sequence of business days from start_date to last available price
    if start_date not in prices.index:
        # Find nearest date
        idx = prices.index.get_indexer([pd.to_datetime(start_date)], method='ffill')[0]
        if idx == -1: idx = 0
        actual_start = prices.index[idx]
    else:
        actual_start = pd.to_datetime(start_date)
        
    dates = prices.index[prices.index >= actual_start]
    
    # State tracking
    nav = 100.0
    current_weights = {}
    cash_pct = 1.0
    active_digest = None
    portfolio_history = []
    
    digests.sort(key=lambda d: d["date"])
    digest_idx = 0
    
    for i, date in enumerate(dates):
        # Apply any digest published on or prior to this session open (rebalance at open)
        while digest_idx < len(digests) and pd.to_datetime(digests[digest_idx]["date"]) <= date:
            active_digest = digests[digest_idx]
            digest_idx += 1
            new_weights = {}
            for p in active_digest["positions"]:
                w = p["weight"] / 100.0
                new_weights[p["ticker"]] = w
            current_weights = new_weights
            cash_pct = current_weights.get("CASH", 0.0)

        if i > 0:
            prev_date = dates[i - 1]
            daily_return = 0.0
            for ticker, weight in current_weights.items():
                if ticker == "CASH":
                    continue
                try:
                    p0 = prices.loc[prev_date, ticker]
                    p1 = prices.loc[date, ticker]
                    if pd.notna(p0) and pd.notna(p1) and p0 > 0:
                        ret = (p1 - p0) / p0
                        daily_return += weight * ret
                except KeyError:
                    pass
            nav = nav * (1.0 + daily_return)

        portfolio_history.append({
            "date": date.strftime("%Y-%m-%d"),
            "nav": float(nav),
            # Tag whether this is a real trading day so callers can filter for
            # annualised stats (Sharpe, alpha) without inflating denominator
            # with zero-return weekend/holiday observations.
            "is_trading_day": date.normalize() in trading_days,
        })

    # If there are digests published on a weekend/holiday AFTER the last trading day, apply the newest one
    while digest_idx < len(digests):
        active_digest = digests[digest_idx]
        digest_idx += 1
        new_weights = {}
        for p in active_digest["positions"]:
            w = p["weight"] / 100.0
            new_weights[p["ticker"]] = w
        current_weights = new_weights
        cash_pct = current_weights.get("CASH", 0.0)
        
    # For a true simulator we'd track exact entry date/price for each lot;
    # marks use last Close; returns use Open (see docstring).
    active_positions = []
    if active_digest:
        last_date = dates[-1]

        # Collect tickers for bulk technicals fetch
        position_tickers = [p["ticker"] for p in active_digest["positions"] if p["ticker"] != "CASH"]
        technicals_map = compute_technicals_for_tickers(position_tickers)
        if technicals_map:
            print(f"   Technicals computed for {len(technicals_map)} positions via pandas-ta")

        for p in active_digest["positions"]:
            t = p["ticker"]
            if t == "CASH":
                continue
            try:
                if float(p.get("weight", 0) or 0) == 0:
                    continue
            except (TypeError, ValueError):
                pass
            cp = None
            if not closes.empty and t in closes.columns:
                cp = float(closes.loc[last_date, t])
            elif t in prices.columns:
                cp = float(prices.loc[last_date, t])
            
            ti_data = {}
            try:
                tkr = yf.Ticker(t)
                info = tkr.info
                ti_data = {
                    "beta": info.get("beta"),
                    "trailingPE": info.get("trailingPE"),
                    "marketCap": info.get("marketCap"),
                    "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
                    "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
                    "dividendYield": info.get("dividendYield"),
                    "sector": info.get("sector"),
                    "industry": info.get("industry")
                }
            except Exception:
                pass

            # Merge pandas-ta technicals into the stats dict
            tech = technicals_map.get(t, {})
            ti_data.update(tech)

            active_positions.append({
                "ticker": t,
                "name": p["name"],
                "type": "LONG",
                "weight_actual": float(p["weight"]),
                "current_price": cp,
                "rationale": p["rationale"],
                "stats": ti_data
            })

    # Prepare benchmark histories
    b_hist = {}
    for b in benchmarks_list:
        if b in prices.columns:
            # Dropna for safety
            b_series = prices[b].dropna()
            # Start tracking from actual_start
            b_series = b_series[b_series.index >= actual_start]
            if not b_series.empty:
                b_hist[b] = {
                    "current": float(b_series.iloc[-1]),
                    "history": [{"date": d.strftime("%Y-%m-%d"), "price": float(p)} for d, p in b_series.items()]
                }
                
    return portfolio_history, active_positions, b_hist, active_digest

def compute_fx_impact(pj_positions, investor_currency):
    """Compute unrealized P&L (USD) and FX-adjusted returns (investor_currency) per position.

    Entry price source priority:
      1. entry_price_usd field in portfolio.json (exact trade fill)
      2. yfinance historical close for entry_date (best-effort approximation)
    FX rate source priority:
      1. entry_usdcad field in portfolio.json
      2. yfinance USDCAD=X historical close for entry_date
    Returns list of per-position dicts, or empty list if investor_currency == USD or no positions.
    """
    if not pj_positions or investor_currency == "USD" or not _HAS_YFINANCE:
        return []

    fx_ticker = f"USD{investor_currency}=X"  # e.g. USDCAD=X

    tickers = [p["ticker"] for p in pj_positions if p.get("ticker") and p["ticker"] != "CASH"]
    if not tickers:
        return []

    entry_dates = [p.get("entry_date") for p in pj_positions if p.get("entry_date")]
    start_date = min(entry_dates) if entry_dates else datetime.now().strftime("%Y-%m-%d")

    fetch_list = tickers + [fx_ticker]
    print(f"   FX Impact: fetching {len(fetch_list)} tickers (incl. {fx_ticker}) from {start_date}...")
    prices = fetch_prices(fetch_list, start_date)
    if prices.empty:
        print(f"   Warning: FX impact fetch returned no data.")
        return []

    latest_date = prices.index[-1]

    # Current FX rate
    current_usdx = None
    if fx_ticker in prices.columns:
        s = prices[fx_ticker].dropna()
        if not s.empty:
            current_usdx = float(s.iloc[-1])

    results = []
    for p in pj_positions:
        ticker = p.get("ticker")
        if not ticker or ticker == "CASH":
            continue

        entry_date_str = p.get("entry_date")

        # --- Entry price (USD) ---
        entry_price = p.get("entry_price_usd")
        entry_price_source = "portfolio.json"
        if not entry_price and entry_date_str and ticker in prices.columns:
            try:
                entry_dt = pd.to_datetime(entry_date_str)
                idx = prices.index.get_indexer([entry_dt], method="ffill")[0]
                if idx >= 0:
                    v = prices.iloc[idx][ticker]
                    if pd.notna(v):
                        entry_price = float(v)
                        entry_price_source = f"yfinance close {prices.index[idx].strftime('%Y-%m-%d')}"
            except Exception:
                pass

        # --- Current price (USD) ---
        current_price = None
        if ticker in prices.columns:
            try:
                v = prices.loc[latest_date, ticker]
                if pd.notna(v):
                    current_price = float(v)
            except Exception:
                pass

        usd_return_pct = None
        if entry_price and current_price and entry_price > 0:
            usd_return_pct = round((current_price - entry_price) / entry_price * 100, 2)

        # --- FX rate ---
        entry_usdx = p.get("entry_usdcad") if investor_currency == "CAD" else None
        entry_usdx_source = "portfolio.json"
        if not entry_usdx and entry_date_str and fx_ticker in prices.columns:
            try:
                entry_dt = pd.to_datetime(entry_date_str)
                idx = prices.index.get_indexer([entry_dt], method="ffill")[0]
                if idx >= 0:
                    v = prices.iloc[idx][fx_ticker]
                    if pd.notna(v):
                        entry_usdx = float(v)
                        entry_usdx_source = f"yfinance close {prices.index[idx].strftime('%Y-%m-%d')}"
            except Exception:
                pass

        fx_return_pct = None
        adj_return_pct = None
        if entry_usdx and current_usdx and entry_usdx > 0:
            fx_return_pct = round((current_usdx - entry_usdx) / entry_usdx * 100, 2)
        if usd_return_pct is not None and fx_return_pct is not None:
            # Exact: (1+r_usd)*(1+r_fx) - 1
            adj_return_pct = round(((1 + usd_return_pct / 100) * (1 + fx_return_pct / 100) - 1) * 100, 2)

        results.append({
            "ticker": ticker,
            "weight_pct": p.get("weight_pct", 0),
            "entry_price_usd": round(entry_price, 4) if entry_price else None,
            "entry_price_source": entry_price_source,
            "current_price_usd": round(current_price, 4) if current_price else None,
            "usd_return_pct": usd_return_pct,
            f"entry_{fx_ticker.replace('=X','').lower()}": round(float(entry_usdx), 4) if entry_usdx else None,
            f"current_{fx_ticker.replace('=X','').lower()}": round(float(current_usdx), 4) if current_usdx else None,
            "fx_return_pct": fx_return_pct,
            f"{investor_currency.lower()}_return_pct": adj_return_pct,
        })

    # Compute portfolio-level weighted averages (weight-averaged, exclude nulls)
    def weighted_avg(field):
        total_w, total_v = 0.0, 0.0
        for r in results:
            v = r.get(field)
            w = r.get("weight_pct", 0)
            if v is not None and w:
                total_v += v * w
                total_w += w
        return round(total_v / total_w, 2) if total_w > 0 else None

    portfolio_summary = {
        "investor_currency": investor_currency,
        "fx_pair": fx_ticker,
        "current_usdx": round(current_usdx, 4) if current_usdx else None,
        "weighted_usd_return_pct": weighted_avg("usd_return_pct"),
        "weighted_fx_return_pct": weighted_avg("fx_return_pct"),
        f"weighted_{investor_currency.lower()}_return_pct": weighted_avg(f"{investor_currency.lower()}_return_pct"),
        "positions": results,
    }
    return portfolio_summary


def _normalize_thesis_status(raw):
    """Normalize free-form thesis status (with emoji) to DB enum value."""
    if not raw:
        return None
    s = raw.lower().replace("\u2705", "").replace("\u26a0\ufe0f", "").replace("\u274c", "").strip()
    if "challenged" in s:
        return "CHALLENGED"
    if "confirmed" in s or "active" in s:
        return "ACTIVE"
    if "monitoring" in s:
        return "MONITORING"
    if "invalidated" in s:
        return "INVALIDATED"
    if "closed" in s:
        return "CLOSED"
    if "paused" in s or "hold" in s:
        return "PAUSED"
    if "new" in s:
        return "NEW"
    return "ACTIVE"  # safe fallback


# --- File classification for timeline metadata ---

FILE_CLASSIFICATION = {
    "DIGEST.md":                {"phase": 7, "category": "synthesis",     "segment": "digest"},
    "DIGEST-DELTA.md":          {"phase": 7, "category": "synthesis",     "segment": "digest-delta"},
    "alt-data.md":              {"phase": 1, "category": "alt-data",      "segment": "alt-data"},
    "institutional.md":         {"phase": 2, "category": "institutional", "segment": "institutional"},
    "macro.md":                 {"phase": 3, "category": "macro",         "segment": "macro"},
    "bonds.md":                 {"phase": 4, "category": "asset-class",   "segment": "bonds"},
    "commodities.md":           {"phase": 4, "category": "asset-class",   "segment": "commodities"},
    "forex.md":                 {"phase": 4, "category": "asset-class",   "segment": "forex"},
    "crypto.md":                {"phase": 4, "category": "asset-class",   "segment": "crypto"},
    "international.md":         {"phase": 4, "category": "asset-class",   "segment": "international"},
    "equities.md":              {"phase": 5, "category": "equity",        "segment": "us-equities"},
    "us-equities.md":           {"phase": 5, "category": "equity",        "segment": "us-equities"},
    "portfolio-recommended.md": {"phase": 7, "category": "portfolio",     "segment": "recommendation"},
    "rebalance-decision.md":    {"phase": 7, "category": "portfolio",     "segment": "rebalance"},
}

SECTOR_NAMES = {
    "technology":       "Technology",
    "healthcare":       "Healthcare",
    "energy":           "Energy",
    "financials":       "Financials",
    "consumer-staples": "Consumer Staples",
    "consumer-disc":    "Consumer Discretionary",
    "industrials":      "Industrials",
    "utilities":        "Utilities",
    "materials":        "Materials",
    "real-estate":      "Real Estate",
    "comms":            "Communications",
}


def _read_md(filepath):
    """Read a markdown file, returning content or error placeholder."""
    try:
        return filepath.read_text(encoding="utf-8")
    except Exception:
        return "_(Error reading file)_"

def _read_json(filepath):
    """Read a JSON file and return parsed object or None."""
    try:
        return json.loads(filepath.read_text(encoding="utf-8"))
    except Exception:
        return None

def _render_markdown_from_payload(payload: dict) -> str:
    """Deterministic markdown view from structured payload (best-effort)."""
    doc_type = str(payload.get("doc_type") or "")
    date = str(payload.get("date") or "")
    body = payload.get("body") if isinstance(payload.get("body"), dict) else {}

    if doc_type == "deep_dive":
        md = body.get("markdown") if isinstance(body, dict) else None
        if isinstance(md, str) and md.strip():
            return md.strip() + "\n"
        title = payload.get("title") or "Deep Dive"
        return f"# {title}{(' — ' + date) if date else ''}\n\n_No content available._\n"

    if doc_type == "weekly_digest":
        wk = payload.get("week_label") or ""
        legacy = body.get("full_document_markdown") if isinstance(body, dict) else None
        if isinstance(legacy, str) and legacy.strip():
            return legacy.strip() + "\n"
        ex = str(body.get("executive_summary") or "").strip()
        kt = str(body.get("key_takeaway") or "").strip()
        out = [f"# WEEKLY DIGEST — {wk or date}".strip(), "", "## Executive Summary", ex, "", "## Key Takeaway", kt, ""]
        return "\n".join([x for x in out if x is not None]).strip() + "\n"

    if doc_type == "monthly_digest":
        ml = payload.get("month_label") or ""
        mir = str(body.get("month_in_review") or "").strip()
        kl = str(body.get("key_learning") or "").strip()
        out = [f"# MONTHLY DIGEST — {ml or date}".strip(), "", "## Month in Review", mir, "", "## Key Learning", kl, ""]
        return "\n".join([x for x in out if x is not None]).strip() + "\n"

    if doc_type == "rebalance_decision":
        notes = str(body.get("pm_notes") or "").strip()
        out = [f"# REBALANCE DECISION — {date}".strip(), "", "## PM Notes", notes, ""]
        return "\n".join(out).strip() + "\n"

    if doc_type == "evolution_quality_log":
        b = body if isinstance(body, dict) else {}
        title = str(payload.get("title") or "Quality log")
        lines = [
            f"# {title}",
            f"**Date:** {date}",
            "",
            "## Summary",
            str(b.get("summary") or ""),
            "",
            "## Triage",
            str(b.get("triage_notes") or ""),
            "",
            f"**Rating:** {b.get('phase_rating') or '—'}",
            "",
            "## Strengths",
            str(b.get("strengths") or ""),
            "",
            "## Weaknesses",
            str(b.get("weaknesses") or ""),
            "",
        ]
        return "\n".join(lines).strip() + "\n"

    if doc_type == "evolution_sources":
        b = body if isinstance(body, dict) else {}
        title = str(payload.get("title") or "Sources")
        parts = [f"# {title}", f"**Date:** {date}", "", "## Notes", str(b.get("notes") or ""), "", "## Ratings"]
        for row in b.get("source_ratings") or []:
            if isinstance(row, dict):
                parts.append(f"- **{row.get('name')}** ({row.get('reliability')}): {row.get('notes')}")
        return "\n".join(parts).strip() + "\n"

    if doc_type == "evolution_proposals":
        b = body if isinstance(body, dict) else {}
        title = str(payload.get("title") or "Proposals")
        parts = [f"# {title}", f"**Date:** {date}", ""]
        for prop in b.get("proposals") or []:
            if not isinstance(prop, dict):
                continue
            parts.extend(
                [
                    f"### {prop.get('id')}: {prop.get('title')}",
                    f"**Priority:** {prop.get('priority')} | **Status:** {prop.get('status', 'open')}",
                    "",
                    f"**Problem:** {prop.get('problem')}",
                    "",
                    f"**Proposal:** {prop.get('proposal')}",
                    "",
                ]
            )
        return "\n".join(parts).strip() + "\n"

    # Default: show payload for audit
    try:
        raw = json.dumps(payload, indent=2, ensure_ascii=False)
    except Exception:
        raw = str(payload)
    return f"# DOCUMENT — {doc_type or date}\n\n```json\n{raw}\n```\n"

def _payload_from_markdown(doc_type: str, date_str: str, title: str, markdown: str, extra_meta: dict | None = None) -> dict:
    meta = extra_meta if isinstance(extra_meta, dict) else {}
    if doc_type == "deep_dive":
        # Lightweight but consistent envelope for UI surfacing.
        headings = []
        for line in (markdown or "").splitlines():
            m = re.match(r"^(#{1,6})\\s+(.+)$", line.strip())
            if m:
                headings.append({"heading": m.group(2).strip(), "level": len(m.group(1))})
        return {
            "schema_version": "1.0",
            "doc_type": "deep_dive",
            "date": date_str,
            "title": title,
            "meta": meta,
            "body": {"markdown": markdown or "", "sections": headings},
        }
    return {
        "schema_version": "1.0",
        "doc_type": doc_type or "markdown_legacy",
        "date": date_str,
        "title": title,
        "meta": meta,
        "body": {"markdown": markdown or ""},
    }


def _detect_run_type(day_dir):
    """Read _meta.json from a daily folder to determine baseline/delta."""
    meta = day_dir / "_meta.json"
    if meta.exists():
        try:
            with open(meta, "r", encoding="utf-8") as f:
                return json.load(f).get("type", "baseline")
        except Exception:
            pass
    return "baseline"


def _logical_document_key(repo_relative: str) -> str:
    """Stable document_key for Supabase (matches migration 009); not a filesystem path."""
    p = repo_relative.replace("\\", "/")
    p = re.sub(r"^.*outputs/daily/\d{4}-\d{2}-\d{2}/", "", p)
    if p == "DIGEST.md":
        return "digest"
    if p == "DIGEST-DELTA.md":
        return "digest-delta"
    p2 = re.sub(r"^.*outputs/weekly/", "weekly/", p)
    if p2 != p:
        return p2
    p3 = re.sub(r"^.*outputs/monthly/", "monthly/", p)
    if p3 != p:
        return p3
    p4 = re.sub(r"^.*outputs/deep-dives/", "deep-dives/", p)
    if p4 != p:
        return p4
    p5 = re.sub(r"^.*outputs/evolution/", "evolution/", p)
    if p5 != p:
        return p5.replace("\\", "/")
    return p.split("/")[-1] if p else "unknown"


def load_all_markdowns(root):
    """Scan outputs for the timeline view.

    Returns enriched doc objects with phase, category, segment, sector, and runType metadata.
    """
    docs = []

    def _doc_type_label(payload_doc_type: str | None, fallback: str) -> str:
        """
        documents.doc_type is constrained by chk_documents_doc_type.
        Keep labels within the allowed set to avoid batch upsert failure.
        """
        dt = str(payload_doc_type or "").strip()
        if dt == "weekly_digest":
            return "Weekly Rollup"
        if dt == "monthly_digest":
            return "Monthly Summary"
        if dt == "deep_dive":
            return "Deep Dive"
        if dt == "delta_request":
            return "Daily Delta"
        return fallback

    def _category_label(payload_doc_type: str | None, fallback: str) -> str:
        """
        documents.category is constrained by chk_documents_category.
        """
        dt = str(payload_doc_type or "").strip()
        if dt == "rebalance_decision":
            return "portfolio"
        if dt == "portfolio_recommendation":
            return "portfolio"
        if dt == "deliberation_transcript":
            return "portfolio"
        if dt == "asset_recommendation":
            return "portfolio"
        if dt == "delta_request":
            return "delta"
        if dt.startswith("evolution_"):
            return "output"
        return fallback

    # --- 1. Daily output folders (baseline + delta files) ---
    daily_path = root / "outputs" / "daily"
    if daily_path.exists():
        for day_dir in sorted(daily_path.iterdir()):
            if not day_dir.is_dir():
                continue
            day_date = day_dir.name
            if not re.match(r"\d{4}-\d{2}-\d{2}", day_date):
                continue

            run_type = _detect_run_type(day_dir)

            # JSON artifacts (new canonical for recurring sub-documents)
            for jf in sorted(day_dir.glob("*.json")):
                if jf.name.startswith("."):
                    continue
                payload = _read_json(jf)
                if not isinstance(payload, dict):
                    continue
                # Ignore snapshot.json here; it is stored via daily_snapshots/documents(digest)
                if jf.name == "snapshot.json":
                    continue
                # Ignore legacy meta (not a publishable research doc)
                if jf.name == "_meta.json":
                    continue
                doc_type = str(payload.get("doc_type") or "")
                file_date = str(payload.get("date") or day_date)
                payload["date"] = file_date
                rel = str(jf.relative_to(root))
                docs.append(
                    {
                        "title": str(payload.get("title") or jf.stem.replace("-", " ").title()),
                        "type": _doc_type_label(doc_type, "Daily Digest"),
                        "date": file_date,
                        "path": rel,
                        "document_key": _logical_document_key(rel),
                        "content": _render_markdown_from_payload(payload),
                        "payload": payload,
                        "phase": None,
                        "category": _category_label(doc_type, "output"),
                        "segment": jf.stem,
                        "sector": None,
                        "runType": run_type,
                    }
                )

            # Top-level .md files in the day folder
            for md_file in sorted(day_dir.glob("*.md")):
                if md_file.name.startswith("."):
                    continue
                content = _read_md(md_file)
                cls = FILE_CLASSIFICATION.get(md_file.name, {})
                segment_name = cls.get("segment", md_file.stem)
                is_delta_file = md_file.name == "DIGEST-DELTA.md"
                rel = str(md_file.relative_to(root))
                docs.append({
                    "title": segment_name.replace("-", " ").title(),
                    "type": "Daily Delta" if is_delta_file else "Daily Digest",
                    "date": day_date,
                    "path": rel,
                    "document_key": _logical_document_key(rel),
                    "content": content,
                    "phase": cls.get("phase"),
                    "category": cls.get("category", "output"),
                    "segment": segment_name,
                    "sector": None,
                    "runType": run_type,
                })

            # sectors/*.md (baseline sector files)
            sectors_dir = day_dir / "sectors"
            if sectors_dir.exists():
                # JSON-first sector reports
                for jf in sorted(sectors_dir.glob("*.json")):
                    if jf.name.startswith("."):
                        continue
                    payload = _read_json(jf)
                    if not isinstance(payload, dict):
                        continue
                    file_date = str(payload.get("date") or day_date)
                    payload["date"] = file_date
                    stem = jf.stem.replace(".delta", "")
                    sector_label = SECTOR_NAMES.get(stem, stem.replace("-", " ").title())
                    srel = str(jf.relative_to(root))
                    docs.append(
                        {
                            "title": f"{sector_label} (JSON)",
                            "type": "sector_report",
                            "date": file_date,
                            "path": srel,
                            "document_key": _logical_document_key(srel),
                            "content": _render_markdown_from_payload(payload),
                            "payload": payload,
                            "phase": 5,
                            "category": "sector",
                            "segment": stem,
                            "sector": sector_label,
                            "runType": run_type,
                        }
                    )
                for sf in sorted(sectors_dir.glob("*.md")):
                    if sf.name.startswith("."):
                        continue
                    content = _read_md(sf)
                    stem = sf.stem.replace(".delta", "")
                    is_delta = sf.name.endswith(".delta.md")
                    sector_label = SECTOR_NAMES.get(stem, stem.replace("-", " ").title())
                    srel = str(sf.relative_to(root))
                    docs.append({
                        "title": f"{sector_label}{' Delta' if is_delta else ''}",
                        "type": "Daily Delta" if is_delta else "Daily Digest",
                        "date": day_date,
                        "path": srel,
                        "document_key": _logical_document_key(srel),
                        "content": content,
                        "phase": 5,
                        "category": "sector",
                        "segment": stem,
                        "sector": sector_label,
                        "runType": run_type,
                    })

            # deltas/*.delta.md (segment-level deltas)
            deltas_dir = day_dir / "deltas"
            if deltas_dir.exists():
                for df in sorted(deltas_dir.glob("*.delta.md")):
                    content = _read_md(df)
                    segment = df.stem.replace(".delta", "")
                    cls = FILE_CLASSIFICATION.get(f"{segment}.md", {})
                    drel = str(df.relative_to(root))
                    docs.append({
                        "title": f"{segment.replace('-', ' ').title()} Delta",
                        "type": "Daily Delta",
                        "date": day_date,
                        "path": drel,
                        "document_key": _logical_document_key(drel),
                        "content": content,
                        "phase": cls.get("phase"),
                        "category": cls.get("category", "delta"),
                        "segment": segment,
                        "sector": None,
                        "runType": "delta",
                    })

            # positions/*.md (asset analyst outputs)
            positions_dir = day_dir / "positions"
            if positions_dir.exists():
                for pf in sorted(positions_dir.glob("*.md")):
                    content = _read_md(pf)
                    ticker = pf.stem.upper()
                    prel = str(pf.relative_to(root))
                    docs.append({
                        "title": f"{ticker} Position Analysis",
                        "type": "Daily Digest",
                        "date": day_date,
                        "path": prel,
                        "document_key": _logical_document_key(prel),
                        "content": content,
                        "phase": 7,
                        "category": "portfolio",
                        "segment": ticker.lower(),
                        "sector": None,
                        "runType": run_type,
                    })

    # --- 2. Weekly / Monthly / Deep-dive rollups ---
    # Weekly / Monthly: JSON-only artifacts (markdown is derived)
    for rel_path, doc_type, label, category in [
        ("outputs/weekly",  "weekly_digest",  "Weekly Rollup",   "rollup"),
        ("outputs/monthly", "monthly_digest", "Monthly Summary", "rollup"),
    ]:
        path = root / rel_path
        if not path.exists():
            continue
        for jf in sorted(path.glob("*.json")):
            if jf.name.startswith("."):
                continue
            payload = _read_json(jf)
            if not isinstance(payload, dict):
                continue
            file_date = str(payload.get("date") or "")
            if not file_date:
                m = re.match(r"(\d{4}-\d{2}-\d{2})", jf.stem)
                file_date = m.group(1) if m else datetime.fromtimestamp(os.path.getmtime(jf)).strftime("%Y-%m-%d")
                payload["date"] = file_date
            title = str(payload.get("title") or jf.stem.replace("-", " ").title())
            content = _render_markdown_from_payload(payload)
            wrel = str(jf.relative_to(root))
            docs.append({
                "title": title,
                "type": _doc_type_label(str(payload.get("doc_type") or ""), label),
                "date": file_date,
                "path": wrel,
                "document_key": _logical_document_key(wrel),
                "content": content,
                "payload": payload,
                "phase": None,
                "category": category,
                "segment": jf.stem,
                "sector": None,
                "runType": None,
            })

    # Deep dives: JSON-first (schema: templates/schemas/deep-dive.schema.json)
    deep_path = root / "outputs" / "deep-dives"
    if deep_path.exists():
        for jf in sorted(deep_path.glob("*.json")):
            if jf.name.startswith("."):
                continue
            payload = _read_json(jf)
            if not isinstance(payload, dict):
                continue
            if str(payload.get("doc_type") or "") != "deep_dive":
                continue
            file_date = str(payload.get("date") or "")
            if not file_date:
                m = re.match(r"(\d{4}-\d{2}-\d{2})", jf.stem)
                file_date = m.group(1) if m else datetime.fromtimestamp(os.path.getmtime(jf)).strftime("%Y-%m-%d")
                payload["date"] = file_date
            title = str(payload.get("title") or jf.stem.replace("-", " ").title())
            content = _render_markdown_from_payload(payload)
            wrel = str(jf.relative_to(root))
            docs.append({
                "title": title,
                "type": _doc_type_label("deep_dive", "Deep Dive"),
                "date": file_date,
                "path": wrel,
                "document_key": _logical_document_key(wrel),
                "content": content,
                "payload": payload,
                "phase": None,
                "category": "deep-dive",
                "segment": jf.stem.replace(".json", ""),
                "sector": None,
                "runType": None,
            })

    # --- 3. Evolution post-mortem (outputs/evolution/YYYY-MM-DD/*.json) ---
    evo_root = root / "outputs" / "evolution"
    if evo_root.exists():
        for day_dir in sorted(evo_root.iterdir()):
            if not day_dir.is_dir():
                continue
            day_date = day_dir.name
            if not re.match(r"\d{4}-\d{2}-\d{2}", day_date):
                continue
            for jf in sorted(day_dir.glob("*.json")):
                if jf.name.startswith("."):
                    continue
                payload = _read_json(jf)
                if not isinstance(payload, dict):
                    continue
                doc_type = str(payload.get("doc_type") or "")
                if doc_type not in ("evolution_quality_log", "evolution_sources", "evolution_proposals"):
                    continue
                file_date = str(payload.get("date") or day_date)
                payload["date"] = file_date
                title = str(payload.get("title") or jf.stem.replace("-", " ").title())
                content = _render_markdown_from_payload(payload)
                wrel = str(jf.relative_to(root))
                docs.append(
                    {
                        "title": title,
                        "type": _doc_type_label("evolution_quality_log", "Daily Digest"),
                        "date": file_date,
                        "path": wrel,
                        "document_key": _logical_document_key(wrel),
                        "content": content,
                        "payload": payload,
                        "phase": None,
                        "category": "output",
                        "segment": "evolution",
                        "sector": None,
                        "runType": None,
                    }
                )

    return docs

# --- Supabase integration -------------------------------------------------

def supabase_configured():
    """Check if Supabase credentials are available in environment."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    return bool(_HAS_SUPABASE and url and key)


def _get_supabase_client():
    """Create a Supabase client using service_role key (write access)."""
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def load_snapshot_json(day_dir):
    """Load snapshot.json from a daily folder if it exists and is populated.

    Returns the parsed dict, or None if missing/empty/placeholder.
    """
    snap_path = day_dir / "snapshot.json"
    if not snap_path.exists():
        return None
    try:
        data = json.loads(snap_path.read_text(encoding="utf-8"))
        # Check it's been populated (not just the scaffold placeholder)
        if not data.get("regime") or data["regime"] == {}:
            return None
        return data
    except Exception:
        return None


def _position_weight_pct(p: dict) -> float:
    try:
        w = p.get("weight_pct", p.get("weight"))
        if w is None:
            return 0.0
        return float(w)
    except (TypeError, ValueError):
        return 0.0


def _include_position_row(p: dict) -> bool:
    """Drop zero-weight equity rows (stale EXIT placeholders); keep CASH."""
    t = p.get("ticker")
    if t == "CASH":
        return True
    return _position_weight_pct(p) != 0.0


def push_to_supabase(parsed_digests, docs, history, b_hist, metrics, pj_positions):
    """Push all data to Supabase tables. Uses upsert (ON CONFLICT DO UPDATE)."""
    if not supabase_configured():
        return

    sb = _get_supabase_client()
    print("   Supabase: pushing data...")

    # ---- daily_snapshots ----
    snapshot_rows = []
    for d in parsed_digests:
        day_dir = DAILY_DIR / d["date"]
        snap = load_snapshot_json(day_dir)

        if snap:
            # Prefer structured snapshot.json (AI-written in Phase 7)
            row = {
                "date": snap["date"],
                "run_type": snap.get("run_type", "baseline"),
                "baseline_date": snap.get("baseline_date"),
                "regime": json.dumps(snap.get("regime", {})),
                "market_data": json.dumps(snap.get("market_data", {})),
                "segment_biases": json.dumps(snap.get("segment_biases", {})),
                "actionable": snap.get("actionable", []),
                "risks": snap.get("risks", []),
            }
        else:
            # Fallback: regex-parsed digest data — less reliable, may return empty fields
            print(f"   ⚠️  {d['date']}: snapshot.json missing/unpopulated, using regex fallback (run generate-snapshot.py to fix)", file=sys.stderr)
            meta = _detect_run_type(day_dir) if day_dir.exists() else "baseline"
            row = {
                "date": d["date"],
                "run_type": meta,
                "baseline_date": None,
                "regime": json.dumps({
                    "label": d.get("regime", "Unknown"),
                    "bias": d.get("bias", "Unknown"),
                    "summary": d.get("regime_summary", ""),
                }),
                "market_data": json.dumps({}),
                "segment_biases": json.dumps({}),
                "actionable": d.get("actionable", []),
                "risks": d.get("risks", []),
            }
        snapshot_rows.append(row)

    if snapshot_rows:
        try:
            # PostgREST upsert sets every column in the INSERT row; omitted keys become NULL on
            # UPDATE ... SET ... = excluded.* and wipe DB-first fields (snapshot, digest_markdown).
            for row in snapshot_rows:
                dt = row["date"]
                prior_res = (
                    sb.table("daily_snapshots")
                    .select("snapshot,digest_markdown")
                    .eq("date", dt)
                    .limit(1)
                    .execute()
                )
                pdata = getattr(prior_res, "data", None) or []
                prior = pdata[0] if pdata else None
                if prior:
                    if prior.get("snapshot") is not None:
                        row["snapshot"] = prior["snapshot"]
                    # Tearsheet never sends digest_markdown; must copy so upsert doesn't NULL it.
                    if "digest_markdown" not in row:
                        row["digest_markdown"] = prior.get("digest_markdown")
            sb.table("daily_snapshots").upsert(snapshot_rows, on_conflict="date").execute()
            print(f"   Supabase: {len(snapshot_rows)} daily_snapshots upserted")
        except Exception as e:
            print(f"   Supabase warning (daily_snapshots): {e}")

    # ---- positions ----
    # Priority: snapshot.json > portfolio.json enriched digest positions > raw digest positions
    pj_lookup = {p["ticker"]: p for p in pj_positions} if pj_positions else {}
    position_rows = []
    for d in parsed_digests:
        day_dir = DAILY_DIR / d["date"]
        snap = load_snapshot_json(day_dir)
        positions_source = snap["positions"] if snap else []

        if positions_source:
            for p in positions_source:
                if not _include_position_row(p):
                    continue
                ticker = p.get("ticker", "")
                pj = pj_lookup.get(ticker, {})
                tid = p.get("thesis_id")
                if not tid and pj.get("thesis_ids"):
                    tid = pj["thesis_ids"][0]
                position_rows.append({
                    "date": d["date"],
                    "ticker": ticker,
                    "name": p.get("name") or pj.get("name"),
                    "category": p.get("category") or pj.get("category"),
                    "weight_pct": p.get("weight_pct", 0),
                    "thesis_id": tid,
                    "rationale": p.get("rationale"),
                    "current_price": p.get("current_price"),
                    "entry_price": p.get("entry_price"),
                    "entry_date": p.get("entry_date"),
                })
        else:
            # Use digest-parsed positions, enriched with portfolio.json metadata
            for p in d.get("positions", []):
                if not _include_position_row(p):
                    continue
                ticker = p["ticker"]
                pj = pj_lookup.get(ticker, {})
                position_rows.append({
                    "date": d["date"],
                    "ticker": ticker,
                    "name": pj.get("name") or p.get("name"),
                    "category": pj.get("category"),
                    "weight_pct": p.get("weight", 0),
                    "thesis_id": (pj.get("thesis_ids") or [None])[0],
                    "rationale": p.get("rationale"),
                    "entry_price": pj.get("entry_price_usd"),
                    "entry_date": pj.get("entry_date"),
                    "pm_notes": pj.get("notes"),
                })

    if position_rows:
        # Batch upsert in chunks (Supabase limit ~1000 rows per request)
        for i in range(0, len(position_rows), 500):
            chunk = position_rows[i:i+500]
            try:
                sb.table("positions").upsert(chunk, on_conflict="date,ticker").execute()
            except Exception as e:
                print(f"   Supabase warning (positions chunk {i}): {e}")
        print(f"   Supabase: {len(position_rows)} positions upserted")

    # ---- theses ----
    thesis_rows = []
    for d in parsed_digests:
        day_dir = DAILY_DIR / d["date"]
        snap = load_snapshot_json(day_dir)
        theses_source = snap["theses"] if snap else d.get("theses", [])

        for t in theses_source:
            thesis_rows.append({
                "date": d["date"],
                "thesis_id": t.get("id", t.get("thesis_id", "")),
                "name": t.get("name", ""),
                "vehicle": t.get("vehicle"),
                "invalidation": t.get("invalidation"),
                "status": _normalize_thesis_status(t.get("status")),
                "notes": t.get("notes"),
            })

    if thesis_rows:
        for i in range(0, len(thesis_rows), 500):
            chunk = thesis_rows[i:i+500]
            try:
                sb.table("theses").upsert(chunk, on_conflict="date,thesis_id").execute()
            except Exception as e:
                print(f"   Supabase warning (theses chunk {i}): {e}")
        print(f"   Supabase: {len(thesis_rows)} theses upserted")

    # ---- position_events (compute diffs between consecutive days) ----
    event_rows = []
    sorted_digests = sorted(parsed_digests, key=lambda d: d["date"])
    prev_weights = {}
    for d in sorted_digests:
        day_dir = DAILY_DIR / d["date"]
        snap = load_snapshot_json(day_dir)
        raw_curr = snap["positions"] if snap else d.get("positions", [])
        curr_positions = [p for p in raw_curr if _include_position_row(p)]
        curr_weights = {p.get("ticker", p.get("ticker", "")): p for p in curr_positions}

        for ticker, p in curr_weights.items():
            wt = p.get("weight_pct", p.get("weight", 0))
            pj = pj_lookup.get(ticker, {})
            thesis_id = p.get("thesis_id")
            if not thesis_id and pj.get("thesis_ids"):
                thesis_id = pj["thesis_ids"][0]
            prev_p = prev_weights.get(ticker)
            prev_wt = prev_p.get("weight_pct", prev_p.get("weight", 0)) if prev_p else 0

            if prev_wt == 0 and wt > 0:
                event = "OPEN"
            elif prev_wt > 0 and wt == 0:
                event = "EXIT"
            elif abs(wt - prev_wt) >= 2:  # 2% threshold for rebalance event
                event = "REBALANCE"
            else:
                event = "HOLD"

            event_rows.append({
                "date": d["date"],
                "ticker": ticker,
                "event": event,
                "weight_pct": wt,
                "prev_weight_pct": prev_wt if prev_wt else None,
                "weight_change_pct": float(wt) - float(prev_wt or 0),
                "price": p.get("current_price"),
                "thesis_id": thesis_id,
                "reason": p.get("rationale"),
            })

        # Check for EXITs (tickers in prev but not in curr)
        for ticker in prev_weights:
            if ticker not in curr_weights:
                prev_p = prev_weights[ticker]
                event_rows.append({
                    "date": d["date"],
                    "ticker": ticker,
                    "event": "EXIT",
                    "weight_pct": 0,
                    "prev_weight_pct": prev_p.get("weight_pct", prev_p.get("weight", 0)),
                    "weight_change_pct": -float(prev_p.get("weight_pct", prev_p.get("weight", 0)) or 0),
                    "price": None,
                    "reason": "Position removed",
                })

        prev_weights = curr_weights

    if event_rows:
        for i in range(0, len(event_rows), 500):
            chunk = event_rows[i:i+500]
            try:
                sb.table("position_events").upsert(chunk, on_conflict="date,ticker").execute()
            except Exception as e:
                print(f"   Supabase warning (position_events chunk {i}): {e}")
        print(f"   Supabase: {len(event_rows)} position_events upserted")

    # ---- nav_history ----
    if history:
        nav_rows = [{"date": h["date"], "nav": h["nav"]} for h in history]
        for i in range(0, len(nav_rows), 500):
            chunk = nav_rows[i:i+500]
            try:
                sb.table("nav_history").upsert(chunk, on_conflict="date").execute()
            except Exception as e:
                print(f"   Supabase warning (nav_history chunk {i}): {e}")
        print(f"   Supabase: {len(nav_rows)} nav_history rows upserted")

    # Benchmark series (SPY, QQQ, TLT, GLD): read from price_history in the dashboard —
    # no separate benchmark_history table (see migration 010_schema_streamline.sql).

    # ---- portfolio_metrics ----
    if metrics:
        try:
            sb.table("portfolio_metrics").upsert([metrics], on_conflict="date").execute()
            print(f"   Supabase: portfolio_metrics upserted for {metrics['date']}")
        except Exception as e:
            print(f"   Supabase warning (portfolio_metrics): {e}")

    # ---- documents ----
    doc_rows = []
    for d in docs:
        dk = d.get("document_key") or _logical_document_key(d.get("path", ""))
        payload = d.get("payload")
        content = d.get("content")
        # Ensure every document row has a JSON payload (markdown docs become markdown_legacy / deep_dive).
        if not isinstance(payload, dict):
            payload = _payload_from_markdown(
                "deep_dive" if d.get("category") == "deep-dive" else "markdown_legacy",
                d["date"],
                d.get("title") or "",
                content or "",
                {},
            )
        doc_rows.append({
            "date": d["date"],
            "title": d["title"],
            "doc_type": d.get("type"),
            "phase": d.get("phase"),
            "category": d.get("category"),
            "segment": d.get("segment"),
            "sector": d.get("sector"),
            "run_type": d.get("runType"),
            "document_key": dk,
            "payload": payload,
            "content": content,
        })
    if doc_rows:
        for row in doc_rows:
            prior_res = (
                sb.table("documents")
                .select("payload")
                .eq("date", row["date"])
                .eq("document_key", row["document_key"])
                .limit(1)
                .execute()
            )
            pdata = getattr(prior_res, "data", None) or []
            prior = pdata[0] if pdata else None
            if (row.get("payload") is None or not isinstance(row.get("payload"), dict)) and prior and prior.get("payload") is not None:
                row["payload"] = prior["payload"]
        for i in range(0, len(doc_rows), 200):
            chunk = doc_rows[i:i+200]
            try:
                sb.table("documents").upsert(chunk, on_conflict="date,document_key").execute()
            except Exception as e:
                print(f"   Supabase warning (documents chunk {i}): {e}")
        print(f"   Supabase: {len(doc_rows)} documents upserted")

    print("   ✅ Supabase push complete")


def main():
    parser = argparse.ArgumentParser(
        description="update_tearsheet.py — Parse daily digests and push portfolio data to Supabase",
        epilog="By default writes to Supabase only. Use --json to also emit the static dashboard-data.json."
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Also write static frontend/public/dashboard-data.json (legacy debugging fallback)"
    )
    cli_args = parser.parse_args()

    print("📊 Market Digest — Dynamic Backend Parser v3")
    if not _HAS_YFINANCE:
        print("   ⚠️  yfinance not available — using docs-only + prefetched-data mode")
    
    digest_files = get_digest_files()
    if not digest_files:
        print("   ❌ No daily digest outputs found. Ensure outputs/daily/ contains markdown files.")
        sys.exit(1)
        
    print(f"   Found {len(digest_files)} daily digests.")
    
    parsed_digests = [parse_digest(f) for f in digest_files]
    
    # --- Portfolio simulation (yfinance-dependent) ---
    history = []
    active_positions = []
    b_hist = {}
    latest_digest = parsed_digests[-1] if parsed_digests else None
    pnl = 0.0
    total_invested = 0.0
    cash_pct = 100.0
    sharpe = 0.0
    volatility = 0.0
    max_dd = 0.0
    alpha = 0.0
    pnl_fx_data = None

    if _HAS_YFINANCE:
        history, active_positions, b_hist, latest_digest = simulate_portfolio(parsed_digests)
    
    if not latest_digest:
        print("   ❌ Could not parse any latest digest.")
        sys.exit(1)

    print(f"   Latest active digest: {latest_digest['date']}")

    # Load authoritative portfolio data from config/portfolio.json
    pj_positions, pj_proposed, pj_constraints, investor_currency = load_portfolio_json()
    if pj_positions:
        print(f"   Portfolio.json: {len(pj_positions)} positions, {len(pj_proposed)} proposed, currency={investor_currency}")
    
    # Load latest rebalance decision
    rebalance_data = load_rebalance_decision(latest_digest['date'])

    # Compute unrealized P&L + FX-adjusted returns (yfinance-dependent)
    if _HAS_YFINANCE:
        pnl_fx_data = compute_fx_impact(pj_positions, investor_currency)
        if pnl_fx_data:
            w_usd = pnl_fx_data.get('weighted_usd_return_pct')
            w_cad = pnl_fx_data.get(f'weighted_{investor_currency.lower()}_return_pct')
            print(f"   FX Impact: weighted USD return {w_usd}% | {investor_currency} return {w_cad}%")

    # Calculate simplistic metrics
    if history:
        active_nav = history[-1]['nav']
        pnl = active_nav - 100.0
    total_invested = sum([p['weight_actual'] for p in active_positions])
    cash_found = next((p['weight'] for p in latest_digest['positions'] if p['ticker'] == 'CASH'), None)
    
    if cash_found is None:
        cash_pct = 100.0 - total_invested
    else:
        cash_pct = cash_found

    # Advanced performance metrics (yfinance-dependent)
    if _HAS_YFINANCE and len(history) > 1:
        idx = pd.to_datetime([h["date"] for h in history])
        navs = pd.Series([h["nav"] for h in history], index=idx)
        returns = navs.pct_change().dropna()

        # Drawdown uses the full calendar series (includes flat weekends) so the
        # chart is continuous.  Sharpe/vol/alpha must use only trading-day returns
        # to avoid deflating annualised stats with 104 zero-return weekend days/yr.
        td_mask = pd.Series(
            [h.get("is_trading_day", True) for h in history], index=idx, dtype=bool
        )
        trading_returns = returns[td_mask.reindex(returns.index, fill_value=True)]

        if not trading_returns.empty and trading_returns.std() != 0:
            vol = float(trading_returns.std() * np.sqrt(252))
            volatility = vol if not np.isnan(vol) else 0.0

            risk_free = 0.00  # Default to 0 for simplicity
            sh = float((trading_returns.mean() * 252 - risk_free) / volatility)
            sharpe = sh if not np.isnan(sh) else 0.0

        cum_max = navs.cummax()
        drawdowns = (navs - cum_max) / cum_max
        m_dd = float(drawdowns.min())
        max_dd = m_dd if not np.isnan(m_dd) else 0.0

        # Alpha vs SPY: filter both series to trading days only so the 252-day
        # annualisation factor and mean return comparison are apple-to-apple.
        if b_hist and "SPY" in b_hist and len(history) > 1:
            spy_pts = {
                pd.Timestamp(x["date"]): x["price"] for x in b_hist["SPY"]["history"]
            }
            spy_series = pd.Series(
                [spy_pts.get(ts) for ts in idx], index=idx
            ).ffill().bfill()
            spy_ret = spy_series.pct_change().dropna()
            # Intersect on trading days only
            common = trading_returns.index.intersection(spy_ret.index)
            common = common[~(trading_returns.loc[common].isna() | spy_ret.loc[common].isna())]
            if len(common) > 5:
                pr = trading_returns.loc[common]
                sr = spy_ret.loc[common]
                a = float((pr.mean() - sr.mean()) * 252)
                alpha = a if not np.isnan(a) else 0.0

    docs = load_all_markdowns(ROOT)
    print(f"   Research docs: {len(docs)} found")

    # --- Push to Supabase (primary data store) ---
    if supabase_configured():
        metrics_row = {
            "date": latest_digest["date"],
            "pnl_pct": round(pnl, 4),
            "sharpe": round(sharpe, 4),
            "volatility": round(volatility, 4),
            "max_drawdown": round(max_dd, 4),
            "alpha": round(alpha, 4),
            "cash_pct": round(cash_pct, 2),
            "total_invested": round(total_invested, 2),
            "computed_from": "tearsheet",
            "as_of_date": latest_digest["date"],
        }
        push_to_supabase(parsed_digests, docs, history, b_hist, metrics_row, pj_positions)
    else:
        print("   ❌ Supabase not configured — data will NOT be available to the frontend!")
        if _HAS_SUPABASE:
            print("      Set SUPABASE_URL and SUPABASE_SERVICE_KEY in config/supabase.env")
        else:
            print("      Install SDK: pip install supabase")

    # Enrich active_positions with portfolio.json metadata (thesis, category, notes)
    if pj_positions and active_positions:
        pj_lookup = {p["ticker"]: p for p in pj_positions}
        for ap in active_positions:
            pj_match = pj_lookup.get(ap["ticker"])
            if pj_match:
                ap["thesis_ids"] = pj_match.get("thesis_ids", [])
                ap["category"] = pj_match.get("category", "")
                ap["pm_notes"] = pj_match.get("notes", "")
    
    # If no positions from DIGEST simulation but portfolio.json has positions, use those
    if not active_positions and pj_positions:
        print("   Using portfolio.json positions (no DIGEST-derived positions)")
        all_tickers_pj = [p["ticker"] for p in pj_positions if p["ticker"] != "CASH"]

        # Try pre-fetched data first, then yfinance as fallback
        prefetched = _load_prefetched_prices(ROOT)
        pj_prices = None
        if _HAS_YFINANCE and all_tickers_pj and not prefetched:
            pj_prices = fetch_prices(all_tickers_pj, datetime.now().strftime("%Y-%m-%d"))

        for p in pj_positions:
            t = p["ticker"]
            if t == "CASH":
                continue
            cp = None
            stats = {}
            # Prefer pre-fetched data (always available in CI)
            if t in prefetched:
                snap = prefetched[t]
                cp = snap.get("price")
                stats = {k: v for k, v in snap.items() if k not in ("ticker", "price", "error")}
            elif pj_prices is not None and hasattr(pj_prices, 'empty') and not pj_prices.empty and t in pj_prices.columns:
                cp = float(pj_prices[t].dropna().iloc[-1]) if not pj_prices[t].dropna().empty else None
            active_positions.append({
                "ticker": t,
                "name": p.get("name", t),
                "type": "LONG",
                "weight_actual": float(p.get("weight_pct", 0)),
                "current_price": cp,
                "rationale": p.get("notes", ""),
                "thesis_ids": p.get("thesis_ids", []),
                "category": p.get("category", ""),
                "pm_notes": p.get("notes", ""),
                "stats": stats,
            })
        total_invested = sum(p["weight_actual"] for p in active_positions)
        cash_pct = 100.0 - total_invested

    dashboard_data = {
        "portfolio": {
            "meta": {
                "name": "Market Digest Dynamic Portfolio",
                "base_currency": investor_currency,
                "inception_date": parsed_digests[0]['date'],
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "benchmarks": BENCHMARKS
            },
            "snapshots": history,
            "strategy": {
                "regime": latest_digest["regime"],
                "regime_label": latest_digest.get("regime_label", "neutral"),
                "summary": latest_digest["regime_summary"],
                "actionable": latest_digest["actionable"],
                "risks": latest_digest["risks"],
                "theses": latest_digest.get("theses", []),
                "next_review": "Daily"
            }
        },
        "positions": active_positions,
        "portfolio_management": {
            "current_positions": [
                {
                    "ticker": p["ticker"],
                    "name": p.get("name", p["ticker"]),
                    "category": p.get("category", ""),
                    "weight_pct": p.get("weight_pct", 0),
                    "thesis_ids": p.get("thesis_ids", []),
                    "entry_date": p.get("entry_date"),
                    "entry_price_usd": p.get("entry_price_usd"),
                    "entry_usdcad": p.get("entry_usdcad"),
                    "notes": p.get("notes", ""),
                }
                for p in pj_positions
            ] if pj_positions else [],
            "proposed_positions": [
                {
                    "ticker": p["ticker"],
                    "weight_pct": p.get("weight_pct", 0),
                    "action": p.get("action", ""),
                    "as_of": p.get("as_of", ""),
                }
                for p in pj_proposed
            ] if pj_proposed else [],
            "constraints": pj_constraints,
            "rebalance_actions": rebalance_data,
            "pnl_fx_impact": pnl_fx_data if pnl_fx_data else None,
            "investor_currency": investor_currency,
        },
        "ratios": [], # Not simulated right now
        "docs": docs,
        "benchmarks": b_hist,
        "calculated": {
            "portfolio_pnl": pnl,
            "total_invested": total_invested,
            "cash_pct": cash_pct,
            "sharpe": sharpe,
            "volatility": volatility,
            "max_drawdown": max_dd,
            "alpha": alpha,
            "generated_at": datetime.now().isoformat()
        }
    }
    
    # Write static JSON only when explicitly requested (legacy fallback / debugging)
    if cli_args.json:
        OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(dashboard_data, f, ensure_ascii=False)
        print(f"   ✅ Dashboard JSON (legacy) → {OUTPUT_JSON}")
    else:
        print("   ℹ️  Skipping dashboard-data.json (Supabase is the primary data store)")
        print("      Pass --json to generate the static file for debugging")

if __name__ == "__main__":
    main()
