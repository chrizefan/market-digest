# 📊 Daily Market Digest System

A structured research system for generating daily market intelligence across all asset classes — equities, crypto, bonds, commodities, forex, and macro. All outputs are versioned, and rolling memory files track the evolution of research over time.

---

## 🗂️ Project Structure

```
market-digest/
├── README.md                    ← This file
├── config/
│   ├── watchlist.md             ← Your tracked tickers, sectors, assets
│   └── preferences.md           ← Your trading style, biases, risk profile
├── skills/
│   ├── SKILL-equity.md          ← How Claude runs equity analysis
│   ├── SKILL-crypto.md          ← How Claude runs crypto analysis
│   ├── SKILL-bonds.md           ← How Claude runs bond/rates analysis
│   ├── SKILL-commodities.md     ← How Claude runs commodities analysis
│   ├── SKILL-macro.md           ← How Claude runs macro/global analysis
│   ├── SKILL-forex.md           ← How Claude runs FX analysis
│   └── SKILL-digest.md          ← How Claude assembles the master digest
├── templates/
│   ├── segment-report.md        ← Template for each market segment
│   └── master-digest.md         ← Template for the daily digest
├── memory/
│   ├── equity/ROLLING.md        ← Evolving equity research memory
│   ├── crypto/ROLLING.md        ← Evolving crypto research memory
│   ├── bonds/ROLLING.md         ← Evolving bonds/rates memory
│   ├── commodities/ROLLING.md   ← Evolving commodities memory
│   ├── macro/ROLLING.md         ← Evolving macro memory
│   └── forex/ROLLING.md         ← Evolving FX memory
├── outputs/
│   ├── daily/YYYY-MM-DD.md      ← One file per day
│   ├── weekly/YYYY-Wnn.md       ← Weekly rollup
│   └── monthly/YYYY-MM.md       ← Monthly rollup
├── scripts/
│   ├── new-day.sh               ← Start a new analysis day
│   ├── archive.sh               ← Archive old outputs
│   ├── weekly-rollup.sh         ← Generate weekly summary
│   └── git-commit.sh            ← Auto-commit all outputs
└── archive/                     ← Compressed older outputs
```

---

## 🚀 Daily Workflow

### 1. Start your session
```bash
./scripts/new-day.sh
```
This creates today's output file from the template and prints the prompt to paste into Claude.

### 2. Paste the prompt into Claude (this Project)
Claude will:
- Search for latest news and market data for each segment
- Update each segment's ROLLING.md memory file
- Produce individual segment reports
- Combine into a single master digest

### 3. Commit the outputs
```bash
./scripts/git-commit.sh
```

### 4. End of week
```bash
./scripts/weekly-rollup.sh
```

---

## 📋 Setup Checklist

- [ ] Edit `config/watchlist.md` with your tickers, sectors, crypto, etc.
- [ ] Edit `config/preferences.md` with your trading style and risk profile
- [ ] Run `git init` and push to a private GitHub repo
- [ ] Run `./scripts/new-day.sh` each morning to begin

---

## 🔁 Memory System

Each market segment has a `ROLLING.md` file in `memory/`. This file is **appended to daily** with key findings, evolving themes, and directional biases. When Claude runs the next day's analysis, it reads these files first to maintain continuity — tracking thesis evolution, trend confirmation, and when narratives break.

The rolling memory is what separates this from a one-off daily brief. Over weeks, it becomes a living research document.

---

## ⚙️ Git Strategy

All outputs are committed with date-stamped messages. The git log becomes a timeline of your market views and research evolution. Weekly and monthly rollups are generated from the daily files.
