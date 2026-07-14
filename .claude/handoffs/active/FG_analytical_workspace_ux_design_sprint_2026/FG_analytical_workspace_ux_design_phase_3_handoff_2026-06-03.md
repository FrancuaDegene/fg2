# FG Analytical Workspace UX Design Sprint - Phase 3 Handoff

## 1. Sprint and status

Active sprint:

`FG Analytical Workspace UX Design Sprint`

Status:

`active / Phase 3 completed`

This handoff is supporting continuity evidence only. It does not replace current-state or active phase docs as authority.

## 2. Source routing summary

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`
5. `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
6. `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`
7. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_sprint_contract.md`
8. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_3_results_blocks_ux_structure.md`
9. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_2_search_input_buttons_ux_contract.md`
10. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_1_main_workspace_current_ui_inventory.md`

Current-state wins for stop-point and immediate next step.

## 3. Phase 0 summary

- activation accepted.

## 4. Phase 1 summary

- `completed / inventory accepted`
- `Compact` = calm search-first screen for understanding selected financial instrument.
- `Expanded` = deep chart-first analytics mode.

## 5. Phase 2 summary

- `completed / UX contract accepted`
- Primary label = `Показать`
- `Search/Input` = calm entry into analysis.

## 6. Phase 3 summary

- `completed / UX structure accepted`
- Result hierarchy:
  `instrument identity -> price snapshot -> chart evidence -> key metrics -> secondary context -> bridge to Expanded`

## 7. Phase 3 accepted decisions

- general model = `financial instrument`
- current examples = MOEX stock-like instruments
- `SBER` = `обыкновенные акции`
- `SBERP` = `привилегированные акции`
- share class labels use full Russian wording
- unknown class text = `Тип инструмента не указан`
- freshness = result-level timestamp near result summary
- do not copy `TradingView` UI/code/styles/assets; only adapt identity pattern

## 8. Non-goals

- no implementation
- no backend/API
- no full catalog of instruments
- no dashboard
- no `News` redesign
- no chart internals
- no `AI / Summary`

## 9. Debt-gated surfaces

- `DashboardColumn` / dashboard
- `News` product/API
- chart internals
- `AI / Summary`

## 10. Current stop-point

`Phase 3 UX structure accepted as docs-only product/design record`

## 11. Next safe entry

`Phase 4 — Chart Surrounding Controls Boundary`

## 12. Recommended next prompt type

If `Phase 4` file does not exist:

`MODE: EXECUTE / DOCS-ONLY PHASE 4 STUB + ROUTING`

If `Phase 4` file already exists:

`MODE: ANCHOR / PHASE 4 CHART SURROUNDING CONTROLS BOUNDARY`

## 13. Mutation note

- code not touched
- runtime not touched
- backend not touched
- browser not touched
