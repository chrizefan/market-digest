---
name: daily-delta
description: >
  Mon–Sat daily delta analysis. Triggers on weekday digest runs, "run delta", "daily delta",
  or when new-day.sh output shows "DAILY DELTA" mode. Loads the current week's baseline and
  any prior deltas, then writes delta files only for segments with material changes, and
  materializes a complete readable DIGEST.md for the dashboard and human readers.
---

# digiquant-atlas — Daily Delta Skill

This skill runs Mon–Sat (non-Sunday). Instead of rewriting everything from scratch, it:
1. Loads this week's baseline + any prior deltas
2. Triages which segments changed materially
3. Writes `.delta.md` files only for changed segments
4. Materializes a complete, readable `DIGEST.md`

Estimated token savings vs full run: **~70%** on a typical day.

---

## Pre-Flight: Delta Context Load

### Step 0: Read the Meta file
Read `outputs/daily/{{DATE}}/_meta.json` and confirm:
- `"type": "delta"` — confirms delta mode
- `"baseline"` — the baseline date (e.g. `"2026-04-05"`)
- `"delta_number"` — which delta this is this week (e.g. `1` = Monday)
- `"week"` — week label (e.g. `"2026-W15"`)

**If `_meta.json` is missing or type is not `"delta"`**: Stop and ask the user to run `./scripts/new-day.sh` first.

### Step 1: Load Config
- `config/watchlist.md` — full asset universe
- `config/investment-profile.md` — investor profile, risk tolerance, asset preferences, regime playbook

### Step 2: Load This Week's Baseline
Read these files fully — this is your analytical anchor for the week:
- `outputs/daily/{{BASELINE_DATE}}/DIGEST.md` — full baseline digest
- `outputs/daily/{{BASELINE_DATE}}/macro.md`
- `outputs/daily/{{BASELINE_DATE}}/bonds.md`
- `outputs/daily/{{BASELINE_DATE}}/commodities.md`
- `outputs/daily/{{BASELINE_DATE}}/forex.md`
- `outputs/daily/{{BASELINE_DATE}}/crypto.md`
- `outputs/daily/{{BASELINE_DATE}}/international.md`
- `outputs/daily/{{BASELINE_DATE}}/us-equities.md`
- `outputs/daily/{{BASELINE_DATE}}/sectors/` — read any sector files relevant to today

**Baseline anchors to extract** (note these explicitly before triage):
- Macro regime classification (4 factors)
- Overall bias per asset class
- SPY/QQQ/BTC/10Y/DXY/WTI/Gold closing levels
- Sector biases (OW/UW/N per sector)
- Active thesis statuses

### Step 3: Load Prior Deltas (if any)
If this is Delta #2 or later, read the DIGEST-DELTA.md files from prior deltas this week (in order).
These supersede the baseline for any fields they updated.
```
outputs/daily/[prior-delta-date]/DIGEST-DELTA.md
```
Note which fields have already been updated from the baseline's original values.

Announce: "Delta context loaded. Baseline: {{BASELINE_DATE}}. Running triage."

### Checkpoint: Pre-Flight
Run: `./scripts/validate-phase.sh preflight`
All checks must pass before proceeding. If any check fails (e.g., missing baseline, missing config), fix the issue and re-run.

---

## Segment Triage Protocol

Compare today's live data against the current state (baseline + any prior deltas). Classify each segment:

| Priority | Segments | Delta Threshold |
|----------|----------|-----------------|
| **Mandatory** | `macro`, `us-equities`, `crypto` | Always write delta — these move materially every day |
| **High** | `bonds`, `commodities`, `forex` | Write delta if: yield/price moved >0.5% from current state OR new CB signal |
| **Standard** | `international`, `institutional` | Write delta if: major regional event OR notable flow direction change |
| **Low** | `alt-data` sub-segments, all 11 sectors | Write delta if: bias shifted OR tracked name moved >1.5% |

