# Prompt patterns

Copy-paste prompts for every task type. Replace `{DATE}` with today's date (YYYY-MM-DD).

## DB-first (preferred)

- **Entrypoint:** `python3 scripts/run_db_first.py` — follow printed baseline vs delta instructions.
- **Track A (blind research):** paste from [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt).
- **Track B (portfolio):** paste from [`scripts/cowork-daily-prompt.txt`](../../scripts/cowork-daily-prompt.txt).

Sections below use **legacy filesystem paths** (`*.md` under `data/agent-cache/daily/`) where teams still run markdown-first; for production, emit **JSON** and publish per [`RUNBOOK.md`](../../RUNBOOK.md).

---

## Full daily digest

```
Today is {DATE}.

Read skills/orchestrator/SKILL.md and run the complete pipeline (9 phases; see docs/agentic/ARCHITECTURE.md).

Setup:
- Read config/watchlist.md; for portfolio layer read config/preferences.md and config/investment-profile.md
- data/agent-cache/daily/{DATE}/ may exist after ./scripts/new-day.sh

Execute phases; produce JSON artifacts and publish to Supabase (materialize_snapshot.py, update_tearsheet.py — RUNBOOK.md).
```

---

## Single segment — Macro

```
Today is {DATE}.

Read skills/macro/SKILL.md for instructions.
Load prior macro context from Supabase daily_snapshots or documents for recent dates.
Read config/preferences.md only if this run feeds portfolio (Track B).

Run the macro analysis.
Write JSON (and/or segment artifact paths per skill); if legacy: data/agent-cache/daily/{DATE}/macro.md
Publish findings to Supabase per RUNBOOK.md.
```

---

## Single Segment — Crypto

```
Today is {DATE}.

Read skills/crypto/SKILL.md.
Load prior crypto context from Supabase daily_snapshots or documents for recent dates.
Read config/watchlist.md for tracked crypto assets.

Run crypto analysis.
Write to: data/agent-cache/daily/{DATE}/crypto.md
Publish to Supabase per RUNBOOK.md.
```

---

## Single Sector

```
Today is {DATE}.

Read skills/sector-{SECTOR}/SKILL.md (replace {SECTOR} with: technology, healthcare, energy, financials,
consumer-disc, consumer-staples, industrials, materials, utilities, real-estate, or comms)

Load prior sector research from Supabase daily_snapshots or documents for recent dates.
Read today's macro.md if available: data/agent-cache/daily/{DATE}/macro.md

Write to: data/agent-cache/daily/{DATE}/sectors/{SECTOR}.md
Publish findings to Supabase per RUNBOOK.md.
```

---

## All 11 Sectors (Parallel)

```
Today is {DATE}.
Macro context: [paste key points from macro.md or describe regime]

Run all 11 sector analyses in parallel. For each sector:
- Read: skills/sector-{sector}/SKILL.md
- Load prior context from Supabase daily_snapshots or documents for recent dates
- Write: data/agent-cache/daily/{DATE}/sectors/{sector}.md
- Publish findings to Supabase per RUNBOOK.md

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

Load prior alternative data context from Supabase daily_snapshots or documents for recent dates.
Write combined output to: data/agent-cache/daily/{DATE}/alt-data.md
Publish findings to Supabase per RUNBOOK.md.
```

---

## Institutional Flows (Phase 2)

```
Today is {DATE}.

Run Phase 2 institutional analysis:
1. Read skills/inst-institutional-flows/SKILL.md
2. Read skills/inst-hedge-fund-intel/SKILL.md
3. Read config/hedge-funds.md for tracked hedge funds

Load prior institutional context from Supabase daily_snapshots or documents for recent dates.
Write to: data/agent-cache/daily/{DATE}/institutional.md
Publish findings to Supabase per RUNBOOK.md.
```

---

## Synthesis / Digest Only (Phase 7)

Use this after phases 1-6 are complete:

