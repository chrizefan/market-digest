#!/usr/bin/env python3
"""
repair_apr15_artifacts.py

One-shot repair for the 2026-04-15 Supabase artifacts to conform to the
canonical schemas defined in templates/schemas/.

Changes applied:
  1. 7 deliberation transcripts → add top-level schema_version/doc_type/date,
     convert rounds to {label, sections[]}, trigger_summary to array,
     thesis_updates to {status}, strip 'action' from final_decisions.
  2. Deliberation session index → add top-level fields, strip non-schema
     entry fields, add rounds_completed, clean meta.
  3. Digest snapshot → strip 'portfolio' (Track A is research-only).
     Also updates daily_snapshots.snapshot for the same date.
  4. Per-segment delta docs → publish one document per research segment
     (deltas/macro.delta.md, etc.) using the mid-session research_delta content.

Run:
  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python3 scripts/repair_apr15_artifacts.py
  or (if config/supabase.env exists):
  python3 scripts/repair_apr15_artifacts.py
"""

import json
import os
import sys
from copy import deepcopy
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / "config" / "supabase.env")
    load_dotenv()
except ImportError:
    pass

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase", file=sys.stderr)
    sys.exit(1)

DATE = "2026-04-15"
BASELINE_DATE = "2026-04-12"
SESSION_ID = "2026-04-15-pm"

# ─────────────────────────────────────────────────────────────────────────────
# Supabase client
# ─────────────────────────────────────────────────────────────────────────────

def _sb():
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.", file=sys.stderr)
        sys.exit(1)
    return create_client(url, key)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _update_payload(sb, row_id: str, new_payload: dict, content: str | None = None) -> None:
    upd = {"payload": new_payload}
    if content is not None:
        upd["content"] = content
    sb.table("documents").update(upd).eq("id", row_id).execute()
    print(f"  ✓ Updated {row_id}")


def _upsert_document(sb, row: dict) -> None:
    sb.table("documents").upsert(row, on_conflict="document_key,date").execute()
    print(f"  ✓ Upserted {row['document_key']}")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Fix deliberation transcripts
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_rounds(rounds: list) -> list:
    """Convert {pm, analyst, round} format → {label, sections[{heading, markdown}]}."""
    out = []
    for r in rounds:
        if isinstance(r, dict):
            if "label" in r or "sections" in r:
                # Already canonical — keep as-is
                out.append(r)
            else:
                # Legacy chat format
                rnum = r.get("round", len(out) + 1)
                sections = []
                if r.get("analyst"):
                    sections.append({"heading": "Analyst", "markdown": r["analyst"]})
                if r.get("pm"):
                    sections.append({"heading": "PM", "markdown": r["pm"]})
                out.append({"label": f"Round {rnum}", "sections": sections})
    return out


def _normalize_trigger_summary(ts) -> list:
    """Ensure trigger_summary is a list of strings."""
    if isinstance(ts, list):
        return [str(x) for x in ts if x]
    if isinstance(ts, str) and ts.strip():
        return [ts.strip()]
    return []


def _normalize_thesis_updates(updates: list) -> list:
    """Convert {prior_status, updated_status} → {status}. Keep thesis_id and note."""
    out = []
    for u in updates:
        if not isinstance(u, dict):
            continue
        nu = {
            "thesis_id": u.get("thesis_id", ""),
            "status": u.get("status") or u.get("updated_status") or u.get("prior_status") or "active",
            "note": u.get("note", ""),
        }
        out.append(nu)
    return out


def _strip_action_from_final_decisions(decisions: list) -> list:
    """Remove 'action' field (not in schema) from final_decisions entries."""
    allowed = {"ticker", "analyst_recommendation", "pm_decision", "invalidation_condition"}
    return [{k: v for k, v in d.items() if k in allowed} for d in decisions if isinstance(d, dict)]


