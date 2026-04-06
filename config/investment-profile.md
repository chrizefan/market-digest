# User Investment Profile

> Customizable investor profile that agents read to calibrate all analysis, recommendations,
> and portfolio construction. Edit any section to match your personal situation.
> Last updated: 2026-04-05

---

## 1. Investor Identity

| Field | Value |
|-------|-------|
| **Profile name** | Default |
| **Account type** | Non-registered (taxable) |
| **Home currency** | USD |
| **Base brokerage** | Interactive Brokers |
| **Tax jurisdiction** | Canada |

---

## 2. Investment Horizon

| Parameter | Setting |
|-----------|---------|
| **Primary horizon** | Short-to-medium-term (1-4 weeks, swing trading) |
| **Minimum hold period** | 1 week |
| **Maximum intended hold** | 1 month (forced reassessment) |
| **Time to liquidity need** | None — no near-term capital calls |

> Agents should not recommend positions that require intraday monitoring or
> holding periods exceeding the maximum intended hold without explicit justification.

---

## 3. Trade Frequency & Rebalancing

| Parameter | Setting |
|-----------|---------|
| **Target rebalance cadence** | Weekly |
| **Max trades per rebalance** | Unlimited |
| **Minimum position change** | 3% of portfolio (avoid churning) |
| **Rebalance trigger** | Regime shift or thesis invalidation — NOT calendar-driven |
| **Transaction cost sensitivity** | Low (ETF commissions negligible) |

> Do not suggest daily repositioning. Only recommend trades when the macro regime
> or a thesis materially changes.

---

## 4. Risk Tolerance & Constraints

### 4A. Risk Parameters

| Parameter | Value |
|-----------|-------|
| **Overall risk tolerance** | Aggressive (max growth, comfortable with big swings) |
| **Max portfolio drawdown tolerance** | -30%+ from peak |
| **Max single-position loss tolerance** | -10% |
| **Volatility comfort (annualized)** | No cap — accept full market volatility |
| **VIX action threshold** | None — manual discretion (no automatic rules) |
| **Correlation awareness** | No diversification requirement — optimize for returns, not correlation |

### 4B. Position Sizing Limits

| Constraint | Limit |
|------------|-------|
| **Max single ETF weight** | 100% (full concentration allowed) |
| **Max single theme/category** | 100% (no diversification requirement) |
| **Min cash/T-bill floor** | 0% (fully invested is acceptable) |
| **Weight increment** | 5% (positions sized in 5% steps) |
| **Max number of holdings** | No limit |
| **Min position size** | 3% (below this, not worth tracking) |

### 4C. Leverage & Derivatives

| Parameter | Setting |
|-----------|---------|
| **Leverage** | None |
| **Options** | Not used |
| **Margin** | Not used (manual decision only) |
| **Ratio/spread trades** | Yes — long/short ETF pairs for relative views (net exposure sized) |

---

## 5. Asset Selection Preferences

### 5A. Instrument Type

| Preference | Setting |
|------------|---------|
| **Preferred instrument** | ETFs only — no individual stocks |
| **ETF selection criteria** | Liquidity > $50M daily volume, AUM > $500M, low expense ratio preferred |
| **Index preference** | Market-cap weighted (avoid equal-weight unless thesis-specific) |
| **Crypto exposure** | Spot ETFs only (IBIT, FBTC, ETHA, FETH) — no direct custody |

### 5B. Asset Class Preferences

Rate each asset class by your structural preference. Agents use this to tilt
recommendations toward preferred areas and underweight disliked ones.

| Asset Class | Preference | Notes |
|-------------|------------|-------|
| US Large Cap Equity | Strong preference | No structural bias — regime-dependent |
| US Mid/Small Cap Equity | Strong preference | No structural bias — regime-dependent |
| International Developed | Strong preference | No structural bias — regime-dependent |
| Emerging Markets | Strong preference | No structural bias — regime-dependent |
| Crypto (BTC/ETH) | Strong preference | No structural bias — regime-dependent |
| Gold | Strong preference | No structural bias — regime-dependent |
| Oil / Energy commodities | Strong preference | No structural bias — regime-dependent |
| Other commodities | Strong preference | No structural bias — regime-dependent |
| Long-duration bonds (TLT) | Strong preference | No structural bias — regime-dependent |
| Short-duration / T-bills | Strong preference | No structural bias — regime-dependent |
| High yield credit | Strong preference | No structural bias — regime-dependent |
| TIPS | Strong preference | No structural bias — regime-dependent |

