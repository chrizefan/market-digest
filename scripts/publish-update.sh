#!/usr/bin/env bash
set -e

# Market Digest - Automatic Publish Script
# Use this script after a new digest is output to automatically parse, 
# build the latest data, and push it to GitHub for GitHub Pages deployment.

echo "📊 Updating Market Digest Data..."
python3 scripts/update-tearsheet.py

# Optionally wait or check if new files are generated (update-tearsheet.py writes the JSON)

echo "📦 Staging changes for git..."
git add config/ frontend/public/ outputs/ memory/ scripts/

# Add any new files
git add -A

echo "📝 Committing to repository..."
# Add timestamp to commit message
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Auto-update: Daily Digest / Market Data - $TIMESTAMP"

echo "🚀 Pushing to GitHub (main)..."
git push origin main

echo "✅ Success! GitHub Actions will now build and deploy the application to GitHub Pages."
