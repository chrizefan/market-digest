# Tactical Asset Allocation — Deep Dive

> Detailed notes on papers covering timing-based asset allocation strategies. These are the most
> directly applicable papers to this system's core methodology.

---

## Faber (2007, rev. 2013) — "A Quantitative Approach to Tactical Asset Allocation"

**Full Citation**: Mebane T. Faber. "A Quantitative Approach to Tactical Asset Allocation." *The Journal of Wealth Management*, Spring 2007. Rev. 2013. SSRN Working Paper 962461.

**Authors**: Mebane T. Faber (Cambria Investment Management)

### Abstract
Tests a simple and robust rule for timing U.S. equities and four other asset classes using 10-month
(200-day equivalent) simple moving averages (SMA). The timing rule: hold the asset when present
price > 10-month SMA; move to T-bills when price < 10-month SMA. Applied monthly at month-end.
Tested on S&P 500, EAFE (foreign developed equities), GSCI (commodities), NAREIT (REITs), and
U.S. 10-year bonds. Backtest: 1900–2012 for US equity; shorter for others.

### Methodology
- Signal: Monthly close price vs 10-month SMA (simple moving average, equal weight per month)
- Rebalancing: Monthly, end-of-month only
- Benchmark: Equal-weight buy-and-hold of the same 5 assets
- "Cash" holding when out: U.S. T-bills (proxied by fed funds rate)
- No transaction costs in original, later analyses confirm cost-adjusted conclusions hold

### Key Results

| Portfolio | Ann. Return | Sharpe Ratio | Max Drawdown |
|-----------|-------------|--------------|--------------|
| S&P 500 Buy-Hold | 9.21% | 0.34 | −83.4% (1929–1932) |
| TAA Rule (S&P only) | 10.45% | 0.72 | −26.3% |
| Equal-Weight 5-Asset B&H | 8.77% | 0.43 | −46.0% |
| TAA 5-Asset | 9.64% | 0.77 | −9.5% |

### Why It Works
1. **Trend persistence**: Asset prices trend because of serial correlation in macro fundamentals (earnings, rates) and behavioral herding
2. **Asymmetric payoff**: Avoiding the bottom 20% of a bear market (where most losses occur) is more valuable than capturing the top 20% of a bull market
3. **Simplicity is a feature**: Rule is non-parametric and hard to over-fit; 200-day SMA is publicly known threshold that self-fulfilling-prophecy helps maintain

### Robustness Analysis
- Tested lookbacks: 3, 6, 9, 10, 12 months. All show similar results; 10-month (200-day) is the sweet spot.
- Works in all five asset classes tested, not just equities
- Works internationally (UK, Japan, Germany)
- Works out-of-sample in the 2008 crisis (model would have been in T-bills by October 2008)

### Limitations
- Whipsaw: In range-bound markets, the rule generates false signals and costs ~0.5% per false trigger
- Short-term underperformance: In straight-line bull markets (2013–2019 US equities), the rule may exit early and miss some upside
- Signal latency: By design, exits *after* a trend has started. In V-shaped crashes (March 2020), the rule may re-enter too late
- Applies to month-end close only; checking prices daily to anticipate signals is not part of the research design

### Application Notes for This System
- **Primary filter**: Before any position is initiated or maintained, verify price > 10M SMA
- **ETF mapping**: IAU, XLE, DBO, XLV, XLP all benefit from this overlay. BIL/SHY are the "T-bill" equivalent
- **Monthly review**: Signal should be evaluated at month-end, not intraday or weekly
- **Threshold confirmation**: The 10M SMA filter is not binary all-or-nothing; use a 3% buffer (price must be >3% below SMA to trigger exit) to reduce whipsaw

---

## Antonacci (2012, 2016) — "Dual Momentum Investing"

**Full Citation**:
1. Gary Antonacci. "Risk Premia Harvesting Through Dual Momentum." SSRN Working Paper 2042750. 2012.
2. Gary Antonacci. *Dual Momentum Investing: An Innovative Strategy for Higher Returns with Lower Risk*. McGraw-Hill Education, 2014.
3. Gary Antonacci. "Absolute Momentum: A Simple Rule-Based Strategy and Universal Trend-Following Overlay." SSRN:2244633. 2013.

