# FG_CHART_STABILIZATION_PLAYBOOK.md

## Purpose

Этот документ — рабочий playbook для стабилизации FG Chart Engine.

Если `FG_CHART_ARCHITECTURE_MAP.md` отвечает на вопрос:

**"Как устроена система?"**

то этот файл отвечает на вопрос:

**"Как с этой системой работать, чтобы не утонуть в симптомах, побочных эффектах и скрытых связях?"**

Этот документ нужен, чтобы:

- раскладывать проблему по слоям;
- видеть реальные конфликтные зоны;
- понимать правильный порядок стабилизации;
- не путать root cause и downstream symptom;
- планировать chart-сессии без хаоса;
- давать Codex правильные задачи.

Это **не handoff** и **не backlog**.

---

## When To Use

Использовать этот файл обязательно, когда:

- появляется новый баг в chart system;
- непонятно, это проблема contract / state / data / render / nav;
- задача затрагивает несколько слоёв одновременно;
- после фикса вылезают новые побочные эффекты;
- нужно выбрать, **что стабилизировать следующим**;
- нужно подготовить сильный anchor/analysis prompt для Codex;
- задача выглядит как risky;
- есть соблазн “сразу патчить” без ownership map.

### Recommended working order

1. `FG_CHART_ARCHITECTURE_MAP.md`
2. `FG_CHART_STABILIZATION_PLAYBOOK.md`
3. текущий `session-handoff`
4. текущая узкая задача
5. anchor / investigation
6. execute only after ownership is clear

---

## When Not To Use

Не нужен для:

- изолированного CSS-фикса;
- мелкого tooltip/text update;
- локальной не-risky UI-полировки вне chart engine;
- задач, где ownership и data flow очевидны и не затрагиваются.

---

## Core Rule

Если после новой задачи появилась новая проблема, это не обязательно значит, что фикс был “плохой”.

Чаще это означает:

- вскрылась скрытая связность старого монолита;
- ownership boundaries ещё не зафиксированы;
- один слой переписывает intent другого;
- root cause находится выше, чем симптом.

### Главный принцип

```text
симптом
→ слой
→ owner
→ конфликт
→ только потом патч
```

Никогда наоборот.

## Detailed Flow

### 1. UI Interaction

#### Main Expanded toolbar

Пользователь взаимодействует с:

- timeframe dropdown
- interval dropdown
- candle type entry
- indicator entry

#### Legacy path

Residual legacy files всё ещё лежат на диске:

- ExpandedControls
- IntervalSelector
- TimeframeSelector

#### Почему это важно

`Task 1` уже полностью закрыт:

- 1A classification / decision pass принят;
- 1B live legacy selector runtime risk closure принят;
- active Expanded toolbar остаётся canonical live selector path;
- legacy selector files больше не должны трактоваться как mounted expanded runtime path.

### 2. Selection / Guard

#### Current behavior

- App обрабатывает top-level selection intent
- fixIntervalForTimeframe() остаётся canonical guard в App-owned path
- ChartContainer работает как bridge / sync layer и передаёт selection state внутрь chart system
- ChartContext на active path зеркалит `currentTimeframe` / `currentInterval` без second guard/rewrite logic
- effectiveTimeframe сейчас является derived alias, а не независимым owner

#### Почему это важно

Selection intent теперь не должен повторно переписываться внутри active mirror layer.

Это снимает один слой двусмысленности и закрепляет bounded active-path model для `currentCandleType`; оставшийся selection frontier живёт уже в broader contract / UI split, а не в local persistence cleanup inside `ChartContainer`.

### 3. Request Identity

#### Current behavior

Есть как минимум два request identity path:

##### Socket path

Использует:

- chart key
- range key

##### REST path

Строит:

- свой signature
- свой request URL

##### Shared inputs

Оба пути зависят от:

- timeframe
- interval
- ticker
- selectedDate

#### Почему это важно

Если request identity не единая, то:

- один и тот же UI state может резолвиться в разные cache keys;
- два data source path могут давать разные datasets;
- дебаг становится нечистым.

### 4. Data Source

#### Current behavior

Есть два upstream candle path:

##### Socket path

- живёт в App.js

##### REST/cache path

- живёт в useCandles.js

##### Data arbitration

- App owns `sourceAuthority` for Expanded handoff
- ChartContainer.js выбирает, какой payload попадёт в chart input по explicit `sourceAuthority`
- Это не теоретическая схема: App path и useCandles path реально coexist в текущем коде
- ChartContainer здесь — handoff boundary only, а не source owner
- ChartContext хранит handed-off `chartData` / `chartMeta` как replace snapshots, а не как merge-survival storage

