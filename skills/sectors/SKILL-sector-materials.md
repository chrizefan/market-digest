---
name: sector-materials
description: Deep-dive analysis of the Materials sector (XLB). Covers chemicals, metals & mining, paper/packaging, and construction materials. China demand, DXY, and commodity cycles are primary drivers. Run as part of the US Equities phase in the daily orchestrator.
---

# Materials Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLB and commodity-linked ETFs)
- `config/preferences.md`
- `memory/sectors/materials/ROLLING.md`
- Commodities output (copper, gold from current session)
- Macro regime + international/China output

---

## Research Steps

### 1. Sector ETF Overview
- **XLB** (Materials Select SPDR): price, % change, vs 50-DMA and 200-DMA
- XLB vs SPY relative strength
- Key names: LIN, APD, SHW, FCX, NEM, NUE, DD — weight and movement
- Is materials outperforming with commodities (expected in commodity bull) or lagging (suggests sector is already priced)?

### 2. Metals & Mining Sub-Sector
- **Copper**: price and % change — search if not from commodities output
  - Dr. Copper signal: what does copper's price say about global industrial demand?
  - China copper imports: any data from customs
  - FCX (Freeport-McMoRan) as a proxy for copper equities
- **Gold miners vs gold bullion**: are NEM, GOLD, AEM tracking XAU spot or diverging?
  - Gold miners tend to be leveraged plays on gold price; if gold is at ATH but miners lag → capital rotation opportunity
- **Steel**: NUE, STLD — US producer protection via tariffs; any trade action news
- **Aluminum**: CENX — tariff and Chinese oversupply dynamics

### 3. Chemicals Sub-Sector
- **LIN, APD** (industrial gases): GDP-correlated, defensive within materials
- **Specialty chemicals** (DOW, DD, CE): cyclical, PMI-correlated
- **Fertilizers** (CF, MOS, NTR): agricultural commodity cycle, potash supply from Russia/Belarus sanctions
- **Lithium** (SQM, ALB): EV battery cycle + lithium price collapse — is the bottom in?
- **Titanium/rare earths**: any supply disruption driven by China export controls (key risk for 2026)

### 4. China Demand Signal (Critical)
- China is the largest consumer of most base metals
- PBOC stimulus signals: any new support measures?
- Chinese real estate: is construction activity stabilizing?
- NBS China PMI: latest reading (especially manufacturing component)
- Iron ore price (Australian export): China steel demand proxy
- Any rare earth or critical mineral export restrictions by China?

### 5. Supply Chain & Geopolitical Signals
- Critical minerals: China controls 60-80% of processing for many materials
- Iran War effects: any disruption to metal shipping through Middle East sea lanes?
- Tariffs: any material-specific tariffs being imposed or threatened?
- Russian metals (aluminum, palladium, nickel): sanctions status

### 6. Currency Effect (DXY)
- Commodity-linked materials move inversely with USD
- If DXY is strengthening: headwind for materials names with international sales
- If DXY weakening: tailwind for commodity prices → higher materials revenues

### 7. Valuation Context
- XLB NTM P/E vs historical average
- Gold miners EV/EBITDA at current gold price — compelling or priced in?
- FCX valuation at current copper price

---

## Output Format

```
### ⛏️ MATERIALS SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLB: $X (±X%)
**vs 200-DMA**: [above/below X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming]

**Metals & Mining**:
- Copper ($X): [Growth signal + China demand context]
- Gold Miners vs Gold Bullion: [Are miners tracking ATH gold or lagging?]
- Steel/Aluminum: [Any tariff or demand signal]

**China Demand**: [PBOC/PMI/iron ore signal for base metals demand]

**Chemicals**: [LIN/APD defensive read | Specialty cycle | Lithium/EV status]

**Rare Earth / Critical Minerals**: [Any China export restrictions or supply disruption]

**DXY Effect**: [Currency impact on materials sector revenue]

**Valuation**: XLB P/E ~Xx | Gold miner EV/EBITDA at $4,686 gold: [attractive/expensive]

**Key Risk**: [China slowdown / DXY strength / tariff tit-for-tat]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/materials/ROLLING.md`:
- One on copper's growth signal and China demand
- One on gold miners vs bullion divergence (or convergence)
- One on any critical mineral or China supply chain development
