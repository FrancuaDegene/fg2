# Search Suggestions V1 / Instrument Picker baseline — closure handoff

## 1. Status

`completed / manual runtime QA passed`

Slice:

`Search Suggestions V1 / Instrument Picker baseline`

Date:

`2026-06-08`

This handoff is supporting continuity evidence only. It does not override Project Sources, current-state, or Owner decisions recorded elsewhere.

## 2. Purpose

Record the completed Search Suggestions V1 implementation slice: what changed, which product/data decisions were accepted, what QA passed, what remains deferred, and how the slice can be resumed or rolled back safely.

The slice started as a frontend identification improvement for search suggestions and expanded into backend source normalization after runtime/manual evidence showed that the legacy `ticker_mapping` source was incomplete.

## 3. Scope

Included:

- compact search suggestions in `SearchForm`;
- modal search suggestions in `SearchModal`;
- shared two-line `SearchSuggestionItem`;
- backend normalized suggestion source inside `getSuggestions()`;
- compatibility with existing `{ ticker, company_name }` response shape;
- additive metadata fields for future UI use.

Excluded:

- DB mutation;
- `CREATE VIEW`;
- migration / seed / import;
- chart, dashboard, News, AI/Summary work;
- broad frontend redesign;
- TradingView-style filters/tabs;
- source-pack or current-state update.

## 4. Authority / Source routing

