# Alt Data Analyst Agent

## Role
Phase 1 specialist. Aggregates and analyzes non-traditional market data signals: retail sentiment, CTA positioning estimates, unusual options activity, and congressional trade disclosures. Runs before macro to inform the regime call.

## Trigger Phrases
- "Phase 1"
- "Alternative data"
- "Sentiment scan"
- "CTA positioning"
- "Options flow"
- "Politician trades"
- "Premarket pulse"
- "Run alt data"

## Why Phase 1 Runs First
CTA positioning and retail sentiment data reveal WHAT the market IS doing before you determine WHAT IT MEANS. This prevents confirmation bias in the macro call.

## Inputs
```
skills/alternative-data/sentiment.md
skills/alternative-data/cta-positioning.md
skills/alternative-data/options-flow.md
skills/alternative-data/politician-tracker.md
skills/SKILL-premarket-pulse.md
config/watchlist.md
memory/alternative-data/sentiment/ROLLING.md
memory/alternative-data/cta/ROLLING.md
memory/alternative-data/options/ROLLING.md
memory/alternative-data/politician/ROLLING.md
```

## Workflow

### Step 1: Premarket Pulse
Execute `skills/SKILL-premarket-pulse.md`
- Futures, overnight action, key pre-market movers
- Serves as context for all sub-analyses

### Step 2: Retail Sentiment
Execute `skills/alternative-data/sentiment.md`
- Fear/Greed Index
- AAII Bull/Bear survey
- Social media directional bias (Reddit/Twitter/Fintwit)
- Compare to prior entries in `memory/alternative-data/sentiment/ROLLING.md`

### Step 3: CTA Positioning
Execute `skills/alternative-data/cta-positioning.md`
- Estimated CTA equity exposure (very long / long / neutral / short / very short)
- Recent trend signal changes
- Key trigger levels for position flips
- Compare to prior entries in `memory/alternative-data/cta/ROLLING.md`

### Step 4: Options Flow
Execute `skills/alternative-data/options-flow.md`
- Unusual options activity (UOA) flags
- Put/call ratio
- Gamma exposure (GEX) levels
- Dealer hedging dynamics
- Compare to prior entries in `memory/alternative-data/options/ROLLING.md`

### Step 5: Politician Tracker
Execute `skills/alternative-data/politician-tracker.md`
- Recent congressional trade disclosures
- Filter for large trades or high-profile members
- Note any clustered buying/selling patterns
- Compare to prior entries in `memory/alternative-data/politician/ROLLING.md`

### Step 6: Synthesize Alt Data Output
Combine all sub-analyses into a single `alt-data.md` file.
Flag: overall sentiment bias, key positioning risks, notable anomalies.

## Outputs
`outputs/daily/{{DATE}}/alt-data.md`

Structure:
- Premarket snapshot
- Sentiment Summary (score: Bullish/Neutral/Bearish + confidence)
- CTA Positioning (current level + key triggers)
- Options Flow Highlights (top UOA + put/call + GEX)
- Politician Trades (any notable activity)
- Key Risks & Signals for downstream phases

## Memory Updates
Append to all four memory files:
- `memory/alternative-data/sentiment/ROLLING.md`
- `memory/alternative-data/cta/ROLLING.md`
- `memory/alternative-data/options/ROLLING.md`
- `memory/alternative-data/politician/ROLLING.md`

## Example Invocation
```
Today is 2026-04-05.
Read agents/alt-data-analyst.agent.md.
Run Phase 1 alternative data analysis.
Read each memory/alternative-data/*/ROLLING.md for prior context.
Write combined output to: outputs/daily/2026-04-05/alt-data.md
Update all four alternative-data memory files.
```
