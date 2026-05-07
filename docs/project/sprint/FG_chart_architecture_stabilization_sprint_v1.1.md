# FG Chart Architecture Stabilization Sprint v1.1

## Назначение файла

Этот файл — roadmap и договор спринта стабилизации `chart-domain`.

Он отвечает на вопросы:

- зачем был нужен спринт;
- какие фазы входят в спринт;
- что считается завершением спринта;
- какие фазы уже закрыты;
- что теперь является правильным входом в работу;
- какие закрытые решения нельзя переоткрывать без новых доказательств;
- какие поздние frontier остаются отдельно от закрытого ядра спринта.

Этот файл **не является текущим stop-point источником**.

Актуальную stop-point точку всегда определяет:

`FG_sources_ready_current_state_2026-04-04.md`

---

# Source priority

При конфликте источников использовать порядок:

1. `FG_sources_ready_current_state_2026-04-04.md`

   Авторитетная текущая stop-point точка и ответ на вопрос “что дальше сейчас”.

2. `FG_CHART_ARCHITECTURE_MAP.md`

   Архитектурная карта, owner-boundaries, текущая структура системы.

3. `FG_CHART_STABILIZATION_PLAYBOOK.md`

   Рабочие правила стабилизации, closed/open зоны, порядок анализа.

4. `FG_CHART_ENGINE_PLAYBOOK.md`

   Движковая truth по рендеру, данным, навигации и минимальным runtime-договорам.

5. `FG_chart_architecture_stabilization_sprint_v1.1.md`

   Roadmap / phase structure / DoD.

6. Handoff-файлы

   История и supporting context.

Если sprint file и current-state расходятся по ближайшему шагу, побеждает current-state.

---

# Текущий статус спринта

## Current stop-point

Стабилизационное ядро спринта закрыто до `Phase 8` включительно.

Закрыты:

- `Task 1 — Contract / Legacy Truth Pass`;
- `Task 2 — sourceAuthority / Upstream Decision Pass`;
- `Task 3 — Failure Contract State-Model Pass`;
- `Task 4 — confirmedSelection / requestedSelection Ownership Pass`;
- `Task 5 — Feature-Safe Zones Matrix`;
- `Phase 6 — Compact Classification / Possible Compact-Specific Pass`;
- `Phase 7 — MultiPaneChart Branch Model / Parity Pass`;
- `Phase 8 — Indicator Architecture Pass`.

Текущий вход:

**Phase 9 — Broad Feature / Design Phase**

## Главная практическая формула

Фаза 9 начинается **поверх закрытой архитектурной базы**, а не с повторного спора о ней.

Нельзя под видом feature/design work переоткрывать:

- `Task 1–5`;
- `Phase 6`;
- `Phase 7`;
- `Phase 8.1–8.5`.

Если новая задача задевает open frontier, она должна идти отдельным bounded decision pass.

---

# Главная цель спринта

Довести `chart-domain` до состояния, где можно честно сказать:

- архитектура достаточно понятная;
- ownership boundaries достаточно управляемые;
- поведение достаточно предсказуемое;
- bounded feature work можно делать без постоянного re-anchor;
- это верно для `expanded`, `compact` и `shared` зон в пределах их role boundaries.

---

# Definition of Done

Спринт считается успешным, если на выходе есть:

- зафиксированный frozen baseline по уже закрытым slice’ам;
- зафиксированное решение по contract / legacy truth frontier;
- зафиксированное решение по sourceAuthority / upstream frontier для `expanded`, `compact` и `shared`;
- ясная state-model для accepted failure contract;
- ясный owner и lifecycle для `confirmedSelection` и `requestedSelection`;
- feature-safe zones matrix отдельно для `expanded`, `compact` и `shared`;
- ясная классификация `compact`;
- ясное решение по `MultiPaneChart`;
- indicator layer больше не остаётся скрытым architecture tail;
- можно идти в product features и design work без хаотичного возврата в closed slices.

## DoD status

На текущем stop-point DoD выполнен достаточно, чтобы перейти в:

**Phase 9 — Broad Feature / Design Phase**

Это не означает, что в системе больше нет frontier.

Это означает:

- stabilization core закрыт;
- закрытые решения синхронизированы;
- safe zones и guardrails известны;
- оставшиеся frontier отделены от основного стабилизационного ядра.

---

# Validation Baseline

Базовый QA baseline для всего спринта:

- `3000` = normal dev;
- `3100` = REST QA;
- `3101` = app / non-REST QA.

Primary browser QA:

- Codex + Playwright MCP.

Secondary regression harness:

- local Playwright e2e.

## QA rule

Нельзя заявлять runtime/UI success без наблюдаемого результата.

Runtime evidence должно разделять:

- target found;
- action attempted;
- action succeeded / failed;
- observable effect detected;
- blocker, если проверка не прошла.

---

# Глобальные правила спринта

Первый проход в тяжёлых фазах должен быть:

- read-only;
- decision-only.

Нельзя:

- рефакторить upstream “раз уже смотрим”;
- снова локально чистить `ChartContainer`;
- открывать large compact rewrite без доказательства;
- подменять state contract визуальными решениями;
- делать parity “для красоты” между `compact` и `expanded`;
- возвращаться в closed slices без новых доказательств;
- открывать architecture frontier под видом UI tweak.

Переход к следующей фазе разрешён только если предыдущая фаза дала:

- закрытое решение;
- или явный frozen classification;
- или bounded roadmap.

---

# Phase map

| Фаза | Название | Статус |
|---|---|---|
| `Phase 0` | Frozen Baseline | закрыта |
| `Task 1` | Contract / Legacy Truth Pass | закрыта |
| `Task 2` | sourceAuthority / Upstream Decision Pass | закрыта |
| `Task 3` | Failure Contract State-Model Pass | закрыта |
| `Task 4` | confirmedSelection / requestedSelection Ownership Pass | закрыта |
| `Task 5` | Feature-Safe Zones Matrix | закрыта |
| `Phase 6` | Compact Classification / Possible Compact-Specific Pass | закрыта |
| `Phase 7` | MultiPaneChart Branch Model / Parity Pass | закрыта |
| `Phase 8` | Indicator Architecture Pass | закрыта |
| `Phase 9` | Broad Feature / Design Phase | открыта |

---

# Phase 0 — Frozen Baseline

## Цель

Зафиксировать, что уже закрыто и не переоткрывается без новых доказательств.

## Что считаем закрытым

- QA test-port slice;
- `Compact REST handoff gap`;
- `ChartCanvas stale-init handoff gap` для `ChartCanvas` branch only;
- narrow `ChartRenderer -> MultiPaneChart` branch-entry gate slice;
- `MultiPaneChart` warnings tail;
- `Stage 2 / Slice 1`;
- `Stage 2 / Slice 2`;
- bounded active-path `currentCandleType` runtime-owner slice;
- REST-expanded `rangeKey` parity slice;
- local Stage 3 slices;
- accepted `ChartContainer` transform/handoff boundary;
- accepted FG failure contract как semantic baseline.

## Итог

`Phase 0` закрыта.

Эта фаза больше не является текущей рабочей областью.

---

# Task 1 — Contract / Legacy Truth Pass

## Цель

Зафиксировать одну canonical contract truth-model и понять статус legacy contract / legacy selector path.

## Что было нужно доказать

- что является canonical contract source;
- какая роль у legacy contract files;
- какая роль у legacy selector surfaces;
- являются ли legacy paths compatibility-only;
- что обязано быть shared contract для `compact` и `expanded`;
- что может остаться role-specific на уровне UI, но не на уровне truth.

## Принятое решение

- canonical `TF×interval` truth живёт в `fingineerwebapp/src/constants/index.js`;
- active helper path идёт через `App.js`;
- active expanded toolbar использует canonical helpers;
- `src/lib/timeframes.js` — compatibility wrapper with active usage;
- `src/utils/chart/timeframes.js` — legacy risk artifact;
- legacy selector path больше не считается mounted expanded runtime truth.

## Реализация

