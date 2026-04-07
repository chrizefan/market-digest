#!/bin/bash
# materialize.sh — Print the prompt to materialize a full DIGEST.md from baseline + deltas
# Useful for debugging, re-reading, or forcing a re-materialization after edits
# Usage: ./scripts/materialize.sh [date]    (default: today)
#        ./scripts/materialize.sh 2026-04-09

set -e

TARGET_DATE=${1:-$(date +%Y-%m-%d)}
OUTPUT_DIR="outputs/daily/$TARGET_DATE"
META_FILE="$OUTPUT_DIR/_meta.json"

echo ""
echo "🔨 Materialize — $TARGET_DATE"
echo "=============================="

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "❌ Output directory not found: $OUTPUT_DIR"
  echo "   Run ./scripts/new-day.sh first."
  exit 1
fi

if [ ! -f "$META_FILE" ]; then
  echo "❌ No _meta.json found in $OUTPUT_DIR"
  echo "   Older folders without _meta.json may not support materialization."
  echo "   For legacy folders, just read the DIGEST.md directly."
  exit 1
fi

META_TYPE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('type',''))" 2>/dev/null || echo "")

if [ "$META_TYPE" = "baseline" ]; then
  echo "ℹ️  $TARGET_DATE is a BASELINE — DIGEST.md is already the materialized version."
  echo "   No materialization needed."
  echo ""
  echo "   To re-read or verify: outputs/daily/$TARGET_DATE/DIGEST.md"
  exit 0
fi

if [ "$META_TYPE" != "delta" ]; then
  echo "❌ Unknown run type in _meta.json: '$META_TYPE'"
  echo "   Expected 'baseline' or 'delta'."
  exit 1
fi

BASELINE_DATE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('baseline',''))" 2>/dev/null || echo "")
DELTA_NUM=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('delta_number','?'))" 2>/dev/null || echo "?")
WEEK_LABEL=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('week',''))" 2>/dev/null || echo "")

if [ -z "$BASELINE_DATE" ] || [ "$BASELINE_DATE" = "NOT FOUND" ]; then
  echo "❌ Baseline date not found in _meta.json."
  echo "   Run ./scripts/new-week.sh to create a baseline first."
  exit 1
fi

echo "Run type:    Daily Delta #${DELTA_NUM} (${WEEK_LABEL})"
echo "Baseline:    $BASELINE_DATE"
echo "Target:      $TARGET_DATE"
echo ""

# Validate baseline exists
if [ ! -f "outputs/daily/$BASELINE_DATE/DIGEST.md" ]; then
  echo "❌ Baseline DIGEST.md not found: outputs/daily/$BASELINE_DATE/DIGEST.md"
  echo "   Cannot materialize — run the baseline for $BASELINE_DATE first."
  exit 1
fi

# Find all delta DIGEST-DELTA.md files from baseline to target date (inclusive)
DELTA_FILES=""
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d | sort); do
  DIR_DATE=$(basename "$dir")
  DIR_META="$dir/_meta.json"
  # Only include dates strictly after baseline and up to (inclusive) target
  if [[ "$DIR_DATE" > "$BASELINE_DATE" ]] && [[ "$DIR_DATE" <= "$TARGET_DATE" ]]; then
    if [ -f "$DIR_META" ]; then
      D_TYPE=$(python3 -c "import json; d=json.load(open('$DIR_META')); print(d.get('type',''))" 2>/dev/null || echo "")
      if [ "$D_TYPE" = "delta" ] && [ -f "$dir/DIGEST-DELTA.md" ]; then
        DELTA_FILES="$DELTA_FILES $dir/DIGEST-DELTA.md"
      fi
    fi
  fi
done

echo "📋 PASTE THIS INTO CLAUDE:"
echo "=========================="
echo "Materialize a complete DIGEST.md for $TARGET_DATE."
echo ""
echo "Step 1 — Read the baseline:"
echo "  outputs/daily/${BASELINE_DATE}/DIGEST.md"
echo ""
if [ -n "$DELTA_FILES" ]; then
  echo "Step 2 — Apply deltas in order (each CHANGED section overrides baseline):"
  for f in $DELTA_FILES; do
    echo "  $f"
  done
  echo ""
fi
echo "Step 3 — Write the complete materialized digest:"
echo "  Save to: $OUTPUT_DIR/DIGEST.md"
echo ""
echo "Rules for materialization:"
echo "  - Sections marked 'CHANGED' in a delta override the baseline"
echo "  - Sections marked 'UNCHANGED' carry forward from baseline (or last delta that changed them)"
echo "  - Update all date/timestamp headers to $TARGET_DATE"
echo "  - The output must be a complete, self-contained DIGEST.md"
echo "  - Must match the structure of templates/master-digest.md"
echo "  - Must include: Market Regime, Alt Data, Institutional, Macro, Asset Classes,"
echo "    Equities + Sectors, Thesis Tracker, Portfolio Positioning, Actionable Summary, Risk Radar"
echo "=========================="
echo ""
