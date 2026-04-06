---
name: opportunity-screener
description: >
  Systematic investment opportunity screener. Scans the full ETF watchlist universe against
  today's digest research, macro regime, thesis register, and institutional signals to identify
  tickers worth analyst coverage. Runs after DIGEST.md is complete, before the analyst-PM
  deliberation. Produces a ranked shortlist that feeds the analyst roster.
  Triggers: automatically via Phase 7B of orchestrator, or standalone: "screen opportunities",
  "what looks interesting", "scan the watchlist".
---

# Opportunity Screener Skill

Translate the day's research into a ranked list of tickers worth analyst attention.
This is the bridge between "what happened in markets" and "what should we own."

---

## Why This Step Exists

Without a screener, the analyst roster defaults to whatever is already in `portfolio.json` plus
1-2 ad-hoc picks the PM noticed. That's ~60 tickers in the watchlist being reduced to ~9 by
gut feel. The screener systematically evaluates the full universe so opportunities don't slip
through because nobody thought to look.

---

## Inputs

Load all of the following (already in session context after Phase 7):

1. **`config/watchlist.md`** — Full ETF universe with categories (~60 tickers)
2. **`outputs/daily/{{DATE}}/DIGEST.md`** — Today's synthesized research
3. **`outputs/daily/{{DATE}}/macro.md`** — Regime classification (the primary filter)
5. **`config/portfolio.json`** — Current holdings (ticker list only — NOT weights)
6. **Segment files** already produced this session:
   - `institutional.md` or `institutional-flows.md` — ETF flow signals
   - `alt-data.md` — Sentiment, CTA positioning, options signals
   - `us-equities.md` + `sectors/*.md` — Sector biases and scorecard
   - `bonds.md`, `commodities.md`, `forex.md`, `crypto.md`, `international.md`

**Do NOT read `weight_pct` from portfolio.json.** Screener is blinded to current sizing.

---

## Step 1: Regime Filter

Read the macro regime classification from `macro.md`. Apply the regime-asset alignment matrix:

| Regime | Favored Categories | Disfavored Categories |
|--------|-------------------|----------------------|
| **Risk-on / Growth** | equity_us_large, equity_us_small, equity_em, crypto | cash, commodity_gold, fixed_income (long) |
| **Risk-off / Recession fear** | cash, fixed_income, commodity_gold | equity_us_small, equity_em, crypto |
| **Inflationary / Stagflation** | commodity_oil, commodity_gold, commodity_other, equity_sector (energy, materials) | fixed_income (long), equity_us_large (growth) |
| **Geopolitical shock** | commodity_gold, commodity_oil, cash | equity_em, equity_intl_developed, crypto |
| **Rate transition (cutting)** | fixed_income (long), equity_us_small, XLRE | cash, commodity_gold |
| **Rate transition (hiking)** | cash, fixed_income (short), commodity_gold | fixed_income (long), XLRE, equity_us_small |

For each ticker in `watchlist.md`, assign a **regime score**:
- **+2** — category is strongly favored in current regime
- **+1** — category is mildly aligned
- **0** — neutral / no strong regime signal
- **-1** — category is mildly disfavored
- **-2** — category is strongly opposed

---

## Step 2: Signal Scan

For each ticker in the watchlist, check whether today's segment outputs contain a relevant signal.
Score each signal found:

| Signal Source | What to Look For | Score |
|--------------|-----------------|-------|
| **Sector scorecard** (Phase 5) | Sector ETF rated Overweight or Strong Buy | +2 |
| **Sector scorecard** (Phase 5) | Sector ETF rated Underweight or Strong Sell | -2 |
| **Institutional flows** (Phase 2) | ETF appears in notable inflows list | +1 |
| **Institutional flows** (Phase 2) | ETF appears in notable outflows list | -1 |
| **Alt data — CTA positioning** | Net long or increasing exposure to category | +1 |
| **Alt data — Options** | Unusual call activity or put/call ratio < 0.7 | +1 |
| **Alt data — Options** | Unusual put activity or put/call ratio > 1.3 | -1 |
| **Thesis linkage** | Ticker is referenced by an active thesis in THESES.md | +1 |
| **Thesis challenge** | Ticker's thesis moved to ⚠️ or ❌ today | -2 (flag) |
| **Cross-asset signal** | DIGEST.md calls out this asset class explicitly | +1 |
| **Price momentum** | Segment file notes strong trend continuation | +1 |
| **Price momentum** | Segment file notes breakdown or reversal | -1 |

