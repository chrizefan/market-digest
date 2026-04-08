# Skills hard-cutover map (legacy → package paths)

This document supports the hard-cutover migration from legacy flat skill files to per-skill packages:

- **Legacy**: `skills/SKILL-*.md`, `skills/sectors/SKILL-sector-*.md`, `skills/alternative-data/SKILL-*.md`, `skills/institutional/SKILL-*.md`
- **New canonical**: `skills/<skill-slug>/SKILL.md`

## Mapping table

| Legacy path | New package path |
|---|---|
| `skills/SKILL-orchestrator.md` | `skills/orchestrator/SKILL.md` |
| `skills/SKILL-daily-delta.md` | `skills/daily-delta/SKILL.md` |
| `skills/SKILL-weekly-baseline.md` | `skills/weekly-baseline/SKILL.md` |
| `skills/SKILL-monthly-synthesis.md` | `skills/monthly-synthesis/SKILL.md` |
| `skills/SKILL-premarket-pulse.md` | `skills/premarket-pulse/SKILL.md` |
| `skills/SKILL-macro.md` | `skills/macro/SKILL.md` |
| `skills/SKILL-bonds.md` | `skills/bonds/SKILL.md` |
| `skills/SKILL-commodities.md` | `skills/commodities/SKILL.md` |
| `skills/SKILL-forex.md` | `skills/forex/SKILL.md` |
| `skills/SKILL-crypto.md` | `skills/crypto/SKILL.md` |
| `skills/SKILL-international.md` | `skills/international/SKILL.md` |
| `skills/SKILL-equity.md` | `skills/equity/SKILL.md` |
| `skills/SKILL-earnings.md` | `skills/earnings/SKILL.md` |
| `skills/SKILL-digest.md` | `skills/digest/SKILL.md` |
| `skills/SKILL-opportunity-screener.md` | `skills/opportunity-screener/SKILL.md` |
| `skills/SKILL-asset-analyst.md` | `skills/asset-analyst/SKILL.md` |
| `skills/SKILL-deliberation.md` | `skills/deliberation/SKILL.md` |
| `skills/SKILL-portfolio-manager.md` | `skills/portfolio-manager/SKILL.md` |
| `skills/SKILL-thesis.md` | `skills/thesis/SKILL.md` |
| `skills/SKILL-thesis-tracker.md` | `skills/thesis-tracker/SKILL.md` |
| `skills/SKILL-profile-setup.md` | `skills/profile-setup/SKILL.md` |
| `skills/SKILL-deep-dive.md` | `skills/deep-dive/SKILL.md` |
| `skills/SKILL-sector-rotation.md` | `skills/sector-rotation/SKILL.md` |
| `skills/SKILL-sector-heatmap.md` | `skills/sector-heatmap/SKILL.md` |
| `skills/SKILL-data-fetch.md` | `skills/data-fetch/SKILL.md` |
| `skills/SKILL-mcp-data-fetch.md` | `skills/mcp-data-fetch/SKILL.md` |
| `skills/alternative-data/SKILL-sentiment-news.md` | `skills/alt-sentiment-news/SKILL.md` |
| `skills/alternative-data/SKILL-cta-positioning.md` | `skills/alt-cta-positioning/SKILL.md` |
| `skills/alternative-data/SKILL-options-derivatives.md` | `skills/alt-options-derivatives/SKILL.md` |
| `skills/alternative-data/SKILL-politician-signals.md` | `skills/alt-politician-signals/SKILL.md` |
| `skills/institutional/SKILL-institutional-flows.md` | `skills/inst-institutional-flows/SKILL.md` |
| `skills/institutional/SKILL-hedge-fund-intel.md` | `skills/inst-hedge-fund-intel/SKILL.md` |
| `skills/sectors/SKILL-sector-technology.md` | `skills/sector-technology/SKILL.md` |
| `skills/sectors/SKILL-sector-healthcare.md` | `skills/sector-healthcare/SKILL.md` |
| `skills/sectors/SKILL-sector-energy.md` | `skills/sector-energy/SKILL.md` |
| `skills/sectors/SKILL-sector-financials.md` | `skills/sector-financials/SKILL.md` |
| `skills/sectors/SKILL-sector-consumer-staples.md` | `skills/sector-consumer-staples/SKILL.md` |
| `skills/sectors/SKILL-sector-consumer-disc.md` | `skills/sector-consumer-disc/SKILL.md` |
| `skills/sectors/SKILL-sector-industrials.md` | `skills/sector-industrials/SKILL.md` |
| `skills/sectors/SKILL-sector-utilities.md` | `skills/sector-utilities/SKILL.md` |
| `skills/sectors/SKILL-sector-materials.md` | `skills/sector-materials/SKILL.md` |
| `skills/sectors/SKILL-sector-real-estate.md` | `skills/sector-real-estate/SKILL.md` |
| `skills/sectors/SKILL-sector-comms.md` | `skills/sector-comms/SKILL.md` |

## Reference inventory (where legacy paths appear)

The following files currently reference legacy skill paths and must be updated to the **new package paths**:

- **Core instructions**: `AGENTS.md`, `CLAUDE.md`, `CLAUDE_PROJECT_INSTRUCTIONS.md`, `.github/copilot-instructions.md`, `RUNBOOK.md`, `.cursorrules`, `.windsurfrules` (legacy paste doc: `docs/archive/PROJECT-INSTRUCTIONS-PASTE.txt`)
- **Agent entrypoints**: `agents/orchestrator.agent.md`, `agents/portfolio-manager.agent.md`, `agents/alt-data-analyst.agent.md`, `agents/sector-analyst.agent.md`, `agents/thesis-tracker.agent.md`
- **Scripts that print prompts / reference skills**: `scripts/new-day.sh`, `scripts/thesis.sh`, `scripts/monthly-rollup.sh`, `scripts/fetch-market-data.sh`, `scripts/cowork-daily-prompt.txt` (retired: `archive/legacy-scripts/run-segment.sh`, `new-week.sh`, `run-daily.sh`)
- **Docs**: `docs/agentic/README.md`, `docs/agentic/ARCHITECTURE.md`, `docs/agentic/WORKFLOWS.md`, `docs/agentic/PROMPTS.md`, `docs/agentic/PLATFORMS.md` (archived walkthrough: `docs/archive/DAILY-RUN-WALKTHROUGH.md`)
- **Cursor rules**: `.cursor/rules/01-overview.mdc`, `.cursor/rules/02-skills-workflow.mdc`
- **Skill intra-references** (skills referencing other skills): many `skills/SKILL-*.md` files reference other `skills/...` paths and must be updated during migration.

Notes:
- References inside `archive/legacy-outputs/**` are historical artifacts and are **not run-critical**; we will leave them as-is unless a tool/validator depends on them (it shouldn’t).

