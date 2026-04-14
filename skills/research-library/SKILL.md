---
name: research-library
description: >
  Load curated research from the two-tier research library. Tier 1: static doctrine papers
  in docs/research/ (factor investing, momentum, risk — git-tracked). Tier 2: dynamic
  research notes (deep dives, concepts, themes) stored in Supabase documents table under
  the research/ document_key namespace. Use when the portfolio manager, asset analyst,
  or orchestrator needs evidence-based allocation rules or prior deep-dive research.
  Triggers: "research library", "paper notes", "tactical allocation doctrine", "cite research",
  "what do we know about", "prior research on".
---

# Research Library

Two-tier knowledge base. Load only what the current task needs.

---

## Tier 1 — Static Doctrine Papers (git-tracked)

Seven peer-reviewed summaries covering factor investing, momentum, macro regime, and risk.

**Load sequence:**
1. Read `docs/research/LIBRARY.md` — index and quick-reference tables.
2. Open **1–3** matching files under `docs/research/papers/` only (not all seven).

**Papers available:**
- `tactical-asset-allocation.md` — Faber SMA, Antonacci dual momentum, TSMOM
- `momentum-trend.md` — lookback periods, cross-sectional vs. time-series
- `factor-investing.md` — value, quality, low-vol factors
- `portfolio-construction.md` — Black-Litterman, Kelly, position sizing
- `risk-management.md` — drawdown budgeting, stop discipline
- `macro-regime.md` — Ilmanen 4-quadrant, regime classification
- `behavioral-finance.md` — Kahneman, Shefrin, anti-anchoring guardrails

---

## Tier 2 — Dynamic Research Notes (Supabase)

Agent-generated deep dives, concept notes, and theme analyses published during pipeline runs.

**document_key patterns:**
- `research/deep-dives/{TICKER}-{DATE}` — single-asset deep dives
- `research/concepts/{SLUG}` — timeless frameworks and concepts
- `research/themes/{SLUG}-{DATE}` — market theme analyses

**Load index:**
```bash
python3 scripts/fetch_research_library.py
```

**Fetch a specific note:**
```bash
python3 scripts/fetch_research_library.py --key research/deep-dives/NVDA-2026-04-14
```

**Filter by ticker or type:**
```bash
python3 scripts/fetch_research_library.py --ticker NVDA
python3 scripts/fetch_research_library.py --type concept
```

**Cache all to local scratch (optional session preload):**
```bash
python3 scripts/fetch_research_library.py --cache data/agent-cache/research/
```

---

## Output contract

- State **which sources** you used (Tier 1 path or Tier 2 document_key).
- Extract **2–5 actionable rules** (bullets) with section references where possible.
- State **how** they apply to today's allocation or thesis — not generic prose.

## Token discipline

Do **not** paste entire papers or notes. Summarize decision rules only.
