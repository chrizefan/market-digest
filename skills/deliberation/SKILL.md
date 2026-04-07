---
name: portfolio-deliberation
description: >
  Multi-round analyst-PM deliberation protocol. Analysts present thesis-driven position
  recommendations, PM challenges weak or conflicting arguments, analysts defend or revise.
  Iterates until convergence (max 3 rounds). Produces higher-conviction portfolio decisions
  through structured debate. Triggers: "run deliberation", "challenge positions", or
  automatically via Phase 7C of orchestrator/delta pipeline.
---

# Portfolio Deliberation Skill

A structured "meeting room" debate between analyst sub-agents and the portfolio manager.
All roles are played sequentially within a single session, with epistemic barriers enforced
through committed intermediate outputs — analysts write reports before the PM reads them.

---

## Why Deliberation > One-Shot

| One-Shot (old) | Deliberation (new) |
|---|---|
| Analyst writes → PM reads → done | Analyst presents → PM challenges → Analyst defends → PM decides |
| Weak arguments pass unchallenged | PM forces specificity on every uncertain position |
| Anchoring to prior weights (subtle) | Explicit "what changed?" challenge catches stale reasoning |
| Disagreements hidden in boilerplate | Contradictions surfaced and resolved in transcript |

Token overhead: ~15-20% more than one-shot. Offset by fewer "Monitor" decisions that get
re-evaluated next session anyway.

---

## Pre-Flight

Load all context per `skills/portfolio-manager/SKILL.md` Pre-Flight section:
- Macro regime output (DB-first: Supabase)
- `config/preferences.md` — constraints and style
- `config/investment-profile.md` — risk tolerance, regime playbook
- `docs/research/LIBRARY.md` — research framework
- Digest (DB-first: Supabase `documents.payload` + rendered markdown if needed)

**Do NOT load `config/portfolio.json` weights.** Analyst blindness is maintained through Phase B.

---

## Round 1 — Analyst Presentations

### Step 1.1: Determine Roster
Read the latest opportunity screen artifact (DB-first: Supabase `documents`), which contains:
- **Current Holdings** — every ticker in `portfolio.json` `positions[]` (mandatory coverage)
- **Opportunity Candidates** — top 3-5 non-held tickers ranked by regime + signal score (Total ≥ +2)

The combined list is the **analyst roster**.

If the screener output doesn't exist (standalone invocation), fall back to:
- Read `config/portfolio.json` for ticker names only (not weights)
- No opportunity candidates (run screener first, or proceed with holdings only)

### Step 1.2: Run Analysts
For each ticker in the roster, follow `skills/asset-analyst/SKILL.md` completely.

Run analysts sequentially. Announce each: "Analyst presenting: [TICKER]"

### Step 1.3: Compile Round 1 Summary

After all analysts have presented, build the summary table:

```
═══════════════════════════════════════════════════
  ROUND 1 — ANALYST PRESENTATIONS
═══════════════════════════════════════════════════
| Ticker | Bias | Thesis Status | Bull Conviction | Bear Conviction | Rec Weight | Theme |
|--------|------|---------------|-----------------|-----------------|------------|-------|
```

Announce: "Round 1 complete. [N] analysts presented. PM reviewing for challenges."

---

## PM Review — Challenge Identification

The PM reads ALL Round 1 analyst outputs and identifies positions to challenge.

### Challenge Triggers

The PM **MUST** challenge a position if any of these apply:

| # | Trigger | PM Challenge Framing |
|---|---------|---------------------|
| 1 | **Analyst bias = "Conflicted"** | "Pick a direction. What single data point would resolve your uncertainty?" |
| 2 | **Both bull AND bear conviction are Medium or Low** | "Your arguments lack edge. What's the actual signal here — or is this a skip?" |
| 3 | **Weight > 0% but thesis is ⚠️ or ❌** | "You're recommending capital in a damaged thesis. Defend this or cut to 0%." |
| 4 | **Rec weight contradicts macro regime** | "Macro says [regime]. Your recommendation implies [opposite]. Reconcile or revise." |
| 5 | **Two analysts make contradicting assumptions** | "Analyst A for [TICKER1] says [X], but Analyst B for [TICKER2] assumes [Y]. One of you is wrong." |
| 6 | **Exit condition is vague / unmeasurable** | "Your exit condition isn't actionable. Give me a specific price, level, or date." |
| 7 | **Identical recommendation to last session with no new evidence cited** | "You're recycling. What fresh signal from today's data supports this — or has conviction actually faded?" |

### PM Challenge Output

For each challenged position, the PM writes:

