---
applyTo: "**"
---

# digiquant-atlas — GitHub Copilot Instructions

This repository is a **daily market intelligence system** with a 7-phase AI-orchestrated pipeline. It produces structured financial research across all asset classes.

## Project Context

- **Language**: Bash scripts + Markdown (skill files as instruction sets) + Python (tearsheet + DB-first publishers)
- **Architecture**: Skill files (`skills/*.md`) are step-by-step instruction sets for AI agents
- **Outputs**: `outputs/daily/YYYY-MM-DD/` folders (22 files per day)

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
| `scripts/new-day.sh` | Creates daily folder structure |
| `scripts/validate-phase.sh` | Validates outputs after each pipeline phase |

## Skill File Conventions

When editing or creating skill files in `skills/`:
- Keep YAML frontmatter intact: `name:` and `description:` fields are routing keys
- Recurring artifacts are JSON-first; markdown is rendered from JSON.
- Use `{{DATE}}` placeholder in output paths (replaced at runtime)

## Script Conventions

- All scripts use `#!/bin/bash` + `set -e`
- **macOS `sed`**: use `sed -i ""` not `sed -i` (macOS requires the extension argument)
- All scripts run from repo root — paths are relative

## Output Structure

```
outputs/daily/YYYY-MM-DD/
  DIGEST.md              ← Master output
  macro.md               ← Phase 3
  bonds.md               ← Phase 4A
  commodities.md         ← Phase 4B
  forex.md               ← Phase 4C
  crypto.md              ← Phase 4D
  international.md       ← Phase 4E
  equities.md            ← Phase 5A
  alt-data.md            ← Phase 1
  institutional.md       ← Phase 2
  sectors/*.md           ← 11 files (Phase 5B-L)
```

## Coding Standards

- Markdown files: use `##` for sections, `###` for subsections, never skip heading levels
- Tables: use standard Markdown pipe syntax, always include header separator row
- Skill files: Steps numbered `### 1.`, `### 2.` etc. — be consistent
- Templates: use `{{PLACEHOLDER}}` syntax for runtime replacement
- Never hardcode dates — always use `$(date +%Y-%m-%d)` in scripts

## What NOT to Do

- Do not modify `outputs/daily/` files directly — these are agent-generated
- Do not change the `name:` field in skill file frontmatter without updating CLAUDE_PROJECT_INSTRUCTIONS.md
- Do not remove the `.github/workflows/` files — `deploy.yml` and `weekly-check.yml` are CI/CD

## Complete Documentation

- System architecture: `docs/agentic/ARCHITECTURE.md`
- Platform setup guides: `docs/agentic/PLATFORMS.md`
- All skills indexed: `docs/agentic/SKILLS-CATALOG.md`
- Workflow reference: `docs/agentic/WORKFLOWS.md`
