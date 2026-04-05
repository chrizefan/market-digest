#!/bin/bash
# new-day.sh — Start a new market analysis day
# Run this from the root of the market-digest repo each morning

set -e

DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="outputs/daily/$DATE.md"
TEMPLATE="templates/master-digest.md"

echo ""
echo "📊 Market Digest — $DATE"
echo "================================"

# Check if today's output already exists
if [ -f "$OUTPUT_FILE" ]; then
  echo "⚠️  Output for $DATE already exists: $OUTPUT_FILE"
  echo "   Delete it first if you want to regenerate."
  exit 1
fi

# Create today's output file from template
cp "$TEMPLATE" "$OUTPUT_FILE"
# Replace placeholder dates
sed -i "s/{{DATE}}/$DATE/g" "$OUTPUT_FILE"
sed -i "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$OUTPUT_FILE"

echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE (market-digest project):"
echo "=================================================="
echo ""
echo "Run today's market digest for $DATE."
echo ""
echo "Read the following files first:"
echo "- config/watchlist.md"
echo "- config/preferences.md"  
echo "- memory/macro/ROLLING.md"
echo "- memory/equity/ROLLING.md"
echo "- memory/crypto/ROLLING.md"
echo "- memory/bonds/ROLLING.md"
echo "- memory/commodities/ROLLING.md"
echo "- memory/forex/ROLLING.md"
echo ""
echo "Then run the full digest pipeline per skills/SKILL-digest.md."
echo "Output date: $DATE"
echo "=================================================="
echo ""
echo "After Claude completes: run ./scripts/git-commit.sh"
echo ""
