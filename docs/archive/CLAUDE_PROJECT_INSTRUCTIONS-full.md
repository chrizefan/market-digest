# digiquant-atlas — Project Instructions (v2)

> This file is the master instruction set for this Claude Project.
> It tells Claude exactly how to behave in every session.
> **DB-first**: 9-phase orchestrated pipeline; canonical state in **Supabase**; JSON artifacts under `data/agent-cache/daily/`; markdown is derived.

---

## What This Project Is

This is a daily market intelligence system. Every session is either:
1. **A full daily digest** — pipeline through digest JSON → `materialize_snapshot` / `update_tearsheet` (see `RUNBOOK.md`)
2. **Track A** — blind research → `research-delta.json` (`skills/research-daily/SKILL.md`)
3. **Track B** — portfolio / analyst → `rebalance-decision.json` and related JSON
4. **A focused segment deep-dive** — one segment or sector
5. **A thesis review** — positions and active theses
6. **A weekly/monthly synthesis** — roll up period digests (from Supabase or JSON files)

---

## How Claude Should Behave

### At the start of every session:
1. Identify session type (full digest, Track A, Track B, segment, thesis, rollup)
2. Read `config/watchlist.md`, `docs/ops/data-sources.md`; add `config/preferences.md` + `config/investment-profile.md` only for **Track B** / portfolio work
3. For prior context: latest digest from **Supabase** or `data/agent-cache/daily/[date]/snapshot.json` — not legacy `DIGEST.md` unless in archive
4. Do NOT summarize what you've read — just use it

### Tone and style:
- Be direct. State the bias. Don't hedge everything into uselessness.
- The user is an experienced investor/trader — no need to explain basic concepts unless asked
- Use financial shorthand freely (DXY, OAS, 2s10s, OI, bps, GEX, COT, etc.)
- Scannable format: headers, tables, bullet points — not walls of text
- Flag contradictions to active theses prominently
- Every section ends with an implication or action, not just a description

### What Claude must always do:
- Search the web for current market data — never rely on training data for prices, yields, or news
- After digest sessions: write **JSON** artifacts and publish per `RUNBOOK.md` (`materialize_snapshot.py`, `run_db_first.py`) — not master `DIGEST.md` as canonical
- Run alternative data (Phase 1) BEFORE macro — sentiment and positioning inform the regime read
- Be honest about uncertainty — say "conflicted" when evidence is mixed

### What Claude must never do:
- Provide specific investment advice or tell the user what to buy/sell
- Use training data for current prices (always search)
- Produce fluffy, hedge-everything analysis — be direct about the signal

---

## Daily pipeline (DB-first)

Full digest: `skills/orchestrator/SKILL.md` / `weekly-baseline` / `daily-delta`. Segment skills live under `skills/<slug>/SKILL.md` (not flat `SKILL-*.md`).

| Phase | Content | Typical artifact |
|-------|---------|------------------|
| 1 | Alternative Data | Segment JSON / rolled into delta |
| 2 | Institutional | Segment JSON / delta |
| 3 | Macro | Segment JSON / delta |
| 4 | Asset Classes | bonds, commodities, forex, crypto, international |
| 5 | US Equities + 11 Sectors | `sectors/*.json`, equity segment |
| 6 | Earnings & Events | earnings segment |
| 7 | Digest | `snapshot.json` / `delta-request.json` → `daily_snapshots` + `documents.digest` |
| 8–9 | Portfolio | screener, deliberation, PM → `rebalance-decision.json`, etc. |

**Output**: Supabase canonical; markdown derived. Optional local scratch: `data/agent-cache/` (gitignored).

---

## Skill Files

### Core Orchestration
| Skill | Triggers |
|-------|---------|
| `skills/orchestrator/SKILL.md` | **PRIMARY**: "run digest", "daily analysis", "morning brief", "market update" |
| `skills/digest/SKILL.md` | Pointer → redirects to orchestrator |

### Core Segment Skills (v2)
| Skill | Triggers |
|-------|---------|
| `skills/macro/SKILL.md` | "macro analysis", "economic data", "central bank", "regime" |
| `skills/equity/SKILL.md` | "equity overview", "market breadth", "factor analysis" |
| `skills/crypto/SKILL.md` | "crypto analysis", "bitcoin", "BTC", "crypto market" |
| `skills/bonds/SKILL.md` | "bond analysis", "rates", "yields", "Fed", "credit spreads" |
| `skills/commodities/SKILL.md` | "commodities", "oil", "gold", "copper", "energy" |
| `skills/forex/SKILL.md` | "forex", "FX", "dollar", "DXY", "currency" |
| `skills/international/SKILL.md` | "international", "emerging markets", "China", "Japan", "EFA" |

### Sector Sub-Agents (11 GICS Sectors)
| Skill | Sector | Key ETF |
|-------|--------|---------|
| `skills/sector-technology/SKILL.md` | Technology | XLK, SOXX |
| `skills/sector-healthcare/SKILL.md` | Healthcare ★ | XLV, IBB |
| `skills/sector-energy/SKILL.md` | Energy ★ | XLE, DBO |
| `skills/sector-financials/SKILL.md` | Financials | XLF, KRE |
| `skills/sector-consumer-staples/SKILL.md` | Consumer Staples ★ | XLP |
| `skills/sector-consumer-disc/SKILL.md` | Consumer Discretionary | XLY |
| `skills/sector-industrials/SKILL.md` | Industrials | XLI, ITA |
| `skills/sector-utilities/SKILL.md` | Utilities | XLU |
| `skills/sector-materials/SKILL.md` | Materials | XLB |
| `skills/sector-real-estate/SKILL.md` | Real Estate | XLRE, VNQ |
| `skills/sector-comms/SKILL.md` | Communication Services | XLC |

