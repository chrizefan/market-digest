# digiquant-atlas — Claude Code Instructions

> This file is read automatically by Claude Code (`claude` CLI) when invoked in this repo.
> For Claude.ai Projects, see `CLAUDE_PROJECT_INSTRUCTIONS.md` instead.

---

## What This Repository Is

A daily market intelligence system that generates structured research across all asset classes using a **7-phase AI-orchestrated pipeline**. The system produces 22 output files per day — one per market segment + master DIGEST.md.

**Tech stack**: Bash scripts + Markdown skill files + Python (tearsheet) + Next.js frontend (Tailwind + Recharts).

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

## Repository Architecture

```
digiquant-atlas/
├── CLAUDE.md                         ← This file (Claude Code entry point)
├── CLAUDE_PROJECT_INSTRUCTIONS.md    ← Claude.ai Projects entry point
├── AGENTS.md                         ← Cross-platform agent entry point
│
├── config/
│   ├── watchlist.md                  ← Tracked assets (edit to customize)
│   ├── preferences.md                ← Trading style, risk profile, active theses
│   ├── investment-profile.md         ← Investor identity, horizon, risk, asset preferences
│   ├── hedge-funds.md                ← Tracked fund registry (16 funds, CIK, style)
│   ├── data-sources.md               ← 30+ X accounts, data URLs, calendars
│   └── email-research.md             ← Gmail setup guide + subscription list
│
├── skills/                           ← Instruction files — how Claude runs each analysis
│   ├── SKILL-orchestrator.md         ← MASTER: 7-phase pipeline driver
│   ├── SKILL-digest.md               ← Legacy pointer → redirects to orchestrator
│   ├── SKILL-macro.md                ← Macro analysis (v2)
│   ├── SKILL-equity.md               ← US equities overview (v2)
│   ├── SKILL-crypto.md               ← Crypto analysis (v2)
│   ├── SKILL-bonds.md                ← Bonds & rates (v2)
│   ├── SKILL-commodities.md          ← Commodities (v2)
│   ├── SKILL-forex.md                ← Forex (v2)
│   ├── SKILL-international.md        ← International/EM
│   ├── SKILL-profile-setup.md        ← Interactive investment profile wizard
│   ├── SKILL-[thesis/earnings/etc.]  ← 7 specialized tools
│   ├── sectors/                      ← 11 GICS sector sub-agent skills
│   ├── alternative-data/             ← 4 alternative data sub-agent skills
│   └── institutional/                ← 2 institutional intelligence skills
│
├── templates/                        ← Output templates (do not delete)
│   ├── master-digest.md              ← Used by new-day.sh to scaffold DIGEST.md
│   ├── sector-report.md              ← Sector sub-agent output template
│   ├── alt-data-report.md            ← Alternative data report template
│   ├── institutional-report.md       ← Institutional intelligence template
│   ├── weekly-digest.md
│   └── monthly-digest.md
│
├── outputs/
│   ├── daily/YYYY-MM-DD/             ← One folder per day (v2)
│   │   ├── DIGEST.md                 ← Master synthesized output
│   │   ├── macro.md bonds.md ...     ← 9 segment files
│   │   └── sectors/technology.md ... ← 11 sector files
│   ├── weekly/                       ← Weekly rollups
│   ├── monthly/                      ← Monthly rollups
│   └── deep-dives/                   ← Standalone research notes
│
├── scripts/                          ← Bash automation (see Quick Commands above)
├── agents/                           ← Named agent role definitions
└── docs/agentic/                     ← Cross-platform agentic documentation
```

---

## Skill File Format

Skill files use YAML frontmatter followed by step-by-step Markdown instructions:

```markdown
---
name: skill-identifier
description: >
  Trigger phrases that invoke this skill.
---

# Skill Name

## Inputs
- files to read first

## Steps
### 1. Step name
- detailed instructions...

## Output Format
...template snippets...
```

**When editing skills**: maintain existing frontmatter, keep output format tables intact.

---

## Output Conventions

Daily outputs live in `outputs/daily/YYYY-MM-DD/`:
- `DIGEST.md` — master synthesized output (compiled last, in Phase 7)
- `{segment}.md` — individual phase outputs (macro, bonds, etc.)
- `sectors/{sector}.md` — sector sub-agent outputs

**Never modify** `outputs/daily/` files directly — they are generated by Claude during a digest session.

---

## Config File Conventions

- `config/watchlist.md` — edit freely to add/remove tracked assets
- `config/investment-profile.md` — authoritative source for trading style, risk profile, ETF universe, and preferences
- `config/preferences.md` — redirect stub pointing to investment-profile.md
- `config/hedge-funds.md` — add/remove tracked funds from the CIK registry
- `config/data-sources.md` — update URLs, add new X accounts or data sources

---

## Development Guidelines

### When editing skill files:
1. Read the existing file completely before editing
2. Preserve YAML frontmatter exactly — changing `name:` breaks Claude's routing
3. Keep output format templates — downstream skills parse specific headers
4. Test by checking that the modified skill still references the correct output file paths

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

## 7-Phase Daily Pipeline (Overview)

| Phase | What Runs | Output File |
|-------|-----------|-------------|
| 1 | Alt Data (sentiment + CTA + options + politician) | `alt-data.md` |
| 2 | Institutional (ETF flows + hedge fund intel) | `institutional.md` |
| 3 | Macro Analysis | `macro.md` |
| 4A-E | Asset Classes (bonds, commodities, forex, crypto, international) | 5 files |
| 5A | US Equities Overview | `equities.md` |
| 5B-L | 11 GICS Sector Sub-Agents | `sectors/*.md` |
| 7 | DIGEST.md Synthesis | `DIGEST.md` |

Full instructions: `skills/SKILL-orchestrator.md`

---

## Current Portfolio Context

- **Active holdings**: IAU (gold, ~20%), XLE (energy, 12%), DBO (oil, 5%), XLV (healthcare, 8%), XLP (staples, 8%), BIL/SHY (short T-bills, ~47%)
- **Macro regime**: Geopolitical shock (Iran War) → WTI $112, Gold ATH, VIX elevated
- **Key invalidation triggers**: WTI <$80 (energy thesis breaks), Gold <$4,200 (safe haven breaks)

*Update `config/portfolio.json` when allocations change. Theses are tracked in the DIGEST.md Thesis Tracker table.*
