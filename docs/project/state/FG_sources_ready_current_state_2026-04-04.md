# FG Chart Architecture Stabilization Sprint — Current State + Timeline

## Назначение файла

Этот файл собран как **рабочая версия для Sources**.

Его задача:

- держать один актуальный state спринта;
- фиксировать авторитетную stop-point точку;
- сохранять цепочку решений без конфликта между версиями;
- давать понятную входную точку для новой сессии;
- отделять актуальную truth от исторического пути;
- защищать закрытые решения от случайного переоткрытия.

Этот файл отвечает на вопрос:

**"Где мы сейчас и с чего правильно продолжать?"**

Он не является backlog, patch-plan или списком будущих фич.

---

# AUTHORITATIVE CURRENT STATE

## Current stop-point

**Phase 8 closed as working decision / architecture pass.**

Фаза 8 прошла через `8.1–8.5` и закрыта как рабочая архитектурная модель слоя индикаторов.

Это означает:

- минимальное runtime-ядро индикаторов зафиксировано;
- owner-boundary зафиксирован;
- mode behavior map собран;
- safe / guardrails / frontier classification собрана;
- bounded frontier локализован;
- minimum shared renderer contract для current gated scope определён.

**Phase 9 active.**

Текущая stop-point точка внутри Phase 9:

- `9.1` completed;
- `9.2` accepted / closed;
- `9.3` completed / closed;
- immediate next step: `9.4 — RSI / Volume single lower-pane stabilization`;
- patch readiness: no.

## Current entry

**Phase 9 — Broad Feature / Design Phase.**

Текущий вход в работу теперь находится не в Фазе 7 и не в Фазе 8.

Правильная следующая область:

- product features;
- design work;
- bounded feature work;
- role-aware improvements для `expanded`, `compact` и `shared`;
- без хаотичного возврата в закрытые architecture slices.

## Phase 9 current working plan

Current Phase 9 first working plan is stored in:

`docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`

Immediate next step:

`9.4 — RSI / Volume single lower-pane stabilization`

Completed now:

- `9.1A — code anchor: completed`;
- `9.1B — runtime visual evidence: completed on 3100 and 3101`;
- `9.2 — accepted / closed`;
- `9.3 — completed / closed`.

Result summary:

- current 4 indicators are clickable and produce observable visual effects;
- `9.2` accepted visual contract:
  `price + optional MA + optional EMA + max one lower pane`;
- allowed first-pass combinations:
  `MA`, `EMA`, `MA + EMA`, `RSI`, `Volume`, `MA + RSI`, `EMA + RSI`, `MA + Volume`, `EMA + Volume`, `MA + EMA + RSI`, `MA + EMA + Volume`;
- deferred:
  `RSI + Volume`, `MA + EMA + RSI + Volume`, multiple lower-pane indicators, new indicators, broad `MultiPaneChart` redesign;
- `9.3` closed with one-file fix in `fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js`;
- defect summary:
  `MA/EMA` cache key did not distinguish the concrete candle dataset;
- fix summary:
  `sourceIdentity` added to the cache key only for `MA / EMA`;
- runtime QA:
  `[3000]`, `SBER -> GAZP`, `MA + EMA` enabled, `FIX CONFIRMED`, `STABLE`, console errors `0`.

Latest handoff:

`.claude/handoffs/2026-05-03-phase-9-1-9-3-indicator-visual-behavior-handoff.md`

Scope:

- current 4 indicators only: `MA`, `EMA`, `RSI`, `Volume`;
- no new indicators before current 4 are visually truthful and stable in `Expanded`;
- `Bollinger Bands`, `ATR`, `OBV` are deferred.

## Current rule

Фаза 9 начинается **поверх закрытых решений**, а не вместо них.

Нельзя под видом feature/design task переоткрывать:

- `Task 1–5`;
- `Phase 6`;
- `Phase 7`;
- `Phase 8.1–8.5`.

Если задача задевает открытый frontier, она должна идти отдельным decision pass.

---

# Текущий спринт

Мы работаем в рамках:

**FG Chart Architecture Stabilization Sprint**

Это уже не спринт “подчистить график местами”.

Цель спринта — вывести `chart-domain` из survival mode в состояние, где:

- архитектура достаточно понятна;
- ownership boundaries достаточно управляемые;
- поведение достаточно предсказуемое;
- bounded feature work можно делать без постоянного re-anchor;
- это верно для `expanded`, `compact` и `shared` зон в пределах их ролей.

## Главная цель спринта

Довести chart-domain до состояния, в котором можно честно идти в product features и design work без постоянного возврата в базовые вопросы по:

- ownership;
- data-flow;
- truth-model;
- contract;
- failure semantics;
- safe zones;
- indicator / MultiPane branch ambiguity.

---

# Closed phases and decisions

