# Текущее состояние FG Analytical Workspace Shell and Search Integration

## Назначение

Это authoritative current-state для:

`FG Analytical Workspace Shell and Search Integration Sprint`

Файл фиксирует:

- active status;
- phase state;
- stop-point;
- next safe entry;
- closed baselines;
- scope и non-goals.

## Current Sprint Status

Sprint:

`FG Analytical Workspace Shell and Search Integration Sprint`

Status:

`active / Phase 0 completed / Phase 1 pending`

## Phase status

- Phase 0: `completed / activation accepted`
- Phase 1: `pending / next safe entry`
- Phase 2: `not started`
- Phase 3: `not started`
- Phase 4: `not started`
- Phase 5: `not started`
- Phase 6: `not started`

## Current stop-point

- sprint contract принят;
- sprint активирован;
- source routing обновлён;
- product implementation нового sprint ещё не начата;
- следующий шаг — read-only Phase 1 code anchor.

## Next safe entry

`MODE: ANCHOR / PHASE 1 CURRENT COMPOSITION`

## Phase 1 objective

Установить по живому коду:

- композицию `App -> SearchForm -> Results`;
- DOM owner;
- state/props flow;
- CSS owners;
- безопасную точку подключения `AnalyticalWorkspaceShell`;
- exact implementation allowlist.

Без product-code changes.

## Product target

- один существующий `SearchForm`;
- один DOM owner;
- одна behavioral logic;
- variants `entry` и `workspace`;
- `SearchForm + Results` внутри presentation-only `AnalyticalWorkspaceShell`;
- border-only frame;
- chamfered visual language.

## Closed baselines

- `FG Analytical Workspace UX Design Sprint`
- `Search Suggestions / Instrument Picker V1`
- `SearchForm Browse V1`
- `SearchForm Search Suggestions V1`
- commit `0af5b2d feat(app): stabilize ticker switch and chart request identity`

Для `0af5b2d`:

- `draft / pending / active ticker` разделены;
- primary commit атомарный;
- старый workspace сохраняется во время switching;
- stale/unknown chart responses guarded;
- `do not reopen without genuinely new runtime evidence`

## Active scope

- `AnalyticalWorkspaceShell`
- `SearchForm` variants
- workspace states
- picker layering
- reset through FG logo
- visual/runtime QA
- closure/handoff

## Non-goals

- no `SearchForm` V1 behavior redesign
- no duplicate `SearchForm`
- no backend/database
- no chart internals
- no dashboard
- no `News` redesign
- no `AI / Summary`
- no broad `App.js` rewrite
- no new chart/socket/cache logic in `App.js`
- no `useChartSocketBridge` extraction

## Ownership guard

- `App.js` — minimal orchestration wiring only
- `SearchForm` — search behavior owner
- `AnalyticalWorkspaceShell` — presentation/layout only
- `Results` — existing result composition owner

## Source routing

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md`
5. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md`
6. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md`
7. `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
8. `docs/domain/FG_INSTRUMENT_PICKER_CONTRACT.md`
9. `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`
10. `.claude/handoffs/active/FG_atomic_ticker_lifecycle_and_chart_request_identity_2026/FG_atomic_ticker_lifecycle_and_chart_request_identity_handoff_2026-07-03.md` — supporting continuity evidence only; not authority replacement; detailed evidence for commit `0af5b2d`, `draft / pending / active ticker`, atomic primary commit, old workspace preservation, and request identity guards.
11. `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_search_suggestions_v1_closure_handoff_2026-06-11.md` — supporting continuity evidence only; not authority replacement; closed `SearchForm` V1 states, suggestions, Browse Mode, loading/error/no-results, recent selections, and post-selection contract.
12. `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_browse_v1_handoff_2026-06-11.md` — supporting continuity evidence only; not authority replacement; Browse Mode, chips, routing, `Escape`, outside click, and invalid submit guard.
13. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_5_final_analytical_workspace_ux_contract_handoff.md` — supporting continuity evidence only; not authority replacement; accepted final UX composition and boundaries.

Supporting handoffs загружаются только когда текущая задача затрагивает соответствующий closed baseline. Они не переопределяют current-state, sprint contract или Owner decisions.

Current-state wins for stop-point and immediate next step.