#### Почему это важно

Если data source ownership не единый:

- state может меняться,
- а dataset в chart — нет;
- или наоборот.

### 5. Transform

#### Current behavior

- ChartCanvas.js превращает chartData.candles в preparedData.

Параллельно normalized variants могут питать:

- hover calculations
- indicator calculations
- other chart-facing consumers

#### Почему это важно

Transform слой должен быть deterministic.

Если он зависит от того, какой upstream path победил, значит проблема не в transform, а выше.

### 6. Init / Render

#### Current behavior

useChartData.js вычисляет:

- fullDataRef
- slice
- fromIdx / toIdx
- series.setData(sessionSlice)
- init viewport
- stale-pass gating
- virtualization

#### Почему это важно

Это первый настоящий owner chart render lifecycle.

Если проблема уже здесь — нужно понять:

- dataset плохой?
- stale pass?
- init ownership захвачен не тем pass?
- viewport неправильный?
- range collapsed?

### 7. Runtime Navigation

#### Current behavior

useFGTimeNavigation.js владеет:

- expanded runtime pan/zoom
- mode-change normalize/heal
- runtime logical range writes

Multi-pane path дополнительно использует:

- ChartSyncController

#### Почему это важно

Если navigation layer начинает лечить то, что сломано выше, архитектура разваливается.

Navigation должен владеть только runtime range behavior, не init/data contract.

### 8. Final Render

#### Current behavior

Финальная картинка рендерится:

- либо single-pane path,
- либо multi-pane path.

#### Почему это важно

Один и тот же symptom в финальном render может иметь причину:

- в contract,
- в state,
- в data source,
- в transform,
- в init,
- в navigation,
- в indicator renderer split.

## Conflict Map

### 1. Active vs Legacy TF×interval Contract

#### Current situation

- active contract: src/constants/index.js
- legacy contract: src/utils/chart/timeframes.js

#### Why dangerous

Две разные матрицы могут:

- по-разному разрешать одну и ту же пару;
- по-разному форсить fallback;
- по-разному задавать expectations для selection layer и data layer.

#### Practical consequence

Один слой считает пару valid, другой — invalid.

### 2. App Selection vs ChartContext Selection

#### Current situation

- App владеет реальным top-level selection для `currentTimeframe`, `currentInterval`, `isExpanded`
- ChartContainer bridge-ит его внутрь chart system
- ChartContext на active path теперь зеркалит `timeframe / interval` как mirror-only layer
- repeated guard/rewrite в `ChartContext` для `timeframe / interval` на active path больше не является accepted current truth

#### Why dangerous

Top-level selection duplication на active path уже закрыта как local ownership issue, а accepted active-path ownership для `currentCandleType` уже закреплена; remaining risk теперь находится выше accepted owner model, в broader upstream / visual frontier, а не в local persistence mirroring и не в live legacy mount path.

#### Practical consequence

Для `currentTimeframe` / `currentInterval` root cause теперь нужно искать сначала в App-owned path, а не в second rewrite внутри `ChartContext`.

### 3. Socket Path vs REST/useCandles Path

#### Current situation

Есть два upstream candle systems:

- socket path
- REST/useCandles path

У них:

- разные cache keys
- разные transport assumptions
- разная активация по feature conditions

#### Why dangerous

State может смениться, а dataset path — silently переключиться.

#### Practical consequence

Очень трудно понять:

- баг в data source?
- баг в cache identity?
- баг в chart init?
- баг в UI?

### 4. currentCandleType Active-Path Ownership

#### Current situation

currentCandleType на active path теперь следует accepted bounded model:

- `ChartToolbar` emits intent only
- `ChartContent` writes `ChartContext` directly and also notifies upward persistence
- `ChartContext` holds the runtime owner used by render consumers
- `Chart.js` keeps the surviving persistence value above `ChartContainer`
- `ChartContainer` acts as seed/remount-only bridge into `ChartContext`

#### Why this is acceptable now

Mounted-time live mirroring in `ChartContainer` is gone.
Local dual-write is gone.
Этот bounded frontier закрыт и не должен переоткрываться как ещё один local `currentCandleType` cleanup pass.

### 5. Residual UI Contract Drift

#### Current situation

- main Expanded toolbar остаётся live active contract path
- legacy ExpandedControls / IntervalSelector остаются residual files only и не должны трактоваться как mounted runtime path

#### Why dangerous

