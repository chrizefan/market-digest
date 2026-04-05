# digiquant-atlas

A daily market intelligence system with a 7-phase AI-orchestrated pipeline. Produces structured research across all asset classes: equities, macro, crypto, bonds, commodities, forex, international markets, and all 11 S&P sectors. Outputs are version-controlled and 24 append-only rolling memory files compound research across sessions.

## Quick Start

```bash
./scripts/new-day.sh        # Create today's folder + print full digest prompt
./scripts/status.sh         # Project health check
./scripts/git-commit.sh     # Commit all outputs
```

Paste the output of `new-day.sh` into Claude Code, Claude.ai, Cursor, or any AI platform.

## 7-Phase Pipeline

| Phase | Description | Output |
|-------|-------------|--------|
| 1 | Alternative Data (sentiment, CTA, options flow, politician trades) | `alt-data.md` |
| 2 | Institutional Intel (dark pools, hedge fund moves, 13F) | `institutional.md` |
| 3 | Macro Regime (rates, dollar, risk-on/off) | `macro.md` |
| 4 | Asset Classes (bonds, commodities, forex, crypto, international) | 5 segment files |
| 5 | Equities + 11 Sectors (each as independent sub-agent) | `equities.md` + 11 sector files |
| 6 | Earnings & Events | `earnings.md` |
| 7 | Synthesis | `DIGEST.md` |

## Project Structure

```
digiquant-atlas/
├── CLAUDE.md                    ← Claude Code entry point (auto-read)
├── AGENTS.md                    ← Cross-platform agent entry point
│
├── config/
│   ├── watchlist.md             ← Tracked tickers, sectors, assets
│   ├── preferences.md           ← Trading style, risk profile, active theses
│   ├── hedge-funds.md           ← Tracked institutional players
│   ├── data-sources.md          ← Data and research feed catalog
│   └── email-research.md        ← Newsletter + research sources
│
├── skills/
│   ├── SKILL-orchestrator.md    ← Master 7-phase pipeline driver
│   ├── SKILL-macro.md           ← Phase 3
│   ├── SKILL-equity.md          ← Phase 5A
│   ├── SKILL-bonds.md           ← Phase 4A
│   ├── SKILL-commodities.md     ← Phase 4B
│   ├── SKILL-forex.md           ← Phase 4C
│   ├── SKILL-crypto.md          ← Phase 4D
│   ├── SKILL-international.md   ← Phase 4E
│   ├── SKILL-earnings.md        ← Phase 6
│   ├── SKILL-digest.md          ← Phase 7
│   ├── SKILL-premarket-pulse.md ← Phase 1 premarket
│   ├── SKILL-deep-dive.md       ← Ad-hoc ticker research
│   ├── SKILL-thesis.md          ← Thesis builder
│   ├── SKILL-thesis-tracker.md  ← Thesis review
│   ├── SKILL-sector-rotation.md ← Rotation analysis
│   ├── SKILL-sector-heatmap.md  ← Sector heatmap
│   ├── sectors/                 ← 11 sector sub-agent skills
│   ├── alternative-data/        ← 4 alt-data skills (Phase 1)
│   └── institutional/           ← 2 institutional skills (Phase 2)
│
├── memory/
│   ├── BIAS-TRACKER.md          ← 14-column daily cross-asset bias table
│   ├── THESES.md                ← Active portfolio theses
│   ├── macro/ROLLING.md
│   ├── bonds/ROLLING.md
│   ├── commodities/ROLLING.md
│   ├── forex/ROLLING.md
│   ├── crypto/ROLLING.md
│   ├── equity/ROLLING.md
│   ├── sectors/{11 dirs}/ROLLING.md
│   ├── alternative-data/{4 dirs}/ROLLING.md
│   ├── institutional/{2 dirs}/ROLLING.md
│   └── international/ROLLING.md
│
├── templates/                   ← Output templates with {{PLACEHOLDER}} syntax
├── agents/                      ← Named agent role definitions
├── docs/agentic/                ← Full agentic documentation suite
├── scripts/                     ← Bash utility scripts
└── outputs/
    ├── daily/YYYY-MM-DD/        ← 22 files per day
    ├── weekly/                  ← Weekly syntheses
    ├── monthly/                 ← Monthly rollups
    └── deep-dives/              ← Ad-hoc ticker research
```

## AI Platform Setup

| Platform | Config File | Auto-read? |
|----------|------------|-----------|
| Claude Code | `CLAUDE.md` | Yes — run `claude` from repo root |
| Claude.ai Projects | `CLAUDE_PROJECT_INSTRUCTIONS.md` | Paste into Project Instructions |
| GitHub Copilot | `.github/copilot-instructions.md` | Yes |
| Cursor | `.cursor/rules/` (v2) or `.cursorrules` | Yes |
| Windsurf | `.windsurfrules` | Yes |
| OpenHands / Devin | `AGENTS.md` | Provide as context |

Full setup guide: `docs/agentic/PLATFORMS.md`

## Setup Checklist

- [ ] Edit `config/watchlist.md` with your tickers, sectors, and crypto
- [ ] Edit `config/preferences.md` with your trading style and risk profile
- [ ] Edit `config/hedge-funds.md` with institutions you track
- [ ] Push to a private GitHub repo
- [ ] Run `./scripts/new-day.sh` to begin your first session

## Memory System

24 append-only `ROLLING.md` files track evolving research across sessions. Each is read before its corresponding analysis runs, then appended with new findings. This creates compounding intelligence — each session builds on all prior sessions.

Memory files are **never rewritten** — only appended. The git history is a timeline of your research evolution.

See `docs/agentic/MEMORY-SYSTEM.md` for the complete 24-file inventory.

## Documentation

| File | Contents |
|------|----------|
| `CLAUDE.md` | Claude Code reference |
| `AGENTS.md` | Cross-platform behavioral rules |
| `docs/agentic/README.md` | Agentic docs entry point |
| `docs/agentic/ARCHITECTURE.md` | System design + data flows |
| `docs/agentic/PLATFORMS.md` | Per-platform setup guide |
| `docs/agentic/WORKFLOWS.md` | Daily/weekly/monthly workflows |
| `docs/agentic/MEMORY-SYSTEM.md` | Memory file reference |
| `docs/agentic/SKILLS-CATALOG.md` | All 33+ skills indexed |
| `docs/agentic/PROMPTS.md` | Copy-paste prompt patterns |

## Scripts

```bash
./scripts/new-day.sh              # Create daily folder + print digest prompt
./scripts/status.sh               # Project health check
./scripts/run-segment.sh {name}   # Print single segment prompt
./scripts/combine-digest.sh       # Print Phase 7 synthesis prompt
./scripts/git-commit.sh           # Commit outputs + memory
./scripts/weekly-rollup.sh        # Weekly synthesis prompt
./scripts/memory-search.sh "BTC"  # Search all 24 rolling memory files
./scripts/thesis.sh add "name"    # Add new thesis
./scripts/thesis.sh review        # Review active theses
```
