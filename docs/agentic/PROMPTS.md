# Prompt Patterns

Copy-paste prompts for every task type. Replace `{DATE}` with today's date (YYYY-MM-DD).

---

## Full Daily Digest

```
Today is {DATE}.

Read skills/SKILL-orchestrator.md and run the complete 7-phase pipeline.

Setup:
- Read config/watchlist.md and config/preferences.md
- Run ./scripts/new-day.sh output has already been run — folder outputs/daily/{DATE}/ exists

Execute all 7 phases in sequence. Each phase should read prior phases' outputs.
Update all memory files at the end of the session.
```

---

## Single Segment — Macro

```
Today is {DATE}.

Read skills/SKILL-macro.md for instructions.
First read memory/macro/ROLLING.md for prior context.
Also read config/preferences.md.

Run the macro analysis.
Write to: outputs/daily/{DATE}/macro.md
Append findings to: memory/macro/ROLLING.md
```

---

## Single Segment — Crypto

```
Today is {DATE}.

Read skills/SKILL-crypto.md.
Read memory/crypto/ROLLING.md for prior context.
Read config/watchlist.md for tracked crypto assets.

Run crypto analysis.
Write to: outputs/daily/{DATE}/crypto.md
Append to: memory/crypto/ROLLING.md
```

---

## Single Sector

```
Today is {DATE}.

Read skills/sectors/{SECTOR}.md (replace {SECTOR} with: technology, healthcare, energy, financials, 
consumer-discretionary, consumer-staples, industrials, materials, utilities, real-estate, or communication)

Read memory/sectors/{SECTOR}/ROLLING.md for prior research.
Read today's macro.md if available: outputs/daily/{DATE}/macro.md

Write to: outputs/daily/{DATE}/sectors/{SECTOR}.md
Append to: memory/sectors/{SECTOR}/ROLLING.md
```

---

## All 11 Sectors (Parallel)

```
Today is {DATE}.
Macro context: [paste key points from macro.md or describe regime]

Run all 11 sector analyses in parallel. For each sector:
- Read: skills/sectors/{sector}.md
- Read: memory/sectors/{sector}/ROLLING.md
- Write: outputs/daily/{DATE}/sectors/{sector}.md
- Append: memory/sectors/{sector}/ROLLING.md

Sectors: technology, healthcare, financials, energy, consumer-discretionary, 
consumer-staples, industrials, materials, utilities, real-estate, communication
```

---

## Alternative Data Sweep (Phase 1)

```
Today is {DATE}.

Run Phase 1 alternative data analysis:
1. Read skills/alternative-data/sentiment.md → surface retail sentiment
2. Read skills/alternative-data/cta-positioning.md → assess CTA exposure
3. Read skills/alternative-data/options-flow.md → scan unusual options activity
4. Read skills/alternative-data/politician-tracker.md → flag recent politician trades

Read each corresponding memory file in memory/alternative-data/ for prior context.
Write combined output to: outputs/daily/{DATE}/alt-data.md
Update each memory/alternative-data/*/ROLLING.md
```

---

## Institutional Flows (Phase 2)

```
Today is {DATE}.

Run Phase 2 institutional analysis:
1. Read skills/institutional/flows.md
2. Read skills/institutional/hedge-fund-intel.md
3. Read config/hedge-funds.md for tracked hedge funds

Read memory/institutional/flows/ROLLING.md and memory/institutional/hedge-fund/ROLLING.md.
Write to: outputs/daily/{DATE}/institutional.md
Update both institutional memory files.
```

---

## Synthesis / Digest Only (Phase 7)

Use this after phases 1-6 are complete:

```
Today is {DATE}.

All segment analyses are complete in outputs/daily/{DATE}/.
Read ALL of the following:
- outputs/daily/{DATE}/alt-data.md
- outputs/daily/{DATE}/institutional.md
- outputs/daily/{DATE}/macro.md
- outputs/daily/{DATE}/bonds.md
- outputs/daily/{DATE}/commodities.md
- outputs/daily/{DATE}/forex.md
- outputs/daily/{DATE}/crypto.md
- outputs/daily/{DATE}/international.md
- outputs/daily/{DATE}/equities.md
- outputs/daily/{DATE}/earnings.md
- All files in outputs/daily/{DATE}/sectors/

Read templates/master-digest.md for the output structure.
Read memory/BIAS-TRACKER.md for prior bias context.
Read config/preferences.md for portfolio positioning.

Synthesize into: outputs/daily/{DATE}/DIGEST.md
Append today's row to memory/BIAS-TRACKER.md (14-column table).
```

