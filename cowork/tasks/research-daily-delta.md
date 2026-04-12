# Task: Research — daily delta (Track A)

**Before anything else:** read [`../PROJECT.md`](../PROJECT.md).

## Objective

**Positioning-blind** **delta** research for the run date (Mon–Sat or any intra-week / high-frequency slot). Use `"run_type": "delta"` unless you are intentionally doing a baseline-class run.

**Do not** read `config/preferences.md`, `config/investment-profile.md`, or `config/portfolio.json`.

Each `research_delta` publish needs a **new** `document_key` under `research-delta/…` (see skill) so multiple runs per calendar day keep history.

**Final step (mandatory):** after segment/delta research, **compile the digest** for `RUN_DATE` — the **single research overview** that rolls up all sub-segments. That is **research close-out**, not PM work: follow [`skills/daily-delta/SKILL.md`](../../skills/daily-delta/SKILL.md) **through Phase 7B** (materialize & publish `digest` + `daily_snapshots`). **Do not** run **Phase 7C–7D** here — those are the **portfolio monitor / PM** layer; run them from [`portfolio-pm-rebalance.md`](portfolio-pm-rebalance.md) if needed.

## Steps

1. `pip install -r requirements.txt` if needed; set `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
2. Follow [`skills/research-daily/SKILL.md`](../../skills/research-daily/SKILL.md): produce local JSON, unique `research-delta/<RUN_SUFFIX>.json` key, `publish_document.py`, then validation (when you use additive `research_delta` alongside the digest pipeline).
3. Follow [`skills/daily-delta/SKILL.md`](../../skills/daily-delta/SKILL.md) **through Phase 7B** so **`documents.digest`** and **`daily_snapshots`** exist for `RUN_DATE`. Stop before Phase 7C unless you are intentionally collapsing research + portfolio into one session.
4. `python3 scripts/run_db_first.py --skip-execute --validate-mode research` (add `--date YYYY-MM-DD` if not today).
5. `python3 scripts/validate_pipeline_step.py --date RUN_DATE --step research_closeout` — confirms research close-out (**`digest`** + materialized snapshot JSON).

**Prompt helper:** [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt)
