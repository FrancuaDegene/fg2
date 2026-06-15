# Handoff: FG chart warnings tail closed and Stage 2 bounded slices accepted

## Session Metadata
- Created: 2026-03-30 15:37:39
- Project: `D:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Continues from: [2026-03-28-001115-fg-chart-multipane-branch-entry-gate-hardening-closed.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-28-001115-fg-chart-multipane-branch-entry-gate-hardening-closed.md)
- Scope note: this handoff captures only accepted outcomes from the current FG chart session before any stable docs sync
- Docs note: `docs/domain/FG_CHART_ARCHITECTURE_MAP.md`, `docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md`, and `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md` were intentionally not updated in this session
- Storage note: handoff intentionally stored in [handoffs](D:/Projects/FG/fg/FG2/handoffs), not in `.claude/handoffs`

## What Was Investigated
- The first bounded object was the open `MultiPaneChart` warnings tail:
  - `[volume] reset margins failed`
  - `[rsi] reset margins failed`
- After that, the session moved into `Stage 2 / Selection Ownership` and closed two bounded slices:
  - `ChartContext.js` demotion for `setTimeframe` / `setInterval`
  - transitional `currentCandleType` dual-write removal
- The session then ran a final read-only anchor pass on the remaining `currentCandleType` owner-transfer question:
  - can `Chart.js` local candleType be removed now
  - can `ChartContext` become the canonical owner now
  - can remount/reseed stop depending on `Chart.js` local state now

## What Was Changed
- Closed the `MultiPaneChart` warnings tail with a narrow cleanup-order fix in:
  - [fingineerwebapp/src/charts/series/volume.js#L47](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/series/volume.js#L47)
  - [fingineerwebapp/src/charts/series/rsi.js#L90](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/series/rsi.js#L90)
- Accepted `Stage 2 / Slice 1` demotion in:
  - [fingineerwebapp/src/components/Results/Chart/ChartContext.js#L227](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js#L227)
  - [fingineerwebapp/src/components/Results/Chart/ChartContext.js#L231](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js#L231)
  - `ChartContext` no longer re-runs secondary guard/rewrite logic for `timeframe / interval` on the active path
- Accepted `Stage 2 / Slice 2` transitional `currentCandleType` cleanup in:
  - [fingineerwebapp/src/components/Results/Chart/ChartContent.js#L56](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js#L56)
  - [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L148](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L148)
  - [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L239](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L239)
- Accepted transitional result for `currentCandleType`:
  - direct dual-write from `ChartContent` disappeared
  - live intent now flows through `ChartToolbar -> ChartContent -> onCandleTypeChange -> Chart.js -> ChartContainer -> ChartContext`
  - current remount/reseed behavior from `Chart.js` was intentionally preserved

## What Was Validated
- Runtime QA used `Codex + Playwright MCP` only.
- `MultiPaneChart` warnings tail:
  - runtime proof was collected on `http://localhost:3101` and `http://localhost:3100`
  - narrow patch was applied
  - post-fix runtime checks passed on both targets
  - neighboring smoke also stayed clean for:
    - `ma only`
    - `ema only`
    - `volume + ma`
    - `rsi + ema`
- `Stage 2 / Slice 1`:
  - runtime QA passed on `3101` and `3100`
  - no second correction/drift was observed on the active toolbar path
  - the settled `TF×interval` pair remained stable after user-visible settle points
- `Stage 2 / Slice 2` transitional `currentCandleType` cleanup:
  - runtime QA passed on `3101` and `3100`
  - active type switching, settle behavior, and `collapse -> reopen` preservation were validated
  - the earlier incomplete `3101` proof for `Бары -> Линия` was later completed successfully
  - the earlier blocker was tooling-only:
    - candle-type dropdown options are `role="menuitemradio"`
    - the missed proof was caused by locator/menu targeting, not by product regression

## What Is Now Closed
- Closed sub-task: `MultiPaneChart` warnings tail only.
  - closed here:
    - `[volume] reset margins failed`
    - `[rsi] reset margins failed`
  - not claimed here:
    - full `MultiPaneChart parity`
