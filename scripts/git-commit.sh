#!/bin/bash
# git-commit.sh — Commit all new outputs and memory updates
# Run after Claude completes a digest session

set -e

DATE=$(date +%Y-%m-%d)

echo ""
echo "📦 Committing market digest outputs — $DATE"
echo "============================================"

# Stage all changes
git add outputs/
git add memory/
git add config/

# Check if there's anything to commit
if git diff --staged --quiet; then
  echo "ℹ️  Nothing to commit — no changes detected."
  exit 0
fi

# Show what's being committed
echo ""
echo "Files staged for commit:"
git diff --staged --name-only
echo ""

# Commit with date-stamped message
git commit -m "digest($DATE): daily market analysis and memory updates"

echo ""
echo "✅ Committed: digest($DATE)"
echo ""
echo "To push to remote: git push origin main"
echo ""
