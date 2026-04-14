---
name: research-library
description: >
  Load curated portfolio research doctrine from docs/research/. Use when the portfolio manager,
  asset analyst, or orchestrator needs evidence-based allocation rules (factors, momentum, risk).
  Triggers: "research library", "paper notes", "tactical allocation doctrine", "cite research".
---

# Research library (ground truth)

## Purpose

Provide **short, citable** rules from the repo’s research notes—without loading every file every session.

## Canonical index

1. Read [`docs/research/LIBRARY.md`](../../docs/research/LIBRARY.md) first (table of contents).
2. For the user’s question (regime, factor, sizing, risk), open **1–3** matching files under [`docs/research/papers/`](../../docs/research/papers/) only.

## Output contract

- List **which files** you used (paths).
- Extract **2–5 actionable rules** (bullets) with section anchors if possible.
- State **how** they apply to today’s allocation or thesis—not generic book report prose.

## Token discipline

Do **not** paste entire papers. Summarize decision rules only.

## Obsidian-markdown conventions

When writing or updating `memory/THESES.md` or `docs/research/papers/*.md`, use obsidian-markdown syntax for navigability:

**Wikilinks** — cross-reference papers to theses and vice versa:
```markdown
See [[macro-regime]] for regime classification framework.
Active thesis: [[THESES#Trend Following Regime]].
```

**Callouts** — structured signal classification:
```markdown
> [!tip] Conviction signal
> Momentum + macro alignment confirmed → add weight.

> [!warning] Invalidation risk
> RSI > 75 and Fed pivot delay → reduce exposure.

> [!danger] Exit trigger
> Price < 200-day SMA for 3 consecutive closes.
```

Use `> [!tip]` for constructive signals, `> [!warning]` for conflicting signals, `> [!danger]` for invalidation triggers. Code and numerical output unchanged.

## Memory update

If research materially changes an active thesis, note it in the relevant `memory/*/ROLLING.md` and/or thesis tracker flow.
