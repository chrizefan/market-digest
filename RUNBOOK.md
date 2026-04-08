# RUNBOOK — digiquant-atlas (DB-first, JSON-first)

This is the **single authoritative** run instruction for digiquant-atlas.

## Canonical principles
- **Supabase is the source of truth** for daily snapshots, documents, positions, theses, NAV, and metrics.
- **JSON artifacts are canonical**. Markdown is always **derived** for display.
- **Daily scheduled run** performs research → publishes structured artifacts → validates DB state → records position events as executed at **market open (Mon–Fri)**.
- **Legacy filesystem outputs** are kept only as an archive under `archive/legacy-outputs/`.

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

### Weekly/monthly rollups (JSON-on-disk + published)
- Weekly: `outputs/weekly/YYYY-Wnn.json` (`templates/schemas/weekly-digest.schema.json`)
- Monthly: `outputs/monthly/YYYY-MM.json` (`templates/schemas/monthly-digest.schema.json`)

### Deep dives (JSON-first)
- Author `outputs/deep-dives/*.json` with `doc_type: deep_dive` (`templates/schemas/deep-dive.schema.json`).
- Scaffold: `./scripts/scaffold_deep_dive.sh YYYY-MM-DD "Title Slug"`
- `update_tearsheet.py` ingests JSON and derives markdown for display; Supabase stores the payload.

### Evolution post-mortem (JSON-first)
- `outputs/evolution/YYYY-MM-DD/{sources,quality-log,proposals}.json` — schemas under `templates/schemas/evolution-*.schema.json`.
- Scaffold: `./scripts/scaffold_evolution_day.sh [YYYY-MM-DD]`

## Publish steps (what the entrypoint does)
The entrypoint coordinates:
1. Determine run type (baseline vs delta) + baseline anchor date (from Supabase).
2. Validate JSON artifacts using `scripts/validate_artifact.py`.
3. Publish daily snapshot via `scripts/materialize_snapshot.py`.
4. Publish other artifacts via `scripts/publish_document.py`.
5. Refresh NAV/metrics via `scripts/update_tearsheet.py` (and/or `scripts/refresh_performance_metrics.py`).
6. Record “market-open execution” into `position_events` using `price_history.open` and the latest rebalance decision.
7. Validate DB state and exit non-zero if missing.

## DB validation (must pass)
- `daily_snapshots` has a row for `date`.
- `documents` includes at least the digest document for `date` and all published artifacts have non-null `payload`.
- `positions` for `date` does not include zero-weight non-CASH tickers.
- `nav_history` and `portfolio_metrics` updated for latest available trading day.

