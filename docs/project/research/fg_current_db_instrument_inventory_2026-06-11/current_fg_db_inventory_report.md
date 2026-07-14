# Current FG DB instrument inventory report

Date: 2026-06-11

## Scope

Маленький read-only inventory текущей FG DB и backend source usage для будущего `FG Instrument Catalog / MOEX ISS Source Expansion Sprint`.

Guardrails kept:
- only `SELECT`, `SHOW`, `DESCRIBE`;
- no product patch;
- no DB writes;
- no browser;
- no frontend build.

## DB inventory summary

### 1. `moex_securities`

- Current backend owner:
  - `backend2/services/db.js:getSuggestions`
  - `backend2/services/db.js:getBrowseInstruments`
  - `backend2/services/db.js:getTickerSnapshot`
- Row count: `161974`
- Distinct `SECID`: `485`
- Distinct `BOARDID`: `11`
- Relevant fields:
  - `SECID`
  - `BOARDID`
  - `SHORTNAME`
  - `SECNAME`
  - `INSTRID`
  - `SECTYPE`
  - `CURRENCYID`
  - `STATUS`
  - `MARKETCODE`
  - `ISIN`
- Evidence:
  - backend canonicalizes one row per `SECID` with board priority and `STATUS='A'` bias
  - grouped combos show major populations:
    - `EQIN + 1` -> `92111`
    - `EQIN + 2` -> `20198`
    - `IFTF + J` -> `18911`
    - `IFA1 + B` -> `11253`
  - top boards:
    - `TQBR` -> `59904`
    - `SMAL` -> `40997`
    - `TQIF` -> `21239`
    - `TQTF` -> `18609`
    - `SPEQ` -> `16005`
- Product reading:
  - safe enough for current bounded search/browse slice
  - not yet proven as a full future `instrument_catalog` source without classifier audit
- Key risk:
  - all fields are stored mostly as `text`
  - `MARKETCODE` distribution is suspiciously coarse:
    - `FNDT` -> `145969`
    - `RPST` -> `16005`
  - suggests source normalization should not trust one field blindly

### 2. `d_tickers`

- Current backend owner:
  - `backend2/services/db.js:getSuggestions`
  - `backend2/services/db.js:getBrowseInstruments` as safe `IMOEX` supplement only
- Row count: `1273`
- Distinct `secid`: `1273`
- Relevant fields:
  - `secid`
  - `name`
  - `country`
  - price/growth snapshot fields
- Evidence:
  - external-looking rows appear immediately:
    - `A` / `Agilent Technologies`
    - `AA` / `Alcoa`
    - `AAL` / `American Airlines`
  - `country` is `NULL` for all `1273` rows
  - `IMOEX` exists exactly once
- Product reading:
  - not product-safe as broad instrument source
  - only bounded-safe today as explicit `IMOEX` supplement
- Key risk:
  - broad supplement from `d_tickers` leaks non-MOEX / ambiguous rows into picker space

### 3. `moex_marketdata`

- Current backend owner:
  - `backend2/services/db.js:getTickerSnapshot`
- Row count: `778440`
- Distinct `SECID`: `3`
- Distinct `BOARDID`: `1`
- Coverage evidence:
  - only:
    - `SBER / TQBR`
    - `GAZP / TQBR`
    - `SVCB / TQBR`
  - time range:
    - `min SYSTIME = 2023-01-02T03:50:00.000Z`
    - `max SYSTIME = 2023-12-29T20:50:00.000Z`
- Product reading:
  - not a broad current-market source
  - only a very narrow legacy/stored time series source for current ticker snapshot path
- Key risk:
  - snapshot endpoint shape suggests broader market truth than table coverage actually supports

### 4. `moex_dividend_yields`

- Current backend owner:
  - `backend2/services/db.js:getDividends`