**Output the triage summary** before proceeding (so the user can see what's being updated):
```
TRIAGE — {{DATE}} (Delta #{{DELTA_NUMBER}})
━━━━━━━━━━━━━━━━━━━
✏️  Will update: macro, crypto, bonds (+12bps move), technology (NVDA -4%)
➡️  Carrying forward: commodities, forex, international, healthcare, energy, financials, ...

Estimated delta files: 4-5 (vs 22 in full baseline)
```

---

## Phase 1 — Alternative Data Triage

Quickly scan (5 minutes max):
- Sentiment: Fear & Greed index vs baseline level; Reddit/social sentiment direction
- CTA positioning: Any new systematic trigger crossed since baseline?
- Options: Unusual OI or flow changes vs baseline profile
- Politicians/officials: Any new filings, statements, or trades since baseline?

**If material change** (sentiment shifted >10 pts, new CTA trigger, unusual options flow, new politician trade):
→ Write `outputs/daily/{{DATE}}/deltas/alt-data.delta.md` using `templates/delta-segment.md`

**If minimal change** (within noise): Skip writing the file. Note "carried forward" in triage.

### Checkpoint: Phase 1
Run: `./scripts/validate-phase.sh 1`
In delta mode, this validates any alt-data delta written or confirms carried-forward is intentional. **Review before proceeding.**

---

## Phase 2 — Institutional Intelligence Triage

Quickly scan:
- ETF flow direction today vs baseline direction (same/reversed?)
- Any new 13D/13G filings for tracked stocks?
- Any hedge fund news/positioning changes?

**If material change** (flow reversal, new filing, notable HF move):
→ Write `outputs/daily/{{DATE}}/deltas/institutional.delta.md`

### Checkpoint: Phase 2
Run: `./scripts/validate-phase.sh 2`
Validates any institutional delta written or confirms carried-forward. **Review before proceeding.**

---

## Phase 3 — Macro Delta (MANDATORY — Always Run)

Every day has macro developments: new data prints, Fed speak, overnight geopolitical events.
Even a "quiet" day should have a macro delta noting what didn't change.

Follow `skills/SKILL-macro.md` with delta framing:
- Compare the 4 macro factors (Growth/Inflation/Policy/Risk Appetite) vs baseline state
- Note today's data releases vs expectations
- Capture any central bank signals or geopolitical developments

**Always write**: `outputs/daily/{{DATE}}/deltas/macro.delta.md`

Use `templates/delta-segment.md`. The bias and regime fields may say "UNCHANGED" — that's fine.


### Checkpoint: Phase 3
Run: `./scripts/validate-phase.sh 3`
Macro delta is mandatory — this check must pass. **Do not proceed to Phase 4 until validated.**

---

## Phase 4 — Asset Class Deltas

For each asset class, check live data and compare against current state (baseline + prior deltas):

### 4A: Bonds & Rates
Check: 2Y yield, 10Y yield, 2s10s spread, HY spreads, Fed Funds futures
**Write delta** if: 2Y or 10Y moved ≥5bps vs current state, OR new Fed/BOE/ECB/BOJ signal.
→ `outputs/daily/{{DATE}}/deltas/bonds.delta.md`

### 4B: Commodities
Check: WTI, Brent, Gold, Copper, natgas
**Write delta** if: WTI/Brent moved ≥1%, Gold ≥0.5%, Copper ≥1%
→ `outputs/daily/{{DATE}}/deltas/commodities.delta.md`

### 4C: Forex
Check: DXY, EUR/USD, USD/JPY, USD/CNH, GBP/USD
**Write delta** if: DXY moved ≥0.3% OR major pair moved ≥0.5%
→ `outputs/daily/{{DATE}}/deltas/forex.delta.md`

### 4D: Crypto (MANDATORY — Always Run)
Crypto moves materially every single day.
Follow `skills/SKILL-crypto.md` with delta framing.
**Always write**: `outputs/daily/{{DATE}}/deltas/crypto.delta.md`

### 4E: International
Check: Nikkei 225, DAX, Shanghai Composite, Hang Seng, Sensex, Brazil Bovespa, major EM indices
**Write delta** if: major index moved ≥1% OR significant EM news event
→ `outputs/daily/{{DATE}}/deltas/international.delta.md`

### Checkpoint: Phase 4
Run: `./scripts/validate-phase.sh 4`
Verifies mandatory crypto delta exists. Validates any optional deltas written. **Do not proceed to Phase 5 until validated.**

---

## Phase 5 — US Equities Delta (MANDATORY — Always Run)

Equity market conditions change every session.

Follow `skills/SKILL-equity.md` with delta framing:
- What changed in index levels, breadth, and factor performance vs baseline?
- Which sectors are outperforming vs underperforming baseline?
- Any notable breadth divergences (rally on low breadth, selloff on high breadth)?

**Always write**: `outputs/daily/{{DATE}}/deltas/us-equities.delta.md`

### Sector Triage (5B–5L)
For each of the 11 GICS sectors, check if any tracked names moved >1.5% OR sector ETF moved >1% OR
sector bias would change vs baseline:

**Write sector delta** if threshold met:
→ `outputs/daily/{{DATE}}/sectors/[sector].delta.md`

**Skip** sectors where nothing moved significantly (carry forward from baseline).

### Checkpoint: Phase 5
Run: `./scripts/validate-phase.sh 5`
Verifies mandatory us-equities delta exists. Validates any sector deltas written. **Do not proceed to Phase 7 until validated.**

---

## Phase 7 — Build DIGEST-DELTA.md

Write the master digest-level delta to `outputs/daily/{{DATE}}/DIGEST-DELTA.md`.

Use `templates/delta-digest.md` as the structure. Populate it with:
1. **Delta Summary** — list all changed vs carried-forward segments
2. **Market Regime Snapshot** — UNCHANGED (copy from baseline/last delta) or SHIFTED (explain why)
3. **One delta block per changed segment** — use the segment deltas just written as the source
4. **Actionable Summary** — Always fresh: top 5 items for TODAY specifically
5. **Risk Radar** — Always fresh: top 3 risks for next 24–72 hours

---

## Phase 7B — Materialize DIGEST.md

Produce a full, readable `outputs/daily/{{DATE}}/DIGEST.md` by applying all today's deltas
to the baseline (and any prior deltas from this week).

**How to materialize:**
1. Start with the baseline `outputs/daily/{{BASELINE_DATE}}/DIGEST.md` as the document
2. If prior deltas exist, apply their changes in chronological order
3. Apply today's `DIGEST-DELTA.md` changes (sections marked CHANGED override; UNCHANGED carries)
4. Update all date/timestamp headers to `{{DATE}}`
5. The result must be a complete, self-contained file identical in structure to a baseline DIGEST.md

This materialized file is what the dashboard (`update-tearsheet.py`) reads — it must be a valid,
complete digest with all required sections present.

### Checkpoint: Phase 7
Run: `./scripts/validate-phase.sh 7`
Verifies both DIGEST-DELTA.md and materialized DIGEST.md exist with substantive content. Materialized DIGEST.md should be ≥50 lines. **Do not proceed to Phase 7C until validated.**

---

## Phase 7C — Delta Portfolio Monitor (Lightweight)

> On delta days, the portfolio layer is a **monitoring pass**, not a full reconstruction.
> The full anti-anchoring analyst → clean-slate → rebalance cycle runs on baseline days.
> Delta days check: did anything change enough to trigger action before the next baseline?

### Step 7C.1: Load Current State
Read `config/portfolio.json` — both `positions[]` (current) and `proposed_positions[]` (last PM recommendation).

### Step 7C.2: Threshold Scan
For each position in `positions[]`, check today's session data against thresholds:

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Thesis broken** | Any active thesis moved to ❌ Challenged for this asset | → Flag URGENT: run full analyst + PM for this position |
| **Invalidation trigger hit** | Price crossed the exit condition in the asset's most recent analyst report | → Flag URGENT |
| **Weight drift ≥10%** | Today's recommended weight (quick estimate from session bias) differs from current by ≥10% | → Flag for full PM review |
| **New opportunity** | Run scoped screener (`SKILL-opportunity-screener.md`, delta mode: max 2 candidates) — any non-held ticker scores Total ≥ +3 | → Flag for deliberation alongside triggered positions |
| **Regime shift** | Macro regime classification changed from baseline (e.g., Risk-on → Risk-off) | → Flag ALL positions for full PM review |

### Step 7C.3: Decision Fork

**If NO triggers fired:**
  ```
  ## {{DATE}}
  - Portfolio monitor: No threshold triggers. All positions within tolerance.
  - Next full review: [next Sunday's date]
  ```
- Skip Phase 7D entirely. Carry forward `proposed_positions` unchanged.
- Save a minimal `outputs/daily/{{DATE}}/rebalance-decision.md`:
  ```
  # Portfolio Monitor — {{DATE}} (Delta #{{DELTA_NUMBER}})
  **Status**: No rebalance triggers. All positions within threshold.
  **Thesis status**: [quick status for each — ✅/⚠️/❌/⏳]
  **Next full review**: [next Sunday]
  ```

**If ANY trigger fired:**
- Announce: "Portfolio threshold triggered: [reason]. Running scoped deliberation."
- Run `skills/SKILL-deliberation.md` for ONLY the triggered positions (not the full roster):
  - Round 1: Analyst presents for each triggered ticker per `skills/SKILL-asset-analyst.md`
  - PM Review: Challenge focuses specifically on the trigger condition
  - Round 2: Analyst defends, revises, or concedes
  - PM Decision: Accept / Override / Escalate
  - Save analyst reports to `outputs/daily/{{DATE}}/positions/{{TICKER}}.md`
  - Save deliberation transcript to `outputs/daily/{{DATE}}/deliberation.md`
- Then proceed to Phase 7D below (full PM review).

---

## Phase 7D — Portfolio Manager Review (Delta — Only If Triggered)

> This phase runs only when Phase 7C flagged a trigger. On quiet delta days, it is skipped.

Follow `skills/SKILL-portfolio-manager.md` Phases B and C:

**Phase B (Clean-Slate):** Collect analyst reports (newly triggered + carried from prior session for non-triggered positions). Build clean-slate portfolio.
Save to: `outputs/daily/{{DATE}}/portfolio-recommended.md`

**Phase C (Comparison):** Diff vs `config/portfolio.json` current positions. Apply ≥5% threshold.
Save to: `outputs/daily/{{DATE}}/rebalance-decision.md`
Update: `config/portfolio.json` → `proposed_positions[]`

### Checkpoint: Phases 7C/7D
Run: `./scripts/validate-phase.sh 7c && ./scripts/validate-phase.sh 7d`
Verifies portfolio monitor completed (rebalance-decision.md or monitor note exists). If triggered, validates deliberation transcript and portfolio files. **Do not proceed to Phase 8 until validated.**

---

## Phase 8 — Web Dashboard Update

Run: `python3 scripts/update-tearsheet.py`

Verify the command completes without error and `frontend/public/dashboard-data.json` is updated.

### Checkpoint: Phase 8
Run: `./scripts/validate-phase.sh 8`
Verifies dashboard-data.json is valid JSON and was recently updated. **Do not proceed to Phase 9 until validated.**

---

## Phase 9 — Post-Mortem & Evolution

Follow Phase 9 (`skills/SKILL-orchestrator.md`) exactly. The evolution loop runs every day, even
on delta days. The post-mortem is lightweight on delta days — just update quality-log.md with
today's delta quality assessment.

```markdown
## {{DATE}} — Delta #{{DELTA_NUMBER}} Post-Mortem

**Segments updated**: [list]
**Segments carried forward**: [list]
**Triage accuracy**: Were the right segments updated? Any that should have been skipped or added?
**Materialization quality**: Did the materialized DIGEST.md read naturally as a complete digest?
**Portfolio actions**: [rebalance decision summary or "No changes"]
```

### Checkpoint: Phase 9
Run: `./scripts/validate-phase.sh 9`
Verifies evolution files were updated for today.

---

## Final Validation

Run the full pipeline validation:
```bash
./scripts/validate-phase.sh --all
```
This runs every phase check in sequence and reports a consolidated pass/fail. All phases must pass before announcing session complete.

---

## Session Completion Checklist (Delta Mode)

- [ ] `_meta.json` read; baseline and delta number confirmed
- [ ] Baseline files loaded (DIGEST.md + segment files)
- [ ] Prior deltas loaded (if Delta #2+)
- [ ] Triage complete — changed vs carried-forward identified and announced
- [ ] Mandatory deltas written: `macro.delta.md`, `us-equities.delta.md`, `crypto.delta.md`
- [ ] Threshold-triggered deltas written for qualifying segments
- [ ] `DIGEST-DELTA.md` written (summarizes all changes)
- [ ] `DIGEST.md` materialized (complete, self-contained, dashboard-readable)
- [ ] Phase 7C: Portfolio monitor completed — triggers checked
- [ ] `update-tearsheet.py` executed successfully
- [ ] Evolution post-mortem complete (delta quality entry in quality-log.md)
- [ ] `git-commit.sh` run — commits **and pushes** to origin (triggers web dashboard update)
