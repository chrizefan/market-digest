# Manual Run — Operator Steps (DB-first)

See also [`cowork/PROJECT.md`](../PROJECT.md) and [`RUNBOOK.md`](../../RUNBOOK.md).

## 1) Ensure environment
- `pip install -r requirements.txt`
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set (service role)

## 2) Run the pipeline entrypoint

```bash
python3 scripts/run_db_first.py
```

## 3) If it fails
- Re-run with `--dry-run` to see required inputs.
- Check Supabase credentials and connectivity.
- Re-run validation step printed by the CLI.

