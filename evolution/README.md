# Evolution / post-mortem

Canonical artifacts are **`evolution_sources`**, **`evolution_quality_log`**, and **`evolution_proposals`** (schemas under `templates/schemas/evolution-*.schema.json`). **Publish to Supabase** with:

```bash
python3 scripts/validate_artifact.py -
python3 scripts/publish_document.py --payload - --document-key … 
```

(pipe JSON on stdin for each artifact)

Scaffold (optional local scratch): `./scripts/scaffold_evolution_day.sh [YYYY-MM-DD]` — still end by **publishing** via `publish_document.py`; do not rely on committed `data/agent-cache/` (that tree is gitignored).

The narrative `quality-log.md` in this folder is optional human-readable notes only.
