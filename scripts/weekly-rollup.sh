#!/bin/bash
# weekly-rollup.sh — Generate a weekly summary from baseline + daily delta files
# Run at end of week (Friday or weekend)
# v3: Understands three-tier cadence (baseline + deltas)

set -e

# Cross-platform sed in-place (macOS BSD sed + GNU/Linux sed)
sedi() { sed -i.bak "$@" && rm -f "${@: -1}.bak"; }
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

# Get ISO week number and year
YEAR=$(date +%Y)
WEEK=$(date +%V)
WEEK_LABEL="${YEAR}-W${WEEK}"
OUTPUT_FILE="outputs/weekly/${WEEK_LABEL}.json"

echo ""
echo "📅 Weekly Rollup — $WEEK_LABEL"
echo "================================"

# ── Find this week's baseline ─────────────────────────────────────────────────
BASELINE_DATE=""
BASELINE_FILE=""
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    META_WEEK=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('week',''))" 2>/dev/null || echo "")
    if [ "$META_TYPE" = "baseline" ] && [ "$META_WEEK" = "$WEEK_LABEL" ]; then
      BASELINE_DATE=$(basename "$dir")
      BASELINE_FILE="$dir/DIGEST.md"
    fi
  fi
done

# ── Find this week's daily deltas ─────────────────────────────────────────────
DELTA_FILES=""
DELTA_DATES=""
DELTA_COUNT=0
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    META_WEEK=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('week',''))" 2>/dev/null || echo "")
    if [ "$META_TYPE" = "delta" ] && [ "$META_WEEK" = "$WEEK_LABEL" ]; then
      DELTA_DATE=$(basename "$dir")
      if [ -f "$dir/DIGEST-DELTA.md" ]; then
        DELTA_FILES="$DELTA_FILES $dir/DIGEST-DELTA.md"
        DELTA_DATES="$DELTA_DATES $DELTA_DATE"
        DELTA_COUNT=$((DELTA_COUNT + 1))
      fi
    fi
  fi
done

# ── Fallback: legacy flat DIGEST.md files (v1/v2 structure) ──────────────────
if [ -z "$BASELINE_DATE" ] && [ "$DELTA_COUNT" -eq 0 ]; then
  LEGACY_FILES=$(find outputs/daily/ -name "DIGEST.md" -path "*/$YEAR-*/*" 2>/dev/null | sort | tail -7)
  if [ -n "$LEGACY_FILES" ]; then
    echo "ℹ️  No three-tier cadence files found — falling back to legacy DIGEST.md files."
    BASELINE_FILE=$(echo "$LEGACY_FILES" | head -1)
    BASELINE_DATE=$(echo "$BASELINE_FILE" | grep -oE "[0-9]{4}-[0-9]{2}-[0-9]{2}")
  fi
fi

# ── Status report ─────────────────────────────────────────────────────────────
if [ -n "$BASELINE_DATE" ]; then
  echo "  Baseline:  $BASELINE_DATE ($BASELINE_FILE)"
else
  echo "  ⚠️  No baseline found for $WEEK_LABEL"
fi
echo "  Deltas:    $DELTA_COUNT found (${DELTA_DATES:-none})"
echo ""

if [ -z "$BASELINE_DATE" ] && [ "$DELTA_COUNT" -eq 0 ]; then
  echo "❌ No digest files found for $WEEK_LABEL."
  echo "   Ensure at least a baseline has been run this week."
  exit 1
fi

# ── Create the weekly JSON artifact scaffold ─────────────────────────────────
mkdir -p "outputs/weekly"
DATE_RANGE_START="$BASELINE_DATE"
DATE_RANGE_END="$(echo $DELTA_DATES | tr ' ' '\n' | tail -1 | tr -d '\n')"
[ -z "$DATE_RANGE_END" ] && DATE_RANGE_END="$BASELINE_DATE"
cat > "$OUTPUT_FILE" << EOF
{
  "schema_version": "1.0",
  "doc_type": "weekly_digest",
  "date": "${DATE_RANGE_END}",
  "week_label": "${WEEK_LABEL}",
  "meta": {
    "generated_at": "$(date '+%Y-%m-%d %H:%M %Z')",
    "date_range": { "start": "${DATE_RANGE_START}", "end": "${DATE_RANGE_END}" },
    "sources": {
      "baseline_date": "${BASELINE_DATE}",
      "delta_dates": [$(echo $DELTA_DATES | tr ' ' '\n' | awk 'NF{print "\"" $0 "\","}' | sed '$ s/,$//')]
    },
    "tags": []
  },
  "body": {
    "executive_summary": "",
    "daily_bias_shifts": [],
    "regime_summary": {
      "growth": { "baseline": "", "friday": "", "weekly_shift": "" },
      "inflation": { "baseline": "", "friday": "", "weekly_shift": "" },
      "policy": { "baseline": "", "friday": "", "weekly_shift": "" },
      "risk_appetite": { "baseline": "", "friday": "", "weekly_shift": "" },
      "net_change": ""
    },
    "asset_class_summary": {
      "equities": { "weekly_bias": "", "highlights": "" },
      "crypto": { "weekly_bias": "", "highlights": "" },
      "bonds": { "weekly_bias": "", "highlights": "" },
      "commodities": { "weekly_bias": "", "highlights": "" },
      "forex": { "weekly_bias": "", "highlights": "" }
    },
    "thesis_review": [],
    "next_week_setup": { "key_events": [], "heading_in_bias": "", "primary_watch": "", "positions_to_review": [] },
    "key_takeaway": ""
  }
}
EOF

echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE to generate the weekly synthesis:"
echo "==========================================================="
echo "Generate a weekly market synthesis for $WEEK_LABEL."
echo ""
if [ -n "$BASELINE_FILE" ]; then
  echo "Read the weekly baseline:"
  echo "  $BASELINE_FILE"
  echo ""
fi
if [ -n "$DELTA_FILES" ]; then
  echo "Read delta files in order:"
  for f in $DELTA_FILES; do
    echo "  $f"
  done
  echo ""
fi
echo "Output template: $OUTPUT_FILE"
echo ""
echo "Fill in the weekly JSON payload (schema: templates/schemas/weekly-digest.schema.json)."
echo "Return JSON only. Do NOT write markdown."
echo "==========================================================="
echo ""
