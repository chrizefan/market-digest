# Behavioral Finance & Investment Discipline — Deep Dive

> Detailed notes on behavioral finance papers documenting the cognitive biases that destroy
> investment performance. These papers justify the anti-anchoring architecture of this system
> and inform the behavioral guardrails built into the PM and analyst skills.

---

## Tversky & Kahneman (1974) — "Judgment under Uncertainty: Heuristics and Biases"

**Full Citation**: Amos Tversky and Daniel Kahneman. "Judgment under Uncertainty: Heuristics and Biases." *Science*, Vol. 185, No. 4157, pp. 1124–1131.

### Overview
One of the most-cited papers in all of social science. Documents three cognitive heuristics that lead
to systematic, predictable biases in human judgment:

### Heuristic 1: Representativeness
*Definition*: People judge the probability of an event by how much it resembles their mental model
of a representative case, ignoring base rates.

**Bias**: Base rate neglect — ignoring how often outcomes actually occur.
- Investors who saw oil prices rise in 2008 bought energy stocks expecting continued gains (base rate: high oil price regimes last 6-18 months, not indefinitely)
- Investors see AI-related earnings beats and buy all AI-adjacent stocks (base rate: most stocks in a "hot sector" revert to mean)

**Investment manifestation**:
- Chasing performance: "This sector is up 40% — it must continue" → ignores that most 40% sectors mean-revert
- Narrative investing: A compelling story about why this asset is different → ignores statistical base rates

### Heuristic 2: Availability
*Definition*: People judge probability by how easily relevant examples come to mind.

**Bias**: Memorable, vivid, or recent events are overweighted; mundane but common risks are neglected.
- Vivid: A market crash in 2008 feels very available → investors over-hedge tail risk for years
- Iran War shock (2025): Oil spike feels permanent because the imagery is vivid

**Investment manifestation**:
- After a crisis, investors are overly defensive for too long (recency bias × availability)
- Before a crisis, famously low volatility period makes risks seem impossible (2006–2007, 2020 pre-COVID)

### Heuristic 3: Anchoring
*Definition*: Estimates are biased toward an initial "anchor" value. Even arbitrary anchors distort final estimates.

**Classic experiment**: Tversky & Kahneman spun a wheel that landed on 10 or 65, then asked subjects how many African countries were in the UN. Those who saw 65 gave much higher estimates than those who saw 10.

**Investment anchoring examples**:
- "I paid $150 for XLE; I won't sell until it gets back to $150" (entry price anchor)
- "Gold was at $2,400 last month; $2,350 seems cheap relative to that anchor" (recent price anchor)
- "The portfolio used to have 20% in tech; we should have at least 15%" (prior portfolio anchor)

**Why the PM anti-anchoring design matters**:
- Phase A/B are blinded to current portfolio weights SPECIFICALLY because of anchoring
- If the PM sees "current: IAU 20%", the bias becomes: "let's start from 20% and adjust slightly"
- Instead, we want: "what should IAU be from first principles?" then COMPARE to 20%

### Application Notes for This System
- **Availability check**: When evaluating any thesis in the digest, ask "is this conclusion driven by a compelling recent narrative, or by a systematic momentum/fundamental analysis?" If primarily narrative → apply discount
- **Representativeness check**: Before concluding "this regime looks like 2008 oil spike" → verify the historical base rates. What fraction of cases with similar conditions led to the assumed outcome?
- **Anchoring discipline**: Phase A/B blindness is mandatory — the anti-anchoring architecture is the primary defense against this bias running across dozens of review cycles

---

## Kahneman & Tversky (1979) — "Prospect Theory"

**Full Citation**: Daniel Kahneman and Amos Tversky. "Prospect Theory: An Analysis of Decision under Risk." *Econometrica*, Vol. 47, No. 2, pp. 263–291.

### Why Expected Utility Theory Fails
Classical economics assumes investors maximize expected utility U(W) where W is total wealth.
Kahneman & Tversky showed this is empirically wrong:

**Experiment**: Which do you prefer?
- A: Gain $900 with certainty
- B: 90% chance of gaining $1,000 (expected value also $900)
→ Most people choose A (risk-averse in gains)

**Experiment 2**: Which do you prefer?
- C: Lose $900 with certainty
- D: 90% chance of losing $1,000
→ Most people choose D (risk-seeking in losses)

This "reversal" cannot be explained by expected utility theory.

### Prospect Theory: Key Components

**1. Reference Point Dependence**
- Value is evaluated as GAINS and LOSSES relative to a reference point, not as absolute wealth
- Reference point is usually the status quo (the current portfolio value or entry price)
- Implication: people evaluate a $10 gain vs a $10 loss differently even if their absolute wealth positions are identical

**2. Loss Aversion**
- Losses feel approximately **2×–2.5× as bad** as equivalent gains feel good (λ ≈ 2.25)
- The loss aversion coefficient is the most robust empirical finding in behavioral economics
- Implication: investors demand a ~2.25× return on a risky position to compensate for the loss aversion (not just the actuarially fair expected value)

