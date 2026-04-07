# Memory System Reference

digiquant-atlas uses 23 append-only rolling memory files plus two special-format files. Together they form the system's long-term research memory.

## Design Principles

1. **Append-only** — never rewrite history. New entries go at the bottom.
2. **Session-scoped updates** — only update memory at the end of a session, not mid-run.
3. **Pre-read before write** — always read a memory file before updating it. This prevents duplication.
4. **Format consistency** — all ROLLING.md files use the same `## YYYY-MM-DD` + bullets format.

## Standard ROLLING.md Format

```markdown
## YYYY-MM-DD
- [Observation about regime, positioning, or key development]
- [Price action note or notable technical event]
- [Forward-looking note or upcoming catalyst]

## YYYY-MM-DD
- [Next entry...]
```

- One `## YYYY-MM-DD` header per session (not per calendar day if multiple sessions)
- 3-5 bullets per entry
- Plain prose bullets — no sub-bullets, no tables
- Focus on **what changed** and **what it means**, not just what happened

---

## Complete Memory File Inventory

### Core Domain Files (6)

| File | Domain | What to Track |
|------|--------|--------------|
| `memory/macro/ROLLING.md` | Macro regime | Rate expectations, recession risk, Fed posture, dollar trend, risk-on/off calls |
| `memory/bonds/ROLLING.md` | Fixed income | Yield curve shape, rate vol, credit spreads, TLT/HYG technicals |
| `memory/commodities/ROLLING.md` | Commodities | Oil, gold, copper, natural gas — supply/demand drivers |
| `memory/forex/ROLLING.md` | FX | DXY trend, major cross momentum, carry dynamics |
| `memory/crypto/ROLLING.md` | Crypto | BTC trend, ETH/BTC ratio, on-chain flows, liquidity |
| `memory/equity/ROLLING.md` | Broad equities | SPX/QQQ/IWM trend, breadth, technicals, sector leadership |

### Sector Files (11)

All in `memory/sectors/{name}/ROLLING.md`:

| Sector | Directory | Skill File |
|--------|-----------|-----------|
| Technology | `memory/sectors/technology/` | `skills/sector-technology/SKILL.md` |
| Healthcare | `memory/sectors/healthcare/` | `skills/sector-healthcare/SKILL.md` |
| Financials | `memory/sectors/financials/` | `skills/sector-financials/SKILL.md` |
| Energy | `memory/sectors/energy/` | `skills/sector-energy/SKILL.md` |
| Consumer Discretionary | `memory/sectors/consumer/` | `skills/sector-consumer-disc/SKILL.md` |
| Consumer Staples | `memory/sectors/consumer/` | `skills/sector-consumer-staples/SKILL.md` |
| Industrials | `memory/sectors/industrials/` | `skills/sector-industrials/SKILL.md` |
| Materials | `memory/sectors/materials/` | `skills/sector-materials/SKILL.md` |
| Utilities | `memory/sectors/utilities/` | `skills/sector-utilities/SKILL.md` |
| Real Estate | `memory/sectors/real-estate/` | `skills/sector-real-estate/SKILL.md` |
| Communication | `memory/sectors/comms/` | `skills/sector-comms/SKILL.md` |

> Consumer Staples and Consumer Discretionary share `memory/sectors/consumer/ROLLING.md` by design — the file tracks both sub-sectors together.

### Alternative Data Files (4)

| File | Domain | What to Track |
|------|--------|--------------|
| `memory/alternative-data/sentiment/ROLLING.md` | Retail sentiment | Fear/Greed index, AAII survey, Reddit/Twitter directional bias |
| `memory/alternative-data/cta/ROLLING.md` | CTA positioning | Estimated CTA long/short equity exposure, trend-following signals |
| `memory/alternative-data/options/ROLLING.md` | Options flow | Put/call ratio, unusual activity, gamma exposure levels |
| `memory/alternative-data/politician/ROLLING.md` | Politician trades | Notable purchases/sales from congressional disclosure filings |

