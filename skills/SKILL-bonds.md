---
name: market-bonds
description: Run bond market and interest rates analysis as part of the daily digest. Covers Treasury yields, yield curve, credit spreads, Fed expectations, and bond ETFs.
---

# Bonds & Rates Analysis Skill

## Inputs
- `config/watchlist.md` (bonds section)
- `config/preferences.md`
- `memory/bonds/ROLLING.md`

## Research Steps

### 1. Treasury Yields
- Current levels for: 2Y, 5Y, 10Y, 30Y
- Daily change in bps for each
- Are yields rising or falling? What's the catalyst?
- Which part of the curve is moving most?

### 2. Yield Curve Shape
- 2s10s spread: inverted / flat / steepening / normalized?
- Is the curve steepening or flattening? (bull or bear steepener/flattener?)
- Historical context: how does the current spread compare to recent weeks?
- What does the curve shape imply for recession risk / growth expectations?

### 3. Fed Watch
- Current Fed Funds Rate
- CME FedWatch: next meeting probabilities (cut / hold / hike)
- Any recent Fed speaker commentary
- Next FOMC date and whether it's a "live" meeting
- Where is the market pricing the terminal rate?

### 4. Credit Markets
- HYG (high yield) and LQD (investment grade) — price and spread direction
- HY OAS (option-adjusted spread) — tightening or widening?
- Spread direction implies: risk-on (tightening) or risk-off (widening)

### 5. Inflation Expectations
- TIP ETF direction
- 5Y5Y breakeven inflation rate (if available)
- 10Y real yield (nominal minus breakeven)
- Any recent inflation data or upcoming prints

### 6. Watched ETFs
- TLT, IEF: price action and trend
- MOVE index (bond market volatility)

## Output Format

```
### 🏦 BONDS & RATES
**Bias**: [Bullish bonds (yields falling) / Bearish bonds (yields rising) / Neutral / Conflicted]

**Yields**: [2Y: X% | 10Y: X% | 30Y: X% | Daily Δ: ...]
**Curve**: [2s10s: Xbps | Shape: steepening/flattening/inverted | Implication: ...]

**Fed**: [Funds rate: X% | Next meeting: date | Market pricing: X% cut prob]

**Credit**: [HY spreads: tightening/widening | Signal: risk-on/off]

**Inflation**: [Real yield: X% | Breakevens: direction]

**TLT / IEF**: [Price, trend, key level]

**Watch**: [Upcoming data release or Fed speak that could move rates]
```

## Memory Update
After completing analysis, produce 3-4 bullets for `memory/bonds/ROLLING.md`:
- One on yield direction and trend
- One on curve shape evolution
- One on Fed expectations vs. prior session
- One on credit spread direction (risk signal)
