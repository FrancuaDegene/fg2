# FG Atomic Ticker Lifecycle and Chart Request Identity

Этот handoff является supporting continuity evidence only.
Он не переопределяет `AGENTS.md`, `CODEX_RULES.md`, `docs/project/state/FG_ACTIVE_SOURCE_PACK.md` или authoritative current-state.

Project Sources check at handoff time:

- active source routing entry: `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- authoritative current-state: `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`
- current project-level next safe entry from Project Sources: `MODE: DECISION / OWNER REVIEW NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SCOPE`

Важно:

- этот handoff фиксирует фактически завершённый bounded implementation slice в `fingineerwebapp/src/App.js`;
- at handoff time, current-state in Project Sources had not yet incorporated this code slice; later Project Sources accepted commit `0af5b2d` as a protected baseline;
- следующий агент обязан считать handoff supporting evidence, а не новой authority.

## Session Metadata

- Created: `2026-07-03`
- Project: `.` (FG2 repository root)
- Branch: `fix/toolbar-range-contrast`
- Session duration: `multi-turn bounded lifecycle/chart debugging and closure slice`
- Commit created in this session: `0af5b2d feat(app): stabilize ticker switch and chart request identity`
- Handoff chain: `fresh bounded handoff for this slice`

### Recent Commits (for context)

- `0af5b2d feat(app): stabilize ticker switch and chart request identity`
- `6f2afa0 docs: sync chart sprint closure and engine baseline`
- `4afc5d3 feat: add lower pane chart affordance styling`
- `e89e0b1 feat: guard chart toolbar intervals`
- `f3c6d36 feat: simplify expanded controls surface`

## Current State Summary

Сессия закрыла bounded reliability slice вокруг поиска инструмента, primary ticker lifecycle и chart request identity в `fingineerwebapp/src/App.js`. Изначальный симптом был таким: при переключении тикеров workspace мог очищаться преждевременно, а Compact/Expanded chart иногда оставался пустым или оживал только после нескольких смен тикера. В результате разделены `draft / pending / active ticker`, primary commit стал атомарным, старый workspace сохраняется до успешного нового commit, chart request identity получил уникальные `requestId` и normalized Map keys, а stale/unknown chart responses больше не должны переписывать активный workspace. Slice уже закоммичен. Runtime ручная проверка на `localhost:3000` выполнена ранее и была принята как успешная для этого bounded scope.

## Codebase Understanding

### Architecture Overview

- `App.js` владеет верхнеуровневым lifecycle:
  - `useSearch.query` остаётся draft-level surface в `SearchForm` / hook flow;
  - `App.query` теперь трактуется как committed active ticker для уже отображаемого workspace;
  - `pendingTicker` хранит подтверждённый, но ещё не committed инструмент;
  - `primaryRequestAttempt` и `primaryRequestSeqRef` управляют primary request lifecycle и stale guard.
- Primary data flow:
  - `handleSearchQuery()` нормализует ввод и обновляет `pendingTicker`;
  - `primaryRequestEffect` вызывает `fetchTickerInfo(pendingTicker, requestSeq, ...)`;
  - только успешный guarded commit обновляет `data`, `selectedDate`, `query`, `chartData` reset и active refs.
- Chart flow в `App.js`:
  - `chartRequestEffect` зависит от committed `query`, а не от draft/pending;
  - `emitChartDataRequest()` строит `key`, `rangeKey`, `selection`, ставит `pendingByRequestIdRef`;
  - Socket path обрабатывает `initialData` / `updateData`;
  - `handleInitialData` и `handleUpdateData` принимают payload только после request-id normalization и stale/active ticker проверки.
- Compact и Expanded используют разные renderer paths:
  - `Results -> Chart -> CompactSparkline` для compact;
  - `Results -> Chart -> ChartContainer` для expanded.
- В текущем `3000` Compact renderer не canvas-based. Он SVG-based и рисует `polyline` внутри `CompactSparkline`, поэтому `canvasCount=0` не является симптомом дефекта.

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `fingineerwebapp/src/App.js` | Primary search lifecycle, committed ticker ownership, chart request identity, socket handlers | Единственный изменённый продуктовый файл в этом slice |
| `fingineerwebapp/src/components/Results/Results.js` | Mount path для compact results и `<Chart />` | Подтвердил, что `Results` продолжает читать committed `query` |
| `fingineerwebapp/src/components/Results/Chart/Chart.js` | Split между compact и expanded chart rendering | Подтвердил renderer ownership boundary |
| `fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx` | Compact SVG sparkline renderer | Отверг гипотезу “Compact пустой из-за canvasCount=0” |
| `fingineerwebapp/src/components/Results/Chart/ChartContainer.js` | Expanded chart path и REST/app authority sync | Нужен для различения Compact/Expanded authority и future playbook sync |
| `fingineerwebapp/src/config/api.js` | `SOCKET_URL` / `API_BASE_URL` config | Подтвердил runtime routes `localhost:3001` для API/socket |
| `docs/project/state/FG_ACTIVE_SOURCE_PACK.md` | Current source routing authority | Зафиксировал, что handoff не заменяет current-state |
| `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md` | Authoritative current-state at handoff time | Источник текущего project-level stop-point |

### Key Patterns Discovered

- Для bounded instrument switching в FG безопасная модель такая:
  - draft живёт отдельно;
  - pending request не меняет displayed workspace немедленно;
  - committed active ticker обновляется только после successful guarded primary response.
- Для chart identity недостаточно проверять только ticker text в UI. Нужна связка:
  - unique request id;
  - normalized request-id lookup;
  - stale active-ticker guard перед `setChartData`.
- `FG_DEBUG` в `App.js` завязан только на `window.__FG_DEBUG === true`. `sessionStorage` не является источником этого флага.
- В runtime QA нельзя делать вывод “Compact не рисует график” только по `canvasCount`. Нужно сначала установить реальный renderer type из исходников.
- Repo глобально грязный. Любые будущие commits по этому slice должны продолжать exact-file discipline и не затрагивать посторонние изменения в дереве.

## Work Completed

### Tasks Finished

- [x] Разделён lifecycle `draft / pending / active ticker` в `App.js`
- [x] Введён atomic primary ticker commit без немедленного разрушения старого workspace
- [x] Добавлен stale primary response guard через `primaryRequestSeqRef`
- [x] Закрыт repeated identical pending ticker resubmit через `primaryRequestAttempt`
- [x] Закрыт stale chart response overwrite risk
- [x] Добавлен unknown requestId guard до fallback selection binding
- [x] Введены unique chart request ids и normalized string keys для `pendingByRequestIdRef`
- [x] Выполнен bounded runtime verification on `localhost:3000`
- [x] Создан commit только с `fingineerwebapp/src/App.js`

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `fingineerwebapp/src/App.js` | Добавлены `pendingTicker`, `primaryRequestAttempt`, `primaryRequestError`, `activeQueryRef`, `primaryRequestSeqRef`, `chartRequestSeqRef`, primary guarded commit, unique chart request ids, normalized request-id lookup, stale/unknown response guards, clear/reset hardening, result query derivation | Закрыть race conditions и смешение active/pending state без расширения patch surface |

Inspected read-only as supporting evidence, not modified in this handoff task:

- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/Chart/Chart.js`
- `fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js`
- `fingineerwebapp/src/config/api.js`

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Keep `App.query` as active/displayed ticker | Route A: `query = pending/request ticker`; Route B: `query = active/displayed ticker` + `pendingTicker` | Route B меняет меньше существующих consumers и лучше сохраняет coherent workspace при failed switch |
| Trigger primary fetch by `pendingTicker + primaryRequestAttempt` | Depend only on `pendingTicker`; depend on `query`; use separate attempt trigger | Позволяет безопасно повторно подтверждать тот же pending ticker без зависшего loading |
| Generate unique chart request ids in `App.js` | `Date.now()` only; backend-generated ids; ref sequence + timestamp mix | Устраняет collision при почти одновременных main/6mth/1y requests без изменения wire contract |
| Normalize request-id keys to `String(...)` | Store raw numeric keys; normalize only on receive; normalize on both set/get/delete | Убирает number/string mismatch между socket emit и payload lookup |
| Reject unknown requestId before fallback binding | Keep legacy fallback for all payloads | Защищает новый active request от поздних invalidated responses старого ticker |
| Preserve compact/expanded renderer split | Broad chart refactor; unify renderers; touch chart internals | Slice был bounded к `App.js`; chart internals и renderer architecture сознательно не трогались |

