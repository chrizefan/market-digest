#!/bin/bash
# Re-materialize a week into Supabase using the DB-first pipeline:
# - Sunday baseline + Mon delta: legacy outputs/daily/<date>/snapshot.json → convert_snapshot_v1 → materialize_snapshot
# - Later weekdays with empty snapshot.json: legacy DIGEST-DELTA.md → legacy_delta_to_ops → materialize (ops on prior day)
#
# Usage (from repo root):
#   ./scripts/backfill-db-first-digest.sh 2026-04-05 2026-04-06 2026-04-07
#
# Args: baseline Sunday date, then delta dates in order (each delta after the first chains on the previous calendar day).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PY="${ROOT}/.venv/bin/python"
if [[ ! -x "$PY" ]]; then PY="python3"; fi
TMP="${TMPDIR:-/tmp}"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <baseline-yyyy-mm-dd> <delta-yyyy-mm-dd> [more-delta-dates...]" >&2
  exit 1
fi

BASELINE="$1"
shift
BASE_JSON="${ROOT}/outputs/daily/${BASELINE}/snapshot.json"
if [[ ! -f "$BASE_JSON" ]]; then
  echo "Missing ${BASE_JSON}" >&2
  exit 1
fi

echo "== Baseline ${BASELINE} (convert + push)"
"$PY" scripts/convert_snapshot_v1.py --in "$BASE_JSON" --out "${TMP}/v1-digest-${BASELINE}.json"
"$PY" scripts/materialize_snapshot.py --date "$BASELINE" --snapshot "${TMP}/v1-digest-${BASELINE}.json"

PREV="$BASELINE"
for D in "$@"; do
  SNAP="${ROOT}/outputs/daily/${D}/snapshot.json"
  if [[ -f "$SNAP" ]] && "$PY" -c "import json,sys; d=json.load(open(sys.argv[1],encoding='utf-8')); sys.exit(0 if (d.get('regime') or d.get('positions')) else 1)" "$SNAP" 2>/dev/null; then
    echo "== Delta ${D} (full legacy snapshot.json → convert + push)"
    "$PY" scripts/convert_snapshot_v1.py --in "$SNAP" --out "${TMP}/v1-digest-${D}.json"
    "$PY" scripts/materialize_snapshot.py --date "$D" --snapshot "${TMP}/v1-digest-${D}.json"
  else
    DELTA_MD="${ROOT}/outputs/daily/${D}/DIGEST-DELTA.md"
    if [[ ! -f "$DELTA_MD" ]]; then
      echo "No populated snapshot and no DIGEST-DELTA.md for ${D}" >&2
      exit 1
    fi
    echo "== Delta ${D} (legacy DIGEST-DELTA.md ops; load snapshot row ${PREV})"
    "$PY" scripts/legacy_delta_to_ops.py \
      --date "$D" \
      --baseline-date "$BASELINE" \
      --delta-md "$DELTA_MD" \
      --out "${TMP}/delta-request-${D}.json"
    "$PY" scripts/materialize_snapshot.py \
      --date "$D" \
      --baseline-date "$PREV" \
      --ops "${TMP}/delta-request-${D}.json"
  fi
  PREV="$D"
done

echo "✅ Backfill complete for: ${BASELINE} $*"
