---
name: asset-analyst
description: >
  Per-asset conviction builder. Run once per portfolio position (or candidate position) to produce
  a structured bull/bear/conviction/weight recommendation BLINDED to current portfolio weights.
  Triggers when SKILL-portfolio-manager.md calls for an analyst pass, or standalone for ad-hoc
  asset deep-dives: "analyze IAU", "bull/bear on XLE", "should I hold BIL".
---

# Asset Analyst Skill

This skill produces a structured per-asset recommendation.

## Critical Rule — Portfolio Blindness

**You MUST NOT read `config/portfolio.json` during this skill.**
**You MUST NOT reference current portfolio weights, current holdings, or position sizes.**

The analyst's job is to form an independent view on the asset's merit — unconstrained by what
is already owned. Anchoring to existing positions produces stale, sticky portfolios. The portfolio
manager (Phase B/C of SKILL-portfolio-manager.md) handles the comparison — not this analyst.

---

## Inputs

1. **Ticker and category** — provided by the PM agent that invoked this skill
2. **Session segment files** — already produced earlier in the current session. Pull data FROM THESE FILES rather than initiating new web searches (data was already gathered in Phases 1–5). Relevant files by asset type:
   - **Commodities** (IAU, DBO, XLE): `outputs/daily/{{DATE}}/commodities.md` + `macro.md` + `institutional-flows.md`
   - **Fixed income / cash** (BIL, SHY, TLT): `outputs/daily/{{DATE}}/bonds.md` + `macro.md`
   - **Equity sectors** (XLV, XLP, XLE, XLK, etc.): `outputs/daily/{{DATE}}/sectors/{{SECTOR}}.md` + `us-equities.md` + `macro.md`
   - **Crypto** (IBIT, ETHA): `outputs/daily/{{DATE}}/crypto.md` + `institutional-flows.md`
   - **International** (EFA, EEM, EWJ): `outputs/daily/{{DATE}}/international.md` + `forex.md`
   - **Broad US equity** (SPY, QQQ, IWM): `outputs/daily/{{DATE}}/us-equities.md` + `macro.md`
3. **Active theses** Note which thesis IDs are relevant to this asset.
4. **Macro regime** — from `outputs/daily/{{DATE}}/macro.md` (already loaded earlier in session)
5. **Research library** — `docs/research/LIBRARY.md`. Load once per session before forming bull/bear arguments. Cite at least one paper per argument. Use the Quick Reference tables (bottom) for per-asset signal rules. For macro regime framing, apply the Ilmanen 4-quadrant model (Section 5.4).

---

## Steps

### Step 1: Load Asset Context
Read the relevant segment file(s) from the list above. Extract:
- Current price / level
- Most recent bias for this asset stated in the segment file
- Key data points (yield, price move, volume, flow direction, etc.)
- Any relevant thesis confirmation or challenge signal

**Do NOT initiate new web searches.** If data is missing from segment files, note the gap
and work with what is available.

### Step 2: Build the Bull Case
Construct exactly 3 bull case arguments, each grounded in a specific data point from Step 1:
- Each argument must be falsifiable (i.e., it can be proven wrong)
- Order from strongest to weakest conviction
- Reference the macro regime where relevant (e.g., "In a risk-off / inflation regime, gold benefits from...")

### Step 3: Build the Bear Case
Construct exactly 3 bear case arguments, each with a specific counter-signal or risk:
- Include the thesis invalidation condition if one exists in THESES.md
- Be honest — if the bull case is overwhelming, the bear case still needs to be real risks, not strawmen

### Step 4: Form the Analyst Verdict
State a single base bias: Bullish / Bearish / Neutral / Conflicted

Assess the relevant thesis:
- ✅ Confirmed — data from today reinforces the thesis
- ⚠️ Conflicted — mixed signals; thesis not yet broken but challenged
- ❌ Challenged — today's data is clearly inconsistent with the thesis
- ⏳ No signal — insufficient new data to update the thesis

State specific entry and exit conditions for this asset.

### Step 5: Recommend a Weight
Use ONLY these quantized values: **0% / 5% / 10% / 15% / 20%**

Apply these reasoning rules:
- **0%** — Bearish OR thesis challenged OR macro regime is directly opposed. No position.
- **5%** — Weak positive signal OR conflicted thesis OR regime-neutral, used for diversification
- **10%** — Moderate conviction, thesis confirmed, regime supportive
- **15%** — High conviction, clear thesis confirmation, regime strongly supportive
- **20%** — Maximum single-asset conviction: thesis fully confirmed, regime aligned, institutional flows supporting, strong signal confluence. Reserve for 1–2 assets maximum per portfolio.

Justify the weight choice in 1-2 sentences. Do not default to the current weight — form the recommendation independently.

### Step 6: Write Output
Using `templates/asset-recommendation.md`, save the completed report to:
`outputs/daily/{{DATE}}/positions/{{TICKER}}.md`

Create the `positions/` subdirectory if it doesn't exist.

---

## Round 2 — PM Challenge Response (If Called Back)

If the PM challenges this analyst's position during deliberation (see `SKILL-deliberation.md`),
append a response section to the existing `positions/{{TICKER}}.md` file:

```markdown
---

## Round 2 — PM Challenge Response

**Challenge**: [PM's specific question]
**Response**: Defend / Revise / Concede
**Argument**: [2-3 sentences — new evidence if defending, revised logic if revising, acknowledgment if conceding]
**Updated Recommendation**: [same or changed weight]% — [same or changed bias]
```

Response rules:
- **Defend**: Must cite a specific data point from session outputs NOT used in Round 1. If no new evidence exists, cannot Defend — must Revise or Concede.
- **Revise**: Adjust weight, bias, or thesis status. Explain what the PM's challenge exposed.
- **Concede**: Agree the position lacks support. Reduce weight to 0% or next lower tier.

---

## Token Efficiency Note

This skill deliberately pulls from already-gathered phase outputs rather than re-searching the web.
Running analysts for 7 portfolio positions adds approximately 5–10% additional context vs re-searching
would add 50–100%. Always use session files as the primary source.

---

## Output Format

See `templates/asset-recommendation.md` for the complete output structure.

Key fields per output:
- Bull Case × 3 with data points
- Bear Case × 3 with specific risks
- Base Bias (single label)
- Thesis Status (per thesis ID)
- Recommended Weight (quantized: 0/5/10/15/20%)
- Theme Bucket (for PM aggregation)
- Entry/exit conditions
- Round 2 PM Challenge Response (if deliberation is active)
