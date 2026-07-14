# Evidence index

Date: 2026-06-11

## Primary evidence packs

### 1. MOEX ISS probe

Path:

`docs/project/research/moex_iss_catalog_probe_2026-06-11/`

What it proves:

- MOEX ISS endpoint/source availability at a small probe level
- market-specific source families exist:
  - `/iss/engines/stock/markets/shares/securities`
  - `/iss/engines/stock/markets/bonds/securities`
  - `/iss/engines/futures/markets/forts/securities`
  - `/iss/engines/futures/markets/options/securities`
- `SBMX` provides proven fund/ETF evidence
- dividends endpoint is cheaply reachable
- history/candles are board-aware

What it does not prove:

- full universe completeness
- accepted classifier contract
- importer strategy
- freshness strategy

### 2. Current FG DB inventory

Path:

`docs/project/research/fg_current_db_instrument_inventory_2026-06-11/`

What it proves:

- current FG DB coverage
- current backend source usage
- strongest local baseline is `moex_securities`
- current local truth is fragmented across:
  - `moex_securities`
  - `d_tickers`
  - `moex_marketdata`
  - `moex_dividend_yields`
  - `tgbot_ticker_list`

What it does not prove:

- honest full `instrument_catalog` readiness
- safe broad index/fund classifier contract
- modern dividend/corporate-actions model

### 3. Local classifier compare

Path:

`docs/project/research/fg_local_classifier_compare_2026-06-11/`

What it proves:

- local classifier confidence for current bounded V1 rules
- `EQIN + ('1','2')` is locally supported for share candidate
- `IFTF + 'J'` is locally supported for fund candidate
- `IMOEX` remains the only explicit safe index supplement
- `IFA1`, `EIND`, `IFAY`, `IFTU`, `IFTE` still need audit

What it does not prove:

- full future catalog classifier contract
- Browse V2 family expansion
- bonds/futures/options local UI-safe mapping

## Supporting domain anchor

### Instrument Picker contract

Path:

`docs/domain/FG_INSTRUMENT_PICKER_CONTRACT.md`

What it proves:

- current product role of Instrument Picker
- current accepted narrow source rules
- current V1 is not a license to expand source/model scope
