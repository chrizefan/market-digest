---
name: alt-data-options-derivatives
description: Analyzes options market structure, volatility term structure, gamma exposure, put/call ratios, skew, and unusual options activity. Options markets are leading indicators — they often price in moves before they happen in the underlying. Run early in pipeline before macro and segment analysis.
---

# Options & Derivatives Intelligence Sub-Agent

## Purpose
Options markets reveal institutional hedging, speculative bets, and gamma dynamics that can force dealer hedging flows and cause accelerated price moves. This skill reads the options market as a forward-looking intelligence source. Run before segment analysis.

## Inputs
- `config/data-sources.md` (Unusual Whales, Fintel, CBOE data)

---

## Research Steps

### 1. Put/Call Ratio Analysis
Search for the latest P/C ratios:
- **CBOE Total P/C Ratio**: > 1.2 = extreme fear/hedging; < 0.7 = complacency
- **SPY Put/Call Ratio**: what is the ratio today?
- **QQQ Put/Call Ratio**: tech-specific hedging level
- **Equity-only P/C Ratio**: strips out index hedging for pure sentiment read
- Compare vs prior week and prior month
- Interpretation: rising P/C = increasing downside hedging = bearish sentiment; very high P/C = contrarian bullish (too many bears)

### 2. VIX Analysis — Volatility Complex
- **VIX Spot**: current level (was 23.87 on 2026-04-05)
- **VIX Interpretation**: <15=complacency; 15-20=moderate concern; 20-30=elevated fear; >30=panic
- **VIX Term Structure**:
  - VIX1M (1-month): spot reading
  - VIX3M: search for VIX3M or 3-month vol level
  - VIX6M (VIXM ETF proxy): longer-term vol expectation
  - Term structure in contango (1M < 3M) = normal; backwardation (1M > 3M) = acute stress
- **VIX/VVIX**: if VVIX (volatility of VIX) is rising, look for a Vol spike
- VIX direction: is it falling (de-risking complete) or rising (risk accumulating)?

### 3. SKEW Index
- **CBOE SKEW Index**: measures tail risk premium in SPX options
- SKEW > 135 = significant tail hedging activity (institutions protecting against crashes)
- SKEW < 120 = low tail risk concern
- Current SKEW vs prior weeks
- Divergence: if SKEW rises while VIX falls = hidden institutional caution behind apparent calm

### 4. Gamma Exposure (GEX) Analysis
Search for SPX/SPY gamma exposure from options market makers:
- **Positive GEX**: dealer is long gamma → buys dips, sells rallies → **dampens volatility, pins price**
- **Negative GEX**: dealer is short gamma → sells dips, buys rallies → **amplifies volatility**
- Current SPX GEX level and whether it's positive or negative
- Key GEX levels: gamma flip point (where market transitions from + to - gamma) — what price is that?
- Major support/resistance from gamma walls (large open interest strikes)
- If below gamma flip: expect more volatile, trend-following price action
- Sources: Squeezemetrics, Market Ear, Spotgamma (search for daily GEX summary)

### 5. Max Pain Analysis
- **Max pain**: the strike price where option buyers lose the most at Friday expiration
- Search for current weekly SPX/SPY max pain level
- Is the market near max pain? Markets often gravitate toward max pain into expiry (pinning effect)
- Any divergence between current price and max pain that suggests directional pressure?
- Monthly OPEX (options expiration) is typically the 3rd Friday — any OPEX this week or next?

### 6. Implied Volatility Levels by Sector
- SPY IV (30-day): current vs 30-day and 60-day realized vol (is IV elevated relative to realized?)
- IV vs IV percentile rank: is IV in top/bottom 25% of historical range?
- Sector IV: any sector with unusually elevated IV (anticipating event) vs the broad market?
- Individual ticker IV: any name with abnormal IV crush or spike?

### 7. Unusual Options Activity
Search Unusual Whales, Fintel, or Bloomberg for:
- Any unusually large options trades in SPY, QQQ, IWM, or major ETFs
- Specific sector ETF sweeps: large one-sided bets in XOM, XLF, QQQ, etc.
- Bearish vs bullish flow on net
- "Dark pool" and block options trades: any institutional hedging transactions
- Call buyers in beaten-down sectors vs put buyers in recent winners (reversion bets)
- Notable single-stock sweep orders that may signal insider-tier information

### 8. Options on Key Watchlist ETFs
- IAU/GLD: any put hedging at current gold ATH (investors taking profits via puts)
- XLE: any protective put buying or call selling (taking energy profits via covered calls?)
- BIL/SHY: any activity suggesting rate view change
- BTC options: CME BTC options open interest distribution — put/call ratio, key strikes

---

## Output Format

```
### 🎰 OPTIONS & DERIVATIVES INTELLIGENCE
**Overall Options Sentiment**: [Hedged / Neutral / Complacent / Aggressive Bullish / Extreme Fear]

**Volatility Complex:**
- VIX: X.X | [Interpretation: fear level]
- VIX Term Structure: 1M: X | 3M: X | 6M: X → [Contango=normal / Backwardation=stress]
- VVIX: X [high → vol-of-vol spike risk]
- SKEW: X — [Tail risk hedging: elevated / moderate / low]

**Put/Call Ratios:**
- Total CBOE P/C: X.XX | SPY P/C: X.XX | Equity-only: X.XX
- [Interpretation: sentiment read from P/C level]

**Gamma Exposure (GEX):**
- SPX GEX: [Positive/Negative — $Xbn est.]
- Price vs gamma flip: SPX at XXXX | Gamma flip at XXXX
- [Implication: will price action be dampened or amplified?]
- Key gamma walls: support at XXXX | resistance at XXXX

**Max Pain**: SPX/SPY weekly max pain = $XXXX | [Near or far from current price?]

**Implied Volatility**: SPY 30d IV: X% | IV Rank: Xth percentile | [Overpriced/fair/cheap]

**Unusual Options Activity:**
- [Name/ETF]: [Strike/Expiry/Call or Put] — [Size, premium, what it implies]
- [Name/ETF]: [Notable sweep or block trade]
- Net unusual flow direction: [More bullish / bearish / hedging]

**Watchlist ETF Options:**
- IAU/Gold: [Any put buying at ATH = profit protection signal]
- XLE: [Any covered call or put signal]

**Implication for Positioning**:
[2-3 sentences: what does today's options market structure say about near-term risk?
Example: "Negative GEX below 5000 means dealer selling accelerates any move lower.
VIX backwardation + elevated SKEW = institutions still hedged despite equity bounce.
This is not a safe environment to add naked risk."]
```

---
