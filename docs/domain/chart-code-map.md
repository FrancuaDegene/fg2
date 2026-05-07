# FG Chart Code Map

Code-verified architecture map for the current chart engine.

Domain alignment:
- Canonical state terms: `docs/domain/chart-state-model.md`
- Canonical navigation terms: `docs/domain/chart-navigation.md`
- Canonical session-aware terms: `docs/domain/moex-sessions.md`

Scope: current code under `fingineerwebapp/src/components/Results/Chart` and `fingineerwebapp/src/charts`.

## Verified Findings

1. Expanded single-pane chart boot is owned by `useLightweightChart` (LWC `createChart` + base series creation), with data/range lifecycle layered by `useChartData`.
2. FG custom navigation ownership is explicitly gated by `isExpanded && REACT_APP_FG_NAV_OWNER === '1'`.
3. `visibleRange` direct writes are centralized in `useChartData` (`setVisibleRange`), mainly in initialization/compact 1D enforcement.
4. `visibleLogicalRange` has split runtime writers by mode/path: `useFGTimeNavigation`, compact clamp in `useChartData`, and `ChartSyncController` for multipane sync.
5. `barSpacing` has one explicit owner at boot (`timeScale.barSpacing = 6` in `useLightweightChart`); runtime changes are native LWC behavior when native scale interaction is enabled.
6. Multipane path has its own LWC boundary (`Pane`) and synchronization owner (`ChartSyncController`).
7. Healing/normalization flows are explicit and code-local: navigation normalization/heal in `useFGTimeNavigation`, plus compact clamps/guards in `useChartData`.

## Ownership Registry

| Concern | Primary owner | Secondary modules | Stage | Verified evidence |
|---|---|---|---|---|
| Chart boot (single-pane) | `useLightweightChart` | `ChartCanvas` | Init | `useLightweightChart.js:61` `createChart(container, ...)`; `ChartCanvas.js:202` hook call |
| Series creation (single-pane) | `useLightweightChart` via `createSeries` | `chartUtils.createSeries` | Init | `useLightweightChart.js:113`; `chartUtils.js:38` export |
| Series creation (multipane) | Pane builders (`candles/volume/rsi`) | `MultiPaneChart`, `Pane` | Init | `MultiPaneChart.jsx:38`, `MultiPaneChart.jsx:130`, `Pane.jsx:60` |
| Data init / setData pipeline | `useChartData` | `ChartContainer` (`useCandles` source), `ChartCanvas` (`prepareData`) | Init + Runtime | `useChartData.js:410` `series.setData(sessionSlice)`; `ChartContainer.js:95`; `ChartCanvas.js:238` |
| Initial visible range setup | `useChartData` | `ChartCanvas` mode gate inputs | Init | `useChartData.js:525` `ts.setVisibleRange(...)`; `useChartData.js:564` compact-1d |
| `visibleRange` ownership (direct writers) | `useChartData` | Native LWC mutators when enabled | Init + Runtime | `useChartData.js:525`, `useChartData.js:564`; read/virtualization hook `useChartData.js:622` |
| `visibleLogicalRange` ownership (single-pane nav-owner path) | `useFGTimeNavigation` | `ChartCanvas` enable gate | Runtime + Healing | `useFGTimeNavigation.js:90`, `:111`, `:234`, `:275`, `:380`; enable at `ChartCanvas.js:229` |
| `visibleLogicalRange` ownership (compact clamp path) | `useChartData` clamp effect | `snapshotRangeRef` guard | Runtime + Healing | `useChartData.js:978` clamp calc; `useChartData.js:997` write |
| `visibleLogicalRange` ownership (multipane sync) | `ChartSyncController` | `MultiPaneChart`/`Pane` wiring | Runtime + Sync | `ChartSyncController.js:36`; subscribe `:51`; usage `MultiPaneChart.jsx:31`, `Pane.jsx:52` |
| `barSpacing` ownership | `useLightweightChart` boot `timeScale` options | Native LWC interaction loop | Init + Runtime(native) | `useLightweightChart.js:93` `barSpacing: 6`; `:66-80` native scale on/off |
| Pan/Zoom ownership (FG custom) | `useFGTimeNavigation` | `useLightweightChart` disables native | Runtime | Pan write `useFGTimeNavigation.js:111`; wheel zoom write `:234`; native disable `useLightweightChart.js:27`, `:66-84` |
| Sync between panes/components | `ChartSyncController` (range + hover time bus) | `Pane`, `MultiPaneChart` | Runtime + Sync | `ChartSyncController.js:36`, `:48`, `:51`; `Pane.jsx:63` hover bus |
| Mode gates | `Chart.js`, `ChartCanvas`, `ChartRenderer` | `ChartContainer`, `ChartContext` | Init + Runtime | `Chart.js:233` expanded vs compact branch; `ChartCanvas.js:125` navOwner flag; `ChartRenderer.js:144` multipane gate |
| Re-init triggers | `ChartRenderer` key + `useLightweightChart` deps + `useChartData` reset effect | N/A | Init lifecycle | `ChartRenderer.js:669` key by expanded state; `useLightweightChart.js:330` deps; `useChartData.js:127` reset deps |
| Healing / normalization | `useFGTimeNavigation` (+ `useChartData` compact guards) | N/A | Runtime + Healing | `useFGTimeNavigation.js:72`, `:229`, `:327`, `:348`, `:380`; `useChartData.js:446`, `:514`, `:978` |
| LWC boundary vs FG-owned logic | LWC at chart/series primitives; FG at nav/data control | `useLightweightChart`, `Pane`, `useFGTimeNavigation`, `useChartData` | Init + Runtime | LWC boundary: `useLightweightChart.js:61`, `chartUtils.js:54`, `Pane.jsx:41`; FG control: `useFGTimeNavigation.js:171`, `useChartData.js:622` |