**3. Diminishing Sensitivity**
- The pain of a $100 loss is not 10× the pain of a $10 loss (diminishing sensitivity)
- Simliarly, the joy of a $100 gain ≠ 10× a $10 gain
- The value function is concave in gains (risk aversion) and convex in losses (risk seeking)

**4. Probability Weighting**
- Small probabilities are overweighted: people buy lottery tickets AND insurance (both have negative expected value)
- Large probabilities near 1.0 are underweighted: people aren't as upset about a 95% probability of gain vs certainty as they should be

### Behavioral Predictions for Investors

| Prediction | Behavioral Finance Description | Investment Consequence |
|-----------|-------------------------------|----------------------|
| Loss aversion | Losses hurt 2.25× more than gains | Hold losers too long; sell winners too early |
| Reference point | Evaluates vs entry price | Won't sell at a loss; "waiting to get back to even" |
| Probability distortion | Overweights small probabilities | Overpays for tail risk insurance; ignores large probability slow losses |
| Diminishing sensitivity | First dollar of loss > subsequent dollars | Catastrophic loss feels less bad than it should, enabling continued riding of losers |

### Application Notes for This System
- **Stop-loss discipline**: Define exit criteria BEFORE entering a position. Write the answer to: "under what conditions will I exit this position?" in the thesis register BEFORE investing. Prospect theory says you won't do this calmly after a 15% drawdown.
- **Rebalance threshold**: The 5% minimum weight change trigger is designed to overcome loss aversion: it forces action at a predefined threshold rather than allowing the "riding losses" behavior
- **IAU at ATH scenario**: When IAU is at all-time highs and showing positive momentum, prospect theory predicts the strong urge to "lock in profits" (risk aversion in the gain domain). Resist this instinct — use the systematic exit signals (Faber SMA + momentum) instead of emotional profit-taking
- **Post-drawdown redeployment**: After a drawdown in XLE or DBO, loss aversion creates a bias toward keeping the replacement cash position. Use the objective momentum signal to decide re-entry, not gut fear.

---

## Shefrin & Statman (1985) — "The Disposition to Sell Winners Too Early and Ride Losers Too Long"

**Full Citation**: Hersh Shefrin and Meir Statman. "The Disposition to Sell Winners Too Early and Ride Losers Too Long: Theory and Evidence." *Journal of Finance*, Vol. 40, No. 3, pp. 777–790.

### The Disposition Effect Defined
The term "disposition effect" describes the documented tendency of investors to:
1. **Sell winning positions too quickly** (above the reference price)
2. **Hold losing positions too long** (below the reference price)

This is irrational: it ignores future expected returns and is driven purely by reference-point psychology.

### Evidence
- Shefrin & Statman analyzed 10,000+ retail brokerage accounts (Odean 1998 extended with 78,000 accounts)
- Investors were 1.5× to 2× more likely to sell a stock with a gain than a stock with a loss, holding all else equal
- This ratio persisted through different market conditions and investor sophistication levels
- Professional investors also show the disposition effect, just to a lesser degree

### Why It's Doubly Harmful
The disposition effect is not just behavioral noise — it has real return consequence:
1. **Sold winners continue to outperform**: Momentum means selling winners locks out future gains
2. **Held losers continue to underperform**: Negative momentum means held losers keep falling

Odean (1998, JF) found:
- Sold winners outperformed held losers by **3.4 percentage points** in the following year
- This is a meaningful, consistent return drag from the disposition effect

### Tax Impact
The disposition effect also violates tax efficiency:
- Sell winners → realize gains → pay capital gains taxes now (costly)
- Hold losers → defer loss realization → delay tax benefit (suboptimal)
- The rational tax-minimizing strategy is the OPPOSITE: hold winners (defer gains) and harvest losses (immediate tax benefit)

### Overcoming the Disposition Effect: Practical Rules

**Rule 1: Pre-commitment to exit criteria**
Write down the exit criteria for each position BEFORE entering. The moment the criteria are met,
execute — regardless of whether the position is at a gain or loss.

**Rule 2: Forget the entry price**
The entry price is irrelevant to the forward-looking investment decision. Ask only: "Knowing what I know today, would I enter this position at the current price?" If no → exit.

**Rule 3: Momentum-follow (not momentum-fade)**
Market evidence suggests following momentum, not fighting it. When a position has turned to
negative momentum → exit. When it has positive momentum → hold, regardless of how large the gain.

**Rule 4: Systematic review**
A fixed-schedule portfolio review (monthly/quarterly) forces evaluation independent of whether
the account "feels right" — the gut avoids reviewing losing positions.

