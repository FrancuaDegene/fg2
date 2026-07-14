# Phase 5 - DashboardColumn Decision

## Статус

`completed / decision-only deferred`

## Решение

Phase 5 закрыта как decision-only deferred.

Это не implementation slice.

Dashboard scope не активирован.

`DashboardColumn` не входит в active product/design scope этого sprint.

Future work requires explicit Owner activation.

## Why

`DashboardColumn` остаётся growth-risk frontier:

- dashboard boundary не активирован как product scope;
- dashboard path смешивает mock и partial-real assumptions;
- minimal dashboard data contract ещё не определён.

## Recorded debt

`DEBT-FE-003 — DashboardColumn data-contract / mock-real merge risk`

Обязательные поля debt:

1. debt left: `DashboardColumn` data-contract / mock-real merge risk;
2. why no patch now: dashboard not active scope;
3. trigger to return: Owner activates dashboard/product-design scope;
4. minimal future patch: define minimal dashboard data contract before implementation;
5. likely files: `DashboardColumn.jsx`, `ChartContent.js`, possible `ChartRenderer.js`, possible dashboard data hook/adapter;
6. risk if forgotten: design/build may rely on mixed mock/partial-real data as product truth.

## Non-result

- no dashboard implementation;
- no product/UI changes;
- no dashboard activation;
- no claim that `DashboardColumn` is product-ready.
