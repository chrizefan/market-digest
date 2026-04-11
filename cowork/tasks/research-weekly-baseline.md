# Task: Research — weekly baseline (Track A)

**Before anything else:** read [`../PROJECT.md`](../PROJECT.md).

## Objective

**Positioning-blind** research for the **baseline anchor** (typically **Sunday** / weekly open). Full segment scope vs `baseline_date`; set `"run_type": "baseline"` in the payload when you publish a full-scope run for that anchor.

**Do not** read `config/preferences.md`, `config/investment-profile.md`, or `config/portfolio.json`.

## Steps

1. `pip install -r requirements.txt` if needed; set `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
2. Follow [`skills/research-daily/SKILL.md`](../../skills/research-daily/SKILL.md): produce local JSON, unique `research-delta/<RUN_SUFFIX>.json` key, `publish_document.py`, then validation.
3. `python3 scripts/run_db_first.py --skip-execute --validate-mode research` (add `--date YYYY-MM-DD` if not today).

**Prompt helper:** [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt)

**Note:** Portfolio digest baseline (9-phase digest, positions) is **Track B** — use [`portfolio-pm-rebalance.md`](portfolio-pm-rebalance.md) with [`skills/weekly-baseline/SKILL.md`](../../skills/weekly-baseline/SKILL.md) when you need the full market digest + PM stack for the same day.
