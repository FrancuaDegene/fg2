# FG_CHART_ARCHITECTURE_MAP.md

## Purpose

Этот документ — главный архитектурный компас для FG Chart Engine.

Он нужен, чтобы:
- видеть текущую структуру chart system по слоям;
- понимать, кто владеет какими состояниями;
- видеть реальные точки конфликта и дублирования;
- не путать баги рендера, контрактные ограничения и legacy-пути;
- принимать решения по стабилизации архитектуры в правильном порядке.

Это **не handoff** и **не backlog**.

Разница:
- **Architecture Map** = как устроена система и где её границы;
- **Session Handoff** = что произошло в конкретной сессии и с чего продолжать.

---

## When To Use

Использовать этот файл обязательно, когда задача:
- связана с графиком;
- затрагивает `timeframe × interval`;
- касается `currentTimeframe`, `currentInterval`, `chartData`, `preparedData`, `setData`, `visibleRange`, `visibleLogicalRange`;
- касается ownership state;
- касается init/render/navigation;
- касается индикаторов;
- касается legacy-path или migration;
- выглядит как risky change;
- вызывает вопрос: **"кто владеет этим состоянием?"**

### Recommended session start order for chart work

1. `FG_CHART_ARCHITECTURE_MAP.md`
2. текущий `session-handoff`
3. текущая узкая задача
4. anchor / analysis
5. execute only after ownership is clear

---

## When Not To Use

Не нужен для:
- локального CSS-фикса вне chart engine;
- мелкого текста/tooltip;
- задач, не затрагивающих ownership или data flow;
- изолированных кнопок вне chart system.

---

## When To Update

Обновлять этот файл только если изменилось одно из трёх:

1. **Ownership**
   - выбран новый owner состояния;
   - убрано duplicate ownership;
   - изменился lifecycle owner.

2. **Module boundary**
   - contract вынесен в один модуль;
   - selection owner изменён;
   - data source layer стал единым;
   - navigation/indicator boundaries изменились.

3. **Architecture policy**
   - изменена policy invalid TF×interval pairs;
   - изменена role legacy layer;
   - изменён stabilization order.

Не обновлять этот файл после каждой мелкой правки.

---

## Executive Summary

FG Chart Engine уже имеет узнаваемую многослойную структуру, а accepted `Task 1-4` плюс accepted `Task 5` уже зафиксировали, какие зоны закрыты, какие bounded, и какие остаются frontier.

Наиболее чистая часть системы сейчас — **single-pane render core**:
- `useLightweightChart` создаёт chart/series;
- `ChartCanvas` готовит chart-facing data и публикует `payloadVersion` в handoff boundary single-pane branch;
- `useChartData` владеет init-time dataset application, init viewport и deferred-init completion через `selectionVersion + pendingInitToken`;
- `useFGTimeNavigation` владеет runtime pan/zoom в expanded owner-nav mode и не менялся этим handoff fix;
- `useChartDebugPanel` только наблюдает и не владеет business behavior.

Основные remaining architecture/frontier risks находятся **выше и рядом с render core**:
- active path уже закреплён вокруг accepted bounded owner model: `App` остаётся canonical owner для `currentTimeframe`, `currentInterval`, `isExpanded`, `sourceAuthority` и accepted owner-state fields, `ChartContext` mirror-ит / хранит runtime state, а `ChartContainer` остаётся handoff/mirror boundary only;
- dual upstream data systems (socket path + REST/useCandles path) реально coexist в accepted bounded model;
- accepted active-path `currentCandleType` model теперь явный: `ChartContext` является runtime owner, `Chart.js` остаётся persistence-only holder above `ChartContainer`, а `ChartContainer` работает как seed/remount-only bridge;
- `compact` и `expanded` теперь фиксируются как разные product roles: `compact` - accepted frozen direct `App`-owned fast visual scan path, `expanded` - deeper analytical mode;
- два indicator rendering path;
- shared visual consumer / presentation layer для accepted owner-state below `App` всё ещё не доказан и остаётся frontier.

