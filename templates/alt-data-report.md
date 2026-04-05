# Alternative Data Report — Template

**Date**: {{DATE}}
**Phase**: Phase 1 (Alternative Data — runs FIRST, before macro)

---

## 1A. Sentiment & News Dashboard

**CNN Fear & Greed Index**: X/100 — [Extreme Fear/Fear/Neutral/Greed/Extreme Greed]
**Crypto Fear & Greed**: X/100 — [Extreme Fear/Fear/Neutral/Greed/Extreme Greed]
**AAII Bullish %**: X% (>55% = contrarian bearish; <30% = contrarian bullish)

### X/Twitter KOL Consensus
> [1-2 paragraph summary of dominant narrative from tracked accounts. What is the crowd thinking? Any contrarian signals?]

**KOL Consensus**: Bullish / Bearish / Mixed / Divided

### Polymarket Key Odds
| Question | Current % | Change vs Prior | Implication |
|----------|-----------|-----------------|-------------|
| Fed cuts in 2025? | X% | ±X% | [Bull/Bear for risk] |
| US Recession (12mo) | X% | ±X% | [Macro signal] |
| Iran military escalation | X% | ±X% | [Oil/energy signal] |
| BTC >$100K by EOY | X% | ±X% | [Crypto signal] |

**Sentiment Summary Signal**: Risk-on / Risk-off / Mixed

---

## 1B. CTA & Systematic Positioning

*Source: CFTC Commitments of Traders (latest weekly report, released Friday)*

| Asset | Non-Comm Net | Change (WoW) | Crowding Status |
|-------|-------------|--------------|-----------------|
| S&P 500 E-mini | +X,XXX | ±X,XXX | Low / Moderate / High / Extreme |
| 10Y Treasury | +X,XXX | ±X,XXX | Low / Moderate / High / Extreme |
| Gold | +X,XXX | ±X,XXX | Low / Moderate / High / Extreme |
| WTI Crude | +X,XXX | ±X,XXX | Low / Moderate / High / Extreme |
| EUR/USD | +X,XXX | ±X,XXX | Low / Moderate / High / Extreme |
| BTC | +X,XXX | ±X,XXX | Low / Moderate / High / Extreme |

**CTA Direction Signal**: Long Risk / Short Risk / Hedged / Neutral
**Crowding Risk**: [Is any position extreme enough to risk forced unwind?]
**Vol-target / Risk Parity**: [Are systematics currently adding or reducing exposure given vol regime?]

---

## 1C. Options & Derivatives

**VIX**: X.XX | Term structure: [Contango / backwardation — front-month vs 3-month]
**SKEW Index**: XXX | [Normal <130 / Elevated 130-145 / High >145 — tail risk demand]
**P/C Ratio (Equity)**: X.XX | [Bearish >1.0 / Neutral 0.7-1.0 / Bullish <0.7]
**P/C Ratio (Index)**: X.XX | [Hedging demand barometer]
**GEX (Dealer Gamma)**: [+$Xbn / -$Xbn] — [Positive = dampening / Negative = amplifying moves]

**Unusual Options Activity**:
- [Top 1-2 notable options trades: ticker, strike, size, direction, interpretation]

**Options Signal Summary**: [What does the derivatives market imply about risk appetite?]

---

## 1D. Politician & Policy Signals

### STOCK Act Disclosures (Past 7 Days)
| Politician | Trade | Asset | Date Filed | Interpretation |
|------------|-------|-------|------------|---------------|
| [Name] | Buy/Sell | [Ticker] | [Date] | [Signal] |

**Congress Trade Signal**: [Any cluster supporting a theme? Any notable large trade?]

### Fed/Treasury/Policy Statements
- **Fed**: [Any Fed speakers today? Hawkish / Dovish / Neutral? Key quote if available]
- **Treasury**: [Yellen/Bessent/Treasury statements affecting rates or dollar]
- **SecState/NSA**: [Any foreign policy statement with market implications]
- **Iran Escalation Signal**: [Any official escalation/de-escalation statement]

**Policy Signal Summary**: [Hawkish/Dovish/Geopolitical escalation/De-escalation]

---

## Alternative Data Composite Signal

| Signal | Direction | Strength | Notes |
|--------|-----------|----------|-------|
| Sentiment (KOL+Fear&Greed) | 🟢/🔴/🟡 | H/M/L | |
| CTA Positioning | 🟢/🔴/🟡 | H/M/L | |
| Options Flow | 🟢/🔴/🟡 | H/M/L | |
| Politician Signals | 🟢/🔴/🟡 | H/M/L | |

**Alt Data Composite**: Risk-on / Risk-off / Mixed — [1-sentence synthesis]
> [This composite signal primes macro and downstream analysis. Does it confirm or contradict price action?]

---

## Memory Updates

*Append to respective ROLLING.md files:*

`memory/alternative-data/sentiment/ROLLING.md`:
```
## {{DATE}}
- CNN F&G: X | AAII Bull: X% | Signal: [risk-on/off/mixed]
- KOL consensus: [theme]
- Polymarket key odds: [most actionable change]
```

`memory/alternative-data/cta-positioning/ROLLING.md`:
```
## {{DATE}}
- CTA direction: [long/short/mixed]
- Most crowded position: [asset, net contracts]
- Any forced unwind risk: [yes/no — which asset]
```

`memory/alternative-data/options/ROLLING.md`:
```
## {{DATE}}
- VIX: X.XX | Term structure: [contango/backwardation]
- GEX: [+/-$Xbn] — [dampening/amplifying]
- Notable unusual activity: [ticker + trade summary]
```

`memory/alternative-data/politician/ROLLING.md`:
```
## {{DATE}}
- STOCK Act: [any notable trade]
- Fed/Policy signal: [hawkish/dovish/neutral + key quote]
- Geopolitical official statement: [if any]
```
