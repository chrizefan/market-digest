#!/usr/bin/env python3
"""Generate snapshot.json sidecar from existing DIGEST.md + portfolio.json.

Usage:
  python scripts/generate-snapshot.py                  # latest day
  python scripts/generate-snapshot.py 2026-04-06       # specific day
  python scripts/generate-snapshot.py --all            # all day folders
"""
import json, re, sys, os
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
DAILY_DIR = ROOT / "outputs" / "daily"
PORTFOLIO_JSON = ROOT / "config" / "portfolio.json"


def load_portfolio_json():
    if not PORTFOLIO_JSON.exists():
        return [], {}
    data = json.loads(PORTFOLIO_JSON.read_text(encoding="utf-8"))
    return data.get("positions", []), data.get("constraints", {})


def parse_regime(content):
    """Extract regime object from DIGEST.md content."""
    regime = {"label": "Unknown", "bias": "Unknown", "conviction": "Medium", "summary": ""}

    m = re.search(r"\*\*Overall Bias\*\*:\s*([^\n]+)", content)
    if not m:
        print("   ⚠️  No '**Overall Bias**' found — regime will be 'Unknown'", file=sys.stderr)
        return regime

    full = m.group(1).strip()
    if "—" in full:
        parts = full.split("—", 1)
        regime["bias"] = parts[0].strip()
        regime["label"] = parts[1].strip()
    else:
        regime["bias"] = full
        regime["label"] = full

    # Derive conviction from language
    lower = full.lower()
    if any(w in lower for w in ["strong", "high conviction", "maximum"]):
        regime["conviction"] = "High"
    elif any(w in lower for w in ["caution", "mixed", "conflicted", "uncertain"]):
        regime["conviction"] = "Low"
    else:
        regime["conviction"] = "Medium"

    # Grab summary paragraph
    para = content[m.end():].lstrip().split("\n\n")[0]
    regime["summary"] = para.strip()[:500]

    return regime


def parse_positions_table(content):
    """Extract positions from DIGEST.md table format."""
    positions = []
    pm = re.search(r"## Portfolio Positioning", content)
    if not pm:
        print("   ⚠️  No '## Portfolio Positioning' section found", file=sys.stderr)
        return positions
    section = content[pm.end():]
    next_h2 = re.search(r"\n## ", section)
    if next_h2:
        section = section[:next_h2.start()]

    table_pat = r"^\|\s*([A-Z]{2,5})\s*\|\s*(\d+)%?\s*\|(.+)\|"
    for m in re.finditer(table_pat, section, re.MULTILINE):
        ticker = m.group(1)
        weight = float(m.group(2))
        cells = [c.strip() for c in m.group(3).split("|")]
        action_raw = cells[-2] if len(cells) >= 2 else ""
        rationale = cells[-1] if cells else ""

        # Normalize action to enum
        action_upper = action_raw.upper().replace("*", "")
        if "EXIT" in action_upper:
            action = "EXIT"
        elif "ADD" in action_upper:
            action = "ADD"
        elif "TRIM" in action_upper:
            action = "TRIM"
        elif "HOLD" in action_upper:
            action = "HOLD"
        else:
            action = "HOLD"

        positions.append({
            "ticker": ticker,
            "weight_pct": weight,
            "action": action,
            "rationale": rationale[:300],
        })
    return positions


def _normalize_thesis_status(raw):
    """Normalize free-form thesis status (with emoji) to DB enum value."""
    if not raw:
        return None
    s = raw.lower().replace("\u2705", "").replace("\u26a0\ufe0f", "").replace("\u274c", "").strip()
    if "challenged" in s:
        return "CHALLENGED"
    if "confirmed" in s or "active" in s:
        return "ACTIVE"
    if "monitoring" in s:
        return "MONITORING"
    if "invalidated" in s:
        return "INVALIDATED"
    if "closed" in s:
        return "CLOSED"
    if "paused" in s or "hold" in s:
        return "PAUSED"
    if "new" in s:
        return "NEW"
    return "ACTIVE"


