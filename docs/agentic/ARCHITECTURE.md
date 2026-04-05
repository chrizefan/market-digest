# Market Digest — System Architecture

## Overview

Market Digest is a modular, append-memory intelligence system. An AI agent reads config and memory, executes skill files as instruction sets, writes structured outputs, then appends findings to rolling memory logs.

```
┌─────────────────────────────────────────────────————┐
│                   SESSION START                      │
│  Read: config/ + memory/*/ROLLING.md                 │
└───────────────────┬──────────────────────────────────┘
                    │
     ┌──────────────▼──────────────┐
     │   SKILL-orchestrator.md     │  ← Master pipeline driver
     │   7-phase dispatcher        │
     └──┬──────────────────────────┘
        │
   ┌────▼────────────────────────────────────────────────────┐
   │  PHASE 1: Alternative Data                               │
   │  skills/alternative-data/sentiment.md                   │
   │  skills/alternative-data/cta-positioning.md             │
   │  skills/alternative-data/options-flow.md                │
   │  skills/alternative-data/politician-tracker.md          │
   │  → outputs/daily/{{DATE}}/alt-data.md                  │
   └────────────────────────────────┬────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────┐
   │  PHASE 2: Institutional Intel                            │
   │  skills/institutional/flows.md                          │
   │  skills/institutional/hedge-fund-intel.md               │
   │  → outputs/daily/{{DATE}}/institutional.md             │
   └────────────────────────────────┬────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────┐
   │  PHASE 3: Macro Regime                                   │
   │  skills/SKILL-macro.md                                  │
   │  → outputs/daily/{{DATE}}/macro.md                     │
   └────────────────────────────────┬────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────┐
   │  PHASE 4: Asset Classes (parallel sub-agents)            │
   │  4A SKILL-bonds.md         → bonds.md                  │
   │  4B SKILL-commodities.md   → commodities.md            │
   │  4C SKILL-forex.md         → forex.md                  │
   │  4D SKILL-crypto.md        → crypto.md                 │
   │  4E SKILL-international.md → international.md          │
   └────────────────────────────────┬────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────┐
   │  PHASE 5: Equities + Sectors                             │
   │  5A SKILL-equity.md        → equities.md               │
   │  5B-5L 11 sector skills    → sectors/*.md              │
   └────────────────────────────────┬────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────┐
   │  PHASE 6: Earnings & Events                              │
   │  SKILL-earnings.md         → earnings.md               │
   └────────────────────────────────┬────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────┐
   │  PHASE 7: Synthesis                                      │
   │  SKILL-digest.md           → DIGEST.md                 │
   └─────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────┐
                    │  MEMORY UPDATE             │
                    │  Append to 23 ROLLING.md  │
                    │  Update BIAS-TRACKER.md   │
                    └───────────────────────────┘
```

## Why This Phase Order?

Phase 1 (Alt Data) before Phase 3 (Macro) is intentional. CTA positioning and sentiment data inform the regime call — not the reverse. An agent must know what the crowd IS doing before assessing what the macro MEANS.

Phase 2 (Institutional) before Phase 3 provides dark pool prints and large block trades as additional macro evidence.

## Data Flow Principles

1. **Each phase reads prior phases' outputs** — phases are not independent
2. **Memory provides continuity** — each skill reads its matching ROLLING.md before writing
3. **Config drives scope** — `watchlist.md` determines which tickers to cover
4. **Templates standardize format** — output files follow `templates/*.md` structure

## File Dependency Map

```
config/watchlist.md ──────────────────────────┐
config/preferences.md ────────────────────────┤
config/hedge-funds.md ───────────────┐         │
config/data-sources.md ──────────────┤         │
                                     │         │
                        Phase 2 reads│         │All skills read
                                     ▼         ▼
memory/*/ROLLING.md ─────────────→ Each skill file
                                       │
                              produces │
                                       ▼
                         outputs/daily/YYYY-MM-DD/
                                       │
                              feeds into│
                                       ▼
                              DIGEST.md (Phase 7)
```

## Repository Structure

