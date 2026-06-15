# Phase 9.4 - RSI/Volume lower-pane visual invariant investigation

## 1. Current status

- Phase 9.1 completed.
- Phase 9.2 accepted/closed.
- Phase 9.3 completed/closed.
- Phase 9.4 open.
- Main 9.4 symptom still unresolved.

## 2. Accepted visual invariant

When enabling RSI or Volume:

- allowed: one lower pane appears and price pane shrinks vertically;
- forbidden: price chart changes visible time window, right edge, candle density, or becomes a different graph.

## 3. Confirmed symptom

Environment used for the latest checks: `[3000]`, `http://127.0.0.1:3000`.

On `SBER` Expanded `15m / 3mth`:

- baseline has wide price chart and no lower pane;
- enabling `RSI` creates RSI lower pane, but price chart changes visible window / candle picture / density;
- enabling `Volume` shows the same class of issue;
- disabling `RSI` or `Volume` returns to a baseline-like view;
- no empty lower block remains;
- console errors: `0`.

## 4. Work done / patches attempted

### A. visibleRange bridge patch

Files:

- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`
- `fingineerwebapp/src/components/Results/Chart/ChartRenderer.js`
- `fingineerwebapp/src/charts/MultiPaneChart.jsx`
- `fingineerwebapp/src/charts/Pane.jsx`

Purpose:

`ChartCanvas -> ChartRenderer -> MultiPaneChart -> price Pane` visibleRange bridge.

Result:

Patch structure was accepted, but runtime visual QA failed. It did not fix Phase 9.4.

### B. temporary data-path diagnostic

Files:

- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `fingineerwebapp/src/charts/series/candles.js`

Diagnostic object:

- `window.__FG_94_DATA_PATH_DIAG__`

Runtime result:

- `DATA_PATH_MISMATCH_NOT_CONFIRMED`

Evidence:

- `ChartCanvas` and `MultiPaneChart.price` both received:
- `length: 4485`
- `firstTime: 1696218300`
- `lastTime: 1703882700`
- `time format: number seconds`
- `hasMsTime: false`
- `sorted: true`
- `duplicateTimeCount: 0`

Conclusion:

Data path mismatch is not the root cause.

### C. temporary range lifecycle diagnostic

Files:

- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`
- `fingineerwebapp/src/components/Results/Chart/ChartRenderer.js`
- `fingineerwebapp/src/charts/Pane.jsx`
- `fingineerwebapp/src/charts/ChartSyncController.js`

Diagnostic object:

- `window.__FG_94_RANGE_LIFECYCLE_DIAG__`

Important findings before `Pane.jsx` timeScale patch:

- `ChartRenderer.passInitialRange` passed `1696218300..1703882700`;
- `Pane` received `initialVisibleRange`;
- `Pane.beforeSetVisibleRange` current range was around `1703590200..1703882700`;
- `Pane.afterSetVisibleRangeDeferred` became around `1698834600..1703882700`;
- full requested range was not held;
- `ChartSyncController` writes after `Pane`.

### D. stale/wide snapshot hypothesis

Anchor result:

- not root cause.

For `15m / 3mth`, `1696218300..1703882700` is a legitimate baseline range because available mock data roughly equals the selected `3mth` timeframe.

### E. Pane timeScale alignment patch

File:

- `fingineerwebapp/src/charts/Pane.jsx`

Change:

For price pane only, added timeScale options close to `ChartCanvas/useLightweightChart`:

- `timeVisible: true`
- `fixLeftEdge: true`
- `fixRightEdge: true`
- `rightOffset: 12`
- `minBarSpacing: 0.5`
- `barSpacing: 6`

Lower pane does not receive these options.

Runtime QA after this patch:

- `FAIL`

`RSI` and `Volume` still change price chart visible window / candle density.
Console errors remain `0`.

## 5. Current diagnosis

Not resolved.

Rejected or suspended hypotheses:

- `DATA_PATH_MISMATCH`: not confirmed;
- stale/wide snapshot: not primary cause;
- `Pane` timeScale options mismatch: patch did not fix visual QA.

Current strongest unknown:

Need to read range lifecycle diagnostics after the `Pane.jsx` timeScale patch to see whether:

- range now applies but visual QA is misleading;
- range still does not apply;
- `ChartSyncController` overwrites it;
- lower pane becomes authority;
- `lightweight-charts` async/timing is involved.

## 6. LWC 5.x native panes research / upgrade feasibility

### 6.1 Current library version

- `fingineerwebapp/package.json` uses `lightweight-charts: ^4.2.3`.
- `fingineerwebapp/package-lock.json` resolves `lightweight-charts` to `4.2.3`.
- Native panes are not available in current FG runtime without upgrading to `5.x`.

### 6.2 Research finding

- Current public `lightweight-charts` docs describe native panes as a first-class API in `5.x`.
- Native panes allow multiple panes inside one chart instance.
- Key APIs / concepts:
  - `paneIndex`
  - `moveToPane`
  - `chart.addPane()`
  - `chart.panes()`
  - `pane.setHeight()`
  - `pane.setStretchFactor()`
  - `pane.addSeries()`
