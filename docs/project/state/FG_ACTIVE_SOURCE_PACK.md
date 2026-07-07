# FG Active Source Pack — маршрутизация источников

## 1. Назначение

Этот файл является canonical routing manifest для текущего рабочего контекста FG.

Он фиксирует:

- текущий active sprint;
- последний завершенный sprint;
- текущий authoritative current-state файл;
- следующий безопасный вход;
- durable frontend contracts;
- global technical debt register;
- active sprint routing;
- archived discovery references;
- правила подключения chart domain pack.

Этот файл не является sprint history, backlog, session log или заменой authoritative current-state file.

## 2. Текущий статус работы

- current active sprint: `FG Analytical Workspace Shell and Search Integration Sprint`
- current sprint status: `active / Phase 0 completed / Phase 1 pending`
- latest completed sprint: `FG Analytical Workspace UX Design Sprint` — `completed / final docs-only UX contract accepted`
- previous completed sprint: `Bounded Frontend Contract Hardening Sprint` — `completed / docs-only closure accepted`
- earlier completed sprint: `Frontend Architecture Discovery Pass` — `completed / final verdict accepted / archived`
- previous sprint: `FG Chart Architecture Stabilization Sprint` — fully administratively closed
- current authoritative current-state: `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md`
- current active sprint contract: `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md`
- current Phase 0 checklist: `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md`
- completed bounded implementation baseline: `0af5b2d feat(app): stabilize ticker switch and chart request identity`
- baseline scope: `fingineerwebapp/src/App.js`
- baseline verification: `accepted for bounded scope`
- baseline guard: `do not reopen without genuinely new runtime evidence`
- current next safe entry: `MODE: ANCHOR / PHASE 1 CURRENT COMPOSITION`
- supporting completed implementation slice: `SearchForm / Search Suggestions V1` - `completed / accepted / manual QA passed`
- slice scope: `main SearchForm picker only`
- routing note: product implementation for the new sprint is not started by Phase 0 activation

Сводка прогресса active sprint:

- Phase 0: `completed / activation accepted`
- Phase 1: `pending / next safe entry`
- Phase 2: `not started`
- Phase 3: `not started`
- Phase 4: `not started`
- Phase 5: `not started`
- Phase 6: `not started`
- Next: `MODE: ANCHOR / PHASE 1 CURRENT COMPOSITION`

Сводка latest completed UX sprint:

- Phase 0: completed / activation accepted.
- Phase 1: completed / inventory accepted.
- Phase 2: completed / UX contract accepted.
- Phase 3: completed / UX structure accepted.
- Phase 4: completed / boundary accepted.
- Phase 5: completed / final UX contract accepted.

Важно:

`Bounded Frontend Contract Hardening Sprint` означает bounded frontend contract hardening перед product/design.

Это не broad cleanup, не broad frontend rewrite и не broad `App.js` rewrite.

## 3. Порядок authority

Текущий source routing order:

1. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md` — source routing entry point.
2. `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md` — authoritative current-state for the active sprint.
3. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md` — active sprint contract.
4. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md` — Phase 0 activation record.
5. `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md` — durable frontend foundation contracts.
6. `docs/domain/FG_INSTRUMENT_PICKER_CONTRACT.md` — durable instrument picker contract.
7. `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md` — global technical debt register.
8. `.claude/handoffs/active/FG_atomic_ticker_lifecycle_and_chart_request_identity_2026/FG_atomic_ticker_lifecycle_and_chart_request_identity_handoff_2026-07-03.md` — supporting continuity evidence for committed baseline `0af5b2d`; not authority replacement.
9. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_sprint_contract.md` — completed sprint contract.
10. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_5_final_analytical_workspace_ux_contract_handoff.md` — completed final UX contract / handoff.
11. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_4_chart_surrounding_controls_boundary.md` — completed Phase 4 boundary decision.
12. `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_3_results_blocks_ux_structure.md` — completed phase evidence.
13. `.claude/handoffs/active/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_final_contract_handoff_2026-06-08.md` — supporting final handoff only.
14. `.claude/handoffs/active/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_phase_3_handoff_2026-06-03.md` — supporting prior handoff only.
15. `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_search_suggestions_v1_closure_handoff_2026-06-11.md` — supporting continuity evidence only; not authority replacement; not current-state override.
16. `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_browse_v1_handoff_2026-06-11.md` — supporting continuity evidence only; not authority replacement; not current-state override.
17. `docs/project/sprint/archive/FG_bounded_frontend_contract_hardening_2026/FG_bounded_frontend_contract_hardening_closure_review.md` — previous completed sprint closure review.
18. `docs/project/sprint/archive/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_closure_review.md` — archived previous completed-sprint evidence.
19. Archived memory as background only.
20. `gbrain` helper only, never authority replacement.

