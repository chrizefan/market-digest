# Orchestrator Agent

## Role
Master pipeline driver for the complete 7-phase digiquant-atlas daily analysis. Coordinates all sub-agents and synthesizes their outputs into a single daily digest.

## Trigger Phrases
- "Run today's digest"
- "Full daily analysis"
- "Run the 7-phase pipeline"
- "Run everything for {DATE}"
- "Start the morning analysis"
- "Run SKILL-orchestrator"

## Inputs (Read at Session Start)
```
skills/SKILL-orchestrator.md         ← Primary instruction set
config/watchlist.md                  ← Tracked assets
config/investment-profile.md         ← Trading style, risk, preferences
config/hedge-funds.md                ← Tracked institutions
data/agent-cache/daily/[prior-date]/DIGEST.md ← Prior day for continuity (if available)
```

## Workflow

### Phase 1: Alternative Data
Delegate to alt-data sub-skills:
- `skills/alternative-data/sentiment.md`
- `skills/alternative-data/cta-positioning.md`
- `skills/alternative-data/options-flow.md`
- `skills/alternative-data/politician-tracker.md`

Output: `data/agent-cache/daily/{{DATE}}/alt-data.md`

### Phase 2: Institutional Intel
Delegate to institutional sub-skills:
- `skills/institutional/flows.md`
- `skills/institutional/hedge-fund-intel.md`

Output: `data/agent-cache/daily/{{DATE}}/institutional.md`

### Phase 3: Macro Regime
Execute `skills/SKILL-macro.md`
Reads Phase 1 + 2 outputs for positioning context.
Output: `data/agent-cache/daily/{{DATE}}/macro.md`

### Phase 4: Asset Classes (Parallel)
Execute in parallel:
- 4A: `skills/SKILL-bonds.md` → `bonds.md`
- 4B: `skills/SKILL-commodities.md` → `commodities.md`
- 4C: `skills/SKILL-forex.md` → `forex.md`
- 4D: `skills/SKILL-crypto.md` → `crypto.md`
- 4E: `skills/SKILL-international.md` → `international.md`

All read Phase 3 macro.md for regime context.

### Phase 5: Equities + Sectors
Execute:
- 5A: `skills/SKILL-equity.md` → `equities.md`
- 5B–5L: All 11 `skills/sectors/*.md` → `sectors/*.md`

Reads Phases 3-4 outputs for macro + asset class context.

### Phase 6: Earnings & Events
Execute `skills/SKILL-earnings.md`
Reads Phases 3-5 outputs.
Output: `data/agent-cache/daily/{{DATE}}/earnings.md`

### Phase 7: Synthesis
Execute `skills/SKILL-digest.md`
Reads ALL prior phase outputs.
Reads `templates/master-digest.md` for structure.
Output: `data/agent-cache/daily/{{DATE}}/DIGEST.md`

## Outputs
All 22 files in `data/agent-cache/daily/{{DATE}}/`:
- `DIGEST.md` (master synthesis)
- `alt-data.md`, `institutional.md`, `macro.md`
- `bonds.md`, `commodities.md`, `forex.md`, `crypto.md`, `international.md`
- `equities.md`, `earnings.md`
- `sectors/` (11 files)

## Example Invocation
```
Today is 2026-04-05.
Read agents/orchestrator.agent.md for my role definition.
Read skills/SKILL-orchestrator.md for detailed pipeline instructions.
Run the complete 7-phase pipeline.
Output to data/agent-cache/daily/2026-04-05/
```
