# outputs/ (not committed)

This directory is **ignored by git**. **Canonical artifacts live in Supabase** (`documents`, `daily_snapshots`, etc.). Hosted and Cowork runs should **not** depend on paths under `outputs/`.

## What to do instead

1. Build the JSON object in your session (or a temp buffer).
2. Validate: `python3 scripts/validate_artifact.py -` (pipe JSON on stdin) or pass a **local-only** scratch file if your environment requires it.
3. Publish: `python3 scripts/publish_document.py --payload - ...` (stdin) with the correct `--document-key`, `--title`, `--category`, `--doc-type-label`.

`.gitkeep` files exist so empty subfolders remain in the repo for scripts that still `mkdir -p` during migration or local backfills.

## Optional disk sync

`scripts/update_tearsheet.py` can still **read** `outputs/` when you intentionally mirror DB state to disk for local dashboards. That is **not** required for production publishing.
