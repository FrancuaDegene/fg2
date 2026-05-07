# FG Chart Engine Playbook (v1)

Source inputs:
- `docs/domain/chart-state-model.md`
- `docs/domain/chart-navigation.md`
- `docs/domain/moex-sessions.md`
- `handoffs/2026-03-08-fg-chart-engine-expanded-nav-init-fix.md`

## 1. Purpose
FG Chart Engine is responsible for:
- rendering market data through lightweight-charts (LWC),
- applying FG-specific data/windowing behavior for timeframe+interval modes,
- enforcing stable navigation behavior in expanded mode,
- exposing reliable observability for navigation and scale diagnostics,
- preserving MOEX session-aware chart behavior.

It is not responsible for ad-hoc runtime ownership rewrites outside defined boundaries.

## 2. Core Architecture Layers

### LWC Core (lightweight-charts)
- Rendering foundation and timescale primitives.
- Provides chart/timeScale APIs used by FG layers.
- Should not be treated as the product-behavior owner.

### FG Data Pipeline (`useChartData`)
- Owns init-time data application (`series.setData`) and virtual slicing.
- Computes timeframe/interval windowing and session-aware slices.
- Applies init safety recovery for owner-nav `1d` path.
- In `ChartCanvas` branch, owns deferred-init completion through explicit `selectionVersion + pendingInitToken`, not arbitrary rerun heuristics.

### FG Navigation Layer (`useFGTimeNavigation`)
- Owns runtime pan/zoom handling in expanded owner-nav mode.
- Writes logical range for interactive navigation corrections.
- Contains mode-change normalization/heal logic.

### FG Observability Layer (`useChartDebugPanel` + `ChartDebugPanel`)
- Dev-only diagnostics for range/spacing/writer order.
- No business ownership of chart behavior.

### FG Transition Layer (transition veil in `ChartCanvas`)
- Visual-only mask during timeframe/interval switch settling.
- No range ownership; UX smoothing only.

## 3. Ownership Model
- `useChartData` owns init-time dataset application and init safety recovery.
- `useChartData` owns deferred-init completion for `ChartCanvas` branch and may complete it only after fresh payload for the same deferred selection.
- `useFGTimeNavigation` owns runtime pan/zoom navigation writes.
- `App` owns `sourceAuthority` for Expanded handoff.
- `App` is also the authoritative owner for `confirmedSelection`, `requestedSelection`, `hasValidSnapshot`, `requestKind`, `requestStatus`, `dataStatus`, `failureScope`, `failureMessage`.
- compact chart path remains the accepted direct App-owned path; no separate compact owner is introduced.
- current evidence does not justify routing `compact` through `ChartContainer` as an owner model or opening a separate compact-specific rewrite/pass.
- `ChartContainer` is sourceAuthority-driven handoff boundary for chart input selection and accepted candle normalization boundary before `ChartContext`.
- `ChartContext` stores handed-off `chartData` / `chartMeta` as replace snapshots, not merge-survival storage.
- `ChartContext` is the runtime owner of `currentCandleType` on the active path.
- `Chart.js` keeps the last confirmed `currentCandleType` above `ChartContainer` as persistence-only remount state.
- `ChartContainer` is seed/remount-only bridge for `currentCandleType`; mounted-time live mirroring is not accepted.
- `ChartContainer` may normalize/handoff runtime snapshots into `ChartContext`, but should not expand into producer selection semantics, request identity ownership, cache/inflight ownership, or failure policy.
- `ChartCanvas` is wiring + visual layer and the local handoff publisher for `payloadVersion` in the `ChartCanvas` branch.
- Debug panel is observability only.
- This specific sourceAuthority / ChartContainer / ChartContext storage sub-frontier is closed for now, including the accepted candle normalization boundary in `ChartContainer`; local Stage 3 slices are exhausted.
- `ChartCanvas stale-init handoff gap` is closed for the `ChartCanvas` branch only; do not reopen it without new evidence.

Critical ownership-sensitive state:
- `visibleRange`
- `visibleLogicalRange`
- `barSpacing`
- deferred init handoff identity (`payloadVersion`, `selectionVersion`, `pendingInitToken`) for `ChartCanvas`

Rule: avoid multiple uncontrolled writers for the same lifecycle stage.

## 4. Initialization Pipeline
Baseline init pipeline (expanded path):
1. Data load/request resolves.
2. `ChartCanvas` publishes incoming payload identity through `payloadVersion` for the `ChartCanvas` branch.
3. Slice/window is computed for timeframe+interval.
4. `series.setData(sessionSlice)` is applied.
5. If a stale selection pass is deferred in `ChartCanvas`, init completion remains blocked until fresh payload arrives for the same deferred selection.
6. Owner-nav `1d` safety heal validates/corrects logical range collapse.
7. Navigation continues under `useFGTimeNavigation` runtime control.

