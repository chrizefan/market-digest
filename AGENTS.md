# digiquant-atlas — Agent Instructions

> Universal entry point for AI agents (OpenHands, Devin, Cline, GitHub Copilot, Cursor).

---

## What This Repo Is

Daily market intelligence system. Three-tier cadence:
- **Weekly Baseline** (Sunday) — Full 9-phase run, all 20+ output files from scratch
- **Daily Delta** (Mon–Sat) — Lightweight delta, only changed segments (~70% token savings)
- **Monthly Synthesis** (month end) — Review of all baselines + deltas

---

## Quickstart for Agents

### Step 1: Check today's run type
```
DB-first: run the single entrypoint and follow its printed instructions:

python3 scripts/run_db_first.py
```

### Sunday — Weekly Baseline (full run):
```
Read: skills/weekly-baseline/SKILL.md
Follow: All 9 phases in order
Output: outputs/daily/YYYY-MM-DD/DIGEST.md  (complete digest)
```

### Mon–Sat — Daily Delta
```
Read: skills/daily-delta/SKILL.md
Load: outputs/daily/[baseline-date]/DIGEST.md
Write: outputs/daily/YYYY-MM-DD/deltas/*.delta.md → Materialize DIGEST.md
```

### Key scripts
```bash
python3 scripts/run_db_first.py # DB-first entrypoint (baseline/delta + publish + validate)
./scripts/run-segment.sh [x]    # Single segment prompt (--delta flag supported)
./scripts/combine-digest.sh     # Synthesis prompt (auto-detects mode)
./scripts/git-commit.sh         # Commit + push (runs ETL first)
./scripts/monthly-rollup.sh     # Monthly synthesis
```

---

## Core Rules

- **Search the web** for prices/yields/news — never use training data cutoff values
- **Read `config/watchlist.md` + `config/investment-profile.md`** at session start
- Daily digest is DB-first: markdown is derived from the snapshot JSON stored in Supabase.
- **State a bias** (Bullish/Bearish/Neutral/Conflicted) with rationale for every segment
- Run **Phase 1 (alt-data) BEFORE Phase 3 (macro)** — positioning informs regime read
- Daily δ: always write mandatory deltas: macro, us-equities, crypto
- Analysis and bias are fine; specific buy/sell investment advice is not

---

## Named Agents

| Agent | File | Purpose |
|-------|------|---------|
| Orchestrator | `agents/orchestrator.agent.md` | Full pipeline driver |
| Sector Analyst | `agents/sector-analyst.agent.md` | Sector deep-dives |
| Alt Data Analyst | `agents/alt-data-analyst.agent.md` | Phase 1 alt-data |
| Institutional Analyst | `agents/institutional-analyst.agent.md` | Phase 2 smart money |
| Research Assistant | `agents/research-assistant.agent.md` | Ad-hoc research |
| Thesis Tracker | `agents/thesis-tracker.agent.md` | Portfolio thesis mgmt |

---

## Full Documentation

- Architecture: `docs/agentic/ARCHITECTURE.md`
- Platform setup: `docs/agentic/PLATFORMS.md`
- Skills catalog: `docs/agentic/SKILLS-CATALOG.md`
- Workflows: `docs/agentic/WORKFLOWS.md`
- Development conventions: `CLAUDE.md`
