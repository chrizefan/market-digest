#!/bin/bash
# status.sh — Show the health and status of the digiquant-atlas project at a glance
# v3: Understands three-tier cadence (baseline + deltas)

set -e

DATE=$(date +%Y-%m-%d)
WEEK=$(date +%V)
YEAR=$(date +%Y)
WEEK_LABEL="${YEAR}-W${WEEK}"

echo ""
echo "📊 digiquant-atlas — Project Status"
echo "===================================="
echo "Date: $DATE | Week: ${WEEK_LABEL}"
echo ""

# ── This week's cadence status ───────────────────────────────────────────────
echo "── This Week's Cadence (${WEEK_LABEL}) ──────────"

WEEK_BASELINE_DATE=""
WEEK_DELTA_COUNT=0
WEEK_DELTA_DATES=""

for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    META_WEEK=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('week',''))" 2>/dev/null || echo "")
    if [ "$META_WEEK" = "$WEEK_LABEL" ]; then
      if [ "$META_TYPE" = "baseline" ]; then
        WEEK_BASELINE_DATE=$(basename "$dir")
      elif [ "$META_TYPE" = "delta" ]; then
        WEEK_DELTA_COUNT=$((WEEK_DELTA_COUNT + 1))
        WEEK_DELTA_DATES="$WEEK_DELTA_DATES $(basename $dir)"
      fi
    fi
  fi
done

if [ -n "$WEEK_BASELINE_DATE" ]; then
  echo "  ✅ Baseline: $WEEK_BASELINE_DATE"
else
  echo "  ❌ No baseline for ${WEEK_LABEL} — run ./scripts/new-week.sh (or new-day.sh on Sunday)"
fi

if [ "$WEEK_DELTA_COUNT" -gt 0 ]; then
  echo "  ✅ Deltas:  $WEEK_DELTA_COUNT days — ${WEEK_DELTA_DATES}"
else
  echo "  ⬜ Deltas:  0 (baseline day only)"
fi

echo ""

# ── Today's output ────────────────────────────────────────────────────────────
echo "── Today's Output ──────────────────"
TODAY_META="outputs/daily/$DATE/_meta.json"
if [ -d "outputs/daily/$DATE" ]; then
  if [ -f "$TODAY_META" ]; then
    TODAY_TYPE=$(python3 -c "import json; d=json.load(open('$TODAY_META')); print(d.get('type','?'))" 2>/dev/null || echo "?")
    TODAY_BASELINE=$(python3 -c "import json; d=json.load(open('$TODAY_META')); print(d.get('baseline','n/a'))" 2>/dev/null || echo "n/a")
    TODAY_DELTA_NUM=$(python3 -c "import json; d=json.load(open('$TODAY_META')); print(d.get('delta_number',''))" 2>/dev/null || echo "")
    if [ "$TODAY_TYPE" = "baseline" ]; then
      echo "  Type: WEEKLY BASELINE"
    elif [ "$TODAY_TYPE" = "delta" ]; then
      echo "  Type: DAILY DELTA #${TODAY_DELTA_NUM} (baseline: $TODAY_BASELINE)"
    fi
  fi

  if [ -f "outputs/daily/$DATE/DIGEST.md" ] && [ -s "outputs/daily/$DATE/DIGEST.md" ]; then
    LINES=$(wc -l < "outputs/daily/$DATE/DIGEST.md")
    echo "  ✅ DIGEST.md complete ($LINES lines)"
  else
    COMPLETED_SEGS=$(find "outputs/daily/$DATE" -name "*.md" -not -empty 2>/dev/null | wc -l | tr -d ' ')
    echo "  ⏳ In progress: $COMPLETED_SEGS segment/delta files have content"
  fi

  # Show segment completion (baseline mode)
  if [ -z "$TODAY_TYPE" ] || [ "$TODAY_TYPE" = "baseline" ]; then
    echo "  Segments:"
    for SEG in macro bonds commodities forex crypto international us-equities alt-data institutional; do
      F="outputs/daily/$DATE/$SEG.md"
      if [ -f "$F" ] && [ -s "$F" ]; then echo "    ✅ $SEG"
      elif [ -f "$F" ]; then echo "    ⬜ $SEG (empty)"
      else echo "    ❌ $SEG (missing)"
      fi
    done
    SECTOR_DONE=$(find "outputs/daily/$DATE/sectors/" -name "*.md" -not -empty 2>/dev/null | wc -l | tr -d ' ')
    echo "  Sectors: $SECTOR_DONE/11 complete"
  fi

  # Show delta files (delta mode)
  if [ "$TODAY_TYPE" = "delta" ]; then
    DELTA_FILES=$(find "outputs/daily/$DATE/deltas/" -name "*.delta.md" 2>/dev/null | wc -l | tr -d ' ')
    SECTOR_DELTAS=$(find "outputs/daily/$DATE/sectors/" -name "*.delta.md" 2>/dev/null | wc -l | tr -d ' ')
    echo "  Segment deltas: $DELTA_FILES written"
    echo "  Sector deltas:  $SECTOR_DELTAS written"
    if [ -f "outputs/daily/$DATE/DIGEST-DELTA.md" ] && [ -s "outputs/daily/$DATE/DIGEST-DELTA.md" ]; then
      echo "  ✅ DIGEST-DELTA.md written"
    else
      echo "  ⬜ DIGEST-DELTA.md (not yet written)"
    fi
  fi
