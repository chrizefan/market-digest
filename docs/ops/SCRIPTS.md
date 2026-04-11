# Scripts reference

Operator truth for **when to run what** remains [`RUNBOOK.md`](../../RUNBOOK.md). This page groups Python and shell scripts by role.

## DB-first publish and validation

| Script | Role |
|--------|------|
| [`scripts/run_db_first.py`](../../scripts/run_db_first.py) | Entry: validate optional `outputs/daily/<date>/*.json` → **`refresh_performance_metrics.py`** (default) or `--legacy-markdown-tearsheet` → `update_tearsheet.py` → `execute_at_open.py` (optional) → `validate_db_first.py` |
| [`scripts/validate_db_first.py`](../../scripts/validate_db_first.py) | Supabase row checks (`--mode full\|research\|pm`) |
| [`scripts/validate_artifact.py`](../../scripts/validate_artifact.py) | JSON schema validation (snapshot, delta-request, `doc_type` payloads) |
| [`scripts/materialize_snapshot.py`](../../scripts/materialize_snapshot.py) | Apply delta / upsert `daily_snapshots` + digest document |
| [`scripts/publish_document.py`](../../scripts/publish_document.py) | Upsert one `documents` row from JSON file path or **`--payload -`** (stdin) |
| [`scripts/update_tearsheet.py`](../../scripts/update_tearsheet.py) | **Legacy:** scan `outputs/daily/*.md` (+ snapshot.json) → upsert Supabase / optional dashboard JSON |
| [`scripts/execute_at_open.py`](../../scripts/execute_at_open.py) | `position_events` from rebalance + `price_history.open` |
| [`scripts/backfill_execution_prices.py`](../../scripts/backfill_execution_prices.py) | Fill null execution prices after opens exist |

## Market data and metrics

| Script | Role |
|--------|------|
| [`scripts/preload-history.py`](../../scripts/preload-history.py) | OHLCV → local cache and/or Supabase; **`--incremental-supabase`** for daily Yahoo tail + merge; **`--period max`** (no incremental) for full backfill |
| [`scripts/compute-technicals.py`](../../scripts/compute-technicals.py) | TA rows in `price_technicals` |
| [`scripts/refresh_performance_metrics.py`](../../scripts/refresh_performance_metrics.py) | Post-close: `positions` metrics, `nav_history`, `portfolio_metrics`; `--fill-calendar-through` carries snapshots forward per calendar day |
| [`scripts/ingest_fred.py`](../../scripts/ingest_fred.py) | FRED → `macro_series_observations`; **`--supabase`** incremental by default, **`--backfill`** full history from YAML |
| [`scripts/ingest_fx_frankfurter.py`](../../scripts/ingest_fx_frankfurter.py) | Frankfurter FX → same table; **`--supabase`**, **`--backfill`** year-chunk history |
| [`scripts/ingest_crypto_fng.py`](../../scripts/ingest_crypto_fng.py) | Crypto Fear & Greed → same table; **`--supabase`**, **`--backfill`** uses YAML `backfill_limit` |
| [`scripts/ingest_treasury_curve.py`](../../scripts/ingest_treasury_curve.py) | Treasury XML (`us_treasury`) + Yahoo ^IRX/^FVX/^TNX/^TYX (`treasury_market`); **`--backfill`** long history |
| [`scripts/ingest_sec_recent_filings.py`](../../scripts/ingest_sec_recent_filings.py) | EDGAR recent filings for watchlist → `sec_recent_filings`; needs **`SEC_EDGAR_USER_AGENT`**; **`--days 14`** |
| [`scripts/fetch-quotes.py`](../../scripts/fetch-quotes.py), [`scripts/fetch-macro.py`](../../scripts/fetch-macro.py), [`scripts/fetch-market-data.sh`](../../scripts/fetch-market-data.sh) | Local/agent cache |

## Portfolio helpers

| Script | Role |
|--------|------|
| [`scripts/generate-snapshot.py`](../../scripts/generate-snapshot.py) | Build `snapshot.json` sidecars from legacy markdown (when needed) |
| [`scripts/fill-entry-prices.py`](../../scripts/fill-entry-prices.py) | Backfill entry prices from `price_history` |
| [`scripts/validate-portfolio.sh`](../../scripts/validate-portfolio.sh) | `portfolio.json` vs profile |
| [`scripts/repair_supabase_portfolio_data.py`](../../scripts/repair_supabase_portfolio_data.py) | One-off repairs |

## Migration / legacy (keep; use rarely)

| Script | Role |
|--------|------|
| [`scripts/convert_snapshot_v1.py`](../../scripts/convert_snapshot_v1.py) | Older snapshot shape → digest schema |
| [`scripts/legacy_delta_to_ops.py`](../../scripts/legacy_delta_to_ops.py) | `DIGEST-DELTA.md` → `delta-request.json` (schema-aligned ops) |
| [`scripts/retrofit_delta_requests.py`](../../scripts/retrofit_delta_requests.py) | Batch: discover `DIGEST-DELTA.md` → write `delta-request.json` (+ optional `outputs/daily/` mirror) |
| [`scripts/migrate_md_outputs_to_json.py`](../../scripts/migrate_md_outputs_to_json.py) | Markdown → JSON artifacts |
| [`scripts/backfill-db-first-digest.sh`](../../scripts/backfill-db-first-digest.sh) | Chains conversion + materialize for backfills (rich `snapshot.json`, else `delta-request.json`, else `DIGEST-DELTA.md`) |
| [`scripts/backfill-historical-daily-to-supabase.sh`](../../scripts/backfill-historical-daily-to-supabase.sh) | Copy `archive/legacy-outputs/daily/*` → `outputs/daily/`, run digest backfill for a date range, then `update_tearsheet.py` |

## Operator shell

[`scripts/new-day.sh`](../../scripts/new-day.sh) (wrapper → `run_db_first.py`), [`scripts/status.sh`](../../scripts/status.sh), [`scripts/git-commit.sh`](../../scripts/git-commit.sh) (config/memory — not `outputs/`), [`scripts/weekly-rollup.sh`](../../scripts/weekly-rollup.sh) / [`scripts/monthly-rollup.sh`](../../scripts/monthly-rollup.sh) (Supabase JSON prompts), [`scripts/validate-phase.sh`](../../scripts/validate-phase.sh) (legacy markdown checkpoints), [`scripts/smoke-test.sh`](../../scripts/smoke-test.sh) — see `--help` where supported.

## Co-work prompts

- [`scripts/cowork-daily-prompt.txt`](../../scripts/cowork-daily-prompt.txt) — Track B (combined / portfolio)
- [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt) — Track A (blind research)
