# digiquant-atlas — System Architecture

> **Last updated**: 2025-07
> **Pipeline version**: v3 — 9-phase orchestrator with three-tier cadence
> Part of the digiquant ecosystem — modular market intelligence layer.

---

## Overview

digiquant-atlas is an AI-orchestrated daily market intelligence system. A large-language model agent reads configuration files and prior context from Supabase, executes structured skill files as instruction sets, writes 28+ output files per session, then publishes findings to Supabase `daily_snapshots` and `documents`.

The system operates on a **three-tier cadence**:

| Tier | Day | Run Mode | Token Cost |
|------|-----|----------|------------|
| **Weekly Baseline** | Sunday | Full 9-phase run — all outputs from scratch | 100% |
| **Daily Delta** | Mon–Sat | Lightweight delta — only segments with material changes | ~25–30% |
| **Monthly Synthesis** | Month-end | Cross-week review + cumulative regime shifts | ~45% |

**Token savings**: ~70–75% on typical weekday runs vs a full daily baseline.

---

## Three-Tier Cadence

### Sunday — Weekly Baseline

The full pipeline. Every segment is re-analyzed from scratch. The baseline becomes the week's analytical anchor. All 28+ output files are written.

Entry point: `skills/SKILL-weekly-baseline.md` → `skills/SKILL-orchestrator.md`

### Mon–Sat — Daily Delta

The delta skill (`skills/SKILL-daily-delta.md`) loads the week's baseline and any prior deltas, then runs a triage protocol:

| Priority | Segments | Threshold to Trigger Delta |
|----------|----------|---------------------------|
| **Mandatory** | `macro`, `us-equities`, `crypto` | Always — these move every day |
| **High** | `bonds`, `commodities`, `forex` | Yield/price moved >0.5% OR new CB signal |
| **Standard** | `international`, `institutional` | Major regional event OR notable flow shift |
| **Low** | `alt-data` sub-segments, all 11 sectors | Bias shifted OR tracked name moved >1.5% |

Output: `.delta.md` files for changed segments + a fully materialized `DIGEST.md`.

### Month-End — Monthly Synthesis

Entry point: `skills/SKILL-monthly-synthesis.md`
Script: `./scripts/monthly-rollup.sh`

Collects all weekly baselines + daily deltas, produces a `DIGEST-MONTHLY.md` with cumulative regime shifts, thesis win/loss record, and portfolio evolution.

---

## Pre-Flight Protocol (All Run Types)

Before any phase executes, the agent performs a structured context load:

1. **Read `_meta.json`** — confirm run type (`baseline` or `delta`), extract baseline date, week label
2. **Load config** — `config/watchlist.md`, `config/preferences.md`
3. **Load prior context from Supabase** — query `daily_snapshots` and `documents` for recent dates
4. **Load yesterday's snapshot from Supabase** — establishes continuity baseline for today's changes
5. **Announce**: `"Context loaded. Starting Phase 1 of 9."`

---

## The 9-Phase Pipeline (Weekly Baseline)

### Phase 1 — Alternative Data & Positioning Signals

> **Runs FIRST** — positioning intelligence must color all downstream reads.
> Never read macro before knowing what the market is actually positioned for.

| Sub-Phase | Skill | Output |
|-----------|-------|--------|
| 1A | `skills/alternative-data/SKILL-sentiment-news.md` | `alt-data/sentiment-news.md` |
| 1B | `skills/alternative-data/SKILL-cta-positioning.md` | `alt-data/cta-positioning.md` |
| 1C | `skills/alternative-data/SKILL-options-derivatives.md` | `alt-data/options-derivatives.md` |
| 1D | `skills/alternative-data/SKILL-politician-signals.md` | `alt-data/politician-signals.md` |

Supabase updates: publishes segment documents to `documents` (alternative-data: sentiment, cta-positioning, options, politician)

