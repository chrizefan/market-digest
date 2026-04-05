# Hedge Fund Registry

Track the following funds for intelligence signals. Use this file as the reference list for `skills/institutional/SKILL-hedge-fund-intel.md`.

---

## Category 1: Value & Generalist

| Fund | Manager | SEC CIK | X/Twitter | Style | Key Focus |
|------|---------|---------|-----------|-------|-----------|
| Berkshire Hathaway | Warren Buffett | 0001067983 | — (no official X) | Long-only value | Large cap US equity, insurance float |
| Pershing Square | Bill Ackman | 0001336528 | @BillAckman | Activist value | Concentrated, public campaigns |
| Third Point | Dan Loeb | 0001040273 | — | Activist/event-driven | Letters, quarterly 13F |
| Greenlight Capital | David Einhorn | 0001079650 | — | Short-selling + value | Quarterly letters, earnings shorts |

---

## Category 2: Quant & Systematic

| Fund | Manager | SEC CIK | X/Twitter | Style | Key Focus |
|------|---------|---------|-----------|-------|-----------|
| Bridgewater Associates | Ray Dalio | 0001350694 | @RayDalio | Global macro systematic | All-weather, risk parity |
| AQR Capital | Cliff Asness | 0001112520 | @CliffordAsness | Factor quant | Momentum, value, carry, low vol |
| Two Sigma | David Siegel / John Overdeck | 0001441116 | — | Data-driven quant | ML-based models |
| DE Shaw | David Shaw | 0001009207 | — | Systematic multi-strat | Options, stat arb |

---

## Category 3: Long/Short Equity

| Fund | Manager | SEC CIK | X/Twitter | Style | Key Focus |
|------|---------|---------|-----------|-------|-----------|
| Tiger Global | Chase Coleman | 0001167483 | — | Growth L/S equity | Technology, growth |
| Coatue Management | Philippe Laffont | 0001336157 | — | Growth L/S | Tech, semiconductors |
| Viking Global | Andreas Halvorsen | 0001103804 | — | Fundamental L/S | Consumer, healthcare, tech |
| Lone Pine Capital | Stephen Mandel | 0001048990 | — | Fundamental L/S | Global diversified |

---

## Category 4: Macro Legends

| Fund | Manager | SEC CIK | X/Twitter | Style | Key Focus |
|------|---------|---------|-----------|-------|-----------|
| Duquesne Family Office | Stanley Druckenmiller | 0001536403 | — | Discretionary macro | High-conviction macro bets |
| Tudor Investment | Paul Tudor Jones | 0001267048 | — | Discretionary macro | Technical macro trading |
| Soros Fund Management | George Soros / Dawn Fitzpatrick | 0001029160 | — | Reflexivity macro | Global macro, FX |
| Paulson & Co | John Paulson | 0001358190 | — | Event-driven macro | Credit, mergers, gold |

---

## Data Sources

**13F Filings (Quarterly — 45 days after quarter end)**:
- EDGAR full-text search: https://efts.sec.gov/LATEST/search-index?q=%22[fund name]%22&dateRange=custom&startdt=[date]&enddt=[date]&forms=13F-HR
- WhaleWisdom: https://whalewisdom.com (aggregated 13F data)
- 13F.info: https://13f.info

**Alternative / More Frequent Signals**:
- 13D/13G filings (ownership >5%): EDGAR — watch for activist positions building
- Form 4 (insider): not applicable for most funds, but board-level insiders at holdings
- Letters / Conference appearances: quarterly letters, conferences (Sohn, SALT, Delivering Alpha)
- X/Twitter: only Ackman and Dalio are frequent direct signal sources
- Bloomberg / FT reporting: watch for journalist-sourced fund positioning stories

---

## Usage in SKILL-hedge-fund-intel.md

1. Scan EDGAR for any 13D/G/F filings in the last 7 days for tracked CIKs
2. Check X accounts for any direct fund communications
3. Search for recent media coverage of each fund
4. Synthesize into a "HF Consensus" signal per asset class

**HF Consensus Signal**: Bullish / Bearish / Mixed / No Signal
- Bullish: 3+ funds with recent buys or positive commentary
- Bearish: 3+ funds with recent sells, shorts, or negative commentary
- Mixed: funds disagree
- No Signal: no material intelligence available
