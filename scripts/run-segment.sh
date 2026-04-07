#!/bin/bash
# run-segment.sh — Print the prompt to run a single named segment in Claude
# Supports both baseline (full) and delta (lightweight) modes.
# Usage: ./scripts/run-segment.sh [segment-name]
#        ./scripts/run-segment.sh [segment-name] --delta    (force delta mode)
# Example:
#   ./scripts/run-segment.sh technology
#   ./scripts/run-segment.sh energy --delta
#   ./scripts/run-segment.sh macro

set -e

DATE=$(date +%Y-%m-%d)
SEGMENT=${1:-""}
MODE_FLAG=${2:-""}

if [[ "$SEGMENT" == '--help' || "$SEGMENT" == '-h' ]]; then
  echo "Usage: ./scripts/run-segment.sh [segment-name] [--delta]"
  echo ""
  echo "Available segments:"
  echo "  Core:         macro | bonds | commodities | forex | crypto | international | us-equities"
  echo "  Alternative:  alt-data | cta | options | politician"
  echo "  Institutional: institutional | hedge-funds"
  echo "  Sectors:      technology | healthcare | energy | financials | consumer-staples"
  echo "                consumer-disc | industrials | utilities | materials | real-estate | comms"
  echo ""
  echo "Flags:"
  echo "  --delta       Force delta mode (compare against baseline, only write if changed)"
  exit 0
fi

if [ -z "$SEGMENT" ]; then
  echo "Error: segment name required. Run with --help for usage."
  exit 1
fi

# ── Detect run mode ───────────────────────────────────────────────────────────
META_FILE="outputs/daily/$DATE/_meta.json"
RUN_TYPE="baseline"
BASELINE_DATE=""
if [ -f "$META_FILE" ]; then
  RUN_TYPE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('type','baseline'))" 2>/dev/null || echo "baseline")
  BASELINE_DATE=$(python3 -c "import json; d=json.load(open('$META_FILE')); print(d.get('baseline',''))" 2>/dev/null || echo "")
fi
# --delta flag overrides detection
[ "$MODE_FLAG" = "--delta" ] && RUN_TYPE="delta"

# ── Map segment name to skill file and output path ────────────────────────────
case "$SEGMENT" in
  macro)
    SKILL="skills/SKILL-macro.md"
    OUTPUT="outputs/daily/$DATE/macro.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/macro.delta.md"
    MEMORY="memory/macro/ROLLING.md"
    ;;
  bonds)
    SKILL="skills/SKILL-bonds.md"
    OUTPUT="outputs/daily/$DATE/bonds.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/bonds.delta.md"
    MEMORY="memory/bonds/ROLLING.md"
    ;;
  commodities)
    SKILL="skills/SKILL-commodities.md"
    OUTPUT="outputs/daily/$DATE/commodities.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/commodities.delta.md"
    MEMORY="memory/commodities/ROLLING.md"
    ;;
  forex)
    SKILL="skills/SKILL-forex.md"
    OUTPUT="outputs/daily/$DATE/forex.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/forex.delta.md"
    MEMORY="memory/forex/ROLLING.md"
    ;;
  crypto)
    SKILL="skills/SKILL-crypto.md"
    OUTPUT="outputs/daily/$DATE/crypto.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/crypto.delta.md"
    MEMORY="memory/crypto/ROLLING.md"
    ;;
  international)
    SKILL="skills/SKILL-international.md"
    OUTPUT="outputs/daily/$DATE/international.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/international.delta.md"
    MEMORY="memory/international/ROLLING.md"
    ;;
  us-equities|equities)
    SKILL="skills/SKILL-equity.md"
    OUTPUT="outputs/daily/$DATE/us-equities.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/us-equities.delta.md"
    MEMORY="memory/equity/ROLLING.md"
    ;;
  alt-data|alternative-data|sentiment)
    SKILL="skills/alternative-data/SKILL-sentiment-news.md + SKILL-cta-positioning.md + SKILL-options-derivatives.md + SKILL-politician-signals.md"
    OUTPUT="outputs/daily/$DATE/alt-data.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/alt-data.delta.md"
    MEMORY="memory/alternative-data/{sentiment,cta-positioning,options,politician}/ROLLING.md"
    ;;
  institutional)
    SKILL="skills/institutional/SKILL-institutional-flows.md + SKILL-hedge-fund-intel.md"
    OUTPUT="outputs/daily/$DATE/institutional.md"
    DELTA_OUTPUT="outputs/daily/$DATE/deltas/institutional.delta.md"
    MEMORY="memory/institutional/{flows,hedge-funds}/ROLLING.md"
    ;;
  technology|healthcare|energy|financials|consumer-staples|consumer-disc|industrials|utilities|materials|real-estate|comms)
    SKILL="skills/sectors/SKILL-sector-$SEGMENT.md"
    OUTPUT="outputs/daily/$DATE/sectors/$SEGMENT.md"
    DELTA_OUTPUT="outputs/daily/$DATE/sectors/$SEGMENT.delta.md"
    case "$SEGMENT" in
      consumer-staples|consumer-disc) MEMORY="memory/sectors/consumer/ROLLING.md" ;;
      real-estate) MEMORY="memory/sectors/real-estate/ROLLING.md" ;;
      *) MEMORY="memory/sectors/$SEGMENT/ROLLING.md" ;;
    esac
    ;;
  *)
    echo "❌ Unknown segment: $SEGMENT"
    echo "Run without arguments to see available segments."
    exit 1
    ;;
esac

echo ""
echo "🔄 Run Segment: $SEGMENT ($RUN_TYPE mode)"
echo "================================="
echo ""
echo "📋 PASTE THIS INTO CLAUDE:"
echo ""
echo "---"

if [ "$RUN_TYPE" = "delta" ]; then
  echo "Run a DELTA analysis for the '$SEGMENT' segment."
  echo ""
  echo "Date: $DATE"
  echo "Mode: Delta (compare against baseline — only write delta file if material change)"
  echo "Baseline: outputs/daily/${BASELINE_DATE:-'[find via _meta.json]'}"
  echo "Skill: $SKILL"
  echo "Delta output: $DELTA_OUTPUT (use templates/delta-segment.md)"
  echo "Update memory: $MEMORY"
  echo ""
  echo "Instructions:"
  echo "1. Read $MEMORY (last entry for context)"
  echo "2. Read baseline: outputs/daily/${BASELINE_DATE:-'[baseline]'}/${SEGMENT}.md (or equivalent)"
  echo "3. Fetch today's live data for $SEGMENT"
  echo "4. Compare: did anything change materially vs baseline?"
  echo "5. If yes: write $DELTA_OUTPUT using templates/delta-segment.md"
  echo "   If no material change: note 'carried forward' and skip writing the file"
  echo "6. Update $MEMORY with today's bullets"
else
  echo "Run a full analysis for the '$SEGMENT' segment."
  echo ""
  echo "Date: $DATE"
  echo "Skill: $SKILL"
  echo "Save output to: $OUTPUT"
  echo "Update memory: $MEMORY"
  echo ""
  echo "Before running:"
  echo "- Read config/watchlist.md and config/preferences.md"
  echo "- Read $MEMORY (last 3 entries for context)"
  echo ""
  echo "Follow $SKILL exactly."
  echo "After analysis, update $MEMORY with today's bullets."
fi
echo "---"
echo ""
