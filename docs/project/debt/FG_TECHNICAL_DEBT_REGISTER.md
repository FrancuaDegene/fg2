# FG Technical Debt Register

## Статус

`active / global debt register`

## Назначение

Единый реестр технического долга FG.

Этот файл нужен, чтобы debt не терялся между sprint, phase и session.

Это не backlog, не sprint plan и не product roadmap.

## Правило записи debt

Каждый debt item должен фиксировать:

1. что именно остаётся debt;
2. почему не patch сейчас;
3. trigger возврата к patch;
4. минимальный future patch candidate;
5. likely touched files;
6. риск, если забыть.

## Правило закрытия debt

Debt item считается закрытым только если заполнены:

- `Status = closed` или `superseded`;
- `Close condition`;
- `Closed by / Evidence`;
- `Last reviewed`.

Нельзя закрывать debt без evidence.

## Статусы

| Status | Meaning |
|---|---|
| `open` | debt признан, но ещё не разобран до решения |
| `watch` | debt есть, patch сейчас не нужен, нужен trigger |
| `blocked-by-owner-decision` | нужен Owner / product / API / architecture decision |
| `deferred` | Owner decision записан, patch перенесён в будущий scope |
| `patch-ready` | есть bounded patch candidate |
| `in-progress` | patch / slice уже начат |
| `qa-limited` | patch есть, но QA ограничен data / tooling / runtime условиями |
| `closed` | debt закрыт с evidence |
| `superseded` | debt заменён новым решением / архитектурой |

## Debt Audit Table

| ID | Status | Area | Short debt | Owner blocker | Trigger | Close condition | Evidence | Last reviewed |
|---|---|---|---|---|---|---|---|---|
| `DEBT-FE-001` | `watch` | frontend / chart boundary | Compact/socket ownership remains in `App.js` | patch not bounded now | chart-heavy scenario; runtime bug; owner conflict; failure/cache divergence | patch + runtime QA OR superseded architecture decision | open | `2026-06-01` |
| `DEBT-FE-002` | `deferred` | frontend / News API contract | Frontend expects `result.news`, backend exposes `/api/news` | Owner decision recorded: real News data contract deferred to future scope | Owner chooses News data contract; product/design needs News; integration slice approved | Owner/API decision + patch + QA OR explicit future defer decision with evidence | not closed yet | `2026-06-01` |
| `DEBT-FE-003` | `deferred` | frontend / dashboard data contract | `DashboardColumn` may present mixed mock/partial-real dashboard truth | Owner decision recorded: dashboard scope stays inactive in this sprint | Owner activates dashboard/product-design scope | minimal dashboard data contract defined before implementation OR explicit future defer decision with evidence | not closed yet | `2026-06-03` |
| `DEBT-FE-004` | `watch` | frontend / search suggestions / instrument catalog data quality | Fallback/unknown suggestion rows can present suspicious metadata such as external-looking names rendered as `Инструмент · MOEX` | source/data ownership not anchored yet | source/catalog quality pass; repeated suspicious fallback rows; Owner-approved backend/source investigation; browse/catalog mode needs reliable classification | bounded source-quality anchor accepted, then backend/source decision and patch if needed | open | `2026-06-10` |
| `DEBT-FE-005` | `open / watch` | frontend / SearchForm browse mode / instrument catalog source coverage | SearchForm Browse Data V1 is accepted, but current browse catalog coverage, class support, and universe completeness are not audited yet | current DB/source coverage not proven against expected MOEX universe | source/catalog audit activation; Browse Mode quality pass; Owner-approved backend/source investigation; future counts/pagination/full list scope | catalog/source audit accepted, then backend/source decision and patch if needed | open | `2026-06-11` |
| `DEBT-DATA-001` | `deferred` | data / instrument reference / sector industry taxonomy | MOEX instruments lack source-backed sector and industry classification | requires data-model/source decision before importer or UI consumption | Owner activates sector/industry enrichment, CompanyInfo needs sector/industry display, or instrument catalog/reference import begins | source-backed sector/industry data model + enrichment path accepted and CompanyInfo consumes verified fields OR debt superseded by catalog architecture | CompanyInfo sector/industry research 2026-06-13 | `2026-06-13` |

## Debt Task Queue

Эта таблица фиксирует задачи, выведенные из debt items.

Задача в этой таблице не означает автоматический product-code patch.

Task становится активной patch-задачей только после выполнения entry trigger и явного Owner approval.

