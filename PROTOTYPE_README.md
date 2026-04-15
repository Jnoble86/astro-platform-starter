# Civils Estimator Prototype UI

This prototype provides a disposable operator-facing UI layer over the current civils CSV pack.

## Structure

- `src/lib/csvAdapter.ts`
  - Lightweight CSV parser and repository-root file loader.
- `src/lib/prototypeAdapter.ts`
  - UI-facing orchestration layer that derives:
    - `estimateSession`
    - `availableScopeChoices`
    - `activeQuestionGroups` (question bank keyed by scope+method)
    - `estimateSummary`
    - `triggeredControls`
    - `outputPreviewModel`
- `src/components/prototype/EstimatorPrototypeApp.tsx`
  - React prototype app shell and surfaces:
    - Dashboard
    - Estimates
    - New Estimate wizard (Project / Scope / Inputs / Review and Output)
    - Approvals
    - Outputs
    - Admin placeholders
- `src/pages/prototype.astro`
  - Entry route for the prototype (`/prototype`).

## Prototype data behavior

- Source of truth is loaded from repository-root CSV files.
- No direct Dataverse binding is used.
- Questions are filtered by selected scope item + delivery method.
- Summary, controls, and output preview are recalculated from adapter outputs.

## What should connect to Dataverse later

1. Replace `readCsvFromRepoRoot` in `csvAdapter.ts` with a Dataverse data provider.
2. Keep `prototypeAdapter.ts` as a stable transformation layer (or migrate logic to app service layer).
3. Replace in-memory estimate state with persisted estimate entities and workflow status actions.
4. Wire `Save draft`, `Validate`, `Send for review`, and `Generate output` to real backend operations.
5. Replace admin placeholders with role-based maintenance screens tied to Dataverse tables.

## Run

```bash
npm run dev
```

Open: `http://localhost:4321/prototype`
