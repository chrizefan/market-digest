# 🔄 Daily Delta — {{DATE}}

> Baseline: {{BASELINE_DATE}} ({{WEEK_LABEL}}) | Generated: {{TIMESTAMP}}
> Delta #{{DELTA_NUMBER}} this week | Segments changed: {{CHANGED_COUNT}}/{{TOTAL_SEGMENTS}}

---

## 📋 Delta Summary

**Market regime shift**: [UNCHANGED / SHIFTED — describe if shifted]
**Overall bias shift**: [UNCHANGED / SHIFTED — was X, now Y]
**Conviction change**: [UNCHANGED / HIGHER / LOWER — why]

**Segments with material changes today**:
- ✏️ [segment 1] — [1-line reason]
- ✏️ [segment 2] — [1-line reason]

**Segments carried forward (no material change)**:
- ➡️ [segment list — these carry forward from baseline or last delta]

---

## 🌡️ Market Regime Snapshot — DELTA

> Only include this section if the regime or bias shifted from baseline.

**Overall Bias**: [UNCHANGED from {{BASELINE_DATE}}: X] or [SHIFTED: Was X → Now Y]
**Shift Reason**: [What changed to cause the shift]

---

## CHANGED SEGMENTS

> For each segment with material changes, include a delta block below.
> Use the exact section headers from master-digest.md so the materializer can merge.
> Only write the fields/rows that changed — mark everything else as carried forward.

### 🌍 Macro & Events — DELTA

**Regime Change**: [Field]: Was [X] → Now [Y]

**Today's Key Events** (new data):
| Time | Event | Consensus | Prior | Actual |
|------|-------|-----------|-------|--------|
| | | | | |

**Central Banks**: [New signal or UNCHANGED]
**Overnight Summary**: [New summary]

---

### 📈 Equities — DELTA

**Bias**: [UNCHANGED: X] or [SHIFTED: Was X → Now Y]
**Indices**: SPY: $X (±X%) | QQQ: $X (±X%) | IWM: $X (±X%)
**Notable movers**: [Only new/changed watchlist movers]
**VIX**: [Current level — shift from baseline]

---

### 🪙 Crypto — DELTA

**Bias**: [UNCHANGED: X] or [SHIFTED: Was X → Now Y]
**BTC**: $X (±X% 24h) | **ETH**: $X (±X% 24h)
**Notable**: [Only if material change]

---

### 🏦 Bonds & Rates — DELTA

**Bias**: [UNCHANGED: X] or [SHIFTED: Was X → Now Y]
**Yields**: 2Y: X% (Δ±Xbps) | 10Y: X% (Δ±Xbps)
**Fed**: [New signal or UNCHANGED]

---

### 🛢️ Commodities — DELTA

**Bias**: [UNCHANGED: X] or [SHIFTED: Was X → Now Y]
**Notable moves**: [Only significant price changes from baseline]

---

### 💱 Forex — DELTA

**DXY**: X.XX (±X% from baseline)
**Notable pairs**: [Only significant moves]

---

### 🌐 International — DELTA

**Notable**: [Only if material regional development]

---

### 🔀 Alternative Data — DELTA

**Sentiment shift**: [Direction from baseline]
**Notable signals**: [Only new/changed signals]

---

### 🏛️ Institutional Intelligence — DELTA

**Flow shift**: [Direction from baseline]
**Notable**: [Only new intel]

---

## 🗺️ Sector Scorecard — DELTA

> Only list sectors where bias or key driver changed from baseline.

| Sector | ETF | Bias Change | New Driver | Portfolio Note |
|--------|-----|-------------|-----------|----------------|
| [Only changed sectors] | | Was X → Now Y | | |

---

## 🎯 Thesis Tracker — DELTA

> Only list theses where status changed today.

| Thesis | Was | Now | Catalyst |
|--------|-----|-----|----------|
| [Only changed theses] | | | |

---

## 📐 Portfolio Positioning — DELTA

> Only include if recommended changes differ from baseline positioning.

| Position | Baseline Action | Today's Action | Change Reason |
|----------|----------------|----------------|---------------|
| [Only changed recommendations] | | | |

---

## ⚡ Actionable Summary

> Always fresh — top 5 items for TODAY.

1. **[Action/Watch]** — [Why it matters right now]
2. **[Action/Watch]** — [Why it matters right now]
3. **[Action/Watch]** — [Why it matters right now]
4. **[Action/Watch]** — [Why it matters right now]
5. **[Action/Watch]** — [Why it matters right now]

---

## 🚨 Risk Radar

> Always fresh — what could break the bias in next 24-72 hours.

- **[Risk 1]**: [Scenario and trigger]
- **[Risk 2]**: [Scenario and trigger]
- **[Risk 3]**: [Scenario and trigger]

---

*Delta from baseline: `outputs/daily/{{BASELINE_DATE}}/DIGEST.md`*
*Materialized: `outputs/daily/{{DATE}}/DIGEST.md`*
*Memory updated: 24 ROLLING.md files ✓*
