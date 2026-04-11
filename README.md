# digiquant-atlas

Daily market intelligence with an AI-orchestrated pipeline. **Canonical state is DB-first (Supabase)**; JSON artifacts are the source of truth and markdown is derived.

## Start here

| Doc | Purpose |
|-----|---------|
| **[RUNBOOK.md](RUNBOOK.md)** | **Authoritative** operator steps (env, publish, validate) |
| [AGENTS.md](AGENTS.md) | Agent behavior + `python3 scripts/run_db_first.py` |
| [docs/agentic/WORKFLOWS.md](docs/agentic/WORKFLOWS.md) | Procedures (baseline, delta, rollups) |
| [docs/agentic/PLATFORMS.md](docs/agentic/PLATFORMS.md) | IDE / platform setup |
| [cowork/](cowork/) | **Claude Cowork:** start at [`cowork/README.md`](cowork/README.md); paste [`cowork/PROJECT-PROMPT.md`](cowork/PROJECT-PROMPT.md) into project settings; tasks in [`cowork/tasks/`](cowork/tasks/) |

## One command

```bash
python3 scripts/run_db_first.py
```

## Repository layout (high level)

```
config/           Runtime inputs: watchlist, portfolio, investment profile
skills/<slug>/    Instruction packages (orchestrator, macro, sector-*, …)
templates/schemas/JSON schemas for artifacts
scripts/          Automation (run_db_first.py, materialize_snapshot.py, …)
data/agent-cache/ Optional local scratch (gitignored except `.gitkeep`); **Supabase** is canonical — see [RUNBOOK.md](RUNBOOK.md)
archive/          `legacy-scripts/` (retired markdown-era reference only)
memory/           Append-only ROLLING.md research logs
docs/research/    Curated research doctrine (see skills/research-library)
frontend/         Next.js dashboard
supabase/         SQL migrations
```

## Skills

Skills live in **`skills/<skill-slug>/SKILL.md`**. Load **only** the skill for the phase you are running (see `skills/orchestrator/SKILL.md`).

## Scripts (common)

```bash
python3 scripts/run_db_first.py   # DB-first entry
./scripts/new-day.sh               # Print baseline/delta prompt for Claude
./scripts/status.sh                # Supabase validation
./scripts/weekly-rollup.sh         # Weekly JSON scaffold + prompt
./scripts/monthly-rollup.sh       # Monthly JSON scaffold + prompt
./scripts/scaffold_evolution_day.sh  # Post-mortem JSON scaffolds
./scripts/git-commit.sh            # Commit (runs ETL)
```

## Documentation index

| File | Contents |
|------|----------|
| `CLAUDE.md` | Claude Code quick commands |
| `CLAUDE_PROJECT_INSTRUCTIONS.md` | Claude.ai Projects: pointers only (paste `cowork/PROJECT-PROMPT.md`) |
| `docs/agentic/ARCHITECTURE.md` | System design (primary) |
| `docs/archive/ARCHITECTURE-REVIEW.md` | Extended reference (inventory, frontend, deploy) |
| `docs/agentic/MEMORY-SYSTEM.md` | Memory format |
| `docs/agentic/SKILLS-CATALOG.md` | Skill index (keep short; filesystem is source of truth) |
| `docs/ops/SCRIPTS.md` | Script index (publish, data, migration) |
| `docs/ops/` | Sourcing / email ops (non-runtime reference) |

## Legacy / archive

- Stale paste docs: `docs/archive/`
- Retired filesystem scripts: `archive/legacy-scripts/`