| Task ID | Linked debt | Task | Type | Status | Entry trigger | Owner decision needed | Candidate patch / action | Likely touched files | Verification needed | Done condition |
|---|---|---|---|---|---|---|---|---|---|---|
| `TASK-DEBT-FE-001` | `DEBT-FE-001` | Compact/socket chart ownership extraction spike | architecture / patch-readiness | `watch / trigger-not-met` | new chart-heavy scenario; runtime bug; confirmed owner conflict; failure/cache divergence | yes, before patch | decide whether to extract compact/socket ownership into `useCompactChartData` or compact chart transport adapter | `App.js`; new hook/helper; possible narrow Chart boundary integration point | compact + expanded chart runtime QA | patch-readiness decision accepted OR debt superseded |
| `TASK-DEBT-FE-002-A` | `DEBT-FE-002` | News data contract Owner decision | product/API decision | `completed / decision-recorded` | current Phase 4 evidence already collected | yes | decide: general `/api/news` feed, ticker-specific News, or deferred/test-only surface | no product files unless decision doc is created | decision recorded in Phase 4 docs | Owner decision recorded in Phase 4 docs |
| `TASK-DEBT-FE-002-B` | `DEBT-FE-002` | News data integration or fixture QA slice | implementation / QA | `deferred / waiting-news-scope` | Owner activates News data integration or fixture QA | yes | after decision: connect `/api/news`, restore ticker-specific contract, or run test-only fixture QA | `App.js`; `Results.js`; `News.js`; `config/api.js`; backend news/ticker route/service if needed | News runtime QA with real news or approved fixture QA | patch + QA accepted OR explicit future defer decision |
| `TASK-DEBT-FE-003` | `DEBT-FE-003` | Dashboard minimal data-contract decision before build/design | product/design / contract | `deferred / waiting-dashboard-scope` | Owner activates dashboard/product-design scope | yes | define minimal dashboard data contract before any `DashboardColumn` implementation or design build | `DashboardColumn.jsx`; `ChartContent.js`; possible `ChartRenderer.js`; possible dashboard data hook/adapter | dashboard data-contract review before implementation | contract accepted before implementation OR explicit future defer decision |
| `TASK-DEBT-FE-004` | `DEBT-FE-004` | Instrument suggestions source/catalog quality anchor | source-quality / anchor | `watch / trigger-not-met` | source/catalog quality pass; repeated suspicious fallback rows; Owner-approved backend/source investigation; browse/catalog mode needs reliable classification | yes, before source patch | trace suspicious rows and decide whether fallback metadata should be omitted, reclassified, or excluded from top suggestions | backend suggestions route/service/query file; normalized suggestions source logic; possible source mapping helper; frontend only if display contract changes | bounded source-quality anchor + backend/source decision; runtime QA after approved patch | source-quality decision accepted OR debt superseded |
| `TASK-DEBT-FE-005` | `DEBT-FE-005` | SearchForm browse catalog/source coverage audit | source-quality / browse-catalog audit | `open / watch` | Browse Mode quality pass; Owner-approved backend/source investigation; future counts/pagination/full list scope | yes, before source patch | audit current DB instruments against expected MOEX universe, validate share/fund/index mapping, identify missing/unsupported classes, and decide future scope for bonds/futures/options plus counts/pagination/full list | backend browse route/service/query file; normalized instruments source logic; possible source mapping helper; frontend only if display contract changes after backend decision | bounded catalog/source audit + backend/source decision; runtime QA after approved patch | catalog/source audit accepted OR debt superseded |
| `TASK-DEBT-DATA-001-A` | `DEBT-DATA-001` | Define FG sector and industry taxonomy data model | data architecture / source contract | `deferred / waiting-data-scope` | Owner approves sector/industry enrichment or instrument reference catalog scope | yes | define source priority and DB fields for issuer identity, sector index membership, OKVED mapping, FG sector/industry labels | `docs/project/data/*`; future backend importer/service files; future DB migration files; CompanyInfo only after data contract is accepted | sample mapping QA for SBER, GAZP, AFKS, ABRD, LKOH, GMKN, MTSS, AFLT | data model accepted and future patch candidate becomes bounded OR debt superseded |

## Debt Cards

### `DEBT-FE-001` — App <-> Chart compact/socket ownership remains in `App.js`

Status:

`watch`

Area:

`frontend / chart boundary`

Debt:

Compact/socket chart ownership remains in `App.js`.

Why deferred / blocked:

Patch сейчас не bounded. Он затрагивает socket lifecycle, cache, inflight, loading/error, ownership transitions и search/result reset flow.

Trigger:

Вернуться к patch, если появится:

- new chart-heavy scenario;
- runtime bug;
- confirmed owner conflict;
- failure/loading/cache divergence;
- explicit Owner-approved compact/socket ownership patch prompt.

Minimal future patch candidate:

Extract compact/socket chart ownership into `useCompactChartData` or compact chart transport adapter.

Likely touched files:

- `fingineerwebapp/src/App.js`
- new hook/helper for compact chart ownership
- possible narrow Chart boundary integration point only with new evidence

Verification needed:

Runtime QA for compact/expanded chart flow.

Close condition:

Patch + runtime QA accepted OR superseded by new chart architecture decision.

Closed by / Evidence:

open

Last reviewed:

`2026-06-01`

### `DEBT-FE-002` — News data contract drift

Status:

`deferred`

Area:

`frontend / News legacy boundary / API contract`

Debt:

Frontend visible News path expects `result.news` from `/api/ticker/{ticker}`, but current backend ticker payload does not include `news`.

At the same time `/api/news` exists and returns a general news array from `blog_posts`.

Why deferred / blocked:

Owner decision recorded: real News data contract is deferred to future News product/API scope.

Phase 4 accepted only bounded legacy safety:

- `News.js` safety patch applied;
- no-news runtime safety accepted;
- full News item runtime QA remains unproven with real `news[]`;
- no real News data integration restored in this sprint.

Trigger:

Вернуться к patch, если произойдёт одно из условий:

- Owner activates News product/API scope;
- product/design scope needs News;
- ticker-specific news endpoint appears;
- Owner approves News data integration slice;
- Owner approves test-only fixture QA for `News.js`.

Minimal future patch candidate:

Choose one after Owner/API decision:

1. connect `/api/news` as general legacy news feed and correct UI label;
2. restore ticker-specific news contract;
3. keep News deferred and only maintain test-only fixture QA.

Likely touched files:

- `fingineerwebapp/src/App.js`
- `fingineerwebapp/src/components/Results/Results.js`
- `fingineerwebapp/src/components/Results/News/News.js`
- `fingineerwebapp/src/config/api.js`
- backend news/ticker route or service files if ticker-specific contract is chosen

Verification needed:

News UI runtime QA with real news data or approved fixture QA.

Close condition:

Owner/API decision + patch + QA OR explicit future defer decision with evidence.

Closed by / Evidence:

open

Last reviewed:

`2026-06-01`

### `DEBT-FE-003` — DashboardColumn data-contract / mock-real merge risk

Status:

`deferred`

Area:

`frontend / dashboard boundary / data contract`

Debt:

`DashboardColumn` data-contract / mock-real merge risk.

Design/build may rely on mixed mock/partial-real data as product truth.

Why deferred / blocked:

Dashboard not active scope.

Phase 5 was accepted only as `decision-only deferred`.

No dashboard implementation is approved in this sprint.

Trigger:

Вернуться к patch, если:

- Owner activates dashboard/product-design scope;
- dashboard enters active product/design line;
- explicit Owner-approved dashboard contract prompt appears.

Minimal future patch candidate:

Define minimal dashboard data contract before implementation.

Likely touched files:

- `DashboardColumn.jsx`
- `ChartContent.js`
- possible `ChartRenderer.js`
- possible dashboard data hook/adapter

Verification needed:

Dashboard data-contract review before implementation; runtime QA only after approved implementation scope exists.

Close condition:

Minimal dashboard data contract accepted before implementation OR explicit future defer decision with evidence.

Closed by / Evidence:

open

Last reviewed:

`2026-06-03`

### `DEBT-FE-004` — Instrument suggestions catalog/source quality for fallback instruments

Status:

`watch`

Area:

`frontend / search suggestions / instrument catalog data quality`

Debt:

Search suggestions can return fallback/unknown instruments with suspicious metadata, for example external-looking names under query `sy` rendered as `Инструмент · MOEX`.

This may indicate catalog/source mapping ambiguity, fallback source leakage, or insufficient source classification.

Why not patch now:

Current slice is UI/product design for Search Suggestions base results panel.

Fixing this requires source/data investigation, not visual patching.

No DB/source ownership proof has been collected yet.

Trigger:

Return to this when:

- Search Suggestions source/catalog quality pass is activated;
- repeated suspicious fallback rows appear in QA;
- Owner approves backend/source investigation;
- full browse/catalog mode requires reliable instrument classification.

Minimal future patch candidate:

Run bounded source-quality anchor for suggestions backend:

- trace source table for suspicious rows;
- check how `instrumentType`, `exchange`, `country`, `currency`, `sourceTable` are assigned;
- decide whether fallback rows should omit exchange/currency, be classified differently, or be excluded from top suggestions.

Likely touched files:

- backend suggestions route/service/query file;
- normalized suggestions source logic;
- possible source mapping helper;
- frontend only if display contract changes after backend decision.

Risk if forgotten:

FG may present uncertain catalog rows as if they are clean MOEX instruments, reducing trust in Instrument Picker and creating false precision in search results.

Close condition:

Bounded source-quality anchor accepted, then backend/source decision and patch if needed.

