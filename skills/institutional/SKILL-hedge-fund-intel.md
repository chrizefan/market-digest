---
name: institutional-hedge-fund-intel
description: Gathers 7-day positioning signals, public commentary, and disclosed trades from 16 tracked funds across Value, Quant/Systematic, Long/Short Equity, and Macro strategy types. Sources include CNBC/Bloomberg interviews, SEC filings, X/LinkedIn posts, and public letters.
---

# Hedge Fund Intelligence Sub-Agent

## Purpose
The world's best investors — both fundamental and systematic — leave signal trails. Their public commentary, SEC filings, and media appearances reveal conviction changes and regime views. This skill systematically gathers available signals from 16 tracked funds across 4 strategy archetypes. Run in the Institutional Intelligence phase.

## Inputs
- `config/hedge-funds.md` — master fund reference with sources and investment style

---

## Tracked Fund Universe

### Category A: Value & Generalist

**Berkshire Hathaway (Warren Buffett)**
- Primary signals: 13F filings (quarterly), annual letter (February), CNBC appearances, Berkshire shareholder meeting
- Style: Long-only, value, concentrated, patient; prefers moated businesses; no ETFs, no crypto
- How to interpret: Berkshire buying X = extreme conviction on value and earnings durability. Cash hoarding = no opportunities at reasonable price. Berkshire is NEVER a momentum signal.
- SEC CIK: 0001067983 | Sources: SEC EDGAR, CNBC, Bloomberg, Berkshire IR

**Pershing Square (Bill Ackman)**
- Primary signals: X (@BillAckman — very active), CNBC/Bloomberg interviews, 13D/13G filings, quarterly letters
- Style: Concentrated activist long/short; macro commentary on rates, economy; trades bond ETFs  
- How to interpret: Ackman's X commentary is real-time and high-signal. He telegraphed his bond short in 2023. When he shifts tone on Fed or economy, it matters.
- Sources: @BillAckman on X, CNBC, SEC EDGAR, Pershing Square IR

**Third Point (Dan Loeb)**
- Primary signals: 13F filings, quarterly letters, X (@dloeb), CNBC/Bloomberg
- Style: Activist, event-driven, multi-strategy; tech + international exposure
- How to interpret: 13D filings reveal new activism. Letters provide framework for macro and thematic views.
- Sources: @dloeb on X, SEC EDGAR, quarterly letters when available

**Greenlight Capital (David Einhorn)**
- Primary signals: 13F quarterly, quarterly investor letters (widely leaked), conference appearances
- Style: Value long/short; known for being contrarian and right (exposed Lehman 2008, called dot-com valuations)
- How to interpret: When Einhorn is short something, it often reflects structural accounting or valuation fraud risk. Contrarian value lens.
- Sources: Greenlight letters (search), SEC EDGAR, Bloomberg

---

### Category B: Quant & Systematic

**Bridgewater Associates (Ray Dalio / All Weather / Pure Alpha)**
- Primary signals: Daily Observations (rarely public), LinkedIn/X posts from Dalio, media interviews, published research
- Style: Risk parity (All Weather) + discretionary macro (Pure Alpha); debt cycle thesis framework
- How to interpret: Dalio's public framework (debt supercycle, paradigm shifts) is useful for 5-10 year regime framing. Recent stated views on China, dollar, gold are high-signal.
- Sources: @RayDalio on LinkedIn, published books/articles, Bloomberg, Financial Times

**AQR Capital (Cliff Asness)**
- Primary signals: Published research (aqr.com), X (@CliffordAsness — prolific and specific), conference presentations
- Style: Systematic factor investing (value, momentum, quality, carry); evidence-based, pushes back on narratives
- How to interpret: Asness is highly constructive for factor analysis. His views on value factor performance, crowding, and liquidity are institutional signal.
- Sources: @CliffordAsness on X, aqr.com/Insights, Financial Analysts Journal

**Two Sigma**
- Primary signals: Limited public commentary; occasional published research (twosigma.com), conference panels
- Style: Pure quant, ML-driven, alternative data heavy; signals via hiring patterns and technology commentary
- Sources: Vault, Institutional Investor, Bloomberg, industry panels

**DE Shaw**
- Primary signals: Very limited public output; research papers; rare leadership interviews
- Style: Quantitative and computational; known for market-neutral strategies
- Sources: Bloomberg, Institutional Investor, academic papers

---

### Category C: Long/Short Equity

**Tiger Global (Chase Coleman)**
- Primary signals: 13F quarterly filings, Bloomberg/FT reporting on fund performance
- Style: Long-biased growth equity (tech, consumer internet), global; pain points = high duration growth stocks
- How to interpret: Tiger's 13F reveals the institutional growth equity consensus. Exits from positions signal sector rotation away from growth.
- Sources: SEC EDGAR 13F, Bloomberg, FT, prime brokerage reports

**Coatue Management (Philippe Laffont)**
- Primary signals: 13F quarterly, Bloomberg, conference appearances, company board seats
- Style: Long/short tech and internet; AI-first investment thesis
- How to interpret: Coatue's 13F reveals AI positioning conviction (NVDA, MSFT, GOOGL concentration). One of the premier technology stock funds globally.
- Sources: SEC EDGAR, Bloomberg, TechCrunch, financial media

**Viking Global (Andreas Halvorsen)**
- Primary signals: 13F quarterly, Bloomberg reporting
- Style: Global long/short equity, sector agnostic, high-quality fundamental research
- How to interpret: Viking's 13F turnover reveals what high-quality fundamental longs are being added/exited. Less thematic, more bottom-up signal.
- Sources: SEC EDGAR, Bloomberg

