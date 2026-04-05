#!/bin/bash
# weekly-rollup.sh — Generate a weekly summary from daily digest files
# Run at end of week (Friday or weekend)

set -e

# Get ISO week number and year
YEAR=$(date +%Y)
WEEK=$(date +%V)
WEEK_LABEL="${YEAR}-W${WEEK}"
OUTPUT_FILE="outputs/weekly/${WEEK_LABEL}.md"

# Find this week's daily files (Mon-Fri)
DAILY_FILES=$(find outputs/daily/ -name "*.md" -newer outputs/weekly/.gitkeep 2>/dev/null | sort || \
              find outputs/daily/ -name "$(date +%Y)*" | sort | tail -7)

echo ""
echo "📅 Weekly Rollup — $WEEK_LABEL"
echo "================================"

if [ -z "$DAILY_FILES" ]; then
  echo "⚠️  No daily files found for this week."
  exit 1
fi

echo "Daily files found:"
echo "$DAILY_FILES"
echo ""

# Create the weekly output file from template
cp "templates/weekly-digest.md" "$OUTPUT_FILE"
sed -i "s/{{WEEK_LABEL}}/$WEEK_LABEL/g" "$OUTPUT_FILE"
sed -i "s/{{WEEK}}/$WEEK/g" "$OUTPUT_FILE"
sed -i "s/{{YEAR}}/$YEAR/g" "$OUTPUT_FILE"
sed -i "s/{{TIMESTAMP}}/$(date '+%Y-%m-%d %H:%M %Z')/g" "$OUTPUT_FILE"

# Build the daily files list
DAILY_LIST=""
for f in $DAILY_FILES; do
  FDATE=$(basename "$f" .md)
  DAILY_LIST="$DAILY_LIST [$FDATE]($f)"
done

FIRST=$(echo "$DAILY_FILES" | sort | head -1 | xargs basename .md 2>/dev/null || echo "")
LAST=$(echo "$DAILY_FILES" | sort | tail -1 | xargs basename .md 2>/dev/null || echo "")
sed -i "s/{{DATE_RANGE}}/$FIRST to $LAST/g" "$OUTPUT_FILE"
sed -i "s/{{DAILY_FILE_LIST}}/$DAILY_LIST/g" "$OUTPUT_FILE"

echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE to generate the weekly synthesis:"
echo "==========================================================="
echo "Generate a weekly market synthesis for $WEEK_LABEL."
echo "Read outputs/weekly/$WEEK_LABEL.md and all linked daily digest files."
echo "Fill in the Weekly Bias Summary table and write the synthesis sections."
echo "==========================================================="
echo ""
