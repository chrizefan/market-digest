# Prompt patterns

Copy-paste prompts for every task type. Replace `{DATE}` with today's date (YYYY-MM-DD).

## DB-first (preferred)

- **Entrypoint:** `python3 scripts/run_db_first.py` — follow printed baseline vs delta instructions.
- **Track A (blind research):** paste from [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt).
- **Track B (portfolio):** paste from [`scripts/cowork-daily-prompt.txt`](../../scripts/cowork-daily-prompt.txt).

Sections below use **legacy filesystem paths** (`*.md` under `outputs/daily/`) where teams still run markdown-first; for production, emit **JSON** and publish per [`RUNBOOK.md`](../../RUNBOOK.md).

---

## Full daily digest

```
Today is {DATE}.

Read skills/orchestrator/SKILL.md and run the complete pipeline (9 phases; see docs/agentic/ARCHITECTURE.md).

Setup:
- Read config/watchlist.md; for portfolio layer read config/preferences.md and config/investment-profile.md
- outputs/daily/{DATE}/ may exist after ./scripts/new-day.sh

Execute phases; produce JSON artifacts and publish to Supabase (materialize_snapshot.py, update_tearsheet.py — RUNBOOK.md).
Update memory files at end of session.
```

---

## Single segment — Macro

```
Today is {DATE}.

Read skills/macro/SKILL.md for instructions.
First read memory/macro/ROLLING.md for prior context.
Read config/preferences.md only if this run feeds portfolio (Track B).

Run the macro analysis.
Write JSON (and/or segment artifact paths per skill); if legacy: outputs/daily/{DATE}/macro.md
Append findings to: memory/macro/ROLLING.md
```

---

## Single Segment — Crypto

```
Today is {DATE}.

Read skills/crypto/SKILL.md.
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

Read skills/sector-{SECTOR}/SKILL.md (replace {SECTOR} with: technology, healthcare, energy, financials,
consumer-disc, consumer-staples, industrials, materials, utilities, real-estate, or comms)

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
- Read: skills/sector-{sector}/SKILL.md
- Read: memory/sectors/{sector}/ROLLING.md
- Write: outputs/daily/{DATE}/sectors/{sector}.md
- Append: memory/sectors/{sector}/ROLLING.md

Sectors: technology, healthcare, financials, energy, consumer-disc,
consumer-staples, industrials, materials, utilities, real-estate, comms
```

---

## Alternative Data Sweep (Phase 1)

```
Today is {DATE}.

Run Phase 1 alternative data analysis:
1. Read skills/alt-sentiment-news/SKILL.md → sentiment/news
2. Read skills/alt-cta-positioning/SKILL.md → CTA exposure
3. Read skills/alt-options-derivatives/SKILL.md → options/vol
4. Read skills/alt-politician-signals/SKILL.md → politician/official signals

Read each corresponding memory file in memory/alternative-data/ for prior context.
Write combined output to: outputs/daily/{DATE}/alt-data.md
Update each memory/alternative-data/*/ROLLING.md
```

---

## Institutional Flows (Phase 2)

```
Today is {DATE}.

Run Phase 2 institutional analysis:
1. Read skills/inst-institutional-flows/SKILL.md
2. Read skills/inst-hedge-fund-intel/SKILL.md
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

Produce a digest snapshot JSON (schema: templates/digest-snapshot-schema.json) and publish via scripts/materialize_snapshot.py.
Read memory/BIAS-TRACKER.md for prior bias context.
Read config/preferences.md for portfolio positioning.

Store to Supabase (DB-first). Markdown is derived from JSON.
Append today's row to memory/BIAS-TRACKER.md (14-column table).
```

---

## Ticker Deep Dive

```
Run a deep dive on: {TICKER}

1. Read skills/deep-dive/SKILL.md for the research framework
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

## Portfolio / thesis review

```
Today is {DATE}.

Read memory/THESES.md for all active theses.
Read config/preferences.md for portfolio positioning and risk tolerance.
Read memory/BIAS-TRACKER.md (last 5 rows) for recent bias trends.

Load today's digest from Supabase or snapshot JSON for {DATE}; legacy path: outputs/daily/{DATE}/DIGEST.md or archive.

For each active thesis:
- Assess current evidence For vs Against
- Update status: Building | Confirmed | Extended | At Risk | Exited
- Note any new developments relevant to the thesis

Append your review to memory/THESES.md under today's date.
```

---

## Weekly synthesis

```
Week ending: {DATE}

Read this week's digests from Supabase (documents / daily_snapshots) or JSON under outputs/daily/*/snapshot.json.
Legacy: outputs/daily/*/DIGEST.md or archive/legacy-outputs/daily/.

Read memory/BIAS-TRACKER.md entries for this week.
Write weekly JSON (schema: templates/schemas/weekly-digest.schema.json).
Write to: outputs/weekly/{YYYY}-W{WW}.json
Do NOT update memory files — read-only synthesis.
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
2. Read skills/macro/SKILL.md as a format reference
3. Create skills/{skill-slug}/SKILL.md following the standard template:
   - YAML frontmatter with name: and description:
   - Steps numbered ### 1. through ### N.
   - ## Output Format section with {{DATE}} placeholder
   - ## Memory Update section
4. Create memory/{domain}/ROLLING.md stub file
5. Reference in skills/orchestrator/SKILL.md if it's a pipeline phase
6. Add to docs/agentic/SKILLS-CATALOG.md
```

---

## Editing conventions reminder

```
Important conventions for this project:
- Memory files (memory/**/ROLLING.md) are APPEND-ONLY. Never rewrite existing content.
- macOS sed: use sed -i "" not sed -i (BSD)
- Skill YAML frontmatter name:/description: — changes need cascading updates
- outputs/daily/ JSON and snapshots are agent-generated — do not hand-edit canonical JSON
- Prefer Supabase + JSON; markdown under outputs/ is legacy or derived
- Use {DATE} / YYYY-MM-DD in paths, never hardcoded dates
- find memory/ -name "ROLLING.md" for memory discovery
```