- Closed sub-task: `Stage 2 / Slice 1`
  - `ChartContext` demotion from `mirror + second rewrite` to `mirror-only` for `setTimeframe` / `setInterval` on the active path
- Closed sub-task: `Stage 2 / Slice 2` transitional `currentCandleType` cleanup
  - direct dual-write point removed
  - transitional runtime path accepted on both QA targets

## What Is Explicitly Not Closed
- This session does not close full `MultiPaneChart parity`.
- This session does not close full `Selection Ownership Stabilization`.
- This session does not close the final `currentCandleType` owner transfer.
- This session does not sync stable docs yet.

## Why Final `currentCandleType` Transfer Stopped
- The stop is architectural, not a leftover local bugfix.
- Current live truth after the accepted transitional slice:
  - `ChartContext` is the runtime-read owner for render consumers:
    - [fingineerwebapp/src/components/Results/Chart/ChartContent.js#L23](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js#L23)
    - [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L593](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L593)
    - [fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L140](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L140)
    - [fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js#L113](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/hooks/useLightweightChart.js#L113)
  - `Chart.js` still acts as a live writer plus remount seed source:
    - [fingineerwebapp/src/components/Results/Chart/Chart.js#L46](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L46)
    - [fingineerwebapp/src/components/Results/Chart/Chart.js#L70](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L70)
    - [fingineerwebapp/src/components/Results/Chart/Chart.js#L222](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L222)
  - `ChartContainer` still acts as seed + mirror bridge:
    - [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L148](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L148)
    - [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L239](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L239)
    - [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L250](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L250)
- Exact blocker:
  - the persistence boundary is above `ChartContainer`
  - `ChartProvider` lifetime is tied to the expanded branch / `ChartContainer` mount
  - if `Chart.js` local state were removed now, the system would lose the surviving value across expanded unmount/remount
- Therefore:
  - no patch yet for the final owner transfer
  - this is not “one more local cleanup”
  - the next frontier must move above the current bounded slice

## Exact Next Frontier
- The next real frontier is not another local `currentCandleType` cleanup patch.
- Frame it as:
  - `currentCandleType persistence boundary / final owner transfer above ChartContainer`
- The next architecture question is:
  - where should the surviving `currentCandleType` value live so that `ChartContext` can become the true canonical owner without losing remount persistence

## Do-Not-Reopen List
- Do not reopen QA port setup without new environment breakage evidence.
- Do not reopen compact REST handoff gap without new runtime evidence.
- Do not reopen `ChartCanvas stale-init handoff gap` without new evidence.
- Do not reopen narrow `ChartRenderer -> MultiPaneChart` branch-entry gate hardening.
- Do not reopen `MultiPaneChart` warnings tail.
- Do not reopen `Stage 2 / Slice 1` (`ChartContext` timeframe/interval demotion).
- Do not reopen `Stage 2 / Slice 2` transitional `currentCandleType` dual-write removal.

## Safe Next Step
- Before any final `currentCandleType` transfer patch, run one bounded anchor/design pass above `ChartContainer` only:
  - identify the persistence layer that survives expanded unmount/remount
  - then decide whether `ChartContext` can become canonical owner directly or only after that boundary moves
- Do not treat the next step as a local `Chart.js` deletion patch.

## Critical Files
- [fingineerwebapp/src/charts/series/volume.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/series/volume.js)
- [fingineerwebapp/src/charts/series/rsi.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/series/rsi.js)
- [fingineerwebapp/src/components/Results/Chart/ChartContext.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js)
- [fingineerwebapp/src/components/Results/Chart/ChartContent.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js)
- [fingineerwebapp/src/components/Results/Chart/ChartContainer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js)
- [fingineerwebapp/src/components/Results/Chart/Chart.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js)

## Playbook Check
YES.

This session introduced accepted changes to:
- chart ownership boundaries for `currentTimeframe` / `currentInterval` inside `ChartContext`
- transitional `currentCandleType` write flow and mirror boundary
- the closed `MultiPaneChart` warnings tail

Stable docs sync is intentionally deferred until after this handoff artifact.
