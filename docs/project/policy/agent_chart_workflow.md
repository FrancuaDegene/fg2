# Agent Chart Workflow

## Purpose

Этот файл — нормативное расширение root contracts для chart-specific workflow в FG.

Он фиксирует:
- как агент должен разбирать chart-задачи;
- в каком порядке идти от симптома к решению;
- какие chart boundaries считаются accepted;
- какие chart-срезы нельзя переоткрывать без new evidence;
- какие verification expectations обязательны.

Этот файл не задаёт source priority canon, REFRESH completeness, tool routing canon или execution mechanics.

## Chart-Specific Domain Knowledge

При работе с chart-related code агент обязан учитывать:
- `barSpacing` sensitivity в low pixel-density regimes;
- `visibleLogicalRange` side effects;
- rounding artifacts around `~0.5–1.0 px per bar`;
- conflated vs non-conflated rendering differences;
- что strict UX contracts могут требовать custom pan logic;
- что viewport ownership — это архитектурная, а не косметическая тема.

Для `compact`:
- no pan;
- native `lightweight-charts` interaction обычно допустим;
- не forcing parity с `expanded` без new evidence.

Для `expanded`:
- pan и zoom UX-critical;
- ownership и data-flow важнее косметических fixes;
- custom control layers могут быть required для сохранения invariants.

Не предлагать library upgrade или option toggling как default answer.

## FG Architectural Chain

Для серьёзных FG chart symptoms и решений использовать такую цепочку:

symptom
-> object / layer
-> owner
-> authority
-> identity
-> phase
-> mutation
-> failure
-> conflict / boundary
-> evidence
-> only then decision or patch

Нельзя сводить serious chart analysis только к owner без остальных параметров цепочки.

## Ownership Before Patch

Базовый chart rule:

symptom
-> layer
-> owner
-> evidence
-> only then patch

Patch по симптому без ownership clarity не допускается.

Если owner неясен:
- не переходить к patch planning;
- сначала resolve ownership;
- не подменять ownership reasoning косметическим workaround.

## Chart Session Flow

Для chart sessions базовый порядок такой:

1. session bootstrap / refresh
2. identify locked decisions vs open frontier
3. if external chart/library truth matters, use `Context7`
4. run chart-specific owner / authority / boundary analysis
5. get anchors
6. only then discuss patch scope
7. verify before syncing docs

Не прыгать напрямую от symptom к patch.

## Closed Slice Discipline

Нельзя переоткрывать closed slices без genuinely new evidence.

Особенно нельзя автоматически переоткрывать:
- уже принятые chart ownership decisions;
- closed stabilization slices;
- accepted compact classification;
- accepted handoff boundaries;
- accepted chart engine baselines;
- accepted current-state frontier interpretation.

Если новый symptom появился после fix:
- это не автоматически означает, что предыдущий fix был wrong;
- сначала проверить, не вскрылся ли hidden coupling;
- сначала определить, не находится ли root cause выше текущего symptom layer.

## Compact vs Expanded Boundaries

`compact` и `expanded` — разные product roles.

`compact`:
- fast visual scan path;
- не должен автоматически наследовать все navigation expectations `expanded`.

`expanded`:
- deeper analytical mode;
- navigation, viewport ownership и range behavior здесь критичнее.

Нельзя:
- forced parity между `compact` и `expanded` без new evidence;
- reopen `compact` just because `expanded` changed;
- считать visual difference bug-ом только потому, что ветки behave differently.

## Chart Risk Guardrails

Chart change считается risk-sensitive, если затрагивает:
- viewport ownership;
- `visibleRange` / `visibleLogicalRange`;
- `barSpacing`;
- pan / zoom behavior;
- `TF×interval` behavior;
- `loadMore` / history fetching;
- auto-follow logic;
- handoff boundaries;
- chart state ownership transitions.

Для таких задач:
- сначала owner / authority / boundary reasoning;
- потом anchors;
- потом только bounded patch discussion.

`architecture-safe` не означает `visual-safe`.

## Verification Expectations

Для chart tasks verification обязана различать:
- code reasoning;
- runtime evidence;
- observable visual effect.

Если задача затрагивает runtime / UI / browser behavior, нужно явно разделять:
- target found;
- action attempted;
- action succeeded / failed;
- observable effect detected;
- blocker if failed.

Code-level reasoning alone недостаточен для runtime confirmation.

## Chart-Specific Analysis Expectations

Для chart-domain analysis ожидания такие:
- preserve chart UX invariants;
- require anchors for chart-layer reasoning;
- prefer ownership fixes over cosmetic workarounds;
- protect `compact` / `expanded` role separation;
- distinguish selection, data-source, render/init и navigation layers.

Expected evidence before patching:
- affected path;
- visible symptom;
- ownership hypothesis;
- relevant anchors / code locations;
- boundary of drift that must be avoided.

## Final Guardrail

Не forcing parity между `compact` и `expanded` без evidence.
Не считать architecture-safe change автоматически visual-safe.
Не переходить к patch до ownership, boundary и evidence clarity.