### Hypotheses Rejected

- Rejected: `localhost:3000` serves stale or different bundle.
  - Проверка bundle показала наличие exact strings `[FG][CHART][REQUEST_EMIT]`, `[FG][CHART][RESPONSE_IDENTITY]`, `missingMetaIgnored`, `primaryRequestAttempt`.
- Rejected: отсутствие `App.js` chart diagnostics означает, что patch не дошёл в runtime.
  - Причина оказалась в том, что `FG_DEBUG` runtime-disabled (`window.__FG_DEBUG` не установлен).
- Rejected: `Compact` “не рисует график”, потому что `canvasCount=0`.
  - `CompactSparkline` рисует SVG `polyline`; DOM probe показал видимый path и populated `points`.
- Rejected: текущий flaky chart symptom объясняется только renderer-side проблемой.
  - Основной закрытый дефект был в lifecycle/request identity path уровня `App.js`.

## Pending Work

### Immediate Next Steps

1. Загрузить Project Sources и использовать этот handoff только как supporting evidence.
2. Считать commit `0af5b2d` закрытым implementation baseline.
3. Открыть bounded design/implementation slice для отдельного `AnalyticalWorkspaceShell`.
4. В рамках этого slice реализовать presentation variants существующего `SearchForm`: `entry` и `workspace`.
5. После visual/runtime QA design slice выполнить отдельный commit.
6. Только затем провести read-only responsibility audit и рассмотреть extraction `useChartSocketBridge`.
7. Docs/current-state/playbook sync выполнять отдельным docs-only slice, если Owner подтвердит необходимость; он не блокирует ближайший design slice.

