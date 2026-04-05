---
name: portfolio-manager
description: >
  Portfolio construction and rebalance decision skill. Translates analyst outputs + digest research
  into concrete position sizing and rebalance actions. Uses a three-phase anti-anchoring flow:
  Phase A (collect blinded analyst views) → Phase B (clean-slate portfolio) → Phase C (compare vs
  current, produce rebalance decisions). Triggers via SKILL-orchestrator.md Phase 7C/7D, or
  standalone: "rebalance check", "review portfolio", "should I change anything", "what should I own".
---

# Portfolio Manager Skill

This skill translates research into actionable portfolio positions.

---

## Anti-Anchoring Principle

The portfolio manager deliberately separates *research-driven conviction* from *existing position awareness*:

- **Phase A & B run without reading `config/portfolio.json`**. The clean-slate portfolio is constructed purely from analyst conviction, macro regime, and theses.
- **Only in Phase C** does the PM compare against actual current positions.

This prevents the most common failure mode: anchoring to existing positions and providing
rationalizations for the status quo rather than genuine independent analysis.

---

## Pre-Flight: PM Context Load

Load the following (already in session context if running after Phase 7 of orchestrator):

1. `outputs/daily/{{DATE}}/macro.md` — 4-factor regime classification
2. `memory/THESES.md` — full thesis register (active + closed)
3. `config/preferences.md` — risk profile, constraints, trading style
4. `outputs/daily/{{DATE}}/DIGEST.md` (if completed) — for cross-asset synthesis
5. **Research library** — `docs/research/LIBRARY.md`. Load before Phase B. Apply the Black-Litterman conviction-weight table (Section 4.2) for position sizing. Run the Ilmanen 4-quadrant regime check (Section 5.4) before constructing the clean-slate portfolio. Use Kelly ceiling check (Section 4.3) to validate no position exceeds conservative fraction.

**Do NOT load `config/portfolio.json` yet.** Portfolio blindness is maintained through Phase B.

---

## Phase A — Analyst Pass (Blinded)

### Step A1: Determine Analyst Roster
Read `config/portfolio.json` **for ticker names only** — extract the list of tickers in
`positions[]`. Do NOT read `weight_pct` values. Close the file immediately.

```
Analyst roster = [IAU, XLE, DBO, XLV, XLP, BIL, SHY]  ← example
```

### Step A2: Identify Opportunity Candidates
From the current session's digest research, identify 1-2 assets NOT in the current portfolio
that the regime and analyst signals suggest are worth evaluating. Use these sources:
- Sector scorecard from Phase 5M: any sector ETF with Bias=OW and Confidence=High that isn't held?
- Institutional flows from Phase 2: any ETF with unusual inflow that supports the thesis?
- THESES.md: any thesis with an ETF that isn't currently in the portfolio?

Add these candidates to the analyst roster. Maximum 2 new candidates per session.

### Step A3: Run Asset Analysts
For each ticker in the analyst roster, follow `skills/SKILL-asset-analyst.md` completely.

Each analyst:
- Reads only session segment files (no new web searches)
- Is blinded to current portfolio weights
- Produces `outputs/daily/{{DATE}}/positions/{{TICKER}}.md`

Run analysts sequentially. Announce each one: "Running analyst: [TICKER]"

### Step A4: Collect Analyst Results
Read all analyst output files from `outputs/daily/{{DATE}}/positions/`.
Build an internal summary table:

```
ANALYST RESULTS — {{DATE}}
| Ticker | Bias | Thesis | Conviction | Recommended% | Theme |
| IAU    | Bullish | T-001 ✅ | H | 20% | commodity_safe-haven |
| XLE    | Bullish | T-001 ✅ | H | 10% | commodity_energy |
...
```

---

## Phase B — Clean-Slate Portfolio Construction

> You are building the ideal portfolio from scratch. Do NOT reference the current portfolio.
> The only inputs are: analyst outputs, macro regime, thesis register, and risk constraints.

### Step B1: Theme Aggregation
Group analyst recommendations by theme bucket. Check theme-level constraints:
- Max 40% per theme (from `config/preferences.md`)
- If analysts recommend more than 40% in one theme, apply haircut proportionally to lowest-conviction assets in that theme

