# Factor Investing — Deep Dive

> Detailed notes on papers documenting systematic return factors. These inform sector ETF
> selection, conviction scoring, and the lens through which individual ETFs are analyzed.

---

## Fama & French (1993) — "Common Risk Factors in the Returns on Stocks and Bonds"

**Full Citation**: Eugene F. Fama and Kenneth R. French. "Common Risk Factors in the Returns on Stocks and Bonds." *Journal of Financial Economics*, Vol. 33, No. 1, pp. 3–56.

### The Three-Factor Model
Fama & French proposed that stock returns can be explained by three systematic risk factors:
1. **Mkt-RF** (Market excess return): The equity risk premium — compensation for systematic market risk
2. **SMB** (Small Minus Big): Return of small-cap stocks minus large-cap stocks — the size premium
3. **HML** (High Minus Low): Return of high book-to-market stocks minus low book-to-market — the value premium

Formula: E(Rᵢ) − Rf = αᵢ + βᵢ(Mkt-RF) + sᵢ(SMB) + hᵢ(HML) + εᵢ

### Size Premium (SMB)
- Small-cap stocks outperformed large-cap stocks by ~3% annualized over 1963–1991
- Risk-based explanation: small companies are more fragile in recessions, default more easily
- Behavioral explanation: small companies are neglected, harder to research → mispriced
- **Relevance**: Sector ETFs are predominantly large-cap → minimal SMB exposure. This system's ETFs don't capture size premium.

### Value Premium (HML)
- High book-to-market (value) stocks outperformed low book-to-market (growth) stocks by ~4.5% annualized
- Risk-based: value companies face greater "financial distress" risk → compensation
- Behavioral: glamour stocks (growth/tech) attract overpriced capital; boring value companies are neglected
- **Sector HML exposures**:
  - Energy (XLE): High HML loading — energy is a value sector
  - Financial (XLF): High HML loading — financial stocks are asset-heavy
  - Healthcare (XLV): Moderate-low HML loading — mix of biotech (growth) and pharma (value)
  - Staples (XLP): Low-moderate HML loading
  - Technology (XLK): Negative HML loading — growth sector

### Factor Loadings by ETF

| ETF | Market Beta | SMB | HML | Typical Interpretation |
|-----|------------|-----|-----|----------------------|
| XLE | 1.0–1.3 | +0.1 | +0.4 | High-beta value |
| XLV | 0.6–0.7 | −0.1 | +0.1 | Defensive, modest value tilt |
| XLP | 0.4–0.5 | −0.2 | +0.2 | Low-beta, value tilt |
| XLK | 1.1–1.3 | −0.2 | −0.6 | High-beta growth |
| IAU | 0.0–0.1 | 0.0 | 0.0 | Uncorrelated with equity factors |
| BIL | 0.0 | 0.0 | 0.0 | Pure cash, zero factor loading |

### Why the Three-Factor Model Doesn't Explain Momentum
Fama & French explicitly noted in 1996 that momentum (the Jegadeesh-Titman premium) is not
captured by their three factors. This was considered a "major embarrassment" to the rational
risk-based framework. Carhart (1997) added momentum as a 4th factor, and Fama & French
themselves added it (awkwardly called a 5th factor) in their 2015 model.

### Application Notes for This System
- When choosing between defensive sector ETFs (XLV vs XLP), note they have SIMILAR factor loadings — adding both provides limited incremental diversification
- XLE's high market beta means in a bear market it will fall more than the S&P 500 — appropriate for cyclical/geopolitical thesis, not for defensive positioning
- Factor exposure check: if the system is already holding IAU (zero equity factor exposure), XLV (low beta), XLP (very low beta), and BIL (zero beta) → the portfolio is heavily "short" market beta. Adding more equity exposure requires a thesis beyond just factor tilt.

---

## Fama & French (2015) — Five-Factor Model

**Full Citation**: Eugene F. Fama and Kenneth R. French. "A Five-Factor Asset Pricing Model." *Journal of Financial Economics*, Vol. 116, No. 1, pp. 1–22, 2015.