Current-state wins для current stop-point и immediate next step.

### Правило закрытия contract-only

Для FG source routing `contract-only` считается закрытым только при явном deferred patch / technical debt record.

Минимальная запись обязана фиксировать:

1. что остаётся debt;
2. почему patch не выполняется сейчас;
3. какой trigger возвращает работу к patch;
4. минимальный future patch candidate;
5. likely touched files;
6. риск, если debt забудут.

Если найден `growth-risk frontier` или leakage risk, отсутствие текущего runtime bug или подтверждённого owner conflict не отменяет debt record.

## 4. Постоянные FG core sources

- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md`
- `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md`
- `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md`
- `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`
- `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
- `docs/domain/FG_INSTRUMENT_PICKER_CONTRACT.md`
- `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md` - prior completed-sprint evidence only
- `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_search_suggestions_v1_closure_handoff_2026-06-11.md` - supporting evidence for the latest accepted `SearchForm / Search Suggestions V1` closure
- `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`

`docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md` остается durable frontend foundation contract reference, созданным из `Frontend Architecture Discovery Pass`.

`docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md` является durable register для deferred debt, blocked-by-owner-decision debt и debt, который нельзя оставлять только в phase-файлах.

### Справочник ChatGPT/session

- `docs/project/policy/FG_ChatGPT_Session_Settings_v6.md`
  - ChatGPT-facing session settings/reference.
  - Не входит в Codex active source-chain.
  - Не является project authority или sprint authority.
  - Не переопределяет `AGENTS.md`, `CODEX_RULES.md`, `docs/project/policy/agent_*.md`, current-state или active Project Sources.

## 5. Пакет completed UX sprint

Latest completed sprint:

`FG Analytical Workspace UX Design Sprint`

Папка completed sprint:

`docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/`

Файлы completed sprint:

- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/README.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_sprint_contract.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_0_sprint_activation_checklist.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_1_main_workspace_current_ui_inventory.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_2_search_input_buttons_ux_contract.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_3_results_blocks_ux_structure.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_4_chart_surrounding_controls_boundary.md`
- `docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_5_final_analytical_workspace_ux_contract_handoff.md`
- `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`

Контракт completed sprint:

`docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_sprint_contract.md`

Latest completed phase file:

`docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/phase_5_final_analytical_workspace_ux_contract_handoff.md`

Historical next safe entry at sprint closure:

`MODE: DECISION / OWNER REVIEW ANALYTICAL WORKSPACE SHELL AND SEARCHFORM VARIANTS`

Дизайн-линия активирована как docs-only sprint для главной аналитической workspace-страницы. Dashboard не активирован.

## 6. Границы completed sprint

Минимальный candidate scope:

- main analytical workspace layout;
- search/input flow;
- buttons and action states;
- suggestions / submit / clear states;
- visible result block structure;
- result summary card;
- key metrics / result blocks;
- chart surrounding controls only, not chart internals;
- empty / loading / error / result states;
- visual hierarchy and reading order.

Non-goals:

- no implementation;
- no code patch;
- no backend;
- no dashboard build;
- no `DashboardColumn` activation;
- no `News` product/API redesign;
- no chart internals;
- no indicators;
- no `AI / Summary` product scope;
- no broad frontend rewrite;
- no broad `App.js` rewrite.

## 7. Архивный пакет завершенного sprint

Previous completed sprint pack:

- status: `completed / docs-only closure accepted / archived`
- completed sprint: `Bounded Frontend Contract Hardening Sprint`
- final verdict: `Phase 5 completed / decision-only deferred; dashboard scope not activated`
- preferred next-line name: `none / pending Owner decision`
- authoritative current-state: `docs/project/state/FG_bounded_frontend_contract_hardening_current_state_2026-06-03.md`
- archived sprint folder: `docs/project/sprint/archive/FG_bounded_frontend_contract_hardening_2026/`
- sprint contract: `docs/project/sprint/archive/FG_bounded_frontend_contract_hardening_2026/FG_bounded_frontend_contract_hardening_sprint_contract.md`
- closure review: `docs/project/sprint/archive/FG_bounded_frontend_contract_hardening_2026/FG_bounded_frontend_contract_hardening_closure_review.md`
- final verdict file: `docs/project/sprint/archive/FG_bounded_frontend_contract_hardening_2026/phase_6_closure_docs_sync.md`
- durable frontend contracts: `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
- closure handoff: `.claude/handoffs/active/FG_bounded_frontend_contract_hardening_2026/FG_bounded_frontend_contract_hardening_closure_handoff_2026-06-03.md`

