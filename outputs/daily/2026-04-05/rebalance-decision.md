# 🔄 Rebalance Decision — 2026-04-05

> Comparing: Clean-slate recommendation vs. current portfolio.json positions
> Note: This is the FIRST baseline run — establishes initial recommendations.

---

## Rebalance Table

| Ticker | Current % | Recommended % | Delta | Action | Urgency |
|--------|-----------|--------------|-------|--------|---------|
| BIL | 32% | 35% | +3% | Monitor (within threshold) | Low |
| IAU | 20% | 20% | 0% | HOLD | None |
| SHY | 15% | 15% | 0% | HOLD | None |
| XLE | 12% | 15% | +3% | Monitor / ADD 3% | Medium |
| XLP | 8% | 10% | +2% | Monitor (within threshold) | Low |
| DBO | 5% | 5% | 0% | HOLD | None |
| XLV | 8% | 0% | -8% | **EXIT** | **High** |

---

## Rebalance Actions Required

### HIGH URGENCY
1. **EXIT XLV (8% → 0%)**: Healthcare is the worst defensive sector. Drug pricing policy risk + losing relative strength to XLP/XLU. Thesis T-003 better expressed through XLP. Sell entire XLV position Monday open.

### MEDIUM URGENCY
2. **ADD XLE (12% → 15%)**: Thesis T-001 strongest in portfolio. War premium intact at WTI $112. Institutional flows +$1.8B weekly. Add 3% at market on Monday. However, if WTI gaps above $118 on Sunday open, DELAY add — chasing into parabolic is poor risk management.

### LOW URGENCY (within threshold, monitor for now)
3. **BIL (32% → 35%)**: Receive XLV exit proceeds (8%). Net: +3% to BIL after XLE add. Could also split between BIL and XLP.
4. **XLP (8% → 10%)**: Minor add. Can execute alongside the XLV → BIL/XLP reallocation.

---

## PM Decision Notes

**This week's key portfolio message**: The portfolio is directionally correct. The only significant action is exiting XLV — it's the wrong defensive instrument for this regime. Healthcare's drug pricing headwinds and loss of relative strength make it inferior to XLP (pricing power) and BIL (risk-free yield).

The energy position increase (12% → 15%) reflects conviction in T-001 but is modestly sized due to CTA crowding. We are NOT going max energy despite regime alignment — crowding discipline matters more than regime conviction at the 90th percentile.

Gold (IAU 20%) stays maximum. The -16% correction from ATH is an opportunity, not an exit signal. Gold's dual tailwind (geopolitical + inflation) is the best risk/reward setup in the portfolio.

**Net effect**: Portfolio becomes SLIGHTLY more defensive (50% cash/near-cash, up from 47%) while maintaining commodity exposure.

---

## Proposed Portfolio (Post-Rebalance)

| Ticker | Weight | Role |
|--------|--------|------|
| BIL | 35% | Cash fortress |
| IAU | 20% | Gold / geopolitical + inflation hedge |
| SHY | 15% | Short-duration safety |
| XLE | 15% | Energy / war thesis |
| XLP | 10% | Defensive equity / pricing power |
| DBO | 5% | Oil / high-beta war trade |
| **Total** | **100%** | |

---

## Invalidation Watch

| Position | Exit Trigger | Distance | Urgency |
|----------|-------------|----------|---------|
| DBO | WTI < $95 (two closes) | ~15% from current | Medium |
| IAU | Gold < $4,200/oz sustained | ~4.5% from current | Low |
| XLE | WTI < $80 sustained | ~29% from current | Low |
| XLP | XLP < $77 (200-DMA break) | ~6% from current | Low |

No positions are within 10% of invalidation triggers. Next scheduled review: 2026-04-07 (Monday delta).

---

## Execution Plan (Monday April 7)

1. **Pre-market**: Check oil futures (Sunday night open). If WTI < $105, DELAY all adds.
2. **At open**: Sell XLV (market order, full 8% position).
3. **After XLV fills**: Buy 3% XLE, 2% XLP at market.
4. **Remainder**: 3% to BIL (limit order at $91.40 or better).
5. **Confirm**: Run `./scripts/validate-portfolio.sh --proposed` after updating portfolio.json.
