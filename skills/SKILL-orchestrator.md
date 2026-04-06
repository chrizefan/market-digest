---
name: market-orchestrator
description: >
  Master orchestrator for the comprehensive daily market analysis pipeline. Triggers when the user says
  "run today's digest", "daily analysis", "morning brief", "market update", or pastes the new-day prompt.
  Replaces SKILL-digest.md as the primary pipeline driver. Runs a 9-phase sequential deep-dive (plus
  portfolio phases 7C/7D) where each phase is a dedicated sub-agent research task before synthesizing
  all findings into DIGEST.md, running the portfolio layer, and regenerating the web dashboard.
---

# digiquant-atlas — Master Orchestrator

This is the primary entry point for every comprehensive daily digest session.

---

## Run Mode Detection

Before doing anything else, check today's `_meta.json` to determine the run type:

```bash
cat outputs/daily/$(date +%Y-%m-%d)/_meta.json
```

| `_meta.json` type | Action |
|-------------------|--------|
| `"baseline"` | Continue below — run the full 9-phase pipeline (this skill) |
| `"delta"` | **Stop. Switch to `skills/SKILL-daily-delta.md` instead.** |
| File missing | Check day of week: Sunday → continue below. Mon–Sat → run `./scripts/new-day.sh` first |

**On Sundays** (or when `_meta.json` says baseline): Use `skills/SKILL-weekly-baseline.md` for the
enhanced baseline run that adds the Week Setup preamble and Week Ahead Calendar.

**On Mon–Sat** (when `_meta.json` says delta): Use `skills/SKILL-daily-delta.md` for the lightweight
delta run. Do NOT run this full orchestrator — that wastes ~70% of tokens unnecessarily.

---

## Full Pipeline (Baseline Mode)

This is the complete 9-phase pipeline. Only run when confirmed in baseline mode.
Follow all 9 phases sequentially. Do not skip phases. Each phase is a dedicated research task with its own output file.

---

## Pre-Flight: Session Context Boot

Before starting any phase, **sync the local repository** to ensure you have the latest code (including any merged evolution PRs):

```
git checkout master
git pull origin master
```

Then load the following. Do NOT summarize to the user — just internalize:

1. `config/watchlist.md` — full asset universe
2. `config/investment-profile.md` — investor identity, horizon, risk tolerance, asset preferences, regime playbook
3. `config/hedge-funds.md` — tracked fund reference
4. `config/data-sources.md` — tracked signal sources, KOL accounts, Polymarket topics
5. Yesterday's `DIGEST.md` if it exists (for continuity)

**After loading**, internally note:
- Active theses and their current status
- Macro regime from the last digest (to compare with today)

### Data Layer Check
Verify that `outputs/daily/{{DATE}}/data/quotes.json` and `outputs/daily/{{DATE}}/data/macro.json` exist.
- **If present**: announce their presence to user so they know numerical grounding is available.
- **If missing — try local scripts first**:
  Run `./scripts/fetch-market-data.sh` (or `python3 scripts/fetch-quotes.py && python3 scripts/fetch-macro.py`).
  This provides the richest data (full technicals, OHLCV history, Bollinger Bands, ATR).
- **If scripts fail** (sandbox, missing yfinance, network restrictions):
  Follow `skills/SKILL-mcp-data-fetch.md` to fetch data via MCP tools (FRED, Alpha Vantage,
  CoinGecko, Frankfurter). This produces the same JSON schema with slightly reduced coverage
  (fewer tickers, limited technicals). MCP mode is sufficient for high-quality analysis.

Skills that consume the data layer:
- `SKILL-macro.md` (Phase 3) — reads `macro-summary.md` for yield curve and VIX
- `SKILL-equity.md` (Phase 5A) — reads `quotes-summary.md` for all position technicals
- `SKILL-opportunity-screener.md` (Phase 7B) — reads `quotes-summary.md` for Technical Score