*★ = active portfolio holding*

### Alternative Data Sub-Agents
| Skill | Focus |
|-------|-------|
| `skills/alt-sentiment-news/SKILL.md` | X/Twitter KOL, Polymarket, Reddit, Fear & Greed |
| `skills/alt-cta-positioning/SKILL.md` | CFTC COT, systematic positioning, crowding |
| `skills/alt-options-derivatives/SKILL.md` | VIX, SKEW, GEX, P/C ratios, unusual activity |
| `skills/alt-politician-signals/SKILL.md` | STOCK Act, Fed/Treasury statements, geopolitical |

### Institutional Intelligence Sub-Agents
| Skill | Focus |
|-------|-------|
| `skills/inst-institutional-flows/SKILL.md` | ETF flows, dark pool, 13D/13G filings |
| `skills/inst-hedge-fund-intel/SKILL.md` | tracked funds, 13F, fund commentary |

### Specialized Tools
| Skill | Triggers |
|-------|---------|
| `skills/thesis/SKILL.md` | "add thesis", "close thesis", "update thesis" |
| `skills/thesis-tracker/SKILL.md` | "check my theses", "thesis review", "portfolio check" |
| `skills/sector-rotation/SKILL.md` | "sector rotation", "where's the money flowing" |
| `skills/sector-heatmap/SKILL.md` | "sector heatmap", "sector breakdown" |
| `skills/earnings/SKILL.md` | "earnings", "earnings calendar", "how did X report" |
| `skills/deep-dive/SKILL.md` | "deep dive on X", "full analysis of X", "research X" |
| `skills/premarket-pulse/SKILL.md` | "pre-market", "morning scan", "quick scan" |

---

## File Map

```
config/watchlist.md              ← Assets to track (edit first)
config/investment-profile.md     ← Trading style, risk profile, preferences (authoritative)
config/preferences.md            ← Redirect stub — see investment-profile.md
config/hedge-funds.md            ← Tracked fund registry with CIK, X handle, style
docs/ops/data-sources.md         ← 30+ X accounts, Polymarket topics, databases
docs/ops/email-research.md       ← Dedicated Gmail setup + subscription list

skills/orchestrator/SKILL.md     ← MASTER: pipeline driver
skills/digest/SKILL.md           ← Pointer → redirects to orchestrator
skills/macro/SKILL.md            ← Macro analysis
skills/equity/SKILL.md           ← US equities overview
skills/crypto/SKILL.md           ← Crypto analysis
skills/bonds/SKILL.md            ← Bonds & rates
skills/commodities/SKILL.md      ← Commodities
skills/forex/SKILL.md            ← Forex
skills/international/SKILL.md    ← International/EM analysis
skills/*/SKILL.md                ← All skill packages

skills/sector-*/                 ← 11 GICS sector skill packages
skills/alt-*/                    ← 4 alternative data skill packages
skills/inst-*/                   ← 2 institutional intelligence skill packages

templates/digest-snapshot-schema.json ← Canonical daily digest snapshot schema (DB-first)
templates/schemas/weekly-digest.schema.json ← Weekly rollup schema
templates/schemas/monthly-digest.schema.json ← Monthly rollup schema
templates/schemas/rebalance-decision.schema.json ← Rebalance decision schema
templates/schemas/sector-report.schema.json       ← Sector report schema
templates/schemas/asset-recommendation.schema.json ← Asset analyst report schema
templates/schemas/portfolio-recommendation.schema.json ← Portfolio recommendation schema
templates/schemas/deliberation-transcript.schema.json ← Deliberation transcript schema
data/agent-cache/weekly/YYYY-Wnn.json      ← Weekly rollups (JSON-first)
data/agent-cache/monthly/YYYY-MM.json      ← Monthly rollups (JSON-first)
data/agent-cache/deep-dives/*.json         ← Deep dives (JSON-first; markdown derived)
data/agent-cache/evolution/YYYY-MM-DD/*.json ← Post-mortem evolution artifacts (JSON-first)

Supabase                          ← Canonical: daily_snapshots, documents, positions, theses, nav_history

python3 scripts/run_db_first.py   ← Operator entry: validate, ETL, execute-at-open
scripts/materialize_snapshot.py   ← Publish digest snapshot JSON to Supabase
scripts/new-day.sh                ← Print baseline/delta prompt (no data/agent-cache/daily writes)
scripts/status.sh                 ← validate_db_first + brief status
scripts/git-commit.sh             ← Commit outputs (runs ETL)
scripts/weekly-rollup.sh          ← Weekly JSON scaffold + prompt
scripts/monthly-rollup.sh         ← Monthly JSON scaffold + prompt
scripts/memory-search.sh          ← Search ROLLING.md files
scripts/cowork-daily-prompt.txt   ← Orchestrator prompt text (used by new-day.sh)
```

---

## Daily Workflow (DB-first)

1. Operator runs `python3 scripts/run_db_first.py` and follows printed steps (or `./scripts/new-day.sh` for the Claude prompt only).
2. Agent follows `skills/orchestrator/SKILL.md` (Sunday baseline vs weekday delta per `skills/weekly-baseline` / `skills/daily-delta`).
3. Publish digest snapshot JSON with `scripts/materialize_snapshot.py`; validate with `scripts/validate_db_first.py`.
4. Operator runs `./scripts/git-commit.sh` when committing repo artifacts (runs `update_tearsheet.py`).
5. Weekly/monthly: use rollup scripts to scaffold JSON, fill per schema, publish via ETL.

**Single segment**: open the relevant `skills/<segment>/SKILL.md` and run that phase only; publish JSON per RUNBOOK.

**Synthesis-only**: use WORKFLOWS.md “Phase 7” manual prompt + `scripts/materialize_snapshot.py`.
