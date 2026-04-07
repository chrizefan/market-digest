# digiquant-atlas — Claude Code Instructions

> For pipeline/behavioral rules see `AGENTS.md`. For Claude.ai Projects, see `CLAUDE_PROJECT_INSTRUCTIONS.md`.

---

## Quick Commands

```bash
./scripts/new-day.sh              # Create today's output folder structure + print digest prompt
./scripts/status.sh               # Project health — segment completion
./scripts/run-segment.sh energy   # Print focused prompt for single segment
./scripts/combine-digest.sh       # Print synthesis prompt to combine all segments into DIGEST.md
./scripts/git-commit.sh           # Commit everything with date-stamped message
./scripts/weekly-rollup.sh        # Generate weekly synthesis (run Fridays)
./scripts/monthly-rollup.sh       # Generate monthly synthesis
./scripts/archive.sh              # Archive old daily outputs
./scripts/validate-portfolio.sh    # Validate portfolio.json against investment-profile.md constraints
./scripts/validate-portfolio.sh --proposed  # Validate proposed positions
./scripts/validate-phase.sh 3     # Validate Phase 3 outputs before proceeding
./scripts/validate-phase.sh --all # Validate all pipeline phases end-to-end
./scripts/validate-phase.sh --summary  # Quick pass/fail for every phase
./scripts/fetch-market-data.sh    # Fetch quotes + macro data (incremental from cache)
./scripts/fetch-market-data.sh --preload  # Force full 2yr cache rebuild
python scripts/preload-history.py          # Seed/refresh OHLCV cache (data/price-history/)
python scripts/update_tearsheet.py  # Parse digests + push to Supabase (primary data store)
```

---

## Repository Layout

```
config/      watchlist.md, investment-profile.md, portfolio.json, hedge-funds.md
skills/      Skill files (step-by-step instruction sets for AI pipeline phases)
templates/   Output templates — do not delete
outputs/     daily/YYYY-MM-DD/, weekly/, monthly/, deep-dives/
scripts/     Bash + Python automation
agents/      Named agent role definitions
docs/agentic/ Full architecture, platform, workflow docs
frontend/    Next.js dashboard (app/, components/, lib/)
supabase/    Schema migrations
```

---

## Development Guidelines

### When editing skill files:
1. Read the existing file completely before editing
2. Preserve YAML frontmatter exactly — changing `name:` breaks routing
3. Keep output format templates — downstream skills parse specific headers
4. Output paths use `{{DATE}}` placeholder; never hardcode dates

### When adding a new sector or asset class:
1. Create `skills/sectors/SKILL-sector-newname.md` using `templates/sector-report.md` as a base
2. Add the sector to `skills/SKILL-orchestrator.md` Phase 5 list
3. Add an empty output file path to `scripts/new-day.sh` SECTORS loop
4. Add the sector to `scripts/run-segment.sh` case statement
5. Update `CLAUDE_PROJECT_INSTRUCTIONS.md` skill table

### When modifying scripts:
- Scripts use `#!/bin/bash` + `set -e` — keep this pattern
- macOS `sed -i ""` (not `sed -i`) — critical on macOS
- All scripts are run from the repo root — paths are relative to root

### Git workflow:
```bash
git add -A
git commit -m "research: YYYY-MM-DD — [brief summary]"
# or use: ./scripts/git-commit.sh
```

---

## Current Portfolio Context

Active: IAU (gold ~20%), XLE (energy 12%), DBO (oil 5%), XLP (staples 8%), BIL/SHY (~47%)
Macro regime: Geopolitical shock (Iran War) → WTI $112, Gold ATH, VIX elevated
Update `config/portfolio.json` when allocations change.
