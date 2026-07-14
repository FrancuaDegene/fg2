# SearchForm Browse V1 — handoff

## 1. Status

`completed / manual runtime QA passed`

Date:

`2026-06-11`

SearchForm Browse V1 accepted for the main `SearchForm` picker surface.

Clarification:

- keyboard arrow navigation is deferred;
- active highlighted row is deferred;
- catalog/source audit is deferred and tracked as technical debt.

This handoff is supporting continuity evidence only. It does not override Project Sources, current-state, or Owner decisions recorded elsewhere.

## 2. Relationship to previous handoff

Previous handoff:

`.claude/handoffs/active/FG_search_suggestions_v1_2026/FG_search_suggestions_v1_closure_handoff_2026-06-08.md`

That handoff closed the typed suggestions / Instrument Picker baseline:

- shared `SearchSuggestionItem`;
- typed suggestions in `SearchForm` and `SearchModal`;
- backend normalized suggestions source;
- metadata labels;
- no TradingView-style filters/tabs;
- no Browse Mode.

This handoff adds the later Browse Mode layer for the main `SearchForm` only.

This handoff does not replace the older handoff.

## 3. Scope

Included:

- main `SearchForm` Browse Mode on empty focus;
- chips: `Все` / `Акции` / `Фонды` / `Индексы`;
- browse endpoint routing anchor;
- backend browse endpoint accepted earlier;
- `SearchForm` picker shell;
- visual alignment for the main picker;
- browse footer labels;
- outside click close;
- `Escape` close;
- invalid typed submit guard.

Excluded:

- `SearchModal` Browse Mode;
- expanded toolbar picker;
- `ChartToolbar` / `ChartContent` / `ChartRenderer` changes;
- keyboard arrow navigation;
- recent queries;
- full results action;
- counts;
- bonds / futures / options;
- catalog/source coverage audit;
- DB migration/import;
- broad visual redesign.

## 4. Final target behavior

Accepted state machine:

| State / action | Accepted behavior |
|---|---|
| focus + empty query | Browse Mode opens. |
| Browse Mode | chips are visible; rows load from backend2 browse endpoint. |
| type one or more characters | Browse Mode hides. |
| typed query length >= 2 | typed suggestions are shown through existing `useSearch`. |
| clear query while active | Browse Mode returns. |
| click browse row | selected ticker flows through existing `onSearch` path. |
| click typed suggestion | selected ticker flows through existing `onSearch` path. |
| valid exact ticker + `Enter` | opens ticker only if exact match exists in current `suggestions`. |
| invalid garbage query + `Enter` | no ticker request; no app-level error. |
| invalid garbage query + `Показать` | no ticker request; no app-level error. |
| outside click | picker closes. |
| `Escape` | picker closes. |
| `SearchModal` | remains typed-search-only; no Browse Mode. |

Additional notes:

- `Escape` does not clear query.
- `Escape` does not select any row.
- `ArrowUp` / `ArrowDown` were not implemented in this slice.
- Fast exact submit before suggestions are available is intentionally a no-op, not a fallback ticker request.

## 5. Routing decision

Routing facts accepted during the slice:

- `REACT_APP_API_URL` / `API_BASE_URL` points to backend1 / `localhost:3001`;
- `REACT_APP_SUGGESTIONS_URL` points to backend2 / `localhost:3002`;
- accepted browse endpoint lives on backend2:
  `http://localhost:3002/api/instruments/browse?type=all&limit=20`;
- first failed attempt incorrectly fetched:
  `localhost:3001/api/instruments/browse`;
- that failed with `404`.

Accepted frontend routing anchor:

```js
config.INSTRUMENTS_API_URL
```

Fallback chain:

```js
process.env.REACT_APP_INSTRUMENTS_API_URL || process.env.REACT_APP_SUGGESTIONS_URL || 'http://localhost:3002'
```

Browse fetch uses:

```js
config.INSTRUMENTS_API_URL + config.ENDPOINTS.INSTRUMENTS_BROWSE
```

`API_BASE_URL` is not used for Browse Mode.

## 6. Backend Browse Endpoint V1

Accepted backend contract:

Route:

```http
GET /api/instruments/browse?type={type}&limit={limit}
```

Allowed `type` values:

- `all`;
- `share`;
- `fund`;
- `index`.

Limit:

- default: `20`;
- max: `50`.

Response shape:

```json
{
  "items": [],
  "filters": [
    { "id": "all", "label": "Все" },
    { "id": "share", "label": "Акции" },
    { "id": "fund", "label": "Фонды" },
    { "id": "index", "label": "Индексы" }
  ],
  "counts": null
}
```

Source rules:

- primary source: `moex_securities`;
- safe supplement: `d_tickers` only for explicit index cases such as `IMOEX`;
- no broad `d_tickers` fallback;
- no fake rows;
- no counts;
- no unsupported classes in V1;
- no `instrumentType = instrument` rows in browse responses.

## 7. Files changed during accepted Browse V1

Relevant accepted files:

- `fingineerwebapp/src/config/api.js`;
- `fingineerwebapp/.env.example`;
- `fingineerwebapp/src/components/SearchForm.js`;
- `fingineerwebapp/src/components/SearchForm.css`;
- `backend2/app.js`;
- `backend2/routes/instruments.js`;
- `backend2/services/db.js`;
- `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`.

Clarifications:

- `SearchModal` was restored / remains non-target;
- chart files were restored / remain non-target;
- `ExpandedSearchPicker.js`, `ExpandedSearchPicker.css`, and `useInstrumentBrowse.js` wrong-surface attempt were removed;
- current accepted Browse Mode surface is the main `SearchForm` picker only.

## 8. Wrong turns / reverted attempts

Wrong-surface attempt:

- Browse Mode was initially placed into `SearchModal` / expanded-related flow;
- it created `ExpandedSearchPicker.js`, `ExpandedSearchPicker.css`, and `useInstrumentBrowse.js`;
- it touched `ChartToolbar`, `ChartContent`, and `ChartRenderer`;
- it was rejected because the target surface is the main `SearchForm`, not `SearchModal` or expanded toolbar;
- wrong-surface slice was reverted.

Routing mistake:

- later main `SearchForm` browse attempt initially hit backend1 on port `3001`;
- it fetched `localhost:3001/api/instruments/browse`;
- that route returned `404`;
- routing anchor was added before UI work continued;
- final Browse Mode fetch uses backend2 through `config.INSTRUMENTS_API_URL`.

## 9. Manual runtime QA evidence

| Scenario | Expected / observed result | Result |
|---|---|---|
| empty focused `SearchForm` | Browse Mode opens with chips and rows. | PASS |
| `Все` | calls `localhost:3002/api/instruments/browse?type=all&limit=20`, returns `200 OK`, footer `Показать все инструменты`. | PASS |
| `Акции` | calls `type=share`, returns `200 OK`, footer `Показать все акции`. | PASS |
| `Фонды` | calls `type=fund`, returns `200 OK`, footer `Показать все фонды`. | PASS |
| `Индексы` | calls `type=index`, returns `200 OK`, row `IMOEX`, footer `Показать все индексы`. | PASS |
| fast chip switching | works; canceled requests are expected due to `AbortController`. | PASS |
| typing `s` | Browse Mode hides. | PASS |
| typing `sb` / `sber` | typed suggestions appear. | PASS |
| clear query | Browse Mode returns. | PASS |
| browse row click | opens selected ticker through backend1 `/api/ticker/<ticker>`. | PASS |
| typed suggestion click | opens selected ticker. | PASS |
| valid `sber` + `Enter` | opens `SBER` after suggestions are available. | PASS |
| empty `Enter` | no action. | PASS |
| outside click | picker closes. | PASS |
| `Escape` | picker closes. | PASS |
| garbage query + `Enter` | does not call `/api/ticker/<garbage>`. | PASS |
| garbage query + `Показать` | does not call `/api/ticker/<garbage>`. | PASS |
| fast `SBER` + instant `Enter` before suggestions | accepted no-op; no app error. | PASS |
| `SearchModal` / expanded search | remains typed-search-only and does not call browse endpoint. | PASS |

## 10. Accepted product decisions

- Search picker identifies instruments; it does not recommend.
- No recommendation words.
- No buy/sell/signal/FOMO wording.
- Browse chips are limited to `all` / `share` / `fund` / `index`.
- `Все` currently means all safely supported instruments returned by current browse endpoint, not full MOEX universe.
- Footer has no counts.
- Footer is non-clickable.
- `Показать все инструменты` / `Показать все акции` / `Показать все фонды` / `Показать все индексы` are reserved affordances, not actions in V1.
- Unknown catalog/source completeness is debt, not a UI bug.

## 11. Deferred / technical debt

Primary references:

- `DEBT-FE-005`;
- `TASK-DEBT-FE-005`.

Related earlier fallback/source debt:

- `DEBT-FE-004`;
- `TASK-DEBT-FE-004`.

Deferred items:

- catalog/source coverage audit;
- compare current DB catalog with expected MOEX universe;
- validate share/fund/index mapping;
- future decision for bonds/futures/options;
- future counts;
- pagination/full list;
- full results action;
- recent queries;
- keyboard arrow navigation;
- active highlighted row;
- `Tab` behavior;
- accessibility warning: input should have `id` or `name`.

## 12. Future safe entry points

Possible next prompts:

- `MODE: EXECUTE / SEARCHFORM KEYBOARD NAVIGATION V1`;
- `MODE: DIAGNOSE / SEARCHFORM FULL RESULTS ACTION ANCHOR`;
- `MODE: DIAGNOSE / SEARCHFORM RECENT QUERIES ANCHOR`;
- `MODE: DIAGNOSE / SEARCHFORM CATALOG SOURCE AUDIT`;
- `MODE: EXECUTE / SEARCHFORM ACCESSIBILITY POLISH V1`;
- `MODE: DECISION / NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SLICE`.

## 13. Rollback notes

Frontend Browse Mode can be disabled by removing from `SearchForm`:

- browse state;
- browse fetch;
- filter rail;
- browse result rendering;
- browse footer logic;
- outside-click / `Escape` close behavior if Owner wants full rollback of Browse V1.

Typed suggestions baseline should be preserved unless explicitly rolling back the older `2026-06-08` Search Suggestions V1 baseline.

Backend browse endpoint can remain harmless even if frontend Browse Mode is disabled.

Do not rollback baseline `SearchSuggestionItem` unless reverting the older `2026-06-08` baseline.

## 14. Verification

This was a docs-only handoff creation.

No product build required.

Post-creation checks:

- new file created under `.claude/handoffs/active/FG_search_suggestions_v1_2026/`;
- existing `FG_search_suggestions_v1_closure_handoff_2026-06-08.md` was not overwritten;
- no product code was intentionally touched by this handoff task.
