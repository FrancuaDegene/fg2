# Handoff: ChartContext Replace Semantics Applied And SourceAuthority Frontier Closed

## Session Metadata
- Created: 2026-03-17 +03:00
- Project: `d:\Projects\FG\fg\FG2`
- Scope: close the current `ChartContainer` / `sourceAuthority` frontier for this session by aligning `ChartContext.js` storage semantics with the accepted handoff contract

## Handoff Chain

- Continues from: [2026-03-12-source-authority-chartcontainer-cleanup-applied.md](./2026-03-12-source-authority-chartcontainer-cleanup-applied.md)
- Related earlier milestone: [2026-03-11-data-source-ownership-step-1-confirmed.md](./2026-03-11-data-source-ownership-step-1-confirmed.md)
- Related closed milestone: [2026-03-11-selection-ownership-stabilization-regression-confirmed.md](./2026-03-11-selection-ownership-stabilization-regression-confirmed.md)

> Read `2026-03-12-source-authority-chartcontainer-cleanup-applied.md` first for the accepted upstream `sourceAuthority` contract path. Do not reopen closed selection or runtime ownership layers without new evidence.

## Current State Summary

This session closes the current frontier around `ChartContainer` handoff intent vs `ChartContext` storage semantics.

`ChartContext.js` was intentionally changed so:

- `SET_CHART_DATA` now uses true replace semantics
- `SET_CHART_META` now uses true replace semantics
- no new actions were introduced
- no parallel setter paths were introduced
- only `fingineerwebapp/src/components/Results/Chart/ChartContext.js` was intentionally changed for this task

The reason for the change was architectural, not a confirmed active product bug:

- previous reducer semantics were merge-based
- actual direct writer usage was snapshot / handoff style from `ChartContainer.js`
- this mismatch allowed stale `rangeKey` survival and stale `chartMeta` key survival in storage

The patch aligns reducer semantics with the accepted `sourceAuthority` handoff contract instead of adding extra replace-only APIs "just in case".

## Accepted Decisions Closed In This Session

- `ChartContainer.js` remains the handoff boundary only
- `ChartContext.js` storage reducers now match snapshot-style handoff usage
- `setChartData` remains the existing setter name and now behaves as true replace
- `setChartMeta` remains the existing setter name and now behaves as true replace
- no new reducer actions or alternate setter paths were added
- this frontier can be treated as closed for now

## Why This Change Was Made

### Before The Patch

- `ChartContainer.js` already wrote snapshot-shaped payloads for REST not-ready and REST ready branches
- `ChartContext.js` still merged previous `chartData` and previous `chartMeta`
- that created architectural dirt at the storage layer:
  - stale `rangeKey`
  - stale extra `chartMeta` keys

### Decision

- do not introduce `replaceChartData` / `replaceChartMeta`
- make existing `setChartData` / `setChartMeta` match their actual snapshot-style usage
- keep the diff localized to `ChartContext.js`

## Completed This Session

### Intentional Code Change

- `fingineerwebapp/src/components/Results/Chart/ChartContext.js`
  - `SET_CHART_DATA` now writes a normalized full snapshot:
    - `candles`
    - `error`
    - `rangeKey`
    - `loadMoreHistory`
  - `SET_CHART_META` now writes a normalized full snapshot:
    - `dataResolution`
    - `sourceInterval`
    - `isDownsampled`
    - `points`
    - `from`
    - `to`
    - `nextTime`
    - `noData`
  - `MAX_BARS_PER_SERIES` behavior was preserved
  - explicit `loadMoreHistory: undefined` clearing was preserved

### Not Changed

- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js`
- selection ownership
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js`
- docs / handoffs from earlier sessions

## Verification Summary

### Boundary And Storage Analysis

- boundary-level `ChartContainer.js` verification was completed before the patch decision
- `ChartContext` setter semantics were identified as the real debt source behind stale storage survival
- direct call-sites of `setChartData` / `setChartMeta` were classified as snapshot / handoff writes, not proven partial writers

