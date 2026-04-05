# Workflows Reference

Step-by-step procedures for every recurring workflow.

---

## Daily Full Digest

**Time**: Before or after market open/close
**Duration**: 1-3 hours (AI-parallel)

### Steps

```bash
# 1. Create today's folder
./scripts/new-day.sh
# → prints today's full digest prompt
```

```bash
# 2. Copy the printed prompt into your AI platform
# OR use the manual prompt below:
```

**Manual prompt for full digest:**
```
Today is YYYY-MM-DD.
Read skills/SKILL-orchestrator.md and run the complete 7-phase pipeline.
Read config/watchlist.md and config/preferences.md first.
Read all relevant memory/*/ROLLING.md files for prior context.
Output all files to outputs/daily/YYYY-MM-DD/
Update all memory files when complete.
```

```bash
# 3. After agent writes outputs, commit
./scripts/git-commit.sh
```

**Output**: 22 files in `outputs/daily/YYYY-MM-DD/` + updated memory

---

## Single Segment Run

Run just one phase or segment without the full pipeline.

```bash
./scripts/run-segment.sh macro
./scripts/run-segment.sh bonds
./scripts/run-segment.sh crypto
./scripts/run-segment.sh technology   # sector
```

**Manual prompt pattern:**
```
Read skills/SKILL-{segment}.md and run the analysis for {DATE}.
First read memory/{segment}/ROLLING.md for prior context.
Write output to outputs/daily/{DATE}/{segment}.md
Append findings to memory/{segment}/ROLLING.md
```

**Available segments**: macro, bonds, commodities, forex, crypto, international, equities, earnings, alt-data, institutional, plus any of the 11 sector names.

---

## Phase 7 Synthesis (Digest Only)

After running phases 1-6 manually or partially:

```bash
./scripts/combine-digest.sh
# → prints synthesis prompt
```

**Manual synthesis prompt:**
```
Read all files in outputs/daily/{DATE}/:
- alt-data.md, institutional.md, macro.md
- bonds.md, commodities.md, forex.md, crypto.md, international.md
- equities.md, all sectors/*.md, earnings.md

Read templates/master-digest.md for the output template.
Read memory/BIAS-TRACKER.md for prior bias context.

Synthesize into outputs/daily/{DATE}/DIGEST.md
Update memory/BIAS-TRACKER.md with today's row.
```

---

## Weekly Rollup

**Runs**: Friday evening or Sunday
**Purpose**: Synthesize the week's research into one narrative

```bash
./scripts/weekly-rollup.sh
# → prints weekly synthesis prompt
```

**Manual prompt:**
```
Read all DIGEST.md files from this week's outputs/daily/ folders.
Read memory/BIAS-TRACKER.md for the week's bias history.
Read templates/weekly-digest.md for the output format.
Synthesize into outputs/weekly/{WEEK-OF-DATE}.md
Do NOT update memory files — this is read-only synthesis.
```

---

## Monthly Rollup

**Runs**: Last day of month
**Purpose**: Key themes, sector rotation, thesis evolution

```bash
./scripts/monthly-rollup.sh
# → prints monthly synthesis prompt
```

**Manual prompt:**
```
Read all outputs/weekly/ files from this month.
Read memory/BIAS-TRACKER.md for the month's entries.
Read each memory/*/ROLLING.md and summarize the month's key observations per domain.
Read templates/monthly-digest.md for the output format.
Write to outputs/monthly/{YYYY-MM}.md
```

---

## Thesis Management

### Adding a New Thesis
```bash
./scripts/thesis.sh add "THESIS_NAME"
# → prints thesis-building prompt
```

**Manual prompt:**
```
Read SKILL-thesis.md.
Build a new research thesis for: [TOPIC/TICKER/THEME]
Read config/preferences.md for context on trading style.
Read relevant memory/*/ROLLING.md files for existing research.
Append the completed thesis to memory/THESES.md with today's date.
```

### Reviewing Active Theses
```bash
./scripts/thesis.sh review
# → prints thesis review prompt
```

**Manual prompt:**
```
Read SKILL-thesis-tracker.md.
Read memory/THESES.md for all active theses.
Read today's DIGEST.md or relevant segment outputs.
Score each thesis: [Building | Confirmed | Extended | At Risk | Exited]
Append your review to memory/THESES.md under today's date.
```

---

## Deep Dive Research

For ad-hoc in-depth research on a specific ticker or topic:

**Prompt:**
```
Read skills/SKILL-deep-dive.md.
Run a deep dive on: {TICKER or TOPIC}
Read memory/equity/ROLLING.md and relevant sector ROLLING.md for prior notes.
Read config/watchlist.md to see if it's a tracked position.
Output to: outputs/deep-dives/{TICKER}-{DATE}.md
```

---

## Watchlist Update

When adding/removing tickers from the watchlist:

```bash
./scripts/watchlist-check.sh
```

**Manual steps:**
1. Edit `config/watchlist.md`
2. If adding a new ticker — add an entry in the relevant sector ROLLING.md with context
3. Update `config/portfolio.json` if it's an active position

---

## Memory Search

Find prior research on any topic:

```bash
./scripts/memory-search.sh "NVDA"
./scripts/memory-search.sh "China PMI"
./scripts/memory-search.sh "credit spreads"
```

Returns matching lines from all 23 ROLLING.md files + BIAS-TRACKER.md.

---

## Status Check

```bash
./scripts/status.sh
```

Shows:
- Today's folder status (created or not)
- Which output files exist vs. missing
- Last-modified dates for all memory files
- Active thesis count

---

## Git Workflow

```bash
# After any session with outputs
./scripts/git-commit.sh

# Manual commit format
git add outputs/ memory/
git commit -m "$(date +%Y-%m-%d): Daily digest + memory update"
git push
```

CI/CD in `.github/workflows/deploy.yml` publishes the tearsheet on push to master.

---

## Archive Old Outputs

```bash
./scripts/archive.sh
# → moves outputs older than 30 days to archive/
```

---

## Error Recovery

**If an output file is incomplete:**
```
Read the existing partial file at outputs/daily/{DATE}/{segment}.md
Continue from where it left off, following skills/SKILL-{segment}.md
Do not restart from scratch — append to the file.
```

**If memory is corrupted (entries got rewritten):**
```
Check git history: git log memory/ --all
Restore the last clean version: git checkout {HASH} -- memory/{file}
Append any new content after restoring
```

**If a skill file has a syntax error:**
```
Read docs/agentic/SKILLS-CATALOG.md for the expected format.
Cross-reference with another working skill file.
The YAML frontmatter must remain intact.
```