```
market-digest/
├── CLAUDE.md                    ← Claude Code entry point
├── AGENTS.md                    ← Cross-platform entry point
├── CLAUDE_PROJECT_INSTRUCTIONS.md  ← Claude.ai Projects paste
│
├── config/
│   ├── watchlist.md             ← Watched tickers + asset classes
│   ├── preferences.md           ← Trading style, risk tolerance, theses
│   ├── hedge-funds.md           ← Tracked hedge funds + their known positions
│   ├── data-sources.md          ← API and data source catalog
│   └── email-research.md        ← Research newsletter sources
│
├── skills/
│   ├── SKILL-orchestrator.md    ← Master 7-phase pipeline
│   ├── SKILL-macro.md           ← Phase 3 macro
│   ├── SKILL-equity.md          ← Phase 5A equities
│   ├── SKILL-bonds.md           ← Phase 4A
│   ├── SKILL-commodities.md     ← Phase 4B
│   ├── SKILL-forex.md           ← Phase 4C
│   ├── SKILL-crypto.md          ← Phase 4D
│   ├── SKILL-international.md   ← Phase 4E
│   ├── SKILL-earnings.md        ← Phase 6
│   ├── SKILL-digest.md          ← Phase 7
│   ├── SKILL-premarket-pulse.md ← Phase 1 premarket
│   ├── SKILL-deep-dive.md       ← Ad-hoc ticker deep dive
│   ├── SKILL-thesis.md          ← Thesis builder
│   ├── SKILL-thesis-tracker.md  ← Thesis reviewer
│   ├── SKILL-sector-rotation.md ← Sector rotation analysis
│   ├── SKILL-sector-heatmap.md  ← Sector heatmap
│   ├── sectors/                 ← 11 sector sub-agent skills
│   ├── alternative-data/        ← 4 alt-data skills
│   └── institutional/           ← 2 institutional skills
│
├── memory/
│   ├── BIAS-TRACKER.md          ← 14-column daily bias table
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
├── templates/
│   ├── master-digest.md         ← DIGEST.md template
│   ├── segment-report.md        ← Single segment template
│   ├── sector-report.md         ← Sector output template
│   ├── alt-data-report.md       ← Alt data output template
│   ├── institutional-report.md  ← Institutional report template
│   ├── weekly-digest.md         ← Weekly synthesis template
│   └── monthly-digest.md        ← Monthly rollup template
│
├── scripts/
│   ├── new-day.sh               ← Create daily output folder
│   ├── status.sh                ← Project health check
│   ├── run-segment.sh           ← Print single segment prompt
│   ├── combine-digest.sh        ← Print synthesis prompt
│   ├── git-commit.sh            ← Commit outputs
│   ├── weekly-rollup.sh         ← Weekly synthesis prompt
│   ├── monthly-rollup.sh        ← Monthly rollup
│   ├── memory-search.sh         ← Search all ROLLING.md files
│   ├── archive.sh               ← Archive old outputs
│   ├── thesis.sh                ← Thesis management
│   └── watchlist-check.sh       ← Watchlist validation
│
├── agents/                      ← Named agent role definitions
├── docs/agentic/                ← This documentation suite
└── outputs/
    ├── daily/                   ← Per-day research outputs
    ├── weekly/                  ← Weekly syntheses
    ├── monthly/                 ← Monthly rollups
    └── deep-dives/              ← Ad-hoc ticker research
```

## Memory System Design

23 ROLLING.md files form the system's long-term memory. Each covers one research domain. At session start, relevant files are read to establish prior context. At session end, new findings are appended.

This creates a compounding intelligence effect: each session's analysis is informed by all prior sessions' research in that domain.

See `MEMORY-SYSTEM.md` for the complete 23-file inventory and format specification.

## Skill File Format

```yaml
---
name: skill-identifier
description: One-line routing description
---

## Purpose
What this skill does.

### 1. Read Context
Read config/ and memory/ files.

### 2. ...

## Output Format
Where and how to write output.

## Memory Update
Which ROLLING.md to append, and in what format.
```

## Output Volume Per Day

- 1 master `DIGEST.md`
- 10 segment markdown files (macro, bonds, commodities, forex, crypto, international, equities, alt-data, institutional, earnings)
- 11 sector markdown files in `sectors/`
- **Total: 22 files per day session**
