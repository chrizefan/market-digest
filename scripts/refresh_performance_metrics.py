#!/usr/bin/env python3
"""
refresh_performance_metrics.py

Run after price_history (and optionally price_technicals) are updated for the day.
Uses Supabase price_history closes + positions snapshot rows to populate:

  - positions: unrealized_pnl_pct, day_change_pct, since_entry_return_pct,
    contribution_pct, metrics_as_of
  - position_events: cumulative_return_since_event_pct (where price exists)
  - nav_history: one indexed NAV point for the latest common trading date

Does not replace update_tearsheet.py NAV simulation history; it aligns end-of-day
metrics with stored closes so the dashboard matches market data.

Usage:
  python3 scripts/refresh_performance_metrics.py [--date YYYY-MM-DD]
Environment: SUPABASE_URL, SUPABASE_SERVICE_KEY (see config/supabase.env)
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

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


def _fetch_closes(sb, ticker: str, dates: List[str]) -> Dict[str, float]:
    """date -> close for ticker for given ISO dates (best effort)."""
    if not dates:
        return {}
    res = (
        sb.table("price_history")
        .select("date, close")
        .eq("ticker", ticker)
        .in_("date", dates)
        .execute()
    )
    out: Dict[str, float] = {}
    for row in getattr(res, "data", None) or []:
        d = row.get("date")
        c = row.get("close")
        if d and c is not None:
            out[str(d)[:10]] = float(c)
    return out


def _prev_trading_date(sb, ref_ticker: str, as_of: str) -> Optional[str]:
    """Latest price_history date strictly before as_of for ref_ticker."""
    res = (
        sb.table("price_history")
        .select("date")
        .eq("ticker", ref_ticker)
        .lt("date", as_of)
        .order("date", desc=True)
        .limit(1)
        .execute()
    )
    data = getattr(res, "data", None) or []
    if not data:
        return None
    return str(data[0]["date"])[:10]


def refresh_positions_metrics(sb, metrics_date: str) -> int:
    """Update positions for date == metrics_date. Returns rows updated."""
    res = (
        sb.table("positions")
        .select("*")
        .eq("date", metrics_date)
        .execute()
    )
    rows: List[Dict[str, Any]] = getattr(res, "data", None) or []
    prev_d = _prev_trading_date(sb, "SPY", metrics_date)
    if not prev_d:
        print("⚠️  No prior trading day in price_history — skip day_change_pct")
    updated = 0
    for r in rows:
        t = r.get("ticker")
        if not t or t == "CASH":
            continue
        entry = r.get("entry_price")
        entry_dt = r.get("entry_date")
        w = float(r.get("weight_pct") or 0)
        dates_needed = [metrics_date]
        if prev_d:
            dates_needed.append(prev_d)
        if entry_dt:
            dates_needed.append(str(entry_dt)[:10])
        closes = _fetch_closes(sb, t, list(set(dates_needed)))
        c_now = closes.get(metrics_date)
        c_prev = closes.get(prev_d) if prev_d else None
        day_ch = None
        if c_now is not None and c_prev is not None and c_prev > 0:
            day_ch = (c_now - c_prev) / c_prev * 100.0
        unreal = None
        since = None
        if entry and c_now and float(entry) > 0:
            unreal = (c_now - float(entry)) / float(entry) * 100.0
        if entry_dt and c_now:
            ed = str(entry_dt)[:10]
            c_entry = closes.get(ed)
            if c_entry is None:
                c_entry_map = _fetch_closes(sb, t, [ed])
                c_entry = c_entry_map.get(ed)
            if c_entry and c_entry > 0:
                since = (c_now - c_entry) / c_entry * 100.0
        contrib = None
        if since is not None:
            contrib = w * (since / 100.0)
        patch = {
            "unrealized_pnl_pct": unreal,
            "day_change_pct": day_ch,
            "since_entry_return_pct": since,
            "contribution_pct": contrib,
            "metrics_as_of": metrics_date,
            "current_price": c_now if c_now is not None else r.get("current_price"),
        }
        sb.table("positions").update(patch).eq("date", metrics_date).eq("ticker", t).execute()
        updated += 1
    return updated


def refresh_event_cumulative(sb, as_of: str) -> int:
    """Fill cumulative_return_since_event_pct for recent events with prices."""
    cut = (datetime.strptime(as_of, "%Y-%m-%d").date() - timedelta(days=120)).isoformat()
    res = sb.table("position_events").select("*").gte("date", cut).lte("date", as_of).execute()
    events = getattr(res, "data", None) or []
    n = 0
    for ev in events:
        t = ev.get("ticker")
        if not t or t == "CASH":
            continue
        evd = str(ev.get("date"))[:10]
        cmap = _fetch_closes(sb, t, [evd, as_of])
        c0 = cmap.get(evd)
        c1 = cmap.get(as_of)
        if c0 and c1 and c0 > 0:
            pct = (c1 - c0) / c0 * 100.0
            sb.table("position_events").update({"cumulative_return_since_event_pct": pct}).eq("id", ev["id"]).execute()
            n += 1
    return n


def refresh_nav_point(sb, as_of: str) -> None:
    """Append/update indexed NAV for `as_of` using prior day weights and returns."""
    res = (
        sb.table("positions")
        .select("*")
        .eq("date", as_of)
        .execute()
    )
    pos_rows = getattr(res, "data", None) or []
    prev_d = _prev_trading_date(sb, "SPY", as_of)
    if not prev_d or not pos_rows:
        print("⚠️  NAV skip: no prior day or no positions for", as_of)
        return
    nav_res = (
        sb.table("nav_history")
        .select("date, nav")
        .lt("date", as_of)
        .order("date", desc=True)
        .limit(1)
        .execute()
    )
    nav_data = getattr(nav_res, "data", None) or []
    prev_nav = float(nav_data[0]["nav"]) if nav_data else 100.0
    dr = 0.0
    for r in pos_rows:
        t = r.get("ticker")
        if not t or t == "CASH":
            continue
        w = float(r.get("weight_pct") or 0) / 100.0
        c_prev_map = _fetch_closes(sb, t, [prev_d])
        c_now_map = _fetch_closes(sb, t, [as_of])
        p0 = c_prev_map.get(prev_d)
        p1 = c_now_map.get(as_of)
        if p0 and p1 and p0 > 0:
            dr += w * (p1 - p0) / p0
    new_nav = prev_nav * (1.0 + dr)
    ts = datetime.utcnow().isoformat() + "Z"
    sb.table("nav_history").upsert(
        {"date": as_of, "nav": round(new_nav, 6), "updated_at": ts},
        on_conflict="date",
    ).execute()
    print(f"✅ nav_history {as_of}: nav={new_nav:.4f} (prev={prev_nav:.4f})")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--date", help="Metrics date (YYYY-MM-DD); default: latest positions date")
    ap.add_argument("--supabase", action="store_true", help="Required flag for clarity")
    args = ap.parse_args()
    if not args.supabase:
        ap.error("Pass --supabase to run against Supabase")

    sb = _sb()
    if args.date:
        metrics_date = args.date
    else:
        r = sb.table("positions").select("date").order("date", desc=True).limit(1).execute()
        data = getattr(r, "data", None) or []
        if not data:
            print("No positions rows — nothing to do")
            sys.exit(0)
        metrics_date = str(data[0]["date"])[:10]

    print(f"📊 Refreshing performance metrics for {metrics_date}")
    u = refresh_positions_metrics(sb, metrics_date)
    print(f"   positions updated: {u}")
    e = refresh_event_cumulative(sb, metrics_date)
    print(f"   position_events cumulative filled: {e}")
    refresh_nav_point(sb, metrics_date)


if __name__ == "__main__":
    try:
        main()
    except Exception as ex:
        print(f"❌ {ex}", file=sys.stderr)
        sys.exit(1)
