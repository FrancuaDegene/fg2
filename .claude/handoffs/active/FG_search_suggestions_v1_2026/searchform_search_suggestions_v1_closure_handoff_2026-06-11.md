# FG SearchForm / Search Suggestions V1 Closure Handoff

Этот handoff является supporting continuity evidence only.
Он не переопределяет `AGENTS.md`, `CODEX_RULES.md`, `docs/project/state/FG_ACTIVE_SOURCE_PACK.md` или authoritative current-state.

Project Sources check at handoff time:

- active source routing entry: `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- authoritative current-state: `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`
- current project-level next safe entry: `MODE: DECISION / OWNER REVIEW NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SCOPE`

Для SearchForm Search Suggestions V1 это означает:

- V1 можно считать завершённым как bounded frontend surface;
- future Results / Analytical Workspace work не должен выводиться из handoff автоматически;
- handoff фиксирует stop-point и accepted V1 behavior, но не становится новой authority.

## 1. Status

- status: `completed / accepted`
- runtime QA: `manual QA passed for accepted V1 states`
- build: `PASS with existing unrelated warnings`
- scope: `main SearchForm picker only`
- date: `2026-06-11`

## 2. Final component scope

V1 covers:

- typed search suggestions;
- Browse Mode on empty focus;
- filter chips: `Все` / `Акции` / `Фонды` / `Индексы`;
- no-results state;
- loading skeleton state;
- error state with retry;
- recent selections;
- hover / active row affordance;
- post-selection action contract.

V1 intentionally stays inside the main `SearchForm` picker and does not claim ownership of a unified analytical result surface.

## 3. Files changed

Accepted changed files:

- `fingineerwebapp/src/components/SearchForm.js`
- `fingineerwebapp/src/components/SearchForm.css`

Inspected read-only as supporting evidence, not changed in this closure handoff:

- `fingineerwebapp/src/hooks/useSearch.js`
- `fingineerwebapp/src/components/SearchSuggestionItem/SearchSuggestionItem.js`
- `fingineerwebapp/src/components/SearchSuggestionItem/SearchSuggestionItem.css`
- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/components/Results/Results.js`
- previous handoffs in this folder

## 4. Implemented behavior in detail

### 4.1 Browse Mode V1

- empty focus opens Browse Mode;
- Browse fetch uses backend2 instruments browse endpoint;
- chips switch type: `all` / `share` / `fund` / `index`;
- typed query hides Browse Mode and uses typed suggestions;
- clear returns to Browse Mode;
- Browse rows select instrument through existing selection flow;
- invalid raw submit does not call ticker API for garbage input.

Accepted routing anchor:

- browse fetch uses `config.INSTRUMENTS_API_URL + config.ENDPOINTS.INSTRUMENTS_BROWSE`
- Browse does not use `API_BASE_URL`

## 4.2 No Results State V1

- shown only after meaningful typed query when no suggestions and no error/loading;
- stable copy:
  - `Ничего не найдено`
  - `Проверьте написание или попробуйте другой запрос`
- helper hints:
  - `другой тикер`
  - `название компании`
  - `частичный запрос`
- not shown for backend errors;
- not shown during loading.

### 4.3 Loading Skeleton V1

- text loading states were replaced with calm skeleton rows;
- Browse loading uses skeleton rows;
- typed suggestions loading uses skeleton rows;
- later CSS-only soft shimmer added;
- `prefers-reduced-motion` disables animation;
- no spinner and no aggressive pulse.

### 4.4 Error State V1

- structured calm error state added;
- raw hook-level `{error}` is no longer shown to user;
- stable copy:
  - `Не удалось загрузить данные`
  - `Проверьте подключение и попробуйте ещё раз`
  - `Повторить`
- Browse retry is real via local retry key and re-runs browse fetch;
- typed retry uses existing query search flow;
- manual QA proved Browse retry:
  - backend2 stopped -> `ERR_CONNECTION_REFUSED` -> structured error shown
  - backend2 restarted -> `Повторить` -> `200 OK` -> rows returned

### 4.5 Recent Queries / Recent Selections V1

- implemented as `localStorage` only;
- key:
  - `fg.searchForm.recentSelections.v1`
- max items: `5`
- newest first;
- duplicate by uppercase ticker moves to top;
- stores only confirmed selected instruments;
- does not store raw typed text or garbage/no-results;
- recent section appears only in empty-input Browse surface;
- recent does not replace Browse Mode;
- recent section appears above Browse rows;
- `Очистить` removes `localStorage` and state;
- `SearchSuggestionItem` reused without internals changes;
- manual QA proved:
  - empty history -> no recent section
  - typed selection saves recent
  - recent appears above Browse rows
  - clear removes recent and Browse remains
  - visual polish accepted