| Область | Статус | Итог |
|---|---|---|
| `Task 1 — Contract / Legacy Truth Pass` | закрыто | canonical contract и legacy selector risk закрыты |
| `Task 2 — sourceAuthority / Upstream Decision Pass` | закрыто | sourceAuthority принят как bounded truth-model |
| `Task 3 — Failure Contract State-Model Pass` | закрыто | failure state-model принят |
| `Task 4 — confirmedSelection / requestedSelection Ownership Pass` | закрыто | owner model принят |
| `Task 5 — Feature-Safe Zones Matrix` | закрыто | safe-zones matrix принята |
| `Phase 6 — Compact Classification / Possible Compact-Specific Pass` | закрыто | compact frozen as accepted direct App-owned path |
| `Phase 7 — MultiPaneChart Branch Model / Parity Pass` | закрыто | current MultiPaneChart branch truth зафиксирована |
| `Phase 8 — Indicator Architecture Pass` | закрыто | bounded indicator architecture model принят |
| `Phase 9 — Broad Feature / Design Phase` | открыто | текущая рабочая область |

---

# Accepted truth на текущем stop-point

- `Task 1` полностью закрыта.
- `Task 2` закрыта как decision-only pass.
- `Task 3` закрыта как state-model decision.
- `Task 4` закрыта как owner-model decision.
- `Task 3 + Task 4` уже имеют accepted implementation tranche.
- `Task 5` закрыта как matrix pass.
- `Phase 6` закрыта с решением: compact frozen as accepted direct App-owned path.
- `Phase 7` закрыта как decision / boundary pass.
- `Phase 8` прошла через `8.1–8.5` и закрыта как working decision / architecture pass.
- Current entry = `Phase 9 — Broad Feature / Design Phase`.

---

# Do not reopen without new evidence

Не переоткрывать без новых runtime/code доказательств:

- legacy selector issue из `Task 1`;
- sourceAuthority decision из `Task 2`;
- failure state-model semantics из `Task 3`;
- owner model из `Task 4`;
- accepted owner/handoff implementation tranche;
- follow-up bootstrap fix;
- `Task 1–6` в целом;
- compact freeze из `Phase 6`;
- closed `Phase 7` boundary decisions;
- closed `Phase 8.1–8.5` working decisions;
- `9.2` visual contract;
- `MA/EMA` cache-key fix unless new evidence appears;
- multiple lower panes;
- `RSI + Volume` as first-pass target;
- new indicators;
- broad `MultiPaneChart` redesign;
- `compact` parity.

## Особое правило по retained MultiPaneChart frontier

Retained `MultiPaneChart` parity cell **не является правом открыть заново всю Phase 8**.

Этот хвост означает только:

- есть точная bounded dependency;
- она относится к current `MultiPaneChart` parity cell;
- она не равна broad indicator redesign;
- она не равна full MultiPaneChart rewrite;
- она не равна возврату в Phase 7;
- она не равна повторному открытию `8.1–8.5`.

---

# Open now

## Current working area

**Phase 9 — Broad Feature / Design Phase**

Фаза 9 разрешает переход к продуктовой и визуальной работе, но только поверх закрытой архитектурной базы.

Допустимые типы работы:

- bounded features;
- design / UX work;
- новые chart capabilities;
- role-aware improvements для `expanded`;
- role-aware improvements для `compact`;
- shared improvements, если они не переоткрывают unresolved frontier.

## Retained bounded dependency

Остаётся один точный bounded хвост:

**exact current `MultiPaneChart` parity cell for the same ownership / authority / init-runtime model**

Это не:

- full `MultiPaneChart` rewrite;
- full indicator redesign;
- reopening of `Phase 8`;
- redesign of catalog / registry / builders;
- forced parity для mixed visible sets;
- forced parity между `compact` и `expanded`.

## Later frontiers

Остаются отдельные поздние frontier:

1. **Shared visual consumer / failure presentation layer below App**

   Owner-state model в `App` принят, но общий live visual consumer ниже `App` для accepted owner-state fields ещё не доказан.

2. **broader authority-chain unification**

   Текущий `App` / `ChartContainer` / sourceAuthority bridge принят как bounded model, но это не финальная полная унификация всей верхней цепочки источников данных.

3. **exact current MultiPaneChart parity cell**

   Остаётся только как точная bounded dependency, а не как открытая Фаза 8.

---

# Следующий старт

Следующая рабочая сессия должна стартовать так:

1. Опора на этот current-state файл.
2. Опора на последние stable docs.
3. Прямой вход в:

   **Phase 9 — Broad Feature / Design Phase**

Current next working slice:

`9.4 — RSI / Volume single lower-pane stabilization`

Working plan location:

`docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`

Latest handoff:

`.claude/handoffs/2026-05-03-phase-9-1-9-3-indicator-visual-behavior-handoff.md`

Scope:

- current 4 indicators only: `MA`, `EMA`, `RSI`, `Volume`;
- no new indicators before current 4 are visually truthful and stable in `Expanded`;
- `Bollinger Bands`, `ATR`, `OBV` are deferred.

Next safe entry:

`9.4` must start with read-only anchor and/or bounded runtime evidence for:

- `RSI` only;
- `Volume` only;
- `RSI -> Volume`;
- `Volume -> RSI`;
- no stale pane;
- no empty lower block;
- no console errors;
- price chart remains readable.

Без возврата назад в:

- `Task 1–6`;
- compact rewrite;
- `Phase 7`;
- closed `Phase 8.1–8.5`;
- shared visual consumer frontier;
- broader authority-chain unification;
- если только не появится genuinely new runtime/code evidence.

