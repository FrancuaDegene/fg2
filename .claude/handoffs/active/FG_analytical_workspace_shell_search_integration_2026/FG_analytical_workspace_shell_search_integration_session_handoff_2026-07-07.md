# FG Analytical Workspace Shell and Search Integration - Session Handoff

## Status

`supporting continuity evidence / Phase 0-1 closure captured / Phase 2 pending`

## Role of this handoff

Этот handoff сохраняет continuity evidence для следующей сессии.

Важно:

- это supporting continuity evidence;
- handoff не является current-state;
- handoff не переопределяет sprint contract;
- handoff не переопределяет `FG_ACTIVE_SOURCE_PACK.md`;
- current-state wins for stop-point and immediate next step.

## Authoritative sources

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md`
5. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md`
6. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md`
7. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_1_current_composition_anchor.md`

## Closure run objective

Документально завершить `Phase 0` и `Phase 1` без дополнительных product-code changes в closure run и перевести официальный stop-point на `Phase 2`.

Ранее в этой session chain был принят и закоммичен pre-shell `Results` visual baseline `dc6c06e`.

## Work completed

- подтверждено, что `Phase 0` уже закрыта как `completed / activation accepted`;
- создан authoritative `Phase 1` record;
- обновлен authoritative current-state;
- обновлен `FG_ACTIVE_SOURCE_PACK.md`;
- синхронизирован active sprint contract по фазовому status;
- создан supporting session handoff;
- active stop-point переведен на `Phase 2 pending / not started`.

## Phase 0 closure

`Phase 0` закрыта commit:

`11e8200 docs(sprint): activate analytical workspace shell sprint`

Этот commit содержал activation/source-routing documentation и не содержал product code.

`Phase 0` создала/обновила:

- sprint contract;
- `Phase 0` checklist;
- active current-state;
- active source routing.

## Phase 1 investigation

`Phase 1` была read-only/current-composition фазой.

Она установила:

- `App.js` является текущим composition owner;
- общий parent сейчас - `.App`;
- dedicated parent для `SearchForm + Results` отсутствует;
- основной `SearchForm` имеет одного DOM owner;
- `Results` не является и не должен становиться владельцем поиска;
- `Phase 2` можно отделить от `Phase 3`;
- `Phase 2` должна быть presentation-only shell slice;
- `SearchForm` variants `entry/workspace` относятся к `Phase 3`.

## Accepted design direction

Будущий `AnalyticalWorkspaceShell` должен визуально объединить:

`SearchForm -> CompanyInfo / KeyMetrics / Price -> Chart -> secondary blocks`

Accepted direction:

- спокойный professional fintech cockpit;
- controlled chamfered geometry;
- тонкие border-only рамки;
- темные самостоятельные analytical surfaces;
- график остается главным evidence-блоком;
- бирюзовый используется как функциональный акцент;
- минимальное декоративное свечение;
- без heavy neon;
- без glass overload;
- без игрового sci-fi HUD.

Chamfered geometry применяется к:

- внешнему analytical shell;
- крупным карточкам;
- значимым analytical panels.

Не применять автоматически к:

- suggestion rows;
- chips;
- маленьким кнопкам;
- внутренним wrapper surfaces.

## Current composition and ownership

Entry:

```text
App
├── Header
├── SearchForm
├── Results -> null
├── AiTestButton / AiStreamButton
└── SearchModal -> null
```

Compact workspace:

```text
App
├── Header
├── SearchForm
├── Results
│   └── .results-container
│       └── .compact-results-shell
│           ├── CompanyInfo / KeyMetrics / Price
│           ├── Chart
│           ├── News
│           └── Dividends when present
└── SearchModal -> null
```

Editing/switching:

- старый active `Results` остается видимым;
- тот же `SearchForm` переходит в editing/suggestions state;
- новый ticker не становится active query до успешного результата;
- picker может открываться поверх старого `Results`.

Expanded:

- верхний `SearchForm` скрывается существующей логикой;
- `Results` сохраняет ownership expanded rendering;
- `SearchModal` остается отдельной existing surface;
- `Phase 2` не меняет `Expanded/SearchModal` boundary.

Ownership map:

- `App.js` - minimal orchestration wiring only;
- `SearchForm` - search behavior owner;
- `Results` - existing result composition owner;
- будущий `AnalyticalWorkspaceShell` - presentation/layout only.

## Accepted Results visual baseline

Supporting product commit:

`dc6c06e feat(results): finalize visual baseline`

Commit содержит ровно:

- `fingineerwebapp/src/components/Results/Results.css`
- `fingineerwebapp/src/components/Results/CompanyInfo/CompanyInfo.css`
- `fingineerwebapp/src/components/Results/KeyMetrics/KeyMetrics.css`
- `fingineerwebapp/src/components/Results/Price/Price.css`

Commit зафиксировал:

- прозрачный общий `Results` shell;
- отсутствие тяжелой общей `Results`-заливки;
- три самостоятельные темные верхние карточки;
- chamfer geometry у `CompanyInfo`, `KeyMetrics`, `Price`;
- крупный `Chart` как главный evidence-блок;
- `News/secondary blocks` ниже;
- исправление desktop horizontal overflow через `.results-container { box-sizing: border-box; }`.

Это accepted pre-shell `Results` visual baseline.

## Runtime QA evidence

QA выполнялся через in-app Browser route:

`control-in-app-browser -> node_repl -> browser-client.mjs -> iab`

`Playwright MCP` и `Chrome DevTools MCP` не использовались.

Подтверждено:

- `SearchForm` остается отдельным committed baseline;
- `Browse Mode` и typed suggestions работают;
- `SBER / SBERP` отображаются;
- picker не обрезается;
- `SBER Results` загружается;
- три верхние карточки видимы;
- chamfer geometry подтверждена;
- `Chart` видим и остается главным блоком;
- `News` находится ниже;
- `Expanded` не сломан;
- ticker switching `SBER -> GAZP` работает;
- старый `Results` остается видимым во время editing;
- picker открывается поверх active `Results`;
- picker пересекает `Results/cards` визуально;
- `pointer-events = auto`;
- duplicate `SearchForm` отсутствует;
- visible `SearchForm/input count = 1`;
- console `warn/error` отсутствуют;
- desktop horizontal overflow после fix отсутствует.

Desktop evidence после fix:

- `document.documentElement.clientWidth = 852`
- `document.documentElement.scrollWidth = 852`
- `document.body.scrollWidth = 852`
- `horizontalScrollbar = false`
- `.results-container excess = 0`

## Commits created in this session chain

- `11e8200 docs(sprint): activate analytical workspace shell sprint`
- `dc6c06e feat(results): finalize visual baseline`

## Protected prior implementation baseline

- `0af5b2d feat(app): stabilize ticker switch and chart request identity`

Дополнительно:

- commit `0af5b2d` создан до этой session chain;
- `0af5b2d` не переоткрывался;
- новая chart/socket/cache logic не добавлялась.

## Known follow-up

Остается небольшой page-level horizontal overflow около `3px` при viewport около `390px`.

Risk if forgotten:

На viewport около `390px` может сохраниться небольшой page-level horizontal scrollbar, который станет заметнее после добавления workspace presentation variant.

Почему patch не выполнялся сейчас:

- `.results-container` подтвержден как исправленный и остается внутри viewport;
- remaining overflow создается другим surface;
- runtime evidence указывает на `SearchForm/page-control` area;
- этот defect не относится к `Results` visual baseline;
- исправление сейчас смешало бы `Results` closure и `SearchForm` responsive scope.

Trigger возврата:

- `Phase 3 SearchForm workspace variant`;
- `Phase 5 responsive/runtime QA`;
- новый blocking evidence на узком viewport;
- Owner отдельно активирует narrow `SearchForm` fix.

Минимальный future anchor:

`MODE: ANCHOR / SEARCHFORM NARROW HORIZONTAL OVERFLOW TRACE`

Likely file:

- `fingineerwebapp/src/components/SearchForm.css`

Browser evidence также видел отдельный `TEXTAREA`, но его нельзя автоматически считать FG product element без отдельной классификации.

## Closed and protected surfaces

- `Search Suggestions / Instrument Picker V1`
- `SearchForm Browse V1`
- `SearchForm Search Suggestions V1`
- `0af5b2d feat(app): stabilize ticker switch and chart request identity`
- accepted pre-shell `Results` visual baseline from `dc6c06e`

Не переоткрывать без genuinely new runtime evidence:

- chart/socket/cache logic;
- `SearchForm` V1 behavior;
- `Results` search ownership boundary;
- `Expanded/SearchModal` boundary.

## Phase 2 implementation contract

Будущий `AnalyticalWorkspaceShell`:

- presentation-only component;
- не получает ownership query/data/fetch/socket/chart;
- принимает presentation slots;
- визуально связывает `SearchForm` и `Results`;
- не меняет их behavioral ownership;
- не должен перемонтировать `SearchForm` между `entry/workspace`;
- не должен создавать новый ticker lifecycle.

Preferred shell insertion:

- вокруг top `SearchForm`;
- вокруг `LoadingSkeleton / Results` веток в `App.js`.

Отклоненный вариант:

`SearchForm inside Results`

Причины:

- `Results` стал бы новым владельцем поиска;
- вырос бы риск duplicate `SearchForm`;
- смешались бы identification и analytical result ownership;
- нарушился бы sprint contract;
- появился бы риск lifecycle regression.

## Exact Phase 2 allowlist

Required:

- `fingineerwebapp/src/components/AnalyticalWorkspaceShell/AnalyticalWorkspaceShell.js`
- `fingineerwebapp/src/components/AnalyticalWorkspaceShell/AnalyticalWorkspaceShell.css`
- `fingineerwebapp/src/App.js`

Optional only with exact evidence:

- `fingineerwebapp/src/App.css`

Must not touch in `Phase 2`:

- `fingineerwebapp/src/components/SearchForm.js`
- `fingineerwebapp/src/components/SearchForm.css`
- `fingineerwebapp/src/hooks/useSearch.js`
- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/Results.css`
- chart files
- backend files

## Current worktree note

`git status --short` показывает шумный unrelated worktree.

Для следующей сессии важно только это:

- unrelated dirty files may remain;
- они не являются частью `Phase 0-1` closure;
- нельзя автоматически `stage`/`reset`/`restore`/`clean`/`stash`;
- `Phase 2` нужно вести через exact-file staging discipline.

## Current stop-point

- `Phase 0` closure подтверждена;
- `Phase 1` authoritative closure record создан;
- supporting handoff создан;
- accepted visual baseline и runtime QA evidence зафиксированы;
- `Phase 2` pending / not started.

## Next safe entry

`MODE: EXECUTE / PHASE 2 ANALYTICAL WORKSPACE SHELL`

## Guardrails for next session

- не писать, что `Phase 2 started`;
- не писать, что `AnalyticalWorkspaceShell` уже реализован;
- не переносить `SearchForm` внутрь `Results`;
- не создавать второй `SearchForm`;
- не трогать `SearchForm` behavior files в `Phase 2`;
- не менять chart/socket/cache logic;
- не смешивать `Phase 2` shell work с narrow responsive `SearchForm` follow-up.