```
Today is {DATE}.

All segment analyses are complete in data/agent-cache/daily/{DATE}/.
Read ALL of the following:
- data/agent-cache/daily/{DATE}/alt-data.md
- data/agent-cache/daily/{DATE}/institutional.md
- data/agent-cache/daily/{DATE}/macro.md
- data/agent-cache/daily/{DATE}/bonds.md
- data/agent-cache/daily/{DATE}/commodities.md
- data/agent-cache/daily/{DATE}/forex.md
- data/agent-cache/daily/{DATE}/crypto.md
- data/agent-cache/daily/{DATE}/international.md
- data/agent-cache/daily/{DATE}/equities.md
- data/agent-cache/daily/{DATE}/earnings.md
- All files in data/agent-cache/daily/{DATE}/sectors/

Produce a digest snapshot JSON (schema: templates/digest-snapshot-schema.json) and publish via scripts/materialize_snapshot.py.
Load prior bias context from Supabase daily_snapshots bias rows.
Read config/preferences.md for portfolio positioning.

Store to Supabase (DB-first). Markdown is derived from JSON.
```

---

## Ticker Deep Dive

```
Run a deep dive on: {TICKER}

1. Read skills/deep-dive/SKILL.md for the research framework
2. Query Supabase daily_snapshots and documents for any prior notes on {TICKER}
3. Read config/watchlist.md to see if it's tracked and at what size
4. Check config/preferences.md for relevant biases or theses

Produce a structured research note covering:
- Business model + competitive position
- Current technical setup
- Key upcoming catalysts
- Risk factors
- Thesis / conclusion

Write to: data/agent-cache/deep-dives/{TICKER}-{DATE}.md
```

---

## Portfolio / thesis review

```
Today is {DATE}.

Load all active theses from the thesis tracker in Supabase documents.
Read config/preferences.md for portfolio positioning and risk tolerance.
Load recent bias rows from Supabase daily_snapshots (last 5 entries) for recent bias trends.

Load today's digest from Supabase daily_snapshots or snapshot JSON for {DATE}.

For each active thesis:
- Assess current evidence For vs Against
- Update status: Building | Confirmed | Extended | At Risk | Exited
- Note any new developments relevant to the thesis

Publish updated thesis entries to Supabase documents.
```

---

## Weekly synthesis

```
Week ending: {DATE}

Read this week's digests from Supabase (documents / daily_snapshots) or JSON under data/agent-cache/daily/*/snapshot.json.

Load bias rows for this week from Supabase daily_snapshots.
Write weekly JSON (schema: templates/schemas/weekly-digest.schema.json).
Write to: data/agent-cache/weekly/{YYYY}-W{WW}.json
Do NOT publish new Supabase rows — read-only synthesis.
```

---

## Historical Context Load

Use this at the start of any session that needs deep historical context:

```
Before we begin, load all relevant context for today's session.

Read the following files:
- config/watchlist.md
- config/preferences.md

Query Supabase for recent history:
- daily_snapshots: last 10 entries for macro regime and segment biases
- daily_snapshots: last 7 entries for bias trend
- documents: active theses (thesis tracker entries)

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
   - ## Supabase Publish section (documents or daily_snapshots per RUNBOOK.md)
4. Reference in skills/orchestrator/SKILL.md if it's a pipeline phase
5. Add to docs/agentic/SKILLS-CATALOG.md
```

---

## Editing conventions reminder

```
Important conventions for this project:
- Supabase (daily_snapshots, documents) is the canonical data store — publish there, not to local files
- macOS sed: use sed -i "" not sed -i (BSD)
- Skill YAML frontmatter name:/description: — changes need cascading updates
- data/agent-cache/daily/ JSON and snapshots are agent-generated — do not hand-edit canonical JSON
- Prefer Supabase + JSON; markdown under data/agent-cache/ is scratch/derived only
- Use {DATE} / YYYY-MM-DD in paths, never hardcoded dates
- Query Supabase daily_snapshots or documents to find prior research across domains
```
