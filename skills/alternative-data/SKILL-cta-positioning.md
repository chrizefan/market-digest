---
name: alt-data-cta-positioning
description: Analyzes CFTC Commitments of Traders (COT) data and systematic/CTA fund positioning across major futures contracts. Tracks speculative net positioning in S&P 500, Treasuries, gold, WTI, EUR/USD, and BTC. Runs early in pipeline to reveal systematic crowding risks.
---

# CTA & Systematic Positioning Sub-Agent

## Purpose
CTAs (Commodity Trading Advisors) and systematic funds move markets mechanically when trends break. Their crowding creates explosive reversals. This skill quantifies their current positioning so we can anticipate forced de-risking or momentum chasing. Run before macro and segment analysis.

## Inputs
- `config/data-sources.md` (CFTC, Finviz futures positioning, Sentimentrader)
- `memory/alternative-data/cta-positioning/ROLLING.md`
- Previous session's CTA output for week-over-week comparison

---

## Research Steps

### 1. CFTC COT Report — Latest Release
The CFTC releases COT data every Friday for positions as of Tuesday. Search for the latest weekly report data:

#### S&P 500 Futures (CME: /ES)
- **Leveraged Funds** (CTAs/hedge funds): net long or net short? Position in contracts.
- **Asset Managers** (institutional investors): net long or short?
- Change from prior week: are levered funds increasing or reducing exposure?
- Extreme signal: if leveraged funds are record net short → historically bullish contrarian signal

#### 10-Year T-Note Futures (CME: /ZN)
- Leveraged Funds net position
- Asset Managers net position
- Position direction vs recent yield moves: are they positioned correctly or offside?

#### Gold Futures (COMEX: /GC)
- Managed Money (CTAs, HFs) net long/short in gold futures
- At $4,686 gold ATH: is speculative positioning overcrowded long? (Caution signal)
- Producer/merchant hedging vs speculative positioning split

#### WTI Crude Futures (NYMEX: /CL)
- Managed Money net position in WTI
- Is the speculative long stretched? (At $112, are longs crowded?)
- Producer hedging activity: are E&P companies locking in $100+ prices?

#### EUR/USD Futures (CME: /6E)
- Leveraged funds net position: long or short USD?
- Extreme short USD positioning = risk of dollar squeeze rally

#### Bitcoin CME Futures (/BTC)
- Leveraged funds net position
- Asset manager / institutional allocation changes
- Any notable shift since BTC ETF approvals?

### 2. CTA Trend-Following Signal Model
Based on COT positioning and price momentum:
- **S&P 500**: Are CTAs long (trend-following bulls) or short (trend-following bears)?
  - S&P 500 trend signal: if price is above 200-DMA = CTAs likely adding longs; below = covering or reversing
- **Gold**: CTA gold model — trending long with gold at ATH; flat reversal risk at extreme long?
- **Rates (10Y)**: CTA bonds — trend following with rates rising = short bonds; if Fed pivots, CTA forced covering
- **USD**: CTA dollar model — long or short USD trend?
- **Estimated CTA signal**: Based on price trends, estimate whether major CTAs are currently adding to or reducing positions

### 3. Systematic Crowding Risk Assessment
For each major position:
- Is the position **extreme** (top/bottom decile of historical range)? → Flag as crowding risk
- If price breaks trend: how much systematic de-risking (selling) could occur mechanically?
- Estimate: if SPX breaks 200-DMA, what is the estimated CTA selling flow in $ billions?

### 4. Risk Parity Exposure
- Risk parity funds (Bridgewater All-Weather, etc.) hold bonds + equities + commodities
- When correlations rise (all assets fall together), risk parity forces de-leveraging across all
- Current bond/equity correlation: positive (bad for risk parity) or negative (stable)?
- Is there risk parity stress signal currently?

### 5. Vol-Targeting Fund Positioning
- As VIX rises, vol-targeting funds mechanically reduce equity exposure
- At VIX 23.87 (current): are vol-targeters at a de-risk threshold?
- VIX spike scenario: if VIX goes to 30+, estimate additional equity selling from vol-targeting funds

### 6. Week-Over-Week Change Analysis
Compare to `memory/alternative-data/cta-positioning/ROLLING.md`:
- Which positions changed the most?
- Is positioning heading toward extremes (increasing risk) or unwinding (reducing risk)?
- Any reversal signals forming?

---

## Output Format

```
### 📊 CTA & SYSTEMATIC POSITIONING
**Net Signal**: [Overall systematic fund posture — Risk-On / Risk-Off / Neutral / Mixed]

**CFTC COT Summary (as of [Tuesday date]):**
| Instrument | Levered Funds | vs Prior Week | Extreme? | Crowding Risk |
|------------|--------------|---------------|----------|---------------|
| S&P 500 | [Net long/short Xk contracts] | [±Xk] | [Y/N] | [High/Med/Low] |
| 10Y T-Note | [Net long/short] | [±Xk] | [Y/N] | [rating] |
| Gold | [Net long Xk] | [±Xk] | [Overleveraged at ATH?] | [rating] |
| WTI Crude | [Net long Xk at $112] | [±Xk] | [Y/N] | [rating] |
| EUR/USD | [Net long/short USD] | [±Xk] | [Y/N] | [rating] |
| BTC | [Net long/short] | [±Xk] | [Y/N] | [rating] |

**CTA Trend Model (estimated current direction):**
- Equities: [Long / Short / Neutral — trend-following momentum signal]
- Bonds: [Short bonds = rates trending up / Long = rates falling]
- Gold: [Long — trend-following momentum | reversal risk if breaks $X]
- USD: [Long/Short dollar trend signal]

**Key Crowding Risks**:
1. [Most extreme position] — if [trigger], estimated $Xbn mechanistic selling
2. [Second risk]

**Risk Parity Signal**: [Correlation regime — stable or stress mode?]
**Vol-Targeting**: At VIX 23.87 — [still within range / near de-risk threshold]

**Implication for Portfolio**:
[How does CTA positioning affect our positions? Any positions where we're on the same side as crowded longs → fragile? Any positions where we're inverse to crowded shorts → tail support?]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/alternative-data/cta-positioning/ROLLING.md`:
- One on the most significant CTA net position and whether it's at an extreme
- One on the crowding risk assessment (where is the explosion risk if a trend breaks?)
- One on any week-over-week positioning shift that signals a regime change in systematic flows
