# digiquant-atlas — System Scorecard & Improvement Plan

> **Scored**: April 6, 2026 (updated end of day — session 2).
> Covers all layers: shell scripts (18), Python ETL (6), frontend (14 files, Next.js 15), Supabase (3 migrations), config (7), skill files (43), templates (13).

---

## Overall Score: 7.5 / 10 — Robust, Production-Ready

The system completes its three-tier cadence (baseline / delta / synthesis) reliably and produces correct output. The April 6 session (session 1) delivered a **full Vite → Next.js migration**, moved the data layer to **Supabase-first**, and hardened the commit pipeline. Session 2 implemented all 10 high/medium-priority open issues: React error boundary, retry logic, atomic writes, tar verification, race guard, XML validation, and more. Key remaining weaknesses are the **fragile regex parsing** in ETL (architectural) and missing **partition strategy** for Supabase tables at scale.

---

## Category Scores

| Category | Files | Score | Key Strength | Key Weakness |
|----------|-------|-------|-------------|-------------|
| **Shell Scripts** | 18 | 7/10 | macOS portability; tar verification; atomic mkdir | Cross-platform `sed` not addressed; no `--help` flags |
| **Python ETL** | 6 | 7/10 | Atomic writes; stderr error reporting; XML validation | Regex parsing still brittle (no JSON sidecar yet) |
| **Frontend** | 14 | 8/10 | Error boundary; retry logic; bounded queries; env vars | No PropTypes / TypeScript |
| **Supabase** | 3 | 8/10 | 11 composite indexes; audit columns + triggers; RLS | No partition strategy; migrations lack inline comments |
| **Config** | 7 | 7/10 | Well-documented; portfolio validation in commit pipeline | Entry prices often null; no runtime config-delta validation |
| **Skill Files** | 43 | 8/10 | Thorough, composable, platform-agnostic; MCP tool refs | No compile-time frontmatter checks; minor sector drift |
| **Templates** | 13 | 9/10 | Consistent, complete | Minor placeholder naming inconsistency |

---

## Fix History (April 6, 2026)

**Session 1** — Vite → Next.js migration, Supabase-first data layer, composite indexes, `publish-update.sh`, `git-commit.sh` push, performance page redesign, MCP tool wiring.

**Session 2** — Supabase env vars, React error boundary, `querySupabase()` retry (3× exponential backoff), `.limit(500)` on documents query, atomic CSV writes (`preload-history.py`, `fetch-quotes.py`), `tar -tzf` verification in `archive.sh`, atomic `mkdir` in `new-day.sh`, hard `exit 1` in `materialize.sh` on missing baseline, `validate-phase.sh` hard-fail on malformed `_meta.json`, Treasury XML required-key validation, stderr ticker error logging, `status.sh` python3 subprocess deduplication.

---

---

## Open Issues

### HIGH — #3: Fragile regex parsing in Python ETL
**Layer**: ETL | **Effort**: 2 hrs
- `generate-snapshot.py` and `update_tearsheet.py` extract regime, positions, theses, and market data via regex from DIGEST.md
- Any Markdown formatting change (emoji, dashes, emphasis, column reorder) silently returns empty data
- **Fix**: Emit a `snapshot.json` sidecar during DIGEST generation; consume JSON instead of reparsing Markdown
- **Note**: Architectural change — deferred

### MEDIUM / LOW

| # | Improvement | Effort | Why |
|---|------------|--------|-----|
| 13 | **Cross-platform `sed`** — use `sed -i.bak` + `rm .bak` pattern | 1 hr | Current `sed -i ""` works on macOS only |
| 15 | **Add `--help` flags to all scripts** | 1 hr | Some scripts (run-segment.sh, new-week.sh) have no usage text |
| 16 | **PropTypes / TypeScript on React components** | 1–2 hrs | 14 frontend files have zero type validation |
| 17 | **Supabase migration inline comments** | 30 min | Migrations lack context for future maintainers |
| 18 | **Partition strategy for Supabase tables** | 2 hrs | As data grows (1K+ daily snapshots), full table scans will slow |

---

## Score History & Projection

| Category | Initial (Apr 6 AM) | Session 1 (Apr 6 PM) | Session 2 (Apr 6 Eve) |
|----------|--------------------|--------------------|--------------------|
| Shell Scripts | 5/10 | 6/10 | 7/10 |
| Python ETL | 4/10 | 5/10 | 7/10 |
| Frontend | 5/10 | 6/10 | 8/10 |
| Supabase | 7/10 | 8/10 | 8/10 |
| Config | 6/10 | 7/10 | 7/10 |
| Skill Files | 8/10 | 8/10 | 8/10 |
| Templates | 9/10 | 9/10 | 9/10 |
| **Overall** | **5.5/10** | **6.5/10** | **7.5/10** |

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Total shell scripts | 18 |
| Total Python scripts | 6 |
| Frontend files (app + components + lib) | 14 |
| Supabase migrations | 3 (7 tables, 11 composite indexes) |
| Skill files | 43 (26 core + 11 sector + 4 alt-data + 2 institutional) |
| Templates | 13 |
| Config files | 7 |
| Frontend framework | Next.js 15.3.2, React 19, Tailwind 4.1.7, Recharts 2.15 |
| Data layer | Supabase-first (no static JSON fallback) |
| Deployment | GitHub Pages via static export (`output: 'export'`) |

---

*Next review: After addressing regex parsing (#3) and partition strategy (#18) — the two remaining architectural items.*
