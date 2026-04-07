# Cowork Project Context — digiquant-atlas

This project is **DB-first** and **JSON-first**.

- Canonical run instructions: `RUNBOOK.md`
- Canonical daily artifact: `templates/digest-snapshot-schema.json`
- Canonical recurring artifact schemas: `templates/schemas/*.schema.json`
- Supabase is the source of truth; markdown is derived for UI display.

Your scheduled task should run:

```bash
python3 scripts/run_db_first.py
```

