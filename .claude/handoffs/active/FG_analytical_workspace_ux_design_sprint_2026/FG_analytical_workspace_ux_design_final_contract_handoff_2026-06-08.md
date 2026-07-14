# FG Analytical Workspace UX Design Sprint - Final Contract Handoff

## Status

`completed / final docs-only UX contract accepted`

## Purpose

Supporting handoff for the completed docs-only `FG Analytical Workspace UX Design Sprint`.

Authoritative state remains in:

- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_5_final_analytical_workspace_ux_contract_handoff.md`

This handoff is supporting continuity evidence only.

## Final accepted model

- `Compact` = calm search-first understanding surface.
- `Expanded` = deep chart-first analytical mode.
- The two modes are different user thinking modes, not two sizes of the same screen.
- Final `Compact` reading order:
  `Search/Input -> instrument identity -> price snapshot -> chart evidence -> key metrics -> secondary context -> bridge to Expanded`.

## Accepted Phase 1-4 synthesis

- Phase 1 accepted the current UI inventory and role split.
- Phase 2 accepted `Search/Input` as calm analytical entry, with primary action `Показать`.
- Phase 3 accepted result hierarchy, instrument identity, share-class disambiguation, and result-level freshness.
- Phase 4 accepted the chart surrounding controls boundary: no dedicated chart-operation toolbar in `Compact`; only the neutral bridge to `Expanded` is accepted in current scope.

## Closed slices

Do not reopen without new evidence and explicit Owner approval:

- completed Phase 1-5 UX decisions;
- chart internals;
- LWC work;
- indicators;
- panes / `MultiPaneChart`;
- dashboard / `DashboardColumn`;
- `News` product/API redesign;
- `AI / Summary`;
- broad frontend rewrite;
- broad `App.js` rewrite.

## Remaining debt

- `DEBT-FE-001` - compact/socket chart ownership remains in `App.js`; status `watch`.
- `DEBT-FE-002` - `News` data contract drift; status `deferred`.
- `DEBT-FE-003` - `DashboardColumn` data-contract / mock-real merge risk; status `deferred`.

None of these debt items are closed by the UX contract.

## Next safe entry

`MODE: DECISION / OWNER REVIEW NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SCOPE`

Any implementation must be a new bounded Owner-approved slice with exact owner, file surface, expected observable behavior, verification route, and protected closed slices.

## Product-code note

No product code, backend, browser/runtime QA, chart internals, dashboard, `News`, or `AI / Summary` work is started by this handoff.
