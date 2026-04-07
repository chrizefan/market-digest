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

## Changelog — Fixes Applied April 6 (Session 2)

All items below were completed during the second April 6 session:

| # | Issue (was) | Fix Applied | Layer |
|---|------------|-------------|-------|
| 1 | Hardcoded Supabase credentials in source | **Moved to env vars** (`NEXT_PUBLIC_SUPABASE_*`); added `.env.local` + `.env.local.example`; updated `deploy.yml` with GitHub secrets injection | Frontend |
| 2 | No React error boundary | **Created `frontend/app/error.js`** — Next.js App Router boundary with Try again / Reload buttons | Frontend |
| 4 | No atomic writes in `preload-history.py` | **Atomic write pattern** — write to `.csv.tmp`, then `os.rename()` in `save_cache()` | ETL |
| 4b | Same issue in `fetch-quotes.py` | **Atomic write pattern** applied to `save_cached()` | ETL |
| 5 | `archive.sh` deletes originals without verifying tar | **Added `tar -tzf` verification** before any `rm -f` — exits 1 if archive corrupt | Scripts |
| 6 | No retry logic on Supabase queries | **Wrapped `querySupabase()`** with 3-attempt exponential backoff (500ms → 1s → 2s) | Frontend |
| 7 | Unbounded `documents` query — OOM risk | **Added `.limit(500)`** to `documents` select in `getFullDashboardData()` | Frontend |
| 8 | `validate-phase.sh` silently passed on malformed `_meta.json` | **Hard-fail** replaced `2>/dev/null \|\| echo "unknown"` with stderr output + `exit 1` on parse error | Scripts |
| 9 | TOCTOU race in `new-day.sh` directory creation | **Atomic `mkdir`** replaces check+create: `mkdir "$OUTPUT_DIR" 2>/dev/null \|\| { exit 1; }` | Scripts |
| 10 | Treasury XML returns empty yields if schema changes | **Required-key validation** — checks `{2Y, 10Y}` present before returning; falls back to yfinance if not | ETL |
| 11 | `materialize.sh` warned but continued on missing baseline | **Changed to `exit 1`** — missing baseline is now a hard error | Scripts |
| 12 | Failed tickers silently dropped in `fetch-quotes.py` | **stderr logging** — each failed ticker printed to stderr at pipeline end | ETL |
| 14 | `status.sh` spawned 2–3 python3 subprocesses per `_meta.json` file | **Consolidated to 1 python3 call per file** using `read -r` and pipe-separated output | Scripts |

---

## Changelog — Fixes Applied April 6 (Session 1)

| # | Issue (was) | Fix Applied | Layer |
|---|------------|-------------|-------|
| 1 | Vite + React SPA with static JSON fallback | **Migrated to Next.js 15.3.2 App Router** with Supabase-first data layer | Frontend |
| 2 | `update-tearsheet.py` (hyphenated, un-importable) | **Renamed** to `update_tearsheet.py`; updated 7 references | ETL |
| 3 | `publish-update.sh` pushed to wrong branch (`main`) | **Fixed** to `master`; added repo check + empty-commit guard | Scripts |
| 4 | `git-commit.sh` suppressed ETL failures | **Tearsheet failure now blocks** the commit; snapshot shows stderr | Scripts |
| 5 | Portfolio validation never ran automatically | **Added** `validate-portfolio.sh` call in `git-commit.sh` | Scripts |
| 6 | Starfield ignored `prefers-reduced-motion` | **Added** media query check + `useRef` cleanup in `starfield.js` | Frontend |
| 7 | Missing composite indexes + audit trail | **Created** `003_performance_audit.sql` — 11 indexes + audit columns | Supabase |
| 8 | `backfill-supabase.py` used `importlib` hack | **Direct import** of `update_tearsheet` | ETL |
| 9 | No systematic market data fetch | **New** `fetch-quotes.py`, `fetch-macro.py`, `fetch-market-data.sh` | ETL |
| 10 | No MCP tool integration in skill files | **Wired** MCP tools (FRED, CoinGecko, Alpha Vantage) into phase skills | Skills |
| 11 | `git-commit.sh` did not push after commit | **Added** `git push origin master` with graceful fallback | Scripts |
| 12 | Performance page basic | **Redesigned** — NAV-only default, benchmark toggle, position P&L, advanced stats | Frontend |

---

## Top 10 Open Issues (ranked by impact)

