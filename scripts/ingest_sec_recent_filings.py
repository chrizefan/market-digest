#!/usr/bin/env python3
"""
ingest_sec_recent_filings.py — Recent EDGAR filings for watchlist tickers → sec_recent_filings.

Requires SEC_EDGAR_USER_AGENT (SEC policy). Loads from config/mcp.secrets.env or env.

Usage:
  python3 scripts/ingest_sec_recent_filings.py --dry-run
  python3 scripts/ingest_sec_recent_filings.py --supabase
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from lib.macro_ingest import CHUNK_SIZE, connect_supabase, load_config_env  # noqa: E402
from lib.watchlist import parse_tickers_from_watchlist  # noqa: E402

COMPANY_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
SUBMISSIONS_TMPL = "https://data.sec.gov/submissions/CIK{cik10}.json"

# Forms useful for research / institutional flow skills (subset of all EDGAR types).
FORMS_OF_INTEREST = frozenset(
    {
        "8-K",
        "8-K12B",
        "8-K12G3",
        "6-K",
        "4",
        "3",
        "13D",
        "13G",
        "SC 13D",
        "SC 13G",
        "10-K",
        "10-Q",
        "20-F",
    }
)


def sec_headers(user_agent: str) -> dict[str, str]:
    return {
        "User-Agent": user_agent,
        "Accept-Encoding": "gzip, deflate",
    }


def load_cik_map(user_agent: str) -> dict[str, int]:
    r = requests.get(
        COMPANY_TICKERS_URL,
        headers=sec_headers(user_agent),
        timeout=60,
    )
    r.raise_for_status()
    raw = r.json()
    out: dict[str, int] = {}
    for v in raw.values():
        if not isinstance(v, dict):
            continue
        t = v.get("ticker")
        cik = v.get("cik_str")
        if t and cik is not None:
            out[str(t).upper()] = int(cik)
    return out


def normalize_ticker(t: str) -> str:
    return t.replace(".", "-").upper()


def filing_row(
    cik_int: int,
    ticker: str,
    accession: str,
    form: str,
    filing_date: str,
    report_date: str | None,
    primary_document: str | None,
) -> dict:
    cik10 = str(cik_int).zfill(10)
    acc_nodash = accession.replace("-", "")
    doc = primary_document or ""
    url = (
        f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_nodash}/{doc}"
        if doc
        else f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik_int}&type={form}"
    )
    rd = None
    if report_date and len(str(report_date)) >= 10:
        try:
            rd = str(report_date)[:10]
        except Exception:
            rd = None
    return {
        "cik": cik10,
        "ticker": ticker,
        "accession": accession,
        "form": form,
        "filing_date": filing_date[:10],
        "report_date": rd,
        "primary_document": doc or None,
        "filing_url": url,
    }


def fetch_filings_for_cik(
    cik_int: int,
    ticker: str,
    user_agent: str,
    cutoff: date,
) -> list[dict]:
    cik10 = str(cik_int).zfill(10)
    url = SUBMISSIONS_TMPL.format(cik10=cik10)
    r = requests.get(url, headers=sec_headers(user_agent), timeout=45)
    if r.status_code == 404:
        return []
    r.raise_for_status()
    data = r.json()
    recent = (data.get("filings") or {}).get("recent") or {}
    forms = recent.get("form") or []
    dates = recent.get("filingDate") or []
    accessions = recent.get("accessionNumber") or []
    primaries = recent.get("primaryDocument") or []
    reports = recent.get("reportDate") or []
    rows: list[dict] = []
    n = min(len(forms), len(dates), len(accessions))
    for i in range(n):
        form = forms[i]
        if form not in FORMS_OF_INTEREST:
            continue
        fd = dates[i][:10] if dates[i] else ""
        if not fd:
            continue
        try:
            fdate = date.fromisoformat(fd)
        except ValueError:
            continue
        if fdate < cutoff:
            continue
        acc = accessions[i]
        doc = primaries[i] if i < len(primaries) else None
        rep = reports[i] if i < len(reports) else None
        rows.append(
            filing_row(
                cik_int,
                ticker,
                acc,
                form,
                fd,
                rep,
                doc,
            )
        )
    return rows


def upsert_filings(sb, rows: list[dict]) -> int:
    if not rows:
        return 0
    for i in range(0, len(rows), CHUNK_SIZE):
        sb.table("sec_recent_filings").upsert(
            rows[i : i + CHUNK_SIZE],
            on_conflict="cik,accession",
        ).execute()
    return len(rows)


def main() -> int:
    p = argparse.ArgumentParser(description="Ingest recent SEC filings for watchlist tickers")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--supabase", action="store_true")
    p.add_argument("--days", type=int, default=14, help="Include filings on or after today−days")
    args = p.parse_args()

    load_config_env()
    ua = os.environ.get("SEC_EDGAR_USER_AGENT", "").strip()
    if not ua:
        print("SEC_EDGAR_USER_AGENT is required (SEC policy). Set in config/mcp.secrets.env.", file=sys.stderr)
        return 1

    tickers = parse_tickers_from_watchlist()
    if not tickers:
        print("No tickers in watchlist", file=sys.stderr)
        return 1

    cutoff = date.today() - timedelta(days=max(1, args.days))

    print("Loading SEC company ticker map …")
    try:
        cik_map = load_cik_map(ua)
    except Exception as e:
        print(f"Failed to load company tickers: {e}", file=sys.stderr)
        return 1

    all_rows: list[dict] = []
    missing: list[str] = []

    for raw in tickers:
        nt = normalize_ticker(raw)
        cik = cik_map.get(nt) or cik_map.get(raw.upper())
        if cik is None:
            missing.append(raw)
            continue
        try:
            batch = fetch_filings_for_cik(cik, raw.upper(), ua, cutoff)
            all_rows.extend(batch)
        except Exception as e:
            print(f"  ⚠️  {raw}: {e}")
        time.sleep(0.12)

    if missing:
        print(f"  (no CIK map entry for {len(missing)} tickers, e.g. {missing[:5]}…)")

    print(f"Collected {len(all_rows)} filing rows (cutoff {cutoff})")

    if args.dry_run:
        for r in all_rows[:15]:
            print(json.dumps(r, default=str))
        if len(all_rows) > 15:
            print(f"… and {len(all_rows) - 15} more")
        return 0

    sb = connect_supabase()
    if not sb:
        print("Supabase not configured", file=sys.stderr)
        return 1

    n = upsert_filings(sb, all_rows)
    print(f"Upserted {n} rows into sec_recent_filings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
