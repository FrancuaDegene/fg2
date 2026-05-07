# Handoff: FG chart stale-init handoff closed for ChartCanvas branch

## Session Metadata
- Created: 2026-03-27 22:08:57
- Project: `D:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Continues from: [2026-03-27-195114-fg-chart-sprint-close-stale-init-deferred.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-195114-fg-chart-sprint-close-stale-init-deferred.md)
- Related previous slice: [2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md)
- Scope note: this handoff closes the `stale-init handoff` sprint slice for the `ChartCanvas` branch only
- Storage note: handoff intentionally stored in [handoffs](D:/Projects/FG/fg/FG2/handoffs), not in `.claude/handoffs`

## What Was Investigated
- New sprint started from the deferred frontier recorded in [2026-03-27-195114-fg-chart-sprint-close-stale-init-deferred.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-195114-fg-chart-sprint-close-stale-init-deferred.md).
- Accepted boundary at sprint start:
  - `useChartData = init-time owner`
  - `useFGTimeNavigation = runtime navigation owner`
  - target branch = `ChartCanvas`, not `MultiPaneChart`
- The main question of this session was whether `stale-init` completion inside `ChartCanvas` was incorrectly tied to rerun/object-identity behavior instead of an explicit fresh-payload handoff.
- The confirmed analysis anchors for this frontier were:
  - `selectionKey` and stale-pass detection in [useChartData.js#L184](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L184)
  - existing fast-path branch in [useChartData.js#L277](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L277)
  - init/defer/completion path in [useChartData.js#L624](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L624)
  - `ChartCanvas -> useChartData` handoff boundary in [ChartCanvas.js#L141](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L141), [ChartCanvas.js#L142](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L142), [ChartCanvas.js#L406](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L406)

## What Was Changed

### 1. Owner-Local Observability In `useChartData.js`
- Added owner-local stale-init trace surface in [useChartData.js#L107](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L107) and [useChartData.js#L130](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L130).
- Trace writes to `window.__FG_STALE_INIT_TRACE__`.
- Recorded events:
  - `passStart`
  - `defer`
  - `beforeInitComplete`
  - `afterInitComplete`
- This instrumentation was intended as observability only, not as product behavior.

### 2. Real Product Fix: Explicit Versioned Handoff
- `ChartCanvas.js` now provides explicit `payloadVersion` based on incoming raw `chartData.candles` reference changes:
  - [ChartCanvas.js#L133](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L133)
  - [ChartCanvas.js#L141](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L141)
  - [ChartCanvas.js#L142](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L142)
  - [ChartCanvas.js#L149](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L149)
- `useChartData.js` now owns explicit `selectionVersion` and `pendingInitToken`:
  - local refs at [useChartData.js#L94](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L94)
  - selection version creation at [useChartData.js#L184](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L184)
  - active pending token resolution at [useChartData.js#L207](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L207)
- Explicit completion rule now lives in [useChartData.js#L624](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L624):
  - `defer` stores `{ selectionVersion, payloadVersion }`
  - completion is blocked until `payloadVersion > deferred payloadVersion`
  - completion is valid only while deferred `selectionVersion` still matches current selection
- Existing fast-path no longer bypasses deferred init ownership:
  - [useChartData.js#L277](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L277)
- Runtime navigation ownership was intentionally left unchanged:
  - `ChartCanvas -> useFGTimeNavigation` still at [ChartCanvas.js#L244](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L244)
  - no patch in [useFGTimeNavigation.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js)

## What Was Experimental
- A temporary forced-stale experiment was introduced only to force the deferred path in real runtime:
  - `window.__FG_FORCE_STALE_INIT__`
  - `window.__FG_FORCE_STALE_INIT_MS__`
  - `window.__FG_FORCE_STALE_INIT_STATE__`
- This experiment temporarily delayed candle adoption inside `ChartCanvas.js`.
- It existed only to answer one question: does the real runtime ever take the `defer` path, and what happens after it?
- It was never intended as product logic, ownership logic, or a permanent test harness.

## What Was Removed
- The temporary forced-stale experiment was fully removed from [ChartCanvas.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js).
- Removed:
  - forced delayed-candles path
  - forced-stale timer/selection refs
  - `window.__FG_FORCE_STALE_INIT__`
  - `window.__FG_FORCE_STALE_INIT_MS__`
  - `window.__FG_FORCE_STALE_INIT_STATE__`
- Product candle flow after cleanup again reads normal incoming candles:
  - [ChartCanvas.js#L141](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L141)
  - [ChartCanvas.js#L151](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L151)
  - [ChartCanvas.js#L369](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L369)
- Important: stale-init trace instrumentation in [useChartData.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js) was intentionally kept, because it is a useful passive debug surface and is not coupled to the removed forcing logic.

## What Was Validated

### Browser QA Before The Real Fix
- On `3101`, ordinary timeframe bursts repeatedly produced only `initial_nonstale` paths.
- User-facing blocker was not reproduced under normal browser QA conditions.
- This confirmed the bug was architectural ambiguity, not a reliably user-facing regression under ordinary traffic.

### Runtime Proof Of `defer`
- With the temporary forced-stale experiment enabled, runtime proved:
  - `defer` path exists in real runtime
  - initial ambiguity was real
  - a follow-up pass could bypass the init-completion path through the existing fast-path
- After tightening the product fix, runtime proved:
  - `defer -> beforeInitComplete -> afterInitComplete`
  - `completionKind = after_fresh_payload`

### Final Verification After Cleanup
- `3101 PASS`
  - target: `http://localhost:3101`
  - `SBER` search succeeded
  - Expanded chart opened
  - mounted branch: `ChartCanvas=true`, `MultiPaneChart=false`
  - passive stale-init trace showed clean normal init completion without forcing
  - screenshot: `qa-3101-expanded-post-cleanup.png`
  - console: no errors, no warnings
  - network: relevant requests `200`