---

# Source priority

При конфликте источников использовать такой порядок:

1. `FG_sources_ready_current_state_2026-04-04.md`

   Авторитетная stop-point точка и ответ на вопрос “что дальше сейчас”.

2. `FG_CHART_ARCHITECTURE_MAP.md`

   Устойчивая архитектурная карта и owner/boundary truth.

3. `FG_CHART_STABILIZATION_PLAYBOOK.md`

   Рабочий порядок стабилизации, closed/open зоны, правила не переоткрывать.

4. `FG_CHART_ENGINE_PLAYBOOK.md`

   Движковая truth по рендеру, навигации, данным и минимальным runtime-договорам.

5. `FG_chart_architecture_stabilization_sprint_v1.1.md`

   Roadmap / phase structure / DoD.

6. Handoff-файлы

   История и supporting context. Не сильнее current-state.

---

# Sprint structure

Эта структура остаётся фазовой рамкой спринта.

Текущий вход уже находится в `Phase 9`.

Итоговый рабочий порядок спринта:

0. **Frozen Baseline**
1. **Contract / Legacy Truth Pass**
2. **sourceAuthority / Upstream Decision Pass**
3. **Failure Contract State-Model Pass**
4. **confirmedSelection / requestedSelection Ownership Pass**
5. **Feature-Safe Zones Matrix**
6. **Compact Classification / Possible Compact-Specific Pass**
7. **MultiPaneChart Branch Model / Parity Pass**
8. **Indicator Architecture Pass**
9. **Broad Feature / Design Phase**

Главный смысл порядка:

- сначала закрыть truth / ownership / safe-zones;
- потом закрыть compact / MultiPane / indicator ambiguity;
- и только после этого идти в product / design phase.

## Что главное сейчас

На текущем stop-point закрыты Фазы `0–8`.

Ближайшая рабочая область:

**Phase 9 — Broad Feature / Design Phase**

Работа в Фазе 9 разрешена только поверх закрытых решений.

Нельзя под видом feature/design task переоткрывать:

- `Task 1–5`;
- `Phase 6`;
- `Phase 7`;
- `Phase 8.1–8.5`.

Если задача задевает open frontier, она должна идти отдельным bounded decision pass.

---

# CLOSED DECISIONS AND IMPLEMENTATION

## Task 1 — Contract / Legacy Truth Pass

### Что доказали в 1A

- canonical `TF×interval` truth живёт в `fingineerwebapp/src/constants/index.js`;
- active helper path идёт через `App.js`;
- active expanded toolbar уже использует canonical helpers;
- `src/lib/timeframes.js` — не отдельный truth-source, а compatibility wrapper with active usage;
- `src/utils/chart/timeframes.js` остаётся legacy risk artifact;
- legacy selector path через `ExpandedControls / TimeframeSelector / IntervalSelector` всё ещё жил в runtime.

### Что сделали в 1B

- локализовали live path как:

  `Results.js -> ExpandedControls.js -> TimeframeSelector / IntervalSelector`

- доказали, что `ExpandedControls.js` — лучший first patch target;
- доказали, что дополнительных live mounts для этих selectors не найдено;
- внесли one-file patch в `ExpandedControls.js`, убрав legacy selector mounts;
- прогнали runtime QA на `3100` и `3101`;
- подтвердили, что duplicate legacy selectors исчезли и canonical expanded toolbar остался рабочим.

### Итог по Task 1

`Task 1` закрыта полностью:

- архитектурно;
- кодом;
- QA.

Не переоткрывать без genuinely new runtime/code evidence.

---

## Task 2 — sourceAuthority / Upstream Decision Pass

Принято bounded решение:

- `expanded = sourceAuthority-selected upstream model`;
- `compact = accepted direct App-owned path`;
- `shared truth constraints` остаются явными для:
  - selection semantics;
  - payload identity;
  - freshness semantics;
  - common error slot.

Смысл решения:

- не делать ложную parity между `compact` и `expanded`;
- не начинать большую upstream unification;
- честно признать split-model как bounded рабочую truth-model этого этапа;
- удержать `ChartContainer` как handoff boundary, а не source owner.

### Итог по Task 2

`Task 2` закрыта как architectural / decision closure.

---

## Task 3 — Failure Contract State-Model Pass

Зафиксирована implementation-ready state-model:

- `confirmedSelection`;
- `requestedSelection`;
- `hasValidSnapshot`;
- `requestKind`;
- `requestStatus`;
- `dataStatus`;
- `failureScope`;
- `failureMessage`.

Зафиксированы переходы для:

- `initial_load`;
- `background_refresh`;
- `selection_change`;
- `history_load`.

Главный смысл:

- график не должен врать при сбоях данных;
- новые labels не должны подтверждаться до успешной загрузки соответствующего графика;
- previous valid graph может сохраняться, но не должен выдаваться за новый confirmed state.

### Итог по Task 3

`Task 3` закрыта как state-model decision.

---

## Task 4 — confirmedSelection / requestedSelection Ownership Pass

Принята owner-model:

- `App = authoritative owner`;
- `ChartContainer = handoff/mirror only`;
- `ChartContext = storage/runtime only`;
- `REST branch` использует upward handoff наверх;
- отдельный `compact owner` не вводится.

Главный смысл:

- определить, где физически живут accepted owner-state fields;
- определить, кто имеет право делать promotion/reset;
- не превращать `ChartContainer` и `ChartContext` в новые source owners.

### Итог по Task 4

`Task 4` закрыта как owner-model decision.

---

## Общий implementation tranche по Task 3 + Task 4

После принятия state-model и owner-model был сделан общий bounded implementation tranche.

### Что сделали

- owner-state вынесли в `App`;
- `requestedSelection` начали писать на selection intent;
- `confirmedSelection` начали продвигать только через authoritative commit boundary;
- для REST path добавили bounded upward handoff;
- `ChartContainer` и `ChartContext` owner-слоями не стали;
- `compact` остался на direct App-owned path.

### Scope implementation tranche

Изменены были:

- `App.js`;
- `Results.js`;
- `Chart.js`;
- `ChartContainer.js`;
- `useCandles.js`.

Сознательно не трогались:

- `ChartContext.js`;
- `ChartContent.js`;
- `ChartRenderer.js`;
- `ChartCanvas.js`;
- `CompactSparkline.jsx`.

Причина:

- это уже следующий consumer-layer;
- tranche закрывал owner/handoff slice, а не visual consumer implementation.

### QA

Прогнали Playwright smoke/runtime QA:

- `3101 PASS`;
- `3100 PASS`.

Подтвердили:

- compact жив;
- expanded жив;
- timeframe/interval/range работают;
- stale-promotion визуально не проявился;
- legacy selectors не вернулись;
- критических console/network ошибок нет.

---

## Follow-up bugfix — initial REST expanded summary bootstrap

### Симптом

На `3100` при первом входе в expanded часть верхних summary-метрик сначала показывала `—`, а после первого переключения всё нормализовалось.

### Причина

REST expanded path слишком рано обнулял `chartData`, пока ещё не пришёл `agg.meta`, и верхние summary строились из пустых candles.

### Что сделали

Сделали bounded one-file follow-up fix в `ChartContainer.js`:

- если REST ещё не прислал нормальный payload;
- но `App.chartData` уже содержит совпадающий `ticker|timeframe`;
- `ChartContainer` временно использует его как warm snapshot;
- после прихода реального REST payload переключается на него как раньше.

### Итог

Баг закрыт.

Это не переоткрыло:

- owner-model;
- `Task 2`;
- `Task 3`;
- `Task 4`.

Это отдельный локальный bootstrap fix.

---

## Task 5 — Feature-Safe Zones Matrix

### Что это была за задача

Задача не про код и не про новые UI-патчи.

Она была про практическую карту:

- где можно работать безопасно;
- где можно работать только с guardrails;
- где всё ещё frontier;
- какие поверхности чувствительны продуктово/визуально.

### Как подошли

Пошли не “по ощущениям”, а через узкие anchor-pass’ы:

- `expanded`;
- `compact`;
- `shared`.

После этого сделали отдельный pass по visual-consent-sensitive surfaces.

### Что показал anchor по expanded

- stable relay-зоны;
- safe-with-guardrails зоны вокруг мостов передачи, snapshot/bootstrap, storage/runtime слоёв и freshness/cache;
- unsafe/frontier зоны вокруг:
  - `currentCandleType`;
  - `MultiPane`;
  - `ChartCanvas runtime core`.

Отдельно стало понятно:

- chart-type surfaces нельзя автоматически считать safe только потому, что wiring вокруг них работает;
- visual state surfaces нельзя автоматически считать safe без продуктового решения.

### Что показал anchor по compact

Живой compact path идёт через:

`App -> Results -> Chart (!isExpanded) -> CompactToolbar + CompactSparkline`

Зафиксировано:

- compact остаётся на direct App-owned path;
- range selection — App-owned;
- `CompactToolbar` — range-only surface;
- `CompactSparkline` — живая fast-scan render surface;
- display/wiring surfaces у compact выглядят stable;
- animation/perf subsystem — не free tweak zone;
- `CompactTrendChart.js` — residual file, а не live path.

### Что показал anchor по shared

Зафиксировано:

- owner-state в `App`;
- selection normalization;
- shared payload identity/freshness plumbing;
- shared REST handoff bridge;
- общий error-slot.

При этом не доказано, что существует общий user-visible consumer layer ниже `App`, который реально читает owner-state fields.

### Дополнительный visual pass

Отдельно разделили:

- technically stable visual plumbing;
- visual-consent-sensitive product surfaces;
- architecture frontier.

Критичный вывод:

- `architecture-safe != visual auto-approval`;
- `compact = fast visual scan path`;
- `expanded = deeper analytical mode`.

### Итог по Task 5

`Task 5` закрыта как architectural / decision matrix pass.

Зафиксировано:

- матрица `expanded / compact / shared`;
- `safe now / safe with guardrails / unsafe / frontier`;
- отдельный слой visual-consent-sensitive;
- правило: architecture-safe не означает visual-safe.

---

## Новый frontier, выявленный по итогам Task 5

Выявлен later frontier:

