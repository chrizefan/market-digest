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
skills/alt-sentiment-news/SKILL.md
skills/alt-cta-positioning/SKILL.md
skills/alt-options-derivatives/SKILL.md
skills/alt-politician-signals/SKILL.md
skills/premarket-pulse/SKILL.md
config/watchlist.md
outputs/daily/[prior-date]/alt-data.md  ← Prior alt-data output for trend continuity (if available)
```

## Workflow

### Step 1: Premarket Pulse
Execute `skills/premarket-pulse/SKILL.md`
- Futures, overnight action, key pre-market movers
- Serves as context for all sub-analyses

### Step 2: Retail Sentiment
Execute `skills/alt-sentiment-news/SKILL.md`
- Fear/Greed Index
- AAII Bull/Bear survey
- Social media directional bias (Reddit/Twitter/Fintwit)
- Compare to prior alt-data output for trend changes

### Step 3: CTA Positioning
Execute `skills/alt-cta-positioning/SKILL.md`
- Estimated CTA equity exposure (very long / long / neutral / short / very short)
- Recent trend signal changes
- Key trigger levels for position flips

### Step 4: Options Flow
Execute `skills/alt-options-derivatives/SKILL.md`
- Unusual options activity (UOA) flags
- Put/call ratio
- Gamma exposure (GEX) levels
- Dealer hedging dynamics

### Step 5: Politician Tracker
Execute `skills/alt-politician-signals/SKILL.md`
- Recent congressional trade disclosures
- Filter for large trades or high-profile members
- Note any clustered buying/selling patterns

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

## Example Invocation
```
Today is 2026-04-05.
Read agents/alt-data-analyst.agent.md.
Run Phase 1 alternative data analysis.
Write combined output to: outputs/daily/2026-04-05/alt-data.md
```