---

## Ticker Deep Dive

```
Run a deep dive on: {TICKER}

1. Read skills/SKILL-deep-dive.md for the research framework
2. Search memory/ for any prior notes: run memory-search.sh {TICKER} or grep all ROLLING.md files
3. Read config/watchlist.md to see if it's tracked and at what size
4. Check config/preferences.md for relevant biases or theses

Produce a structured research note covering:
- Business model + competitive position
- Current technical setup
- Key upcoming catalysts
- Risk factors
- Thesis / conclusion

Write to: outputs/deep-dives/{TICKER}-{DATE}.md
```

---

## Portfolio / Thesis Review

```
Today is {DATE}.

Read memory/THESES.md for all active theses.
Read config/preferences.md for portfolio positioning and risk tolerance.
Read memory/BIAS-TRACKER.md (last 5 rows) for recent bias trends.

If today's DIGEST.md exists, read it: outputs/daily/{DATE}/DIGEST.md

For each active thesis:
- Assess current evidence For vs Against
- Update status: Building | Confirmed | Extended | At Risk | Exited
- Note any new developments relevant to the thesis

Append your review to memory/THESES.md under today's date.
```

---

## Weekly Synthesis

```
Week ending: {DATE}

Read all DIGEST.md files from this week:
- outputs/daily/{MON}/DIGEST.md
- outputs/daily/{TUE}/DIGEST.md
- outputs/daily/{WED}/DIGEST.md
- outputs/daily/{THU}/DIGEST.md
- outputs/daily/{FRI}/DIGEST.md (if exists)

Read memory/BIAS-TRACKER.md entries for this week.
Read templates/weekly-digest.md for the output structure.

Identify the week's key themes, regime shifts, and position-relevant events.
Write to: outputs/weekly/{DATE}.md
Do NOT update memory files — this is read-only synthesis.
```

---

## Memory Context Load

Use this at the start of any session that needs deep historical context:

```
Before we begin, load all relevant memory context for today's session.

Read the following files:
- config/watchlist.md
- config/preferences.md
- memory/macro/ROLLING.md (last 10 entries)
- memory/equity/ROLLING.md (last 10 entries)
- memory/BIAS-TRACKER.md (last 7 rows)
- memory/THESES.md

Summarize:
1. Current macro regime and recent bias trend
2. Key equity market observations from recent sessions
3. Active theses and their current status
4. Any notable watchlist developments

We'll use this as the foundation for today's analysis.
```

---

## Adding a New Skill

```
I want to add a new skill for: {SKILL_NAME}

Purpose: {description of what it should do}

Please:
1. Read docs/agentic/SKILLS-CATALOG.md to understand the existing catalog
2. Read skills/SKILL-macro.md as a format reference
3. Create skills/{category}/{skill-name}.md following the standard template:
   - YAML frontmatter with name: and description:
   - Steps numbered ### 1. through ### N.
   - ## Output Format section with {{DATE}} placeholder
   - ## Memory Update section
4. Create memory/{domain}/ROLLING.md stub file
5. Reference in skills/SKILL-orchestrator.md if it's a pipeline phase
6. Add to docs/agentic/SKILLS-CATALOG.md
```

---

## Editing Conventions Reminder

Include this in any session that involves modifying project files:

```
Important conventions for this project:
- Memory files (memory/**/ROLLING.md) are APPEND-ONLY. Never rewrite existing content.
- macOS sed: use sed -i "" not sed -i (required for BSD compatibility)
- Skill file frontmatter name: fields are sacred — changes require cascading updates
- Output files in outputs/daily/ are agent-generated — do not manually edit them
- Always use {{DATE}} placeholder in output paths, never hardcode dates
- Memory directory search: use find memory/ -name "ROLLING.md" not memory/*/ROLLING.md
```
