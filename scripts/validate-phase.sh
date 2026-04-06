#!/bin/bash
# validate-phase.sh — Validate outputs after each pipeline phase before proceeding
#
# Usage:
#   ./scripts/validate-phase.sh <phase> [date]     # Validate a specific phase
#   ./scripts/validate-phase.sh --all [date]        # Validate all phases in order
#   ./scripts/validate-phase.sh --summary [date]    # Quick pass/fail for all phases
#
# Phases (baseline): preflight 1 2 3 4 5 7 7b 7c 7d 8 9
# Phases (delta):    preflight 1 2 3 4 5 7 7b 7c 7d 8 9
#
# Exit codes:
#   0 = All checks passed
#   1 = One or more checks failed (blocks pipeline)
#   2 = Warnings only (non-blocking, but should be reviewed)

set +e  # Don't exit on error — we collect failures and report at end

DATE="${2:-$(date +%Y-%m-%d)}"
OUTPUT_DIR="outputs/daily/$DATE"
PHASE="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
MIN_LINES=5  # Minimum lines for a "real" output file (not just a template stub)

# ── Helpers ─────────────────────────────────────────────────────────────────

pass() {
  echo -e "  ${GREEN}✅ PASS${NC}: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "  ${RED}❌ FAIL${NC}: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
  echo -e "  ${YELLOW}⚠️  WARN${NC}: $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

# Check file exists and has content (more than MIN_LINES lines)
check_file() {
  local file="$1"
  local label="${2:-$file}"
  local min="${3:-$MIN_LINES}"

  if [ ! -f "$file" ]; then
    fail "$label — file missing"
    return 1
  fi

  local lines
  lines=$(wc -l < "$file" | tr -d ' ')
  if [ "$lines" -lt "$min" ]; then
    fail "$label — only $lines lines (expected ≥$min)"
    return 1
  fi

  pass "$label ($lines lines)"
  return 0
}

# Check file exists (may be empty — used for optional/triage files)
check_file_exists() {
  local file="$1"
  local label="${2:-$file}"
  if [ -f "$file" ]; then
    pass "$label — exists"
    return 0
  else
    fail "$label — missing"
    return 1
  fi
}

# Detect run type from _meta.json
detect_run_type() {
  if [ ! -f "$OUTPUT_DIR/_meta.json" ]; then
    echo "unknown"
    return
  fi
  python3 -c "import json; print(json.load(open('$OUTPUT_DIR/_meta.json')).get('type','unknown'))" 2>/dev/null || echo "unknown"
}

print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}── Phase $1 Validation ──${NC} $2"
  echo ""
}

print_result() {
  echo ""
  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}${BOLD}BLOCKED${NC}: $FAIL_COUNT check(s) failed. Fix before proceeding to the next phase."
    return 1
  elif [ "$WARN_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}${BOLD}PASSED WITH WARNINGS${NC}: $WARN_COUNT warning(s). Review before proceeding."
    return 0
  else
    echo -e "${GREEN}${BOLD}ALL CHECKS PASSED${NC}: $PASS_COUNT check(s) passed. Safe to proceed."
    return 0
  fi
}

# ── Phase Validators ────────────────────────────────────────────────────────

validate_preflight() {
  local run_type="$1"
  print_header "Pre-Flight" "(output dir + config)"

  # Output dir
  if [ -d "$OUTPUT_DIR" ]; then
    pass "Output directory exists: $OUTPUT_DIR"
  else
    fail "Output directory missing: $OUTPUT_DIR — run ./scripts/new-day.sh first"
  fi

  # _meta.json
  check_file_exists "$OUTPUT_DIR/_meta.json" "_meta.json"

  # Config files
  check_file "config/watchlist.md" "config/watchlist.md" 3
  check_file "config/preferences.md" "config/preferences.md" 3
  check_file "config/investment-profile.md" "config/investment-profile.md" 3
  check_file "config/hedge-funds.md" "config/hedge-funds.md" 3
  check_file "config/data-sources.md" "config/data-sources.md" 3

  # Delta-specific: check baseline exists
  if [ "$run_type" = "delta" ]; then
    local baseline_date
    baseline_date=$(python3 -c "import json; print(json.load(open('$OUTPUT_DIR/_meta.json')).get('baseline',''))" 2>/dev/null || echo "")
    if [ -n "$baseline_date" ] && [ -f "outputs/daily/$baseline_date/DIGEST.md" ]; then
      local bl_lines
      bl_lines=$(wc -l < "outputs/daily/$baseline_date/DIGEST.md" | tr -d ' ')
      if [ "$bl_lines" -gt 10 ]; then
        pass "Baseline DIGEST.md exists ($baseline_date, $bl_lines lines)"
      else
        fail "Baseline DIGEST.md too short ($baseline_date, $bl_lines lines)"
      fi
    else
      fail "Baseline DIGEST.md missing or unreferenced"
    fi
  fi
}