Старые docs и grep-based analysis могут спутать residual files с live UX contract.

#### Practical consequence

Current runtime behavior нужно аудировать от active toolbar path; legacy selector files релевантны только как residual/reference layer, если не появилось новое evidence об их повторном runtime mount.

### 6. Indicator Render Split

#### Current situation

- useChartIndicators обслуживает single-pane path
- MultiPaneChart обслуживает multi-pane path

#### Why dangerous

Один и тот же indicator domain имеет два renderer contract.

#### Practical consequence

Сложно масштабировать:

- новые индикаторы,
- pane policies,
- consistent behavior.

### 7. Range Ownership Split

#### Current situation

- init owner: useChartData
- runtime owner: useFGTimeNavigation
- multi-pane sync owner: ChartSyncController

#### Why dangerous

Range state — conceptually multi-owner domain.

#### Practical consequence

Без строгого lifecycle split почти неизбежны:

- overwrite bugs
- stale range state
- path-dependent failures

### 8. Orphaned Context Surface

#### Current situation

В ChartContext есть поля, у которых ownership weak or unclear:

- canvasMetrics
- activeTicker
- instrumentMeta
- lastCandleData

`chartMeta` больше не должен рассматриваться как orphaned merge-survival surface в рамках этого frontier: для handed-off chart path он уже закреплён как replace snapshot storage.

#### Why dangerous

Эти поля раздувают perceived architecture complexity.

#### Practical consequence

Будущие правки могут случайно принять их за real source of truth.

## Stable Module Boundaries (Target State)

### 1. Contract Module

#### Owns

- canonical TF_INTERVAL_MATRIX
- read helpers
- rewrite/guard helpers
- later: capability policy
- later: countBack policy

#### Must not own

- UI rendering
- chart data
- viewport
- render lifecycle

### 2. Selection Module

#### Owns

- currentTimeframe
- currentInterval
- isExpanded
- currentCandleType

#### Must not own

- fetch/data transport
- init viewport
- navigation policy

#### Rule

One authoritative owner only.

#### Practical current target

`App` should own:

- currentTimeframe
- currentInterval
- isExpanded
- sourceAuthority
- confirmedSelection
- requestedSelection
- hasValidSnapshot
- requestKind
- requestStatus
- dataStatus
- failureScope
- failureMessage

`ChartContext` should own:

- currentCandleType
- activeIndicators
- chart-local UI/meta state

`ChartContext` should mirror only:

- currentTimeframe
- currentInterval
- isExpanded

`effectiveTimeframe` should remain:

- derived alias only
- not a separate stabilization domain

#### Supporting role boundaries

ChartContainer:

- bridge / sync layer only
- data handoff arbitration only
- bounded upward REST handoff only

ChartToolbar:

- input surface only

useChartData:

- init/render owner only

useFGTimeNavigation:

- runtime navigation owner only

### 3. Data Source Module

#### Owns

- candle request interface
- transport adapters
- cache identity
- loadMoreHistory

#### Must not own

- render state
- chart viewport
- navigation policy

### 4. Transform Module

#### Owns

- raw → normalized
- normalized → preparedData
- indicator input shape
- session-aware shaping

#### Must not own

- selection state
- runtime range policy

### 5. Init / Render Module

#### Owns

- chart/series lifecycle
- series.setData
- fullDataRef
- didInitViewRef
- init viewport
- virtualization

#### Must not own

- selection contract
- runtime pan/zoom
- transport rules

### 6. Navigation Module

#### Owns

- runtime pan/zoom
- logical range policy
- fit/normalize/heal

#### Must not own

- dataset init
- request logic
- TF×interval contract

### 7. Indicator Module

#### Owns

- indicator state
- overlay/pane strategy contract
- indicator render routing

#### Must not own

- TF×interval contract
- source data transport
- range ownership

### 8. Observability Module

#### Owns

- debug snapshots
- writer tracing
- diagnostics

#### Must not own

- business behavior
- chart policy
- selection logic

### 9. Legacy Adapter Module

#### Owns

- transitional compatibility only

#### Must not own

- canonical truth
- active business rules long-term

## Top Architecture Risks

### 1. Duplicated contract source

- active matrix + legacy matrix

### 2. Accepted owner-state model is closed on the active path

- `App` now remains the authoritative owner for `confirmedSelection`, `requestedSelection`, `hasValidSnapshot`, `requestKind`, `requestStatus`, `dataStatus`, `failureScope`, `failureMessage`
- compact stays on the accepted direct App-owned path
- REST expanded branch uses bounded upward handoff only
- `ChartContainer` is handoff/mirror only, and `ChartContext` is storage/runtime only

