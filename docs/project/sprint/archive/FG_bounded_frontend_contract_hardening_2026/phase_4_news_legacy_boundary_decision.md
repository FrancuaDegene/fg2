# Phase 4 — News Legacy Boundary Decision / Isolation

## Статус

`completed / read-only boundary decision and safety-patch plan accepted`

## Назначение

Зафиксировать read-only boundary anchor для `News`.

Цель — понять, является ли `News` сейчас active FG product domain, inherited legacy surface, patch-ready boundary issue или deferred surface.

## Границы

В scope:

- News mount / visibility path;
- News props contract;
- News data / loading / error ownership;
- News callbacks / formatting ownership;
- legacy boundary decision;
- isolation / defer / patch-readiness decision.

Вне scope:

- News product redesign;
- News UI redesign;
- backend News redesign;
- chart work;
- Dashboard;
- AI/Summary;
- browser/runtime QA;
- product-code patch.

## Проверенные файлы

- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/News/News.js`
- `fingineerwebapp/src/config/api.js`

Проверено также, что ожидаемый путь `fingineerwebapp/src/components/News/News.js` отсутствует; фактический `News` находится под `Results`.

## Карта владельцев

- data owner: `App.js` получает основной ticker payload через `fetchTickerInfo` и записывает `setNews(result.news || [])`.
- loading owner: `App.js` владеет общим `isLoading`, но `Results.js` не передает этот prop в `News.js`; внутри `News.js` `isLoading` ожидается как prop.
- error owner: отдельного owner для News error нет; ошибки основного ticker request превращаются в `data.error`, а News-specific error boundary отсутствует.
- formatting owner: `News.js` ожидает `formatDate`, но parent его не передает.
- item rendering owner: `News.js` рендерит список, date, title, content и link.
- visibility / toggle owner: `Results.js` всегда монтирует `News` внутри results row при наличии `query`; `App.js` передает `toggleNews={() => {}}`, поэтому open/close behavior фактически no-op.
- API / endpoint owner: `config/api.js` содержит `ENDPOINTS.NEWS`, но текущий видимый News path использует `ENDPOINTS.TICKER`; отдельного News fetch в проверенном path нет.

## Карта boundary

`App.js` владеет:

- selected ticker / query identity;
- ticker request через `config.API_BASE_URL` + `config.ENDPOINTS.TICKER`;
- `news` state;
- общим `isLoading`;
- reset News при новом поиске и clear flow.

`Results.js` владеет:

- relay mount для `News`;
- передачей `news`, `newsContainerRef`, `toggleNews`;
- общим layout placement рядом с `KeyMetrics`;
- не владеет News data, loading, error, formatting или real toggle behavior.

`News.js` владеет:

- отображением News списка;
- локальным `visibleNewsCount`;
- lazy reveal через `IntersectionObserver`;
- item rendering;
- ожиданием `formatDate`, `toggleNews`, `isLoading` как внешних contract props.

В `News` пересекают boundary:

- `news`;
- `newsContainerRef`;
- `toggleNews`;
- ожидаемые, но сейчас не переданные `formatDate` и `isLoading`.

Обратно вверх из `News` пересекает только callback `toggleNews(index)`, но текущий callback из `App.js` является no-op.

## Расхождение props contract

`News.js` ожидает props:

- `news`;
- `newsContainerRef`;
- `toggleNews`;
- `formatDate`;
- `isLoading`.

`Results.js` фактически передает:

- `news`;
- `newsContainerRef`;
- `toggleNews`.

Найденный drift:

- `formatDate` отсутствует, но используется как required callable: `formatDate(item.date)`;
- `isLoading` отсутствует, но участвует в lazy-load guard и spinner state;
- `toggleNews` передается из `App.js` как no-op;
- `News.js` не имеет runtime-safe fallback для отсутствующего `formatDate`;
- `News.js` ожидает `item.isExpanded`, но текущий no-op callback не меняет item state.

## Классификация

`News` сейчас классифицируется как:

- inherited legacy surface: yes;
- visible legacy island: yes;
- patch-ready boundary issue: yes;
- active product domain: no;
- deferred product domain: yes, пока Owner отдельно не активирует News design;
- dead/unused surface: no, потому что `Results.js` монтирует `News`;
- unclear: no по текущему mount / props / data path.

## Риски

Если product/design начнет опираться на `News` без boundary decision, работа будет строиться поверх неявного legacy contract:

- visible UI может падать при наличии news items из-за отсутствующего `formatDate`;
- click по news title не раскрывает item, потому что `toggleNews` no-op;
- loading / error ownership неявно смешан с общим ticker request;
- `ENDPOINTS.NEWS` существует в config, но текущий видимый путь получает News из ticker payload;
- `Results.js` выглядит как relay layer, но скрывает неполный props contract.

## Принятый вывод

`PHASE 4 COMPLETED — NEWS SAFETY PATCH PLAN ACCEPTED WITH DATA-CONTRACT DEBT`

Historical Phase 4 result: the read-only boundary decision and safety-patch plan were accepted; implementation and runtime QA were out of scope at that time.

Later completion evidence: Git first records the safety patch in `d46f164f17e332d0317aa7d7bd58da6960c3c4d3` (`2026-06-15`), and the closure artifacts confirm completion. Full QA with real `news[]` remains unproven.

Причина:

- найденный props contract drift был закрыт bounded safety patch в `News.js`;
- visible legacy surface стал безопаснее без News product redesign;
- реальный News data contract не восстановлен в этом sprint;
- `DEBT-FE-002 — News data contract drift` остаётся открытым.

## Якорь patch-readiness

Точные file candidates:

- `fingineerwebapp/src/components/Results/News/News.js`
- `fingineerwebapp/src/components/Results/Results.js`
- возможно `fingineerwebapp/src/App.js`, только если Owner решит сохранить toggle ownership на workspace level.

Точный owner conflict:

- `News.js` ожидает formatting / loading / toggle ownership извне;
- `Results.js` передает неполный contract;
- `App.js` передает no-op для visible item action.

Минимальный patch type:

- либо сделать `News.js` самодостаточным legacy island с безопасным date fallback и local expand state;
- либо явно передать `formatDate`, `isLoading` и real `toggleNews` через `Results.js` / `App.js`.

Почему patch bounded:

- issue локализован в News mount / props boundary;
- backend redesign не нужен;
- News product redesign не нужен;
- chart, Dashboard и AI/Summary не затрагиваются.

Runtime QA после будущего patch:

- открыть normal dev baseline;
- выполнить search, который возвращает `news`;
- убедиться, что список News рендерится без crash;
- проверить дату в item;
- проверить click по title и раскрытие content/link;
- проверить состояние при пустом `news`;
- проверить, что Search / Chart не регрессировали визуально в базовом flow.

Rollback:

- вернуть только будущий News-boundary patch;
- не трогать Phase 4 docs без отдельного docs sync.

## Later completion evidence (post-Phase 4)

Owner review принял Phase 4 как bounded result:

`POST-PHASE 4 CLOSURE — NEWS SAFETY PATCH COMPLETION CONFIRMED WITH DATA-CONTRACT DEBT`

Принято:

- `News.js` safety patch applied;
- visible legacy surface made safer;
- no News product redesign;
- no backend News redesign;
- no real News data contract restored in this sprint.

Не принято как завершённое:

- real News product domain;
- real News data integration;
- ticker-specific company News contract;
- full runtime QA with real `news[]`.

Причина:

`/api/news` существует и возвращает общий news array, но текущий visible frontend path ожидает `result.news` из `/api/ticker/{ticker}`.

Owner decision:

real News data contract откладывается в future News product/API scope.

Debt reference:

`DEBT-FE-002 — News data contract drift`

## Выполненный safety patch

Product code patch затронул только:

`fingineerwebapp/src/components/Results/News/News.js`

Patch сделал `News.js` безопаснее как self-contained legacy island:

- added safe `formatDate` fallback;
- defaulted `isLoading` to `false`;
- added `safeNews`;
- added local `expandedNewsIndexes`;
- preserved external `toggleNews` callback if parent later provides real callback.

Build passed with existing unrelated warnings.

Runtime QA принял no-news safety:

- Search flow works;
- no-news state does not crash;
- critical console errors were 0 in browser QA;
- full News item expand/date QA remains not proven with real data.

## Data-contract debt

`DEBT-FE-002 — News data contract drift` остаётся открытым.

Local API facts:

- `http://localhost:3001/api/news` exists and returns a general news array from `blog_posts`;
- `http://localhost:3001/api/ticker/{ticker}` does not include `news`;
- current frontend visible path expects `result.news`.

Real News data integration откладывается в future News product/API scope.

## Следующий безопасный вход

`Create session handoff / do not start Phase 5 without explicit Owner decision`

Не переходить к Phase 5 без явного Owner decision.
