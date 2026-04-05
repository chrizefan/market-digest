---
name: market-orchestrator
description: >
  Master orchestrator for the comprehensive daily market analysis pipeline. Triggers when the user says
  "run today's digest", "daily analysis", "morning brief", "market update", or pastes the new-day prompt.
  Replaces SKILL-digest.md as the primary pipeline driver. Runs an 8-phase sequential deep-dive where
  each phase is a dedicated sub-agent research task before synthesizing all findings into DIGEST.md and regenerating the web app.
---

# Market Digest — Master Orchestrator

This is the primary entry point for every comprehensive daily digest session. Follow all 8 phases sequentially. Do not skip phases. Each phase is a dedicated research task with its own output file.

---

## Pre-Flight: Session Context Boot

Before starting any phase, load the following. Do NOT summarize to the user — just internalize:

1. `config/watchlist.md` — full asset universe
2. `config/preferences.md` — trading style, risk profile, active theses
3. `config/hedge-funds.md` — tracked fund reference
4. `config/data-sources.md` — tracked signal sources, KOL accounts, Polymarket topics
5. All rolling memory files (read in order):
   - `memory/macro/ROLLING.md`
   - `memory/equity/ROLLING.md`
   - `memory/crypto/ROLLING.md`
   - `memory/bonds/ROLLING.md`
   - `memory/commodities/ROLLING.md`
   - `memory/forex/ROLLING.md`
   - `memory/international/ROLLING.md`
   - `memory/sectors/technology/ROLLING.md`
   - `memory/sectors/healthcare/ROLLING.md`
   - `memory/sectors/energy/ROLLING.md`
   - `memory/sectors/financials/ROLLING.md`
   - `memory/sectors/consumer/ROLLING.md`
   - `memory/sectors/industrials/ROLLING.md`
   - `memory/sectors/utilities/ROLLING.md`
   - `memory/sectors/materials/ROLLING.md`
   - `memory/sectors/real-estate/ROLLING.md`
   - `memory/sectors/comms/ROLLING.md`
   - `memory/alternative-data/sentiment/ROLLING.md`
   - `memory/alternative-data/cta-positioning/ROLLING.md`
   - `memory/alternative-data/options/ROLLING.md`
   - `memory/alternative-data/politician/ROLLING.md`
   - `memory/institutional/flows/ROLLING.md`
   - `memory/institutional/hedge-funds/ROLLING.md`
   - `memory/THESES.md`
   - `memory/BIAS-TRACKER.md`
6. Yesterday's `DIGEST.md` if it exists (for continuity)

**After loading**, internally note:
- Active theses and their current status
- Any developing narratives from rolling memory
- Macro regime from the last digest (to compare with today)

Announce to user: "Context loaded. Starting Phase 1 of 8."

---

## Phase 1 — Alternative Data & Signals

> These signals inform everything downstream. Run them FIRST so that sentiment, positioning, and institutional flows color the macro and segment reads. Alternatives that contradict fundamentals are often the most important signals.

### 1A: Sentiment & News Intelligence
Follow `skills/alternative-data/SKILL-sentiment-news.md` completely.
Save output to: `outputs/daily/{{DATE}}/sentiment-news.md`
Update: `memory/alternative-data/sentiment/ROLLING.md`

### 1B: CTA & Systematic Positioning
Follow `skills/alternative-data/SKILL-cta-positioning.md` completely.
Save output to: `outputs/daily/{{DATE}}/cta-positioning.md`
Update: `memory/alternative-data/cta-positioning/ROLLING.md`

### 1C: Options & Derivatives Intelligence
Follow `skills/alternative-data/SKILL-options-derivatives.md` completely.
Save output to: `outputs/daily/{{DATE}}/options-derivatives.md`
Update: `memory/alternative-data/options/ROLLING.md`

### 1D: Politician & Official Signals
Follow `skills/alternative-data/SKILL-politician-signals.md` completely.
Save output to: `outputs/daily/{{DATE}}/politician-signals.md`
Update: `memory/alternative-data/politician/ROLLING.md`

---

## Phase 2 — Institutional Intelligence

> Institutional flows and hedge fund positioning reveal where real capital is moving. These signals are often 1-4 weeks ahead of public price moves.

