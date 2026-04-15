#!/usr/bin/env python3
"""
One-time repair: normalize all historical artifacts for 2026-04-05 through 2026-04-14
to match the Apr 15 benchmark format.

Phases:
  1. DELETE junk / superseded documents
  2. RENAME document_keys (old paths → canonical paths)
  3. FIX doc_types (wrong / null → correct)
  4. FIX titles (verbose → canonical)
  5. FIX run_types (null → correct)

Run with: python3.12 scripts/repair_historical_artifacts.py
"""

import os, sys

# ── env ───────────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv("config/supabase.env")
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.environ.get("SUPABASE_SERVICE_KEY", "")
    or os.environ.get("SUPABASE_ANON_KEY", "")
)

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in config/supabase.env")

try:
    from supabase import create_client
except ImportError:
    sys.exit("ERROR: supabase-py not installed. Run: python3.12 -m pip install supabase --break-system-packages")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

CUTOFF = "2026-04-15"  # Only touch rows strictly before this date

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def section(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


def delete_by_key(key: str):
    res = sb.table("documents").delete().eq("document_key", key).lt("date", CUTOFF).execute()
    n = len(res.data) if res.data else 0
    print(f"  DEL [{n:2d}]  {key}")


def rename_key(old_key: str, new_key: str, new_title: str | None = None, new_doc_type: str | None = None):
    """
    Rename document_key for all rows matching old_key (before cutoff).
    Fetches rows first to update by id, avoiding unique-constraint issues.
    Skips rows where new_key already exists for the same date.
    """
    rows = (
        sb.table("documents")
        .select("id,date,document_key,title,doc_type")
        .eq("document_key", old_key)
        .lt("date", CUTOFF)
        .execute()
        .data
    )
    if not rows:
        print(f"  SKIP (none)  {old_key}")
        return

    for row in rows:
        # Check for collision on new key+date
        exists = (
            sb.table("documents")
            .select("id")
            .eq("document_key", new_key)
            .eq("date", row["date"])
            .execute()
            .data
        )
        if exists:
            print(f"  SKIP (collision {row['date']})  {old_key} → {new_key}")
            continue

        patch: dict = {"document_key": new_key}
        if new_title is not None:
            patch["title"] = new_title
        if new_doc_type is not None:
            patch["doc_type"] = new_doc_type

        sb.table("documents").update(patch).eq("id", row["id"]).execute()
        print(f"  RENAME  {old_key} → {new_key}  [{row['date']}]")


def rename_key_per_row(old_key_prefix: str, build_new_key, build_title=None, new_doc_type=None):
    """
    For keys where the new path requires per-row values (e.g. injecting the date).
    build_new_key(row) and build_title(row) are callables.
    """
    rows = (
        sb.table("documents")
        .select("id,date,document_key,title,doc_type")
        .like("document_key", f"{old_key_prefix}%")
        .lt("date", CUTOFF)
        .execute()
        .data
    )
    if not rows:
        print(f"  SKIP (none)  {old_key_prefix}*")
        return

    for row in rows:
        new_key = build_new_key(row)
        new_title = build_title(row) if build_title else None

        exists = (
            sb.table("documents")
            .select("id")
            .eq("document_key", new_key)
            .eq("date", row["date"])
            .execute()
            .data
        )
        if exists:
            print(f"  SKIP (collision {row['date']})  {row['document_key']} → {new_key}")
            continue

        patch: dict = {"document_key": new_key}
        if new_title is not None:
            patch["title"] = new_title
        if new_doc_type is not None:
            patch["doc_type"] = new_doc_type

        sb.table("documents").update(patch).eq("id", row["id"]).execute()
        print(f"  RENAME  {row['document_key']} → {new_key}  [{row['date']}]")


def update_where(filters: dict, patch: dict, label: str):
    """Apply a patch to all rows matching filters (all values ANDed)."""
    q = sb.table("documents").update(patch)
    for k, v in filters.items():
        if k == "_lt_date":
            q = q.lt("date", v)
        elif k == "_like":
            q = q.like("document_key", v)
        else:
            q = q.eq(k, v)
    res = q.execute()
    n = len(res.data) if res.data else 0
    print(f"  UPD [{n:2d}]  {label}")


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: DELETE junk / superseded artifacts
# ─────────────────────────────────────────────────────────────────────────────

def phase1_delete():
    section("PHASE 1 — Delete junk / superseded artifacts")

    # Machine request blobs
    delete_by_key("delta-request.json")

    # Old rebalance decision blobs (no content, not in Apr 15 model)
    delete_by_key("rebalance-decision.json")
    delete_by_key("rebalance-decision.md")

    # Old aggregate deliberation markdown (replaced by per-ticker transcripts)
    delete_by_key("deliberation.md")

    # Old portfolio output blobs
    delete_by_key("portfolio-recommended.md")

    # opportunity-screen.md is the old flat path; opportunity-screen/{DATE}.json is the canonical form.
    # The .md flat version predates the canonical key and should be removed.
    delete_by_key("opportunity-screen.md")

    # deltas/opportunity-screen.delta.md — wrong path for this artifact type
    delete_by_key("deltas/opportunity-screen.delta.md")

    # Apr 6 orphans
    delete_by_key("digest-delta")
    delete_by_key("deltas/alt-data.delta.md")

    # Apr 5 position analysis files (superseded by asset-recommendations)
    for ticker in ["BIL", "DBO", "IAU", "ITA", "SHY", "XLE", "XLP", "XLV"]:
        delete_by_key(f"positions/{ticker}.md")

    # Apr 5 duplicate institutional flat file
    delete_by_key("institutional.md")

    # Apr 6 deep-dives .md duplicates (the .json versions are kept)
    delete_by_key("deep-dives/2026-04-06-DXY-Sub-100-Dollar-Regime.md")
    delete_by_key("deep-dives/2026-04-06-Iran-Ceasefire-Binary-Event.md")

    # Alt data flat-root file on Apr 5 (individual alt docs already exist)
    delete_by_key("alt-data.md")


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: RENAME document_keys to canonical paths
# ─────────────────────────────────────────────────────────────────────────────

def phase2_rename():
    section("PHASE 2 — Rename document_keys to canonical paths")

    # ── Alt data: flat deltas/ → deltas/alt/ ─────────────────────────────────
    print("\n  [Alt data — delta dates]")
    rename_key("deltas/sentiment-news.delta.md",     "deltas/alt/sentiment.delta.md",            "Sentiment",            "Research Delta")
    rename_key("deltas/cta-positioning.delta.md",    "deltas/alt/cta-positioning.delta.md",      "CTA Positioning",      "Research Delta")
    rename_key("deltas/hedge-fund-intel.delta.md",   "deltas/alt/hedge-fund-intel.delta.md",     "Hedge Fund Intel",     "Research Delta")
    rename_key("deltas/institutional-flows.delta.md","deltas/alt/institutional-flows.delta.md",  "Institutional Flows",  "Research Delta")
    rename_key("deltas/options-derivatives.delta.md","deltas/alt/options-derivatives.delta.md",  "Options & Derivatives","Research Delta")
    rename_key("deltas/politician-signals.delta.md", "deltas/alt/political-signals.delta.md",    "Political Signals",    "Research Delta")

    # ── Sectors: abbreviated slugs → full canonical names ────────────────────
    print("\n  [Sectors — abbreviated slugs]")
    rename_key("deltas/sectors/comms.delta.md",         "deltas/sectors/communication-services.delta.md", "Communication Services", "Research Delta")
    rename_key("deltas/sectors/consumer-disc.delta.md", "deltas/sectors/consumer-discretionary.delta.md", "Consumer Discretionary",  "Research Delta")

    # ── Asset recommendations: asset-rec/{TICKER}.json → asset-recommendations/{DATE}/{TICKER}.json ──
    print("\n  [Asset recommendations — inject date into path]")

    def build_asset_key(row):
        filename = row["document_key"].replace("asset-rec/", "")   # e.g. "BIL.json"
        return f"asset-recommendations/{row['date']}/{filename}"

    def build_asset_title(row):
        filename = row["document_key"].replace("asset-rec/", "")
        return filename.replace(".json", "")  # e.g. "BIL"

    rename_key_per_row(
        "asset-rec/",
        build_new_key=build_asset_key,
        build_title=build_asset_title,
        new_doc_type="Asset Recommendation",
    )

    # ── Baseline flat paths (Apr 5 and Apr 12): no deltas/ prefix ────────────
    print("\n  [Baseline flat paths → deltas/ prefix]")

    flat_research = [
        ("bonds.md",        "deltas/bonds.delta.md",        "Bonds"),
        ("commodities.md",  "deltas/commodities.delta.md",  "Commodities"),
        ("crypto.md",       "deltas/crypto.delta.md",       "Crypto"),
        ("forex.md",        "deltas/forex.delta.md",        "Forex"),
        ("international.md","deltas/international.delta.md","International"),
        ("macro.md",        "deltas/macro.delta.md",        "Macro"),
        ("us-equities.md",  "deltas/us-equities.delta.md",  "US Equities"),
        # Alt data flat (baseline names without deltas/ prefix)
        ("cta-positioning.md",    "deltas/alt/cta-positioning.delta.md",      "CTA Positioning"),
        ("hedge-fund-intel.md",   "deltas/alt/hedge-fund-intel.delta.md",     "Hedge Fund Intel"),
        ("institutional-flows.md","deltas/alt/institutional-flows.delta.md",  "Institutional Flows"),
        ("options-derivatives.md","deltas/alt/options-derivatives.delta.md",  "Options & Derivatives"),
        ("politician-signals.md", "deltas/alt/political-signals.delta.md",    "Political Signals"),
        ("sentiment-news.md",     "deltas/alt/sentiment.delta.md",            "Sentiment"),
    ]
    for old, new, title in flat_research:
        rename_key(old, new, title, "Research Delta")

    # ── Baseline sector flat paths: sectors/*.md → deltas/sectors/*.delta.md ─
    print("\n  [Baseline sector paths → deltas/sectors/]")

    flat_sectors = [
        ("sectors/comms.md",           "deltas/sectors/communication-services.delta.md", "Communication Services"),
        ("sectors/consumer-disc.md",   "deltas/sectors/consumer-discretionary.delta.md", "Consumer Discretionary"),
        ("sectors/consumer-staples.md","deltas/sectors/consumer-staples.delta.md",       "Consumer Staples"),
        ("sectors/energy.md",          "deltas/sectors/energy.delta.md",                 "Energy"),
        ("sectors/financials.md",      "deltas/sectors/financials.delta.md",             "Financials"),
        ("sectors/healthcare.md",      "deltas/sectors/healthcare.delta.md",             "Health Care"),
        ("sectors/industrials.md",     "deltas/sectors/industrials.delta.md",            "Industrials"),
        ("sectors/materials.md",       "deltas/sectors/materials.delta.md",              "Materials"),
        ("sectors/real-estate.md",     "deltas/sectors/real-estate.delta.md",            "Real Estate"),
        ("sectors/technology.md",      "deltas/sectors/technology.delta.md",             "Technology"),
        ("sectors/utilities.md",       "deltas/sectors/utilities.delta.md",              "Utilities"),
    ]
    for old, new, title in flat_sectors:
        rename_key(old, new, title, "Research Delta")


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: FIX doc_types
# ─────────────────────────────────────────────────────────────────────────────

def phase3_doctypes():
    section("PHASE 3 — Fix doc_types")

    rows = (
        sb.table("documents")
        .select("id,document_key,doc_type,date")
        .lt("date", CUTOFF)
        .execute()
        .data
    )

    fixes = {
        "deliberation-transcript-index/": ("Daily Digest", "Deliberation Session Index"),
        "market-thesis-exploration/":     (None,           "Market Thesis Exploration"),
        "thesis-vehicle-map/":            (None,           "Thesis Vehicle Map"),
        "pm-allocation-memo/":            (None,           "PM Allocation Memo"),
        "opportunity-screen/":            (None,           "Opportunity Screen"),
        # deliberation-transcript rows sometimes stored as Daily Digest early on
        "deliberation-transcript/":       ("Daily Digest", "Deliberation Transcript"),
    }

    changed = 0
    for row in rows:
        key: str = row["document_key"]
        current: str | None = row["doc_type"]

        for prefix, (expected_current, correct) in fixes.items():
            if key.startswith(prefix):
                if expected_current is None or current == expected_current:
                    if current != correct:
                        sb.table("documents").update({"doc_type": correct}).eq("id", row["id"]).execute()
                        print(f"  FIX doc_type  [{row['date']}]  {key}  →  {correct}")
                        changed += 1
                break

    print(f"\n  Total doc_type fixes: {changed}")


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4: FIX titles
# ─────────────────────────────────────────────────────────────────────────────

def phase4_titles():
    section("PHASE 4 — Fix titles to canonical names (no dates, no suffixes)")

    rows = (
        sb.table("documents")
        .select("id,document_key,title,date")
        .lt("date", CUTOFF)
        .execute()
        .data
    )

    # Static titles: document_key prefix → canonical title
    static_titles: dict[str, str] = {
        "market-thesis-exploration/": "Thesis Exploration",
        "thesis-vehicle-map/":        "Thesis Vehicle Map",
        "pm-allocation-memo/":        "PM Allocation Memo",
        "opportunity-screen/":        "Opportunity Screener",
    }

    # Delta research segments: canonical title lookup by key
    research_canonical: dict[str, str] = {
        "deltas/macro.delta.md":                              "Macro",
        "deltas/us-equities.delta.md":                       "US Equities",
        "deltas/bonds.delta.md":                             "Bonds",
        "deltas/commodities.delta.md":                       "Commodities",
        "deltas/forex.delta.md":                             "Forex",
        "deltas/crypto.delta.md":                            "Crypto",
        "deltas/international.delta.md":                     "International",
        "deltas/alt/sentiment.delta.md":                     "Sentiment",
        "deltas/alt/cta-positioning.delta.md":               "CTA Positioning",
        "deltas/alt/hedge-fund-intel.delta.md":              "Hedge Fund Intel",
        "deltas/alt/institutional-flows.delta.md":           "Institutional Flows",
        "deltas/alt/options-derivatives.delta.md":           "Options & Derivatives",
        "deltas/alt/political-signals.delta.md":             "Political Signals",
        "deltas/sectors/communication-services.delta.md":    "Communication Services",
        "deltas/sectors/consumer-discretionary.delta.md":    "Consumer Discretionary",
        "deltas/sectors/consumer-staples.delta.md":          "Consumer Staples",
        "deltas/sectors/energy.delta.md":                    "Energy",
        "deltas/sectors/financials.delta.md":                "Financials",
        "deltas/sectors/healthcare.delta.md":                "Health Care",
        "deltas/sectors/industrials.delta.md":               "Industrials",
        "deltas/sectors/materials.delta.md":                 "Materials",
        "deltas/sectors/real-estate.delta.md":               "Real Estate",
        "deltas/sectors/technology.delta.md":                "Technology",
        "deltas/sectors/utilities.delta.md":                 "Utilities",
    }

    changed = 0
    for row in rows:
        key: str = row["document_key"]
        current_title: str = row.get("title") or ""
        new_title: str | None = None

        # Static prefix → title
        for prefix, canonical in static_titles.items():
            if key.startswith(prefix):
                if current_title != canonical:
                    new_title = canonical
                break

        # Exact research segment key → canonical title
        if new_title is None and key in research_canonical:
            canonical = research_canonical[key]
            if current_title != canonical:
                new_title = canonical

        # Deliberation transcript: "Deliberation — {TICKER} — DATE" → "{TICKER}"
        if new_title is None and key.startswith("deliberation-transcript/") and "/" in key[len("deliberation-transcript/"):]:
            ticker_json = key.split("/")[-1]
            ticker = ticker_json.replace(".json", "")
            if current_title != ticker:
                new_title = ticker

        # Deliberation transcript index: "Deliberation Index — DATE" → "Deliberation Session Index — DATE"
        if new_title is None and key.startswith("deliberation-transcript-index/"):
            date_part = row["date"]
            canonical = f"Deliberation Session Index — {date_part}"
            if current_title != canonical:
                new_title = canonical

        # Asset recommendations: "Asset Rec — {TICKER} — DATE" / "Asset Recommendation — {TICKER} — DATE" → "{TICKER}"
        if new_title is None and key.startswith("asset-recommendations/"):
            ticker_json = key.split("/")[-1]
            ticker = ticker_json.replace(".json", "")
            if current_title != ticker:
                new_title = ticker

        if new_title is not None:
            sb.table("documents").update({"title": new_title}).eq("id", row["id"]).execute()
            print(f"  FIX title  [{row['date']}]  {key}")
            print(f"             '{current_title}'  →  '{new_title}'")
            changed += 1

    print(f"\n  Total title fixes: {changed}")


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 5: FIX run_types
# ─────────────────────────────────────────────────────────────────────────────

def phase5_run_types():
    section("PHASE 5 — Fix run_types (null → correct)")

    rows = (
        sb.table("documents")
        .select("id,document_key,run_type,date")
        .lt("date", CUTOFF)
        .is_("run_type", "null")
        .execute()
        .data
    )

    # Baseline dates keep run_type = 'baseline'
    baseline_dates = {"2026-04-05", "2026-04-12"}

    changed = 0
    for row in rows:
        correct = "baseline" if row["date"] in baseline_dates else "delta"
        sb.table("documents").update({"run_type": correct}).eq("id", row["id"]).execute()
        print(f"  FIX run_type  [{row['date']}]  {row['document_key']}  →  {correct}")
        changed += 1

    print(f"\n  Total run_type fixes: {changed}")


# ─────────────────────────────────────────────────────────────────────────────
# VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

def verify():
    section("VERIFICATION — Final counts per date")

    rows = (
        sb.table("documents")
        .select("date,document_key,title,doc_type,run_type")
        .lt("date", CUTOFF)
        .order("date", desc=True)
        .order("document_key")
        .execute()
        .data
    )

    # Group by date
    from collections import defaultdict
    by_date: dict[str, list] = defaultdict(list)
    for r in rows:
        by_date[r["date"]].append(r)

    null_doctypes = []
    null_runtypes = []
    legacy_keys = []

    # Only flag paths that are genuinely non-canonical.
    # Note: "sectors/" would match inside canonical "deltas/sectors/" — use
    # a dedicated check instead to avoid false positives.
    legacy_patterns = [
        "asset-rec/",
        "positions/",
        "delta-request",
        "rebalance-decision",
        "deliberation.md",
        "portfolio-recommended",
        "opportunity-screen.md",
        "digest-delta",
        "alt-data.md",
        "deltas/sentiment-news",
        "deltas/cta-positioning.",
        "deltas/hedge-fund-intel.",
        "deltas/institutional-flows.",
        "deltas/options-derivatives.",
        "deltas/politician-signals.",
        "deltas/sectors/comms.",
        "deltas/sectors/consumer-disc.",
        "deltas/opportunity-screen.",
    ]
    # Flat "sectors/" path (not under "deltas/") is legacy
    def is_legacy(key: str) -> bool:
        if any(pat in key for pat in legacy_patterns):
            return True
        if key.startswith("sectors/"):
            return True
        return False

    for d, docs in sorted(by_date.items()):
        print(f"\n  {d}  ({len(docs)} docs)")
        for r in docs:
            key = r["document_key"]
            issues = []
            if not r["doc_type"]:
                issues.append("no doc_type")
                null_doctypes.append(f"{d}/{key}")
            if not r["run_type"]:
                issues.append("no run_type")
                null_runtypes.append(f"{d}/{key}")
            if is_legacy(key):
                issues.append("LEGACY KEY")
                legacy_keys.append(f"{d}/{key}")
            suffix = f"  !! {', '.join(issues)}" if issues else ""
            print(f"    {key}  |  {r['doc_type'] or '—'}  |  {r['run_type'] or '—'}{suffix}")

    print(f"\n{'─' * 60}")
    print(f"  Remaining null doc_types:  {len(null_doctypes)}")
    print(f"  Remaining null run_types:  {len(null_runtypes)}")
    print(f"  Remaining legacy keys:     {len(legacy_keys)}")
    if legacy_keys:
        print("\n  Legacy keys still present:")
        for k in legacy_keys:
            print(f"    {k}")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Historical Artifact Repair: 2026-04-05 through 2026-04-14 ===")
    print(f"    Supabase: {SUPABASE_URL[:40]}...")

    phase1_delete()
    phase2_rename()
    phase3_doctypes()
    phase4_titles()
    phase5_run_types()
    verify()

    print("\n=== Done ===\n")


if __name__ == "__main__":
    main()
