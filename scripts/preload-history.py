#!/usr/bin/env python3
"""
preload-history.py — Bulk download and cache OHLCV price history for all watchlist tickers.

Storage: data/price-history/{TICKER}.csv   (one CSV per ticker)

Usage:
    python3 scripts/preload-history.py --supabase --period max     # one-time full backfill → Supabase + cache
    python3 scripts/preload-history.py --supabase --incremental-supabase   # daily: Yahoo only since last DB row (+ overlap)
    python3 scripts/preload-history.py --period 2y                    # all watchlist, 2y (local cache)
    python3 scripts/preload-history.py --ticker SPY --period max
    python3 scripts/preload-history.py --refresh                      # local cache stale check (>7d)
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

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
    # Match tickers: plain uppercase (SPY), hyphenated crypto (BTC-USD),
    # or alphanumeric yfinance IDs (SUI20947-USD)
    tickers = re.findall(r"^\|\s*([A-Z][A-Z0-9]{1,9}(?:-[A-Z]{2,4})?)\s*\|", text, re.MULTILINE)
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
    import pandas as pd

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
    import pandas as pd

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    df = df.sort_index()
    # Ensure consistent column names
    df.columns = [c.capitalize() for c in df.columns]
    df.index.name = "Date"
    dest = cache_path(ticker)
    tmp = dest.with_suffix(".csv.tmp")
    df.to_csv(tmp, date_format="%Y-%m-%d")
    tmp.rename(dest)


def upsert_to_supabase(ticker: str, df: pd.DataFrame) -> int:
    """Upsert OHLCV rows for a single ticker into the Supabase price_history table.

    Returns the number of rows upserted, or 0 on error.
    Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
    """
    import pandas as pd

    sb = _connect_supabase()
    if not sb:
        print("    ⚠️  Supabase not configured (or supabase-py missing) — skipping upsert")
        return 0

    df = df.copy()
    df.index.name = "Date"
    df = df.sort_index()
    col_map = {c: c.capitalize() for c in df.columns}
    df = df.rename(columns=col_map)

    # Remember which dates had actual market data before expanding to calendar days.
    # The local CSV cache stays as trading-days-only (used for TA); Supabase gets
    # every calendar day so the portfolio page has a continuous series.
    trading_day_dates: set = set(df.index.normalize())

    # Expand to full calendar range and forward-fill prices.
    full_range = pd.date_range(df.index.min(), df.index.max(), freq="D")
    df = df.reindex(full_range).ffill()
    df.index.name = "Date"

    rows = []
    for date_idx, row in df.iterrows():
        is_td = date_idx.normalize() in trading_day_dates
        rows.append({
            "date": date_idx.strftime("%Y-%m-%d"),
            "ticker": ticker,
            "open": float(row["Open"]) if "Open" in row and pd.notna(row["Open"]) else None,
            "high": float(row["High"]) if "High" in row and pd.notna(row["High"]) else None,
            "low": float(row["Low"]) if "Low" in row and pd.notna(row["Low"]) else None,
            "close": float(row["Close"]) if "Close" in row and pd.notna(row["Close"]) else None,
            # Volume is zero on non-trading days (prices are carried forward, no activity)
            "volume": int(row["Volume"]) if is_td and "Volume" in row and pd.notna(row["Volume"]) else 0,
            "is_trading_day": is_td,
        })
        # Drop rows where close is None (required column)
    rows = [r for r in rows if r["close"] is not None]

    if not rows:
        return 0

    # Upsert in chunks of 500
    CHUNK = 500
    for i in range(0, len(rows), CHUNK):
        sb.table("price_history").upsert(rows[i:i + CHUNK]).execute()
    return len(rows)


# ── Supabase + incremental fetch ─────────────────────────────────────────────

def _connect_supabase():
    try:
        from supabase import create_client
    except ImportError:
        return None
    try:
        from dotenv import load_dotenv
        load_dotenv(ROOT / "config" / "supabase.env")
        load_dotenv()
    except ImportError:
        pass
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


def _latest_price_date(sb, ticker: str) -> Optional[str]:
    """Latest calendar date in price_history for ticker (ISO YYYY-MM-DD), or None."""
    res = (
        sb.table("price_history")
        .select("date")
        .eq("ticker", ticker)
        .order("date", desc=True)
        .limit(1)
        .execute()
    )
    data = getattr(res, "data", None) or []
    if not data:
        return None
    return str(data[0]["date"])[:10]


def _fetch_trading_rows_before(sb, ticker: str, before_iso: str) -> list[dict]:
    """Trading-day OHLCV rows strictly before before_iso (for merge with Yahoo tail)."""
    out: list[dict] = []
    page_size = 1000
    offset = 0
    while True:
        res = (
            sb.table("price_history")
            .select("date, open, high, low, close, volume")
            .eq("ticker", ticker)
            .eq("is_trading_day", True)
            .lt("date", before_iso)
            .order("date")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = getattr(res, "data", None) or []
        out.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return out


def _prior_rows_to_df(rows: list[dict]) -> Optional["pd.DataFrame"]:
    import pandas as pd

    if not rows:
        return None
    idx: List[pd.Timestamp] = []
    recs: List[dict] = []
    for r in rows:
        idx.append(pd.Timestamp(str(r["date"])[:10]))
        recs.append({
            "Open": float(r["open"]) if r.get("open") is not None else float("nan"),
            "High": float(r["high"]) if r.get("high") is not None else float("nan"),
            "Low": float(r["low"]) if r.get("low") is not None else float("nan"),
            "Close": float(r["close"]) if r.get("close") is not None else float("nan"),
            "Volume": int(r["volume"]) if r.get("volume") is not None else 0,
        })
    df = pd.DataFrame(recs, index=pd.DatetimeIndex(idx, name="Date"))
    return df.sort_index()


def _yahoo_raw_to_df(ticker: str, raw) -> Optional["pd.DataFrame"]:
    import pandas as pd

    if raw is None or raw.empty:
        return None
    df = raw.copy().dropna(how="all")
    if df.empty:
        return None
    if isinstance(df.columns, pd.MultiIndex):
        try:
            df = df.xs(ticker, level=1, axis=1).copy()
        except (KeyError, TypeError):
            return None
        df = df.dropna(how="all")
    df.columns = [str(c).capitalize() for c in df.columns]
    if "Adj close" in df.columns and "Close" not in df.columns:
        df = df.rename(columns={"Adj close": "Close"})
    keep = [c for c in ("Open", "High", "Low", "Close", "Volume") if c in df.columns]
    if "Close" not in keep:
        return None
    return df[keep]


def _download_yahoo_since(ticker: str, start_iso: str) -> Optional["pd.DataFrame"]:
    import yfinance as yf

    raw = yf.download(ticker, start=start_iso, progress=False, threads=False)
    return _yahoo_raw_to_df(ticker, raw)


def _strip_index_to_date(df: "pd.DataFrame") -> "pd.DataFrame":
    import pandas as pd

    df = df.copy()
    idx = pd.to_datetime(df.index.strftime("%Y-%m-%d"))
    df.index = pd.DatetimeIndex(idx, name="Date")
    return df


def _merge_ohlcv(prior: Optional["pd.DataFrame"], yahoo: Optional["pd.DataFrame"]) -> Optional["pd.DataFrame"]:
    import pandas as pd

    frames = []
    for f in (prior, yahoo):
        if f is not None and not f.empty:
            frames.append(_strip_index_to_date(f))
    if not frames:
        return None
    out = pd.concat(frames).sort_index()
    out = out[~out.index.duplicated(keep="last")]
    return out


def run_incremental_supabase(
    tickers: list[str],
    period_full: str,
    overlap_days: int,
) -> tuple[int, int]:
    """For each ticker: merge Supabase history + Yahoo since last row; upsert Yahoo window only.

    Returns (tickers_saved, total_supabase_rows).
    """
    import pandas as pd

    sb = _connect_supabase()
    if not sb:
        print("    ⚠️  SUPABASE_URL / SUPABASE_SERVICE_KEY not set — cannot run incremental")
        return 0, 0

    saved = 0
    sb_total = 0
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    for t in tickers:
        last = _latest_price_date(sb, t)
        if last is None:
            data = download_full_history([t], period=period_full)
            yh = data.get(t)
            if yh is None or yh.empty:
                print(f"    ❌ {t:6s}  no data (full fetch)")
                continue
            save_cache(t, yh)
            n = upsert_to_supabase(t, yh)
            sb_total += n
            print(
                f"    ✅ {t:6s}  first load  {len(yh):>4d} trading rows  "
                f"{yh.index.min().strftime('%Y-%m-%d')} → {yh.index.max().strftime('%Y-%m-%d')}  ↑{n}r"
            )
            saved += 1
            time.sleep(0.15)
            continue

        last_d = datetime.strptime(last, "%Y-%m-%d").date()
        start_d = last_d - timedelta(days=overlap_days)
        start_iso = start_d.isoformat()
        prior_rows = _fetch_trading_rows_before(sb, t, start_iso)
        prior_df = _prior_rows_to_df(prior_rows)
        yahoo_df = _download_yahoo_since(t, start_iso)
        if yahoo_df is None or yahoo_df.empty:
            print(f"    ⚠️  {t:6s}  Yahoo returned no rows since {start_iso} — skip")
            continue
        yahoo_df = _strip_index_to_date(yahoo_df)
        combined = _merge_ohlcv(prior_df, yahoo_df)
        if combined is None or combined.empty:
            continue
        save_cache(t, combined)
        n = upsert_to_supabase(t, yahoo_df)
        sb_total += n
        print(
            f"    ✅ {t:6s}  merged {len(combined):>4d} rows cache  "
            f"Yahoo slice ↑{n}r  {yahoo_df.index.min().strftime('%Y-%m-%d')} → {yahoo_df.index.max().strftime('%Y-%m-%d')}"
        )
        saved += 1
        time.sleep(0.15)

    return saved, sb_total


# ── download ─────────────────────────────────────────────────────────────────

def download_full_history(tickers: list[str], period: str = "2y",
                          batch_size: int = 25) -> dict[str, pd.DataFrame]:
    """Download OHLCV for tickers in batches. Returns dict ticker → DataFrame."""
    import pandas as pd
    import yfinance as yf

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
    parser.add_argument("--supabase", action="store_true",
                        help="Also upsert fetched data to Supabase price_history table")
    parser.add_argument(
        "--incremental-supabase",
        action="store_true",
        help="Per ticker: read trading history from Supabase, Yahoo only from (last_date - overlap); "
             "merge into local cache; upsert calendar-expanded Yahoo window only (for daily jobs)",
    )
    parser.add_argument(
        "--incremental-overlap-days",
        type=int,
        default=7,
        help="Calendar days of overlap re-downloaded from Yahoo for corrections (default: 7)",
    )
    args = parser.parse_args()

    if args.incremental_supabase and not args.supabase:
        parser.error("--incremental-supabase requires --supabase")
    if args.incremental_supabase and args.refresh:
        parser.error("Do not combine --refresh with --incremental-supabase")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    print("╔════════════════════════════════════════════╗")
    print("║  preload-history.py — Price History Cache  ║")
    print("╚════════════════════════════════════════════╝")
    print(f"  Cache dir : {CACHE_DIR}")
    print(f"  Period    : {args.period}" + ("  (used for new tickers in incremental mode)" if args.incremental_supabase else ""))
    print()

    # Determine ticker list
    if args.ticker:
        tickers = [args.ticker.upper()]
    else:
        tickers = parse_tickers_from_watchlist()
        print(f"  Parsed {len(tickers)} tickers from config/watchlist.md")

    if args.incremental_supabase:
        print(f"  Mode      : incremental (Supabase anchor + Yahoo tail, overlap={args.incremental_overlap_days}d)")
        print()
        saved, sb_total = run_incremental_supabase(tickers, args.period, args.incremental_overlap_days)
        print()
        print(f"  Cached {saved}/{len(tickers)} tickers to {CACHE_DIR}")
        print(f"  Upserted {sb_total} rows to Supabase price_history (Yahoo windows only)")
        print("  Done.")
        return

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
    sb_total = 0
    for t in tickers:
        df = data.get(t)
        if df is not None and not df.empty:
            save_cache(t, df)
            rows = len(df)
            first = df.index.min().strftime("%Y-%m-%d")
            last = df.index.max().strftime("%Y-%m-%d")
            sb_note = ""
            if args.supabase:
                sb_rows = upsert_to_supabase(t, df)
                sb_note = f"  ↑Supabase {sb_rows}r" if sb_rows else "  ↑skip"
                sb_total += sb_rows
            print(f"    ✅ {t:6s}  {rows:>4d} rows  {first} → {last}{sb_note}")
            saved += 1
        else:
            print(f"    ❌ {t:6s}  no data returned")

    print()
    print(f"  Cached {saved}/{len(tickers)} tickers to {CACHE_DIR}")
    if args.supabase:
        print(f"  Upserted {sb_total} rows to Supabase price_history")
    print("  Done.")


if __name__ == "__main__":
    main()
