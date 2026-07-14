# Do-not-start-yet guardrails

Date: 2026-06-11

## Hard guardrails before activation

Do not start:

- no `instrument_catalog` table
- no DB migration
- no Search Picker Browse V2 chips
- no bonds/futures/options UI
- no direct frontend MOEX ISS calls
- no broad `d_tickers` usage
- no fake counts
- no fake rows
- no real-time claims

## Additional pre-activation guardrails

- no importer/parser implementation
- no broad backend source rewrite
- no schema commitment
- no MOEX ISS freshness strategy claims
- no dividend import implementation
- no chart/news/dashboard scope merge

## Why these guardrails matter

- current V1 rules are intentionally narrow
- current local baseline is only partial-safe
- future catalog still needs classifier audit
- MOEX ISS availability is proven, but production contract is not

## Recommended next Codex prompt after limit refresh

`MODE: DECISION / ACTIVATE FG INSTRUMENT CATALOG MOEX ISS SOURCE EXPANSION SPRINT`
