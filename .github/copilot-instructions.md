---
applyTo: "**"
---

# digiquant-atlas — GitHub Copilot Instructions

This repository is a **daily market intelligence system** with a **9-phase** AI-orchestrated pipeline. Canonical state is **DB-first (Supabase)**; JSON artifacts are primary and markdown is derived.

## Project Context

- **Language**: Bash + Python (ETL, publish) + Markdown skills under `skills/<slug>/SKILL.md`
- **Architecture**: [`RUNBOOK.md`](RUNBOOK.md), [`docs/agentic/ARCHITECTURE.md`](docs/agentic/ARCHITECTURE.md)
- **Outputs**: JSON under `outputs/daily/YYYY-MM-DD/` + rows in Supabase (`daily_snapshots`, `documents`, …). Legacy markdown samples: `archive/legacy-outputs/daily/`

## Key Files to Know

| File | Purpose |
|------|---------|
| `skills/orchestrator/SKILL.md` | Master pipeline driver — read this first |
| `config/watchlist.md` | Tracked assets — edit to customize |
| `config/preferences.md` | Trading style + active theses |
| `config/investment-profile.md` | Investor identity, horizon, risk, asset preferences |
| `skills/profile-setup/SKILL.md` | Interactive wizard to configure investment-profile.md |
| `templates/digest-snapshot-schema.json` | Canonical daily digest snapshot JSON schema |
| `templates/schemas/*.schema.json` | Canonical schemas for weekly/monthly/delta/rebalance artifacts |
| `scripts/run_db_first.py` | DB-first publish + validate entry |
| `scripts/new-day.sh` | Prints baseline/delta prompt |
| `scripts/validate-phase.sh` | Validates outputs after each pipeline phase (legacy phase checks) |

## Skill File Conventions

When editing or creating skill files in `skills/`:
- Keep YAML frontmatter intact: `name:` and `description:` fields are routing keys
- Recurring artifacts are JSON-first; markdown is rendered from JSON.
- Use `{{DATE}}` placeholder in output paths (replaced at runtime)

## Script Conventions

- All scripts use `#!/bin/bash` + `set -e`
- **macOS `sed`**: use `sed -i ""` not `sed -i` (macOS requires the extension argument)
- All scripts run from repo root — paths are relative

## Output structure (current)

- **Canonical**: `snapshot.json`, `delta-request.json`, segment JSON, `rebalance-decision.json` → `materialize_snapshot.py` / `update_tearsheet.py` → Supabase.
- **Legacy** (read-only samples): `archive/legacy-outputs/daily/*.md`
- **Index**: [`docs/ops/SCRIPTS.md`](docs/ops/SCRIPTS.md)

## Coding Standards

- Markdown files: use `##` for sections, `###` for subsections, never skip heading levels
- Tables: use standard Markdown pipe syntax, always include header separator row
- Skill files: Steps numbered `### 1.`, `### 2.` etc. — be consistent
- Templates: use `{{PLACEHOLDER}}` syntax for runtime replacement
- Never hardcode dates — always use `$(date +%Y-%m-%d)` in scripts

## What NOT to Do

- Do not modify `outputs/daily/` files directly — these are agent-generated
- Do not change the `name:` field in skill file frontmatter without updating `docs/agentic/SKILLS-CATALOG.md`
- Do not remove the `.github/workflows/` files — `deploy.yml` and `weekly-check.yml` are CI/CD

## Complete Documentation

- System architecture: `docs/agentic/ARCHITECTURE.md`
- Platform setup guides: `docs/agentic/PLATFORMS.md`
- All skills indexed: `docs/agentic/SKILLS-CATALOG.md`
- Workflow reference: `docs/agentic/WORKFLOWS.md`
