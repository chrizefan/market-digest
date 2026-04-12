# Task: Portfolio — PM, analyst, rebalance (Track B)

**Before anything else:** read [`../PROJECT.md`](../PROJECT.md).

## Preconditions

Research for the **as-of date** is available in **Supabase** — portfolio **digest** snapshot and/or at least one **`research_delta`** row in `documents` (any `research-delta/…` key), and/or **`document_delta`** / **`research_changelog`** / **`research_baseline_manifest`** from the per-document pipeline. Prefer reading **`research-changelog/{{DATE}}.json`** (after `fold_document_deltas.py`) for a compact “what changed” summary before analyst / PM work. **Do not** depend on local `data/agent-cache/` for canonical state.

## Objective

**Portfolio manager + analyst** workflow with **`config/preferences.md`** and **`config/investment-profile.md`**: opportunity screen, deliberation (when required), **`rebalance_decision`** and related portfolio JSON, then materialize / validate via `run_db_first.py`.

## Steps

1. Load same-day context from Supabase (`daily_snapshots`, `documents`).
2. **Digest mode:** Sunday → [`skills/weekly-baseline/SKILL.md`](../../skills/weekly-baseline/SKILL.md); Mon–Sat → [`skills/daily-delta/SKILL.md`](../../skills/daily-delta/SKILL.md) (including Phase 6 per-document deltas + fold when used, threshold monitor / Phase 7C, PM path when triggered).
3. **Portfolio layer** (when digest phases allow): Ground analysts on **yesterday’s** `asset_recommendation` / `rebalance_decision` / `portfolio_recommendation` plus today’s **`research_changelog`**. Then [`skills/opportunity-screener/SKILL.md`](../../skills/opportunity-screener/SKILL.md); baseline → [`skills/deliberation/SKILL.md`](../../skills/deliberation/SKILL.md) + [`skills/portfolio-manager/SKILL.md`](../../skills/portfolio-manager/SKILL.md); delta → scoped path per `daily-delta` skill. Prefer **`deliberation_transcript.meta.kind: delta_scoped`** on weekdays with extra PM–analyst rounds when triggers fire.
4. `python3 scripts/run_db_first.py --validate-mode pm` (use `full` if you also shipped a full digest payload for the date).
5. If execution prices stayed null after open: `python3 scripts/backfill_execution_prices.py --date YYYY-MM-DD`.

**Execution prefs:** [`config/schedule.json`](../../config/schedule.json)  
**Long combined digest + portfolio checklist:** [`scripts/cowork-daily-prompt.txt`](../../scripts/cowork-daily-prompt.txt)
