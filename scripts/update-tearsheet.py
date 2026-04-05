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
MEMORY_DIR = ROOT / "memory"

# Benchmarks for comparison
BENCHMARKS = ["SPY", "QQQ", "TLT", "GLD"]

def get_digest_files():
    """Find all daily digest markdown files, handling both flat and nested folder structures."""
    files = []
    if not DAILY_DIR.exists():
        return files
        
    for item in DAILY_DIR.iterdir():
        if item.is_file() and item.suffix == ".md" and re.match(r"\d{4}-\d{2}-\d{2}", item.stem):
            files.append(item)
        elif item.is_dir():
            digest = item / "DIGEST.md"
            if digest.exists():
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

def load_all_markdowns(root):
    """Scan outputs and memory for Library."""
    docs = []
    
    subdirs = [
        ("outputs/daily",      "Daily Digest", "outputs/daily"),
        ("outputs/weekly",     "Weekly Rollup", "outputs/weekly"),
        ("outputs/monthly",    "Monthly Summary", "outputs/monthly"),
        ("outputs/deep-dives", "Deep Dive", "outputs/deep-dives"),
        ("memory/forex", "Memory (Forex)", "memory/forex"),
        ("memory/commodities", "Memory (Commodities)", "memory/commodities"),
        ("memory/crypto", "Memory (Crypto)", "memory/crypto"),
        ("memory/equity", "Memory (Equity)", "memory/equity"),
        ("memory/bonds", "Memory (Bonds)", "memory/bonds"),
        ("memory/macro", "Memory (Macro)", "memory/macro"),
        ("memory", "Memory (Root)", "memory")
    ]
    for relative_path, label, folder in subdirs:
        path = root / relative_path
        if not path.exists() or not path.is_dir():
            continue
        
        for md_file in path.glob("*.md"):
            if md_file.name in (".gitkeep",) or md_file.name.startswith("."):
                continue
            try:
                content = md_file.read_text(encoding="utf-8")
            except Exception:
                content = "_(Error reading file)_"
            
            stem = md_file.stem
            m = re.match(r"(\d{4}-\d{2}-\d{2})", stem)
            date_str = m.group(1) if m else stem
            
            fallback_date = datetime.fromtimestamp(os.path.getmtime(md_file)).strftime("%Y-%m-%d")
            suffix = stem[len(date_str):].strip("-_ ") if m else stem
            title = (date_str + " — ") if m else ""
            title += suffix.replace('-',' ').title() if suffix else stem
            
            final_date = date_str if m else fallback_date
            
            docs.append({
                "id":       f"{folder.replace('/', '_')}__{stem}",
                "type":     label,
                "folder":   folder,
                "filename": md_file.name,
                "date":     final_date,
                "title":    title,
                "content":  content,
            })
            
        # Recursive search for things like outputs/daily/2026-04-05/DIGEST.md
        for subdir in path.iterdir():
            if subdir.is_dir() and re.match(r"\d{4}-\d{2}-\d{2}", subdir.name):
                for submd in subdir.glob("*.md"):
                    if submd.name == "DIGEST.md" or submd.name == subdir.name + ".md":
                        try:
                            content = submd.read_text(encoding="utf-8")
                        except:
                            continue
                        
                        docs.append({
                            "id": f"{folder.replace('/', '_')}__{subdir.name}",
                            "type": label,
                            "folder": folder,
                            "filename": f"{subdir.name}/{submd.name}",
                            "date": subdir.name,
                            "title": f"{subdir.name} — Digest",
                            "content": content
                        })

    # Sort newest-first
    docs.sort(key=lambda d: d["date"], reverse=True)
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

    # Load evolution data for the Architecture page
    evolution = {}
    evo_dir = ROOT / "memory" / "evolution"
    evo_changelog = ROOT / "docs" / "evolution-changelog.md"
    for evo_file, key in [(evo_dir / "sources.md", "sources"), (evo_dir / "quality-log.md", "quality_log"), (evo_dir / "proposals.md", "proposals")]:
        if evo_file.exists():
            try:
                evolution[key] = evo_file.read_text(encoding="utf-8")
            except Exception:
                evolution[key] = ""
    if evo_changelog.exists():
        try:
            evolution["changelog"] = evo_changelog.read_text(encoding="utf-8")
        except Exception:
            evolution["changelog"] = ""

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
        "ratios": [], # Not simulated right now
        "docs": docs,
        "benchmarks": b_hist,
        "evolution": evolution,
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