### 3. Dual upstream data systems

- socket path + REST/useCandles path, которые реально coexist today

### 4. accepted active-path `currentCandleType` ownership is closed for this frontier

- `ChartContext` is the runtime owner on the active path, `Chart.js` is the persistence-only holder above `ChartContainer`, and `ChartContainer` is seed/remount-only bridge for remount survival

### 5. Legacy selector runtime path is closed

- live mounts in the `ExpandedControls` selector path are no longer accepted runtime truth
- active Expanded toolbar remains the canonical live selector path

### 6. Indicator renderer split

- single-pane and multi-pane indicator systems diverge

### 7. Range state remains conceptually multi-writer

- init owner + runtime owner + pane sync owner

### 8. ChartContext has partially orphaned state surface

- increases noise and perceived coupling

### 9. Active contract and UI can drift again

- if UI reads static config instead of contract helper

### 10. More history will amplify hidden coupling

- richer data will reveal deeper misalignments rather than solve them automatically

## Recommended Stabilization Order

### Stage 1 — Contract Stabilization

#### Goal

- one canonical TF×interval module
- legacy matrix becomes compatibility-only

#### Status now

Partially completed already:

- canonical active contract already identified in `src/constants/index.js`
- main Expanded toolbar already aligned to the canonical helper
- invalid intervals in the main Expanded toolbar are already disabled instead of silently pretending to be selectable
- stage is not complete yet because legacy contract paths still exist

#### Why first

Contract pollution creates false bugs and UX confusion everywhere above and below, and legacy paths still duplicate truth even after the main toolbar alignment.

### Stage 2 — Selection Ownership Stabilization

#### Goal

One authoritative owner for:

- currentTimeframe
- currentInterval
- isExpanded
- currentCandleType

#### Why second

Duplicated selection ownership rewrites intent twice, while `effectiveTimeframe` should remain only a derived alias and not become a separate stabilization target.

### Stage 3 — Data Source Ownership Stabilization

#### Goal

- one candle input interface into chart system
- one explicit request identity scheme

#### Status now

- explicit `sourceAuthority` contract path is already in place
- `ChartContainer` handoff boundary for this frontier is already clarified
- `ChartContext` handed-off `chartData` / `chartMeta` storage now uses replace semantics
- this specific frontier is closed for now; if revisited later, start from observability / debug surface, not core ownership again

#### Why third

Chart cannot be stable while two upstream data systems compete implicitly, and this coexistence is real in the current codebase rather than theoretical.

### Stage 4 — Transform Boundary Stabilization

#### Goal

Make:

- raw candles
- preparedData
- fullDataRef

singular and explicit.

#### Why fourth

Transform layer must stop inheriting ambiguity from source layer.

### Stage 5 — Init / Render Ownership Hardening

#### Goal

- keep useChartData as init owner
- keep explicit fresh-payload handoff stable in `ChartCanvas` branch

#### Status now

- `ChartCanvas stale-init handoff gap` is closed through explicit versioned handoff: `payloadVersion` from `ChartCanvas`, `selectionVersion + pendingInitToken` in `useChartData`
- this closure is limited to `ChartCanvas` branch only
- `MultiPaneChart` is not covered by the same closure

#### Why fifth

Render core is already relatively healthy, but only after upper layers become stable.

### Stage 6 — Navigation Ownership Clarification

#### Goal

Clearly separate:

- single-pane navigation ownership
- multi-pane sync ownership

#### Why sixth

Range writes are dangerous and should be stabilized after init layer is trustworthy.

### Stage 7 — Indicator Architecture Unification

#### Goal

One indicator contract for:

- overlay rendering
- pane rendering

#### Why seventh

Indicators should not be expanded while core ownership is still unstable.

### Stage 8 — Legacy Cleanup

#### Goal

- Isolate or remove compatibility layers that still duplicate truth.

#### Why last

Premature deletion without stabilized ownership above can break hidden consumers.

## 3-Session Stabilization Roadmap

### Session 1 — Contract Stabilization

#### Goal

Сделать один понятный контракт TF×interval и убрать путаницу между UI и runtime.

#### Current status

Partially completed:

- active canonical contract already identified
- main Expanded toolbar already reflects canonical allowed/invalid intervals
- invalid intervals in the main Expanded toolbar are disabled, not silently rewritten at the UX layer

Still incomplete:

- legacy contract paths still exist
- compatibility layer still needs to stop behaving like a parallel truth-source

#### Focus

- canonical contract
- active UI alignment
- legacy matrix marked as compatibility-only
- invalid pair UX clarified

#### Do not

- patch chart render
- patch navigation
- patch data pipeline
- delete legacy aggressively

#### Success condition

- один официальный контракт;
- основной Expanded UI честно отражает allowed/invalid intervals;
- invalid pairs больше не путаются с render bugs.

### Session 2 — Selection Ownership Stabilization

#### Goal

Определить одного владельца выбора.

#### Focus

Authoritative owner for:

- timeframe
- interval
- isExpanded
- candleType

Context fields categorized into:

- owner
- mirror
- derived

- Repeated guards reduced.

#### Do not

- merge data source paths yet
- redesign indicators yet

#### Success condition

- selection intent enters system only once;
- other layers read rather than re-own.

### Session 3 — Data Source Ownership Stabilization

#### Goal

Определить один официальный вход свечей в chart system.

#### Focus

- socket vs REST adapter strategy
- one cache/request identity model
- one path into chartData → preparedData → setData

#### Do not

- unify indicators yet
- expand mock data yet
- add new chart features

#### Success condition

- chart gets one explicit candle input path;
- reduced chance of “UI state changed, dataset did not”.

## Current Session Strategic Decisions

- src/constants/index.js is the active live TF×interval contract.
- Main Expanded toolbar should align with the active contract.
- Runtime guards remain as safety net for the App-owned path.
- Silent rewrite alone is not acceptable as UX policy.
- The explicit `sourceAuthority` / `ChartContainer` handoff frontier is closed for now.
- `ChartContext` stores handed-off `chartData` / `chartMeta` as replace snapshots.
- QA test-port slice is closed and remains the accepted browser QA baseline.
- Compact REST handoff gap is closed.
- `ChartCanvas` stale-init handoff gap is closed.
- narrow `ChartRenderer` branch-entry gate hardening for current `MultiPaneChart` capability is closed and runtime-verified on `3100` and `3101`.
- `MultiPaneChart` warnings tail is closed on `3101` and `3100`; this closure is narrow and does not imply full `MultiPaneChart` parity.
- `Stage 2 / Slice 1` is accepted: `ChartContext` `setTimeframe` / `setInterval` are mirror-only on the active path, and no second correction/drift was observed in runtime QA on `3101` and `3100`.
- `Stage 2 / Slice 2` plus the bounded runtime-owner transfer slice are accepted: `ChartContext` is the runtime owner for `currentCandleType`, `Chart.js` is the persistence-only holder above `ChartContainer`, `ChartContainer` is seed/remount-only bridge, and mounted-time live mirroring is no longer accepted truth.
- Stage 3 local slices are exhausted: `rangeKey` parity is closed, `chartMeta` asymmetry is inert on the inspected expanded consumer path, REST-expanded error semantics remain `null-error + snapshot-preserving behavior`, and `ChartContainer` is the accepted transform/handoff boundary.
- accepted chart-failure contract is now fixed around confirmed selection and the four failure scopes.
- combined bounded `Task 3 + Task 4` implementation tranche is accepted: owner-state now lives in `App`, `requestedSelection` writes on selection intent, `confirmedSelection` commits only through authoritative boundary, REST branch uses bounded upward handoff, and compact stays on the direct App-owned path.
- The architecture problem is still broader than individual bugs: the remaining risk is upstream authority separation above these closed slices.

## Phase 7 / Slice 7.1 — Current Visual Contract

- `Slice 7.1` is accepted as closed for current operational truth only.
- Current operational truth for existing indicators:
  - `MA` = overlay-only on `ChartCanvas`
  - `EMA` = overlay-only on `ChartCanvas`
  - `RSI` = dedicated bottom pane only under the exact current `MultiPaneChart` gate; otherwise current supported fallback stays on `ChartCanvas`
  - `volume` = dedicated bottom pane only under the exact current `MultiPaneChart` gate; otherwise current supported fallback stays on `ChartCanvas`
  - exact current `MultiPaneChart` gate = `expanded` + exactly one visible indicator + that visible indicator is `rsi` or `volume`
  - mixed visible sets stay on `ChartCanvas`; there is no forced lower-pane parity in current operational truth
- This `7.1` closure does not imply:
  - that the current `RSI`-only pane reflow is already the final approved UX
  - that mixed sets such as `MA + RSI` or `EMA + RSI` are parity-complete
  - full `MultiPaneChart` parity

