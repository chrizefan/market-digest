---
name: sector-real-estate
description: Deep-dive analysis of the Real Estate sector (XLRE, VNQ). Covers equity REITs across sub-types: industrial, retail, office, residential, data center, healthcare, and specialty. Highly rate-sensitive. Run as part of the US Equities phase in the daily orchestrator.
---

# Real Estate Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLRE, VNQ and related)
- `config/preferences.md`
- `memory/sectors/real-estate/ROLLING.md`
- Bonds output from current session (10Y yield is the primary pricing factor)
- Macro regime output

---

## Research Steps

### 1. Sector ETF Overview
- **XLRE** (Real Estate Select SPDR): price, % change, vs 50-DMA and 200-DMA
- **VNQ** (Vanguard Real Estate ETF): broader REIT universe
- XLRE vs SPY relative strength: REITs typically underperform in rising rate environments
- Key names: PLD, AMT, EQIX, CCI, DLR, PSA, WELL, EQR — contributions

### 2. Interest Rate Sensitivity Analysis (Primary Driver)
- REITs are priced like long-duration bonds — rising yields = REIT price compression
- Current 10Y vs XLRE implied cap rate: is the spread attractive?
- The "spread": REIT dividend yield minus 10Y treasury. If this spread is thin, REITs are expensive
- Cap rate compression: as rates rise, cap rates must rise too → commercial property prices fall
- At current 10Y X%: what is XLRE's implied cap rate spread? Is it positive or negative?

### 3. REIT Sub-Type Analysis

**Industrial REITs (PLD, STAG)** — e-commerce warehousing
- E-commerce fulfillment demand: stable or decelerating?
- Supply: new warehouse construction completions
- PLD occupancy and rent growth guidance

**Data Center REITs (EQIX, DLR)** — AI infrastructure play
- Hyperscaler lease demand explosion driven by AI training
- Power availability as a constraint on data center development
- Leasing backlog: any guidance updates from EQIX or DLR quarterly calls
- This is one of the few REIT sub-types immune to rate pressure currently

**Cell Towers (AMT, CCI)** — wireless infrastructure
- 5G buildout status: is carrier capex cycling down?
- Tenant lease-up and churn rates
- International tower exposure: CCI US only; AMT has EM exposure

**Healthcare REITs (WELL, VTR)** — senior housing, hospitals
- Occupancy recovery from post-COVID trough
- Senior housing supply/demand: baby boomers aging into senior care
- Operator health: are healthcare REIT tenants financially stable?

**Office REITs** — structural headwind
- Remote work has structurally impaired office demand
- Class A vs Class B divergence: flight to quality in leasing
- Office vacancy rates in major markets (NYC, SF, Chicago)
- CRE debt maturity wall: estimate amounts refinancing in 2025-2026

**Residential REITs (EQR, AVB, INVH)** — apartments
- Rent growth: new lease vs renewal spread
- Supply: apartment completions peak 2024-2025 creating headwinds
- Single-family rental: any news on INVH or AMH

**Self-Storage (PSA, EXR)** — counter-cyclical defensive
- Occupancy and rental rate trends
- Impact of housing market freeze on self-storage demand

### 4. Commercial Real Estate (CRE) Stress Monitor
- CRE debt maturity wall: outstanding problem or being resolved?
- Bank exposure: which banks have concentrated CRE exposure (from financials output)?
- CMBS spreads: Trepp data on delinquencies in commercial mortgage-backed securities
- Any notable large property defaults or distressed sales

### 5. Housing Market Interface
- Residential REITs vs homebuilders: are people renting longer because they can't afford to buy?
- 30Y mortgage rate vs apartment rent → affordability calculus driving renter demand

### 6. Valuation Context
- XLRE NTM FFO multiple (not P/E — use Funds From Operations)
- Implied cap rate vs historical
- XLRE dividend yield vs 10Y treasury spread

---

## Output Format

```
### 🏢 REAL ESTATE SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLRE: $X (±X%) | VNQ: $X (±X%)
**vs 200-DMA**: XLRE [above/below X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming]

**Rate Sensitivity**: 10Y X% | XLRE div yield X% | Spread: Xbps
[Is the income premium adequate? Cheap/fair/expensive relative to treasuries]

**Sub-Type Leaders/Laggards**:
- Data Centers (EQIX/DLR): [AI demand status] → bias: [positive]
- Industrial (PLD): [e-commerce demand] → [direction]
- Residential: [Rent growth trend]
- Office: [structural headwind status — noting any improvement/worsening]
- CRE Stress: [Any notable distress or maturity wall concern]

**CRE Risk Monitor**: [Any systemic or bank-related CRE risk signal today]

**Valuation**: XLRE ~X× FFO | Div yield Xbps spread vs treasuries | [Cheap/fair/expensive]

**Regime Fit**: [Rising rates / inflation regime = REIT headwind. Is this confirmed today?]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/real-estate/ROLLING.md`:
- One on the 10Y vs REIT yield spread (primary valuation anchor)
- One on data center REIT demand vs AI buildout (key structural tailwind)
- One on CRE stress or office vacancy signal
