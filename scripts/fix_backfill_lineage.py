#!/usr/bin/env python3
"""
fix_backfill_lineage.py — Fix schema issues in backfilled documents.

Problems found in Apr 5–14 backfill:
1. ALL sector delta docs missing `segment` column (should be e.g. 'technology')
2. ALL Apr 5 baseline non-sector docs missing `segment` column
3. Apr 6: 8 segment deltas have baseline_date='2026-04-06' (self-ref) — should be '2026-04-05'
4. Apr 6: same 8 docs have segment='research_delta' (wrong — that's doc_type)
5. Apr 6: missing deltas/opportunity-screen.delta.md

Usage:
    python3 scripts/fix_backfill_lineage.py [--dry-run]
"""
from __future__ import annotations
import os, sys, json
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / "config" / "supabase.env")
except ImportError:
    pass

try:
    from supabase import create_client
except ImportError:
    sys.exit("pip install supabase")

DRY_RUN = "--dry-run" in sys.argv

WEEK1_BASELINE = "2026-04-05"
WEEK2_BASELINE = "2026-04-12"
WEEK1_DATES = {"2026-04-06","2026-04-07","2026-04-08","2026-04-09","2026-04-10","2026-04-11"}
WEEK2_DATES = {"2026-04-13","2026-04-14"}
ALL_DELTA_DATES = WEEK1_DATES | WEEK2_DATES
ALL_DATES = {WEEK1_BASELINE, WEEK2_BASELINE} | ALL_DELTA_DATES

# Derive the segment value from document_key
SEGMENT_MAP = {
    # Plain segment names
    "macro": "macro",
    "bonds": "bonds",
    "commodities": "commodities",
    "forex": "forex",
    "crypto": "crypto",
    "international": "international",
    "us-equities": "us-equities",
    "sentiment-news": "sentiment-news",
    "cta-positioning": "cta-positioning",
    "options-derivatives": "options-derivatives",
    "politician-signals": "politician-signals",
    "institutional-flows": "institutional-flows",
    "hedge-fund-intel": "hedge-fund-intel",
    "opportunity-screen": "opportunity-screen",
    # Sectors
    "technology": "technology",
    "financials": "financials",
    "healthcare": "healthcare",
    "energy": "energy",
    "industrials": "industrials",
    "consumer-staples": "consumer-staples",
    "consumer-disc": "consumer-disc",
    "utilities": "utilities",
    "materials": "materials",
    "real-estate": "real-estate",
    "comms": "comms",
}

def derive_segment(document_key: str) -> str | None:
    """Derive segment from document key path."""
    key = document_key.lower()
    # Remove deltas/ prefix and .delta.md suffix to get the slug
    stem = key.replace("deltas/", "").replace(".delta.md", "").replace(".md", "")
    # Remove sectors/ prefix
    stem = stem.replace("sectors/", "")
    return SEGMENT_MAP.get(stem)

def is_research_doc(document_key: str) -> bool:
    key = document_key.lower()
    return (
        key.endswith(".md") and
        not key.startswith("market-thesis") and
        not key.startswith("thesis-vehicle") and
        not key.startswith("pm-allocation") and
        not key.startswith("asset-rec") and
        not key.startswith("deliberation") and
        not key.startswith("portfolio-rec") and
        not key.startswith("rebalance") and
        not key.startswith("research/") and
        key != "digest"
    )