**What each sub-agent covers:**
- **1A Sentiment & News**: AAII/CNN Fear & Greed, retail sentiment, social media signal, top news catalysts
- **1B CTA Positioning**: Systematic trend-follower positioning (via COT, CTI), futures open interest, CTA flow model estimates
- **1C Options & Derivatives**: GEX (gamma exposure), VIX structure, put/call ratios, dealer positioning, block prints
- **1D Politician Signals**: Congressional trades (STOCK Act filings), recent buys/sells by tracked officials

---

### Phase 2 — Institutional Intelligence

> Smart money reads — ETF flows, dark pool prints, and hedge fund signals.

| Sub-Phase | Skill | Output |
|-----------|-------|--------|
| 2A | `skills/institutional/SKILL-institutional-flows.md` | `institutional-flows.md` |
| 2B | `skills/institutional/SKILL-hedge-fund-intel.md` | `hedge-fund-intel.md` |

Supabase updates: publishes segment documents to `documents` (institutional: flows, hedge-funds)

**What each sub-agent covers:**
- **2A Flows**: ETF inflows/outflows by asset class and sector, dark pool unusual activity, 13D/13G/Form 4 filings, options-implied institutional positioning
- **2B Hedge Fund Intel**: Latest signals from 16 tracked funds (CIK list in `config/hedge-funds.md`), reported via 13F, X posts, conference calls

---

### Phase 3 — Macro Regime Classification

> The analytical anchor for all downstream work.
> Every asset class analysis in Phases 4–5 must reference this regime.

Skill: `skills/SKILL-macro.md`
Output: `data/agent-cache/daily/{{DATE}}/macro.md`
Supabase: publishes macro document to `documents`

**4-Factor Regime Model:**

| Factor | What It Measures |
|--------|-----------------|
| **Growth** | GDP trend, PMI, labor market, earnings revisions |
| **Inflation** | CPI/PPI trajectory, commodity pressures, breakevens |
| **Policy** | Fed/ECB/BOJ stance, rate trajectory, QT pace |
| **Risk Appetite** | VIX structure, credit spreads, EM flows, safe-haven demand |

Output: a regime label (e.g., `Growth Slowing / Inflation Sticky / Policy Tightening / Risk-Off`) plus portfolio implications.

---

### Phase 4 — Asset Class Analysis

> Five dedicated asset-class agents. Each reads the Phase 3 regime output and checks for alignment.

| Sub-Phase | Skill | Output |
|-----------|-------|--------|
| 4A | `skills/SKILL-bonds.md` | `bonds.md` |
| 4B | `skills/SKILL-commodities.md` | `commodities.md` |
| 4C | `skills/SKILL-forex.md` | `forex.md` |
| 4D | `skills/SKILL-crypto.md` | `crypto.md` |
| 4E | `skills/SKILL-international.md` | `international.md` |

Supabase updates: publishes segment documents to `documents` (bonds, commodities, forex, crypto, international)

**Coverage:**
- **4A Bonds**: Yield curve (2s10s, 10s30s), real rates, TIPS breakevens, duration positioning, credit spreads (IG/HY), MBS
- **4B Commodities**: WTI/Brent, Nat Gas, Gold, Silver, Copper, agricultural commodities, supply/demand drivers, OPEC+ signals
- **4C Forex**: DXY, EUR/USD, USD/JPY, GBP/USD, EM FX, BOJ/ECB policy divergence, carry trade dynamics
- **4D Crypto**: BTC, ETH, BTC dominance, funding rates, exchange flows, on-chain metrics, macro correlation
- **4E International/EM**: Asia (Hang Seng, Nikkei), Europe (DAX, FTSE), EM country reads, geopolitical risk premiums

---

### Phase 5 — US Equities + 11-Sector Swarm

> Top-down market analysis first, then delegated to 11 specialized sector sub-agents.

