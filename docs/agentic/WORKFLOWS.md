# Workflows Reference

Step-by-step procedures for every recurring workflow.

---

## GitHub Actions (systematic data, no agent)

| Workflow | Schedule | Role |
|----------|----------|------|
| [`daily-price-update.yml`](../../.github/workflows/daily-price-update.yml) | **Mon–Fri 22:00 UTC** (~6:00 PM US Eastern after cash close, per workflow comments) | Refresh `price_history` / `price_technicals`, then [`refresh_performance_metrics.py --fill-calendar-through`](../../scripts/refresh_performance_metrics.py) (dense `positions` / `nav_history` / `portfolio_metrics` per calendar day). Does **not** run digest, `update_tearsheet.py`, or research. |
| [`weekly-check.yml`](../../.github/workflows/weekly-check.yml) | **Fri 16:00 UTC** | Checks for a local `outputs/weekly/` file only — **not** the same as **Sunday baseline** in [`run_db_first.py`](../../scripts/run_db_first.py). |
| [`ci.yml`](../../.github/workflows/ci.yml), [`deploy.yml`](../../.github/workflows/deploy.yml) | On push / manual | Build and deploy. |

**Co-work / operator** runs ([`RUNBOOK.md`](../../RUNBOOK.md)): research + portfolio JSON → `run_db_first.py` → Supabase. Cowork setup: [`cowork/README.md`](../../cowork/README.md), project prompt [`cowork/PROJECT-PROMPT.md`](../../cowork/PROJECT-PROMPT.md), task list [`cowork/tasks/README.md`](../../cowork/tasks/README.md).

---

## Daily full digest (DB-first)

**Time:** Before or after market open/close (see [`config/schedule.json`](../../config/schedule.json) for intent).  
**Duration:** 1–3 hours (AI-parallel)

### Steps

```bash
# 1. Optional: scaffold folder + printed prompt
./scripts/new-day.sh
```

```bash
# 2. Run the pipeline from the skill (JSON artifacts under outputs/daily/{DATE}/)
#    Then publish + validate:
python3 scripts/run_db_first.py
#    Flags: --skip-execute / --validate-mode research|pm|full — see RUNBOOK.md
```

**Manual prompt for full digest:**
```
Today is YYYY-MM-DD.
Read skills/orchestrator/SKILL.md (or weekly-baseline / daily-delta per day type).
Read config/watchlist.md; for portfolio work also preferences + investment-profile.
Read relevant memory/*/ROLLING.md for prior context.
DB-first: write JSON artifacts → materialize_snapshot.py / update_tearsheet.py as in RUNBOOK.md.
Legacy markdown samples: archive/legacy-outputs/daily/
```

```bash
# 3. After outputs exist, commit (runs ETL)
./scripts/git-commit.sh
```

**Output:** Supabase (`daily_snapshots`, `documents`, `positions`, …) + updated memory

---

## Single Segment Run

Run just one phase or segment without the full pipeline (no dedicated Bash printer; use prompts below).

**Manual prompt pattern:**
```
Read skills/{segment}/SKILL.md (or the appropriate skill package) and run the analysis for {DATE}.
First read memory/{segment}/ROLLING.md for prior context.
Write JSON artifacts as needed and publish to Supabase (see RUNBOOK.md)
Append findings to memory/{segment}/ROLLING.md
```

**Available segments**: macro, bonds, commodities, forex, crypto, international, equities, earnings, alt-data, institutional, plus any of the 11 sector names.

---

## Phase 7 Synthesis (Digest Only)

After running phases 1-6 manually or partially, use this prompt (DB-first):

**Manual synthesis prompt:**
```
If reviewing legacy output history, read files under archive: `archive/legacy-outputs/daily/{DATE}/`
- alt-data.md, institutional.md, macro.md
- bonds.md, commodities.md, forex.md, crypto.md, international.md
- equities.md, all sectors/*.md, earnings.md

Daily digest is DB-first: produce a digest snapshot JSON (schema: `templates/digest-snapshot-schema.json`) and publish via `scripts/materialize_snapshot.py`. Markdown is rendered from JSON.
Read memory/BIAS-TRACKER.md for prior bias context.

Synthesize into snapshot JSON and publish via `scripts/materialize_snapshot.py` (see RUNBOOK.md)
Update memory/BIAS-TRACKER.md with today's row.
```

---

## Weekly Rollup

**Runs**: Friday evening or Sunday (filesystem rollup); **Supabase weekly baseline** is **Sunday** when using default [`run_db_first.py`](../../scripts/run_db_first.py) detection (`--baseline` on Sunday).
**Purpose**: Synthesize the week's research into one narrative

```bash
./scripts/weekly-rollup.sh
# → prints weekly synthesis prompt
```

**Manual prompt:**
```
Read this week's research from Supabase (documents / daily_snapshots) or from
outputs/daily/{DATE}/ JSON and digest payloads — NOT legacy DIGEST.md unless
you are explicitly mining archive/legacy-outputs/daily/.
Read memory/BIAS-TRACKER.md for the week's bias history.
Write a weekly JSON artifact (schema: templates/schemas/weekly-digest.schema.json).
Synthesize into outputs/weekly/{YYYY}-W{WW}.json
Do NOT update memory files — read-only synthesis.
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
Write a monthly JSON artifact (schema: `templates/schemas/monthly-digest.schema.json`).
Write to `outputs/monthly/{YYYY-MM}.json`
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
Read skills/thesis/SKILL.md.
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
Read skills/thesis-tracker/SKILL.md.
Read memory/THESES.md for all active theses.
Read today's digest from Supabase or outputs/daily/{DATE}/ snapshot JSON — not legacy DIGEST.md unless from archive.
Score each thesis: [Building | Confirmed | Extended | At Risk | Exited]
Append your review to memory/THESES.md under today's date.
```

---

## Deep Dive Research

For ad-hoc in-depth research on a specific ticker or topic:

**Prompt:**
```
Read skills/deep-dive/SKILL.md.
Run a deep dive on: {TICKER or TOPIC}
Read memory/equity/ROLLING.md and relevant sector ROLLING.md for prior notes.
Read config/watchlist.md to see if it's a tracked position.
Output: prefer outputs/deep-dives/{slug}.json (schema: templates/schemas/deep-dive.schema.json); markdown is derived.
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

# Manual commit format (JSON outputs + memory + config as needed)
git add outputs/ memory/ config/
git commit -m "$(date +%Y-%m-%d): Daily digest + memory update"
git push
```

CI/CD in `.github/workflows/deploy.yml` publishes the tearsheet on push to master.

---

## Archive Old Outputs

Legacy daily markdown lives under `archive/legacy-outputs/daily/`. Do not use filesystem archive scripts; the old `archive.sh` helper is retired (see `archive/legacy-scripts/README.md`).

---

## Error Recovery

**If a published snapshot or document is incomplete:**
```
Re-run or patch the digest snapshot JSON, then republish with scripts/materialize_snapshot.py.
Validate with: python3 scripts/validate_db_first.py --date YYYY-MM-DD
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