### Two New Factors
The 2015 model adds:
4. **RMW** (Robust Minus Weak): Profitable firms outperform unprofitable firms — the profitability factor
5. **CMA** (Conservative Minus Aggressive): Firms investing conservatively outperform those investing aggressively — the investment factor

### Implications
- Healthcare (XLV) has high RMW exposure: pharmaceutical companies have very high profit margins → benefit from profitability factor
- Energy (XLE) has variable RMW: high when oil prices are high (high profits) → low/negative when oil is cheap
- Staples (XLP) have high RMW and low CMA: stable profits, conservative investment → strong 5-factor positioning

### Momentum Still Not Included
Remarkably, the 2015 five-factor model still does not include momentum (WML). Fama & French
argue it has a "behavioral" rather than "rational risk" origin, and they are reluctant to
include it. This remains contentious — most practitioners include momentum regardless.

---

## Carhart (1997) — "On Persistence in Mutual Fund Performance"

**Full Citation**: Mark M. Carhart. "On Persistence in Mutual Fund Performance." *Journal of Finance*, Vol. 52, No. 1, pp. 57–82.

### Origin of the Momentum Factor
Carhart created the 4-factor model by adding a momentum factor (WML = Winners Minus Losers)
to the Fama-French 3-factor model. Primary finding: most mutual fund performance persistence
disappears once controlling for momentum — winners tend to hold highly-ranked prior-year
stocks (momentum tilt), not generate genuine alpha.

### The WML Factor Construction
- **Winners**: Top decile by 12-month return (excluding last month)
- **Losers**: Bottom decile by 12-month return (excluding last month)
- **WML return**: Long winners, short losers, equal-weighted within each group
- **Lookback**: 12 months, skipping month T-1 (skipping last month is critical)
- **Average WML return**: ~9–11% per year (1963–1993), Sharpe ratio ~0.55

### Why Skip the Last Month?
The skip is necessary to avoid "short-term reversal" contamination:
- Over the most recent 1-month horizon, prior winners tend to UNDERPERFORM (short-term reversal)
- This is likely due to market microstructure: bid-ask bounce, temporary liquidity demand
- By skipping T-1, we measure the 12-1 month return (months T-13 to T-2): this captures genuine intermediate-term momentum

### Application Notes for This System
- The "skip last month" rule applies to ETF momentum ranking as well — though it matters less for monthly-rebalanced ETF portfolios than for daily-rebalanced stock portfolios
- WML as a sector ranking: Each month, rank all sector ETFs by their 12M return (skip last month). Hold the top 2-3 with positive absolute momentum (Antonacci filter). Exit the rest.
- XLE has historically been in the top WML decile during commodity bull markets and bottom decile during commodity bears — highly cyclical momentum behavior

---

## Harvey, Liu & Zhu (2016) — "…and the Cross-Section of Expected Returns"

**Full Citation**: Campbell R. Harvey, Yan Liu, and Heqing Zhu. "...And the Cross-Section of Expected Returns." *Review of Financial Studies*, Vol. 29, No. 1, pp. 5–68.

### The Factor Zoo Problem
As of 2015, researchers had documented **316 factors** claimed to predict the cross-section of
expected stock returns. Harvey et al. demonstrate that:
- The expected number of false discoveries among these 316 factors is very high (multiple testing problem)
- When using standard t-statistic threshold (t > 2.0), we expect >50% of "significant" factors to be false
- After proper multiple-testing correction (Bonferroni, FDR), the adjusted t-statistic threshold rises to t > 3.0

### The Test
Harvey et al. evaluated all 316 factors for:
1. Statistical significance after multiple-testing correction
2. Out-of-sample evidence (did it work in newer data?)
3. Replication in international markets
4. Economic intuition

**Result**: Approximately 230–260 of the 316 factors likely represent data-mined noise.

