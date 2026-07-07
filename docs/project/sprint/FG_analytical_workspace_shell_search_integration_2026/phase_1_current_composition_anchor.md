# Phase 1 - Current Composition Anchor

## Status

`completed / accepted / PATCH-READY FOR PHASE 2`

## Purpose

Phase 1 была read-only/current-composition фазой.

Она должна была установить:

- текущий render tree;
- единственного composition owner;
- `SearchForm` ownership;
- state/props boundaries;
- CSS/layering constraints;
- безопасную точку вставки shell;
- минимальный `Phase 2` allowlist;
- риски clipping, duplicate `SearchForm` и lifecycle drift.

`Phase 1` не являлась implementation phase.

## Authority and evidence

Authoritative chain:

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_analytical_workspace_shell_search_integration_current_state_2026-07-07.md`
5. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/FG_analytical_workspace_shell_search_integration_sprint_contract.md`
6. `docs/project/sprint/FG_analytical_workspace_shell_search_integration_2026/phase_0_sprint_activation_checklist.md`

Accepted supporting evidence:

- `git show --stat --oneline 11e8200`
- `git show --stat --oneline dc6c06e`
- `git show --name-only --format="" dc6c06e`
- accepted Phase 1 live-code anchor findings
- accepted runtime QA evidence collected through the in-app Browser route

Supporting baselines:

- `0af5b2d feat(app): stabilize ticker switch and chart request identity`
- `11e8200 docs(sprint): activate analytical workspace shell sprint`
- `dc6c06e feat(results): finalize visual baseline`

## Session chronology

### Sprint activation

Активирован:

`FG Analytical Workspace Shell and Search Integration Sprint`

`Phase 0` закрыта commit:

`11e8200 docs(sprint): activate analytical workspace shell sprint`

`Phase 0` создала/обновила:

- sprint contract;
- `Phase 0` checklist;
- active current-state;
- active source routing.

### Phase 1 current composition anchor

`Phase 1` установила по live code:

- `App.js` является текущим composition owner;
- общий parent сейчас - `.App`;
- dedicated parent для `SearchForm + Results` отсутствует;
- основной `SearchForm` имеет одного DOM owner;
- `Results` не является и не должен становиться владельцем поиска;
- `Phase 2` можно отделить от `Phase 3`;
- `Phase 2` должна быть presentation-only shell slice;
- `SearchForm` variants `entry/workspace` относятся к `Phase 3`.

### Visual baseline and runtime acceptance

Accepted pre-shell visual baseline закреплен commit:

`dc6c06e feat(results): finalize visual baseline`

Runtime QA затем подтвердила:

- `Browse Mode` работает;
- typed suggestions работают;
- `SBER / SBERP` отображаются;
- picker не обрезается;
- старый `Results` сохраняется во время editing/switching;
- picker открывается поверх active `Results`;
- duplicate `SearchForm` отсутствует;
- desktop horizontal overflow после fix отсутствует.

## Current render composition

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

## Ownership map

- `App.js` - текущий composition owner и единственная допустимая точка будущей минимальной wiring.
- `SearchForm` - behavioral owner input/picker/browse/suggestions/recent/loading/error/no-results/confirmed ticker selection.
- `Results` - existing result composition owner.
- `AnalyticalWorkspaceShell` - будущий presentation-only owner layout/spacing/layering/decorative frame only.
- `SearchModal` - existing separate expanded-search surface, не входит в `Phase 2` boundary.

## State and behavior boundaries

- `SearchForm` не должен передавать ownership поиска в `Results`.
- `Results` не должен становиться владельцем `SearchForm`.
- editing меняет draft, но не active ticker.
- switching не должен выдавать pending ticker за active.
- failed switch должен сохранять старый workspace.
- existing `0af5b2d` lifecycle baseline не переоткрывается.

## CSS and layering findings

- общий parent сейчас - `.App`;
- dedicated parent для `SearchForm + Results` отсутствует;
- `SearchForm` остается отдельным верхним surface;
- `SearchForm` picker/dropdown открывается поверх active `Results`;
- accepted desktop layering показывает один видимый `SearchForm` и один видимый input;
- commit `dc6c06e` закрепил прозрачный общий `Results` shell и три самостоятельные верхние карточки;
- `.results-container { box-sizing: border-box; }` убрал desktop horizontal overflow;
- future shell functional root должен оставаться `position: relative` и `overflow: visible`;
- future decorative frame layer не должен становиться clipping surface или owner interaction.

## Preferred shell insertion

Preferred insertion point находится в `App.js` вокруг существующих веток:

- top `SearchForm`;
- `LoadingSkeleton / Results`.

Будущий shell не должен:

- переносить `SearchForm` внутрь `Results`;
- создавать второй `SearchForm`;
- дублировать `useSearch`;
- менять ticker lifecycle;
- менять `active/pending query` ownership;
- менять chart/socket/cache logic.

## Rejected alternatives

Отклонен вариант:

`SearchForm inside Results`

Причины:

- `Results` стал бы новым владельцем поиска;
- вырос бы риск duplicate `SearchForm`;
- смешались бы identification и analytical result ownership;
- нарушился бы sprint contract;
- появился бы риск lifecycle regression.

## Phase 2 component contract

