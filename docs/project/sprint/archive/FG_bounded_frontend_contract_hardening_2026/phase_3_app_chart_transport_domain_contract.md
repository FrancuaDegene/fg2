# Phase 3 — App <-> Chart Transport / Domain Contract

## Статус

`completed / contract-only accepted`

## Назначение

Зафиксировать read-only boundary anchor для `App <-> Chart`.

Цель — понять, где проходит контракт между workspace shell и Chart domain перед будущими chart-heavy product/design сценариями.

## Границы

В scope:

- `App <-> Chart` transport/domain boundary;
- chart-related transport/cache/loading/error ownership;
- compact vs expanded source ownership;
- REST/socket/sourceAuthority signals;
- boundary contract before chart-heavy design.

Вне scope:

- chart internals;
- `LWC`;
- `MultiPaneChart` redesign;
- indicators;
- new chart features;
- broad `App.js` rewrite;
- News;
- Dashboard;
- AI/Summary;
- browser/runtime QA.

## Проверенные файлы

- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/Chart/Chart.js`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js`
- `fingineerwebapp/src/store/useCandles.js`

## Карта владельцев

`App.js` сейчас владеет workspace-level identity и high-level orchestration:

- `query` / выбранный ticker;
- `data` как результат основного поиска;
- `timeframe`, `interval`, `selectedDate`;
- `isChartExpanded`;
- `sourceAuthority`, который выбирает `rest` при `FG_AGG_ENABLED`, иначе `app`;
- передачей props в `Results` и дальше в `Chart`.

`App.js` также сохраняет compact/socket chart path:

- `chartData`;
- `isChartLoading`;
- `chartDataCacheRef`;
- `inflightRef`;
- `pendingByRequestIdRef`;
- `lastRequestKeyRef`;
- `lastRangeKeyRef`;
- `emitChartDataRequest`;
- socket handlers `initialData`, `updateData`, `error`;
- `chartOwnershipState` и REST ownership callback bridge через `handleRestOwnershipSignal`.

`Results.js` является relay layer:

- получает chart props от `App.js`;
- передает их в `Chart`;
- не владеет chart transport/cache/loading/error logic.

`Chart.js` владеет Chart UI split:

- compact rendering через `CompactToolbar` и `CompactSparkline`;
- expanded rendering через `ChartContainer`;
- local `candleType`;
- derived compact passport из `chartData.candles`;
- прокидывание mode/search/timeframe/interval callbacks.

`ChartContainer.js` владеет expanded Chart boundary adapter:

- создает `ChartProvider`;
- синхронизирует props в `ChartContext`;
- при `sourceAuthority === 'rest'` включает `useCandles`;
- нормализует candles перед записью в `ChartContext`;
- отправляет вверх `onRestOwnershipSignal` для `pending`, `commit`, `failure`, `reset`.

`ChartContext.js` владеет chart-local state:

- `chartData`;
- `isChartLoading`;
- `chartMeta`;
- `canvasMetrics`;
- `currentInterval`;
- `currentTimeframe`;
- `isExpanded`;
- `currentCandleType`;
- chart-local actions.

`useCandles.js` владеет REST candles path:

- `/api/candles-v2` request construction;
- module-level `CANDLES_V2_CACHE`;
- module-level `CANDLES_V2_INFLIGHT`;
- request signature / selection signature;
- latest-wins behavior;
- loading/error/meta/candles state;
- `loadMoreHistory`.

## Карта boundary

`App.js` может координировать:

- выбранный ticker / query;
- workspace result identity;
- high-level chart mode;
- выбранные `timeframe`, `interval`, `selectedDate`;
- переключение compact / expanded;
- передачу data/callbacks доменам.

Chart domain владеет:

- chart UI rendering;
- chart-local context state;
- expanded REST candles request behavior через `useCandles`;
- normalization of candles for chart context;
- chart metadata;
- `loadMoreHistory`;
- chart-local loading/error state при REST authority.

