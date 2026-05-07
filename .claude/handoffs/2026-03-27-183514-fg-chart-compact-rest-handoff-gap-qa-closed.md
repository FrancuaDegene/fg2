# Handoff: FG chart compact REST handoff gap + QA ports closed

## Session Metadata
- Created: 2026-03-27 18:35:14
- Project: `D:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Session duration: одна длинная техническая сессия с test-infra slice, runtime tracing, минимальным bridge patch и post-patch browser QA
- Continues from: [2026-03-24-231212-fg-chart-architecture-recovery-candles-contract-stage.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-24-231212-fg-chart-architecture-recovery-candles-contract-stage.md)
- Storage note: этот handoff намеренно создан в [handoffs](D:/Projects/FG/fg/FG2/handoffs), а не в `.claude/handoffs`

## Current State Summary
Эта сессия закрыла два связанных sub-task внутри текущего FG chart sprint: `QA test-port slice` и `Compact REST handoff gap`. Сначала были введены выделенные frontend test ports: `3000 = normal dev`, `3100 = REST QA`, `3101 = app/non-REST QA`. Затем через `Playwright MCP` и `Serena` было подтверждено, что реальная проблема compact chart на `3100` находилась не в renderer/layout внутри `CompactSparkline`, а в upstream handoff: mounted compact path читает `App.chartData`, а в REST mode [App.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js) short-circuit-ил normal compact writer path, в то время как Expanded REST path живёт отдельно через `ChartContainer/useCandles`. После минимального one-file patch только в [App.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js) compact в REST mode снова получает совместимый `chartData` и `rangeKey` через существующий `App/socket` path, а ownership Expanded path не тронут. Post-patch browser QA через `Playwright MCP` дал `3100 PASS` и `3101 PASS`.

## Architecture Overview

### Что было подтверждено статически
- Mounted compact path использует `CompactSparkline`, а не legacy `CompactTrendChart`:
  - import switch: [fingineerwebapp/src/components/Results/Chart/Chart.js#L3](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L3), [fingineerwebapp/src/components/Results/Chart/Chart.js#L5](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L5)
  - mounted compact consumer: [fingineerwebapp/src/components/Results/Chart/Chart.js#L246](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L246)
- `CompactSparkline` читает `chartData.candles` и `chartData.rangeKey` напрямую:
  - candles read: [fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx#L92](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx#L92)
  - `currentRangeKey` / `dataRangeKey` gate: [fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx#L255](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/CompactTrendChart/CompactSparkline.jsx#L255)
- Expanded REST path остаётся отдельным и опирается на `ChartContainer/useCandles`:
  - expanded branch: [fingineerwebapp/src/components/Results/Chart/Chart.js#L216](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js#L216)
  - `sourceAuthority` in `ChartContainer`: [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L78](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L78), [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L95](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L95)
- До patch `App` short-circuit-ил compact writer path в REST mode, из-за чего compact consumer видел пустой upstream handoff:
  - socket request entry: [fingineerwebapp/src/App.js#L154](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L154)
  - runtime request effect: [fingineerwebapp/src/App.js#L295](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L295)
  - reconnect catch-up: [fingineerwebapp/src/App.js#L318](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L318)

### Что было подтверждено через runtime QA до patch
- `localhost:3100` успешно грузился, поиск `SBER` работал, `.compact-trend-chart`, `svg` и `polyline` существовали.
- Но mounted compact path получал:
  - `chartData.candles = []`
  - `chartData.rangeKey = ""`
  - `currentRangeKey = SBER|3mth`
  - `showPlaceholder` effectively оставался `true`
  - `polyline` оставался `hidden`/empty
- Это доказало, что реальный blocker находился в upstream handoff, а не в чистом render/layout bug внутри `CompactSparkline`.

## Work Completed

### Tasks Finished
- [x] Выделены dedicated frontend test ports:
  - `3000 = normal dev`
  - `3100 = REST QA`
  - `3101 = app/non-REST QA`
- [x] В [fingineerwebapp/package.json](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L25) добавлены scripts для `3100` и `3101`
- [x] Local [fingineerwebapp/playwright.config.js](D:/Projects/FG/fg/FG2/fingineerwebapp/playwright.config.js) перестроен на `rest/app` routing для QA, но tracking status остаётся зависимым от `.gitignore`
- [x] Через `Serena` и `Playwright MCP` локализован точный compact REST blocker
- [x] Применён минимальный reversible bridge patch только в [fingineerwebapp/src/App.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js)
- [x] Post-patch browser QA:
  - `3100 PASS`
  - `3101 PASS`

### Files Modified
| File | Changes | Status / Rationale |
|------|---------|--------------------|
| [fingineerwebapp/package.json](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L27) | Added `start:test:rest` and `start:test:app` | tracked test-port slice for dedicated QA frontends |
| [fingineerwebapp/src/App.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L154) | Added compact REST bridge while keeping Expanded REST split | tracked minimal one-file patch for confirmed upstream handoff gap |
| [fingineerwebapp/playwright.config.js](D:/Projects/FG/fg/FG2/fingineerwebapp/playwright.config.js) | Local `rest/app` project routing to `3100/3101` | local-only at the moment; path is ignored by root [`.gitignore#L68`](D:/Projects/FG/fg/FG2/.gitignore#L68) unless ignore handling changes |

