#!/usr/bin/env bash
# Copy legacy daily folders into outputs/daily/, materialize snapshots into Supabase for a date range,
# then run update_tearsheet so documents / NAV / metrics align with the filesystem.
#
# Typical use (April 2026 week through the 8th, after Co-work runs stopped at Supabase publish):
#   ./scripts/backfill-historical-daily-to-supabase.sh
#
# Prerequisites:
#   - config/supabase.env with SUPABASE_URL + SUPABASE_SERVICE_KEY
#   - pip install -r requirements.txt
#   - Legacy trees under archive/legacy-outputs/daily/YYYY-MM-DD (or set LEGACY_ROOT)
#
# Environment overrides:
#   LEGACY_ROOT   — default: <repo>/archive/legacy-outputs/daily
#   BASELINE_DATE — default: 2026-04-05 (Sunday baseline for that week)
#   LAST_DATE     — default: 2026-04-08 (last day to materialize)
#   SKIP_COPY=1   — do not copy from LEGACY_ROOT (use existing outputs/daily only)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PY="${ROOT}/.venv/bin/python"
if [[ ! -x "$PY" ]]; then PY="python3"; fi

LEGACY_ROOT="${LEGACY_ROOT:-$ROOT/archive/legacy-outputs/daily}"
BASELINE_DATE="${BASELINE_DATE:-2026-04-05}"
LAST_DATE="${LAST_DATE:-2026-04-08}"
SKIP_COPY="${SKIP_COPY:-0}"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '1,35p' "$0"
  exit 0
fi

echo "== backfill-historical-daily-to-supabase"
echo "    LEGACY_ROOT=$LEGACY_ROOT"
echo "    BASELINE_DATE=$BASELINE_DATE LAST_DATE=$LAST_DATE"

# Dates between baseline and last (inclusive), ISO order.
ALL_DATES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && ALL_DATES+=("$line")
done < <(
  "$PY" - <<'PY' "$BASELINE_DATE" "$LAST_DATE"
import sys
from datetime import date, timedelta

def parse(s):
    y, m, d = map(int, s.split("-"))
    return date(y, m, d)

a, b = parse(sys.argv[1]), parse(sys.argv[2])
if b < a:
    raise SystemExit("LAST_DATE must be >= BASELINE_DATE")
cur = a
while cur <= b:
    print(cur.isoformat())
    cur += timedelta(days=1)
PY
)

DELTA_DATES=()
for d in "${ALL_DATES[@]}"; do
  if [[ "$d" != "$BASELINE_DATE" ]]; then
    DELTA_DATES+=("$d")
  fi
done

if [[ ${#DELTA_DATES[@]} -eq 0 ]]; then
  echo "No delta dates between baseline and LAST_DATE." >&2
  exit 1
fi

if [[ "$SKIP_COPY" != "1" ]]; then
  echo "== Copy legacy daily → outputs/daily (skip dates with no legacy folder)"
  for d in "${ALL_DATES[@]}"; do
    src="$LEGACY_ROOT/$d"
    if [[ ! -d "$src" ]]; then
      echo "   (no legacy folder for $d — using outputs/daily/$d if present)"
      continue
    fi
    dst="$ROOT/outputs/daily/$d"
    mkdir -p "$dst"
    cp -R "$src"/. "$dst/"
    echo "   copied $d"
  done
else
  echo "== SKIP_COPY=1 — using outputs/daily as-is"
fi

echo "== Materialize digest chain: baseline $BASELINE_DATE then ${DELTA_DATES[*]}"
BF=( "$ROOT/scripts/backfill-db-first-digest.sh" "$BASELINE_DATE" "${DELTA_DATES[@]}" )
"${BF[@]}"

echo "== update_tearsheet (documents, positions, metrics, benchmarks)"
"$PY" "$ROOT/scripts/update_tearsheet.py"

echo ""
echo "✅ Backfill finished. Suggested checks:"
echo "   $PY scripts/validate_db_first.py --validate-mode full"
echo "   Open frontend Research Library for dates $BASELINE_DATE … $LAST_DATE"