Из `App.js` в Chart пересекают boundary:

- `query`;
- `data`;
- `chartData`;
- `isChartLoading`;
- `timeframe`;
- `interval`;
- `selectedDate`;
- `socket`;
- `sourceAuthority`;
- `isChartExpanded`;
- callbacks для timeframe, interval, expand, search и REST ownership signal.

Из Chart обратно вверх пересекают boundary:

- `onTimeframeChange`;
- `onIntervalChange`;
- `onToggleExpand`;
- `onToggleSearch`;
- `onSearch`;
- `onRestOwnershipSignal`.

## Пересечение identity / mutation / failure

Identity crossing:

- источник: `App.js`;
- потребители: `Results.js`, `Chart.js`, `ChartContainer.js`, `useCandles.js`;
- пересечение: explicit props;
- оценка: normal orchestration.

Mutation crossing:

- источник: Chart UI controls;
- владелец mutation: `App.js` state setters через callbacks;
- пересечение: explicit callbacks;
- оценка: acceptable current coupling.

Loading crossing:

- compact/socket path: `App.js` владеет `isChartLoading`;
- expanded/REST path: `ChartContainer.js` берет loading из `useCandles` и пишет в `ChartContext`;
- crossing: explicit через `sourceAuthority`;
- оценка: acceptable coupling, но growth-risk frontier при добавлении новых chart-heavy modes.

Failure crossing:

- compact/socket path: socket `error` в `App.js` пишет `chartData.error` и ownership failure;
- expanded/REST path: `useCandles` пишет `error`, а `ChartContainer.js` сигналит `failure` вверх;
- crossing: explicit через `onRestOwnershipSignal`;
- оценка: acceptable coupling.

Cache/request crossing:

- compact/socket cache и inflight maps живут в `App.js`;
- expanded REST cache и inflight maps живут в `useCandles.js`;
- crossing: mode split через `sourceAuthority` и `isChartExpanded`;
- оценка: growth-risk frontier, но не текущий patch blocker.

Data payload crossing:

- compact получает `chartData` из `App.js`;
- expanded получает `chartData` как bootstrap/fallback, но REST authority может заменить данные из `useCandles`;
- crossing: explicit props plus ChartContext sync;
- оценка: acceptable current coupling.

## Классификация

Normal orchestration:

- workspace ticker/query/result identity в `App.js`;
- high-level mode state в `App.js`;
- передача props/callbacks через `Results` и `Chart`.

Acceptable coupling:

- `Results.js` как relay layer;
- `Chart.js` как UI split между compact и expanded;
- `onRestOwnershipSignal` как explicit bridge от REST path к App ownership snapshot.

Leakage risk:

- chart-specific compact/socket transport details остаются в `App.js`;
- `chartDataCacheRef`, `inflightRef`, `pendingByRequestIdRef` являются chart-specific request/cache ownership внутри workspace shell.

Growth-risk frontier:

- dual authority: compact/socket path в `App.js` и expanded/REST path в `useCandles.js`;
- loading/error ownership разделен по authority mode;
- новые chart-heavy scenarios могут усилить coupling, если не закрепить contract до design work.

Defer:

- перенос compact/socket path из `App.js`;
- унификация REST/socket ownership;
- любые изменения `MultiPaneChart`, `LWC`, indicators и chart internals.

## Риски роста

Если перед chart-heavy product/design сценариями не закрепить boundary, `App.js` может продолжить накапливать chart-specific transport/cache/loading/error ownership.

Основной риск не в размере `App.js`, а в том, что новые режимы начнут добавлять еще один слой source arbitration, request identity или failure handling поверх уже существующего split между compact/socket и expanded/REST.

На текущем evidence boundary достаточно явная: `sourceAuthority` и `onRestOwnershipSignal` делают разделение видимым.

## Owner review

Owner review принял Phase 3 anchor как contract-only.

Финальное решение:

`PHASE 3 NOT PATCH-READY — ACCEPT CONTRACT-ONLY`

Причина:

