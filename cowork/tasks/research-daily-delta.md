# Task: Research — daily delta (Track A)

**Before anything else:** read [`../PROJECT.md`](../PROJECT.md).

## Objective

**Positioning-blind** **delta** research for the run date (Mon–Sat or any intra-week / high-frequency slot). Use `"run_type": "delta"` unless you are intentionally doing a baseline-class run.

**Do not** read `config/preferences.md`, `config/investment-profile.md`, or `config/portfolio.json`.

Each publish needs a **new** `document_key` under `research-delta/…` (see skill) so multiple runs per calendar day keep history.

## Steps

1. `pip install -r requirements.txt` if needed; set `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
2. Follow [`skills/research-daily/SKILL.md`](../../skills/research-daily/SKILL.md) (local JSON → `publish_document.py` → validate).
3. `python3 scripts/run_db_first.py --skip-execute --validate-mode research` (add `--date YYYY-MM-DD` if not today).

**Prompt helper:** [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt)
