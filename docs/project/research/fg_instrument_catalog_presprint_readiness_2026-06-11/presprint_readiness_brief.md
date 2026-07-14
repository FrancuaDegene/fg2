# FG Instrument Catalog / MOEX ISS Source Expansion pre-sprint readiness brief

Date: 2026-06-11

## Readiness verdict

Future sprint status:

- `not active yet`
- `ready for Owner activation decision later`
- `blocked from implementation until Phase 0 / Phase 1 / Phase 2 are formally accepted`

## Current safe conclusions

### Proven enough for current SearchForm V1

- current SearchForm V1 remains `partial-safe`
- current V1 rules are intentionally narrow:
  - `EQIN + SECTYPE in ('1','2')` -> share candidate
  - `IFTF + SECTYPE = 'J'` -> fund candidate
  - explicit `IMOEX` from `d_tickers` -> bounded index supplement
- `moex_securities` is the strongest current local baseline
- `d_tickers` must remain bounded supplement only

### Proven enough for future sprint planning

- MOEX ISS source families are reachable at evidence level:
  - shares
  - bonds
  - futures
  - options
  - per-security detail
  - dividends
- MOEX ISS `SBMX` probe proved fund/ETF evidence inside the shares family
- current FG DB source truth is fragmented but mapped enough to plan a classifier audit
- local classifier compare proved:
  - what is narrow-safe now
  - what is still ambiguous

### Not proven enough for DB / importer / UI expansion

- `moex_securities` is not yet proven as final `instrument_catalog`
- local classifier contract is not accepted for:
  - `IFA1`
  - `EIND`
  - `IFAY`
  - `IFTU`
  - `IFTE`
- Browse V2 expansion is blocked until classifier audit
- bonds / futures / options UI are not justified yet
- dividends via MOEX ISS look like a good future early import candidate, but not now

## Activation readiness

The future sprint is ready only for an Owner activation decision, not for execution.

That means:

- enough evidence exists to justify a bounded activation decision later
- not enough authority exists yet to start implementation
- no importer/schema/UI work should begin before formal Phase 0 entry
