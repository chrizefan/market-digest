#!/usr/bin/env bash
# publish-update.sh — Parse digest, build latest data, push to GitHub Pages
# Usage: ./scripts/publish-update.sh
#   Runs update_tearsheet.py, regenerates snapshot.json, builds frontend, commits + pushes.
set -e
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

# Verify we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not a git repository. Run from the digiquant-atlas root." >&2
  exit 1
fi

echo "📊 Updating digiquant-atlas data..."
python3 scripts/update_tearsheet.py || { echo "❌ update_tearsheet.py failed"; exit 1; }

echo "📦 Staging changes for git..."
git add config/ memory/ scripts/

# Add any new files
git add -A

# Check if there's anything to commit
if git diff --staged --quiet; then
  echo "ℹ️  Nothing to commit — no changes detected."
  exit 0
fi

echo "📝 Committing to repository..."
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Auto-update: Daily Digest / Market Data - $TIMESTAMP"

echo "🚀 Pushing to GitHub (master)..."
git push origin master || {
  echo "⚠️  Push failed — commit is local. Run: git push origin master"
  exit 1
}

echo "✅ Success! GitHub Actions will now build and deploy the application to GitHub Pages."