- current runtime bug: no;
- confirmed owner conflict: no;
- growth-risk frontier: yes;
- patch needed now: no.

Patch candidates рассмотрены и отклонены на сейчас, потому что каждый безопасно выглядящий вариант либо:

- сохраняет смешанного owner;
- затрагивает слишком много socket lifecycle / cache / inflight / loading / error behavior;
- рискует broad `App.js` rewrite;
- рискует chart internals spillover.

Принятый contract:

- `App.js` может владеть workspace identity, high-level chart mode и текущим compact/socket bridge.
- `ChartContainer.js` / `useCandles.js` владеют expanded REST candles path.
- `ChartContext.js` владеет chart-local rendering state.
- `Results.js` остается relay layer.

Переоткрывать patch только при новом evidence:

- новый chart-heavy scenario;
- runtime bug;
- confirmed owner conflict;
- confirmed failure/loading/cache divergence.

## Deferred Patch Candidate / Technical Debt Record

Phase 3 принята как `contract-only`, но это не означает, что debt отсутствует.

### Что остается долгом

Compact/socket chart ownership остается в `App.js`.

Конкретно в `App.js` остаются chart-specific зоны:

- compact/socket request path;
- `chartData`;
- `isChartLoading`;
- `chartDataCacheRef`;
- `inflightRef`;
- `pendingByRequestIdRef`;
- `lastRequestKeyRef`;
- `lastRangeKeyRef`;
- socket handlers `initialData`, `updateData`, `error`;
- `emitChartDataRequest`;
- `chartOwnershipState`;
- reset / search flow связи вокруг compact chart data.

### Почему не патчим сейчас

Немедленный patch не является безопасным bounded patch, потому что перенос затрагивает сразу:

- socket lifecycle;
- cache;
- inflight;
- loading;
- error behavior;
- ownership transitions;
- search/result reset flow.

Любой частичный patch сейчас либо оставляет owner смешанным, либо рискует превратиться в broad `App.js` rewrite или chart internals spillover.

### Trigger возврата к patch

Вернуться к patch нужно при любом из условий:

- появляется новый chart-heavy scenario;
- появляется runtime bug в compact/socket chart path;
- появляется confirmed owner conflict между `App.js` и Chart domain;
- появляется failure/loading/cache divergence;
- compact/socket path начинает расширяться новыми режимами, request identity или source arbitration;
- Owner явно активирует patch prompt для compact/socket ownership.

### Минимальный будущий patch candidate

Минимальный будущий patch candidate:

выделить compact/socket chart ownership из `App.js` в отдельный bounded owner, например:

`useCompactChartData` или `compactChartTransport` adapter.

Цель будущего patch:

- убрать chart-specific request/cache/inflight/loading/error ownership из workspace shell;
- сохранить `App.js` владельцем workspace identity и high-level chart mode;
- не менять REST path в `useCandles.js`;
- не переоткрывать chart internals.

### Вероятно затронутые файлы

Вероятные файлы будущего patch:

- `fingineerwebapp/src/App.js`
- новый hook/helper под compact chart ownership, если будет создан
- возможно только narrow integration point в `Chart.js` / `ChartContainer.js`, если evidence это потребует

Не трогать без нового evidence:

- `MultiPaneChart`
- `LWC`
- indicators
- `useCandles.js` REST path
- backend

### Риск, если забыть

Если этот debt забыть, `App.js` может продолжить накапливать chart-specific transport/cache/loading/error logic при новых chart-heavy сценариях.

Тогда будущий design/product work начнет строиться поверх смешанного owner, и поздний refactor станет дороже и рискованнее.

## Принятый вывод

`PHASE 3 NOT PATCH-READY — ACCEPT CONTRACT-ONLY`

Phase 3 принята как contract-only. Product-code patch сейчас не выполняется.

## Следующий безопасный вход

`Phase 4 — News Legacy Boundary Decision / Isolation`

Не начинать Phase 4 без отдельного Owner-approved prompt.
