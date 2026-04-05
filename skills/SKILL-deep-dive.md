---
name: market-deep-dive
description: >
  Run a deep-dive analysis on a single asset, sector, or theme. Triggers when the user says
  "deep dive on [X]", "full analysis of [X]", "break down [X] for me", "research [X]",
  "what's the full picture on [X]", or when they ask for more detail on something flagged
  in the daily digest. Produces a standalone research note with full fundamental,
  technical, and macro context. Always use this skill for single-asset research requests.
---

# Deep Dive Analysis Skill

Produces a standalone research note on any single asset, sector, theme, or instrument.

---

## Step 1: Identify the Subject

Determine what's being analyzed:
- **Single stock**: Use sections A, B, C, D, E
- **Sector/ETF**: Use sections A, C, D, E (skip B)
- **Crypto asset**: Use sections A, C, D, E + crypto-specific (skip B, modify C)
- **Macro theme** (e.g., "AI trade", "rate cuts", "China recovery"): Use D and E primarily
- **Commodity**: Use sections A, C, D, E

---

## Section A: The Current Setup

Search for: current price, 52-week range, YTD performance, recent trend
- Where is it in its range? (near highs / near lows / mid-range)
- What's the recent momentum? (trending / consolidating / reversing)
- Volume: Any unusual volume patterns recently?
- Relative performance: Outperforming or underperforming its benchmark/sector?

---

## Section B: Fundamental Picture (stocks only)

Search for: latest earnings, valuation multiples, analyst ratings, balance sheet headline
- **Valuation**: P/E, EV/EBITDA, P/S — cheap / fair / expensive vs. sector and history
- **Growth**: Revenue and EPS growth trajectory (accelerating / decelerating)
- **Profitability**: Margins trend (expanding / compressing)
- **Balance sheet**: Debt load, cash position — any financial stress?
- **Analyst consensus**: Buy / Hold / Sell ratio, average price target vs. current
- **Upcoming catalysts**: Earnings date, product launches, regulatory events

---

## Section C: Technical Analysis

Analyze the chart structure:
- **Trend**: Uptrend / downtrend / consolidation (define with timeframe)
- **Key levels**:
  - Support 1 (nearest): $X
  - Support 2 (major): $X
  - Resistance 1 (nearest): $X
  - Resistance 2 (major): $X
- **Moving averages**: Price vs. 20/50/200-day MA — bullish or bearish configuration?
- **Momentum**: RSI (overbought >70 / oversold <30), MACD signal
- **Pattern**: Any notable chart patterns (breakout, breakdown, consolidation, head & shoulders, etc.)
- **Risk/reward**: Current entry — what's a logical stop vs. target?

---

## Section D: Macro & Narrative Context

- What macro regime is most relevant to this asset?
- What's the dominant market narrative around this asset right now?
- What does the macro `memory/macro/ROLLING.md` say that's directly relevant?
- Is the macro tailwind or headwind for this asset?
- What would need to change macro-wise to change the outlook?

---

## Section E: Synthesis & Verdict

Produce a clear research note conclusion:

```
## Deep Dive: [ASSET] — [DATE]

**Verdict**: [Bullish / Bearish / Neutral / Watching]
**Conviction**: [High / Medium / Low]
**Time horizon**: [Short-term (days-weeks) / Medium (weeks-months) / Long (months+)]

**Bull case**: [2-3 sentences — what makes this work]
**Bear case**: [2-3 sentences — what breaks the thesis]

**Entry zone**: $X - $X (if applicable)
**Stop loss level**: $X (technical invalidation)
**Target**: $X / +X% (if bullish) or downside to $X (if bearish)

**Key catalyst to watch**: [The specific event or data that resolves the setup]
**The one thing that would change this view**: [What would flip the verdict]
```

---

## Output Note

Save deep dives to: `outputs/daily/[DATE]-deepdive-[ASSET].md`

After completing, add 2-3 bullet summary to the relevant `memory/*/ROLLING.md` file.
Flag if this deep dive changes or validates any thesis in `config/preferences.md`.
