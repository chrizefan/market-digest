#!/usr/bin/env python3
"""
One-time repair: publish all granular per-segment delta docs for 2026-04-15.

Derives content from the T150000Z mid-session research-delta payload and the
existing aggregate deltas/sectors.delta.md, then inserts the full canonical
set of per-segment documents as defined in templates/research-manifest.json.

Run with: python3.12 scripts/repair_apr15_granular_deltas.py
"""

import os, sys, json
from datetime import date as _date

# ── env ───────────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv("config/supabase.env")
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.environ.get("SUPABASE_SERVICE_KEY", "")
    or os.environ.get("SUPABASE_ANON_KEY", "")
)

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in config/supabase.env")

try:
    from supabase import create_client
except ImportError:
    sys.exit("ERROR: supabase-py not installed. Run: python3.12 -m pip install supabase --break-system-packages")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

DATE = "2026-04-15"
RUN_TYPE = "delta"
BASELINE_DATE = "2026-04-12"
SCHEMA_VERSION = "1.0"

# ─────────────────────────────────────────────────────────────────────────────
# Content derived from research-delta/20260415T150000Z.json + T100000Z.json
# ─────────────────────────────────────────────────────────────────────────────

DOCS: list[dict] = []

def doc(key: str, title: str, content: str):
    DOCS.append({
        "document_key": key,
        "title": title,
        "date": DATE,
        "run_type": RUN_TYPE,
        "doc_type": "Research Delta",
        "content": content.strip(),
        "payload": {
            "schema_version": SCHEMA_VERSION,
            "doc_type": "Research Delta",
            "date": DATE,
            "baseline_date": BASELINE_DATE,
            "run_type": RUN_TYPE,
            "title": title,
            "content": content.strip(),
        },
    })

# ── US Equities ───────────────────────────────────────────────────────────────
doc("deltas/us-equities.delta.md", "US Equities", """
# US Equities — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Iran talks failure absorbed; market holds gains

## Session Overview
QQQ $628.60 (session range $620.10–$628.60), up from $624 close on Apr 14.
SPY: +1.22% session. Market holding gains despite Iran Islamabad talks failure —
equities pricing a deal eventually, not collapse.

## Mega-Cap Technology
AAPL, MSFT, META, NVDA earnings scheduled April 22–25. AI capex thesis intact.
No material pre-earnings guide revisions. QQQ holding $628 = constructive setup
into the earnings gauntlet.

## Banking Sweep Complete (XLF)
MS Q1 beat + BAC Q1 beat ($0.83 adj EPS vs $0.77 est) = 6-for-6 major bank sweep.
PNC Q1 earnings today — expected EPS $3.93, revenue $6.21B. If beat, extends the
bank sweep narrative.

## Earnings Watch (Apr 15)
- **PNC Financial (PNC):** Q1 2026 results. Beat would extend XLF momentum.
- **Progressive (PGR):** Q1 2026 earnings. Consumer financial health monitor.
- Also: JBHT, MTB

## Breadth & Factor
Equities resilient in face of Iran/macro uncertainty. Risk premium compression
continuing as Iran ceasefire deal still deemed probable by markets. Factor:
Growth > Value intraday; Momentum outperforming.

## Key Levels
- QQQ: $620 support | $628.60 current | $635 next resistance
- SPY: ~$556 support level; current session positive

## Forward Catalyst
April 21: Iran ceasefire deadline (binary event). April 22–25: Mega-cap tech earnings.
April 28–29: FOMC (on hold; ≥1 cut year-end priced in).
""")

