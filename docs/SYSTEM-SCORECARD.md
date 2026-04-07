# digiquant-atlas — System Scorecard & Improvement Plan

> Scored April 6, 2026. Covers all layers: scripts, ETL, frontend, database, skill files.
> **Note**: Frontend references below refer to the old Vite + React app (`frontend/src/`), which was replaced by Next.js + Tailwind on April 6, 2026. The new frontend lives at `frontend/` (Next.js App Router).

---

## Overall Score: 5.5 / 10 — Functional but Fragile

The system completes its daily pipeline and produces correct output. But it has **multiple silent failure modes**, weak error recovery, and brittle parsing that will cause debugging pain as the system matures.

---

## Category Scores

| Category | Score | Key Strength | Key Weakness |
|----------|-------|-------------|-------------|
| **Shell Scripts** (18) | 5/10 | Good macOS portability (`sed -i ""`) | Silent failures; no error propagation |
| **Python ETL** (6) | 4/10 | Comprehensive data extraction | Fragile regex; optional deps mask errors |
| **Frontend** (12 files) | 5/10 | Clean component architecture | No error boundary; crash on null data |
| **Supabase** (2 migrations) | 7/10 | Solid constraints + RLS | Missing audit trail, composite indexes |
| **Config Files** (6) | 6/10 | Well-documented, clear structure | No runtime validation enforcement |
| **Skill Files** (38) | 8/10 | Thorough, composable, platform-agnostic | No compile-time checks on format |
| **Templates** (14) | 9/10 | Consistent, complete | Minor placeholder drift |

---

## Top 10 Issues Found (ranked by impact)

### 1. No Error Boundary — app crashes to blank screen
**Severity**: CRITICAL | **Layer**: Frontend
- Any thrown error in Portfolio, Strategy, or Performance pages kills the entire React tree
- User sees a blank white page with no recovery path
- **FIXED**: Added `ErrorBoundary.jsx` wrapping `<App/>` in `main.jsx`

### 2. Silent ETL failures in git-commit.sh
**Severity**: CRITICAL | **Layer**: Scripts
- `generate-snapshot.py` and `update-tearsheet.py` failures were suppressed with `2>/dev/null || echo "⚠️"`
- Stale `dashboard-data.json` gets committed and deployed to GitHub Pages
- Users see outdated portfolio data with no indication it's stale
- **FIXED**: tearsheet failure now blocks the commit; snapshot failure shows stderr

### 3. Fragile regex parsing in generate-snapshot.py
**Severity**: HIGH | **Layer**: ETL
- Regime, positions, theses, and market data all extracted via regex from DIGEST.md
- Any change to Markdown formatting (emoji, dashes, emphasis) silently returns empty data
- Missing sections returned `[]` or `{}` with **zero warnings**
- **FIXED**: Added `stderr` warnings when key sections (Regime, Positions, Theses) are missing

### 4. No error/retry state in App.jsx data loading
**Severity**: HIGH | **Layer**: Frontend
- Failed `getFullDashboardData()` set `loading=false` but left `data=null`
- User saw a brief error message with no way to retry
- **FIXED**: Added explicit `error` state, retry button, and proper `finally()` cleanup

### 5. publish-update.sh pushes to wrong branch
**Severity**: HIGH | **Layer**: Scripts
- Script pushed to `git push origin main` but repo uses `master` branch
- Would fail on every invocation
- Also: no git repo check, no empty-commit guard
- **FIXED**: Changed to `master`, added repo check, added empty-commit guard

### 6. Starfield animation ignores prefers-reduced-motion
**Severity**: MEDIUM | **Layer**: Frontend / Accessibility
- 180-star animation runs unconditionally
- Users with motion sensitivity get no relief
- Animation cleanup used a local `var` instead of `useRef`, risking stale closures
- **FIXED**: Added `prefers-reduced-motion` check; switched to `useRef` for animation ID

### 7. Layout.jsx crashes on undefined meta
**Severity**: MEDIUM | **Layer**: Frontend
- `meta.name`, `meta.base_currency` accessed without null checks
- If data shape changes or Supabase returns partial data, entire layout crashes
- **FIXED**: Default parameter `meta = {}`, fallback values for each field

### 8. Portfolio validation never runs automatically
**Severity**: MEDIUM | **Layer**: Pipeline
- `validate-portfolio.sh` exists and works, but is never called by any automated script
- Agent could write 150% total weight and it would be committed
- **FIXED**: Added validation step to `git-commit.sh` before staging

### 9. update-tearsheet.py impossible to import normally
**Severity**: MEDIUM | **Layer**: ETL
- Hyphenated filename required `importlib.import_module()` hack in `backfill-supabase.py`
- Breaks IDE tooling, type checking, and standard `import` statements
- **FIXED**: Renamed to `update_tearsheet.py`; updated all references (7 files)