### Next Design Slice Contract

#### AnalyticalWorkspaceShell

- отдельный presentation-компонент;
- отдельный CSS;
- border-only frame;
- отвечает только за layout, spacing и layering;
- functional root сохраняет `overflow: visible`;
- не использовать `clip-path` на functional root;
- декоративный frame-layer должен иметь `pointer-events: none`;
- shell не владеет fetch;
- shell не владеет socket;
- shell не владеет ticker lifecycle;
- shell не дублирует SearchForm;
- shell не дублирует Results.

#### SearchForm variants

Один существующий `SearchForm`:

- один DOM owner;
- одна behavioral logic;
- два presentation variants:
  - `entry`;
  - `workspace`.

Workspace behavior:

- старый Results остаётся видимым во время editing/switching;
- ввод меняет draft, но не active ticker;
- picker открывается поверх workspace;
- `Escape` и outside click отменяют editing;
- `×` очищает draft, но не уничтожает active workspace;
- полный reset выполняется через логотип FG.

### Resolved Decisions

- Resolved decision: later Project Sources incorporated commit `0af5b2d` as a protected baseline and moved the current next safe entry to `MODE: EXECUTE / PHASE 2 ANALYTICAL WORKSPACE SHELL`; no separate sync action remains in this historical handoff.
- Historical open question — superseded by later authority: the active Phase 2 scope is presentation-only and excludes chart/socket/cache diagnostics work, so `FG_DEBUG` documentation is outside the current execution boundary and requires separate Owner authority if revisited.
- Resolved decision: this slice is chart-engine playbook material; playbook sync remains deferred, non-blocking, and restricted to a separate docs-only slice.

### Deferred Items

- Playbook update deferred in this task, потому что цель текущего запроса только handoff documentation.
- Любые изменения вне `fingineerwebapp/src/App.js` deferred, потому что accepted patch boundary already closed.
- Повторный build и Browser QA сознательно не запускались в handoff run, потому что user explicitly forbade them here.
- Любая чистка общего dirty working tree deferred и вне scope этого handoff.

## Context for Resuming Agent

### Important Context

Самое важное для следующего агента:

1. Кодовый slice уже завершён и закоммичен в `0af5b2d`.
2. Не нужно снова “чинить график по симптомам” вслепую. Новый baseline уже включает:
   - atomic primary commit;
   - `pendingTicker`;
   - stale primary guard;
   - repeated-identical-pending submit handling;
   - unique chart request ids;
   - request-id normalization;
   - unknown/stale chart response guards.
3. Handoff не заменяет Project Sources. Later Project Sources incorporated commit `0af5b2d` as a protected baseline and own the current stop-point; use current authority instead of promoting this handoff.
4. Global worktree грязный. Commit уже создан только по `App.js`. Любой следующий commit должен очень аккуратно выбирать exact-file scope.
5. В runtime на `localhost:3000` отсутствие `[FG][CHART][REQUEST_EMIT]` и `[FG][CHART][RESPONSE_IDENTITY]` не является автоматическим признаком поломки. Эти логи сидят за `FG_DEBUG`, который сейчас выключен.
6. Compact renderer path жизнеспособен и SVG-based. При future QA нельзя использовать `canvasCount` как универсальный индикатор compact-failure.

