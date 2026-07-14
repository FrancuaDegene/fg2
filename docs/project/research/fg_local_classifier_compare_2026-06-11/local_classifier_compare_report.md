# Local moex_securities classifier compare report

Date: 2026-06-11

## Scope

Маленький read-only classifier compare по локальной таблице `moex_securities` с опорой на уже существующие research packs:

- `docs/project/research/moex_iss_catalog_probe_2026-06-11/`
- `docs/project/research/fg_current_db_instrument_inventory_2026-06-11/`

Guardrails kept:
- only `SELECT`, `SHOW`, `DESCRIBE`
- no product patch
- no DB writes
- no browser
- no build
- no new external MOEX fetch

## Population summary

### Top populations

- by `INSTRID`
  - `EQIN` -> `114585`
  - `IFA1` -> `23103`
  - `IFTF` -> `18911`
  - `EILP` -> `2952`
  - `EIND` -> `1246`

- by `SECTYPE`
  - `1` -> `94707`
  - `2` -> `20554`
  - `J` -> `19859`
  - `B` -> `12321`
  - `9` -> `7665`
  - `A` -> `4304`
  - `D` -> `2276`
  - `F` -> `288`

- by `INSTRID + SECTYPE`
  - `EQIN + 1` -> `92111`
  - `EQIN + 2` -> `20198`
  - `IFTF + J` -> `18911`
  - `IFA1 + B` -> `11253`
  - `IFA1 + 9` -> `7492`
  - `IFA1 + A` -> `4248`
  - `EQIN + D` -> `2276`
  - `EIND + B` -> `1068`
  - `EIND + F` -> `178`

- by `BOARDID`
  - `TQBR` -> `59904`
  - `SMAL` -> `40997`
  - `TQIF` -> `21239`
  - `TQTF` -> `18609`
  - `SPEQ` -> `16005`
  - `TQPI` -> `3657`

- by `MARKETCODE`
  - `FNDT` -> `145969`
  - `RPST` -> `16005`

- by `STATUS`
  - `A` -> `159812`
  - `N` -> `2162`

## Classifier evidence summary

### 1. `EQIN` + `SECTYPE in ('1','2')` as share candidate

Verdict:
- `supported by sample evidence`

Why:
- dominant local population:
  - `EQIN + 1` -> `92111`
  - `EQIN + 2` -> `20198`
- distinct sample rows look like ordinary/preferred shares across `TQBR`, `SMAL`, `SPEQ`
- `SBER` board/detail logic from MOEX ISS probe is conceptually aligned with local multi-board share pattern

Important boundary:
- `EQIN` itself is not enough
- `EQIN + D` exists and looks like depositary receipt / ADR / GDR class, not plain share

### 2. `IFTF` + `SECTYPE = 'J'` as fund candidate

Verdict:
- `supported by sample evidence`

Why:
- `IFTF + J` is a clean large population: `18911`
- distinct sample rows look consistent:
  - `AKAI ETF`
  - `AKFB ETF`
  - `AKGD ETF`
  - `AMNY ETF`
- local board/currency pattern also fits the MOEX ISS `SBMX` fund evidence:
  - local funds appear on `TQTF`
  - some also appear on currency-specific boards like `TQTY`

Important boundary:
- `IFTF + J` is not the whole fund universe locally
- there are fund-looking rows outside `IFTF`, for example:
  - `IFAY`
  - `IFTU`
  - `IFTE`

### 3. Explicit `IMOEX` from `d_tickers` as index supplement

Verdict:
- `supported by sample evidence`

Why:
- explicit row exists:
  - `secid = IMOEX`
  - `name = Индекс ММВБ`
- current bounded usage remains honest because it does not generalize beyond this explicit known-safe case

### 4. `EIND`

Verdict:
- `suspicious / needs more evidence`

Why:
- local rows look fund-like / closed-fund-like:
  - `ЗПИФ ...`
  - `ПИФ ...`
- but combos are mixed:
  - `EIND + B` -> `1068`
  - `EIND + F` -> `178`
- no accepted product contract yet for how `EIND` should map

### 5. `IFA1`

Verdict:
- `suspicious / needs more evidence`

Why:
- rows clearly look fund-like:
  - `ОПИФ`
  - `ПИФ`
  - `ИПИФ`
  - `ЗПИФ`
- but local populations split across several `SECTYPE` values:
  - `B`
  - `9`
  - `A`
  - `F`
- boards also vary:
  - mostly `TQIF`
  - also `SMAL`, `TQPI`, `TQFD`, `TQFE`

So `IFA1` may matter for a future richer fund taxonomy, but it is not safe yet for current bounded V1 mapping.

## Edge cases

### 1. Same `SECID` across multiple boards

Strongly present.

Examples:
- `DSKY` -> `SMAL,SPEQ,TQBR,TQPI`
- `SBER` -> `SMAL,SPEQ,TQBR`
- `GAZP` -> `SMAL,SPEQ,TQBR`
- `ABIO` -> `SMAL,SPEQ,TQBR`

Implication:
- `SECID` alone is not enough for raw local row truth
- canonical board priority remains necessary

### 2. `MARKETCODE` is weak as classifier

Evidence:
- almost everything is `FNDT`
- the only other large value is `RPST`

Implication:
- `MARKETCODE` helps separate some board contexts like `SPEQ`, but it is not a trustworthy primary type classifier

### 3. `SECTYPE = 'D'` inside `EQIN`

Evidence:
- `EQIN + D` -> `2276`
- sample rows:
  - `AGRO-гдр`
  - `CIAN-адр`
  - `ETLN-гдр`
  - `FIVE-гдр`
  - `OZON-адр`

Implication:
- future catalog must not flatten all `EQIN` into plain shares

### 4. Fund-looking rows outside `IFTF`

Evidence:
- `IFAY`, `IFTU`, `IFTE` rows with `SECTYPE='J'`
- examples:
  - `CNYM ETF`
  - `TEUR ETF`
  - `TECH ETF`
  - `TGLD ETF`
  - `TSPX ETF`

Implication:
- current V1 `fund = IFTF + J` is intentionally narrow, not exhaustive

### 5. Non-active rows exist in otherwise valid classes

Examples:
- `AMRB ETF` -> `IFTF + J`, `STATUS='N'`
- `SPBC` -> `IFTF + J`, `STATUS='N'`
- `FIVE-гдр` -> `EQIN + D`, `STATUS='N'`

Implication:
- `STATUS` should remain part of canonical ranking and browse ordering

### 6. Missing `CURRENCYID` / `ISIN`

In this micro-probe:
- no missing `CURRENCYID` rows found in first edge check
- no missing `ISIN` rows found in first edge check

Implication:
- positive sign, but not enough to treat coverage as globally proven

## Compare with existing MOEX ISS probe

Evidence-level comparison only:

- MOEX ISS `SBMX` probe showed fund evidence inside shares market family using:
  - `BOARDID = TQTF`
  - `MARKETCODE = FNDT`
- local `IFTF + J` sample is consistent with that surface pattern:
  - `TQTF`
  - `FNDT`
  - fund/ETF naming

- MOEX ISS `SBER` probe showed multiple boards for one security
- local `moex_securities` sample confirms the same multi-board reality across shares

- bonds/futures/options source families exist in MOEX ISS probe, but this local compare did not prove a safe local classifier contract for them

## Conclusion

- Current SearchForm V1: `partial-safe`
- Future `instrument_catalog`: `needs classifier audit`
- Browse V2 expansion: `blocked`