### Observability And Runtime Checks

- direct Expanded render-path and non-render observability checks did not reveal a confirmed user-visible bug from stale `rangeKey` / `chartMeta`
- current debug panel was proven insufficient for REST not-ready proof
- existing runtime surfaces `window.__RAW__` / `window.__CANDLES__` were identified as sufficient in principle for `chartData` proof
- manual watcher / browser attempts did not capture the REST not-ready empty snapshot as a stable observable frame
- no obvious new visual regression was observed in Expanded ready-path switching

### Final Classification

- treat this task as architectural cleanup / debt removal
- no confirmed active runtime bug was proven before the patch
- practical status after patch:
  - no regression proven
  - frontier can be closed for now
  - any remaining gap is observability of a very short transition frame, not a confirmed product bug

## Key Proof Anchors

- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:98`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:100`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:104`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:105`
- `fingineerwebapp/src/components/Results/Chart/ChartContainer.js:138`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js:29`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js:40`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js:43`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js:49`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js:64`
- `fingineerwebapp/src/components/Results/Chart/ChartContext.js:68`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js:68`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js:72`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js:73`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js:258`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js:270`
- `fingineerwebapp/src/components/Results/Chart/ChartDebugPanel.jsx:35`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartDebugPanel.js:124`
- `fingineerwebapp/src/components/Results/Chart/ChartContent.js:28`
- `fingineerwebapp/src/components/Results/Chart/ChartContent.js:72`
- `fingineerwebapp/src/components/Results/Chart/ChartRenderer.js:118`
- `fingineerwebapp/src/components/Results/Chart/ChartRenderer.js:201`
- `fingineerwebapp/src/components/Results/Chart/ChartRenderer.js:638`

## Closed Layers: Do Not Reopen Automatically

- selection ownership
- `currentTimeframe` / `currentInterval` / `isExpanded` ownership
- `ChartContainer` `sourceAuthority` branch logic
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js` runtime ownership
- `fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js` runtime ownership

If this area is revisited later, start from observability / debug surface questions first, not from core ownership again.

## Open Follow-Up Items

- debug-panel expansion remains a possible future task, but it was intentionally not done in this session
- if future verification is needed for the short REST not-ready frame, use observability-first reasoning

## Verification Status

- Validation script status: not run
- Reason:
  - no local handoff script/tooling was available in this repo path
  - this session did not include a separate validation/tool-run phase
- Manual completeness check: completed
  - no `[TODO: ...]` placeholders remain
  - closed vs open status is explicit
  - no invented build/test results were added

## Playbook Check

Does this session modify FG Chart Engine architecture and require updating `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`?

YES.

Reason:
- this session changed the accepted storage semantics behind the Expanded handoff boundary
- it removed merge-style survival from `ChartContext.js` for `chartData` / `chartMeta`
- that is an architectural contract clarification, not just a local cosmetic fix

Status:
- playbook/docs sync completed in this session

## Next Safe Step

Move to the next product / architecture task. If this runtime area is revisited later, start from observability / debug surface, not ownership.

## Final Docs Sync Status

