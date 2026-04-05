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

# Create the weekly output file
cat > "$OUTPUT_FILE" << EOF
# Weekly Market Digest — $WEEK_LABEL

> Auto-generated rollup of daily digests for week $WEEK, $YEAR.

---

## Week in Review

[To be filled by Claude — paste the daily digests below and ask for a weekly synthesis]

---

## Daily Digest Links
EOF

for f in $DAILY_FILES; do
  FDATE=$(basename "$f" .md)
  echo "- [$FDATE]($f)" >> "$OUTPUT_FILE"
done

cat >> "$OUTPUT_FILE" << EOF

---

## Weekly Bias Summary

| Segment | Mon | Tue | Wed | Thu | Fri | Weekly Trend |
|---------|-----|-----|-----|-----|-----|--------------|
| Macro   |     |     |     |     |     |              |
| Equities |    |     |     |     |     |              |
| Crypto  |     |     |     |     |     |              |
| Bonds   |     |     |     |     |     |              |
| Commodities |  |    |     |     |     |              |
| Forex   |     |     |     |     |     |              |

---

## Key Themes This Week
-
-
-

## Thesis Changes
-
-

## Next Week Setup
[What to watch heading into next week]

EOF

echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE to generate the weekly synthesis:"
echo "==========================================================="
echo "Generate a weekly market synthesis for $WEEK_LABEL."
echo "Read outputs/weekly/$WEEK_LABEL.md and all linked daily digest files."
echo "Fill in the Weekly Bias Summary table and write the synthesis sections."
echo "==========================================================="
echo ""
