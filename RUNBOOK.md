# RUNBOOK — digiquant-atlas (DB-first, JSON-first)

This is the **single authoritative** run instruction for digiquant-atlas.

## Schedules: GitHub Actions vs Co-work

| Layer | When | What runs | Supabase impact |
|--------|------|-----------|-----------------|
| **GitHub — Daily Price Update** | Weekdays **22:00 UTC** (documented as ~**6:00 PM US Eastern** after NYSE close; exact local offset follows DST) | [`preload-history.py`](scripts/preload-history.py) (stale refresh) → [`compute-technicals.py`](scripts/compute-technicals.py) → macro ingest ([`ingest_fred.py`](scripts/ingest_fred.py), [`ingest_fx_frankfurter.py`](scripts/ingest_fx_frankfurter.py), [`ingest_crypto_fng.py`](scripts/ingest_crypto_fng.py), [`ingest_treasury_curve.py`](scripts/ingest_treasury_curve.py), [`ingest_sec_recent_filings.py`](scripts/ingest_sec_recent_filings.py)) | `price_history`, `price_technicals`, **`macro_series_observations`** (FRED, Frankfurter, Fear & Greed, Treasury: **`us_treasury`** XML when available + **`treasury_market`** Yahoo ^IRX/^FVX/^TNX/^TYX), **`sec_recent_filings`** (watchlist, last 14 days) — **no** digest, no agent research |
| **Co-work / operator — research & portfolio** | Typically **pre-market** (e.g. 8:00 AM local) or per [`config/schedule.json`](config/schedule.json) | Agent validates + publishes JSON to Supabase (`materialize_snapshot.py`, `publish_document.py`, …) → operator runs [`run_db_first.py`](scripts/run_db_first.py) (optional disk checks → metrics → `execute_at_open.py` → [`validate_db_first.py`](scripts/validate_db_first.py)) | `daily_snapshots`, `documents`, `positions`, `theses`, `position_events`, etc. |

### Daily portfolio continuity (post-close)

The weekday GitHub job runs [`refresh_performance_metrics.py --fill-calendar-through`](scripts/refresh_performance_metrics.py) to **today (UTC)** so you get a **dense calendar** in Supabase even when no digest ran:

1. Refreshes performance columns on the **latest** existing `positions` date (same weights; closes from `price_history`).
2. For each **calendar day** after that through the target date: if `positions` has no rows for that date, **clones** the prior day (carry-forward), then updates per-position metrics, `nav_history`, and **`portfolio_metrics`** with `computed_from='refresh_script'`.
3. **Does not overwrite** `portfolio_metrics` rows written by `update_tearsheet.py` (`computed_from='tearsheet'`). Sharpe / vol / drawdown / alpha on script-written days are **carried forward** from the previous metrics row until the next tearsheet recompute.

**Manual backfill** (e.g. fill gaps after prices exist):  
`python3 scripts/refresh_performance_metrics.py --supabase --fill-calendar-through YYYY-MM-DD`

**Limitation:** `--fill-calendar-through` advances from the **latest** `positions` snapshot date forward only; it does not scan for **holes** on earlier dates. For a missing day *before* your latest snapshot, run once with `--date YYYY-MM-DD` (after `price_history` has that day).

**GitHub — manual “Daily Price Update”:** By default (checkbox **full history** off) the job matches the weekday cron: **`--incremental-supabase`** — Yahoo fetches only from `(latest price_history date per ticker) − overlap` (see script), merges with Supabase for a full local series for TA, and upserts the **recent Yahoo window** only. For a **one-time full backfill** (or after adding many tickers), run the workflow with **full history** checked and **period** `max` (or `5y`). **Ticker** optional: scope either mode to one symbol. **New ticker** with no `price_history` rows yet: incremental mode uses `--period` from the script (default **2y**); use **full history** or `python3 scripts/preload-history.py --supabase --period max` once if you need full depth.

