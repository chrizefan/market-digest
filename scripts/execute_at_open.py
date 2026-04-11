#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from datetime import date as dt_date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from supabase import create_client  # type: ignore

    _HAS_SB = True
except ImportError:
    _HAS_SB = False

try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv(Path(__file__).parent.parent / "config" / "supabase.env")
    load_dotenv()
except ImportError:
    pass


def _sb():
    if not _HAS_SB:
        raise RuntimeError("pip install supabase")
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY required")
    return create_client(url, key)


def _trading_day_only(d: str) -> bool:
    try:
        wd = datetime.fromisoformat(d).isoweekday()
        return 1 <= wd <= 5
    except Exception:
        return False


def _prior_trading_date(execution_date: str) -> Optional[str]:
    """Previous calendar date that falls on Mon–Fri (US equity session proxy)."""
    try:
        cur = datetime.fromisoformat(execution_date).date()
    except Exception:
        return None
    for _ in range(12):
        cur = cur - timedelta(days=1)
        if cur.weekday() < 5:
            return cur.isoformat()
    return None


def _fetch_open(sb, ticker: str, d: str) -> Optional[float]:
    res = (
        sb.table("price_history")
        .select("open")
        .eq("ticker", ticker)
        .eq("date", d)
        .limit(1)
        .execute()
    )
    rows = getattr(res, "data", None) or []
    if not rows:
        return None
    o = rows[0].get("open")
    return float(o) if o is not None else None


def _rebalance_payload_for_date(sb, rebalance_date: str) -> Optional[Dict[str, Any]]:
    """Load rebalance_decision for a given documents.date (fast path + fallback scan)."""
    res = (
        sb.table("documents")
        .select("payload")
        .eq("date", rebalance_date)
        .eq("document_key", "rebalance-decision.json")
        .limit(1)
        .execute()
    )
    rows = getattr(res, "data", None) or []
    if rows:
        p = rows[0].get("payload")
        if isinstance(p, dict) and p.get("doc_type") == "rebalance_decision":
            return p

    res2 = (
        sb.table("documents")
        .select("payload")
        .eq("date", rebalance_date)
        .order("document_key", desc=True)
        .execute()
    )
    for r in getattr(res2, "data", None) or []:
        p = r.get("payload")
        if isinstance(p, dict) and p.get("doc_type") == "rebalance_decision":
            return p
    return None


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Record market-open execution events into position_events. "
        "Execution prices use price_history.open for --date (execution day)."
    )
    ap.add_argument("--date", default=dt_date.today().isoformat(), help="Execution session date YYYY-MM-DD (opens from this day)")
    ap.add_argument(
        "--rebalance-date",
        default=None,
        help="documents.date for rebalance_decision (default: same as --date, or prior weekday with --prior-trading-day-rebalance)",
    )
    ap.add_argument(
        "--prior-trading-day-rebalance",
        action="store_true",
        help="Use rebalance_decision from the previous Mon–Fri, execute at opens on --date (e.g. Fri decision → Mon open).",
    )
    args = ap.parse_args()
    d = args.date

    if not _trading_day_only(d):
        print("Skipping execution: non-trading day (weekend).")
        return 0

    if args.prior_trading_day_rebalance and args.rebalance_date:
        print("error: use only one of --prior-trading-day-rebalance or --rebalance-date", file=sys.stderr)
        return 2

    rebalance_d = args.rebalance_date
    if args.prior_trading_day_rebalance:
        rebalance_d = _prior_trading_date(d)
        if not rebalance_d:
            print("Could not resolve prior trading date for rebalance source.", file=sys.stderr)
            return 2
    elif not rebalance_d:
        rebalance_d = d

    sb = _sb()
    payload = _rebalance_payload_for_date(sb, rebalance_d)
    if not payload:
        print(f"No rebalance_decision payload for documents.date={rebalance_d}; nothing to execute.")
        return 0

    if rebalance_d != d:
        print(f"Using rebalance_decision from {rebalance_d} for execution on {d} (opens).")

    body = payload.get("body") if isinstance(payload.get("body"), dict) else {}
    table = body.get("rebalance_table") if isinstance(body, dict) else None
    if not isinstance(table, list) or not table:
        print("rebalance_decision has no rebalance_table; nothing to execute.")
        return 0

    # Build events for non-HOLD actions (best-effort).
    events: List[Dict[str, Any]] = []
    for row in table:
        if not isinstance(row, dict):
            continue
        ticker = row.get("ticker")
        action = row.get("action")
        if not ticker or not isinstance(ticker, str):
            continue
        if str(action).upper() in ("HOLD", ""):
            continue

        wt = row.get("recommended_pct")
        try:
            weight_pct = float(wt) if wt is not None else None
        except (TypeError, ValueError):
            weight_pct = None

        price = _fetch_open(sb, ticker, d)
        if str(action).upper() in ("EXIT",):
            event = "EXIT"
        elif str(action).upper() in ("NEW", "ADD"):
            event = "OPEN"
        else:
            event = "REBALANCE"

        events.append(
            {
                "date": d,
                "ticker": ticker,
                "event": event,
                "weight_pct": weight_pct,
                "price": price,
                "reason": row.get("rationale"),
                "thesis_id": None,
            }
        )

    if not events:
        print("No executable actions found (only HOLD).")
        return 0

    # Upsert by date,ticker (current schema)
    for e in events:
        sb.table("position_events").upsert(e, on_conflict="date,ticker").execute()

    null_px = sum(1 for e in events if e.get("price") is None)
    if null_px:
        print(
            f"⚠️  {null_px} event(s) have null price (no price_history.open for {d} yet). "
            f"After opens sync: python3 scripts/backfill_execution_prices.py --date {d}"
        )

    print(f"✅ recorded {len(events)} execution event(s) at market open for {d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