Docs sync is now completed for:
- `docs/domain/FG_CHART_ARCHITECTURE_MAP.md`
- `docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md`
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`

The synced docs now reflect that:
- `App` owns `sourceAuthority` for Expanded handoff
- `ChartContainer` is handoff boundary only
- `ChartContext` stores handed-off `chartData` / `chartMeta` as replace snapshots
- the `sourceAuthority` / `ChartContainer` / `ChartContext` storage sub-frontier is closed for now
- future re-entry should start from observability / debug surface, not ownership reopening

## Final Session Closure Note

- the earlier `ChartContext` / `sourceAuthority` storage frontier remains closed in code, handoff, and docs
- Stage 1 TF×interval cleanup is now closed and QA-validated as safe to keep
- Stage 2 started and its first slice in `fingineerwebapp/src/store/useCandles.js` is completed and QA-validated as safe to keep
- no confirmed active runtime bug was proven in the earlier storage/frontier area; this session's target fix addressed REST revalidation suppression without reopening Stage 1 ownership work

## Final Next Safe Step

- first technical priority next session: return to the next Stage 2 step, referenced in current working context as `Stage 2 slice 3`
- separate architecture priority: run a dedicated FG chart architecture session focused on defining architecture parameters across FG domains, not just `owner`
- if this area is revisited during implementation, distinguish visible selection, backend request identity, reload / revalidation decision, and visual refresh / render behavior before patching

## Session Update: Stage 1 Closed And Stage 2 Started

### Stage 1 Status

- Stage 1 is now CLOSED.
- Active legacy TF×interval residue had already been removed from REST path earlier.
- Final Stage 1 cleanup completed in the old selector surface:
  - `fingineerwebapp/src/components/ExpandedControls/ExpandedControls.js`
  - `fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js`
  - `fingineerwebapp/src/lib/timeframes.js`
- The old selector surface now derives from canonical helpers.
- `fingineerwebapp/src/utils/chart/timeframes.js` no longer affects active or compatibility UI behavior through live readers.
- Stage 1 patch was QA-validated and is safe to keep.

### Stage 2 Status

- Stage 2 started.
- The first Stage 2 slice completed in `fingineerwebapp/src/store/useCandles.js`.
- Backend request identity remained the exact shaped backend URL.
- Visible selection identity was separated via `selectionSignature`.
- Fresh cache suppression now applies only when both backend request identity and visible selection identity match.
- QA confirmed the target watch item was fixed:
  - visible selection changed
  - shaped backend request identity stayed the same
  - a new follow-up `/api/candles-v2` request was still observed
- Stage 2 slice 1 is safe to keep.

## Architecture Conclusion Update

- `owner` remains foundational, but `owner` alone is not sufficient for FG chart architecture.
- The architecture direction now shifts from owner-centric reasoning to parameter-based chart reasoning.
- The most explanatory additional parameters identified in this session:
  - `AUTHORITY / PRECEDENCE`
  - `IDENTITY`
  - `LIFECYCLE / PHASE`
  - `MUTATION SEMANTICS`
  - `FAILURE / DEGRADATION SEMANTICS`
- Practical interpretation for FG:
  - distinguish visible user selection
  - backend request identity
  - reload / revalidation decision
  - visual refresh / render behavior
- This explains why some historical symptoms looked like owner bugs but were actually identity / phase / mutation / precedence issues.

## Current Watch Items

- Old selector proof is engineering-valid but not a normal user-visible path because it sits behind overlay.
- Stage 2 slice 1 solved the specific REST revalidation suppression issue, but render / viewport-level visual sameness can still be a separate future concern when mock-data coverage is limited.

## Additional Proof Anchors From This Session

- `fingineerwebapp/src/components/ExpandedControls/ExpandedControls.js:17`
- `fingineerwebapp/src/components/ExpandedControls/ExpandedControls.js:36`
- `fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js:3`
- `fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js:16`
- `fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js:17`
- `fingineerwebapp/src/components/IntervalSelector/IntervalSelector.js:36`
- `fingineerwebapp/src/lib/timeframes.js:1`
- `fingineerwebapp/src/lib/timeframes.js:3`
- `fingineerwebapp/src/lib/timeframes.js:5`
- `fingineerwebapp/src/store/useCandles.js:156`
- `fingineerwebapp/src/store/useCandles.js:503`
- `fingineerwebapp/src/store/useCandles.js:513`
- `fingineerwebapp/src/store/useCandles.js:530`
- `fingineerwebapp/src/store/useCandles.js:543`
- `fingineerwebapp/src/store/useCandles.js:565`
- `fingineerwebapp/src/utils/chart/timeframes.js:75`
- `fingineerwebapp/src/utils/chart/timeframes.js:171`
- `fingineerwebapp/src/utils/chart/timeframes.js:178`