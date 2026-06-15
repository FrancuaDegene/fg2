# Session Handoff — Phase 9 Indicator Visual Behavior 9.1–9.3

## 1. Status

- Phase 9 remains open.
- `9.1` — completed.
- `9.2` — accepted / closed.
- `9.3` — completed / closed.
- Next: `9.4` — stabilization of `RSI / Volume` as single lower-pane scenarios.
- Patch readiness for `9.4`: no.

## 2. Why this handoff exists

- Previous `2026-04-30` handoff covered only `9.1` and pointed to `9.2`.
- After that, `9.2` and `9.3` were completed.
- This file updates the continuity chain without rewriting the old historical handoff.

## 3. 9.1 closure summary

- Indicator menu has four current indicators: `MA`, `EMA`, `RSI`, `Volume`.
- State owner remains `ChartContext.activeIndicators`.
- `MA` / `EMA` are overlay indicators.
- `RSI` / `Volume` are lower-pane indicators under current limited path.
- `RSI` and `Volume` are mutually exclusive lower-pane indicators.
- `9.1` runtime evidence was completed on `3100` and `3101`.
- `9.1` found the decision point for mixed scenarios: `MA/EMA + RSI/Volume` did not yet provide target UX `overlay + lower-pane`.

## 4. 9.2 accepted visual contract

Main formula:

`price + optional MA + optional EMA + max one lower pane`

Allowed first-pass combinations:

- `MA`
- `EMA`
- `MA + EMA`
- `RSI`
- `Volume`
- `MA + RSI`
- `EMA + RSI`
- `MA + Volume`
- `EMA + Volume`
- `MA + EMA + RSI`
- `MA + EMA + Volume`

Deferred:

- `RSI + Volume`
- `MA + EMA + RSI + Volume`
- multiple lower-pane indicators
- new indicators
- broad `MultiPaneChart` redesign

Important invariant:

When indicators are enabled, the price chart must not become a different chart.

Allowed visual changes:

- `MA/EMA`: only overlay lines on price pane.
- `RSI/Volume`: one lower pane may appear and price pane height may shrink.

`9.2` does not reopen:

- `Phase 8`
- indicator state owner
- data owner
- timeframe / interval owner
- `compact`
- broad `MultiPaneChart` redesign

## 5. 9.2 problem and decision

Problem:

- Mixed visible sets were technically possible but did not give honest UX `overlay + one lower-pane`.
- Without `9.2`, implementation would risk random routing/gate patches.

Decision:

- Fix the product visual contract first.
- Only then patch specific implementation slices.

## 6. 9.3 closure summary

- Goal: stabilize `MA / EMA` overlays.
- Status: completed / closed.
- `MA` appears/disappears.
- `EMA` appears/disappears.
- `MA + EMA` work together.
- Turning `MA` off leaves `EMA`.
- Turning `EMA` off leaves candles visible.
- No lower pane appears for `MA/EMA`.
- Console errors: `0` in runtime QA.

## 7. 9.3 problem found

- With `MA + EMA` enabled, changing ticker `SBER -> GAZP` left `MA/EMA` overlay lines visually stale around old `SBER` price area.
- `GAZP` candles moved to the new price area, but overlay lines did not follow.
- Changing interval `15m -> 1h` realigned `MA/EMA` lines.

Root cause:

- `MA/EMA` cache key in `useChartIndicators.js` did not distinguish the concrete candle dataset.
- Key included `id`, `params`, `len`, `currentCandleType`, `currentInterval`, `currentTimeframe`.
- Key did not include ticker, symbol, first candle time, last candle time, first close, last close, or candle-data identity.

## 8. 9.3 fix

One-file patch:

`fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js`

Solution:

- Add candle-data `sourceIdentity` to the cache key only for `MA / EMA`.

`sourceIdentity` includes:

- first candle time
- last candle time
- first close
- last close

Not changed:

- `RSI`
- `Volume`
- `MultiPaneChart`
- `ChartRenderer`
- `ChartContext`

Important narrowing:

`sourceIdentity` is conditionally included in the key only for `MA / EMA`, not as `sourceIdentity: null` for `RSI`.

## 9. 9.3 runtime evidence

- Environment: `[3000]`, `http://127.0.0.1:3000`
- Tickers: `SBER -> GAZP`
- Interval / period: `15m / 3mth`, then `1h / 3mth`
- Console errors: `0`
- Main scenario: `SBER` Expanded, `MA + EMA` enabled, then ticker changed to `GAZP`.
- Expected: candles and `MA/EMA` move to `GAZP` price area; old `SBER` lines do not remain.
- Observed: `GAZP` loaded, price area became `150.x`, `MA/EMA` markers moved into `GAZP` area, old `SBER` band was not observed.
- Verdict: `FIX CONFIRMED`
- Visual stability: `STABLE`
- Recommendation: `READY TO CLOSE 9.3`

## 10. Codex budget observation

- Playwright MCP run on `gpt-5.5` medium cost approximately:
- `5h` limit: `90% -> 71%`, delta `-19` points.
- weekly limit: `53% -> 48%`, delta `-5` points.
- Lesson: Playwright MCP is expensive and should be used only after code anchor and only with listed scenarios.
- Future comparison: test `gpt-5.4` medium on a future required Playwright run, not as a separate wasteful run.

## 11. Current next step

Next safe step:

`9.4` — `RSI / Volume` as single lower-pane scenarios.

`9.4` must not start with patch.

`9.4` should start with read-only anchor and/or bounded runtime evidence for:

- `RSI` only
- `Volume` only
- `RSI -> Volume`
- `Volume -> RSI`
- no stale pane
- no empty lower block
- no console errors
- price chart remains readable

## 12. Do not reopen

- `Phase 8.1–8.5`
- `9.2` visual contract
- `MA/EMA` cache-key fix unless new evidence appears
- multiple lower panes
- `RSI + Volume` as first-pass target
- new indicators
- broad `MultiPaneChart` redesign
- `compact` parity

## 13. Files changed in this closure chain

- `docs/project/sprint/FG_phase_9_indicator_visual_behavior_plan.md`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartIndicators.js`
- `.claude/handoffs/2026-05-03-phase-9-1-9-3-indicator-visual-behavior-handoff.md`

## 14. Final stop-point

`9.1 completed. 9.2 accepted / closed. 9.3 completed / closed. Phase 9 remains open. Next: 9.4 RSI / Volume single lower-pane stabilization. Patch readiness: no.`