**Lone Pine Capital (Steve Mandel)**
- Primary signals: 13F quarterly, Bloomberg reporting, SEC filings
- Style: Long-biased, quality growth companies globally
- How to interpret: Similar to Tiger — concentration shows highest-conviction long/short thesis in quality growth
- Sources: SEC EDGAR, Bloomberg

---

### Category D: Macro Legends

**Stanley Druckenmiller (Duquesne Family Office)**
- Primary signals: Conference appearances (Sohn, Milken), Bloomberg/CNBC interviews, @stan_druckenmiller (rare), 13F filings
- Style: Top-down macro, concentrated, high-conviction; best track record in macro history
- How to interpret: When Druckenmiller speaks publicly, treat it as the highest-signal public macro view available. His currency, rates, and commodity reads are definitive.
- Sources: Bloomberg, CNBC, Sohn Conference archives, SEC EDGAR

**Paul Tudor Jones (Tudor Investment Corp)**
- Primary signals: Bloomberg/CNBC interviews, 13F filings, conference appearances
- Style: Global macro, technical overlay, risk management first; known for Black Monday 1987 call
- How to interpret: Tudor Jones on inflation hedge, Bitcoin, gold = validated institutional signal. His macro frameworks are often ahead of consensus.
- Sources: Bloomberg TV, CNBC, PTJ Foundation, SEC EDGAR

**Soros Fund Management (George Soros / Dawn Fitzpatrick)**
- Primary signals: 13F filings, Foundation reports, public speeches (Soros), media
- Style: Reflexivity theory; macro, event-driven, currency/rate focus
- How to interpret: 13F shows current equity book. Currency convictions usually not disclosed. Soros public speeches are policy-oriented, less actionable for short-term trades.
- Sources: SEC EDGAR, OpenSociety Foundation, Bloomberg, FT

**Paulson & Co (John Paulson)**
- Primary signals: 13F quarterly, Bloomberg, occasional CNBC
- Style: Currently gold and hard asset focused (post-GFC career shift); merger arbitrage specialist
- How to interpret: Paulson's gold positioning is a concentrated thesis on inflation/dollar debasement. 13F reveals gold miner allocations.
- Sources: SEC EDGAR, Bloomberg, CNBC

---

## Research Steps

### 1. CNBC / Bloomberg 7-Day Search
For each category, search: "[Fund Name] OR [Manager Name] CNBC Bloomberg interview 2026-[date]"
- Any media appearance in the last 7 days?
- What was the key market view expressed?
- Any significant position change disclosed?

### 2. X / Social Media Search
For accounts known to be active (Ackman, Dalio, Asness):
- Any notable posts in last 7 days?
- Any position disclosures, macro views, or call-outs?

### 3. SEC EDGAR Recent Filings
- Any new 13F, 13D, 13G, or Form 4 filings from tracked funds?
- 13F is quarterly but filed 45 days after quarter-end — check for latest available
- 13D/13G for any new large position disclosures

### 4. Research / Letters
- Any publicly available investor letter or research piece published by tracked funds in last 30 days?
- AI/quantitative research notes (AQR, Two Sigma) published?

### 5. Synthesize: Key Themes Across All Funds
After gathering individual fund signals, identify:
- **Consensus view**: What are most of these funds aligned on? (if anything)
- **Divergent view**: Any notable contrarian position?
- **High-conviction**: Who is adding and in what?
- **Exiting**: Who is reducing positions and in what?
- **Regime read**: Collectively, what macro regime are these funds positioning for?

---

## Output Format

```
### 🏦 HEDGE FUND INTELLIGENCE (7-Day Scan)

**Active Signals This Period:**

**Category A: Value & Generalist**
- Berkshire: [Any new 13F, Buffett comment, or CNBC appearance] / [No new signal]
- Pershing (Ackman): [Recent X post or interview highlight if material]
- Third Point (Loeb): [13D or notable comment if any]
- Greenlight (Einhorn): [Letter excerpt or media signal if any]

**Category B: Quant & Systematic**
- Bridgewater (Dalio): [Published view or interview highlight]
- AQR (Asness): [Research note or X commentary on factor / market structure]
- Two Sigma / DE Shaw: [Any rare public signal]

**Category C: Long/Short Equity**
- Tiger Global: [Latest 13F quarter change highlights — top adds/trims]
- Coatue: [AI/tech conviction signals from 13F or media]
- Viking / Lone Pine: [13F rotation signal if any]

**Category D: Macro Legends**
- Druckenmiller: [Most recent ACTIONABLE comment on macro, rates, or assets]
- Paul Tudor Jones: [Any recent inflation hedge, BTC, or macro view]
- Soros FM: [Any 13F or policy-oriented macro signal]
- Paulson: [Gold allocation or hard asset positioning signal]

---

**Cross-Fund Synthesis:**
- **Consensus theme**: [What are most funds aligned on right now?]
- **Divergent view**: [Any contrarian fund going against consensus?]
- **Highest conviction adds** (recent 13Fs): [Top 3 most widely added positions]
- **Highest conviction exits** (recent 13Fs): [Top 3 most widely exited positions]
- **Macro regime read from fund positioning**: [What collective positioning implies about regime expectation]

**Implication for Portfolio:**
[How does the hedge fund consensus inform our positioning? Are we aligned with the smart money on IAU/XLE/defensive posture? Any signals that challenge our thesis?]
```

---
