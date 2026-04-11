# RUNBOOK — digiquant-atlas (DB-first, JSON-first)

This is the **single authoritative** run instruction for digiquant-atlas.

## Schedules: GitHub Actions vs Co-work

| Layer | When | What runs | Supabase impact |
|--------|------|-----------|-----------------|
| **GitHub — Daily Price Update** | Weekdays **22:00 UTC** (documented as ~**6:00 PM US Eastern** after NYSE close; exact local offset follows DST) | [`preload-history.py --incremental-supabase`](scripts/preload-history.py) → [`compute-technicals.py`](scripts/compute-technicals.py) → [`refresh_performance_metrics.py --fill-calendar-through`](scripts/refresh_performance_metrics.py) | `price_history` (Yahoo **since last DB row** + overlap), `price_technicals`, dense **`positions`** / **`nav_history`** / **`portfolio_metrics`** — **no** digest, no agent research |
| **Co-work / operator — research & portfolio** | Typically **pre-market** (e.g. 8:00 AM local) or per [`config/schedule.json`](config/schedule.json) | Agent produces JSON → [`run_db_first.py`](scripts/run_db_first.py) → [`update_tearsheet.py`](scripts/update_tearsheet.py) → [`execute_at_open.py`](scripts/execute_at_open.py) (optional) → [`validate_db_first.py`](scripts/validate_db_first.py) | `daily_snapshots`, `documents`, `positions`, `theses`, `position_events`, etc. |

### Daily portfolio continuity (post-close)

The weekday GitHub job runs [`refresh_performance_metrics.py --fill-calendar-through`](scripts/refresh_performance_metrics.py) to **today (UTC)** so you get a **dense calendar** in Supabase even when no digest ran:

1. Refreshes performance columns on the **latest** existing `positions` date (same weights; closes from `price_history`).
2. For each **calendar day** after that through the target date: if `positions` has no rows for that date, **clones** the prior day (carry-forward), then updates per-position metrics, `nav_history`, and **`portfolio_metrics`** with `computed_from='refresh_script'`.
3. **Does not overwrite** `portfolio_metrics` rows written by `update_tearsheet.py` (`computed_from='tearsheet'`). Sharpe / vol / drawdown / alpha on script-written days are **carried forward** from the previous metrics row until the next tearsheet recompute.

**Manual backfill** (e.g. fill gaps after prices exist):  
`python3 scripts/refresh_performance_metrics.py --supabase --fill-calendar-through YYYY-MM-DD`

**Limitation:** `--fill-calendar-through` advances from the **latest** `positions` snapshot date forward only; it does not scan for **holes** on earlier dates. For a missing day *before* your latest snapshot, run once with `--date YYYY-MM-DD` (after `price_history` has that day).

**GitHub — manual “Daily Price Update”:** By default (checkbox **full history** off) the job matches the weekday cron: **`--incremental-supabase`** — Yahoo fetches only from `(latest price_history date per ticker) − overlap` (see script), merges with Supabase for a full local series for TA, and upserts the **recent Yahoo window** only. For a **one-time full backfill** (or after adding many tickers), run the workflow with **full history** checked and **period** `max` (or `5y`). **Ticker** optional: scope either mode to one symbol. **New ticker** with no `price_history` rows yet: incremental mode uses `--period` from the script (default **2y**); use **full history** or `python3 scripts/preload-history.py --supabase --period max` once if you need full depth.

**Claude Cowork:** project briefing and scheduled task recipes live under [`cowork/`](cowork/) — see [`cowork/README.md`](cowork/README.md) and paste [`cowork/PROJECT-PROMPT.md`](cowork/PROJECT-PROMPT.md) into the Cowork project instructions. **First-time setup:** [`cowork/SETUP-ATLAS-COWORK.md`](cowork/SETUP-ATLAS-COWORK.md) (agent-driven wizard → `cowork/OPERATOR-COWORK.md` + `config/schedule.json` → `cowork_operator`).