### Concepts

**Absolute Momentum (AM)**: Compare each asset's total return over a lookback period (12 months)
to the risk-free rate (T-bill return). If the excess return is positive, maintain a long position.
If negative, exit to bonds or T-bills. Acts as a time-series momentum / trend filter. Purpose:
sidestep sustained bear markets.

**Relative Momentum (RM)**: Among a peer group of assets (e.g., US equities vs international),
buy the one with the highest trailing 12-month return. Classic cross-sectional momentum.

**Dual Momentum**: Apply both filters simultaneously. First, rank by relative momentum to select
the best asset in the class. Then apply absolute momentum: if the winner has negative absolute
momentum, exit to the "safe" asset instead (bonds or T-bills).

### Global Equities Momentum (GEM) — Flagship Strategy
- Universe: US equities (S&P 500), non-US equities (EAFE), US aggregate bonds
- Step 1: Is US equity 12M return > T-bills? If no → bonds
- Step 2: Is US equity 12M return > EAFE 12M return? If yes → US equity; if no → EAFE equity
- Result (1974–2013): 17.4% annualized return; Sharpe 0.87; Max drawdown −22%
- vs S&P 500 buy-hold: 10.9% / 0.34 Sharpe / −51% drawdown

### Why Absolute Momentum Drives the Outperformance
- Absolute momentum exits equities during sustained downtrends (2000–2002, 2008)
- In 2008: AM would have been in bonds by November 2007 at the latest
- Relative momentum alone (without AM) does not protect against bear markets — it just picks the "best" asset, which may still decline 40%
- AM alone underperforms pure AM+RM because AM occasionally misses sector rotation opportunities

### Lookback Period Robustness
- 12-month lookback: optimal and most robust
- 6-month: slightly higher return, higher turnover, less stable
- 3-month: excessive whipsaw
- Skipping last month: marginal improvement (avoids short-term reversal), consistent with cross-sectional literature

### Asset Class Implementations
Antonacci documents working implementations for:
- Equities (GEM above)
- Bond Factor (US credit vs Treasuries)
- Real Assets (REIT vs commodity vs bonds)
- Economic Stress (equities vs gold vs bonds)

### Application Notes for This System
1. **IAU**: 12M return vs T-bill rate → positive → validates hold; continue monitoring monthly
2. **XLE, DBO**: apply dual momentum — relative rank within energy complex; absolute filter vs T-bills
3. **BIL/SHY**: "safe" asset when absolute momentum triggers exit from risk assets; prefer BIL when yield > SHY and rising rate environment
4. **Combined filter**: An asset should be held at 10-15% weight if AND only if:
   - Price > 10M SMA (Faber filter)
   - 12M return > T-bill return (Antonacci absolute momentum)
   - Thesis is not invalidated
   - All three conditions must hold for full conviction allocation

---

## Shiller (1981, 2015) — Excess Volatility and Irrational Exuberance (TAA Underpinning)

**Full Citation**: Robert J. Shiller. "Do Stock Prices Move Too Much to Be Justified by Subsequent Changes in Dividends?" *American Economic Review*, Vol. 71, pp. 421–436, 1981.

### Relevance to TAA
Shiller demonstrated that stock prices are ~5× more volatile than the present value of actual
future dividends warrants. This excess volatility provides the theoretical justification for
tactical asset allocation: if prices diverge from fundamentals with mean-reversion, systematic
timing rules can exploit the divergence.

The CAPE (Cyclically Adjusted P/E) ratio, also Shiller's, measures aggregate equity valuation
by comparing current prices to 10-year average earnings. Historically, high CAPE → poor 10-year
forward returns. CAPE is a slow mean-reversion signal (10-year horizon), not a tactical timing tool.

### System Implications
- Excess volatility is the mechanism that creates momentum — prices overshoot, creating trends, then mean-revert
- The 10-month SMA and 12-month momentum window are designed to capture the intermediate-term
  momentum phase (before mean-reversion begins)
- At extreme valuations (CAPE > 30 for US equities), the expected 10-year return is low → reduce equity ETF weightings even if short-term momentum is positive
