# Risk Management & Drawdown — Deep Dive

> Detailed notes on papers covering risk management, drawdown, volatility targeting, and
> portfolio protection strategies. These inform position sizing discipline and exit rules.

---

## Lo, Mamaysky & Wang (2000) — Technical Analysis Has Predictive Power

**Full Citation**: Andrew W. Lo, Harry Mamaysky, and Jiang Wang. "Foundations of Technical Analysis: Computational Algorithms, Statistical Inference, and Empirical Implementation." *Journal of Finance*, Vol. 55, No. 4, pp. 1705–1770.

### Why Include This?
The Faber 10-month SMA filter is a technical analysis rule. This paper provides rigorous
statistical testing of whether technical patterns have predictive power, lending credibility
to SMA-based rules.

### Finding: Technical Patterns Provide Incremental Information
Using nonparametric kernel regressions to detect technical patterns (head-and-shoulders, support/resistance, moving averages), Lo et al. find:
- Technical patterns have statistically significant return-predicting power even after controlling for fundamental factors
- The marginal predictive power is modest (not a "secret formula") but consistent
- Moving average crossovers (the family of rules Faber applies) are among the more robust technical signals

### Why SMAs Work (Beyond Representativeness)
1. **Trend confirmation**: The 200-day SMA identifies whether the long-term fundamental backdrop supports prices. Price above SMA = positive macro trajectory; price below = deteriorating.
2. **Self-fulfilling**: Many institutional investors use 200-day SMA as a reference point → their behavior around it creates actual support/resistance that makes the signal partially self-fulfilling
3. **Momentum encoding**: The SMA is equivalent to a weighted average of the last 200 days' returns. Price > SMA ↔ momentum is positive over that window.

### Application Notes
- The Faber SMA rule is not mere technical superstition; it has academic backing from both the trend-following literature (Moskowitz, Hurst) and technical analysis research (Lo et al.)
- The 200-day SMA is widely watched → acts as a focal point for institutional decision-making

---

## Ang & Chen (2002) — Asymmetric Correlations

**Full Citation**: Andrew Ang and Joseph Chen. "Asymmetric Correlations of Equity Portfolios." *Journal of Financial Economics*, Vol. 63, No. 3, pp. 443–494, 2002.

### Main Finding: Correlations Rise in Bear Markets
Portfolio correlations are NOT constant. Specifically:
- In bull markets (when both assets rising): correlations are lower (~0.4 between US sectors)
- In bear markets (when both assets falling): correlations are higher (~0.7)

This is called **asymmetric correlation** or the "correlation breakdown" problem.

### Why This Matters for Diversification
The whole point of diversification (Markowitz) is that low correlation reduces portfolio variance.
If correlations RISE just when you need diversification most (in a crisis), the protection is
smaller than expected.

**Practical implication**: A portfolio that appears 40% less volatile than its components in normal times
may only be 15-20% less volatile during a market crash.

### Which Assets Maintain Their Negative/Zero Correlation in Crashes?
- **US Treasuries**: INCREASE in negative correlation with equities during crashes (flight to quality)
- **Gold**: Maintains or improves negative correlation with equities during extreme events (Baur & Lucey)
- **BIL (T-bills)**: Completely uncorrelated with equities in all regimes (pure cash)
- **Energy equity (XLE)**: Correlation with SPX RISES during crashes (falls along with market)
- **Oil/DBO**: Depends on type of crash: supply-shock crash → DBO and equities diverge (good); demand-shock crash → both fall (no protection)

### Application Notes for This System
- IAU + BIL are the genuine crisis diversifiers — they maintain their protective characteristics when correlations rise
- XLE provides energy-specific diversification but is NOT a crisis hedge — it falls with equities in a demand-shock recession
- In a crash scenario, the portfolio's effective protection comes from IAU 20% + BIL 32% + SHY 15% = 67% of assets — the equity sector ETFs (XLE, XLV, XLP) will likely all fall together
- This justifies a higher-than-normal cash allocation during regime uncertainty: asymmetric correlations make equity diversification less reliable than advertised

---

## Ilmanen & Kizer (2012) — "The Death of Diversification Has Been Greatly Exaggerated"

**Full Citation**: Antti Ilmanen and Jared Kizer. "The Death of Diversification Has Been Greatly Exaggerated." *Journal of Portfolio Management*, Spring 2012.

### Context
After the 2008 crisis, many practitioners declared "diversification is dead" — every asset class fell simultaneously. Ilmanen & Kizer challenge this conclusion.

### Arguments for Diversification Still Working
1. **Asset class diversification DID fail in 2008** — but only temporarily. By 2009, correlations returned to normal.
2. **Factor diversification DID work in 2008**: Momentum strategy (TSMOM) was positive. Low-volatility equities outperformed. Commodities (pre-collapse) provided protection.
3. **The correct diversification is FACTOR diversification, not asset class diversification**

### The Lesson
Asset classes (equities, bonds, real estate) often share common factor exposures (market beta,
economic growth sensitivity). During crises, the shared factor loading (economic growth) dominates
and correlations spike.

Factor-based diversification (momentum + value + carry + trend) is more robust because the
factors are DESIGNED to be uncorrelated by construction.

### Application Notes for This System
- The system is partially factor-based (momentum signals, carry from BIL yield) rather than purely asset-class based
- Adding a value screen (sector P/E vs history) would add a second factor dimension that is negatively correlated with momentum — exactly the Asness et al. (2013) finding
- The 47% BIL/SHY allocation is a "carry factor" position (earning 5%+ yield with minimal duration risk)

