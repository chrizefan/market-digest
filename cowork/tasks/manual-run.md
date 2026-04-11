# Task: Manual operator run

**Before anything else:** read [`../PROJECT.md`](../PROJECT.md).

## Steps

1. `pip install -r requirements.txt`; `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
2. Produce or fix artifacts per your goal, then:

   ```bash
   python3 scripts/run_db_first.py
   ```

   Use `--dry-run`, `--skip-execute`, `--validate-mode`, `--date` as needed ([`RUNBOOK.md`](../../RUNBOOK.md)).

3. On failure: check credentials, re-run validation command printed by the CLI.
