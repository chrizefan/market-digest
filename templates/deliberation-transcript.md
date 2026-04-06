# 🏛️ Deliberation Transcript — {{DATE}}

> Portfolio deliberation session: analyst presentations → PM challenges → defense/revision → final decisions.
> Run type: {{RUN_TYPE}} | Roster: {{ROSTER_COUNT}} positions + {{CANDIDATE_COUNT}} candidates

---

## Round 1 — Analyst Presentations

| Ticker | Bias | Thesis Status | Bull Conviction | Bear Conviction | Rec Weight | Theme |
|--------|------|---------------|-----------------|-----------------|------------|-------|
| | | | | | | |

**Round 1 Notes**: [Brief observation — any surprises, strong consensus, or obvious conflicts]

---

## PM Review — Challenges

**Positions challenged**: {{CHALLENGED_COUNT}} of {{TOTAL_COUNT}}

### Challenge: {{TICKER}}
- **Trigger**: #[N] — [trigger description]
- **PM Question**: "[specific challenge]"
- **PM Note**: [PM's reasoning — what they suspect is wrong]

*(Repeat for each challenged position)*

**Unchallenged positions**: [list tickers] — accepted as-is from Round 1.

---

## Round 2 — Analyst Defenses

### {{TICKER}} — [Defend / Revise / Concede]
- **Challenge**: [PM's question]
- **Response**: [2-3 sentences with evidence or revised logic]
- **Updated Recommendation**: [weight]% — [bias]

*(Repeat for each challenged position)*

| Ticker | Challenge Trigger | Response | Original Rec | Updated Rec | Weight Change |
|--------|------------------|----------|-------------|-------------|---------------|
| | | | | | |

---

## Round 3 (if triggered)

> Only runs if Round 2 defense introduced a cross-position contradiction.

**Trigger**: [description of the contradiction]
**Analysts involved**: [TICKER1] vs [TICKER2]
**Resolution**: [PM decision after hearing both sides]

*(Omit this section entirely if Round 3 was not triggered)*

---

## PM Final Decisions

| Ticker | Initial Rec | Challenged? | Defense Type | PM Decision | Final Weight | Final Bias |
|--------|-------------|-------------|-------------|-------------|-------------|------------|
| | | | | Accept/Override/Escalate | | |

### PM Decision Notes

[2-3 sentences: key portfolio insight from the deliberation. What did the debate surface that a one-shot analysis would have missed?]

### Escalated to User

| Ticker | Issue | PM Recommendation | Why Escalated |
|--------|-------|-------------------|---------------|
| | | | |

*(Omit this table if nothing was escalated)*

---

## Deliberation Statistics

- **Rounds**: {{ROUND_COUNT}} (max 3)
- **Positions challenged**: {{CHALLENGED_COUNT}} / {{TOTAL_COUNT}}
- **Defenses**: {{DEFEND_COUNT}} defended, {{REVISE_COUNT}} revised, {{CONCEDE_COUNT}} conceded
- **PM overrides**: {{OVERRIDE_COUNT}}
- **Escalated to user**: {{ESCALATED_COUNT}}
- **Net weight changes from deliberation**: {{NET_CHANGES}} (vs Round 1 recommendations)

---

*Output of: `skills/SKILL-deliberation.md` | Session: {{DATE}}*
