# FG Analytical Workspace Shell and Search Integration Sprint Contract

## Status

`active / Phase 1 completed / Phase 2 pending`

- sprint contract accepted by Owner;
- sprint activated;
- source routing updated;
- authoritative current-state created;
- `Phase 1` authoritative closure accepted.
- `AnalyticalWorkspaceShell` / `Phase 2` implementation has not started.
- `dc6c06e feat(results): finalize visual baseline` remains the accepted pre-shell `Results` baseline.
- `Phase 2` is the next step.

## Purpose

Объединить существующий `SearchForm` и существующий `Results` в единый analytical workspace после успешного выбора инструмента.

## Product outcome

Пользователь:

1. видит стартовую строку поиска;
2. выбирает инструмент;
3. получает единый аналитический экран;
4. продолжает использовать ту же строку поиска внутри workspace;
5. может переключать инструменты без преждевременного разрушения текущего результата.

## Accepted foundations

Закрытые baselines:

- `FG Analytical Workspace UX Design Sprint`
- `Search Suggestions / Instrument Picker V1`
- `SearchForm Browse V1`
- `SearchForm Search Suggestions V1`
- `0af5b2d feat(app): stabilize ticker switch and chart request identity`

Для `0af5b2d` принимается:

- разделены `draft / pending / active ticker`;
- primary ticker commit атомарный;
- старый workspace сохраняется во время switching;
- stale/unknown chart responses guarded.

Guard:

`do not reopen without genuinely new runtime evidence`

## Scope

В scope:

- новая presentation-only оболочка `AnalyticalWorkspaceShell`;
- общая композиция `SearchForm + Results`;
- `SearchForm` variants `entry` и `workspace`;
- workspace visual states;
- editing / switching / failure presentation;
- picker layering;
- reset navigation через логотип FG;
- chamfered visual language;
- border-only analytical frame;
- visual/runtime QA;
- sprint closure и handoff.

## Non-goals

- no `SearchForm` V1 behavior redesign;
- no duplicate `SearchForm`;
- no moving `SearchForm` ownership into `Results`;
- no backend work;
- no database work;
- no chart internals;
- no indicators;
- no `MultiPaneChart` changes;
- no dashboard;
- no `News` redesign;
- no `AI / Summary`;
- no broad `App.js` rewrite;
- no new chart/socket/cache logic in `App.js`;
- no `useChartSocketBridge` extraction;
- no broad frontend redesign outside the workspace slice.

## Ownership contract

### `App.js`

Разрешено только:

- minimal orchestration wiring;
- передача presentation props;
- существующий active/pending lifecycle.

Запрещено:

- новая chart/socket/cache logic;
- broad responsibility expansion.

### `SearchForm`

Владеет:

- input;
- picker;
- browse;
- suggestions;
- recent;
- loading / error / no-results;
- confirmed ticker selection.

Не владеет:

- `Results` layout;
- chart;
- metrics;
- `News`;
- workspace data loading.

### `AnalyticalWorkspaceShell`

Владеет только:

- layout;
- spacing;
- layering;
- decorative frame;
- placement of `SearchForm` and `Results`.

Не владеет:

- fetch;
- socket;
- ticker identity;
- chart state;
- result data;
- search behavior.

### `Results`

Остаётся владельцем существующей result composition.

Не становится владельцем `SearchForm`.

## Visual contract

- chamfered geometry является визуальным языком FG;
- используется осознанно на shell, крупных карточках и значимых панелях;
- не применяется механически ко всем мелким элементам;
- shell — border-only;
- functional root сохраняет `overflow: visible`;
- `clip-path` на functional root запрещён;
- decorative layer имеет `pointer-events: none`;
- picker/dropdown не должен обрезаться;
- тяжёлая общая заливка workspace не является default;
- интерфейс остаётся спокойным и аналитическим.

## Workspace states

- `entry-idle`
- `entry-picker-open`
- `workspace-idle`
- `workspace-editing`
- `workspace-switching`
- `workspace-error`

Contract:

- editing меняет draft, но не active ticker;
- текущий `Results` остаётся видимым;
- picker открывается поверх `Results`;
- switching не выдаёт pending ticker за active;
- failed switch сохраняет старый workspace;
- `Escape` и outside click отменяют editing;
- `×` очищает draft, но не уничтожает active workspace;
- полный возврат в entry выполняется через логотип FG.

These are target interaction contracts for Phases 3-4, not a claim that all clear/reset behavior is already implemented in the current runtime baseline.

## Sprint phases

### Phase 0 — Sprint activation and source routing

Status:

`completed / activation accepted`

Задачи:

- Owner review sprint contract;
- создать новый authoritative current-state для этого sprint;
- обновить `FG_ACTIVE_SOURCE_PACK.md`;
- назначить sprint как active;
- зафиксировать Phase 1 как next safe entry;
- не менять product code.

