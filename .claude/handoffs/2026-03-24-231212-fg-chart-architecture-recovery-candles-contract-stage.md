# Handoff: FG chart architecture recovery - candles contract stage

## Session Metadata
- Created: 2026-03-24 23:12:12
- Project: `D:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Session duration: около одной длинной технической сессии с архитектурным анализом, минимальным patch и runtime QA
- Continues from: [2026-03-22-224331-fg2-browser-qa-workflow.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-22-224331-fg2-browser-qa-workflow.md)
- Storage note: этот handoff намеренно создан в [handoffs](D:/Projects/FG/fg/FG2/handoffs), а не в `.claude/handoffs`

## Current State Summary
Сегодняшняя сессия закрыла первые три sprint-задачи по `FG chart architecture recovery` вокруг `chartData.candles`. Сначала был выполнен реальный architecture trace через `Serena MCP` по backend и frontend путям, затем формализован canonical candles contract, выбран canonical normalization boundary в `ChartContainer`, после чего внесён минимальный reversible patch только в [ChartContainer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js). Duplicate handling было upgraded с `last-write-wins` до canonical `OHLCV merge semantics`. После patch был выполнен реальный browser regression через `Playwright MCP`: `REST run = PASS`, `non-REST run = PASS`. Следующий приоритет уже не в refactor, а в стабилизации test-infra slice через выделенные frontend test ports `3100 / 3101`, и только после этого нужно возвращаться к `useChartData boundary map`.

## Architecture Overview

### Что было сделано сегодня
- `Serena MCP` успешно подключён и реально использован Codex не как “поиск по тексту”, а как navigation/trace инструмент по живым backend и frontend цепочкам.
- `Serena` был валидирован на реальных FG backend/frontend flows и показал практическую пользу для architecture tracing.
- На backend через `Serena` был разобран путь вокруг `getAggregatedCandles`.
- На frontend через `Serena` был разобран chart data flow до renderer split.
- `chartData.candles` был идентифицирован как главный архитектурный объект текущего sprint.

### Что Serena выявил
- Backend tracing вокруг `getAggregatedCandles`:
  - definition: [backend1/services/db.js#L59](D:/Projects/FG/fg/FG2/backend1/services/db.js#L59)
  - HTTP path: [backend1/routes/candlesV2.js#L11](D:/Projects/FG/fg/FG2/backend1/routes/candlesV2.js#L11) -> [backend1/services/candlesV2Service.js#L77](D:/Projects/FG/fg/FG2/backend1/services/candlesV2Service.js#L77) -> [backend1/services/db.js#L59](D:/Projects/FG/fg/FG2/backend1/services/db.js#L59)
  - socket path: [backend1/sockets/candlesSocket.js#L10](D:/Projects/FG/fg/FG2/backend1/sockets/candlesSocket.js#L10) -> [backend1/sockets/candlesSocket.js#L26](D:/Projects/FG/fg/FG2/backend1/sockets/candlesSocket.js#L26) -> [backend1/services/db.js#L59](D:/Projects/FG/fg/FG2/backend1/services/db.js#L59)
- Frontend chart data flow tracing:
  - upstream REST fetch owner: [fingineerwebapp/src/store/useCandles.js#L426](D:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js#L426)
  - handoff boundary: [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L24](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L24)
  - shared storage: [fingineerwebapp/src/components/Results/Chart/ChartContext.js#L29](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js#L29)
  - consumer split: [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L632](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L632), [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L637](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L637), [fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L668](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js#L668)
- До patch не существовало single canonical candle contract:
  - raw REST handoff: [fingineerwebapp/src/store/useCandles.js#L205](D:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js#L205)
  - raw history merge drift: [fingineerwebapp/src/store/useCandles.js#L342](D:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js#L342)
  - local `ChartCanvas` normalization: [fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L140](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js#L140)
  - local `chartUtils` normalization: [fingineerwebapp/src/components/Results/Chart/utils/chartUtils.js#L289](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/utils/chartUtils.js#L289)
  - raw `MultiPaneChart` time usage: [fingineerwebapp/src/charts/MultiPaneChart.jsx#L50](D:/Projects/FG/fg/FG2/fingineerwebapp/src/charts/MultiPaneChart.jsx#L50)
- Consumer split между `ChartCanvas` и `MultiPaneChart` делал contract divergence архитектурно значимым, а не косметическим.
- `useChartData` был выделен как следующий отдельный architecture object и не должен смешиваться с candles contract stabilization:
  - playbook layer: [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L26](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L26)
  - ownership note: [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L45](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L45)

## Work Completed

### Tasks Finished
- [x] Task 1: formalize candles contract
- [x] Task 2: choose canonical normalization boundary
- [x] Task 3: implement minimal normalization patch
- [x] `ChartContainer` normalization patch accepted
- [x] duplicate handling upgraded from `last-write-wins` to `OHLC merge semantics`
- [x] runtime QA completed through `Playwright MCP`
- [x] `REST run = PASS`
- [x] `non-REST run = PASS`

### Files Modified
| File | Changes | Rationale |
|------|---------|-----------|
| [fingineerwebapp/src/components/Results/Chart/ChartContainer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js) | Added local pure helper `normalizeCandlesForChartContext`, applied it at both `ChartContext` write sites, then upgraded duplicate handling to canonical `OHLCV merge` | stabilize one canonical candle contract exactly at chosen handoff boundary |

### Decisions Made
| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| `chartData.candles` treated as main sprint object | analyze renderer bug directly, patch downstream only, formalize contract first | without canonical candle contract every downstream fix stayed ambiguous |
| canonical normalization boundary = `ChartContainer` | `useCandles`, `ChartContainer`, `ChartContext` | `ChartContainer` is last common boundary before `ChartCanvas` / `MultiPaneChart` split |
| patch scope limited to one file | broader cleanup across `ChartCanvas`, `chartUtils`, `ChartContext`, `useCandles` | reversible minimal diff and closed-layer discipline |
| duplicate merge upgraded to `OHLCV` semantics | `last-write-wins`, downstream merge, no merge | canonical candle semantics require `open first`, `high max`, `low min`, `close last`, `volume sum` |
| `useChartData` deferred into separate frontier | immediate deep refactor, mixed sprint | current sprint first restores pipeline predictability before viewport lifecycle cleanup |
| test-port slice promoted ahead of `useChartData` refactor | continue architecture mapping first | current manual/agent browser QA is too slow and fragile without isolated frontends |

## Pending Work

### Immediate Next Steps
1. Patch [fingineerwebapp/package.json](D:/Projects/FG/fg/FG2/fingineerwebapp/package.json) and [fingineerwebapp/playwright.config.js](D:/Projects/FG/fg/FG2/fingineerwebapp/playwright.config.js) for dedicated `3100 / 3101` test frontends.
2. Verify both test frontends can run simultaneously:
   - `3000` stays normal development
   - `3100` becomes dedicated `REST` test frontend
   - `3101` becomes dedicated `non-REST` test frontend
3. Only after test-port slice is stable, return to `useChartData boundary map`.
4. Do not start large `useChartData` refactor before isolated test ports and repeatable Playwright smoke flow exist.

### Blockers/Open Questions
- [ ] Blocker: current browser QA is too slow and operationally fragile because `REST` and `non-REST` compete for `3000` - Needs: dedicated test frontends on `3100` and `3101`.
- [ ] Open question: exact launch commands for dual CRA test frontends on Windows / Playwright `webServer` integration - Suggested: solve this before resuming architecture refactor.
- [ ] Separate issue: `[volume] reset margins failed ... incorrect ID: volume` warning remains outside the accepted candle patch and must not be folded into this sprint slice.

### Deferred Items
- Task 4: build `useChartData boundary map` (deferred until test-port slice is stable)
- Task 5: define smallest safe next step for `useChartData`
- large refactor of `useChartData`
- any broad cleanup of `ChartCanvas`, `MultiPaneChart`, `chartUtils`, `ChartContext`
- persistent Playwright smoke conversion (deferred until dedicated ports exist)

## Important Context
- Current sprint name: `FG chart architecture recovery`.
- Sprint goal: restore chart pipeline predictability through:
  - candles contract formalization
  - normalization boundary stabilization
  - later viewport lifecycle cleanup
- Sprint tasks status:
  - Task 1 completed
  - Task 2 completed
  - Task 3 completed
  - Task 4 pending
  - Task 5 pending
  - Test infra slice pending
- `chartData.candles` is now the canonical architecture object for the closed part of this sprint.
- Accepted canonical contract at handoff boundary:
  - one bar per normalized second
  - `time` = Unix epoch seconds
  - `open/high/low/close/volume` finite numbers
  - invalid OHLC bars dropped
  - `volume` fallback = `0`
  - final ascending sort
  - duplicate merge = `open first`, `high max`, `low min`, `close last`, `volume sum`
- Patch anchors in accepted file:
  - helper start: [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L23](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L23)
  - duplicate merge branch: [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L46](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L46)
  - REST write site: [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L156](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L156)
  - non-REST write site: [fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L167](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js#L167)
- Runtime QA used `Playwright MCP`, not only static reasoning.
- Runtime result summary:
  - `REST run`: PASS
  - `non-REST run`: PASS
  - no warnings from `candles.js`
  - separate `volume` warning remains and is not part of accepted patch
- New sprint extension:
  - `3000` stays for normal development
  - `3100` must become dedicated `REST` test frontend
  - `3101` must become dedicated `non-REST` test frontend
  - later convert current manual/agent-driven browser QA into persistent Playwright smoke tests

## Assumptions Made
- backend endpoints remain at the current local addresses from [fingineerwebapp/.env](D:/Projects/FG/fg/FG2/fingineerwebapp/.env)
- `chartData.candles` stabilization and `useChartData` lifecycle cleanup must stay separated as two different architecture phases
- current accepted patch boundary remains `ChartContainer`, not `useCandles` and not `ChartContext`
- runtime validation remains mandatory after each risky chart change

## Potential Gotchas
- The git worktree is heavily dirty in unrelated areas; do not treat the current session as the only source of file modifications.
- `ChartContainer` patch is accepted; do not reopen this layer casually unless new evidence appears.
- `useChartData` is the next frontier, but must not be mixed with test-port implementation.
- During this session `localhost:3000` was left responding after the final REST run; verify which mode is actually running before the next test session.
- The `handoffs` directory is currently used intentionally for Codex session continuity; do not overwrite older files.

## Environment State

### Tools/Services Used
- `Serena MCP`: connected successfully and used for architecture tracing across backend and frontend code
- `Playwright MCP`: used for actual runtime evidence, screenshots, console capture, and network capture
- `Context7`: used earlier in the session for Playwright config behavior and chart-library truth

### Active Processes
- `http://localhost:3000` responded with `200` at session end
- the last confirmed live browser runtime on `3000` was the dedicated `REST` run used for Playwright validation
- dedicated test ports `3100 / 3101` are not implemented yet

