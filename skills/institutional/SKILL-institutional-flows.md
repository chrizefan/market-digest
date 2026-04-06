---
name: institutional-flows
description: Tracks daily ETF in/outflows, dark pool and block trade prints, short interest changes, and new 13D/13G SEC filings. Reveals where institutional money is actually moving — ahead of price. Run in the Institutional Intelligence phase.
---

# Institutional Flows Sub-Agent

## Purpose
Follow the smart money. ETF flows reveal institutional sector rotation in real-time. Dark pool prints and block trades reveal large-scale repositioning that hasn't hit the tape at full size yet. 13D/13G filings reveal activist entries and large fund position changes. Run before macro and segment analysis.

## Inputs
- `config/data-sources.md` (ETF.com flows, Unusual Whales, SEC EDGAR, Fintel, short interest sources)

---

## Research Steps

### 1. ETF Daily Flow Scan
Search for latest daily ETF in/outflow data (ETF.com, ETFdb, or news sources reporting flow data):

**Priority ETFs to check** (organized by asset class):

**Crypto / Digital Assets:**
- **IBIT** (BlackRock Bitcoin ETF): daily flows — the largest BTC spot ETF, flows = institutional sentiment
- **FBTC** (Fidelity Bitcoin ETF): flows comparison
- **ARKB**, **BTCO**: additional BTC spot ETF flows
- Any ETHE/ETHA (Ethereum ETF) flows

**US Equities:**
- **SPY**: daily creation/redemption — large outflows often signal institutional de-risking
- **QQQ**: tech-heavy institutional allocation
- **IWM**: small-cap; inflows = risk-on appetite for smaller companies

**Sector ETFs (look for notable outliers):**
- Any sector ETF with unusually large in/outflow vs daily average?
- XLE (energy): are institutions adding or exiting?
- XLV (healthcare): defensive flows increasing or decreasing?
- XLK (tech): rotation signal
- XLF, XLI, XLP notable moves?

**Commodities:**
- **GLD / IAU** (gold): institutional gold ETF demand — critical at $4,686 ATH
- **SLV** (silver): any acceleration?
- **USO / DBO** (oil): oil fund flows vs commodity price

**Fixed Income:**
- **TLT** (long Treasuries): large inflows = flight to safety; outflows = rates rising
- **BIL / SHY** (short duration): parking cash / risk-averse positioning
- **HYG / JNK**: high yield vs IG flow divergence = credit risk appetite
- **EMB** (EM debt): EM risk-on/off signal

**International:**
- **EEM**: broad EM in/outflow — global risk appetite
- **MCHI** / **FXI**: China-specific; PBOC stimulus bets
- **EWJ**: Japan positioning

### 2. Dark Pool & Block Trade Scan
Search Unusual Whales (unusualwhales.com) or Fintel for large dark pool prints:
- Any unusually large block prints in major ETFs or stocks from watchlist?
- Dark pool volume as % of total volume: elevated dark pool = institutional repositioning
- Large block trades at specific price levels: often signals program buying/selling zones
- Crossings: institutional cross trades that reveal portfolio rebalancing
- Note: dark pool prints are delayed and not always directional — use as supplementary signal

### 3. Short Interest Changes
Search for weekly/biweekly short interest data updates:
- **Most shorted ETFs**: any significant changes in short interest vs prior period?
- **High short interest tickers**: any approaching squeeze conditions (high SI + low float + rising price)?
- Short interest in key positions: XLE, IAU, XLV — is smart money betting against current positions?
- Short squeeze risk: threshold is typically >20% float shorted + positive price momentum
- Any recent short interest reduction (covers) following a squeeze that may signal exhaustion?

### 4. SEC EDGAR 13D / 13G Filings (Last 7 Days)
Search SEC EDGAR for new 13D/13G filings (large ownership disclosures):
- **13D filing**: activist investor acquiring >5% stake, intending influence — major catalyst
- **13G filing**: passive investor reporting >5% stake — institutional accumulation signal
- Search: `sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=SC+13D`
- Any 13D/13G in stocks or fund holdings that are relevant to our watchlist sectors?
- Note the acquirer and whether they have a history of activism

### 5. Options-Flow / Institutional Derivatives Positioning
(Cross-reference with options-derivatives output)
- Any large institutional collar trades (buy stock + sell call + buy put = lock in gains)?
- Any LEAPS call buying indicating multi-year institutional conviction?
- Large put volumes in key holdings = institutional hedging (bearish signal for those holdings)

### 6. Fund Flows to Asset Classes (Macro-Level)
Search for any published weekly fund flow data (ICI, EPFR Global):
- Equity fund flows: net inflows or outflows for the week?
- Bond fund flows: flight to safety or risk-on out of bonds?
- Money market fund levels: rising = cash hoarding; falling = deploying into risk
- Global EM vs DM fund flows: where is global capital rotating?

---

## Output Format

```
### 🏦 INSTITUTIONAL FLOWS INTELLIGENCE
**Net Institutional Direction**: [Risk-On / Risk-Off / Neutral / Rotating]

**Top ETF Flows Today:**
| ETF | Category | Flow ($M) | vs Avg | Signal |
|-----|----------|-----------|--------|--------|
| IBIT | BTC Spot | +$XXXm | [above/below avg] | BTC accumulation |
| SPY | US Equity | -$XXXm | [large] | institutional de-risk |
| GLD/IAU | Gold | +$XXXm | [avg] | gold demand |
| TLT | Long Bond | +/-$XXXm | | flight to safety? |
| XLE | Energy | +/-$XXXm | | energy rotation |
| [Other notable] | | | | |

**Notable Sector Rotation via Flows:**
- Into: [sectors with largest net inflows — institutions buying]
- Out of: [sectors with largest net outflows — institutions selling]

**Dark Pool / Block Trades:**
- [Any notable large prints or unusual dark pool volume]
- Net direction: [bullish / bearish / neutral interpretation]

**Short Interest Update:**
- High short interest / squeeze risks: [any notable]
- XLE/IAU/XLV short interest: [increasing = bearish pressure / decreasing = covering]

**SEC 13D/13G Filings (Last 7 Days):**
- [Company] — [Funder] filed 13D/13G: [X%] stake — [implication]
- [None notable this period]

**Fund Flow Macro Signal:**
- Money market level: $X trillion | [Rising = risk-off / Falling = deploying into markets]
- Equity fund flows: [Net +/- for week]
- EM vs DM rotation: [which receiving capital?]

**Implication for Portfolio:**
[What are institutions doing with our positions? Any flows into or out of XLE/IAU/XLV/BIL that confirm or challenge current weighting?]
```

---