### Institutional Files (2)

| File | Domain | What to Track |
|------|--------|--------------|
| `memory/institutional/flows/ROLLING.md` | Institutional flows | Dark pool prints, large block trades, ETF flows |
| `memory/institutional/hedge-fund/ROLLING.md` | Hedge fund intel | 13F updates, prime brokerage positioning, known fund moves |

### International File (1)

| File | Domain | What to Track |
|------|--------|--------------|
| `memory/international/ROLLING.md` | International markets | Asia/Europe/EM macro, key central bank actions, FX interventions |

**Total: 24 ROLLING.md files** (6 core + 11 sector + 4 alt-data + 2 institutional + 1 international)

---

## Special Files

### BIAS-TRACKER.md

**Path**: `memory/BIAS-TRACKER.md`
**Format**: Markdown table, one row per session

**Columns (14)**:
| Column | Description |
|--------|------------|
| Date | YYYY-MM-DD |
| Macro | Bullish / Neutral / Bearish |
| Bonds | Bullish / Neutral / Bearish (for bonds/duration) |
| USD | Bullish / Neutral / Bearish |
| Gold | Bullish / Neutral / Bearish |
| Oil | Bullish / Neutral / Bearish |
| Crypto | Bullish / Neutral / Bearish |
| Equities | Bullish / Neutral / Bearish |
| Asia | Bullish / Neutral / Bearish |
| Europe | Bullish / Neutral / Bearish |
| EM | Bullish / Neutral / Bearish |
| Sentiment | Bull / Bear (market sentiment reading) |
| CTA | Long / Flat / Short (CTA equity positioning) |
| Conviction | Low / Medium / High |

**Example row:**
```
| 2026-04-05 | Bearish | Bullish | Bearish | Bullish | Neutral | Neutral | Bearish | Bearish | Neutral | Bearish | Bear | Flat | High |
```

**Rules**: Append a new row each session. Never edit past rows. Use standard values only (Bullish/Neutral/Bearish; Low/Medium/High; Long/Flat/Short; Bull/Bear).

### THESES.md

**Path**: `memory/THESES.md`
**Format**: Custom structured format (not ROLLING.md format)

Each thesis entry:
```markdown
## [THESIS NAME]
**Status**: Building | Confirmed | Extended | At Risk | Exited
**Added**: YYYY-MM-DD
**Thesis**: One paragraph description

**Evidence For**:
- [point]

**Evidence Against**:
- [point]

**Exit Trigger**: What would invalidate this thesis

### Updates
**YYYY-MM-DD**: [Status change or new evidence update]
```

---

## Memory File Shell Traversal

From scripts, always use:
```bash
find memory/ -name "ROLLING.md"     # ✅ correct — finds all subdirectory levels
memory/*/ROLLING.md                  # ❌ wrong — misses nested dirs like sectors/technology/
```

---

## Memory Search

```bash
./scripts/memory-search.sh "search term"

# Examples
./scripts/memory-search.sh "NVDA"
./scripts/memory-search.sh "credit spreads"
./scripts/memory-search.sh "CTA"
```

Searches all 23+ ROLLING.md files plus BIAS-TRACKER.md and THESES.md.

---

## Session Memory Protocol

**At session start:**
1. Identify which domains you'll be working in
2. Read the corresponding ROLLING.md file(s)
3. Read BIAS-TRACKER.md last 3-5 rows for recent bias

**At session end:**
1. Append new `## YYYY-MM-DD` entry to each updated domain's ROLLING.md
2. Add a row to BIAS-TRACKER.md
3. Update THESES.md if any thesis changed status
4. Run `git-commit.sh` to persist

**Do NOT:**
- Update memory mid-analysis (wait until you have complete findings)
- Add more than one date header per session per file
- Edit existing entries to "correct" them — append instead
