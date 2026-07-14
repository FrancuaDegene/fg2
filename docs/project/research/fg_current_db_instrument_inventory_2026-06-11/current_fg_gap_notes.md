# Current FG gap notes vs future instrument_catalog

Date: 2026-06-11

## Main gaps

### 1. No single trusted instrument catalog source yet

Current product truth is split across:

- `moex_securities`
- `d_tickers`
- `tgbot_ticker_list`
- `moex_marketdata`
- `moex_dividend_yields`

Each source solves only one slice, and several are clearly legacy/partial.

### 2. Classifier proof is incomplete

Current browse/suggestions logic proves only a bounded mapping:

- `EQIN` + `SECTYPE in ('1','2')` -> `share`
- `IFTF` + `SECTYPE = 'J'` -> `fund`
- `IMOEX` from `d_tickers` -> safe explicit `index` supplement

Future `instrument_catalog` still lacks proven local rules for:

- bonds
- futures
- options
- broader index coverage

### 3. `d_tickers` is too risky as broad supplement

Evidence shows:

- external-looking names
- all `country` null
- mixed non-MOEX looking universe

So future source expansion must not widen `d_tickers` usage casually.

### 4. Ticker snapshot source stack is not catalog-grade

`getTickerSnapshot` depends on:

- `moex_securities`
- `moex_marketdata`
- `tgbot_ticker_list`

But:

- `moex_marketdata` covers only `SBER`, `GAZP`, `SVCB`
- `tgbot_ticker_list` has only `15` non-empty descriptions out of `141844`

This means current ticker details stack is not a proof of catalog completeness.

### 5. Dividend source is narrow and legacy-shaped

`moex_dividend_yields`:

- only `93` rows
- only `82` distinct `secid`
- fixed old-year dividend columns

This is a legacy dividend slice, not a future general corporate-actions model.

### 6. Unused/unclear local tables still need ownership decision

- `ticker_mapping`
- `moex_dataversion`

They may be useful later, but current backend probe does not prove them as active product truth.

## What is safe today

- keep `moex_securities` as the main current local instrument baseline
- keep `d_tickers` narrowed to explicit safe supplement usage only
- treat `moex_marketdata`, `tgbot_ticker_list`, `moex_dividend_yields` as legacy/partial side-sources

## What blocks future `instrument_catalog`

- no audited classifier contract across current DB sources
- no trusted broad local index source beyond bounded `IMOEX`
- no accepted local mapping for bonds/futures/options
- no proof that current DB universe matches intended MOEX picker/catalog universe
- no decision whether future truth should stay DB-first, MOEX ISS-first, or hybrid

## Recommended next step after Codex limit refresh

Run one more bounded read-only comparison slice:

1. compare local `moex_securities` classifier populations against MOEX ISS shares/funds/index anchors;
2. inspect 10-20 local rows for:
   - `EQIN`
   - `IFTF`
   - `EIND`
   - `IFA1`
3. decide which local classifier fields are trustworthy enough to keep;
4. only then define future `instrument_catalog` source contract.
