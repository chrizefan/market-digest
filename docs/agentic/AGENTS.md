# Agent Role Catalog

Named agents defined in `agents/`. Each agent is a specialized role with a defined set of skills, inputs, and outputs.

## Orchestrator

**File**: `agents/orchestrator.agent.md`
**Trigger phrases**: "Run today's digest", "Full analysis", "Run the pipeline", "7-phase run"

**Role**: Drives the complete 7-phase daily pipeline. Reads all config and memory, delegates to sub-agents for each phase, synthesizes into DIGEST.md.

**Skills used**: All skills via `SKILL-orchestrator.md`
**Outputs**: All 22 daily files in `outputs/daily/YYYY-MM-DD/`
**Memory updated**: All 23 ROLLING.md files + BIAS-TRACKER.md

---

## Sector Analyst

**File**: `agents/sector-analyst.agent.md`
**Trigger phrases**: "Analyze tech sector", "Healthcare deep dive", "Run sectors", "Which sectors are rotating?"

**Role**: Runs one or more sector analyses using the 11 sector skill files. Identifies relative strength, catalyst exposure, rotation signals, and watchlist names within the sector.

**Skills used**: `skills/sectors/{sector}.md`, `SKILL-sector-rotation.md`, `SKILL-sector-heatmap.md`
**Outputs**: `outputs/daily/YYYY-MM-DD/sectors/{sector}.md`
**Memory updated**: `memory/sectors/{sector}/ROLLING.md`

---

## Alt Data Analyst

**File**: `agents/alt-data-analyst.agent.md`
**Trigger phrases**: "Phase 1", "Alternative data", "Sentiment scan", "CTA positioning", "Options flow", "Politician trades"

**Role**: Runs Phase 1 of the pipeline — aggregates retail sentiment, CTA positioning signals, unusual options activity, and politician trade disclosures. Flags anomalous positioning before macro analysis.

**Skills used**:
- `skills/alternative-data/sentiment.md`
- `skills/alternative-data/cta-positioning.md`
- `skills/alternative-data/options-flow.md`
- `skills/alternative-data/politician-tracker.md`

**Outputs**: `outputs/daily/YYYY-MM-DD/alt-data.md`
**Memory updated**: `memory/alternative-data/*/ROLLING.md` (4 files)

---

## Institutional Analyst

**File**: `agents/institutional-analyst.agent.md`
**Trigger phrases**: "Phase 2", "Institutional flows", "Dark pools", "Hedge fund moves", "13F", "Smart money"

**Role**: Runs Phase 2 — analyzes institutional positioning changes, dark pool prints, large block trades, and known hedge fund portfolio shifts (based on `config/hedge-funds.md`).

**Skills used**:
- `skills/institutional/flows.md`
- `skills/institutional/hedge-fund-intel.md`

**Outputs**: `outputs/daily/YYYY-MM-DD/institutional.md`
**Memory updated**: `memory/institutional/flows/ROLLING.md`, `memory/institutional/hedge-fund/ROLLING.md`

---

## Research Assistant

**File**: `agents/research-assistant.agent.md`
**Trigger phrases**: "What do we know about X?", "Deep dive on NVDA", "Research [ticker]", "Background on [topic]"

**Role**: Ad-hoc research agent for ticker or topic deep dives. Reads all memory files for existing context on the subject, synthesizes a structured research note, and optionally writes to `outputs/deep-dives/`.

**Skills used**: `SKILL-deep-dive.md`, sector skills (contextual), memory search
**Outputs**: `outputs/deep-dives/{ticker}-{date}.md` (optional)
**Memory updated**: Sector or equity ROLLING.md (contextual)

---

## Thesis Tracker

**File**: `agents/thesis-tracker.agent.md`
**Trigger phrases**: "Review theses", "Thesis update", "How is my [thesis] thesis doing?", "Add thesis", "Mark thesis invalid"

**Role**: Manages the portfolio thesis system. Reviews `memory/THESES.md` and `config/preferences.md` against current market evidence. Scores theses, flags those under threat, and manages lifecycle (building → confirmed → extended → exited).

**Skills used**: `SKILL-thesis-tracker.md`, `SKILL-thesis.md`
**Outputs**: Updates to `memory/THESES.md`, optional summary in session
**Memory updated**: `memory/THESES.md` (special file — not ROLLING.md format)

---

## Agent Invocation Matrix

| To accomplish... | Use agent | Reads | Writes |
|-----------------|-----------|-------|--------|
| Full daily digest | Orchestrator | All | All 22 files |
| Just macro regime | Orchestrator (Phase 3) | macro ROLLING.md | macro.md |
| Single sector | Sector Analyst | sector ROLLING.md | sectors/{name}.md |
| All 11 sectors | Sector Analyst | 11 sector ROLLING.md | 11 sector files |
| Positioning check | Alt Data Analyst | 4 alt-data ROLLING.md | alt-data.md |
| Smart money flows | Institutional Analyst | 2 inst ROLLING.md | institutional.md |
| Ticker research | Research Assistant | relevant memory | deep-dives/ |
| Portfolio review | Thesis Tracker | THESES.md + prefs | THESES.md |

---

## Agent Chaining

Agents can be chained for partial pipeline runs:

**Morning prep chain:**
1. Alt Data Analyst (Phase 1)
2. Institutional Analyst (Phase 2)
3. Orchestrator (Phases 3-7, reads Phase 1-2 outputs)

**Evening review chain:**
1. Sector Analyst (current day's sectors)
2. Thesis Tracker (review theses against sector results)

**Research workflow:**
1. Research Assistant (deep dive on ticker)
2. Thesis Tracker (does this support or challenge any thesis?)
