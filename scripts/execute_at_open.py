#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from datetime import date as dt_date, datetime
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


def _latest_rebalance_payload(sb, d: str) -> Optional[Dict[str, Any]]:
    # Prefer same-day rebalance decision; else none.
    res = (
        sb.table("documents")
        .select("payload,document_key")
        .eq("date", d)
        .order("document_key", desc=True)
        .execute()
    )
    rows = getattr(res, "data", None) or []
    for r in rows:
        p = r.get("payload")
        if isinstance(p, dict) and p.get("doc_type") == "rebalance_decision":
            return p
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="Record market-open execution events into position_events.")
    ap.add_argument("--date", default=dt_date.today().isoformat(), help="YYYY-MM-DD")
    args = ap.parse_args()
    d = args.date

    if not _trading_day_only(d):
        print("Skipping execution: non-trading day (weekend).")
        return 0

    sb = _sb()
    payload = _latest_rebalance_payload(sb, d)
    if not payload:
        print("No rebalance_decision payload found for date; nothing to execute.")
        return 0

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

    print(f"✅ recorded {len(events)} execution event(s) at market open for {d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

