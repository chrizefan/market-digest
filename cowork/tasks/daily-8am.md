# Daily 8:00 AM (pre-market) — DB-first

## Objective

Run the research + publish pipeline so Supabase holds the latest digest snapshot, documents, positions, and metrics. Markdown is **derived** for the UI.

## Preconditions

- Repo cloned; working directory = repo root.
- `pip install -r requirements.txt` (once per environment).
- Export or load `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role).

## Steps

1. **Optional:** refresh local price/macro cache for agent research (network allowed in your environment):

   ```bash
   ./scripts/fetch-market-data.sh
   ```

2. **Run the single entrypoint:**

   ```bash
   python3 scripts/run_db_first.py
   ```

   Follow any instructions printed (baseline vs delta, artifact paths). The script validates JSON artifacts if present, runs ETL (`update_tearsheet.py`), `execute_at_open.py`, and `validate_db_first.py`.

3. **Check status:**

   ```bash
   ./scripts/status.sh
   ```

4. **Optional post-mortem:** record quality / proposals as JSON (not free-form spam):

   ```bash
   ./scripts/scaffold_evolution_day.sh
   ```

   Edit `outputs/evolution/$(date +%Y-%m-%d)/quality-log.json` (and siblings), then re-run tearsheet or publish as you do for other documents.

## Failure handling

- If validation fails, fix the published snapshot or documents in Supabase / artifacts, then re-run `python3 scripts/validate_db_first.py --date YYYY-MM-DD`.
- Do **not** reintroduce canonical `outputs/daily/` markdown runs; legacy samples live under `archive/legacy-outputs/daily/`.

## Canonical references

- [`RUNBOOK.md`](../../RUNBOOK.md)
- [`cowork/PROJECT.md`](../PROJECT.md)
