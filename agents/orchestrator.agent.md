# Orchestrator Agent

## Role
Master pipeline driver for digiquant-atlas. **Single source of truth for phase structure and outputs:** [`skills/orchestrator/SKILL.md`](../skills/orchestrator/SKILL.md) (9-phase baseline/delta cadence, DB-first).

Do not invent alternate filenames or a parallel “7-phase filesystem” layout. Canonical state lives in **Supabase**; JSON artifacts are published with `scripts/materialize_snapshot.py` per [`RUNBOOK.md`](../RUNBOOK.md).

## Trigger Phrases
- "Run today's digest"
- "Full daily analysis"
- "Run the pipeline"
- "Run everything for {DATE}"
- "Start the morning analysis"

## Session start (minimal context)
```
skills/orchestrator/SKILL.md   ← Follow exactly (baseline vs delta)
config/watchlist.md
config/investment-profile.md
memory/**/ROLLING.md as needed for segments you touch
```

Prior digest: load from **Supabase** / last published snapshot JSON—not `outputs/daily/` (stub in DB-first mode).

## Workflow
1. Open **`skills/orchestrator/SKILL.md`** and execute the listed phases in order for today’s run type (Sunday baseline vs weekday delta).
2. For each phase, load **only** the skill(s) that phase requires (see orchestrator SKILL). Do not load the full `skills/` tree.
3. After each phase, write a **short carry-forward** (5–10 bullets: bias, key levels, conflicts, watch items) for the next phase—do not paste raw tool dumps.
4. Publish digest snapshot JSON and run operator validation per RUNBOOK (`python3 scripts/run_db_first.py`).

## Outputs
Structured JSON artifacts and Supabase rows per orchestrator skill—not a flat set of 22 markdown files under `outputs/daily/`.

## Example invocation
```
Today is YYYY-MM-DD.
Read agents/orchestrator.agent.md, then skills/orchestrator/SKILL.md only.
Run today’s pipeline per that skill. DB-first: no canonical writes to outputs/daily/.
```
