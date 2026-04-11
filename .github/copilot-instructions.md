---
applyTo: "**"
---

# digiquant-atlas — GitHub Copilot Instructions

Daily market intelligence with a **Supabase-first**, **JSON-first** pipeline. Canonical state lives in Supabase (`daily_snapshots`, `documents`, `positions`, …); markdown is derived for display.

## Project context

- **Languages**: Python automation, Bash helpers, Markdown skills under `skills/`
- **Operator entrypoint**: `python3 scripts/run_db_first.py` (after publishing JSON to Supabase)
- **Authoritative docs**: [`RUNBOOK.md`](../RUNBOOK.md), [`AGENTS.md`](../AGENTS.md), [`skills/orchestrator/SKILL.md`](../skills/orchestrator/SKILL.md)

## Key paths

| Path | Role |
|------|------|
| `skills/**/SKILL.md` | Phase instructions (YAML frontmatter: `name`, `description`) |
| `templates/schemas/*.json` | JSON Schema for artifacts |
| `scripts/run_db_first.py` | Post-publish metrics + execute-at-open + `validate_db_first.py` |
| `scripts/validate_db_first.py` | Supabase row checks (`--date`, `--mode full\|research\|pm`) |
| `data/agent-cache/` | Optional gitignored scratch for local JSON / migration — **not** source of truth |

## Conventions

- Prefer **`validate_artifact.py`** + **`publish_document.py --payload -`** for hosted or CI-style runs (stdin JSON).
- **macOS `sed`**: use `sed -i ""` (BSD sed requires the backup extension).
- Run shell scripts from the **repo root**; use `$(date +%Y-%m-%d)` instead of hard-coded dates.
- Do not reintroduce a markdown-first “daily tree” contract; align edits with `RUNBOOK.md`.

## What not to do

- Do not treat gitignored scratch trees as committed product state.
- Do not remove or break `.github/workflows/` without an explicit operator reason.

## More documentation

- [`docs/agentic/ARCHITECTURE.md`](../docs/agentic/ARCHITECTURE.md)
- [`docs/agentic/WORKFLOWS.md`](../docs/agentic/WORKFLOWS.md)
- [`docs/ops/SCRIPTS.md`](../docs/ops/SCRIPTS.md)
