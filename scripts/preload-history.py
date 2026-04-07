#!/usr/bin/env python3
"""
preload-history.py — Bulk download and cache OHLCV price history for all watchlist tickers.
One-time setup (or periodic refresh). Daily pipeline then only appends latest quotes.

Storage: data/price-history/{TICKER}.csv   (one CSV per ticker)

Usage:
    python3 scripts/preload-history.py                  # all watchlist, 2y history
    python3 scripts/preload-history.py --period 5y      # all watchlist, 5y
    python3 scripts/preload-history.py --ticker SPY     # single ticker only
    python3 scripts/preload-history.py --refresh        # re-fetch tickers whose cache is >7d stale
"""

import argparse
import re
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).parent.parent
CACHE_DIR = ROOT / "data" / "price-history"


# ── ticker parsing (shared with fetch-quotes.py) ────────────────────────────

def parse_tickers_from_watchlist() -> list[str]:
    """Extract all uppercase ticker symbols from config/watchlist.md table rows."""
    wl = ROOT / "config" / "watchlist.md"
    if not wl.exists():
        print("  ⚠️  config/watchlist.md not found — using fallback universe")
        return ["SPY", "QQQ", "IWM", "XLK", "XLF", "XLE", "XLV", "XLI",
                "XLRE", "XLU", "XLY", "XLP", "XLB", "XLC", "TLT", "GLD",
                "IAU", "SLV", "USO", "DBO", "IBIT", "FBTC", "BIL", "SHY",
                "EFA", "EEM", "FXI", "EWJ", "EWZ"]
    text = wl.read_text(encoding="utf-8")
    tickers = re.findall(r"^\|\s*([A-Z]{2,6})\s*\|", text, re.MULTILINE)
    # Exclude table headers and macro-only indicators
    EXCLUDE = {"ETF", "DXY", "VIX"}
    seen = set()
    result = []
    for t in tickers:
        if t not in seen and t not in EXCLUDE:
            seen.add(t)
            result.append(t)
    return result


# ── cache helpers ────────────────────────────────────────────────────────────

def cache_path(ticker: str) -> Path:
    return CACHE_DIR / f"{ticker}.csv"


def cache_is_stale(ticker: str, max_age_days: int = 7) -> bool:
    """True if cache file doesn't exist or its most recent data row is older than max_age_days."""
    p = cache_path(ticker)
    if not p.exists():
        return True
    try:
        df = pd.read_csv(p, parse_dates=["Date"], index_col="Date")
        if df.empty:
            return True
        last_date = df.index.max()
        return (datetime.now() - last_date.to_pydatetime()).days > max_age_days
    except Exception:
        return True


def save_cache(ticker: str, df: pd.DataFrame) -> None:
    """Save OHLCV DataFrame to CSV cache. Index must be DatetimeIndex named 'Date'."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    df = df.sort_index()
    # Ensure consistent column names
    df.columns = [c.capitalize() for c in df.columns]
    df.index.name = "Date"
    df.to_csv(cache_path(ticker), date_format="%Y-%m-%d")


# ── download ─────────────────────────────────────────────────────────────────

def download_full_history(tickers: list[str], period: str = "2y",
                          batch_size: int = 25) -> dict[str, pd.DataFrame]:
    """Download OHLCV for tickers in batches. Returns dict ticker → DataFrame."""
    batches = [tickers[i:i + batch_size] for i in range(0, len(tickers), batch_size)]
    result: dict[str, pd.DataFrame] = {}

    for i, batch in enumerate(batches, 1):
        print(f"  Batch {i}/{len(batches)} ({len(batch)} tickers)...")
        try:
            raw = yf.download(batch, period=period, progress=False, threads=True)
            if raw.empty:
                continue
            if isinstance(raw.columns, pd.MultiIndex):
                for t in batch:
                    try:
                        df = raw.xs(t, level=1, axis=1).copy()
                        df = df.dropna(how="all")
                        if not df.empty:
                            result[t] = df
                    except KeyError:
                        pass
            else:
                # Single ticker
                df = raw.copy().dropna(how="all")
                if not df.empty:
                    result[batch[0]] = df
        except Exception as e:
            print(f"    ⚠️  Batch {i} failed: {e}")
        if i < len(batches):
            time.sleep(0.5)

    return result


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Preload OHLCV price history cache")
    parser.add_argument("--period", default="2y",
                        help="yfinance period string: 1y, 2y, 5y, max (default: 2y)")
    parser.add_argument("--ticker", default=None,
                        help="Fetch a single ticker instead of the full watchlist")
    parser.add_argument("--refresh", action="store_true",
                        help="Only re-fetch tickers whose cache is >7 days stale")
    parser.add_argument("--max-stale-days", type=int, default=7,
                        help="Staleness threshold for --refresh mode (default: 7)")
    args = parser.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    print("╔════════════════════════════════════════════╗")
    print("║  preload-history.py — Price History Cache  ║")
    print("╚════════════════════════════════════════════╝")
    print(f"  Cache dir : {CACHE_DIR}")
    print(f"  Period    : {args.period}")
    print()

    # Determine ticker list
    if args.ticker:
        tickers = [args.ticker.upper()]
    else:
        tickers = parse_tickers_from_watchlist()
        print(f"  Parsed {len(tickers)} tickers from config/watchlist.md")

    # Filter if refresh mode
    if args.refresh and not args.ticker:
        stale = [t for t in tickers if cache_is_stale(t, args.max_stale_days)]
        fresh = len(tickers) - len(stale)
        print(f"  Refresh mode: {fresh} fresh, {len(stale)} stale (>{args.max_stale_days}d)")
        if not stale:
            print("  ✅ All tickers are fresh — nothing to do.")
            return
        tickers = stale

    print(f"  Downloading {len(tickers)} tickers ({args.period} history)...")
    print()

    data = download_full_history(tickers, period=args.period)

    saved = 0
    for t in tickers:
        df = data.get(t)
        if df is not None and not df.empty:
            save_cache(t, df)
            rows = len(df)
            first = df.index.min().strftime("%Y-%m-%d")
            last = df.index.max().strftime("%Y-%m-%d")
            print(f"    ✅ {t:6s}  {rows:>4d} rows  {first} → {last}")
            saved += 1
        else:
            print(f"    ❌ {t:6s}  no data returned")

    print()
    print(f"  Cached {saved}/{len(tickers)} tickers to {CACHE_DIR}")
    print("  Done.")


if __name__ == "__main__":
    main()