### 4.6 Row Hover / Active State V1

- CSS-only polish;
- all surfaces reuse `.suggestion-item`;
- affected surfaces:
  - recent rows
  - browse rows
  - typed suggestion rows
- hover/active became more visible but calm;
- no checkmark;
- no persistent selected state;
- no keyboard navigation added;
- accepted as V1, with possible future visual polish.

### 4.7 Post-selection Action Contract V1

Contract-only accepted behavior:

- `SearchForm` selects only confirmed instrument;
- saves recent;
- calls `selectSuggestion(ticker)`;
- closes picker;
- calls `onSearch` through existing `useSearch` flow;
- `App` owns `query` as downstream source of truth;
- `SearchForm` does not assemble Results UI;
- `SearchForm` does not open Expanded automatically;
- `SearchForm` does not own chart / news / metrics layout.

## 5. Manual QA accepted

Accepted checks:

- empty focus Browse Mode works;
- Browse chips work;
- Browse row selection works;
- typed `sber` suggestions work;
- invalid garbage does not submit as real ticker;
- no-results state works;
- skeleton loading works;
- shimmer accepted;
- Browse error and retry works;
- recent saves and clears;
- hover/active state visible;
- selection still closes picker and opens instrument.

## 6. Consciously not done / deferred

### SearchModal

- `SearchModal` was not touched;
- `SearchModal` remains typed-search-only;
- no `SearchModal` Browse Mode;
- no `SearchModal` recent section;
- no `SearchModal` redesign.

### Backend / data layer

- no backend changes;
- no new database tables;
- no server-side recent history;
- no user/account sync;
- no auth integration;
- no MOEX ISS catalog expansion;
- no bonds / futures / options expansion beyond current available data;
- no importer / parser work.

### Results / Analytical Workspace

- no unified Results UI;
- no company info / metrics / price / chart / news composition;
- no new analytical workspace surface;
- no Results redesign;
- no Compact redesign;
- no Expanded redesign;
- no auto-open Expanded after selection;
- Expanded remains separate existing action / button.

### Chart / App orchestration

- no chart internals touched;
- no chart layout changes;
- no `App.js` orchestration rewrite;
- no query source-of-truth changes beyond existing flow;
- no dashboard activation.

### Search behavior / accessibility

- no keyboard navigation;
- no `ArrowUp` / `ArrowDown` active index;
- no `aria-selected` selected row model;
- no persistent selected row;
- no checkmark icon;
- no row internal component rewrite;
- no `SearchSuggestionItem` internals change.

### Storage choices

- recent V1 uses browser `localStorage`;
- no server persistence;
- no cross-device sync;
- no user-based history;
- `localStorage` is accepted MVP client-side storage.

### Visual polish deferred

- hover state may be improved later;
- recent section visual density may be tuned later;
- full premium row treatment deferred;
- no TradingView clone.

## 7. Final architecture boundary

SearchForm boundary:

- input;
- picker;
- browse;
- suggestions;
- recent;
- loading / error / no-results;
- confirmed ticker selection.

Results / Workspace boundary:

- downstream data loading;
- metrics assembly;
- chart / news / company info;
- unified analytical layout;
- Expanded transition.

## 8. Known risks / notes

- `localStorage` is per browser / device / profile;
- recent history disappears if browser data is cleared;
- recent is not synced between users / devices;
- typed retry should remain watched in future if `useSearch` changes;
- keyboard accessibility is a future V2 concern.

## 9. Recommended next steps

1. Commit / close SearchForm Search Suggestions V1.
2. Return to the active project-level next safe entry:
   `MODE: DECISION / OWNER REVIEW NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SCOPE`
3. After owner decision, open a future bounded sprint for Unified Results / Analytical Workspace Surface.
4. Optionally open later V2 for keyboard navigation / accessibility.
5. Optionally open a future data sprint for MOEX ISS catalog expansion.

## 10. Do-not-touch guard for future work

Future patches must not reopen accepted SearchForm V1 behavior unless explicitly scoped.

If future work starts from Results / Workspace:

- do not reopen accepted SearchForm states by default;
- do not move Browse Mode into `SearchModal`;
- do not conflate ticker selection UX with analytical surface assembly;
- reopen SearchForm only if a new bounded scope explicitly names it.
