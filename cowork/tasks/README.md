# Cowork tasks — what to attach to each scheduled job

**New to Cowork + Atlas?** In chat, ask the agent to **set up Atlas in Cowork** — it should run [`../SETUP-ATLAS-COWORK.md`](../SETUP-ATLAS-COWORK.md) and produce `cowork/OPERATOR-COWORK.md` with copy-paste task bodies.

Each **scheduled task** in Claude Cowork should:

1. Point the workspace at **this repo** (root = project root).
2. Set the task instructions to: **read `cowork/PROJECT.md`, then perform this task file verbatim** (paste or reference the path below).

## Supabase-first writes

- **Reads:** Supabase MCP (or SQL) is appropriate for live prices, snapshots, and `documents` when analyzing state.
- **Writes:** Publish JSON artifacts with **`scripts/publish_document.py`** or batch paths in **`scripts/update_tearsheet.py`** — not raw MCP SQL for large payloads. These scripts use `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
- **No committed `data/agent-cache/`:** The repo ignores generated trees under `data/agent-cache/`; **canonical payloads live in Supabase**. Validate with `python3 scripts/validate_artifact.py -` and publish with `python3 scripts/publish_document.py --payload -` (stdin). A run is **not complete** until **`documents`** holds the payload; confirm with `python3 scripts/validate_db_first.py --mode research` (Track A) or equivalent checks after monthly publish.

In **Cloud desktop**, with **Supabase MCP** connected, use the DB for prices/technicals/portfolio state when researching; other MCPs (FRED, CoinGecko, etc.) are optional enrichments — see `cowork/PROJECT.md` → “MCP toolkit”.

## Modular tasks (pick one file per job, unless using the router)

| Task file | Use when |
|-----------|----------|
| [`recurring-scheduled-run.md`](recurring-scheduled-run.md) | **Single recurring job** (e.g. every 8h/12h): branches by month-end / Sunday vs weekday, runs research module(s) then **portfolio**. |
| [`research-weekly-baseline.md`](research-weekly-baseline.md) | **Track A** — weekly anchor / Sunday-style **baseline** research (`research_delta`, full scope). |
| [`research-daily-delta.md`](research-daily-delta.md) | **Track A** — **delta** research for high-frequency or Mon–Sat slots (unique `research-delta/…` key per publish). |
| [`research-monthly-synthesis.md`](research-monthly-synthesis.md) | **Month-end** — `monthly_digest` JSON → validate → `publish_document.py`. |
| [`portfolio-pm-rebalance.md`](portfolio-pm-rebalance.md) | **Track B** — digest pipeline + PM, analyst, screener, **`rebalance_decision`** (after research exists for the date). |
| [`research-document-deltas.md`](research-document-deltas.md) | **Track B** — manifest-driven **`document_delta`** publish + **`fold_document_deltas.py`** (optional separate job). |
| [`manual-run.md`](manual-run.md) | Ad-hoc operator run; minimal steps. |

**Project-level prompt:** paste contents of [`../PROJECT-PROMPT.md`](../PROJECT-PROMPT.md) into Cowork **project** settings so every task inherits the same ground rules.

### Example: one recurring Cowork task

```
Workspace root = this repository.

1. Read cowork/PROJECT.md in full.
2. Read and execute cowork/tasks/recurring-scheduled-run.md in full.
3. For anything not specified there, follow RUNBOOK.md and AGENTS.md at repo root.
```

### Example: separate Cowork tasks (no router)

Point each schedule at exactly one of: `research-daily-delta.md`, `research-weekly-baseline.md`, `research-monthly-synthesis.md`, `portfolio-pm-rebalance.md`, `research-document-deltas.md` (or merge Phase 6 into the portfolio/digest job).