# ── Bonds & Rates ─────────────────────────────────────────────────────────────
doc("deltas/bonds.delta.md", "Bonds & Rates", """
# Bonds & Rates — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Rates stable; FOMC blackout begins

## Yield Curve (FRED, Apr 13 close — FOMC blackout prevents new guidance)
| Tenor | Yield | Change vs Apr 12 |
|-------|-------|-----------------|
| 2Y    | 3.78% | —               |
| 10Y   | 4.30% | +5bps           |
| 2s10s | +52bps| Steepening      |

## FOMC Status
FOMC blackout period has begun ahead of the Apr 28–29 meeting.
Market pricing: **on hold** at Apr meeting; ≥1 cut priced for year-end.
Last Fed signals pre-blackout consistent with patient stance given
sticky services inflation.

## HY / Credit
No material spread widening. Risk-on regime supports tight credit spreads.
Iran uncertainty has not translated into credit stress signals.

## Duration Positioning
No tactical change. Cautious on duration given 10Y at 4.30% and upcoming
earnings season likely to keep risk appetite supported. Carry-forward from
Apr 14 pre-market run.

## Forward Watch
- Apr 21: Retail sales data (rescheduled from Apr 15).
- Apr 21: Iran ceasefire expiry — binary risk event for duration.
- Apr 28–29: FOMC meeting. Any hawkish surprise would pressure long duration.
""")

# ── Commodities ───────────────────────────────────────────────────────────────
doc("deltas/commodities.delta.md", "Commodities", """
# Commodities — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | WTI bouncing after 8% drop; Gold flight-to-safety bid

## Energy
**WTI Crude:** $91.68/bbl (+0.44% intraday Apr 15).
- Apr 14 saw ~8% drop as initial Iran peace-talk optimism spiked.
- Small bounce on Apr 15 reflects partial risk premium reload after
  Islamabad talks failed — but market is NOT pricing a full return to
  $97+ "no deal" scenario since new talks remain under discussion.
- Key level: Sustained break above $95 would signal risk-premium return.
  Break below $88 = market pricing high-probability deal.

**Brent:** ~$93.50 tracking WTI.

## Precious Metals
**Gold:** ~$4,821–4,830 (+1.4% from $4,760 baseline).
- Flight-to-safety bid reasserted after Islamabad talks collapsed.
- Gold acting as a geopolitical hedge more than an inflation hedge in this regime.

## Industrial Metals / Agriculture
No material update — carry forward from Apr 12 baseline:
- Copper: Tracking China demand concerns + global PMI softness.
- No USDA updates or major agricultural catalyst today.

## CTA / Positioning
Oil CTAs unwinding energy longs as WTI declined from $97 baseline.
Gold CTAs likely rebuilding positions on today's bounce.

## Forward Watch
- Apr 21: Iran ceasefire deadline — WTI will binary gap on outcome.
  No deal → $97+; Deal signed → $80-85 target.
""")

# ── Forex ─────────────────────────────────────────────────────────────────────
doc("deltas/forex.delta.md", "Forex", """
# Forex — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | DXY structural weakness persists; Iran binary on April 21

## DXY (US Dollar Index)
**DXY ~99** — structural weakness trend intact.
- Below 100 psychological level; approaching 97-98 zone which would be
  significant technical breakdown.
- Iran resolution scenario: DXY targets 96–97 (risk-on, USD safe-haven
  premium unwinds).
- No-deal escalation scenario: DXY reverses to 101–103 (flight-to-USD).

## Major Pairs
| Pair    | Signal               |
|---------|----------------------|
| EUR/USD | Supported by DXY weakness; structural EUR strength |
| USD/JPY | BOJ unchanged; JPY carry-trade stable |
| USD/CNH | China/EM tariff overhang weighing; watch FXI |
| GBP/USD | Tracking EUR/USD direction |

## EM / Cross-Asset
EFA and EEM supported by DXY weakness trend.
India (INDA) outperforming vs. China (FXI) which faces tariff headwinds.
DXY sustained below 98 would open an EFA vs. SPY spread trade opportunity.
No position trigger yet.

## Forward Watch
- Apr 21: Iran deal vs. no-deal binary = key DXY inflection event.
- Retail Sales Apr 21: USD sensitivity to growth data.
""")