def fix_deliberation_transcripts(sb) -> None:
    print("\n=== 1. Fixing deliberation transcripts ===")
    rows = (
        sb.table("documents")
        .select("id, document_key, payload")
        .eq("date", DATE)
        .like("document_key", "deliberation-transcript/2026-04-15/%")
        .execute()
    ).data or []

    for row in rows:
        doc_key = row["document_key"]
        pl = row.get("payload") or {}
        body = pl.get("body") or {}
        meta = pl.get("meta") or {}

        ticker = doc_key.split("/")[-1].replace(".json", "")
        print(f"\n  [{ticker}]")

        # Build canonical payload
        new_payload = {
            "schema_version": "1.0",
            "doc_type": "deliberation_transcript",
            "date": DATE,
            "meta": {
                "kind": meta.get("kind", "delta_scoped"),
                "session_id": meta.get("session_id", SESSION_ID),
                "converged": meta.get("converged", True),
                "related_ticker": ticker,
                "aggregate_index_document_key": f"deliberation-transcript-index/{DATE}.json",
            },
            "body": {
                "trigger_summary": _normalize_trigger_summary(body.get("trigger_summary")),
                "rounds": _normalize_rounds(body.get("rounds") or []),
                "final_decisions": _strip_action_from_final_decisions(body.get("final_decisions") or []),
                "thesis_updates": _normalize_thesis_updates(body.get("thesis_updates") or []),
            },
        }
        if body.get("footer_notes"):
            new_payload["body"]["footer_notes"] = body["footer_notes"]
        if meta.get("delta_number") is not None:
            new_payload["meta"]["delta_number"] = meta["delta_number"]

        _update_payload(sb, row["id"], new_payload)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Fix deliberation session index
# ─────────────────────────────────────────────────────────────────────────────

def fix_session_index(sb) -> None:
    print("\n=== 2. Fixing deliberation session index ===")
    rows = (
        sb.table("documents")
        .select("id, document_key, payload")
        .eq("date", DATE)
        .eq("document_key", f"deliberation-transcript-index/{DATE}.json")
        .execute()
    ).data or []

    if not rows:
        print("  ! Session index not found — skipping.")
        return

    row = rows[0]
    pl = row.get("payload") or {}
    body = pl.get("body") or {}
    meta = pl.get("meta") or {}

    raw_entries = body.get("entries") or []
    allowed_entry_keys = {"ticker", "document_key", "converged", "rounds_completed"}
    clean_entries = []
    for e in raw_entries:
        if not isinstance(e, dict):
            continue
        ce = {k: v for k, v in e.items() if k in allowed_entry_keys}
        # Add rounds_completed if missing (all had 2 rounds in practice)
        if "rounds_completed" not in ce:
            ce["rounds_completed"] = 2
        clean_entries.append(ce)

    new_payload = {
        "schema_version": "1.0",
        "doc_type": "deliberation_session_index",
        "date": DATE,
        "meta": {
            "session_id": meta.get("session_id", SESSION_ID),
            "kind": meta.get("kind", "delta_scoped"),
            "all_converged": meta.get("all_converged", True),
        },
        "body": {
            "entries": clean_entries,
        },
    }
    if body.get("footer_notes"):
        new_payload["body"]["footer_notes"] = body["footer_notes"]

    _update_payload(sb, row["id"], new_payload)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Strip portfolio from digest snapshot
# ─────────────────────────────────────────────────────────────────────────────

def fix_digest_snapshot(sb) -> None:
    print("\n=== 3. Stripping portfolio from digest snapshot (Track A → research-only) ===")

    # Update documents.digest row
    rows = (
        sb.table("documents")
        .select("id, document_key, payload")
        .eq("date", DATE)
        .eq("document_key", "digest")
        .execute()
    ).data or []

    if not rows:
        print("  ! Digest document not found — skipping.")
        return

    row = rows[0]
    pl = deepcopy(row.get("payload") or {})

    # Remove portfolio (Track B) field
    pl.pop("portfolio", None)

    # Remove narrative PM sections
    narrative = pl.get("narrative") or {}
    narrative.pop("portfolio_recs", None)
    narrative.pop("thesis_tracker", None)
    if narrative:
        pl["narrative"] = narrative

    _update_payload(sb, row["id"], pl)

    # Also update daily_snapshots.snapshot for the same date
    print("  Updating daily_snapshots.snapshot …")
    snap_rows = (
        sb.table("daily_snapshots")
        .select("date, snapshot")
        .eq("date", DATE)
        .execute()
    ).data or []

    if snap_rows:
        snap_pl = deepcopy(snap_rows[0].get("snapshot") or {})
        snap_pl.pop("portfolio", None)
        snap_narrative = snap_pl.get("narrative") or {}
        snap_narrative.pop("portfolio_recs", None)
        snap_narrative.pop("thesis_tracker", None)
        if snap_narrative:
            snap_pl["narrative"] = snap_narrative
        (
            sb.table("daily_snapshots")
            .update({"snapshot": snap_pl})
            .eq("date", DATE)
            .execute()
        )
        print(f"  ✓ Updated daily_snapshots for {DATE}")
    else:
        print("  ! No daily_snapshots row found for this date — skipping.")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Publish per-segment delta documents
