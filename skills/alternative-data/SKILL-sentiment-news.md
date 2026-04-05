---
name: alt-data-sentiment-news
description: Aggregates social sentiment, news flow, key opinion leader analysis, and prediction market signals. Runs FIRST in the daily pipeline to inform all downstream segment analysis with sentiment context. Sources include X/Twitter, Polymarket, Reddit, Google Trends, and tracked analyst accounts.
---

# Sentiment & News Intelligence Sub-Agent

## Purpose
Run this skill **before** macro and segment analysis. Its output colors how downstream segments interpret ambiguous signals. Sentiment extremes (euphoria/panic) can override technical/fundamental reads.

## Inputs
- `config/data-sources.md` — full list of tracked accounts and signal sources
- `memory/alternative-data/sentiment/ROLLING.md`
- Previous day's `DIGEST.md` (for narrative continuity)

---

## Research Steps

### 1. Market Headline Scan (Last 24h)
Search for the top 3-5 market-moving headlines from the past 24 hours:
- What is the dominant narrative today?
- Is fear or greed driving the conversation?
- Any surprise developments (geopolitical, economic, earnings, policy) vs prior expectations?
- Are markets reacting to **new information** or repricing on **narrative shift** with no new data?

### 2. X / Twitter Sentiment Scan
Search for recent posts from tracked accounts and hashtags:

**Macro/Market Legends to search:**
- Stanley Druckenmiller — macro thesis updates
- Howard Marks (Oaktree) — risk appetite framing
- Michael Burry — any positions or warnings
- Mohamed El-Erian — economic interpretation
- Larry Fink (BlackRock) — institutional sentiment signal

**Analysts & Commentators:**
- @KobeissiLetter — market signal aggregator with large following
- @MacroAlf (Alfonso Peccatiello, The Macro Compass) — macro framework
- @TaviCosta (Crescat Capital) — macro positioning commentary
- @zerohedge — sentiment extreme indicator (use as contrarian signal when extreme)
- @elerianm — El-Erian market framing
- @LizAnnSonders (Schwab Chief Investment Strategist) — breadth and technicals
- @Trinhnomics — EM/Asia macro

**Crypto-specific:**
- @WClementeIII — on-chain analytics
- @glassnode — on-chain data
- @APompliano — Bitcoin narrative

**Search for:**
- Any viral market takes, panic posts, or FOMO posts indicating sentiment extreme
- Specific tickers trending: is it organic or coordinated pump?
- Contrarian signal: if X/Twitter is uniformly bearish, be alert for reversal

### 3. Polymarket Prediction Markets
Search for current Polymarket odds on:
- **Fed interest rate path**: probability of next cut/hike at nearest FOMC meeting
- **US recession probability in next 12 months**
- **Iran War escalation**: any relevant market (Strait of Hormuz closure probability? IRGC attack probability?)
- **2026 US election** related markets if material
- **Geopolitical events**: any markets on North Korea, Taiwan, Russia/Ukraine relevant to assets
- **Bitcoin above $X by [date]**: crypto community positioning signal
- **Inflation above X%**: forward inflation expectation
- Note: Polymarket odds represent real-money crowd forecasting — weight accordingly

### 4. Reddit Community Sentiment
Search for WallStreetBets and r/investing signals:
- Is retail crowding into any specific tickers? (contra-institutional signal)
- Any new memetic trades or YOLO positions forming?
- Sentiment extreme: if WSB is uniformly bullish, consider it a peak signal; if uniformly bearish, consider it support
- r/options: any notable unusual options plays being discussed?

### 5. Google Trends Signals
Search for Google Trends activity on key terms:
- "Recession 2026" — rising search = public fear rising
- "How to buy gold" — retail gold demand signal
- "Bitcoin buy" — retail crypto FOMO indicator
- "Stock market crash" — panic signal
- "Inflation" — consumer concern level
- "Iran war" — public attention proxy for geopolitical escalation
- Trend direction matters more than absolute level

### 6. News Sentiment Scoring
After reviewing headlines, score:
- **Headline Sentiment**: Bullish / Bearish / Neutral for markets overall
- **Surprise Factor**: Was today's news expected (+0) or surprised to the upside (+1) or downside (-1)?
- **Narrative Momentum**: Is the dominant narrative strengthening or fading?
- **Cross-asset coherence**: Are different asset class narratives all pointing the same direction or conflicting?

### 7. Substack & Research Letter Highlights
If user has flagged any specific letter or report in `config/email-research.md`:
- Summarize key thesis from any report received in past 48 hours
- Note any prominent analyst who has changed a major view
- Flag any institutional research note with a contrarian or unusual call

---

## Output Format

```
### 📰 SENTIMENT & NEWS INTELLIGENCE
**Overall Sentiment**: [Bullish / Bearish / Neutral / Fearful / Euphoric]
**Surprise Factor**: [Markets ahead of / behind fundamentals today]

**Top Headlines (24h)**:
1. [Headline] — [Implication and market reaction if any]
2. [Headline] — [Implication]
3. [Headline] — [Implication]

**X/Twitter KOL Signals**:
- [Handle]: [Key quote or thesis highlighted in last 24h]
- [Handle]: [Relevant insight]
- [Sentiment extreme]: [Any uniform bullish/bearish pile-on as contrarian signal?]

**Polymarket Odds**:
| Market | Current Odds | Change vs Prior | Implication |
|--------|-------------|-----------------|-------------|
| Fed cut at next FOMC | X% | ±X% | [dovish/hawkish signal] |
| US Recession 12m | X% | ±X% | [growing/fading concern] |
| [Iran escalation if active] | X% | ±X% | [risk premium signal] |
| BTC above $X by [date] | X% | ±X% | [crypto positioning] |

**Google Trends Signal**: [Key rising searches and what they indicate]

**Reddit/Retail Sentiment**: [WSB direction + any specific ticker crowding]

**Research Letter Highlight**: [Any prominent note worth flagging]

**Sentiment Implication for Today's Analysis**:
[2-3 sentences on how today's sentiment context should color downstream segment reads.
Example: "Social media shows extreme fear. Polymarket recession odds up 5pp. This is a
contrarian signal against the consensus bearish read — watch for technical bounce."]
```

---

## Memory Update
After analysis, append 3 bullets to `memory/alternative-data/sentiment/ROLLING.md`:
- One on overall sentiment trend and extreme reading level
- One on Polymarket odds change (which market moved most and why)
- One on any notable KOL view shift or narrative momentum change
