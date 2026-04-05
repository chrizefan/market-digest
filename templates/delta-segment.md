# 🔄 Delta — {{SEGMENT}} | {{DATE}}

> Baseline: {{BASELINE_DATE}} | Changes: {{CHANGE_COUNT}}

---

## Change Summary
- **Bias**: [UNCHANGED: X] or [SHIFTED: Was X → Now Y]
- **Material changes**: {{CHANGE_COUNT}} fields updated
- **Reason**: [1-sentence explanation of why this segment needed an update]

---

## CHANGED Fields

> List each changed field with Was/Now format.
> Use the exact field names from the full segment template.

### CHANGED: [Field Name]
- **Was**: [Previous value from baseline]
- **Now**: [Current value]
- **Reason**: [What caused the change]

### CHANGED: [Field Name]
- **Was**: [Previous value]
- **Now**: [Current value]
- **Reason**: [Catalyst]

---

## UNCHANGED

All other fields carry forward from baseline (`outputs/daily/{{BASELINE_DATE}}/{{SEGMENT_FILE}}`).

---

*Delta applied to: `outputs/daily/{{BASELINE_DATE}}/{{SEGMENT_FILE}}`*
*Memory updated: `{{MEMORY_FILE}}` ✓*
