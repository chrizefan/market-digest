# Trading Profile & Preferences

> This file tells Claude how to frame every analysis session.
> Last updated: 2026-04-05

---

## 🎯 Trading Style

- **Primary horizon**: Medium-term position trader (weeks to months)
- **Approach**: Top-down macro-driven rotation across major ETFs
- **Universe**: ETF-only — no individual stock picking
- **Rebalance cadence**: Weekly or bi-weekly — NOT day-to-day; only rotate when the macro regime meaningfully shifts
- **Home currency**: CAD (most holdings are USD-denominated ETFs; note FX exposure)

---

## 📐 Risk Profile

- **Max single ETF position**: 20% of portfolio
- **Max single theme/category**: 40% (e.g., total equity exposure)
- **Cash as a position**: Yes — hold BIL/SHV or cash when conviction is low
- **Leverage**: None; ratio/spread trades only (long one ETF, short another as a paired trade)
- **Stop approach**: Regime-based, not intraday price stops — exit when the macro thesis breaks

---

## 🌍 Investment Universe

### US Equities — By Market Cap
- Large cap: SPY, QQQ, IWB
- Mid cap: MDY, IJH
- Small cap: IWM, IJR

### US Equities — By Sector (SPDR Select)
XLK (Tech), XLF (Financials), XLE (Energy), XLV (Health Care), XLI (Industrials),
XLRE (Real Estate), XLU (Utilities), XLY (Consumer Disc.), XLP (Consumer Staples),
XLB (Materials), XLC (Communication Services)

### International — Developed Markets
EFA (EAFE), VEA (Vanguard Developed ex-US), VGK (Europe), EWJ (Japan),
EWG (Germany), EWU (UK), EWA (Australia)

### International — Emerging Markets
EEM (MSCI EM), VWO (Vanguard EM), FXI (China Large Cap), ASHR (China A-Shares),
EWZ (Brazil), EWT (Taiwan), EWY (South Korea), INDA (India)

### Crypto (Spot ETFs)
- Bitcoin: IBIT (BlackRock), FBTC (Fidelity)
- Ethereum: ETHA (BlackRock), FETH (Fidelity)
- Solana: No spot ETF yet — track SOL price directly

### Commodities
- Gold: GLD, IAU (prefer IAU for lower cost)
- Silver: SLV
- Oil (WTI): DBO (preferred — optimized roll), USO
- Brent: BNO
- Broad commodities: PDBC, DJP
- Copper: CPER

### Fixed Income & Cash Equivalents
- Cash proxy: BIL, SHV (T-bills)
- Short duration: SHY
- Intermediate: IEF
- Long duration: TLT
- High yield: HYG
- Investment grade: LQD
- TIPS: TIP
- EM bonds: EMB

---

## ⚖️ Ratio / Spread Trades

Open to financial engineering positions — long one ETF, short another to express a relative view.
These are sized by net exposure (not each leg individually).

Recurring pairs of interest:
- **Long GLD / Short SLV** — gold/silver ratio trade
- **Long DBO / Short GLD** — oil over gold; inflation/growth bet
- **Long IWM / Short SPY** — small cap vs. large cap rotation
- **Long EEM / Short SPY** — EM vs. US; USD weakness / reflation bet
- **Long XLE / Short XLU** — energy vs. utilities; risk-on within defensives
- **Long QQQ / Short IWM** — growth/quality vs. small cap
- **Long TLT / Short HYG** — flight to quality; risk-off spread

---

## 📰 What I Want in the Digest

### 1. Positioning Recommendation (Lead Every Digest)
- A clear **high-level portfolio allocation** suggestion: what to own, what to underweight, what's in cash
- Express as **target weights by category** (e.g., "25% US large cap, 15% gold, 10% EM, 50% cash")
- Compare to the CURRENT portfolio in `config/portfolio.json` and flag if a rotation is warranted
- **Do NOT suggest changes daily** — only recommend rotation when macro regime shifts meaningfully
- Aim for **weekly cadence** on repositioning; always justify the change clearly
- When no rotation is needed, say so explicitly

### 2. Market Context
- Macro regime summary: risk-on / risk-off / transitional
- Key overnight and pre-market moves across the watchlist universe
- Upcoming macro events that could force a repositioning

### 3. Performance Check
- Reference current positions from `config/portfolio.json`
- Note unrealized P&L and flag any positions working against the active thesis

### 4. Digest Format
- **Lead with positioning** — that's the core output
- Direct and actionable; no fluff
- State confidence: high / medium / low
- Use headers, bias labels (bullish / bearish / neutral / conflicted) per segment
- Flag when signals are conflicted

---

## 🚫 What to Filter Out

- Individual stock analysis (not relevant — ETF rotation only)
- Intraday technical levels
- Options strategies
- Noise below the weekly time horizon
- Mainstream financial media narratives (unless market-moving)

---

## 📌 Active Macro Theses

> Claude will cross-reference these during each digest and flag confirmations or contradictions.
> Update this section after major regime changes or thesis shifts.

- [Add your current macro views here]
- [e.g., "USD weakness supports EM and gold rotation"]
- [e.g., "Recession risk rising — overweight defensives (XLU, XLP, TLT)"]
- [e.g., "Gold structural bid on central bank buying and de-dollarization"]
- [e.g., "Energy transition trade — XLE underweight vs. prior cycle"]
