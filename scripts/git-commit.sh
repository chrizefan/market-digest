#!/bin/bash
# git-commit.sh — Commit digest outputs OR evolution improvements
# Usage:
#   ./scripts/git-commit.sh              → commits digest outputs + memory to master
#   ./scripts/git-commit.sh --evolution   → creates a feature branch, commits evolution
#                                           artifacts, pushes, and opens a PR for approval

set -e

DATE=$(date +%Y-%m-%d)

if [ "$1" == "--evolution" ]; then
  echo ""
  echo "🧬 Pipeline Evolution — Branch & PR Workflow"
  echo "=============================================="

  # Create a dedicated branch for this evolution cycle
  BRANCH="evolve/${DATE}"

  # Check if branch already exists (e.g., second run same day)
  if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
    echo "   Branch ${BRANCH} already exists — switching to it."
    git checkout "${BRANCH}"
  else
    echo "   Creating branch: ${BRANCH}"
    git checkout -b "${BRANCH}"
  fi

  # Stage only evolution-related files
  git add memory/evolution/
  git add docs/evolution-changelog.md

  # Check if there's anything to commit
  if git diff --staged --quiet; then
    echo "ℹ️  Nothing to commit — no evolution changes detected."
    git checkout master
    exit 0
  fi

  echo ""
  echo "Files staged for commit:"
  git diff --staged --name-only
  echo ""

  git commit -m "evolve(${DATE}): pipeline post-mortem and improvement proposals"

  # Push branch and create PR
  echo ""
  echo "📤 Pushing branch to origin..."
  git push -u origin "${BRANCH}" 2>/dev/null || {
    echo "   ⚠️  Push failed — you may need to authenticate. Run: gh auth login"
    echo "   Branch committed locally. Push manually with: git push -u origin ${BRANCH}"
  }

  # Attempt to create PR via GitHub CLI
  if command -v gh &> /dev/null; then
    echo ""
    echo "📝 Creating Pull Request..."
    gh pr create \
      --base master \
      --head "${BRANCH}" \
      --title "evolve(${DATE}): Pipeline Improvement Proposals" \
      --body "## 🧬 Pipeline Evolution — ${DATE}

This PR contains post-mortem observations and improvement proposals from today's digest run.

### Files Changed
- \`memory/evolution/sources.md\` — Data source ratings
- \`memory/evolution/quality-log.md\` — Quality self-assessment
- \`memory/evolution/proposals.md\` — New improvement proposals
- \`docs/evolution-changelog.md\` — Applied improvements log

### Review Instructions
1. Review the proposals in \`memory/evolution/proposals.md\`
2. Approve/reject each proposal
3. Merge this PR to apply the evolution artifacts to master

> ⚠️ **No skill files, templates, or config have been modified.** This PR only contains observations and proposals. Approved proposals will be applied in a future session." \
      2>/dev/null || {
        echo "   ⚠️  PR creation failed — you may need to run: gh auth login"
        echo "   Branch is pushed. Create PR manually at: https://github.com/chrizefan/digiquant-atlas/compare/${BRANCH}"
      }
  else
    echo "   ℹ️  GitHub CLI (gh) not found. Create PR manually at:"
    echo "   https://github.com/chrizefan/digiquant-atlas/compare/${BRANCH}"
  fi

  # Switch back to master for the next run
  git checkout master

  echo ""
  echo "✅ Evolution branch: ${BRANCH} (PR created — awaiting your approval)"
  echo ""

else
  echo ""
  echo "📦 Committing digiquant-atlas outputs — $DATE"
  echo "============================================"

  # Stage digest outputs and memory (excluding evolution)
  git add outputs/
  git add memory/
  git add config/
  git add frontend/public/dashboard-data.json

  # Exclude evolution files from this commit (they get their own branch)
  git reset HEAD memory/evolution/ 2>/dev/null || true

  # Check if there's anything to commit
  if git diff --staged --quiet; then
    echo "ℹ️  Nothing to commit — no changes detected."
    exit 0
  fi

  echo ""
  echo "Files staged for commit:"
  git diff --staged --name-only
  echo ""

  git commit -m "digest($DATE): daily market analysis and memory updates"

  echo ""
  echo "✅ Committed: digest($DATE)"
  echo ""
  echo "To push to remote: git push origin master"
  echo ""
fi