```
CHALLENGE — [TICKER]
Trigger: [which trigger # from above]
Question: "[the specific challenge question]"
PM Note: [1–2 sentences of PM's own reasoning — what the PM suspects is wrong]
```

**If NO positions require challenge**: Write "PM Review: All positions passed. No challenges needed."
→ Skip Round 2 entirely. Proceed to Final Decisions with Round 1 recommendations unchanged.

---

## Round 2 — Analyst Defense

For each challenged position, the analyst must respond with exactly ONE of three options:

### Option A: Defend
- Provide **additional evidence** from today's session data not cited in Round 1
- Must reference a specific data point (price, flow, level, quote, thesis signal)
- If the analyst cannot find new supporting evidence, this option is **not available** — use B or C
- May revise the weight upward OR hold firm

### Option B: Revise
- Acknowledge the PM's challenge as valid
- Adjust the recommendation: change bias, weight, thesis status, or exit condition
- Explain specifically what the PM's challenge revealed

### Option C: Concede
- Agree the position lacks sufficient support
- Reduce weight to 0% or the next lower tier
- State clearly: "The PM is correct — [reason]. Revised to [X]%."

### Round 2 Summary

After all defenses, compile:

```
═══════════════════════════════════════════════════
  ROUND 2 — DEFENSE SUMMARY
═══════════════════════════════════════════════════
| Ticker | Challenge Trigger | Response | Original Rec | Updated Rec | Weight Change |
|--------|------------------|----------|-------------|-------------|---------------|
```

---

## PM Deliberation — Final Decisions

After Round 2, the PM evaluates each challenged position:

| PM Decision | When | Action |
|-------------|------|--------|
| **Accept** | Defense was compelling with new evidence | Use the analyst's updated recommendation |
| **Override** | Defense was weak or analyst conceded, but PM disagrees with 0% | PM sets weight with explicit reasoning |
| **Escalate** | Genuine 50/50 uncertainty, insufficient data to decide | Flag as OPEN QUESTION for user |

### Round 3 (Rare — Optional)

A third round runs ONLY if a Round 2 defense introduces genuinely new information that
**contradicts another position's assumptions**. The PM identifies the cross-position conflict
and both analysts respond. Max 1 Round 3 per session.

**Termination**: After Round 3 (or Round 2 if no Round 3 triggered), the PM's decisions are **FINAL**.

### Resolved Summary

Compile the deliberation outcome:

```
═══════════════════════════════════════════════════
  DELIBERATION RESOLVED — {{DATE}}
═══════════════════════════════════════════════════
| Ticker | Initial Rec | Challenged? | Defense | PM Decision | Final Weight | Final Bias |
|--------|-------------|-------------|---------|-------------|-------------|------------|
| IAU    | 20%         | No          | —       | Accept      | 20%         | Bullish    |
| XLE    | 15%         | Yes (#4)    | Defend  | Accept      | 15%         | Bullish    |
| XLV    | 10%         | Yes (#2)    | Revise  | Override→5% | 5%          | Neutral    |
```

**This resolved table is the authoritative input to Phase B (clean-slate portfolio construction).**

---

## Integration: Where Deliberation Runs

### Baseline Days (Sunday — `skills/orchestrator/SKILL.md` Phase 7C)
- **Full deliberation**: All positions + opportunity candidates
- Expected: 2-4 challenges per session, 1-2 revisions
- Always runs — this is the thorough weekly review

### Delta Days (Mon–Sat — `skills/daily-delta/SKILL.md` Phase 7C/7D, only when triggered)
- **Scoped deliberation**: Only positions that tripped a threshold trigger
- PM challenge focuses specifically on the trigger condition
- Expected: 1-2 positions, 1 round of challenge/defense
- Skipped entirely on quiet delta days (per Phase 7C threshold monitor)

### Standalone
- Invoke directly: "run deliberation", "challenge my positions"
- Loads most recent digest as research source

---

## Output

Save the full deliberation transcript as **JSON** (schema: `templates/schemas/deliberation-transcript.schema.json`):
`outputs/daily/{{DATE}}/deliberation.json`

After deliberation completes, hand off the resolved summary table to
`skills/portfolio-manager/SKILL.md` **Phase B** (clean-slate construction) and **Phase C** (comparison).

---

## Quality Standards

1. **PM challenges must be specific** — not "is this right?" but "your bull case #2 assumes X, but macro says Y"
2. **Analyst defenses must cite data** — appeals to authority or vague "the trend supports" are insufficient
3. **Concessions are a feature, not a failure** — a revised position is more valuable than a defended-but-wrong one
4. **Escalate honestly** — when there isn't enough data to decide, say so; don't manufacture certainty
5. **Contradictions between analysts are gold** — surface them, don't paper over them

