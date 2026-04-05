# Market Digest — Agent Instructions

> Universal entry point for AI agents (OpenHands, Devin, Cline, generic LLM agents).
> This file describes the repository, its conventions, and how an agent should operate within it.

---

## Repository Purpose

**market-digest** is a structured daily market intelligence system. It uses a **three-tier cadence**:

| Tier | When | What | Token Cost |
|------|------|------|------------|
| **Weekly Baseline** | Sunday | Full 9-phase run — all 20+ output files from scratch | 100% |
| **Daily Delta** | Mon–Sat | Lightweight delta — only changed segments | ~20–30% |
| **Monthly Synthesis** | Month end | Review of all baselines + deltas | ~40–50% |

Estimated savings: **~70% fewer tokens** on typical weekday runs.

The system covers all global asset classes: macro, equities (11 GICS sectors), crypto, bonds, commodities, forex, international, plus alternative data (sentiment, CTA positioning, options, politician signals) and institutional intelligence (ETF flows, hedge fund intel).

The system is driven by **skill files** (`skills/*.md`) which are step-by-step instruction sets for an AI agent. An agent's job is to:
1. Check `_meta.json` in today's output folder to determine run type (baseline vs delta)
2. Read the appropriate skill file (`SKILL-weekly-baseline.md` or `SKILL-daily-delta.md`)
3. Search live web data (never use training data for prices)
4. Write outputs to the correct file paths
5. Update rolling memory files after each session

---

## Quickstart for Agents

### Step 1: Check today's run type
```
Read: outputs/daily/YYYY-MM-DD/_meta.json
  "type": "baseline" → Sunday full run
  "type": "delta"    → Weekday delta run
  (missing)           → Legacy folder — treat as baseline
```

### Sunday — Weekly Baseline (full run):
```
Read: skills/SKILL-weekly-baseline.md
Follow: All 9 phases in order
Output: outputs/daily/YYYY-MM-DD/DIGEST.md  (complete digest)
```

### Mon–Sat — Daily Delta (lightweight):
```
Read: skills/SKILL-daily-delta.md
Load: outputs/daily/[baseline-date]/DIGEST.md  (this week's baseline)
Write: outputs/daily/YYYY-MM-DD/deltas/*.delta.md  (only changed segments)
Materialize: outputs/daily/YYYY-MM-DD/DIGEST.md  (apply deltas to baseline)
```

### Single segment:
```
Read: scripts/run-segment.sh [segment-name]       (baseline mode)
Read: scripts/run-segment.sh [segment] --delta    (delta mode)
```

### Synthesize/materialize digest from segments:
```
Read: scripts/combine-digest.sh  (auto-detects baseline vs delta mode)
```

### End of month synthesis:
```
Read: skills/SKILL-monthly-synthesis.md
Run: scripts/monthly-rollup.sh  (collects all baselines + deltas)
```

---

## Repository Structure