### 10. Missing Supabase composite indexes + audit trail
**Severity**: MEDIUM | **Layer**: Database
- Single-column indexes exist but common queries (by category+date, ticker+date) require table scans
- No `created_at`/`updated_at` on any table — impossible to detect when data was modified
- **FIXED**: Created `003_performance_audit.sql` migration with 11 composite indexes + audit columns + triggers

---

## Changes Made in This Session

| # | File | Change | Impact |
|---|------|--------|--------|
| 1 | [frontend/src/components/ErrorBoundary.jsx](frontend/src/components/ErrorBoundary.jsx) | **NEW** — React error boundary with reload button | Prevents blank screen on component errors |
| 2 | [frontend/src/main.jsx](frontend/src/main.jsx) | Wrapped `<App>` in `<ErrorBoundary>` | Catches any render error |
| 3 | [frontend/src/App.jsx](frontend/src/App.jsx) | Error state, retry button, `useRef` for animation, `prefers-reduced-motion` | Better UX on failure + accessibility |
| 4 | [frontend/src/components/Layout.jsx](frontend/src/components/Layout.jsx) | Null guards on `meta` props | Prevents crash on partial data |
| 5 | [scripts/git-commit.sh](scripts/git-commit.sh) | Fail-hard on tearsheet; validate portfolio before commit | No more stale deploys |
| 6 | [scripts/generate-snapshot.py](scripts/generate-snapshot.py) | Warnings on missing DIGEST sections; fixed dead code after early return | Visible diagnostics |
| 7 | [scripts/publish-update.sh](scripts/publish-update.sh) | Fix branch name (main→master), add repo check, error handling | Correct, safe publishing |
| 8 | [supabase/migrations/003_performance_audit.sql](supabase/migrations/003_performance_audit.sql) | **NEW** — 11 composite indexes + audit columns + triggers | Query performance + data audit trail |
| 9 | `scripts/update-tearsheet.py` → [scripts/update_tearsheet.py](scripts/update_tearsheet.py) | Renamed; updated 7 files referencing it | Normal Python imports |
| 10 | [scripts/backfill-supabase.py](scripts/backfill-supabase.py) | Direct import replaces `importlib` hack | Cleaner, IDE-friendly |

---

## Remaining Improvements (not yet implemented)

Ranked by impact. These are the next things to tackle:

### HIGH IMPACT

| # | Improvement | Effort | Why |
|---|------------|--------|-----|
| 1 | **Retry logic in `queries.js`** — exponential backoff on Supabase timeouts | 1 hr | Brief network hiccups cause fallback to stale JSON |
| 2 | **Default `LIMIT` on unbounded Supabase queries** | 30 min | `getDocIndex()` loads all rows if no filter.limit — OOM risk as data grows |
| 3 | **Atomic writes in `preload-history.py`** — write to `.tmp` then rename | 30 min | Truncated CSV on disk-full corrupts ticker cache |
| 4 | **Treasury XML schema validation in `fetch-macro.py`** | 30 min | If XML schema changes, yields dict is silently empty |
| 5 | **`validate-phase.sh` — fail on malformed `_meta.json`** | 30 min | Currently catches JSON errors with `|| echo ""`, passes validation incorrectly |

### MEDIUM IMPACT

| # | Improvement | Effort | Why |
|---|------------|--------|-----|
| 6 | **Race condition guard in `new-day.sh`** — use `mkdir` atomicity or `flock` | 30 min | Two concurrent runs can corrupt output folder |
| 7 | **`archive.sh` — verify tar before deleting originals** | 30 min | Disk-full → incomplete tar → data loss |
| 8 | **Watchlist ticker validation** — flag delisted ETFs in `fetch-quotes.py` | 1 hr | Delisted tickers return empty data, silently omitted |
| 9 | **`materialize.sh` — hard error on missing baseline** | 15 min | Currently warns but continues with incomplete output |
| 10 | **Cross-platform `sed`** — use `sed -i.bak` + `rm .bak` pattern | 1 hr | Current `sed -i ""` works on macOS only |

### LOW IMPACT (quality of life)

| # | Improvement | Effort | Why |
|---|------------|--------|-----|
| 11 | **Deduplicate `status.sh` grep calls** — read file once with awk | 30 min | 40+ grep processes for 20 memory files is slow |
| 12 | **Add `--help` flags to all scripts** | 1 hr | Some scripts have no usage text |
| 13 | **PropTypes on all React components** | 1 hr | Catch prop shape issues during development |

---

## Score Projection After Fixes

| Category | Before | After (today's fixes) | After (remaining HIGH) |
|----------|--------|----------------------|----------------------|
| Shell Scripts | 5/10 | 6/10 | 7/10 |
| Python ETL | 4/10 | 5/10 | 7/10 |
| Frontend | 5/10 | 7/10 | 8/10 |
| Supabase | 7/10 | 8/10 | 8/10 |
| **Overall** | **5.5/10** | **6.5/10** | **7.5/10** |

---

*Next review: After implementing the HIGH-impact remaining items.*