Announce to user: "Context loaded. Starting Phase 1 of 9."

### Checkpoint: Pre-Flight
Run: `./scripts/validate-phase.sh preflight`
All checks must pass before proceeding. If any check fails, fix the issue (e.g., run `./scripts/new-day.sh`, create missing config) and re-run until clean.

---

## Phase 1 — Alternative Data & Signals

> These signals inform everything downstream. Run them FIRST so that sentiment, positioning, and institutional flows color the macro and segment reads. Alternatives that contradict fundamentals are often the most important signals.

### 1A: Sentiment & News Intelligence
Follow `skills/alternative-data/SKILL-sentiment-news.md` completely.
Save output to: `outputs/daily/{{DATE}}/sentiment-news.md`

### 1B: CTA & Systematic Positioning
Follow `skills/alternative-data/SKILL-cta-positioning.md` completely.
Save output to: `outputs/daily/{{DATE}}/cta-positioning.md`

### 1C: Options & Derivatives Intelligence
Follow `skills/alternative-data/SKILL-options-derivatives.md` completely.
Save output to: `outputs/daily/{{DATE}}/options-derivatives.md`

### 1D: Politician & Official Signals
Follow `skills/alternative-data/SKILL-politician-signals.md` completely.
Save output to: `outputs/daily/{{DATE}}/politician-signals.md`

### Checkpoint: Phase 1
Run: `./scripts/validate-phase.sh 1`
Verifies all 4 alt-data files exist and have substantive content. **Do not proceed to Phase 2 until all checks pass.**

---

## Phase 2 — Institutional Intelligence

> Institutional flows and hedge fund positioning reveal where real capital is moving. These signals are often 1-4 weeks ahead of public price moves.

### 2A: Institutional Flows
Follow `skills/institutional/SKILL-institutional-flows.md` completely.
Save output to: `outputs/daily/{{DATE}}/institutional-flows.md`

### 2B: Hedge Fund Intelligence
Follow `skills/institutional/SKILL-hedge-fund-intel.md` completely.
Save output to: `outputs/daily/{{DATE}}/hedge-fund-intel.md`

### Checkpoint: Phase 2
Run: `./scripts/validate-phase.sh 2`
Verifies both institutional files exist with content. **Do not proceed to Phase 3 until all checks pass.**

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

### Checkpoint: Phase 3
Run: `./scripts/validate-phase.sh 3`
Verifies macro.md exists with regime classification. The macro regime anchors all Phase 4–5 analysis — **do not proceed until validated.**

---

## Phase 4 — Asset Class Deep Dives

> Run each asset class analysis through its own dedicated skill. Each reads the macro regime output. Order: bonds → commodities → forex → crypto → international. This order reflects risk hierarchy (safest to most volatile, plus international is DXY-dependent).

### 4A: Bonds & Rates
Follow `skills/SKILL-bonds.md` — reference today's macro regime.
Save output to: `outputs/daily/{{DATE}}/bonds.md`

### 4B: Commodities
Follow `skills/SKILL-commodities.md` — reference macro regime + bonds/yield output.
Save output to: `outputs/daily/{{DATE}}/commodities.md`

### 4C: Forex
Follow `skills/SKILL-forex.md` — reference macro regime + bonds.
Save output to: `outputs/daily/{{DATE}}/forex.md`

### 4D: Crypto & Digital Assets
Follow `skills/SKILL-crypto.md` — reference macro regime + institutional flow data (IBIT/BTC ETF flows).
Save output to: `outputs/daily/{{DATE}}/crypto.md`

### 4E: International & Emerging Markets
Follow `skills/SKILL-international.md` — reference macro regime + DXY from forex output.
Save output to: `outputs/daily/{{DATE}}/international.md`

### Checkpoint: Phase 4
Run: `./scripts/validate-phase.sh 4`
Verifies all 5 asset-class files (bonds, commodities, forex, crypto, international) exist with content. **Do not proceed to Phase 5 until all checks pass.**

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

