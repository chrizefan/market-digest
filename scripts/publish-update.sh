#!/usr/bin/env bash
set -e

# digiquant-atlas - Automatic Publish Script
# Use this script after a new digest is output to automatically parse, 
# build the latest data, and push it to GitHub for GitHub Pages deployment.

# Verify we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not a git repository. Run from the digiquant-atlas root." >&2
  exit 1
fi

echo "📊 Updating digiquant-atlas data..."
python3 scripts/update_tearsheet.py || { echo "❌ update_tearsheet.py failed"; exit 1; }

echo "📦 Staging changes for git..."
git add config/ outputs/ memory/ scripts/

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
