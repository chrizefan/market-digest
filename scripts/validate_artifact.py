#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import jsonschema  # type: ignore

    _HAS_JSONSCHEMA = True
except ImportError:
    _HAS_JSONSCHEMA = False

ROOT = Path(__file__).parent.parent
SCHEMAS_DIR = ROOT / "templates" / "schemas"


def _load_json(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("artifact must be a JSON object")
    return data


def _schema_path_for(doc_type: str) -> Path:
    mapping = {
        "weekly_digest": "weekly-digest.schema.json",
        "monthly_digest": "monthly-digest.schema.json",
        "master_digest": "master-digest.schema.json",
        "delta_segment": "delta-segment.schema.json",
        "rebalance_decision": "rebalance-decision.schema.json",
        "deep_dive": "deep-dive.schema.json",
        "sector_report": "sector-report.schema.json",
        "asset_recommendation": "asset-recommendation.schema.json",
        "portfolio_recommendation": "portfolio-recommendation.schema.json",
        "deliberation_transcript": "deliberation-transcript.schema.json",
        "delta_digest": "delta-digest.schema.json",
    }
    fname = mapping.get(doc_type)
    if not fname:
        raise ValueError(f"Unknown doc_type: {doc_type}")
    return SCHEMAS_DIR / fname


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate a JSON artifact against its schema.")
    ap.add_argument("artifact", help="Path to JSON artifact file")
    args = ap.parse_args()

    if not _HAS_JSONSCHEMA:
        print("jsonschema not installed. Run: pip install jsonschema", file=sys.stderr)
        return 2

    artifact_path = Path(args.artifact)
    payload = _load_json(artifact_path)
    doc_type = str(payload.get("doc_type") or "")
    if not doc_type:
        raise ValueError("artifact missing doc_type")
    schema_path = _schema_path_for(doc_type)
    schema = _load_json(schema_path)

    jsonschema.validate(instance=payload, schema=schema)
    print(f"✅ valid: {artifact_path} ({doc_type})")
    return 0


if __name__ == "__main__":
    sys.exit(main())