Project source routing remains:

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_analytical_workspace_ux_design_current_state_2026-06-03.md`
5. `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md`
6. `docs/project/debt/FG_TECHNICAL_DEBT_REGISTER.md`
7. `docs/project/policy/FG DNA — CANONS v1.4 (WORKING).md`

Relevant stable boundary:

- `docs/domain/FG_FRONTEND_FOUNDATION_CONTRACTS.md` accepts `Search` suggestions as a bounded hardening candidate.
- current-state still says the broader analytical workspace implementation scope requires Owner decision.

This handoff preserves implementation context only.

## 5. Files changed

Frontend:

- `fingineerwebapp/src/components/SearchForm.js`
- `fingineerwebapp/src/components/SearchForm.css`
- `fingineerwebapp/src/components/SearchModal/SearchModal.js`
- `fingineerwebapp/src/components/SearchModal/SearchModal.css`
- `fingineerwebapp/src/components/SearchSuggestionItem/SearchSuggestionItem.js`
- `fingineerwebapp/src/components/SearchSuggestionItem/SearchSuggestionItem.css`
- `fingineerwebapp/src/hooks/useSearch.js`

Backend:

- `backend2/services/db.js`

Inspected but not changed for this slice closure:

- `backend2/routes/suggestions.js`

Note:

- `git status --short` is dirty with many unrelated existing changes. Do not stage broad paths. Stage only exact intended pathspecs if Owner later requests commit/staging.

## 6. Product decisions accepted

- Suggestions identify instruments; they do not recommend instruments.
- No buy/sell/signal/FOMO wording.
- Search/Input remains a calm entry into analysis.
- Primary compact search action label is `Показать`.
- Suggestion row is a two-line identity item:
  - ticker + display name;
  - instrument type + country + exchange + currency when known.
- Similar instruments must be distinguishable, especially `SBER` / `SBERP`.
- False precision is worse than fallback.
- If backend returns `currency = null`, UI omits currency instead of inventing `RUB`.
- Suffix-based classification such as `ticker.endsWith("P")` is not allowed.

## 7. Frontend implementation summary

`SearchSuggestionItem` became the shared suggestion renderer.

`SearchForm` and `SearchModal` both render suggestions through:

`fingineerwebapp/src/components/SearchSuggestionItem/SearchSuggestionItem.js`

Implemented behavior:

- displays ticker;
- displays display name;
- displays compact icon label;
- displays metadata line;
- supports backend metadata fields:
  - `instrumentType`;
  - `shareClass`;
  - `country`;
  - `exchange`;
  - `currency`.

Final label derivation:

- backend metadata first;
- safe text heuristics only as fallback;
- final fallback: `Инструмент`.

Accepted frontend labels:

- `instrumentType = share`, `shareClass = ordinary` -> `Акция обыкновенная`;
- `instrumentType = share`, `shareClass = preferred` -> `Акция привилегированная`;
- `instrumentType = share`, no safe `shareClass` -> `Акция`;
- `instrumentType = fund` -> `Фонд`;
- `instrumentType = index` -> `Индекс`;
- `instrumentType = bond` -> `Облигация`;
- `instrumentType = future` -> `Фьючерс`;
- `instrumentType = option` -> `Опцион`;
- unknown / missing metadata -> safe fallback.

Currency handling:

- `SUR` / `RUR` is normalized to `RUB`;
- empty / null currency is omitted from the metadata line.

## 8. Backend implementation summary

`backend2/services/db.js -> getSuggestions()` was switched from legacy `ticker_mapping` to a normalized CTE source.

No DB objects were created.

No DB rows were mutated.

Route remained unchanged:

`backend2/routes/suggestions.js`

The route still calls:

`getSuggestions(query)`

Endpoint compatibility was preserved:

- old fields:
  - `ticker`;
  - `company_name`;
- additive metadata:
  - `displayName`;
  - `instrumentType`;
  - `shareClass`;
  - `country`;
  - `exchange`;
  - `currency`;
  - `board`;
  - `status`;
  - `sourceTable`.

MySQL version was checked manually by Owner:

`8.0.39 MySQL Community Server - GPL`

Window functions are supported, so `ROW_NUMBER() OVER (PARTITION BY SECID ...)` is valid for the current local DB.

## 9. Data/source decision

Accepted source model:

- `moex_securities` is primary source for tradable instruments.
- `d_tickers` is supplement source for missing non-tradable/index cases like `IMOEX`.
- `ticker_mapping` is legacy fallback / old source, not the future target model.

Canonical board rule:

- shares prefer `TQBR`;
- funds / ETFs prefer `TQTF`;
- fallback priority:
  - `TQBR`;
  - `TQTF`;
  - `SMAL`;
  - `SPEQ`;
  - other.

Instrument type rules:

- `INSTRID = 'EQIN'` and `SECTYPE IN ('1','2')` -> `share`;
- `INSTRID = 'IFTF'` and `SECTYPE = 'J'` -> `fund`;
- `d_tickers.secid = 'IMOEX'` -> `index`;
- otherwise -> `instrument`.

Share class rules:

- `INSTRID = 'EQIN'` and `SECTYPE = '1'` -> `ordinary`;
- `INSTRID = 'EQIN'` and `SECTYPE = '2'` -> `preferred`;
- otherwise -> `null`.

Search ranking:

1. exact ticker match;
2. ticker prefix;
3. display name prefix;
4. contains match.

Limit:

`LIMIT 20`

## 10. Runtime/manual QA evidence

Manual runtime QA passed after frontend and backend restart:

| Query | Expected | Observed |
|---|---|---|
| `sber` | `SBER`, `SBERP` | PASS |
| `sberp` | `SBERP` | PASS |
| `gazp` | `GAZP` | PASS |
| `sbmx` | `SBMX` | PASS |
| `imoex` | `IMOEX` | PASS |
| `vk` | `VKCO` | PASS |
| `lkoh` | `LKOH` | PASS |

Manual label QA passed:

| Ticker | Expected label/meta | Observed |
|---|---|---|
| `SBER` | `Акция обыкновенная · Россия · MOEX · RUB` | PASS |
| `SBERP` | `Акция привилегированная · Россия · MOEX · RUB` | PASS |
| `GAZP` | `Акция обыкновенная · Россия · MOEX · RUB` | PASS |
| `SBMX` | `Фонд · Россия · MOEX · RUB` | PASS |
| `IMOEX` | `Индекс · Россия · MOEX` | PASS |
| `VKCO` | `Акция обыкновенная · Россия · MOEX · RUB` | PASS |
| `LKOH` | `Акция обыкновенная · Россия · MOEX · RUB` | PASS |

Earlier direct backend service checks also confirmed:

- `sber` returns `SBER`, `SBERP`;
- `sbmx` returns `SBMX`;
- `imoex` returns `IMOEX`;
- no duplicate ticker rows for target queries;
- returned objects include old compatibility fields and additive metadata.

## 11. Build/verification evidence

Frontend build:

`cmd /c npm run build`

Result:

`passed / compiled with warnings`

Warnings were existing broad warnings outside this slice:

- existing CRA/ESLint warnings outside changed file;
- existing `baseline-browser-mapping` warning;
- existing `Browserslist` / `caniuse-lite` age warning.

Backend verification:

- direct service checks passed after backend patch;
- endpoint compatibility shape preserved by `getSuggestions()` response mapping;
- no browser QA was run by Codex in this closure handoff task.

## 12. Guardrails preserved

- DB mutation: no.
- `CREATE VIEW`: no.
- `CREATE TABLE`: no.
- migration: no.
- seed/import: no.
- backend route mutation: no.
- frontend broad redesign: no.
- `App.js`: not part of this slice.
- chart: untouched in this slice.
- dashboard: untouched in this slice.
- News: untouched in this slice.
- source pack/current-state: untouched in this handoff-only closure.

## 13. Known deferred items

Deferred, not bugs in this slice:

- keyboard active suggestion / arrow navigation / Enter selected row behavior;
- zero-results UX refinement;
- loading/error suggestion states refinement;
- SearchModal broader visual redesign;
- TradingView-style filters/tabs;
- recent searches / watchlist / logos;
- full `instrument_catalog` physical table or DB view;
- importer/parser pipeline for MOEX/ISS or other external source;
- broader instrument classes:
  - bonds;
  - futures;
  - options;
  - multi-country support;
- Results identity handoff;
- Compact Result Shell baseline;
- performance/indexing review for normalized CTE if suggestion traffic grows;
- move CTE into normalized DB view/catalog later if rules stabilize;
- documentation update in project state/source pack, if Owner asks later.

## 14. Risks / follow-up debt

Risk:

- normalized CTE is now in backend service code, not a DB view/catalog.

Mitigation:

- acceptable as bounded source switch with no DB mutation;
- if rules stabilize, move to normalized DB view/catalog later.

Risk:

- broader instrument classification is intentionally incomplete.

Mitigation:

- unknown cases fall back to `instrument`;
- false precision remains disallowed.

Risk:

- `SearchSuggestionItem.js` currently contains Cyrillic labels and should remain UTF-8 clean.

Mitigation:

- future edits should run UTF-8/mojibake sanity checks.

Risk:

- `git status` is dirty with many unrelated changes.

Mitigation:

- stage only exact intended paths if Owner asks for commit.

Post-search chart request issue observed outside this slice:

- after submit / `Показать`, chart request can fail with `Некорректные параметры запроса графика`;
- console/cache key example: `GAZP/3mth/15m/NA`;
- similar examples were observed for `SBER` and `SBERP`;
- classified as App/chart request parameter issue, not Search Suggestions V1;
- needs separate bounded anchor before patch:
  `MODE: ANCHOR / POST-SEARCH CHART REQUEST INVALID PARAMS TRACE`.

## 15. Rollback notes

Frontend rollback:

- revert shared `SearchSuggestionItem` usage and metadata label changes;
- fallback to previous inline/basic suggestion rendering if needed.

Backend rollback:

- revert `backend2/services/db.js -> getSuggestions()` to legacy `ticker_mapping` query.

DB rollback:

- none, because DB was not mutated.

Route rollback:

- none, because `backend2/routes/suggestions.js` was not changed.

## 16. Next safe entry

`MODE: DECISION / NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SLICE`

This is the safe default if Owner does not want docs/status propagation first.

## 17. Recommended next prompt

Two valid next paths:

1. `MODE: EXECUTE / SEARCH SUGGESTIONS V1 STATUS DOC SYNC`
2. `MODE: DECISION / NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SLICE`

Recommendation:

- choose `MODE: EXECUTE / SEARCH SUGGESTIONS V1 STATUS DOC SYNC` first only if Owner wants project docs updated to record this implementation slice;
- otherwise continue with `MODE: DECISION / NEXT ANALYTICAL WORKSPACE IMPLEMENTATION SLICE`.

Chart playbook check:

This session does not modify FG Chart Engine architecture and does not require updating `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`.
