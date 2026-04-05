# docs/agentic/ — Agentic Development Documentation

This folder is the central reference for running the Market Digest pipeline on any AI platform. Start here.

## What Is Market Digest?

A daily market intelligence system that orchestrates a 7-phase pipeline of AI research agents. Each phase builds on the previous: alternative data flows into institutional analysis, which informs macro regime determination, which drives asset-class and sector research, all synthesized into a single daily digest.

## Quick Start (Any Platform)

**Full daily digest:**
```
Read skills/SKILL-orchestrator.md and run the full 7-phase pipeline.
Today's date is YYYY-MM-DD. Output goes to outputs/daily/YYYY-MM-DD/
```

**Single segment:**
```
Read skills/SKILL-macro.md and produce today's macro analysis.
Date: YYYY-MM-DD. Write to outputs/daily/YYYY-MM-DD/macro.md
Update memory/macro/ROLLING.md
```

**Thesis check:**
```
Read memory/THESES.md and config/preferences.md.
Review today's market action against each active thesis.
```

## Platform Setup

| Platform | Config File | Notes |
|----------|------------|-------|
| Claude Code | `CLAUDE.md` | Auto-read from repo root |
| Claude.ai Projects | `CLAUDE_PROJECT_INSTRUCTIONS.md` | Paste into Project Instructions |
| GitHub Copilot | `.github/copilot-instructions.md` | `applyTo: "**"` frontmatter |
| Cursor | `.cursor/rules/` (MDC) or `.cursorrules` (legacy) | Rules auto-applied |
| Windsurf | `.windsurfrules` | Auto-read from repo root |
| OpenHands / Devin | `AGENTS.md` | Generic cross-platform |

See `PLATFORMS.md` for detailed setup instructions per platform.

## Documentation Index

| File | Contents |
|------|----------|
| `README.md` | This file — entry point |
| `ARCHITECTURE.md` | System design, data flows, file dependency map |
| `PLATFORMS.md` | Platform-specific setup guides |
| `AGENTS.md` | Named agent role catalog with capabilities |
| `WORKFLOWS.md` | Daily/weekly/monthly step-by-step workflows |
| `MEMORY-SYSTEM.md` | All 23 ROLLING.md files explained + BIAS-TRACKER |
| `SKILLS-CATALOG.md` | All 35+ skills indexed with phase/output/memory |
| `PROMPTS.md` | Copy-paste prompt patterns for each task type |

## Agent Definitions

Named agent roles live in `agents/`:

| Agent File | Role |
|-----------|------|
| `agents/orchestrator.agent.md` | Full 7-phase pipeline driver |
| `agents/sector-analyst.agent.md` | Single or multi-sector deep dive |
| `agents/alt-data-analyst.agent.md` | Phase 1 alternative data |
| `agents/institutional-analyst.agent.md` | Phase 2 institutional intel |
| `agents/research-assistant.agent.md` | Ad-hoc research + ticker questions |
| `agents/thesis-tracker.agent.md` | Portfolio thesis management |

## Key Rules (Apply to All Platforms)

1. Memory files are **append-only** — never rewrite history
2. Output files are **agent-generated** — never manually edit `outputs/daily/`
3. Read `config/watchlist.md` + `config/preferences.md` at every session start
4. Use `{{DATE}}` in output paths, never hardcode dates
5. macOS sed: `sed -i ""` not `sed -i`
