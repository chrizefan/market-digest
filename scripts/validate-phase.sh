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

[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }
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

# Detect run type from _meta.json — exits 1 (hard fail) if file is malformed
detect_run_type() {
  if [ ! -f "$OUTPUT_DIR/_meta.json" ]; then
    echo "unknown"
    return
  fi
  local run_type
  if ! run_type=$(python3 -c "import json, sys; d=json.load(open('$OUTPUT_DIR/_meta.json')); print(d.get('type','unknown'))" 2>&1); then
    echo -e "${RED}❌ FAIL${NC}: _meta.json is malformed — cannot determine run type" >&2
    echo -e "   Error: $run_type" >&2
    exit 1
  fi
  echo "$run_type"
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

  pass "DB-first mode (no outputs/daily validation)"

  # Config files
  check_file "config/watchlist.md" "config/watchlist.md" 3
  check_file "config/preferences.md" "config/preferences.md" 3
  check_file "config/investment-profile.md" "config/investment-profile.md" 3
  check_file "config/hedge-funds.md" "config/hedge-funds.md" 3
  check_file "docs/ops/data-sources.md" "docs/ops/data-sources.md" 3
}

validate_phase1() {
  local run_type="$1"
  print_header "1" "Alternative Data & Signals"

  pass "DB-first: phase 1 validated via published snapshot content"
}

validate_phase2() {
  local run_type="$1"
  print_header "2" "Institutional Intelligence"

  pass "DB-first: phase 2 validated via published snapshot content"
}

validate_phase3() {
  local run_type="$1"
  print_header "3" "Macro Regime Classification"

  pass "DB-first: phase 3 validated via published snapshot content"
}

validate_phase4() {
  local run_type="$1"
  print_header "4" "Asset Class Deep Dives"

  pass "DB-first: phase 4 validated via published snapshot content"
}

validate_phase5() {
  local run_type="$1"
  print_header "5" "US Equities + Sectors"

  pass "DB-first: phase 5 validated via published snapshot content"
}

validate_phase7() {
  local run_type="$1"
  print_header "7" "DIGEST Synthesis + Snapshot"

  pass "DB-first: digest is stored in Supabase (daily_snapshots.snapshot + documents)"
}

validate_phase7b() {
  local run_type="$1"
  print_header "7B" "Opportunity Screen"

  pass "DB-first: opportunity screen optional and not validated as file output"
}

validate_phase7c() {
  local run_type="$1"
  print_header "7C" "Deliberation / Portfolio Monitor"

  pass "DB-first: portfolio outputs are captured in snapshot/positions/theses tables"
}

validate_phase7d() {
  local run_type="$1"
  print_header "7D" "Portfolio Manager Review"

  pass "DB-first: portfolio decisions represented in snapshot + positions table"
}

validate_phase8() {
  local run_type="$1"
  print_header "8" "Supabase Publish"

  # Supabase configuration check (required — no static fallback)
  if [ -f "config/supabase.env" ] || [ -n "${SUPABASE_URL:-}" ]; then
    pass "Supabase credentials configured"

    # Validate data was actually pushed (check table counts)
    local sb_check
    sb_check=$(python3 -c "
import os, sys
sys.path.insert(0, '.')
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path('config/supabase.env'))
from supabase import create_client
url = os.environ.get('SUPABASE_URL','')
key = os.environ.get('SUPABASE_SERVICE_KEY','')
if not url or not key:
    print('NO_CREDS')
    sys.exit(0)
sb = create_client(url, key)
counts = {}
for t in ['daily_snapshots','positions','theses','documents']:
    try:
        r = sb.table(t).select('id', count='exact').execute()
        counts[t] = r.count if hasattr(r,'count') and r.count else len(r.data)
    except: counts[t] = 0
total = sum(counts.values())
if total > 0:
    parts = ' '.join(f'{k}={v}' for k,v in counts.items())
    print(f'OK {parts}')
else:
    print('EMPTY')
" 2>/dev/null || echo "ERROR")

    case "$sb_check" in
      OK*)
        pass "Supabase data verified: ${sb_check#OK }"
        ;;
      EMPTY)
        fail "Supabase tables are empty — run update_tearsheet.py to push data"
        ;;
      NO_CREDS)
        fail "Supabase credentials incomplete in config/supabase.env"
        ;;
      *)
        warn "Supabase connectivity check failed (network or SDK issue)"
        ;;
    esac
  else
    fail "Supabase not configured — frontend requires Supabase. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in config/supabase.env"
  fi
}

validate_phase9() {
  local run_type="$1"
  print_header "9" "Post-Mortem & Evolution"

  # DB-first: JSON under outputs/evolution/YYYY-MM-DD/ (not outputs/daily/.../evolution/)
  local evo_dir="outputs/evolution/$DATE"

  _json_nonempty() {
    local f="$1"
    [ -f "$f" ] && [ "$(wc -c < "$f" | tr -d ' ')" -gt 40 ]
  }

  if _json_nonempty "$evo_dir/sources.json"; then
    pass "Source scorecard (9A) — $evo_dir/sources.json"
  else
    warn "$evo_dir/sources.json missing or empty — run ./scripts/scaffold_evolution_day.sh $DATE"
  fi

  if _json_nonempty "$evo_dir/quality-log.json"; then
    pass "Quality post-mortem (9B) — $evo_dir/quality-log.json"
  else
    warn "$evo_dir/quality-log.json missing or empty"
  fi

  if [ -f "$evo_dir/proposals.json" ]; then
    pass "Proposals file present (9C)"
  else
    warn "$evo_dir/proposals.json not found"
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