## Runtime vs Init Matrix

| Concern | Init responsibilities | Runtime responsibilities | Gate / split condition |
|---|---|---|---|
| Boot and options | LWC chart creation + base options in `useLightweightChart` | Resize handling, optional `scrollToRealTime` on resize | `disableNativeNavigation = isExpanded && navOwnerEnabled` (`useLightweightChart.js:27`) |
| Series | Base series created once per chart init | Indicator series and updates managed by runtime hooks | Re-init on `isExpanded` or `currentCandleType` (`useLightweightChart.js:330`) |
| Data flow | First slice selection + initial `setData` in `useChartData` | Stream updates, virtualization, loadMore, range-driven slice swaps | Resets on `symbolId/currentInterval/currentTimeframe/currentCandleType` (`useChartData.js:127`) |
| Range state | Initial `setVisibleRange` from computed init window | Ongoing range reaction via `subscribeVisibleTimeRangeChange`; optional clamps/heals | Skip init write in expanded nav-owner 1D path (`useChartData.js:466-469`, `:514`) |
| Navigation | Native LWC interaction setup in chart options | FG custom pan/zoom if enabled; otherwise native LWC | `useFGTimeNavigation` enabled at `ChartCanvas.js:229` |
| Multipane sync | Register panes/charts into sync controller | Propagate logical range + hover time | Multipane activated by indicator gate (`ChartRenderer.js:144-150`) |

## Writer Matrix (Navigation-Related State)

