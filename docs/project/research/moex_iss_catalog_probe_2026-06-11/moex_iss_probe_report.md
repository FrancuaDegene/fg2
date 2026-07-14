# MOEX ISS catalog probe report

Date: 2026-06-11

## Purpose

Собрать маленький read-only source probe для будущего `FG Instrument Catalog / MOEX ISS Source Expansion Sprint` без активации sprint и без product/backend изменений.

## Scope and guardrails

- public MOEX ISS only;
- only metadata, columns, 1-3 sample rows;
- no full universe download;
- no DB mutation;
- no frontend/backend route changes;
- no SearchForm/SearchModal work;
- no importer design.

## Small probe findings

### 1. Broad catalog exists, but it is noisy

`/iss/securities.json?limit=3` reachable and useful as a source inventory surface, but tiny sample already showed mixed/non-core catalog rows. Это хороший discovery endpoint, но плохой прямой source для FG picker без жесткой фильтрации и дополнительной normalization logic.

### 2. Market-specific catalog families look more promising

На маленьком probe лучше всего выглядят market-specific endpoints:

- shares: `/iss/engines/stock/markets/shares/securities`
- bonds: `/iss/engines/stock/markets/bonds/securities`
- futures: `/iss/engines/futures/markets/forts/securities`
- options: `/iss/engines/futures/markets/options/securities`

Они дают более предметную схему, `dataversion` и живую `marketdata`, а также отдельные `columns` endpoints с field dictionary.

### 3. Fund / ETF evidence is proven inside shares family

`/iss/engines/stock/markets/shares/securities/SBMX.json` returned a valid fund sample:

- `BOARDID = TQTF`
- `MARKETCODE = FNDT`
- `SECNAME = БПИФ Первая Топ Рос. акций`

Это полезный pre-sprint anchor: future `fund` filter можно пытаться строить на proven fields from shares family, а не на ticker suffix / UI heuristics.

### 4. Single-security detail endpoint is useful for validation, not primary browse source

`/iss/securities/SBER.json` и `/iss/securities/SBMX.json` вернули `description` + `boards`. Это хороший candidate для later detail enrichment, board validation и contract debugging, но не primary browse list source.

### 5. Dividends are cheaply reachable

`/iss/securities/SBER/dividends.json?limit=3` reachable and simple. Tiny probe confirmed fields:

- `secid`
- `isin`
- `registryclosedate`
- `value`
- `currencyid`

Это выглядит как дешёвый later source for dividend history inventory.

### 6. History/candles are board-aware

`/iss/history/engines/stock/markets/shares/securities/SBER/candles...` returned both `history` and `history.cursor`. В маленьком sample были rows for both `SMAL` and `TQBR`. Значит для future integration нужен явный board-selection rule; simple `SECID` alone is not enough.

### 7. Corp-actions dividends endpoint is not yet confirmed

`/iss/cci/corp-actions/dividends.json?limit=3` failed in this tiny probe with JSON parse error:

- `Invalid JSON primitive: .`

Это не доказывает, что endpoint unusable. Скорее всего там нужен другой response format, parameterization или content handling. Пока это только open question.

## Mapping candidates for future sprint

### Safer early candidates

1. Shares browse/search normalization:
   - source family: `/iss/engines/stock/markets/shares/securities`
   - support with `/columns`
   - validate per-security via `/iss/securities/{SECID}`

2. Funds/ETF inside shares market family:
   - proven by `SBMX`
   - use only proven fields like `BOARDID`, `MARKETCODE`, possibly `INSTRID` / `SECTYPE` after deeper audit

3. Bonds/futures/options:
   - source families are reachable
   - schemas are inventory-ready
   - classification rules still need dedicated mapping decision before UI exposure

4. Dividends:
   - cheap per-security history source exists

5. Candles/history inventory:
   - endpoint family exists and exposes pagination cursor
   - board disambiguation remains required

## Failed / unavailable in this probe

| Endpoint path | Result | Note |
| --- | --- | --- |
| `/iss/cci/corp-actions/dividends.json?limit=3` | failed | JSON parse error in simple probe; likely needs different format/handling |

## Risks and unknowns

- broad `/iss/securities` catalog is noisy and likely unsuitable as-is for picker UX;
- shares family probably mixes ordinary shares, funds and other stock-market instruments, so later filter rules need proof;
- board multiplicity is real even for one `SECID`;
- derivative families are reachable, but UI-safe classification is not yet designed;
- counts/universe completeness were intentionally not audited in this micro-probe;
- no freshness/caching/import strategy was explored.

## Recommended next step after Codex limit refresh

Сделать следующий bounded anchor, still pre-sprint:

1. compare 10-20 rows across:
   - `/iss/securities`
   - `/iss/engines/stock/markets/shares/securities`
   - one proven fund sample like `SBMX`
2. identify the minimum proven classifier fields for:
   - share
   - fund
   - index if discoverable
3. separately probe one cheap index candidate path;
4. separately inspect corp-actions response format before using it in any contract.

No sprint activation recommended from this probe alone.
