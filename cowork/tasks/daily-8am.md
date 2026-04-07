# Task — Daily 8am Pre-market Run (DB-first)

## Goal
Research the market, update thesis state, and maintain the portfolio recommendation in Supabase so the web dashboard is current.

## Canonical reference
Read: `RUNBOOK.md`

## Execute
Run:

```bash
python3 scripts/run_db_first.py
```

This command must:
- Determine baseline vs delta mode
- Validate schemas for any produced artifacts
- Publish snapshot + documents to Supabase
- Refresh NAV/metrics
- Record execution assumptions at market open into `position_events`
- Exit non-zero on failed validation