## Phase 7 / Slices 7.3-7.6 — Accepted Decision / Boundary Summary

- `7.3` conclusion for the current `RSI`-only lower-pane symptom: pane reflow in expanded mode is a mechanically expected current effect of the current two-pane layout and is not by itself an automatic defect.
- `7.4` conclusion: current `MultiPaneChart` branch is not parity-complete against the single-pane path; part of the difference is accepted current limitation, and part remains a narrow retained parity tail.
- `7.5` decision outcome: current `MultiPaneChart` branch is not accepted as a fully frozen limited branch; the retained open frontier is the narrow parity tail inside the current `MultiPaneChart` model.
- `7.6` boundary: `Phase 7` does not redesign the indicator layer; it resolves only current `MultiPaneChart` branch truth, current pane-model truth, and current indicator display truth for the currently supported set.
- Future indicator architecture, future indicator expansion, and broader indicator placement semantics were intentionally moved out of the retained `Phase 7` frontier and handled through the bounded closed `Phase 8` model.

## Phase 8 / Slices 8.1-8.5 — Accepted Decision / Boundary Summary

- `8.1` accepted truth: `ChartContext.activeIndicators` is the minimal proven indicator-specific runtime core on the active path; renderer paths are consumers, not owners; current co-location of `activation / visibility / params / settings` is accepted runtime truth, not full indicator-state normalization.
- `8.2` accepted truth: current expanded indicator behavior splits into the default richer `single-pane` path and the narrow gated reduced `multi-pane` path; mixed visible sets stay on `ChartCanvas`; failure truth remains outside the indicator layer; `compact` is not currently a proven indicator mode.
- `8.3` classification outcome:
  - `already safe` = owner-boundary, minimal runtime core, renderer-consumer split, current supported set truth
  - `safe with guardrails` = current operational visual contract, runtime co-location of `activation / visibility / params / settings`, compact non-applicability without forced parity, indicator behavior inside outer chart/failure truth
  - `real indicator-specific frontier` = split renderer contract, cross-branch mode divergence, exact current `MultiPaneChart` parity cell only where parity matters
- `8.4` boundary: `Phase 8` does not open the whole indicator layer; further architecture work is bounded to split renderer contract / cross-branch divergence concretely through the exact current `multi-pane` parity cell for the same ownership / authority / init-runtime model.
- `8.5` minimum parity rule for the current gated scope:
  - both branches must share the same semantic truth for `activation / identity / visibility` of the current gated indicator
  - `RSI` additionally requires semantic parity for `params.period` and level-visibility behavior
  - `currentInterval`, `currentTimeframe`, `currentCandleType`, and broader payload/cache symmetry remain later-parity gaps rather than minimum parity requirements
- Excluded from this bounded parity slice:
  - mixed visible sets
  - `compact`
  - indicator-specific failure behavior
  - future indicator expansion
  - broader placement semantics
  - `MA / EMA` multi-pane parity
  - catalog / registry / builders redesign
- `Phase 8` is accepted as a working decision / architecture pass built from bounded model assembly, not as a broad redesign of the whole indicator layer.
- The accepted `8.1-8.5` model is no longer a floating discussion layer; do not reopen these slices without genuinely new evidence.

## Current Browser QA Baseline

- `3000` = normal dev
- `3100` = REST QA
- `3101` = app/non-REST QA
- primary browser QA path = Codex + Playwright MCP
- local Playwright e2e remains secondary regression harness, not primary browser QA

## Accepted Chart Failure Contract

- confirmed selection = то, чему реально соответствует текущий график на экране
- новый `timeframe` / `interval` считается confirmed only after successful corresponding graph load
- initial load without a valid snapshot:
  - load error -> error-state + `Повторить`
  - successful load without data -> empty-state
- background refresh failure keeps the existing graph and shows an explicit last-available-data notice
- selection-change failure keeps the previous committed graph and the previous confirmed labels
- history-load failure stays local and must not tear down the whole graph

## Closed Slices / Do Not Reopen Without New Evidence

- QA port setup
- Compact REST handoff gap
- `ChartCanvas` stale-init handoff gap
- narrow `ChartRenderer` `MultiPaneChart` branch-entry gate mismatch
- `MultiPaneChart` warnings tail
- `Stage 2 / Slice 1` (`ChartContext` timeframe/interval demotion)
- accepted active-path `currentCandleType` runtime-owner / persistence-holder slice
- Stage 3 local data-source slices (`rangeKey` parity on REST-expanded handoff and the accepted `ChartContainer` transform/handoff boundary)
- forced-stale experiment as product logic
- tooling loops in place of Codex + Playwright MCP browser QA