Note: hooks attach in React lifecycle, but data-init correctness must hold across this pipeline.

## 5. Observability Layer
Debug panel (dev-gated) tracks:
- `visibleRange`
- `logicalRange`
- `barsVisible`
- `barSpacing`
- `sliceSize`
- `lastWriter`
- `lastEvent`
- context fields (`mode`, `navOwner`, `timeframe`, `interval`, expected init skip marker)

Purpose:
- verify writer order,
- catch transient collapse states,
- prove before/after effects of minimal fixes.
- Debug panel is sufficient for navigation/init writer-order evidence, but not by itself for proving REST not-ready handoff payload shape.
- Temporary forced-stale runtime forcing used during proof work was experimental only and is removed; it is not part of accepted product behavior.

## 6. Safety Mechanisms
Current safety mechanisms:
- post-`setData` logical-range safety heal in `useChartData` for expanded owner-nav `1d`.
- explicit `sourceAuthority`-driven handoff in `ChartContainer`, including canonical candle normalization before `ChartContext`.

Execution model:
- first attempt in the same init RAF immediately after `setData`,
- RAF fallback only when logical range is unreadable immediately.

Intent:
- recover hard collapse cases without introducing broad ownership conflicts.
- prevent stale outer payload survival from crossing the wrong authority path before engine init/render ownership takes over.

## 7. Known Invariants
- Expanded + `navOwner` + `1d` requires guarded initialization behavior.
- Do not reintroduce broad `visibleRange` ownership rewrites in expanded owner-nav init path.
- Runtime pan/zoom ownership remains in `useFGTimeNavigation`.
- `ChartCanvas` deferred-init completion now depends on explicit fresh-payload handoff, not arbitrary rerender order.
- Expanded handoff authority remains explicit: `App` owns `sourceAuthority`.
- `ChartContainer` remains the accepted sourceAuthority-driven handoff boundary and canonical candle normalization boundary before `ChartContext`.
- `ChartContext` handed-off `chartData` / `chartMeta` remain replace snapshots, not merge-survival storage.
- handed-off `chartData.candles` is normalized before storage: `time` in Unix epoch seconds, finite `open/high/low/close`, finite `volume` with fallback `0`.
- handed-off `chartData.candles` drops invalid OHLC bars, sorts ascending by normalized time, and merges duplicate-time bars with `open first / high max / low min / close last / volume sum`.
- confirmed selection must always match the graph actually rendered on screen.
- a new `timeframe` / `interval` becomes confirmed only after successful corresponding graph load.
- initial load failure without a valid snapshot must use error/empty state, not stale chart reuse.
- background refresh failure may keep the last valid snapshot, but stale data must not be presented as a newly confirmed selection.
- selection-change failure must keep the previous valid graph and the previous confirmed `timeframe` / `interval` labels on screen; the requested new selection must not be treated as confirmed, and the system should surface that the new range failed to load and the previous available range is still shown.
- history-load failure must remain local and must not tear down the whole chart.
- Debug panel is dev-only and diagnostic-only.
- Session-aware behavior must respect MOEX non-24/7 structure.
- `ChartCanvas stale-init handoff gap` is not an open frontier anymore; closure is limited to `ChartCanvas` branch and does not imply `MultiPaneChart` parity.
- architecture-safe must not be treated as visual-safe by default.
- accepted owner-state in `App` does not by itself prove a live shared visual consumer layer below `App`.
- visual states around confirmed/requested/stale/failed are not auto-grounded in live code until an explicit downstream presentation surface is proven.
- `currentCandleType` / chart-type surfaces and visible chart-state surfaces remain sensitive; they are not normal auto-safe change zones even where the surrounding architecture is stable.

### Текущий visual contract индикаторов
- `9.1` completed with code + runtime evidence.
- `9.2` accepted visual contract:
  `price + optional MA + optional EMA + max one lower pane`.
- first-pass allowed combinations:
  `MA`, `EMA`, `MA + EMA`, `RSI`, `Volume`, `MA + RSI`, `EMA + RSI`, `MA + Volume`, `EMA + Volume`, `MA + EMA + RSI`, `MA + EMA + Volume`.
- deferred combinations:
  `RSI + Volume`, `MA + EMA + RSI + Volume`, multiple lower-pane indicators, new indicators, broad `MultiPaneChart` redesign.
- main invariant:
  enabling indicators must not change the price chart into a different chart.
