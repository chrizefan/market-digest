#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from datetime import date as dt_date
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


def _fail(msg: str) -> None:
    print(f"❌ {msg}", file=sys.stderr)


def _pass(msg: str) -> None:
    print(f"✅ {msg}")


def main() -> int:
    ap = argparse.ArgumentParser(description="DB-first validation for a run date.")
    ap.add_argument("--date", default=dt_date.today().isoformat(), help="YYYY-MM-DD")
    args = ap.parse_args()
    d = args.date

    sb = _sb()
    fails = 0

    # daily_snapshots row exists
    snap = (
        sb.table("daily_snapshots")
        .select("date,run_type,snapshot")
        .eq("date", d)
        .limit(1)
        .execute()
    )
    srows = getattr(snap, "data", None) or []
    if not srows:
        _fail(f"daily_snapshots missing for {d}")
        fails += 1
    else:
        if not isinstance(srows[0].get("snapshot"), dict):
            _fail(f"daily_snapshots.snapshot missing or not json for {d}")
            fails += 1
        else:
            _pass(f"daily_snapshots present for {d}")

    # digest document exists and has payload
    doc = (
        sb.table("documents")
        .select("date,document_key,payload")
        .eq("date", d)
        .eq("document_key", "digest")
        .limit(1)
        .execute()
    )
    drows = getattr(doc, "data", None) or []
    if not drows:
        _fail(f"documents missing digest for {d}")
        fails += 1
    else:
        if drows[0].get("payload") is None:
            _fail(f"documents.digest payload null for {d}")
            fails += 1
        else:
            _pass(f"documents.digest present for {d}")

    # positions: no zero-weight non-CASH
    pos = (
        sb.table("positions")
        .select("ticker,weight_pct")
        .eq("date", d)
        .neq("ticker", "CASH")
        .eq("weight_pct", 0)
        .execute()
    )
    prows = getattr(pos, "data", None) or []
    if prows:
        _fail(f"positions has {len(prows)} zero-weight non-CASH rows for {d}")
        fails += 1
    else:
        _pass("positions has no zero-weight non-CASH rows")

    # nav_history and portfolio_metrics: at least one row exists (we validate freshness elsewhere)
    nav = sb.table("nav_history").select("date").order("date", desc=True).limit(1).execute()
    if not (getattr(nav, "data", None) or []):
        _fail("nav_history empty")
        fails += 1
    else:
        _pass("nav_history non-empty")

    pm = sb.table("portfolio_metrics").select("date").order("date", desc=True).limit(1).execute()
    if not (getattr(pm, "data", None) or []):
        _fail("portfolio_metrics empty")
        fails += 1
    else:
        _pass("portfolio_metrics non-empty")

    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())