# ─────────────────────────────────────────────────────────────────────────────

# Mid-session narrative content from research-delta/20260415T150000Z.json
# Using the richer mid-session content (which includes the Iran talks failure).
SEGMENT_CONTENT = {
    "macro": """\
# Macro Analysis — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Iran Talks Failed + MS/BAC Earnings Sweep

## Critical update vs pre-market run

Iran-US Islamabad peace talks **FAILED**. Vice President Vance spent 21 hours in Islamabad but left without an agreement. Iran's Foreign Minister Abbas Araghchi said the two sides were "inches away" when Iran "encountered maximalism, shifting goalposts, and blockade" from the US side.

Key sticking points:
1. Timeframe and scope of nuclear enrichment suspension
2. Immediate Hormuz reopening demanded by the US
3. Dismantlement of major Iranian enrichment facilities

The naval blockade remains fully active. Trump has explicitly warned that Iranian ships approaching the US blockade will be "eliminated."

## Risk Recalibration

A new round of talks is under discussion, potentially before the **April 21 ceasefire expiry**. This creates a hard deadline window. If no deal before April 21, the ceasefire lapses and escalation risk returns materially. Markets are treating this as a moderate risk-on pause rather than full risk-off reversal — equities holding gains (SPY/QQQ positive) while gold is up and oil is bouncing slightly.

## Key Macro Data Points

| Indicator | Level | Change | Note |
|---|---|---|---|
| WTI Crude | $91.68/bbl | +0.44% (intraday Apr 15) | Partial risk-premium reload on Islamabad failure; was $97 pre-Iran |
| Gold | $4,825 | +1.4% | Flight-to-safety bid; ATH re-approached |
| 10Y Treasury | 4.30% | +5bps | FRED Apr 13; FOMC blackout begun |
| 2Y Treasury | 3.78% | — | 2s10s spread 52bps |
| DXY | ~99 | — | Structural weakness trend intact |
| Fed Funds Futures | ≥1 cut yr-end | New signal | Dovish tilt incremental |

## Macro Regime Classification

| Factor | Signal | Direction |
|---|---|---|
| Growth | Short-term positive | Q1 bank earnings confirming corporate health; AI capex intact; IMF 3.1% global cut priced-in |
| Inflation | Improving but unresolved | CPI 3.3%, PPI below est. (Mar prints in); 10Y edged +5bps |
| Policy | Incrementally dovish | ≥1 Fed cut by yr-end newly priced; FOMC Apr 28-29 on hold; pre-blackout |
| Risk Appetite | Cautious Risk-On | Equities holding; crypto diverging; gold up; F&G 23 Extreme Fear unchanged |

**Overall regime: Cautious Risk-On — elevated binary event risk on April 21 ceasefire deadline.**

## Risk Watch — Next 24-72 Hours

- Iran talks Round 2 timing (Apr 16-17 window) — if talks restart, WTI could test $88-90; if stalled further, oil snaps back above $100
- 10Y yield sustained above 4.40% would pressure tech into mega-cap earnings Apr 22-25
- FOMC pre-blackout: no new Fed signals until Apr 28-29 meeting
- Retail sales rescheduled to April 21 (overlaps with ceasefire deadline)
""",
    "crypto": """\
# Crypto Analysis — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday mid-session

## Live Prices (CoinGecko, Apr 15 mid-session)

| Asset | Price | 24h Change | Note |
|---|---|---|---|
| BTC | $74,019 | -0.77% | Failed $76K breakout settling into $73,700-74,300 range |
| ETH | $2,318 | -2.82% | Underperforming BTC; approaching $2,300 support |
| SOL | $83.13 | -3.65% | Altcoin underperformance continues |
| XRP | $1.35 | -1.28% | Declining |

**Fear & Greed Index:** 23 — Extreme Fear (unchanged from baseline).

## Key Divergence: Crypto vs Equities

Crypto sliding while equities are positive (QQQ $628.60). Crypto is **not** functioning as a risk-on asset in the Iran war regime. The $76K breakout failure on Apr 14 combined with sustained Extreme Fear signals bearish near-term momentum.

## Key Levels

| Level | Significance |
|---|---|
| $76,000 | Firm resistance — $76K options not printing, breakout faded |
| $74,000 | Current range midpoint |
| $72,000–$72,500 | Key support — failure below signals retest of $68-69K range |
| $68,000–$69,000 | April bear-case retest zone |

## Bias

**UW / Neutral** — No position trigger. Crypto diverging from equity risk-on; BTC must sustain close above $76K before bull case re-engages. Retail participation remains depressed despite three consecutive positive equity sessions.

## Risk Watch

- BTC holds $72K support → watch for consolidation
- BTC fails $72K support → $68-69K retest; risk appetite signal deteriorates
- $76K breakout with VIX < 20 → potential re-engagement signal
""",
    "sectors": """\
# Sector Analysis — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday mid-session

## US Equities Context

QQQ trading at $628.60 (session range $620.10–$628.60), up from $624 close on Apr 14. Market holding gains despite Iran Islamabad talks failure — equities pricing a deal eventually, not collapse.

## Sector Scorecard

| Sector | ETF | Bias | Confidence | Key Driver |
|---|---|---|---|---|
| Technology | XLK | OW | Medium | QQQ $628.60 holding; mega-cap AAPL/MSFT/META/NVDA report April 22-25; AI capex thesis intact |
| Financials | XLF | OW | High | **6-for-6 major bank Q1 2026 beats** — JPM, C, WFC, BLK, MS, BAC; MS record trading revenue; BAC consumer credit solid |
| Health Care | XLV | N | Low | No catalyst; neutral |
| Energy | XLE | UW | Medium | WTI ~$91-93 declining on Iran talk hopes; energy sector bearish |
| Industrials | XLI | N | Low | Tariff overhang; Empire State mfg -0.2 in March |
| Consumer Disc. | XLY | N | Low | No active thesis; retail data delayed to Apr 21 |
| Consumer Staples | XLP | UW | Medium | T-003 CHALLENGED — 3rd consecutive underperformance day; Thursday exit decision |
| Comm. Services | XLC | OW | Low | Nasdaq-adjacent; benefiting from risk-on; weak signal |
| Real Estate | XLRE | N | Low | 10Y at 4.30% — mild REIT headwind |
| Utilities | XLU | UW | Low | Risk-on rotation away from defensives |
| Materials | XLB | N | Low | China tariff overhang; no position |

## Notable Changes vs Baseline

- **XLF OW upgraded to High confidence** — MS/BAC Q1 beats complete 6-for-6 bank sweep
- **XLP UW maintained** — 3rd consecutive underperformance session, T-003 threshold approaching

## Earnings Today (Apr 15)

- **PNC Financial (PNC):** Q1 2026 pre-market. Expected EPS $3.93, revenue $6.21B. Beat = extends bank sweep narrative, bullish XLF.
- **Progressive (PGR):** Insurance Q1 — consumer financial health monitor.
- **JBHT, MTB** also reporting.

## Risk Watch

- XLP T-003: Thursday April 17 close decision — exit if SPY > $680 AND VIX < 22
- Mega-cap tech earnings Apr 22-25 (AAPL, MSFT, META, NVDA) — highest-stakes event for XLK OW
- PNC earnings today: beat extends high-conviction XLF narrative
""",
    "sentiment": """\
# Sentiment & Alternative Data — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday

## Sentiment Indicators

| Indicator | Reading | vs Baseline | Note |
|---|---|---|---|
| Fear & Greed | 23 (Extreme Fear) | Unchanged | Retail participation depressed despite 3 positive equity sessions |
| VIX | ~18 | Declining | Was 20+ at peak Iran uncertainty |
| CTA Equity Positioning | Fully long | Unchanged | Systematic models not de-risking |
| Oil CTAs | Unwinding longs | Change | WTI decline prompting systematic unwind |
| BTC $76K options | Not printing | Unchanged | Options market correctly faded breakout attempt |

## Key Divergence

CTA models are fully long equities but retail is in Extreme Fear. This divergence — systematic bulls + retail bears — typically resolves in favor of the systematic signal. However, the Iran binary event (April 21 ceasefire deadline) creates a catalyst risk that could invalidate the systematic positioning.

## Alt Data Context

- **BTC retail premium:** Absent — BTC $76K breakout faded with no retail follow-through
- **Social sentiment:** Risk-off tone on Iran failure news (Apr 15 morning); moderated by midday as talks-restart narrative emerged
- **FOMC pre-blackout:** No new Fed signals until Apr 28-29. Last forward guidance window closed.

## Risk Watch

- VIX sustained decline below 18 → F&G could recover from 23; positive sentiment signal
- Iran talks fail permanently (April 21) → VIX spike; F&G to 15-18 range; systemic risk-off
- Retail sales April 21 coincides with ceasefire deadline — double catalyst day
""",
    "international": """\
# International Markets — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Carry forward from pre-market + DXY update

## DXY & FX

| Pair | Level | Note |
|---|---|---|
| DXY | ~99 | Structural weakness trend intact; multi-year low vicinity |
| EUR/USD | ~1.13 | Benefiting from USD weakness; approaching 1.15 potential trigger |
| USD/JPY | — | BOJ unchanged; yen carry dynamics stable |
| USD/CNH | — | China tariff overhang intact |

**Key watch:** DXY sustained close below 98 would open the EFA vs SPY spread trade. Currently at 99, just above the trigger. Iran resolution would accelerate DXY weakness toward 96-97.

## Regional Scorecard

| Region | ETF | Bias | Note |
|---|---|---|---|
| Developed ex-US | EFA | Neutral/Watching | USD weakness + EAFE fiscal stimulus vs US tariff overhang; 5% starter position in deliberation |
| Emerging Markets | EEM | Neutral | Tariff overhang on EM; China (FXI) under pressure |
| India | INDA | OW | Outperforming vs broader EM |
| Japan | EWJ | N | BOJ unchanged; yen stable |

## No Material Changes

All regional markets tracking US risk-on sentiment. Developed market indices broadly positive. No significant regional events beyond DXY monitoring.

## Risk Watch

- DXY weekly close below 98 → EFA add trigger (from 5% to 10%)
- DXY weekly close above 104 → EFA exit signal
- Iran resolution → DXY accelerates to 96-97; strong EFA tailwind
""",
}


