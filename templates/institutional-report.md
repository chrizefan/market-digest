# Institutional Intelligence Report — Template

**Date**: {{DATE}}
**Phase**: Phase 2 (Institutional Intelligence — runs after alt data, before macro)

---

## 2A. ETF Flow Intelligence

*Sources: Unusual Whales, ETF.com, Farside (BTC ETFs)*

### BTC Spot ETF Daily Flows
| ETF | Issuer | Daily Flow | Cumulative | Signal |
|-----|--------|-----------|------------|--------|
| IBIT | BlackRock | ±$Xm | $Xbn | Acc/Dist |
| FBTC | Fidelity | ±$Xm | $Xbn | Acc/Dist |
| ARKB | ARK/21Shares | ±$Xm | $Xbn | Acc/Dist |
| BITB | Bitwise | ±$Xm | $Xbn | Acc/Dist |
| **Total Net** | | **±$Xm** | | **↑Bullish/↓Bearish** |

### US Equity ETF Flows
| ETF | Daily Flow | Direction | Interpretation |
|-----|-----------|-----------|---------------|
| SPY (S&P 500) | ±$Xm | In/Out | Risk on/off |
| QQQ (NASDAQ) | ±$Xm | In/Out | Growth appetite |
| IWM (Small Cap) | ±$Xm | In/Out | Risk appetite signal |
| XLK (Technology) | ±$Xm | In/Out | Tech positioning |
| XLE (Energy) | ±$Xm | In/Out | Commodity/Iran play |
| XLV (Healthcare) | ±$Xm | In/Out | Defensive demand |
| XLP (Staples) | ±$Xm | In/Out | Defensive demand |
| GLD (Gold) | ±$Xm | In/Out | Safe haven |
| TLT (Long Bond) | ±$Xm | In/Out | Duration appetite |
| HYG/JNK (HY Credit) | ±$Xm | In/Out | Credit risk appetite |

**ETF Flow Summary Signal**: [Where is institutional money moving? Risk-on into equities? Defensives? Safe haven bonds/gold?]

### Sector Rotation Read (ETF Flows)
> [1-2 sentences: Which sectors are seeing institutional inflows vs outflows today? Any rotation pattern?]

---

## 2B. Dark Pool & Block Trade Activity

*Source: Unusual Whales / Fintel dark pool prints*

### Notable Dark Pool Prints (Today)
| Ticker | Block Size | Price | Direction | Interpretation |
|--------|-----------|-------|-----------|---------------|
| [Ticker] | $Xm | $X.XX | Above/Below mkt | Accumulation/Distribution |

**Dark Pool Signal**: [Any unusual concentration in a specific ticker or sector?]

---

## 2C. SEC Filings — 13D / 13G (Activist/Large Stakes)

*Source: EDGAR — any new filings in past 7 days*

### New Large Ownership Filings
| Filer | Target | % Stake | Filing Type | Interpretation |
|-------|--------|---------|-------------|---------------|
| [Fund Name] | [Ticker] | X% | 13D (active) / 13G (passive) | [Activist intent? / Passive accumulation?] |

**Activist Signal**: [Any new campaign or position reaching critical threshold?]

---

## 2D. Short Interest Updates

*Source: Fintel, FINRA TRACE (bi-monthly), Ortex (if available)*

| Ticker | Short Interest % | Change vs Prior | Interpretation |
|--------|-----------------|-----------------|---------------|
| [Ticker] | X% | ±X% | Rising short = bearish conviction / Falling = short cover rally risk |

**Short Squeeze Risk**: [Any tickers with high SI + rising price = squeeze setup?]
**High-Conviction Short Signal**: [Any big new short position in a name relevant to portfolio?]

---

## 2E. Hedge Fund Intelligence

*Source: EDGAR 13F (quarterly), 13D/G (see Section 2C), X/Twitter, media*

### Recent Intelligence by Category

**Value & Generalist** (Berkshire, Pershing, Third Point, Greenlight):
> [Any recent filing, letter, conference comment, or media report from this group?]
> Signal: Bullish / Bearish / Mixed / No Signal

**Quant & Systematic** (Bridgewater, AQR, Two Sigma, DE Shaw):
> [Any public research, factor data, or positioning commentary?]
> Signal: Bullish / Bearish / Mixed / No Signal

**Long/Short Equity** (Tiger Global, Coatue, Viking, Lone Pine):
> [Any 13F changes, media-sourced intelligence, or conference appearances?]
> Signal: Bullish / Bearish / Mixed / No Signal

**Macro Legends** (Druckenmiller, Tudor Jones, Soros FM, Paulson):
> [Any macro commentary, interview, or media-sourced positioning?]
> Signal: Bullish / Bearish / Mixed / No Signal

---

## Institutional Intelligence Composite

| Source | Signal | Strength | Key Read |
|--------|--------|----------|----------|
| BTC ETF Flows | 🟢/🔴/🟡 | H/M/L | |
| US Equity ETF Flows | 🟢/🔴/🟡 | H/M/L | |
| Dark Pool Activity | 🟢/🔴/🟡 | H/M/L | |
| Activist/13D Filings | 🟢/🔴/🟡 | H/M/L | |
| Hedge Fund Intel | 🟢/🔴/🟡 | H/M/L | |

**Institutional Composite Signal**: Accumulation / Distribution / Rotation / No Clear Signal
> [1-2 sentences: What is smart money collectively doing?]

---

## Memory Updates

`memory/institutional/flows/ROLLING.md`:
```
## {{DATE}}
- ETF flows: [dominant direction + key ETF with biggest move]
- BTC ETF: [net flow today — accumulation or distribution?]
- Dark pool: [any notable block print?]
```

`memory/institutional/hedge-funds/ROLLING.md`:
```
## {{DATE}}
- HF consensus signal: [Bullish/Bearish/Mixed]
- Any notable 13D/G or new position: [fund + target + thesis]
- Short interest: [any notable change in tracked names]
```
