# Bias Tracker (v2)

> This file tracks the daily directional bias per segment over time.
> Claude appends one row per day at the end of each digest session (Phase 6).
> Use this to spot regime persistence, inflection points, and drift.
> **v2**: Expanded columns include institutional, options, CTA, hedge fund, politician, and Polymarket signals.

---

## Bias Key
- 🟢 Bullish / Risk-on / Accumulation
- 🔴 Bearish / Risk-off / Distribution
- 🟡 Neutral / Mixed / No signal
- 🟠 Conflicted (evidence clearly divided both ways)

---

## Daily Bias Log

| Date | Macro Regime | Equities | Crypto | Bonds | Commodities | Forex (DXY) | VIX | Inst. Flow | Options Sent. | CTA Dir. | HF Consensus | Poly. Fed Cut % | Notes |
|------|-------------|----------|--------|-------|-------------|-------------|-----|-----------|--------------|----------|-------------|----------------|-------|
| 2026-04-05 | 🟠 Transitional | 🟠 Conflicted | 🟡 Neutral | 🔴 Bearish | 🟢 Bullish | 🟡 Neutral | 23.87 | N/A | N/A | N/A | N/A | N/A | Easter Sunday. Markets closed. Iran War dominant. NFP +178K released to closed markets (Mon gap risk). Gold ATH $4,686. Oil $112. BTC $67K Fear=30. |

---

## Column Definitions

| Column | What It Measures | Source |
|--------|-----------------|--------|
| **Macro Regime** | Growth+Inflation+Policy classification | SKILL-macro.md Phase 3 |
| **Equities** | S&P 500 / broad market bias | SKILL-equity.md Phase 5A |
| **Crypto** | BTC/crypto complex bias | SKILL-crypto.md Phase 4D |
| **Bonds** | Duration / rate direction | SKILL-bonds.md Phase 4A |
| **Commodities** | Energy+metals composite | SKILL-commodities.md Phase 4B |
| **Forex (DXY)** | Dollar direction | SKILL-forex.md Phase 4C |
| **VIX** | Spot VIX level (number) | SKILL-options-derivatives.md Phase 1C |
| **Inst. Flow** | Smart money direction: Accum/Distrib/Mixed | SKILL-institutional-flows.md Phase 2A |
| **Options Sent.** | Derivatives sentiment: Calm/Hedging/Fear | SKILL-options-derivatives.md Phase 1C |
| **CTA Dir.** | Systematic trader direction: Long/Short/Hedged | SKILL-cta-positioning.md Phase 1B |
| **HF Consensus** | Hedge fund positioning bias | SKILL-hedge-fund-intel.md Phase 2E |
| **Poly. Fed Cut %** | Polymarket odds of next Fed cut (number %) | SKILL-sentiment-news.md Phase 1A |
| **Notes** | Key events, levels, or regime drivers for the day | All phases |

---

## How to Read Patterns

**Regime persistence**: 3+ consecutive days of same bias = trend in place
**Conflicted signals**: Multiple 🟠 across segments = choppy, reduce size
**Divergence**: Equities 🟢 + Bonds 🔴 = growth trade; Equities 🔴 + Bonds 🟢 = flight to safety
**Risk-off cluster**: Equities 🔴 + Crypto 🔴 + Commodities 🔴 + DXY 🟢 = broad risk-off
**Inflation trade**: Commodities 🟢 + Bonds 🔴 + DXY mixed = inflation regime
**Smart money divergence**: Inst. Flow 🟢 + Equities 🔴 = smart money buying the dip
**CTA unwind risk**: CTA Dir = Long + VIX spike → forced systematic de-risking incoming
**HF vs Inst. split**: HF 🔴 + Inst. 🟢 = disagreement between LS equity funds and passive flows

**Current pattern (April 5)**: Commodities 🟢 + Bonds 🔴 + DXY 🟡 = Inflation/Geopolitical Shock regime. Equities 🟠 (NFP beat = potential positive catalyst, but war overhang). Crypto 🟡 (stabilizing from extreme fear). This is the inflation trade pattern with a geopolitical overlay.
