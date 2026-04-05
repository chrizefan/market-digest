---
name: market-macro
description: Run global macro analysis as part of the daily digest. Covers economic data, central bank policy, geopolitics, and the cross-asset macro regime. Always run this FIRST before other segments.
---

# Macro Analysis Skill

## Inputs
- `config/watchlist.md` (macro section)
- `config/preferences.md`
- `memory/macro/ROLLING.md`

## Research Steps

### 1. Overnight & Pre-Market Summary
- What happened globally while the user's market was closed?
- Any major data, political events, central bank actions, or geopolitical developments overnight?
- How are US equity futures positioned heading into the open?

### 2. Economic Calendar — Today
Search for today's scheduled economic releases:
- US: CPI, PPI, PCE, NFP, ISM, GDP, retail sales, jobless claims, housing data — whichever are due today
- Eurozone / UK / Japan / China: any major prints
- Time of release and consensus estimate vs. prior
- If already released: actual vs. estimate and immediate market reaction

### 3. Economic Calendar — This Week
- Key data releases scheduled for the rest of the week
- Fed / ECB / BOJ / BOE meetings or speeches
- Treasury auction schedule (can move yields)
- Any major geopolitical events or elections

### 4. Central Bank Watch
- Fed: recent rhetoric, any speeches today, meeting proximity
- ECB: rate path, recent guidance
- BOJ: yen policy, any intervention risk
- BOE: UK-specific macro stress
- PBoC: China stimulus signals

### 5. Macro Regime Assessment
Classify the current macro regime:
- **Growth**: Expanding / Slowing / Contracting
- **Inflation**: Hot / Cooling / Cold
- **Policy**: Tightening / Neutral / Easing
- **Risk appetite**: Risk-on / Risk-off / Mixed

This 4-factor framework shapes every other segment's bias.

### 6. Geopolitical & Structural Risks
- Any active geopolitical risks impacting markets (conflict, sanctions, trade policy, elections)?
- Any structural market risks (liquidity concerns, regulatory changes, systemic stress)?

## Output Format

```
### 🌍 MACRO
**Regime**: Growth: [X] | Inflation: [X] | Policy: [X] | Risk appetite: [X]

**Overnight**: [Key overnight developments in 2-3 sentences]

**Today's Data**: [Releases, consensus vs actual if available, market reaction]

**This Week**: [Upcoming key events and dates]

**Central Banks**: [Fed stance | ECB | BOJ | Notable divergences]

**Geopolitical**: [Active risks, if any]

**Macro Implication**: [How the current regime should bias positioning across asset classes]
```

## Memory Update
After completing analysis, produce 3-4 bullets for `memory/macro/ROLLING.md`:
- One on the macro regime classification
- One on the most important data point or event
- One on central bank trajectory
- One on any regime shift or new risk emerging
