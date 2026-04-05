# Portfolio Construction — Deep Dive

> Detailed notes on foundational portfolio construction theory. These papers inform position
> sizing, diversification decisions, and the overall architecture of the PM skill.

---

## Markowitz (1952) — "Portfolio Selection"

**Full Citation**: Harry Markowitz. "Portfolio Selection." *Journal of Finance*, Vol. 7, No. 1, pp. 77–91, March 1952.

**Context**: This paper launched Modern Portfolio Theory (MPT) and earned Markowitz the 1990
Nobel Prize in Economics (shared with William Sharpe and Merton Miller). It is the most-cited
paper in investment management.

### Core Concept: Diversification Is Mathematical, Not Intuitive
Before Markowitz, the conventional wisdom was "don't put all eggs in one basket" without a formal
framework. Markowitz proved:

- **Portfolio variance = Σᵢ Σⱼ wᵢ wⱼ σᵢ σⱼ ρᵢⱼ**
- When ρᵢⱼ < 1 (imperfect correlation), portfolio variance < weighted average of individual variances
- This "free lunch" of diversification is mathematically guaranteed — not a statistical approximation

### The Efficient Frontier
Plot all possible portfolios in expected return / standard deviation space → a frontier exists:
- **Minimum variance frontier**: The set of portfolios minimizing variance for each return level
- **Efficient frontier**: The upper half of the minimum variance frontier (rational investors prefer this)
- **Tangency portfolio**: The portfolio with the highest Sharpe ratio (the "market portfolio" in CAPM)

For a 7-ETF portfolio (IAU, XLE, DBO, XLV, XLP, BIL, SHY), the efficient frontier tells you
which weight combination maximizes Sharpe ratio given historical correlations.

### The Error Maximization Problem
Markowitz optimization is sensitive to inputs. Small changes in expected return estimates produce
dramatically different optimal portfolios. This is called the "error maximizer" problem:
- If IAU expected return estimate is off by 1%, the optimizer might swing from a 5% to 25% position
- Estimates of expected returns are extremely uncertain (Merton 1980: impossible to estimate precisely)
- Correlation matrix is slightly more stable but also uncertain

### Practical Solutions to Error Maximization
1. **Constraints**: Cap individual positions (20% max, implemented in this system)
2. **Equal weighting**: Naïve but surprisingly robust — DeMiguel et al. (2009) show 1/N portfolio beats Markowitz out-of-sample for N<25 assets in many settings
3. **Black-Litterman prior**: Start from equilibrium and deviate only with high-conviction views
4. **Quantized weights**: The 0/5/10/15/20% system in this portfolio approximates a constrained optimization

### Correlation Table for Current Portfolio (Historical Approximation)

| | IAU | XLE | DBO | XLV | XLP | BIL | SHY |
|--|-----|-----|-----|-----|-----|-----|-----|
| IAU | 1.00 | 0.15 | 0.20 | 0.05 | 0.00 | −0.05 | 0.10 |
| XLE | 0.15 | 1.00 | 0.65 | 0.30 | 0.20 | −0.10 | 0.05 |
| DBO | 0.20 | 0.65 | 1.00 | 0.10 | 0.00 | −0.15 | 0.05 |
| XLV | 0.05 | 0.30 | 0.10 | 1.00 | 0.60 | −0.05 | 0.10 |
| XLP | 0.00 | 0.20 | 0.00 | 0.60 | 1.00 | 0.05 | 0.15 |
| BIL | −0.05 | −0.10 | −0.15 | −0.05 | 0.05 | 1.00 | 0.90 |
| SHY | 0.10 | 0.05 | 0.05 | 0.10 | 0.15 | 0.90 | 1.00 |

*Note: Approximate correlations based on 2015–2024 period. Correlations shift significantly in stress regimes.*

Key observations from the correlation table:
- XLE and DBO are highly correlated (0.65) — do not over-weight both simultaneously
- IAU has near-zero correlation with all equity sectors → genuine diversifier
- BIL/SHY are nearly perfectly correlated (0.90) → they serve the same function; no benefit to holding both unless duration risk matters
- Gold (IAU) correlation to bonds flips negative during equity stress → crisis hedge property (Baur & Lucey 5.1)

### Application Notes for This System
- The 20% single-ETF cap loosely implements a variance constraint
- XLE+DBO combined exposure should be monitored: their 0.65 correlation means 12% XLE + 5% DBO behaves like ~15% in a single energy position (from a variance contribution perspective)
- The IAU + BIL/SHY + XLV + XLP cluster provides crisis protection; the XLE + DBO cluster provides the inflation/geopolitical risk premium
- As a practical check: if BIL+SHY > 40% AND another asset has positive TSMOM, Markowitz suggests the portfolio is not on the efficient frontier — there is likely an underutilized return opportunity