- This means native panes provide one chart-level horizontal/timeScale owner, unlike the current FG workaround with multiple chart instances.

### 6.3 Architectural implication for FG 9.4

- Current `MultiPaneChart -> Pane -> ChartSyncController` is a workaround architecture built on multiple chart instances.
- This conflicts with the Phase 9.4 invariant:
  enabling RSI/Volume should only shrink price pane vertically, not change visible window / right edge / candle density.
- Further strengthening `ChartSyncController` is not recommended as the final solution.

### 6.4 Upgrade feasibility anchor result

Verdict:

- `UPGRADE FEASIBILITY HIGH RISK — defer native panes, keep current workaround temporary`

Reason:

The upgrade `lightweight-charts 4.2.3 -> 5.x` touches risky FG surfaces:

- `fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`
- `fingineerwebapp/src/charts/MultiPaneChart.jsx`
- `fingineerwebapp/src/charts/Pane.jsx`
- `fingineerwebapp/src/charts/ChartSyncController.js`

High-risk areas:

- `ChartSyncController`
- `Pane`
- `MultiPaneChart`
- `useChartData` init/range path

Medium/high-risk:

- `ChartCanvas`
- `useLightweightChart`
- `useChartIndicators`

Lower-risk but still must be checked:

- `setData` payload shapes
- `createPriceLine`
- basic series builders

### 6.5 Decision / current stance

- Do not upgrade `lightweight-charts` now.
- Do not change `package.json` or lockfiles.
- Do not continue patching `ChartSyncController` blindly.
- Native panes are accepted as the likely target architecture, but only via a separate bounded upgrade/spike task.
- Current multi-chart path remains temporary workaround, not final architecture.

### 6.6 Updated next step

Tomorrow / next session:

A. First preserve current repo state and confirm temp diagnostics still exist.
B. Do not continue broad visual QA.
C. Decide between:
   1. short post-patch lifecycle diagnostic on current workaround, or
   2. opening a separate `lightweight-charts 5.x upgrade spike` task.
D. If choosing upgrade path, start with read-only migration map, not package update.

Keep the existing next step about reading:
`window.__FG_94_RANGE_LIFECYCLE_DIAG__`
but treat it as the current-workaround diagnostic option, not the only path.

### 6.7 Temporary diagnostics reminder

Keep the existing reminder:

- `window.__FG_94_DATA_PATH_DIAG__`
- `window.__FG_94_RANGE_LIFECYCLE_DIAG__`

must be removed later.

## 7. Exact next step for tomorrow

Run only this:

- Chrome DevTools MCP evaluate, `RSI-only`, no visual judgment.

Primary evidence:

- `window.__FG_94_RANGE_LIFECYCLE_DIAG__`

Need to answer:

- did `Pane` receive `1696218300..1703882700`?
- after deferred apply, did price pane keep `1696218300..1703882700`?
- if not, what range did it keep?
- did `ChartSyncController` write after `Pane`?
- who wrote range last?

Expected verdict options:

- `RANGE_FIXED_BUT_VISUAL_QA_SUSPECT`
- `RANGE_STILL_NOT_APPLIED`
- `RANGE_OVERWRITTEN_BY_CHART_SYNC`
- `INCONCLUSIVE`

## 8. Important boundaries

Do not:

- open Phase 9.5;
- style `RSI`;
- add new indicators;
- patch `ChartContext`;
- patch `useChartData` unless proven necessary;
- patch `ChartSyncController` unless lifecycle diagnostics proves overwrite;
- run broad visual QA before reading lifecycle diagnostics;
- remove temp diagnostics before root cause is identified.

## 9. Temporary diagnostics still present

These temporary diagnostics must be removed later:

- `window.__FG_94_DATA_PATH_DIAG__`
- `window.__FG_94_RANGE_LIFECYCLE_DIAG__`
- helper functions added for diagnostics in affected files

## 10. Files touched during session

Code files touched:

- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`
- `fingineerwebapp/src/components/Results/Chart/ChartRenderer.js`
- `fingineerwebapp/src/charts/MultiPaneChart.jsx`
- `fingineerwebapp/src/charts/Pane.jsx`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `fingineerwebapp/src/charts/series/candles.js`
- `fingineerwebapp/src/charts/ChartSyncController.js`

## 11. Open risk

The repo currently contains temporary diagnostic instrumentation and an attempted `Pane.jsx` timeScale patch.

Tomorrow's first job is not to continue patching, but to read lifecycle diagnostics after the latest patch.

## 12. Resume note

If a fresh Codex session resumes from this file, the safest restart order is:

1. trust the accepted Phase 9.1-9.3 closure chain;
2. do not reopen data-path mismatch or stale snapshot theories;
3. read post-patch `window.__FG_94_RANGE_LIFECYCLE_DIAG__` first;
4. only then decide whether the next owner is `Pane`, `ChartSyncController`, or `lightweight-charts` timing.