| Sub-Phase | Skill | Output |
|-----------|-------|--------|
| 5A | `skills/SKILL-equity.md` | `us-equities.md` |
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
| 5M | *(orchestrator synthesis)* | Sector Scorecard (compiled into `DIGEST.md`) |

Supabase updates: publishes equity and all 11 sector documents to `documents`

**Phase 5A covers**: SPY/QQQ/IWM, market breadth (NYSE A/D line, new 52W highs/lows), factor performance (value, growth, momentum, quality, small cap).

**Phase 5M** produces a final sector scorecard after all 11 agents complete:
```
SECTOR SCORECARD — {{DATE}}
| Sector | ETF | Bias | Confidence | Key Driver |
```

---

### Phase 6 — Supabase Consolidation & Bias Tracker

> System-wide Supabase publish. Runs after all research is complete.

| Sub-Phase | Action |
|-----------|--------|
| 6A | Publish new bias row to Supabase `daily_snapshots` (14 columns: date, macro regime, equity/crypto/bond/commodity/forex bias, VIX, inst. flow, options sentiment, CTA direction, HF consensus, Fed odds, notes) |
| 6B | Confirm all segment documents were published to Supabase `documents` this session |

**Complete segment document manifest (25 segments):**
- Core market (7): macro, equity, crypto, bonds, commodities, forex, international
- Sectors (11): technology, healthcare, energy, financials, consumer-staples, consumer-disc, industrials, utilities, materials, real-estate, comms
- Alternative data (4): sentiment, cta-positioning, options, politician
- Institutional (2): flows, hedge-funds
- Portfolio (1): portfolio evolution and rebalance history
- Cross-asset trackers (2): bias rows in `daily_snapshots`, thesis data in `documents`

---

### Phase 7 — Master Synthesis: DIGEST.md

> Synthesis, not regurgitation. Pull the most important signals across all phases
> into a coherent, actionable brief.

Skill: `templates/master-digest.md` (structure template — immutable schema)
Output: `data/agent-cache/daily/{{DATE}}/DIGEST.md`

**Required DIGEST.md sections:**
1. **Market Regime Snapshot** — single dominant force today
2. **Alternative Data Dashboard** — sentiment + CTA + options + politician synthesis; lead with any contrarian signal
3. **Institutional Intelligence Summary** — ETF flow direction, notable HF signal, any 13D/13G filing
4. **Macro** — full regime read from `macro.md`
5. **Asset Classes** — bonds, commodities, forex, crypto, international
6. **US Equities** — overview + full sector scorecard (11 sectors, OW/UW/N + key driver each)
7. **Thesis Tracker** — per active thesis: ✅ Confirmed / ⚠️ Conflicted / ❌ Challenged / ⏳ No signal; flag approaching invalidation triggers
8. **Portfolio Positioning Recommendations** — explicit Trim/Add/Hold/Exit with rationale and conviction scale
9. **Actionable Summary** — top 5 items ranked by priority
10. **Risk Radar** — what could break the current bias in 24–72 hours

---

### Phase 7C — Asset Analyst Pass

> Per-asset conviction scores. Analysts are blinded to current portfolio weights.

- Reads only Phase 1–5 output files — no new web searches
- For each ticker in `config/portfolio.json`, produces an independent conviction score
- Also identifies 1–2 new opportunity candidates from the session's research

Output: `data/agent-cache/daily/{{DATE}}/positions/{{TICKER}}.md` (one file per position)

---

### Phase 7D — Portfolio Manager Review

> Clean-slate portfolio construction, then comparison vs current holdings.
> This is the most actionable output of the full pipeline.

**Phase B — Clean-Slate (blinded to weights):**
- Reads all analyst outputs from `positions/`
- Applies theme caps and weight constraints from `config/preferences.md`
- Builds ideal target portfolio
- Output: `data/agent-cache/daily/{{DATE}}/portfolio-recommended.md`