---

## Black & Letterman (1992) — "Global Portfolio Optimization"

**Full Citation**: Fischer Black and Robert Litterman. "Global Portfolio Optimization." *Financial Analysts Journal*, Vol. 48, No. 5, pp. 28–43. Goldman Sachs Fixed Income Research, September 1992.

### The Problem with Pure Markowitz in Practice
When practitioners apply pure mean-variance optimization (MVO), several pathological results occur:
- The optimizer often assigns 0% or 100% to individual assets (corner solutions)
- Small return estimate changes cause radical portfolio turnover
- Investors lose confidence in and override the model, reducing its value

### Black-Litterman Solution: Bayesian Blending
BL starts from a "neutral prior" (the equilibrium return implied by CAPM equilibrium):
- **Equilibrium return** for asset i = λ × Σ × w_market (where Σ is covariance matrix, w_market is market-cap weights, λ is risk aversion)
- These equilibrium returns imply that holding the market-cap-weighted portfolio is optimal in absence of views
- **Investor views** are then expressed as: "I believe asset A will outperform asset B by X% with confidence Y"
- **Posterior returns** = weighted combination of equilibrium + investor views, weighted by uncertainty

### Key Properties
1. **Sensible default**: With no views, the model suggests holding market weights — reasonable
2. **Proportional deviation**: Strong conviction → large deviation from market weights; weak conviction → small deviation
3. **Avoids corner solutions**: Because the equilibrium provides a non-zero prior for every asset
4. **Intuitive confidence expression**: Investor specifies a confidence level for each view, not just a point estimate for expected return

### Mapping BL to the Quantized Weight System

| Conviction Level | BL Analogue | Recommended Weight |
|-----------------|-------------|-------------------|
| No thesis / negative TSMOM | Exit (below neutral) | 0% |
| Weak positive | Low confidence view | 5% |
| Moderate positive | Medium confidence view | 10% |
| Strong positive | High confidence view | 15% |
| Maximum conviction | Very high confidence + multiple signals | 20% |

### Application Notes for This System
- The PM skill's Phase B (clean-slate portfolio construction) implicitly implements BL: start from "what should the portfolio look like given pure research?" rather than current weights
- High conviction = multiple confirming signals: TSMOM positive + thesis intact + macro regime supports + Faber SMA above
- Reduce to 5% when only one signal is present; exit at 0% when TSMOM is negative (below the neutral prior for any rational investor)
- The 20% cap maps to the maximum deviation from equilibrium that BL would recommend given ~65% confidence (consistent with Kelly criterion)

---

## Kelly (1956) / Thorp (1984, 2006) — Optimal Position Sizing

**Full Citation**:
1. John L. Kelly Jr. "A New Interpretation of Information Rate." *Bell System Technical Journal*, Vol. 35, pp. 917–926, 1956.
2. Edward O. Thorp. "The Kelly Criterion in Blackjack, Sports Betting, and the Stock Market." *10th International Conference on Gambling and Risk Taking*, 1984. Republished in *Handbook of Asset and Liability Management*, North-Holland Elsevier, 2006.

### The Kelly Criterion
For a bet with:
- Probability of winning: p
- Probability of losing: q = 1 − p
- Net odds received: b (win $b for every $1 bet)

Optimal fraction of capital to bet: **f* = (bp − q) / b = p − q/b**

For a simple +1/−1 bet: f* = p − (1 − p) = 2p − 1

### Extension to Continuous Returns (Stocks)
For an asset with expected excess return μ (above risk-free) and variance σ²:
- Kelly fraction: **f* = μ / σ²**
- This is the same as the Sharpe ratio divided by σ/position (the tangency portfolio is the Kelly portfolio in continuous-time CAPM)

### Why Half-Kelly is the Practical Standard
- **Full Kelly** maximizes long-run growth but is volatile: a string of losses can cause 50%+ drawdowns even with a consistent edge
- **Half-Kelly** (f = 0.5 × f*) achieves ~87.5% of the full Kelly growth rate with ~50% lower volatility
- Virtually all professional applications use fractional Kelly (0.25× to 0.75×) rather than full Kelly
- Academic consensus: Thorp, Poundstone, Haigh — half-Kelly is the dominant practical recommendation

### Kelly Fractions for Portfolio Assets (Approximate)

