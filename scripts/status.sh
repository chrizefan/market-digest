#!/bin/bash
# status.sh — DB-first project health (Supabase validation + optional memory summary)
# Usage: ./scripts/status.sh [YYYY-MM-DD]

set -e
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

DATE=${1:-$(date +%Y-%m-%d)}

echo "DB-first status (Supabase):"
python3 scripts/validate_db_first.py --date "$DATE"

echo ""
echo "── Memory files (ROLLING.md) ────────"
TOTAL_MEM=$(find memory/ -name "ROLLING.md" 2>/dev/null | wc -l | tr -d ' ')
echo "  Total ROLLING.md files: $TOTAL_MEM"

echo ""
echo "── Commands (DB-first) ──────────────"
echo "  python3 scripts/run_db_first.py   Single entry: validate, publish, execute-at-open"
echo "  ./scripts/new-day.sh              Print baseline/delta prompt for Claude"
echo "  ./scripts/weekly-rollup.sh        Weekly JSON scaffold + prompt"
echo "  ./scripts/monthly-rollup.sh       Monthly JSON scaffold + prompt"
echo "  ./scripts/fetch-market-data.sh    Refresh quotes + macro cache"
echo "  ./scripts/git-commit.sh           Commit outputs (runs ETL)"
echo "  ./scripts/watchlist-check.sh      Quick watchlist prompt"
echo "  ./scripts/thesis.sh               Thesis helpers"
echo ""