Был сделан bounded patch в `ExpandedControls.js`, убирающий live legacy selector mounts.

## QA

Проверено на:

- `3100`;
- `3101`.

## Итог

`Task 1` закрыта полностью:

- architecture;
- code;
- QA.

Не переоткрывать без новых runtime/code доказательств.

---

# Task 2 — sourceAuthority / Upstream Decision Pass

## Цель

Понять верхнюю truth-модель для:

- `expanded`;
- `compact`;
- `shared`.

## Принятое решение

- `expanded = sourceAuthority-selected upstream model`;
- `compact = accepted direct App-owned path`;
- shared truth constraints остаются явными для:
  - selection semantics;
  - payload identity;
  - freshness semantics;
  - common error slot.

## Смысл решения

- не делать ложную parity между `compact` и `expanded`;
- не начинать broad upstream unification;
- признать split-model как bounded рабочую truth-model;
- удержать `ChartContainer` как handoff boundary, а не source owner.

## Итог

`Task 2` закрыта как architectural / decision closure.

---

# Task 3 — Failure Contract State-Model Pass

## Цель

Перевести accepted FG failure contract в техническую state-model поведения.

## Зафиксированные state fields

- `confirmedSelection`;
- `requestedSelection`;
- `hasValidSnapshot`;
- `requestKind`;
- `requestStatus`;
- `dataStatus`;
- `failureScope`;
- `failureMessage`.

## Обязательные сценарии

- `initial_load`;
- `background_refresh`;
- `selection_change`;
- `history_load`.

## Принятая семантика

- confirmed selection = график, который реально находится на экране;
- новый `timeframe` / `interval` становится confirmed only after successful corresponding graph load;
- initial load failure без valid snapshot должен показывать error/empty state;
- background refresh failure может сохранить last valid graph, но не должен выдавать stale data за новый confirmed state;
- selection-change failure сохраняет previous committed graph и previous confirmed labels;
- history-load failure остаётся локальным.

## Итог

`Task 3` закрыта как state-model decision.

---

# Task 4 — confirmedSelection / requestedSelection Ownership Pass

## Цель

Закрыть риск:

**старые данные под новыми labels.**

## Принятая owner-model

- `App = authoritative owner`;
- `ChartContainer = handoff/mirror only`;
- `ChartContext = storage/runtime only`;
- REST branch использует bounded upward handoff;
- отдельный `compact owner` не вводится.

## Итог

`Task 4` закрыта как owner-model decision.

---

# Task 3 + Task 4 — accepted implementation tranche

## Что было сделано

- owner-state вынесен в `App`;
- `requestedSelection` пишется на selection intent;
- `confirmedSelection` продвигается только через authoritative commit boundary;
- REST path получил bounded upward handoff;
- `ChartContainer` и `ChartContext` не стали owner-слоями;
- `compact` остался на direct App-owned path.

## Изменённые файлы

- `App.js`;
- `Results.js`;
- `Chart.js`;
- `ChartContainer.js`;
- `useCandles.js`.

## Сознательно не трогались

- `ChartContext.js`;
- `ChartContent.js`;
- `ChartRenderer.js`;
- `ChartCanvas.js`;
- `CompactSparkline.jsx`.

## QA

Проверено:

- `3101 PASS`;
- `3100 PASS`.

## Follow-up fix

Был отдельно закрыт follow-up bugfix:

`initial REST expanded summary bootstrap`

Фикс был bounded one-file patch в `ChartContainer.js`.

Он не переоткрыл:

- `Task 2`;
- `Task 3`;
- `Task 4`;
- owner-model;
- sourceAuthority model.

---

# Task 5 — Feature-Safe Zones Matrix

## Цель

Построить практическую карту:

- где можно работать безопасно;
- где можно работать только с guardrails;
- где всё ещё frontier;
- какие поверхности чувствительны продуктово/визуально.

## Матрица