### 2A: Institutional Flows
Follow `skills/institutional/SKILL-institutional-flows.md` completely.
Save output to: `outputs/daily/{{DATE}}/institutional-flows.md`
Update: `memory/institutional/flows/ROLLING.md`

### 2B: Hedge Fund Intelligence
Follow `skills/institutional/SKILL-hedge-fund-intel.md` completely.
Save output to: `outputs/daily/{{DATE}}/hedge-fund-intel.md`
Update: `memory/institutional/hedge-funds/ROLLING.md`

---

## Phase 3 — Macro Regime Classification

> Macro regime is the anchor for all downstream analysis. The regime output from this phase must be consciously referenced in Phases 4 and 5.

Follow `skills/SKILL-macro.md` completely, **enhanced with**:
- Reference sentiment signals from Phase 1A (do they confirm or contradict macro?)
- Reference CTA positioning from Phase 1B (are systematics aligned with macro?)
- Reference politician/Fed signals from Phase 1D (any policy shift?)

Classify the 4-factor macro regime:
- **Growth**: Expanding / Slowing / Contracting
- **Inflation**: Hot / Cooling / Cold
- **Policy**: Tightening / Neutral / Easing
- **Risk Appetite**: Risk-on / Risk-off / Mixed

This regime classification anchors all subsequent analysis. Save explicitly.
Save output to: `outputs/daily/{{DATE}}/macro.md`
Update: `memory/macro/ROLLING.md`

---

## Phase 4 — Asset Class Deep Dives

> Run each asset class analysis through its own dedicated skill. Each reads the macro regime output. Order: bonds → commodities → forex → crypto → international. This order reflects risk hierarchy (safest to most volatile, plus international is DXY-dependent).

### 4A: Bonds & Rates
Follow `skills/SKILL-bonds.md` — reference today's macro regime.
Save output to: `outputs/daily/{{DATE}}/bonds.md`
Update: `memory/bonds/ROLLING.md`

### 4B: Commodities
Follow `skills/SKILL-commodities.md` — reference macro regime + bonds/yield output.
Save output to: `outputs/daily/{{DATE}}/commodities.md`
Update: `memory/commodities/ROLLING.md`

### 4C: Forex
Follow `skills/SKILL-forex.md` — reference macro regime + bonds.
Save output to: `outputs/daily/{{DATE}}/forex.md`
Update: `memory/forex/ROLLING.md`

### 4D: Crypto & Digital Assets
Follow `skills/SKILL-crypto.md` — reference macro regime + institutional flow data (IBIT/BTC ETF flows).
Save output to: `outputs/daily/{{DATE}}/crypto.md`
Update: `memory/crypto/ROLLING.md`

### 4E: International & Emerging Markets
Follow `skills/SKILL-international.md` — reference macro regime + DXY from forex output.
Save output to: `outputs/daily/{{DATE}}/international.md`
Update: `memory/international/ROLLING.md`

---

## Phase 5 — US Equities: Overview + All 11 Sectors

> US equities is the deepest phase. First establish the market-wide read (breadth, indices, factor exposure), then delegate to each of the 11 GICS sector sub-agents. After all 11 sectors, synthesize into a net equity bias.

### 5A: US Equities Overview
Follow `skills/SKILL-equity.md` with these additions:
- Check market breadth: NYSE Advance/Decline line; new 52W highs vs lows
- Factor performance today: check value (VTV), growth (VUG), momentum (MTUM), quality (QUAL), small cap (IWM) vs large cap (SPY)
- Note the overall market technical trend
- Do NOT do full sector analysis here — that's done in 5B through 5L
Save output to: `outputs/daily/{{DATE}}/us-equities.md`
Update: `memory/equity/ROLLING.md`

### 5B–5L: Sector Sub-Agents (All 11 GICS Sectors)
Run each sector skill sequentially. Each reads the macro regime output and references Phase 5A.

