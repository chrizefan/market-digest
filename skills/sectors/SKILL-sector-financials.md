---
name: sector-financials
description: Deep-dive analysis of the Financials sector (XLF, KRE, KBE). Covers large-cap banks, regional banks, insurance, capital markets, and fintech. Interest rate sensitive — integrates closely with bonds output. Run as part of the US Equities phase in the daily orchestrator.
---

# Financials Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLF and financial ETFs)
- `config/preferences.md`
- `memory/sectors/financials/ROLLING.md`
- `memory/bonds/ROLLING.md`
- Macro regime + bonds output from current session

---

## Research Steps

### 1. Sector ETF Overview
- **XLF** (Financial Select SPDR): price, % change, vs 50-DMA and 200-DMA
- **KRE** (SPDR Regional Banks): price, % change — regional banks are higher-risk, higher-beta
- **KBE** (SPDR Bank ETF): price, % change — equal-weight bank exposure
- XLF vs SPY relative strength: outperforming or underperforming?
- Large-cap banks (JPM, BAC, WFC, GS, MS, C) — weight-adjusted contribution to moves

### 2. Net Interest Margin (NIM) Analysis
- Current Fed Funds Rate and its effect on bank NIM
- Yield curve shape: steep curve = good for banks (borrow short, lend long); flat/inverted = NIM compression
- Are rate expectations shifting (from bonds output)? More cuts = NIM headwind; higher-for-longer = NIM tailwind
- Large banks have deposit betas — how much of rate cuts would they have to pass through?

### 3. Credit Quality & Loan Trends
- Any recent delinquency data or charge-off trends (search for latest bank earnings guidance)
- Commercial Real Estate (CRE) exposure: ongoing pressure point for regional banks
- Consumer credit: any deterioration signals in credit card, auto loan data
- Corporate credit quality: leveraged loan market stress
- CRE office exposure in KRE names — still resolving or stabilizing?

### 4. Capital Markets Businesses
- IB fee pipeline: M&A, IPO, syndicated debt — are deal volumes recovering?
- Goldman Sachs / Morgan Stanley as capital markets bellwethers
- Fixed income trading revenue: any guidance signals?
- Asset management fees: markets up/down effect on AUM-fee revenues

### 5. Insurance Sub-Sector
- AIG, TRV, MET, AXP weight in XLF
- Insurance benefits from higher rates (float investment income)
- Any catastrophe event or nat-cat exposure updates (relevant given Iran War tail risk)

### 6. Regulatory & Policy Environment
- Basel III endgame capital rules: implementation timeline, impact on buybacks
- Any FDIC, OCC regulatory news
- Regional bank consolidation: any M&A approvals or activity
- CFPB actions, credit card fee caps, fintech regulation

### 7. Earnings & Catalysts
- Major bank earnings upcoming? (typically early in earnings season)
- Any recent guidance revisions
- Analyst upgrades/downgrades across financial names
- Stress test schedule (typically June — implications for buyback capacity)

### 8. Valuation Context
- XLF P/B (price-to-book): historically the right metric for banks
- KRE P/TBV (tangible book value): are regionals trading at a discount?
- Sector NTM P/E vs history
- Dividend yield on XLF vs 10Y treasury — is there still a spread?

---

## Output Format

```
### 🏦 FINANCIALS SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLF: $X (±X%) | KRE: $X (±X%) | KBE: $X (±X%)
**vs 200-DMA**: XLF [above/below by X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]

**Rate/NIM Read**: [With yields at current level, NIM trajectory — favorable or headwind]
**Yield Curve Signal**: [Curve shape implication for bank profitability]

**Credit Quality**: [Any deterioration signals in CRE, consumer, or corporate credit]

**Capital Markets Pipeline**: [M&A/IPO activity level — recovering or subdued]

**Regulatory Climate**: [Key rule or action affecting sector right now]

**Valuation**: XLF P/B ~Xx | [vs historical range — cheap/fair/expensive]

**Earnings/Catalyst**: [Any near-term bank earnings or guidance updates]

**Regime Fit**: [In current macro regime, are financials a buy or avoid?]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/sectors/financials/ROLLING.md`:
- One on NIM/yield curve implications for bank profitability
- One on credit quality trend (particularly CRE and consumer)
- One on capital markets or regulatory development