**Macro + Treasury + SEC (automated):** After technicals, the workflow runs FRED (if **`FRED_API_KEY`**), Frankfurter, crypto Fear & Greed, **Treasury yields** (`us_treasury` from Treasury XML when the feed returns data — often empty from CI; plus **`treasury_market`** from Yahoo ^IRX/^FVX/^TNX/^TYX for reliable 3M/5Y/10Y/30Y), and **recent EDGAR filings** for [`config/watchlist.md`](config/watchlist.md) (if **`SEC_EDGAR_USER_AGENT`** — GitHub secret). Migrations: [`015`](supabase/migrations/015_macro_series_observations.sql), [`016`](supabase/migrations/016_sec_recent_filings.sql). **One-time deep backfill:** manual workflow **backfill macro** (Treasury: Yahoo **`max`** for `treasury_market`; **`ingest_treasury_curve --backfill`** skips the Treasury.gov XML month crawl for speed — use **`--xml-months N`** locally if you need official XML rows). **Smoke tests:** `ingest_treasury_curve.py --dry-run`, `ingest_sec_recent_filings.py --dry-run`. Extra FRED series: [`config/macro_series.yaml`](config/macro_series.yaml); bad IDs log a warning and continue.

**Claude Cowork:** project briefing and scheduled task recipes live under [`cowork/`](cowork/) — see [`cowork/README.md`](cowork/README.md) and paste [`cowork/PROJECT-PROMPT.md`](cowork/PROJECT-PROMPT.md) into the Cowork project instructions. **First-time setup:** [`cowork/SETUP-ATLAS-COWORK.md`](cowork/SETUP-ATLAS-COWORK.md) (agent-driven wizard → `cowork/OPERATOR-COWORK.md` + `config/schedule.json` → `cowork_operator`).

**Weekly baseline vs weekly digest:** [`scripts/run_db_first.py`](scripts/run_db_first.py) treats **Sunday** as **baseline** and other days as **delta** (unless `--baseline` / `--delta`). There is **no** scheduled GitHub reminder for **`weekly_digest`**; publish to Supabase when due (`document_key` e.g. `weekly/YYYY-Www.json`) and use [`scripts/weekly-rollup.sh`](scripts/weekly-rollup.sh) for the operator prompt — not a filesystem `data/agent-cache/weekly/*.md` requirement.

## Two tracks (research vs portfolio)

- **Track A — Generic research** (positioning-blind): macro, sectors, crypto, sentiment, etc. **Do not** load `config/preferences.md` or `config/investment-profile.md`. Output: `research_delta` JSON → **`validate_artifact.py -`** → **`publish_document.py --payload -`** with a **unique** `document_key` per run, e.g. `research-delta/20260411T143022Z.json` (see [`skills/research-daily/SKILL.md`](skills/research-daily/SKILL.md)). Run [`run_db_first.py --skip-execute --validate-mode research`](scripts/run_db_first.py) after publish.
- **Track B — Portfolio manager & analyst** (user-specific): reads latest research from Supabase + [`config/preferences.md`](config/preferences.md) + [`config/investment-profile.md`](config/investment-profile.md); produces `rebalance_decision` and related portfolio documents. Timing is controlled by [`config/schedule.json`](config/schedule.json) (`portfolio_manager_cadence`, `execution_assumption`, `rebalance_source_for_opens`). Run full validation: `--validate-mode full` or `pm`.

## Market-open execution and price backfill

Pre-market runs publish a **same-day** `rebalance_decision` before **that day’s** `price_history.open` exists. [`execute_at_open.py`](scripts/execute_at_open.py) may record `position_events` with **`price: null`**. After the session opens (or after prices sync), run:

```bash
python3 scripts/backfill_execution_prices.py --date YYYY-MM-DD
```

Optional **T−1 model:** execute **yesterday’s** rebalance at **today’s** open:

```bash
python3 scripts/execute_at_open.py --date YYYY-MM-DD --prior-trading-day-rebalance
```

## Compiled daily view (no extra permanent storage)

Do **not** store a third “full compiled markdown” copy per weekday. The UI should **derive** the effective view by folding **Sunday baseline** + **delta ops** Mon→as-of (see [`docs/agentic/COMPILED-RESEARCH-VIEW.md`](docs/agentic/COMPILED-RESEARCH-VIEW.md)).