Итог:
- `Task 1` полностью закрыт: live legacy selector runtime path в `ExpandedControls` больше не является accepted truth, а canonical expanded toolbar остаётся единственным live expanded selector path;
- `Task 2` закрыт как bounded `sourceAuthority` decision pass, а не как full upstream unification;
- `Task 3` и `Task 4` закрыты как accepted state-model + owner-model, а их bounded implementation tranche закрепил owner-state в `App`, bounded upward REST handoff и warm snapshot bootstrap fix;
- accepted chart failure contract теперь различает `empty`, `stale` и request-error states; confirmed selection должен соответствовать графику, который реально находится на экране;
- shared visual consumer / presentation layer для accepted owner-state remains separate frontier;
- `Phase 7` зафиксировала current `MultiPaneChart` truth для текущей ветки и current indicator display; retained `MultiPaneChart` frontier теперь сужен до narrow parity tail, а не до branch-wide unknown.
- future indicator architecture / expansion were already boundedly framed and classified in the closed indicator architecture model; they are not part of the retained `MultiPaneChart` frontier, and the current immediate continuation now sits in `Phase 9`.
- broader authority-chain unification остаётся отдельным frontier.

## Core Principles

1. **LWC is a renderer, not the source of truth.**
2. **Сначала ownership, потом patch.**
3. **Один критический домен = один source of truth.**
4. **UI не должен врать о контракте.**
5. **Guard logic — safety net, а не основной UX.**
6. **Init ownership и runtime ownership должны быть разделены.**
7. **Legacy path может существовать только как compatibility layer, но не как parallel truth-source.**
8. **Симптом рендера не означает, что проблема находится в render layer.**
9. **Stabilization order важнее скорости отдельного фикса.**

---

# Architecture Layers

## 1. Contract Layer

### Purpose
Определяет, какие пары `TF×interval` допустимы, какие недопустимы, и как работает fallback/guard policy.

### Current owner files
- `fingineerwebapp/src/constants/index.js`
- `fingineerwebapp/src/utils/chart/timeframes.js` ← legacy
- `fingineerwebapp/src/lib/timeframes.js` ← compatibility wrapper / legacy path

### Owned concepts
- `TF_INTERVAL_MATRIX`
- `getAllowedIntervalsForTimeframe(...)`
- `fixIntervalForTimeframe(...)`
- legacy `guardIntervalForTimeframe(...)`
- ordered intervals
- countBack heuristics (legacy side)

### Allowed writes
- contract decisions
- allowed interval set
- fallback interval selection

### Forbidden writes
- chart data
- viewport
- series state
- runtime navigation

### Current state
- active live contract уже есть в `src/constants/index.js`
- legacy contract file всё ещё существует отдельно в `src/utils/chart/timeframes.js`, но рассматривается как residual / non-live compatibility reference

### Main issue
**Historical duplicated contract source on disk, but not a live selector runtime ambiguity**

---

## 2. Selection / State Layer

### Purpose
Держит пользовательский выбор и chart-level UI state:
- что выбрано;
- что реально лежит в state;
- что уже не должно переписываться повторным guard/rewrite в mirror layer.

### Current owner files
- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js` ← bridge / sync layer, не true owner

### Main states
- `currentTimeframe`
- `currentInterval`
- `isExpanded`
- `currentCandleType`
- `activeIndicators`
- derived alias `effectiveTimeframe`

### Allowed writes
- user selection intent
- chart UI mode state
- reducer-level chart UI state

### Forbidden writes
- duplicate guard/rewrite in multiple layers
- silent mirrored ownership without clear authority

### Current state
- App owns top-level selection state для `currentTimeframe`, `currentInterval`, `isExpanded`
- `ChartContainer` работает как bridge / sync layer и сам не является true owner selection state
- `ChartContext` на active path mirror-ит `currentTimeframe` / `currentInterval` без second guard/rewrite logic
- `effectiveTimeframe` сейчас является derived alias, а не independent owner
- `currentCandleType` на active path теперь следует accepted split-by-role модели: `ChartContext` является runtime owner, `Chart.js` держит persistence value above `ChartContainer`, а `ChartContainer` остаётся seed/remount-only bridge
- accepted active-path write path для `currentCandleType` теперь проходит как `ChartToolbar -> ChartContent -> ChartContext`, while persistence update stays upward into `Chart.js`
- confirmed `timeframe` / `interval` labels всегда должны соответствовать графику на экране; новый выбор становится confirmed only after successful corresponding load

### Main issue
**Top-level owner-model уже принят для active path, но selection-related frontier не закрыт полностью: открыты более узкие хвосты вокруг `currentCandleType`, визуально-чувствительных chart-state surfaces и общего visual consumer / failure presentation frontier ниже `App`.**

---

## 3. Data Source Layer

### Purpose
Получить свечи и метаданные и отдать их в chart system.

### Current owner files
- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/store/useCandles.js`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js` ← handoff boundary for explicit `sourceAuthority`-driven data relay

### Owned concepts
- request key identity
- inflight maps
- cache identity
- socket transport path
- REST/useCandles path
- `loadMoreHistory`
- source payload selection before chart render

### Allowed writes
- upstream candle payloads
- meta
- load-more function
- source-level chartData

### Forbidden writes
- viewport writes
- navigation writes
- chart range ownership

### Current state
- есть два upstream пути:
  - socket path
  - REST/useCandles path
- эти два upstream path реально coexist в текущем коде, это не theoretical ambiguity
- `App` owns `sourceAuthority` для Expanded data handoff
- `ChartContainer` не владеет source state и остаётся handoff boundary only: по explicit `sourceAuthority` выбирает, какой upstream payload пойдёт дальше в chart input
- `ChartContext` хранит handed-off `chartData` / `chartMeta` как replace snapshots, а не как merge-survival layer

### Main issue
**Dual upstream data systems**

---

## 4. Transform Layer

### Purpose
Преобразует raw candles в chart-facing data.

### Current owner files
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`
- `fingineerwebapp/src/components/Results/Chart/utils/chartUtils.js`

