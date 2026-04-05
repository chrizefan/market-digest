---
name: sector-industrials
description: Deep-dive analysis of the Industrials sector (XLI, ITA). Covers aerospace/defense, transportation, infrastructure, machinery, and commercial services. Strong correlation to PMI and economic cycle. Run as part of the US Equities phase in the daily orchestrator.
---

# Industrials Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLI, ITA and related ETFs)
- `config/preferences.md`
- `memory/sectors/industrials/ROLLING.md`
- Macro regime output from `macro.md`

---

## Research Steps

### 1. Sector ETF Overview
- **XLI** (Industrial Select SPDR): price, % change, vs 50-DMA and 200-DMA
- **ITA** (iShares US Aerospace & Defense): price, % change — defense is a dominant sub-sector driver in 2026 given geopolitical backdrop
- XLI vs SPY relative strength
- Sub-sector leadership: is it A&D pulling XLI or broad industrial activity?

### 2. Manufacturing & PMI Correlation
- S&P Global / ISM Manufacturing PMI: current level (>50 = expansion, <50 = contraction)
- Services PMI for context
- **PMI new orders sub-component**: the most forward-looking indicator for industrials
- Factory orders, capital goods orders (ex-aircraft, ex-defense) — latest monthly data
- Industrial production index direction
- Capacity utilization rate

### 3. Aerospace & Defense (A&D) Deep Scan
- **Iran War context**: defense spending surge globally is a major tailwind for ITA
- LMT, RTX, NOC, GD, BA — any news, guidance, or contract wins
- NATO allies' defense spending commitments (% of GDP target updates)
- US defense budget and supplemental appropriations
- Ukrainian war resupply backlogs benefiting Western defense OEMs
- Backlog-to-revenue ratios: are A&D companies growing backlogs faster than revenue?
- ITA vs XLI divergence: if ITA outperforms, it's geopolitical risk-on for defense; if XLI excluding A&D lags, industrial economy may be soft

### 4. Transportation Sub-Sector
- Airlines (JETS ETF): fuel cost headwind at $112 WTI — airlines are key victim of high oil
- Trucking/Logistics (IYT): freight volume and rates, spot vs contract pricing
- Railroads: coal + commodity volumes, precision railroading efficiency
- Airlines at WTI $112 burn roughly 3-4% more on fuel per mile — is this priced in?

### 5. Infrastructure & Capital Spend
- US infrastructure investment: IRA and CHIPS Act spending channels
- Data center construction (driven by AI — benefits electrical infrastructure, HVAC, construction equipment)
- Utilities capex for grid buildout overlapping with industrials supply chain
- Machinery: Caterpillar as global construction/mining demand proxy

### 6. Earnings & Catalysts
- Any industrial names reporting this week?
- Recent guidance from bellwethers (CAT, HON, GE, UPS, FDX, BA)?
- Government contracts or procurement news
- Any supply chain disruption or input cost update

### 7. Valuation Context
- XLI NTM P/E vs historical average
- ITA valuation: A&D usually gets re-rated during geopolitical crises (premium expansion)
- Is the defense premium pricing in multi-year spending increases or just 1-2 year boost?

---

## Output Format

```
### 🏭 INDUSTRIALS SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLI: $X (±X%) | ITA: $X (±X%)
**vs 200-DMA**: XLI [above/below X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]

**PMI Read**: Manufacturing PMI: X | New Orders: X | [Expansion/contraction signal]

**A&D Signal (ITA)**: [Defense spending tailwind + any contract/procurement news]
- Iran War defense budget implication: [any new spending authorization?]
- Backlog status at major primes (LMT/RTX/NOC): [comment]

**Transportation Read**: Airlines [oil headwind severity] | Freight [volume signal]

**Infrastructure Spend**: [IRA/CHIPS/AI buildout capex benefiting industrials]

**Earnings/Catalyst**: [Near-term names + guidance direction]

**Valuation**: XLI P/E ~Xx | ITA re-rating context: [geopolitical premium comment]

**Regime Fit**: [PMI + defense spend = industrial tailwind or headwind in current regime?]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/industrials/ROLLING.md`:
- One on PMI / manufacturing activity signal
- One on A&D geopolitical tailwind status (ITA thesis)
- One on transportation fuel cost headwind or freight volume signal
