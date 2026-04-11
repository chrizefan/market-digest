# Compiled research view (on read, not stored per day)

## Problem

Storing a **fully merged** digest for every weekday (baseline + all deltas) duplicates data and grows storage without adding new information.

## Approach

1. **Canonical writes**  
   - **Sunday (baseline):** full digest snapshot in `daily_snapshots.snapshot` and `documents` (`document_key` digest).  
   - **Mon–Sat:** delta request JSON (`delta-request.json` pattern) and/or **`research-delta.json`**; materialized snapshot row for the date as you do today.

2. **Derived “as of Thursday” view**  
   When the UI or API needs “what we believe on date D”:

   - Load **baseline snapshot** for the latest `run_type = baseline` with `date <= D` (typically the prior Sunday).  
   - Load **delta requests** (or segment ops) for each day in `(baseline_date, D]` ordered by date.  
   - **Fold** deltas into the baseline using the same rules as `materialize_snapshot` / your delta compiler (deterministic `ops` on paths).

3. **Do not** persist the folded result as a third blob unless you add a short-TTL cache (e.g. edge cache) for hot reads.

4. **Research-only days**  
   `research-delta.json` is **additive** context. Folding for portfolio narrative may ignore it; the Research Library queries `documents` by `document_key` / `doc_type` directly.

## Implementation notes

- Server components or API routes should accept `as_of` and perform fold in code or via a SQL/RPC function if you move logic to Postgres.  
- Keep the delta op schema stable (`templates/delta-request-schema.json`) so replays stay reproducible.