**Phase C — Comparison (weights unlocked):**
- Loads `config/portfolio.json` with current weights
- Diffs recommended vs current; applies ≥5% threshold to filter noise
- Produces rebalance table: Hold / Add / Trim / Exit / New
- Output: `data/agent-cache/daily/{{DATE}}/rebalance-decision.md`
- Updates `config/portfolio.json` → `proposed_positions[]`
- Appends to `memory/portfolio/ROLLING.md`

---

### Phase 8 — Web Dashboard Regeneration

```bash
python3 scripts/update-tearsheet.py   # recalculates NAV, writes dashboard-data.json
./scripts/git-commit.sh               # commit config + memory (digest data lives in Supabase)
```

The Python backend reads all `DIGEST.md` files chronologically, extracts Target Allocation statements via regex, fetches historical closes from Yahoo Finance (`yfinance`), simulates daily NAV tracking from the first entry date, computes performance metrics and drawdown, then writes `frontend/public/dashboard-data.json`.

The Next.js frontend reads from Supabase (primary) with static JSON fallback — no backend server, no API.

---

### Phase 9 — Post-Mortem & Evolution

> Self-improvement loop. Strict guardrails prevent uncontrolled pipeline drift.

| Sub-Phase | Action | Output File |
|-----------|--------|-------------|
| 9A | Source Scorecard: rate every data source (1–5 stars), log failures, record discoveries | `data/agent-cache/daily/YYYY-MM-DD/evolution/sources.md` |
| 9B | Quality Post-Mortem: check yesterday's predictions (✅/❌/⏳), rate digest on 5 dimensions (1–5 scale each) | `data/agent-cache/daily/YYYY-MM-DD/evolution/quality-log.md` |
| 9C | Improvement Proposals: max 2 per session, each specifying exact target file + change + rationale | `data/agent-cache/daily/YYYY-MM-DD/evolution/proposals.md` |
| 9D | Document applied proposals (approved in prior PRs) | `docs/evolution-changelog.md` |
| 9E | Evolution branch + PR | `evolve/YYYY-MM-DD` — requires user approval to merge |

**Guardrails — Phase 9 may NEVER propose changes to:**
- Output schema / `templates/master-digest.md` section structure (immutable)
- Risk profile or position sizing in `config/investment-profile.md` §4
- These guardrails themselves

```bash
./scripts/git-commit.sh --evolution   # creates evolve/ branch + PR, does NOT auto-merge to master
```

---

## Daily Output File Map

### Sunday Baseline — 28+ output files

```
data/agent-cache/daily/YYYY-MM-DD/
  _meta.json                        {"type":"baseline","week":"YYYY-Wnn"}
  DIGEST.md                         Master synthesized brief (Phase 7)
  alt-data/
    sentiment-news.md               Phase 1A
    cta-positioning.md              Phase 1B
    options-derivatives.md          Phase 1C
    politician-signals.md           Phase 1D
  institutional-flows.md            Phase 2A
  hedge-fund-intel.md               Phase 2B
  macro.md                          Phase 3
  bonds.md                          Phase 4A
  commodities.md                    Phase 4B
  forex.md                          Phase 4C
  crypto.md                         Phase 4D
  international.md                  Phase 4E
  us-equities.md                    Phase 5A
  sectors/
    technology.md
    healthcare.md
    energy.md
    financials.md
    consumer-staples.md
    consumer-disc.md
    industrials.md
    utilities.md
    materials.md
    real-estate.md
    comms.md
  positions/
    {{TICKER}}.md (x N)             Phase 7C analyst reports
  portfolio-recommended.md          Phase 7D clean-slate target
  rebalance-decision.md             Phase 7D rebalance decision
```

### Mon–Sat Delta

```
data/agent-cache/daily/YYYY-MM-DD/
  _meta.json                        {"type":"delta","baseline":"YYYY-MM-DD","delta_number":N}
  DIGEST.md                         Fully materialized digest (always present)
  DIGEST-DELTA.md                   Delta-only changes summary
  deltas/
    macro.delta.md                  Always written
    crypto.delta.md                 Always written
    us-equities.delta.md            Always written
    bonds.delta.md                  If threshold met
    [segment].delta.md              Only segments that crossed threshold
  sectors/
    [sector].delta.md               Only sectors that changed
```

