# Handoff: Source Authority Contract Path And ChartContainer Cleanup Applied

## Session Metadata
- Created: 2026-03-12 +03:00
- Project: `d:\Projects\FG\fg\FG2`
- Scope: finalize the explicit `sourceAuthority` contract path and apply the accepted `ChartContainer.js` cleanup for Expanded data handoff

## Handoff Chain

- Continues from: [2026-03-11-data-source-ownership-step-1-confirmed.md](./2026-03-11-data-source-ownership-step-1-confirmed.md)
- Related closed milestone: [2026-03-11-selection-ownership-stabilization-regression-confirmed.md](./2026-03-11-selection-ownership-stabilization-regression-confirmed.md)

> Read `2026-03-11-data-source-ownership-step-1-confirmed.md` first for the accepted outer-source ownership model. Do not reopen the closed selection ownership milestone.

## Current State Summary

This session completed the explicit `sourceAuthority: 'app' | 'rest'` contract path from `App.js` down to `ChartContainer.js`, then applied the one-file cleanup patch in `ChartContainer.js` so the handoff boundary no longer guesses source truth from local heuristics. `ChartContainer.js` now branches from explicit `sourceAuthority`, keeps the `app` authority branch outer-driven, and applies the accepted REST readiness policy:

- if `sourceAuthority === 'rest'` and request inputs are incomplete -> explicit empty / idle REST state
- if `sourceAuthority === 'rest'` and inputs are complete but `agg.meta` is not ready -> explicit empty / loading REST state
- if `sourceAuthority === 'rest'` and ready -> authoritative REST payload

No final post-patch verification prompt was applied in this session. No final build/lint/runtime confirmation was recorded after the final `ChartContainer.js` cleanup patch.

## Accepted Architectural Decisions

### Closed And Not Reopened

- Selection ownership remains closed:
  - `App` = canonical owner for `currentTimeframe`
  - `App` = canonical owner for `currentInterval`
  - `App` = canonical owner for `isExpanded`
  - `ChartContainer` = bridge / sync only
  - `ChartContext` = passive mirror only
- `currentCandleType` ownership was not reopened
- Engine ownership in `useChartData` / `useFGTimeNavigation` was not reopened

### Data-Source Authority Model

- `App` owns source authority
- `useCandles` is transport-only
- `ChartContainer` is handoff-only
- `ChartContext` is storage-only

### Explicit Contract

- Accepted contract: `sourceAuthority: 'app' | 'rest'`
- Contract path introduced step by step:
  - `fingineerwebapp/src/App.js`
  - `fingineerwebapp/src/components/Results/Results.js`
  - `fingineerwebapp/src/components/Results/Chart/Chart.js`
  - `fingineerwebapp/src/components/Results/Chart/ChartContainer.js`

### `ChartContainer.js` Cleanup Decisions

- `ChartContainer.js` was the accepted cleanup boundary
- Silent arbitration was identified around:
  - local source choice
  - local readiness choice
  - mixed `rangeKey` identity
  - separate source decisions for `data` / `loading` / `meta`
- Accepted neutral-state contracts before apply:
  - neutral `chartMeta` must use the existing initializer object shape from `ChartContext`
  - disabled `loadMoreHistory` must be explicit `undefined`

## Completed This Session

### Files Confirmed Changed

- `fingineerwebapp/src/App.js`
  - introduced origin `sourceAuthority`
  - relayed `sourceAuthority` into `<Results />`
- `fingineerwebapp/src/components/Results/Results.js`
  - accepted `sourceAuthority`
  - relayed `sourceAuthority` into `<Chart />`
- `fingineerwebapp/src/components/Results/Chart/Chart.js`
  - accepted `sourceAuthority`
  - relayed `sourceAuthority` into `<ChartContainer />`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js`
  - consumed `sourceAuthority` at the cleanup boundary
  - replaced local source-truth guessing with explicit `sourceAuthority`-driven branching
  - removed mixed-authority `rangeKey` fallback in the REST handoff path
  - applied the accepted REST readiness policy

### Code State Anchors

- `fingineerwebapp/src/App.js:34`
- `fingineerwebapp/src/App.js:489`
- `fingineerwebapp/src/components/Results/Results.js:33`
- `fingineerwebapp/src/components/Results/Results.js:163`
- `fingineerwebapp/src/components/Results/Chart/Chart.js:40`
- `fingineerwebapp/src/components/Results/Chart/Chart.js:231`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:33`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:50`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:69`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:99`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:105`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:125`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:138`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:199`

## Not Completed

- no final verification prompt was applied after the cleanup patch
- no final build/lint confirmation was recorded after that patch
- no final runtime smoke verification was recorded after that patch
- no follow-up cleanup outside `ChartContainer.js` was started

## Verification Status

- Validation script status: not run
- Reason: this session followed `CODEX_RULES.md`; no explicit `MODE: TEST + ALLOW TERMINAL` was given for running validation scripts
- Manual completeness check: completed
  - no `[TODO: ...]` placeholders remain
  - completed vs not-completed is explicitly separated
  - no invented test/build/runtime results were added

## Immediate Next Steps

1. Verify the final state of `fingineerwebapp/src/components/Results/Chart/ChartContainer.js` against the accepted patch intent
2. Run build/lint if available
3. Run manual smoke check for Expanded flow:
   - `app` authority path
   - `rest` authority path
   - timeframe switch
   - interval switch
   - not-ready REST phase must not show stale outer chart
   - ready REST phase must hand off authoritative REST payload
   - `loadMoreHistory` must not survive from the wrong source
4. Use debug panel evidence to confirm writer order and handoff behavior

## Next Single Frontier

Post-cleanup verification of the final `ChartContainer.js` handoff behavior under both `sourceAuthority` branches. The next session should verify the applied patch before starting any further cleanup outside `ChartContainer.js`.

## Risks To Check First

- the final `ChartContainer.js` patch is applied but not yet re-verified
- the not-ready REST phase must not retain stale outer chart state
- `loadMoreHistory` must clear correctly when REST authority is not ready
- debug panel evidence should confirm handoff order and absence of mixed-authority fallback

## Playbook Check

Does this session modify FG Chart Engine architecture and require updating `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`?

YES.

Reason:
- this session introduced an explicit upstream ownership contract into the chart path
- it changed the accepted ownership boundary for the Expanded handoff layer by making `ChartContainer.js` explicit-contract-driven instead of heuristic-driven
- it also established a concrete REST not-ready handoff policy for `data` / `loading` / `meta` / `loadMoreHistory`

Exact section to update next:
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
- append to `## 3. Ownership Model`
- add a short note that:
  - `App` owns source authority for Expanded data handoff
  - `sourceAuthority` is the explicit upstream contract
  - `ChartContainer` is a handoff boundary only
  - under REST authority, not-ready phases must not fall back to outer `chartData` / `loading` / `meta`