## Remaining Open Tails

- exact current `MultiPaneChart` parity cell for the same ownership / authority / init-runtime model; this bounded frontier does not equal the whole closed `Phase 8`
- broader authority-chain unification across upstream selection/source boundaries
- `Shared Visual Consumer / Failure Presentation Pass` for accepted owner-state presentation below `App`
- the closed routing slice and the closed warnings tail do not imply full `MultiPaneChart` parity

## Mock Data Constraint

### Current state

Current mock data horizon is about 1 year.

### Implications

Wide modes like:

- 1y + 15m
- 1y + 1h
- 1y + 4h
- 1y + 1d

may look visually similar.

Lack of longer history can blur meaningful visual differences.

### Must not confuse this with

- invalid contract pairs;
- stale dataset bugs;
- UI/runtime mismatch;
- ownership bugs.

### Rule

Always distinguish:

- Intentionally blocked by contract
- Allowed but visually similar because of limited history
- Actual render/data/ownership bug

## Task 5 — Accepted Change-Zone Matrix

`Task 5` закрыт как architectural / decision matrix pass.

Это не означает, что все chart-area теперь safe для правок.
Это означает, что accepted matrix для `expanded`, `compact` и `shared` теперь зафиксирован в canonical docs и не должен переоткрываться без нового file evidence.

### Matrix

| Area | safe now | safe with guardrails | unsafe / frontier |
| --- | --- | --- | --- |
| `expanded` | ingress/pass-through relay `App -> Results -> Chart`; control relay `ChartContent -> ChartRenderer` | `ChartContainer` handoff/mirror + warm snapshot bootstrap; `ChartContext` storage/runtime; single-pane visual plumbing in `ChartCanvas` | `currentCandleType` / chart-type chain; `MultiPaneChart` parity/presentation branch; deeper runtime-core behavior in `ChartCanvas` |
| `compact` | `CompactToolbar` range/expand wiring; local compact display relay in `Chart.js` | direct compact `App` request bridge and range guard; `CompactSparkline` range identity / stale-line suppression / hover plumbing | `CompactSparkline` animation/perf engine; legacy `CompactTrendChart.js` residual path |
| `shared` | pass-through layers `Results -> Chart`; branch seam in `Chart.js` | `App` owner-state schema and transition helpers; selection normalization; payload identity / freshness semantics; REST phase handoff bridge | live shared visual consumer / presentation layer below `App` is not proven for accepted owner-state fields; confirmed/requested/stale/failed presentation remains frontier |

### Visual-consent-sensitive layer

Architecture-safe не означает visual auto-approval.

Отдельного product/visual approval требуют:

- `currentCandleType` / chart-type related surfaces;
- chart visual states for `loading`, `stale`, `error`, `confirmed`, `requested`;
- single-pane overlays such as `prevClose`, `baseline`, hover-driven interpretation and theme-weighted chart layers;
- compact placeholder / animation / stale-communication behavior.

### Product-role distinction

- `compact` = fast visual scan through animated sparkline for quick range / timeframe / price check.
- `expanded` = deeper analytical chart mode.

Это разные product roles; safe classification не должна использоваться как скрытое требование parity между ними.

### New frontier task

#### Shared Visual Consumer / Failure Presentation Pass

Meaning:

- owner-state model in `App` is accepted;
- but no proven shared live visual consumer layer below `App` was found for:
  - `confirmedSelection`
  - `requestedSelection`
  - `hasValidSnapshot`
  - `requestKind`
  - `requestStatus`
  - `dataStatus`
  - `failureScope`
  - `failureMessage`
- visual presentation for confirmed/requested/stale/failed therefore remains a separate architecture/product frontier;
- this is not a `Task 5` code fix and requires a separate bounded decision pass before implementation.

## Phase 6 — Compact Classification / Possible Compact-Specific Pass

`Phase 6` закрыт как decision-only pass с `Variant A`: `compact` frozen as accepted direct `App`-owned path.

Accepted current truth:

- live compact path: `App -> Results -> Chart (!isExpanded) -> CompactToolbar + CompactSparkline`
- `compact` остаётся на direct `App` / socket / `chartData` path
- compact range selection остаётся `App`-owned
- `CompactToolbar` остаётся range-only surface
- `CompactSparkline` остаётся accepted live fast-scan render surface
- shared dependencies such as `tfGuard` and `rangeKey` сами по себе не доказывают compact-specific mismatch
- residual files such as `CompactTrendChart.js` сами по себе не доказывают live compact mismatch

