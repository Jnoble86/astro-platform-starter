# Civils Quote Workspace (UI Prototype)

This is a separate prototype UI layer for civils quoting that uses the repository CSV pack as source-of-truth data.

## Updated structure

### 1) Source data layer
- `src/lib/csvAdapter.ts`
  - Reads CSV files from repository root.
  - Parses CSV rows into plain objects.

### 2) Orchestration layer
- `src/lib/prototypeSeedLoader.ts`
  - Builds UI-ready scope choices and grouped inputs from CSV data.
- `src/lib/prototypeAdapter.ts`
  - Computes quote summary, review controls, output preview, and status model.

### 3) UI layer
- `src/components/prototype/EstimatorPrototypeApp.tsx`
  - Enterprise-style shell:
    - Dashboard
    - New Quote
    - Quotes
    - Reviews
    - Outputs
    - Admin
  - Core quoting flow:
    - Project
    - Scope
    - Inputs
    - Quote Builder
    - Review
  - Includes a structured quote builder surface with metadata row, grouped line table, and totals hierarchy.
- `src/pages/prototype.astro`
  - Prototype route entry (`/prototype`).

## Behaviour preserved

- Scope path filters delivery method and grouped inputs.
- Review holds and quote-required items remain visible.
- The following quote-required items remain unresolved and explicit:
  - concrete pit risers
  - concrete pit lid and frame library
  - geotextile / separator layer

## Future Dataverse connection points

1. Replace CSV reads in `csvAdapter.ts` with Dataverse provider calls.
2. Keep orchestration logic in `prototypeAdapter.ts` / `prototypeSeedLoader.ts` as the UI transformation layer.
3. Replace in-memory quote session state with persisted quote entities.
4. Connect actions (`Save draft`, `Validate`, `Send for review`, `Generate output`) to backend workflow endpoints.
5. Replace read-only admin previews with role-based maintenance views.

## Run

```bash
npm run dev
```

Route:
- `/prototype`