DoD:

- sprint contract accepted;
- current-state created;
- source routing updated;
- active sprint виден Codex;
- Phase 1 назначена официальным next step.

### Phase 1 — Current composition anchor

Status:

`completed / accepted / PATCH-READY FOR PHASE 2`

Задачи:

- установить текущую композицию `App -> SearchForm -> Results`;
- определить DOM owner;
- определить state/props flow;
- определить CSS owners;
- найти точку подключения shell;
- сформировать exact implementation allowlist.

DoD:

- code-level evidence;
- patch-ready anchors;
- authoritative `Phase 1` record created;
- no `Phase 2` shell implementation;
- `Phase 1` anchor remained read-only;
- supporting pre-shell `Results` visual baseline is recorded separately by commit `dc6c06e`.

### Phase 2 — AnalyticalWorkspaceShell

Status:

`pending / not started`

Задачи:

- создать отдельный presentation-компонент;
- создать отдельный CSS;
- реализовать border-only frame;
- реализовать безопасную chamfered geometry;
- сохранить dropdown overflow/layering.

DoD:

- shell не владеет data/lifecycle;
- existing `SearchForm` и `Results` не дублируются;
- visual QA базовой композиции пройден.

### Phase 3 — SearchForm presentation variants

Задачи:

- добавить `entry` и `workspace`;
- сохранить одну behavioral logic;
- не переоткрывать Browse/Suggestions/Recent/Error behavior;
- встроить workspace command bar в shell.

DoD:

- один `SearchForm`;
- обе presentation variants работают;
- accepted `SearchForm` V1 states не сломаны.

### Phase 4 — Workspace interaction integration

Задачи:

- `workspace-idle`;
- `workspace-editing`;
- `workspace-switching`;
- `workspace-error`;
- picker over workspace;
- cancel / clear / reset behavior;
- минимальная wiring через `App.js`.

DoD:

- draft не разрушает active workspace;
- successful switch коммитит новый ticker;
- failed switch сохраняет старый;
- full reset возвращает entry.

### Phase 5 — Visual and runtime QA

Обязательные сценарии:

1. empty entry;
2. Browse Mode;
3. typed suggestions;
4. first successful submit;
5. active workspace;
6. editing over existing `Results`;
7. successful ticker switch;
8. failed ticker switch;
9. draft clear;
10. `Escape`;
11. outside click;
12. full reset through FG logo;
13. Compact chart;
14. Expanded chart;
15. no picker clipping;
16. no runtime errors.

DoD:

- evidence table;
- no regression в закрытых slices;
- visual contract подтверждён.

### Phase 6 — Closure

Задачи:

- final review;
- exact-file commit;
- current-state update;
- source-pack update;
- closure handoff;
- sprint archive only after accepted closure;
- зафиксировать следующий frontier.

DoD:

- sprint status completed;
- handoff created;
- authority sources synced;
- technical debt записан, если что-либо сознательно deferred;
- task не считается закрытой без QA evidence.

## Commit discipline

- один bounded phase/slice — один осознанный commit;
- exact file allowlist;
- no `git add .`;
- перед commit проверяется cached diff;
- dirty unrelated files не включаются;
- commit только после verification.

## Risk register

- duplicate `SearchForm` risk: mitigation — сохранять один component owner и variants-only approach.
- hidden lifecycle ownership risk: mitigation — не расширять ownership `AnalyticalWorkspaceShell` и не добавлять новую lifecycle logic в `App.js`.
- picker clipping risk: mitigation — `overflow: visible`, no `clip-path` on functional root, explicit layering QA.
- broad `App.js` growth risk: mitigation — ограничить `App.js` minimal orchestration wiring.
- accidental reopening of `SearchForm` V1: mitigation — считать Browse/Suggestions/Recent/Error closed baseline.
- chart regression risk: mitigation — не трогать chart internals и проверять Compact/Expanded в QA phase.
- visual overuse of chamfered geometry: mitigation — применять chamfer только к shell и значимым крупным surfaces.

## Exit criteria

Sprint завершён, когда:

- один `SearchForm` работает в `entry/workspace`;
- `SearchForm` и `Results` визуально объединены;
- shell presentation-only;
- switching/failure lifecycle не сломан;
- picker не обрезается;
- chamfered visual language принят визуально;
- Compact/Expanded работают;
- QA пройден;
- docs/current-state/source pack/handoff синхронизированы;
- closure commit принят.

## Historical immediate next step after contract creation

`MODE: ANCHOR / PHASE 1 CURRENT COMPOSITION`

## Current next safe entry

`MODE: EXECUTE / PHASE 2 ANALYTICAL WORKSPACE SHELL`

Authoritative current-state wins for the current stop-point and immediate next step.
