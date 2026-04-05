# Market Digest — Agent Instructions

> Universal entry point for AI agents (OpenHands, Devin, Cline, generic LLM agents).
> This file describes the repository, its conventions, and how an agent should operate within it.

---

## Repository Purpose

**market-digest** is a structured daily market intelligence system. It uses a 7-phase AI-orchestrated pipeline to generate 22 output files per day covering all global asset classes — macro, equities (11 GICS sectors), crypto, bonds, commodities, forex, international, plus alternative data (sentiment, CTA positioning, options, politician signals) and institutional intelligence (ETF flows, hedge fund intel).

The system is driven by **skill files** (`skills/*.md`) which are step-by-step instruction sets for an AI agent. An agent's job is to:
1. Read skill files to understand what analysis to run
2. Search live web data (never use training data for prices)
3. Write outputs to the correct file paths
4. Update rolling memory files after each session

---

## Quickstart for Agents

### Full daily digest:
```
Read: skills/SKILL-orchestrator.md
Follow: All 7 phases in order
Output: outputs/daily/YYYY-MM-DD/DIGEST.md
```

### Single segment:
```
Read: scripts/run-segment.sh [segment-name]  (prints the prompt)
Or directly: Read skills/SKILL-{segment}.md
Output: outputs/daily/YYYY-MM-DD/{segment}.md
```

### Synthesize digest from completed segments:
```
Read: scripts/combine-digest.sh  (prints the prompt)
Output: outputs/daily/YYYY-MM-DD/DIGEST.md
```

---

## Repository Structure

```
config/
  watchlist.md        ← Assets to track (read at every session start)
  preferences.md      ← Trading style, risk profile, active theses (read at every session start)
  hedge-funds.md      ← 16 tracked hedge funds with CIK, X handles, style
  data-sources.md     ← 30+ X accounts, data URLs, economic calendars
  email-research.md   ← Dedicated Gmail setup + subscription list

skills/
  SKILL-orchestrator.md       ← MASTER 7-phase pipeline
  SKILL-digest.md             ← Legacy → points to orchestrator
  SKILL-macro.md              ← Macro analysis
  SKILL-equity.md             ← US equities overview
  SKILL-crypto.md             ← Crypto analysis
  SKILL-bonds.md              ← Bonds & rates
  SKILL-commodities.md        ← Commodities
  SKILL-forex.md              ← Forex
  SKILL-international.md      ← International/EM
  SKILL-[7 specialized tools] ← thesis, earnings, deep-dive, etc.
  sectors/                    ← 11 GICS sector sub-agent skills
  alternative-data/           ← 4 alt-data sub-agent skills
  institutional/              ← 2 institutional intelligence skills

memory/                       ← 23 rolling append-only research logs
  BIAS-TRACKER.md             ← Daily bias table (14 columns)
  THESES.md                   ← Active thesis register
  macro/ equity/ crypto/ bonds/ commodities/ forex/
  international/
  sectors/{10 sector dirs}/
  alternative-data/{4 type dirs}/
  institutional/{2 type dirs}/

templates/
  master-digest.md            ← DIGEST.md template (used by new-day.sh)
  sector-report.md            ← Sector output template
  alt-data-report.md          ← Alt data template
  institutional-report.md     ← Institutional template

outputs/daily/YYYY-MM-DD/
  DIGEST.md                   ← Master output (compiled in Phase 7)
  macro.md bonds.md commodities.md forex.md crypto.md
  international.md equities.md alt-data.md institutional.md
  sectors/{11 sector files}

scripts/
  new-day.sh                  ← Creates folder structure, prints digest prompt
  status.sh                   ← Project health check
  run-segment.sh              ← Single-segment prompt printer
  combine-digest.sh           ← Synthesis prompt printer
  git-commit.sh               ← Commit outputs
  weekly-rollup.sh            ← Weekly synthesis
  memory-search.sh            ← Search all ROLLING.md files

agents/                       ← Named agent role definitions
docs/agentic/                 ← Full agentic documentation suite
```

---

## Core Behavioral Rules