- Row count: `93`
- Distinct `secid`: `82`
- Relevant fields:
  - `secid`
  - `issuer_full_name`
  - `security_type`
  - `decision_date`
  - `dividends_2018`
  - `dividends_2019`
  - `dividends_2020`
  - `dividend_history`
  - `dividend_policy`
- Product reading:
  - partial legacy dividend dataset
  - usable for current legacy dividend endpoint only
- Key risk:
  - coverage is tiny
  - model is frozen around 2018-2020 yield fields, not a general dividend event history

### 5. `tgbot_ticker_list`

- Current backend owner:
  - `backend2/services/db.js:getTickerSnapshot`
- Row count: `141844`
- Relevant fields:
  - `name`
  - `fullname`
  - `description`
- Evidence:
  - rows with non-empty `description`: only `15`
  - rows with empty `description`: `141829`
  - `SBER` rows exist, but table appears duplicated / noisy
  - sample non-empty rows include mixed language and human text blobs
- Product reading:
  - legacy content source for `description`
  - not a clean instrument metadata catalog
- Key risk:
  - enormous row count hides extremely low useful description coverage

### 6. `ticker_mapping`

- Current backend owner:
  - no current `backend2` usage found in probe
- Row count: `211`
- Relevant fields:
  - `full_name`
  - `ticker_symbol`
- Product reading:
  - legacy/unused mapping candidate
- Key risk:
  - no active product route consumes it now, so it is not current source truth

### 7. `moex_dataversion`

- Current backend owner:
  - no direct `backend2` usage found in probe
- Fields:
  - `data_version`
  - `seqnum`
- Product reading:
  - operational metadata only
- Key risk:
  - not enough evidence that current app uses it for freshness/control

## Backend source usage summary

### `GET /api/suggestions/:query`

- Route: `backend2/routes/suggestions.js`
- Query gate: `sanitizeQuery` in `backend2/utils/validators.js`
- Data source:
  - primary: `moex_securities`
  - supplement: `d_tickers`
- Current product logic:
  - canonicalize per `SECID`
  - map only:
    - `share`
    - `fund`
    - `index` only through `IMOEX`
    - fallback `instrument`
- Current limitation:
  - broad `d_tickers` dataset is structurally unsafe except for bounded supplement use

### `GET /api/instruments/browse`

- Route: `backend2/routes/instruments.js`
- Data source:
  - primary: `moex_securities`
  - supplement: safe `IMOEX` from `d_tickers` only
- Current product logic:
  - supports only:
    - `all`
    - `share`
    - `fund`
    - `index`
  - `counts = null`
- Current limitation:
  - future bond/future/option catalog still blocked by unproven classification contract

### `GET /api/ticker/:ticker`

- Route: `backend2/routes/ticker.js`
- Query gate: `sanitizeTicker`
- Data source:
  - `moex_securities` filtered to `BOARDID = 'TQBR'`
  - `moex_marketdata` filtered to `BOARDID = 'TQBR'`
  - `tgbot_ticker_list` for free-text `description`
- Current limitation:
  - `moex_marketdata` coverage is only 3 tickers
  - `tgbot_ticker_list` descriptions are mostly empty

### `GET /api/dividends?searchQuery=...`

- Route: `backend2/routes/dividends.js`
- Query gate: `sanitizeSearchQuery`
- Data source:
  - `moex_dividend_yields`
- Current limitation:
  - limited symbol coverage
  - historic yield-style schema, not event-grade dividend history

## Overall conclusion

Для будущего `instrument_catalog` у FG уже есть usable local anchors, но current source truth фрагментирован:

- `moex_securities` = strongest current local base, but still only partial-safe
- `d_tickers` = risky broad supplement, safe only for explicit `IMOEX`
- `moex_marketdata` = narrow/stale snapshot support, not catalog truth
- `moex_dividend_yields` = narrow legacy dividend slice
- `tgbot_ticker_list` = legacy description source with very low useful density

This is enough for a future bounded source-expansion sprint anchor, but not enough to declare current DB ready for a full honest `instrument_catalog`.
