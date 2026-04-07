#!/bin/bash
# new-day.sh — Start a new market analysis day (v3 — three-tier cadence)
# Sunday = Weekly Baseline (full 9-phase run)
# Mon–Sat = Daily Delta (lightweight, ~70% fewer tokens)
# Run from the root of the digiquant-atlas repo each morning.

set -e

DATE=$(date +%Y-%m-%d)
YEAR=$(date +%Y)
WEEK=$(date +%V)
WEEK_LABEL="${YEAR}-W${WEEK}"
OUTPUT_DIR="outputs/daily/$DATE"
SECTORS="technology healthcare energy financials consumer-staples consumer-disc industrials utilities materials real-estate comms"

echo ""
echo "📊 digiquant-atlas — $DATE"
echo "================================"

# Atomically create the output directory — prevents TOCTOU race with parallel runs
if ! mkdir "$OUTPUT_DIR" 2>/dev/null; then
  echo "⚠️  Output directory for $DATE already exists: $OUTPUT_DIR"
  echo "   Delete it first if you want to regenerate."
  exit 1
fi

# Detect day of week: 1=Mon, 7=Sun (macOS/BSD date)
DOW=$(date +%u)

# ─────────────────────────────────────────────────────────────────────────────
# SUNDAY = WEEKLY BASELINE
# ─────────────────────────────────────────────────────────────────────────────
if [ "$DOW" -eq 7 ]; then
  echo "📅 Run Type: WEEKLY BASELINE (${WEEK_LABEL})"
  echo ""

  mkdir -p "$OUTPUT_DIR/sectors"
  mkdir -p "$OUTPUT_DIR/positions"

  # Write _meta.json
  cat > "$OUTPUT_DIR/_meta.json" << EOF
{
  "type": "baseline",
  "date": "${DATE}",
  "week": "${WEEK_LABEL}",
  "created": "$(date '+%Y-%m-%dT%H:%M:%S')"
}
EOF

  # Segment placeholder files
  for SEG in DIGEST macro bonds commodities forex crypto international alt-data institutional us-equities; do
    touch "$OUTPUT_DIR/${SEG}.md"
  done
  for SECTOR in $SECTORS; do
    touch "$OUTPUT_DIR/sectors/$SECTOR.md"
  done

  # Scaffold DIGEST.md from template
  cp "templates/master-digest.md" "$OUTPUT_DIR/DIGEST.md"
  sed -i "" "s/{{DATE}}/$DATE/g" "$OUTPUT_DIR/DIGEST.md"
  sed -i "" "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$OUTPUT_DIR/DIGEST.md"

  # Scaffold snapshot.json placeholder (agent will overwrite with real data in Phase 7)
  cat > "$OUTPUT_DIR/snapshot.json" << 'SNAPEOF'
{
  "schema_version": "1.0",
  "date": "PLACEHOLDER",
  "run_type": "baseline",
  "baseline_date": null,
  "regime": {},
  "positions": [],
  "theses": [],
  "market_data": {},
  "segment_biases": {},
  "actionable": [],
  "risks": []
}
SNAPEOF
  sed -i "" "s/\"PLACEHOLDER\"/\"$DATE\"/" "$OUTPUT_DIR/snapshot.json"

  echo "✅ Created BASELINE directory: $OUTPUT_DIR"
  echo "   Files: DIGEST.md + 10 segment files + 11 sector files + _meta.json"
  echo ""
  echo "📋 PASTE THIS INTO CLAUDE (digiquant-atlas project):"
  echo "=================================================="
  echo "Run the WEEKLY BASELINE digest for $DATE (${WEEK_LABEL})."
  echo ""
  echo "This is a Sunday — run the full 9-phase pipeline."
  echo "Start by reading skills/SKILL-weekly-baseline.md."
  echo ""
  echo "Key context:"
  echo "  - Output dir:  $OUTPUT_DIR"
  echo "  - Week label:  $WEEK_LABEL"
  echo "  - Meta:        $OUTPUT_DIR/_meta.json  (type: baseline)"
  echo "=================================================="

