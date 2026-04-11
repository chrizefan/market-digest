"""Gitignored local scratch for optional session files (quotes/macro JSON, etc.).

Canonical state is Supabase — this tree is never required for production reads.
"""
from __future__ import annotations

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
AGENT_CACHE_ROOT = _ROOT / "data" / "agent-cache"


def daily_dir(date_str: str) -> Path:
    return AGENT_CACHE_ROOT / "daily" / date_str


def daily_data_dir(date_str: str) -> Path:
    return daily_dir(date_str) / "data"
