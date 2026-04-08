# Skills Catalog

**Canonical list:** `skills/**/SKILL.md` on disk. This page is a **compact index**—if it drifts, trust the filesystem.

Complete index of skill packages under `skills/`.

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
| `orchestrator/SKILL.md` | orchestrator | All | DB-first publish | All |
| `premarket-pulse/SKILL.md` | premarket-pulse | 1 | alt-data.md | alt-data/sentiment |
| `macro/SKILL.md` | macro | 3 | macro.md | macro/ROLLING.md |
| `bonds/SKILL.md` | bonds | 4A | bonds.md | bonds/ROLLING.md |
| `commodities/SKILL.md` | commodities | 4B | commodities.md | commodities/ROLLING.md |
| `forex/SKILL.md` | forex | 4C | forex.md | forex/ROLLING.md |
| `crypto/SKILL.md` | crypto | 4D | crypto.md | crypto/ROLLING.md |
| `international/SKILL.md` | international | 4E | international.md | international/ROLLING.md |
| `equity/SKILL.md` | equity | 5A | equities.md | equity/ROLLING.md |
| `earnings/SKILL.md` | earnings | 6 | earnings.md | equity/ROLLING.md |
| `digest/SKILL.md` | digest | 7 | digest snapshot | BIAS-TRACKER.md |

---

## Sector Skills (Phase 5B–5L)

All as packages: `skills/sector-*/SKILL.md`:

| Skill File | Output File | Memory |
|-----------|------------|--------|
| `sector-technology/SKILL.md` | sectors/technology.md | sectors/technology |
| `sector-healthcare/SKILL.md` | sectors/healthcare.md | sectors/healthcare |
| `sector-financials/SKILL.md` | sectors/financials.md | sectors/financials |
| `sector-energy/SKILL.md` | sectors/energy.md | sectors/energy |
| `sector-consumer-disc/SKILL.md` | sectors/consumer-disc.md | sectors/consumer |
| `sector-consumer-staples/SKILL.md` | sectors/consumer-staples.md | sectors/consumer |
| `sector-industrials/SKILL.md` | sectors/industrials.md | sectors/industrials |
| `sector-materials/SKILL.md` | sectors/materials.md | sectors/materials |
| `sector-utilities/SKILL.md` | sectors/utilities.md | sectors/utilities |
| `sector-real-estate/SKILL.md` | sectors/real-estate.md | sectors/real-estate |
| `sector-comms/SKILL.md` | sectors/comms.md | sectors/comms |

---

## Alternative Data Skills (Phase 1)

All as packages:

| Skill File | What It Does | Output | Memory |
|-----------|-------------|--------|--------|
| `alt-sentiment-news/SKILL.md` | Retail sentiment + news | alt-data.md section | alternative-data/sentiment |
| `alt-cta-positioning/SKILL.md` | CTA positioning | alt-data.md section | alternative-data/cta |
| `alt-options-derivatives/SKILL.md` | Options/vol structure | alt-data.md section | alternative-data/options |
| `alt-politician-signals/SKILL.md` | Politician/official signals | alt-data.md section | alternative-data/politician |

---

## Institutional Skills (Phase 2)

All as packages:

| Skill File | What It Does | Output | Memory |
|-----------|-------------|--------|--------|
| `inst-institutional-flows/SKILL.md` | Dark pools, block prints, ETF flows | institutional.md | institutional/flows |
| `inst-hedge-fund-intel/SKILL.md` | 13F analysis, fund commentary | institutional.md | institutional/hedge-fund |

---

## Specialized / Ad-Hoc Skills

| Skill File | Name | When to Use |
|-----------|------|-------------|
| `deep-dive/SKILL.md` | deep-dive | Detailed single-ticker research |
| `thesis/SKILL.md` | thesis | Building a new investment thesis |
| `thesis-tracker/SKILL.md` | thesis-tracker | Reviewing + scoring active theses |
| `sector-rotation/SKILL.md` | sector-rotation | Identifying rotation between sectors |
| `sector-heatmap/SKILL.md` | sector-heatmap | Generating sector strength heatmap |
| `research-library/SKILL.md` | research-library | Citing `docs/research/` doctrine for PM / allocation |

---

## Skill Counts by Category

| Category | Count |
|----------|-------|
| Core pipeline | 11 |
| Sector | 11 |
| Alternative data | 4 |
| Institutional | 2 |
| Specialized | 6 |
| **Total** | **34** |

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
Write JSON artifacts for recurring outputs; follow the appropriate schema in `templates/schemas/`.

## Output Format
JSON artifacts validated against `templates/schemas/*.schema.json`; publish per `RUNBOOK.md` (DB-first).

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
4. If it's a pipeline skill, update `skills/orchestrator/SKILL.md`
5. Create the matching `memory/{domain}/ROLLING.md` file
6. Update `scripts/new-day.sh` if it needs a new output folder
