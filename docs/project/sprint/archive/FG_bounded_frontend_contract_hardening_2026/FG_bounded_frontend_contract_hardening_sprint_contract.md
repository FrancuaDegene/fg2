# Bounded Frontend Contract Hardening Sprint Contract

## Status

`completed / docs-only closure accepted`

## Sprint Goal

Сделать несколько frontend boundary contracts явными перед следующим product/design этапом, не начиная broad cleanup и не открывая закрытые chart internals.

## Inputs

- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `docs/project/state/FG_bounded_frontend_contract_hardening_current_state_2026-06-03.md`
- `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
- `.claude/handoffs/active/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_closure_handoff_2026-05-25.md`
- `docs/project/sprint/archive/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_closure_review.md`

## Architecture Hypothesis

FG remains:

`single analytical workspace UX`
+ `modular frontend domain architecture`
+ `thin App shell`

## Sprint Objective

Move from implicit / duplicated / legacy frontend boundaries to explicit bounded contracts.

## Phase Model

- Phase 0 — Sprint Activation / Source Routing.
- Phase 1 — Contract Hardening Anchor / Prioritization Pass.
- Phase 2 — Search Suggestions Contract.
- Phase 3 — App <-> Chart Transport / Domain Contract.
- Phase 4 — News Legacy Boundary Decision / Isolation.
- Phase 5 — DashboardColumn Decision only if dashboard enters scope.
- Phase 6 — Closure / Docs Sync.

## Definition Of Done

- at least Search suggestions contract classified and, if patch-ready, hardened;
- `App <-> Chart` boundary contract explicitly documented before chart-heavy design;
- `News` legacy status decided if `News` remains visible or enters design scope;
- `DashboardColumn` either deferred or given minimal decision if dashboard enters scope;
- no broad rewrite;
- no closed chart internals reopened;
- no `AI / Summary` work.

## Closure Outcome

Accepted closure:

- Phase 4 completed;
- Phase 5 recorded as `decision-only deferred`;
- dashboard scope not activated;
- no `DashboardColumn` implementation happened;
- remaining dashboard debt recorded in `DEBT-FE-003`;
- next direction requires Owner decision after closure handoff.

## Non-Goals

- no broad frontend rewrite;
- no broad `App.js` rewrite;
- no route/page architecture migration;
- no chart internals reopen;
- no `MultiPaneChart` redesign;
- no new indicators;
- no `AI / Summary` work;
- no `News` product redesign;
- no dashboard build unless explicitly activated;
- no product code patch without anchor and explicit `EXECUTE`.
