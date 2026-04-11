# digiquant-atlas — Architecture Review

> **Archived reference** (moved from `docs/ARCHITECTURE-REVIEW.md`). For day-to-day operation use [`RUNBOOK.md`](../../RUNBOOK.md) and [`docs/agentic/ARCHITECTURE.md`](../agentic/ARCHITECTURE.md). This file keeps extended component inventory, frontend/deploy notes, and technical debt; update only when those sections change.
>
> **Note:** Any per-phase `validate_db_first.py` wording in diagrams is **historical**; the real script only supports `--date` and `--mode`.

> Last updated: 2026-04-06

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Component Inventory](#3-component-inventory)
4. [Pipeline Architecture](#4-pipeline-architecture)
5. [Data Architecture](#5-data-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Agent Architecture](#8-agent-architecture)
9. [Security and Integrity](#9-security-and-integrity)
10. [Known Limitations and Technical Debt](#10-known-limitations-and-technical-debt)

---

## 1. System Overview

**digiquant-atlas** is an AI-orchestrated daily market intelligence system that produces structured financial research across all asset classes. The system operates on a three-tier cadence (weekly baseline, daily delta, monthly synthesis) to optimize token usage while maintaining comprehensive coverage.

### Core Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Macro-first filtering** | Phase 3 regime classification anchors all downstream analysis |
| **Thesis-driven positioning** | Every position has an explicit thesis with invalidation trigger |
| **Three-tier cadence** | Baseline (Sun) / Delta (Mon-Sat) / Monthly — ~70% token savings on weekdays |
| **Structured output** | Markdown for humans + JSON sidecar for machines + Supabase for queries |
| **Evolution guardrails** | Post-mortem proposals only; never auto-apply; locked sections enforced |
| **Signal hierarchy** | Regime change > Institutional flows > Sentiment > Technicals |

### Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│  ORCHESTRATION LAYER                                     │
│  Bash scripts + Markdown skill files (agent instructions)│
├──────────────────────────────────────────────────────────┤
│  DATA LAYER                                              │
│  Python (yfinance, pandas-ta, requests) + MCP servers    │
├──────────────────────────────────────────────────────────┤
│  PERSISTENCE LAYER                                       │
│  Supabase (PostgreSQL) + Static JSON fallback            │
├──────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER                                      │
│  Next.js app (frontend/) + Supabase-backed dashboard     │
└──────────────────────────────────────────────────────────┘
```

---

## 2. High-Level Architecture Diagram

```
                              ┌─────────────────────────────┐
                              │      OPERATOR (Human)        │
                              │  ./scripts/new-day.sh        │
                              │  Pastes prompt into AI agent │
                              └──────────┬──────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AI AGENT (Claude / Copilot)                     │
│                                                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │  Skill Files  │  │  Config Files  │  │  MCP Tool Servers          │   │
│  │ (skills/**/   │  │  (config/*.md) │  │  FRED, CoinGecko,          │   │
│  │   SKILL.md)   │  │               │  │                            │   │
│  │  26 skills    │  │  watchlist     │  │  Polymarket, SEC-EDGAR,    │   │
│  │  + 17 sub-    │  │  investment-   │  │  Alpha Vantage, Frankfurter│   │
│  │    agent      │  │  profile       │  └───────────────────────────┘   │
│  │    skills     │  │  data-sources  │                                  │
│  └──────┬───────┘  │  hedge-funds   │                                  │
│         │          │  portfolio.json │                                  │
│         │          └───────┬────────┘                                   │
│         ▼                  ▼                                            │
│  ┌─────────────────────────────────────────────────┐                   │
│  │            9-PHASE PIPELINE                      │                   │
│  │  Pre-flight → 1 (Alt Data) → 2 (Institutional) │                   │
│  │  → 3 (Macro) → 4A-E (Asset Classes)            │                   │
│  │  → 5A-L (Equities + 11 Sectors)                │                   │
│  │  → 7 (Synthesis) → 7B-D (Portfolio)            │                   │
│  │  → 8 (Dashboard) → 9 (Post-Mortem)             │                   │
│  └────────────────────┬────────────────────────────┘                   │
│                       │                                                │
│                       ▼                                                │
│  ┌───────────────────────────────────────────────┐                     │
│  │          POST-PUBLISH VALIDATION                │                     │
│  │  JSON → Supabase; then run_db_first.py          │                     │
│  │  → validate_db_first.py (--mode full|research|pm)│                     │
│  │  No per-phase shell gates in the current flow  │                     │
│  └───────────────────────────────────────────────┘                     │
└────────────────────────────────────────────────────────────────────────┘
          │
          ▼   Writes 29 files per baseline day
┌────────────────────────────────────────────────────────────────────────┐
│                    data/agent-cache/daily/YYYY-MM-DD/                           │
│                                                                        │
│  _meta.json          ← Run type (baseline/delta)                      │
│  DIGEST.md           ← Master synthesized output                      │
│  snapshot.json       ← Machine-readable sidecar                       │
│  macro.md            ← Phase 3                                        │
│  bonds.md            ← Phase 4A          alt-data.md    ← Phase 1    │
│  commodities.md      ← Phase 4B          institutional.md ← Phase 2  │
│  forex.md            ← Phase 4C          us-equities.md  ← Phase 5A  │
│  crypto.md           ← Phase 4D          opportunity-screen.md ← 7B  │
│  international.md    ← Phase 4E          deliberation.md    ← 7C     │
│  sectors/            ← Phase 5B-L        portfolio-recommended.md ←7D │
│    technology.md       (11 files)        rebalance-decision.md   ←7D  │
│    healthcare.md                         positions/               ←7C │
│    energy.md  ...                          {TICKER}.md (per-ticker)   │
│  evolution/          ← Phase 9                                        │
│    sources.md  quality-log.md  proposals.md                           │
│  data/               ← Pre-flight                                     │
│    quotes.json  quotes-summary.md  macro.json  macro-summary.md      │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│ generate-    │  │ update-      │  │ git-commit.sh        │
│ snapshot.py  │  │ tearsheet.py │  │                      │
│              │  │              │  │ Commits + pushes     │
│ DIGEST.md +  │  │ Scans all    │  │ to origin/master     │
│ portfolio.json│ │ scratch →    │  │                      │
│ → snapshot   │  │ dashboard-   │  │ Triggers GitHub      │
│   .json      │  │ data.json    │  │ Pages redeploy       │
└──────┬───────┘  │ + Supabase   │  └──────────────────────┘
       │          │   push       │
       │          └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────────────────────────┐     ┌─────────────────────────┐
│       SUPABASE (PostgreSQL)       │     │  GITHUB PAGES           │
│                                   │     │                         │
│  8 tables:                        │     │  Static React SPA       │
│  daily_snapshots                  │     │  Loads dashboard-       │
│  positions                        │     │  data.json at startup   │
│  theses                           │     │                         │
│  position_events                  │     │  Falls back to static   │
│  documents                        │     │  JSON if Supabase is    │
│  nav_history                      │     │  not configured         │
│  benchmark_history                │     │                         │
│  portfolio_metrics                │     └─────────────────────────┘
└───────────────────────────────────┘
```

---

## 3. Component Inventory

### 3.1 Skill Files (Agent Instructions)

Skills are structured Markdown files with YAML frontmatter. They serve as executable instruction sets for AI agents. The agent reads the skill, follows step-by-step instructions, searches the web for live data, and writes structured output files.

| Category | Count | Directory | Purpose |
|----------|-------|-----------|---------|
| Core Pipeline | 5 | `skills/` | Orchestrator, baseline, delta, monthly, digest |
| Asset Class | 7 | `skills/` | Macro, bonds, commodities, forex, crypto, international, equity |
| Sector | 11 | `skills/sector-*/` | One per GICS sector |
| Alternative Data | 4 | `skills/alt-*/` | Sentiment, CTA, options, politicians |
| Institutional | 2 | `skills/inst-*/` | ETF flows, hedge fund intel |
| Portfolio | 5 | `skills/` | PM, deliberation, opportunity screener, thesis tracker, asset analyst |
| Specialized | 4 | `skills/` | Deep dive, earnings, sector rotation, premarket pulse |
| **Total** | **38** | | |

### 3.2 Scripts (Automation)

| Script | Language | Purpose | Invoked By |
|--------|----------|---------|------------|
| `run_db_first.py` | Python | DB-first entry: validate, ETL, execute-at-open | Operator (scheduled) |
| `materialize_snapshot.py` | Python | Publish digest snapshot JSON to Supabase | Operator after agent run |
| `validate_db_first.py` | Python | Supabase invariant checks | run_db_first.py, status.sh |
| `validate_artifact.py` | Python | JSON schema validation for on-disk artifacts | run_db_first.py |
| `execute_at_open.py` | Python | Record `position_events` using `rebalance_decision` + `price_history.open` (same day or `--prior-trading-day-rebalance`); null prices → `backfill_execution_prices.py` | run_db_first.py, `config/schedule.json` |
| `backfill_execution_prices.py` | Python | Fill null execution prices after opens land in `price_history` | manual / post-open |
| `new-day.sh` | Bash | Print baseline/delta Claude prompt | Operator (morning) |
| `fetch-market-data.sh` | Bash | Orchestrate data fetch (quotes + macro) | Agent (pre-flight) |
| `fetch-quotes.py` | Python | yfinance OHLCV + pandas-ta technicals | fetch-market-data.sh |
| `fetch-macro.py` | Python | Yield curve XML + VIX + FX + commodities | fetch-market-data.sh |
| `preload-history.py` | Python | Seed 2-year OHLCV cache per ticker | fetch-market-data.sh |
| `validate_db_first.py` | Bash | DB-first phase stubs / connectivity | Agent (optional) |
| `generate-snapshot.py` | Python | Legacy snapshot sidecars | git-commit.sh |
| `update_tearsheet.py` | Python | Scan artifacts → Supabase ETL | git-commit.sh, run_db_first.py |
| `git-commit.sh` | Bash | Commit + push (digest or evolution branch) | Operator |
| `status.sh` | Bash | validate_db_first + brief status | Operator (ad-hoc) |
| `weekly-rollup.sh` | Bash | Weekly JSON scaffold + synthesis prompt | Operator (Friday) |
| `monthly-rollup.sh` | Bash | Monthly JSON scaffold + synthesis prompt | Operator (month-end) |
| `validate-portfolio.sh` | Bash | Validate portfolio.json constraints | Operator / Agent |

Retired filesystem helpers live under `archive/legacy-scripts/` (see README there).

### 3.3 Configuration Files

| File | Purpose | Modified By |
|------|---------|-------------|
| `config/watchlist.md` | ~60 ETF tracking universe across all asset classes | Operator |
| `config/investment-profile.md` | Investor identity, risk tolerance, horizon, regime playbook | Operator (via profile wizard) |
| `config/portfolio.json` | Live positions + proposed positions + constraints | Agent (Phase 7D) + Operator (trade execution) |
| `docs/ops/data-sources.md` | 30+ X accounts, URLs, MCP servers, FRED series | Agent proposals only |
| `config/hedge-funds.md` | 16 tracked hedge funds (CIK, X handles, style) | Operator |
| `docs/ops/email-research.md` | Gmail setup for research subscriptions | Operator |

### 3.4 Named Agent Roles

| Agent | File | Pipeline Phase | Purpose |
|-------|------|----------------|---------|
| Orchestrator | `agents/orchestrator.agent.md` | All | Master pipeline driver |
| Alt Data Analyst | `agents/alt-data-analyst.agent.md` | 1 | Sentiment, CTA, options, politician signals |
| Institutional Analyst | `agents/institutional-analyst.agent.md` | 2 | ETF flows, hedge fund intel |
| Sector Analyst | `agents/sector-analyst.agent.md` | 5B-L | GICS sector deep-dives |
| Portfolio Manager | `agents/portfolio-manager.agent.md` | 7C-D | Deliberation, rebalance decisions |
| Research Assistant | `agents/research-assistant.agent.md` | Ad-hoc | One-off research queries |
| Thesis Tracker | `agents/thesis-tracker.agent.md` | Ad-hoc | Monitor active thesis invalidation |

---

## 4. Pipeline Architecture

### 4.1 Three-Tier Cadence Model

```
┌───────────────────────────────────────────────────────────────────────┐
│                       WEEKLY CYCLE                                    │
│                                                                       │
│  Sun          Mon       Tue       Wed       Thu       Fri       Sat   │
│  ┌────────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──┐│
│  │BASELINE│  │DELTA │  │DELTA │  │DELTA │  │DELTA │  │DELTA │  │D ││
│  │  100%  │→ │~20-  │→ │~20-  │→ │~20-  │→ │~20-  │→ │~20-  │→ │  ││
│  │ tokens │  │30%   │  │30%   │  │30%   │  │30%   │  │30%   │  │  ││
│  │        │  │tokens│  │tokens│  │tokens│  │tokens│  │tokens│  │  ││
│  │  22+   │  │  3-8 │  │  3-8 │  │  3-8 │  │  3-8 │  │      │  │  ││
│  │ output │  │delta │  │delta │  │delta │  │delta │  │+WKLY │  │  ││
│  │ files  │  │files │  │files │  │files │  │files │  │ROLLUP│  │  ││
│  └────────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──┘│
│                                                                       │
│  Baseline anchors the week. Deltas reference it.                      │
│  _meta.json tracks baseline_date for materialization.                 │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                      MONTHLY CYCLE                                    │
│                                                                       │
│  Week 1     Week 2     Week 3     Week 4     Month-End               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────────┐        │
│  │Baseline│ │Baseline│ │Baseline│ │Baseline│ │  MONTHLY    │        │
│  │+Deltas │ │+Deltas │ │+Deltas │ │+Deltas │ │  SYNTHESIS  │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ │  (~40-50%   │        │
│                                               │   tokens)   │        │
│                                               │  Cumulative │        │
│                                               │  review     │        │
│                                               └─────────────┘        │
└───────────────────────────────────────────────────────────────────────┘
```

### 4.2 Full Baseline Pipeline (9 Phases)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  PRE-FLIGHT                                                              │
│  ├─ git pull (sync latest merged evolution PRs)                         │
│  ├─ Load config: watchlist, investment-profile, hedge-funds, data-sources│
│  ├─ Load prior day's DIGEST.md (continuity)                             │
│  ├─ Data Layer: fetch-market-data.sh OR MCP fallback                    │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 1 — ALTERNATIVE DATA ──────────────────────────────────────────  │
│  ├─ 1A: Sentiment & News → sentiment-news.md                           │
│  ├─ 1B: CTA Positioning → cta-positioning.md                           │
│  ├─ 1C: Options & Derivatives → options-derivatives.md                  │
│  ├─ 1D: Politician Signals → politician-signals.md                      │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 2 — INSTITUTIONAL INTELLIGENCE ────────────────────────────────  │
│  ├─ 2A: ETF Flows → institutional-flows.md                             │
│  ├─ 2B: Hedge Fund Intel → hedge-fund-intel.md                         │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 3 — MACRO REGIME CLASSIFICATION ───────────────────────────────  │
│  ├─ 4-factor classification: Growth / Inflation / Policy / Risk Appetite│
│  ├─ Cross-references Phase 1 signals (confirm or contradict?)           │
│  ├─ → macro.md                                                          │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 4 — ASSET CLASS DEEP DIVES ────────────────────────────────────  │
│  ├─ 4A: Bonds & Rates → bonds.md        (reads macro regime)           │
│  ├─ 4B: Commodities → commodities.md    (reads macro + bonds/yield)    │
│  ├─ 4C: Forex → forex.md                (reads macro + bonds)          │
│  ├─ 4D: Crypto → crypto.md              (reads macro + inst. flows)    │
│  ├─ 4E: International → international.md (reads macro + DXY from forex)│
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 5 — US EQUITIES ──────────────────────────────────────────────   │
│  ├─ 5A: Overview (breadth, factors, index levels) → us-equities.md     │
│  ├─ 5B-L: 11 GICS Sectors (tiered: Full/Compressed) → sectors/*.md    │
│  │   ├─ Technology   ├─ Healthcare    ├─ Energy                         │
│  │   ├─ Financials   ├─ Staples       ├─ Consumer Disc                  │
│  │   ├─ Industrials  ├─ Utilities     ├─ Materials                      │
│  │   ├─ Real Estate  └─ Communications                                  │
│  ├─ 5M: Sector Scorecard synthesis                                      │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 7 — MASTER SYNTHESIS ─────────────────────────────────────────   │
│  ├─ 7A: Compile DIGEST.md from all phases                               │
│  ├─ 7A: Write snapshot.json (structured sidecar)                        │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 7B — OPPORTUNITY SCREEN ──────────────────────────────────────   │
│  ├─ Score all ~60 watchlist tickers: regime + signals + sector bias     │
│  ├─ Rank and filter: holdings mandatory + top 3-5 non-held              │
│  ├─ → opportunity-screen.md                                             │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 7C — ANALYST-PM DELIBERATION ─────────────────────────────────   │
│  ├─ Round 1: Per-ticker analyst reports → positions/{TICKER}.md         │
│  ├─ PM Review: Challenge weak positions                                 │
│  ├─ Round 2: Analysts defend or revise                                  │
│  ├─ PM Decision: Accept / Override / Escalate                           │
│  ├─ → deliberation.md                                                   │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 7D — PORTFOLIO MANAGER REVIEW ────────────────────────────────   │
│  ├─ Phase B: Clean-slate portfolio construction (blinded to weights)    │
│  ├─ Phase C: Diff recommended vs current → rebalance table             │
│  ├─ → portfolio-recommended.md, rebalance-decision.md                   │
│  ├─ → config/portfolio.json (proposed_positions[] updated)              │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 8 — WEB DASHBOARD + SUPABASE ────────────────────────────────   │
│  ├─ 8A: generate-snapshot.py (structured JSON from DIGEST + portfolio)  │
│  ├─ 8B: update-tearsheet.py (dashboard-data.json + Supabase ETL)       │
│  ├─ 8C: git-commit.sh (commit + push → GitHub Pages redeploy)          │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  PHASE 9 — POST-MORTEM & EVOLUTION ──────────────────────────────────   │
│  ├─ 9A: Source Scorecard → evolution/sources.md                         │
│  ├─ 9B: Quality Post-Mortem → evolution/quality-log.md                  │
│  ├─ 9C: Improvement Proposals → evolution/proposals.md (max 2)         │
│  ├─ 9D: Document applied improvements → docs/evolution-changelog.md    │
│  ├─ 9E: git-commit.sh --evolution (branch + PR for review)             │
│  └─ (historical) on-disk segment outputs ✓
│                                                                          │
│  FINAL: python3 scripts/validate_db_first.py --mode full (current)
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Delta Pipeline (Mon-Sat)

```
┌──────────────────────────────────────────────────────────────────────┐
│  DELTA PIPELINE (Mon-Sat, ~20-30% tokens)                            │
│                                                                      │
│  PRE-FLIGHT                                                          │
│  ├─ Load _meta.json → confirm type: "delta"                        │
│  ├─ Load baseline_date → read baseline's DIGEST.md as anchor       │
│  └─ Data layer check (same as baseline)                             │
│                                                                      │
│  TRIAGE — What changed materially since baseline?                    │
│  ├─ Compare current market data vs baseline levels                  │
│  ├─ Check for macro-moving events (new data releases, geopolitics)  │
│  ├─ Classify each segment: CHANGED / UNCHANGED                     │
│  └─ Mandatory deltas (always written): macro, us-equities, crypto   │
│                                                                      │
│  WRITE DELTAS — Only segments that changed                           │
│  ├─ deltas/macro.delta.md        ← Always                          │
│  ├─ deltas/us-equities.delta.md  ← Always                          │
│  ├─ deltas/crypto.delta.md       ← Always                          │
│  ├─ deltas/{segment}.delta.md    ← If threshold met                │
│  └─ sectors/{sector}.delta.md    ← If threshold met                │
│                                                                      │
│  MATERIALIZE                                                         │
│  ├─ Apply all deltas to baseline DIGEST.md                          │
│  ├─ Produce complete, readable DIGEST.md                            │
│  └─ Produce DIGEST-DELTA.md (changes-only summary)                  │
│                                                                      │
│  PORTFOLIO MONITOR (lightweight - skip full PM if no triggers)       │
│  ├─ Check thesis invalidation triggers only                         │
│  └─ Write rebalance note only if trigger hit                        │
│                                                                      │
│  PHASE 8-9 (same as baseline)                                        │
│  ├─ Dashboard ETL + Supabase push                                   │
│  ├─ Git commit + push                                               │
│  └─ Post-mortem (abbreviated)                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.4 Validation Gate System

Every phase has a mandatory validation checkpoint. The pipeline **cannot proceed** until the gate passes.

```
validate_db_first.py architecture:

  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Phase N    │────▷│ validate-    │────▷│  Phase N+1   │
  │  completes  │     │ phase.sh N   │     │  begins      │
  └─────────────┘     └──────┬───────┘     └──────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
              ✅ ALL PASS       ❌ FAIL
              (proceed)       (fix + re-run)

Checks per phase:
  - File exists?
  - Content >= MIN_LINES (5)?
  - Required sections present? (e.g., "Market Regime" in DIGEST.md)
  - JSON valid? (for snapshot.json, dashboard-data.json)
  - Supabase row counts? (Phase 8)
```

---

## 5. Data Architecture

### 5.1 Data Flow Diagram

```
                        EXTERNAL DATA SOURCES
                        ─────────────────────
                        │                   │
             ┌──────────┴───────┐   ┌───────┴──────────────┐
             │   Local Scripts   │   │   MCP Tool Servers     │
             │   (yfinance +     │   │   (FRED, CoinGecko,   │
             │    pandas-ta +    │   │    Alpha Vantage,      │
             │    Treasury XML)  │   │    Polymarket, etc.)   │
             └──────────┬───────┘   └───────┬──────────────┘
                        │                   │
                        ▼                   ▼
              ┌─────────────────────────────────────┐
              │    data/agent-cache/daily/YYYY-MM-DD/data/    │
              │    quotes.json   quotes-summary.md   │
              │    macro.json    macro-summary.md     │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────┐
         │          AI AGENT RESEARCH PIPELINE        │
         │                                            │
         │   Web search (live prices, news, events)   │
         │     +                                      │
         │   Local data files (quotes, macro)          │
         │     +                                      │
         │   Prior day's memory files                  │
         │     +                                      │
         │   Config files (watchlist, profile, etc.)   │
         └──────────────────────┬────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │   MARKDOWN OUTPUTS (29 files/day)    │
              │   DIGEST.md + segments + sectors     │
              └──────────────────┬──────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
          ┌──────────────┐ ┌────────────┐ ┌──────────────────┐
          │ snapshot.json │ │ dashboard- │ │  SUPABASE        │
          │ (structured   │ │ data.json  │ │  8 tables        │
          │  sidecar per  │ │ (all-time  │ │  ~25 indexes     │
          │  day)         │ │  aggregate)│ │  CHECK constraints│
          └──────────────┘ └──────┬─────┘ └──────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  REACT FRONTEND   │
                        │  (GitHub Pages)   │
                        └──────────────────┘
```

### 5.2 Database Schema (Supabase — 8 Tables)

```
┌─────────────────────┐     ┌─────────────────────┐
│  daily_snapshots     │     │  positions            │
├─────────────────────┤     ├─────────────────────┤
│ PK id (uuid)        │     │ PK id (uuid)         │
│ UQ date             │     │ date + ticker (UQ)    │
│    run_type          │     │    name               │
│    baseline_date     │     │    category (enum)    │
│    regime (jsonb)    │     │    weight_pct (0-100) │
│    market_data (jsonb│     │    action             │
│    segment_biases    │     │    thesis_id          │
│    actionable[]      │     │    rationale          │
│    risks[]           │     │    current_price      │
└─────────────────────┘     │    entry_price        │
                             │    entry_date          │
                             │    pm_notes            │
┌─────────────────────┐     └─────────────────────┘
│  theses              │
├─────────────────────┤     ┌─────────────────────┐
│ PK id (uuid)        │     │  position_events     │
│ date + thesis_id(UQ)│     ├─────────────────────┤
│    name              │     │ PK id (uuid)         │
│    vehicle           │     │ date + ticker (UQ)    │
│    invalidation      │     │    event (enum)       │
│    status (enum)     │     │    weight_pct (0-100) │
│    notes             │     │    prev_weight_pct    │
└─────────────────────┘     │    price (>= 0)       │
                             │    thesis_id          │
┌─────────────────────┐     │    reason             │
│  documents           │     └─────────────────────┘
├─────────────────────┤
│ PK id (uuid)        │     ┌─────────────────────┐
│ date + file_path(UQ)│     │  nav_history          │
│    title             │     ├─────────────────────┤
│    doc_type (enum)   │     │ PK date              │
│    phase (1-9)       │     │    nav (> 0)          │
│    category (enum)   │     │    cash_pct (0-100)   │
│    segment           │     │    invested_pct       │
│    sector            │     └─────────────────────┘
│    run_type          │
│    content           │     ┌─────────────────────┐
└─────────────────────┘     │  benchmark_history    │
                             ├─────────────────────┤
┌─────────────────────┐     │ date + ticker (UQ)    │
│  portfolio_metrics   │     │    price (>= 0)       │
├─────────────────────┤     └─────────────────────┘
│ PK date              │
│    pnl_pct           │
│    sharpe            │
│    volatility (0-10) │
│    max_drawdown(-1,0)│
│    alpha             │
│    cash_pct (0-100)  │
│    total_invested    │
└─────────────────────┘
```

### 5.3 Schema Hardening (002_schema_hardening.sql)

| Constraint Category | Examples |
|---------------------|----------|
| **Enum-like CHECKs** | `positions.category` IN 12 values; `theses.status` IN 7 values; `documents.doc_type` IN 5 values |
| **Numeric ranges** | `weight_pct` 0-100; `price >= 0`; `nav > 0`; `volatility` 0-10; `max_drawdown` -1 to 0; `phase` 1-9 |
| **NOT NULL** | `positions.ticker`; `positions.date`; `position_events.ticker`/`date`; `benchmark_history.ticker`; `documents.date` |
| **Additional indexes** | `positions.category`; `position_events.event`; `documents.segment`; `theses.status`; `theses.thesis_id` |

### 5.4 Frontend Data Access Pattern

```
┌────────────────────────────────────────────────────────────┐
│                    queries.js                               │
│                                                            │
│  isSupabaseConfigured() ─────┐                             │
│                               │                             │
│                    ┌──────────┴──────────┐                 │
│                    ▼                     ▼                  │
│              YES: Supabase          NO: Static JSON         │
│              ┌──────────────┐    ┌──────────────────────┐  │
│              │ sb.from(table)│    │ fetch(dashboard-     │  │
│              │   .select()   │    │   data.json)         │  │
│              │   .order()    │    │   → extract from     │  │
│              │   .limit()    │    │     cached object    │  │
│              └──────┬───────┘    └──────────┬───────────┘  │
│                     │                       │               │
│                     │  if error ────────────▷               │
│                     │  (fallback)                           │
│                     ▼                       ▼               │
│              ┌──────────────────────────────────┐          │
│              │     React Components              │          │
│              │     Portfolio / Performance /      │          │
│              │     Strategy / DigestTimeline /    │          │
│              │     Architecture                   │          │
│              └──────────────────────────────────┘          │
└────────────────────────────────────────────────────────────┘
```

### 5.5 Memory System (Agent Continuity)

```
memory/
├── macro/ROLLING.md                    Daily entries (## YYYY-MM-DD)
├── equity/ROLLING.md                   ↑ Last 3 entries for trend continuity
├── crypto/ROLLING.md
├── bonds/ROLLING.md
├── commodities/ROLLING.md
├── forex/ROLLING.md
├── international/ROLLING.md
├── sectors/
│   ├── technology/ROLLING.md
│   ├── healthcare/ROLLING.md
│   └── ... (11 total)
├── alternative-data/
│   ├── sentiment/ROLLING.md
│   ├── cta/ROLLING.md
│   ├── options/ROLLING.md
│   └── politician/ROLLING.md
└── institutional/
    ├── flows/ROLLING.md
    └── hedge-funds/ROLLING.md
```

Each segment writes a new `## YYYY-MM-DD` entry after every analysis. At the start of the next day, the agent reads the last 3 entries to maintain analytical continuity.

---

## 6. Frontend Architecture

The dashboard is a **Next.js 15** app under `frontend/` (App Router: `frontend/app/`). It reads **Supabase** as the primary data source (`@supabase/supabase-js`). Charts use **Recharts**; markdown uses **react-markdown** + **remark-gfm**. Styling uses **Tailwind CSS** v4.

| Library | Role |
|---------|------|
| next | Framework + routing |
| react / react-dom | UI |
| @supabase/supabase-js | Database client |
| recharts | Performance / portfolio charts |
| react-markdown, remark-gfm | Document rendering |
| lucide-react | Icons |

Older Vite-era component-tree documentation has been removed; follow `frontend/app/` and `frontend/components/` for the live structure.

---

## 7. Deployment Architecture

```
┌───────────────┐     git push      ┌──────────────────────┐
│  Local Repo    │────────────────▷  │  GitHub (master)      │
│  (operator's   │                   │                       │
│   machine)     │                   │  .github/workflows/   │
└───────────────┘                   │    deploy.yml         │
                                     └──────────┬───────────┘
                                                │ triggers
                                                ▼
                                     ┌──────────────────────┐
                                     │  GitHub Actions       │
                                     │  1. npm ci            │
                                     │  2. npm run build     │
                                     │  3. Upload dist/      │
                                     │  4. Deploy to Pages   │
                                     └──────────┬───────────┘
                                                │
                                                ▼
                                     ┌──────────────────────┐
                                     │  GitHub Pages          │
                                     │  chrizefan.github.io/ │
                                     │  digiquant-atlas/      │
                                     │                       │
                                     │  Static SPA serving   │
                                     │  dashboard-data.json  │
                                     └──────────────────────┘
```

---

## 8. Agent Architecture

### 8.1 Agent Interaction Model

The system uses a **single-agent sequential execution** model. One AI agent session runs the entire pipeline from Phase 1 through Phase 9. There are no parallel agents or message-passing between agents.

Agent "roles" (orchestrator, sector analyst, PM) are implemented as **skill file routing** — the same agent reads different instruction sets depending on the pipeline phase.

```
                     ┌──────────────────────────────┐
                     │      SINGLE AI SESSION        │
                     │                                │
                     │  Reads skills/orchestrator/SKILL.md   │
                     │         │                      │
                     │         ▼                      │
                     │  Phase 1: reads SKILL-         │
                     │    sentiment-news.md            │
                     │  Phase 1: reads SKILL-         │
                     │    cta-positioning.md           │
                     │         ...                    │
                     │  Phase 5B: reads SKILL-        │
                     │    sector-technology.md          │
                     │         ...                    │
                     │  Phase 7C: reads SKILL-        │
                     │    deliberation.md              │
                     │  Phase 7D: reads SKILL-        │
                     │    portfolio-manager.md         │
                     │         ...                    │
                     │                                │
                     │  Same session, different hats   │
                     └──────────────────────────────┘
```

### 8.2 MCP Tool Integration

MCP (Model Context Protocol) servers provide structured API access as a fallback when local Python scripts are unavailable.

```
Agent → MCP Server → External API → Structured Response

Configured servers:
  fred              → Federal Reserve (800K economic series)
  polymarket        → Prediction markets
  crypto-feargreed  → Fear & Greed index
  coingecko         → Crypto prices and market data
  frankfurter-fx    → FX exchange rates
  world-bank        → GDP, inflation, debt
  sec-edgar         → SEC filings, insider trades
  alpha-vantage     → Stock fundamentals, earnings
```

---

## 9. Security and Integrity

### 9.1 Evolution Guardrails

The system includes explicit guardrails to prevent uncontrolled drift:

| Guardrail | Implementation |
|-----------|---------------|
| **Proposals only** | Agent may never directly execute evolution changes — only propose |
| **Max 2 proposals/session** | Prevents drift from accumulated micro-changes |
| **Locked sections** | Template structure, risk constraints, and guardrails themselves are immutable |
| **Branch + PR** | Evolution artifacts go to `evolve/YYYY-MM-DD` branch, require manual merge |
| **Source observation only** | Agent records source quality but cannot modify `docs/ops/data-sources.md` |

### 9.2 Data Integrity

| Control | Implementation |
|---------|---------------|
| **Schema constraints** | 25+ CHECK constraints on numeric ranges, enum values, NOT NULL |
| **Unique keys** | `(date, ticker)` on positions; `(date, thesis_id)` on theses; etc. |
| **Validation gates** | Pipeline cannot proceed until each phase validates |
| **No training data** | Agent must always search web for current prices — never use stale training data |
| **Materialization guarantee** | DIGEST.md must always be a complete, readable file (never just deltas) |

---

## 10. Known Limitations and Technical Debt

### 10.1 Current Limitations

| Area | Limitation | Impact |
|------|-----------|--------|
| **Single-session pipeline** | Full baseline requires one long AI session (~all 9 phases). Session timeout or context overflow can halt mid-pipeline. | May need to resume from a mid-phase checkpoint |
| **No parallel execution** | Phases run strictly sequentially. Independent phases (e.g., bonds and forex) could theoretically run in parallel. | Increases total wall-clock time |
| **Regex-based parsing** | `generate-snapshot.py` and `update-tearsheet.py` use regex to extract data from Markdown | Fragile — format changes in DIGEST.md can break extraction |
| **Static JSON size** | `dashboard-data.json` includes full Markdown content of all documents | Grows with time (~5-10 MB+). May need pruning or lazy loading |
| **No authentication** | Frontend is public GitHub Pages with no auth. Supabase uses anon key. | Not suitable for sensitive data |
| **yfinance dependency** | NAV simulation and benchmark data require yfinance in local venv | CI/sandbox environments can't compute NAV without yfinance |

### 10.2 Technical Debt Items

1. **Dual data path**: Both `snapshot.json` (structured) and regex parsing of `DIGEST.md` (unstructured) exist. snapshot.json should be the sole data source for ETL.
2. **Memory file growth**: ROLLING.md files grow unbounded. Need rotation/archival strategy.
3. **No automated testing**: No unit tests for Python scripts. No integration tests for pipeline.
4. **Hardcoded file classifications**: `FILE_CLASSIFICATION` dict in `update-tearsheet.py` must be manually updated when new segments are added.
5. **Dashboard-data.json as deployment artifact**: The JSON is committed to git and deployed via GitHub Pages. A proper build step would generate it during CI.

---

*This document should be updated when significant architectural changes are made. All diagrams use ASCII art for portability.*
