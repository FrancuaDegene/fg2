# Handoff: FG Chart Phase 7 — закрытие `7.1`, `7.2` и следующий старт с `7.3`, `7.4`

## 1. Метаданные сессии
- Создан: 2026-04-19 21:48:49 Europe/Moscow
- Проект: `D:/Projects/FG/fg/FG2`
- Ветка: `fix/toolbar-range-contrast`
- Продолжает: [2026-04-04-152104-fg-chart-task5-task6-closure-and-next-frontiers.md](D:/Projects/FG/fg/FG2/.claude/handoffs/2026-04-04-152104-fg-chart-task5-task6-closure-and-next-frontiers.md)
- Тип сессии: decision / runtime QA / docs-sync checkpoint внутри `Phase 7`
- Примечание по валидации: scripts из `session-handoff` не удалось запустить в этом shell, потому что `python` / `py` launcher недоступны; handoff собран вручную по template skill-а и проверен на полноту без validator output.

### Последние коммиты для контекста
- `614212a feat(ai): add fg-chart-architect skill`
- `79797f0 feat(chart): introduce FG time navigation and viewport diagnostics`
- `c11da10 fix(toolbar): restore compact range dropdown one-piece + layout`
- `bb2be90 fix(toolbar): restore glass tokens for compact range dropdown`
- `5439735 chore: checkpoint before recovery`

## 2. Цель этой сессии
- Продолжить работу внутри `FG Chart Architecture Stabilization Sprint`, не переоткрывая `Tasks 1-6`.
- Работать только внутри `Phase 7 - MultiPaneChart Branch Model / Parity Pass`.
- Закрыть первые bounded slices, которые можно безопасно зафиксировать:
  - `7.1 current visual contract`
  - `7.2 runtime regression layer`
- Сохранить чистую точку продолжения для следующей сессии:
  - `7.3 expected pane reflow vs visual defect`
  - `7.4 narrow parity map for current indicators`

## 3. Authority и stop-point
- Авторитетный top-level stop-point по-прежнему задаётся файлом [FG_sources_ready_current_state_2026-04-04.md](D:/Projects/FG/fg/FG2/docs/project/state/FG_sources_ready_current_state_2026-04-04.md):
  - следующий immediate phase всё ещё `Phase 7 - MultiPaneChart Branch Model / Parity Pass`
- В этой сессии `current-state` файл не обновлялся.
- Что реально установлено в этой сессии:
  - внутри активной `Phase 7` закрыт `Slice 7.1`
  - внутри активной `Phase 7` закрыт `Slice 7.2`
- Практическое правило продолжения:
  - top-level authority остаётся за `current-state`
  - дальше новая сессия должна продолжать уже из stable docs + этого handoff, начиная с `7.3`

## 4. Что закрыто
### `7.1 - Current visual contract`
- `7.1` закрыт как **current operational truth**, а не как финально утверждённый UX.
- Принятая текущая operational truth:
  - `MA` = только overlay в `ChartCanvas`
  - `EMA` = только overlay в `ChartCanvas`
  - `RSI` = отдельный bottom pane только под exact current `MultiPaneChart` gate; иначе текущий fallback остаётся в `ChartCanvas`
  - `Volume` = отдельный bottom pane только под exact current `MultiPaneChart` gate; иначе текущий fallback остаётся в `ChartCanvas`
  - exact current gate:
    - `isExpanded`
    - ровно один видимый индикатор
    - видимый индикатор = `rsi` или `volume`
  - mixed visible sets остаются в `ChartCanvas`
  - forced lower-pane parity в current operational truth нет
- Важная негативная граница:
  - это **не** означает final approved UX
  - это **не** означает parity-complete mixed sets
  - это **не** означает full `MultiPaneChart` parity

### `7.2 - Runtime regression layer`
- `7.2` закрыт по runtime QA во всех актуальных локальных окружениях:
  - `3000` = PASS
  - `3100` = PASS
  - `3101` = PASS
- Что подтверждено:
  - old crash-class `Uncaught Error: Value is null` не воспроизвёлся
  - console/runtime errors в проверенных сценариях не найдены
  - текущая indicator runtime stability подтверждена
  - `RSI only` stable
  - `Volume only` stable
  - `RSI -> Volume -> RSI` stable
  - timeframe / interval smoke stable
  - mixed sets не роняют приложение
- Важная граница:
  - закрытие `7.2` **не** означает visual parity
  - закрытие `7.2` **не** означает final approved UX

## 5. Что было реально исправлено в коде
- В repo state присутствует targeted fix для transient crash-window в `lightweight-charts` вокруг cleanup / removal line-like series.
- Смысл fix-а:
  - очищать crosshair перед очисткой / удалением line-like series