### Environment Variables
- `REACT_APP_FG_AGG_ENABLED`
- `PLAYWRIGHT_BASE_URL`
- `PORT`
- `REACT_APP_API_URL`
- `REACT_APP_SOCKET_URL`
- `REACT_APP_SUGGESTIONS_URL`

## Related Resources
- Architecture map: [docs/domain/FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md)
- Stabilization playbook: [docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md)
- Engine playbook: [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md)
- Previous latest handoff: [handoffs/2026-03-22-224331-fg2-browser-qa-workflow.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-22-224331-fg2-browser-qa-workflow.md)
- Existing Playwright config: [fingineerwebapp/playwright.config.js](D:/Projects/FG/fg/FG2/fingineerwebapp/playwright.config.js)
- Existing e2e specs:
  - [fingineerwebapp/e2e/expanded_drag_no_autoscroll.spec.js](D:/Projects/FG/fg/FG2/fingineerwebapp/e2e/expanded_drag_no_autoscroll.spec.js)
  - [fingineerwebapp/e2e/sparkline-blink.spec.js](D:/Projects/FG/fg/FG2/fingineerwebapp/e2e/sparkline-blink.spec.js)

## Playbook Check
YES.

This session modified FG Chart Engine architecture at the chart input contract boundary and therefore does require a playbook update.

The section that should be updated first:
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44) `## 3. Ownership Model`

Secondary section that should also be updated when documenting the accepted candle contract:
- [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L101](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L101) `## 7. Known Invariants`

Reason:
- `ChartContainer` now acts not only as `sourceAuthority` handoff boundary, but also as the accepted canonical candle normalization boundary before `ChartContext` for the closed part of this sprint.
- handed-off `chartData.candles` now carries an explicit normalized contract that was not previously documented as stable.

What should be reflected in the playbook update:
- In [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L44), record that `ChartContainer` is the accepted candle normalization boundary before `ChartContext`, while upstream producers may differ but must hand off one canonical candles contract at this boundary.
- In [docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L101](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md#L101), record the accepted `chartData.candles` invariants: `time` in Unix epoch seconds, finite `open/high/low/close`, finite `volume` with fallback `0`, invalid OHLC bars dropped, ascending sort by normalized time, and duplicate-time merge using `open first / high max / low min / close last / volume sum`.
- Note explicitly that this closed only the candle-contract layer and does not reopen the separate `useChartData` lifecycle / viewport frontier.

