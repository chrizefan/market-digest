# ⚖️ Rebalance Decision — {{DATE}}

> Phase C output of SKILL-portfolio-manager.md
> Compares clean-slate recommendation vs current portfolio.json positions.
> Threshold: act on changes ≥5% OR thesis status change (even if <5%).

---

## Delta Summary

**Changes triggered**: [N] positions require action | [N] positions held unchanged
**Largest move**: [TICKER] [+/-X%]
**New entries**: [TICKER, TICKER] or None
**Exits**: [TICKER, TICKER] or None

---

## Rebalance Table

| Ticker | Current% | Recommended% | Change | Action | Urgency | Rationale |
|--------|----------|-------------|--------|--------|---------|-----------|
| | | | | Hold/Add/Trim/Exit/New | High/Normal/Monitor | |

**Actions legend:**
- **Hold** — within threshold and thesis intact
- **Add** — increase weight by change amount
- **Trim** — reduce weight by change amount
- **Exit** — close position (thesis broken or allocation → 0%)
- **New** — open new position not previously held

**Urgency legend:**
- **High** — thesis ❌ Challenged OR change >10% OR invalidation trigger approaching
- **Normal** — change 5–10% with intact thesis
- **Monitor** — change <5%, flag for next review

---

## Proposed Portfolio (Post-Rebalance)

| Ticker | New Weight% | Thesis | Status |
|--------|------------|--------|--------|
| | | | |

**Cash/BIL residual**: [X]%
**Total**: 100%

---

## PM Decision Notes

> Portfolio manager's synthesis commentary — why these changes and not others.

[2-3 sentences explaining the key positioning decision this session. Cite the macro regime and the most influential analyst signal.]

---

## Invalidation Watch

> Positions approaching their exit trigger.

| Ticker | Current Level | Exit Trigger | Distance | Action if Triggered |
|--------|--------------|-------------|----------|-------------------|
| | | | | |

---

## Memory Update

Append to `memory/portfolio/ROLLING.md`:
```
## {{DATE}}
- Rebalance actions: [list or "No changes — all within threshold"]
- Proposed portfolio: [key weights]
- Key PM decision: [1 sentence]
- Next invalidation watch: [ticker + level]
```

---

*Output of: `skills/SKILL-portfolio-manager.md` Phase C | Session: {{DATE}}*
*Updates: `config/portfolio.json` → proposed_positions[] | `memory/portfolio/ROLLING.md`*
