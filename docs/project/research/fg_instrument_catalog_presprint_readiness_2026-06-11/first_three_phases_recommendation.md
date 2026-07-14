# First three phases recommendation

Date: 2026-06-11

## Phase 0 - sprint activation / source bootstrap

Purpose:

- activate the sprint intentionally
- bind the evidence
- freeze non-goals
- prevent premature UI/DB work

Output:

- sprint folder
- sprint contract
- accepted evidence baseline

## Phase 1 - evidence consolidation + current DB/source confidence acceptance

Purpose:

- consolidate current FG local source truth
- accept the confidence level of:
  - `moex_securities`
  - `d_tickers`
  - `moex_marketdata`
  - `moex_dividend_yields`
  - `tgbot_ticker_list`
- explicitly accept what is baseline, bounded supplement, legacy, and unsafe

Output:

- accepted source confidence note
- accepted current local baseline
- accepted blocked areas

## Phase 2 - classifier contract audit for local families and MOEX ISS comparison

Purpose:

- compare local families against MOEX ISS evidence
- decide what local classifier combinations are trustworthy
- decide what stays blocked

Must include:

- `EQIN`
- `IFTF`
- `IFA1`
- `EIND`
- `IFAY`
- `IFTU`
- `IFTE`
- explicit `IMOEX`

Output:

- accepted classifier contract
- explicit blocked families
- explicit prerequisites before any Browse V2 expansion

## Not recommended yet

- full importer design
- schema design
- DB migration
- physical `instrument_catalog`
- direct UI expansion