Closed by / Evidence:

open

Last reviewed:

`2026-06-10`

### `DEBT-FE-005` — SearchForm Browse Mode instrument catalog/source coverage audit

Status:

`open / watch`

Area:

`frontend / SearchForm browse mode / instrument catalog source coverage`

Debt:

`SearchForm Browse Data V1` accepted, but current browse lists are limited by the active DB/source slice and are not yet audited against the expected MOEX instrument universe.

`Все` may look too similar to `Акции` because current backend sorting/limit returns the first instruments in source order.

`Фонды` and `Индексы` expose only what the current source mapping safely supports.

`Облигации`, `Фьючерсы` and `Опционы` remain outside V1 because backend mapping for those classes is not accepted.

Why not patch now:

Current `SearchForm Browse Data V1` is accepted as a bounded frontend/backend slice with chips limited to `all / share / fund / index`.

This debt is about catalog/source coverage and instrument-universe quality, not about the accepted V1 UI or endpoint wiring.

No full DB/source audit has been completed yet.

Non-goals:

- no implementation now;
- no backend migration now;
- no adding fake instruments;
- no adding unsupported chips.

Trigger:

Return to this when:

- SearchForm Browse Mode quality pass is activated;
- Owner approves backend/source investigation for catalog coverage;
- browse/catalog quality issues appear in QA;
- future scope needs counts, pagination, or a fuller catalog surface.

Minimal future patch candidate:

Run a bounded catalog/source audit for SearchForm Browse Mode:

- audit current DB instruments used by browse endpoint;
- compare available FG catalog with expected MOEX universe;
- validate current mapping for `share`, `fund`, `index`;
- identify missing or unsupported classes;
- make a future decision for `bond`, `future`, `option`;
- decide whether counts, pagination, and fuller list coverage are safe.

Likely touched files:

- `backend2/routes/instruments.js`
- `backend2/services/db.js`
- possible normalized instruments source helper / mapping helper
- frontend only if display contract changes after backend decision

Risk if forgotten:

SearchForm Browse Mode may appear complete while actually exposing only a narrow slice of the instrument universe, which can blur the difference between accepted V1 scope and real catalog coverage.

Close condition:

Bounded catalog/source audit accepted, then backend/source decision and patch if needed.

Closed by / Evidence:

open

Last reviewed:

`2026-06-11`

### `DEBT-DATA-001` — Source-backed sector and industry classification missing

Status:

`deferred`

Area:

`data / instrument reference / sector industry taxonomy`

Debt:

FG currently does not have source-backed sector/industry classification for MOEX instruments.

`CompanyInfo` can show `sectorLabel` only as null/`—`; no `industryLabel` exists yet.

MOEX `SECTORID` is not reliable as a human label in the current local table.

Sectoral index membership is useful but incomplete.

OKVED route via issuer INN is likely needed for fuller industry classification.

Why deferred / blocked:

Requires a data-model/source decision before importer work or UI consumption.

Current evidence shows:

- local `moex_securities.SECTORID` is empty for checked TQBR names;
- local DB does not currently contain enough issuer/industry classification fields;
- MOEX sectoral indices cover some liquid names only;
- fuller coverage likely needs issuer INN + OKVED enrichment path.

Trigger:

Вернуться к этому debt, если:

- Owner activates sector/industry enrichment;
- `CompanyInfo` needs sector/industry display;
- instrument catalog/reference import begins.

Minimal future patch candidate:

- define `instrument_reference`;
- define sector index membership fields;
- define issuer industry classification fields;
- define source priority:
  1. source-backed FG mapping if accepted;
  2. MOEX sectoral index membership when current;
  3. OKVED / issuer INN mapping;
  4. manual review only with evidence;
- only then update `CompanyInfo` to consume `sectorLabel` and `industryLabel`.

Likely touched files:

- `docs/project/data/*`
- future backend importer/service files
- future DB migration files
- `CompanyInfo` only after data contract is accepted

Verification needed:

Sample mapping QA for `SBER`, `GAZP`, `AFKS`, `ABRD`, `LKOH`, `GMKN`, `MTSS`, `AFLT`.

Close condition:

Source-backed sector/industry data model + enrichment path accepted and `CompanyInfo` consumes verified fields OR debt superseded by catalog architecture.

Closed by / Evidence:

CompanyInfo sector/industry research 2026-06-13

Last reviewed:

`2026-06-13`

## Notes

- `closed` без evidence запрещён.
- `qa-limited` не равно `closed`.
- `blocked-by-owner-decision` не равно `rejected`.
- Если debt переносится в новый sprint, ссылка на новый sprint / phase должна быть добавлена в `Closed by / Evidence` или в отдельную note.