Будущий `AnalyticalWorkspaceShell`:

- presentation-only component;
- не получает ownership query/data/fetch/socket/chart;
- принимает presentation slots;
- визуально связывает `SearchForm` и `Results`;
- не меняет их behavioral ownership;
- не должен перемонтировать `SearchForm` между `entry/workspace`;
- не должен создавать новый ticker lifecycle.

Предпочтительная conceptual API-модель:

`AnalyticalWorkspaceShell`

- search slot
- content/results slot
- presentation mode/status only

Окончательная JSX API не фиксируется без `Phase 2` implementation evidence.

## Phase 2 exact allowlist

Required:

- `fingineerwebapp/src/components/AnalyticalWorkspaceShell/AnalyticalWorkspaceShell.js`
- `fingineerwebapp/src/components/AnalyticalWorkspaceShell/AnalyticalWorkspaceShell.css`
- `fingineerwebapp/src/App.js`

Optional only with exact evidence:

- `fingineerwebapp/src/App.css`

## Protected closed slices

- `0af5b2d feat(app): stabilize ticker switch and chart request identity`
- `Search Suggestions / Instrument Picker V1`
- `SearchForm Browse V1`
- `SearchForm Search Suggestions V1`
- accepted pre-shell `Results` visual baseline from `dc6c06e`

`Phase 2` must not touch:

- `fingineerwebapp/src/components/SearchForm.js`
- `fingineerwebapp/src/components/SearchForm.css`
- `fingineerwebapp/src/hooks/useSearch.js`
- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/Results.css`
- chart files
- backend files

## Accepted design direction

Общая модель:

`SearchForm -> CompanyInfo / KeyMetrics / Price -> Chart -> secondary blocks`

Визуальный язык:

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

- каждой suggestion row;
- каждому chip;
- каждой маленькой кнопке;
- каждому внутреннему wrapper.

`SearchForm`:

- один существующий `SearchForm`;
- одна behavioral logic;
- один DOM owner;
- после выбора ticker тот же `SearchForm` позже получает workspace presentation;
- `Phase 2` не реализует `entry/workspace` variants;
- variants остаются `Phase 3`;
- picker должен открываться поверх `Results` без clipping.

Shell geometry contract:

- functional root: `position: relative`;
- functional root: `overflow: visible`;
- no `clip-path` on functional root;
- decorative frame layer: border-only;
- decorative frame layer: controlled chamfer;
- decorative frame layer: `pointer-events: none`;
- decorative frame layer не владеет layout/data/interaction;
- decorative frame layer не блокирует picker.

## Accepted visual baseline evidence

Supporting product commit:

`dc6c06e feat(results): finalize visual baseline`

Commit содержит ровно:

- `fingineerwebapp/src/components/Results/Results.css`
- `fingineerwebapp/src/components/Results/CompanyInfo/CompanyInfo.css`
- `fingineerwebapp/src/components/Results/KeyMetrics/KeyMetrics.css`
- `fingineerwebapp/src/components/Results/Price/Price.css`

Этот commit зафиксировал:

- прозрачный общий `Results` shell;
- отсутствие тяжелой общей `Results`-заливки;
- три самостоятельные темные верхние карточки;
- chamfer geometry у `CompanyInfo`, `KeyMetrics` и `Price`;
- крупный `Chart` как главный evidence-блок;
- `News/secondary blocks` ниже;
- исправление desktop horizontal overflow через `.results-container { box-sizing: border-box; }`.

Это accepted pre-shell `Results` visual baseline. `AnalyticalWorkspaceShell` не был реализован этим commit.

## Runtime QA evidence

QA выполнялся через in-app Browser route:

`control-in-app-browser -> node_repl -> browser-client.mjs -> iab`

`Playwright MCP` и `Chrome DevTools MCP` не использовались.

Подтверждено:

- `SearchForm` является committed baseline;
- `SearchForm`-related files остались clean;
- `Browse Mode` работает;
- typed suggestions работают;
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

## Known phase-gated follow-up

Остается:

При viewport около `390px` сохраняется небольшой page-level horizontal overflow около `3px`.

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

Likely files:

- `fingineerwebapp/src/components/SearchForm.css`

И только при exact evidence:

- surrounding layout CSS

Риск:

- на узком viewport может сохраняться небольшой горизонтальный scrollbar.

Дополнительная осторожность:

- Browser evidence также видел отдельный `TEXTAREA`, но его нельзя автоматически считать FG product element без отдельной классификации.

Не включать этот follow-up в `Phase 2` implementation без нового blocking evidence.

## Risks and QA triggers

- риск duplicate `SearchForm` при неправильной shell insertion;
- риск clipping, если future shell root или decorative layer получат `overflow`/`clip-path`;
- риск lifecycle drift, если `Phase 2` затронет `active/pending query` ownership;
- риск reopening protected chart/socket/cache boundaries в `App.js`;
- responsive follow-up должен оставаться phase-gated и не смешиваться с `Phase 2`.

## Phase 1 verdict

`Phase 1` завершена как read-only/current-composition anchor.

Verdict:

`completed / accepted / PATCH-READY FOR PHASE 2`

## Next safe entry

`MODE: EXECUTE / PHASE 2 ANALYTICAL WORKSPACE SHELL`
