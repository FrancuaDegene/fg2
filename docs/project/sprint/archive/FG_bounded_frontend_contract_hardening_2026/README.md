# Bounded Frontend Contract Hardening Sprint

## Статус

`completed / docs-only closure accepted`

## Назначение

Укрепить несколько frontend-контрактов перед следующим product/design этапом.

## Почему этот sprint существует

Результат `Frontend Architecture Discovery Pass`:

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

Это означает contract hardening, а не broad cleanup, broad frontend rewrite или broad `App.js` rewrite.

## Минимальный candidate scope

1. `Search` suggestions single owner / contract.
2. `App <-> Chart` transport/domain contract.
3. `News` legacy boundary decision / isolation.
4. `DashboardColumn` decision только если dashboard входит в следующий product/design scope.

## Реестр фаз

- Phase 0 — Sprint Activation / Source Routing: `completed / activation accepted`.
- Phase 1 — Contract Hardening Anchor / Prioritization Pass: `completed / anchor accepted`.
- Phase 2 — Search Suggestions Single Owner Contract: `completed / patch + runtime QA accepted`.
- Phase 3 — App <-> Chart Transport / Domain Contract: `completed / contract-only accepted`.
- Phase 4 — News Legacy Boundary Decision / Isolation: `completed / safety patch accepted with data-contract debt`.
- Phase 5 — DashboardColumn Decision: `completed / decision-only deferred`.
- Phase 6 — Closure / Docs Sync: `completed / docs-only closure accepted`.

## Результат Search suggestions

Search suggestions hardening завершен: `SearchForm.js` больше не владеет duplicated suggestions transport logic и теперь использует shared `useSearch`.

## Результат App <-> Chart

Phase 3 Owner review завершен.

Принятое решение:

`PHASE 3 NOT PATCH-READY — ACCEPT CONTRACT-ONLY`

Смысл решения:

- runtime bug не подтвержден;
- confirmed owner conflict не подтвержден;
- growth-risk frontier подтвержден;
- product-code patch сейчас не нужен.

Patch trigger оставлен на будущее: новый chart-heavy scenario, runtime bug, confirmed owner conflict или confirmed failure/loading/cache divergence.

Phase 3 закрыта как `contract-only` only with tracked deferred patch candidate.

Deferred patch candidate:

compact/socket chart ownership currently in `App.js`.

Patch trigger:

new chart-heavy scenario, runtime bug, confirmed owner conflict, or failure/loading/cache divergence.

## Результат News legacy boundary

Phase 4 завершена как bounded legacy safety result.

Accepted:

- `News.js` safety patch applied;
- build PASS;
- no-news runtime safety accepted;
- `News` remains inherited legacy surface, not mature FG product domain.

Not restored:

- real News data contract;
- ticker-specific company News;
- full News item runtime QA with real `news[]`.

Debt:

`DEBT-FE-002 — News data contract drift`

Next:

Owner decision after closure handoff / do not activate dashboard scope without explicit Owner approval.

## Глобальный debt register

Создан:

`docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`

В register вынесены durable debt items:

- `DEBT-FE-001` — App <-> Chart compact/socket ownership remains in `App.js`;
- `DEBT-FE-002` — News data contract drift.
- `DEBT-FE-003` — DashboardColumn data-contract / mock-real merge risk.

## Результат Phase 5 DashboardColumn decision

Phase 5 закрыта как `decision-only deferred`.

Принято:

- dashboard не активируется в этом sprint;
- `DashboardColumn` не считается implementation-ready или product-ready;
- product/UI patch не выполнялся;
- future dashboard work требует explicit Owner activation.

Recorded debt:

`DEBT-FE-003 — DashboardColumn data-contract / mock-real merge risk`

Минимальный future action перед любой implementation/design линией:

define minimal dashboard data contract before implementation.

## Результат Phase 6 closure / docs sync

Sprint закрыт как docs-only closure.

Closure фиксирует:

- Phase 4 completed;
- Phase 5 decision-only deferred;
- implementation для dashboard не происходил;
- remaining debt recorded in `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`;
- next direction requires Owner decision after closure handoff.

## Сохраненные non-goals

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

## Следующий безопасный вход

`Owner decision after closure handoff / do not activate dashboard scope without explicit Owner approval`

Не активировать dashboard scope и не начинать `DashboardColumn` implementation без явного Owner decision.