# ── SECTORS: Individual docs ───────────────────────────────────────────────────

doc("deltas/sectors/technology.delta.md", "Technology (XLK)", """
# Technology (XLK) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Overweight maintained; earnings catalyst upcoming

## Bias: **OVERWEIGHT** (Medium-High confidence)
QQQ $628.60, holding session highs. Mega-cap tech (AAPL, MSFT, META, NVDA)
earnings scheduled April 22–25. No pre-earnings guide revisions.

## Key Holdings / Drivers
- AI capex thesis intact. Hyperscaler spend commitments (MSFT Azure, GOOGL,
  AMZN AWS) remain on track despite macro uncertainty.
- Semiconductor cycle: NVDA supply constraints easing; AMD challenging in AI GPU.
- No material regulatory overhang events today.

## Session
QQQ session range $620.10–$628.60. Holding $625+ = constructive.
No material sell-the-rip signals. Institutional flows remain supportive.

## Forward Watch
- Apr 22–25: AAPL, MSFT, META, NVDA earnings — the defining catalyst for Q2.
- AI capex data in earnings calls will drive the next leg of XLK direction.
""")

doc("deltas/sectors/financials.delta.md", "Financials (XLF)", """
# Financials (XLF) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | OVERWEIGHT — 6-for-6 bank sweep complete

## Bias: **OVERWEIGHT** (High confidence — upgraded from Medium-High)

## Bank Sweep Complete (6-for-6)
JPM, C, WFC, GS, MS, BAC have all reported Q1 beats:
- **BAC Q1 2026:** $0.83 adj EPS vs. $0.77 estimate — beat.
- **MS Q1 2026:** Beat.
6 major banks, 6 Q1 beats. Strong net interest income, resilient credit, M&A recovery.

## Today: PNC Q1 2026
Expected EPS $3.93, revenue $6.21B. Release today.
A beat would extend the bank sweep narrative to regional banks and
reinforce XLF overweight conviction.

## Credit Quality
No HY spread widening; delinquencies not signaling stress. Consumer financial
health remains resilient despite rate pressure.

## Forward Watch
- PNC earnings today: key regional bank read-through.
- Progressive (PGR) earnings today: consumer insurance = financial health proxy.
""")

doc("deltas/sectors/healthcare.delta.md", "Health Care (XLV)", """
# Health Care (XLV) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — no material catalyst today

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

No material changes today. Carry forward existing scorecard from April 12 baseline.

## Key Watch Items
- Drug approvals pipeline: No new FDA approvals today.
- Medicare / Medicaid policy: No new legislative developments.
- Biotech catalyst calendar: No major PDUFA dates this week.

## Defensive Character
XLV is providing mild defensive characteristics in the Iran uncertainty regime.
No rotation signal into XLV vs. SPY yet.

## Forward Watch
- Earnings season (late April / early May) will be key for major pharma.
- Any Medicare pricing executive orders = material risk to XLV.
""")

doc("deltas/sectors/energy.delta.md", "Energy (XLE)", """
# Energy (XLE) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Underweight maintained; WTI bouncing but thesis unchanged

## Bias: **UNDERWEIGHT** (no change)

## WTI Context
WTI $91.68 (+0.44% intraday Apr 15) after -8% on Apr 14.
The small bounce reflects partial risk premium reload after Islamabad talks
failed, but the market is NOT pricing a full return to $97+ no-deal scenario.

## Thesis Summary
XLE underweight maintained. The Iran deal probability remains above 50%
(new talks under discussion for before April 21 ceasefire expiry).
A successful deal → WTI $80-85 → XLE significant downside.
Risk is asymmetric to the downside for XLE until April 21 resolution.

## CTA Positioning
Oil CTAs began unwinding energy longs on the Apr 14 WTI -8% move.
No signal of CTAs re-building long energy positions yet.

## Forward Watch
- **Apr 21: Iran ceasefire deadline** — binary event for XLE.
  No deal → WTI $97+ → XLE reversal.
  Deal signed → WTI $80-85 → continue XLE underweight.
""")

