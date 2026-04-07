#!/usr/bin/env python3
"""One-time backfill: push all existing daily data to Supabase.

Usage:
  export SUPABASE_URL=https://xxx.supabase.co
  export SUPABASE_SERVICE_KEY=eyJ...
  python scripts/backfill-supabase.py
"""
import sys, os
from pathlib import Path

# Reuse everything from update_tearsheet.py
sys.path.insert(0, str(Path(__file__).parent))
import update_tearsheet as mod


def main():
    if not mod.supabase_configured():
        print("❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
        sys.exit(1)

    print("📊 Backfilling Supabase from all existing daily outputs...")

    digest_files = mod.get_digest_files()
    if not digest_files:
        print("   No digest files found.")
        sys.exit(1)

    print(f"   Found {len(digest_files)} digests to backfill")
    parsed_digests = [mod.parse_digest(f) for f in digest_files]

    # Simulate portfolio for NAV + benchmark history
    history, active_positions, b_hist, latest_digest = [], [], {}, None
    if mod._HAS_YFINANCE:
        history, active_positions, b_hist, latest_digest = mod.simulate_portfolio(parsed_digests)

    docs = mod.load_all_markdowns(mod.ROOT)
    pj_positions, _, _, _ = mod.load_portfolio_json()

    # Build metrics for latest day
    metrics_row = None
    if latest_digest:
        metrics_row = {
            "date": latest_digest["date"],
            "pnl_pct": 0,
            "sharpe": 0,
            "volatility": 0,
            "max_drawdown": 0,
            "alpha": 0,
            "cash_pct": 100,
            "total_invested": 0,
        }

    mod.push_to_supabase(parsed_digests, docs, history, b_hist, metrics_row, pj_positions)
    print("✅ Backfill complete!")


if __name__ == "__main__":
    main()
