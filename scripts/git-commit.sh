#!/bin/bash
# git-commit.sh — Commit digest outputs OR evolution improvements
# Usage:
#   ./scripts/git-commit.sh              → commits digest outputs + memory to master
#   ./scripts/git-commit.sh --evolution   → creates a feature branch, commits evolution
#                                           artifacts, pushes, and opens a PR for approval

set -e
[[ "${1:-}" == '--help' || "${1:-}" == '-h' ]] && { grep '^#' "$0" | tail -n +2 | sed 's/^#[[:space:]]\{0,1\}//'; exit 0; }

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

  # Stage only evolution-related files (DB-first: outputs/evolution/YYYY-MM-DD/*.json)
  git add "outputs/evolution/${DATE}/"
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
- \`outputs/evolution/${DATE}/sources.json\` — Data source ratings
- \`outputs/evolution/${DATE}/quality-log.json\` — Quality self-assessment
- \`outputs/evolution/${DATE}/proposals.json\` — New improvement proposals
- \`docs/evolution-changelog.md\` — Applied improvements log

### Review Instructions
1. Review the proposals in \`outputs/evolution/${DATE}/proposals.json\`
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

  # Regenerate snapshot.json sidecars from latest outputs
  echo ""
  echo "🔄 Generating snapshot.json sidecars..."
  if ! python3 scripts/generate-snapshot.py --all 2>&1; then
    echo "   ⚠️  Snapshot generation failed — check output above"
    echo "   Continuing with stale snapshots. Review before pushing."
  fi

  echo ""
  echo "🔄 Pushing data to Supabase..."
  if ! python3 scripts/update_tearsheet.py 2>&1; then
    echo "   ❌  Supabase push failed — dashboard may show stale data"
    echo "   Fix: pip install -r requirements.txt && python3 scripts/update_tearsheet.py"
    echo "   Aborting commit to prevent stale state."
    exit 1
  fi

  # Validate portfolio constraints before committing
  if [ -f scripts/validate-portfolio.sh ]; then
    echo ""
    echo "🔍 Validating portfolio constraints..."
    if ! bash scripts/validate-portfolio.sh 2>&1; then
      echo "   ⚠️  Portfolio validation failed — review warnings above"
    fi
  fi

  # Stage digest outputs and config (no more dashboard-data.json needed)
  git add outputs/
  git add config/

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
  echo "📤 Pushing to origin..."
  git push origin master 2>/dev/null && echo "✅ Committed + pushed: digest($DATE) — Supabase data already live." || {
    echo "   ⚠️  Push failed — run manually: git push origin master"
    echo "   Commit is local. Supabase data is already updated regardless."
  }
  echo ""
fi
