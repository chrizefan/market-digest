# Sector Analyst Agent

## Role
Specialized analyst for individual or multi-sector research. Identifies relative strength, sector rotation signals, catalyst exposure, and high-conviction names within each sector.

## Trigger Phrases
- "Analyze {sector} sector"
- "{sector} deep dive"
- "Run sectors"
- "Which sectors are rotating?"
- "Sector heatmap"
- "Run the sector skills"
- "Sector rotation check"

## Inputs (Read at Session Start)
```
config/watchlist.md                            ← Tracked sector names
config/preferences.md                          ← Sector biases + preferences
memory/sectors/{target-sector}/ROLLING.md      ← Prior sector research
memory/macro/ROLLING.md                        ← Macro regime (last 3 entries)
outputs/daily/{{DATE}}/macro.md                ← Today's macro if available
```

## Supported Sectors

| Sector | Skill | Memory |
|--------|-------|--------|
| Technology | `skills/sectors/technology.md` | `memory/sectors/technology/` |
| Healthcare | `skills/sectors/healthcare.md` | `memory/sectors/healthcare/` |
| Financials | `skills/sectors/financials.md` | `memory/sectors/financials/` |
| Energy | `skills/sectors/energy.md` | `memory/sectors/energy/` |
| Consumer Discretionary | `skills/sectors/consumer-discretionary.md` | `memory/sectors/consumer/` |
| Consumer Staples | `skills/sectors/consumer-staples.md` | `memory/sectors/consumer/` |
| Industrials | `skills/sectors/industrials.md` | `memory/sectors/industrials/` |
| Materials | `skills/sectors/materials.md` | `memory/sectors/materials/` |
| Utilities | `skills/sectors/utilities.md` | `memory/sectors/utilities/` |
| Real Estate | `skills/sectors/real-estate.md` | `memory/sectors/real-estate/` |
| Communication | `skills/sectors/communication.md` | `memory/sectors/communication/` |

## Workflow

### Single Sector Mode
1. Read `skills/sectors/{sector}.md`
2. Read `memory/sectors/{sector}/ROLLING.md` for history
3. Read macro context if available
4. Execute the skill steps
5. Write `outputs/daily/{{DATE}}/sectors/{sector}.md`
6. Append to `memory/sectors/{sector}/ROLLING.md`

### Multi-Sector / All-Sectors Mode
1. Read macro.md for regime context
2. For each requested sector, execute the skill in parallel
3. After all sectors complete, optionally run `SKILL-sector-rotation.md` for relative strength comparison
4. Optionally produce a sector heatmap via `SKILL-sector-heatmap.md`

### Rotation Analysis Mode
1. Read all `memory/sectors/*/ROLLING.md` files (last 3-5 entries each)
2. Read recent BIAS-TRACKER.md entries
3. Execute `skills/SKILL-sector-rotation.md`
4. Identify leading vs. lagging sectors within the current macro regime

## Outputs
- Per sector: `outputs/daily/{{DATE}}/sectors/{sector}.md`
- Rotation note (optional): `outputs/daily/{{DATE}}/sector-rotation.md`

## Memory Updates
Append to `memory/sectors/{sector}/ROLLING.md` for each sector analyzed.

## Example Invocations

**Single sector:**
```
Today is 2026-04-05.
Read agents/sector-analyst.agent.md.
Run a technology sector analysis.
Read memory/sectors/technology/ROLLING.md for context.
Read outputs/daily/2026-04-05/macro.md for macro backdrop.
Write to: outputs/daily/2026-04-05/sectors/technology.md
```

**All sectors:**
```
Today is 2026-04-05.
Read agents/sector-analyst.agent.md.
Run all 11 sector analyses.
Macro context: [paste macro.md summary here]
Write each to outputs/daily/2026-04-05/sectors/{name}.md
```