| Area | safe now | safe with guardrails | unsafe / frontier |
|---|---|---|---|
| `expanded` | pass-through relay, control relay | `ChartContainer` handoff/mirror, warm snapshot bootstrap, `ChartContext` storage/runtime, single-pane visual plumbing | `currentCandleType`, `MultiPaneChart` parity/presentation branch, deeper `ChartCanvas` runtime core |
| `compact` | `CompactToolbar` range/expand wiring, local compact display relay | direct compact `App` request bridge, range guard, `CompactSparkline` range identity / stale-line suppression / hover plumbing | `CompactSparkline` animation/perf engine, legacy `CompactTrendChart.js` residual path |
| `shared` | pass-through layers, branch seam in `Chart.js` | `App` owner-state schema, transition helpers, selection normalization, freshness semantics, REST handoff bridge | live shared visual consumer / presentation layer below `App` is not proven |

## Visual-sensitive rule

Architecture-safe не означает visual auto-approval.

Отдельного product/visual approval требуют:

- `currentCandleType` / chart-type surfaces;
- chart visual states for loading / stale / error / confirmed / requested;
- single-pane overlays;
- hover-driven interpretation;
- compact placeholder / animation / stale communication behavior.

## Product-role distinction

- `compact` = fast visual scan.
- `expanded` = deeper analytical chart mode.

Это разные product roles.

Safe classification не должна использоваться как скрытое требование parity между ними.

## Итог

`Task 5` закрыта как architectural / decision matrix pass.

---

# New frontier from Task 5

## Frontier

**Shared visual consumer / failure presentation layer below App**

## Суть

Owner-state model в `App` принят, но общий live visual consumer ниже `App` для accepted owner-state fields ещё не доказан.

Это касается:

- `confirmedSelection`;
- `requestedSelection`;
- `hasValidSnapshot`;
- `requestKind`;
- `requestStatus`;
- `dataStatus`;
- `failureScope`;
- `failureMessage`.

## Статус

Это не часть закрытого stabilization core.

Это later frontier.

## Как открывать

Только отдельным bounded decision pass.

Сначала нужно решить:

- какие поля можно показывать пользователю;
- какие поверхности shared;
- какие expanded-only;
- какие compact-only;
- какая visual semantics допустима;
- какие трактовки запрещены.

Implementation возможен только после этого.

---

# Phase 6 — Compact Classification / Possible Compact-Specific Pass

## Цель

Решить, нужен ли отдельный compact architecture pass или compact можно frozen как accepted direct path.

## Что доказано

- live compact path однозначен;
- compact остаётся на direct `App/socket/chartData` path;
- compact range selection остаётся App-owned;
- `CompactToolbar` — range-only surface;
- `CompactSparkline` — live fast-scan render surface;
- compact не routed через `ChartContainer` как owner-path;
- shared зависимости типа `tfGuard` и `rangeKey` не доказывают compact-specific mismatch;
- `CompactTrendChart.js` — residual file, но не live compact mismatch.

## Принятое решение

**Variant A: compact frozen as accepted direct App-owned path**

## Что это означает

- отдельный bounded compact-pass не нужен;
- compact остаётся accepted frozen direct App-owned path;
- compact не является “mini-expanded”;
- compact не переводится автоматически в `ChartContainer / REST handoff model`;
- compact freeze означает accepted with guardrails, а не “никогда больше не трогаем”.

## Guardrails

- не вводить отдельного compact owner;
- не тянуть compact в parity с expanded;
- не переводить compact в `ChartContainer / REST handoff` без нового evidence;
- не считать `CompactTrendChart.js` live surface;
- не трактовать отсутствие richer failure presentation в compact как compact-specific bug.

## Итог

`Phase 6` закрыта как decision-only pass.

---

# Phase 7 — MultiPaneChart Branch Model / Parity Pass

## Цель

Закрыть текущую архитектурную тревогу вокруг `MultiPaneChart`.

Фаза 7 решала:

- current branch truth;
- current pane-model truth;
- current indicator display truth;
- допустимые branch differences;
- retained parity tail.

Она не была broad indicator redesign.

## Принятые решения

### 7.3

`RSI-only` lower-pane reflow в expanded mode является mechanically expected current effect of current pane-model.

