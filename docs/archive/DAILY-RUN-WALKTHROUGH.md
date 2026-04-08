# digiquant-atlas — Daily Run Walkthrough

> Step-by-step documentation of a complete daily pipeline run, from morning start
> to web page update and post-mortem report. Covers both Baseline (Sunday) and
> Delta (Mon-Sat) modes.

---

## Table of Contents

1. [Morning Start — Operator Actions](#1-morning-start--operator-actions)
2. [Pre-Flight — Agent Boot Sequence](#2-pre-flight--agent-boot-sequence)
3. [Phase 1 — Alternative Data Gathering](#3-phase-1--alternative-data-gathering)
4. [Phase 2 — Institutional Intelligence](#4-phase-2--institutional-intelligence)
5. [Phase 3 — Macro Regime Classification](#5-phase-3--macro-regime-classification)
6. [Phase 4 — Asset Class Deep Dives](#6-phase-4--asset-class-deep-dives)
7. [Phase 5 — US Equities + 11 Sectors](#7-phase-5--us-equities--11-sectors)
8. [Phase 7 — Master Synthesis](#8-phase-7--master-synthesis)
9. [Phase 7B-D — Portfolio Layer](#9-phase-7b-d--portfolio-layer)
10. [Phase 8 — Dashboard Update + Deploy](#10-phase-8--dashboard-update--deploy)
11. [Phase 9 — Post-Mortem & Evolution](#11-phase-9--post-mortem--evolution)
12. [Final Validation & Session Close](#12-final-validation--session-close)
13. [Delta Day — Abbreviated Flow](#13-delta-day--abbreviated-flow)
14. [Failure Modes & Recovery](#14-failure-modes--recovery)
15. [Post-Mortem Template for Future Improvements](#15-post-mortem-template-for-future-improvements)

---

## 1. Morning Start — Operator Actions

### What the operator does (before the AI agent starts)

```
OPERATOR'S MORNING CHECKLIST
─────────────────────────────

1. Open terminal in the digiquant-atlas repo root
2. Run: ./scripts/new-day.sh
3. Copy the printed prompt
4. Paste the prompt into the AI agent session (Claude, Copilot, etc.)
5. Let the agent run
```

### What `new-day.sh` does internally

```
new-day.sh execution:

  ┌─────────────────────────────────────┐
  │  Detect day of week                  │
  │  $(date +%u)                         │
  └──────────┬──────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  Sunday            Mon-Sat
  (DOW=7)           (DOW=1-6)
    │                 │
    ▼                 ▼
  BASELINE           DELTA
  mode               mode
    │                 │
    ▼                 ▼
  Create:            Find this week's
  outputs/daily/     baseline by scanning
    YYYY-MM-DD/      backwards up to 6 days
    _meta.json       │
    DIGEST.md        Create:
    macro.md         outputs/daily/YYYY-MM-DD/
    bonds.md           _meta.json (type: delta,
    ...etc             baseline: YYYY-MM-DD)
    sectors/           deltas/
    positions/         sectors/
                       positions/
    │                 │
    ▼                 ▼
  Print prompt:      Print prompt:
  "Run WEEKLY        "Run DAILY DELTA
   BASELINE for       for YYYY-MM-DD.
   YYYY-MM-DD.        Baseline:
   Read SKILL-        YYYY-MM-DD.
   weekly-            Read SKILL-
   baseline.md"       daily-delta.md"
```

### Expected _meta.json output

**Baseline (Sunday):**
```json
{
  "type": "baseline",
  "date": "2026-04-05",
  "week": "2026-W14",
  "created": "2026-04-05T08:30:00"
}
```

**Delta (Weekday):**
```json
{
  "type": "delta",
  "date": "2026-04-06",
  "week": "2026-W14",
  "baseline": "2026-04-05",
  "delta_number": 1,
  "created": "2026-04-06T08:15:00"
}
```

---

## 2. Pre-Flight — Agent Boot Sequence

Once the operator pastes the prompt, the AI agent begins. Here is exactly what happens:

### Step 2.1: Repository Sync

```bash
git checkout master
git pull origin master
```

**Purpose**: Pull any merged evolution PRs from previous sessions. This ensures the agent is working with the latest skill files, templates, and configuration.

### Step 2.2: Config Internalization

The agent reads (silently — not printed to user) these files:

| File | What the agent extracts |
|------|------------------------|
| `config/watchlist.md` | ~60 ETFs across all asset classes — the full tracking universe |
| `config/investment-profile.md` | Risk tolerance, horizon (12-24 months), CAD investor, regime playbook |
| `config/hedge-funds.md` | 16 funds with CIK, X handles, investment style |
| `config/data-sources.md` | 30+ X accounts, FRED series IDs, MCP server references |
| Yesterday's `DIGEST.md` | Prior regime, positions, thesis status — for continuity anchoring |

**After reading**, the agent internally notes:
- Current macro regime (from last digest)
- Active theses and their invalidation triggers
- Any positions approaching stop-loss levels

### Step 2.3: Data Layer Fetch

```
Data Layer Decision Tree:

  Is yfinance installed in .venv?
  │
  ├── YES → Run ./scripts/fetch-market-data.sh
  │         │
  │         ├── fetch-quotes.py
  │         │   → 3-month OHLCV for all watchlist tickers
  │         │   → Technical indicators: RSI, MACD, SMA(20/50/200),
  │         │     ATR, Bollinger Bands
  │         │   → Output: data/quotes.json + data/quotes-summary.md
  │         │
  │         └── fetch-macro.py
  │             → US Treasury Yield Curve XML (2yr, 5yr, 10yr, 30yr)
  │             → VIX, DXY, FX pairs, commodity prices, crypto
  │             → Output: data/macro.json + data/macro-summary.md
  │
  └── NO  → Follow skills/mcp-data-fetch/SKILL.md
            │
            ├── MCP: FRED → yield curve, rates, economic indicators
            ├── MCP: Alpha Vantage → stock prices, earnings
            ├── MCP: CoinGecko → crypto prices, market cap
            ├── MCP: Frankfurter → FX rates
            └── Output: same JSON schema, reduced coverage
```

**Expected output files after data fetch:**
```
outputs/daily/YYYY-MM-DD/data/
├── quotes.json          (~200KB, all ticker OHLCV + technicals)
├── quotes-summary.md    (~5KB, human-readable table)
├── macro.json           (~50KB, yield curve + VIX + FX + commodities)
└── macro-summary.md     (~3KB, human-readable summary)
```

### Step 2.4: Pre-Flight Validation

```bash
./scripts/validate-phase.sh preflight
```

**Checks performed:**
- [x] Output directory exists (`outputs/daily/YYYY-MM-DD/`)
- [x] `_meta.json` exists
- [x] `config/watchlist.md` exists (≥3 lines)
- [x] `config/preferences.md` exists (≥3 lines)
- [x] `config/investment-profile.md` exists (≥3 lines)
- [x] `config/hedge-funds.md` exists (≥3 lines)
- [x] `config/data-sources.md` exists (≥3 lines)
- [x] (Delta only) Baseline DIGEST.md exists and has >10 lines

**Agent announces**: "Context loaded. Starting Phase 1 of 9."

---

## 3. Phase 1 — Alternative Data Gathering

**Duration**: ~10-15 minutes of agent research
**Purpose**: Gather non-traditional signals that often lead price moves by 1-4 weeks

### Sub-phases

| Sub-phase | Skill File | Output | What the agent researches |
|-----------|-----------|--------|---------------------------|
| 1A | `SKILL-sentiment-news.md` | `sentiment-news.md` | X/Twitter sentiment, news flow, Fear & Greed index, put/call ratio, retail sentiment |
| 1B | `SKILL-cta-positioning.md` | `cta-positioning.md` | CTA trend-following signals, systematic positioning, CFTC COT data, vol-targeting flows |
| 1C | `SKILL-options-derivatives.md` | `options-derivatives.md` | Options GEX (gamma exposure), dark pool prints, unusual options activity, skew/term structure |
| 1D | `SKILL-politician-signals.md` | `politician-signals.md` | Congressional trades, Fed speaker schedule/commentary, executive orders, sanctions |

### Gate Check
```bash
./scripts/validate-phase.sh 1
# Checks: All 4 files exist with ≥5 lines each
```

**Why Phase 1 runs first**: Alternative data (especially CTA positioning and institutional flows) provides leading signals. A sentiment reading that contradicts the fundamental picture is often the most important signal of the day.

---

## 4. Phase 2 — Institutional Intelligence

**Duration**: ~5-10 minutes
**Purpose**: Track where real capital is moving

| Sub-phase | Skill File | Output | What the agent researches |
|-----------|-----------|--------|---------------------------|
| 2A | `SKILL-institutional-flows.md` | `institutional-flows.md` | ETF creation/redemption, sector ETF flows, bond fund flows, money market flows |
| 2B | `SKILL-hedge-fund-intel.md` | `hedge-fund-intel.md` | 13D/13G filings, tracked fund commentary (16 funds), short interest changes |

### Gate Check
```bash
./scripts/validate-phase.sh 2
```

---

## 5. Phase 3 — Macro Regime Classification

**Duration**: ~10-15 minutes
**Purpose**: Establish the 4-factor macro regime that anchors ALL downstream analysis

### The 4-Factor Regime Model

```
┌────────────────────────────────────────────────────────┐
│              MACRO REGIME CLASSIFICATION                │
│                                                        │
│  GROWTH ─────── Expanding │ Slowing │ Contracting     │
│  INFLATION ──── Hot │ Cooling │ Cold                   │
│  POLICY ─────── Tightening │ Neutral │ Easing         │
│  RISK APPETITE─ Risk-on │ Risk-off │ Mixed            │
│                                                        │
│  Combined → Overall Bias:                              │
│  Bullish / Bearish / Neutral / Conflicted / Cautious   │
└────────────────────────────────────────────────────────┘
```

### What the agent researches
- Latest economic data releases (GDP, CPI, NFP, ISM, PMI)
- Fed speaker commentary and rate expectations
- Yield curve shape and movement (2s10s spread, 3m10y)
- VIX level and trend
- DXY (dollar index)
- Cross-reference with Phase 1 signals: Do sentiment/CTA/politicians confirm or contradict?

### Output: `macro.md`
- Regime classification (4 factors)
- Data calendar: upcoming releases this week
- Central bank watch
- Geopolitical risks
- **Overall Bias with rationale**

### Gate Check
```bash
./scripts/validate-phase.sh 3
# CRITICAL GATE: This regime anchors Phases 4-5
```

---

## 6. Phase 4 — Asset Class Deep Dives

**Duration**: ~20-30 minutes (5 segments)
**Purpose**: Analyze each non-equity asset class through the lens of the macro regime

### Execution Order (deliberate — flows from safest to most volatile)

```
4A: BONDS ────────── Safest; rate-sensitive; sets yield context
       │
       ▼
4B: COMMODITIES ──── Reads macro + yield context
       │
       ▼
4C: FOREX ────────── Reads macro + rates; DXY critical for 4E
       │
       ▼
4D: CRYPTO ───────── Reads macro + inst. flows (IBIT ETF)
       │
       ▼
4E: INTERNATIONAL── Reads macro + DXY from forex; EM is DXY-dependent
```

### Per-segment output structure

Each segment file (e.g., `bonds.md`) includes:
1. Current levels (searched live — never training data)
2. Technical analysis (from data layer or web search)
3. Fundamental drivers
4. Cross-reference with macro regime
5. Bias statement: Bullish / Bearish / Neutral / Conflicted
6. Portfolio implication

### Gate Check
```bash
./scripts/validate-phase.sh 4
# Checks: bonds.md, commodities.md, forex.md, crypto.md, international.md
# All must exist with ≥5 lines
```

---

## 7. Phase 5 — US Equities + 11 Sectors

**Duration**: ~30-45 minutes (most time-consuming phase)

### 5A: Market Overview

The agent researches:
- Index levels: SPY, QQQ, IWM, DIA
- Market breadth: NYSE advance/decline, new 52W highs vs lows
- Factor performance: Value (VTV) vs Growth (VUG) vs Momentum (MTUM) vs Quality (QUAL)
- Overall technical trend of the S&P 500

Output: `us-equities.md`

### 5B-L: Sector Sub-Agents (11 GICS Sectors)

**Tiering system** (reduces token cost ~50%):

```
SECTOR TIER CLASSIFICATION
──────────────────────────

  Full Depth (~80 lines per sector):
  ├── Current portfolio holding
  ├── Screener score ≥ +2
  └── Sector ETF moved > 1% today

  Compressed (~25 lines per sector):
  ├── No holding
  ├── Screener score ≤ +1
  └── Sector ETF quiet (< 1% move)

  Typical day: 3-5 Full, 6-8 Compressed
```

| Phase | Sector | ETF | Skill File |
|-------|--------|-----|-----------|
| 5B | Technology | XLK | `SKILL-sector-technology.md` |
| 5C | Healthcare | XLV | `SKILL-sector-healthcare.md` |
| 5D | Energy | XLE | `SKILL-sector-energy.md` |
| 5E | Financials | XLF | `SKILL-sector-financials.md` |
| 5F | Consumer Staples | XLP | `SKILL-sector-consumer-staples.md` |
| 5G | Consumer Disc | XLY | `SKILL-sector-consumer-disc.md` |
| 5H | Industrials | XLI | `SKILL-sector-industrials.md` |
| 5I | Utilities | XLU | `SKILL-sector-utilities.md` |
| 5J | Materials | XLB | `SKILL-sector-materials.md` |
| 5K | Real Estate | XLRE | `SKILL-sector-real-estate.md` |
| 5L | Communications | XLC | `SKILL-sector-comms.md` |

### 5M: Sector Scorecard

After all 11 sectors, the agent produces:

```
SECTOR SCORECARD — YYYY-MM-DD
| Sector          | ETF  | Bias | Confidence | Key Driver          |
|-----------------|------|------|------------|---------------------|
| Technology      | XLK  | OW   | M          | AI capex cycle      |
| Healthcare      | XLV  | N    | M          | Defensive bid fading|
| Energy          | XLE  | OW   | H          | Iran war premium    |
| ...             | ...  | ...  | ...        | ...                 |
```

Aggregate into: **Net Equity Bias** (Bullish / Bearish / Neutral / Conflicted)

### Gate Check
```bash
./scripts/validate-phase.sh 5
# Checks: us-equities.md + 11 sector files (≥10 lines each)
```

---

## 8. Phase 7 — Master Synthesis

**Duration**: ~15-20 minutes
**Purpose**: Transform 20+ individual segment outputs into a coherent daily brief

### What goes into DIGEST.md

```
DIGEST.md Structure:
─────────────────────

  ## Market Regime Snapshot
  → Single dominant force today + 4-factor regime

  ## Alternative Data Dashboard
  → 1-paragraph synthesis of Phase 1 signals
  → Lead with any signal contradicting fundamentals

  ## Institutional Intelligence Summary
  → Key ETF flow direction + notable HF signals

  ## Macro
  → Full section from macro.md

  ## Asset Classes
  → Full sections from bonds/commodities/forex/crypto/international

  ## US Equities
  → Overview + Sector Scorecard (all 11)

  ## Thesis Tracker
  → Status of each active thesis: ✅ Confirmed / ⚠️ Conflicted / ❌ Challenged

  ## Portfolio Positioning Recommendations
  → Current positions with thesis status
  → Rebalancing recommendations (Trim/Add/Hold/Exit) with conviction level

  ## Actionable Summary
  → Top 5 items ranked by priority

  ## Risk Radar
  → What could break the bias in 24-72 hours
```

### snapshot.json (structured sidecar)

Written alongside DIGEST.md for machine consumption:

```json
{
  "schema_version": "1.0",
  "date": "2026-04-06",
  "run_type": "baseline",
  "regime": { "label": "...", "bias": "...", "conviction": "...", "summary": "..." },
  "positions": [ { "ticker": "IAU", "weight_pct": 20, "action": "HOLD", ... } ],
  "theses": [ { "id": "T-001", "name": "...", "status": "ACTIVE", ... } ],
  "market_data": { "SPY": 502.3, "VIX": 28.5, "DXY": 99.1, ... },
  "segment_biases": { "macro": "Bearish", "bonds": "Neutral", ... },
  "sector_biases": { "technology": "OW", "energy": "OW", ... },
  "actionable": [ "item1", "item2", ... ],
  "risks": [ "risk1", "risk2", ... ],
  "portfolio_posture": "Defensive",
  "cash_pct": 55
}
```

### Gate Check
```bash
./scripts/validate-phase.sh 7
# Checks: DIGEST.md ≥50 lines + contains "Market Regime", "Thesis Tracker",
#          "Actionable Summary", "Risk Radar" sections
```

---

## 9. Phase 7B-D — Portfolio Layer

### Phase 7B: Opportunity Screen

```
Watchlist (~60 tickers)
       │
       ▼
Score each ticker:
  ├── Regime alignment (+2 to -2)
  ├── Signal scan (flows, options, CTA, thesis, sector bias)
  ├── Technical score (from data layer)
  └── Total score = sum
       │
       ▼
Filter:
  ├── Current holdings → MANDATORY (always included)
  └── Non-held tickers → Include if Total ≥ +2
       │
       ▼
Analyst Roster = Holdings + Top 3-5 candidates
Output: opportunity-screen.md
```

### Phase 7C: Analyst-PM Deliberation

```
DELIBERATION PROTOCOL
─────────────────────

  ROUND 1: Analysts present
  ├── For each ticker on the roster:
  │   └── Read SKILL-asset-analyst.md
  │       Write positions/{TICKER}.md
  │       Include: thesis, price target, invalidation, sizing
  │
  PM REVIEW: Challenge weak positions
  ├── Conflicted bias?
  ├── Damaged thesis?
  ├── Regime contradiction?
  └── Insufficient data?
  │
  ROUND 2: Defense or revision
  ├── Challenged analysts defend or concede
  │
  PM DECISION: For each position
  ├── Accept ──── Position enters recommended portfolio
  ├── Override ── PM overrules with documented rationale
  └── Escalate ── Flag for manual operator review

  Output: deliberation.md (full transcript)
```

### Phase 7D: Portfolio Manager Review

```
PHASE B — Clean-Slate Construction (blinded to current weights)
  ├── Read all analyst outputs from positions/
  ├── Apply theme caps and weight constraints
  ├── Build ideal target portfolio
  └── Output: portfolio-recommended.md

PHASE C — Comparison (NOW load current weights)
  ├── Load config/portfolio.json positions
  ├── Diff recommended vs current
  ├── Apply ≥5% threshold for changes
  ├── Produce rebalance table:
  │     | Ticker | Current% | Recommended% | Change | Action | Urgency |
  └── Output: rebalance-decision.md
       + Update portfolio.json → proposed_positions[]
```

### Gate Checks
```bash
./scripts/validate-phase.sh 7b   # opportunity-screen.md exists
./scripts/validate-phase.sh 7c   # deliberation.md + positions/*.md exist
./scripts/validate-phase.sh 7d   # portfolio-recommended.md + rebalance-decision.md + proposed_positions
```

---

## 10. Phase 8 — Dashboard Update + Deploy

This is where the analysis becomes visible to the web frontend.

### Step-by-step execution

```
PHASE 8 EXECUTION
─────────────────

  Step 8A: Generate structured JSON sidecars
  ┌──────────────────────────────────────────┐
  │  python3 scripts/generate-snapshot.py     │
  │                                           │
  │  Reads: DIGEST.md + portfolio.json        │
  │  Writes: outputs/daily/YYYY-MM-DD/        │
  │          snapshot.json                     │
  │                                           │
  │  Extracts via regex:                      │
  │    - Regime, bias, conviction             │
  │    - Positions table → JSON array         │
  │    - Thesis tracker → JSON array          │
  │    - Market data levels (SPY, VIX, etc.)  │
  │    - Segment biases                       │
  │    - Actionable items                     │
  │    - Risk radar items                     │
  └──────────────────────────────────────────┘
            │
            ▼
  Step 8B: Run ETL pipeline
  ┌──────────────────────────────────────────┐
  │  python3 scripts/update-tearsheet.py      │
  │                                           │
  │  1. Scan ALL outputs/daily/*/DIGEST.md    │
  │  2. Parse each digest → extract data      │
  │  3. Enrich positions with portfolio.json  │
  │     (category, thesis_ids, entry_date)    │
  │  4. Simulate portfolio NAV via yfinance   │
  │  5. Fetch benchmark prices (SPY,QQQ,TLT,  │
  │     GLD)                                   │
  │  6. Compute portfolio metrics             │
  │     (P&L, Sharpe, volatility, drawdown)   │
  │  7. Scan ALL markdown files → doc index   │
  │  8. Write frontend/public/dashboard-      │
  │     data.json (Next.js static fallback)    │
  │  9. Push to Supabase (8 tables):          │
  │     daily_snapshots, positions, theses,   │
  │     position_events, documents,           │
  │     nav_history, benchmark_history,       │
  │     portfolio_metrics                     │
  └──────────────────────────────────────────┘
            │
            ▼
  Step 8C: Commit and deploy
  ┌──────────────────────────────────────────┐
  │  ./scripts/git-commit.sh                  │
  │                                           │
  │  1. git add outputs/ config/              │
  │  2. git commit -m "digest(YYYY-MM-DD):    │
  │     daily market analysis..."             │
  │  3. git push origin master                │
  │     └── Triggers GitHub Actions:          │
  │         deploy.yml                        │
  │         → npm ci                          │
  │         → npm run build (Next.js)         │
  │         → Upload out/ to GitHub Pages     │
  │                                           │
  │  Website updated ~2-3 minutes after push  │
  └──────────────────────────────────────────┘
```

### Gate Check
```bash
./scripts/validate-phase.sh 8
# Checks:
#   - dashboard-data.json exists, valid JSON, recently updated
#   - Supabase tables have data (if configured)
```

---

## 11. Phase 9 — Post-Mortem & Evolution

### 9A: Source Scorecard

```
For each data source used today:
  ├── Rate quality (1-5 stars)
  ├── Note freshness
  ├── Flag failures (unavailable, paywalled, stale)
  └── Record new sources discovered

Output: outputs/daily/YYYY-MM-DD/evolution/sources.md
GUARDRAIL: Agent CANNOT modify config/data-sources.md
```

### 9B: Quality Self-Assessment

```
QUALITY SCORECARD (1-5 scale):
  ├── Data completeness    How much of the target data was found?
  ├── Signal clarity       Were biases clear or wishy-washy?
  ├── Actionability        Could positions change based on this analysis?
  ├── Continuity           Did analysis build on prior days' context?
  └── Positioning quality  Were recommendations specific and thesis-backed?

+ Signal accuracy check:
  └── Review yesterday's actionable items
      Mark each: ✅ Correct / ❌ Wrong / ⏳ Pending

Output: outputs/daily/YYYY-MM-DD/evolution/quality-log.md
```

### 9C: Improvement Proposals (max 2)

```
PROPOSAL FORMAT:
  ├── Category: Source Addition | Skill Refinement | Template Update | Efficiency
  ├── Target file: (exact path)
  ├── Exact change: (what to modify)
  ├── Rationale: (data-backed)
  └── Impact: (expected improvement)

LOCKED SECTIONS (cannot propose changes to):
  ├── Output schema/structure (templates/digest-snapshot-schema.json)
  ├── Risk constraints (config/investment-profile.md §4)
  └── These guardrails themselves

Output: outputs/daily/YYYY-MM-DD/evolution/proposals.md
```

### 9E: Evolution Branch & PR

```
./scripts/git-commit.sh --evolution

  ┌──────────────────────────────────────────┐
  │  1. git checkout -b evolve/YYYY-MM-DD    │
  │  2. git add evolution/ + changelog       │
  │  3. git commit                            │
  │  4. git push -u origin evolve/...        │
  │  5. gh pr create (if GitHub CLI present)  │
  │  6. git checkout master                   │
  └──────────────────────────────────────────┘

  The PR requires MANUAL approval before merge.
  No skill/template/config changes are auto-applied.
```

---

## 12. Final Validation & Session Close

```bash
./scripts/validate-phase.sh --all
```

This runs every phase check in sequence. All must pass.

### Expected green output

```
── Phase Pre-Flight Validation ──
  ✅ PASS: Output directory exists
  ✅ PASS: _meta.json — exists
  ✅ PASS: config/watchlist.md (45 lines)
  ...

── Phase 1 Validation ── Alternative Data & Signals
  ✅ PASS: sentiment-news.md (82 lines)
  ✅ PASS: cta-positioning.md (65 lines)
  ✅ PASS: options-derivatives.md (71 lines)
  ✅ PASS: politician-signals.md (58 lines)

── Phase 2 Validation ── Institutional Intelligence
  ✅ PASS: institutional-flows.md (73 lines)
  ✅ PASS: hedge-fund-intel.md (64 lines)

── Phase 3 Validation ── Macro
  ✅ PASS: macro.md (120 lines)

── Phase 4 Validation ── Asset Classes
  ✅ PASS: bonds.md (95 lines)
  ✅ PASS: commodities.md (88 lines)
  ✅ PASS: forex.md (72 lines)
  ✅ PASS: crypto.md (90 lines)
  ✅ PASS: international.md (85 lines)

── Phase 5 Validation ── US Equities
  ✅ PASS: us-equities.md (105 lines)
  ✅ PASS: sectors/technology.md (78 lines)
  ✅ PASS: sectors/healthcare.md (25 lines)    [compressed]
  ... (all 11)

── Phase 7 Validation ── Synthesis
  ✅ PASS: DIGEST.md (350 lines)

── Phase 7B-D Validation ── Portfolio
  ✅ PASS: opportunity-screen.md (45 lines)
  ✅ PASS: deliberation.md (200 lines)
  ✅ PASS: portfolio-recommended.md (60 lines)
  ✅ PASS: rebalance-decision.md (40 lines)

── Phase 8 Validation ── Dashboard
  ✅ PASS: dashboard-data.json (valid JSON, updated)

── Phase 9 Validation ── Evolution
  ✅ PASS: evolution/sources.md (35 lines)
  ✅ PASS: evolution/quality-log.md (40 lines)
  ✅ PASS: evolution/proposals.md (25 lines)

ALL CHECKS PASSED: 35 check(s) passed. Safe to proceed.
```

**Agent announces**: "✅ Digest complete. Two commits created: digest outputs + pipeline evolution."

### Session Completion Checklist

```
[x] Phase 1: 4 alternative data files
[x] Phase 2: 2 institutional intelligence files
[x] Phase 3: macro.md
[x] Phase 4: 5 asset class files
[x] Phase 5: us-equities.md + 11 sector files
[x] Phase 7: DIGEST.md + snapshot.json
[x] Phase 7B: opportunity-screen.md
[x] Phase 7C: deliberation.md + positions/*.md
[x] Phase 7D: portfolio-recommended.md + rebalance-decision.md
[x] Phase 8: dashboard-data.json + Supabase push + git push
[x] Phase 9: Post-mortem + evolution branch PR

Total output: ~29 files per baseline day
```

---

## 13. Delta Day — Abbreviated Flow

On weekdays (Mon-Sat), the pipeline is dramatically shorter:

```
DELTA DAY TIMELINE
──────────────────

  Morning (Operator):
  └── ./scripts/new-day.sh → prints delta prompt

  Pre-flight (Agent):
  ├── Load _meta.json (type: delta)
  ├── Load baseline DIGEST.md (this week's Sunday output)
  └── Data layer fetch (same as baseline)

  TRIAGE (Agent decides what changed):
  ├── Compare current market levels vs baseline
  ├── Check for macro-moving events
  ├── Result: list of CHANGED segments
  │
  │   Example triage output:
  │   ├── macro:        CHANGED (CPI released, VIX spike)
  │   ├── bonds:        CHANGED (10Y moved 15bps)
  │   ├── commodities:  CHANGED (WTI +$3)
  │   ├── forex:        UNCHANGED (DXY flat)
  │   ├── crypto:       CHANGED (BTC -5%)
  │   ├── international: UNCHANGED
  │   └── sectors:      energy CHANGED, others UNCHANGED

  WRITE DELTAS (only changed segments):
  ├── deltas/macro.delta.md       ← Always mandatory
  ├── deltas/us-equities.delta.md ← Always mandatory
  ├── deltas/crypto.delta.md      ← Always mandatory
  ├── deltas/bonds.delta.md       ← Threshold met
  ├── deltas/commodities.delta.md ← Threshold met
  └── sectors/energy.delta.md     ← Threshold met

  MATERIALIZE:
  ├── Apply deltas to baseline DIGEST.md
  ├── Produce complete DIGEST.md (always readable)
  └── Produce DIGEST-DELTA.md (changes-only summary)

  PORTFOLIO MONITOR:
  ├── Check thesis invalidation triggers
  └── Only write rebalance note if trigger hit

  PHASE 8-9:
  ├── Same as baseline (dashboard + git push + post-mortem)
  └── Evolution abbreviated (fewer proposals typical)

  Token savings: ~70% compared to baseline
```

---

## 14. Failure Modes & Recovery

### Common failures and how to recover

| Failure | Symptom | Recovery |
|---------|---------|---------|
| **Session timeout** | Agent stops mid-pipeline | Re-paste prompt; agent reads existing output files and resumes from last incomplete phase |
| **Data fetch failure** | `fetch-market-data.sh` exits with error | Fall back to MCP data fetch (`SKILL-mcp-data-fetch.md`); or agent uses web search |
| **Validation gate fails** | `validate-phase.sh N` reports FAIL | Agent must fix the missing/short output file and re-run validation before proceeding |
| **Supabase push failure** | `update-tearsheet.py` reports 0 rows | Check: (1) snapshot.json exists with populated arrays, (2) `SUPABASE_URL` and `SUPABASE_KEY` in environment |
| **Git push failure** | `git push origin master` fails | Usually auth issue. Agent prints warning; operator runs `git push` manually |
| **Evolution PR failure** | `gh pr create` fails | Usually `gh` not installed or not authenticated. Branch is pushed; create PR manually on GitHub |
| **No baseline found** (delta day) | `new-day.sh` warns "no baseline" | Run `./scripts/new-week.sh` to force a baseline, then re-run `new-day.sh` |
| **yfinance not installed** | Data fetch scripts exit | Create venv: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt` |

### Resume-from-checkpoint pattern

```
If the agent session ends mid-pipeline:

  1. Operator starts a new session
  2. Pastes the same prompt
  3. Agent reads _meta.json → determines run type
  4. Agent reads existing output files in outputs/daily/YYYY-MM-DD/
  5. Agent runs ./scripts/validate-phase.sh --summary
  6. Identifies the first FAILED phase
  7. Resumes from that phase (existing complete outputs are kept)
```

---

## 15. Post-Mortem Template for Future Improvements

Use this template after each pipeline run to track what worked, what didn't, and potential improvements.

### Daily Post-Mortem Report

```markdown
# Post-Mortem: YYYY-MM-DD

## Run Stats
- **Run type**: Baseline / Delta #N
- **Start time**: HH:MM
- **End time**: HH:MM
- **Total phases completed**: N/9
- **Validation result**: PASS / FAIL (which phase?)
- **Token usage**: ~NNNN (if available)

## What Went Well
- [ ] Data layer fetch succeeded on first attempt
- [ ] All validation gates passed
- [ ] Dashboard updated and deployed
- [ ] Supabase ETL succeeded
- [ ] Prior-day continuity maintained

## What Went Wrong
| Issue | Phase | Severity | Root Cause | Fix Applied |
|-------|-------|----------|-----------|-------------|
|       |       | Critical/Warning/Minor |    |     |

## Signal Accuracy (vs yesterday's calls)
| Yesterday's Call | Outcome | Accuracy |
|------------------|---------|----------|
|                  |         | ✅/❌/⏳  |

## Data Quality Assessment
| Dimension | Score (1-5) | Notes |
|-----------|-------------|-------|
| Data completeness | | |
| Signal clarity | | |
| Actionability | | |
| Continuity | | |
| Positioning quality | | |

## Improvement Proposals
| ID | Category | Target File | Change | Rationale | Priority |
|----|----------|-------------|--------|-----------|----------|
| P-001 | | | | | H/M/L |
| P-002 | | | | | H/M/L |

## Operator Notes
- (Manual observations about the run — things the agent can't see)

## Action Items for Next Run
1. ...
2. ...
```

### Tracking Improvement Proposals Over Time

```
docs/evolution-changelog.md tracks all applied proposals:

  ## 2026-04-06
  - **P-2026-0406-001**: [Source Addition] Added @newaccount to data-sources.md
    - Evidence: Cited 3x in Phase 1 with actionable signals
    - Commit: abc1234
  - **P-2026-0406-002**: [Skill Refinement] Updated SKILL-macro.md yield curve section
    - Evidence: quality-log scored "Data completeness: 2/5" on yield data
    - Commit: def5678
```

---

*End of Daily Run Walkthrough. This document should be updated when pipeline phases change.*
