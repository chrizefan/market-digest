---
name: monthly-synthesis
description: >
  End-of-month comprehensive synthesis. Reviews all weekly baselines and daily deltas for the
  month to produce a long-term trend analysis and thesis performance review. Triggers when the
  user says "run monthly synthesis", "end of month review", or via monthly-rollup.sh.
---

# Market Digest — Monthly Synthesis Skill

End-of-month review. Synthesizes the full month of weekly baselines + daily deltas into a
comprehensive long-term view. Designed to run on the last trading day of each month.

---

## Pre-Flight: Monthly Context Load

### Step 1: Identify this month's files
- **Weekly baselines**: `outputs/daily/{{YEAR}}-{{MONTH}}-*/` folders where `_meta.json` has `"type": "baseline"`
- **Daily deltas**: All `outputs/daily/{{YEAR}}-{{MONTH}}-*/DIGEST-DELTA.md` files
- **Weekly rollups**: `outputs/weekly/{{YEAR}}-W*.md` files from this month's weeks
- **Bias tracker**: `memory/BIAS-TRACKER.md` — all rows for this month (typically 20–23 rows)

### Step 2: Load Core Context
- `config/preferences.md` — active portfolio and theses
- `memory/THESES.md` — full thesis register (for performance review)
- `memory/BIAS-TRACKER.md` — full month of daily readings

Announce: "Monthly synthesis context loaded. Found [N] weekly baselines, [N] delta days. Starting Phase 1."

---

## Phase 1 — Weekly Baseline Review

For each weekly baseline this month (typically 4–5 baselines), read the baseline `DIGEST.md` and note:

1. **Week-opening regime** (4-factor classification)
2. **Week-opening bias** per asset class
3. **Thesis statuses** at week start
4. **Week Ahead Setup section** — what events were flagged as high-impact?

Build an internal table:
```
| Week | Baseline Date | Macro Regime | Equity Bias | Crypto Bias | Bond Bias |
|------|--------------|-------------|------------|------------|-----------|
| W15  | YYYY-MM-DD   | ...          | ...         | ...         | ...       |
```

---

## Phase 2 — Delta Evolution Scan

Read all `DIGEST-DELTA.md` files for this month in chronological order.

For each delta, extract:
- Which segments changed vs which carried forward
- Any bias shifts (especially reversals from the week's baseline)
- Any high-activity days (5+ segments changed = possible regime inflection)

Build a bias timeline:
```
| Date | Delta# | Segments Changed | Macro Regime | Notable Shift |
|------|--------|-----------------|-------------|--------------|
```

Identify:
- **Bias trends**: How many days was each asset class net bullish vs bearish this month?
- **Inflection days**: Dates with the largest number of segment changes
- **Stability windows**: Multi-day stretches with minimal changes (regime was holding)

---

## Phase 3 — Cumulative Regime Assessment

Synthesize the month's regime evolution from the delta scan:

1. **Net direction per macro factor** over the month:
   - Growth: Expanding → ? How many times did it shift?
   - Inflation: Hot → ? What was the dominant reading?
   - Policy: Tightening/Neutral/Easing — any pivots?
   - Risk Appetite: Net risk-on or risk-off for the month?

2. **Regime stability score**: How many baseline-to-baseline weeks held the same regime classification?

3. **Critical inflection dates**: Specific dates that marked regime changes, with the catalyst

---

## Phase 4 — Asset Class Monthly Performance

For each asset class, synthesize across baselines and deltas:

### Equities
- Month open vs month close for SPY, QQQ, IWM
- Sector leadership rotation during the month
- Any significant factor tilts (value/growth/momentum)

### Crypto
- BTC month open vs close; ETH vs BTC ratio evolution
- Dominant narrative shift during the month

### Bonds & Rates
- 2Y and 10Y yield movement (bps) over the month
- Fed pause/hike/cut probability evolution
- Credit spread direction

### Commodities
- WTI, Gold, Copper month performance
- Any major supply/demand narrative

### Forex
- DXY month performance
- Key pair moves
- Carry trade stress/stability

### International
- Major developed markets performance
- EM standouts (winners and losers)

---

## Phase 5 — Thesis Performance Review

For each thesis in `memory/THESES.md` that was active during this month:

| Field | What to Assess |
|-------|---------------|
| Confirmation count | How many delta days provided confirming signals? |
| Challenge count | How many delta days had conflicting signals? |
| Invalidation check | Did any invalidation trigger get hit? |
| Target proximity | Is the thesis approaching its price/time target? |
| Recommendation | Close / Maintain / Increase conviction / Update thesis |

Flag explicitly: **Any thesis whose invalidation trigger came within 10% during the month.**

---

## Phase 6 — Monthly Synthesis Output

Write the full monthly synthesis using `templates/monthly-digest.md`.

**Save to**: `outputs/monthly/{{YEAR}}-{{MONTH}}.md`

**Required sections** (beyond the template):

Add a **Cumulative Regime Shifts** section:
```markdown
## 📊 Cumulative Regime Shifts — {{MONTH_LABEL}}

| Factor | Month Start | Month End | # Shifts | Net Direction |
|--------|------------|-----------|----------|---------------|
| Growth | | | | |
| Inflation | | | | |
| Policy | | | | |
| Risk Appetite | | | | |

**Critical inflection dates**:
- [Date]: [Catalyst] → [What shifted]
- [Date]: [Catalyst] → [What shifted]

**Regime stability**: [Was this a high-drift month or a trend month?]
```

Add a **Delta Efficiency Summary**:
```markdown
## ⚡ Month's Delta Efficiency

| Metric | Value |
|--------|-------|
| Baselines this month | [N] |
| Delta days this month | [N] |
| Avg segments changed per delta | [N] |
| High-activity days (5+ changes) | [N] |
| "Quiet" days (≤2 changes) | [N] |
| Estimated token savings vs full runs | ~[X]% |
```

---

## Phase 7 — Memory Updates

Update these memory files with a monthly summary entry:

For each of the 23 ROLLING.md files, **if the last entry is earlier than this month**, append:
```markdown
## {{YEAR}}-{{MONTH}} (Monthly Synthesis)
- [Month's net direction and key development]
- [Any structural shift vs prior months]
- [Thesis implication]
```

Also update `memory/BIAS-TRACKER.md` with a summary row:
```
| {{YEAR}}-{{MONTH}} SUMMARY | [Net macro] | [Net equity] | [Net crypto] | ... | Monthly wrap |
```

---

## Phase 8 — Dashboard Update

Run: `python3 scripts/update-tearsheet.py`

---

## Completion Checklist

- [ ] All this month's weekly baselines reviewed (N baselines)
- [ ] All delta files scanned chronologically
- [ ] Bias timeline constructed (delta evolution scan complete)
- [ ] Cumulative regime shifts identified
- [ ] Asset class monthly performance summarized
- [ ] Thesis performance reviewed (all active theses)
- [ ] `outputs/monthly/{{YEAR}}-{{MONTH}}.md` written with all required sections
- [ ] Cumulative Regime Shifts section added
- [ ] Delta Efficiency Summary added
- [ ] Memory files updated with monthly summary entries
- [ ] Dashboard updated
- [ ] `git-commit.sh` run