# ─────────────────────────────────────────────────────────────────────────────
# MON–SAT = DAILY DELTA
# ─────────────────────────────────────────────────────────────────────────────
else
  echo "📅 Run Type: DAILY DELTA"
  echo ""

  # Find this week's baseline by scanning backwards up to 6 days
  BASELINE_DATE=""
  for i in 1 2 3 4 5 6; do
    CHECK_DATE=$(date -v -${i}d +%Y-%m-%d 2>/dev/null)
    [ -z "$CHECK_DATE" ] && break
    META_FILE="outputs/daily/$CHECK_DATE/_meta.json"
    if [ -f "$META_FILE" ]; then
      META_TYPE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('type',''))" 2>/dev/null || echo "")
      if [ "$META_TYPE" = "baseline" ]; then
        BASELINE_DATE="$CHECK_DATE"
        break
      fi
    fi
  done

  # Count existing deltas this week (for delta numbering)
  DELTA_NUM=1
  if [ -n "$BASELINE_DATE" ]; then
    EXISTING=$(find outputs/daily -mindepth 2 -maxdepth 2 -name "_meta.json" | while read mf; do
      python3 -c "
import json
d=json.load(open('$mf'))
if d.get('type')=='delta' and d.get('week')=='$WEEK_LABEL':
    print('1')
" 2>/dev/null || true
    done | wc -l | tr -d ' ')
    DELTA_NUM=$((EXISTING + 1))
  fi

  if [ -z "$BASELINE_DATE" ]; then
    BASELINE_DATE="NOT FOUND"
    echo "⚠️  No baseline found for week ${WEEK_LABEL}."
    echo "   Run ./scripts/new-week.sh to force a baseline, then re-run this script."
    echo ""
  fi

  mkdir -p "$OUTPUT_DIR/deltas"
  mkdir -p "$OUTPUT_DIR/sectors"
  mkdir -p "$OUTPUT_DIR/positions"

  # Write _meta.json
  cat > "$OUTPUT_DIR/_meta.json" << EOF
{
  "type": "delta",
  "date": "${DATE}",
  "week": "${WEEK_LABEL}",
  "baseline": "${BASELINE_DATE}",
  "delta_number": ${DELTA_NUM},
  "created": "$(date '+%Y-%m-%dT%H:%M:%S')"
}
EOF

  # Create DIGEST.md placeholder (will be materialized by the agent)
  touch "$OUTPUT_DIR/DIGEST.md"

  # Scaffold snapshot.json placeholder (agent will overwrite with real data in Phase 7)
  cat > "$OUTPUT_DIR/snapshot.json" << SNAPEOF
{
  "schema_version": "1.0",
  "date": "${DATE}",
  "run_type": "delta",
  "baseline_date": "${BASELINE_DATE}",
  "regime": {},
  "positions": [],
  "theses": [],
  "market_data": {},
  "segment_biases": {},
  "actionable": [],
  "risks": []
}
SNAPEOF

  # Scaffold DIGEST-DELTA.md from template
  cp "templates/delta-digest.md" "$OUTPUT_DIR/DIGEST-DELTA.md"
  sed -i "" "s/{{DATE}}/$DATE/g" "$OUTPUT_DIR/DIGEST-DELTA.md"
  sed -i "" "s/{{BASELINE_DATE}}/$BASELINE_DATE/g" "$OUTPUT_DIR/DIGEST-DELTA.md"
  sed -i "" "s/{{WEEK_LABEL}}/$WEEK_LABEL/g" "$OUTPUT_DIR/DIGEST-DELTA.md"
  sed -i "" "s/{{DELTA_NUMBER}}/$DELTA_NUM/g" "$OUTPUT_DIR/DIGEST-DELTA.md"
  sed -i "" "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$OUTPUT_DIR/DIGEST-DELTA.md"

  echo "✅ Created DELTA directory: $OUTPUT_DIR"
  echo "   Files:        DIGEST.md (to materialize) + DIGEST-DELTA.md + deltas/ + sectors/"
  echo "   Delta #:      ${DELTA_NUM} this week (${WEEK_LABEL})"
  echo "   Baseline:     ${BASELINE_DATE}"
  echo ""
  echo "📋 PASTE THIS INTO CLAUDE (digiquant-atlas project):"
  echo "=================================================="
  echo "Run the DAILY DELTA digest for $DATE (${WEEK_LABEL}, Delta #${DELTA_NUM})."
  echo ""
  echo "This is a weekday — run in delta mode (not a full baseline run)."
  echo "Start by reading skills/SKILL-daily-delta.md."
  echo ""
  echo "Key context:"
  echo "  - Output dir:  $OUTPUT_DIR"
  echo "  - Baseline:    outputs/daily/${BASELINE_DATE}"
  echo "  - Delta #:     ${DELTA_NUM}"
  echo "  - Meta:        $OUTPUT_DIR/_meta.json  (type: delta)"
  echo "=================================================="
fi

echo ""
echo "After Claude completes: run ./scripts/git-commit.sh"
echo ""