doc("deltas/sectors/industrials.delta.md", "Industrials (XLI)", """
# Industrials (XLI) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — no material catalyst today

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

No material changes today.

## Key Watch Items
- **JBHT (J.B. Hunt Transport):** Q1 2026 earnings today.
  Trucking results are an economic activity proxy. Watch for volume trends.
- Defense sector: No new contract awards or geopolitical escalation that
  changes the defense thesis.
- Aerospace: Supply chain normalization continuing.
- Tariff exposure: Ongoing monitoring; no new executive order signals today.

## Forward Watch
- JBHT earnings today = trucking/freight economic signal.
- Empire State Manufacturing (April): Released today — ISM proxy.
- NAHB Housing Index: Released today — construction materials demand read.
""")

doc("deltas/sectors/consumer-discretionary.delta.md", "Consumer Discretionary (XLY)", """
# Consumer Discretionary (XLY) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — no material catalyst today

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

No material changes today.

## Key Watch Items
- **Retail Sales:** Rescheduled to April 21 — key consumer health read.
- AMZN: No major catalyst today. AWS earnings late April.
- TSLA: No material news.
- Travel / Leisure: Tracking positively with risk-on backdrop, but no
  new catalyst.

## Consumer Health Signals
Consumer confidence and spending remain resilient despite Iran uncertainty.
F&G index in equity market is not showing consumer distress in spending data.

## Forward Watch
- Apr 21: Retail Sales data — critical for XLY directional bias update.
""")

doc("deltas/sectors/consumer-staples.delta.md", "Consumer Staples (XLP)", """
# Consumer Staples (XLP) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | UNDERWEIGHT — 3rd consecutive underperformance day

## Bias: **UNDERWEIGHT** (T-003 CHALLENGED — Thursday decision point)

## Performance
3rd consecutive day of underperformance vs. SPY. Risk-on backdrop
continues to favor cyclical vs. defensive rotation.

## Thesis Check (T-003)
XLP underweight thesis challenged but not invalidated:
- Carry forward: thesis hold through Thursday decision point.
- If risk-on continues and XLP underperforms a 4th consecutive session,
  re-evaluate the thesis strength.
- A flight-to-safety event (Iran escalation) would rescue XLP and
  require defensive rotation review.

## Input Costs
No new commodity input data today. Household staples margins stable.

## Forward Watch
- **Thursday: XLP thesis decision point.**
- Apr 21: Iran binary — defense/staples rotation risk if no deal.
""")

doc("deltas/sectors/communication-services.delta.md", "Comm. Services (XLC)", """
# Comm. Services (XLC) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — no material catalyst today

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

No material changes today.

## Key Holdings / Drivers
- **GOOGL:** No catalyst today. Earnings late April — AI search + cloud.
- **META:** No catalyst today. AI ad efficiency continuing.
- Streaming: Netflix earnings beat last week was a positive read-through.
- Digital ad spend: Tracking stable. No macro-driven budget cuts signaled.

## Forward Watch
- Apr 22–25: META, GOOGL earnings — major XLC catalysts.
""")

doc("deltas/sectors/real-estate.delta.md", "Real Estate (XLRE)", """
# Real Estate (XLRE) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — yield-sensitive; NAHB due today

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

## Rate Sensitivity
10Y at 4.30% remains a headwind for REIT valuations.
No yield compression signal that would trigger a bullish XLRE revision.

## Today: NAHB Housing Index
Housing market sentiment data released today. Will inform residential REIT
direction and mortgage rate sensitivity.

## REIT Sub-Sectors
- Data centers: Positively aligned with AI capex thesis. (EQIX, DLR)
- Industrial REITs: Logistics demand stable.
- Office: Continued headwinds; work-from-home secular pressure.
- Residential: Mortgage rate sensitivity at 4.30% 10Y.

## Forward Watch
- 10Y yield direction is the primary XLRE driver.
- Apr 21: Iran deal → potential 10Y pullback → XLRE upside catalyst.
""")