### The Surviving Factor List (Most Robust)
The factors that clearly survive with strong theoretical + empirical support:
1. **Market beta** — obvious risk premium (Sharpe 1964)
2. **Momentum (WML/TSMOM)** — 30+ years out-of-sample, 40+ countries
3. **Value (HML)** — 30+ years, multiple international replications
4. **Profitability (RMW)** — strong economic logic, confirmed internationally
5. **Illiquidity** (Amihud 2002) — persistent premium for holding less liquid assets
6. **Carry** (in currencies and bonds) — well-documented, economic underpinning clear

### Implications for Signal Credibility

| Signal Type | Age of Evidence | Confidence Level | Use in System? |
|-------------|----------------|------------------|----------------|
| 12M momentum (TSMOM, WML) | 30+ yrs international | ⭐⭐⭐⭐⭐ | Yes |
| Faber 10M SMA | 100+ years (Hurst) | ⭐⭐⭐⭐⭐ | Yes |
| Value/HML | 30+ yrs, multiple assets | ⭐⭐⭐⭐⭐ | Yes (as supplemental screen) |
| Carry (BIL yield) | 30+ yrs currencies/bonds | ⭐⭐⭐⭐⭐ | Yes (BIL vs SHY decision) |
| Earnings surprise | Well-documented | ⭐⭐⭐⭐ | Yes for sector fundamental analysis |
| Any novel pattern <5 years | Almost certainly noise | ❌ | Do NOT use |
| Any seasonal effect / day-of-week | Likely noise | ❌ | Do NOT use |
| Machine learning "alpha" without theory | Unknown | ⚠️ | Only with very strong caution |

### Application Notes for This System
- Rely ONLY on signals listed above (momentum, value, carry, established macro models) when making portfolio decisions
- Distrust any new market prediction not anchored in multiple-cycle empirical evidence
- When the daily digest introduces a novel short-term signal ("small-cap healthcare biotech rotation") without momentum/value/macro backbone — treat with extreme skepticism before translating into portfolio change

---

## Fama (1970, 1991) — Efficient Market Hypothesis (Context)

**Full Citation**: Eugene F. Fama. "Efficient Capital Markets: A Review of Theory and Empirical Evidence." *Journal of Finance*, Vol. 25, No. 2, pp. 383–417, 1970. And "Efficient Capital Markets: II." *Journal of Finance*, Vol. 46, pp. 1575–1617, 1991.

### Why Include This?
The factors above ALL represent anomalies to the Efficient Market Hypothesis (EMH). Understanding
EMH's framework clarifies why these anomalies persist.

### EMH Versions
- **Weak form**: Prices reflect all past price information → technical analysis cannot systematically earn excess returns
- **Semi-strong form**: Prices reflect all publicly available information → fundamental analysis cannot systematically earn excess returns
- **Strong form**: Prices reflect ALL information including private → insiders cannot systematically earn excess returns

### The Joint Hypothesis Problem
Any test of the EMH is a simultaneous test of market efficiency AND the model of "normal" returns.
If we find abnormal returns, it could mean EITHER:
1. The market is inefficient (anomaly), OR
2. Our expected-return model is wrong (model misspecification)

This is why momentum/value are controversial: are they "free money" (inefficiency) or compensation
for risk not captured by CAPM (model misspecification)?

### Practical Implications
- **Weak EMH partially violated**: Momentum (which uses past price data) earns persistent excess returns. This is the primary empirical case against weak-form EMH.
- **Semi-strong EMH largely holds**: Most publicly available information IS priced in quickly. Earnings surprises are arbitraged in hours; news moves prices in milliseconds.
- **For this system**: We should NOT expect to earn excess returns from reading the same news as everyone else. Our edge, if any, comes from SYSTEMATIC application of momentum/trend signals that require behavioral/institutional discipline to maintain.

### Application Notes
- Do not expect that reading the morning digest and acting on news will generate excess returns (this violates semi-strong EMH in the absence of novel analysis)
- The system's value-add: SYSTEMATIC application of momentum rules that human investors behaviorally fail to follow (they anchor, disposition-effect-sell, and panic — as documented in behavioral finance papers)
- The digest research is useful for thesis validation and regime classification — not for predicting next-day price movements