### Decisions Made
| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| QA ports promoted ahead of `useChartData` frontier | resume `useChartData` first, keep using `3000`, isolate test infra first | repeatable browser QA was blocked without dedicated frontends |
| `3000` remains normal dev | reuse `3000` for alternating test modes | lower operator confusion and preserves default developer flow |
| `3100` = REST QA and `3101` = app/non-REST QA | single port reuse, separate backend-only switch, delayed split | supports side-by-side browser QA without touching normal dev |
| `Playwright MCP` remains primary browser QA path | local e2e runner first, manual browser first | MCP gave deterministic live runtime evidence without drifting into tooling loop |
| compact REST fix limited to [fingineerwebapp/src/App.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js) | patch `CompactSparkline`, patch `Chart.js`, patch `ChartContainer/useCandles`, broader authority merge | smallest bridge at the confirmed upstream handoff boundary |
| Expanded REST ownership stays with `ChartContainer/useCandles` | unify compact+expanded immediately, reopen expanded layer | current fix only closes compact gap and stays reversible |

## Patch Summary

### QA Test-Port Slice
- Added:
  - [fingineerwebapp/package.json#L27](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L27) `start:test:rest`
  - [fingineerwebapp/package.json#L28](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json#L28) `start:test:app`
- Result:
  - `npm start` -> `3000`
  - `npm run start:test:rest` -> `3100` with `REACT_APP_FG_AGG_ENABLED=1`
  - `npm run start:test:app` -> `3101` with `REACT_APP_FG_AGG_ENABLED=0`

### Local Playwright Routing Slice
- Local [fingineerwebapp/playwright.config.js](D:/Projects/FG/fg/FG2/fingineerwebapp/playwright.config.js) was adjusted to target:
  - `rest -> http://localhost:3100`
  - `app -> http://localhost:3101`
- Important honesty note:
  - current path is ignored by root [`.gitignore#L68`](D:/Projects/FG/fg/FG2/.gitignore#L68)
  - therefore this config is usable locally for QA, but not yet guaranteed as tracked repo state

### Compact REST Bridge Patch
- `sourceAuthority` explicit handoff from `App` into `Results`:
  - [fingineerwebapp/src/App.js#L34](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L34)
  - [fingineerwebapp/src/App.js#L488](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L488)
- Added `isChartExpandedRef` to separate compact vs expanded behavior at runtime:
  - [fingineerwebapp/src/App.js#L122](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L122)
- `emitChartDataRequest` no longer short-circuits compact in REST mode:
  - [fingineerwebapp/src/App.js#L154](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L154)
- `chartRequestEffect` skips only `FG_AGG_ENABLED && isChartExpanded`:
  - [fingineerwebapp/src/App.js#L295](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L295)
- socket reconnect catch-up keeps compact bridge alive without reopening Expanded ownership:
  - [fingineerwebapp/src/App.js#L318](D:/Projects/FG/fg/FG2/fingineerwebapp/src/App.js#L318)

## Runtime Validation

### `localhost:3100` post-patch
- Browser QA path: `Playwright MCP`, not local `e2e` runner
- Search `SBER`: PASS
- Compact runtime values:
  - `ticker = SBER`
  - `range = 3mth`
  - `currentRangeKey = SBER|3mth`
  - `chartData.rangeKey = SBER|3mth`
  - `chartData.candles.length = 17940`
  - `closesLength = 17940`
  - `size = { width: 1200, height: 421.734375 }`
  - `isSizeSettled = true`
  - `isAwaitingData = false`
  - `showPlaceholderEffective = false`
  - `polyline.visibility = visible`
  - `pointsLength = 2400`
- Visual result: compact sparkline rendered correctly
- Evidence artifacts:
  - `rest-3100-postpatch-full.png`
  - `rest-3100-postpatch-compact-chart.png`

### `localhost:3101` post-patch
- Browser QA path: `Playwright MCP`, not local `e2e` runner
- Search `SBER`: PASS
- Compact runtime values:
  - `ticker = SBER`
  - `range = 3mth`
  - `currentRangeKey = SBER|3mth`
  - `chartData.rangeKey = SBER|3mth`
  - `chartData.candles.length = 17940`
  - `closesLength = 17940`
  - `size = { width: 1200, height: 421.734375 }`
  - `isSizeSettled = true`
  - `isAwaitingData = false`
  - `showPlaceholderEffective = false`
  - `polyline.visibility = visible`
  - `pointsLength = 2400`
- Visual result: compact sparkline rendered correctly
- Evidence artifacts:
  - `app-3101-postpatch-full.png`
  - `app-3101-postpatch-compact-chart.png`

### Console / Network Summary
- On both `3100` and `3101`:
  - no console errors
  - no relevant failed network requests
  - `GET http://localhost:3001/api/ticker/SBER => 200`
  - `GET http://localhost:3002/api/suggestions/SBER => 200`
  - `socket.io` polling requests to `http://localhost:3001 => 200`

## What Is Closed
- Closed sub-task: `QA test-port slice`
- Closed sub-task: `Compact REST handoff gap`
- Closed conclusion:
  - compact sparkline on `3100` is no longer blocked by empty upstream `chartData`
  - non-REST compact path on `3101` still behaves correctly after the bridge patch

## What Remains Open
- Main sprint frontier remains `useChartData boundary map`
- Broader Compact/Expanded authority unification remains open and was intentionally not attempted here
- Tracked repo handling for [fingineerwebapp/playwright.config.js](D:/Projects/FG/fg/FG2/fingineerwebapp/playwright.config.js) remains open because the path is ignored by [`.gitignore#L68`](D:/Projects/FG/fg/FG2/.gitignore#L68)
- Local `Playwright` e2e runner remains secondary regression harness; it should not replace `Codex + Playwright MCP` as the primary browser QA path for this sprint

## Immediate Next Steps
1. Return to the main sprint frontier around `useChartData`.
2. Start from boundary mapping, not from patching symptoms.
3. Use dedicated QA ports `3100 / 3101` plus `Playwright MCP` as the primary validation route for the next risky chart step.
4. Do not reopen compact bridge work unless new runtime evidence appears.

## Important Context
- This session produced a bridge fix, not a final architecture unification.
- The accepted mental model after this session:
  - compact can continue to rely on `App.chartData`
  - expanded REST path continues to rely on `ChartContainer/useCandles`
  - the new `App.js` logic is an explicit transition bridge, not a claim that the architecture is now “cleanly unified”
- During the session there was brief drift into a local `Playwright` tooling loop.
- Process lesson accepted for future work:
  - primary browser QA = `Codex + Playwright MCP` on dedicated QA ports
  - local `playwright test` = secondary regression harness only

## Risks And Boundaries
- Do not reopen `CompactSparkline` render/layout as the primary suspect for this fixed issue without new runtime evidence.
- Do not reopen Expanded path ownership; this session intentionally preserved `ChartContainer/useCandles`.
- Do not over-read this bridge as a final ownership solution; it only restores deterministic compact delivery in REST mode.
- Worktree is dirty in many unrelated areas; do not treat current git diff as isolated to this session.
- `playwright.config.js` local changes are operationally useful but not guaranteed tracked until ignore handling is addressed.

## Potential Gotchas
- If the next agent uses only local `e2e` output, they can drift back into tooling issues instead of live browser evidence.
- If `3100` or `3101` is not running, lack of sparkline evidence can become an environment false negative rather than a real chart regression.
- `localhost:3000` must remain untouched during this sprint slice unless the task explicitly targets normal dev.
- Compact should not be reopened from screenshots alone; always compare runtime values:
  - `chartData.candles.length`
  - `chartData.rangeKey`
  - `currentRangeKey`
  - `polyline.visibility`
  - `pointsLength`

## Environment State

### Tools/Services Used
- `Serena MCP`: used for code-path tracing and ownership confirmation
- `Playwright MCP`: used for live browser QA, screenshots, console capture, network capture, and runtime value extraction
- local `Playwright` CLI: briefly touched during tooling loop, but not used as the primary validation basis for the accepted conclusion

### Active Ports / Runtime Model
- `3000` = normal dev
- `3100` = dedicated REST QA
- `3101` = dedicated app/non-REST QA

### Environment Variables / Switches
- `REACT_APP_FG_AGG_ENABLED` controls `rest` vs `app` mode at frontend boot
- `PORT` controls frontend port split
- `PLAYWRIGHT_BASE_URL` remains secondary compared with explicit project routing / MCP target URLs

## Related Resources
- Architecture map: [docs/domain/FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md)
- Stabilization playbook: [docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md)
- Engine playbook: [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md)
- Previous handoff: [handoffs/2026-03-24-231212-fg-chart-architecture-recovery-candles-contract-stage.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-24-231212-fg-chart-architecture-recovery-candles-contract-stage.md)
- Root ignore source for local Playwright config: [`.gitignore#L68`](D:/Projects/FG/fg/FG2/.gitignore#L68)

## Playbook Check
YES.

This session introduced a chart-engine transition rule that should be reflected in the stable playbook: when `sourceAuthority === 'rest'`, compact still depends on `App.chartData`, while Expanded continues through `ChartContainer/useCandles`. That is not full authority unification, but it is a real ownership/transition behavior worth documenting.

The first section that should be updated:
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44) `## 3. Ownership Model`

Secondary section that may need a short note:
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L113](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L113) `## 8. Regression Hotspots`

Why:
- the accepted bridge now makes compact REST behavior explicitly dependent on `App` runtime gating rather than only on downstream render state
- dedicated `3100 / 3101` QA ports plus `Playwright MCP` have also become the accepted primary verification workflow for this frontier

What to record when/if the playbook is updated:
- compact mounted path still consumes `App.chartData`
- expanded REST path still consumes `ChartContainer/useCandles`
- current bridge preserves Expanded ownership and should not be confused with final unification
- regression verification for this slice should prefer dedicated QA ports and MCP browser evidence over tooling-only conclusions
