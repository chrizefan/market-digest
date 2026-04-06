---
name: alt-data-politician-signals
description: Tracks US Congressional STOCK Act trade disclosures, key committee chair policy positions, Fed Chair and Treasury Secretary public statements, and regulatory agency signals. Both follow-the-money (what politicians are buying/selling personally) and policy positioning. Runs early in pipeline.
---

# Politician & Official Signals Sub-Agent

## Purpose
Politicians and regulators move markets — both through what they buy/sell personally and through policy signals. STOCK Act disclosures are legally required to be filed within 45 days of a trade and are public record. Committee chair rhetoric directly moves sector-specific ETFs. Run early in pipeline.

## Inputs
- `config/data-sources.md` (Quiver Quantitative, Capitol Trades, EDGAR, public statements)

---

## Research Steps

### 1. STOCK Act Trade Disclosures (Past 7 Days)
Search Quiver Quantitative (quiverquant.com/sources/congresstrading) or Capitol Trades (capitoltrades.com) for congressional stock trades disclosed in the past 7 days:

**Key questions:**
- Which members of Congress are buying or selling?
- What sectors or specific stocks are being traded?
- Is it bipartisan buying in a sector = possible policy tailwind?
- Is a committee member trading stocks in their committee's jurisdiction? (Significant signal)
- Large transactions (>$250k) are more material than small ones
- Which committee memberships are relevant? See below.

**Key Committee Chairs / Members to track:**
- **Senate Banking Committee** (banking, financial regulation, Fed oversight)
- **Senate Finance Committee** (tax, trade, entitlements — affects XLF, XLV)
- **Senate Armed Services Committee** (defense spending — affects ITA, XLI)
- **House Financial Services Committee** (banking, crypto regulation — affects XLF, BTC)
- **House Energy & Commerce Committee** (energy, pharma — affects XLE, XLV)
- **House Agriculture Committee** (farm bill, commodities — affects food commodities, XLP)
- **Senate Intel Committee** (geopolitical access — useful for Iran/Taiwan signals)
- **Senate Foreign Relations** (sanctions, geopolitical — affects DBO, oil)

#### Format for each disclosed trade:
```
[Name (Party/State)] — [Buy/Sell] [Ticker] — [$Amount range] — [Disclosed Date]
Committee: [Relevant committee] | Conflict of interest?: [Y/N comment]
```

### 2. Recent Policy Position Statements
Search for public statements from key officials in the last 48 hours:

**Executive Branch:**
- Treasury Secretary: any statements on USD, debt ceiling, tariffs, sanctions
- National Security Advisor / Secretary of State: Iran War / Strait of Hormuz update
- USTR (US Trade Representative): any tariff or trade negotiation updates
- Energy Secretary: any SPR or energy policy signals

**Federal Reserve:**
- Fed Chair Powell: any recent speech, press conference, or testimony
- FOMC member speeches this week: hawkish vs dovish balance
- Fed's Beige Book (published 8x/year): economic conditions summary
- Any Fed official making surprise comments on monetary policy trajectory

**Independent Regulators:**
- SEC Chair: any crypto regulation, market structure, or ETF approvals
- CFTC Chair: derivatives regulation, crypto oversight
- FDIC / OCC: banking system health statements
- FTC: any major antitrust action or approval

**Congressional Budget & Oversight:**
- CBO: any recent economic projections or deficit scoring
- GAO: any major audit findings

### 3. Geopolitical Official Statements
In the context of the Iran War (current dominant macro theme):
- Any official statements from SecState, SecDef, CENTCOM about escalation/de-escalation
- Iranian Foreign Ministry or IRGC statements
- Gulf state (Saudi, UAE, Qatar) official positions on Hormuz
- Any congressional AUMF (Authorization for Use of Military Force) activity
- UN Security Council: any resolutions or vetoes

### 4. Tariff & Trade Actions
- Any Executive Orders on tariffs signed or rescinded
- Section 232 or Section 301 actions pending or active
- Retaliatory tariff announcements from China, EU, Canada
- Any trade deal framework discussions

### 5. Regulatory Actions Affecting Watchlist
- Any regulatory approval, rejection, or investigation affecting portfolio ETF sectors:
  - Energy: EPA rulings, pipeline approvals, offshore lease auctions
  - Healthcare: FDA drug approvals (PDUFA dates), CMS reimbursement decisions
  - Financials: bank merger approvals, capital rule finalization
  - Crypto: SEC/CFTC ETF approvals, exchange registrations

---

## Output Format

```
### 🏛️ POLITICIAN & OFFICIAL SIGNALS

**Congressional Stock Trades (Last 7 Days):**
| Member | Party | Buy/Sell | Ticker | Amount | Committee | Signal |
|--------|-------|----------|--------|--------|-----------|--------|
| [Name] | [R/D] | BUY | [XXX] | [$X-Xk] | [Finance] | [comment] |
| [Name] | [R/D] | SELL | [XXX] | [$X-Xk] | [Armed Srv] | [comment] |
| [None found in 7 days → note that] | | | | | | |

**Net Congressional Positioning:**
- Net buyers: [sectors/tickers being accumulated]
- Net sellers: [sectors/tickers being distributed]
- Divergence from market direction: [are Congress members buying into weakness or selling into strength?]

**Fed & Treasury Signals:**
- Powell: [Latest statement + hawkish/dovish read]
- Treasury: [Any USD, debt, sanction signal]
- FOMC Net Tone This Week: [Hawkish / Dovish / Neutral — from member speeches]

**Geopolitical Official Statements:**
- [Iran War / Hormuz]: [Latest official update from US government or IRGC]
- [Trade / Tariffs]: [Any new action]
- [Relevant other]: [Any other material official statement]

**Regulatory Actions (Affecting Portfolio):**
- [Agency + Action]: [What it means for relevant ETF/sector]

**Implication for Portfolio:**
[What do today's official signals tell us? e.g. "Treasury signaling dollar support = DXY bounce
risk that weighs on commodities and gold. No new Iran escalation from SecState = Hormuz
premium stable but not expanding further."]
```

---
