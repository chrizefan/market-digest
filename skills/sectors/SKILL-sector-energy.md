---
name: sector-energy
description: Deep-dive analysis of the Energy sector (XLE, OIH, FCG, DBO). Covers upstream E&P, integrated majors, oil services, refining, and LNG. Integrates WTI/Brent from commodities output. Run as part of the US Equities phase in the daily orchestrator.
---

# Energy Sector Sub-Agent

## Inputs
- `config/watchlist.md` (energy ETFs: XLE, DBO, OIH)
- `config/preferences.md` (XLE and DBO are active portfolio holdings)
- `memory/sectors/energy/ROLLING.md`
- `memory/commodities/ROLLING.md`
- Macro regime output from `macro.md`
- Commodities output (WTI/Brent levels already established)

---

## Research Steps

### 1. Sector ETF Overview
- **XLE** (Energy Select SPDR): price, % change, vs 50-DMA and 200-DMA
- **OIH** (VanEck Oil Services ETF): price, % change — services leads majors at cycle peaks/troughs
- **FCG** (Natural Gas): price and direction
- **DBO** (DB Oil Fund): commodity-linked, roll yield context
- XLE vs SPY relative strength: the **only sector positive YTD 2026** — is leadership maintaining?

### 2. WTI/Brent Integration
Using commodity output (or re-search if needed):
- WTI: current price vs $100/$110/$120 key psychological levels
- Brent: WTI/Brent spread (geopolitical premium indicator)
- Is energy stock move congruent with oil price move? (divergence = possible mean-reversion signal)
- DBO roll yield: is backwardation (positive roll) or contango (negative roll) in effect?

### 3. Upstream / E&P Analysis
- Major E&P names (CVX, XOM, COP, EOG weight in XLE): production guidance, hedging programs
- Shale breakevens: current WTI vs average US shale breakeven ($55-65/bbl range)
- **Profit margin signal**: at WTI $112, most US E&P is printing very high free cash flow
- Buyback / dividend trends in energy majors — is cash return accelerating?
- CapEx discipline: are majors reinvesting more or maintaining capital discipline?

### 4. Geopolitical Supply Risk (Critical in Current Regime)
- Iran War / Strait of Hormuz: latest status — is disruption risk escalating or de-escalating?
- OPEC+ compliance and production decisions
- Libya, Venezuela, Nigeria supply outages
- Russian export volumes under sanctions
- US Strategic Petroleum Reserve: any release news?
- Is geopolitical premium baked in or still building?

### 5. Natural Gas & LNG
- Henry Hub price and direction
- European natgas (TTF) — any supply disruption signal
- LNG export capacity utilization
- US winter/summer demand seasonal context

### 6. Oil Services (OIH)
- Baker Hughes rig count (US and international) — published weekly Fridays
- Offshore drilling rates: any acceleration?
- Services pricing power: are companies like SLB/HAL/BKR raising prices?
- Services typically outperforms in mid-to-late cycle energy bull markets

### 7. Valuation Context
- XLE NTM P/E — energy tends to trade at discount to SPX; current level vs history
- EV/EBITDA for the sector at current oil prices
- FCF yield: at $112 WTI, major oil FCF yield is exceptional — is market giving credit?
- Refining margins (crack spreads): XLE contains refiner exposure

### 8. Portfolio Assessment
- XLE (12%) + DBO (5%) = 17% combined energy exposure
- Thesis check: Iran War = structural oil bid (longer-dated, not just a spike)
- At WTI $112: take profits vs hold for $130+ scenario?
- Invalidation trigger: WTI close below $80 for 3 consecutive days (active threshold)

---

## Output Format

```
### ⚡ ENERGY SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLE: $X (±X%) | OIH: $X (±X%) | DBO: $X (±X%)
**vs 200-DMA**: XLE [above/below by X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming — sector leadership status]

**WTI Integration**: $X — [at what price level context; backwardation/contango in DBO]
**Equity/Oil Congruence**: [Are stocks tracking oil or diverging?]

**Geopolitical Supply Premium**: [Current risk assessment — Iran/Hormuz status]
- OPEC+: [compliance/production signal]
- Any other outage or supply disruption

**E&P Free Cash Flow**: [At current WTI, profit/FCF read for XLE names]

**Oil Services (OIH)**: [Rig count trend | services pricing | cycle timing]

**NatGas**: Henry Hub $X | [Direction + European LNG context]

**Valuation**: XLE NTM P/E ~Xx | FCF yield estimate: [X%] at current WTI

**Portfolio Note**: XLE + DBO thesis [✅ Confirmed / ⚠️ Monitor / ❌ Challenged]
- Invalidation trigger status: WTI $80 floor [active/triggered?]
- Profit-taking consideration: [yes/no + rationale]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/energy/ROLLING.md`:
- One on XLE relative performance and whether sector leadership is holding
- One on geopolitical supply risk status (Iran/OPEC+ development)
- One on portfolio thesis status at current oil price level
