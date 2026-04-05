# Setup Guide — digiquant-atlas

Complete setup walkthrough. Should take 15-20 minutes.

---

## Prerequisites

- A terminal (macOS Terminal, iTerm2, Windows WSL, or Linux)
- Git installed (`git --version` to check)
- A GitHub account (for the private repo)
- Access to this Claude Project

---

## Step 1: Extract and Place the Repo

```bash
# Extract the downloaded archive
tar -xzf digiquant-atlas.tar.gz

# Move to wherever you keep projects
mv digiquant-atlas ~/projects/digiquant-atlas   # or wherever you prefer

cd ~/projects/digiquant-atlas
```

---

## Step 2: Make All Scripts Executable

```bash
chmod +x scripts/*.sh
```

Verify:
```bash
ls -la scripts/
# Should show -rwxr-xr-x for all .sh files
```

---

## Step 3: Customize Your Config Files

These two files are the most important customizations. Do them before your first digest.

### 3a. Edit your watchlist
```bash
nano config/watchlist.md
# or: open config/watchlist.md  (macOS)
# or: code config/watchlist.md  (VS Code)
```

Replace the placeholder tickers with your actual holdings and watchlist.
Add any sector ETFs, crypto, or bonds you follow.
Remove anything irrelevant to your style.

### 3b. Edit your trading profile
```bash
nano config/preferences.md
```

Fill in:
- Your actual trading style and time horizon
- Risk limits
- What you want in the digest (and what to skip)
- Your **current active theses** — this is critical for the thesis tracker

---

## Step 4: Create a Private GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `digiquant-atlas` (or anything you want)
3. Set it to **Private** ← important, this is your research
4. Do NOT initialize with a README (we already have one)
5. Click "Create repository"

Then connect your local repo:
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/digiquant-atlas.git
git branch -M main
git push -u origin main
```

Verify:
```bash
git remote -v
# Should show: origin https://github.com/YOUR_USERNAME/digiquant-atlas.git
```

---

## Step 5: Configure Claude Project Instructions

In Claude.ai:
1. Open (or create) this Project
2. Click **Project Settings** → **Project Instructions**
3. Copy the entire contents of `CLAUDE_PROJECT_INSTRUCTIONS.md`
4. Paste it into the Project Instructions field
5. Save

This makes Claude aware of the skill files, file structure, and expected behavior for every session in this project.

---

## Step 6: Run Your First Digest

```bash
./scripts/status.sh
```

This shows you the current state of the project. On first run, everything will show as pending.

Then:
```bash
./scripts/new-day.sh
```

This prints the exact prompt to paste into Claude. Copy it, paste it into this Claude Project, and Claude will run the full digest pipeline.

---

## Step 7: Commit the First Real Output

After Claude completes the digest:
```bash
./scripts/git-commit.sh
```

Then push:
```bash
git push
```

---

## Daily Workflow (Once Set Up)

Every trading day:

```bash
# Morning (before open or at open)
./scripts/new-day.sh          # → paste prompt into Claude → get digest

# Optional: quick pre-market scan (paste prompt from skill directly)
# "Run a pre-market pulse per skills/SKILL-premarket-pulse.md"

# After Claude finishes
./scripts/git-commit.sh
git push

# Mid-week (optional)
./scripts/watchlist-check.sh  # → paste into Claude for quick watchlist scan
./scripts/thesis.sh review    # → paste into Claude for thesis health check

# Friday
./scripts/weekly-rollup.sh    # → paste into Claude for weekly synthesis
./scripts/git-commit.sh && git push
```

---

## Useful Commands Reference

| Command | Purpose |
|---------|---------|
| `./scripts/status.sh` | Project health overview |
| `./scripts/new-day.sh` | Start daily digest |
| `./scripts/watchlist-check.sh` | Quick watchlist scan prompt |
| `./scripts/thesis.sh list` | List active theses |
| `./scripts/thesis.sh add` | Add a new thesis |
| `./scripts/thesis.sh close` | Close/archive a thesis |
| `./scripts/thesis.sh review` | Full thesis review prompt |
| `./scripts/memory-search.sh "keyword"` | Search all memory files |
| `./scripts/weekly-rollup.sh` | Generate weekly summary |
| `./scripts/monthly-rollup.sh` | Generate monthly summary |
| `./scripts/git-commit.sh` | Commit all outputs |
| `./scripts/archive.sh [days]` | Archive outputs older than N days |

---

## Ad-Hoc Claude Prompts (Paste Directly)

These don't need a script — just paste into Claude:

```
Run a pre-market pulse for today per skills/SKILL-premarket-pulse.md
```

```
Deep dive on [TICKER/ASSET] per skills/SKILL-deep-dive.md
```

```
Sector heatmap for today per skills/SKILL-sector-heatmap.md
```

```
Earnings preview for [TICKER] per skills/SKILL-earnings.md
```

```
How did [TICKER] report? Earnings reaction per skills/SKILL-earnings.md
```

```
Search my memory files for everything related to [TOPIC]
and give me a summary of how my view has evolved on it.
```

---

## Maintenance

### Weekly
- Run `./scripts/weekly-rollup.sh` on Friday or weekend
- Review `memory/*/ROLLING.md` — prune any stale notes if needed
- Update `config/preferences.md` active theses

### Monthly
- Run `./scripts/monthly-rollup.sh` at month end
- Run `./scripts/archive.sh 30` to rotate old daily outputs to archive
- Review and update `config/watchlist.md` — add/remove based on current focus

### As needed
- Add new tickers to `config/watchlist.md` anytime
- Update active theses via `./scripts/thesis.sh add` or `close`
- The skill files in `skills/` can be edited to adjust Claude's analysis behavior

---

## Troubleshooting

**"Permission denied" on scripts**:
```bash
chmod +x scripts/*.sh
```

**"Nothing to commit" when running git-commit.sh**:
Claude may not have created the output file. Check `outputs/daily/` for today's date file.

**Claude not following the skill format**:
Make sure `CLAUDE_PROJECT_INSTRUCTIONS.md` is pasted into the Project Instructions. Also try prefixing your prompt with "per skills/SKILL-digest.md".

**Memory files not updating**:
Remind Claude at the end of the session: "Please update all rolling memory files and confirm."

**Git push fails**:
```bash
git remote -v   # Check remote is set correctly
git pull --rebase origin main   # Sync if needed
git push
```