**Shared visual consumer / failure presentation layer below App is not yet proven as a live runtime path**

Это касается полей:

- `confirmedSelection`;
- `requestedSelection`;
- `hasValidSnapshot`;
- `requestKind`;
- `requestStatus`;
- `dataStatus`;
- `failureScope`;
- `failureMessage`.

Принято решение:

- этот frontier не входит в `Task 5`;
- не входит в `Phase 6`;
- не должен автоматически открываться внутри текущего stabilization sprint core;
- не должен открываться как UI-патч “по ходу дела”.

Если позже к нему возвращаться, он естественно делится на две будущие задачи.

### Задача A

Decision pass по пользовательскому представлению owner-state и failure-семантики:

- какие поля становятся видимыми пользователю;
- где shared;
- где expanded-only;
- где compact-only;
- какая visual semantics допустима;
- какие трактовки запрещены.

### Задача B

Bounded implementation pass по consumer/presentation layer, если после задачи A такой слой вообще будет нужен.

---

## Phase 6 — Compact Classification / Possible Compact-Specific Pass

### Вопрос фазы

Можно ли freeze compact как accepted direct App-owned path, или нужен отдельный bounded compact-pass?

### Что доказали

- live compact path однозначен;
- compact остаётся на direct `App/socket/chartData` path;
- compact range selection остаётся App-owned;
- `CompactToolbar` — range-only surface;
- `CompactSparkline` — живая fast-scan render surface;
- compact не routed через `ChartContainer` как owner-path;
- shared зависимости типа `tfGuard` и `rangeKey` не образуют отдельного compact-specific mismatch;
- `CompactTrendChart.js` — residual file, но не доказательство live compact mismatch.

### Решение

Принят:

**Variant A: compact frozen as accepted direct App-owned path**

Это означает:

- отдельный bounded compact-pass не нужен;
- compact остаётся accepted frozen direct App-owned path;
- compact не является “mini-expanded”;
- compact не переводится автоматически в `ChartContainer / REST handoff model`;
- compact freeze означает accepted with guardrails, а не “никогда больше не трогаем”.

### Guardrails по compact

- не вводить отдельного compact owner;
- не тянуть compact в parity с expanded;
- не переводить его в `ChartContainer / REST handoff` без нового evidence;
- не считать `CompactTrendChart.js` live surface;
- не трактовать отсутствие richer failure presentation в compact как compact-specific bug;
- frontier по shared visual consumer / failure presentation остаётся отдельной поздней темой.

### Итог по Phase 6

`Phase 6` закрыта как decision-only pass.

---

# PHASE 7 CLOSURE

## Phase 7 — MultiPaneChart Branch Model / Parity Pass

### Что решали

Фаза 7 была открыта не как общий redesign indicator layer.

Она решала текущую правду по `MultiPaneChart`:

- current branch truth;
- current pane-model truth;
- current indicator display truth;
- какие branch differences ещё живы;
- какие различия допустимы;
- frozen ли это limited branch;
- нужен ли parity roadmap;
- что является accepted current limitation;
- что остаётся настоящим architecture tail.

### Принятая boundary-формула

`Phase 7` закрывает current `MultiPaneChart` branch truth, но не закрывает full `MultiPaneChart` parity.

### Ключевые решения

#### 7.3

Текущий `RSI-only` lower-pane reflow в expanded mode является mechanically expected current effect of current pane-model.

Это не automatic defect само по себе.

Смысл:

- если включается нижняя панель, основной график визуально перестраивается;
- это ожидаемое следствие текущей pane-модели;
- это не доказывает баг;
- но это также не означает, что финальный UX уже утверждён.

#### 7.4

Current `MultiPaneChart` branch не parity-complete against single-pane path.

Зафиксированы accepted current limitations:

- current narrow `MultiPaneChart` gate;
- mixed visible sets stay on `ChartCanvas`;
- current supported display truth для `MA`, `EMA`, `RSI`, `volume`.

Retained narrow parity tail:

- current `MultiPaneChart` branch не имеет полной parity с single-pane path;
- открытый хвост остаётся только внутри current branch/frontier.

#### 7.5

Full freeze текущей `MultiPaneChart` branch как полностью завершённой limited branch не принят.

Причина:

- full parity не доказан;
- часть branch differences остаётся file-backed frontier.

Принято:

- retained frontier = narrow `MultiPaneChart` parity tail;
- не branch-wide unknown;
- не broad redesign;
- не full parity roadmap.

#### 7.6

Зафиксирована граница между `Phase 7` и `Phase 8`.

`Phase 7` не должна превращаться в общий indicator architecture pass.

В `Phase 8` вынесены:

- future indicator architecture;
- future indicator expansion;
- broader indicator placement semantics;
- product-level indicator roadmap.

### Итог по Phase 7

`Phase 7` закрыта как decision / boundary pass.

Зафиксировано:

- current `MultiPaneChart` truth;
- current pane-model truth;
- current indicator display truth;
- full `MultiPaneChart` parity not proven;
- retained frontier = narrow parity tail.

Не переоткрывать без genuinely new runtime/code evidence.

---

# PHASE 8 CLOSURE