---

## Kaminski & Lo (2014) — "When Do Stop-Loss Rules Stop Losses?"

**Full Citation**: Kathryn Kaminski and Andrew W. Lo. "When Do Stop-Loss Rules Stop Losses?" *Journal of Financial Markets*, Vol. 18, pp. 234–254, 2014.

### Main Question
Do stop-loss rules (systematic exit when a position falls X% from entry) actually improve returns?

### Finding: Stop-Losses Reduce Drawdowns But Also Reduce Returns
- Stop-losses work by cutting exposure during trend-following regimes: they exit losing positions before the loss grows larger
- However, in mean-reversion regimes, stop-losses repeatedly exit positions just before recovery → drag on returns
- The net effect depends on the ratio of trend-following to mean-reverting episodes in the data

### When Stop-Losses ADD Value
- Markets with sustained directional trends (commodities, FX during macro shocks)
- Assets with negative serial correlation beyond 12 months (momentum eventually reverses)
- After large drawdowns: stop-losses prevent "riding losers" to zero

### When Stop-Losses DESTROY Value
- Mean-reverting environments: choppy range-bound markets
- Highly liquid, quickly-recovering assets: selling at the bottom misses the V-recovery

### Application Notes for This System
- The system uses a "thesis invalidation" stop rather than a price-level stop. This is arguably better: more robust to whipsaw because exits are triggered by fundamental changes (WTI <$80 vs entry price anchor)
- Thesis stops are forward-looking (about expected returns) rather than backward-looking (about past losses)
- The momentum signal serves as a soft stop: negative 12M momentum is a systematic exit signal that has research support independent of entry price

---

## Roncalli & Weisang (2016) — Portfolio Concentration and Risk

**Full Citation**: Thierry Roncalli and Guillaume Weisang. "Portfolio Diversification, Risk Budgeting, and Alternative Beta Strategies." *Journal of Financial Transformation*, 2016. Related: Roncalli's *Introduction to Risk Parity and Budgeting* (2013).

### Risk Budgeting Framework
Rather than allocating portfolio by weight, allocate by **risk contribution**:
- Each position should contribute a similar fraction of the portfolio's total variance
- A "risk parity" portfolio: every asset contributes 1/N of total risk

### Why Risk Parity vs. Equal Weighting
Equal weight (20% per asset) does NOT equal equal risk contribution:
- A 20% allocation to XLE (σ ≈ 22%) contributes much more risk than a 20% allocation to BIL (σ ≈ 0.3%)
- In the current portfolio: IAU (20%), XLE (12%), DBO (5%), XLV (8%), XLP (8%), BIL (32%), SHY (15%)

### Risk Contribution Analysis (Approximate)

| ETF | Weight | Vol (σ) | Risk Contribution | % of Total Risk |
|-----|--------|---------|-------------------|----------------|
| IAU | 20% | 15% | 3.0%² | ~28% |
| XLE | 12% | 22% | 2.64%² | ~25% |
| DBO | 5% | 20% | 1.0%² | ~9% |
| XLV | 8% | 12% | 0.96%² | ~9% |
| XLP | 8% | 10% | 0.8%² | ~7% |
| BIL | 32% | 0.3% | 0.096%² | ~1% |
| SHY | 15% | 2% | 0.3%² | ~3% |
| **Total** | **100%** | | ~8.8%² | **~82%** |

*Note: ignoring correlation cross-terms for simplicity*

**Finding**: Despite being 47% of the portfolio by weight, BIL+SHY contributes <5% of portfolio risk.
IAU (20% weight) and XLE (12% weight) together contribute ~53% of risk.

### Application Notes for This System
- The portfolio appears "defensive" due to high cash weight, but the risk profile is dominated by IAU and XLE
- If the gold or energy thesis is wrong, the portfolio will suffer disproportionate losses despite the high cash allocation
- The max 20% cap per position provides some risk constraint, but a risk-budget check would also suggest not holding both XLE (12%) and DBO (5%) simultaneously unless the combined risk contribution is accepted
- For the PM Phase B clean-slate construction: consider expressing intended risk budget ("I want no more than 30% of portfolio risk in any single theme") alongside weight targets

---

## Conclusions for Risk Management in This System

### The Risk Budget Framework Applied
| Risk Theme | Current Weight | Approx Risk Contribution | Target in Stagflation Regime |
|-----------|---------------|------------------------|------------------------------|
| Geopolitical/gold safe haven | 20% (IAU) | ~28% of risk | Accept: thesis-driven |
| Energy/commodity | 17% (XLE+DBO) | ~34% of risk | Accept: supply shock regime |
| Defensive equity | 16% (XLV+XLP) | ~17% of risk | Accept: stagflation defensive |
| Cash/duration-free | 47% (BIL+SHY) | ~4% of risk | Accept: momentum signal negative |

If the stagflation regime shifts to deflation (demand shock + recession), transition:
1. Exit commodity risk (sell DBO/XLE): remove 34% risk contribution
2. Add long-duration bonds (TLT) or keep in BIL/SHY
3. Gold risk contribution increases (safe haven in deflation too — Baur & Lucey)
4. Overall portfolio risk falls dramatically

The monthly portfolio review should always include a quick risk-contribution check to ensure
one theme (e.g., energy) hasn't grown to dominate absolute risk beyond the thesis supports.