- `3100 PASS`
  - target: `http://localhost:3100`
  - `SBER` search succeeded
  - Expanded chart opened
  - mounted branch: `ChartCanvas=true`, `MultiPaneChart=false`
  - passive stale-init trace showed clean normal init completion without forcing
  - screenshot: `qa-3100-expanded-post-cleanup.png`
  - console: no errors, no warnings
  - network: relevant requests `200`

## What Is Now Closed
- Closed sub-task: `stale-init handoff gap in ChartCanvas branch`
- Closed meaning:
  - deferred init ownership is now explicit
  - completion after defer is now tied to fresh payload for the same deferred selection
  - fast-path no longer bypasses pending deferred init
  - final product path behaves correctly after removal of the experimental forcing layer
- This closure is exact and narrow:
  - closed for `ChartCanvas` branch only
  - not a blanket statement about all chart-engine branches

## What Remains Open
- `MultiPaneChart` branch is not covered by this model and was not reopened.
- Broader final authority-chain unification across chart branches remains future work.
- Stale-init trace instrumentation remains in `useChartData.js` as a debug surface; future cleanup is optional and separate from this fix.
- No new work was done on:
  - compact slice
  - QA port setup
  - `App.js` bridge
  - `ChartContainer` ownership
  - `useFGTimeNavigation` runtime ownership

## Risks And Boundaries
- `payloadVersion` depends on raw `chartData.candles` reference changes in [ChartCanvas.js#L142](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L142). If some upstream writer mutates the same candle array in place, this versioning contract can be weakened.
- This handoff does not claim anything about `MultiPaneChart`.
- This handoff does not claim final ownership unification between all chart branches.
- Worktree remains dirty outside this slice; do not interpret the full git diff as belonging only to this session.

## Do-Not-Reopen List
- Do not reopen the compact slice without new runtime evidence.
- Do not reopen QA port setup without new environment breakage evidence.
- Do not reopen `stale-init handoff` in `ChartCanvas` branch without new evidence.
- Do not reintroduce the forced-stale experiment as product logic.
- Do not drift into tooling loops; primary browser QA path remains `Codex + Playwright MCP` on `3100 / 3101`.

## Next Recommended Frontier
- Move away from this closed slice.
- Recommended next frontier:
  - either return to a separate chart-engine frontier outside `ChartCanvas stale-init`
  - or, if documentation consistency matters immediately, update the stable architectural record for the new explicit handoff rule
- Not recommended as the next step:
  - more reproduction work on this same stale-init issue
  - reopening `MultiPaneChart`
  - reopening compact or QA ports

## Critical Files
- [fingineerwebapp/src/components/Results/Chart/ChartCanvas.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js)
- [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js)
- [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js)
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md)

## Playbook Check
YES.

This session introduced a real chart-engine architecture update for the `ChartCanvas` branch:
- explicit `payloadVersion` handoff from `ChartCanvas`
- explicit `selectionVersion + pendingInitToken` ownership in `useChartData`
- explicit rule that deferred init completion is allowed only after fresh payload for the same selection

The most relevant playbook sections to update later are:
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44) `## 3. Ownership Model`
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L113](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L113) `## 8. Regression Hotspots`

The playbook update should record:
- `useChartData` init ownership is now guarded by explicit versioned handoff, not rerun heuristics
- `useFGTimeNavigation` runtime navigation ownership remains unchanged
- the closure applies to `ChartCanvas` branch only
