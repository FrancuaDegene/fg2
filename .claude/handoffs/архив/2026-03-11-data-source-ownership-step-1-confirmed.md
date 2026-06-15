# Handoff: Data Source Ownership Step 1 Confirmed

## Session Summary

This session closed the first `data source ownership` stabilization step after the earlier closed milestones for selection ownership and `currentCandleType`. The concrete change was localized to [useCandles.js](/d:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js): the REST request identity no longer depends on mirror-state from `ChartContext` for `timeframe / interval`. Instead, the REST path now uses explicit outer props as its request-identity source.

The architectural question addressed in this session was: should the Expanded REST candle path continue to build request identity from mixed sources, or should it align with the already-closed selection ownership boundary where `App -> ChartContainer` owns `timeframe / interval` and `ChartContext` is only a mirror. This session confirmed the first cleanup step toward explicit outer-owned REST request identity.

Earlier closed milestones remain closed and were not reopened:
- selection ownership milestone
- `currentCandleType` milestone
- first `ChartContainer.js` data-source stabilization step

## Files Changed

- [useCandles.js](/d:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js)
  - removed `ChartContext` import/use from the REST transport hook
  - removed `tfFromContext` / `intervalFromContext` as REST identity inputs
  - introduced outer-prop identity usage for:
    - request `signature`
    - `effectiveInterval` seed
    - cleanup/reset gate
    - main REST fetch `intervalUsed`
    - shallow `loadMoreHistory` interval identity references
- [2026-03-11-data-source-ownership-step-1-confirmed.md](/d:/Projects/FG/fg/FG2/handoffs/2026-03-11-data-source-ownership-step-1-confirmed.md)
  - new handoff file for this session

## Architecture Decision Confirmed

For the REST candle path, canonical request identity should come from explicit outer props passed through `App -> ChartContainer -> useCandles`, not from `ChartContext` mirror state.

This session confirms the first cleanup step of that decision:
- `ticker`
- `timeframe`
- `interval`
- `selectedDate`
- `width`
- `dpr`
- `resolution`
- `strict`

remain the effective identity inputs for the REST path.

What changed architecturally:
- `useCandles.js` no longer behaves as a mixed identity consumer for `timeframe / interval`
- `ChartContext` is no longer consulted as an identity source for the REST request path

What did not change architecturally:
- producer paths in `App.js` and `ChartContainer.js`
- engine ownership in `useChartData` / `useFGTimeNavigation`
- closed selection ownership and `currentCandleType` milestones

## Regression / Smoke Evidence

Real smoke run was executed against the live local runtime:
- frontend: `http://localhost:3000`
- backend1: `http://localhost:3001`

Smoke scenarios with observed PASS:
- application opened
- `SBER` search completed
- Expanded chart opened
- one timeframe switch completed: `3mth -> 1d`
- one interval switch completed: `15m -> 1m`
- non-empty `/api/candles-v2` response reached chart input
- Expanded did not receive empty placeholder handoff on mount

Observed evidence from the run:
- Expanded opened with live chart input `len=311`
- after timeframe switch, chart input stayed live with `len=311`
- after interval switch, chart input stayed live with `len=153`
- observed non-empty REST response with `candles len=96`
- placeholder check stayed clean:
  - `firstPositiveIndex=0`
  - `zeroAfterPositive=false`

What this smoke run confirms for this step:
- the first mixed request-identity cleanup in `useCandles.js` did not break live Expanded REST data flow
- valid REST payload still reaches chart input
- Expanded mount still avoids empty placeholder handoff
- selection smoke stayed visually stable during the exercised timeframe/interval flow

## Closed Risks

- closed the risk that `useCandles.js` builds REST request identity from `ChartContext` mirror state for `timeframe / interval`
- closed the first mixed-identity risk in the Expanded REST path
- closed the risk that this step breaks live `/api/candles-v2` payload delivery into chart input
- closed the risk that this step reintroduces empty placeholder handoff on Expanded mount

## Not Re-Verified In This Smoke Run

- `currentCandleType` should be marked as `not re-verified here`
- the smoke run included a candle-type sub-check attempt, but this session must not treat that as a regression of the `useCandles.js` patch
- the earlier `currentCandleType` milestone remains closed; this smoke run does not reopen it

## Deferred Risks

- `loadMoreHistory` still needs a stricter ownership audit as a follow-up, because this first step only did shallow identity alignment
- REST request identity cleanup is not yet the full data-source ownership closure; it is step 1 only
- `ChartContainer.js` still remains the live data handoff/arbitration boundary, even though the silent placeholder-owner behavior was already reduced earlier
- compact/expanded producer coexistence still exists:
  - `App.js` socket path
  - `useCandles.js` REST path
- no new claim is made here about a full unification of upstream data ownership

## Exact Next Step

Open the next architecture step in a new session at [useCandles.js](/d:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js): tighten the remaining REST identity and fetch contract around `loadMoreHistory`, reset/fetch gating, and active-source consistency so the REST path no longer carries partial mixed ownership semantics even after this first cleanup step.