Это не automatic defect само по себе.

### 7.4

Current `MultiPaneChart` branch не parity-complete against single-pane path.

Зафиксированы accepted current limitations:

- current narrow `MultiPaneChart` gate;
- mixed visible sets stay on `ChartCanvas`;
- current supported display truth для `MA`, `EMA`, `RSI`, `volume`.

### 7.5

Full freeze текущей `MultiPaneChart` branch как fully frozen limited branch не принят.

Причина:

- full parity не доказан;
- часть branch differences остаётся file-backed frontier.

Retained frontier:

- narrow `MultiPaneChart` parity tail.

### 7.6

`Phase 7` не redesign indicator layer.

В `Phase 8` вынесены:

- future indicator architecture;
- future indicator expansion;
- broader indicator placement semantics;
- product-level indicator roadmap.

## Итог

`Phase 7` закрыта как decision / boundary pass.

Не переоткрывать без новых runtime/code доказательств.

---

# Phase 8 — Indicator Architecture Pass

## Цель

Закрыть слой индикаторов как скрытый architecture tail и отделить его от upstream / failure / selection frontier.

## 8.1 — Minimal Indicator Contract / Owner Boundary Pass

Принятая truth-formula:

`ChartContext.activeIndicators` = minimal proven indicator-specific runtime core на active path.

Что это означает:

- owner = `ChartContext`;
- внутри `activeIndicators` сейчас живут activation / visibility / params / settings;
- renderer paths не владеют indicator state;
- `ChartRenderer`, `useChartIndicators`, `MultiPaneChart` — consumers;
- selection / source / failure truth не входят в indicator layer.

## 8.2 — Indicator Mode Behavior Map

Принятая truth-formula:

indicator domain имеет единый runtime owner state, но не имеет единого mode behavior contract across renderer branches.

Что это означает:

- single-pane = richer primary indicator-render branch;
- multi-pane = narrow gated branch для `RSI` и `volume`;
- mixed visible sets stay on `ChartCanvas`;
- failure truth остаётся outside indicator layer;
- compact не является proven indicator mode.

## 8.3 — Safe / Guardrails / Frontier Matrix

already safe:

- owner-boundary;
- minimal runtime core;
- renderer-consumer split;
- current supported set truth.

safe with guardrails:

- current operational visual contract;
- runtime co-location of activation / visibility / params / settings;
- compact non-applicability without forced parity;
- indicator behavior inside outer chart/failure truth.

real frontier:

- split renderer contract;
- cross-branch mode divergence;
- exact current `MultiPaneChart` parity cell.

## 8.4 — Bounded Indicator Frontier Decision Pass

Принято:

дальнейшая работа нужна не по всему indicator layer, а только по bounded frontier-surface:

**split renderer contract / cross-branch divergence through exact current multi-pane parity cell**

Не открыто:

- full indicator redesign;
- future indicator wishlist;
- catalog / registry / builders redesign;
- compact indicator parity;
- indicator-specific failure behavior;
- `MA / EMA` multi-pane parity.

## 8.5 — MultiPane Indicator Contract Parity Slice

Minimum shared renderer contract между single-pane и current multi-pane branch уже, чем full indicator parity.

Required now:

- activation truth;
- identity truth;
- visibility truth;
- для `RSI`: `params.period`;
- для `RSI`: level-visibility behavior.

Optional later:

- `currentInterval`;
- `currentTimeframe`;
- `currentCandleType`;
- broader payload/cache symmetry.

Excluded:

- mixed visible sets;
- compact;
- indicator-specific failure behavior;
- future indicator expansion;
- broader placement semantics;
- `MA / EMA` multi-pane parity;
- catalog / registry / builders redesign.

## Итог

`Phase 8` закрыта как working decision / architecture pass.

Не переоткрывать `8.1–8.5` без новых runtime/code доказательств.

Retained bounded frontier вокруг current `MultiPaneChart` parity остаётся documented dependency, но не равен всей закрытой `Phase 8`.

---

# Phase 9 — Broad Feature / Design Phase

## Статус

