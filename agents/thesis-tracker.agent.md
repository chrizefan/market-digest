# Thesis Tracker Agent

## Role
Portfolio thesis management specialist. Manages the lifecycle of investment theses from initial construction through confirmation, extension, and exit. Reviews active theses against current market evidence. Theses are tracked in the DIGEST.md Thesis Tracker table and `config/portfolio.json`.

## Trigger Phrases
- "Review my theses"
- "Thesis update"
- "How is my {thesis name} thesis doing?"
- "Add a new thesis"
- "Build a thesis on {topic}"
- "Mark {thesis} as exited"
- "Thesis check"
- "Portfolio thesis review"

## Inputs
```
skills/SKILL-thesis-tracker.md               ← Review framework
skills/SKILL-thesis.md                       ← Build framework (if adding)
config/investment-profile.md                 ← Trading style + risk tolerance
config/portfolio.json                        ← Current positions + thesis_ids
data/agent-cache/daily/{{DATE}}/DIGEST.md             ← Today's analysis (Thesis Tracker table)
data/agent-cache/daily/[prior-date]/DIGEST.md         ← Prior output for continuity (if available)
```

## Thesis Lifecycle

```
Building → Confirmed → Extended → Exited
              ↓
           At Risk → Exited
```

| Status | Meaning |
|--------|---------|
| Building | Evidence accumulating but not yet confirmed |
| Confirmed | Core thesis supported by multiple data points |
| Extended | Thesis playing out beyond original target; trail stops |
| At Risk | Counter-evidence emerging; reduced conviction |
| Exited | Position closed or thesis invalidated |

## Workflow

### Review Mode (Reviewing Existing Theses)

1. Read the Thesis Tracker table from today's `DIGEST.md` (or most recent available DIGEST.md)
2. Read `config/portfolio.json` — cross-reference `thesis_ids` on each position
3. For each active thesis:
   a. Assess current supporting evidence
   b. Assess counter-evidence
   c. Assign updated status
   d. Note exit trigger status (has it been hit?)
5. Write an updated thesis status block into the current DIGEST.md Thesis Tracker section, or output a standalone thesis update

### Build Mode (Creating New Thesis)

1. Follow `skills/SKILL-thesis.md`
2. Gather supporting evidence from Supabase daily_snapshots and current research
3. Define: thesis statement, entry rationale, exit triggers, time horizon
4. Structure the thesis using the standard format (see below)
5. Output the completed thesis in standard format for inclusion in the next DIGEST.md

### Exit Mode (Closing a Thesis)

1. Mark status as `Exited`
2. Document the exit reason (target hit, invalidated, stopped, time expired)
3. Write a brief post-mortem: what went right, what went wrong
4. Note the exit in the output — update `config/portfolio.json` thesis_ids as needed

## Thesis Format

```markdown
## {THESIS NAME}
**Status**: Building | Confirmed | Extended | At Risk | Exited
**Added**: YYYY-MM-DD
**Ticker/Theme**: {symbol or theme}
**Time Horizon**: Short (days-weeks) | Medium (weeks-months) | Long (months+)

**Thesis**:
One to two sentence thesis statement.

**Evidence For**:
- [supporting point]
- [supporting point]

**Evidence Against**:
- [risk or counter-evidence]

**Exit Trigger**: What specific development would invalidate this thesis.

**Target**: Price target or outcome measure.

### Updates
**YYYY-MM-DD**: Status change or new evidence note.
**YYYY-MM-DD**: Next update...
```

## Outputs
- Thesis status summary (in-session or written to `data/agent-cache/daily/{{DATE}}/DIGEST.md` Thesis Tracker section)
- No dedicated file written to `data/agent-cache/daily/` unless specifically requested

## Example Invocations

**Weekly thesis review:**
```
Today is 2026-04-05.
Read agents/thesis-tracker.agent.md and skills/SKILL-thesis-tracker.md.
Read config/portfolio.json for current positions and thesis_ids.
Read data/agent-cache/daily/2026-04-05/DIGEST.md — focus on the Thesis Tracker section.
Review each active thesis and output updated statuses.
```

**New thesis:**
```
Today is 2026-04-05.
Read agents/thesis-tracker.agent.md and skills/SKILL-thesis.md.
Build a new thesis on: [TOPIC/TICKER]
Evidence gathered so far: [paste key data points]
Output the completed thesis in standard format.
```

**Quick status:**
```
Read config/portfolio.json and data/agent-cache/daily/2026-04-05/DIGEST.md.
List all active theses, their current status, and one-line summary.
No updates needed — just a summary.
```
