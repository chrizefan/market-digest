# Platform Setup Guide

How to configure each AI platform to work with digiquant-atlas.

## GitHub Copilot (VS Code)

**Config file**: `.github/copilot-instructions.md`

Copilot reads this automatically when `applyTo: "**"` is in the frontmatter. No additional setup needed beyond the file existing in the repo.

```yaml
---
applyTo: "**"
---
# Your instructions here
```

**Usage patterns:**
- Chat: "Run the macro skill for today" → Copilot reads the skill file and guides you
- Edit: Copilot uses the instructions when suggesting code edits to scripts and skill files
- Agent mode: Use `@workspace` to run multi-step workflow tasks

**Current config**: `.github/copilot-instructions.md` ✅

---

## Claude Code (claude CLI)

**Config file**: `CLAUDE.md`

Claude Code auto-discovers `CLAUDE.md` in the current directory when you run `claude` from the repo root. No setup required — just run:

```bash
cd /path/to/digiquant-atlas
claude
```

**Usage patterns:**
```bash
claude -p "Run the 7-phase pipeline for today $(date +%Y-%m-%d)"
claude -p "Run just the macro segment"
claude -p "Search memory for any notes on NVDA"
```

**Current config**: `CLAUDE.md` ✅

---

## Claude.ai Projects

**Config file**: `CLAUDE_PROJECT_INSTRUCTIONS.md`

Copy the full contents of this file and paste into the Project Instructions field in your Claude.ai Project settings.

**Setup steps:**
1. Open claude.ai → Projects → New Project (or your existing project)
2. Go to Project Settings → Project Instructions
3. Paste contents of `CLAUDE_PROJECT_INSTRUCTIONS.md`
4. Attach relevant files: `config/watchlist.md`, `config/preferences.md`

**Current config**: `CLAUDE_PROJECT_INSTRUCTIONS.md` ✅

---

## Cursor

**Config files**: `.cursor/rules/` (v2, recommended) or `.cursorrules` (legacy)

### Cursor v2 (MDC Rules) — Recommended

MDC files in `.cursor/rules/` support frontmatter for smart rule application:

| File | Applies When |
|------|-------------|
| `.cursor/rules/01-overview.mdc` | Always (`alwaysApply: true`) |
| `.cursor/rules/02-skills-workflow.mdc` | When editing `skills/**/SKILL.md` |
| `.cursor/rules/03-memory-outputs.mdc` | When editing `memory/**/*.md` or `outputs/**/*.md` |

Cursor reads these automatically — no setup needed.

### Cursor Legacy (.cursorrules)

`.cursorrules` in the repo root is read by older Cursor versions. Current config: ✅

**Usage patterns in Cursor:**
- Open Composer (Cmd+I) with `@codebase` for full context
- Reference skill files directly: "Using @skills/macro/SKILL.md, run today's analysis"
- Use Agent mode for multi-step pipeline phases

---

## Windsurf (Codeium)

**Config file**: `.windsurfrules`

Windsurf reads `.windsurfrules` from the project root automatically.

**Current config**: `.windsurfrules` ✅

**Usage patterns:**
- Use Cascade (agent mode) for multi-step workflow execution
- Reference skill files in prompts: "Follow skills/equity/SKILL.md"

---

## Aider

**Config file**: `.aider.conf.yml` (optional)

Aider works well with this repo via `--read` flags to load context files:

```bash
# Start aider with market digest context
aider --read AGENTS.md --read config/watchlist.md --read config/preferences.md

# Run a specific skill
aider --read skills/macro/SKILL.md --message "Run the macro analysis for today"
```

**Optional config** `.aider.conf.yml`:
```yaml
read:
  - AGENTS.md
  - config/watchlist.md
  - config/preferences.md
model: claude-3-5-sonnet-20241022
```

---

## OpenHands / Devin / Generic Agents

**Config file**: `AGENTS.md`

These platforms read `AGENTS.md` from the repo root. The file contains:
- Full behavioral rules (Always/Never blocks)
- Complete memory protocol
- 7-phase pipeline reference
- Output file naming convention

**Setup**: Upload/clone the repo and point the agent at `AGENTS.md` as context.

---

## Cline (VS Code Extension)

Cline respects `CLAUDE.md` and `.clinerules` (if present). The current `CLAUDE.md` file works as Cline context.

**Usage**: Open Cline panel → start a conversation referencing `CLAUDE.md` for full context.

---

## MCP Servers (VS Code Copilot Agent Mode)

**Config file**: `.vscode/mcp.json`

MCP (Model Context Protocol) servers extend GitHub Copilot's agent mode with live data tools. They are invoked directly by the agent during pipeline execution — no manual script running needed.

### Enabling MCP in VS Code

1. Open VS Code Settings → search for `chat.mcp.enabled` → enable it
2. Open the Command Palette → **MCP: List Servers** to verify servers are loaded
3. In Copilot Chat (agent mode), tools from configured MCP servers appear automatically

### Configured Servers (repo)

These match [`.vscode/mcp.json`](../../.vscode/mcp.json). **Optional tools** — canonical prices for the app live in Supabase; use MCPs only when they add research value.

| Server ID | Data Source | Key / notes | Typical use |
|-----------|------------|-------------|---------------|
| `sec-edgar` | SEC EDGAR + XBRL, Form 4 | Docker + User-Agent string | Phase 2 (Institutional) |
| `fred` | FRED macro series | Free API key | Phase 3–4 |
| `crypto-feargreed` | Fear & Greed | No key | Phase 1 / crypto context |
| `polymarket` | Event probabilities | No key | Phase 1 (geopolitics) |
| `frankfurter-fx` | FX rates | No key | Phase 4C (Forex) |
| `world-bank` | WB indicators | No key | Phase 4E (International) |
| `coingecko` | Crypto market data | Optional key (public tier ok) | Phase 4D |
| `alpha-vantage` | Equities fundamentals/news | Key; low daily quota — use sparingly | Phase 5 |

### Setup Notes

```bash
# Docker required for sec-edgar
docker pull stefanoamorelli/sec-edgar-mcp:latest

# uv/uvx required for Python-based servers
curl -LsSf https://astral.sh/uv/install.sh | sh

# Node.js v18+ required for fred and coingecko (npx)
node --version
```

API keys are stored securely via VS Code's `inputs` prompt mechanism — never hardcoded. On first
use of a key-required server, VS Code will prompt once and cache the value for the session.

Full server details and prerequisites: `docs/ops/data-sources.md` → "MCP Servers" section.

---

## Platform Comparison

| Feature | Claude Code | GitHub Copilot | Cursor | Windsurf |
|---------|------------|----------------|--------|----------|
| Auto-reads config | ✅ `CLAUDE.md` | ✅ `.github/copilot-instructions.md` | ✅ `.cursor/rules/` | ✅ `.windsurfrules` |
| Agent mode | ✅ | ✅ (`@workspace`) | ✅ Composer | ✅ Cascade |
| Multi-file context | ✅ | ✅ | ✅ | ✅ |
| Sub-agent delegation | ✅ | Partial | Partial | Partial |
| Memory persistence | Via ROLLING.md | Via ROLLING.md | Via ROLLING.md | Via ROLLING.md |
| Best for | Full pipeline runs | Code editing + scripts | Interactive research | Long sessions |
