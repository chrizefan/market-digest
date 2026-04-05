---
name: sector-consumer-discretionary
description: Deep-dive analysis of the Consumer Discretionary sector (XLY). Covers auto, housing, retail, restaurants, leisure, and e-commerce. Cyclical high-beta sector — signals consumer spending health and risk appetite. Run as part of the US Equities phase in the daily orchestrator.
---

# Consumer Discretionary Sub-Agent

## Inputs
- `config/watchlist.md` (XLY and related ETFs)
- `config/preferences.md`
- `memory/sectors/consumer/ROLLING.md` (shared with staples)
- Macro regime output from `macro.md`

---

## Research Steps

### 1. Sector ETF Overview
- **XLY** (Consumer Discretionary SPDR): price, % change, vs 50-DMA and 200-DMA
- XLY vs SPY relative strength: XLY leads in risk-on environments and sells off hard in risk-off
- Key concentration: AMZN and TSLA dominate XLY weighting — separate their news from true sector read
- Strip out AMZN/TSLA: are the remaining discretionary names (BKNG, MCD, NKE, HD, SBUX) also moving?

### 2. Sub-Sector Breakdown
- **E-Commerce / AMZN**: AWS vs retail split — understand which is driving the stock
- **Auto (TSLA, F, GM)**: EV adoption, tariff risk, auto loan rates vs affordability
- **Homebuilders (XHB)**:  mortgage rates 30Y, housing starts, building permits — key level
- **Restaurants (MCD, SBUX, CMG)**: consumer trading down or treating themselves?
- **Hardline Retail (HD, LOW, TGT, WMT disc)**: housing activity correlation
- **Travel & Leisure (BKNG, MAR, HLT, RCL, CCL)**: post-COVID normalization status, any demand softening

### 3. Consumer Spending Health Check
- Latest retail sales data (monthly percent change)
- Credit card spending growth vs nominal inflation — real spending flat/negative?
- Save-now-buy-later shift: BNPL delinquencies as early indicator
- Gas prices effect on consumer discretionary spend (disposable income squeeze when oil high)
- At WTI $112: gasoline >$4/gallon depletes discretionary wallet — this is a sector headwind now

### 4. Auto Sector Deep Scan
- Auto loan delinquency rates: are they rising?
- New vehicle affordability: average transaction price vs median income
- Tariff risk: proposed or active auto tariffs on imports
- EV penetration: weekly charging/registration data
- Dealer inventory levels: days-supply above 60 = pricing pressure for OEMs

### 5. Housing-Adjacent Read
- 30Y mortgage rate: at current level, what does monthly payment look like? Affordability index
- Existing home sales: locked-in homeowners, low inventory
- Homebuilder sentiment (NAHB index)
- Home improvement: is HD/LOW benefiting from renovation-in-place trend?
- Housing starts and permits: leading indicator for construction-adjacent spending

### 6. Earnings & Catalysts
- Any discretionary names reporting this week?
- Recent earnings season read-throughs: consumer guidance tone
- Any analyst downgrades/upgrades reflecting spending slowdown risk

### 7. Valuation Context
- XLY NTM P/E vs historical average
- XLY/XLP ratio: is the market rewarding risk via discretionary or hiding in staples?
- XLY at this level vs recession scenarios: how much downside if consumer pulls back 20%?

---

## Output Format

```
### 🛍️ CONSUMER DISCRETIONARY SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLY: $X (±X%)
**vs 200-DMA**: [above/below by X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]
**XLY ex AMZN/TSLA**: [Independently trending up/down/in-line]

**Consumer Spending Signal**: [Retail sales + credit spending direction + gas price headwind]

**Sub-Sector Leaders/Laggards**:
- Auto: [Signal]
- Housing/Homebuilders: [30Y rate vs affordability]
- Travel/Leisure: [Demand holding/softening]
- E-Commerce: [AMZN signal]

**Key Risk**: Oil at $112 → Gas prices → [estimated weekly drag on household discretionary budget]

**Earnings/Catalyst**: [Any near-term names or guidance]

**Regime Fit**: [In inflation + geopolitical shock regime, discretionary is a headwind — confirm or contradict]

**XLY/XLP Ratio**: [Risk appetite read from this ratio]
```

---

## Memory Update
After analysis, append to `memory/sectors/consumer/ROLLING.md` (shared with staples):
- One on XLY relative performance vs SPY
- One on consumer spending trajectory signal
- One on whether the XLY/XLP ratio indicates risk appetite shift