validate_phase1() {
  local run_type="$1"
  print_header "1" "Alternative Data & Signals"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/sentiment-news.md" "1A: Sentiment & News" 10
    check_file "$OUTPUT_DIR/cta-positioning.md" "1B: CTA & Systematic Positioning" 10
    check_file "$OUTPUT_DIR/options-derivatives.md" "1C: Options & Derivatives" 10
    check_file "$OUTPUT_DIR/politician-signals.md" "1D: Politician & Official Signals" 10
  else
    # Delta mode: alt-data is optional; check if delta exists when written
    if [ -f "$OUTPUT_DIR/deltas/alt-data.delta.md" ]; then
      check_file "$OUTPUT_DIR/deltas/alt-data.delta.md" "Alt-data delta" 5
    else
      warn "Alt-data delta not written (carried forward — OK if triage determined no change)"
    fi
  fi
}

validate_phase2() {
  local run_type="$1"
  print_header "2" "Institutional Intelligence"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/institutional-flows.md" "2A: Institutional Flows" 10
    check_file "$OUTPUT_DIR/hedge-fund-intel.md" "2B: Hedge Fund Intelligence" 10
  else
    if [ -f "$OUTPUT_DIR/deltas/institutional.delta.md" ]; then
      check_file "$OUTPUT_DIR/deltas/institutional.delta.md" "Institutional delta" 5
    else
      warn "Institutional delta not written (carried forward — OK if triage determined no change)"
    fi
  fi
}

validate_phase3() {
  local run_type="$1"
  print_header "3" "Macro Regime Classification"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/macro.md" "Macro analysis" 20

    # Structural check: macro.md should contain regime classification
    if [ -f "$OUTPUT_DIR/macro.md" ] && grep -qi "regime\|growth.*inflation\|risk.appetite\|policy" "$OUTPUT_DIR/macro.md"; then
      pass "Macro regime keywords present"
    elif [ -f "$OUTPUT_DIR/macro.md" ]; then
      warn "Macro regime classification keywords not found — verify regime section exists"
    fi
  else
    # Delta mode: macro is mandatory
    check_file "$OUTPUT_DIR/deltas/macro.delta.md" "Macro delta (MANDATORY)" 5
  fi
}

validate_phase4() {
  local run_type="$1"
  print_header "4" "Asset Class Deep Dives"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/bonds.md" "4A: Bonds & Rates" 15
    check_file "$OUTPUT_DIR/commodities.md" "4B: Commodities" 15
    check_file "$OUTPUT_DIR/forex.md" "4C: Forex" 15
    check_file "$OUTPUT_DIR/crypto.md" "4D: Crypto & Digital Assets" 15
    check_file "$OUTPUT_DIR/international.md" "4E: International & EM" 15
  else
    # Delta: crypto is mandatory, others are threshold-based
    check_file "$OUTPUT_DIR/deltas/crypto.delta.md" "4D: Crypto delta (MANDATORY)" 5

    for seg in bonds commodities forex international; do
      if [ -f "$OUTPUT_DIR/deltas/$seg.delta.md" ]; then
        check_file "$OUTPUT_DIR/deltas/$seg.delta.md" "4: $seg delta" 5
      fi
    done
    # Count how many optional deltas were written
    local opt_count
    opt_count=$(find "$OUTPUT_DIR/deltas" -name "bonds.delta.md" -o -name "commodities.delta.md" \
                -o -name "forex.delta.md" -o -name "international.delta.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$opt_count" -eq 0 ]; then
      warn "No optional asset-class deltas written (bonds, commodities, forex, international)"
    fi
  fi
}

