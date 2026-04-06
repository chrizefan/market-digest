---
name: sector-healthcare
description: Deep-dive analysis of the Healthcare sector (XLV, IBB, XBI). Covers pharma, biotech, managed care, medtech, and regulatory environment. Run as part of the US Equities phase in the daily orchestrator.
---

# Healthcare Sector Sub-Agent

## Inputs
- `config/watchlist.md` (healthcare ETFs)
- `config/preferences.md` (XLV is a current portfolio holding)
- Macro regime output from `macro.md`

---

## Research Steps

### 1. Sector ETF Overview
- **XLV** (Health Care SPDR): price, % change, vs 50-DMA and 200-DMA
- **IBB** (iShares Biotech ETF): price, % change — biotech is high-beta within healthcare
- **XBI** (SPDR Biotech Equal-Weight): small/mid-cap biotech indicator
- XLV vs SPY relative strength: is healthcare outperforming or underperforming the market?
- Key context: in the current portfolio, XLV is a **defensive holding** — assess if that defensiveness is holding

### 2. Subsector Breakdown
- **Managed Care / Insurance** (UNH, CI, HUM weight in XLV): Medicare Advantage, CMS reimbursement rates, medical loss ratios
- **Large-cap Pharma** (JNJ, LLY, MRK, ABBV): pipeline catalysts, patent cliffs, GLP-1 obesity drug cycle
- **Biotech** (IBB, XBI): PDUFA dates, Phase 3 readouts, M&A speculation, FDA approval cadence
- **Medical Devices / MedTech** (MDT, ABT, SYK): hospital utilization, supply chain
- **Hospitals / HCA**: utilization trends, pricing, labor costs

### 3. Regulatory & Policy Environment
- CMS reimbursement rule updates or Medicare/Medicaid changes
- FDA pipeline: any PDUFA dates today or this week
- Drug pricing legislation or executive orders affecting pharma
- ACA/healthcare policy debates in Congress
- IRA drug pricing negotiations — any new drugs added?
- RFK Jr. or DOGE impacts on FDA/HHS (particularly relevant for 2026)

### 4. Earnings & Catalysts
- Any healthcare names reporting today or tomorrow?
- Drug trial data readouts expected this week
- Conference presentations (JPMorgan Healthcare Conference season, ASCO, etc.)
- Recent major M&A: any biotech takeouts or pharma acquisitions

### 5. Valuation Context
- XLV NTM P/E vs historical average
- Healthcare typically trades at a discount to S&P; is this discount widening or narrowing?
- IBB valuation: biotech P/E or EV/Revenue depending on profitability
- GLP-1 obesity drug tailwind: how much is LLY/NVO premium compressed or expanded?

### 6. Macro Regime Fit
- Healthcare is classically **defensive**: outperforms in slowdowns, rising VIX, and inflation environments
- In the current regime (check `macro.md`): does healthcare fit as a defensive allocation?
- Assess: if rates are rising, does that impact XLV's defensive premium?
- Political risk: is healthcare policy a market risk right now?

### 7. Portfolio Assessment
- XLV is a core holding — is the thesis (defensive rotation, inflation-resistant) holding?
- Any signs the defensive bid is fading (sector rotating to offense)?
- Should XLV weighting be maintained, increased, or reduced given today's analysis?

---

## Output Format

```
### 🏥 HEALTHCARE SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLV: $X (±X%) | IBB: $X (±X%) | XBI: $X (±X%)
**vs 200-DMA**: XLV [above/below by X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]

**Subsector Read**:
- Managed Care: [direction + catalyst]
- Large Pharma: [key driver — pipeline or policy]
- Biotech: [risk-on/off signal + any PDUFA dates]

**Regulatory Signal**: [CMS, FDA, drug pricing — any active headwind or tailwind]

**Policy Risk**: [Any legislative or executive action impacting sector]

**Valuation**: XLV NTM P/E: ~Xx | [Vs history — cheap/fair/expensive]

**Regime Fit**: [Is current macro favorable for defensive healthcare allocation?]

**Portfolio Note**: XLV thesis [✅ Holding / ⚠️ Weakening / ❌ Challenged] — [one-line rationale]
```

---
