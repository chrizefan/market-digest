---
name: sector-consumer-staples
description: Deep-dive analysis of the Consumer Staples sector (XLP). Covers food/beverage, household products, tobacco, and retail staples. Defensive income-generating sector — tracks pricing power, input costs, and volume trends. Run as part of the US Equities phase in the daily orchestrator.
---

# Consumer Staples Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLP and consumer ETFs)
- `config/preferences.md` (XLP is an active portfolio holding — defensive inflation play)
- `memory/sectors/consumer/ROLLING.md`
- Macro regime output from `macro.md`
- Commodities output (food/energy input costs)

---

## Research Steps

### 1. Sector ETF Overview
- **XLP** (Consumer Staples SPDR): price, % change, vs 50-DMA and 200-DMA
- **FSTA** (Fidelity Consumer Staples ETF): alternative measure
- XLP vs SPY relative strength: in a risk-off/defensive rotation, XLP should be outperforming
- Key names: PG, KO, PEP, COST, WMT, PM, MO, CL, MDLZ — check weight-adjusted contributions

### 2. Pricing Power vs Volume Trade-Off
- Are staples companies still taking price (raising prices) or has pricing peaked?
- Is volume recovering after years of price-led revenue growth?
- "Shrinkflation" fatigue: are consumers trading down (private label threat)?
- Key question: **can staples sustain margins if they can no longer take price?**

### 3. Input Cost Analysis
- Agricultural commodities (corn, wheat, soybeans, cocoa, coffee) relevant to food companies
- Energy costs (packaging, logistics): WTI effect on distribution costs
- Currency effects: large multinationals (PG, KO) have significant FX exposure
- Labor costs: minimum wage trends, union negotiations

### 4. Defensive Premium Assessment
- In defensive rotations, XLP becomes a crowded trade
- What is XLP's dividend yield vs 10Y treasury? (if spread is slim, defensive premium may be capped)
- XLP P/E premium vs SPY — is the defensive premium excessive or reasonable given macro?
- If rates are falling: XLP's bond-proxy status benefits; if rates rising: XLP valuation pressured

### 5. Consumer Health Signals
- Real wages: are consumers ahead or behind inflation?
- Consumer confidence (Conference Board or UMich) — any recent print
- Savings rate: high savings = spending resilience; low savings = stress ahead
- SNAP/EBT data: often a leading indicator for lower-income consumer stress
- Credit card delinquencies from big issuers: early warning for consumer stress

### 6. Earnings & Catalysts
- Any major staples names reporting this week?
- Recent organic sales growth guidance (the key metric — price + volume)
- GLP-1 obesity drug impact: does reduced food/beverage consumption structurally hurt revenue?
- Climate risk: any weather event affecting crop supply chains or agricultural input costs

### 7. Valuation Context
- XLP NTM P/E vs historical average
- Dividend yield: XLP nominally yields ~2.5-3% — compare to current 10Y yield
- Is the "bond proxy" premium still justified at current rate levels?

### 8. Portfolio Assessment
- XLP (8%) is held as **pricing-power defensive in inflation** regime
- Does current inflation data support the thesis?
- At current yield levels, is XLP's carry still attractive vs BIL/SHY (cash/short bond alternatives)?
- Rotation signal: if growth returns, XLP typically underperforms — is there any inflection?

---

## Output Format

```
### 🛒 CONSUMER STAPLES SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLP: $X (±X%)
**vs 200-DMA**: [above/below by X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]

**Pricing Power Signal**: [Are companies still taking price or volume at risk?]

**Input Cost Pressure**: [Agricultural/energy/FX input cost direction]

**Defensive Premium**: XLP P/E ~Xx | Div yield ~X% vs 10Y X% | [Bond proxy spread = Xbps]

**Consumer Health**: [Real wages, confidence, delinquency signal]

**GLP-1 Secular Risk**: [Relevant/Not relevant today — flag if any developments]

**Earnings/Catalyst**: [Any near-term earnings or product/guidance news]

**Portfolio Note**: XLP thesis [✅ Holding / ⚠️ Watch / ❌ Challenged]
- Rate/yield context: [still competitive carry vs BIL/SHY?]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/consumer/ROLLING.md`:
- One on XLP defensive performance vs SPY (holding premium or fading?)
- One on pricing power / input cost / margin trend
- One on any consumer health indicator relevant to thesis
