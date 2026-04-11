#!/bin/bash
# check-types-sync.sh — Verify database.types.ts has entries for all Supabase tables.
# Exits 1 with a warning if the migration file count differs from the TypeScript type count.
set -e

MIGRATIONS_DIR="supabase/migrations"
TYPES_FILE="frontend/lib/database.types.ts"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "❌ Missing: $MIGRATIONS_DIR" >&2; exit 1
fi
if [[ ! -f "$TYPES_FILE" ]]; then
  echo "❌ Missing: $TYPES_FILE" >&2; exit 1
fi

# Extract base table names from SQL migrations (skip partition variants like _default, _y2025, etc.)
sql_tables=$(grep -hE "^CREATE TABLE (IF NOT EXISTS )?[a-z_]+" "$MIGRATIONS_DIR"/*.sql 2>/dev/null \
  | sed -E 's/CREATE TABLE (IF NOT EXISTS )?//' \
  | awk '{print $1}' \
  | grep -vE '_(default|partitioned|y[0-9]{4})$' \
  | grep -vE '^(daily_snapshots_new|documents_new)$' \
  | tr '[:upper:]' '[:lower:]' \
  | sort -u)

# Extract table keys from the Tables block in database.types.ts
# Matches lines with exactly 6 spaces of indentation followed by table_name: {
ts_tables=$(grep -E '^      [a-z_]+: \{$' "$TYPES_FILE" \
  | awk '{print $1}' \
  | tr -d ':' \
  | sort -u)

sql_count=$(echo "$sql_tables" | grep -c . || true)
ts_count=$(echo "$ts_tables" | grep -c . || true)

echo "📋 Supabase migration tables ($sql_count): $(echo $sql_tables | tr '\n' ' ')"
echo "📋 TypeScript types tables  ($ts_count): $(echo $ts_tables | tr '\n' ' ')"

if [[ "$sql_count" -ne "$ts_count" ]]; then
  echo ""
  echo "⚠️  DRIFT DETECTED — $sql_count SQL tables vs $ts_count TS types"
  echo "   Missing from TS: $(comm -23 <(echo "$sql_tables") <(echo "$ts_tables") | tr '\n' ' ')"
  echo "   Missing from SQL: $(comm -13 <(echo "$sql_tables") <(echo "$ts_tables") | tr '\n' ' ')"
  echo "   Update frontend/lib/database.types.ts to reflect the current schema."
  exit 1
fi

echo ""
echo "✅ database.types.ts is in sync with migrations ($ts_count tables)"
