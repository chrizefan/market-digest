# Evolution / post-mortem (legacy index)

New work is **JSON-first** under `outputs/evolution/YYYY-MM-DD/`:

- `quality-log.json` — `evolution_quality_log` (schema: `templates/schemas/evolution-quality-log.schema.json`)
- `sources.json` — `evolution_sources`
- `proposals.json` — `evolution_proposals`

Scaffold: `./scripts/scaffold_evolution_day.sh [YYYY-MM-DD]`

The historical narrative log in this folder (`quality-log.md`) is retained for reference; append new dated sections here only if you want a single readable file—**canonical artifacts for publishing are the JSON files above.**
