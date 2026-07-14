# Local classifier decision notes

Date: 2026-06-11

## Current V1 decision

### Current SearchForm V1

Verdict:
- `partial-safe`

Why:
- current bounded mapping has strong local support for:
  - `EQIN + SECTYPE in ('1','2')` -> share candidate
  - `IFTF + SECTYPE = 'J'` -> fund candidate
  - explicit `IMOEX` -> index supplement from `d_tickers`
- these rules are narrow enough to avoid pretending that all local families are understood

### Future instrument_catalog

Verdict:
- `needs classifier audit`

Why:
- `EQIN` also contains `SECTYPE='D'` rows that look like ADR/GDR
- fund-looking local rows exist in `IFA1`, `IFAY`, `IFTU`, `IFTE`, and `EIND`
- `MARKETCODE` is too coarse to act as primary classifier
- multi-board duplication is pervasive

### Browse V2 expansion

Verdict:
- `blocked`

Why:
- local evidence does not yet prove safe classifier rules for:
  - bonds
  - futures
  - options
- even broader fund/index coverage is not classifier-safe yet

## Which local fields are safe enough now

Preliminarily trustworthy for current bounded V1 behavior:

- `INSTRID`
- `SECTYPE`
- `BOARDID`
- `STATUS`
- `SECID`
- `ISIN`

But only in combination, not in isolation.

Safe current combinations:

- share candidate:
  - `INSTRID='EQIN'` + `SECTYPE in ('1','2')`
- fund candidate:
  - `INSTRID='IFTF'` + `SECTYPE='J'`
- ranking / canonical selection help:
  - `BOARDID`
  - `STATUS`

## Which local fields are not yet safe for future catalog truth

Not safe as standalone classifier truth:

- `MARKETCODE`
- `INSTRID='EQIN'` alone
- `SECTYPE` alone
- `BOARDID` alone

Not yet safe without dedicated audit:

- `IFA1`
- `EIND`
- `IFAY`
- `IFTU`
- `IFTE`

## What blocks future instrument_catalog

- no accepted classifier contract for all locally visible instrument families
- no safe rule for depositary receipts vs plain shares beyond bounded exclusion logic
- no audited mapping for broader fund families
- no local classifier proof for bonds/futures/options
- no decision whether future source truth remains local-DB-first or becomes hybrid with MOEX ISS

## What blocks Browse V2 chips for bonds/futures/options

- current local compare did not prove any safe local family mapping for those chips
- current accepted product contract only supports:
  - `all`
  - `share`
  - `fund`
  - `index`
- MOEX ISS research says those source families exist, but this local classifier compare does not prove the local DB contract

## Recommended next step after Codex limit refresh

Safest next bounded step:

1. run one more read-only compare on local families:
   - `IFA1`
   - `EIND`
   - `IFAY`
   - `IFTU`
   - `IFTE`
2. decide whether they collapse into one broader `fund` family or require subtype handling
3. separately inspect whether any local rows can support an honest local `index` family beyond explicit `IMOEX`
4. only after that discuss Browse V2 chip expansion