---

## Memory System Architecture

25 memory files form the system's long-term intelligence layer:

```
memory/
  BIAS-TRACKER.md                   14-column daily cross-asset bias table
  THESES.md                         Active investment thesis register
  portfolio/ROLLING.md              Portfolio evolution and rebalance history
  macro/ROLLING.md
  equity/ROLLING.md
  crypto/ROLLING.md
  bonds/ROLLING.md
  commodities/ROLLING.md
  forex/ROLLING.md
  international/ROLLING.md
  sectors/
    technology/ROLLING.md
    healthcare/ROLLING.md
    energy/ROLLING.md
    financials/ROLLING.md
    consumer-staples/ROLLING.md
    consumer-disc/ROLLING.md
    industrials/ROLLING.md
    utilities/ROLLING.md
    materials/ROLLING.md
    real-estate/ROLLING.md
    comms/ROLLING.md
  alternative-data/
    sentiment/ROLLING.md
    cta-positioning/ROLLING.md
    options/ROLLING.md
    politician/ROLLING.md
  institutional/
    flows/ROLLING.md
    hedge-funds/ROLLING.md
  evolution/
    sources.md
    quality-log.md
    proposals.md
```

**Memory protocol:**
- Append-only — never delete or rewrite history
- Format: `## YYYY-MM-DD` header + 3–5 bullet observations per session
- Read at session start, written at session end
- Creates compounding intelligence — each session builds on all prior research in every domain

---

## Data Flow

```
config/watchlist.md ─────────────────────────────────────────┐
config/preferences.md ──────────────────────────────────────┐│
config/hedge-funds.md ─────────────────────┐                ││
                                           │                ││
memory/*/ROLLING.md ──────────────────┐    │(all skills read)│
(25 files loaded at session start)    │    │                 │
                                      ▼    ▼                 ▼
         Phase 1 ─► output files ──► Phase 2 ─► Phase 3 ─► Phase 4 ─► Phase 5
                                                    │
                                 (macro regime anchors all phases below)
                                                    │
                                           Phase 6: memory COMMIT
                                         (all 25 files appended)
                                                    │
                                           Phase 7: DIGEST.md
                                         (all segments → 1 master file)
                                                    │
                                     Phase 7C/7D: portfolio analysis
                                    (positions/*.md + decision files)
                                                    │
                                     Phase 8: dashboard-data.json
                                     (Python → React frontend)
                                                    │
                                     Phase 9: evolution artifacts
                                     (proposals + PR, not auto-merged)
```

**Dependency rule**: Each phase reads all prior phases' outputs before executing. This sequential dependency is intentional — sector analysts must know the macro regime before making allocation calls.

---

## Signal Priority Hierarchy

When signals conflict across phases, apply in order:

1. **Fundamental regime change** — macro regime shifts override all other signals
2. **Institutional flows** — large capital movements are directionally predictive short-term
3. **Alternative data / sentiment** — useful for timing and contrarian reads
4. **Technical levels** — useful for medium-term target setting

---

## Web Dashboard Architecture

```
DIGEST.md files (structured Markdown)
     │
     ▼  Python parser: scripts/update-tearsheet.py
dashboard-data.json (frontend/public/ — static fallback)
     │
     ▼  Next.js static export → GitHub Pages
React app at digiquant.io
```

The Python parser:
1. Scans all `data/agent-cache/daily/*/DIGEST.md` files chronologically
2. Extracts Target Allocation tables via regex → portfolio weights per date
3. Fetches historical daily closes from Yahoo Finance (`yfinance`)
4. Simulates NAV tracking from first entry date
5. Computes cumulative performance, drawdown, sector exposure
6. Writes `frontend/public/dashboard-data.json`