### 5B–5L: Sector Sub-Agents (All 11 GICS Sectors)

**Before running sector sub-agents, classify each sector into a depth tier:**

| Tier | Criteria | Output depth |
|------|----------|--------------|
| **Full** | Current portfolio holding OR screener score ≥ +2 OR sector ETF moved >1% today | Full skill run — comprehensive analysis (~80 lines) |
| **Compressed** | No holding, screener score ≤ +1, sector ETF quiet (<1% move) | 3-paragraph summary: bias + 3 key drivers + 1 portfolio implication (~25 lines) |

On a typical day expect 3–5 Full sectors, 6–8 Compressed. This reduces sector token cost by ~50% vs running all 11 at full depth.

Run each sector skill (Full) or compressed summary (Compressed) sequentially. Each reads the macro regime output and references Phase 5A.

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

### Checkpoint: Phase 5
Run: `./scripts/validate-phase.sh 5`
Verifies us-equities.md + all 11 sector files exist with content (≥10 lines each). **Do not proceed to Phase 7 until all checks pass.**

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

### Checkpoint: Phase 7
Run: `./scripts/validate-phase.sh 7`
Verifies DIGEST.md exists with ≥50 lines and contains required sections (Market Regime, Thesis Tracker, Actionable Summary, Risk Radar). **Do not proceed to Phase 7B until validated.**

---

## Phase 7B — Opportunity Screen

> Systematic scan of the full ETF watchlist against today's research. Translates digest
> findings into a ranked list of tickers worth analyst coverage — both current holdings
> (mandatory) and new opportunity candidates (screener-selected).

Follow `skills/SKILL-opportunity-screener.md` completely:

1. Load `config/watchlist.md` (full ~60 ticker universe) + today's segment outputs + macro regime
2. Score every ticker: regime alignment + signal scan (flows, options, CTA, thesis, sector bias)
3. Rank and filter: current holdings are mandatory; top 3-5 non-held tickers with Total ≥ +2 become opportunity candidates
4. Save to: `outputs/daily/{{DATE}}/opportunity-screen.md`

The screener output defines the **analyst roster** for Phase 7C deliberation.

Announce: "Screen complete. [N] tickers scanned, [M] opportunities identified. Analyst roster: [list]"

### Checkpoint: Phase 7B
Run: `./scripts/validate-phase.sh 7b`
Verifies opportunity-screen.md exists. **Do not proceed to Phase 7C until validated.**

---

## Phase 7C — Analyst-PM Deliberation

> Multi-round deliberation: analysts present thesis-driven recommendations, PM challenges
> weak or conflicting positions, analysts defend or revise. Produces higher-conviction
> portfolio inputs through structured debate.

Follow `skills/SKILL-portfolio-manager.md` **Phase A** completely. Phase A now routes to
`skills/SKILL-deliberation.md` which runs the full deliberation protocol:

1. Read `outputs/daily/{{DATE}}/opportunity-screen.md` for the analyst roster (current holdings + screener-selected candidates)
2. **Round 1**: Each analyst presents per `skills/SKILL-asset-analyst.md` → `positions/{{TICKER}}.md`
4. **PM Review**: Identify challenges (conflicted bias, damaged thesis, regime contradiction, etc.)
5. **Round 2**: Challenged analysts defend, revise, or concede
6. **PM Decision**: Accept / Override / Escalate for each position
7. Save deliberation transcript to: `outputs/daily/{{DATE}}/deliberation.md`

Announce after completing: "Deliberation complete. [N] resolved, [M] challenged, [K] revised."

### Checkpoint: Phase 7C
Run: `./scripts/validate-phase.sh 7c`
Verifies deliberation.md transcript and analyst position files in `positions/`. **Do not proceed to Phase 7D until validated.**

---

## Phase 7D — Portfolio Manager Review