validate_phase5() {
  local run_type="$1"
  print_header "5" "US Equities + Sectors"

  local sectors="technology healthcare energy financials consumer-staples consumer-disc industrials utilities materials real-estate comms"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/us-equities.md" "5A: US Equities Overview" 20

    local sector_count=0
    local sector_total=11
    for sector in $sectors; do
      if check_file "$OUTPUT_DIR/sectors/$sector.md" "5: $sector" 10; then
        sector_count=$((sector_count + 1))
      fi
    done

    if [ "$sector_count" -eq "$sector_total" ]; then
      pass "All $sector_total sector files present and populated"
    fi
  else
    # Delta: us-equities is mandatory
    check_file "$OUTPUT_DIR/deltas/us-equities.delta.md" "5A: US Equities delta (MANDATORY)" 5

    # Sector deltas are optional
    local sector_delta_count
    sector_delta_count=$(find "$OUTPUT_DIR/sectors" -name "*.delta.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$sector_delta_count" -gt 0 ]; then
      for delta_file in "$OUTPUT_DIR"/sectors/*.delta.md; do
        [ -f "$delta_file" ] && check_file "$delta_file" "Sector delta: $(basename "$delta_file")" 5
      done
    else
      warn "No sector deltas written (OK if no sector moved >1.5%)"
    fi
  fi
}

validate_phase7() {
  local run_type="$1"
  print_header "7" "DIGEST Synthesis"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/DIGEST.md" "DIGEST.md (master synthesis)" 50

    # Structural checks on DIGEST.md
    if [ -f "$OUTPUT_DIR/DIGEST.md" ]; then
      local digest="$OUTPUT_DIR/DIGEST.md"
      local checks_ok=true

      if grep -qi "market regime\|regime snapshot" "$digest"; then
        pass "DIGEST contains Market Regime section"
      else
        warn "DIGEST may be missing Market Regime Snapshot section"
      fi

      if grep -qi "thesis\|thes.*tracker" "$digest"; then
        pass "DIGEST contains Thesis Tracker section"
      else
        warn "DIGEST may be missing Thesis Tracker section"
      fi

      if grep -qi "actionable\|action.*summary\|top.*items" "$digest"; then
        pass "DIGEST contains Actionable Summary section"
      else
        warn "DIGEST may be missing Actionable Summary section"
      fi

      if grep -qi "risk.*radar" "$digest"; then
        pass "DIGEST contains Risk Radar section"
      else
        warn "DIGEST may be missing Risk Radar section"
      fi
    fi
  else
    # Delta mode: both DIGEST-DELTA.md and materialized DIGEST.md required
    check_file "$OUTPUT_DIR/DIGEST-DELTA.md" "DIGEST-DELTA.md (delta changes)" 15
    check_file "$OUTPUT_DIR/DIGEST.md" "DIGEST.md (materialized)" 50

    # Verify materialized DIGEST is a complete file (not just the delta template)
    if [ -f "$OUTPUT_DIR/DIGEST.md" ]; then
      local lines
      lines=$(wc -l < "$OUTPUT_DIR/DIGEST.md" | tr -d ' ')
      if [ "$lines" -lt 100 ]; then
        warn "Materialized DIGEST.md seems short ($lines lines) — may not be fully materialized"
      fi
    fi
  fi
}

validate_phase7b() {
  local run_type="$1"
  print_header "7B" "Opportunity Screen"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/opportunity-screen.md" "Opportunity screen" 10
  else
    # Delta: opportunity screen is part of 7C threshold scan, not a standalone file
    if [ -f "$OUTPUT_DIR/opportunity-screen.md" ]; then
      check_file "$OUTPUT_DIR/opportunity-screen.md" "Opportunity screen (optional on delta)" 5
    else
      pass "Opportunity screen skipped (expected on delta days unless triggered)"
    fi
  fi
}

validate_phase7c() {
  local run_type="$1"
  print_header "7C" "Deliberation / Portfolio Monitor"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/deliberation.md" "Deliberation transcript" 15

    # Check for analyst position files
    local pos_count
    pos_count=$(find "$OUTPUT_DIR/positions" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$pos_count" -gt 0 ]; then
      pass "Analyst positions: $pos_count file(s) in positions/"
    else
      fail "No analyst position files in positions/"
    fi
  else
    # Delta: portfolio monitor may or may not trigger deliberation
    if [ -f "$OUTPUT_DIR/deliberation.md" ]; then
      check_file "$OUTPUT_DIR/deliberation.md" "Deliberation transcript (triggered)" 10
    else
      pass "No deliberation triggered (portfolio monitor found no threshold breaches)"
    fi
  fi
}

validate_phase7d() {
  local run_type="$1"
  print_header "7D" "Portfolio Manager Review"

  if [ "$run_type" = "baseline" ]; then
    check_file "$OUTPUT_DIR/portfolio-recommended.md" "Portfolio recommended" 10
    check_file "$OUTPUT_DIR/rebalance-decision.md" "Rebalance decision" 10

    # Check portfolio.json was updated with proposed_positions
    if [ -f "config/portfolio.json" ]; then
      local has_proposed
      has_proposed=$(python3 -c "
import json
d=json.load(open('config/portfolio.json'))
pp=d.get('proposed_positions',[])
print(len(pp))
" 2>/dev/null || echo "0")
      if [ "$has_proposed" -gt 0 ]; then
        pass "portfolio.json has $has_proposed proposed position(s)"
      else
        warn "portfolio.json proposed_positions is empty"
      fi
    fi
  else
    # Delta: only runs if 7C triggered
    check_file "$OUTPUT_DIR/rebalance-decision.md" "Rebalance decision (or monitor note)" 3

    if [ -f "$OUTPUT_DIR/portfolio-recommended.md" ]; then
      check_file "$OUTPUT_DIR/portfolio-recommended.md" "Portfolio recommended (triggered)" 10
    fi
  fi
}

validate_phase8() {
  local run_type="$1"
  print_header "8" "Web Dashboard Update"

  check_file_exists "frontend/public/dashboard-data.json" "dashboard-data.json"

  if [ -f "frontend/public/dashboard-data.json" ]; then
    # Check that dashboard JSON was updated recently (within last 2 hours)
    local mod_time
    mod_time=$(stat -f %m "frontend/public/dashboard-data.json" 2>/dev/null || stat -c %Y "frontend/public/dashboard-data.json" 2>/dev/null || echo "0")
    local now
    now=$(date +%s)
    local age=$(( (now - mod_time) / 60 ))

    if [ "$age" -lt 120 ]; then
      pass "dashboard-data.json updated $age minutes ago"
    else
      warn "dashboard-data.json last updated $age minutes ago (may be stale)"
    fi

    # Validate JSON structure
    if python3 -c "import json; json.load(open('frontend/public/dashboard-data.json'))" 2>/dev/null; then
      pass "dashboard-data.json is valid JSON"
    else
      fail "dashboard-data.json is not valid JSON"
    fi
  fi
}

validate_phase9() {
  local run_type="$1"
  print_header "9" "Post-Mortem & Evolution"

  # Check evolution files exist
  if [ -f "memory/evolution/sources.md" ]; then
    local lines
    lines=$(wc -l < "memory/evolution/sources.md" | tr -d ' ')
    if [ "$lines" -gt 3 ]; then
      pass "Source scorecard (9A) — $lines lines"
    else
      warn "Source scorecard (9A) is sparse ($lines lines)"
    fi
  else
    warn "memory/evolution/sources.md does not exist"
  fi

  if [ -f "memory/evolution/quality-log.md" ]; then
    local lines
    lines=$(wc -l < "memory/evolution/quality-log.md" | tr -d ' ')
    if [ "$lines" -gt 3 ]; then
      pass "Quality post-mortem (9B) — $lines lines"
    else
      warn "Quality post-mortem (9B) is sparse ($lines lines)"
    fi
  else
    warn "memory/evolution/quality-log.md does not exist"
  fi

  # Proposals are optional (max 2 per session)
  if [ -f "memory/evolution/proposals.md" ]; then
    pass "Proposals file exists (9C)"
  else
    warn "memory/evolution/proposals.md not found"
  fi
}

# ── Main Dispatch ───────────────────────────────────────────────────────────

if [ -z "$PHASE" ]; then
  echo "Usage: ./scripts/validate-phase.sh <phase> [date]"
  echo ""
  echo "Phases: preflight 1 2 3 4 5 7 7b 7c 7d 8 9"
  echo "Flags:  --all     Validate all phases"
  echo "        --summary Quick pass/fail per phase"
  echo ""
  echo "Examples:"
  echo "  ./scripts/validate-phase.sh 3              # After macro analysis"
  echo "  ./scripts/validate-phase.sh 5 2026-04-05   # After equities on specific date"
  echo "  ./scripts/validate-phase.sh --all           # Full pipeline check"
  exit 0
fi

RUN_TYPE=$(detect_run_type)

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Phase Validation — $DATE ($RUN_TYPE mode)${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$PHASE" = "--all" ] || [ "$PHASE" = "--summary" ]; then
  ALL_PHASES="preflight 1 2 3 4 5 7 7b 7c 7d 8 9"
  TOTAL_FAILS=0
  TOTAL_WARNS=0

  if [ "$PHASE" = "--summary" ]; then
    echo ""
    for p in $ALL_PHASES; do
      PASS_COUNT=0; FAIL_COUNT=0; WARN_COUNT=0
      # Redirect output to suppress detail
      eval "validate_phase${p//-/} '$RUN_TYPE'" > /dev/null 2>&1 || true
      if [ "$FAIL_COUNT" -gt 0 ]; then
        echo -e "  Phase ${p}: ${RED}FAIL${NC} ($FAIL_COUNT errors)"
        TOTAL_FAILS=$((TOTAL_FAILS + FAIL_COUNT))
      elif [ "$WARN_COUNT" -gt 0 ]; then
        echo -e "  Phase ${p}: ${YELLOW}WARN${NC} ($WARN_COUNT warnings)"
        TOTAL_WARNS=$((TOTAL_WARNS + WARN_COUNT))
      else
        echo -e "  Phase ${p}: ${GREEN}PASS${NC}"
      fi
    done
    echo ""
    if [ "$TOTAL_FAILS" -gt 0 ]; then
      echo -e "${RED}${BOLD}$TOTAL_FAILS total failure(s) across all phases${NC}"
      exit 1
    elif [ "$TOTAL_WARNS" -gt 0 ]; then
      echo -e "${YELLOW}${BOLD}$TOTAL_WARNS total warning(s) across all phases${NC}"
      exit 0
    else
      echo -e "${GREEN}${BOLD}All phases passed${NC}"
      exit 0
    fi
  else
    for p in $ALL_PHASES; do
      PASS_COUNT=0; FAIL_COUNT=0; WARN_COUNT=0
      case "$p" in
        preflight) validate_preflight "$RUN_TYPE" ;;
        1)  validate_phase1 "$RUN_TYPE" ;;
        2)  validate_phase2 "$RUN_TYPE" ;;
        3)  validate_phase3 "$RUN_TYPE" ;;
        4)  validate_phase4 "$RUN_TYPE" ;;
        5)  validate_phase5 "$RUN_TYPE" ;;
        7)  validate_phase7 "$RUN_TYPE" ;;
        7b) validate_phase7b "$RUN_TYPE" ;;
        7c) validate_phase7c "$RUN_TYPE" ;;
        7d) validate_phase7d "$RUN_TYPE" ;;
        8)  validate_phase8 "$RUN_TYPE" ;;
        9)  validate_phase9 "$RUN_TYPE" ;;
      esac

      if [ "$FAIL_COUNT" -gt 0 ]; then
        TOTAL_FAILS=$((TOTAL_FAILS + FAIL_COUNT))
      fi
      TOTAL_WARNS=$((TOTAL_WARNS + WARN_COUNT))
    done
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if [ "$TOTAL_FAILS" -gt 0 ]; then
      echo -e "${RED}${BOLD}PIPELINE INCOMPLETE${NC}: $TOTAL_FAILS failure(s), $TOTAL_WARNS warning(s)"
      exit 1
    elif [ "$TOTAL_WARNS" -gt 0 ]; then
      echo -e "${YELLOW}${BOLD}PIPELINE PASSED WITH WARNINGS${NC}: $TOTAL_WARNS warning(s)"
      exit 0
    else
      echo -e "${GREEN}${BOLD}FULL PIPELINE VALIDATED${NC}: All checks passed"
      exit 0
    fi
  fi
else
  # Single phase validation
  case "$PHASE" in
    preflight) validate_preflight "$RUN_TYPE" ;;
    1)  validate_phase1 "$RUN_TYPE" ;;
    2)  validate_phase2 "$RUN_TYPE" ;;
    3)  validate_phase3 "$RUN_TYPE" ;;
    4)  validate_phase4 "$RUN_TYPE" ;;
    5)  validate_phase5 "$RUN_TYPE" ;;
    7)  validate_phase7 "$RUN_TYPE" ;;
    7b) validate_phase7b "$RUN_TYPE" ;;
    7c) validate_phase7c "$RUN_TYPE" ;;
    7d) validate_phase7d "$RUN_TYPE" ;;
    8)  validate_phase8 "$RUN_TYPE" ;;
    9)  validate_phase9 "$RUN_TYPE" ;;
    *)
      echo "Unknown phase: $PHASE"
      echo "Valid phases: preflight 1 2 3 4 5 7 7b 7c 7d 8 9"
      exit 1
      ;;
  esac
  print_result
  exit $?
fi
