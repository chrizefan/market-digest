# Legacy scripts (filesystem-first, archived)

These Bash helpers printed prompts for a **markdown-in-`data/agent-cache/daily/`** workflow. The repo is now **DB-first**: canonical state lives in Supabase; use structured JSON + `scripts/materialize_snapshot.py` / `python3 scripts/run_db_first.py`.

| Script | Former role |
|--------|-------------|
| `run-daily.sh` | Legacy daily entrypoint |
| `run-segment.sh` | Single-segment prompt printer |
| `combine-digest.sh` | Phase 7 synthesis prompt printer |
| `materialize.sh` | Delta → DIGEST.md prompt printer |
| `new-week.sh` | Force baseline folder on any day |
| `archive.sh` | Move old `data/agent-cache/daily` to tarballs (destructive) |
| `publish-update.sh` | Auto-commit + push helper |

Do not add these paths back to `scripts/`. If you need historical behavior, inspect files here or use git history.

**Current entrypoint:** `python3 scripts/run_db_first.py` (see [RUNBOOK.md](../../RUNBOOK.md)).