The frontend is a static Next.js export deployed to GitHub Pages. Supabase is the primary data source; the JSON file serves as fallback.

---

## Repository Structure

```
digiquant-atlas/
  CLAUDE.md                          Claude Code entry point
  AGENTS.md                          Cross-platform agent entry point
  CLAUDE_PROJECT_INSTRUCTIONS.md     Claude.ai Projects paste
  config/
    watchlist.md                     Tracked tickers + asset universe
    preferences.md                   Trading style, risk profile, active theses
    hedge-funds.md                   16 tracked funds (CIK, X handle, style)
    data-sources.md                  30+ data URLs, X accounts, calendars
    portfolio.json                   Current positions + proposed_positions
  skills/
    SKILL-orchestrator.md            Master 9-phase pipeline driver
    SKILL-weekly-baseline.md         Sunday full run entry point
    SKILL-daily-delta.md             Mon-Sat delta run
    SKILL-monthly-synthesis.md       Month-end synthesis
    SKILL-macro.md                   Phase 3
    SKILL-equity.md                  Phase 5A
    SKILL-bonds.md                   Phase 4A
    SKILL-commodities.md             Phase 4B
    SKILL-forex.md                   Phase 4C
    SKILL-crypto.md                  Phase 4D
    SKILL-international.md           Phase 4E
    SKILL-earnings.md                Earnings context
    SKILL-deep-dive.md               Ad-hoc ticker research
    SKILL-thesis.md                  Thesis builder
    SKILL-thesis-tracker.md          Thesis reviewer
    SKILL-sector-rotation.md         Sector rotation analysis
    SKILL-sector-heatmap.md          Sector heatmap
    SKILL-premarket-pulse.md         Pre-market scan
    sectors/                         11 GICS sector skills (5B-5L)
    alternative-data/                4 alt-data skills (1A-1D)
    institutional/                   2 institutional skills (2A-2B)
  memory/                            25 append-only research logs (see above)
  templates/                         Output templates (master-digest.md schema is immutable)
  scripts/
    new-day.sh                       Auto-detect Sunday(baseline) vs weekday(delta)
    new-week.sh                      Force baseline on any day
    status.sh                        Health check
    run-segment.sh                   Print single-segment prompt (--delta flag)
    combine-digest.sh                Synthesis prompt printer
    materialize.sh                   Build DIGEST.md from baseline + deltas
    git-commit.sh                    Commit config/memory (--evolution for phase 9 branch)
    update-tearsheet.py              Python dashboard backend
    publish-update.sh                Push + deploy to GitHub Pages
    monthly-rollup.sh                Monthly synthesis
    memory-search.sh                 Grep all 25 ROLLING.md files
  agents/                            Named agent role definitions
  frontend/                          React + Vite dashboard (digiquant.io)
    src/pages/                       Dashboard, Portfolio, Signals, Sectors,
                                     Architecture, BiasTracker, Config
    public/dashboard-data.json       Generated by update-tearsheet.py
  data/agent-cache/
    daily/YYYY-MM-DD/                28+ files on baseline; deltas on weekdays
    weekly/                          Weekly synthesis outputs
    monthly/                         Monthly rollup outputs
    deep-dives/                      Ad-hoc ticker research
  docs/agentic/                      This documentation suite
    ARCHITECTURE.md                  This file
    MEMORY-SYSTEM.md                 Memory format spec
    PLATFORMS.md                     Platform setup guides
    SKILLS-CATALOG.md                Complete skill file catalog
    WORKFLOWS.md                     Operational workflows
```

---

*For platform setup (Claude, Cursor, Windsurf, Copilot), see `docs/agentic/PLATFORMS.md`.*
*For memory file format spec, see `docs/agentic/MEMORY-SYSTEM.md`.*
*For complete skill catalog, see `docs/agentic/SKILLS-CATALOG.md`.*
