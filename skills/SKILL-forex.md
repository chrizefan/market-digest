---
name: market-forex
description: Run forex and currency analysis as part of the daily digest. Covers DXY, major pairs, carry trades, and FX as a risk sentiment signal.
---

# Forex Analysis Skill

## Inputs
- `config/watchlist.md` (forex section)
- `config/preferences.md`
- `memory/forex/ROLLING.md`

## Research Steps

### 1. US Dollar (DXY)
- DXY level and 24h change
- Is the dollar strengthening or weakening?
- Key technical level: is it above or below 200-day MA? Near recent highs/lows?
- Dollar direction is the master variable for commodities, EM equities, and risk assets

### 2. Major Pairs
For each pair in watchlist:
- EUR/USD: price, direction, key ECB/Fed divergence driver
- USD/JPY: level, any BOJ intervention risk, carry implications
- GBP/USD: UK macro, any political or data driver
- USD/CAD: oil correlation, any CAD-specific catalyst
- AUD/USD: China proxy, commodity currency

### 3. Risk Sentiment from FX
- AUD/USD and NZD/USD rising = risk-on signal
- USD/JPY rising without yen intervention = carry risk-on
- Safe haven demand: JPY, CHF appreciating = risk-off
- EM currencies: strengthening = global risk appetite
- Summarize: what is FX collectively saying about risk sentiment?

### 4. Carry Trade Watch
- Is the yen carry trade under stress? (rapid USD/JPY moves can cause cross-asset liquidation)
- Any sudden JPY strengthening that could ripple into equities/crypto?

### 5. Canadian Dollar (if relevant)
- USD/CAD level
- Oil correlation holding?
- Any Bank of Canada signals or Canada-specific macro events?

## Output Format

```
### 💱 FOREX
**DXY**: [Level (±X%) | Trend: strengthening/weakening | Key level: ...]

**Key Pairs**:
- EUR/USD: X.XXXX (±X%) | [driver]
- USD/JPY: XXX.XX (±X%) | [driver / intervention risk?]
- GBP/USD: X.XXXX (±X%) | [driver]
- USD/CAD: X.XXXX (±X%) | [oil/BoC driver]

**FX Risk Signal**: [Risk-on / Risk-off / Mixed — rationale]

**Carry Watch**: [Yen carry stable/stressed | implication for risk assets]

**Watch**: [Key FX event or level to monitor]
```

## Memory Update
After completing analysis, produce 3-4 bullets for `memory/forex/ROLLING.md`:
- One on DXY trend and implications
- One on the key FX risk sentiment signal
- One on any notable pair move or central bank divergence
- One on carry trade / yen stability