def parse_theses(content):
    """Extract thesis tracker table from DIGEST.md."""
    theses = []
    tm = re.search(r"## (?:📋\s*)?Thesis Tracker", content)
    if not tm:
        print("   ⚠️  No '## Thesis Tracker' section found", file=sys.stderr)
        return theses
    section = content[tm.end():]
    next_h2 = re.search(r"\n## ", section)
    if next_h2:
        section = section[:next_h2.start()]

    rows = [l.strip() for l in section.splitlines()
            if l.strip().startswith("|") and not re.match(r"^\|[-\s|]+\|$", l.strip())]
    if len(rows) >= 2:
        rows = rows[1:]  # skip header
    for row in rows:
        cells = [c.strip() for c in row.split("|")[1:-1]]
        if len(cells) >= 5:
            theses.append({
                "id": cells[0],
                "name": cells[1],
                "vehicle": cells[2],
                "invalidation": cells[3],
                "status": _normalize_thesis_status(cells[4]),
                "notes": cells[5] if len(cells) > 5 else "",
            })
    return theses


def parse_market_data(content):
    """Extract key market levels from content (best-effort regex)."""
    data = {}
    patterns = {
        "SPY": r"SPY[^0-9]*?(\d{3,4}(?:\.\d+)?)",
        "VIX": r"VIX[^0-9]*?(\d{1,3}(?:\.\d+)?)",
        "DXY": r"DXY[^0-9]*?(\d{2,3}(?:\.\d+)?)",
        "WTI": r"WTI[^0-9]*?\$?(\d{2,3}(?:\.\d+)?)",
        "Gold": r"[Gg]old[^0-9]*?\$?(\d{3,5}(?:\.\d+)?)",
        "BTC": r"BTC[^0-9]*?\$?([\d,]+(?:\.\d+)?)",
        "US10Y": r"10[- ]?[Yy](?:ear)?[^0-9]*?(\d{1,2}(?:\.\d+)?)%?",
    }
    for key, pat in patterns.items():
        m = re.search(pat, content)
        if m:
            val = m.group(1).replace(",", "")
            try:
                data[key] = float(val)
            except ValueError:
                pass
    return data


def parse_segment_biases(content):
    """Extract per-segment biases from DIGEST.md."""
    biases = {}
    segments = {
        "macro": r"(?:Macro|Macro Regime)\s*(?:Bias)?[:\s]*\*?\*?([A-Za-z\- /]+)",
        "bonds": r"(?:Bonds?|Fixed Income)\s*(?:Bias)?[:\s]*\*?\*?([A-Za-z\- /]+)",
        "commodities": r"Commodit(?:y|ies)\s*(?:Bias)?[:\s]*\*?\*?([A-Za-z\- /]+)",
        "crypto": r"Crypto\s*(?:Bias)?[:\s]*\*?\*?([A-Za-z\- /]+)",
    }
    for seg, pat in segments.items():
        m = re.search(pat, content)
        if m:
            biases[seg] = m.group(1).strip().rstrip("*")
    return biases


def parse_actionable(content):
    """Extract actionable summary items."""
    items = []
    m = re.search(r"## (?:⚡\s*)?Actionable Summary", content)
    if not m:
        return items
    sub = content[m.end():].lstrip()
    for line in sub.splitlines():
        if line.startswith("## "):
            break
        line = line.strip()
        if line.startswith("- ") or re.match(r"\d+\.\s+", line):
            clean = re.sub(r"^(-\s*|\d+\.\s*)", "", line)
            items.append(clean[:300])
    return items[:10]


def parse_risks(content):
    """Extract risk radar items."""
    items = []
    m = re.search(r"## (?:🚨\s*)?Risk Radar", content)
    if not m:
        return items
    sub = content[m.end():].lstrip()
    for line in sub.splitlines():
        if line.startswith("## "):
            break
        line = line.strip()
        if line.startswith("- ") or re.match(r"\d+\.\s+", line):
            clean = re.sub(r"^(-\s*|\d+\.\s*)", "", line)
            items.append(clean[:300])
    return items[:10]