### Step B2: Apply Portfolio Constraints
From `config/preferences.md` constraints:
- Max 20% per single ETF — if any analyst recommended 20%, confirm it has the highest conviction
- Weight increment: 5% — round any non-5% recommendations to nearest 5%
- Total must sum to 100% — allocate remaining to BIL (cash proxy) after all positions assigned

### Step B3: Opportunity Candidates
Review the 1-2 candidates from Step A2. If their analyst report recommends >0% weight AND
macro regime supports the theme AND there is thesis linkage → include in the portfolio.
If adding them breaches a theme cap, trim the lowest-conviction existing position first.

### Step B4: Build Clean-Slate Portfolio Table
Using `templates/portfolio-recommendation.md`, produce the full clean-slate portfolio.
Save to: `outputs/daily/{{DATE}}/portfolio-recommended.md`

---

## Phase C — Compare vs Current & Rebalance Decisions

> NOW you may read `config/portfolio.json` for current weights.

### Step C1: Load Current Portfolio
Read `config/portfolio.json`. Extract `positions[]` with `ticker` and `weight_pct`.
Also note any `proposed_positions[]` from prior agent runs — if any exist, compare against those
too (shows drift between consecutive recommendations).

### Step C2: Compute Deltas
For each ticker in the union of (clean-slate portfolio ∪ current portfolio):
```
delta = recommended_weight - current_weight
```

| Decision rule | Action |
|---------------|--------|
| delta = 0 | Hold |
| 0 < delta ≤ 4% | Monitor (no action, noted in table) |
| delta ≥ 5% | Add / New Entry |
| -4% ≤ delta < 0 | Monitor |
| delta ≤ -5% | Trim |
| current > 0, recommended = 0 | Exit |
| current = 0, recommended > 0 | New Entry |

**Override rule**: If a thesis is ❌ Challenged, always flag for action regardless of delta size.

### Step C3: Produce Rebalance Decision
Using `templates/rebalance-decision.md`, produce the rebalance output.
Save to: `outputs/daily/{{DATE}}/rebalance-decision.md`

Include:
1. Rebalance table with all tickers, current%, recommended%, delta, action, urgency
2. PM Decision Notes — the key reasoning behind this session's positioning
3. Proposed portfolio (post-rebalance target weights)
4. Invalidation Watch table — any positions within 10% of their exit trigger

### Step C4: Update config/portfolio.json
Write the clean-slate recommended weights to the `proposed_positions` array in `config/portfolio.json`.
**Do NOT modify `positions[]`** — that array reflects actual executed trades and is user-maintained.

```json
"proposed_positions": [
  { "ticker": "IAU", "weight_pct": 20, "as_of": "{{DATE}}", "action": "Hold" },
  ...
]
```

Also update `"last_updated_date"` and `"last_updated_by": "agent"`.

### Step C5: Update Memory
Append to `memory/portfolio/ROLLING.md`:
```markdown
## {{DATE}}
- Actions: [list each non-Hold action, or "No changes — all within threshold"]
- Proposed weights: [summary of key positions as comma-separated list]
- PM rationale: [1 sentence]
- Invalidation watch: [most urgent trigger or "None"]
```

---

## Session Completion Checklist (Phase 7C/7D)

- [ ] Analyst roster determined from config/portfolio.json (tickers only, not weights)
- [ ] 1-2 opportunity candidates identified from session research
- [ ] All analysts run; `outputs/daily/{{DATE}}/positions/*.md` files created
- [ ] Clean-slate portfolio constructed; constraint checks passed (100% sum, no >20% single, no >40% theme)
- [ ] `outputs/daily/{{DATE}}/portfolio-recommended.md` saved
- [ ] Rebalance comparison run; delta table produced
- [ ] `outputs/daily/{{DATE}}/rebalance-decision.md` saved
- [ ] `config/portfolio.json` → `proposed_positions[]` updated
- [ ] `memory/portfolio/ROLLING.md` appended

---

## Standalone Mode (no active session)

If invoked without a fresh session (no Phase 1–5 outputs from today):

1. Load `config/portfolio.json` (tickers only for analyst roster, Phase A and B stay blinded)
2. Load the most recent `DIGEST.md` from this week as research source (check `_meta.json` for baseline date)
3. Load all relevant segment files from the baseline date
4. Run Phases A, B, C as normal
5. Note in `rebalance-decision.md` that this used baseline data, not fresh-session data

This allows standalone portfolio reviews without running the full digest pipeline.