- Файлы, где этот fix зафиксирован:
  - `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
  - `fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js`
  - `fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js`
  - `fingineerwebapp/src/charts/series/rsi.js`
- Полезные anchors:
  - [useChartData.js#L52](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L52)
  - [useChartIndicators.js#L5](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js#L5)
  - [useLightweightChart.js#L5](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js#L5)
  - [rsi.js#L6](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/series/rsi.js#L6)

## 6. Какое новое доказательство получено
### По indicator visual model
- Текущая visual model индикаторов теперь явно зафиксирована как двухклассная:
  - overlay
  - bottom pane
- `MA` / `EMA` остаются overlay class.
- `RSI` / `Volume` остаются current bottom-pane class только под exact current `MultiPaneChart` gate.

### По формулам
- `MA` / `EMA` math локально проверены.
- parity формулы `RSI` между single-pane и `MultiPane` локально проверена на проверенном fixture.
- Следствие:
  - formula suspicion заметно ослаблен
  - главный оставшийся фокус теперь не в math correctness, а в `MultiPane` visual/runtime/pane-model parity

### По маршрутизации визуальных симптомов
- `RSI-only` main-chart change / reflow относится к `Phase 7 / Slice 7.3`
- `MA + RSI` и `EMA + RSI` strange mixed rendering относятся к `Phase 7 / Slice 7.4 -> 7.5`
- Это **не** отдельные внешние задачи.
- `Phase 8` сейчас открывать нельзя.

## 7. Что было досинкано в stable docs
- `7.1` current visual contract теперь синхронизирован в stable docs:
  - [FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md)
  - [FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md)
  - [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md)
- Важное session rule, которое надо сохранить:
  - если что-то нужно зафиксировать для FG chart work, это должно синкаться в:
    - `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
    - `docs/domain/FG_CHART_ARCHITECTURE_MAP.md`
- Полезные anchors:
  - [FG_CHART_ARCHITECTURE_MAP.md#L398](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md#L398)
  - [FG_CHART_STABILIZATION_PLAYBOOK.md#L921](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md#L921)
  - [FG_CHART_ENGINE_PLAYBOOK.md#L139](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L139)

## 8. Что остаётся открытым внутри `Phase 7`
### `7.3 - expected pane reflow vs visual defect`
- Нужно классифицировать `RSI-only` поведение ровно в один bucket:
  - expected pane reflow
  - visual defect
  - not proven yet

### `7.4 - narrow parity map for current indicators`
- Нужно классифицировать mixed-set поведение (`MA/EMA + RSI`) ровно в один bucket:
  - accepted current limitation
  - real parity gap
  - not proven yet

### `7.5 - phase decision`
- Нужно принять решение:
  - `MultiPane frozen as limited branch`
  - или `bounded parity roadmap`

### `7.6 - boundary to Phase 8`
- Нужно явно отложить в `Phase 8` всё, что относится к будущей indicator architecture:
  - unified indicator architecture
  - новые индикаторы
  - registry / builders
  - broader indicator layer evolution

## 9. Жёсткая зона do-not-reopen
Не переоткрывать ничего из списка ниже без genuinely new runtime evidence:
- `Tasks 1-6`
- закрытый `branch-entry gate` slice
- `MultiPane warnings tail`
- `Stage 2 / Slice 1`
- accepted `currentCandleType` owner slice
- локальные closed slices из `Stage 3`
- revisit `compact`
- later frontier `shared visual consumer / failure presentation`

## 10. Важный контекст для следующего агента
- Worktree в repo грязный и содержит несвязанные изменения вне этого checkpoint; нельзя считать весь текущий `git diff` результатом именно этой сессии.
- `current-state` остаётся authoritative top-level stop-point. Этот handoff — supporting evidence only.
- Stable docs теперь являются canonical местом для принятой operational truth из `7.1`.
- Runtime QA из `7.2` уже покрывает актуальные локальные окружения; по умолчанию его не нужно гонять заново, если не появится новое runtime evidence.
- Главная открытая проблема теперь уже не formulas и не crash regression. Главная открытая проблема — **visual/runtime/pane-model classification внутри `Phase 7`**.

## 11. Точная точка старта следующей сессии
Следующая сессия должна стартовать прямо отсюда:
1. [FG_sources_ready_current_state_2026-04-04.md](D:/Projects/FG/fg/FG2/docs/project/state/FG_sources_ready_current_state_2026-04-04.md)
2. [FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md)
3. [FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md)
4. [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md)
5. этот handoff

Дальше стартовать только с `Phase 7 / Slice 7.3`:
- классифицировать `RSI-only` reflow как expected effect vs visual defect vs not proven yet

После `7.3` переходить в `7.4`:
- классифицировать `MA/EMA + RSI` mixed behavior как accepted limitation vs real parity gap vs not proven yet

## 12. Рекомендуемая первая задача для следующего Codex
Сделать узкий anchor-first pass для `7.3`:
- взять stable docs как boundary context
- смотреть только текущий `RSI-only` `MultiPane` runtime/display path
- развести:
  - expected pane height redistribution
  - actual visual defect
  - not proven yet
- не дрейфовать в `7.4+`, пока `7.3` не классифицирован

## 13. Проверка на update playbook
- Требовала ли эта сессия обновления `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`?
  - **YES**
- Статус:
  - нужный playbook sync уже сделан в этой сессии
  - соответствующий section теперь фиксирует accepted current visual contract для existing indicators