Assume:
- Sharpe ratio of each ETF (excess return over risk-free / volatility):
  - IAU: ~0.35 (gold has lower Sharpe than equities but strong in current regime)
  - XLE: ~0.40 (energy equity historically cyclical)
  - DBO: ~0.30 (commodity with roll uncertainty)
  - XLV: ~0.45 (healthcare defensive)
  - XLP: ~0.40 (staples defensive)
  - BIL: ~0.10 (very low but positive)

- Individual volatility σ ≈ 15% for equity ETFs, 6% for BIL
- Kelly fraction = Sharpe / σ: XLV → 0.45/0.15 = 3.0 (dramatically over-leveraged at full Kelly)
- Half-Kelly → 1.5× leverage on XLV (still more than most practitioners use)
- **At 20% cap, we are implicitly using ~0.1× to 0.15× Kelly — well inside half-Kelly for all assets**

### Key Insight
The 20% maximum per position is a conservative position sizing rule well below Kelly. This is
appropriate given:
1. Return estimates are uncertain (Kelly is sensitive to overestimated μ)
2. No leverage is used (this is a long-only ETF portfolio)
3. We are bounded to a small universe of 7 ETFs (diversification is limited)

### Application Notes for This System
- When an asset has MULTIPLE confirming signals (TSMOM + Faber + thesis + macro regime), a 15–20% position is justified Kelly-wise
- When only ONE signal is present (e.g., TSMOM positive but Faber SMA borderline), 5–10% is appropriate
- Never exceed 20%: this system's constraint is consistent with conservative (~0.1× Kelly) position sizing
- Zero position = negative expected return per Kelly: if the momentum signal turns negative (expected return < risk-free), the Kelly fraction is 0 or negative → exit

---

## Michaud (1998) — Resampled Efficiency

**Full Citation**: Richard O. Michaud. *Efficient Asset Management: A Practical Guide to Stock Portfolio Optimization and Asset Allocation*. Harvard Business School Press, 1998.

### The Problem: Estimation Error in Optimization
Michaud quantified the "error maximization" critique of Markowitz optimization. Using Monte Carlo
simulation to sample from the uncertainty distribution of expected returns, he showed that:
- Mean-variance optimal portfolios are correct on average but have enormous variance around the true optimum
- The recommended portfolio changes dramatically from one quarter to the next due to estimation error
- Most of the "optimality" claimed by MVO is driven by data-fitting, not genuine signal

### Resampled Efficient Frontier
Michaud's solution: run the optimization multiple times using bootstrapped return samples,
then average the resulting weights. The "resampled efficient frontier" is more stable out-of-sample.

### Application Notes
- The quantized weight system (0/5/10/15/20%) is a practical implementation of resampling:
  by restricting weights to only 5 possible values, we prevent over-fitting to point estimates
- Monthly review with a 5% minimum change threshold corresponds to Michaud's finding that
  small optimization changes within the estimation error range are not meaningful
- The threshold trigger (≥5% delta) reflects the precision limit of the return estimates

---

## Ang (2014) — Asset Management: A Systematic Approach

**Full Citation**: Andrew Ang. *Asset Management: A Systematic Approach to Factor Investing*. Oxford University Press, 2014.

### Core Framework: Factor-Based Portfolio Construction
Ang argues that all risk premiums derive from underlying factors, and that the goal of asset
management is to harvest factor premia efficiently:

**The Five Canonical Factors**:
1. **Market Beta** (Mkt-RF): Equity risk premium
2. **Value** (HML): Cheap vs expensive assets
3. **Momentum** (WML/TSMOM): Past winners vs losers
4. **Illiquidity**: Premium for holding less liquid assets
5. **Volatility**: Premium for selling volatility (insurance writing)

### Bad Risks vs Good Risks
Ang distinguishes risk that is rewarded (factor exposure) from risk that is not (idiosyncratic,
concentration, bad diversification). The investor should:
- Maximize exposure to rewarded factors (market beta, value, momentum, carry)
- Minimize unrewarded risks (single-stock concentration, currency speculation without carry)

### Regime-Conditional Factor Returns
Factor premia are not constant — they vary by macro regime:
- **Momentum**: Works best in trending regimes (high VIX, trend-persistent macro)
- **Value**: Works best in mean-reversion regimes (low VIX, stable macro)
- **Market beta**: Works in growth regimes; loses in recession

### Application Notes for This System
- The ETF portfolio should be understood as a collection of factor exposures: IAU = inflation hedge/safe-haven; XLE = commodity beta + energy earnings; XLV = defensive quality factor; BIL = cash/near zero beta
- When building the clean-slate portfolio, ask: "which factors do I want exposure to?" rather than "which ETFs do I want?"
- Current regime = stagflation/geopolitical shock → momentum and inflation-hedge factors are priced; value and market-beta factors face headwinds