### Owned concepts
- `preparedData`
- normalized candles
- chart-facing OHLC shape
- indicator source shape
- hover-friendly data shape

### Allowed writes
- pure transformation
- normalization
- shaping for render/indicators

### Forbidden writes
- requests
- viewport ownership
- navigation ownership

### Current state
- слой относительно чистый
- зависит от того, какой data source path фактически победил выше

### Main issue
**Transform stability depends on upstream stability**

---

## 5. Init / Render Layer

### Purpose
Инициализация графика, первый реальный dataset apply, init viewport ownership.

### Current owner files
- `fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `fingineerwebapp/src/components/Results/Chart/utils/chartUtils.js`

### Owned refs/state
- `chartInstanceRef`
- `seriesRef`
- `fullDataRef`
- `virtualRangeRef`
- `didInitViewRef`
- `lastTimeRef`
- `payloadVersion` handoff identity в `ChartCanvas` branch
- `selectionVersion`
- `pendingInitToken`
- virtualization refs
- init `visibleRange` write
- init `visibleLogicalRange` heal

### Allowed writes
- create chart / series
- `series.setData(...)`
- init viewport
- explicit deferred-init completion only after fresh payload for the same deferred selection
- init-time safety heal
- virtualization updates

### Forbidden writes
- user selection contract
- runtime navigation policy
- source request logic

### Current state
Это сейчас один из самых здоровых слоёв системы.
- `ChartCanvas` branch теперь имеет explicit fresh-payload handoff: `ChartCanvas` публикует `payloadVersion`, а `useChartData` завершает deferred init только для matching fresh payload.
- `stale-init handoff gap` закрыт для `ChartCanvas` branch only.

### Main issue
Слой зависит от грязных входов сверху:
- data-source drift
- duplicated selection state
- contract confusion
- `MultiPaneChart` не покрыт тем же explicit init/runtime handoff model

---

## 6. Navigation Layer

### Purpose
Runtime pan/zoom, logical range policy после init.

### Current owner files
- `fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js`
- `fingineerwebapp/src/charts/ChartSyncController.js`
- `fingineerwebapp/src/charts/Pane.jsx`

### Owned concepts
- runtime `visibleLogicalRange` policy
- `fitContent`
- normalize / heal
- pane sync in multi-pane path

### Allowed writes
- logical range during runtime interaction
- post-init normalization
- runtime pan/zoom behavior

### Forbidden writes
- dataset initialization
- request/data-source logic
- contract selection logic

### Current state
- single-pane runtime owner остаётся `useFGTimeNavigation`; stale-init fix его не менял
- single-pane path и multi-pane path имеют разные ownership paths

### Main issue
**Single-pane and multi-pane navigation are not unified under one ownership model**

---

## 7. Indicator Layer

### Purpose
Владеет состоянием индикаторов и стратегией их рендера.

### Current owner files
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js`
- `fingineerwebapp/src/components/Results/Chart/useIndicatorsEngine.js`
- `fingineerwebapp/src/charts/MultiPaneChart.jsx`
- `fingineerwebapp/src/components/Results/Chart/ActiveIndicators.js`