def publish_segment_delta_docs(sb) -> None:
    print("\n=== 4. Publishing per-segment delta documents ===")
    segments = list(SEGMENT_CONTENT.keys())
    for segment in segments:
        content = SEGMENT_CONTENT[segment]
        doc_key = f"deltas/{segment}.delta.md"
        payload = {
            "baseline_date": BASELINE_DATE,
            "run_type": "delta",
            "date": DATE,
            "segment": segment,
            "content": content,
        }
        row = {
            "document_key": doc_key,
            "date": DATE,
            "doc_type": None,
            "title": f"{segment.title()} Analysis — {DATE} (Delta)",
            "payload": payload,
            "content": content,
            "segment": segment,
            "category": "output",
        }
        print(f"  [{segment}] → {doc_key}")
        try:
            _upsert_document(sb, row)
        except Exception as e:
            # Some columns may not exist; try without optional fields
            for f in ["segment", "category"]:
                row.pop(f, None)
            _upsert_document(sb, row)


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print(f"Repairing artifacts for {DATE}…")
    sb = _sb()

    fix_deliberation_transcripts(sb)
    fix_session_index(sb)
    fix_digest_snapshot(sb)
    publish_segment_delta_docs(sb)

    print(f"\n✅ All repairs complete for {DATE}.")


if __name__ == "__main__":
    main()
