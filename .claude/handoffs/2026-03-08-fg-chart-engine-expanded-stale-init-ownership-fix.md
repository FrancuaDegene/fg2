# Handoff: FG Chart Engine Expanded Stale Init Ownership Fix

## Session Metadata
- Created: 2026-03-08 18:25:00 +03:00
- Project: `d:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Base commit (when captured): `614212a`
- Session duration: ~4h
- Scope: Expanded chart only; allowed TF x interval matrix as contract; stale-data init ownership in `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`

### Recent Commits (for context)
  - 614212a feat(ai): add fg-chart-architect skill
  - 79797f0 feat(chart): introduce FG time navigation and viewport diagnostics
  - c11da10 fix(toolbar): restore compact range dropdown one-piece + layout
  - bb2be90 fix(toolbar): restore glass tokens for compact range dropdown
  - 5439735 chore: checkpoint before recovery

## Handoff Chain

- Continues from: [2026-03-08-fg-chart-engine-expanded-nav-init-fix.md](./2026-03-08-fg-chart-engine-expanded-nav-init-fix.md)
  - Previous title: FG Chart Engine Expanded Nav Init Fix
- Supersedes: None

> Read the previous handoff for full context on the `1d + 15m` init-collapse fix, the debug panel, and existing ownership boundaries.

## Current State Summary

This session did not continue transition-veil work. The primary "blink + no candles" bug did not reproduce in the minimal allowed-pair matrix, but a secondary Expanded viewport anomaly did reproduce on `1d+1h -> 1y+1h`. Investigation proved the upstream full `1y+1h` dataset is healthy (`311` bars across ~`361` days), so the problem was not data horizon. The confirmed root cause was stale-data init ownership in `useChartData`: after the selection switch, `didInitViewRef.current` resets to `false`, but the first init pass still receives stale `preparedData` from the previous selection, writes `setVisibleRange(...)`, and flips `didInitViewRef.current = true`. When the fresh `1y+1h` payload arrives, init ownership is already closed, so the narrow viewport persists. A one-file fix was applied in `useChartData.js` to defer init ownership on that stale pass for Expanded non-`1d` mode. Live verification passed for `S4` and preserved control `S5`.

## Codebase Understanding

## Architecture Overview

- `FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js` is wiring only. It passes `effectiveTimeframe || currentTimeframe`, `currentInterval`, `preparedData`, and refs into `useChartData`.
- `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js` owns init-time dataset application and init viewport writes.
- `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useFGTimeNavigation.js` owns runtime pan/zoom behavior and must not be used as a fallback owner for init bugs.
- The Expanded chart relies on a strict owner split:
  - init data + init range in `useChartData`
  - runtime navigation in `useFGTimeNavigation`
- The allowed Expanded TF x interval matrix remains the contract; arbitrary unsupported combinations were intentionally excluded from this session.

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js` | Init-time data ingest, preset slice selection, init range ownership, virtualization | Root cause and fix live here |
| `FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js` | Wires `preparedData` and selection state into hooks; exposes `window.__CANDLES__` debug globals | Used to prove full dataset was healthy before init viewport write |
| `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartDebugPanel.js` | Dev-only panel for `visibleRange`, `logicalRange`, `barsVisible`, `sliceSize`, `lastWriter`, `lastEvent` | Used to classify S4 and S5 at runtime |
| `FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md` | Stable chart-engine architecture and ownership playbook | Used as source of truth for owner boundaries |
| `FG2/fingineerwebapp/test-results/expanded-matrix-runtime/results.json` | Saved runtime evidence for the five-scenario minimal matrix | Confirms primary blank-render bug did not reproduce in that matrix |

## Key Patterns Discovered

