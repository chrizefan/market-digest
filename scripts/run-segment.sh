#!/bin/bash
# run-segment.sh — Print the prompt to run a single named segment in Claude
# Usage: ./scripts/run-segment.sh [segment-name]
# Example:
#   ./scripts/run-segment.sh technology
#   ./scripts/run-segment.sh energy
#   ./scripts/run-segment.sh macro
#   ./scripts/run-segment.sh alt-data
#   ./scripts/run-segment.sh institutional

set -e

DATE=$(date +%Y-%m-%d)
SEGMENT=${1:-""}

if [ -z "$SEGMENT" ]; then
  echo "Usage: ./scripts/run-segment.sh [segment-name]"
  echo ""
  echo "Available segments:"
  echo "  Core:         macro | bonds | commodities | forex | crypto | international | equities"
  echo "  Alternative:  alt-data | cta | options | politician"
  echo "  Institutional: institutional | hedge-funds"
  echo "  Sectors:      technology | healthcare | energy | financials | consumer-staples"
  echo "                consumer-disc | industrials | utilities | materials | real-estate | comms"
  exit 1
fi

# Map segment name to skill file and output path
case "$SEGMENT" in
  macro)
    SKILL="skills/SKILL-macro.md"
    OUTPUT="outputs/daily/$DATE/macro.md"
    MEMORY="memory/macro/ROLLING.md"
    ;;
  bonds)
    SKILL="skills/SKILL-bonds.md"
    OUTPUT="outputs/daily/$DATE/bonds.md"
    MEMORY="memory/bonds/ROLLING.md"
    ;;
  commodities)
    SKILL="skills/SKILL-commodities.md"
    OUTPUT="outputs/daily/$DATE/commodities.md"
    MEMORY="memory/commodities/ROLLING.md"
    ;;
  forex)
    SKILL="skills/SKILL-forex.md"
    OUTPUT="outputs/daily/$DATE/forex.md"
    MEMORY="memory/forex/ROLLING.md"
    ;;
  crypto)
    SKILL="skills/SKILL-crypto.md"
    OUTPUT="outputs/daily/$DATE/crypto.md"
    MEMORY="memory/crypto/ROLLING.md"
    ;;
  international)
    SKILL="skills/SKILL-international.md"
    OUTPUT="outputs/daily/$DATE/international.md"
    MEMORY="memory/international/ROLLING.md"
    ;;
  equities)
    SKILL="skills/SKILL-equity.md"
    OUTPUT="outputs/daily/$DATE/equities.md"
    MEMORY="memory/equity/ROLLING.md"
    ;;
  alt-data|alternative-data|sentiment)
    SKILL="skills/alternative-data/SKILL-sentiment-news.md + SKILL-cta-positioning.md + SKILL-options-derivatives.md + SKILL-politician-signals.md"
    OUTPUT="outputs/daily/$DATE/alt-data.md"
    MEMORY="memory/alternative-data/{sentiment,cta-positioning,options,politician}/ROLLING.md"
    ;;
  institutional)
    SKILL="skills/institutional/SKILL-institutional-flows.md + SKILL-hedge-fund-intel.md"
    OUTPUT="outputs/daily/$DATE/institutional.md"
    MEMORY="memory/institutional/{flows,hedge-funds}/ROLLING.md"
    ;;
  technology|healthcare|energy|financials|consumer-staples|consumer-disc|industrials|utilities|materials|real-estate|comms)
    SKILL="skills/sectors/SKILL-sector-$SEGMENT.md"
    OUTPUT="outputs/daily/$DATE/sectors/$SEGMENT.md"
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
echo "🔄 Run Segment: $SEGMENT"
echo "========================="
echo ""
echo "📋 PASTE THIS INTO CLAUDE:"
echo ""
echo "---"
echo "Run a focused analysis for the '$SEGMENT' segment."
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
echo "---"
echo ""