Meaning:

- no separate bounded compact-pass is needed on current evidence
- no separate compact owner is introduced
- `compact` remains the accepted fast visual scan path
- `expanded` remains the deeper analytical chart mode

Guardrails:

- do not introduce a separate compact owner
- do not move `compact` into `ChartContainer` / REST handoff model without new evidence
- do not force parity with `expanded`
- do not treat `CompactTrendChart.js` as a live surface
- do not treat the absence of richer failure presentation in `compact` as a compact-specific bug; `Shared Visual Consumer / Failure Presentation Pass` remains a separate later frontier
- freeze means accepted with guardrails, not "never touch compact again"

## Practical Session Checklist

### Phase 9 indicator stabilization status

- `9.1` completed:
  `menu -> activeIndicators -> render branch -> observable visual effect` proved.
- `9.2` accepted / closed:
  `price + optional MA + optional EMA + max one lower pane`.
- `9.3` completed / closed:
  `MA/EMA` cache-key fix confirmed by runtime QA.
- next:
  `9.4 — RSI / Volume single lower-pane stabilization`.
- patch readiness for `9.4`: no.

### 9.4 entry rule

- Start with read-only anchor and/or bounded runtime evidence.
- Do not patch first.
- Check:
  `RSI` only
  `Volume` only
  `RSI -> Volume`
  `Volume -> RSI`
  no stale pane
  no empty lower block
  no console errors
  price chart remains readable

### Pre-patch narrowing rule

Before any patch, check:

- does the change affect only the target case
- does object shape change for neighboring cases
- do cache-key changes leak into adjacent cases
- do shared helpers or effect dependencies affect non-target paths
- if a stricter conditional patch exists, use the stricter patch

Apply especially to:

- cache keys
- shared state objects
- renderer branches
- shared helpers
- cleanup logic
- effect dependencies

Before any risky chart task, ask:

- Which layer is this task in?
- Who owns the state/concept involved?
- Is there one source of truth or more than one?
- Is the issue contract, selection, data, init, navigation, indicator, or legacy?
- Is the visible symptom actually caused by a higher layer?
- Are we patching a root cause or a downstream symptom?

If any answer is unclear:

- stop patching;
- go back to anchor/ownership analysis.

## Anchor Files

### Canonical contract

- fingineerwebapp/src/constants/index.js

### Selection/state mirroring

- fingineerwebapp/src/components/Results/Chart/ChartContainer.js
- fingineerwebapp/src/components/Results/Chart/ChartContext.js
- fingineerwebapp/src/App.js

### Single-pane render core

- fingineerwebapp/src/components/Results/Chart/ChartCanvas.js
- fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js
- fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js
- fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js

### Data source

- fingineerwebapp/src/store/useCandles.js

### Legacy contract path

- fingineerwebapp/src/utils/chart/timeframes.js
- fingineerwebapp/src/lib/timeframes.js
- fingineerwebapp/src/components/ExpandedControls/ExpandedControls.js
- fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js
- fingineerwebapp/src/components/TimeframeSelector/TimeframeSelector.js

### Indicators

- fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js
- fingineerwebapp/src/components/Results/Chart/useIndicatorsEngine.js
- fingineerwebapp/src/charts/MultiPaneChart.jsx

### Observability

- fingineerwebapp/src/components/Results/Chart/hooks/useChartDebugPanel.js
- fingineerwebapp/src/components/Results/Chart/ChartDebugPanel.jsx

## Final Summary

FG Chart Engine сейчас — это не “сломанная система”.

Это система, у которой:

- уже есть сильный render core;
- уже есть хорошие зачатки modular ownership;
- но верхние слои всё ещё несут наследие монолита.

Самые чистые части:

- preparedData
- fullDataRef
- didInitViewRef
- init/render core
- debug observability layer

Самые грязные части:

- TF×interval contract duplication
- selection ownership duplication
- dual data source paths
- split candle type ownership
- legacy selector paths
- indicator renderer split

Правильная стратегия:

- не “чинить всё”;
- не “рефакторить монолит целиком”;
- а стабилизировать архитектуру по слоям и ownership order.

First stabilize:

- contract
- selection ownership
- data source ownership

Then:

- 4. transform
- 5. init/render
- 6. navigation
- 7. indicators
- 8. legacy cleanup

Этот документ должен использоваться как рабочий playbook перед каждой серьёзной chart-session, где задача затрагивает больше одного слоя системы.





