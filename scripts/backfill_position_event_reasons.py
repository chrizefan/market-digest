#!/usr/bin/env python3
"""
Fill missing `position_events.reason` from `rebalance_decision` documents
(`rebalance_table[].rationale` matched by ticker).

For each ledger row’s execution date, resolves the rebalance payload the same way
as `execute_at_open.py`: same-day `documents.date`, then prior trading days (up to 8).

Usage:
  python3 scripts/backfill_position_event_reasons.py --dry-run
  python3 scripts/backfill_position_event_reasons.py
  python3 scripts/backfill_position_event_reasons.py --force   # overwrite non-empty reason too
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv  # type: ignore

    load_dotenv(Path(__file__).parent.parent / "config" / "supabase.env")
    load_dotenv()
except ImportError:
    pass

# Reuse document fetch + calendar helpers from execute_at_open
sys.path.insert(0, str(Path(__file__).resolve().parent))
import execute_at_open as eat  # noqa: E402


def _rationale_from_payload(payload: Dict[str, Any], ticker: str) -> Optional[str]:
    body = payload.get("body") if isinstance(payload.get("body"), dict) else {}
    table = body.get("rebalance_table")
    if not isinstance(table, list):
        return None
    for row in table:
        if not isinstance(row, dict):
            continue
        if row.get("ticker") != ticker:
            continue
        r = row.get("rationale")
        if isinstance(r, str) and r.strip():
            return r.strip()
    return None


def _resolve_rebalance_doc_date(sb, execution_d: str) -> Optional[str]:
    if eat._rebalance_payload_for_date(sb, execution_d):
        return execution_d
    d = execution_d
    for _ in range(8):
        pd = eat._prior_trading_date(d)
        if not pd or pd == d:
            break
        if eat._rebalance_payload_for_date(sb, pd):
            return pd
        d = pd
    return None


def _needs_reason(reason: Any, force: bool) -> bool:
    if force:
        return True
    if reason is None:
        return True
    if isinstance(reason, str) and not reason.strip():
        return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser(description="Backfill position_events.reason from rebalance_decision.")
    ap.add_argument("--dry-run", action="store_true", help="Print counts only; no DB writes.")
    ap.add_argument(
        "--force",
        action="store_true",
        help="Also refresh rows that already have a non-empty reason.",
    )
    ap.add_argument("--limit", type=int, default=0, help="Max rows to update (0 = no cap).")
    args = ap.parse_args()

    sb = eat._sb()
    applied = 0
    would_apply = 0
    skipped_no_doc = 0
    skipped_no_rationale = 0
    examined = 0

    start = 0
    page = 800
    while True:
        res = (
            sb.table("position_events")
            .select("id,date,ticker,reason")
            .order("date", desc=True)
            .range(start, start + page - 1)
            .execute()
        )
        rows: List[Dict[str, Any]] = getattr(res, "data", None) or []
        if not rows:
            break

        for row in rows:
            examined += 1
            rid = row.get("id")
            d = row.get("date")
            ticker = row.get("ticker")
            reason = row.get("reason")
            if not rid or not d or not ticker:
                continue
            if not _needs_reason(reason, args.force):
                continue

            doc_date = _resolve_rebalance_doc_date(sb, str(d))
            if not doc_date:
                skipped_no_doc += 1
                continue
            payload = eat._rebalance_payload_for_date(sb, doc_date)
            if not isinstance(payload, dict):
                skipped_no_doc += 1
                continue
            rationale = _rationale_from_payload(payload, str(ticker))
            if not rationale:
                skipped_no_rationale += 1
                continue

            if args.dry_run:
                would_apply += 1
            else:
                sb.table("position_events").update({"reason": rationale}).eq("id", rid).execute()
                applied += 1

            if args.limit and (would_apply if args.dry_run else applied) >= args.limit:
                print(
                    f"Done (limit {args.limit}): examined={examined} "
                    f"would_apply={would_apply} applied={applied} "
                    f"no_doc={skipped_no_doc} no_rationale={skipped_no_rationale}"
                )
                return 0

        if len(rows) < page:
            break
        start += page

    print(
        f"✅ backfill_position_event_reasons{' (dry-run)' if args.dry_run else ''}: examined={examined} "
        f"would_apply={would_apply} applied={applied} "
        f"no_rebalance_doc={skipped_no_doc} no_rationale_in_table={skipped_no_rationale}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
