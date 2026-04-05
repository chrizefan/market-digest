# 🔬 Asset Analyst Report — {{TICKER}} | {{DATE}}

> Analyst: {{CATEGORY}} sub-agent
> ⚠️ BLINDED: This analyst does NOT have access to current portfolio weights or config/portfolio.json.
> Data sources: Phase 1–5 segment outputs already produced this session.

---

## Asset Profile

| Field | Value |
|-------|-------|
| **Ticker** | {{TICKER}} |
| **Name** | {{NAME}} |
| **Category** | {{CATEGORY}} |
| **Related Segment File** | `outputs/daily/{{DATE}}/{{SEGMENT_FILE}}` |
| **Active Thesis ID(s)** | {{THESIS_IDS}} |

---

## Bull Case

> Three specific, evidence-backed reasons to own this asset right now.

1. **[Factor]**: [Evidence with data point from today's session]
2. **[Factor]**: [Evidence with data point]
3. **[Factor]**: [Evidence with data point]

**Bull Conviction Level**: High / Medium / Low

---

## Bear Case

> Three specific risks or reasons NOT to own this asset.

1. **[Risk]**: [Specific condition or data point]
2. **[Risk]**: [Specific condition or data point]
3. **[Risk]**: [Specific condition or data point]

**Bear Conviction Level**: High / Medium / Low

---

## Analyst Verdict

**Base Bias**: Bullish / Bearish / Neutral / Conflicted

**Thesis Status**:
- {{THESIS_ID}}: ✅ Confirmed / ⚠️ Conflicted / ❌ Challenged / ⏳ No signal today

**Entry Signal**: [Condition that supports initiating or adding to this position]

**Exit / Stop Condition**: [Specific, measurable condition that would break the thesis]

---

## Recommended Weight

> Use the quantized scale only: 0% / 5% / 10% / 15% / 20%
> Max single ETF: 20%. Justify anything above 10%.

**Recommended Weight**: [X]%

**Rationale**: [1-2 sentences explaining the sizing decision — why this weight and not higher/lower]

**Theme Bucket**: commodity_safe-haven / commodity_energy / equity_defensive / equity_growth / fixed_income / cash

---

*Output of: `skills/SKILL-asset-analyst.md` | Session: {{DATE}}*