doc("deltas/sectors/utilities.delta.md", "Utilities (XLU)", """
# Utilities (XLU) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — yield-sensitive, AI power load opportunity

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

## Rate Sensitivity
10Y at 4.30% = headwind for XLU yield plays.
No catalyst for defensive rotation into utilities at current equity risk-on levels.

## AI Data Center Load Story
Power grid demand from AI data centers is a structural tailwind for select
utilities (especially those with nuclear generation capacity). This is a
medium-term catalyst; no immediate trigger today.

## Natgas
WTI/natgas linked — no material change today. Natgas storage data later this week.

## Forward Watch
- Rate direction (10Y) is the near-term XLU driver.
- Any AI hyperscaler power procurement announcements would be bullish.
""")

doc("deltas/sectors/materials.delta.md", "Materials (XLB)", """
# Materials (XLB) — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Neutral — copper and gold miners tracking macro

## Bias: **NEUTRAL** (carry forward from Apr 12 baseline)

## Gold Miners
Gold at $4,821–4,830 (+1.4%) is a tailwind for gold miners (GDX, NEM, AEM).
Gold CTAs likely rebuilding positions today.

## Copper
Tracking China demand concerns + global PMI softness. No new China stimulus
signal to create a positive re-rating trigger.

## Lithium
Supply glut continues to pressure lithium miners. No catalyst today.

## China Demand Linkage
FXI under tariff pressure. China demand uncertainty is the primary overhang for
industrial metals in XLB.

## Forward Watch
- China policy response to tariffs = primary XLB catalyst.
- Gold price direction: Iran binary on Apr 21.
""")

# ── Alt / Intelligence ────────────────────────────────────────────────────────

doc("deltas/alt/sentiment.delta.md", "Sentiment", """
# Sentiment — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Extreme Fear persists; equity/crypto divergence

## Composite Sentiment Readings
| Indicator             | Reading        | Direction      |
|-----------------------|----------------|----------------|
| Crypto F&G Index      | 23 — Extreme Fear | Unchanged   |
| Equity VIX            | ~18            | Declining (from ~20+ peak) |
| AAII Sentiment        | Carry forward from Apr 12 | Bearish skew |
| Reddit / Social       | Carry forward; risk-off tone in crypto communities |

## Key Divergence: Equities vs. Crypto
QQQ +positive session, SPY +1.22% — equities resilient.
BTC -0.77%, ETH -2.82%, SOL -3.65% — crypto sliding.
**Crypto is not functioning as a risk-on asset in the Iran war regime.**
BTC $76K breakout attempt on Apr 14 FAILED; retail participation remains
depressed. F&G 23 = Extreme Fear unchanged despite equity strength.

## CTA / Systematic
Equity CTAs: Fully long (systematic trend-following).
Oil CTAs: Unwinding energy longs as WTI declined.
Fed pre-blackout: Last signals were consistent with patience; no new signals
until post-FOMC Apr 28–29.

## News Sentiment
Iran Islamabad talks failure is the dominant narrative.
Market framing: potential deal before Apr 21, not no-deal collapse → muted
negative news reaction in equities.

## Forward Watch
- BTC sustained close above $76K = sentiment inflection signal.
- Apr 21 Iran binary: No deal = F&G likely drops further; equity VIX spike.
""")

