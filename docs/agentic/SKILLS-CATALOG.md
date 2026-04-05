# Skills Catalog

Complete index of all skill files in the `skills/` directory.

## How Skill Files Work

Skill files are Markdown instruction sets for AI agents. Each file:
1. Has YAML frontmatter with `name:` (routing key) and `description:`
2. Lists numbered steps for the agent to follow
3. Specifies output file path using `{{DATE}}`
4. Has a `## Memory Update` section specifying which ROLLING.md to append

---

## Core Pipeline Skills

| Skill File | Name | Phase | Output File | Memory Updated |
|-----------|------|-------|------------|----------------|
| `SKILL-orchestrator.md` | orchestrator | All | All 22 files | All |
| `SKILL-premarket-pulse.md` | premarket-pulse | 1 | alt-data.md | alt-data/sentiment |
| `SKILL-macro.md` | macro | 3 | macro.md | macro/ROLLING.md |
| `SKILL-bonds.md` | bonds | 4A | bonds.md | bonds/ROLLING.md |
| `SKILL-commodities.md` | commodities | 4B | commodities.md | commodities/ROLLING.md |
| `SKILL-forex.md` | forex | 4C | forex.md | forex/ROLLING.md |
| `SKILL-crypto.md` | crypto | 4D | crypto.md | crypto/ROLLING.md |
| `SKILL-international.md` | international | 4E | international.md | international/ROLLING.md |
| `SKILL-equity.md` | equity | 5A | equities.md | equity/ROLLING.md |
| `SKILL-earnings.md` | earnings | 6 | earnings.md | equity/ROLLING.md |
| `SKILL-digest.md` | digest | 7 | DIGEST.md | BIAS-TRACKER.md |

---

## Sector Skills (Phase 5B–5L)

All in `skills/sectors/`:

| Skill File | Output File | Memory |
|-----------|------------|--------|
| `sectors/technology.md` | sectors/technology.md | sectors/technology |
| `sectors/healthcare.md` | sectors/healthcare.md | sectors/healthcare |
| `sectors/financials.md` | sectors/financials.md | sectors/financials |
| `sectors/energy.md` | sectors/energy.md | sectors/energy |
| `sectors/consumer-discretionary.md` | sectors/consumer-discretionary.md | sectors/consumer |
| `sectors/consumer-staples.md` | sectors/consumer-staples.md | sectors/consumer |
| `sectors/industrials.md` | sectors/industrials.md | sectors/industrials |
| `sectors/materials.md` | sectors/materials.md | sectors/materials |
| `sectors/utilities.md` | sectors/utilities.md | sectors/utilities |
| `sectors/real-estate.md` | sectors/real-estate.md | sectors/real-estate |
| `sectors/communication.md` | sectors/communication.md | sectors/communication |

---

## Alternative Data Skills (Phase 1)

All in `skills/alternative-data/`:

| Skill File | What It Does | Output | Memory |
|-----------|-------------|--------|--------|
| `alternative-data/sentiment.md` | Retail sentiment (Fear/Greed, AAII, social) | alt-data.md section | alternative-data/sentiment |
| `alternative-data/cta-positioning.md` | CTA trend-following exposure estimates | alt-data.md section | alternative-data/cta |
| `alternative-data/options-flow.md` | Unusual options activity, gamma, put/call | alt-data.md section | alternative-data/options |
| `alternative-data/politician-tracker.md` | Congressional trade disclosures | alt-data.md section | alternative-data/politician |

---

## Institutional Skills (Phase 2)

All in `skills/institutional/`:

| Skill File | What It Does | Output | Memory |
|-----------|-------------|--------|--------|
| `institutional/flows.md` | Dark pools, block prints, ETF flows | institutional.md | institutional/flows |
| `institutional/hedge-fund-intel.md` | 13F analysis, prime brokerage data | institutional.md | institutional/hedge-fund |

---

## Specialized / Ad-Hoc Skills

| Skill File | Name | When to Use |
|-----------|------|-------------|
| `SKILL-deep-dive.md` | deep-dive | Detailed single-ticker research |
| `SKILL-thesis.md` | thesis | Building a new investment thesis |
| `SKILL-thesis-tracker.md` | thesis-tracker | Reviewing + scoring active theses |
| `SKILL-sector-rotation.md` | sector-rotation | Identifying rotation between sectors |
| `SKILL-sector-heatmap.md` | sector-heatmap | Generating sector strength heatmap |

---

## Skill Counts by Category

| Category | Count |
|----------|-------|
| Core pipeline | 11 |
| Sector | 11 |
| Alternative data | 4 |
| Institutional | 2 |
| Specialized | 5 |
| **Total** | **33** |

---

## Skill File Template

When creating a new skill, follow this template:

```markdown
---
name: skill-identifier
description: One-line description for routing and catalog
---

## Purpose
What this skill accomplishes and when to use it.

## Inputs
- `config/watchlist.md`
- `config/preferences.md`
- `memory/{domain}/ROLLING.md`

### 1. Read Prior Context
Read memory/{domain}/ROLLING.md. Note the most recent entries.
Read config/watchlist.md for relevant tracked assets.

### 2. Gather Data
[Describe what data to surface and analyze]

### 3. Analyze
[Describe the analysis framework]

### 4. Write Output
Write to `outputs/daily/{{DATE}}/{output-filename}.md`
Follow `templates/segment-report.md` for structure.

## Output Format
File: `outputs/daily/{{DATE}}/{output-filename}.md`

## Memory Update
Append to `memory/{domain}/ROLLING.md`:
```
## {{DATE}}
- [key finding 1]
- [key finding 2]
- [forward-looking note]
```
```

---

## Catalog Maintenance

When adding a new skill:
1. Create the skill file with proper frontmatter
2. Add a row to this catalog
3. Update `CLAUDE_PROJECT_INSTRUCTIONS.md` skills section
4. If it's a pipeline skill, update `SKILL-orchestrator.md`
5. Create the matching `memory/{domain}/ROLLING.md` file
6. Update `scripts/new-day.sh` if it needs a new output folder