```
config/
  watchlist.md        ← Assets to track (read at every session start)
  preferences.md      ← Trading style, risk profile, active theses (read at every session start)
  hedge-funds.md      ← 16 tracked hedge funds with CIK, X handles, style
  data-sources.md     ← 30+ X accounts, data URLs, economic calendars
  email-research.md   ← Dedicated Gmail setup + subscription list

skills/
  SKILL-orchestrator.md       ← Entry point — detects baseline vs delta, routes accordingly
  SKILL-weekly-baseline.md    ← Sunday full run (9-phase pipeline + Week Setup)
  SKILL-daily-delta.md        ← Mon-Sat delta run (triage → changed segments only)
  SKILL-monthly-synthesis.md  ← End-of-month cumulative review
  SKILL-digest.md             ← Legacy → points to orchestrator
  SKILL-macro.md              ← Macro analysis
  SKILL-equity.md             ← US equities overview
  SKILL-crypto.md             ← Crypto analysis
  SKILL-bonds.md              ← Bonds & rates
  SKILL-commodities.md        ← Commodities
  SKILL-forex.md              ← Forex
  SKILL-international.md      ← International/EM
  SKILL-[specialized tools]   ← thesis, earnings, deep-dive, etc.
  sectors/                    ← 11 GICS sector sub-agent skills
  alternative-data/           ← 4 alt-data sub-agent skills
  institutional/              ← 2 institutional intelligence skills

memory/                       ← 23 rolling append-only research logs
  BIAS-TRACKER.md             ← Daily bias table (14 columns)
  THESES.md                   ← Active thesis register
  macro/ equity/ crypto/ bonds/ commodities/ forex/
  international/
  sectors/{10 sector dirs}/
  alternative-data/{4 type dirs}/
  institutional/{2 type dirs}/

templates/
  master-digest.md            ← DIGEST.md template (baselines)
  delta-digest.md             ← DIGEST-DELTA.md template (deltas)
  delta-segment.md            ← Segment .delta.md template
  sector-report.md            ← Sector output template
  alt-data-report.md          ← Alt data template
  institutional-report.md     ← Institutional template
  weekly-digest.md            ← Weekly rollup template (incl. Week Evolution table)
  monthly-digest.md           ← Monthly synthesis template (incl. Cumulative Regime Shifts)

outputs/daily/YYYY-MM-DD/
  _meta.json                  ← Run type: {"type": "baseline"} or {"type": "delta", "baseline": "..."}
  DIGEST.md                   ← Master output (complete digest — materialized for deltas)
  DIGEST-DELTA.md             ← Delta-only changes (delta days only)
  deltas/                     ← Per-segment delta files (delta days only)
    macro.delta.md
    crypto.delta.md  ...      ← Only segments that changed
  macro.md bonds.md ...       ← Full segment files (baseline days only)
  us-equities.md alt-data.md institutional.md
  sectors/
    technology.md ...         ← Full sector files (baseline days)
    technology.delta.md ...   ← Sector delta files (delta days, only if changed)

scripts/
  new-day.sh                  ← Auto-detects Sunday (baseline) vs weekday (delta)
  new-week.sh                 ← Force a baseline run on any day
  materialize.sh              ← Print prompt to build DIGEST.md from baseline + deltas
  status.sh                   ← Project health check (shows baseline/delta counts)
  run-segment.sh              ← Single-segment prompt printer (supports --delta flag)
  combine-digest.sh           ← Synthesis prompt (auto-detects baseline vs delta mode)
  git-commit.sh               ← Commit outputs
  weekly-rollup.sh            ← Weekly synthesis (finds baseline + delta files)
  monthly-rollup.sh           ← Monthly synthesis (collects all baselines + deltas)
  memory-search.sh            ← Search all ROLLING.md files

agents/                       ← Named agent role definitions
docs/agentic/                 ← Full agentic documentation suite
```

---

## Core Behavioral Rules

