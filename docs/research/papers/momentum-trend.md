# Momentum & Trend Following — Deep Dive

> Detailed notes on papers documenting momentum and trend-following return premia across asset
> classes. These papers provide the theoretical foundation for signals used in this system.

---

## Jegadeesh & Titman (1993) — "Returns to Buying Winners and Selling Losers"

**Full Citation**: Narasimhan Jegadeesh and Sheridan Titman. "Returns to Buying Winners and Selling Losers: Implications for Stock Market Efficiency." *Journal of Finance*, Vol. 48, No. 1, pp. 65–91.

### Summary
The foundational paper for cross-sectional momentum. Portfolios formed on 3-to-12-month past
returns show strong predictability: winner portfolios (top decile) outperform loser portfolios
(bottom decile) by approximately 1% per month over the subsequent 3–12 months. The effect reverses
over 2–5 years. Momentum is not explained by the Fama-French 3-factor model.

### Methodology
- Universe: NYSE and AMEX stocks, 1965–1989
- Formation period: 3, 6, 9, or 12 months
- Holding period: 3, 6, 9, or 12 months
- Portfolios: Decile sorts on prior return; long top decile, short bottom decile
- Skip last month: returns are stronger when skipping the most recent month (avoids short-term reversal)

### Key Results

| Formation | Holding | Monthly Return |
|-----------|---------|----------------|
| 3M | 3M | 0.76% |
| 6M | 6M | 1.00% (baseline) |
| 12M | 3M | 1.31% |
| 12M | 12M | 0.85% |

The 6M/6M strategy (6-month formation, 6-month holding) is the most widely cited. The 12M/3M
variant shows the strongest results.

### Why Momentum Exists
Jegadeesh & Titman propose several mechanisms:
1. **Underreaction**: Investors initially underreact to positive earnings surprises; prices drift
   upward as information is gradually incorporated
2. **Herding**: Institutional investors follow each other into winning stocks, creating momentum
3. **Anchoring**: Investors anchor to old prices and adjust slowly to new fundamentals
4. **Short-sale constraints**: Bad news about losers may be known but not acted on due to short-selling costs

### Long-Run Reversal
The same portfolios that showed positive 6–12-month returns show negative returns over the
subsequent 2–5 years (DeBondt & Thaler 1985 reversal). This suggests:
- Momentum is a medium-term phenomenon, not a permanent edge
- Mean-reversion occurs: the initial underreaction is eventually corrected
- Holding momentum positions beyond 12 months without fresh signals risks catching the reversal

### Application Notes for This System
- **Cross-sectional sector ranking**: Rank XLE, XLV, XLP, XLK, XLF, XLI by 12M return to determine relative conviction
- **Skip last month**: When calculating trailing return for ranking, use month T-1 through month T-13
- **Don't extend holds** beyond the momentum signal horizon: thesis must be revalidated every 6-12 months or the earlier research suggests holding past economic merit

---

## Moskowitz, Ooi & Pedersen (2012) — "Time Series Momentum"

**Full Citation**: Tobias J. Moskowitz, Yao Hua Ooi, and Lasse H. Pedersen. "Time Series Momentum." *Journal of Financial Economics*, Vol. 104, pp. 228–250.

### Summary
Documenting "time series momentum" (TSMOM) — where each asset's OWN past return predicts
its own future return (not relative to peers). Tested on 58 diverse futures and forward
contracts (equity indices, currencies, commodities, sovereign bonds) from 1985–2009.
The past 12-month excess return is a significant positive predictor of the next month's return.
The effect persists for ~12 months then partially reverses.

### What Makes TSMOM Different from Cross-Sectional Momentum
- **Cross-sectional (Jegadeesh-Titman)**: Winner beats loser RELATIVE to each other
- **Time-series (TSMOM)**: Asset beats ITSELF from last year — own price prediction of own future price
- TSMOM is positive for every one of the 58 contracts tested — no exceptions
- You can implement TSMOM long-only: simply go long assets with positive 12M returns and avoid assets with negative 12M returns

### Mechanism: Auto-Covariance
The dominant statistical force is positive auto-covariance between a security's next-month return
and its lagged 1-year return. In plain English: being up over the last year makes next month more
likely to be up. This is consistent with slow information diffusion, underreaction to macro trends,
and technical feedback from trend-followers.

### Performance Statistics (1985–2009)
- Average annualized return (TSMOM long/short): ~16.5% gross
- Sharpe ratio: ~1.0 (unusually high for a systematic strategy)
- Max drawdown: −17% (1990 Gulf War-adjacent period)
- Performance in equity drawdown months (worst decile): positive average (+8% annualized)