- A selection change can reach `useChartData` before `preparedData` changes. In current React flow, selection state changes first and fresh payload lands later.
- `useChartData` init ownership is gated only by `didInitViewRef.current`. If that flips on a stale pass, the fresh payload loses init ownership.
- The first bad `S4` init was not caused by wrong `fromIdx/toIdx` math against a healthy full dataset. It happened because `fullDataRef.current` was rebuilt from stale `preparedData` on the first post-switch pass.
- The safe fix is narrow: defer the stale init pass instead of broadening viewport heuristics.

## Work Completed

## Tasks Finished

- [x] Resumed the prior FG chart-engine session from the latest repo handoff.
- [x] Clarified investigation scope: Expanded only, allowed matrix only, bottom axis secondary.
- [x] Extracted anchor snippets for contract, switch handoff, init data path, init range gate, runtime nav writers, debug panel, and playbook guardrails.
- [x] Designed and executed the minimal five-scenario matrix:
  - `S1: 1d+1m -> 1d+5m`
  - `S2: 1d+1m -> 1d+15m`
  - `S3: 1y+1d -> 1d+15m`
  - `S4: 1d+1h -> 1y+1h`
  - `S5: 1y+1h -> 1d+1h`
- [x] Verified that the primary "blink + no candles" bug did not reproduce in that matrix.
- [x] Isolated the secondary `S4` anomaly as the active problem.
- [x] Proved upstream full data for `1y+1h` is healthy:
  - `311` bars
  - `earliestFullSec = 1672606800`
  - `latestFullSec = 1703797200`
  - `span = 31,190,400 sec = 361.0 days`