### Application Notes for This System
- **THESES.md exit criteria**: Every position in the thesis register must have explicit invalidation criteria (e.g., "exit DBO if WTI falls below $80"). This is the pre-commitment mechanism.
- **Monthly PM skill review**: The portfolio manager skill runs monthly — this systematic cadence prevents the "I'll review when it's back to even" rationalization
- **Exit any position with negative 12M momentum AND thesis violated**: Dual confirmation should override loss aversion. The data says these positions will continue to underperform.
- **Trim winning positions slowly**: The systematic approach — a 5% weight change threshold — prevents the instinct to sell IAU at ATH just because the gain feels large. Instead, only downweight when the _signal_ says to.

---

## DeBondt & Thaler (1985, 1987) — "Does the Stock Market Overreact?"

**Full Citation**: Werner F. M. DeBondt and Richard H. Thaler. "Does the Stock Market Overreact?" *Journal of Finance*, Vol. 40, No. 3, pp. 793–805, 1985. "Further Evidence on Investor Overreaction and Stock Market Seasonality," *Journal of Finance*, Vol. 42, No. 3, pp. 557–581, 1987.

### Main Finding: Long-Run Reversal
Over 3-to-5 year horizons, prior LOSERS outperform prior WINNERS:
- Top-decile stocks over 3 years → bottom-decile over the next 3 years (on average)
- This is the **reversal** that contrasts with and eventually overtakes the **momentum** effect

### Model: Representativeness Bias Causes Overreaction
- Investors overreact to recent earnings streaks (extrapolate too far)
- A company with 5 consecutive positive earnings surprises is valued as if growth is permanent
- When earnings eventually revert to mean → dramatic price decline for former "winners"

### The Momentum-Reversal Timeline

| Horizon | Effect | Mechanism |
|---------|--------|-----------|
| 0–1 month | Short-term reversal | Microstructure/liquidity |
| 1–12 months | Momentum (positive autocorrelation) | Underreaction to news |
| 12–36 months | Neutral to slight reversal | Partial correction |
| 36–60 months | Strong reversal | Mean-reversion / overreaction corrected |

### Application Notes for This System
- This system's **12–18 month position horizon** is designed to capture the momentum phase
- Do NOT extend positions beyond 18–24 months without fresh thesis invalidation check — you risk transitioning from momentum profit into reversal loss
- For long-held positions (e.g., IAU has been held for 12+ months): schedule a conviction renewal review at 12-month intervals, not automatic renewal
- The reversal evidence also validates the Faber mean-reversion: assets above their long-run fair value (high CAPE, high P/E, high commodity price) are likely to mean-revert over 3-5 years

---

## Barber & Odean (2000) — "Trading Is Hazardous to Your Wealth"

**Full Citation**: Brad M. Barber and Terrance Odean. "Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors." *Journal of Finance*, Vol. 55, No. 2, pp. 773–806.

### Main Finding: Overtrading Destroys Returns
Analyzed 66,465 household investment accounts from 1991–1996:
- Average household return: 16.4% (gross) = 11.4% (net of costs)
- S&P 500 return: 17.9%
- The most actively traded quintile earned **11.4% gross, 5.0% net** vs the least active quintile's **18.5% net**
- **Conclusion**: The more you trade, the worse you do (after costs)

### Why This Happens
1. **Overconfidence**: Investors believe their information and analysis justify trading, but it mostly doesn't
2. **Disposition effect**: Trades are driven by emotion (sell winners, hold losers) not rationality
3. **Transaction costs**: At the time, ~1% per round trip for retail. For ETFs today: 0.05–0.10% per round trip, but still meaningful for frequent traders.

### Application Notes for This System
- Monthly rebalancing (not weekly or daily) is the correct cadence
- Only rebalance when the signal is clear (≥5% weight difference OR thesis invalidated)
- The digest's daily delta is for MONITORING, not for trading — the system should not produce daily portfolio changes
- Avoiding unnecessary trades is the primary implementation of this research: the 5% threshold, the momentum-based exit criteria, and the monthly cadence all reduce overtrading

---

## Summary: The Behavioral Case for This System's Design

| Design Feature | Bias It Prevents | Paper Reference |
|---------------|-----------------|-----------------|
| Phase A/B blinded to portfolio weights | Anchoring bias | Tversky & Kahneman 1974 |
| Clean-slate portfolio construction before comparison | Reference point distortion | Kahneman & Tversky 1979 |
| Pre-committed exit criteria in THESES.md | Disposition effect (riding losers) | Shefrin & Statman 1985 |
| Momentum-based hold signals (not entry price) | Disposition effect (selling winners) | Shefrin & Statman 1985 |
| 5% threshold for rebalance action | Overtrading prevention | Barber & Odean 2000 |
| Monthly cadence (not daily) | Overtrading, availability bias | Barber & Odean 2000 |
| 12M lookback for momentum assessment | Reversal avoidance, recency bias | DeBondt & Thaler 1985 |
| Systematic signal over narrative | Availability + representativeness bias | Tversky & Kahneman 1974 |
