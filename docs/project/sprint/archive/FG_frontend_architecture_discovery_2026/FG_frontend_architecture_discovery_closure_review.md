# FG Frontend Architecture Discovery Pass - Closure Review

## Статус

`completed / final verdict accepted`

## Executive Verdict

`Frontend Architecture Discovery Pass` завершён.

Финальный verdict:

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

Предпочтительное название следующей линии:

`Bounded Frontend Contract Hardening Sprint`

Смысл решения:

FG frontend не сломан глобально. Перед следующим product/design этапом нужно не переписывать frontend, а укрепить несколько явных контрактов между доменами.

## Ledger завершённых фаз

- Phase 0 - Sprint Activation: completed / source activation done.
- Phase 1 - Frontend System Map: `completed / anchor accepted`.
- Phase 2 - Ownership & Boundary Pass: `completed / anchor accepted`.
- Phase 3 - Cross-Domain Coupling / Leakage Pass: `completed / anchor accepted`.
- Phase 4 - Synthesis / Verdict: `completed / final verdict accepted`.

## Финальная архитектурная сводка

- Текущий FG frontend укладывается в модель:
  single analytical workspace UX
  + modular frontend domain architecture
  + thin App shell.
- `App.js` большой, но не доказан как структурно рискованный целиком.
- `Results.js` приемлем как слой композиции.
- `Chart` остаётся одним frontend-доменом.
- Закрытые chart internals остаются закрытыми.
- `AI / Summary` отложен и не является blocker.

## Финальная карта рисков

Реальные риски утечки ответственности:

- У `Search` suggestions есть дублированный transport owner.
- У legacy `News` boundary есть contract drift.

Кандидат на pre-design контракт:

- App / Chart transport ownership перед новыми chart-heavy сценариями.

Поздние фронтиры:

- `DashboardColumn`, если dashboard не входит в ближайший product/design scope.
- `Dividends` dormant fetch contract.
- `News` product design, если `News` не входит в immediate scope.
- Более широкий frontend service-layer cleanup.

Отложено:

- `AI / Summary` test surface.

## Three-Bucket Classification

### A. Stable enough before product/design

- `App.js` shell / orchestration.
- `Results.js` composition.
- `Results -> Chart` mount / relay.
- `Header` / `Overlay` / shared layout.
- Закрытые chart internals.
- Базовый ticker / result / metrics display flow.
- API config как endpoint registry.

### B. Needs bounded cleanup before product/design

- `Search` suggestions single owner / contract.
- App / Chart transport ownership contract перед новыми chart modes.
- `News` legacy boundary decision / isolation, если `News` остаётся видимым или входит в design scope.

### C. Later frontier / can wait

- `AI / Summary` deferred test surface.
- `DashboardColumn`, если dashboard не входит в следующий design.
- `Dividends` dormant fetch contract.
- Более широкий frontend service-layer cleanup.
- Broad App rewrite.
- Route / page architecture migration.

## Non-Goals

- Не делать broad frontend rewrite.
- Не делать broad `App.js` rewrite.
- Не делать route / page architecture migration.
- Не переоткрывать chart internals.
- Не делать `MultiPaneChart` redesign.
- Не добавлять new indicators.
- Не делать `AI / Summary` work.
- Не делать `News` product redesign.
- Не строить dashboard.
- Не делать product code patch как часть discovery closure.

## Next Safe Entry

Следующий безопасный вход:

Активировать `Bounded Frontend Contract Hardening Sprint`.

Минимальный candidate scope:

- `Search` suggestions single owner / contract.
- `App <-> Chart` transport / domain contract.
- `News` legacy boundary decision / isolation.
- `DashboardColumn` decision только если dashboard входит в следующий product/design scope.

## Evidence Gaps

- Backend schema ownership для ticker / news / dividends payloads не проверялся.
- Runtime / browser proof для `News` contract drift не запускался.
- Точный следующий product/design scope всё ещё требует Owner decision.
- Конкретные новые chart scenarios ещё нужно определить.
- Dashboard scope не решён.

## Closure Notes

- Product code changed: no.
- Browser / runtime QA run: no.
- Cleanup implementation started: no.
- Chart internals reopened: no.
- Archive move performed: yes.
- Archived path: `docs/project/sprint/archive/FG_frontend_architecture_discovery_2026/`.
- Handoff created: `.claude/handoffs/active/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_closure_handoff_2026-05-25.md`.
