---
name: weekly-baseline
description: >
  Sunday weekly baseline run. Full 9-phase pipeline that anchors the week for Mon-Sat deltas.
  Triggers on Sundays, when running new-week.sh, or when the user says "run weekly baseline",
  "baseline run", or "full baseline". Adds a Week Setup preamble reviewing prior week evolution
  and sets the analytical frame for the upcoming week.
---

# Market Digest — Weekly Baseline Skill

This is the Sunday full-run skill. It executes the complete 9-phase pipeline with two additions:
1. **Week Setup Preamble** — reviews last week's evolution before any analysis
2. **Week Ahead Calendar** — sets the analytical frame for Mon–Sat deltas

---

## Pre-Flight: Week Setup Preamble

Before the standard Pre-Flight, complete the following steps:

### Step 1: Prior Week Review
Read these files (in order) and internalize without summarizing to the user:
- `outputs/weekly/[last week label].md` — if it exists
- `memory/BIAS-TRACKER.md` — the last 5–7 rows (last week's daily readings)
- `memory/THESES.md` — full thesis register

After reading, note internally:
- **Bias trajectory**: Was last week mostly bullish/bearish? Any mid-week regime flips?
- **Thesis hits/misses**: Which theses were confirmed, challenged, or neutralized?
- **Persistent signals**: Any alt-data or institutional signals that were consistent all week?
- **Surprises**: What did the market do that wasn't anticipated in the prior baseline?

### Step 2: Week Ahead Calendar
Scan `config/data-sources.md` and live web sources for this week's high-impact events:
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

Follow ALL 9 phases from `skills/SKILL-orchestrator.md` exactly.

Return here after Phase 7 (DIGEST.md) to add the Week Ahead Setup section, then continue to Phase 8.

---

## Phase 7 Addition: Week Ahead Setup

After completing Phase 7 (DIGEST.md synthesis), append the following section to the bottom of `outputs/daily/{{DATE}}/DIGEST.md` **before** the Risk Radar section:

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

After completing Phase 9C (Improvement Proposals), append a retrospective review to `memory/evolution/quality-log.md` with the following structure:

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

All items from the standard Session Completion Checklist (`skills/SKILL-orchestrator.md`), plus:

- [ ] Prior week review complete (BIAS-TRACKER last 5-7 rows read)
- [ ] Week Ahead Calendar scanned (high-impact events identified)
- [ ] `_meta.json` in output folder confirms `"type": "baseline"`
- [ ] Week Ahead Setup section added to `DIGEST.md`
- [ ] Weekly Retrospective appended to `memory/evolution/quality-log.md`
