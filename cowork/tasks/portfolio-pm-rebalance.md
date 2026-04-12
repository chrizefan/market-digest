# Task: Portfolio — PM, analyst, rebalance (Track B)

**Before anything else:** read [`../PROJECT.md`](../PROJECT.md).

## Preconditions

**Research close-out for the as-of date must already be done** (Track A — see [`research-weekly-baseline.md`](research-weekly-baseline.md) or [`research-daily-delta.md`](research-daily-delta.md)):

- **`documents`** row with `document_key` **`digest`** for **`{{DATE}}`** — the **single research overview** that rolls up all sub-segments. The PM does **not** author or compile this; it is the **final artifact of the research task**.
- **`daily_snapshots`** for **`{{DATE}}`** (materialized digest JSON), and preferably **`research-changelog/{{DATE}}.json`** (after `fold_document_deltas.py`) when you use the per-document delta pipeline.

If `digest` is missing, **stop** and run the appropriate **research** task first. **Do not** depend on local `data/agent-cache/` for canonical state.

## Objective

Single-session **thesis-first** pipeline **after** research has published the digest: compile that research context → **market thesis exploration** (no portfolio weights) → **thesis→vehicle map** (user mandate) → **opportunity screener** → per-asset analysts → **per-ticker deliberation** → **PM allocation memo** → clean-slate portfolio + **`rebalance_decision`**, then `run_db_first.py`.

Uses **`config/preferences.md`**, **`config/investment-profile.md`**, and (only where a skill explicitly allows) **`config/portfolio.json`**.

## Fresh vs delta (Track B artifacts)

| Artifact | Rule |
|----------|------|
| **`market_thesis_exploration`** | **Delta-friendly:** publish a full JSON for the date; on refinements to the same exploration doc, prefer **`document_delta`** targeting that day’s `document_key` (same pattern as research per-doc deltas). |
| **`thesis_vehicle_map`** | **Delta-friendly** when only mapping rows change. |
| **`asset_recommendation`** | **Delta-friendly** when revising the same ticker’s write-up; otherwise fresh key per material revision. |
| **`deliberation_transcript`** (per ticker) | **Always fresh** for each conference: `deliberation-transcript/{{DATE}}/{{TICKER}}.json` (new row each run). |
| **`deliberation_session_index`** | **Fresh** each session: `deliberation-transcript-index/{{DATE}}.json` — lists per-ticker keys + `converged` flags. |
| **`pm_allocation_memo`** | **Always fresh:** `pm-allocation-memo/{{DATE}}.json`. |
| **`portfolio_recommendation`**, **`rebalance_decision`** | As today (typically fresh per publish). |

## Ordered phases (run in one session)

### Phase 0 — Compile research context

1. Load `daily_snapshots` for **`{{DATE}}`** and **prior trading day** (T−1) for portfolio continuity.
2. Load **`documents.digest`** (canonical research overview) plus latest `research-delta/*` for the date (if any), `research-changelog/{{DATE}}.json` when present, `research_baseline_manifest` if published.
3. Build a short **internal brief** (bullet list): what moved, what is unchanged, which keys to cite. **Do not** read user portfolio weights yet.

### Phase 1 — Market thesis exploration (preference-blind)

Follow [`skills/market-thesis-exploration/SKILL.md`](../../skills/market-thesis-exploration/SKILL.md).

- **Allowed:** `config/watchlist.md` as optional **universe bound** only (ticker names / categories — not weights).
- **Forbidden:** `config/portfolio.json` (any field), `config/preferences.md`, `config/investment-profile.md`.
- **Output:** validate with `templates/schemas/market-thesis-exploration.schema.json`, publish e.g. `market-thesis-exploration/{{DATE}}.json`.

### Phase 2 — Thesis → vehicle map (user mandate)

Follow [`skills/thesis-vehicle-map/SKILL.md`](../../skills/thesis-vehicle-map/SKILL.md).