### 5C. Sector Preferences (GICS)

| Sector | Preference | Notes |
|--------|------------|-------|
| Technology (XLK) | Neutral | No structural bias — regime-dependent |
| Health Care (XLV) | Neutral | No structural bias — regime-dependent |
| Energy (XLE) | Neutral | No structural bias — regime-dependent |
| Financials (XLF) | Neutral | No structural bias — regime-dependent |
| Consumer Staples (XLP) | Neutral | No structural bias — regime-dependent |
| Industrials (XLI) | Neutral | No structural bias — regime-dependent |
| Utilities (XLU) | Neutral | No structural bias — regime-dependent |
| Real Estate (XLRE) | Neutral | No structural bias — regime-dependent |
| Materials (XLB) | Neutral | No structural bias — regime-dependent |
| Consumer Discretionary (XLY) | Neutral | No structural bias — regime-dependent |
| Communication Services (XLC) | Neutral | No structural bias — regime-dependent |

---

## 6. Thematic & Macro Preferences

### 6A. Regime Playbook

Define default positioning by macro regime. Agents use this as a starting template
before applying current research.

| Regime | Target Allocation |
|--------|-------------------|
| **Risk-on / Expansion** | 50% equity, 15% crypto, 10% commodities, 25% cash |
| **Risk-off / Contraction** | 15% equity (defensive), 25% gold, 10% bonds, 50% cash |
| **Inflationary** | 20% energy/commodities, 20% gold, 15% equity (pricing power), 45% cash/T-bills |
| **Geopolitical shock** | 20% gold, 15% energy, 15% defensive equity, 50% cash |
| **Transitional / Unclear** | 10% equity, 10% gold, 80% cash (wait for clarity) |

### 6B. Thematic Tilts

No permanent structural tilts — let the data and regime analysis decide allocations.
The system should evaluate each asset class on its merits per cycle without standing biases.

### 6C. Anti-Preferences (What to Avoid)

- Meme stocks and speculative micro-caps
- Individual stock picking (ETFs only)
- Options and derivatives
- Positions requiring intraday monitoring
- Narrative-driven trades without quantitative support

---

## 7. Information & Analysis Preferences

| Parameter | Setting |
|-----------|---------|
| **Analysis style** | Detailed and thorough (full reasoning chain) |
| **Confidence labeling** | Required on every recommendation (high / medium / low) |
| **Bias labeling** | Required per segment (bullish / bearish / neutral / conflicted) |
| **Contrarian signals** | Flag when positioning diverges from consensus |
| **Memory integration** | Always reference rolling memory for trend continuity |
| **Noise filter** | Ignore sub-weekly timeframes and mainstream media narratives |

---

## 8. Benchmark & Performance Tracking

| Parameter | Setting |
|-----------|---------|
| **Primary benchmark** | S&P 500 (SPY) |
| **Secondary benchmark** | All-weather (SPY 30%, TLT 40%, GLD 15%, DBC 7.5%, BIL 7.5%) |
| **Performance review cadence** | Every digest (daily) |
| **Attribution focus** | Regime call accuracy, sector rotation timing, thesis hit rate |

---

## How Agents Use This File

1. **Orchestrator** reads this at session start alongside `watchlist.md` and `portfolio.json`
2. **Portfolio Manager** uses §4 (risk) and §5 (asset preferences) for position construction
3. **Sector Analyst** uses §5C to weight sector coverage depth
4. **All analysts** use §6A (regime playbook) as the baseline allocation template
5. **Digest synthesis** uses §7 to format outputs and §8 for performance context

> To customize: edit any value in the tables above. Changes take effect on the next agent session.
> For regime playbook changes, also review `memory/THESES.md` for consistency.