## Phase 8 — Indicator Architecture Pass

### Что решали

Фаза 8 была открыта после Фазы 7, чтобы слой индикаторов больше не оставался скрытым architecture tail.

Она должна была ответить:

- где owner indicator state;
- что входит в minimal indicator runtime core;
- как indicators ведут себя по режимам;
- что already safe;
- что safe with guardrails;
- что remains indicator-specific frontier;
- где заканчивается indicator state и начинается renderer contract.

Фаза 8 не была задачей на broad redesign.

---

## 8.1 — Minimal Indicator Contract / Owner Boundary Pass

### Принятая truth-formula

`ChartContext.activeIndicators` = minimal proven indicator-specific runtime core на active path.

### Что это означает

- owner минимального indicator-specific runtime state = `ChartContext`;
- внутри `activeIndicators` сейчас живут:
  - activation;
  - visibility;
  - params;
  - settings;
- renderer paths не владеют indicator state;
- `ChartRenderer`, `useChartIndicators`, `MultiPaneChart` только читают indicator state и применяют branch-specific render behavior;
- selection truth не входит в indicator layer;
- source truth не входит в indicator layer;
- failure truth не входит в indicator layer.

### Граница решения

`8.1` не фиксирует полный indicator contract.

`8.1` не утверждает, что внутренняя структура indicator state уже окончательно нормализована.

`8.1` фиксирует только:

- minimal proven runtime core;
- owner-boundary;
- renderer-consumer split.

---

## 8.2 — Indicator Mode Behavior Map

### Принятая truth-formula

На active path indicator domain имеет единый runtime owner state, но не имеет единого mode behavior contract across renderer branches.

### Что это означает

- single-pane сейчас является основной и более полной indicator-render веткой;
- multi-pane сейчас является узкой gated branch для `RSI` и `volume`;
- multi-pane использует более узкий branch-specific renderer contract;
- mixed visible sets остаются в `ChartCanvas`;
- failure scenarios принадлежат outer chart/failure truth;
- compact сейчас не является доказанным indicator mode.

### Главный вывод

Разница между single-pane и multi-pane — это не просто layout difference.

Это реальный architecture frontier внутри indicator render behavior.

---

## 8.3 — Indicator Safe / Guardrails / Frontier Matrix

### already safe

Уже можно считать достаточно доказанным:

- у индикаторов есть один основной runtime-owner;
- owner = `ChartContext`;
- минимальное runtime-ядро = `activeIndicators`;
- renderer paths не владеют state;
- renderer paths читают state;
- текущий supported set понятен:
  - `MA`;
  - `EMA`;
  - `RSI`;
  - `volume`.

### safe with guardrails

Допустимо сейчас, но не является идеальной финальной моделью:

- `MA` и `EMA` живут как overlay на основном графике;
- `RSI` и `volume` идут в нижнюю панель только при узком условии;
- mixed visible sets остаются в обычной ветке;
- compact не форсится в indicator parity;
- failure behavior остаётся во внешнем chart/failure слое;
- внутри `activeIndicators` сейчас совместно лежат activation / visibility / params / settings.

### real frontier

Главный frontier:

**один indicator domain проходит через два разных renderer contract.**

То есть:

- single-pane ветка богаче;
- multi-pane ветка уже;
- поведение между ними не одинаковое.

Главный вывод `8.3`:

**главный frontier сейчас не owner state, а split renderer contract.**

---

## 8.4 — Bounded Indicator Frontier Decision Pass

### Принятая truth-formula

Дальнейшая работа после `8.4` нужна не по всему indicator layer, а только по одной bounded frontier-surface:

**split renderer contract и cross-branch mode divergence, anchored в exact current multi-pane parity cell for the same ownership / authority / init-runtime model.**

### Что открыто

- renderer contract split;
- cross-branch mode divergence;
- current `MultiPaneChart` parity cell for the same ownership / authority / init-runtime model.

### Что не открыто

- full indicator redesign;
- future indicator wishlist;
- catalog redesign;
- registry redesign;
- builders redesign;
- compact indicator parity;
- indicator-specific failure model;
- MA/EMA multi-pane parity;
- broad placement semantics.

### Accepted limitations with guardrails

- internal separation of activation / visibility / params / settings;
- compact applicability;
- current branch-specific visual differences.

### Deferred

- indicator-specific failure behavior.

---

## 8.5 — MultiPane Indicator Contract Parity Slice

### Принятая truth-formula

Minimum shared renderer contract between single-pane and current multi-pane branch is narrower than full indicator parity.

Обе ветки должны разделять одну и ту же смысловую truth по:

- activation;
- identity;
- visibility.

Для `RSI` дополнительно обязательны:

- semantic parity по `params.period`;
- semantic parity по level-visibility behavior.

### Required now

- activation truth;
- identity truth;
- visibility truth;
- для `RSI`: `params.period`;
- для `RSI`: level-visibility behavior.

### Optional for later parity

- `currentInterval`;
- `currentTimeframe`;
- `currentCandleType`;
- broader payload/cache symmetry.

### Acceptable branch-specific for now

- branch-specific visual implementation details;
- fixed pane layout mechanics under exact current gate.

### Explicit exclusions