| Phase | Skill | Output File |
|-------|-------|-------------|
| 5B | `skills/sectors/SKILL-sector-technology.md` | `sectors/technology.md` |
| 5C | `skills/sectors/SKILL-sector-healthcare.md` | `sectors/healthcare.md` |
| 5D | `skills/sectors/SKILL-sector-energy.md` | `sectors/energy.md` |
| 5E | `skills/sectors/SKILL-sector-financials.md` | `sectors/financials.md` |
| 5F | `skills/sectors/SKILL-sector-consumer-staples.md` | `sectors/consumer-staples.md` |
| 5G | `skills/sectors/SKILL-sector-consumer-disc.md` | `sectors/consumer-disc.md` |
| 5H | `skills/sectors/SKILL-sector-industrials.md` | `sectors/industrials.md` |
| 5I | `skills/sectors/SKILL-sector-utilities.md` | `sectors/utilities.md` |
| 5J | `skills/sectors/SKILL-sector-materials.md` | `sectors/materials.md` |
| 5K | `skills/sectors/SKILL-sector-real-estate.md` | `sectors/real-estate.md` |
| 5L | `skills/sectors/SKILL-sector-comms.md` | `sectors/comms.md` |

All sector outputs saved under `outputs/daily/{{DATE}}/sectors/`
Each sector updates its memory: `memory/sectors/[sector]/ROLLING.md`

### 5M: Sector Synthesis
After all 11 sectors, produce a sector scorecard:
```
SECTOR SCORECARD — {{DATE}}
| Sector | ETF | Bias | Confidence | Key Driver |
|--------|-----|------|------------|------------|
| Technology | XLK | OW/UW/N | H/M/L | [1 word] |
| Healthcare | XLV | OW | H | defensives bid |
| Energy | XLE | OW | H | Iran geopolitical |
...all 11
```
Aggregate into: Net Equity Bias (Bullish / Bearish / Neutral / Conflicted) with rationale.

---

## Phase 6 — Memory Updates & Expanded Bias Tracker

> After all phases are complete, write the consolidated memory updates and update the Bias Tracker.

### 6A: Bias Tracker Update
Append a new row to `memory/BIAS-TRACKER.md` with ALL columns:

```
| {{DATE}} | [Macro Regime] | [Equity Bias] | [Crypto Bias] | [Bond Bias] | [Commodity Bias] | [Forex/DXX] | [VIX] | [Inst. Flow] | [Options Sent.] | [CTA Dir.] | [HF Consensus] | [Poly. Fed Odds] | [Notes] |
```

### 6B: Confirm All Memory Files Updated
Verify the following memory files have been appended in this session:
- `memory/macro/ROLLING.md` ✓
- `memory/equity/ROLLING.md` ✓
- `memory/crypto/ROLLING.md` ✓
- `memory/bonds/ROLLING.md` ✓
- `memory/commodities/ROLLING.md` ✓
- `memory/forex/ROLLING.md` ✓
- `memory/international/ROLLING.md` ✓
- `memory/sectors/technology/ROLLING.md` ✓
- `memory/sectors/healthcare/ROLLING.md` ✓
- `memory/sectors/energy/ROLLING.md` ✓
- `memory/sectors/financials/ROLLING.md` ✓
- `memory/sectors/consumer/ROLLING.md` ✓
- `memory/sectors/industrials/ROLLING.md` ✓
- `memory/sectors/utilities/ROLLING.md` ✓
- `memory/sectors/materials/ROLLING.md` ✓
- `memory/sectors/real-estate/ROLLING.md` ✓
- `memory/sectors/comms/ROLLING.md` ✓
- `memory/alternative-data/sentiment/ROLLING.md` ✓
- `memory/alternative-data/cta-positioning/ROLLING.md` ✓
- `memory/alternative-data/options/ROLLING.md` ✓
- `memory/alternative-data/politician/ROLLING.md` ✓
- `memory/institutional/flows/ROLLING.md` ✓
- `memory/institutional/hedge-funds/ROLLING.md` ✓
- `memory/BIAS-TRACKER.md` ✓

---

## Phase 7 — Master Synthesis: DIGEST.md

> Now that all 20+ segment outputs exist, synthesize them into the final master digest. This is NOT a regurgitation — it is a synthesis. Pull the most important signals across all phases and generate a coherent, actionable daily brief.

Using `templates/master-digest.md`, compile `outputs/daily/{{DATE}}/DIGEST.md`:

**DIGEST.md must include all of the following:**