- **Inputs:** Phase 1 artifact + `investment-profile` + `watchlist` + `preferences` as needed for mandate language.
- **Output:** `thesis-vehicle-map/{{DATE}}.json` (`thesis_vehicle_map` schema).

### Phase 3 — Opportunity screen

[`skills/opportunity-screener/SKILL.md`](../../skills/opportunity-screener/SKILL.md) — **primary** input: Phase 2 **vehicle map** + **`digest`** from research; **fallback** if map missing: legacy watchlist-only path.

### Phase 4 — Per-asset analysts

For each ticker on the roster, run [`skills/asset-analyst/SKILL.md`](../../skills/asset-analyst/SKILL.md). Publish **`asset_recommendation`** JSON per ticker (Supabase). Each report **must** link **`linked_thesis_ids`** (and **`research_citations`** when possible) per skill.

### Phase 5 — PM ↔ analyst deliberation (per ticker)

Follow [`skills/deliberation/SKILL.md`](../../skills/deliberation/SKILL.md):

- One **`deliberation_transcript`** per ticker under `deliberation-transcript/{{DATE}}/{{TICKER}}.json`.
- **Unbounded rounds** until PM sets `meta.converged: true` for that ticker; analysts may “recess” for light research and return.
- Publish **`deliberation_session_index`** at `deliberation-transcript-index/{{DATE}}.json` listing all per-ticker keys.

### Phase 6 — PM allocation memo

Follow [`skills/pm-allocation-memo/SKILL.md`](../../skills/pm-allocation-memo/SKILL.md). Publish **`pm_allocation_memo`** (`pm-allocation-memo/{{DATE}}.json`): T−1 weights vs proposal, turnover / mandate notes from `investment-profile`, synthesis and links to deliberation keys. **Fresh document every run.**

### Phase 7 — Portfolio construction and rebalance

Follow [`skills/portfolio-manager/SKILL.md`](../../skills/portfolio-manager/SKILL.md): aggregate deliberation outcomes + PM memo → Phase B clean-slate → Phase C vs **`config/portfolio.json`** (respect quantized weights, max change / thesis override rules). Publish **`portfolio_recommendation`** and **`rebalance_decision`**; update `proposed_positions` as today.

### Step validation (optional but recommended)

After publishing to Supabase, confirm rows and JSON shapes with [`scripts/validate_pipeline_step.py`](../../scripts/validate_pipeline_step.py) (`pip install jsonschema` if needed):

| After phase | Command |
|-------------|---------|
| Preconditions (digest exists) | `python3 scripts/validate_pipeline_step.py --date YYYY-MM-DD --step track_b_precheck` |
| Phase 1 | `--step track_b_1_market_thesis` |
| Phase 2 | `--step track_b_2_vehicle_map` |
| Phase 3 | `--step track_b_3_opportunity` |
| Phase 4 | `--step track_b_4_asset_recommendations` (add `--min-asset-recs N` if needed) |
| Phase 5 | `--step track_b_5_deliberation` |
| Phase 6 | `--step track_b_6_pm_memo` |
| Phase 7 | `--step track_b_7_rebalance` |
| Full Track B chain | `python3 scripts/validate_pipeline_step.py --date YYYY-MM-DD --chain track_b` |

`--list` prints all step names. **`track_b_precheck`** is the same checks as **`research_closeout`** (digest + snapshot).

### Closeout

1. `python3 scripts/run_db_first.py --validate-mode pm` (use `full` if you also need full digest checks).
2. `python3 scripts/validate_pipeline_step.py --date YYYY-MM-DD --chain track_b` (or `--step track_b_7_rebalance` if earlier steps were already validated).
3. If execution prices stayed null after open: `python3 scripts/backfill_execution_prices.py --date YYYY-MM-DD`.

**Execution prefs:** [`config/schedule.json`](../../config/schedule.json)  
**Long combined digest + portfolio checklist:** [`scripts/cowork-daily-prompt.txt`](../../scripts/cowork-daily-prompt.txt)