- mixed visible sets;
- compact;
- indicator-specific failure behavior;
- future indicator expansion;
- broader placement semantics;
- `MA / EMA` multi-pane parity;
- catalog / registry / builders redesign;
- broad indicator redesign.

---

## Итог по Phase 8

`Phase 8` закрыта как working decision / architecture pass.

Зафиксировано:

- minimal indicator runtime core;
- owner-boundary;
- renderer-consumer split;
- mode behavior map;
- safe / guardrails / frontier classification;
- bounded indicator frontier;
- minimum shared renderer contract для current gated scope.

Не переоткрывать `8.1–8.5` без genuinely new runtime/code evidence.

Retained bounded frontier вокруг current `MultiPaneChart` parity остаётся documented dependency, но не равен всей закрытой `Phase 8`.

---

# DOCS SYNC

## Synced stable docs

После закрытия `9.1–9.3` синхронизированы:

- `FG_CHART_ARCHITECTURE_MAP.md`;
- `FG_CHART_STABILIZATION_PLAYBOOK.md`;
- `FG_CHART_ENGINE_PLAYBOOK.md`.

## Current sync status

Stable docs now reflect:

- `Task 5` matrix;
- `Phase 6` compact freeze;
- `Phase 7` `MultiPaneChart` branch truth;
- `Phase 8` indicator architecture model;
- `Phase 9` entry;
- `9.1` completed indicator chain evidence;
- `9.2` accepted visual contract: `price + optional MA + optional EMA + max one lower pane`;
- `9.3` completed `MA/EMA` overlay stabilization and cache-key fix;
- next safe entry: `9.4 — RSI / Volume single lower-pane stabilization`;
- patch readiness for `9.4`: no;
- retained exact `MultiPaneChart` parity cell;
- shared visual consumer / failure presentation as later frontier;
- broader authority-chain unification as separate frontier.

## Что синхронизировано в `FG_CHART_ARCHITECTURE_MAP.md`

Документ теперь фиксирует:

- current chart-system architecture;
- owner map;
- accepted compact role;
- Phase 7 closure;
- Phase 8 indicator model;
- current retained frontiers;
- Phase 9 status after `9.1–9.3`;
- accepted `9.2` visual contract;
- `9.3` `MA/EMA` closure;
- next safe entry `9.4`.

## Что синхронизировано в `FG_CHART_STABILIZATION_PLAYBOOK.md`

Документ теперь фиксирует:

- рабочий порядок;
- closed/open zones;
- Phase 7 accepted boundary summary;
- Phase 8 accepted decision summary;
- non-reopen rules;
- retained exact `MultiPaneChart` parity cell;
- Phase 9 indicator stabilization status;
- `9.4` entry rule;
- pre-patch narrowing rule.

## Что синхронизировано в `FG_CHART_ENGINE_PLAYBOOK.md`

Документ теперь фиксирует:

- `9.1`-`9.3` indicator visual contract updates;
- current engine-level contract asymmetry;
- minimum shared renderer contract;
- exact current `MultiPaneChart` gate;
- MA/EMA cache-key rule;
- regression hotspot: `SBER + MA + EMA -> GAZP`;
- что required now;
- что optional later;
- что excluded from bounded parity slice.

---

# TIMELINE

## Сессия 03.04.2026

### Что было к концу сессии

- полностью закрыты `Tasks 1–4`;
- сделан общий implementation tranche по `Task 3 + Task 4`;
- проведён acceptance QA на `3100` и `3101`;
- найден и закрыт follow-up bugfix по initial REST expanded summary bootstrap;
- следующей задачей был определён:

  **Task 5 — Feature-Safe Zones Matrix**

### Ключевой stop-point 03.04

На момент конца этой сессии:

- `Task 5` ещё не была начата;
- после неё по плану должна была идти:

  **Phase 6 — Compact Classification / Possible Compact-Specific Pass**

---

## Сессия 04.04.2026

### Что было сделано в начале

Восстановили рабочий режим:

- сначала WHY, потом HOW;
- ответы через MODE;
- по кодовой базе — сначала Serena/Codex anchor;
- по библиотекам / API / версиям — сначала Context7;
- risky changes — только через anchor;
- browser/runtime checks отдельно от code reasoning;
- SHORT по умолчанию, подробно — в тяжёлых фазах.

Отдельно подтвердили FG philosophy / DNA:

- FG — финансовый инструмент и когнитивная среда инвестора;
- FG помогает думать, а не “помогает заработать”;
- данные не скрываются системой без явного действия пользователя;
- чем резче рынок, тем спокойнее интерфейс;
- рост строится через доверие, ясность и честность, а не через срочность и FOMO.

Отдельно подтвердили stable chart docs как рабочую карту системы.

### Что сделали по сути

- разобрали длинную цепочку handoff марта и начала апреля;
- зафиксировали минимальный рабочий набор контекста;
- закрыли `Task 5`;
- выявили later frontier по shared visual consumer / failure presentation layer below App;
- закрыли `Phase 6` с решением `Variant A: compact frozen`;
- синхронизировали это во все три stable docs;
- довели документы до согласованного состояния.

### Почему остановились здесь

