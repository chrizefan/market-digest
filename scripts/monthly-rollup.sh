#!/bin/bash
# monthly-rollup.sh — Generate a monthly summary from weekly baselines + daily deltas
# Run at end of each month (last trading day or weekend)
# v3: Understands three-tier cadence (baselines + deltas + weekly rollups)

set -e

# Cross-platform sed in-place (macOS BSD sed + GNU/Linux sed)
sedi() { sed -i.bak "$@" && rm -f "${@: -1}.bak"; }
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

YEAR=$(date +%Y)
MONTH=$(date +%m)
MONTH_LABEL="${YEAR}-${MONTH}"
OUTPUT_FILE="outputs/monthly/${MONTH_LABEL}.json"

echo ""
echo "📆 Monthly Rollup — $MONTH_LABEL"
echo "=================================="

mkdir -p "outputs/monthly"

# ── Find this month's weekly baselines ───────────────────────────────────────
BASELINES=""
BASELINE_COUNT=0
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-${MONTH}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    if [ "$META_TYPE" = "baseline" ]; then
      BASELINES="$BASELINES $dir/DIGEST.md"
      BASELINE_COUNT=$((BASELINE_COUNT + 1))
    fi
  fi
done

# ── Find this month's daily deltas ───────────────────────────────────────────
DELTAS=""
DELTA_COUNT=0
for dir in $(find outputs/daily -mindepth 1 -maxdepth 1 -type d -name "${YEAR}-${MONTH}-*" | sort); do
  META="$dir/_meta.json"
  if [ -f "$META" ]; then
    META_TYPE=$(python3 -c "import json; d=json.load(open('$META')); print(d.get('type',''))" 2>/dev/null || echo "")
    if [ "$META_TYPE" = "delta" ] && [ -f "$dir/DIGEST-DELTA.md" ]; then
      DELTAS="$DELTAS $dir/DIGEST-DELTA.md"
      DELTA_COUNT=$((DELTA_COUNT + 1))
    fi
  fi
done

# ── Find this month's weekly rollup files ────────────────────────────────────
WEEKLY_FILES=$(find outputs/weekly/ -name "${YEAR}-W*.json" 2>/dev/null | sort)
WEEK_COUNT=$(echo "$WEEKLY_FILES" | grep -c "." 2>/dev/null || echo "0")

# ── Status report ─────────────────────────────────────────────────────────────
echo "  Baselines found:       $BASELINE_COUNT"
echo "  Delta days found:      $DELTA_COUNT"
echo "  Weekly rollups found:  $WEEK_COUNT"
echo ""

if [ "$BASELINE_COUNT" -eq 0 ] && [ "$DELTA_COUNT" -eq 0 ]; then
  echo "⚠️  No files found for $MONTH_LABEL."
  echo "   Ensure at least some baseline or delta runs exist for this month."
  exit 1
fi

# ── Create JSON artifact scaffold ────────────────────────────────────────────
MONTH_NAME=$(date -jf "%Y-%m" "${YEAR}-${MONTH}" "+%B %Y" 2>/dev/null || echo "$MONTH_LABEL")
MONTH_END=$(python3 - <<'PY'
import calendar, datetime
now = datetime.date.today()
y, m = now.year, now.month
last = calendar.monthrange(y, m)[1]
print(datetime.date(y, m, last).isoformat())
PY
)
cat > "$OUTPUT_FILE" << EOF
{
  "schema_version": "1.0",
  "doc_type": "monthly_digest",
  "date": "${MONTH_END}",
  "month_label": "${MONTH_LABEL}",
  "meta": {
    "generated_at": "$(date '+%Y-%m-%d %H:%M %Z')",
    "sources": {
      "weekly_dates": [],
      "delta_dates": []
    },
    "tags": []
  },
  "body": {
    "month_in_review": "",
    "regime_summary": {
      "growth": { "start": "", "end": "", "trend": "" },
      "inflation": { "start": "", "end": "", "trend": "" },
      "policy": { "start": "", "end": "", "trend": "" },
      "risk_appetite": { "start": "", "end": "", "trend": "" }
    },
    "regime_shifts": {
      "growth": { "month_start": "", "month_end": "", "shift_count": null, "net_direction": "" },
      "inflation": { "month_start": "", "month_end": "", "shift_count": null, "net_direction": "" },
      "policy": { "month_start": "", "month_end": "", "shift_count": null, "net_direction": "" },
      "risk_appetite": { "month_start": "", "month_end": "", "shift_count": null, "net_direction": "" },
      "critical_inflections": [],
      "stability_note": ""
    },
    "delta_efficiency": {
      "weekly_baselines": ${BASELINE_COUNT},
      "delta_days": ${DELTA_COUNT},
      "avg_segments_changed": null,
      "high_activity_days": null,
      "quiet_days": null,
      "token_savings_estimate_pct": null
    },
    "asset_classes": {
      "equities": { "narrative": "" },
      "crypto": { "narrative": "" },
      "bonds": { "narrative": "" },
      "commodities": { "narrative": "" },
      "forex": { "narrative": "" },
      "international": { "narrative": "" }
    },
    "thesis_review": [],
    "next_month_setup": "",
    "key_learning": "",
    "reading_list": []
  }
}
EOF

echo "✅ Created: $OUTPUT_FILE"
echo ""
echo "📋 PASTE THIS INTO CLAUDE to generate the monthly synthesis:"
echo "============================================================"
echo "Generate a monthly market synthesis for $MONTH_LABEL ($MONTH_NAME)."
echo ""
echo "Start by reading skills/monthly-synthesis/SKILL.md for full instructions."
echo ""
echo "Source files:"
echo "  $BASELINE_COUNT weekly baseline(s), $DELTA_COUNT delta day(s), $WEEK_COUNT weekly rollup(s)"
echo "  Full list in: $OUTPUT_FILE (see Source Files section)"
echo ""
echo "Output: $OUTPUT_FILE"
echo ""
echo "Fill in the monthly JSON payload (schema: templates/schemas/monthly-digest.schema.json)."
echo "Return JSON only. Do NOT write markdown."
echo "============================================================"
echo ""
