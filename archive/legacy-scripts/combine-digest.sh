#!/bin/bash
# combine-digest.sh — Print the prompt to synthesize segments into DIGEST.md
# Supports both baseline (full synthesis) and delta (materialization) modes.
# Usage: ./scripts/combine-digest.sh [date]
#        ./scripts/combine-digest.sh                (uses today's date)
#        ./scripts/combine-digest.sh 2026-04-06     (specific date)

set -e
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

DATE=${1:-$(date +%Y-%m-%d)}
OUTPUT_DIR="data/agent-cache/daily/$DATE"
META_FILE="$OUTPUT_DIR/_meta.json"
DIGEST_FILE="$OUTPUT_DIR/DIGEST.md"

echo ""
echo "📋 Combine Digest — $DATE"
echo "=========================="

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "❌ Output directory not found: $OUTPUT_DIR"
  echo "   Run ./scripts/new-day.sh first to create the structure."
  exit 1
fi

# ── Detect run type from _meta.json ──────────────────────────────────────────
RUN_TYPE="baseline"  # default for legacy folders
BASELINE_DATE=""
if [ -f "$META_FILE" ]; then
  RUN_TYPE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('type','baseline'))" 2>/dev/null || echo "baseline")
  BASELINE_DATE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('baseline',''))" 2>/dev/null || echo "")
fi

echo "Run type: $RUN_TYPE"
echo ""

# ── DELTA MODE: print materialization prompt ──────────────────────────────────
if [ "$RUN_TYPE" = "delta" ]; then
  echo "ℹ️  Delta mode detected — running materialize prompt."
  echo "   (Use ./scripts/materialize.sh for more detail)"
  echo ""
  exec ./scripts/materialize.sh "$DATE"
  exit 0
fi

# ── BASELINE MODE: full synthesis prompt ─────────────────────────────────────
# Count non-empty segment files
TOTAL=$(find "$OUTPUT_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
COMPLETE=$(find "$OUTPUT_DIR" -name "*.md" -not -empty 2>/dev/null | wc -l | tr -d ' ')
SECTOR_COUNT=$(find "$OUTPUT_DIR/sectors/" -name "*.md" -not -empty 2>/dev/null | wc -l | tr -d ' ')

echo "Segment files: $COMPLETE/$TOTAL have content"
echo "Sectors complete: $SECTOR_COUNT/11"

if [ "$COMPLETE" -lt "5" ]; then
  echo ""
  echo "⚠️  WARNING: Very few segments have content. Consider running more segments first."
  echo "   Continue anyway? (y/N)"
  read -r CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo ""
echo "📋 PASTE THIS INTO CLAUDE:"
echo ""
echo "---"
echo "Synthesize all segment analyses into the master DIGEST.md for $DATE."
echo ""
echo "Segment files to read and synthesize:"
for SEG in macro bonds commodities forex crypto international us-equities alt-data institutional; do
  F="$OUTPUT_DIR/$SEG.md"
  if [ -f "$F" ] && [ -s "$F" ]; then
    echo "  ✅ $OUTPUT_DIR/$SEG.md"
  else
    echo "  ⬜ $OUTPUT_DIR/$SEG.md (empty — skip or note as unavailable)"
  fi
done
echo "  Sectors:"
for SECTOR in technology healthcare energy financials consumer-staples consumer-disc industrials utilities materials real-estate comms; do
  F="$OUTPUT_DIR/sectors/$SECTOR.md"
  if [ -f "$F" ] && [ -s "$F" ]; then
    echo "    ✅ $OUTPUT_DIR/sectors/$SECTOR.md"
  else
    echo "    ⬜ $OUTPUT_DIR/sectors/$SECTOR.md (empty)"
  fi
done
echo ""
echo "DB-first: produce snapshot JSON (templates/digest-snapshot-schema.json) and publish via scripts/materialize_snapshot.py"
echo "Markdown digest is rendered from JSON and stored in Supabase documents."
echo ""
echo "Include all required sections from the template:"
echo "- Market Regime Snapshot"
echo "- Macro & Events"
echo "- Equities + breadth + factors"
echo "- Crypto"
echo "- Bonds & Rates"
echo "- Commodities"
echo "- Forex"
echo "- International Markets"
echo "- Alternative Data Dashboard"
echo "- Institutional Intelligence"
echo "- Sector Scorecard (11 sectors)"
echo "- Thesis Tracker"
echo "- Portfolio Positioning Recommendations"
echo "- Actionable Summary (top 5)"
echo "- Risk Radar (top 3)"
echo "---"
echo ""