Sum the signal scores for each ticker. Combined with the regime score, compute:

```
Total Score = Regime Score + Signal Score
```

---

## Step 3: Rank and Filter

### 3a: Score the Full Universe
Build a table with all watchlist tickers scored:

| Ticker | Category | Regime Score | Signal Score | Total | Held? | Notes |
|--------|----------|-------------|-------------|-------|-------|-------|
| XLE | equity_sector | +2 | +3 | +5 | Yes | T-001, sector OW |
| IAU | commodity_gold | +2 | +2 | +4 | Yes | T-001, ATH |
| ... | | | | | | |

### 3b: Apply Filters
Remove tickers that are **not actionable**:
- Total score between -1 and +1 (no strong signal either way) → **Skip**
- Regime score = -2 AND no offsetting signal score ≥ +3 → **Skip** (regime headwind too strong)

### 3c: Select Analyst Roster

The analyst roster is composed of two pools:

**Pool 1 — Current Holdings (mandatory)**:
Every ticker in `portfolio.json` `positions[]` gets an analyst regardless of score.
The screener score is noted but doesn't filter them out — the analyst and PM must decide
whether to keep, trim, or exit based on the full deliberation.

**Pool 2 — Opportunity Candidates (screener-driven)**:
From the remaining non-held tickers, take the **top 3-5 by Total Score** (must have Total ≥ +2).
These are new opportunity candidates for analyst coverage.

**Cap**: Maximum 5 opportunity candidates per session. If more than 5 qualify, take the top 5.
On delta days (scoped screener), maximum 2 candidates.

---

## Step 4: Produce Screener Output

Save to: `outputs/daily/{{DATE}}/opportunity-screen.md`

Use this format:

```markdown
# 📡 Opportunity Screen — {{DATE}}

> Macro Regime: [regime classification]
> Watchlist tickers scanned: [N]
> Signals detected: [N] tickers with |Total| ≥ 2

---

## Analyst Roster

### Current Holdings (mandatory coverage)
| Ticker | Category | Screener Score | Key Signal |
|--------|----------|---------------|------------|

### Opportunity Candidates (screener-selected)
| Rank | Ticker | Category | Regime | Signal | Total | Rationale |
|------|--------|----------|--------|--------|-------|-----------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

### Notable Signals (not selected but flagged)
| Ticker | Score | Why Not Selected |
|--------|-------|-----------------|

---

## Anti-Signals (Strong Avoid)
| Ticker | Category | Total Score | Key Risk |
|--------|----------|-------------|----------|

---

## Screener Notes
[1-2 sentences: what theme dominated the screen today? Any surprises?]
```

---

## Integration Points

### Baseline Days (Sunday)
- Runs as **Phase 7B** in `SKILL-orchestrator.md`, after DIGEST.md (Phase 7), before Deliberation (Phase 7C)
- Full watchlist scan (~60 tickers)
- Top 3-5 opportunity candidates selected
- Output feeds directly into `SKILL-deliberation.md` Step 1.1 roster

### Delta Days (Mon-Sat)
- Runs as part of the **Phase 7C threshold scan** in `SKILL-daily-delta.md`
- Lightweight: only scan categories relevant to segments that had deltas today
- Max 2 opportunity candidates
- Only runs if the delta portfolio monitor is already triggered (don't run for quiet days)

### Standalone
- Invoke: "screen opportunities", "scan the watchlist", "what looks interesting"
- Loads most recent DIGEST.md as research source

---

## Quality Standards

1. **No lazy defaults** — every score must be justified by a specific observation from today's session data
2. **Regime is the primary filter** — a +3 signal score in a -2 regime category still needs explanation
3. **Anti-signals matter** — explicitly flag strong-avoid tickers (Total ≤ -2) so the PM knows what NOT to consider
4. **Don't overload analysts** — 3-5 new candidates is the sweet spot. More dilutes focus.
5. **Score from session data only** — no web searches, no training data prices. Use what Phases 1-5 already gathered.