### Assumptions Made

- Assumption: ручные runtime проверки, выполненные ранее в этом же session chain, достаточно закрыли bounded slice и не требуют повторного build/QA в handoff run.
- Assumption: следующий агент будет соблюдать exact-file discipline и не станет трактовать общий dirty tree как часть этого committed fix.
- Assumption: current `localhost:3000` и `localhost:3001` остаются стандартным local baseline, если пользователь отдельно не сменит environment.

### Potential Gotchas

- `FG_DEBUG` зависит от `window.__FG_DEBUG`, а не от `sessionStorage`, поэтому browser runtime logs уровня `App.js` могут быть молча выключены.
- at handoff time, `current-state` in Project Sources had not yet incorporated this implementation slice; later Project Sources superseded that gap and remain authoritative.
- `git status --short` в этом repo очень шумный. Нельзя делать broad staging commands.
- `Compact` и `Expanded` нельзя уравнивать по renderer assumptions: compact использует `CompactSparkline`, expanded — `ChartContainer`.
- Даже если future bug выглядит “chart пустой”, сначала нужно восстановить цепочку:
  - query/pending/active owner
  - primary commit
  - chartRequestEffect
  - emit
  - socket response
  - request-id lookup
  - stale guard
  - renderer type

## Environment State

### Tools/Services Used

- `git` для bounded commit inspection и commit creation
- in-app Browser route на `http://localhost:3000/` для runtime observation
- read-only PowerShell commands для source/bundle inspection

### Active Processes

- `localhost:3000` использовался как frontend runtime baseline
- `localhost:3001` использовался как API / Socket.IO backend baseline
- в этом handoff run новые процессы не стартовали и existing services не рестартовались

### Environment Variables

- `REACT_APP_SOCKET_URL`
- `REACT_APP_API_URL`
- `REACT_APP_SUGGESTIONS_URL`
- `REACT_APP_FG_AGG_ENABLED`
- `window.__FG_DEBUG`

### Working Tree Note

Repo остаётся глобально грязным множеством unrelated changes.
Этот handoff относится только к already committed slice в `fingineerwebapp/src/App.js` и не описывает остальные модификации как часть закрытой задачи.

## Related Resources

- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`
- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/Chart/Chart.js`
- `fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js`
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
- commit: `0af5b2d feat(app): stabilize ticker switch and chart request identity`

## Guardrails for Next Session

- Не переоткрывать этот slice без genuinely new runtime evidence.
- Не трогать unrelated dirty files при follow-up коммитах.
- Не делать broad `App.js` rewrite; follow-up должен быть bounded и owner-driven.
- После commit `0af5b2d` не добавлять новую chart/socket/cache-логику непосредственно в `App.js`.
- В ближайшем design slice в `App.js` допустима только минимальная orchestration wiring для отдельного shell-компонента и presentation variant props.
- Не начинать broad refactor в этом slice.
- Не путать supporting handoff с Project Sources authority.
- Не считать отсутствие `FG_DEBUG`-логов доказательством отсутствия patch.
- Не использовать `canvasCount` как критерий compact chart render health.
- Для chart incidents сначала восстанавливать owner chain, потом mutation decision.

### Tooling Debt

- `session-handoff` launcher был недоступен в текущей shell-среде;
- `python` и `py` были недоступны;
- repo convention воспроизведена вручную после чтения skill;
- automatic validation score не вычислен;
- manual checks прошли:
  - no TODO placeholders;
  - referenced paths exist;
  - Cyrillic/mojibake check clean;
- это tooling debt, а не FG product blocker;
- диагностику launcher/browser plugin провести отдельно, не в design slice.

## Playbook Check

Эта сессия затронула chart-engine-adjacent observability и safety mechanisms на уровне `App.js` lifecycle, а также transition behaviour между pending и active instrument state.

Поэтому ответ на обязательный вопрос skill:

`Does this session modify FG Chart Engine architecture and require updating docs/domain/FG_CHART_ENGINE_PLAYBOOK.md?`

Ответ: `YES`

Минимальный вероятный раздел для будущего append-only update:

- `## 5. Observability Layer`
- `## 6. Safety Mechanisms`
- при необходимости краткая заметка в `## 3. Ownership Model` о `active ticker / pending ticker / request identity` boundary на уровне `App.js`

Уточнение:

- playbook sync deferred;
- playbook sync non-blocking;
- выполнять отдельным docs-only slice;
- он не заменяет и не задерживает следующий `AnalyticalWorkspaceShell` design slice.
