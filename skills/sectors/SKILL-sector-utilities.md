---
name: sector-utilities
description: Deep-dive analysis of the Utilities sector (XLU). Covers regulated electric, water, gas distribution, and merchant power. Highly rate-sensitive bond-proxy sector. Run as part of the US Equities phase in the daily orchestrator.
---

# Utilities Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLU and related)
- `config/preferences.md`
- `memory/sectors/utilities/ROLLING.md`
- Bonds output from current session (10Y yield is the primary driver)
- Macro regime output from `macro.md`

---

## Research Steps

### 1. Sector ETF Overview
- **XLU** (Utilities Select SPDR): price, % change, vs 50-DMA and 200-DMA
- XLU vs SPY relative strength: utilities typically underperform in rising rate / risk-on environments
- Key names: NEE, DUK, SO, AEP, EXC, SRE — any individual name divergence?
- XLU/TLT correlation: both are rate-sensitive; are they moving in tandem or diverging?

### 2. Rate Sensitivity Analysis (Primary Driver)
- **This is the dominant factor for XLU**: 10Y yield changes move utilities inversely
- Current 10Y yield vs XLU implied yield / dividend yield spread
- When 10Y yield = XLU dividend yield (~3%), the sector loses its income premium
- Current dividend yield on XLU: search for latest figure
- At current 10Y (reference bonds output): what's the spread between XLU yield and risk-free rate?
- Any expected rate moves (Fed cuts/hikes) that would reprice utilities?

### 3. AI / Data Center Power Demand Demand Theme
- This is the most important structural tailwind for utilities in 2025-2026
- AI data centers are enormous power consumers — utilities face massive load growth forecast
- Hyperscaler power purchase agreements (PPAs): Microsoft, Amazon, Google utility contracts
- Nuclear power renaissance: NRG, OKLO, SMR developers — any news
- Which XLU names have the highest data center / AI load growth exposure?
- Grid infrastructure investment: regulated utilities getting capex approved at favorable rates?

### 4. Grid Modernization & Regulation
- State utility commission rate case approvals: revenue certainty
- Federal grid resilience spending (IIJA funds still being deployed)
- Reliability standards (NERC) and extreme weather capex requirements
- Resource adequacy: are utilities building enough generation to meet peak demand growth?
- Offshore wind cancellations/delays: impact on renewable utilities

### 5. Renewable Energy Transition
- IRA clean energy tax credits: still flowing to utilities?
- Solar/wind buildout pace for regulated utilities
- Battery storage integration costs
- Nuclear: NRG, Constellation, NEE nuclear fleet — any license renewal or capacity expansion news

### 6. Natural Gas Utility Read
- Henry Hub and gas distribution utility margins
- LNG export competing for domestic gas supply — any price impact for distribution utilities
- Gas utility capex for network hardening and safety

### 7. Valuation Context
- XLU NTM P/E vs historical average (utilities typically trade 15-18x)
- EV/EBITDA for regulated utilities (8-12x is typical range)
- Dividend yield vs 10Y treasury spread: this is the key valuation metric
- When spread compresses to near zero, utilities are expensive; wide spread = value

---

## Output Format

```
### ⚡ UTILITIES SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLU: $X (±X%)
**vs 200-DMA**: [above/below by X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]

**Rate Sensitivity Read**:
- 10Y Yield: X% | XLU Div Yield: ~X% | Spread: Xbps
- [Spread interpretation — attractive/unattractive vs risk-free]
- [Rate direction implication for XLU: headwind/tailwind]

**AI Power Demand Theme**: [Data center load growth news + relevant utility names]

**Nuclear / Clean Energy**: [Any news on nuclear restart, SMR, or clean energy PPA]

**Regulation**: [Any rate case decision or capex approval news]

**Valuation**: XLU P/E ~Xx | Div spread vs 10Y: Xbps | [Cheap/fair/expensive vs history]

**Regime Fit**: [In rising rate / inflation regime, utilities are a headwind — is this confirmed today?]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/utilities/ROLLING.md`:
- One on XLU dividend yield spread vs 10Y treasury (the key valuation anchor)
- One on AI/data center power demand theme development
- One on rate sensitivity and whether utilities are overbought/oversold vs rate backdrop