- у Codex заканчивался недельный лимит;
- `Task 5` и `Phase 6` уже дали чистый stop-point;
- было бы опасно заходить в новую тяжёлую фазу на последних остатках токенов.

---

## Сессия 23.04.2026 — Phase 7 closure

### Что было сделано

- открыли `Phase 7 — MultiPaneChart Branch Model / Parity Pass`;
- не переоткрывали `Tasks 1–6`;
- не смешивали `Phase 7` с broad indicator redesign;
- разобрали current `MultiPaneChart` branch truth;
- классифицировали `RSI-only` lower-pane reflow;
- собрали narrow parity map;
- приняли решение не считать current `MultiPaneChart` fully frozen limited branch;
- оставили retained narrow parity tail.

### Принятые решения

- `RSI-only` lower-pane reflow = expected current effect of current pane-model, не automatic defect;
- current `MultiPaneChart` branch не parity-complete;
- full `MultiPaneChart` parity не доказан;
- retained frontier = narrow `MultiPaneChart` parity tail;
- future indicator architecture вынесена в `Phase 8`.

### Итог

`Phase 7` закрыта как decision / boundary pass.

Next step moved to:

**Phase 8 — Indicator Architecture Pass**

---

## Сессия 23.04.2026 — Phase 8 closure

### Что было сделано

- открыли `Phase 8 — Indicator Architecture Pass`;
- последовательно собрали `8.1–8.5`;
- приняли working decision slices;
- синхронизировали current-state и stable docs;
- убрали wording, будто `Phase 8` ещё активна;
- зафиксировали вход в `Phase 9`.

### Принятые решения

- `ChartContext.activeIndicators` = minimal proven indicator-specific runtime core;
- owner = `ChartContext`;
- renderer paths = consumers, not owners;
- current behavior splits into richer single-pane path and narrow gated multi-pane path;
- mixed visible sets stay on `ChartCanvas`;
- failure truth remains outside indicator layer;
- compact is not a proven indicator mode;
- real frontier = split renderer contract / cross-branch divergence;
- retained frontier bounded to exact current `MultiPaneChart` parity cell;
- minimum shared renderer contract defined for current gated scope.

### Итог

`Phase 8` закрыта как working decision / architecture pass.

Next step moved to:

**Phase 9 — Broad Feature / Design Phase**

---

# STARTER BLOCK FOR NEXT SESSION

> Мы работаем в `FG Chart Architecture Stabilization Sprint`.
>
> `Tasks 1–5` закрыты.
>
> `Phase 6` закрыта: compact frozen as accepted direct App-owned path.
>
> `Phase 7` закрыта как `MultiPaneChart` decision / boundary pass.
>
> `Phase 8` закрыта как working indicator architecture decision pass.
>
> Current entry: `Phase 9 — Broad Feature / Design Phase`.
>
> Phase 9 first working plan:
> `docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`
>
> 9.1 completed: code anchor + runtime visual evidence on 3100/3101.
>
> 9.2 accepted / closed: visual contract = `price + optional MA + optional EMA + max one lower pane`.
>
> 9.3 completed / closed: `MA/EMA` cache-key fix confirmed on `[3000]`, `SBER -> GAZP`, `FIX CONFIRMED`, `STABLE`.
>
> Immediate next step:
> `9.4 — RSI / Volume single lower-pane stabilization`
>
> Latest handoff:
> `.claude/handoffs/2026-05-03-phase-9-1-9-3-indicator-visual-behavior-handoff.md`
>
> Scope:
> current 4 indicators only: `MA`, `EMA`, `RSI`, `Volume`;
> no new indicators before current 4 are visually truthful and stable in `Expanded`.
>
> Retained bounded dependency: exact current `MultiPaneChart` parity cell.
>
> Later frontiers:
> - Shared visual consumer / failure presentation layer below `App`;
> - broader authority-chain unification.
>
> Do not reopen `Tasks 1–6`, `Phase 7`, `Phase 8.1–8.5` without genuinely new runtime/code evidence.

---

# Короткий итог

Этот файл фиксирует актуальную stop-point точку после закрытия `Tasks 1–5`, `Phase 6`, `Phase 7` и `Phase 8`.

Верхние ownership, failure, sourceAuthority, compact, `MultiPaneChart` branch truth и bounded indicator architecture decisions уже приняты.

`Phase 8` закрыта через `8.1–8.5` как working decision / architecture pass.

Текущий вход:

**Phase 9 — Broad Feature / Design Phase**

Первый рабочий срез Phase 9 теперь закрыт через:

- `9.1 — read-only anchor`
- `9.2 — accepted visual contract`
- `9.3 — MA/EMA overlay stabilization`

Следующий шаг:

`9.4 — RSI / Volume single lower-pane stabilization`

Рабочий план хранится в:

`docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`

Закрытые решения не переоткрываются без новых runtime/code доказательств.

Открытыми остаются только отдельные bounded/later frontiers:

- exact current `MultiPaneChart` parity cell;
- Shared visual consumer / failure presentation layer below `App`;
- broader authority-chain unification.

Главное правило для следующей работы:

**Фаза 9 начинается поверх закрытой архитектурной базы, а не с повторного спора о ней.**
