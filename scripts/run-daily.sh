#!/bin/bash
# run-daily.sh — Single-command daily pipeline launcher
# Creates today's output folder (if needed) and prints the cowork prompt.
#
# Usage:
#   ./scripts/run-daily.sh            # Normal: auto-detect baseline vs delta
#   ./scripts/run-daily.sh --baseline # Force baseline mode (any day)
#   ./scripts/run-daily.sh --dry-run  # Show what would happen without creating files
#
# For Claude Cowork scheduled tasks, use: scripts/cowork-daily-prompt.txt
# This script handles the folder scaffolding that the cowork prompt assumes exists.

set -e

DATE=$(date +%Y-%m-%d)
DOW=$(date +%u)
OUTPUT_DIR="outputs/daily/$DATE"
FORCE_BASELINE=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --baseline) FORCE_BASELINE=true ;;
    --dry-run)  DRY_RUN=true ;;
  esac
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  digiquant-atlas — $DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Determine run type ──────────────────────────────────────────────
if [ "$FORCE_BASELINE" = true ] || [ "$DOW" -eq 7 ]; then
  RUN_TYPE="baseline"
else
  RUN_TYPE="delta"
fi

echo "  Run type: $(echo $RUN_TYPE | tr '[:lower:]' '[:upper:]')"

# ── Step 2: Create output folder (skip if exists) ──────────────────────────
if [ -d "$OUTPUT_DIR" ]; then
  echo "  Folder:   $OUTPUT_DIR (exists)"
  # Read existing meta
  if [ -f "$OUTPUT_DIR/_meta.json" ]; then
    EXISTING_TYPE=$(python3 -c "import json; print(json.load(open('$OUTPUT_DIR/_meta.json')).get('type','unknown'))" 2>/dev/null || echo "unknown")
    echo "  Meta:     type=$EXISTING_TYPE"
    RUN_TYPE="$EXISTING_TYPE"
  fi
elif [ "$DRY_RUN" = true ]; then
  echo "  [dry-run] Would create: $OUTPUT_DIR"
else
  # Create via new-day.sh (handles folder structure, _meta.json, templates)
  if [ "$FORCE_BASELINE" = true ]; then
    ./scripts/new-week.sh > /dev/null 2>&1 || ./scripts/new-day.sh > /dev/null 2>&1
  else
    ./scripts/new-day.sh > /dev/null 2>&1
  fi
  echo "  Folder:   $OUTPUT_DIR (created)"
fi

# ── Step 3: Gather context for display ──────────────────────────────────────
if [ "$RUN_TYPE" = "delta" ] && [ -f "$OUTPUT_DIR/_meta.json" ]; then
  BASELINE_DATE=$(python3 -c "import json; print(json.load(open('$OUTPUT_DIR/_meta.json')).get('baseline','?'))" 2>/dev/null || echo "?")
  DELTA_NUM=$(python3 -c "import json; print(json.load(open('$OUTPUT_DIR/_meta.json')).get('delta_number','?'))" 2>/dev/null || echo "?")
  echo "  Baseline: $BASELINE_DATE"
  echo "  Delta #:  $DELTA_NUM"
fi

# ── Step 4: Sync repo ──────────────────────────────────────────────────────
if [ "$DRY_RUN" = false ]; then
  echo ""
  echo "  Syncing repo..."
  git checkout master > /dev/null 2>&1 || true
  git pull origin master > /dev/null 2>&1 || echo "  (pull skipped — offline or no remote)"
fi

# ── Step 5: Health check ───────────────────────────────────────────────────
echo ""
MISSING_MEMORY=0
for f in memory/macro/ROLLING.md memory/equity/ROLLING.md memory/crypto/ROLLING.md \
         memory/bonds/ROLLING.md memory/commodities/ROLLING.md memory/forex/ROLLING.md \
         memory/international/ROLLING.md memory/portfolio/ROLLING.md memory/THESES.md \
         memory/BIAS-TRACKER.md; do
  [ ! -f "$f" ] && MISSING_MEMORY=$((MISSING_MEMORY + 1))
done
if [ "$MISSING_MEMORY" -gt 0 ]; then
  echo "  ⚠️  $MISSING_MEMORY core memory files missing"
else
  echo "  ✅ Core memory files: OK"
fi

[ -f "config/portfolio.json" ] && echo "  ✅ Portfolio config: OK" || echo "  ⚠️  config/portfolio.json missing"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ready. Pipeline entry point:"
echo ""
if [ "$RUN_TYPE" = "baseline" ]; then
  echo "  → skills/SKILL-weekly-baseline.md"
else
  echo "  → skills/SKILL-daily-delta.md"
fi
echo ""
echo "  Phase validation:  ./scripts/validate-phase.sh <phase>"
echo "  Full validation:   ./scripts/validate-phase.sh --all"
echo "  Quick summary:     ./scripts/validate-phase.sh --summary"
echo "  Cowork prompt:     scripts/cowork-daily-prompt.txt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
