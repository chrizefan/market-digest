# digiquant-atlas — System Scorecard & Improvement Plan

> **Scored**: April 6, 2026 (updated end of day — session 3).
> Covers all layers: shell scripts (18), Python ETL (6), frontend (14 files, Next.js 15), Supabase (4 migrations), config (7), skill files (43), templates (13).

---

## Overall Score: 8.5 / 10 — Robust, Production-Ready

The system completes its three-tier cadence (baseline / delta / synthesis) reliably and produces correct output. The April 6 session (session 1) delivered a **full Vite → Next.js migration**, moved the data layer to **Supabase-first**, and hardened the commit pipeline. Session 2 implemented all 10 high/medium-priority open issues: React error boundary, retry logic, atomic writes, tar verification, race guard, XML validation, and more. Session 3 closed all remaining open issues: cross-platform `sed`, `--help` flags, PropTypes, migration comments, partition strategy, and ETL regex hardening.

---

## Category Scores

| Category | Files | Score | Key Strength | Key Weakness |
|----------|-------|-------|-------------|-------------|
| **Shell Scripts** | 18 | 8/10 | Cross-platform `sedi()`; `--help` on all 18 scripts; tar verification | No automated smoke-test suite |
| **Python ETL** | 6 | 8/10 | Sidecar-first (skip regex when snapshot.json populated); hardened regex; `--validate`/`--force` flags | No unit tests for regex edge cases |
| **Frontend** | 14 | 9/10 | Error boundary; retry logic; PropTypes on all components; env vars | No TypeScript migration |
| **Supabase** | 4 | 9/10 | RANGE partitions (2025–2027+default); 11 composite indexes; inline comments | Partitioning advisory-only (not enforced) |
| **Config** | 7 | 7/10 | Well-documented; portfolio validation in commit pipeline | Entry prices often null; no runtime config-delta validation |
| **Skill Files** | 43 | 8/10 | Thorough, composable, platform-agnostic; MCP tool refs | No compile-time frontmatter checks; minor sector drift |
| **Templates** | 13 | 9/10 | Consistent, complete | Minor placeholder naming inconsistency |

---

## Fix History (April 6, 2026)

**Session 1** — Vite → Next.js migration, Supabase-first data layer, composite indexes, `publish-update.sh`, `git-commit.sh` push, performance page redesign, MCP tool wiring.

**Session 3** — Closed all remaining open issues: `sedi()` cross-platform sed helper in 4 scripts, `--help`/`-h` support on all 18 scripts, PropTypes added to 7 frontend files (prop-types package installed), inline comments on all 3+1 Supabase migrations, `004_partition_strategy.sql` RANGE partitioning for `daily_snapshots` and `documents`, `generate-snapshot.py` sidecar-preference + hardened regex + `--validate`/`--force` flags, `update_tearsheet.py` explicit regression fallback warning.

---

---

## Open Issues

*All previously tracked issues resolved in sessions 1–3. No open issues.*

## Score History & Projection

| Category | Initial (Apr 6 AM) | Session 1 (Apr 6 PM) | Session 2 (Apr 6 Eve) | Session 3 (Apr 6 Night) |
|----------|--------------------|--------------------|--------------------|---------------------|
| Shell Scripts | 5/10 | 6/10 | 7/10 | 8/10 |
| Python ETL | 4/10 | 5/10 | 7/10 | 8/10 |
| Frontend | 5/10 | 6/10 | 8/10 | 9/10 |
| Supabase | 7/10 | 8/10 | 8/10 | 9/10 |
| Config | 6/10 | 7/10 | 7/10 | 7/10 |
| Skill Files | 8/10 | 8/10 | 8/10 | 8/10 |
| Templates | 9/10 | 9/10 | 9/10 | 9/10 |
| **Overall** | **5.5/10** | **6.5/10** | **7.5/10** | **8.5/10** |

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Total shell scripts | 18 |
| Total Python scripts | 6 |
| Frontend files (app + components + lib) | 14 |
| Supabase migrations | 4 (7 tables, 11 composite indexes, RANGE partitions) |
| Skill files | 43 (26 core + 11 sector + 4 alt-data + 2 institutional) |
| Templates | 13 |
| Config files | 7 |
| Frontend framework | Next.js 15.3.2, React 19, Tailwind 4.1.7, Recharts 2.15 |
| Data layer | Supabase-first (no static JSON fallback) |
| Deployment | GitHub Pages via static export (`output: 'export'`) |

---

*Next review: When Config (#7) or Skill Files show regression, or after TypeScript migration.*