### Asset Class Breakdown
TSMOM is positive and statistically significant in:
- **Equity index futures**: S&P 500, DAX, Nikkei, FTSE, etc.
- **Commodity futures**: crude oil, gold, silver, copper, grains, livestock
- **Fixed income futures**: US 2/5/10yr, Bunds, JGBs, Gilts
- **Currency forwards**: all major G10 pairs

### Reversal After 12 Months
A momentum position held for 12 months then reverses partially over the following 24 months.
Implication: the optimal holding period for a TSMOM strategy is 1–3 months, with monthly
re-evaluation based on the refreshed 12-month lookback signal.

### Application Notes for This System
- **IAU**: TSMOM signal = is 12M total return > 0? (Yes → hold; No → exit, consistent with Faber+Antonacci)
- **XLE**: As of current setup (post-Iran War supply shock), XLE 12M momentum is positive. Holds.
- **DBO**: Oil futures TSMOM is documented as one of the strongest in the 58-contract sample — DBO directly implements a rules-based futures approach
- **BIL vs SHY**: 12M total return comparison; higher total return favors allocation
- **Monthly update**: Recalculate 12M trailing return each month at month-end; signals should not be evaluated intraday

---

## Hurst, Ooi & Pedersen (2017) — "A Century of Evidence on Trend-Following Investing"

**Full Citation**: Brian K. Hurst, Yao Hua Ooi, and Lasse H. Pedersen. "A Century of Evidence on Trend-Following Investing." *Journal of Portfolio Management*, Fall 2017. AQR Capital Management.

### Summary
Extends the trend-following backtest to 1880 using historical data for UK and US equities, bonds,
currencies, and commodities. The time series momentum strategy (TSMOM) is consistently profitable
across all 110 years of data through: WWI, WWII, the Great Depression, the 1970s oil crisis,
the 2000–2002 dot-com bear market, and the 2008 GFC. The strategy performs especially well
during equity bear markets.

### Data Sources and Construction
- Equity: UK and US stock indices back to 1880
- Bonds: UK and US 10-year government bonds
- Commodities: UK commodity index, US grains and livestock
- Currencies: USD/GBP exchange rate
- Strategy: Monthly lookback of 12 months; long if positive, short if negative (or flat for long-only)
- All returns in USD; not risk parity adjusted

### Performance by Decade

| Period | US Equity Return | TSMOM Return | Key Events |
|--------|-----------------|--------------|------------|
| 1880s–1900 | ~5.5% | ~11.2% | Gilded Age industrialization |
| 1920s | +19% | +17% | Bull market, momentum in up-direction |
| 1930s | −7% | +20% | Bear market — TSMOM exits equities |
| 1940s | +9% | +12% | WWII recovery |
| 1970s | +6% | +25% | Oil crisis — commodity trend |
| 2000–2002 | −46% | +35% | Tech bust — TSMOM exits/shorts equities |
| 2008 | −37% | +18% | GFC — TSMOM exits equities early |
| 2010s | +14% | +3% | QE era — low volatility, no sustained trends |

### The 2010s Underperformance — Why and What It Means
Post-2008 central bank intervention compressed spreads and synchronized asset correlations.
Coordinated QE → all assets rising together → no trend divergence between asset classes →
TSMOM signal-to-noise ratio collapses. This was historically unusual but not unprecedented
(similar compression occurred in late 1920s and late 1990s tech bubble). The strategy did not
"break" — it entered a low-trend regime.

### Post-QE Recovery Outlook
The paper notes that conditions driving the 2010s underperformance (low rates, low volatility,
QE) either reversed or became unstable from 2022 onwards. Rising rates → fixed income diverges
from equity (bond-equity correlation turns negative → trend opportunities return). Geopolitical
shocks (2022 Ukraine, 2024–2025 Iran War) create commodity trend divergences.

### Application Notes for This System
- **Current regime (2025)**: Rising rates + geopolitical commodity shocks = favorable trend environment. Trust momentum signals.
- **Low-trend watch**: If VIX falls below 12, Fed restarts QE, and all asset correlations converge → reduce conviction on momentum signals
- **100-year durability**: The trend-following approach has the longest out-of-sample track record of any systematic strategy. This is not arguable.
- **Crisis hedge function**: Historical data confirms that trend-following (long assets with positive TSMOM, exit/short negative TSMOM) performs best when traditional portfolios suffer most. This is the key role of the BIL/SHY + commodity + gold positioning.

---

## Asness, Frazzini, Israel & Moskowitz (2014) — "Fact, Fiction and Momentum Investing"

**Full Citation**: Clifford S. Asness, Andrea Frazzini, Ronen Israel, and Tobias J. Moskowitz. "Fact, Fiction and Momentum Investing." *Journal of Portfolio Management*, Fall 2014. AQR Capital Management.