doc("deltas/alt/institutional-flows.delta.md", "Institutional Flows", """
# Institutional Flows — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Bank earnings driving XLF inflows; no material ETF flow data

## Bank Earnings Read-Through
The 6-for-6 major bank sweep (JPM, C, WFC, GS, MS, BAC Q1 beats) is likely
driving institutional accumulation of XLF. PNC Q1 today extends to regional banks.

## ETF Flows (Carry forward — no intraday data available)
Carry forward from Apr 12 baseline:
- XLF: Net positive bias given earnings sweep.
- XLK: Neutral pre-earnings accumulation stance.
- XLE: Mixed — Iran uncertainty creating hesitation; CTA energy unwinds.

## Dark Pool / 13D/13G
No new 13D/13G filings of significance today.
Carry forward institutional positioning from Apr 12 baseline.

## Forward Watch
- Post-FOMC (Apr 28–29): Major institutional flow signal as positioning adjusts.
- Tech earnings (Apr 22–25): Likely to drive significant ETF inflows if beats.
- Retail Sales (Apr 21): Consumer flow data for XLY / XLP re-rating.
""")

doc("deltas/alt/cta-positioning.delta.md", "CTA Positioning", """
# CTA Positioning — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Equity CTAs fully long; oil CTAs unwinding

## Equity CTA Positioning
**Systematic equity models: FULLY LONG.**
Trend-following signal remains positive across US equity indices.
No reversal signal from the Iran/geopolitical uncertainty — equities held
their trend despite the shock.

## Oil / Energy CTAs
**OIL CTAs: UNWINDING ENERGY LONGS.**
WTI -8% on Apr 14 triggered systematic de-risking in oil futures.
The Apr 15 bounce (+0.44% to $91.68) does not appear sufficient to
re-trigger CTA energy longs. Below $95 sustained = CTAs remain underweight energy.

## Bond CTAs
Carry forward from Apr 12 baseline. Rates stable (10Y 4.30%) = no directional
CTA bond signal. FOMC blackout = limited new catalyst.

## Crypto CTAs
BTC $76K breakout failure on Apr 14 = trend-following SELL signal for crypto CTAs.
F&G 23 (Extreme Fear) reinforces the negative trend signal.
Key level: CTAs would likely flip long above a sustained $78K–80K BTC close.

## Trigger Levels (Apr 15 estimates)
| Asset    | CTA Current  | Flip-Long Level | Flip-Short Level |
|----------|-------------|-----------------|------------------|
| US Equity| Long         | —               | QQQ <$610        |
| WTI      | Unwinding    | >$95 sustained  | <$85             |
| BTC      | Short/Flat   | >$78K sustained | —                |
| 10Y UST  | Neutral      | Yield <4.0%     | Yield >4.6%      |
""")

doc("deltas/alt/options-derivatives.delta.md", "Options & Derivatives", """
# Options & Derivatives — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | VIX declining; BTC options fading $76K breakout

## VIX Term Structure
**VIX ~18**, declining from ~20+ at peak Iran uncertainty.
Term structure: Mild backwardation → markets pricing Iran resolution before
the near-term stress escalates. April 21 ceasefire deadline not fully priced
into front-month vol.

## Equity Put/Call Ratios
Carry forward from Apr 12 baseline — no material intraday options flow signal.
Overall: Dealers adding short gamma as VIX declines; any Iran shock = quick
vol spike due to limited options hedging overhead.

## Crypto Options
**BTC $76K options DID NOT PRINT on the Apr 14 attempt.**
$76K resistance confirmed by options market correctly fading the breakout.
Current BTC at $74,019: $72K put side has elevated OI (support defense).
$76K call wall = key resistance.

## Dealer Gamma Exposure
SPY: Dealers likely long gamma above $555-560. Supportive of low-vol drift
higher if no Iran shock.

## Unusual OI / Notable
No unusual options activity flagged today. Watching for pre-Iran-binary
hedges being placed ahead of Apr 21.

## Forward Watch
- Apr 21: Expect VIX pickup and unusual options flows 2-3 days before
  the ceasefire deadline.
- Apr 22–25: Tech earnings = major gamma event. Dealers will add hedges.
""")