**Weekly baseline vs weekly file check:** [`scripts/run_db_first.py`](scripts/run_db_first.py) treats **Sunday** as **baseline** and other days as **delta** (unless `--baseline` / `--delta`). That is independent of [`.github/workflows/weekly-check.yml`](.github/workflows/weekly-check.yml), which only reminds you to create a **filesystem** weekly artifact under `outputs/weekly/` on **Fridays (16:00 UTC)** — it does **not** publish to Supabase.

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
- **JSON payloads are canonical**. Markdown is always **derived** for display. Agents should **`validate_artifact.py -`** and **`publish_document.py --payload -`** (stdin) so hosted runs do not depend on repo `outputs/` paths; that directory is **gitignored**.
- **Daily operator run** publishes structured artifacts → validates DB state → optionally records position events as executed at **market open (Mon–Fri)** (see backfill above).
- **Legacy markdown-era trees** are not shipped in git; optional local copies under `archive/legacy-outputs/` for backfill only (see `archive/legacy-outputs/README.md`).

## Environment requirements
1. Python 3.11+ recommended.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Supabase credentials (service role required for publishing):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Recommended: store in `config/supabase.env` (loaded by publisher scripts).

**Script index (grouped by role):** [`docs/ops/SCRIPTS.md`](docs/ops/SCRIPTS.md)

## One command entrypoint (the only supported start)
For both manual and scheduled runs:

```bash
python3 scripts/run_db_first.py
```

Common flags:
- `--date YYYY-MM-DD`
- `--baseline` (force baseline mode)
- `--delta` (force delta mode)
- `--dry-run` (print what would happen; no writes)
- `--skip-execute` (skip `execute_at_open.py` — use after **Track A** research-only runs)
- `--validate-mode {full,research,pm}` (passed to [`validate_db_first.py`](scripts/validate_db_first.py); default `full`)

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

## Publish steps (what the entrypoint does)
The entrypoint coordinates:
1. Determine run type (baseline vs delta) + baseline anchor date (from Supabase).
2. Validate JSON artifacts using `scripts/validate_artifact.py`.
3. Publish daily snapshot via `scripts/materialize_snapshot.py`.
4. Publish other artifacts via `scripts/publish_document.py`.
5. Refresh NAV/metrics via `scripts/update_tearsheet.py` (and/or `scripts/refresh_performance_metrics.py`).
6. Record “market-open execution” into `position_events` using `price_history.open` and the latest rebalance decision.
7. Validate DB state (`validate_db_first.py --mode full|research|pm`) and exit non-zero if missing.

## Backfill disk → Supabase (migration / recovery only)

If you have a **local** tree (not in git) under `outputs/daily/` or a copy of `archive/legacy-outputs/daily/`, you can replay into Supabase:

1. **Legacy markdown era:** copy trees into a writable `outputs/daily/` on your machine, then materialize and refresh documents/metrics:
   - [`scripts/backfill-historical-daily-to-supabase.sh`](scripts/backfill-historical-daily-to-supabase.sh) — run [`scripts/backfill-db-first-digest.sh`](scripts/backfill-db-first-digest.sh), then `update_tearsheet.py`.
   - Override with `LEGACY_ROOT`, `BASELINE_DATE`, `LAST_DATE`, or `SKIP_COPY=1` if `outputs/daily/` is already populated locally.
2. **Requires** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (e.g. `config/supabase.env`).
3. Afterward: `python3 scripts/validate_db_first.py --validate-mode full`.

**Note:** `delta-request.json` is applied to the **previous calendar day’s** row in `daily_snapshots` (`--baseline-date`); ops must match that chain. Stub `snapshot.json` files are ignored when a rich `delta-request.json` exists (see backfill script).

## DB validation modes ([`validate_db_first.py`](scripts/validate_db_first.py))

- **`full` (default):** `daily_snapshots` + `documents.digest` + positions sanity + `nav_history` / `portfolio_metrics` non-empty.
- **`research`:** `daily_snapshots` + **`digest` or `research_delta`** document with payload; positions zero-weight rule skipped; nav/metrics tables still non-empty.
- **`pm`:** `full` plus a `rebalance_decision` document for `date` (portfolio layer present).

**No-change days:** Prefer a **delta request** with empty `ops` (see [`templates/delta-request-schema.json`](templates/delta-request-schema.json)) and materialize as usual, **or** set `"no_change": true` on the digest snapshot (see [`templates/digest-snapshot-schema.json`](templates/digest-snapshot-schema.json)) after materialization so the day is still indexed in `daily_snapshots`.

