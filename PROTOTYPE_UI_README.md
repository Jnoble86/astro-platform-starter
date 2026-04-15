# Civil Estimator Prototype UI

This repository now includes a **separate prototype operator UI** at:

- `http://localhost:4321/prototype`

## Purpose

This prototype wraps the existing civils CSV-backed model in an operator-friendly experience for workflow testing.
It is intentionally disposable and does **not** connect to live Dataverse.

## Architecture

### Layer 1 — Source data
- `src/prototype/sourceData.ts`
- CSV-derived mock source objects for categories, scope items, methods, inputs, controls, and quote-required placeholders.

### Layer 2 — Orchestration adapter
- `src/prototype/adapter.ts`
- Builds UI-facing objects:
  - `estimateSession`
  - `availableScopeChoices`
  - `activeQuestionGroups`
  - `estimateSummary`
  - `triggeredControls`
  - `outputPreviewModel`

### Layer 3 — UI surfaces
- `src/components/prototype/OperatorPrototypeApp.tsx`
- Reusable UI components:
  - `StatusChip.tsx`
  - `SectionCard.tsx`
  - `SummaryPanel.tsx`
- Route:
  - `src/pages/prototype.astro`

## Included screens
- Dashboard
- Estimates
- New Estimate wizard (Project → Scope → Inputs → Review and Output)
- Estimate detail paneling inside wizard
- Approvals / review queue
- Output preview
- Admin placeholders

## What still must connect to Dataverse later
1. Replace `sourceData.ts` with API-backed data adapter calls.
2. Persist estimate sessions and answer payloads.
3. Resolve calculations/totals from production pricing engine services.
4. Wire output preview to export pipeline.
5. Add role-aware permissions for operator vs admin surfaces.

## Locked placeholder handling preserved
The prototype intentionally keeps these as unresolved quote-dependent items:
- concrete pit risers
- concrete pit lid and frame library
- geotextile / separator layer