- `MA` = только overlay в `ChartCanvas`.
- `EMA` = только overlay в `ChartCanvas`.
- `RSI` = отдельный bottom pane только под exact current `MultiPaneChart` gate; иначе текущий fallback остаётся в `ChartCanvas`.
- `Volume` = отдельный bottom pane только под exact current `MultiPaneChart` gate; иначе текущий fallback остаётся в `ChartCanvas`.
- exact current gate:
  - `isExpanded`
  - ровно один видимый индикатор
  - этот видимый индикатор = `rsi` или `volume`
- mixed visible sets остаются в `ChartCanvas`; forced lower-pane parity в current operational truth нет.
- Это не означает:
  - что final approved UX уже принят
  - что mixed sets уже parity-complete
  - что full `MultiPaneChart` parity уже достигнут

### Engine cache-key rule for `MA / EMA`
- calculation cache key for `MA/EMA` must distinguish the concrete candle dataset
- it must not rely only on `id`, `params`, `length`, `candle type`, `interval` and `timeframe`
- if ticker/symbol is unavailable in a local hook, use candle-data identity
- accepted `9.3` fix uses `sourceIdentity` only for `MA/EMA`
- do not leak `sourceIdentity` into neighboring cases such as `RSI` as `sourceIdentity: null`

### Current engine-level contract asymmetry
- `single-pane` is the richer primary indicator-render path:
  - reads `visible`
  - reads `params`
  - reads `settings`
  - reads `currentInterval`
  - reads `currentTimeframe`
  - reads `currentCandleType`
- current `multi-pane` is the reduced gated branch:
  - reads the current gated indicator identity/visibility
  - applies fixed pane builders for `RSI` or `volume`
  - does not yet prove the same richer payload contract as `single-pane`

### Minimum shared renderer contract for current gated scope
- required now:
  - shared semantic truth for `activation / identity / visibility` of the current gated indicator
  - for `RSI`: semantic parity for `params.period`
  - for `RSI`: semantic parity for level-visibility behavior
- optional for later parity:
  - `currentInterval`
  - `currentTimeframe`
  - `currentCandleType`
  - broader payload/cache symmetry
- acceptable branch-specific for now:
  - branch-specific visual implementation details
  - fixed pane layout mechanics under the exact current gate
- excluded from this bounded parity slice:
  - mixed visible sets
  - `compact`
  - indicator-specific failure behavior
  - `MA / EMA` multi-pane parity

- `compact` freeze means accepted with guardrails, not "never touch compact again"; revisit it only with new code evidence, not by forcing parity with `expanded`.
## 8. Regression Hotspots
- `1d + 15m` init path in expanded owner-nav mode.
- timeframe/interval switching boundaries.
- TF x interval mismatch between UI freedom and data contracts.
- transition veil timing/settle perception.
- `ChartCanvas` versioned handoff path (`payloadVersion` -> `selectionVersion + pendingInitToken`) during expanded init transitions.
- `MA/EMA` stale overlay after ticker change.
- required regression scenario:
  `SBER + MA + EMA -> GAZP`.
- expected:
  `MA/EMA` move to `GAZP` price area; old `SBER` overlay band does not remain; console errors `0`.

## 9. Deferred Topics
- future TF x interval changes only with new evidence or a new product requirement; accepted `Task 1` baseline should not be reopened by default.
- transition veil polish (reduce blink perception).
- `MultiPaneChart` warnings tail is closed; this does not imply full parity.
- exact current `multi-pane` parity cell for the same ownership / authority / init-runtime model remains the bounded retained frontier; this does not equal the whole closed `Phase 8`.
- multi-pane parity for transition behavior and observability.
- `MultiPaneChart` parity for explicit versioned stale-init handoff, if new evidence requires it.
- broader final authority-chain unification across chart branches.

## 10. Investigation Workflow
Standard safe debugging flow:
1. Enable debug panel (dev gate) for navigation/init writer-order questions.
2. Reproduce and capture panel metrics.
3. Identify writer order (`lastWriter`, `lastEvent`) and lifecycle stage.
4. Diagnose whether issue is data-init, runtime navigation, rendering boundary, or sourceAuthority handoff observability.
5. For sourceAuthority / REST not-ready questions, start from observability / debug surfaces before reopening ownership.
6. Apply the smallest scoped patch in the owning layer.
7. Verify before/after evidence from panel metrics and visual behavior.

## 11. Codex Entry Prompts
- `Use fg-chart-architect. Trace visibleLogicalRange ownership for expanded owner-nav timeframe switch with code anchors.`
- `Use fg-chart-architect. Validate init pipeline for setData -> safety heal and report writer order from debug panel evidence.`
- `Use fg-chart-architect. Audit TF x interval behavior against matrix in src/utils/chart/timeframes.js and list mismatches.`
- `Use fg-chart-architect. Tune transition veil in ChartCanvas without changing chart ownership logic.`

LWC is a renderer, not the source of truth.
FG engine owns data and navigation state.


