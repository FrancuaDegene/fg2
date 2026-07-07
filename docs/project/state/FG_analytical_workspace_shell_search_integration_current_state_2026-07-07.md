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

`active / Phase 1 completed / Phase 2 pending`

## Phase status

- Phase 0: `completed / activation accepted`
- Phase 1: `completed / current composition and visual baseline accepted`
- Phase 2: `pending / not started`
- Phase 3: `not started`
- Phase 4: `not started`
- Phase 5: `not started`
- Phase 6: `not started`

## Current stop-point

- `Phase 0` closure подтверждена commit `11e8200 docs(sprint): activate analytical workspace shell sprint`;
- authoritative `Phase 1` record создан;
- supporting session handoff создан;
- accepted pre-shell `Results` visual baseline зафиксирован commit `dc6c06e feat(results): finalize visual baseline`;
- `Phase 2` `AnalyticalWorkspaceShell` implementation has not started; `dc6c06e` is the accepted pre-shell `Results` visual baseline;
- следующий шаг - bounded `Phase 2` shell execution.

## Next safe entry

`MODE: EXECUTE / PHASE 2 ANALYTICAL WORKSPACE SHELL`

## Phase 2 objective

Реализовать presentation-only `AnalyticalWorkspaceShell`, который визуально связывает существующие `SearchForm` и `Results` без изменения behavioral ownership.

Границы:

- без нового `SearchForm`;
- без переноса `SearchForm` ownership в `Results`;
- без нового ticker lifecycle;
- без chart/socket/cache logic changes;
- без reopening protected closed slices.

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
- commit `dc6c06e feat(results): finalize visual baseline`

Для `0af5b2d`:

- `draft / pending / active ticker` разделены;
- primary commit атомарный;
- старый workspace сохраняется во время switching;
- stale/unknown chart responses guarded;
- `do not reopen without genuinely new runtime evidence`

## Active scope

- `AnalyticalWorkspaceShell`
- shell insertion around existing `SearchForm + Results`
- presentation-only frame/layering
- picker-safe overflow behavior

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

## Phase 1 closure anchors

- authoritative record: `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_1_current_composition_anchor.md`
- supporting handoff: `.claude/handoffs/active/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_session_handoff_2026-07-07.md`
- supporting activation commit: `11e8200 docs(sprint): activate analytical workspace shell sprint`
- supporting visual baseline commit: `dc6c06e feat(results): finalize visual baseline`

## Known phase-gated follow-up

- около `390px` остаётся небольшой page-level overflow;
- `.results-container` не является причиной;
- likely owner area: `SearchForm/page controls`;
- future anchor: `MODE: ANCHOR / SEARCHFORM NARROW HORIZONTAL OVERFLOW TRACE`;
- trigger: `Phase 3`, `Phase 5` или отдельное Owner activation;
- это не blocker `Phase 2`.

## Source routing

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md`
5. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md`
6. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_1_current_composition_anchor.md`
7. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md`
8. `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
9. `docs/domain/FG_INSTRUMENT_PICKER_CONTRACT.md`
10. `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`
11. `.claude/handoffs/active/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_session_handoff_2026-07-07.md` — supporting continuity evidence only; not authority replacement; `Phase 0-1` closure chronology, accepted design direction, visual baseline, runtime QA evidence, and `Phase 2` guardrails.
12. `.claude/handoffs/active/FG_atomic_ticker_lifecycle_and_chart_request_identity_2026/FG_atomic_ticker_lifecycle_and_chart_request_identity_handoff_2026-07-03.md` — supporting continuity evidence only; not authority replacement; detailed evidence for commit `0af5b2d`, `draft / pending / active ticker`, atomic primary commit, old workspace preservation, and request identity guards.
13. `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_search_suggestions_v1_closure_handoff_2026-06-11.md` — supporting continuity evidence only; not authority replacement; closed `SearchForm` V1 states, suggestions, Browse Mode, loading/error/no-results, recent selections, and post-selection contract.
14. `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_browse_v1_handoff_2026-06-11.md` — supporting continuity evidence only; not authority replacement; Browse Mode, chips, routing, `Escape`, outside click, and invalid submit guard.
15. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_5_final_analytical_workspace_ux_contract_handoff.md` — supporting continuity evidence only; not authority replacement; accepted final UX composition and boundaries.

Supporting handoffs загружаются только когда текущая задача затрагивает соответствующий closed baseline. Они не переопределяют current-state, sprint contract или Owner decisions.

Current-state wins for stop-point and immediate next step.
