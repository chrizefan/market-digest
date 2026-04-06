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

## Position P&L + CAD FX Impact

> All positions are USD-denominated; home currency is CAD (`investor_currency` in `config/portfolio.json`).
> FX effect = change in USD/CAD since entry. Rising USD strengthens CAD returns; falling USD erodes them.
> Entry prices: from `entry_price_usd` field in portfolio.json, or best-effort historical close if null.

| Ticker | Weight% | Entry Price (USD) | Current Price (USD) | USD Rtn% | USD/CAD Entry | USD/CAD Now | FX Effect% | CAD Rtn% |
|--------|---------|------------------|--------------------|---------|--------------|------------|-----------|----------|
| | | | | | | | | |

**Portfolio weighted USD return**: X.X%
**CAD/USD FX drag or boost**: X.X%
**Portfolio weighted CAD return**: X.X%

*Key risk*: [Which positions are most exposed to CAD FX headwind? E.g. USD T-bills carry full FX risk with capped USD upside.]

---

## Evolution Log Update

Append to `outputs/daily/{{DATE}}/evolution/proposals.md`:
```
## {{DATE}}
- Rebalance actions: [list or "No changes — all within threshold"]
- Proposed portfolio: [key weights]
- Key PM decision: [1 sentence]
- Next invalidation watch: [ticker + level]
- CAD FX note: [FX drag/boost direction and bp estimate]
```

---

*Output of: `skills/SKILL-portfolio-manager.md` Phase C | Session: {{DATE}}*
*Updates: `config/portfolio.json` → proposed_positions[] | `memory/portfolio/ROLLING.md`*
