# Sprint Close: FG chart sprint close after QA ports + compact bridge

## Session Metadata
- Created: 2026-03-27 19:51:14
- Project: `D:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Continues from: [2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md)
- Scope note: this note closes the current sprint and explicitly defers `stale-init handoff` as the first target of the next sprint

## Current Sprint Closed Items
- Current sprint is ready to close. No real current-sprint task remains open based on accepted evidence.
- Closed item: `QA test-port slice`
  - dedicated frontend ports are established:
    - `3000 = normal dev`
    - `3100 = REST QA`
    - `3101 = app/non-REST QA`
  - tracked startup scripts exist in [fingineerwebapp/package.json#L26](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L26), [fingineerwebapp/package.json#L27](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L27), [fingineerwebapp/package.json#L28](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L28)
- Closed item: `Compact REST handoff gap`
  - compact REST bridge remains limited to [fingineerwebapp/src/App.js#L34](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L34), [fingineerwebapp/src/App.js#L122](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L122), [fingineerwebapp/src/App.js#L154](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L154), [fingineerwebapp/src/App.js#L295](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L295), [fingineerwebapp/src/App.js#L318](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L318), [fingineerwebapp/src/App.js#L488](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L488)
  - Expanded ownership through `ChartContainer/useCandles` was intentionally preserved and not reopened
- Closed item: `useChartData boundary map` for the `ChartCanvas` branch
  - mounted path and ownership split were traced and anchored in the current session
  - accepted ownership model remains aligned with [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L31](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L31), [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44), [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L57](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L57)

## Evidence Summary
- Validation result: `3100 PASS`
  - post-patch browser QA through `Playwright MCP` confirmed compact sparkline renders on `http://localhost:3100`
  - accepted prior evidence is recorded in [2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md#L85](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md#L85)
- Validation result: `3101 PASS`
  - post-patch browser QA through `Playwright MCP` confirmed compact sparkline renders on `http://localhost:3101`
  - accepted prior evidence is recorded in [2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md#L101](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md#L101)
- Boundary evidence completed for `ChartCanvas` branch only
  - `ChartRenderer` selects `ChartCanvas` vs `MultiPaneChart` at [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L144](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L144), [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L632](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L632), [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L668](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L668)
  - `ChartCanvas` wires `useFGTimeNavigation` and `useChartData` at [fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L233](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L233) and [fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L282](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L282)
  - `useChartData` init/defer/completion anchors are [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L139](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L139), [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L420](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L420), [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L539](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L539), [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L588](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L588), [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L636](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L636), [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L719](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L719)
  - `useFGTimeNavigation` runtime ownership anchors are [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L26](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L26), [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L72](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L72), [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L171](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L171), [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L317](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L317), [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L360](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L360)
- Runtime evidence for `stale-init window` was observed but no user-facing blocker was reproduced
  - on `3101`, controlled timeframe changes showed a stale window where `currentTimeframe` was already new while `chartData.rangeKey` and `chartData.candles.length` were still from the previous selection
  - this proves runtime stale windows exist
  - this does not prove a current user-facing regression and does not prove a guaranteed invariant failure

## Deferred Items
- Deferred item: `stale-init handoff` inside the `ChartCanvas` branch
  - classification: `open architectural tail`
  - classification: `next sprint instrumentation target`
  - classification: `not a current sprint blocker`
- Why `stale-init` is deferred:
  - static analysis proved only that completion is not locally guaranteed by code; it did not prove a narrow defect that must be patched immediately
  - runtime QA proved stale windows exist, but did not show a user-facing blocker on `3101`
  - direct proof of `didInitViewRef` transition and exact correlation with fresh `preparedData` is not accessible through current browser-only observability
  - therefore the next safe step is targeted instrumentation, not reopening the current sprint
- Intentionally NOT solved in this sprint:
  - no `stale-init instrumentation` patch
  - no `useChartData` lifecycle rewrite
  - no ownership rewrite between `useChartData` and `useFGTimeNavigation`
  - no `MultiPaneChart` analysis
  - no further `CompactSparkline` work
  - no reopening of QA port setup

## First Next-Sprint Target
- First task of the next sprint: narrow instrumentation for `stale-init handoff` in the `ChartCanvas` branch only
- Exact target:
  - prove or disprove whether deferred init ownership completes only after fresh `preparedData`, or can complete after an unrelated rerun
- Exact anchor set to start from:
  - [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L539](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L539)
  - [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L588](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L588)
  - [fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L636](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js#L636)
  - [fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L317](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js#L317)
- Safe next-sprint constraint:
  - treat it as instrumentation first, not as an implementation sprint

## Boundaries / Do-Not-Reopen List
- Do not reopen `Compact REST handoff gap` without new runtime evidence.
- Do not reopen `QA test-port slice` without new environment breakage evidence.
- Do not reopen `localhost:3000` normal dev path for this frontier.
- Do not reopen `MultiPaneChart` while the target remains the `ChartCanvas` stale-init tail.
- Do not drift into local `playwright test` tooling loops; primary browser QA path remains `3100 / 3101` plus `Playwright MCP`.
- Do not over-read stale-window observation as a proven current blocker.
- Do not start a broad refactor of `useChartData`, `useFGTimeNavigation`, `ChartCanvas`, or `ChartRenderer` without first proving the narrow stale-init completion failure.

## Sprint Closure Decision
- Decision: the current sprint is ready to close.
- Remaining status inside this sprint: no exactly justified current-sprint task remains.
- Accepted rationale:
  - all user-facing work targeted by the sprint is closed and validated
  - the only remaining chart concern is an architectural tail requiring dedicated instrumentation
  - that tail belongs to the next sprint and should not be silently reopened here

## Playbook Check
NO.

This sprint-close note records accepted evidence and deferral boundaries, but it does not introduce a new chart-engine architecture change beyond what was already captured in the previous handoff. The next sprint may require a playbook update if instrumentation proves a tighter ownership rule, but this note alone does not justify updating [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md).