| State | Direct writers | Indirect mutators | Active conditions | Notes |
|---|---|---|---|---|
| `visibleRange` | `useChartData` (`setVisibleRange`) | `fitContent`, `scrollToRealTime`, native pan/zoom | Direct writes in init/compact 1D (`useChartData.js:525`, `:564`) | Direct writer is single module; indirect movement depends on mode/native behavior |
| `visibleLogicalRange` | `useFGTimeNavigation`; `useChartData` clamp; `ChartSyncController` | Native LWC when enabled | FG nav path: expanded+nav-owner; clamp path: non-expanded; multipane sync: pane controller | Multi-writer by design across distinct paths |
| `barSpacing` | `useLightweightChart` boot option (`barSpacing: 6`) | Native LWC scale engine | Native scale active when `disableNativeNavigation` is false | No other explicit `barSpacing` setter found |
| Pan | `useFGTimeNavigation` (pointer drag) | Native `handleScroll.pressedMouseMove` | FG path if nav owner enabled; else native | `useFGTimeNavigation.js:157-168`, `useLightweightChart.js:82-84` |
| Zoom | `useFGTimeNavigation` (wheel) | Native `handleScale.mouseWheel/pinch` | FG path if nav owner enabled; else native | `useFGTimeNavigation.js:171-235`, `useLightweightChart.js:66-79` |
| Scroll-to-right | `useChartData` and `useLightweightChart` call `scrollToRealTime` | Native | Disabled in expanded nav-owner path by branch guards | `useChartData.js:197`, `:935`; `useLightweightChart.js:255` |

## Mode Gates and Re-init Triggers

1. Top-level mode branch:
   - Expanded uses full chart engine via `ChartContainer`
   - Compact uses `CompactSparkline`
   - Evidence: `Chart.js:233-250`
2. FG navigation ownership gate:
   - Flag read: `ChartCanvas.js:125`
   - Hook enable: `ChartCanvas.js:229`
   - Native navigation disable: `useLightweightChart.js:27`, `:66-84`
3. Multipane activation gate:
   - `isExpanded && activeIndicators includes volume/rsi`
   - Evidence: `ChartRenderer.js:144-150`
4. Forced remount trigger:
   - `ChartCanvas` keyed by expanded mode
   - Evidence: `ChartRenderer.js:669`
5. Hook re-init triggers:
   - Chart recreation deps: `useLightweightChart.js:330`
   - Data/reset deps: `useChartData.js:127`

## Healing / Normalization Flows

1. FG navigation healing:
   - Normalize on attach (`normalizeInitialRange`)
   - Wheel heal if width collapses below min bars
   - Mode-change `fitContent` + post-fit heal
   - Evidence: `useFGTimeNavigation.js:72`, `:229`, `:327-329`, `:348`, `:360`, `:380`
2. Data/range guard healing:
   - Skip tiny init slice for expanded nav-owner 1D
   - Skip owner init range write in that path
   - Compact clamp to snapshot logical range bounds
   - Evidence: `useChartData.js:446`, `:514`, `:978-997`

## Session-Aware Behavior (MOEX-Relevant)

1. Compact 1D path computes explicit session window using Moscow timezone offsets and trims data:
   - `07:00:00+03:00` to `23:50:00+03:00`
   - Evidence: `useChartData.js:382`, `:385`, `:403-407`
2. Virtualization path also cuts compact 1D slice from `07:00:00+03:00`:
   - Evidence: `useChartData.js:877`, `:880-883`
3. Time rendering is Moscow timezone-aware in chart time formatter:
   - Evidence: `useLightweightChart.js:96`

## LWC Boundary vs FG-Owned Logic

LWC-owned boundary (rendering primitives):
- `createChart` and series APIs (`useLightweightChart.js:61`, `chartUtils.js:54`, `Pane.jsx:41`)

FG-owned control layers:
- Data slicing/virtualization/range init (`useChartData`)
- Custom pan/zoom/heal (`useFGTimeNavigation`)
- Multipane logical-range and hover synchronization (`ChartSyncController`)

## Open Questions

1. Session boundary alignment: domain session model starts morning at `06:50`, while current compact 1D code uses `07:00`; confirm intended boundary for chart filtering.
2. Compact path architecture: `Chart.js` compact branch currently renders `CompactSparkline`, while `useChartData` still contains non-expanded chart logic; confirm whether that non-expanded `useChartData` path is legacy or intentionally retained for alternate flows.
3. Multipane native navigation policy: `Pane` chart options do not explicitly disable native scale/scroll interactions; confirm whether multipane should remain native-driven or adopt FG nav-owner policy.

