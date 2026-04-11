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
Publish: digest snapshot JSON → Supabase via scripts/materialize_snapshot.py (see RUNBOOK.md)
```

### Mon–Sat — Daily Delta
```
Read: skills/daily-delta/SKILL.md
Load prior baseline snapshot from Supabase (or last published JSON)
Output: delta-request JSON → operator runs scripts/materialize_snapshot.py
```

### Track A vs Track B (research vs portfolio)
- **Track A:** `skills/research-daily/SKILL.md` → `validate_artifact.py -` → `publish_document.py --payload -` with unique `research-delta/…` key → `run_db_first.py --skip-execute --validate-mode research` — Cowork: `cowork/tasks/research-daily-delta.md` / `research-weekly-baseline.md` / `recurring-scheduled-run.md`
- **Track B:** Portfolio / analyst (preferences + `rebalance-decision.json`) → `run_db_first.py --validate-mode pm` or `full` — Cowork: `cowork/tasks/portfolio-pm-rebalance.md`
- **Cadence / open execution:** `config/schedule.json`; **backfill opens:** `scripts/backfill_execution_prices.py`

### Key scripts
```bash
python3 scripts/run_db_first.py # DB-first entrypoint (baseline/delta + publish + validate)
./scripts/git-commit.sh         # Commit + push (runs ETL first)
./scripts/monthly-rollup.sh     # Monthly JSON scaffold + synthesis prompt
```

---

## Core Rules

- **Search the web** for prices/yields/news — never use training data cutoff values
- **Read `config/watchlist.md`** every session. Read **`config/preferences.md`** and **`config/investment-profile.md`** for **Track B (portfolio)** only — not for Track A (`skills/research-daily/SKILL.md`).
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

- Architecture: `docs/agentic/ARCHITECTURE.md` (extended inventory: `docs/archive/ARCHITECTURE-REVIEW.md`)
- Platform setup: `docs/agentic/PLATFORMS.md`
- Skills catalog: `docs/agentic/SKILLS-CATALOG.md`
- Workflows: `docs/agentic/WORKFLOWS.md`
- Development conventions: `CLAUDE.md`
- Claude.ai Projects: paste `cowork/PROJECT-PROMPT.md`; root `CLAUDE_PROJECT_INSTRUCTIONS.md` is a short pointer only
