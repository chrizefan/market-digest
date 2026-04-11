---
name: weekly-baseline
description: >
  Sunday weekly baseline run. Full 9-phase pipeline that anchors the week for Mon-Sat deltas.
  Triggers on Sundays (see scripts/new-day.sh → run_db_first), or when the user says "run weekly baseline",
  "baseline run", or "full baseline". In DB-first mode, produces a fully materialized digest
  snapshot JSON and publishes it to Supabase (no outputs/daily writes). Adds a Week Setup preamble
  reviewing prior week evolution and sets the analytical frame for the upcoming week.
---

# digiquant-atlas — Weekly Baseline Skill

This is the Sunday full-run skill. It executes the complete 9-phase pipeline with two additions:
1. **Week Setup Preamble** — reviews last week's evolution before any analysis
2. **Week Ahead Calendar** — sets the analytical frame for Mon–Sat deltas

---

## Pre-Flight: Week Setup Preamble

Before the standard Pre-Flight, complete the following steps:

### Step 1: Prior Week Review
Read these files (in order) and internalize without summarizing to the user:
- Supabase `documents` for `document_key` matching `weekly/{{LAST_WEEK_LABEL}}.json` — if present
- `config/portfolio.json` — current positions and last proposed_positions (note tickers only for now; actual weights reviewed in Phase 7D)

After reading, note internally:
- **Bias trajectory**: Was last week mostly bullish/bearish? Any mid-week regime flips?
- **Thesis hits/misses**: Which theses were confirmed, challenged, or neutralized?
- **Persistent signals**: Any alt-data or institutional signals that were consistent all week?
- **Surprises**: What did the market do that wasn't anticipated in the prior baseline?
- **Portfolio health**: Any pending rebalance actions from last week that went unexecuted? Any positions held longer than their thesis time horizon without a confirmation signal?

### Step 2: Week Ahead Calendar
Scan `docs/ops/data-sources.md` and live web sources for this week's high-impact events:
- FOMC meetings or Fed speeches?
- Major data releases (CPI, NFP, PPI, PCE, retail sales, ISM)?
- Earnings of tracked companies (from `config/watchlist.md`)?
- Geopolitical events, central bank decisions, auctions?

Write a brief internal note ranking events by market-impact potential:
```
HIGH IMPACT: [events that could shift the macro regime]
MEDIUM IMPACT: [events that could shift single segments]  
LOW IMPACT: [routine releases unlikely to move the needle]
```

Announce to user: "Week Setup complete. Prior week reviewed. Starting full baseline pipeline (Phase 1 of 9)."

---

## Full Pipeline

Follow ALL 9 phases from `skills/orchestrator/SKILL.md` exactly.

Return here after Phase 7 (digest synthesis) to add the Week Ahead Setup section, then publish the DB snapshot.

---

## Phase 7 Addition: Week Ahead Setup

After completing Phase 7 synthesis, include the following content in the **snapshot narrative** under a dedicated block (e.g. `narrative.macro` or a separate `narrative.week_ahead_setup` if you add it to the schema). Keep the content identical to the template below.

```markdown
---

## 📅 Week Ahead Setup — {{WEEK_LABEL}}

**This week's base scenario**: [Macro regime + overall bias heading into the week. 2 sentences max.]

**Highest conviction watch**: [Single most important thing to track this week — one sentence]

**Delta sensitivity**: [What specific data prints or events this week could shift the bias? e.g., "Wednesday CPI: >+0.4% MoM flips bond bias to bearish. <+0.1% sends equities risk-on."]

**Key Events Calendar**:
| Day | Date | Event | Expected Impact | Watch Level |
|-----|------|-------|----------------|-------------|
|     |      |       |                |             |

**Weekly invalidation triggers**:
- [Condition that would force full regime reassessment mid-week]
- [Second condition]

**Baseline anchors** (What baseline values Mon–Sat deltas are compared against):
- SPY: $X | QQQ: $X | BTC: $X | 10Y: X% | DXY: X.XX | WTI: $X | Gold: $X
```

---

## Phase 9 Addition: Prior Week Retrospective


```markdown
## {{DATE}} — Weekly Retrospective

**Baseline accuracy**: How well did last week's baseline predict the week's behavior?
- Macro regime held: [Y/N — commentary]
- Equity bias: [held/missed — why]
- Key thesis: [confirmation/challenge count this week]

**Delta quality**: Which daily deltas were most valuable? Which were unnecessary?

**Week's biggest surprise**: [1-2 sentences]
```

---

## Baseline Completion Checklist

All items from the standard Session Completion Checklist (`skills/orchestrator/SKILL.md`), plus:

- [ ] Prior week rollup reviewed in Supabase or `config/portfolio.json` loaded
- [ ] Week Ahead Calendar scanned (high-impact events identified)
- [ ] Week Ahead Setup captured **inside** the digest snapshot JSON (narrative fields)
- [ ] Full digest snapshot JSON produced (schema `templates/digest-snapshot-schema.json`)
- [ ] Snapshot published to Supabase via `scripts/materialize_snapshot.py --snapshot-json ...`
- [ ] Phase 7C: Analyst outputs published as `documents` (e.g. `positions/{{TICKER}}/{{DATE}}.json`) or embedded per team convention
- [ ] Phase 7D: `rebalance_decision` published via `publish_document.py` (schema `rebalance-decision.schema.json`)

### DB-first publish command

Have the operator run:

```bash
python3 scripts/materialize_snapshot.py \
  --date {{DATE}} \
  --snapshot-json '<PASTE_FULL_SNAPSHOT_JSON_HERE>'
```

This upserts:
- `daily_snapshots` (including `snapshot` + `digest_markdown`)
- `positions`
- `theses`
- `documents` (rendered `DIGEST.md`)

