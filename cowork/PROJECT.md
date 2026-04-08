# Cowork — digiquant-atlas (single source for scheduled runs)

This folder is the **operator briefing** for Cloud Cowork (or any scheduler): DB-first, JSON artifacts, Supabase canonical.

## Read first (in order)

1. [`RUNBOOK.md`](../RUNBOOK.md) — authoritative steps, env, validation
2. [`AGENTS.md`](../AGENTS.md) — agent behavior
3. [`skills/orchestrator/SKILL.md`](../skills/orchestrator/SKILL.md) — phase list (load **only** this skill for the full pipeline unless debugging one segment)

## Environment

- **Python 3.11+** with `pip install -r requirements.txt` (includes `jsonschema` for artifact validation).
- **Supabase** (service role for writes):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
- Optional: `config/supabase.env` loaded by publisher scripts (see RUNBOOK).

Prices and portfolio context for the app are **in Supabase** (`price_history`, `daily_snapshots`, `documents`, etc.). MCP servers in `.vscode/mcp.json` are **optional** research tools—not required for baseline runs.

## Daily command

```bash
python3 scripts/run_db_first.py
```

## Related tasks

- [`tasks/daily-8am.md`](tasks/daily-8am.md) — pre-market schedule
- [`tasks/manual-run.md`](tasks/manual-run.md) — ad-hoc

## Post-mortem (evolution)

After a run, optionally scaffold post-mortem JSON:

```bash
./scripts/scaffold_evolution_day.sh
```

Fill `outputs/evolution/YYYY-MM-DD/*.json`, then ETL via `scripts/update_tearsheet.py` or your normal publish path.
