#!/bin/bash
# monthly-rollup.sh — Generate a monthly summary from weekly baselines + daily deltas
# Run at end of each month (last trading day or weekend)
# v3: Understands three-tier cadence (baselines + deltas + weekly rollups)

set -e

YEAR=$(date +%Y)
MONTH=$(date +%m)
MONTH_LABEL="${YEAR}-${MONTH}"
OUTPUT_FILE="outputs/monthly/${MONTH_LABEL}.md"

echo ""
echo "📆 Monthly Rollup — $MONTH_LABEL"
echo "=================================="

mkdir -p "outputs/monthly"

# ── Find this month's weekly baselines ───────────────────────────────────────
BASELINES=""
BASELINE_COUNT=0
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-${MONTH}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    if [ "$META_TYPE" = "baseline" ]; then
      BASELINES="$BASELINES $dir/DIGEST.md"
      BASELINE_COUNT=$((BASELINE_COUNT + 1))
    fi
  fi
done

# ── Find this month's daily deltas ───────────────────────────────────────────
DELTAS=""
DELTA_COUNT=0
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-${MONTH}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    if [ "$META_TYPE" = "delta" ] && [ -f "$dir/DIGEST-DELTA.md" ]; then
      DELTAS="$DELTAS $dir/DIGEST-DELTA.md"
      DELTA_COUNT=$((DELTA_COUNT + 1))
    fi
  fi
done

# ── Find this month's weekly rollup files ────────────────────────────────────
WEEKLY_FILES=$(find outputs/weekly/ -name "${YEAR}-W*.md" 2>/dev/null | sort)
WEEK_COUNT=$(echo "$WEEKLY_FILES" | grep -c "." 2>/dev/null || echo "0")

# ── Status report ─────────────────────────────────────────────────────────────
echo "  Baselines found:       $BASELINE_COUNT"
echo "  Delta days found:      $DELTA_COUNT"
echo "  Weekly rollups found:  $WEEK_COUNT"
echo ""

if [ "$BASELINE_COUNT" -eq 0 ] && [ "$DELTA_COUNT" -eq 0 ]; then
  echo "⚠️  No files found for $MONTH_LABEL."
  echo "   Ensure at least some baseline or delta runs exist for this month."
  exit 1
fi

# ── Create output file from template ─────────────────────────────────────────
MONTH_NAME=$(date -jf "%Y-%m" "${YEAR}-${MONTH}" "+%B %Y" 2>/dev/null || echo "$MONTH_LABEL")
cp "templates/monthly-digest.md" "$OUTPUT_FILE"
sed -i "" "s/{{MONTH_LABEL}}/$MONTH_LABEL/g" "$OUTPUT_FILE"
sed -i "" "s/{{MONTH_NAME}}/$MONTH_NAME/g" "$OUTPUT_FILE"
sed -i "" "s/{{WEEK_COUNT}}/$WEEK_COUNT/g" "$OUTPUT_FILE"
sed -i "" "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$OUTPUT_FILE"

# Append file reference lists
{
  echo ""
  echo "---"
  echo ""
  echo "## Source Files"
  echo ""
  echo "### Weekly Baselines (${BASELINE_COUNT})"
  for f in $BASELINES; do
    echo "- [$f]($f)"
  done
  echo ""
  echo "### Daily Deltas (${DELTA_COUNT})"
  for f in $DELTAS; do
    echo "- [$f]($f)"
  done
  echo ""
  echo "### Weekly Rollups (${WEEK_COUNT})"
  for f in $WEEKLY_FILES; do
    WEEK=$(basename "$f" .md)
    echo "- [$WEEK]($f)"
  done
} >> "$OUTPUT_FILE"

echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE to generate the monthly synthesis:"
echo "============================================================"
echo "Generate a monthly market synthesis for $MONTH_LABEL ($MONTH_NAME)."
echo ""
echo "Start by reading skills/SKILL-monthly-synthesis.md for full instructions."
echo ""
echo "Source files:"
echo "  $BASELINE_COUNT weekly baseline(s), $DELTA_COUNT delta day(s), $WEEK_COUNT weekly rollup(s)"
echo "  Full list in: $OUTPUT_FILE (see Source Files section)"
echo ""
echo "Output: $OUTPUT_FILE"
echo ""
echo "Required additions beyond the template:"
echo "  - Cumulative Regime Shifts section (factor-level analysis)"
echo "  - Delta Efficiency Summary (stats on how many deltas vs baselines)"
echo "  - Thesis performance review for all theses active this month"
echo "============================================================"
echo ""
