#!/bin/bash
# new-day.sh — Start a new market analysis day (v4 — DB-first cadence)
# Sunday = Weekly Baseline (full 9-phase run, published to Supabase)
# Mon–Sat = Daily Delta (lightweight, published to Supabase)
# Run from the root of the digiquant-atlas repo each morning.

set -e

# Cross-platform sed in-place (macOS BSD sed + GNU/Linux sed)
sedi() { sed -i.bak "$@" && rm -f "${@: -1}.bak"; }
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

DATE=$(date +%Y-%m-%d)
YEAR=$(date +%Y)
WEEK=$(date +%V)
WEEK_LABEL="${YEAR}-W${WEEK}"
OUTPUT_DIR="outputs/daily/$DATE" # legacy archive only (no longer written in DB-first mode)
SECTORS="technology healthcare energy financials consumer-staples consumer-disc industrials utilities materials real-estate comms"

echo ""
echo "📊 digiquant-atlas — $DATE"
echo "================================"

echo "ℹ️  DB-first mode: no new outputs/daily folder will be created."
echo "   (Historical outputs remain as legacy archive.)"

# Detect day of week: 1=Mon, 7=Sun (macOS/BSD date)
DOW=$(date +%u)

# ─────────────────────────────────────────────────────────────────────────────
# SUNDAY = WEEKLY BASELINE
# ─────────────────────────────────────────────────────────────────────────────
if [ "$DOW" -eq 7 ]; then
  echo "📅 Run Type: WEEKLY BASELINE (${WEEK_LABEL})"
  echo ""

  echo "✅ Baseline day detected: ${DATE} (${WEEK_LABEL})"
  echo ""
  echo "📋 PASTE THIS INTO CLAUDE (digiquant-atlas project):"
  echo "=================================================="
  echo "Run the WEEKLY BASELINE digest for $DATE (${WEEK_LABEL})."
  echo ""
  echo "This is a Sunday — run the full 9-phase pipeline."
  echo "Start by reading skills/weekly-baseline/SKILL.md."
  echo ""
  echo "Key context:"
  echo "  - Week label:  $WEEK_LABEL"
  echo "  - Publish:     Supabase (DB-first). Use scripts/materialize_snapshot.py to upsert snapshot JSON."
  echo "=================================================="

# ─────────────────────────────────────────────────────────────────────────────
# MON–SAT = DAILY DELTA
# ─────────────────────────────────────────────────────────────────────────────
else
  echo "📅 Run Type: DAILY DELTA"
  echo ""

  # DB-first: baseline date comes from Supabase (latest baseline) or is provided by operator.
  BASELINE_DATE="(from Supabase)"

  DELTA_NUM="(n/a in DB-first)"

  echo "✅ Delta day detected: ${DATE} (${WEEK_LABEL})"
  echo ""
  echo "📋 PASTE THIS INTO CLAUDE (digiquant-atlas project):"
  echo "=================================================="
  echo "Run the DAILY DELTA digest for $DATE (${WEEK_LABEL})."
  echo ""
  echo "This is a weekday — run in delta mode (not a full baseline run)."
  echo "Start by reading skills/daily-delta/SKILL.md."
  echo ""
  echo "Key context:"
  echo "  - Baseline:    ${BASELINE_DATE}"
  echo "  - Publish:     Supabase (DB-first). Agent should output delta-request JSON; operator runs scripts/materialize_snapshot.py."
  echo "=================================================="
fi

echo ""
echo "After Claude completes: run scripts/materialize_snapshot.py to upsert to Supabase."
echo ""
