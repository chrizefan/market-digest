#!/bin/bash
# new-day.sh — Start a new market analysis day (v2 — 7-phase orchestrator)
# Run this from the root of the market-digest repo each morning

set -e

DATE=$(date +%Y-%m-%d)
OUTPUT_DIR="outputs/daily/$DATE"
DIGEST_FILE="$OUTPUT_DIR/DIGEST.md"
TEMPLATE="templates/master-digest.md"

echo ""
echo "📊 Market Digest — $DATE"
echo "================================"

# Check if today's output already exists
if [ -d "$OUTPUT_DIR" ]; then
  echo "⚠️  Output directory for $DATE already exists: $OUTPUT_DIR"
  echo "   Delete it first if you want to regenerate."
  exit 1
fi

# Create folder structure
mkdir -p "$OUTPUT_DIR/sectors"

# Create segment output files (empty placeholders)
touch "$OUTPUT_DIR/DIGEST.md"
touch "$OUTPUT_DIR/macro.md"
touch "$OUTPUT_DIR/bonds.md"
touch "$OUTPUT_DIR/commodities.md"
touch "$OUTPUT_DIR/forex.md"
touch "$OUTPUT_DIR/crypto.md"
touch "$OUTPUT_DIR/international.md"
touch "$OUTPUT_DIR/alt-data.md"
touch "$OUTPUT_DIR/institutional.md"
touch "$OUTPUT_DIR/equities.md"

# Sector sub-agent output files
SECTORS="technology healthcare energy financials consumer-staples consumer-disc industrials utilities materials real-estate comms"
for SECTOR in $SECTORS; do
  touch "$OUTPUT_DIR/sectors/$SECTOR.md"
done

# Set up master DIGEST.md from template
cp "$TEMPLATE" "$DIGEST_FILE"
sed -i "" "s/{{DATE}}/$DATE/g" "$DIGEST_FILE"
sed -i "" "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$DIGEST_FILE"

echo "✅ Created output directory: $OUTPUT_DIR"
echo "✅ Created DIGEST.md + 10 segment files + 11 sector files"
echo ""
echo "📋 PASTE THIS INTO CLAUDE (market-digest project):"
echo "=================================================="
cat scripts/cowork-daily-prompt.txt | sed "s/{current_date}/$DATE/g"
echo ""
echo "=================================================="
echo ""
echo "After Claude completes: run ./scripts/git-commit.sh"
echo ""
