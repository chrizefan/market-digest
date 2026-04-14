# Scripts reference

Operator truth for **when to run what** remains [`RUNBOOK.md`](../../RUNBOOK.md). This page groups Python and shell scripts by role.

## DB-first publish and validation

| Script | Role |
|--------|------|
| [`scripts/verify-supabase-migrations.sh`](../../scripts/verify-supabase-migrations.sh) | CI/local: `supabase/config.toml` exists, `supabase/migrations/*.sql` naming and numeric order |
| [`scripts/run_db_first.py`](../../scripts/run_db_first.py) | After publish: validate optional `data/agent-cache/daily/<date>/**/*.json` → **`refresh_performance_metrics.py`** → `execute_at_open.py` (unless `--skip-execute`) → **`validate_db_first.py`** |
| [`scripts/validate_db_first.py`](../../scripts/validate_db_first.py) | Supabase row checks (`--mode full\|research\|pm`) |
| [`scripts/validate_pipeline_step.py`](../../scripts/validate_pipeline_step.py) | After each pipeline step: `--step` or `--chain research\|track_b\|full` + `--date`; validates row presence + JSON Schema for thesis/deliberation/rebalance artifacts |
| [`scripts/verify_supabase_canonical.py`](../../scripts/verify_supabase_canonical.py) | Read-only: no `documents.document_key` containing legacy `outputs/`; optional `--date` requires `daily_snapshots` row |
| [`scripts/validate_artifact.py`](../../scripts/validate_artifact.py) | JSON schema validation (snapshot, delta-request, `doc_type` payloads) |
| [`scripts/materialize_snapshot.py`](../../scripts/materialize_snapshot.py) | Apply delta / upsert `daily_snapshots` + digest document |
| [`scripts/fold_document_deltas.py`](../../scripts/fold_document_deltas.py) | Fold `document_delta` rows for a date → materialized research JSON + optional `research-changelog/{{DATE}}.json` |
| [`scripts/publish_document.py`](../../scripts/publish_document.py) | Upsert one `documents` row from JSON file path or **`--payload -`** (stdin) |
| [`scripts/update_tearsheet.py`](../../scripts/update_tearsheet.py) | **Recovery / migration:** rescan `data/agent-cache/daily/` (markdown + JSON when present) → refresh Supabase documents / metrics / optional dashboard JSON |
| [`scripts/execute_at_open.py`](../../scripts/execute_at_open.py) | `position_events` from rebalance + `price_history.open` |
| [`scripts/backfill_execution_prices.py`](../../scripts/backfill_execution_prices.py) | Fill null execution prices after opens exist |

## Market data and metrics

| Script | Role |
|--------|------|
| [`scripts/preload-history.py`](../../scripts/preload-history.py) | OHLCV → local cache and/or Supabase; **`--supabase --supabase-sync`** for daily gap-fill + new-ticker full history (`--new-ticker-period`, default `max`); legacy **`--period` / `--refresh`** for ad-hoc local runs |
| [`scripts/compute-technicals.py`](../../scripts/compute-technicals.py) | TA rows in `price_technicals` |
| [`scripts/refresh_performance_metrics.py`](../../scripts/refresh_performance_metrics.py) | Post-close: `positions` metrics, `nav_history`, `portfolio_metrics`; `--fill-calendar-through` carries snapshots forward per calendar day |
| [`scripts/ingest_fred.py`](../../scripts/ingest_fred.py) | FRED → `macro_series_observations`; **`--supabase`** incremental by default, **`--backfill`** full history from YAML |
| [`scripts/ingest_fx_frankfurter.py`](../../scripts/ingest_fx_frankfurter.py) | Frankfurter FX → same table; **`--supabase`**, **`--backfill`** year-chunk history |
| [`scripts/ingest_crypto_fng.py`](../../scripts/ingest_crypto_fng.py) | Crypto Fear & Greed → same table; **`--supabase`**, **`--backfill`** uses YAML `backfill_limit` |
| [`scripts/ingest_treasury_curve.py`](../../scripts/ingest_treasury_curve.py) | Treasury XML (`us_treasury`) + Yahoo ^IRX/^FVX/^TNX/^TYX (`treasury_market`); **`--backfill`** uses Yahoo **`max`** and skips the slow XML month crawl (often empty from cloud); **`--xml-months N`** to force official XML |
| [`scripts/fetch-quotes.py`](../../scripts/fetch-quotes.py), [`scripts/fetch-macro.py`](../../scripts/fetch-macro.py), [`scripts/fetch-market-data.sh`](../../scripts/fetch-market-data.sh) | Local/agent cache |

