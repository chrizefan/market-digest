---
name: market-crypto
description: Run crypto market analysis as part of the daily digest. Covers BTC, ETH, major alts, on-chain signals, sentiment, and key levels.
---

# Crypto Analysis Skill

## Inputs
- `config/watchlist.md` (crypto section)
- `config/preferences.md`
- `memory/crypto/ROLLING.md`

## Research Steps

### 1. BTC & ETH Core Read
- Current price and 24h % change
- Distance from key levels: recent highs/lows, round numbers, prior support/resistance
- Volume: is volume confirming the move or diverging?
- Is BTC leading or lagging ETH? (ETH/BTC ratio direction)

### 2. Market Structure
- Total crypto market cap and 24h change
- Bitcoin dominance (BTC.D) — rising or falling? (implication for alt season)
- Fear & Greed Index level and trend
- Is the market in a bull/bear/consolidation phase structurally?

### 3. Watchlist Alts
For each alt in watchlist:
- Price, 24h change
- Any protocol news, upgrades, token events, listings, or liquidations
- Outperforming or underperforming BTC?

### 4. Sentiment & On-Chain (search for available signals)
- Funding rates on perpetuals (positive = longs paying, negative = shorts paying)
- Open interest direction
- Any major liquidation events in last 24h
- Exchange inflows/outflows if notable
- Social sentiment / trending narratives

### 5. Macro-Crypto Correlation
- Is crypto moving with or against equities / risk assets today?
- Any macro triggers driving crypto (Fed, dollar, risk-off)?
- ETF flows (BTC spot ETF) if data available

### 6. Key Narratives
- What are the dominant crypto narratives right now? (e.g., ETF flows, regulatory, L2s, AI tokens, RWA, etc.)
- Any breaking news in crypto space?

## Output Format

```
### 🪙 CRYPTO
**Bias**: [Bullish / Bearish / Neutral / Conflicted]

**BTC**: [$price | 24h: X% | Key level: ...]
**ETH**: [$price | 24h: X% | ETH/BTC: ...]

**Market Structure**: [Dominance, market cap, phase]

**Sentiment**: [Fear & Greed: X | Funding: ... | OI: ...]

**Watchlist Alts**: [Notable moves + catalyst if any]

**Macro Correlation**: [Correlated / Decorrelated + implication]

**Active Narratives**: [Top 1-2 themes]

**Watch**: [Key level or event to track]
```

## Memory Update
After completing analysis, produce 3-4 bullets for `memory/crypto/ROLLING.md`:
- One on BTC structure and trend
- One on sentiment/positioning
- One on dominant narrative
- One on any alt-specific development