### 1. Hardcoded Supabase credentials in source
**Severity**: CRITICAL | **Layer**: Frontend
- `frontend/lib/supabase.js` contains the Supabase URL and anon key as string literals
- Credentials are visible in the public GitHub repository
- The anon key is read-only (RLS-protected), but embedding it invites abuse and makes key rotation painful
- **Fix**: Move to `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars; add `.env.local.example`
- **Effort**: 15 min | **Note**: Since the frontend is a static export for GitHub Pages, env vars must be baked at build time — acceptable for an anon key, but should still be externalized

### 2. No React error boundary
**Severity**: CRITICAL | **Layer**: Frontend
- The old Vite app had an `ErrorBoundary.jsx` wrapping `<App/>`
- The new Next.js app has **no** `error.js` file in any route segment and no custom error boundary
- An unhandled error in any page component (Portfolio, Strategy, Performance) crashes to a blank white screen
- **Fix**: Add `frontend/app/error.js` (Next.js convention) or a client-side `ErrorBoundary` component
- **Effort**: 30 min

### 3. Fragile regex parsing in Python ETL
**Severity**: HIGH | **Layer**: ETL
- `generate-snapshot.py` and `update_tearsheet.py` extract regime, positions, theses, and market data via regex from DIGEST.md
- Any Markdown formatting change (emoji, dashes, emphasis, column reorder) silently returns empty data
- Warnings were added for missing top-level sections, but intra-section regex is still brittle
- **Fix**: Emit a `snapshot.json` sidecar during DIGEST generation; consume JSON instead of reparsing Markdown
- **Effort**: 2 hrs

### 4. No atomic writes in `preload-history.py`
**Severity**: HIGH | **Layer**: ETL
- CSV files written directly to `data/price-history/{ticker}.csv`
- Disk-full or interruption mid-write truncates the file; next run reads corrupt cache
- **Fix**: Write to `{ticker}.csv.tmp`, then `os.rename()`
- **Effort**: 30 min

### 5. `archive.sh` deletes originals without verifying tar
**Severity**: HIGH | **Layer**: Scripts
- After `tar -czf`, originals are removed with `xargs rm -f`
- If disk is full the tar is incomplete; data is permanently lost
- **Fix**: `tar -tzf` verification before `rm`
- **Effort**: 30 min

### 6. No retry logic on Supabase queries
**Severity**: HIGH | **Layer**: Frontend
- `queries.js` calls Supabase once; any timeout or transient error sets error state permanently
- No exponential backoff, no automatic retry
- **Fix**: Wrap `querySupabase()` with retry (3 attempts, exponential backoff)
- **Effort**: 1 hr

### 7. Unbounded `documents` query in `queries.js`
**Severity**: MEDIUM | **Layer**: Frontend
- `getFullDashboardData()` fetches all rows from `documents` with no `.limit()` — OOM risk as data grows
- Other queries (positions, theses, snapshots) are appropriately bounded
- **Fix**: Add `.limit(500)` or implement pagination
- **Effort**: 15 min

### 8. `validate-phase.sh` silently passes on malformed `_meta.json`
**Severity**: MEDIUM | **Layer**: Scripts
- JSON parse errors in `_meta.json` are caught with `|| echo ""`, making validation pass incorrectly
- **Fix**: Hard-fail if `python3 -c "json.load()"` exits non-zero
- **Effort**: 15 min

### 9. No race-condition guard in `new-day.sh`
**Severity**: MEDIUM | **Layer**: Scripts
- Two concurrent runs can create a corrupt output folder
- Script checks `if [ -d "$OUTPUT_DIR" ]` but there's a TOCTOU window
- **Fix**: Use `mkdir -p` atomicity or `flock`
- **Effort**: 30 min

### 10. `fetch-macro.py` — no Treasury XML schema validation
**Severity**: MEDIUM | **Layer**: ETL
- Treasury API XML is parsed directly; if schema changes, yields dict is silently empty
- **Fix**: Validate expected XML elements before extraction
- **Effort**: 30 min

---

## Open Issues (lower priority)

### #3 — Fragile regex parsing in Python ETL
**Severity**: HIGH | **Layer**: ETL | **Effort**: 2 hrs
- `generate-snapshot.py` and `update_tearsheet.py` extract regime, positions, theses, and market data via regex from DIGEST.md
- DIGEST Markdown formatting changes silently produce empty data
- **Fix**: Emit a `snapshot.json` sidecar during DIGEST generation; consume JSON instead of reparsing Markdown
- **Status**: Deferred — architectural change, 2+ hr effort

### Remaining Medium / Low Priority

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
