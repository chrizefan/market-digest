#!/bin/bash
# fetch-market-data.sh — Run both fetch scripts and validate outputs
# Fetches quotes (technicals) and macro data (yield curve, VIX, FX) for a given date.
# Both scripts are free / no API keys — all yfinance + US Treasury public XML.
#
# Usage:
#   ./scripts/fetch-market-data.sh              # today
#   ./scripts/fetch-market-data.sh 2026-04-06   # specific date
#
# Outputs (in outputs/daily/YYYY-MM-DD/data/):
#   quotes.json         quotes-summary.md
#   macro.json          macro-summary.md

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATE="${1:-$(date +%Y-%m-%d)}"
DATA_DIR="$REPO_ROOT/outputs/daily/$DATE/data"

# ── Python resolution: prefer venv with yfinance/pandas-ta ───────────────────
# Check common locations in order:
#   1. DIGIQUANT_PYTHON env var (user override)
#   2. Local .venv in this repo
#   3. ../digithings/.venv (companion repo with data science packages)
#   4. System python3
if [ -n "${DIGIQUANT_PYTHON:-}" ]; then
    PYTHON="$DIGIQUANT_PYTHON"
elif [ -x "$REPO_ROOT/.venv/bin/python3" ] && "$REPO_ROOT/.venv/bin/python3" -c "import yfinance" 2>/dev/null; then
    PYTHON="$REPO_ROOT/.venv/bin/python3"
elif [ -x "$(dirname "$REPO_ROOT")/digithings/.venv/bin/python3" ]; then
    PYTHON="$(dirname "$REPO_ROOT")/digithings/.venv/bin/python3"
else
    PYTHON="python3"
fi

echo "╔════════════════════════════════════════════╗"
echo "║  fetch-market-data.sh — $DATE  ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "  Python: $PYTHON"
echo ""

# ── dependency check ─────────────────────────────────────────────────────────
echo "[ Checking dependencies ]"
"$PYTHON" -c "import yfinance" 2>/dev/null || {
    echo "  ⚠️  yfinance not found in $PYTHON"
    echo "       Run: pip install -r requirements.txt  (or set DIGIQUANT_PYTHON=...)"
    exit 1
}
"$PYTHON" -c "import pandas_ta" 2>/dev/null || {
    echo "  ⚠️  pandas-ta not found in $PYTHON"
    echo "       Run: pip install pandas-ta  (or set DIGIQUANT_PYTHON=...)"
    exit 1
}
"$PYTHON" -c "import requests" 2>/dev/null || {
    echo "  ⚠️  requests not found in $PYTHON"
    echo "       Run: pip install requests"
    exit 1
}
echo "  ✅ Dependencies OK"
echo ""

# ── ensure daily folder exists ───────────────────────────────────────────────
mkdir -p "$DATA_DIR"

# ── fetch quotes ─────────────────────────────────────────────────────────────
echo "[ Phase 1/2: Quotes + Technicals ]"
cd "$REPO_ROOT"
"$PYTHON" scripts/fetch-quotes.py "$DATE"
echo ""

# ── fetch macro ──────────────────────────────────────────────────────────────
echo "[ Phase 2/2: Macro Data (Yield Curve, VIX, FX, Commodities, Crypto) ]"
"$PYTHON" scripts/fetch-macro.py "$DATE"
echo ""

# ── validate outputs ─────────────────────────────────────────────────────────
echo "[ Validation ]"
ERRORS=0

for FILE in quotes.json quotes-summary.md macro.json macro-summary.md; do
    FPATH="$DATA_DIR/$FILE"
    if [ ! -f "$FPATH" ]; then
        echo "  ❌ Missing: $FILE"
        ERRORS=$((ERRORS + 1))
    elif [ ! -s "$FPATH" ]; then
        echo "  ❌ Empty:   $FILE"
        ERRORS=$((ERRORS + 1))
    else
        SIZE=$(wc -c < "$FPATH")
        if [ "$SIZE" -lt 500 ]; then
            echo "  ⚠️  Suspiciously small ($SIZE bytes): $FILE"
        else
            echo "  ✅ OK: $FILE ($SIZE bytes)"
        fi
    fi
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ fetch-market-data.sh — $ERRORS validation error(s). Check output above."
    exit 1
fi

# ── summary ──────────────────────────────────────────────────────────────────
TICKER_COUNT=$(python3 -c "
import json, sys
try:
    d = json.load(open('$DATA_DIR/quotes.json'))
    print(d.get('success_count', '?'))
except Exception as e:
    print('?')
" 2>/dev/null)

YIELD_STATUS=$(python3 -c "
import json
try:
    d = json.load(open('$DATA_DIR/macro.json'))
    yields = d.get('yield_curve', {}).get('yields', {})
    print(f'{len(yields)} maturities' if yields else 'unavailable')
except Exception:
    print('unavailable')
" 2>/dev/null)

echo "✅ fetch-market-data.sh complete — $DATE"
echo "   Quotes:      $TICKER_COUNT tickers with technicals"
echo "   Yield Curve: $YIELD_STATUS"
echo "   Output dir:  outputs/daily/$DATE/data/"
echo ""
echo "  → Agent: read outputs/daily/$DATE/data/quotes-summary.md and macro-summary.md"
echo "    before web-searching for prices or yields."
