---
name: fg-frontend-debug
description: Навык диагностики frontend-проблем в FG2 для React UI и поведения графиков. Использовать при визуальных регрессиях, сбоях chart lifecycle, hover, resize, pan, zoom и несогласованном UI state, когда до patch нужно отделить ownership-ошибки от rendering-ошибок и data-contract-ошибок.
---

# Отладка frontend FG2

## Когда использовать
- Диагностировать визуальные баги во `frontend` (`React` UI, `chart` interaction, lifecycle).
- Разбирать симптомы `hover`, `resize`, `pan`, `zoom`, а также расхождения между ожидаемым и фактическим поведением графика.
- Проверять, где ошибка: `ownership/state`, `render/lifecycle` или `data-contract`.
- Готовить минимальный обратимый `patch` только после доказательной привязки к коду.

## Рабочий процесс
1. Зафиксировать симптом.
   - Описать путь воспроизведения, `expected vs actual`, частоту и условия появления.
2. Воспроизвести в integrated browser.
   - Работать с `http://localhost:3000`, поставить `breakpoint` в подозрительном участке, подтвердить фактический поток событий.
3. Определить слой.
   - `ownership`: кто владеет состоянием и переходами.
   - `render/lifecycle`: `mount/unmount`, `resize path`, `hover/crosshair flow`, `pan/zoom event handling`.
   - `data-contract`: форма/порядок данных и границы `frontend`↔`data source`.
4. Назначить owner.
   - Указать конкретный компонент/`hook`/адаптер или контрактную границу, где находится причина.
5. Собрать anchors.
   - Минимум один статический anchor (`file path + code identifier`) и один runtime anchor (`breakpoint hit`, `event order`, факт `payload`).
6. Принять решение о `patch`.
   - Строго: `symptom -> layer -> owner -> evidence -> only then patch`.
   - Если anchors нет, `patch` не делать; продолжить сбор доказательств.
7. Проверить после исправления.
   - Подтвердить устранение симптома без нарушения соседнего поведения.

## Формат вывода
Использовать короткий структурный отчёт:

```md
Кадр отладки
- Симптом:
- Слой:
- Владелец:
- Якоря доказательств:
- Гипотеза первопричины:
- Граница patch (minimal/reversible):

Компромиссы
- Надёжность (Reliability):
- Производительность (Performance):
- Гибкость (Flexibility):

Проверка
- Воспроизведение до:
- Воспроизведение после:
- Регрессионные проверки:
```

## Ограничения
- Не делать `patch` без anchor.
- Держать изменение локальным и обратимым; по умолчанию один файл.
- Не смешивать фиксы `ownership`, `rendering` и `data-contract` без явного обоснования границы.
- Сначала readability, затем performance.
- Любой `performance` шаг сопровождать проверкой `reliability` и описанием влияния на `flexibility`.
- Не добавлять оппортунистические улучшения вне исходного симптома.
