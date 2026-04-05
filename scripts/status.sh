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

# Today's digest (v2: check folder structure)
echo "── Today's Digest ──────────────────"
if [ -d "outputs/daily/$DATE" ]; then
  TOTAL_SEGS=22
  COMPLETED_SEGS=$(find "outputs/daily/$DATE" -name "*.md" -not -empty 2>/dev/null | wc -l | tr -d ' ')
  if [ -f "outputs/daily/$DATE/DIGEST.md" ] && [ -s "outputs/daily/$DATE/DIGEST.md" ]; then
    LINES=$(wc -l < "outputs/daily/$DATE/DIGEST.md")
    echo "  ✅ DIGEST.md complete ($LINES lines)"
  else
    echo "  ⏳ In progress: $COMPLETED_SEGS/$TOTAL_SEGS segment files have content"
  fi
  # Show segment completion
  echo "  Segments:"
  for SEG in macro bonds commodities forex crypto international equities alt-data institutional; do
    F="outputs/daily/$DATE/$SEG.md"
    if [ -f "$F" ] && [ -s "$F" ]; then
      echo "    ✅ $SEG"
    elif [ -f "$F" ]; then
      echo "    ⬜ $SEG (empty)"
    else
      echo "    ❌ $SEG (missing)"
    fi
  done
  # Show sector files
  SECTOR_DONE=$(find "outputs/daily/$DATE/sectors/" -name "*.md" -not -empty 2>/dev/null | wc -l | tr -d ' ')
  echo "  Sectors: $SECTOR_DONE/11 complete"
elif [ -f "outputs/daily/$DATE-SAMPLE.md" ]; then
  echo "  ⚠️  Only sample file exists — full digest not yet run"
else
  echo "  ❌ Not run — run ./scripts/new-day.sh to start"
fi

echo ""
echo "── Recent Daily Digests ─────────────"
RECENT=$(find outputs/daily -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -r | head -7)
if [ -z "$RECENT" ]; then
  # Check legacy flat files
  RECENT=$(ls -t outputs/daily/*.md 2>/dev/null | grep -v SAMPLE | grep -v gitkeep | head -7)
fi
if [ -z "$RECENT" ]; then
  echo "  No digests yet."
else
  for F in $RECENT; do
    FDATE=$(basename "$F")
    if [ -d "$F" ] && [ -f "$F/DIGEST.md" ]; then
      LINES=$(wc -l < "$F/DIGEST.md" 2>/dev/null || echo "?")
      echo "  ✅ $FDATE ($LINES lines)"
    elif [ -f "$F" ]; then
      LINES=$(wc -l < "$F" 2>/dev/null || echo "?")
      echo "  ✅ $FDATE ($LINES lines)"
    fi
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
echo "  Core segments:"
for SEG in macro equity crypto bonds commodities forex; do
  FILE="memory/$SEG/ROLLING.md"
  ENTRIES=$(grep -c "^## 20" "$FILE" 2>/dev/null || echo "0")
  LAST=$(grep "^## 20" "$FILE" 2>/dev/null | tail -1 | sed 's/## //' || echo "no entries yet")
  echo "    $SEG: $ENTRIES entries | last: $LAST"
done
echo "  International:"
FILE="memory/international/ROLLING.md"
ENTRIES=$(grep -c "^## 20" "$FILE" 2>/dev/null || echo "0")
echo "    international: $ENTRIES entries"
echo "  Sectors:"
for SECTOR in technology healthcare energy financials consumer industrials utilities materials real-estate comms; do
  FILE="memory/sectors/$SECTOR/ROLLING.md"
  ENTRIES=$(grep -c "^## 20" "$FILE" 2>/dev/null || echo "0")
  echo "    $SECTOR: $ENTRIES entries"
done
echo "  Alternative Data:"
for ALT in sentiment cta-positioning options politician; do
  FILE="memory/alternative-data/$ALT/ROLLING.md"
  ENTRIES=$(grep -c "^## 20" "$FILE" 2>/dev/null || echo "0")
  echo "    $ALT: $ENTRIES entries"
done
echo "  Institutional:"
for INST in flows hedge-funds; do
  FILE="memory/institutional/$INST/ROLLING.md"
  ENTRIES=$(grep -c "^## 20" "$FILE" 2>/dev/null || echo "0")
  echo "    $INST: $ENTRIES entries"
done

# Total memory files
TOTAL_MEM=$(find memory/ -name "ROLLING.md" 2>/dev/null | wc -l | tr -d ' ')
echo "  Total ROLLING.md files: $TOTAL_MEM"

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
echo "  ./scripts/new-day.sh              Start today's digest (creates folder + 22 files)"
echo "  ./scripts/run-segment.sh [name]   Run a single segment (e.g. energy, technology)"
echo "  ./scripts/combine-digest.sh       Combine segments into DIGEST.md"
echo "  ./scripts/watchlist-check.sh      Quick watchlist scan"
echo "  ./scripts/thesis.sh review        Thesis health check"
echo "  ./scripts/memory-search.sh [kw]   Search all memory files"
echo "  ./scripts/thesis.sh add           Add a new thesis"
echo "  ./scripts/thesis.sh close         Close a thesis"
echo "  ./scripts/memory-search.sh [term] Search memory files"
echo "  ./scripts/weekly-rollup.sh        Generate weekly summary"
echo "  ./scripts/git-commit.sh           Commit all outputs"
echo ""
