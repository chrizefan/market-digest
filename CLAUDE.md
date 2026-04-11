# digiquant-atlas — Claude Code Instructions

> For pipeline/behavioral rules see `AGENTS.md`. For Claude.ai Projects, paste `cowork/PROJECT-PROMPT.md`; root `CLAUDE_PROJECT_INSTRUCTIONS.md` is a short pointer only.

---

## Quick Commands

```bash
python3 scripts/run_db_first.py   # DB-first entrypoint (validate, publish, execute-at-open)
./scripts/new-day.sh              # Print baseline/delta digest prompt (no outputs/daily writes)
./scripts/status.sh               # Supabase validation + brief status
./scripts/git-commit.sh           # Commit everything with date-stamped message
./scripts/weekly-rollup.sh        # Weekly JSON scaffold + synthesis prompt
./scripts/monthly-rollup.sh       # Monthly JSON scaffold + synthesis prompt
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
skills/      `skills/<slug>/SKILL.md` packages (AI pipeline phases)
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
1. Create `skills/sector-newname/SKILL.md` using schema `templates/schemas/sector-report.schema.json` as the output contract
2. Add the sector to `skills/orchestrator/SKILL.md` Phase 5 list
3. If `scripts/new-day.sh` still lists sectors for prompts, add the slug there
4. Update `docs/agentic/SKILLS-CATALOG.md` when adding skills

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

## Portfolio context

Authoritative allocations: `config/portfolio.json` and `config/investment-profile.md`. Do not treat examples in docs as live positions.
