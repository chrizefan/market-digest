---
name: market-equity
description: Run equity market analysis as part of the daily digest. Covers US and international equities, sector rotation, index technicals, earnings, and watchlist movers.
---

# Equity Analysis Skill

## Inputs
- `config/watchlist.md` (equity section)
- `config/preferences.md`
- `memory/equity/ROLLING.md`

## Research Steps

### 1. Index Overview
Search for current levels and % change for:
- S&P 500 (SPY), NASDAQ 100 (QQQ), Russell 2000 (IWM), Dow (DIA)
- Note if any index is testing key technical levels (52-week high/low, major MA, prior resistance)

### 2. Sector Rotation
Check performance of all 11 S&P sectors (XLK, XLF, XLE, XLV, XLI, XLRE, XLU, XLY, XLP, XLB, XLC).
- Which sectors are leading and lagging TODAY?
- What does sector rotation imply about risk appetite? (e.g., XLU/XLP leading = defensive rotation)
- Is this consistent with recent rotation from ROLLING.md or a change?

### 3. Watchlist Movers
For each equity in the user's watchlist:
- Any notable % move today?
- Any news, earnings, analyst actions, or catalysts?
- Any approaching key technical levels?

### 4. Earnings Calendar
- What major earnings are reported today or after close?
- Any major earnings tomorrow pre-market?
- Note any earnings that could have sector-wide read-throughs

### 5. Technicals (Market-Wide)
- Is the broad market in an uptrend, downtrend, or consolidation?
- VIX level and direction (fear/complacency)
- Breadth: advancing vs declining issues, new highs vs new lows
- Any notable divergences (e.g., index at highs but breadth deteriorating)

### 6. International Equities
- Overnight performance in Europe (DAX, FTSE, CAC)
- Asia (Nikkei, Hang Seng, Shanghai)
- Any notable moves in EEM, FXI, EWJ from watchlist

## Output Format

```
### 📈 EQUITIES
**Bias**: [Bullish / Bearish / Neutral / Conflicted]

**Index Levels**: [SPY, QQQ, IWM — price, % change, key level notes]

**Sector Rotation**: [Leading: ... | Lagging: ... | Implication: ...]

**Watchlist Movers**: [Notable moves with brief reason]

**Earnings Today**: [Key names + reaction if available]

**Technical Read**: [Trend, VIX, breadth summary]

**International**: [Key overnight moves]

**Watch**: [1-2 things to monitor in next 24-48h]
```

## Memory Update
After completing analysis, produce 3-4 bullets for `memory/equity/ROLLING.md`:
- One on overall market direction/trend
- One on sector rotation theme
- One on any key watchlist development
- One on any thesis evolution
