---
name: sector-comms
description: Deep-dive analysis of the Communication Services sector (XLC). Covers digital advertising, social media, streaming, telecom, and gaming. Driven by Alphabet, Meta, and Netflix at scale. Run as part of the US Equities phase in the daily orchestrator.
---

# Communication Services Sector Sub-Agent

## Inputs
- `config/watchlist.md` (XLC and related)
- `config/preferences.md`
- Macro regime output from `macro.md`

---

## Research Steps

### 1. Sector ETF Overview
- **XLC** (Communication Services SPDR): price, % change, vs 50-DMA and 200-DMA
- XLC vs SPY relative strength
- Key concentration: GOOGL (Alphabet) ~25%, META ~20%, NFLX, T, VZ, CHTR, EA, TTWO
- Strip out GOOGL + META: are broader comms names tracking or diverging?

### 2. Digital Advertising Revenue Cycle
- This is the most important short-term driver for GOOGL and META
- Ad market health check: any agency or platform data on ad spend growth
- Search ads (GOOGL): AI-driven search changes threatening or boosting revenue?
- Social ads (META): engagement trends, Reels adoption, AI-driven targeting improvements
- Programmatic ad market: any DSP/SSP or e-commerce ad data
- Connected TV (CTV) advertising: ROKU, YouTube, Peacock competition
- Macro sensitivity: advertising is a leading indicator — companies cut ad budgets before cutting capex

### 3. Streaming & Content
- **Netflix (NFLX)**: subscriber growth, ad-supported tier progress, password sharing crackdown
- **Disney+** (DIS is partially in XLC): streaming profitability progress
- Content production pipeline and costs
- Streaming market consolidation: any M&A news?
- Cord-cutting rate: still accelerating or plateauing?

### 4. Telecom Sub-Sector
- **AT&T (T)**: debt reduction, fiber buildout, DirecTV separation completion
- **Verizon (VZ)**: postpaid net adds, fixed wireless access growth
- **T-Mobile (TMUS)**: most aggressive growth trajectory in telecom
- Spectrum auctions, 5G monetization progress
- Broadband competition between fiber (T, VZ) and cable (CHTR, CMCSA)
- Telecom as defensive dividend income: yield vs 10Y spread

### 5. AI / Generative AI Exposure
- GOOGL Gemini vs OpenAI/Microsoft competition: market share search implications
- META AI integration across Facebook/Instagram/WhatsApp
- AI-driven ad targeting improvements: pricing power uplift?
- Risk: if AI commoditizes search, GOOGL's core business is threatened
- Perplexity, ChatGPT search: any new data on market share shifts

### 6. Regulatory / Antitrust Environment
- GOOGL antitrust: DOJ search monopoly case status
- META antitrust: FTC merger review / Instagram acquisition challenge
- EU Digital Markets Act: compliance costs and revenue impacts
- China/TikTok: US TikTok ban enforcement status — advertising market impact?

### 7. Gaming Sub-Sector
- EA, TTWO, ATVI (already acquired by MSFT) — gaming cycle
- Console attach rates, in-game spending trends

### 8. Valuation Context
- XLC NTM P/E vs historical average
- GOOGL and META ex-cash valuations: are they cheap relative to growth?
- GOOGL free cash flow yield — compelling if AI transition goes right
- META ROE: one of the highest in S&P 500

---

## Output Format

```
### 📡 COMMUNICATION SERVICES SECTOR
**Bias**: [Overweight / Underweight / Neutral] | Confidence: [High / Medium / Low]

**ETF Levels**: XLC: $X (±X%)
**vs 200-DMA**: [above/below X%]
**Relative Strength vs SPY**: [Outperforming / Underperforming / In-line]

**Ad Market Signal**: [Search + social + programmatic health check — any growth/contraction signal]

**Key Name Read**:
- GOOGL ($X): [AI search risk + ad market + any regulatory]
- META ($X): [Ad revenue + AI + antitrust status]
- NFLX ($X): [Sub growth + ad tier]
- T/VZ: [Telecom dividend yield vs treasury spread]

**AI Disruption Risk**: [GenAI search threat to GOOGL — current assessment]

**Regulatory Risk**: [Antitrust, DMA, TikTok impacts]

**Valuation**: XLC P/E ~Xx | GOOGL ex-cash FCF yield ~X% | META ROE [well above 30%]

**Macro Link**: [In recession, ad budgets cut first — is macro pointing to ad cyclicality risk?]
```

---
