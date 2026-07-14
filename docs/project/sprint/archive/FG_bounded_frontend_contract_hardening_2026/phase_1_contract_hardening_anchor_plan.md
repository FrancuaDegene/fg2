# Phase 1 — Contract Hardening Anchor / Prioritization Pass

## Статус

`completed / anchor accepted`

## Назначение

Read-only anchor для точного определения владельцев, файлов и порядка bounded hardening.

## Целевые anchor-зоны

1. `Search` suggestions:
   `SearchForm.js`, `SearchModal.js`, `useSearch.js`, API/config caller path.
2. `App <-> Chart`:
   `App.js` chart transport/cache/loading/error ownership,
   `Chart.js` / `ChartContainer.js` / `ChartContext.js` / `useCandles.js` только по необходимости.
3. `News` legacy:
   `Results.js`, `News.js`, `App.js` pass-through/news extraction area.
4. `DashboardColumn`:
   только если Owner подтверждает dashboard в ближайшем product/design scope.

## Ожидаемый результат Phase 1

- owner map;
- boundary map;
- recommended first hardening target;
- признак, готов ли первый target к patch или нужен еще один anchor;
- без code patch.

## Принятый результат

Phase 1 завершила read-only owner / boundary map.

Принятый первый hardening target:

`Search suggestions single owner / contract`

Причина:

`SearchForm.js` имел duplicated suggestions transport ownership, тогда как `SearchModal` уже использовал `useSearch.js`.

Порядок приоритетов:

1. `Search suggestions single owner / contract`.
2. `App <-> Chart transport/domain contract`.
3. `News legacy boundary decision / isolation`.
4. `DashboardColumn` deferred / conditional unless dashboard enters next product/design scope.

## Заметки о завершении

- Файлы, измененные в Phase 1: no.
- Product code, измененный в Phase 1: no.
- Browser/runtime QA в Phase 1: no.
- Phase 1 выбрала Search как первый patch target.
- Search patch был выполнен после Phase 1 и записан в `phase_2_search_suggestions_single_owner_contract.md`.

## Не делать

- не patch;
- не смотреть unrelated files;
- не запускать browser;
- не переоткрывать chart internals;
- не включать `AI / Summary` в scope.