else
  echo "  ❌ Not run — run ./scripts/new-day.sh to start"
fi

echo ""
echo "── Recent Daily Outputs ─────────────"
RECENT=$(find outputs/daily -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -r | head -7)
if [ -z "$RECENT" ]; then
  echo "  No outputs yet."
else
  for F in $RECENT; do
    FDATE=$(basename "$F")
    META="$F/_meta.json"
    if [ -f "$META" ]; then
      FTYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type','?'))" 2>/dev/null || echo "?")
      FNUM=$(python3 -c "import json; d=json.load(open('$META')); print('Δ'+str(d.get('delta_number','')) if d.get('type')=='delta' else '')" 2>/dev/null || echo "")
    else
      FTYPE="(legacy)"
      FNUM=""
    fi
    if [ -f "$F/DIGEST.md" ] && [ -s "$F/DIGEST.md" ]; then
      LINES=$(wc -l < "$F/DIGEST.md" 2>/dev/null || echo "?")
      echo "  ✅ $FDATE [$FTYPE$FNUM] ($LINES lines)"
    elif [ -f "$F/DIGEST-DELTA.md" ] && [ -s "$F/DIGEST-DELTA.md" ]; then
      echo "  🔄 $FDATE [$FTYPE$FNUM] (delta written, digest pending)"
    else
      echo "  ⏳ $FDATE [$FTYPE$FNUM] (in progress)"
    fi
  done
fi

echo ""
echo "── Weekly Rollup ────────────────────"
WEEKLY_FILE="outputs/weekly/${WEEK_LABEL}.md"
if [ -f "$WEEKLY_FILE" ]; then
  echo "  ✅ ${WEEK_LABEL} exists: $WEEKLY_FILE"
else
  echo "  ❌ ${WEEK_LABEL} not generated — run ./scripts/weekly-rollup.sh (Fridays)"
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
echo "  ./scripts/new-day.sh              Start today's digest (auto-detects baseline vs delta)"
echo "  ./scripts/new-week.sh             Force a baseline run (non-Sunday)"
echo "  ./scripts/run-segment.sh [name]   Run a single segment (e.g. energy, technology)"
echo "  ./scripts/run-segment.sh [name] --delta   Run segment in delta mode"
echo "  ./scripts/combine-digest.sh       Combine segments into DIGEST.md (auto-detects mode)"
echo "  ./scripts/materialize.sh          Materialize DIGEST.md from baseline + deltas"
echo "  ./scripts/watchlist-check.sh      Quick watchlist scan"
echo "  ./scripts/thesis.sh review        Thesis health check"
echo "  ./scripts/memory-search.sh [kw]   Search all memory files"
echo "  ./scripts/weekly-rollup.sh        Generate weekly summary"
echo "  ./scripts/monthly-rollup.sh       Generate monthly summary"
echo "  ./scripts/git-commit.sh           Commit all outputs"
echo ""
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
