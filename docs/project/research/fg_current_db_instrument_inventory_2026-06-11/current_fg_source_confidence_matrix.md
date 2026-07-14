# Current FG source confidence matrix

Date: 2026-06-11

## Table confidence

| Source table | Current backend role | Confidence | Why |
| --- | --- | --- | --- |
| `moex_securities` | main source for suggestions, browse and first ticker lookup | partial | strongest current local source, but future catalog classification still needs audit |
| `d_tickers` | broad supplement in suggestions, explicit `IMOEX` supplement in browse | legacy | contains external-looking rows, all `country` null, safe only in bounded supplement role |
| `moex_marketdata` | ticker snapshot pricing | legacy | only 3 covered `SECID`, one board, time range ends in 2023 |
| `moex_dividend_yields` | dividends endpoint | partial | usable for legacy dividend response, too small and too fixed-schema for broader truth |
| `tgbot_ticker_list` | ticker description text | legacy | huge table but only 15 non-empty descriptions |
| `ticker_mapping` | no active use found | unknown | maybe useful historically, not current source truth |
| `moex_dataversion` | no active use found | unknown | operational metadata only in this probe |

## Endpoint / function confidence

| Endpoint / function | Source tables | Returned product fields | Confidence | Known limitations |
| --- | --- | --- | --- | --- |
| `GET /api/suggestions/:query` / `getSuggestions` | `moex_securities`, `d_tickers` | `ticker`, `displayName`, `instrumentType`, `shareClass`, `country`, `exchange`, `currency`, `board`, `status`, `sourceTable` | partial | current product-safe only because supplement is bounded in practice; raw `d_tickers` is risky |
| `GET /api/instruments/browse` / `getBrowseInstruments` | `moex_securities`, safe `IMOEX` from `d_tickers` | same normalized instrument fields plus route-level `filters`, `counts=null` | partial-safe | narrow accepted filter set only; no counts; no bonds/futures/options |
| `GET /api/ticker/:ticker` / `getTickerSnapshot` | `moex_securities`, `moex_marketdata`, `tgbot_ticker_list` | company name, prices, description, sector, exchange | partial-to-legacy | price source covers only 3 tickers; description source mostly empty |
| `GET /api/dividends` / `getDividends` | `moex_dividend_yields` | issuer/dividend/yield fields | partial-to-legacy | tiny coverage and old fixed-year fields |

## Safe source reading for future work

### Safest current local base

`moex_securities`

Use as the first local baseline for future source-expansion comparison, but only with explicit classifier proof.

### Safe bounded supplement

`d_tickers` only for explicit known-safe cases like `IMOEX`.

### Not safe as broad catalog truth

- raw `d_tickers`
- `moex_marketdata`
- `tgbot_ticker_list`

## Confidence verdict

Current FG local source stack is:

- enough for bounded current picker behavior
- not enough for a future honest full `instrument_catalog` without a dedicated source-audit sprint
