# Codex Iterative Test Brief

## Purpose
Run a narrow integrity test pass against the civils Dataverse workbook and CSV import pack without redesigning the engine.

## Source of truth
Use the current workbook and CSV pack as the source of truth.
Do not redesign solved work.

## Test scope
1. Table and field consistency
2. Lookup integrity
3. Duplicate code collisions
4. Required-field completeness
5. Import readiness
6. Relationship consistency between:
   - Work Categories
   - Scope Items
   - Delivery Methods
   - Cost Components
   - Scope Build Map
   - Work Steps
   - Project Inputs
   - Calculated Quantities
   - Rate Library
   - Standard Items Library
   - Imported Rate Lines
   - Rate Mapping

## Mandatory open-item check
Confirm the following remain explicitly flagged and are not silently treated as complete:
1. concrete pit risers
2. concrete pit lid and frame library
3. geotextile / separator layer

## What to report
- defects
- proposed fixes
- blockers

Do not create new families or new architecture unless a real contradiction is found.

## Success condition
The pack is ready if:
- no broken relationships are found
- no duplicate identifiers are found
- no import-blocking column issues are found
- the three quote-dependent items remain explicitly open