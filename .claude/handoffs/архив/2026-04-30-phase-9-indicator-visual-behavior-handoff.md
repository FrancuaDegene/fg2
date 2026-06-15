# Session Handoff — Phase 9 Indicator Visual Behavior

## 1. Статус

- `Phase 9 — Broad Feature / Design Phase` открыта.
- `9.1 — read-only anchor` закрыта.
- Вся `Phase 9` не закрыта.
- Следующий шаг: `9.2 — decision: минимальный visual contract для overlay + one lower-pane`.
- Patch readiness: no.

## 2. Что было сделано в этой сессии

- Создан и обновлён рабочий план `docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`.
- В план добавлена безопасная граница первого прохода: один lower-pane indicator за раз.
- `9.1` зафиксирована как completed.
- Обновлён authoritative current-state файл `docs/project/state/FG_sources_ready_current_state_2026-04-04.md`.
- Current-state теперь указывает next step `9.2`.
- `Phase 8` не переоткрывалась.
- Код не менялся.

## 3. Итог `9.1A — code anchor`

- Меню содержит 4 текущих индикатора: `MA`, `EMA`, `RSI`, `Volume`.
- State owner = `ChartContext.activeIndicators`.
- `MA` / `EMA` идут через overlay path.
- Одиночные `RSI` / `Volume` идут через `MultiPaneChart`.
- `RSI` и `Volume` являются взаимоисключающими lower-pane индикаторами.
- Mixed scenarios уходят в fallback path.
- `RSI + Volume` normal menu path не является текущей целью.

## 4. Итог `9.1B — runtime visual evidence`

- Проверено на `3100` через `npm run start:test:rest`.
- Проверено на `3101` через `npm run start:test:app`.
- `MA` работает как overlay.
- `EMA` работает как overlay.
- `MA + EMA` работают вместе.
- `RSI` один создаёт lower-pane.
- `Volume` один создаёт lower-pane.
- `RSI -> Volume` и `Volume -> RSI` заменяют lower-pane без двух нижних панелей.
- Console errors: 0.
- Поведение `3100` и `3101` совпало.

## 5. Главный найденный decision point

Mixed scenarios:

- `MA + RSI`
- `EMA + RSI`
- `MA + Volume`
- `EMA + Volume`

Сейчас эти сценарии технически работают через fallback-like behavior в одном plot group, но не дают целевой UX:

`overlay + lower-pane`

Это не аварийный баг, а decision point для `9.2`.

## 6. Предварительный целевой visual contract для `9.2`

Proposed / to decide, не реализовано:

- `MA` и `EMA` — overlay-индикаторы.
- `MA` и `EMA` могут сосуществовать.
- `RSI` и `Volume` — lower-pane индикаторы.
- Одновременно активный lower-pane индикатор только один.
- Overlay + один lower-pane должны работать вместе.
- `RSI + Volume` не входит в первый проход.
- Все 4 сразу не входят в первый проход, потому что это два lower-pane индикатора.
- Несколько lower-pane индикаторов — later, отдельный decision pass.

## 7. Что не делать дальше

- Не добавлять `Bollinger Bands`, `ATR`, `OBV`.
- Не открывать полный redesign `MultiPaneChart`.
- Не открывать поддержку нескольких lower-pane.
- Не переоткрывать `Phase 8.1–8.5`.
- Не считать mixed scenarios approved без `9.2`.
- Не патчить routing/gate без отдельного anchor.
- Не считать всю Phase 9 закрытой.

## 8. Следующий шаг

Immediate next step:

`9.2 — decision: минимальный visual contract для overlay + one lower-pane`

Цель `9.2`:

Принять или отклонить контракт:

- overlays сверху;
- один lower-pane снизу;
- overlay + один lower-pane вместе;
- несколько lower-pane later.

После `9.2`, если контракт принят, следующий технический шаг:

read-only routing/gate anchor:

`как провести MA/EMA overlays вместе с RSI/Volume lower-pane, не открывая поддержку нескольких lower panes`

## 9. Files changed in this session

В этой рабочей сессии были обновлены:

- `docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`
- `docs/project/state/FG_sources_ready_current_state_2026-04-04.md`

Создан новый handoff-файл:

- `.claude/handoffs/2026-04-30-phase-9-indicator-visual-behavior-handoff.md`

## 10. Final stop-point

`9.1 completed. Phase 9 remains open. Next: 9.2 decision. Patch readiness: no.`
