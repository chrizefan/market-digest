#!/bin/bash
# status.sh — Show the health and status of the market-digest project at a glance
# Run this any time to see what's been done and what's pending

set -e

DATE=$(date +%Y-%m-%d)
WEEK=$(date +%V)
YEAR=$(date +%Y)

echo ""
echo "📊 Market Digest — Project Status"
echo "===================================="
echo "Date: $DATE | Week: W${WEEK}/${YEAR}"
echo ""

# Today's digest
echo "── Today's Digest ──────────────────"
if [ -f "outputs/daily/$DATE.md" ]; then
  SIZE=$(wc -l < "outputs/daily/$DATE.md")
  echo "  ✅ Complete: outputs/daily/$DATE.md ($SIZE lines)"
elif [ -f "outputs/daily/$DATE-SAMPLE.md" ]; then
  echo "  ⚠️  Only sample file exists — full digest not yet run"
else
  echo "  ❌ Not run — run ./scripts/new-day.sh to start"
fi

echo ""
echo "── Recent Daily Digests ─────────────"
RECENT=$(ls -t outputs/daily/*.md 2>/dev/null | grep -v SAMPLE | grep -v gitkeep | head -7)
if [ -z "$RECENT" ]; then
  echo "  No digests yet."
else
  for F in $RECENT; do
    FDATE=$(basename "$F" .md)
    LINES=$(wc -l < "$F" 2>/dev/null || echo "?")
    echo "  ✅ $FDATE ($LINES lines)"
  done
fi

echo ""
echo "── Weekly Rollup ────────────────────"
WEEKLY_FILE="outputs/weekly/${YEAR}-W${WEEK}.md"
if [ -f "$WEEKLY_FILE" ]; then
  echo "  ✅ W${WEEK} exists: $WEEKLY_FILE"
else
  echo "  ❌ W${WEEK} not generated — run ./scripts/weekly-rollup.sh (Fridays)"
fi

echo ""
echo "── Memory Files ─────────────────────"
for SEG in macro equity crypto bonds commodities forex; do
  FILE="memory/$SEG/ROLLING.md"
  ENTRIES=$(grep -c "^## 20" "$FILE" 2>/dev/null || echo "0")
  LAST=$(grep "^## 20" "$FILE" 2>/dev/null | tail -1 | sed 's/## //' || echo "no entries yet")
  echo "  $SEG: $ENTRIES entries | last: $LAST"
done

echo ""
echo "── Git Status ───────────────────────"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
LAST_COMMIT=$(git log -1 --format="%cr — %s" 2>/dev/null || echo "no commits")
echo "  Last commit: $LAST_COMMIT"
if [ "$UNCOMMITTED" -gt "0" ]; then
  echo "  ⚠️  $UNCOMMITTED uncommitted changes — run ./scripts/git-commit.sh"
else
  echo "  ✅ Working tree clean"
fi

echo ""
echo "── Active Theses ────────────────────"
THESES=$(awk '/## 📌 Current Portfolio Themes/,/^---/' config/preferences.md 2>/dev/null | grep "^\-" | wc -l | tr -d ' ')
echo "  $THESES active theses in config/preferences.md"
awk '/## 📌 Current Portfolio Themes/,/^---/' config/preferences.md 2>/dev/null | grep "^\-" | head -5 | sed 's/^/  /'

echo ""
echo "── Available Commands ───────────────"
echo "  ./scripts/new-day.sh              Start today's digest"
echo "  ./scripts/watchlist-check.sh      Quick watchlist scan"
echo "  ./scripts/thesis.sh review        Thesis health check"
echo "  ./scripts/thesis.sh add           Add a new thesis"
echo "  ./scripts/thesis.sh close         Close a thesis"
echo "  ./scripts/memory-search.sh [term] Search memory files"
echo "  ./scripts/weekly-rollup.sh        Generate weekly summary"
echo "  ./scripts/git-commit.sh           Commit all outputs"
echo ""
