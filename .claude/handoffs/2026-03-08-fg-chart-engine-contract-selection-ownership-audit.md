# Handoff: FG Chart Engine Contract And Selection Ownership Audit

## Session Metadata
- Created: 2026-03-08 23:41:07 +03:00
- Project: `d:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Base commit (when captured): `614212a`
- Session duration: ~2h
- Scope: FG chart architecture audit only, focused on TF x interval contract, selection ownership, and active vs legacy chart paths

### Recent Commits (for context)
  - 614212a feat(ai): add fg-chart-architect skill
  - 79797f0 feat(chart): introduce FG time navigation and viewport diagnostics
  - c11da10 fix(toolbar): restore compact range dropdown one-piece + layout
  - bb2be90 fix(toolbar): restore glass tokens for compact range dropdown
  - 5439735 chore: checkpoint before recovery

## Handoff Chain

- Continues from: [2026-03-08-fg-chart-engine-expanded-stale-init-ownership-fix.md](./2026-03-08-fg-chart-engine-expanded-stale-init-ownership-fix.md)
  - Previous title: FG Chart Engine Expanded Stale Init Ownership Fix
- Supersedes: None

> Read the previous handoff first for the confirmed `useChartData` stale-init fix and the verified `S4/S5` runtime evidence. This handoff adds the contract/UI alignment state and the selection ownership audit on top of that.

## Current State Summary

This session did not patch chart rendering, navigation, or indicator logic. The work was architectural analysis plus one small UI-alignment change already present in the working tree: the main Expanded interval dropdown now reads the canonical TF x interval contract from `fingineerwebapp/src/constants/index.js`, keeps all interval options visible, and disables invalid ones instead of allowing silent fake selection. The bigger result of the session is an ownership map: `App` is the real outer owner for `timeframe`, `interval`, and `isChartExpanded`; `ChartContainer` mirrors those values into `ChartContext`; `ChartContext` still re-applies guard logic for `timeframe` and `interval`; and `currentCandleType` is split between `Chart.js` local state and `ChartContext`, with the active toolbar writing only to context. The next architecture step is not another bug fix. It is choosing and stabilizing canonical ownership for the selection layer before more feature work lands.

## Codebase Understanding

## Architecture Overview

- Active TF x interval contract for the live chart is in `fingineerwebapp/src/constants/index.js`.
- The main Expanded toolbar now reads that active contract directly and disables invalid intervals in the UI.
- Runtime guards still remain in:
  - `fingineerwebapp/src/App.js`
  - `fingineerwebapp/src/components/Results/Chart/ChartContext.js`
- A legacy matrix still exists in `fingineerwebapp/src/utils/chart/timeframes.js` and is still consumed indirectly by the old `ExpandedControls -> IntervalSelector` path.
- Selection state is layered like this in the active chart:
  1. `App` owns outer selection state
  2. `ChartContainer` mirrors it into `ChartContext`
  3. `ChartContext` exposes chart-facing state to `ChartContent`, `ChartRenderer`, and `ChartCanvas`
- The candle-type path is structurally different from timeframe/interval:
  - `Chart.js` still holds a local `candleType`
  - `ChartContent` ignores the forwarded outer candle callback and writes directly to `ChartContext`
  - this makes candle type the least stable selection owner today

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `FG2/fingineerwebapp/src/constants/index.js` | Active canonical TF x interval matrix and guard helper | Current source of truth for live chart contract |
| `FG2/fingineerwebapp/src/components/Results/Chart/ChartToolbar.js` | Main live chart toolbar | Expanded interval dropdown now disables invalid pairs using the canonical contract |
| `FG2/fingineerwebapp/src/App.js` | Outer chart selection owner and top-level runtime guard | Real source owner for `timeframe`, `interval`, `isChartExpanded` |
| `FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js` | Bridge from outer props into chart context | Mirrors outer selection into `ChartContext` and feeds chart data |
| `FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js` | Inner chart state store | Duplicates guard logic for `timeframe` and `interval`; owns active indicator state |
| `FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js` | Connects context state to renderer and toolbar callbacks | Writes candle type directly into context |
| `FG2/fingineerwebapp/src/components/Results/Chart/Chart.js` | Outer chart wrapper | Still owns local `candleType`, which is now contested |
| `FG2/fingineerwebapp/src/utils/chart/timeframes.js` | Legacy contract + countBack helpers | Still contains mismatched TF x interval matrix |
| `FG2/fingineerwebapp/src/components/ExpandedControls/ExpandedControls.js` | Legacy Expanded selector surface | Keeps legacy contract path reachable |

## Key Patterns Discovered

- The active chart already has a canonical contract module, but the repo still contains a second live contract definition.
- The main Expanded toolbar and runtime guards were previously disagreeing at the UX layer: invalid intervals looked selectable but were rewritten silently. The toolbar now exposes the contract visually.
- `ChartContext` is currently a mirror for outer selection values, but not a passive one. It still applies its own interval/timeframe guard logic.
- `effectiveTimeframe` in `ChartContext` is currently only an alias for `currentTimeframe`, not an independent owner.
- The selection layer is not uniformly shaped:
  - `timeframe`, `interval`, `isExpanded` are `App -> ChartContainer -> ChartContext`
  - `currentCandleType` is `Chart.js local state -> ChartContainer prop`, but active toolbar writes directly to `ChartContext`

## Work Completed

## Tasks Finished

- [x] Confirmed the live canonical TF x interval contract file and separated it from the legacy matrix.
- [x] Extracted all active and legacy contract consumers and enforcement points.
- [x] Confirmed the main Expanded toolbar previously rendered all intervals and relied on runtime guard rewrites.
- [x] Applied a minimal two-file UI-alignment change so the main Expanded interval dropdown disables invalid intervals based on the canonical contract.
- [x] Built a chart-system architecture map across contract, state, data, init/render, navigation, indicator, observability, and legacy layers.
- [x] Completed a focused selection ownership audit for `App` vs `ChartContext` for:
  - `timeframe`
  - `interval`
  - `isExpanded`
  - `currentCandleType`
- [x] Confirmed that `currentCandleType` is the least stable selection field because it is split between `Chart.js` and `ChartContext`.

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `FG2/fingineerwebapp/src/constants/index.js` | Added `getAllowedIntervalsForTimeframe({ timeframe, mode })` and reused it inside `fixIntervalForTimeframe(...)` | Keep canonical contract reads and runtime guard rewrites on one helper |
| `FG2/fingineerwebapp/src/components/Results/Chart/ChartToolbar.js` | Main Expanded interval dropdown now reads canonical allowed intervals, keeps all items visible, disables invalid ones, blocks invalid clicks, and marks them visually | Align UI with existing runtime contract without touching chart engine layers |
| `FG2/handoffs/2026-03-08-fg-chart-engine-contract-selection-ownership-audit.md` | New session handoff | Preserve architecture audit, ownership findings, and current next-step boundary |

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Treat `src/constants/index.js` as the active contract source | Use legacy `timeframes.js`, merge both immediately, or keep both undefined | The live chart already depends on `index.js`; analysis confirmed it is the current canonical path |
| Align the main Expanded toolbar to the active contract without removing runtime guards | Keep silent runtime rewrite only, or refactor all selector paths now | Minimal diff that improves UX without destabilizing chart behavior |
| Do not patch legacy selector paths in this session | Clean up `ExpandedControls`, `IntervalSelector`, and legacy matrix now | User explicitly scoped this task away from legacy-path cleanup |
| Treat `App` as current canonical owner for `timeframe`, `interval`, `isExpanded` | Promote `ChartContext` to sole owner immediately | Current active flow already originates in `App`; forcing a new owner now would be refactor, not audit |
| Flag `currentCandleType` as contested rather than pretending it is context-owned | Ignore `Chart.js` local state because active toolbar currently bypasses it | The outer local state still exists and is still forwarded into `ChartContainer`, so ownership is objectively split |

## Pending Work

## Immediate Next Steps

1. Decide the canonical selection ownership model before any additional chart switching work:
   - `App` stays canonical and `ChartContext` becomes a passive mirror
   - or `ChartContext` becomes canonical and outer selection props are reduced to adapters
2. Stabilize candle-type ownership first, because it is currently the least coherent selection field.
3. After owner choice is explicit, remove duplicate guard/rewrite behavior from the non-canonical layer.
4. Then unify TF x interval contract usage across legacy selector paths so the repo has one true contract source.

## Blockers/Open Questions

- [ ] Ownership choice not yet made: should `App` remain the single source for `timeframe`, `interval`, `isExpanded`, or should chart selection be fully pulled into `ChartContext`?
- [ ] Candle-type owner unresolved: should `currentCandleType` live in `Chart.js`, `ChartContext`, or at a higher shared owner?
- [ ] Legacy path status unresolved: `ExpandedControls -> IntervalSelector -> src/lib/timeframes.js -> src/utils/chart/timeframes.js` still exists and can diverge from the live toolbar contract.
- [ ] Validation tooling unavailable in this shell: `python`/`py` is not installed, so the session-handoff validation script could not be run locally.

## Deferred Items

- Legacy matrix removal or bypass (deferred because out of scope for this session)
- Contract unification refactor (deferred pending ownership decision)
- Any changes to `ChartCanvas`, `useChartData`, `useFGTimeNavigation`, or indicator rendering (deferred because this session was architecture analysis, not engine patching)
- Compact chart selector alignment (deferred because current task focused on main Expanded chart)

## Context for Resuming Agent

## Important Context

- The previous handoff still matters. It contains the confirmed Expanded stale-init owner fix in `useChartData.js`. Do not lose that context when reading this handoff.
- Relevant current chart-selection ownership facts:
  - `App` owns `timeframe`, `interval`, `isChartExpanded`
  - `ChartContainer` mirrors them into `ChartContext`
  - `ChartContext` still re-runs guard logic for `timeframe` and `interval`
  - `ChartContent` writes candle type directly to `ChartContext`
  - `Chart.js` still holds local `candleType` and forwards it as `currentCandleType`
- The active toolbar path now behaves better than the legacy one:
  - main Expanded dropdown disables invalid intervals using the active canonical matrix
  - legacy `ExpandedControls -> IntervalSelector` still relies on rewrite-on-click via the legacy matrix
- The selection ownership audit outcome was:
  - `timeframe`: contested
  - `interval`: contested
  - `isExpanded`: duplicated but mostly clean
  - `currentCandleType`: split-brain / contested
- Exact anchors used in the audit:
  - `FG2/fingineerwebapp/src/App.js:42-45,85-113`
  - `FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js:70-92,157-180`
  - `FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js:215-265`
  - `FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js:17-26,56-78`
  - `FG2/fingineerwebapp/src/components/Results/Chart/Chart.js:45,69-71,215-227`

## Assumptions Made

- Assumption 1: the live chart path of interest is the `App -> ChartContainer -> ChartContext -> ChartContent -> ChartRenderer -> ChartCanvas` path, not the old selector surface.
- Assumption 2: runtime guards in `App.js` and `ChartContext.js` are still intentionally retained as safety nets until ownership is stabilized.
- Assumption 3: the next session should continue architecture stabilization, not start another rendering fix first.

## Potential Gotchas

- The repo worktree is dirty with many unrelated changes and deletions. Do not treat `git status` as session-specific without filtering.
- `handoffs/` is currently untracked in the worktree snapshot even though handoffs are being used as active context files.
- The legacy matrix in `fingineerwebapp/src/utils/chart/timeframes.js` does more than contract guarding; `useCandles.js` still depends on countBack helpers from that file.
- `ChartContent` forwarding shape is misleading:
  - `ChartContainer` passes `onCandleTypeChange`
  - `ChartContent` does not consume that prop
  - active toolbar writes to context instead
- `effectiveTimeframe` looks like a separate concept in `ChartContext`, but right now it only returns `state.currentTimeframe`.

## Environment State

## Tools/Services Used

- Local shell analysis only for this handoff
- Existing local frontend/chart environment was previously used in the same day for runtime verification, but no new runtime repro was needed for this ownership audit

## Active Processes

- No new processes were started in this handoff-creation step

## Environment Variables

- `REACT_APP_FG_NAV_OWNER`
- `REACT_APP_FG_DEBUG_PANEL`
- `REACT_APP_FG_AGG_ENABLED`

## Related Resources

- `FG2/handoffs/2026-03-08-fg-chart-engine-expanded-stale-init-ownership-fix.md`
- `FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
- `FG2/fingineerwebapp/src/constants/index.js`
- `FG2/fingineerwebapp/src/components/Results/Chart/ChartToolbar.js`
- `FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js`
- `FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js`
- `FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js`
- `FG2/fingineerwebapp/src/components/Results/Chart/Chart.js`
- `FG2/fingineerwebapp/src/utils/chart/timeframes.js`

## Validation Check

- Validation script status: not run
- Reason: `python` / `py` is not available in this shell environment, so `.agents/skills/session-handoff/scripts/validate_handoff.py` could not be executed
- Manual completeness check: completed
  - no template placeholders remain
  - required sections are present
  - referenced repo files exist
  - no secrets were intentionally recorded

## Playbook Check

Does this session modify FG Chart Engine architecture and require updating `FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`?

NO.

Reason: this session primarily documented and clarified existing ownership and contract boundaries. The only code change in scope was a localized UI-alignment tweak in the main Expanded toolbar plus a canonical read helper in the existing contract module. No chart-engine lifecycle ownership, navigation policy, observability mechanism, or safety mechanism category changed.
