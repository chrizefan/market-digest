---
name: portfolio-manager
description: >
  Portfolio construction and rebalance decision skill. Translates analyst outputs + digest research
  into concrete position sizing and rebalance actions. Uses a three-phase anti-anchoring flow:
  Phase A (collect blinded analyst views) → Phase B (clean-slate portfolio) → Phase C (compare vs
  current, produce rebalance decisions). Triggers via orchestrator Phase 7C/7D, or
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

Load the following (already in session context if running after synthesis):

1. Supabase snapshot JSON — 4-factor regime classification from `daily_snapshots.regime` (canonical)
2. `config/investment-profile.md` — risk tolerance (§4), asset preferences (§5), ETF universe (§5D), regime playbook (§6), benchmarks (§8)
3. Supabase digest (`documents` where `document_key='digest'`) — for cross-asset synthesis
4. **Research library** — `docs/research/LIBRARY.md`. Load before Phase B. Apply the Black-Litterman conviction-weight table (Section 4.2) for position sizing. Run the Ilmanen 4-quadrant regime check (Section 5.4) before constructing the clean-slate portfolio. Use Kelly ceiling check (Section 4.3) to validate no position exceeds conservative fraction.

**Do NOT load `config/portfolio.json` yet.** Portfolio blindness is maintained through Phase B.

---

## Phase A — Analyst-PM Deliberation (Blinded)

> Phase A uses the multi-round deliberation protocol for higher-conviction outputs.
> Analysts present → PM challenges weak positions → Analysts defend/revise → PM decides.

Follow `skills/deliberation/SKILL.md` completely.

The deliberation produces (JSON-first, published to Supabase `documents.payload`):
- Individual analyst reports (`asset_recommendation` JSON)
- Deliberation transcript (`deliberation_transcript` JSON)
- A **resolved summary table** with final weights and biases

The resolved summary table is the authoritative input to Phase B below.

Announce after completing: "Deliberation complete. [N] positions resolved, [M] challenged, [K] revised."

---

## Phase B — Clean-Slate Portfolio Construction

> You are building the ideal portfolio from scratch. Do NOT reference the current portfolio.
> The only inputs are: analyst outputs, macro regime, thesis register, and risk constraints.

### Step B1: Theme Aggregation
Group analyst recommendations by theme bucket. Check theme-level constraints:
- Max 40% per theme (from `config/investment-profile.md §5`)
- If analysts recommend more than 40% in one theme, apply haircut proportionally to lowest-conviction assets in that theme

### Step B2: Apply Portfolio Constraints
From `config/investment-profile.md §4` and `config/portfolio.json` constraints:
- Max single ETF weight per `constraints.max_single_etf_pct` (default 100% — no hard cap, but flag any position >25% for PM review)
- Weight increment: 5% — round any non-5% recommendations to nearest 5%
- Total must sum to 100% — allocate remaining to BIL (cash proxy) after all positions assigned

### Step B3: Opportunity Candidates
Review the screener-selected candidates from the opportunity screen artifact. If their analyst report
recommends >0% weight AND the deliberation resolved them favorably → include in the portfolio.
If adding them breaches a theme cap, trim the lowest-conviction existing position first.

### Step B4: Build Clean-Slate Portfolio Table
Produce the full clean-slate portfolio as **JSON** (schema: `templates/schemas/portfolio-recommendation.schema.json`).

---

## Phase C — Compare vs Current & Rebalance Decisions

> NOW you may read `config/portfolio.json` for current weights.

### Step C1: Load Current Portfolio
Read `config/portfolio.json`. Extract from `positions[]`: `ticker`, `weight_pct`, `entry_date`, `entry_price_usd`, and `entry_usdcad`.
Note `investor_currency` (top-level field) — this determines whether FX impact is computed.
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

### Step C2.5: Unrealized P&L + CAD FX Impact

> Run this step only when `investor_currency` in `config/portfolio.json` is not USD.
> Skip if all `entry_price_usd` values are null AND `entry_usdcad` values are null (no baseline).

For each current position, compute:
1. **USD return** = (current_price − entry_price_usd) / entry_price_usd × 100
   - If `entry_price_usd` is null, use the closing price from the position's `entry_date` fetched from live data as a best-effort approximation; note the source.
2. **FX effect** = (current_USD/CAD − entry_USD/CAD) / entry_USD/CAD × 100
   - Fetch the current USD/CAD rate from FX sources or live search.
   - If `entry_usdcad` is null, fetch the USD/CAD historical close for `entry_date`; note the source.
   - Sign: a rising USD/CAD (USD strengthening) boosts CAD returns. A falling USD/CAD (USD weakening) reduces them.
3. **CAD-adjusted return** = USD return + FX effect (additive approximation; exact = (1+r_usd)(1+r_fx) − 1)

Produce this table and include it in the rebalance decision artifact:

| Ticker | Weight% | Entry Price (USD) | Current Price (USD) | USD Rtn% | USD/CAD Entry | USD/CAD Now | FX Effect% | CAD Rtn% |
|--------|---------|------------------|--------------------|---------|--------------|------------|-----------|----------|
| | | | | | | | | |

Note: BIL/SHY (USD T-bill ETFs) accumulate USD yield; a weaker USD vs CAD erodes that yield in CAD terms. Quantify this explicitly as an additional investment risk.

### Step C3: Produce Rebalance Decision
Produce the rebalance output as **JSON** (schema: `templates/schemas/rebalance-decision.schema.json`).

Include:
1. Rebalance table with all tickers, current%, recommended%, delta, action, urgency
2. PM Decision Notes — the key reasoning behind this session's positioning
3. Proposed portfolio (post-rebalance target weights)
4. Invalidation Watch table — any positions within 10% of their exit trigger

### Step C4: Validate Proposed Portfolio
Run the portfolio validator against the proposed positions to ensure they respect all
constraints from `config/investment-profile.md`:
```bash
./scripts/validate-portfolio.sh --proposed
```
If any checks fail, adjust the proposed weights before proceeding.

### Step C5: Update config/portfolio.json
Write the clean-slate recommended weights to the `proposed_positions` array in `config/portfolio.json`.
**Do NOT modify `positions[]`** — that array reflects actual executed trades and is user-maintained.

```json
"proposed_positions": [
  { "ticker": "IAU", "weight_pct": 20, "as_of": "{{DATE}}", "action": "Hold" }
]
```

Also update `"last_updated_date"` and `"last_updated_by": "agent"`.

---

## Session Completion Checklist (Phases A–C)

- [ ] Analyst roster loaded (holdings + candidates)
- [ ] Analysts run (JSON outputs)
- [ ] Deliberation transcript written (JSON output)
- [ ] Clean-slate portfolio constructed; constraint checks passed (`./scripts/validate-portfolio.sh --proposed`)
- [ ] Rebalance comparison run; delta table produced (JSON output)
- [ ] `config/portfolio.json` → `proposed_positions[]` updated

---

## Standalone Mode (no active session)

If invoked without a fresh session (no Phase outputs from today):

1. Load `config/portfolio.json` (tickers only for analyst roster, Phase A and B stay blinded)
2. Load the most recent digest snapshot from Supabase as research source
3. Run Phases A, B, C as normal
4. Note in the rebalance decision artifact that this used baseline data, not fresh-session data

This allows standalone portfolio reviews without running the full digest pipeline.

