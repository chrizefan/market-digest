#!/bin/bash
# monthly-rollup.sh — Generate a monthly summary from weekly digests
# Run at end of each month

set -e

YEAR=$(date +%Y)
MONTH=$(date +%m)
MONTH_LABEL="${YEAR}-${MONTH}"
OUTPUT_FILE="outputs/monthly/${MONTH_LABEL}.md"

echo ""
echo "📆 Monthly Rollup — $MONTH_LABEL"
echo "=================================="

# Find this month's weekly files
WEEKLY_FILES=$(find outputs/weekly/ -name "${YEAR}-W*.md" | sort)

cat > "$OUTPUT_FILE" << EOF
# Monthly Market Digest — $MONTH_LABEL

> Monthly synthesis generated from weekly rollups.

---

## Monthly Bias Summary

| Segment | Monthly Trend | Key Level Change | Net Thesis |
|---------|--------------|-----------------|------------|
| Macro   |              |                 |            |
| Equities |             |                 |            |
| Crypto  |              |                 |            |
| Bonds   |              |                 |            |
| Commodities |          |                 |            |
| Forex   |              |                 |            |

---

## Major Themes This Month
-
-
-

## Thesis Evolution
[How did active theses evolve through the month — confirmed, challenged, closed, new]

## What Surprised the Market
[Unexpected developments that moved markets against consensus]

## Next Month Setup
[Key themes, events, and biases heading into next month]

---

## Weekly Digest Links
EOF

for f in $WEEKLY_FILES; do
  WEEK=$(basename "$f" .md)
  echo "- [$WEEK]($f)" >> "$OUTPUT_FILE"
done

echo ""
echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE to generate the monthly synthesis:"
echo "============================================================"
echo "Generate a monthly market synthesis for $MONTH_LABEL."
echo "Read outputs/monthly/$MONTH_LABEL.md and all the weekly digest files."
echo "Fill in all sections with a synthesis of the month's market evolution."
echo "============================================================"
echo ""