doc("deltas/alt/political-signals.delta.md", "Political Signals", """
# Political Signals — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Iran binary dominates; Islamabad talks failed

## Iran-US Geopolitical Signal
**CRITICAL: Islamabad talks FAILED.**

Vice President Vance spent 21 hours in Islamabad and left without an agreement.
Iran's Foreign Minister Abbas Araghchi stated the US took a maximalist position
with "shifting goalposts."

**Sticking points:**
1. Scope and timeline of nuclear enrichment suspension
2. US demand for immediate Hormuz reopening
3. US demand for dismantlement of major Iranian enrichment facilities

**Naval blockade:** Remains fully active. Trump has explicitly warned that
Iranian ships approaching the US blockade will be "eliminated."

**Next step:** A new round of talks is under discussion, potentially before the
**April 21 ceasefire expiry**. This creates a hard binary deadline.

**Market implication:** Equities pricing a deal eventually, not collapse.
Gold (+1.4%) pricing partial risk premium reload on Islamabad failure.

## Congressional Activity
No material Congressional trades (STOCK Act filings) of note today.
Tariff executive orders: No new developments; existing framework in place.

## Regulatory Signals
No new executive orders or regulatory announcements affecting markets today.

## Forward Watch
- **April 21: Ceasefire deadline** — the primary political catalyst.
- Watch for back-channel signals (Oman intermediary, UN involvement) in the
  days before April 21.
""")

doc("deltas/alt/hedge-fund-intel.delta.md", "Hedge Fund Intel", """
# Hedge Fund Intel — 2026-04-15
> Delta #3 from baseline 2026-04-12 | Wednesday | Carry forward — no new 13F data

## 13F Filing Status
No new 13F quarterly filings due today (next cycle: ~May 15 for Q1 2026 data).
Carry forward positioning reads from Q4 2025 13F analysis (Apr 12 baseline).

## Notable HF Positioning (Q4 2025 13F — carry forward)
- Technology (XLK) widely held as a sector overweight.
- Energy (XLE) mixed; pre-Iran-war positioning varied.
- Financials (XLF): Consensus overweight given rate environment.

## Activist Watch
No material new activist disclosure (13D/13G) flagged today.
Carry forward activist calendar from Apr 12 baseline.

## Inferred Positioning (from market signals)
Given equities holding gains while crypto declines:
- Macro HFs appear to be staying risk-on in equities.
- Iran uncertainty keeping HFs defensive on commodity length.

## Forward Watch
- May 15: Q1 2026 13F filings — major positioning update.
- Post-Apr 21 Iran binary: HF positioning likely to shift materially.
""")

# ─────────────────────────────────────────────────────────────────────────────
# Upsert all docs
# ─────────────────────────────────────────────────────────────────────────────

def upsert_doc(d: dict) -> bool:
    """Upsert a document; skip if already exists with same key+date."""
    check = sb.table("documents").select("id").eq("document_key", d["document_key"]).eq("date", d["date"]).execute()
    if check.data:
        print(f"  SKIP (exists):  {d['document_key']}")
        return False
    res = sb.table("documents").insert(d).execute()
    if res.data:
        print(f"  INSERT OK:      {d['document_key']}")
        return True
    print(f"  ERROR:          {d['document_key']} → {res}")
    return False


def main():
    print(f"\n=== Repair: granular per-segment delta docs for {DATE} ===\n")
    inserted = 0
    skipped = 0
    for d in DOCS:
        ok = upsert_doc(d)
        if ok:
            inserted += 1
        else:
            skipped += 1

    print(f"\nDone. Inserted: {inserted} | Skipped (already exist): {skipped}")
    print("\nVerification query:")
    print("  SELECT document_key, length(content) FROM documents WHERE date = '2026-04-15' AND document_key LIKE 'deltas/%' ORDER BY document_key;")


if __name__ == "__main__":
    main()