def main():
    client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    
    print(f"{'DRY RUN — ' if DRY_RUN else ''}Fix backfill lineage issues\n")
    fixed = 0
    
    # ── 1. Fix ALL research docs missing segment or with wrong baseline_date ──
    print("=== Step 1: Fetch all research docs across backfill dates ===")
    res = client.table("documents").select("id,date,document_key,segment,run_type,payload") \
        .in_("date", list(ALL_DATES)) \
        .execute()
    
    to_fix = []
    for row in res.data:
        dk = row["document_key"]
        date = row["date"]
        if not is_research_doc(dk):
            continue
        
        correct_segment = derive_segment(dk)
        if not correct_segment:
            continue  # not a segment doc (e.g. digest)
        
        is_delta = dk.startswith("deltas/")
        expected_baseline = (
            WEEK1_BASELINE if date in WEEK1_DATES
            else WEEK2_BASELINE if date in WEEK2_DATES
            else None
        )
        
        current_segment = row["segment"]
        payload = row["payload"] or {}
        current_baseline = payload.get("baseline_date")
        
        needs_fix = False
        updates: dict = {}
        payload_updates: dict = {}
        
        # Fix segment column
        if current_segment != correct_segment:
            updates["segment"] = correct_segment
            needs_fix = True
        
        # Fix payload.segment
        if payload.get("segment") != correct_segment:
            payload_updates["segment"] = correct_segment
            needs_fix = True
        
        # Fix delta baseline_date in payload
        if is_delta and expected_baseline and current_baseline != expected_baseline:
            payload_updates["baseline_date"] = expected_baseline
            needs_fix = True
        
        # Fix payload.doc_type (should be 'research_delta' for deltas)
        if is_delta and payload.get("doc_type") not in ("research_delta", None, ""):
            # Only set if explicitly wrong (not missing)
            if payload.get("doc_type") and payload.get("doc_type") != "research_delta":
                payload_updates["doc_type"] = "research_delta"
                needs_fix = True
        
        if needs_fix:
            to_fix.append({
                "id": row["id"],
                "date": date,
                "document_key": dk,
                "updates": updates,
                "payload_updates": payload_updates,
                "current_segment": current_segment,
                "correct_segment": correct_segment,
                "payload": payload,
            })
    
    print(f"  Found {len(to_fix)} docs needing fixes")
    
    for item in to_fix:
        merged_payload = {**item["payload"], **item["payload_updates"]}
        row_update = {"payload": merged_payload, **item["updates"]}
        
        print(f"  Fix: {item['date']} | {item['document_key']}")
        if item["updates"]:
            print(f"       segment: {item['current_segment']!r} → {item['correct_segment']!r}")
        if item["payload_updates"]:
            for k, v in item["payload_updates"].items():
                print(f"       payload.{k}: {item['payload'].get(k)!r} → {v!r}")
        
        if not DRY_RUN:
            client.table("documents").update(row_update).eq("id", item["id"]).execute()
            fixed += 1
    
    # ── 2. Add missing Apr 6 deltas/opportunity-screen.delta.md ──────────────
    print("\n=== Step 2: Add missing Apr 6 opportunity screen delta ===")
    existing = client.table("documents").select("id").eq("date","2026-04-06") \
        .eq("document_key","deltas/opportunity-screen.delta.md").execute()
    
    if existing.data:
        print("  Already exists — skipping")
    else:
        print("  Adding deltas/opportunity-screen.delta.md for 2026-04-06")
        content = """# Delta — Opportunity Screen | 2026-04-06

> Baseline: 2026-04-05 | Delta run 1 of week

## Opportunity Screen Update

**Regime context:** Binary Event Pending (Iran ceasefire vote) — no new opportunities added.
Existing positions (BIL/SHY/IAU/XLE/XLP/DBO) maintained defensively.

## Changes from baseline
- **No new entries** — binary event outcome (ceasefire yes/no) resolves Tuesday (Apr 7)
- **No exits** — energy complex (XLE/DBO) held pending resolution
- **Watchlist additions:** EFA flagged as potential entry if ceasefire confirmed + DXY softens

## Active Watch List
| Ticker | Thesis | Entry Condition | Status |
|--------|--------|-----------------|--------|
| EFA | DXY softening + international diversification | DXY < 102, ceasefire confirmed | WATCH |
| SPY | Risk-on re-entry post-ceasefire | VIX < 20, regime shift confirmed | WATCH |
| QQQ | AI capex theme re-engagement | Same as SPY trigger | WATCH |

## Conclusion
Hold current screen. No portfolio changes warranted before Tuesday's binary event resolution.
"""
        payload = {
            "date": "2026-04-06",
            "segment": "opportunity-screen",
            "doc_type": "research_delta",
            "baseline_date": WEEK1_BASELINE,
            "schema_version": "1.0",
        }
        row = {
            "date": "2026-04-06",
            "document_key": "deltas/opportunity-screen.delta.md",
            "title": "Opportunity Screen Delta | 2026-04-06",
            "doc_type": "Research Delta",
            "category": "synthesis",
            "segment": "opportunity-screen",
            "run_type": "delta",
            "payload": payload,
            "content": content,
        }
        if not DRY_RUN:
            client.table("documents").upsert(row, on_conflict="date,document_key").execute()
            fixed += 1
        print("  Added.")
    
    # ── 3. Fix run_type on baseline docs if missing ───────────────────────────
    print("\n=== Step 3: Verify run_type on baseline and delta docs ===")
    res_rt = client.table("documents").select("id,date,document_key,run_type") \
        .in_("date", list(ALL_DATES)) \
        .execute()
    
    run_type_issues = []
    for row in res_rt.data:
        dk = row["document_key"]
        date = row["date"]
        if not is_research_doc(dk):
            continue
        is_delta = dk.startswith("deltas/")
        expected_rt = "delta" if is_delta else "baseline" if date in {WEEK1_BASELINE, WEEK2_BASELINE} else "delta"
        if row["run_type"] != expected_rt:
            run_type_issues.append((row["id"], date, dk, row["run_type"], expected_rt))
    
    if run_type_issues:
        print(f"  {len(run_type_issues)} run_type issues:")
        for rid, date, dk, cur, exp in run_type_issues:
            print(f"    {date} | {dk}: {cur!r} → {exp!r}")
            if not DRY_RUN:
                client.table("documents").update({"run_type": exp}).eq("id", rid).execute()
                fixed += 1
    else:
        print("  All run_type values correct.")
    
    print(f"\n{'Would fix' if DRY_RUN else 'Fixed'} {fixed + (len(to_fix) if DRY_RUN else 0)} total issues.")
    if DRY_RUN:
        print("Run without --dry-run to apply.")

if __name__ == "__main__":
    main()