### Always:
- **Check `_meta.json`** before any analysis — determines baseline vs delta mode
- **Search the web** for current prices, yields, news. Never use training data cutoff values.
- **Read config/** at session start (watchlist.md + preferences.md minimum)
- **Read relevant memory ROLLING.md files** for continuity before running any analysis
- **Update memory files** every day (even on delta days) — append, never delete
- **Save outputs** to the correct path (see Output File Naming below)
- **State a bias** (Bullish/Bearish/Neutral/Conflicted) with rationale for every segment
- **Materialize DIGEST.md** on delta days — the dashboard reads DIGEST.md, not DIGEST-DELTA.md
- Run **Phase 1 (alternative data) BEFORE Phase 3 (macro)** — positioning informs regime read

### On delta days (Mon–Sat): additionally
- Load the week's baseline files first — they are your analytical anchor
- Only write `.delta.md` files for segments that changed (triage first, then write)
- Always write mandatory deltas: `macro`, `us-equities`, `crypto` — even on quiet days
- After writing deltas, always produce a materialized full `DIGEST.md`

### Never:
- Use training data cutoff prices or news as "current" values
- Delete or overwrite existing memory file content — only append
- Skip memory updates — they are the system's long-term intelligence layer
- Skip materialization — `DIGEST.md` must always be a readable, complete file
- Produce hedged, wishy-washy analysis — state the signal clearly
- Provide specific buy/sell investment advice (analysis and bias are fine; specific financial advice is not)

---

## Memory File Protocol

Memory files are append-only logs. After completing each segment, append:

```markdown
## YYYY-MM-DD
- [Most important observation with data point]
- [Second key finding]
- [Thesis evolution or regime implication]
- [Portfolio-relevant signal if applicable]
```

**Complete list of memory files to update in a full digest session (23 files):**

Core: `memory/macro/ROLLING.md`, `memory/equity/ROLLING.md`, `memory/crypto/ROLLING.md`, `memory/bonds/ROLLING.md`, `memory/commodities/ROLLING.md`, `memory/forex/ROLLING.md`, `memory/international/ROLLING.md`

Sectors (10): `memory/sectors/{technology,healthcare,energy,financials,consumer,industrials,utilities,materials,real-estate,comms}/ROLLING.md`

Alt Data (4): `memory/alternative-data/{sentiment,cta-positioning,options,politician}/ROLLING.md`

Institutional (2): `memory/institutional/{flows,hedge-funds}/ROLLING.md`

Also update: `memory/BIAS-TRACKER.md` (append one row)

---

## Pipeline Summary (Three-Tier Cadence)

### Sunday — Weekly Baseline (full 9-phase run)
Skill: `skills/SKILL-weekly-baseline.md` → `skills/SKILL-orchestrator.md`

| Phase | Content | Output |
|-------|---------|--------|
| 1 | Alternative Data (sentiment, CTA, options, politician) | `alt-data.md` |
| 2 | Institutional Intelligence (ETF flows, HF intel) | `institutional.md` |
| 3 | Macro Analysis | `macro.md` |
| 4A–E | Bonds, Commodities, Forex, Crypto, International | 5 files |
| 5A–L | US Equities + 11 GICS Sector Sub-Agents | 12 files |
| 6 | Memory + Bias Tracker Update | 23 ROLLING.md files |
| 7 | DIGEST.md Synthesis + Week Ahead Setup | `DIGEST.md` |
| 8 | Web Dashboard Update | `dashboard-data.json` |
| 9 | Post-Mortem & Evolution | `memory/evolution/` |

### Mon–Sat — Daily Delta (~70% token savings)
Skill: `skills/SKILL-daily-delta.md`

| Phase | Content | Output |
|-------|---------|--------|
| Triage | Which segments changed vs baseline? | Internal decision |
| 1–5 | Run only segments with material changes | `deltas/*.delta.md` |
| Mandatory | Always: macro, us-equities, crypto | 3 delta files min |
| 6 | Memory + Bias Tracker (always) | 23 ROLLING.md files |
| 7 | DIGEST-DELTA.md + materialize DIGEST.md | Both files |
| 8–9 | Dashboard + Evolution | Same as baseline |

### End of Month — Monthly Synthesis
Skill: `skills/SKILL-monthly-synthesis.md`
Script: `./scripts/monthly-rollup.sh`

---

## Output File Naming

### Sunday (Baseline) — Full output set
```
outputs/daily/YYYY-MM-DD/_meta.json              ← {"type": "baseline", "week": "YYYY-Wnn"}
outputs/daily/YYYY-MM-DD/DIGEST.md               ← Master output
outputs/daily/YYYY-MM-DD/macro.md                ← Phase 3
outputs/daily/YYYY-MM-DD/bonds.md                ← Phase 4A
outputs/daily/YYYY-MM-DD/commodities.md          ← Phase 4B
outputs/daily/YYYY-MM-DD/forex.md                ← Phase 4C
outputs/daily/YYYY-MM-DD/crypto.md               ← Phase 4D
outputs/daily/YYYY-MM-DD/international.md        ← Phase 4E
outputs/daily/YYYY-MM-DD/us-equities.md          ← Phase 5A
outputs/daily/YYYY-MM-DD/alt-data.md             ← Phase 1
outputs/daily/YYYY-MM-DD/institutional.md        ← Phase 2
outputs/daily/YYYY-MM-DD/sectors/technology.md   ← Phase 5B (and all 11 sectors)
```

### Mon–Sat (Delta) — Only what changed
```
outputs/daily/YYYY-MM-DD/_meta.json              ← {"type": "delta", "baseline": "YYYY-MM-DD", ...}
outputs/daily/YYYY-MM-DD/DIGEST.md               ← Materialized full digest (always present)
outputs/daily/YYYY-MM-DD/DIGEST-DELTA.md         ← Delta-only changes
outputs/daily/YYYY-MM-DD/deltas/macro.delta.md   ← Always written
outputs/daily/YYYY-MM-DD/deltas/crypto.delta.md  ← Always written
outputs/daily/YYYY-MM-DD/deltas/us-equities.delta.md  ← Always written
outputs/daily/YYYY-MM-DD/deltas/bonds.delta.md   ← If threshold met
outputs/daily/YYYY-MM-DD/deltas/[segment].delta.md  ← Only segments that changed
outputs/daily/YYYY-MM-DD/sectors/[sector].delta.md  ← Only sectors that changed
```

---

## Named Agents

Specialized agent roles are defined in `agents/`:

| Agent | File | Purpose |
|-------|------|---------|
| Orchestrator | `agents/orchestrator.agent.md` | Full 9-phase pipeline driver; routes to baseline or delta mode |
| Sector Analyst | `agents/sector-analyst.agent.md` | Run one or more sector deep-dives |
| Alt Data Analyst | `agents/alt-data-analyst.agent.md` | Phase 1 alternative data gathering |
| Institutional Analyst | `agents/institutional-analyst.agent.md` | Phase 2 smart money intelligence |
| Research Assistant | `agents/research-assistant.agent.md` | Ad-hoc research queries |
| Thesis Tracker | `agents/thesis-tracker.agent.md` | Portfolio thesis management |

---

## Platform-Specific Documentation

See `docs/agentic/PLATFORMS.md` for setup instructions for:
- Claude Code (this file's home)
- Claude.ai Projects
- GitHub Copilot
- Cursor
- Windsurf
- Aider
- OpenHands
- Devin
