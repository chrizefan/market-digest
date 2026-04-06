#!/usr/bin/env python3
import json, sys, re, os
from datetime import datetime
from pathlib import Path
import yfinance as yf
import pandas as pd
import numpy as np

ROOT = Path(__file__).parent.parent
OUTPUT_JSON = ROOT / "frontend" / "public" / "dashboard-data.json"
DAILY_DIR = ROOT / "outputs" / "daily"
PORTFOLIO_JSON = ROOT / "config" / "portfolio.json"

# Benchmarks for comparison
BENCHMARKS = ["SPY", "QQQ", "TLT", "GLD"]


def load_portfolio_json():
    """Load config/portfolio.json and return (positions, proposed_positions, constraints).

    Returns authoritative portfolio data written by the PM agent.
    positions[] = user-confirmed actual holdings
    proposed_positions[] = agent-recommended target (from Phase 7D)
    """
    if not PORTFOLIO_JSON.exists():
        return [], [], {}
    try:
        with open(PORTFOLIO_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        positions = data.get("positions", [])
        proposed = data.get("proposed_positions", [])
        constraints = data.get("constraints", {})
        return positions, proposed, constraints
    except Exception as e:
        print(f"   Warning: could not read portfolio.json — {e}")
        return [], [], {}


def load_rebalance_decision(date_str):
    """Load the rebalance-decision.md from a daily output folder and extract the proposed portfolio table."""
    rebal_path = DAILY_DIR / date_str / "rebalance-decision.md"
    if not rebal_path.exists():
        return None
    try:
        content = rebal_path.read_text(encoding="utf-8")
        # Try to extract the rebalance table rows
        # Format: | Ticker | Current% | Recommended% | Change | Action | Urgency | Rationale |
        rows = []
        for m in re.finditer(
            r"\|\s*([A-Z]{2,5})\s*\|\s*(\d+)%?\s*\|\s*(\d+)%?\s*\|\s*[^\|]+\|\s*(\w+)\s*\|",
            content
        ):
            rows.append({
                "ticker": m.group(1),
                "current_pct": int(m.group(2)),
                "recommended_pct": int(m.group(3)),
                "action": m.group(4),
            })
        return rows if rows else None
    except Exception:
        return None

def get_digest_files():
    """Find all daily digest markdown files, handling flat, v2 nested, and v3 three-tier cadence.

    For v3 folders (with _meta.json):
      - Baseline folders: use DIGEST.md directly (it IS the materialized file)
      - Delta folders: use DIGEST.md (the materialized file produced by the agent)
    Both cases produce the same result since the agent always materializes DIGEST.md.
    Legacy flat .md files and v2 nested folders without _meta.json are also supported.
    """
    files = []
    if not DAILY_DIR.exists():
        return files

    for item in DAILY_DIR.iterdir():
        if item.is_file() and item.suffix == ".md" and re.match(r"\d{4}-\d{2}-\d{2}", item.stem):
            # Legacy flat file
            files.append(item)
        elif item.is_dir():
            digest = item / "DIGEST.md"
            if digest.exists() and digest.stat().st_size > 0:
                files.append(digest)

    # Sort chronologically by date in filename/foldername
    def extract_date(p):
        m = re.search(r"(\d{4}-\d{2}-\d{2})", str(p))
        return m.group(1) if m else "1970-01-01"

    files.sort(key=extract_date)
    return files

def parse_digest(filepath):
    """Extract positioning, regime, bias, and lists from a digest markdown file."""
    content = filepath.read_text(encoding="utf-8")
    
    m_date = re.search(r"(\d{4}-\d{2}-\d{2})", str(filepath))
    date_str = m_date.group(1) if m_date else "Unknown"

    data = {
        "date": date_str,
        "positions": [],
        "regime": "Unknown",
        "bias": "Unknown",
        "regime_summary": "",
        "actionable": [],
        "risks": []
    }

    # Extract Target Allocation
    alloc_pattern = r"-\s*\*\*([A-Z]+)\*\*(?:\s*\((.*?)\))?:\s*(\d+)%(?:\s*(?:—|-)\s*(.*))?"
    for match in re.finditer(alloc_pattern, content):
        ticker = match.group(1)
        name = (match.group(2) or ticker).strip()
        weight = float(match.group(3))
        rationale = (match.group(4) or "").strip()
        data["positions"].append({
            "ticker": ticker,
            "name": name.title() if ticker == name else name,
            "weight": weight,
            "rationale": rationale
        })

    # Extract Regime & Bias
    regime_match = re.search(r"\*\*Overall Bias\*\*:\s*([^\n]+)", content)
    if regime_match:
        full_bias = regime_match.group(1).strip()
        # Parse out pure bias if separated by dash (e.g. "TRANSITIONAL — Inflationary")
        data["bias"] = full_bias.split("—")[0].strip() if "—" in full_bias else full_bias
        data["regime"] = full_bias
        
        # Grab next paragraph
        para = content[regime_match.end():].lstrip().split("\n\n")[0]
        data["regime_summary"] = para.strip()

    # Generic list extractor
    def extract_list_under_heading(heading_re):
        head_match = re.search(heading_re, content)
        if not head_match: return []
        sub_content = content[head_match.end():].lstrip()
        # Read lines until next H2 (## )
        lines = []
        for line in sub_content.splitlines():
            if line.startswith("## "): break
            if line.strip().startswith("- ") or re.match(r"\d+\.\s+", line.strip()):
                lines.append(line.strip())
        return [re.sub(r"^(-\s*|\d+\.\s*)", "", l) for l in lines] # strip bullet prefixes

    data["actionable"] = extract_list_under_heading(r"## ⚡ Actionable Summary.*")
    data["risks"] = extract_list_under_heading(r"## 🚨 Risk Radar.*")

    return data

def fetch_prices(tickers, start_date):
    """Fetch daily closing prices from start_date to today."""
    if not tickers: return pd.DataFrame()
    
    # Pad start_date backwards slightly in case it falls on a weekend
    start_dt = pd.to_datetime(start_date) - pd.Timedelta(days=5)
    
    try:
        data = yf.download(tickers, start=start_dt.strftime("%Y-%m-%d"), progress=False)["Close"]
        if len(tickers) == 1:
            data = data.to_frame(name=tickers[0])
        # Forward fill weekends/holidays so every requested date resolves to last close
        data = data.ffill()
        return data
    except Exception as e:
        print(f"  Warning: benchmark fetch failed — {e}")
        return pd.DataFrame()

def simulate_portfolio(digests):
    """
    Simulate portfolio NAV and cash over time based on daily digests.
    Assumes base 100 starting on the first digest's date.
    """
    if not digests: return [], {}

    # Gather all unique tickers excluding CASH
    all_tickers = set()
    for d in digests:
        for p in d["positions"]:
            if p["ticker"] != "CASH":
                all_tickers.add(p["ticker"])
    
    start_date = digests[0]["date"]
    benchmarks_list = BENCHMARKS
    all_symbols = list(all_tickers.union(set(benchmarks_list)))
    
    print(f"   Fetching prices for {len(all_symbols)} tickers from {start_date}...")
    prices = fetch_prices(all_symbols, start_date)

    if prices.empty:
        return [], {}

    # Build sequence of business days from start_date to last available price
    if start_date not in prices.index:
        # Find nearest date
        idx = prices.index.get_indexer([pd.to_datetime(start_date)], method='ffill')[0]
        if idx == -1: idx = 0
        actual_start = prices.index[idx]
    else:
        actual_start = pd.to_datetime(start_date)
        
    dates = prices.index[prices.index >= actual_start]
    
    # State tracking
    nav = 100.0
    current_weights = {}
    cash_pct = 1.0
    active_digest = None
    portfolio_history = []
    
    digests.sort(key=lambda d: d["date"])
    digest_idx = 0
    
    for i, date in enumerate(dates):
        if i > 0:
            prev_date = dates[i-1]
            daily_return = 0.0
            for ticker, weight in current_weights.items():
                if ticker == "CASH":
                    continue
                try:
                    p0 = prices.loc[prev_date, ticker]
                    p1 = prices.loc[date, ticker]
                    if pd.notna(p0) and pd.notna(p1) and p0 > 0:
                        ret = (p1 - p0) / p0
                        daily_return += weight * ret
                except KeyError:
                    pass
            nav = nav * (1.0 + daily_return)
        
        # Apply any digest published on or prior to this trading date
        while digest_idx < len(digests) and pd.to_datetime(digests[digest_idx]["date"]) <= date:
            active_digest = digests[digest_idx]
            digest_idx += 1
            new_weights = {}
            for p in active_digest["positions"]:
                w = p["weight"] / 100.0
                new_weights[p["ticker"]] = w
            current_weights = new_weights
            cash_pct = current_weights.get("CASH", 0.0)

        portfolio_history.append({
            "date": date.strftime("%Y-%m-%d"),
            "nav": float(nav)
        })

    # If there are digests published on a weekend/holiday AFTER the last trading day, apply the newest one
    while digest_idx < len(digests):
        active_digest = digests[digest_idx]
        digest_idx += 1
        new_weights = {}
        for p in active_digest["positions"]:
            w = p["weight"] / 100.0
            new_weights[p["ticker"]] = w
        current_weights = new_weights
        cash_pct = current_weights.get("CASH", 0.0)
        
    active_positions = []
    # For a true simulator we'd track exact entry date/price for each lot,
    # but for tearsheet we approximate using the most recent close.
    active_positions = []
    if active_digest:
        last_date = dates[-1]
        for p in active_digest["positions"]:
            t = p["ticker"]
            if t == "CASH": continue
            cp = None
            if t in prices.columns:
                cp = float(prices.loc[last_date, t])
            
            ti_data = {}
            try:
                tkr = yf.Ticker(t)
                info = tkr.info
                ti_data = {
                    "beta": info.get("beta"),
                    "trailingPE": info.get("trailingPE"),
                    "marketCap": info.get("marketCap"),
                    "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
                    "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
                    "dividendYield": info.get("dividendYield"),
                    "sector": info.get("sector"),
                    "industry": info.get("industry")
                }
            except Exception:
                pass

            active_positions.append({
                "ticker": t,
                "name": p["name"],
                "type": "LONG",
                "weight_actual": float(p["weight"]),
                "current_price": cp,
                "rationale": p["rationale"],
                "stats": ti_data
            })

    # Prepare benchmark histories
    b_hist = {}
    for b in benchmarks_list:
        if b in prices.columns:
            # Dropna for safety
            b_series = prices[b].dropna()
            # Start tracking from actual_start
            b_series = b_series[b_series.index >= actual_start]
            if not b_series.empty:
                b_hist[b] = {
                    "current": float(b_series.iloc[-1]),
                    "history": [{"date": d.strftime("%Y-%m-%d"), "price": float(p)} for d, p in b_series.items()]
                }
                
    return portfolio_history, active_positions, b_hist, active_digest

# --- File classification for timeline metadata ---

FILE_CLASSIFICATION = {
    "DIGEST.md":                {"phase": 7, "category": "synthesis",     "segment": "digest"},
    "DIGEST-DELTA.md":          {"phase": 7, "category": "synthesis",     "segment": "digest-delta"},
    "alt-data.md":              {"phase": 1, "category": "alt-data",      "segment": "alt-data"},
    "institutional.md":         {"phase": 2, "category": "institutional", "segment": "institutional"},
    "macro.md":                 {"phase": 3, "category": "macro",         "segment": "macro"},
    "bonds.md":                 {"phase": 4, "category": "asset-class",   "segment": "bonds"},
    "commodities.md":           {"phase": 4, "category": "asset-class",   "segment": "commodities"},
    "forex.md":                 {"phase": 4, "category": "asset-class",   "segment": "forex"},
    "crypto.md":                {"phase": 4, "category": "asset-class",   "segment": "crypto"},
    "international.md":         {"phase": 4, "category": "asset-class",   "segment": "international"},
    "equities.md":              {"phase": 5, "category": "equity",        "segment": "us-equities"},
    "us-equities.md":           {"phase": 5, "category": "equity",        "segment": "us-equities"},
    "portfolio-recommended.md": {"phase": 7, "category": "portfolio",     "segment": "recommendation"},
    "rebalance-decision.md":    {"phase": 7, "category": "portfolio",     "segment": "rebalance"},
}

SECTOR_NAMES = {
    "technology":       "Technology",
    "healthcare":       "Healthcare",
    "energy":           "Energy",
    "financials":       "Financials",
    "consumer-staples": "Consumer Staples",
    "consumer-disc":    "Consumer Discretionary",
    "industrials":      "Industrials",
    "utilities":        "Utilities",
    "materials":        "Materials",
    "real-estate":      "Real Estate",
    "comms":            "Communications",
}


def _read_md(filepath):
    """Read a markdown file, returning content or error placeholder."""
    try:
        return filepath.read_text(encoding="utf-8")
    except Exception:
        return "_(Error reading file)_"


def _detect_run_type(day_dir):
    """Read _meta.json from a daily folder to determine baseline/delta."""
    meta = day_dir / "_meta.json"
    if meta.exists():
        try:
            with open(meta, "r", encoding="utf-8") as f:
                return json.load(f).get("type", "baseline")
        except Exception:
            pass
    return "baseline"


def load_all_markdowns(root):
    """Scan outputs for the timeline view.

    Returns enriched doc objects with phase, category, segment, sector, and runType metadata.
    """
    docs = []

    # --- 1. Daily output folders (baseline + delta files) ---
    daily_path = root / "outputs" / "daily"
    if daily_path.exists():
        for day_dir in sorted(daily_path.iterdir()):
            if not day_dir.is_dir():
                continue
            day_date = day_dir.name
            if not re.match(r"\d{4}-\d{2}-\d{2}", day_date):
                continue

            run_type = _detect_run_type(day_dir)

            # Top-level .md files in the day folder
            for md_file in sorted(day_dir.glob("*.md")):
                if md_file.name.startswith("."):
                    continue
                content = _read_md(md_file)
                cls = FILE_CLASSIFICATION.get(md_file.name, {})
                segment_name = cls.get("segment", md_file.stem)
                is_delta_file = md_file.name == "DIGEST-DELTA.md"
                docs.append({
                    "title": segment_name.replace("-", " ").title(),
                    "type": "Daily Delta" if is_delta_file else "Daily Digest",
                    "date": day_date,
                    "path": str(md_file.relative_to(root)),
                    "content": content,
                    "phase": cls.get("phase"),
                    "category": cls.get("category", "output"),
                    "segment": segment_name,
                    "sector": None,
                    "runType": run_type,
                })

            # sectors/*.md (baseline sector files)
            sectors_dir = day_dir / "sectors"
            if sectors_dir.exists():
                for sf in sorted(sectors_dir.glob("*.md")):
                    if sf.name.startswith("."):
                        continue
                    content = _read_md(sf)
                    stem = sf.stem.replace(".delta", "")
                    is_delta = sf.name.endswith(".delta.md")
                    sector_label = SECTOR_NAMES.get(stem, stem.replace("-", " ").title())
                    docs.append({
                        "title": f"{sector_label}{' Delta' if is_delta else ''}",
                        "type": "Daily Delta" if is_delta else "Daily Digest",
                        "date": day_date,
                        "path": str(sf.relative_to(root)),
                        "content": content,
                        "phase": 5,
                        "category": "sector",
                        "segment": stem,
                        "sector": sector_label,
                        "runType": run_type,
                    })

            # deltas/*.delta.md (segment-level deltas)
            deltas_dir = day_dir / "deltas"
            if deltas_dir.exists():
                for df in sorted(deltas_dir.glob("*.delta.md")):
                    content = _read_md(df)
                    segment = df.stem.replace(".delta", "")
                    cls = FILE_CLASSIFICATION.get(f"{segment}.md", {})
                    docs.append({
                        "title": f"{segment.replace('-', ' ').title()} Delta",
                        "type": "Daily Delta",
                        "date": day_date,
                        "path": str(df.relative_to(root)),
                        "content": content,
                        "phase": cls.get("phase"),
                        "category": cls.get("category", "delta"),
                        "segment": segment,
                        "sector": None,
                        "runType": "delta",
                    })

            # positions/*.md (asset analyst outputs)
            positions_dir = day_dir / "positions"
            if positions_dir.exists():
                for pf in sorted(positions_dir.glob("*.md")):
                    content = _read_md(pf)
                    ticker = pf.stem.upper()
                    docs.append({
                        "title": f"{ticker} Position Analysis",
                        "type": "Daily Digest",
                        "date": day_date,
                        "path": str(pf.relative_to(root)),
                        "content": content,
                        "phase": 7,
                        "category": "portfolio",
                        "segment": ticker.lower(),
                        "sector": None,
                        "runType": run_type,
                    })

    # --- 2. Weekly / Monthly / Deep-dive rollups ---
    for rel_path, label, category in [
        ("outputs/weekly",     "Weekly Rollup",   "rollup"),
        ("outputs/monthly",    "Monthly Summary", "rollup"),
        ("outputs/deep-dives", "Deep Dive",       "deep-dive"),
    ]:
        path = root / rel_path
        if not path.exists():
            continue
        for md_file in sorted(path.glob("*.md")):
            if md_file.name.startswith("."):
                continue
            content = _read_md(md_file)
            m = re.match(r"(\d{4}-\d{2}-\d{2})", md_file.stem)
            file_date = m.group(1) if m else datetime.fromtimestamp(os.path.getmtime(md_file)).strftime("%Y-%m-%d")
            docs.append({
                "title": md_file.stem.replace("-", " ").title(),
                "type": label,
                "date": file_date,
                "path": str(md_file.relative_to(root)),
                "content": content,
                "phase": None,
                "category": category,
                "segment": md_file.stem,
                "sector": None,
                "runType": None,
            })

    return docs

def main():
    print("📊 Market Digest — Dynamic Backend Parser v3")
    
    digest_files = get_digest_files()
    if not digest_files:
        print("   ❌ No daily digest outputs found. Ensure outputs/daily/ contains markdown files.")
        sys.exit(1)
        
    print(f"   Found {len(digest_files)} daily digests.")
    
    parsed_digests = [parse_digest(f) for f in digest_files]
    
    history, active_positions, b_hist, latest_digest = simulate_portfolio(parsed_digests)
    
    if not latest_digest:
        print("   ❌ Could not parse any latest digest.")
        sys.exit(1)

    print(f"   Latest active digest: {latest_digest['date']}")

    # Load authoritative portfolio data from config/portfolio.json
    pj_positions, pj_proposed, pj_constraints = load_portfolio_json()
    if pj_positions:
        print(f"   Portfolio.json: {len(pj_positions)} positions, {len(pj_proposed)} proposed")
    
    # Load latest rebalance decision
    rebalance_data = load_rebalance_decision(latest_digest['date'])

    # Calculate simplistic metrics
    active_nav = history[-1]['nav'] if history else 100.0
    pnl = active_nav - 100.0 # base 100
    total_invested = sum([p['weight_actual'] for p in active_positions])
    cash_found = next((p['weight'] for p in latest_digest['positions'] if p['ticker'] == 'CASH'), None)
    
    if cash_found is None:
        cash_pct = 100.0 - total_invested
    else:
        cash_pct = cash_found

    # Advanced performance metrics
    sharpe = 0.0
    volatility = 0.0
    max_dd = 0.0
    alpha = 0.0
    
    if len(history) > 1:
        navs = pd.Series([h['nav'] for h in history])
        returns = navs.pct_change().dropna()
        if not returns.empty and returns.std() != 0:
            vol = float(returns.std() * np.sqrt(252))
            volatility = vol if not np.isnan(vol) else 0.0
            
            risk_free = 0.00  # Default to 0 for simplicity
            sh = float((returns.mean() * 252 - risk_free) / volatility)
            sharpe = sh if not np.isnan(sh) else 0.0
        
        cum_max = navs.cummax()
        drawdowns = (navs - cum_max) / cum_max
        m_dd = float(drawdowns.min())
        max_dd = m_dd if not np.isnan(m_dd) else 0.0
        
        # Alpha relative to SPY
        if b_hist and "SPY" in b_hist.keys() and len(b_hist["SPY"]["history"]) > 1:
            spy_s = pd.Series([h['price'] for h in b_hist["SPY"]["history"]])
            spy_ret = spy_s.pct_change().dropna()
            min_len = min(len(returns), len(spy_ret))
            if min_len > 0:
                port_ret_aligned = returns.iloc[-min_len:]
                spy_ret_aligned = spy_ret.iloc[-min_len:]
                a = float(port_ret_aligned.mean() * 252 - spy_ret_aligned.mean() * 252)
                alpha = a if not np.isnan(a) else 0.0

    docs = load_all_markdowns(ROOT)
    print(f"   Research docs: {len(docs)} found")

    # Enrich active_positions with portfolio.json metadata (thesis, category, notes)
    if pj_positions and active_positions:
        pj_lookup = {p["ticker"]: p for p in pj_positions}
        for ap in active_positions:
            pj_match = pj_lookup.get(ap["ticker"])
            if pj_match:
                ap["thesis_ids"] = pj_match.get("thesis_ids", [])
                ap["category"] = pj_match.get("category", "")
                ap["pm_notes"] = pj_match.get("notes", "")
    
    # If no positions from DIGEST simulation but portfolio.json has positions, use those
    if not active_positions and pj_positions:
        print("   Using portfolio.json positions (no DIGEST-derived positions)")
        all_tickers_pj = [p["ticker"] for p in pj_positions if p["ticker"] != "CASH"]
        if all_tickers_pj:
            pj_prices = fetch_prices(all_tickers_pj, datetime.now().strftime("%Y-%m-%d"))
            for p in pj_positions:
                t = p["ticker"]
                if t == "CASH":
                    continue
                cp = None
                if not pj_prices.empty and t in pj_prices.columns:
                    cp = float(pj_prices[t].dropna().iloc[-1]) if not pj_prices[t].dropna().empty else None
                active_positions.append({
                    "ticker": t,
                    "name": p.get("name", t),
                    "type": "LONG",
                    "weight_actual": float(p.get("weight_pct", 0)),
                    "current_price": cp,
                    "rationale": p.get("notes", ""),
                    "thesis_ids": p.get("thesis_ids", []),
                    "category": p.get("category", ""),
                    "pm_notes": p.get("notes", ""),
                    "stats": {},
                })
        total_invested = sum(p["weight_actual"] for p in active_positions)
        cash_pct = 100.0 - total_invested

    dashboard_data = {
        "portfolio": {
            "meta": {
                "name": "Market Digest Dynamic Portfolio",
                "base_currency": "USD",
                "inception_date": parsed_digests[0]['date'],
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "benchmarks": BENCHMARKS
            },
            "snapshots": history,
            "strategy": {
                "regime": latest_digest["regime"],
                "summary": latest_digest["regime_summary"],
                "actionable": latest_digest["actionable"],
                "risks": latest_digest["risks"],
                "next_review": "Daily"
            }
        },
        "positions": active_positions,
        "portfolio_management": {
            "current_positions": [
                {
                    "ticker": p["ticker"],
                    "name": p.get("name", p["ticker"]),
                    "category": p.get("category", ""),
                    "weight_pct": p.get("weight_pct", 0),
                    "thesis_ids": p.get("thesis_ids", []),
                    "notes": p.get("notes", ""),
                }
                for p in pj_positions
            ] if pj_positions else [],
            "proposed_positions": [
                {
                    "ticker": p["ticker"],
                    "weight_pct": p.get("weight_pct", 0),
                    "action": p.get("action", ""),
                    "as_of": p.get("as_of", ""),
                }
                for p in pj_proposed
            ] if pj_proposed else [],
            "constraints": pj_constraints,
            "rebalance_actions": rebalance_data,
        },
        "ratios": [], # Not simulated right now
        "docs": docs,
        "benchmarks": b_hist,
        "calculated": {
            "portfolio_pnl": pnl,
            "total_invested": total_invested,
            "cash_pct": cash_pct,
            "sharpe": sharpe,
            "volatility": volatility,
            "max_drawdown": max_dd,
            "alpha": alpha,
            "generated_at": datetime.now().isoformat()
        }
    }
    
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(dashboard_data, f, ensure_ascii=False)
    print(f"   ✅ Dashboard JSON → {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