## Canonical principles
- **Supabase is the source of truth** for daily snapshots, documents, positions, theses, NAV, and metrics.
- **JSON payloads are canonical**. Markdown is always **derived** for display. Agents should **`validate_artifact.py -`** and **`publish_document.py --payload -`** (stdin) so hosted runs need no repo-local files. Optional JSON under **`data/agent-cache/`** is **gitignored** scratch for local validation only.
- **Daily operator run** publishes structured artifacts → validates DB state → optionally records position events as executed at **market open (Mon–Fri)** (see backfill above).
- **Disk migration:** if you have an external export of old daily folders, copy them into `data/agent-cache/daily/` (gitignored) before running backfill scripts — see below.
- **Retired `outputs/` path:** the repo must not depend on an `outputs/` directory (it is **gitignored** if recreated). Before deleting any local copy, confirm Supabase is canonical: `python3 scripts/verify_supabase_canonical.py` and optional `--date YYYY-MM-DD` for days you care about.

## Environment requirements
1. Python 3.11+ recommended.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Supabase credentials (service role required for publishing):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

4. **FRED API key** (free): [`FRED_API_KEY`](https://fred.stlouisfed.org/docs/api/api_key.html) — required for `ingest_fred.py` and for the GitHub **Daily Price Update** job to load FRED series. If unset in Actions, FRED is skipped with a warning; Frankfurter and Fear & Greed still run.

5. **Unified local secrets (optional):** [`config/mcp.secrets.env`](config/mcp.secrets.env) (gitignored; copy from [`config/mcp.secrets.env.example`](config/mcp.secrets.env.example)) can hold **`FRED_API_KEY`**, optional **`COINGECKO_API_KEY`** / **`ALPHA_VANTAGE_API_KEY`**, and **`SEC_EDGAR_USER_AGENT`**. Ingest scripts load it automatically next to `supabase.env`. For **GitHub Actions**, add repository secrets **`FRED_API_KEY`** and **`SEC_EDGAR_USER_AGENT`** (filings ingest is skipped if unset). **Cursor MCP** uses the same names via **`${env:…}`** in [`.cursor/mcp.json`](.cursor/mcp.json) — see [`config/MCP-SETUP.md`](config/MCP-SETUP.md).

Recommended: keep `SUPABASE_*` in `config/supabase.env`; add API keys to `config/mcp.secrets.env` or export them before launching Cursor.

**Script index (grouped by role):** [`docs/ops/SCRIPTS.md`](docs/ops/SCRIPTS.md)

## One command entrypoint (the only supported start)
For both manual and scheduled runs:

```bash
python3 scripts/run_db_first.py
```

(`./scripts/new-day.sh` is a thin wrapper around the same command.)

Common flags:
- `--date YYYY-MM-DD`
- `--baseline` (force baseline mode)
- `--delta` (force delta mode)
- `--dry-run` (print what would happen; no writes)
- `--skip-execute` (skip `execute_at_open.py` — use after **Track A** research-only runs)
- `--validate-mode {full,research,pm}` (passed to [`validate_db_first.py`](scripts/validate_db_first.py); default `full`)

**Default:** after optional JSON validation under `data/agent-cache/daily/<date>/`, the entrypoint runs [`refresh_performance_metrics.py --supabase --fill-calendar-through <date>`](scripts/refresh_performance_metrics.py). Run [`update_tearsheet.py`](scripts/update_tearsheet.py) separately when recovering from disk-backed markdown or partial publishes.

## What gets produced (canonical artifacts)
### Daily baseline/delta (stored in Supabase)
- **Daily snapshot** (canonical): `templates/digest-snapshot-schema.json`
  - stored in `daily_snapshots.snapshot` and mirrored to `documents` as payload for `document_key='digest'`
- **Delta ops** on weekdays: `templates/delta-request-schema.json`

### Portfolio layer (stored in Supabase documents.payload)
- `asset_recommendation` (`templates/schemas/asset-recommendation.schema.json`)
- `deliberation_transcript` (`templates/schemas/deliberation-transcript.schema.json`)
- `portfolio_recommendation` (`templates/schemas/portfolio-recommendation.schema.json`)
- `rebalance_decision` (`templates/schemas/rebalance-decision.schema.json`)

### Weekly/monthly rollups (published to `documents`)
- Weekly: `doc_type: weekly_digest` — schema `templates/schemas/weekly-digest.schema.json`; publish with `publish_document.py` (stdin or temp file), stable `document_key` e.g. `weekly/2026-W15.json`.
- Monthly: `doc_type: monthly_digest` — `templates/schemas/monthly-digest.schema.json`; `document_key` e.g. `monthly/2026-04.json`.

### Deep dives (JSON → Supabase)
- Payload `doc_type: deep_dive` (`templates/schemas/deep-dive.schema.json`). Validate + `publish_document.py --payload -` with an appropriate `document_key` under `deep-dives/…`.
- Optional scaffold: `./scripts/scaffold_deep_dive.sh YYYY-MM-DD "Title Slug"` (local scratch only; still publish to DB).

### Evolution post-mortem (JSON → Supabase)
- `evolution_sources`, `evolution_quality_log`, `evolution_proposals` — schemas under `templates/schemas/evolution-*.schema.json`.
- Optional scaffold: `./scripts/scaffold_evolution_day.sh [YYYY-MM-DD]` then publish each JSON with `publish_document.py`.

## What `run_db_first.py` does (post-publish)
After artifacts are already in Supabase, `run_db_first.py`:
1. Prints run-type guidance (baseline Sunday vs weekday delta).
2. Optionally validates any JSON files present under `data/agent-cache/daily/<date>/` via `scripts/validate_artifact.py`.
3. Runs `scripts/refresh_performance_metrics.py --supabase --fill-calendar-through <date>`.
4. Runs `scripts/execute_at_open.py` unless `--skip-execute`.
5. Runs `scripts/validate_db_first.py --date <date> --mode <full|research|pm>` and exits non-zero if checks fail (`run_db_first.py` exposes this as `--validate-mode`).

**Publishing** (agent / operator, before this script): `materialize_snapshot.py`, `publish_document.py`, and related validators — see [`docs/ops/SCRIPTS.md`](docs/ops/SCRIPTS.md).

## Backfill disk → Supabase (migration / recovery only)

If you have a **local** tree under `data/agent-cache/daily/` (gitignored), you can replay into Supabase:

1. **Markdown-era exports:** populate `data/agent-cache/daily/` (manually or by setting **`LEGACY_ROOT`** to a directory that contains `YYYY-MM-DD/` folders when you run the copy step), then materialize and refresh documents/metrics:
   - [`scripts/backfill-historical-daily-to-supabase.sh`](scripts/backfill-historical-daily-to-supabase.sh) — copies from **`LEGACY_ROOT`** unless **`SKIP_COPY=1`**, then runs [`scripts/backfill-db-first-digest.sh`](scripts/backfill-db-first-digest.sh), then `update_tearsheet.py`.
   - Override **`BASELINE_DATE`**, **`LAST_DATE`**, or use **`SKIP_COPY=1`** if `data/agent-cache/daily/` is already populated.
2. **Requires** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (e.g. `config/supabase.env`).
3. Afterward: `python3 scripts/validate_db_first.py --mode full`.

**Note:** `delta-request.json` is applied to the **previous calendar day’s** row in `daily_snapshots` (`--baseline-date`); ops must match that chain. Stub `snapshot.json` files are ignored when a rich `delta-request.json` exists (see backfill script).

**Retrofit markdown deltas:** Copy `DIGEST-DELTA.md` into `data/agent-cache/daily/<date>/`, then generate colocated `delta-request.json` with:

`python3 scripts/retrofit_delta_requests.py`

Re-run with `--force` to overwrite. Uses [`scripts/legacy_delta_to_ops.py`](scripts/legacy_delta_to_ops.py) (regex + narrative/sector pointer fixes). To copy from an external daily export into `data/agent-cache/daily/` first, set **`LEGACY_ROOT`** when running [`scripts/backfill-historical-daily-to-supabase.sh`](scripts/backfill-historical-daily-to-supabase.sh).

## DB validation modes ([`validate_db_first.py`](scripts/validate_db_first.py))

- **`full` (default):** `daily_snapshots` + `documents.digest` + positions sanity + `nav_history` / `portfolio_metrics` non-empty.
- **`research`:** `daily_snapshots` + **`digest` or `research_delta`** document with payload; positions zero-weight rule skipped; nav/metrics tables still non-empty.
- **`pm`:** `full` plus a `rebalance_decision` document for `date` (portfolio layer present).

**No-change days:** Prefer a **delta request** with empty `ops` (see [`templates/delta-request-schema.json`](templates/delta-request-schema.json)) and materialize as usual, **or** set `"no_change": true` on the digest snapshot (see [`templates/digest-snapshot-schema.json`](templates/digest-snapshot-schema.json)) after materialization so the day is still indexed in `daily_snapshots`.

