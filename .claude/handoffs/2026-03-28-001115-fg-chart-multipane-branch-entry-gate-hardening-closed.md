# Handoff: FG chart `MultiPaneChart` branch-entry gate hardening closed

## Session Metadata
- Created: 2026-03-28 00:11:15
- Project: `D:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Continues from: [2026-03-27-220857-fg-chart-stale-init-handoff-chartcanvas-closed.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-220857-fg-chart-stale-init-handoff-chartcanvas-closed.md)
- Related previous slice: [2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-27-183514-fg-chart-compact-rest-handoff-gap-qa-closed.md)
- Scope note: this handoff closes only the narrow `ChartRenderer.js` branch-entry gate hardening slice for `MultiPaneChart` routing
- Storage note: handoff intentionally stored in [handoffs](D:/Projects/FG/fg/FG2/handoffs), not in `.claude/handoffs`

## What Was Investigated
- New chart-architecture sprint started from the accepted open tail: `MultiPaneChart parity`, not from any reopened `ChartCanvas` or compact slice.
- The first anchor pass stayed intentionally narrow and asked only one question:
  - does current `shouldUseMultiPane` in [ChartRenderer.js#L144](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L144) route wider indicator combinations than the live `MultiPaneChart` branch can actually render?
- Static proof confirmed:
  - old gate entered `MultiPaneChart` when any visible indicator had `id === 'volume'` or `id === 'rsi'`
  - current live `MultiPaneChart` capability is limited to `price + volume` or `price + rsi`
  - mixed sets like `volume + ma` or `rsi + ema` were real static branch-entry mismatches
- Relevant anchors for that proof:
  - branch gate in [ChartRenderer.js#L144](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L144)
  - multi-pane capability selection in [MultiPaneChart.jsx#L82](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/MultiPaneChart.jsx#L82)
  - pane builder surface in [Pane.jsx#L60](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/Pane.jsx#L60)
  - broader indicator support still lives on `ChartCanvas` side in [useChartIndicators.js#L112](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js#L112)

## What Was Changed
- Applied one-file defensive routing patch in [ChartRenderer.js#L144](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L144).
- New accepted gate rule:
  - `MultiPaneChart` is allowed only when `isExpanded === true`
  - and the visible indicator set contains exactly one visible indicator
  - and that indicator is `volume` or `rsi`
- Mixed visible sets now stay on `ChartCanvas` instead of entering unsupported current live `MultiPaneChart` lifecycle.

## What Was Validated
- Runtime QA was executed only through `Codex + Playwright MCP`.
- Targets:
  - `http://localhost:3100`
  - `http://localhost:3101`
- Confirmed on both targets:
  - `volume only -> MultiPaneChart`
  - `rsi only -> MultiPaneChart`
  - `volume + ma -> ChartCanvas`
  - `rsi + ema -> ChartCanvas`
  - `ma only -> non-multi-pane / ChartCanvas`
- Runtime QA also confirmed:
  - no console errors
  - no relevant failed network requests
- Remaining caveat:
  - repeated warnings `[volume] reset margins failed` / `[rsi] reset margins failed`
  - treat them as a separate future tail, not as routing-slice failure

## What Is Now Closed
- Closed sub-task: narrow `MultiPaneChart` branch-entry gate mismatch in [ChartRenderer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js)
- This closure is exact and narrow:
  - it closes branch-entry gate hardening only
  - it does not claim `MultiPaneChart parity`
  - it does not claim broader authority-chain unification

## What Remains Open
- Full `MultiPaneChart` parity for the same ownership/authority/init-runtime model remains open.
- Broader authority-chain unification across chart branches remains future work.
- Repeated indicator-switch warnings remain open as a separate lifecycle/cleanup tail:
  - `[volume] reset margins failed`
  - `[rsi] reset margins failed`

## Do-Not-Reopen List
- Do not reopen QA port setup without new environment breakage evidence.
- Do not reopen compact REST handoff gap without new runtime evidence.
- Do not reopen `ChartCanvas stale-init handoff gap` without new evidence.
- Do not mix this closed routing slice with full `MultiPaneChart parity`.

## Next Recommended Frontier
- Stay within `MultiPaneChart` as the active open architecture object, but do not reopen the closed gate slice.
- Narrow recommended next frontier:
  - isolate the `reset margins failed` warnings as a separate lifecycle/cleanup tail
  - or run a read-only anchor pass on init/runtime ownership inside the current live multi-pane path

## Critical Files
- [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js)
- [fingineerwebapp/src/charts/MultiPaneChart.jsx](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/MultiPaneChart.jsx)
- [fingineerwebapp/src/charts/Pane.jsx](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/Pane.jsx)
- [fingineerwebapp/src/charts/ChartSyncController.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/ChartSyncController.js)

## Playbook Check
YES.

This session introduced a stable branch-entry rule for current live `MultiPaneChart` routing:
- `ChartRenderer` now routes to `MultiPaneChart` only for exact supported single-bottom indicator sets
- mixed visible sets remain on `ChartCanvas`
- the slice is verified on both `3100` and `3101`
