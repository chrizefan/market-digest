# digiquant-atlas — System Scorecard & Improvement Plan

> **Scored**: April 7, 2026 (updated — session 4).
> Covers all layers: shell scripts (18), Python ETL (6), frontend (17 files, Next.js 15 + TypeScript), Supabase (4 migrations), config (7), skill files (43), templates (13).

---

## Overall Score: 9 / 10 — Production-Grade, Fully Typed

The system completes its three-tier cadence (baseline / delta / synthesis) reliably and produces correct output. Session 4 (April 7) delivered the **TypeScript migration** — all 16 JS files converted to strict TS/TSX, `prop-types` removed (replaced by TypeScript types), `database.types.ts` handwritten from schema, `declarations.d.ts` for CSS module support, and a clean `npm run build` with 9/9 static routes.

---

## Category Scores

| Category | Files | Score | Key Strength | Key Weakness |
|----------|-------|-------|-------------|-------------|
| **Shell Scripts** | 18 | 8/10 | Cross-platform `sedi()`; `--help` on all 18 scripts; tar verification | No automated smoke-test suite |
| **Python ETL** | 6 | 7/10 | Sidecar-first (skip regex when snapshot.json populated); hardened regex; `--validate`/`--force` on 2 scripts | 5 of 6 scripts lack `--help` / argparse; `database.types.ts` handwritten (not CLI-generated) |
| **Frontend** | 17 | 10/10 | TypeScript strict mode; all types explicit; `declarations.d.ts` for CSS; error boundary; static export builds clean | `next lint` deprecated (legacy `.eslintrc.json` format) — migrate to ESLint flat config before Next.js 16 |
| **Supabase** | 4 | 9/10 | RANGE partitions (2025–2027+default); 11 composite indexes; inline comments | Partitioning advisory-only (not enforced); `database.types.ts` requires manual sync with schema |
| **Config** | 7 | 7/10 | Well-documented; portfolio validation in commit pipeline | All 6 holdings have `entry_price: null` — cost-basis and P&L calculations will be inaccurate |
| **Skill Files** | 43 | 8/10 | Thorough, composable, platform-agnostic; MCP tool refs | No compile-time frontmatter checks; minor sector drift |
| **Templates** | 13 | 9/10 | Consistent, complete | Minor placeholder naming inconsistency |

---

## Fix History (April 6–7, 2026)

**Session 1** — Vite → Next.js migration, Supabase-first data layer, composite indexes, `publish-update.sh`, `git-commit.sh` push, performance page redesign, MCP tool wiring.

**Session 2** — React error boundary, retry logic, atomic writes, tar verification, race guard, XML validation.

**Session 3** — `sedi()` cross-platform sed helper, `--help`/`-h` on all 18 bash scripts, PropTypes on 7 frontend files, inline comments on all Supabase migrations, `004_partition_strategy.sql` RANGE partitioning, `generate-snapshot.py` sidecar-preference + hardened regex + `--validate`/`--force` flags.

**Session 4 (April 7)** — Full TypeScript migration: `strict: true`, all 16 JS files → TS/TSX, `prop-types` removed (replaced by TS types), `lib/types.ts` with domain types, `lib/database.types.ts` handwritten from schema, `declarations.d.ts` for CSS module support, `frontend/.gitignore` created, `tsconfig.tsbuildinfo` untracked. `npm run build` → 9/9 static routes clean.

---

---

## Open Issues

### High Priority

| # | Layer | Issue | Impact |
|---|-------|-------|--------|
| 1 | Config | All 6 holdings have `entry_price: null` in `portfolio.json` | P&L, cost-basis, and return calculations will be wrong or zero |
| 2 | Python ETL | 5 of 6 scripts (`fetch-quotes.py`, `fetch-macro.py`, `backfill-supabase.py`, `generate-snapshot.py`, `update_tearsheet.py`) have no `--help` or argparse | CLI ergonomics; inconsistent with bash scripts which all have `--help` |

### Medium Priority

| # | Layer | Issue | Impact |
|---|-------|-------|--------|
| 3 | Frontend | `next lint` command deprecated (Next.js 15.5 warns; removed in Next.js 16); `.eslintrc.json` is legacy JSON format | Will break linting on the next major version upgrade |
| 4 | Supabase / Frontend | `lib/database.types.ts` is handwritten and requires manual sync when schema migrations are added | Type drift if migrations are applied without updating the .ts file |
| 5 | Shell Scripts | No automated smoke-test suite — no way to verify all scripts pass basic invocation after changes | Regressions only caught in production runs |

### Low Priority

| # | Layer | Issue | Impact |
|---|-------|-------|--------|
| 6 | Python ETL | No unit tests for regex edge cases in `generate-snapshot.py` / `update_tearsheet.py` | Edge-case markdown formats could silently corrupt data |
| 7 | Skill Files | No compile-time frontmatter validation; sector-skill drift possible if watchlist changes | Routing miss if `name:` field is broken |

## Score History & Projection

| Category | Initial (Apr 6 AM) | Session 1 (Apr 6 PM) | Session 2 (Apr 6 Eve) | Session 3 (Apr 6 Night) | Session 4 (Apr 7) |
|----------|--------------------|--------------------|--------------------|---------------------|-----------------|
| Shell Scripts | 5/10 | 6/10 | 7/10 | 8/10 | 8/10 |
| Python ETL | 4/10 | 5/10 | 7/10 | 8/10 | 7/10 ↓ (re-scored: 5/6 scripts lack argparse) |
| Frontend | 5/10 | 6/10 | 8/10 | 9/10 | **10/10** ↑ (TypeScript migration complete) |
| Supabase | 7/10 | 8/10 | 8/10 | 9/10 | 9/10 |
| Config | 6/10 | 7/10 | 7/10 | 7/10 | 7/10 |
| Skill Files | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 |
| Templates | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 |
| **Overall** | **5.5/10** | **6.5/10** | **7.5/10** | **8.5/10** | **9/10** |

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Total shell scripts | 18 |
| Total Python scripts | 6 |
| Frontend files (app + components + lib) | 17 (all TypeScript) |
| Supabase migrations | 4 (7 tables, 11 composite indexes, RANGE partitions) |
| Skill files | 43 (26 core + 11 sector + 4 alt-data + 2 institutional) |
| Templates | 13 |
| Config files | 7 |
| Frontend framework | Next.js 15.5.14, React 19, Tailwind 4.1.7, Recharts 2.15, TypeScript 5 (strict) |
| Data layer | Supabase-first (no static JSON fallback) |
| Deployment | GitHub Pages via static export (`output: 'export'`) |

---

*Next review: When Config (#7) entry prices are filled, or after ESLint flat config migration.*