1. **Market Regime Snapshot** — Overall risk-on/risk-off. What is the SINGLE dominant force today?

2. **Alternative Data Dashboard** — 1-paragraph synthesis of sentiment, CTA, options, and politician signals. Lead with any signal that contradicts the fundamental/macro read.

3. **Institutional Intelligence Summary** — Key ETF flow direction, any hedge fund signal worth noting, any 13D/13G filing.

4. **Macro** — Full section from `macro.md` (regime, data calendar, central banks, geopolitical)

5. **Asset Classes** — Full sections from `bonds.md`, `commodities.md`, `forex.md`, `crypto.md`, `international.md`

6. **US Equities** — Overview + Sector Scorecard (all 11, with OW/UW/N + key driver)

7. **Thesis Tracker** — For EACH active thesis in `config/preferences.md` and `memory/THESES.md`:
   - Flag: ✅ Confirmed / ⚠️ Conflicted / ❌ Challenged / ⏳ No signal today
   - Briefly note which signals confirm or challenge
   - Note if any thesis is approaching its **invalidation trigger**

8. **Portfolio Positioning Recommendations** — Based on today's full synthesis:
   - Current portfolio: list each position with current thesis status
   - Any rebalancing recommendation? (Trim / Add / Hold / Exit) — with explicit rationale
   - Scale of conviction: High / Medium / Low for any recommended change
   - IMPORTANT: Be direct. If the analysis suggests trimming XLE after a +30% run, say so.

9. **Actionable Summary** — Top 5 items to act on or watch TODAY, ranked by priority

10. **Risk Radar** — What could break the current bias in the next 24-72 hours?

**Quality Standards for DIGEST.md:**
- Be direct. State the bias. Don't hedge everything into meaningless mush.
- Synthesis > repetition. Don't copy-paste segment outputs — extract the key insight from each.
- Contradictions must be flagged explicitly (e.g., "Options show panic, but CTA positioning is still net long — this is a tug-of-war that hasn't resolved.")
- Every section ends with a portfolio implication, not just description.

Save to: `outputs/daily/{{DATE}}/DIGEST.md`

---

## Phase 8 — Web Dashboard Update

> To ensure the interactive web application always reflects the latest analysis, you must explicitly trigger the backend generator.

Run the following command exactly in your environment to parse the directories and output the new metric JSON to the frontend:
`python3 scripts/update-tearsheet.py`

Wait for it to confirm the update to `dashboard-data.json`.

---

## Session Completion Checklist

Confirm all of the following before ending the session:

- [ ] Phase 1: 4 alternative data files created
- [ ] Phase 2: 2 institutional intelligence files created
- [ ] Phase 3: `macro.md` created
- [ ] Phase 4: `bonds.md`, `commodities.md`, `forex.md`, `crypto.md`, `international.md` created
- [ ] Phase 5: `us-equities.md` + 11 sector files in `sectors/` created
- [ ] Phase 6: All 24 memory files updated; `BIAS-TRACKER.md` new row added
- [ ] Phase 7: `DIGEST.md` created
- [ ] Phase 8: `update-tearsheet.py` executed successfully

**Total output files per day: ~21 segment files + DIGEST.md = 22 files**

Print to user: "✅ Digest complete. Output: `outputs/daily/{{DATE}}/DIGEST.md`. Run `./scripts/git-commit.sh` to commit."

---

## Quality Principles (Always Apply)

1. **Search for everything.** Never rely on training data for prices, yields, levels, or news.
2. **Maintain continuity.** Every analysis explicitly references prior context from ROLLING.md files. This is NOT a fresh-start diary — it's a living research thread.
3. **Be opinionated.** The user is an experienced investor. They need a clear directional read, not a "on the one hand / on the other hand" recitation.
4. **Thesis-driven.** Every position has an explicit thesis. Flag when reality contradicts it.
5. **Macro-first filtering.** The Phase 3 regime anchors everything. If a sector conflicts with the macro regime, say so explicitly.
6. **Institutions before technicals.** If institutional flows and technicals conflict, weight flows more heavily in the short run; technicals in the medium-term.
7. **Signal hierarchy**: Primary: Fundamental regime change → Secondary: Institutional flows → Tertiary: Sentiment → Quaternary: Technical levels.