> Clean-slate portfolio construction followed by comparison vs current positions.
> This phase produces the rebalance decision — the most actionable output of the full pipeline.

Follow `skills/SKILL-portfolio-manager.md` **Phases B and C** completely:

**Phase B (Clean-Slate — still blinded to weights):**
1. Read all analyst outputs from `outputs/daily/{{DATE}}/positions/`
2. Apply theme caps and weight constraints from `config/preferences.md`
3. Build ideal target portfolio
4. Save to: `outputs/daily/{{DATE}}/portfolio-recommended.md`

**Phase C (Comparison — NOW load current weights):**
1. Load `config/portfolio.json` positions with weights
2. Diff recommended vs current; apply ≥5% threshold
3. Produce rebalance table with actions (Hold/Add/Trim/Exit/New)
4. Save to: `outputs/daily/{{DATE}}/rebalance-decision.md`
5. Update `config/portfolio.json` → `proposed_positions[]`

### Checkpoint: Phase 7D
Run: `./scripts/validate-phase.sh 7d`
Verifies portfolio-recommended.md, rebalance-decision.md, and portfolio.json proposed_positions. **Do not proceed to Phase 8 until validated.**

---

## Phase 8 — Web Dashboard Update

> To ensure the interactive web application always reflects the latest analysis, you must explicitly trigger the backend generator.

Run the following command exactly in your environment to parse the directories and output the new metric JSON to the frontend:
`python3 scripts/update-tearsheet.py`

Wait for it to confirm the update to `dashboard-data.json`.

After the dashboard update succeeds, commit and push all digest outputs:
`./scripts/git-commit.sh`

This commits **and pushes** to `origin/master` — triggering a GitHub Pages redeploy so the web dashboard reflects today's analysis. Confirm the script prints `✅ Committed + pushed`.

This creates the **first commit** — the daily digest outputs.

### Checkpoint: Phase 8
Run: `./scripts/validate-phase.sh 8`
Verifies dashboard-data.json exists, is valid JSON, and was recently updated. **Do not proceed to Phase 9 until validated.**

---

## Phase 9 — Post-Mortem & Evolution

> Self-improvement loop. The pipeline gets smarter every day by recording what worked,
> what didn't, and proposing refinements. This phase has **strict guardrails** to prevent
> uncontrolled drift.

### 9A: Source Scorecard Update
- **Sources Used Today**: Rate every data source accessed (1-5 stars for quality/freshness)
- **Sources That Failed**: Log any that were unavailable, paywalled, stale, or returned errors
- **New Sources Discovered**: Record any new X accounts, URLs, or data providers found during research
- **GUARDRAIL**: Do NOT modify `config/data-sources.md` — only record observations here
- **Save to**: `outputs/daily/{{DATE}}/evolution/sources.md`

### 9B: Quality Post-Mortem
- **Signal Accuracy**: Check yesterday's actionable items and predictions — were they correct? Mark ✅/❌/⏳
- **Coverage Gaps**: Note data you wanted but couldn't find (missing indicators, sectors with thin analysis)
- **Data Freshness Issues**: Flag any data that was stale or delayed
- **Quality Score**: Self-assess today's digest on these 5 dimensions (1-5 scale each):
  - Data completeness | Signal clarity | Actionability | Continuity with prior | Positioning quality
- **Save to**: `outputs/daily/{{DATE}}/evolution/quality-log.md`

### 9C: Improvement Proposals

**STRICT RULES FOR PROPOSALS:**
1. You may ONLY propose changes — **never execute them directly**
2. Maximum **2 proposals per session** to prevent drift
3. Each proposal must specify: target file, exact change, rationale with data
4. Categories: `Source Addition` | `Skill Refinement` | `Template Update` | `Efficiency`
5. **LOCKED — you may NOT propose changes to:**
   - Output schema/structure (`templates/master-digest.md` sections are immutable)
   - Risk profile or position sizing (`config/investment-profile.md` §4 Risk Constraints)
   - These guardrails themselves