### Summary
Systematic refutation of 10 common myths about momentum investing. Uses 212 years of US
equity data (Global Financial Data, 1801–2012) plus 40+ country datasets and 12+ asset classes.
Finds that the momentum premium is robust to all major critiques.

### The 10 Myths Refuted

| Myth | Reality |
|------|---------|
| 1. Momentum is too small | Annual premium 4–8% in equities, larger in other assets |
| 2. Works only on short side | Long-only momentum still significantly improves risk-adjusted returns |
| 3. Works only in small caps | Equally strong in large-cap S&P 500 stocks and indices |
| 4. Doesn't survive trading costs | With reasonable assumptions (0.3% round-trip), momentum survives |
| 5. Already arbitraged away | Out-of-sample evidence since 1997 publication remains strong |
| 6. Works in US only | Documented in 40+ countries and all major asset classes |
| 7. Too short a sample | 212 years of data; works in Victorian-era UK equities |
| 8. Risky strategy | Long-only momentum has similar volatility to equity market |
| 9. Momentum crash risk too high | Crashes are rare and severity overstated; EW-diversification helps |
| 10. No theory behind it | Multiple competing theories (behavioral + rational risk factors) |

### On Momentum Crashes
The most serious critique is momentum crashes — sudden sharp reversals (e.g., March 2009
+18% in 1 month for losers). The paper acknowledges these are real but argues:
1. They are infrequent (occurred ~5 times in 212 years)
2. They follow very specific conditions: deep market bear market followed by sharp V-recovery
3. They can be partially mitigated by reducing leverage after large market drawdowns

### Asset-Class Momentum (Most Relevant to This System)
For long-only ETF rotation (buying the winning asset class, avoiding the losing one):
- Transaction costs are minimal (monthly rebalance, liquid ETFs)
- No short side needed
- The momentum crash risk is much lower because individual asset classes are more diversified than single stocks

### Application Notes for This System
- The system's ETF rotation approach (choosing between XLE vs XLV vs XLK based on trailing returns) is academically validated
- Monthly rebalancing is cost-efficient for ETFs (typical spread <0.05%; no market impact from small portfolio)
- The momentum crash scenario for this system: a sudden peace deal (Iran ceasefire) triggering a sharp risk-on reversal. Current tail risk to watch.
- Counter: maintain at least 10-15% in defensive cash (BIL) so a 20% market rally doesn't cause a >10% drawdown while repositioning

---

## Asness, Moskowitz & Pedersen (2013) — "Value and Momentum Everywhere"

**Full Citation**: Clifford S. Asness, Tobias J. Moskowitz, and Lasse H. Pedersen. "Value and Momentum Everywhere." *Journal of Finance*, Vol. 68, No. 3, June 2013. SSRN:2174501.

### Summary
Documents both value and momentum premia across 8 markets and asset classes: individual stocks
in the US, UK, Europe, Japan; equity index futures; government bonds; currencies; commodity
futures. Creates 48 test assets (6 per market × 8 markets). Both premia are statistically
and economically significant everywhere.

### The Value-Momentum Diversification Finding
Value and momentum are strongly **negatively correlated** (r ≈ −0.50 to −0.65 across asset classes).
This means:
- When momentum is working (trend environment), value is often underperforming
- When value is working (mean-reversion environment), momentum is often struggling
- **A 50/50 blend of value and momentum has a Sharpe ratio approximately 2× higher than either alone**

### Common Factor Structure
Despite being distinct strategies in different assets, value and momentum returns across the
8 markets share a common factor structure. The dominant shared risk factors are:
1. **Funding liquidity risk** (Brunnermeier & Pedersen 2009): When funding conditions tighten,
   both leveraged value and momentum trades are unwound simultaneously
2. **Sentiment/risk appetite**: Global risk-on/risk-off swings affect all markets simultaneously

### Why This Matters for Cross-Asset Rotation
The cross-asset correlation of momentum strategies is actually positive (momentum works broadly at
the same time across assets), while the correlation of momentum with value is negative within
each asset class. Implication: you cannot fully diversify momentum by combining different
asset-class momentum strategies — they all crash together in a market recovery.

### Application Notes for This System
- Pure momentum ETF rotation (this system) is exposed to the momentum crash scenario globally
- Adding a value screen (e.g., sector P/E or P/CF vs 10-year history) partially hedges this
- For sector ETF value screen: compare sector P/E to its own 10-year history. If sector 12M momentum is positive AND P/E is below 5-year average → highest conviction
- For IAU value screen: real yield (TIPS yield) serves as the "valuation" indicator for gold
