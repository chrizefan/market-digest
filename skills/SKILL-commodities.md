---
name: market-commodities
description: Run commodities analysis as part of the daily digest. Covers energy, metals, agriculture, and their cross-asset implications.
---

# Commodities Analysis Skill

## Inputs
- `config/watchlist.md` (commodities section)
- `config/preferences.md`
- `memory/commodities/ROLLING.md`

## Research Steps

### 1. Energy
- WTI Crude: price, 24h change, key technical levels
- Brent Crude: price and WTI/Brent spread
- Natural Gas: price and direction
- Catalysts: OPEC+ news, US inventory data (EIA report), geopolitical supply risk
- What is energy saying about growth expectations?

### 2. Precious Metals
- Gold (XAU/USD): price, 24h change, trend
- Silver (XAG/USD): price, gold/silver ratio
- What is gold's move signaling? (real yield direction, dollar, safe haven demand, inflation hedge)
- Any central bank buying data or ETF flow signals?

### 3. Copper & Industrial Metals
- Copper: price and direction
- Dr. Copper as a growth indicator — what is it saying?
- Any China demand signals from industrial metals?

### 4. Agriculture (if relevant)
- Wheat, corn, soybeans if any major move or relevant news
- Flag only if materially moving or relevant to inflation narrative

### 5. Commodity-Macro Cross
- DXY direction and its effect on commodity pricing (inverse relationship)
- Is commodity movement driven by supply or demand factors?
- Do commodities confirm or contradict the macro regime?

## Output Format

```
### 🛢️ COMMODITIES
**Bias**: [Bullish / Bearish / Neutral / Conflicted]

**Energy**: [WTI: $X (±X%) | Brent: $X | NatGas: $X | Driver: ...]
**Gold**: [$X (±X%) | Signal: safe haven / inflation hedge / real yield play]
**Silver**: [$X | Gold/Silver ratio: X]
**Copper**: [$X (±X%) | Growth signal: ...]

**Dollar Effect**: [DXY impact on commodities today]

**Watch**: [Key upcoming data or event — e.g. EIA inventory Wednesday]
```

## Memory Update
After completing analysis, produce 3-4 bullets for `memory/commodities/ROLLING.md`:
- One on energy trend and key driver
- One on gold signal and what it implies
- One on copper/industrial metals growth signal
- One on any notable divergence from expected patterns
