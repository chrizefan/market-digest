#!/bin/bash
# new-week.sh — Force a weekly baseline run on any day (not just Sunday)
# Use when you want a fresh baseline mid-week, or when you missed Sunday's baseline
# Usage: ./scripts/new-week.sh [date]    (default: today)
#        ./scripts/new-week.sh 2026-04-08

set -e

# Cross-platform sed in-place (macOS BSD sed + GNU/Linux sed)
sedi() { sed -i.bak "$@" && rm -f "${@: -1}.bak"; }
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

DATE=${1:-$(date +%Y-%m-%d)}
YEAR=$(date +%Y)
WEEK=$(date +%V)
WEEK_LABEL="${YEAR}-W${WEEK}"
OUTPUT_DIR="outputs/daily/$DATE"

echo ""
echo "📅 New Week Baseline — $DATE"
echo "================================"

if [ -d "$OUTPUT_DIR" ]; then
  echo "⚠️  Output directory already exists: $OUTPUT_DIR"
  echo "   Delete it first if you want to regenerate."
  exit 1
fi

mkdir -p "$OUTPUT_DIR/sectors"

# Write _meta.json as baseline
cat > "$OUTPUT_DIR/_meta.json" << EOF
{
  "type": "baseline",
  "date": "${DATE}",
  "week": "${WEEK_LABEL}",
  "created": "$(date '+%Y-%m-%dT%H:%M:%S')",
  "note": "Manually forced baseline (non-Sunday)"
}
EOF

# Create all segment placeholder files
touch "$OUTPUT_DIR/macro.md"
touch "$OUTPUT_DIR/bonds.md"
touch "$OUTPUT_DIR/commodities.md"
touch "$OUTPUT_DIR/forex.md"
touch "$OUTPUT_DIR/crypto.md"
touch "$OUTPUT_DIR/international.md"
touch "$OUTPUT_DIR/alt-data.md"
touch "$OUTPUT_DIR/institutional.md"
touch "$OUTPUT_DIR/us-equities.md"

SECTORS="technology healthcare energy financials consumer-staples consumer-disc industrials utilities materials real-estate comms"
for SECTOR in $SECTORS; do
  touch "$OUTPUT_DIR/sectors/$SECTOR.md"
done

# Set up DIGEST.md from template
cp "templates/master-digest.md" "$OUTPUT_DIR/DIGEST.md"
sedi "s/{{DATE}}/$DATE/g" "$OUTPUT_DIR/DIGEST.md"
sedi "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$OUTPUT_DIR/DIGEST.md"

echo "✅ Created BASELINE directory: $OUTPUT_DIR"
echo "   _meta.json: type=baseline, week=${WEEK_LABEL}"
echo "   Files: DIGEST.md + 10 segment files + 11 sector files"
echo ""
echo "📋 PASTE THIS INTO CLAUDE (digiquant-atlas project):"
echo "=================================================="
echo "Run the WEEKLY BASELINE digest for $DATE (forced baseline — ${WEEK_LABEL})."
echo ""
echo "This is a forced baseline (non-Sunday). Run the full 9-phase pipeline."
echo "Start by reading skills/SKILL-weekly-baseline.md."
echo ""
echo "Key context:"
echo "  - Output dir: $OUTPUT_DIR"
echo "  - Week label: $WEEK_LABEL"
echo "  - Meta: $OUTPUT_DIR/_meta.json (type: baseline, forced)"
echo "=================================================="
echo ""
echo "After Claude completes: run ./scripts/git-commit.sh"
echo ""
