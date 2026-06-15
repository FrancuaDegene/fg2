# Handoff: FG Chart Engine Expanded Nav Init Fix

## Session Metadata
- Created: 2026-03-08 00:39:12 +03:00
- Project: `d:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Base commit (when captured): `614212a`
- Scope: Expanded chart timeframe/interval switching, owner-nav init stability, chart observability, transition UX smoothing

## Executive Summary
Expanded chart behavior is functionally stable for the primary regression.  
The huge-candle bug (`expanded + navOwner + 1d + 15m`) was fixed by adding a targeted post-`setData` logical-range safety heal in init path, then refining it to same-RAF execution with RAF fallback only when logical range is unreadable.  
A dev-focused debug panel foundation was added and is now the main observability layer.  
Transition veil v1 was added to reduce hard redraw jerk on timeframe/interval changes; result is acceptable in dev but still reads as a fast blink.  
Separate deferred work remains for Expanded TF x interval contract audit.

## 1. Session Outcome Summary
- Diagnosed and fixed expanded `1d + 15m` huge-candle collapse.
- Preserved chart ownership boundaries (no broad ownership rewrite).
- Added debug panel foundation and integrated into `ChartCanvas` as wiring.
- Added transition veil v1 to smooth switch UX.
- Main bug is fixed; residual UX polish and TF x interval contract audit remain.

## 2. What Was Fixed
- Huge-candle bug in expanded owner-nav init path is fixed.
- Root cause: logical-range collapse after `series.setData(sessionSlice)` when owner-nav `1d` init intentionally skipped `setVisibleRange` init write.
- Safety heal added in `useChartData` under `expanded + navOwner + 1d` guard.
- Heal sequencing improved:
  - first attempt in same init RAF immediately after `setData`,
  - fallback RAF only if logical range is unreadable immediately.
- Transition flicker source reduced with visual transition veil.

## 3. Architectural Decisions Made
- Kept existing ownership model:
  - `useChartData`: init-time collapse recovery only.
  - `useFGTimeNavigation`: runtime pan/zoom owner remains unchanged.
  - `ChartCanvas`: visual-layer transitions only.
- Avoided reintroducing broad `visibleRange` ownership in expanded owner-nav mode.
- Preferred small, localized changes and dev observability over refactors.

## 4. Files Changed
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartData.js`
- `fingineerwebapp/src/components/Results/Chart/hooks/useChartDebugPanel.js`
- `fingineerwebapp/src/components/Results/Chart/ChartDebugPanel.jsx`
- `fingineerwebapp/src/components/Results/Chart/ChartCanvas.js`

## 5. Why These Fixes Were Applied In These Files
- `useChartData.js`: exact init-time `setData` boundary where collapse happens; safest place for targeted post-data recovery.
- `useChartDebugPanel.js`: owns debug state/gating/toggle/subscriptions and debug wrappers.
- `ChartDebugPanel.jsx`: pure presentational panel to keep logic isolated.
- `ChartCanvas.js`: integration layer for debug panel and transition veil; no chart ownership logic added.

## 6. What Debug Panel Shows And Why It Matters
Debug panel now exposes:
- `visibleRange`
- `logicalRange`
- `barsVisible`
- `sliceSize`
- `barSpacing`
- `lastWriter`
- `lastEvent`

Why it matters:
- It verifies real writer/order behavior in live runtime.
- It proved collapse conditions and confirmed fix impact.
- It remains the primary architecture observability layer for future chart-engine work.

## 7. What Remains Unresolved
- Transition veil v1 still feels like a fast blink, not yet TradingView-smooth.
- Needs tuning of duration/easing/end-condition polish.
- Multi-pane transition parity has not been addressed yet.

## 8. What Is Intentionally Deferred
- **Deferred Task - TF x Interval Contract Audit** (separate from huge-candle fix).
- Expanded mode TF x interval behavior audit against allowed combinations matrix.
- Policy decisions for expanded-mode out-of-contract combinations:
  - strict gating,
  - or graceful fallback + explicit UX messaging.

## 9. Recommended Next Tasks (In Order)
1. Tune transition veil v1 in `ChartCanvas` to remove blink perception.
2. Add short dev diagnostics for veil start/end reasons to validate settle condition quality.
3. Run Expanded TF x interval contract audit against matrix logic.
4. Decide and implement expanded-mode matrix contract enforcement/fallback UX.
5. Re-verify behavior with data horizons beyond ~1 year.

## 10. Risks / Boundaries
- Do not add new runtime range writers outside current ownership model.
- Do not solve UX with hard remount/reset unless explicitly approved.
- Keep owner-nav `1d` safety heal narrow and init-scoped.
- Keep debug panel dev-only.
- Treat TF x interval contract changes as product policy work, not incidental cleanup.

## 11. Suggested Codex Entry Prompts For Next Session
1. `Use fg-chart-architect. Tune transition veil v1 in ChartCanvas to remove blink while keeping ownership logic unchanged.`
2. `Use fg-chart-architect. Audit Expanded TF x interval behavior against src/utils/chart/timeframes.js matrix with anchors and mismatches.`
3. `Use fg-chart-architect. Propose minimal graceful fallback UX for out-of-contract Expanded TF x interval pairs (no ownership rewrite).`
4. `Use fg-chart-architect. Validate 1y visual invariance against data horizon assumptions and separate expected vs suspicious cases.`

## Deferred Task - TF x Interval Contract Audit
- Symptoms:
  - `1y + 15m / 1h / 4h / 1d` often looks visually unchanged.
  - Debug metrics remain close across those combinations.
- Why not solved here:
  - Session scope was bug fix + init stability + observability + transition layer.
  - No policy-level TF x interval gating changes were approved in this pass.
- Why allowed-combinations matrix matters:
  - It defines safe/meaningful TF x interval contracts and expected data density.
  - It prevents "technically selectable but behaviorally near-identical" combinations.
- Why Expanded freedom may exceed safe data contracts now:
  - Expanded mode currently allows more interval freedom than strict matrix contracts in practice.
  - Current data is mock-generated for roughly one year; many broad combinations naturally compress to similar views.
  - This can mismatch user expectation ("new analytical view") vs actual data/render outcome.

## 12. Verified Evidence From Debug Panel
- Before fix (`1d + 15m`):
  - `barsVisible` ~ `1`
  - `barSpacing` ~ `764` (extremely high)
  - `sliceSize` ~ `57`
  - huge candles visible
- After fix (`1d + 15m`):
  - `barsVisible` ~ `56`
  - `barSpacing` ~ `26.81` (normalized)
  - `sliceSize` ~ `57`
  - huge candles removed
- `1d + 1m` remained healthy after fix.
- `1y + 15m / 1h / 4h / 1d` often remains visually close with similar debug metrics; deferred to TF x interval contract audit.

## Next Session Start Point
Start in `ChartCanvas.js` transition veil block:
- keep current settle conditions (`didInitViewRef`, `virtualRafRef`, `isVirtualizingRef`);
- tune timings/easing/opacity for less blink;
- do not change chart ownership logic in nav/data hooks during this first pass.