def detect_run_type(day_dir):
    meta_path = day_dir / "_meta.json"
    if meta_path.exists():
        try:
            data = json.loads(meta_path.read_text(encoding="utf-8"))
            return data.get("type", "baseline"), data.get("baseline")
        except Exception:
            pass
    return "baseline", None


def generate_snapshot(day_dir, pj_positions):
    """Generate snapshot.json for a single day folder."""
    digest_path = day_dir / "DIGEST.md"
    if not digest_path.exists():
        return None

    content = digest_path.read_text(encoding="utf-8")
    date_str = day_dir.name
    run_type, baseline_date = detect_run_type(day_dir)

    # Parse all components
    regime = parse_regime(content)
    positions = parse_positions_table(content)
    theses = parse_theses(content)
    market_data = parse_market_data(content)
    segment_biases = parse_segment_biases(content)
    actionable = parse_actionable(content)
    risks = parse_risks(content)

    # Enrich positions with portfolio.json metadata
    pj_lookup = {p["ticker"]: p for p in pj_positions}
    for pos in positions:
        pj = pj_lookup.get(pos["ticker"], {})
        pos["name"] = pj.get("name", pos["ticker"])
        pos["category"] = pj.get("category")
        pos["thesis_id"] = (pj.get("thesis_ids") or [None])[0]
        pos["entry_price"] = pj.get("entry_price_usd")
        pos["entry_date"] = pj.get("entry_date")

    # Detect portfolio posture
    posture_match = re.search(r"Portfolio Posture\*?\*?:\s*(\w+)", content)
    posture = posture_match.group(1) if posture_match else "Defensive"

    # Detect cash %
    cash_match = re.search(r"Cash.*?(\d+)%", content)
    cash_pct = float(cash_match.group(1)) if cash_match else None

    snapshot = {
        "schema_version": "1.0",
        "date": date_str,
        "run_type": run_type,
        "baseline_date": baseline_date,
        "regime": regime,
        "positions": positions,
        "theses": theses,
        "market_data": market_data,
        "segment_biases": segment_biases,
        "actionable": actionable,
        "risks": risks,
        "portfolio_posture": posture,
        "cash_pct": cash_pct,
    }

    out_path = day_dir / "snapshot.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)

    return snapshot


def main():
    pj_positions, _ = load_portfolio_json()

    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        # Process all day folders
        count = 0
        for day_dir in sorted(DAILY_DIR.iterdir()):
            if day_dir.is_dir() and re.match(r"\d{4}-\d{2}-\d{2}", day_dir.name):
                snap = generate_snapshot(day_dir, pj_positions)
                if snap:
                    print(f"  ✅ {day_dir.name}: {len(snap['positions'])} positions, {len(snap['theses'])} theses")
                    count += 1
        print(f"\nGenerated {count} snapshot.json files")

    elif len(sys.argv) > 1 and re.match(r"\d{4}-\d{2}-\d{2}", sys.argv[1]):
        # Specific date
        day_dir = DAILY_DIR / sys.argv[1]
        if not day_dir.exists():
            print(f"❌ Folder not found: {day_dir}")
            sys.exit(1)
        snap = generate_snapshot(day_dir, pj_positions)
        if snap:
            print(f"✅ {sys.argv[1]}: {len(snap['positions'])} positions, {len(snap['theses'])} theses")
            print(json.dumps(snap, indent=2)[:2000])
        else:
            print(f"❌ No DIGEST.md in {day_dir}")

    else:
        # Latest day folder
        day_dirs = sorted([d for d in DAILY_DIR.iterdir()
                          if d.is_dir() and re.match(r"\d{4}-\d{2}-\d{2}", d.name)])
        if not day_dirs:
            print("❌ No daily output folders found")
            sys.exit(1)
        day_dir = day_dirs[-1]
        snap = generate_snapshot(day_dir, pj_positions)
        if snap:
            print(f"✅ {day_dir.name}: {len(snap['positions'])} positions, {len(snap['theses'])} theses")
        else:
            print(f"❌ No DIGEST.md in {day_dir}")


if __name__ == "__main__":
    main()
