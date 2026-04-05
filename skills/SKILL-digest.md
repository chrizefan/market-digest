---
name: market-digest
description: >
  Run this skill to produce the full daily market digest. Triggers when the user says "run today's digest",
  "daily analysis", "market update", "morning brief", or pastes the new-day prompt. Reads all config,
  memory, and watchlist files first, then runs each segment analysis, updates rolling memory files,
  and produces the master digest output file. Always use this skill for any full market analysis session.
---

# Market Digest — Master Orchestration Skill

This skill orchestrates the full daily market intelligence pipeline. Follow every step in order.

---

## Step 0: Load Context

Before doing anything else, read these files:
1. `config/watchlist.md` — the assets and sectors to cover
2. `config/preferences.md` — the user's trading style, risk profile, and digest preferences
3. All `memory/*/ROLLING.md` files — to understand evolving theses and prior context

Summarize internally what you've loaded. Do not print this to the user.

---

## Step 1: Run Segment Analyses

For each segment below, follow the corresponding SKILL file. Run them in this order:

1. **Macro** — `skills/SKILL-macro.md`
2. **Equities** — `skills/SKILL-equity.md`
3. **Crypto** — `skills/SKILL-crypto.md`
4. **Bonds & Rates** — `skills/SKILL-bonds.md`
5. **Commodities** — `skills/SKILL-commodities.md`
6. **Forex** — `skills/SKILL-forex.md`

Each segment analysis must produce:
- A **Bias** (Bullish / Bearish / Neutral / Conflicted) with a short rationale
- **Key data points** observed today
- **Notable moves** in tracked assets
- **Narrative / themes** active in this segment
- **Risks / watch-outs** for the next 24-72 hours
- **Memory update** — 2-4 bullet points to append to the segment's ROLLING.md

---

## Step 2: Update Rolling Memory Files

After completing each segment analysis, append the memory update to the corresponding file:
- `memory/equity/ROLLING.md`
- `memory/crypto/ROLLING.md`
- `memory/bonds/ROLLING.md`
- `memory/commodities/ROLLING.md`
- `memory/macro/ROLLING.md`
- `memory/forex/ROLLING.md`

Format for each daily memory entry:
```
## [DATE]
- [Key observation 1]
- [Key observation 2]
- [Evolving theme or thesis update]
- [Any thesis confirmation or contradiction]
```

---

## Step 3: Compile the Master Digest

Using the template at `templates/master-digest.md`, produce the full daily digest.

The digest must be saved to: `outputs/daily/YYYY-MM-DD.md`

The digest must include:
1. **Market Regime Snapshot** — one paragraph, overall risk-on/risk-off read
2. **Macro & Events** — scheduled events today + this week, key overnight data
3. **Equities** — sector rotation, index levels, notable movers from watchlist
4. **Crypto** — BTC/ETH + any watchlist alts, key levels, sentiment
5. **Bonds & Rates** — yield levels, curve shape, credit spreads, Fed watch
6. **Commodities** — energy, metals, key moves
7. **Forex** — DXY, key pairs, risk sentiment signal from FX
8. **Thesis Tracker** — for each active thesis in preferences.md, flag: ✅ Confirmed / ⚠️ Conflicted / ❌ Challenged / ⏳ No signal
9. **Actionable Summary** — top 3-5 things to act on or watch TODAY, ranked by priority
10. **Risk Radar** — what could blow up the current bias in the next 24-72 hours

---

## Step 4: Output

Print the full master digest to the conversation so the user can read it immediately.
Confirm which memory files were updated.
State the output file path.

---

## Quality Standards

- Be direct. State the bias. Don't hedge everything into meaningless mush.
- Use the user's preferences to filter for what matters to THEM, not general market commentary.
- When evidence is conflicted, say so clearly and explain both sides.
- Flag anything that contradicts the user's active theses.
- Do not repeat the same sentence twice in different sections.
- Every section should end with an implication or action, not just a description.
