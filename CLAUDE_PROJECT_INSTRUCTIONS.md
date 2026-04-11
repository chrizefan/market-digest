# digiquant-atlas — Claude.ai Project Instructions (stub)

**Paste into Claude Projects**: use `cowork/PROJECT-PROMPT.md` as the primary instruction block (it stays aligned with DB-first, Track A/B, and Co-work runs). For full operator context, also keep `cowork/PROJECT.md` in Knowledge or link the repo.

**Claude Cowork onboarding:** Ask the agent to run `cowork/SETUP-ATLAS-COWORK.md` — it interviews for cadence/schedule, updates `config/schedule.json` → `cowork_operator`, and writes `cowork/OPERATOR-COWORK.md` with paste-ready project + task instructions.

**Canonical references** (do not duplicate here):

| Topic | File |
|-------|------|
| Agent behavior, skills, memory | `AGENTS.md` |
| Schedules, ETL, validation, execute-at-open | `RUNBOOK.md` |
| Skill index (rename `name:` → update this catalog) | `docs/agentic/SKILLS-CATALOG.md` |
| Architecture, platforms | `docs/agentic/ARCHITECTURE.md`, `docs/agentic/PLATFORMS.md` |

**Historical copy** (long skill tables + file map): `docs/archive/CLAUDE_PROJECT_INSTRUCTIONS-full.md`

---

## Minimal reminders for Claude Projects

1. Session type: full digest, Track A (research-delta), Track B (portfolio), segment, thesis, or rollup — see `RUNBOOK.md`.
2. Start-of-session reads: `config/watchlist.md`, `docs/ops/data-sources.md`; add `config/investment-profile.md` for Track B.
3. Prior state: Supabase or `outputs/daily/[date]/snapshot.json` — not legacy `DIGEST.md` except in archive.
4. Current prices and news: use live search / MCP per `AGENTS.md` and `skills/mcp-data-fetch/SKILL.md`; do not rely on model cutoff for markets.
5. After digest: JSON artifacts + `RUNBOOK.md` publish path (`materialize_snapshot`, `run_db_first.py`).
