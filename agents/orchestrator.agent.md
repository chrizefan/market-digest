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
skills/orchestrator/SKILL.md         ← Primary instruction set
config/watchlist.md                  ← Tracked assets
config/investment-profile.md         ← Trading style, risk, preferences
config/hedge-funds.md                ← Tracked institutions
outputs/daily/[prior-date]/DIGEST.md ← Prior day for continuity (if available)
```

## Workflow

### Phase 1: Alternative Data
Delegate to alt-data sub-skills:
- `skills/alt-sentiment-news/SKILL.md`
- `skills/alt-cta-positioning/SKILL.md`
- `skills/alt-options-derivatives/SKILL.md`
- `skills/alt-politician-signals/SKILL.md`

Output: `outputs/daily/{{DATE}}/alt-data.md`

### Phase 2: Institutional Intel
Delegate to institutional sub-skills:
- `skills/inst-institutional-flows/SKILL.md`
- `skills/inst-hedge-fund-intel/SKILL.md`

Output: `outputs/daily/{{DATE}}/institutional.md`

### Phase 3: Macro Regime
Execute `skills/macro/SKILL.md`
Reads Phase 1 + 2 outputs for positioning context.
Output: `outputs/daily/{{DATE}}/macro.md`

### Phase 4: Asset Classes (Parallel)
Execute in parallel:
- 4A: `skills/bonds/SKILL.md` → `bonds.md`
- 4B: `skills/commodities/SKILL.md` → `commodities.md`
- 4C: `skills/forex/SKILL.md` → `forex.md`
- 4D: `skills/crypto/SKILL.md` → `crypto.md`
- 4E: `skills/international/SKILL.md` → `international.md`

All read Phase 3 macro.md for regime context.

### Phase 5: Equities + Sectors
Execute:
- 5A: `skills/equity/SKILL.md` → `equities.md`
- 5B–5L: All 11 `skills/sector-*/SKILL.md` → `sectors/*.md`

Reads Phases 3-4 outputs for macro + asset class context.

### Phase 6: Earnings & Events
Execute `skills/earnings/SKILL.md`
Reads Phases 3-5 outputs.
Output: `outputs/daily/{{DATE}}/earnings.md`

### Phase 7: Synthesis
Execute `skills/digest/SKILL.md`
Reads ALL prior phase outputs.
Daily digest is JSON-first: produce a digest snapshot JSON (schema: `templates/digest-snapshot-schema.json`) and publish via `scripts/materialize_snapshot.py`.
Markdown is rendered from JSON for display and stored in Supabase.

## Outputs
All 22 files in `outputs/daily/{{DATE}}/`:
- `DIGEST.md` (master synthesis)
- `alt-data.md`, `institutional.md`, `macro.md`
- `bonds.md`, `commodities.md`, `forex.md`, `crypto.md`, `international.md`
- `equities.md`, `earnings.md`
- `sectors/` (11 files)

## Example Invocation
```
Today is 2026-04-05.
Read agents/orchestrator.agent.md for my role definition.
Read skills/orchestrator/SKILL.md for detailed pipeline instructions.
Run the complete 7-phase pipeline.
Output to outputs/daily/2026-04-05/
```
