#!/bin/bash
# archive.sh — Move outputs older than N days to the archive folder
# Keeps the outputs/daily/ folder clean while preserving history in archive/
# Usage: ./scripts/archive.sh [days]   (default: 30)

set -e
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

DAYS_TO_KEEP=${1:-30}  # Default: keep last 30 days, pass arg to override
ARCHIVE_DIR="archive"
DAILY_DIR="outputs/daily"

echo ""
echo "🗄️  Archiving outputs older than $DAYS_TO_KEEP days"
echo "====================================================="

# Find files older than N days
OLD_FILES=$(find "$DAILY_DIR" -name "*.md" -mtime +$DAYS_TO_KEEP 2>/dev/null)

if [ -z "$OLD_FILES" ]; then
  echo "ℹ️  No files older than $DAYS_TO_KEEP days found. Nothing to archive."
  exit 0
fi

# Get the date range for the archive name
OLDEST=$(echo "$OLD_FILES" | sort | head -1 | xargs basename .md 2>/dev/null || echo "old")
NEWEST=$(echo "$OLD_FILES" | sort | tail -1 | xargs basename .md 2>/dev/null || echo "files")
ARCHIVE_NAME="${ARCHIVE_DIR}/daily-${OLDEST}_to_${NEWEST}.tar.gz"

echo "Files to archive:"
echo "$OLD_FILES"
echo ""

# Create archive
tar -czf "$ARCHIVE_NAME" $OLD_FILES
echo "✅ Archived to: $ARCHIVE_NAME"

# Verify archive integrity before removing originals
if ! tar -tzf "$ARCHIVE_NAME" > /dev/null 2>&1; then
  echo "❌ Archive verification failed — $ARCHIVE_NAME may be corrupt."
  echo "   Original files have NOT been removed."
  exit 1
fi

# Remove original files
echo "$OLD_FILES" | xargs rm -f
echo "✅ Removed originals from $DAILY_DIR"

# Commit the archive
git add "$ARCHIVE_DIR/"
git add "$DAILY_DIR/"
git commit -m "archive: daily outputs $OLDEST to $NEWEST (${DAYS_TO_KEEP}d rotation)"

echo ""
echo "✅ Archive complete and committed."
echo ""