- [x] Confirmed collapse happens between full-data ingestion and final init viewport write.
- [x] Rejected the heuristic non-`1d` span-expansion approach after live testing showed it did not fix `S4`.
- [x] Applied a one-file stale-data init-ownership fix in `useChartData.js`.
- [x] Re-verified:
  - `S4` now lands on full-year viewport
  - `S5` remains on guarded `1d` behavior

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js` | Added stale-pass detection via `lastPreparedDataRef` + `lastSelectionKeyRef`; deferred Expanded non-`1d` stale init write and `didInitViewRef` flip; removed prior experimental non-`1d` span-expansion block | Fixes confirmed root cause with a minimal one-file ownership gate |
| `FG2/handoffs/2026-03-08-fg-chart-engine-expanded-stale-init-ownership-fix.md` | New session handoff | Preserve exact root cause, fix, and verification context for next agent |

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Keep scope on Expanded allowed-pair investigation | Expand to unsupported pairs, compact chart, or transition veil | User explicitly excluded those areas |
| Treat full-data horizon as a separate question from viewport ownership | Assume viewport issue was just a range-write bug | Needed to prove whether upstream data was already narrow |
| Reject heuristic non-`1d` init-span expansion as final fix | Keep span-expansion block, add clamps, or revert | Live `S4` showed no improvement; it addressed the symptom, not the owner bug |
| Fix stale init ownership inside `useChartData` | Modify `ChartCanvas`, change `useFGTimeNavigation`, broaden `1d` guards | Root cause and owner both live in init gate; other layers would violate architecture boundaries |
| Use selection-change + stable `preparedData` reference as stale-pass signal | Add broad timing delays, extra remounts, or multi-file request state plumbing | Minimal one-file diff that fits current data flow and preserves ownership model |

## Pending Work

## Immediate Next Steps

1. Re-run a slightly broader Expanded regression set around non-`1d` transitions to confirm the stale-pass gate does not break other preset timeframe switches.
2. Decide whether to keep the dev-only `[FG][INIT_RANGE][deferStaleSelectionPass]` log or reduce it once confidence is high.
3. If the user resumes the original primary blank-render investigation, gather new repro paths outside the minimal matrix because the first matrix did not reproduce it.
4. Commit or refine the one-file fix only after user confirmation.

## Blockers/Open Questions

- [ ] Primary bug status: "blink + no candles" did not reproduce in the minimal matrix. A broader repro set may still be needed if the user has additional failing paths or symbols.
- [ ] Assumption dependency: the stale-pass guard assumes fresh payloads change `preparedData` reference. If upstream starts mutating arrays in place, this guard may stop detecting stale passes.
- [ ] Logging question: dev-only defer log is useful during validation, but may be noisy if left permanently.

## Deferred Items

- Transition veil polish in `ChartCanvas` (deferred because user explicitly paused it)
- Product-policy TF x interval redesign (deferred because out of scope)
- Compact chart investigation (deferred because out of scope)
- Any changes to `useFGTimeNavigation` runtime ownership (deferred because not the confirmed owner here)

## Context for Resuming Agent

## Important Context

- The current code fix is already applied in the working tree at `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js:93-94`, `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js:139-144`, and `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js:539-637`.
- Key anchors:
  - selection-change stale-pass detection: `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js:139-144`
  - full ingest and preset slice selection: `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js:209-341`
  - stale-init defer gate before `setVisibleRange`: `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js:539-637`
- The crucial runtime sequence for `S4` before the fix was:
  1. switch from `1d+1h` to `1y+1h`
  2. `didInitViewRef.current` reset to `false`
  3. first init pass reused stale `preparedData` from prior selection
  4. stale pass wrote narrow `setVisibleRange(...)`
  5. stale pass flipped `didInitViewRef.current = true`
  6. fresh `1y+1h` payload arrived later, but init ownership was already closed
- After the fix, live `S4` verification showed:
  - panel `timeframe=1y`
  - panel `interval=1h`
  - `visibleRange = 1672606800..1703797200`
  - `logicalRange = 0..310`
  - `barsVisible = 310`
  - `barSpacing = 3.37`
  - `sliceSize = 311`
  - console log `[FG][INIT_RANGE][deferStaleSelectionPass] ... preparedLen: 39`
- Control `S5` remained healthy and unchanged:
  - `timeframe=1d`
  - `interval=1h`
  - `expectedInitRangeSkip=true`
  - `lastWriter=timeScale.setVisibleLogicalRange`

## Assumptions Made

- Assumption 1: `preparedData` gets a new array reference when fresh chart data arrives. This held in the current runtime because `ChartCanvas` recalculates it from `chartData?.candles`.
- Assumption 2: Expanded non-`1d` init should defer only when the selection changed but `preparedData` did not.
- Assumption 3: The user still wants strict one-file locality for this fix and does not want adjacent cleanup.

## Potential Gotchas

- The repo worktree is dirty with many unrelated changes. Do not revert unrelated files.
- `window.__RAW__.rangeKey` was stale during runtime checks and was not reliable as source-of-truth for horizon diagnosis.
- Earlier runtime console logs can look contradictory because they mix stale-pass and fresh-pass entries in the same switch sequence.
- The previous experimental non-`1d` span-expansion block has been removed from `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js` in favor of the stale-pass gate.
- If future debugging uses a different symbol or different backend data behavior, re-check whether the same stale-pass pattern still occurs before assuming the same fix applies.

## Environment State

## Tools/Services Used

- Local frontend app reachable at `http://localhost:3000`
- Local chart/backend endpoints were reachable during verification
- Headless verification used Playwright with system Edge
- Debug panel was enabled via dev env and toggled with `Alt+D`

## Active Processes

- Existing local dev servers were already running during this session; the frontend and chart data flow were available without starting new processes.

## Environment Variables

- `REACT_APP_FG_NAV_OWNER`
- `REACT_APP_FG_DEBUG_PANEL`
- `REACT_APP_SOCKET_URL`
- `REACT_APP_API_URL`

## Related Resources

- `FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
- `FG2/handoffs/2026-03-08-fg-chart-engine-expanded-nav-init-fix.md`
- `FG2/fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `FG2/fingineerwebapp/test-results/expanded-matrix-runtime/results.json`

## Playbook Check

Does this session require updating `FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`?

NO.

Reason: this session introduced a localized bug fix inside the existing init owner (`useChartData`) and did not change architecture layers, ownership boundaries, observability contracts, safety mechanism categories, or debugging workflow structure.