### Always:
- **Search the web** for current prices, yields, news. Never use training data cutoff values.
- **Read config/** at session start (watchlist.md + preferences.md minimum)
- **Read relevant memory ROLLING.md files** for continuity before running any analysis
- **Update memory files** after completing each segment — append new bullets, never delete history
- **Save outputs** to the correct path: `outputs/daily/YYYY-MM-DD/{segment}.md`
- **State a bias** (Bullish/Bearish/Neutral/Conflicted) with rationale for every segment
- Run **Phase 1 (alternative data) BEFORE Phase 3 (macro)** — positioning informs regime read

### Never:
- Use training data cutoff prices or news as "current" values
- Delete or overwrite existing memory file content — only append
- Skip memory updates — they are the system's long-term intelligence layer
- Produce hedged, wishy-washy analysis — state the signal clearly
- Provide specific buy/sell investment advice (analysis and bias are fine; specific financial advice is not)

---

## Memory File Protocol

Memory files are append-only logs. After completing each segment, append:

```markdown
## YYYY-MM-DD
- [Most important observation with data point]
- [Second key finding]
- [Thesis evolution or regime implication]
- [Portfolio-relevant signal if applicable]
```

**Complete list of memory files to update in a full digest session (23 files):**

Core: `memory/macro/ROLLING.md`, `memory/equity/ROLLING.md`, `memory/crypto/ROLLING.md`, `memory/bonds/ROLLING.md`, `memory/commodities/ROLLING.md`, `memory/forex/ROLLING.md`, `memory/international/ROLLING.md`

Sectors (10): `memory/sectors/{technology,healthcare,energy,financials,consumer,industrials,utilities,materials,real-estate,comms}/ROLLING.md`

Alt Data (4): `memory/alternative-data/{sentiment,cta-positioning,options,politician}/ROLLING.md`

Institutional (2): `memory/institutional/{flows,hedge-funds}/ROLLING.md`

Also update: `memory/BIAS-TRACKER.md` (append one row)

---

## 7-Phase Pipeline Summary

| Phase | Content | Key Skill File |
|-------|---------|----------------|
| 1 | Alternative Data (sentiment, CTA, options, politician) | `skills/alternative-data/SKILL-*.md` |
| 2 | Institutional Intelligence (ETF flows, HF intel) | `skills/institutional/SKILL-*.md` |
| 3 | Macro Analysis | `skills/SKILL-macro.md` |
| 4A | Bonds & Rates | `skills/SKILL-bonds.md` |
| 4B | Commodities | `skills/SKILL-commodities.md` |
| 4C | Forex | `skills/SKILL-forex.md` |
| 4D | Crypto | `skills/SKILL-crypto.md` |
| 4E | International | `skills/SKILL-international.md` |
| 5A | US Equities Overview | `skills/SKILL-equity.md` |
| 5B-L | 11 GICS Sector Sub-Agents | `skills/sectors/SKILL-sector-*.md` |
| 6 | Memory + Bias Tracker Update | All 23 ROLLING.md files |
| 7 | DIGEST.md Synthesis | `templates/master-digest.md` |

---

## Output File Naming

```
outputs/daily/YYYY-MM-DD/DIGEST.md          ← Master
outputs/daily/YYYY-MM-DD/macro.md           ← Phase 3
outputs/daily/YYYY-MM-DD/bonds.md           ← Phase 4A
outputs/daily/YYYY-MM-DD/commodities.md     ← Phase 4B
outputs/daily/YYYY-MM-DD/forex.md           ← Phase 4C
outputs/daily/YYYY-MM-DD/crypto.md          ← Phase 4D
outputs/daily/YYYY-MM-DD/international.md   ← Phase 4E
outputs/daily/YYYY-MM-DD/equities.md        ← Phase 5A
outputs/daily/YYYY-MM-DD/alt-data.md        ← Phase 1
outputs/daily/YYYY-MM-DD/institutional.md   ← Phase 2
outputs/daily/YYYY-MM-DD/sectors/technology.md    ← Phase 5B
outputs/daily/YYYY-MM-DD/sectors/healthcare.md    ← Phase 5C
outputs/daily/YYYY-MM-DD/sectors/energy.md        ← Phase 5D
outputs/daily/YYYY-MM-DD/sectors/financials.md    ← Phase 5E
outputs/daily/YYYY-MM-DD/sectors/consumer-staples.md ← Phase 5F
outputs/daily/YYYY-MM-DD/sectors/consumer-disc.md  ← Phase 5G
outputs/daily/YYYY-MM-DD/sectors/industrials.md   ← Phase 5H
outputs/daily/YYYY-MM-DD/sectors/utilities.md     ← Phase 5I
outputs/daily/YYYY-MM-DD/sectors/materials.md     ← Phase 5J
outputs/daily/YYYY-MM-DD/sectors/real-estate.md   ← Phase 5K
outputs/daily/YYYY-MM-DD/sectors/comms.md         ← Phase 5L
```

---

## Named Agents

Specialized agent roles are defined in `agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| Orchestrator | `agents/orchestrator.agent.md` | Full 7-phase pipeline driver |
| Sector Analyst | `agents/sector-analyst.agent.md` | Run one or more sector deep-dives |
| Alt Data Analyst | `agents/alt-data-analyst.agent.md` | Phase 1 alternative data gathering |
| Institutional Analyst | `agents/institutional-analyst.agent.md` | Phase 2 smart money intelligence |
| Research Assistant | `agents/research-assistant.agent.md` | Ad-hoc research queries |
| Thesis Tracker | `agents/thesis-tracker.agent.md` | Portfolio thesis management |

---

## Platform-Specific Documentation

See `docs/agentic/PLATFORMS.md` for setup instructions for:
- Claude Code (this file's home)
- Claude.ai Projects
- GitHub Copilot
- Cursor
- Windsurf
- Aider
- OpenHands
- Devin