Открыта.

Это текущая рабочая область.

## Цель

Войти в нормальную продуктовую фазу, где можно делать features и design без постоянного страха задеть скрытый ownership swamp.

## Что можно делать

- bounded features;
- design / UX work;
- новые chart capabilities;
- role-aware improvements для `expanded`;
- role-aware improvements для `compact`;
- shared improvements, если они не переоткрывают unresolved frontier.

## Что нельзя делать

- возвращаться хаотично в closed slices;
- открывать архитектурные вопросы под видом UI tweak;
- делать feature work в unsafe zone без отдельного decision pass;
- форсить parity между `compact` и `expanded`;
- превращать retained `MultiPaneChart` parity cell в broad redesign;
- открывать `Phase 8.1–8.5` заново без новых доказательств.

## Правило входа в Phase 9

Перед любой задачей Фазы 9 нужно определить:

- это feature/design work поверх safe zone;
- или safe with guardrails;
- или задача задевает open frontier.

Если задача задевает open frontier, она не идёт как обычная feature task.

Она должна идти как bounded decision pass.

## Phase 9 first working plan

First working plan for Phase 9 is stored separately:

`docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`

Current first slice:

`9.1 — read-only anchor: Indicator menu -> ChartContext.activeIndicators -> render branch -> observable visual effect`

---

# Remaining open frontiers

## 1. Exact current MultiPaneChart parity cell

Статус:

- retained bounded dependency.

Что это не означает:

- не full `MultiPaneChart` rewrite;
- не full indicator redesign;
- не reopening of `Phase 8`;
- не forced parity для mixed visible sets;
- не forced parity между `compact` и `expanded`.

## 2. Shared visual consumer / failure presentation layer below App

Статус:

- later frontier.

Причина:

- owner-state model в `App` принят;
- но общий live visual consumer ниже `App` для accepted owner-state fields ещё не доказан.

## 3. Broader authority-chain unification

Статус:

- later frontier.

Причина:

- текущий `App / ChartContainer / sourceAuthority` bridge принят как bounded model;
- это не финальная полная унификация всей верхней source chain.

---

# Closed slices / do not reopen

Не переоткрывать без новых runtime/code доказательств:

- QA test-port setup;
- Compact REST handoff gap;
- `ChartCanvas` stale-init handoff gap;
- narrow `ChartRenderer` `MultiPaneChart` branch-entry gate mismatch;
- `MultiPaneChart` warnings tail;
- `Stage 2 / Slice 1`;
- `Stage 2 / Slice 2`;
- accepted active-path `currentCandleType` runtime-owner / persistence-holder slice;
- Stage 3 local data-source slices;
- accepted `ChartContainer` transform/handoff boundary;
- forced-stale experiment as product logic;
- `Task 1–5`;
- `Phase 6`;
- `Phase 7`;
- `Phase 8.1–8.5`.

---

# Practical Phase 9 checklist

Перед любой задачей в Фазе 9 спросить:

1. Какая зона затронута?

   - `expanded`;
   - `compact`;
   - `shared`;
   - indicator;
   - data/source;
   - visual presentation.

2. Это safe now, safe with guardrails или frontier?

3. Кто owner?

4. Есть ли один источник truth?

5. Это product/design work или architecture decision?

6. Не переоткрывает ли задача закрытую фазу?

7. Нужен ли отдельный bounded decision pass?

Если хотя бы один ответ неясен:

- не патчить;
- сначала сделать ownership / boundary analysis.

---

# Final sprint summary

`FG Chart Architecture Stabilization Sprint` перевёл `chart-domain` из survival mode в состояние, где базовые truth / ownership / failure / compact / MultiPane / indicator вопросы закрыты достаточно, чтобы перейти к продуктовой работе.

Закрыты:

- `Task 1–5`;
- `Phase 6`;
- `Phase 7`;
- `Phase 8`.

Текущий вход:

**Phase 9 — Broad Feature / Design Phase**

Главное правило:

**Фаза 9 начинается поверх закрытой архитектурной базы, а не с повторного спора о ней.**