6. Read `outputs/daily/{{DATE}}/evolution/proposals.md` before filing to avoid duplicates
- **Save to**: `outputs/daily/{{DATE}}/evolution/proposals.md`

### 9D: Document Applied Improvements
If any previously pending proposals have been approved and applied during this session, document them in `docs/evolution-changelog.md` with:
- Date applied, proposal ID, category
- Target file(s) and exact change made
- Rationale (reference quality-log or sources.md evidence)
- Expected measurable impact
- Commit hash

### 9E: Evolution Branch & PR
After completing the post-mortem, commit evolution artifacts to a **dedicated branch** and open a PR:
`./scripts/git-commit.sh --evolution`

This script will:
1. Create a branch named `evolve/YYYY-MM-DD`
2. Stage `outputs/daily/{{DATE}}/evolution/` and `docs/evolution-changelog.md`
3. Push the branch and create a GitHub Pull Request
4. Switch back to `master` so the repo is clean for the next daily run

**The PR requires manual user approval before merging into master.** This ensures no pipeline changes are applied without explicit review. Approved proposals will only take effect once the PR is merged and the next session pulls the latest master.

### Checkpoint: Phase 9
Run: `./scripts/validate-phase.sh 9`
Verifies `outputs/daily/{{DATE}}/evolution/` files exist with content.

---

## Final Validation

Run the full pipeline validation:
```bash
./scripts/validate-phase.sh --all
```
This runs every phase check in sequence and reports a consolidated pass/fail. All phases must pass before announcing session complete. If any phase fails, go back and fix the missing output, then re-run `--all`.

---

## Session Completion Checklist

Confirm all of the following before ending the session:

- [ ] Phase 1: 4 alternative data files created
- [ ] Phase 2: 2 institutional intelligence files created
- [ ] Phase 3: `macro.md` created
- [ ] Phase 4: `bonds.md`, `commodities.md`, `forex.md`, `crypto.md`, `international.md` created
- [ ] Phase 5: `us-equities.md` + 11 sector files in `sectors/` created
- [ ] Phase 7: `DIGEST.md` created
- [ ] Phase 7B: Opportunity screen complete; `outputs/daily/{{DATE}}/opportunity-screen.md` saved; analyst roster determined
- [ ] Phase 7C: Deliberation complete; transcript in `outputs/daily/{{DATE}}/deliberation.md`; analyst reports in `positions/`
- [ ] Phase 7D: `portfolio-recommended.md` + `rebalance-decision.md` created; `portfolio.json` proposed_positions updated
- [ ] Phase 8: `update-tearsheet.py` executed successfully; digest commit created
- [ ] Phase 9: Post-mortem completed; source scorecard, quality log updated; evolution commit created

**Total output files per day: ~21 segment files + DIGEST.md + deliberation.md + analyst positions/ + portfolio-recommended.md + rebalance-decision.md + 3 evolution files = 29 files**

Print to user: "✅ Digest complete. Two commits created: digest outputs + pipeline evolution."

---

## Quality Principles (Always Apply)

1. **Search for everything.** Never rely on training data for prices, yields, levels, or news.
2. **Maintain continuity.** Every analysis explicitly references prior context from previous day's outputs. This is NOT a fresh-start diary — it's a living research thread.
3. **Be opinionated.** The user is an experienced investor. They need a clear directional read, not a "on the one hand / on the other hand" recitation.
4. **Thesis-driven.** Every position has an explicit thesis. Flag when reality contradicts it.
5. **Macro-first filtering.** The Phase 3 regime anchors everything. If a sector conflicts with the macro regime, say so explicitly.
6. **Institutions before technicals.** If institutional flows and technicals conflict, weight flows more heavily in the short run; technicals in the medium-term.
7. **Signal hierarchy**: Primary: Fundamental regime change → Secondary: Institutional flows → Tertiary: Sentiment → Quaternary: Technical levels.