Заметки о завершении:

- Product code changed: no.
- Browser / runtime QA run: no.
- Cleanup implementation started: no.
- Chart internals reopened: no.
- `AI / Summary`: deferred / test surface / out of current product scope.
- Dashboard scope activated: no.
- Archive move completed: yes.
- Closure handoff created: yes.

## 8. Маршрутизация handoff и archive

Final handoff:

`.claude/handoffs/active/FG_analytical_workspace_ux_design_sprint_2026/FG_analytical_workspace_ux_design_final_contract_handoff_2026-06-08.md`

Archive move:

completed.

Папка archived completed sprint:

`docs/project/sprint/archive/FG_analytical_workspace_ux_design_sprint_2026/`

Handoffs остаются только supporting continuity evidence. Repo convention does not confirm moving this sprint handoff out of `.claude/handoffs/active/...` in this pass.

## 9. Domain packs и правила подключения

### Frontend Foundation Contracts

Использовать:

- `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`

когда работа затрагивает:

- frontend shell;
- workspace / navigation model;
- domain boundaries;
- state ownership;
- frontend API / transport ownership;
- legacy surface classification;
- chart product-boundary contract;
- deferred `AI / Summary` status;
- dashboard / shared panel boundary.

### Instrument Picker Contract

Использовать:

- `docs/domain/FG_INSTRUMENT_PICKER_CONTRACT.md`

когда работа затрагивает:

- Search Suggestions / Instrument Picker;
- ticker identity and instrument distinction;
- suggestion row metadata labels;
- normalized suggestions backend source;
- `SBER` / `SBERP`, fund, index, currency, board, sourceTable rules.

Protected closed-slice note:

- accepted `SearchForm / Search Suggestions V1` behavior must not be reopened unless explicitly scoped;
- accepted V1 includes typed suggestions, Browse Mode on empty focus, chips `Все` / `Акции` / `Фонды` / `Индексы`, no-results state, loading skeleton + soft shimmer, error state + retry, recent selections via `localStorage`, row hover / active affordance, and post-selection action contract;
- this SearchForm closure does not include `SearchModal` Browse Mode, backend data expansion, auth / server-side recent history, MOEX ISS catalog expansion, bonds / futures / options expansion, Unified Results UI, Results / Compact / Expanded redesign, chart internals, `News` product/API redesign, or keyboard navigation / `aria-selected` model.
- latest supporting implementation evidence for this closed slice: `.claude/handoffs/active/FG_search_suggestions_v1_2026/searchform_search_suggestions_v1_closure_handoff_2026-06-11.md`

### Chart Domain Pack

Использовать только когда задача действительно затрагивает:

- chart architecture;
- indicators;
- timeframe / interval;
- chart ownership;
- chart runtime / render / navigation;
- chart QA or chart frontiers.

Файлы:

- `docs/domain/FG_CHART_ARCHITECTURE_MAP.md`
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
- `docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md`

Не загружать Chart Domain Pack по умолчанию для unrelated non-chart work.

## 10. Архивная память chart sprint

Archived surfaces закрытого chart sprint остаются background only:

- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_chart_architecture_stabilization_sprint_v1.1.md`
- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_phase_9_indicator_visual_behavior_plan.md`
- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_chart_architecture_stabilization_sprint_closure_review.md`
- `docs/project/sprint/archive/FG_chart_architecture_stabilization_sprint_2026/FG_chart_architecture_stabilization_sprint_retrospective.md`

Эти файлы являются historical/background only. Они не являются mandatory bootstrap sources для active sprint и не override active current-state или stable domain docs.

## 11. Заметка по tool routing

Project Sources и repo docs остаются authority.

`gbrain` может помогать доставать accepted context, handoffs и closed/open frontier memory.

`gbrain` не заменяет этот manifest, current-state или stable docs.

## 12. Правила обновления

Обновлять этот файл, когда:

- активируется новый sprint;
- меняется authoritative current-state;
- меняется active sprint roadmap / contract;
- domain pack становится mandatory или retired;
- меняется archived sprint memory routing.

Не использовать этот файл как session log.

Не dumping sprint history в этот файл.