### Owned concepts
- `activeIndicators`
- indicator settings
- overlay vs pane render behavior

### Allowed writes
- indicator selection
- params visibility/state
- indicator render contracts

### Forbidden writes
- TF×interval contract
- primary selection ownership
- data-source contract
- navigation ownership

### Current state
- indicator state mostly in context
- `ChartContext.activeIndicators` is the minimal proven indicator-specific runtime core on the active path
- current `activeIndicators` payload already co-locates `activation / visibility / params / settings`; this is accepted runtime co-location, not full indicator-state normalization
- `Phase 9` is active
- `9.1` completed: `indicator menu -> ChartContext.activeIndicators -> render branch -> observable visual effect` was proven by code anchor and runtime evidence on `3100/3101`
- `9.2` accepted visual contract: `price + optional MA + optional EMA + max one lower pane`
- `9.3` completed: `MA/EMA` overlay stabilization closed after cache-key fix in `useChartIndicators.js`
- next safe entry: `9.4 — RSI / Volume single lower-pane stabilization`
- patch readiness for `9.4`: no
- renderer contract split between single-pane and multi-pane systems
- current operational visual contract for existing indicators:
  - `MA` = overlay-only on `ChartCanvas`
  - `EMA` = overlay-only on `ChartCanvas`
  - `RSI` = dedicated bottom pane only under the exact current `MultiPaneChart` gate; otherwise current supported fallback stays on `ChartCanvas`
  - `volume` = dedicated bottom pane only under the exact current `MultiPaneChart` gate; otherwise current supported fallback stays on `ChartCanvas`
  - exact current `MultiPaneChart` gate = `expanded` + exactly one visible indicator + that visible indicator is `rsi` or `volume`
  - mixed visible sets still stay on `ChartCanvas` in current code reality; this is not the same thing as the accepted `9.2` product target
  - accepted `9.2` product target already allows `overlay + max one lower pane`; implementation/runtime stabilization for these mixed combinations remains staged through `9.4/9.5`
- current expanded indicator domain splits into:
  - default `single-pane` path as the richer primary indicator-render branch
  - narrow gated `multi-pane` path as the reduced branch-specific indicator-render branch
- failure truth remains outside the indicator layer inside outer chart/state ownership
- `compact` is not currently a proven indicator mode and must not be forced into indicator parity
- current `RSI`-only lower-pane reflow is a mechanically expected current effect of the current pane-model, not an automatic defect by itself
- current `MultiPaneChart` branch is not parity-complete against the single-pane path; retained frontier is the narrow parity tail inside the current branch
- broader future indicator architecture / expansion no longer belong to this current branch truth; their bounded architecture framing is already closed, while the retained current branch frontier stays only in the exact current `multi-pane` parity cell

### Main issue
**Two indicator renderer contracts with one bounded exact parity frontier**

---

## 8. Observability Layer

### Purpose
Диагностика и доказательства, но не управление поведением.