## Portfolio helpers

| Script | Role |
|--------|------|
| [`scripts/generate-snapshot.py`](../../scripts/generate-snapshot.py) | Build `snapshot.json` sidecars from legacy markdown (when needed) |
| [`scripts/fill-entry-prices.py`](../../scripts/fill-entry-prices.py) | Backfill entry prices from `price_history` |
| [`scripts/validate-portfolio.sh`](../../scripts/validate-portfolio.sh) | `portfolio.json` vs profile |
| [`scripts/repair_supabase_portfolio_data.py`](../../scripts/repair_supabase_portfolio_data.py) | One-off repairs |

## Historical backfill (simulated replay)

| Script | Role |
|--------|------|
| [`scripts/backfill_simulated_runs.py`](../../scripts/backfill_simulated_runs.py) | Orchestrate the 10-day Apr 5–14 historical backfill: `--dry-run` (plan), `--export-only` (backup), `--normalize-schemas` (patch Apr 5-11 schema), `--date D --prompt` (print agent prompt), `--validate-all` |
| [`scripts/backfill_export_state.py`](../../scripts/backfill_export_state.py) | Pre-backfill backup: exports `daily_snapshots`, `documents`, `positions` rows for a date range to `data/backfill-backup/` |
| [`scripts/backfill_normalize_schemas.py`](../../scripts/backfill_normalize_schemas.py) | Normalize schema violations in existing snapshots: `conviction`, `posture`, `sector_scorecard` (dict→array), `segment_biases` (string→biasObject) |
| [`scripts/backfill_context.py`](../../scripts/backfill_context.py) | Generate as-of-date research context from Supabase (prices, macro, prior snapshot) with strict `<= DATE` filtering; `--print-prompt` outputs full agent prompt |

## Migration / legacy (keep; use rarely)

| Script | Role |
|--------|------|
| [`scripts/convert_snapshot_v1.py`](../../scripts/convert_snapshot_v1.py) | Older snapshot shape → digest schema |
| [`scripts/legacy_delta_to_ops.py`](../../scripts/legacy_delta_to_ops.py) | `DIGEST-DELTA.md` → `delta-request.json` (schema-aligned ops) |
| [`scripts/retrofit_delta_requests.py`](../../scripts/retrofit_delta_requests.py) | Batch: discover `DIGEST-DELTA.md` under `data/agent-cache/daily/` → write colocated `delta-request.json` |
| [`scripts/migrate_md_outputs_to_json.py`](../../scripts/migrate_md_outputs_to_json.py) | Markdown → JSON artifacts |
| [`scripts/backfill-db-first-digest.sh`](../../scripts/backfill-db-first-digest.sh) | Chains conversion + materialize for backfills (rich `snapshot.json`, else `delta-request.json`, else `DIGEST-DELTA.md`) |
| [`scripts/backfill-historical-daily-to-supabase.sh`](../../scripts/backfill-historical-daily-to-supabase.sh) | Copy from **`LEGACY_ROOT`** (required unless `SKIP_COPY=1`) into `data/agent-cache/daily/`, run digest backfill for a date range, then `update_tearsheet.py` |

## Operator shell

[`scripts/new-day.sh`](../../scripts/new-day.sh) (wrapper → `run_db_first.py`), [`scripts/status.sh`](../../scripts/status.sh), [`scripts/git-commit.sh`](../../scripts/git-commit.sh) (config/memory; scratch under `data/agent-cache/` stays gitignored), [`scripts/weekly-rollup.sh`](../../scripts/weekly-rollup.sh) / [`scripts/monthly-rollup.sh`](../../scripts/monthly-rollup.sh) (Supabase JSON prompts), [`scripts/smoke-test.sh`](../../scripts/smoke-test.sh) — see `--help` where supported. Invoke [`scripts/validate_db_first.py`](../../scripts/validate_db_first.py) directly or via `run_db_first.py`.

## Co-work prompts

- [`scripts/cowork-daily-prompt.txt`](../../scripts/cowork-daily-prompt.txt) — Track B (combined / portfolio)
- [`scripts/cowork-research-prompt.txt`](../../scripts/cowork-research-prompt.txt) — Track A (blind research)
