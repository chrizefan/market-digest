# Pipeline Quality Log

> Tracks delta quality assessments and improvement proposals across sessions.

---

## 2026-04-06 — Delta #1 Post-Mortem

**Segments updated**: macro, crypto, us-equities, bonds, commodities, forex, international, alt-data (8 total)
**Segments carried forward**: institutional, all 11 sectors (energy -0.63%, just below 1% threshold)

**Triage accuracy**: Good. All mandatory segments updated. Threshold-triggered segments correctly identified. The alt-data update was valuable — ceasefire proposal is exactly the kind of cross-segment narrative catalyst that should trigger an alt-data delta. Energy sector (-0.63%) correctly flagged but below 1% threshold — noted in macro context instead.

**Materialization quality**: DIGEST.md reads naturally as a complete digest. The binary event framing is clear and actionable. All sections maintain proper structure.

**Portfolio actions**: Triggers fired (T-002 challenged, T-001 conditional, XLV exit pending). Deliberation completed. One trade recommended (EXIT XLV). Wednesday contingency plans documented. All deliberation accepted by PM.

**Data quality issue**: Fed Funds rate in baseline (4.75-5.00%) was stale data. Corrected to 3.75-3.50% (March 2026 FOMC confirmed). T-002 thesis reframed accordingly. This is a significant finding — the rolling memory should carry the correct rate.

**Deep dives**: 2 produced (ceasefire binary event, DXY sub-100 regime). Both qualified on multiple criteria. High quality analytical work with decision trees and portfolio implications.

**Phase 8 (tearsheet) issue**: `update-tearsheet.py` failed in sandbox environment due to network restrictions (yfinance cannot access Yahoo Finance from sandbox). This is an environment limitation, not a pipeline failure. The pre-fetched data in `outputs/daily/2026-04-06/data/` provides the same information in a different format. **Improvement proposal**: Pre-fetch script should write dashboard-compatible JSON that the tearsheet can consume without live yfinance calls.

**Phase 9 rating**: 8/10
- Strengths: Comprehensive delta coverage, high-quality deliberation, two substantive deep dives, clean materialized DIGEST.md
- Weaknesses: Tearsheet update failed (environment), no sector deltas (energy borderline case could have warranted one)

---

## Improvement Proposals

### IP-001 (2026-04-06): Tearsheet Offline Mode — ✅ RESOLVED
**Problem**: `update-tearsheet.py` requires live yfinance access. Sandbox environment blocks these calls.
**Proposal**: Add fallback mode that reads from `outputs/daily/{{DATE}}/data/quotes.json` and `macro.json` pre-fetched files. These contain all needed price data.
**Priority**: High — Phase 8 fails every automated run.
**Resolution** (2026-04-06): Implemented three-tier fallback in `update-tearsheet.py`:
1. yfinance + pandas made optional imports (graceful `_HAS_YFINANCE` flag)
2. `_load_prefetched_prices()` reads `outputs/daily/{latest}/data/quotes.json` as price source when yfinance unavailable
3. `deploy.yml` now runs `python scripts/update-tearsheet.py` before `npm run build` — docs always indexed from `outputs/` in CI
4. `git-commit.sh` now regenerates `dashboard-data.json` before committing
5. In CI without yfinance: docs, positions (with pre-fetched prices), and portfolio metadata all present; only live simulation/FX omitted

### IP-002 (2026-04-06): Fed Rate in Rolling Memory
**Problem**: Macro baseline had stale Fed Funds rate data (4.75-5.00% vs actual 3.5-3.75%).
**Proposal**: ROLLING.md for macro should explicitly track "Fed Funds actual rate" as a pinned field, updated each session with source citation.
**Priority**: Medium — stale rate data creates cascading thesis errors.

### IP-003 (2026-04-06): Energy Sector Delta Borderline
**Problem**: XLE was -0.62% (just below the 1% threshold). With a held position in XLE and a pending ceasefire catalyst, this warranted a brief sector note.
**Proposal**: For held positions, lower the sector delta threshold to 0.5% when the sector is in the portfolio. The analysis is more material when we own it.
**Priority**: Low — current system handled it via macro context.

### IP-004 (2026-04-06): GitHub Pages Not Reflecting Latest Run — ✅ RESOLVED
**Problem**: After pushing outputs, the web dashboard showed stale data. Documents didn't appear in the DigestTimeline. The `deploy.yml` workflow only ran `npm build` — it never regenerated `dashboard-data.json` from `outputs/`.
**Resolution** (2026-04-06):
1. `deploy.yml`: Added Python setup + `python scripts/update-tearsheet.py` step before `npm run build`
2. `git-commit.sh`: Now runs `update-tearsheet.py` before staging, ensuring committed JSON is fresh
3. `update-tearsheet.py`: Works without yfinance in CI (docs-only + prefetched-price mode)
**Root cause**: The frontend is a static SPA reading a single `dashboard-data.json`. That JSON must be regenerated from `outputs/` at build time, not just committed from a local run.

### IP-005 (2026-04-03): MCP-Based Data Fetch for Sandbox Environments
**Problem**: `fetch-market-data.sh` requires yfinance + pandas-ta, which are unavailable in sandboxed agent environments. This blocks the Data Layer Check in the orchestrator pipeline.
**Resolution** (2026-04-03):
1. Created `skills/mcp-data-fetch/SKILL.md` — comprehensive skill for fetching market data via MCP tools (FRED, Alpha Vantage, CoinGecko, Frankfurter)
2. Updated `skills/orchestrator/SKILL.md` Data Layer Check — now tries local scripts first, falls back to MCP skill if scripts fail
3. Updated `skills/data-fetch/SKILL.md` — documents MCP as sandbox/CI alternative
4. Updated `scripts/fetch-market-data.sh` — prints MCP guidance instead of just failing when yfinance is missing
**Coverage**: MCP mode provides yield curve (FRED), VIX (FRED), FX rates (Frankfurter), crypto (CoinGecko), and stock/ETF prices + RSI/SMA (Alpha Vantage). Main gaps vs yfinance: MACD, Bollinger Bands, ATR, volume ratio, SKEW — these are supplementary and downstream skills handle nulls gracefully.