### Current owner files
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartDebugPanel.js`
- `fingineerwebapp/src/components/Results/Chart/ChartDebugPanel.jsx`
- debug wrappers in `useLightweightChart.js`

### Owned concepts
- debug snapshot
- `barsVisible`
- `sliceSize`
- `visibleRange`
- `logicalRange`
- `lastWriter`
- `lastEvent`

### Allowed writes
- debug-only wrappers
- snapshot state
- dev logging

### Forbidden writes
- business behavior
- runtime range policy
- contract decisions

### Current state
Это clean diagnostic layer, и таким должен оставаться.

---

## 9. Legacy / Parallel Layer

### Purpose
Старые compatibility paths, которые ещё не вычищены.

### Current owner files
- `fingineerwebapp/src/components/ExpandedControls/ExpandedControls.js`
- `fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js`
- `fingineerwebapp/src/components/TimeframeSelector/TimeframeSelector.js`
- `fingineerwebapp/src/utils/chart/timeframes.js`

### Owned concepts
- legacy selector UI
- legacy matrix decisions
- legacy countBack helpers
- old compatibility assumptions

### Allowed writes
- compatibility callbacks only
- transitional adapters only

### Forbidden writes
- being a second canonical contract
- silently governing active chart behavior long-term

### Current state
Legacy path всё ещё влияет на восприятие и может влиять на поведение.

### Main issue
**Legacy layer still duplicates truth-sources**

---

# Ownership Map

## currentTimeframe
### Source owner now
- `App.js` top-level state

### Mirror / secondary owner
- `ChartContext.js` through `ChartContainer.js` bridge/sync layer

### Readers
- `useCandles`
- `ChartCanvas`
- `useChartData`
- indicators
- toolbar

### Writers
- App selection handlers
- `ChartContext` mirror-only setters on the active path

### Ownership quality
**App-authoritative on the active path; broader selection closure is still not complete**

---

## currentInterval
### Source owner now
- `App.js`

### Mirror / secondary owner
- `ChartContext.js` through `ChartContainer.js` bridge/sync layer

### Readers
- chart pipeline
- data pipeline
- toolbar
- useCandles
- ChartCanvas

### Writers
- App selection handlers
- `ChartContext` mirror-only setters on the active path

### Ownership quality
**App-authoritative on the active path; broader selection closure is still not complete**

---

## effectiveTimeframe
### Source owner now
- `ChartContext.js` derived memo only

### Readers
- `ChartCanvas`
- debug panel
- data hooks

### Writers
- derived only

### Ownership quality
**Derived alias only, not an independent owner and not its own stabilization domain**

---

## isExpanded
### Source owner now
- `App.js`

### Mirror / secondary owner
- `ChartContext.js` through `ChartContainer.js` bridge/sync layer

### Readers
- toolbar
- chart container
- hooks

### Writers
- App
- mirrored into context

### Ownership quality
**Duplicated, but not the dirtiest issue**

---

## navOwnerEnabled
### Source owner now
- distributed env/config reads

### Readers
- `ChartCanvas`
- `useLightweightChart`
- `useChartData`

### Writers
- env/config only

### Ownership quality
**Distributed config, not centralized**

---

## currentCandleType
### Source owner now
- `ChartContext.js` is the runtime owner on the active path
- `Chart.js` keeps the persistence value above `ChartContainer`
- `ChartContainer.js` acts as seed/remount-only bridge into `ChartContext`

### Readers
- transform layer
- toolbar
- render path

### Writers
- `ChartToolbar` emits candle-type intent only
- `ChartContent.js` writes `ChartContext` directly on the active path
- `ChartContent.js` also notifies upward persistence into `Chart.js`

### Ownership quality
**Accepted active-path slice closed: runtime ownership lives in `ChartContext`, persistence survives in `Chart.js`, and mounted-time live mirroring in `ChartContainer` is no longer accepted truth**

---

## chartData
### Source owner now
- source authority:
  - `App.js`
- payload producers:
  - socket path in `App.js`
  - REST path in `useCandles.js`
- handed off into `ChartContext` through `ChartContainer.js` as a replace snapshot
- these upstream systems really coexist today, not just as a theoretical fallback model

### Readers
- `ChartCanvas`
- indicator-related consumers
- hover logic

### Writers
- App socket updates
- useCandles results
- ChartContainer → ChartContext handoff only

### Ownership quality
**Upstream dual-source path remains, but local Stage 3 slices are exhausted: `ChartContainer` is the accepted transform/handoff boundary, not another local cleanup frontier**

### Boundary rule
- allowed in `ChartContainer`: normalize/handoff runtime snapshots into `ChartContext`, seed runtime store, mirror accepted selection state
- do not expand locally into: producer selection semantics, request identity ownership, cache/inflight ownership, failure policy

### Accepted runtime contract
- confirmed selection = график, который реально находится на экране
- initial load failure без валидного snapshot использует error/empty state
- refresh failure при валидном snapshot сохраняет график и помечает его как last available data
- selection-change failure сохраняет previous committed graph и labels
- history-load failure остаётся локальным

---

## preparedData
### Source owner now
- `ChartCanvas.js` `useMemo`

### Readers
- `useChartData`
- `useChartIndicators`

### Writers
- transform layer only

### Ownership quality
**Clean; single-pane handoff now carries explicit payload identity through adjacent `payloadVersion`**

---

## payloadVersion
### Source owner now
- `ChartCanvas.js`

### Readers
- `useChartData`

### Writers
- `ChartCanvas.js` only when raw `chartData.candles` reference changes in `ChartCanvas` branch

### Ownership quality
**Clean in `ChartCanvas` branch; explicit payload identity at the init handoff boundary**

---

## fullDataRef
### Source owner now
- `useChartData.js`

### Readers
- init/render related paths
- virtualization
- possibly diagnostic paths

### Writers
- `useChartData.js`

### Ownership quality
**Clean**

---

## didInitViewRef
### Source owner now
- `useChartData.js`

### Readers
- init gating
- transition veil
- virtualization gates

### Writers
- init/reset logic in `useChartData`

### Ownership quality
**Mostly clean now; init completion in `ChartCanvas` branch is now explicit instead of rerun-derived**

---

## selectionVersion / pendingInitToken
### Source owner now
- `useChartData.js`

### Readers
- deferred-init gate
- init completion gate
- stale-init trace / diagnostics

### Writers
- `useChartData.js`

### Ownership quality
**Clean in `ChartCanvas` branch; explicit deferred-init authority lives in `useChartData`**

---

## virtualRangeRef
### Source owner now
- `useChartData.js`

### Readers
- debug panel
- virtualization-related consumers

### Writers
- `useChartData.js`

### Ownership quality
**Mostly clean**

---

## visibleRange
### Real owner
- LWC internal state

### FG writers
- init/render narrow writes in `useChartData`

### Readers
- debug panel
- render logic
- range diagnostics

### Ownership quality
**Conceptually contested because many layers depend on it**

---

## visibleLogicalRange
### Real owner
- LWC internal state

### FG writers
- `useChartData.js` init heal / compact clamp
- `useFGTimeNavigation.js` runtime pan/zoom/heal
- `ChartSyncController.js` in multi-pane mode

### Readers
- debug panel
- nav logic
- render diagnostics

### Ownership quality
**Contested / true multi-writer concept**

---

## barSpacing
### Real owner
- LWC timescale derived internal state

### FG influence
- seeded in chart setup
- then indirectly affected by range writers

### Ownership quality
**No stable FG owner exists**

---

## lastTimeRef
### Source owner now
- `useChartData.js`

### Readers/Writers
- `useChartData.js`

### Ownership quality
**Clean**

---

## activeIndicators / indicator state
### Source owner now
- `ChartContext`

### Renderer consumers
- `useChartIndicators`
- `MultiPaneChart`

### Ownership quality
**State relatively clean, rendering contract contested; minimal runtime core is proven, but full indicator-state normalization is not**

## Indicator architecture status after `Phase 8`

### already safe
- `ChartContext` is the owner of the minimal proven indicator-specific runtime core on the active path
- renderer paths are consumers, not owners
- current supported set truth is fixed for `MA`, `EMA`, `RSI`, `volume`
- `9.1` closure proved that current menu items are not dead UI and that observable indicator effects exist on runtime paths

### safe with guardrails
- current operational visual contract for the existing supported set
- accepted `9.2` visual contract as product target: `price + optional MA + optional EMA + max one lower pane`
- mixed runtime co-location of `activation / visibility / params / settings`
- indicator behavior inside outer chart/failure truth
- non-applicability of `compact` as a forced indicator-parity target

### real frontier
- split renderer contract between `single-pane` and `multi-pane`
- cross-branch mode divergence for the same indicator domain
- exact current `MultiPaneChart` parity cell for the same ownership / authority / init-runtime model
- staged stabilization of accepted `overlay + one lower pane` behavior through `9.4/9.5`, not via owner-model reopening

### minimum shared renderer contract for current gated scope
- required now:
  - shared `activation / identity / visibility` semantic truth for the current gated indicator
  - for `RSI`: semantic parity for `params.period`
  - for `RSI`: semantic parity for level-visibility behavior
- optional for later parity:
  - `currentInterval`
  - `currentTimeframe`
  - `currentCandleType`
  - broader payload/cache symmetry
- acceptable branch-specific for now:
  - branch-specific visual implementation details
  - fixed pane layout mechanics under the exact current gate
- excluded from this minimum parity cell:
  - mixed visible sets
  - `compact`
  - indicator-specific failure behavior
  - future indicator expansion
  - broader placement semantics
  - `MA / EMA` multi-pane parity

---

## Current practical target ownership model

- `App`
  - owner of: `currentTimeframe`, `currentInterval`, `isExpanded`, `sourceAuthority`
  - authoritative owner of: `confirmedSelection`, `requestedSelection`, `hasValidSnapshot`, `requestKind`, `requestStatus`, `dataStatus`, `failureScope`, `failureMessage`
  - compact chart path remains the accepted frozen direct `App`-owned path with guardrails
- `ChartContext`
  - runtime owner for: `currentCandleType`, `activeIndicators`, chart-local UI/meta state
  - mirror only for: `currentTimeframe`, `currentInterval`, `isExpanded`
  - storage-only for handed-off `chartData` / `chartMeta` snapshots with replace semantics
- `Chart.js`
  - persistence-only holder above `ChartContainer` + remount seed source for the accepted `currentCandleType` path
- `ChartContainer`
  - bridge / sync + handoff layer only
  - seed/remount-only bridge for `currentCandleType`
  - accepted transform/handoff boundary for runtime snapshots into `ChartContext`
  - must not grow locally into producer selection semantics, request identity/cache ownership, or failure policy
  - consumes explicit `sourceAuthority`, but is not a true owner of source state or selection state
- `ChartCanvas`
  - wiring/ref layer for single-pane path
  - publishes `payloadVersion` into the init handoff boundary
- `ChartToolbar`
  - input surface only
- `useChartData`
  - init/render owner only
  - for `ChartCanvas` branch also owns `selectionVersion + pendingInitToken` and explicit deferred-init completion
- `useFGTimeNavigation`
  - runtime navigation owner only
  - unchanged by the `ChartCanvas` stale-init fix
- `ChartRenderer`
  - branch-entry router only
  - routes to `MultiPaneChart` only for exact currently supported single-bottom visible sets (`volume` only or `rsi` only)
  - keeps mixed visible sets on `ChartCanvas` until broader multi-pane parity exists
- `effectiveTimeframe`
  - derived alias only
  - should not be treated as a separate stabilization domain
- closed here:
  - `ChartCanvas` stale-init handoff gap
  - narrow `ChartRenderer` `MultiPaneChart` branch-entry gate mismatch
  - `MultiPaneChart` warnings tail
  - `Stage 2 / Slice 1` (`ChartContext` timeframe/interval demotion)
  - accepted active-path `currentCandleType` runtime-owner / persistence-holder slice
- still open:
  - exact current `MultiPaneChart` parity cell for the same ownership / authority / init-runtime model; this bounded frontier does not equal the whole closed `Phase 8`
  - broader upstream architecture / authority-chain unification above the accepted `ChartContainer` transform/handoff boundary; current `App.js` bridge is still a bridge, not the final end-state
  - `Shared Visual Consumer / Failure Presentation Pass`: accepted owner-state exists in `App`, but no proven shared live visual consumer layer below `App` is currently established for `confirmedSelection`, `requestedSelection`, `hasValidSnapshot`, `requestKind`, `requestStatus`, `dataStatus`, `failureScope`, `failureMessage`
- not in this retained frontier:
  - the closed `Phase 8` owner-boundary / mode-map / classification model
  - future indicator expansion
  - broader indicator placement semantics
- if this area is revisited later:
  - do not reopen `ChartCanvas` stale-init without new evidence
  - do not reopen `MultiPaneChart` warnings tail, `Stage 2 / Slice 1`, `Stage 2 / Slice 2`, the accepted `currentCandleType` runtime-owner slice, or closed Stage 3 local slices without new evidence
  - start from observability / debug surface questions or broader upstream architecture questions, not from local `currentCandleType` / `ChartContainer` cleanup again

### Task 5 sync

- `Task 5` is accepted as a change-zone decision matrix pass, not as blanket approval that all chart areas are now safe.
- `compact` and `expanded` have different product roles: `compact` is a fast visual scan surface, while `expanded` is the deeper analytical chart mode.
- `Phase 6` is accepted with `Variant A`: `compact` is frozen as the accepted direct `App`-owned path, and current evidence does not justify a separate bounded compact-specific pass.
- `currentCandleType` / chart-type related surfaces remain sensitive and must not be treated as a normal safe zone.
- architecture-safe does not imply visual auto-approval; visual state changes still require separate product judgment even inside otherwise stable plumbing.
- shared owner-state remains accepted in `App`, but shared visual presentation for confirmed/requested/stale/failed is still frontier until a live downstream consumer layer is explicitly proven below `App`.

---

# Data Flow Map

## Canonical current path (high-level)

```text
UI interaction
→ selection state change
→ contract guard / rewrite
→ request identity build
→ data fetch/source selection
→ raw candle payload
→ `ChartCanvas` transform / `preparedData`
→ `ChartCanvas` payloadVersion handoff
→ `useChartData` init owner (`selectionVersion + pendingInitToken`)
→ series.setData
→ init viewport ownership
→ runtime navigation ownership
→ final rendered chart




