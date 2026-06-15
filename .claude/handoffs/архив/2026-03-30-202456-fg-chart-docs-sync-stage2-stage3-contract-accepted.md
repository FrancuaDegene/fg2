# Handoff: FG Chart Docs Sync After Stage 2 / Stage 3 Closure

## Session Metadata
- Created: 2026-03-30 20:24:56 Europe/Moscow
- Project: D:\Projects\FG\fg\FG2
- Branch: fix/toolbar-range-contrast
- Continues from: `handoffs/2026-03-30-153739-fg-chart-warnings-tail-closed-stage2-slices-accepted.md`
- Session duration: ~1 long chart architecture / QA / docs-sync session

## Текущее состояние

Сессия довела до closure bounded Stage 2 / Stage 3 chart-ownership frontiers, затем синхронизировала stable domain docs. В этой сессии были приняты как closed: `MultiPaneChart` warnings tail, `Stage 2 / Slice 1`, `Stage 2 / Slice 2`, bounded active-path `currentCandleType` ownership transfer, REST-expanded `rangeKey` parity slice и local Stage 3 data-source slices. Дополнительно принят базовый FG contract note по поведению графика при сбоях данных. Stable docs sync завершён в [FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md), [FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md) и [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md). Следующий безопасный ход больше не является local Stage 3 patch: дальше либо broader upstream/sourceAuthority architecture work, либо отдельная реализация уже принятого failure contract как UX/data-state task.

## Codebase Understanding

### Архитектурная картина

- Expanded path идёт через `ChartContainer` как explicit transform/handoff boundary into `ChartContext`.
- Compact path остаётся direct App-owned path и не должен переоткрываться как часть этого closure.
- Accepted bounded active-path `currentCandleType` model now:
  - `ChartContext` = runtime owner on active path
  - `Chart.js` = persistence-only holder above `ChartContainer`
  - `ChartContainer` = seed/remount-only bridge
- This closure applies only to the active path and does not imply full parity across all chart branches.
- Accepted Stage 3 truth now:
  - `rangeKey` parity on REST-expanded handoff is closed
  - `chartMeta` asymmetry is inert on the inspected expanded path
  - REST-expanded error semantics remain `null-error + snapshot-preserving behavior`
  - `ChartContainer` is accepted as transform/handoff boundary, not another local cleanup target
- Accepted chart failure contract now:
  - confirmed selection = то, чему реально соответствует текущий график на экране
  - новый `timeframe` / `interval` становится confirmed only after successful corresponding graph load
  - `initial load failure`, `background refresh failure`, `selection-change failure`, `history-load failure` are now separate accepted behavioral scopes

### Ключевые файлы

| Файл | Назначение | Зачем важно |
|------|---------|-----------|
| [ChartContent.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js) | Active-path `currentCandleType` runtime write + upward persistence notify | Accepted bounded active-path `currentCandleType` slice proof: `setCandleType` + `onCandleTypeChange` at `ChartContent.js:26`, `ChartContent.js:57-64` |
| [ChartContainer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js) | `sourceAuthority`-driven handoff boundary into `ChartContext` | Key Stage 3 anchors: `ChartContainer.js:95`, `ChartContainer.js:146-159`, `ChartContainer.js:165-197`, `ChartContainer.js:226` |
| [useCandles.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js) | REST-expanded producer, `rangeKey`, `loadMoreHistory`, request identity | `rangeKey` parity closure and REST failure semantics: `useCandles.js:156-163`, `useCandles.js:595-601`, `useCandles.js:624` |
| [ChartRenderer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js) | Expanded multi-branch render consumer of `chartData.error` | Error/placeholder consumer proof at `ChartRenderer.js:652`, `ChartRenderer.js:656` |
| [ChartCanvas.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartCanvas.js) | Single-pane render consumer of `chartData.error` | Error/placeholder consumer proof at `ChartCanvas.js:560`, `ChartCanvas.js:565` |
| [FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md) | Stable architecture truth / owners / boundaries | Synced this session with accepted `currentCandleType`, Stage 3 boundary rule, and accepted runtime contract |
| [FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md) | Open/closed frontier ledger | Synced this session with closed slices, accepted failure contract, and Stage 3 pause truth |
| [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md) | Engine/runtime invariants | Synced this session with `currentCandleType` runtime-owner truth and full failure-contract invariants |

### Ключевые выводы

- Close bounded chart slices only from anchors + runtime proof; do not inflate them into broader architecture cleanup.
- After closure, stable docs must become the truth source; do not leave accepted decisions only in chat history.
- `ChartContainer` can still be accepted as transform/handoff boundary even when broader upstream/sourceAuthority architecture remains unresolved.
- Do not reopen a closed local slice just because a broader architecture frontier still exists above it.
- Failure behavior must be modeled around `confirmedSelection` vs `requestedSelection`; do not let stale graph snapshots appear under newly failed labels.

## Work Completed

### Что закрыто

- [x] Closed `MultiPaneChart` warnings tail and carried that closure into stable reasoning state.
- [x] Accepted `Stage 2 / Slice 1` as closed.
- [x] Accepted `Stage 2 / Slice 2` as closed.
- [x] Accepted bounded active-path `currentCandleType` ownership transfer slice:
  - `ChartContext` = runtime owner
  - `Chart.js` = persistence-only holder above `ChartContainer`
  - `ChartContainer` = seed/remount-only bridge
- [x] Accepted REST-expanded `rangeKey` parity slice.
- [x] Classified `chartMeta` asymmetry as inert on current expanded path.
- [x] Proved that explicit REST error-state patch is not patch-ready yet; current REST semantics remain `null-error + snapshot-preserving behavior`.
- [x] Paused Stage 3 after concluding local slices are exhausted.
- [x] Accepted `ChartContainer` as transform/handoff boundary.
- [x] Accepted базовый FG contract note по chart failure behavior.
- [x] Synced the three stable docs.
- [x] Added the missing `selection-change failure` invariant to [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md).

### Изменённые файлы

| Файл | Изменения | Почему |
|------|---------|-----------|
| [ChartContent.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.js) | `currentCandleType` active-path runtime write moved into `ChartContext`; upward persistence notify preserved | Closed bounded active-path runtime-owner transfer slice |
| [ChartContainer.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js) | `currentCandleType` mounted-time live mirror removed; `rangeKey`/REST handoff remained consumer-side; handoff boundary preserved | Accepted seed/remount-only bridge for `currentCandleType`; accepted Stage 3 transform/handoff boundary |
| [useCandles.js](D:/Projects/FG/fg/FG2/fingineerwebapp/src/store/useCandles.js) | explicit `rangeKey` returned; no explicit REST error state added | Closed REST-expanded `rangeKey` parity without broadening error semantics |
| [FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md) | synced accepted ownership truth, Stage 3 boundary rule, accepted runtime contract | Stable architecture map had to match accepted evidence |
| [FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md) | synced closed slices, Stage 3 pause truth, accepted chart failure contract | Playbook had to stop describing already-closed frontiers as open |
| [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md) | synced runtime invariants; added explicit `selection-change failure` invariant | Engine/runtime behavior had to match accepted FG contract |

### Принятые решения

| Решение | Рассмотренные варианты | Почему |
|----------|-------------------|-----------|
| Accept bounded active-path `currentCandleType` slice as closed | keep transitional split open vs accept bounded active-path transfer | Code anchors + runtime QA showed `ChartContext` runtime ownership, `Chart.js` persistence-only role, and no need for further local cleanup |
| Accept REST-expanded `rangeKey` parity slice | keep implicit REST `rangeKey` vs formalize explicit surface | This was the last concrete Stage 3 local mismatch with clean bounded proof |
| Treat `chartMeta` asymmetry as inert | patch `chartMeta` vs classify as non-consumer-impacting | Inspected expanded consumer path did not actively consume it |
| Keep REST error semantics unchanged for now | explicit REST error + stale chart; explicit REST error + clear chart; keep current behavior | No separate UX/product decision existed; current runtime proof only supported `null-error + snapshot-preserving behavior` |
| Pause Stage 3 | keep searching for another local ChartContainer slice vs pause | Remaining residue is broader upstream/sourceAuthority architecture, not another bounded local patch |
| Accept FG failure contract as system rule | silent stale snapshot, hard error everywhere, hybrid contract | Hybrid contract best preserves truthfulness, continuity, and future flexibility |
| For `selection-change failure`, keep previous committed graph and labels | leave new labels under stale graph vs rollback/keep committed selection | Prevents the most dangerous UI lie: old data under new range labels |

## Что остаётся

### Ближайшие следующие шаги

1. If implementation resumes, treat the accepted chart failure contract as a separate UX/data-state task, not as a Stage 3 local cleanup.
2. If chart ownership work resumes, start from broader upstream/sourceAuthority architecture above `ChartContainer`, not from another local `ChartContainer` pass.
3. If any new browser symptom appears, re-anchor against the synced stable docs first before proposing code changes.

### Блокеры и открытые вопросы

- [ ] Open frontier: broader upstream/sourceAuthority architecture remains unresolved above the accepted `ChartContainer` boundary. Needs: a dedicated architecture pass, not a local patch.
- [ ] Open implementation question: where should `confirmedSelection` vs `requestedSelection` semantics live in runtime state when the accepted chart failure contract is eventually implemented? Needs: a separate ownership pass before coding.
- [ ] Open UX/product dependency: explicit user-facing notice behavior for accepted failure scopes still needs implementation-level decisions. Needs: a dedicated implementation task; do not reinterpret the stable contract ad hoc.

### Отложено

- explicit REST error-state patch (deferred because: not patch-ready without separate UX/product decision)
- cross-port parity fix between REST and app/non-REST failure paths (deferred because: like-for-like failure proof was not symmetrical)
- local `ChartContainer` cleanup attempts inside Stage 3 (deferred because: Stage 3 local slices are exhausted)
- broader upstream/sourceAuthority unification (deferred because: this is future architecture work, not a bounded next slice)

## Context for Resuming Agent

### Важный контекст

Следующая сессия должна считать synced stable docs authoritative for this frontier. Do not reopen closed Stage 2 slices, closed REST-expanded `rangeKey` parity, or accepted bounded active-path `currentCandleType` slice without genuinely new evidence. Also do not attempt an explicit REST error-state patch as a local cleanup: that was deliberately left unpatched because accepted REST semantics remain `null-error + snapshot-preserving behavior` until a separate UX/product-backed implementation task is opened. `ChartContainer` is accepted as transform/handoff boundary; future work here starts above it, not by shaving another local effect or prop mirror off it.

### Принятые допущения

- The accepted closure of `Stage 2 / Slice 1`, `Stage 2 / Slice 2`, and bounded active-path `currentCandleType` transfer remains valid unless new runtime evidence disproves it.
- The synced stable docs now reflect the intended current truth and should be used as the restart baseline.
- `ChartContainer` remains allowed to normalize/handoff runtime snapshots, seed runtime store, and mirror accepted selection state, but not to grow into producer selection semantics, request identity ownership, cache/inflight ownership, or failure policy.

### Риски и оговорки

- `chartMeta` asymmetry was classified as inert only on the currently inspected expanded consumer path; do not overgeneralize it into “globally irrelevant”.
- REST failure behavior is intentionally not treated as a ready-to-patch parity bug; reopening it without UX/product framing will drift the session.
- The repo-local `session-handoff` scaffold/validation scripts referenced by the skill were not present in this workspace; this handoff was created manually from the provided template and session evidence.
- On this Windows workspace, `apply_patch` hit a sandbox refresh failure during doc edits; PowerShell exact replacements were used instead for workspace-only doc sync.

## Environment State

### Tools/Services Used

- Serena navigation for anchor/search passes
- PowerShell + `rg` for exact anchor inspection and doc sync
- Playwright MCP for runtime QA on `3100` / `3101`

### Active Processes

- No persistent background process was intentionally left running by this handoff step.

### Environment Variables

- None newly introduced in this session.

## Связанные материалы

- Previous handoff: [2026-03-30-153739-fg-chart-warnings-tail-closed-stage2-slices-accepted.md](D:/Projects/FG/fg/FG2/handoffs/2026-03-30-153739-fg-chart-warnings-tail-closed-stage2-slices-accepted.md)
- Stable docs synced in this session:
  - [FG_CHART_ARCHITECTURE_MAP.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ARCHITECTURE_MAP.md)
  - [FG_CHART_STABILIZATION_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_STABILIZATION_PLAYBOOK.md)
  - [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md)
- Runtime QA artifacts:
  - [3100-currentCandleType-summary.md](D:/Projects/FG/fg/FG2/tmp/qa/reports/3100-currentCandleType-summary.md)
  - [3101-currentCandleType-summary.md](D:/Projects/FG/fg/FG2/tmp/qa/reports/3101-currentCandleType-summary.md)
  - [3100-rangekey-snapshot.md](D:/Projects/FG/fg/FG2/tmp/qa/reports/3100-rangekey-snapshot.md)
  - [3101-rangekey-snapshot.md](D:/Projects/FG/fg/FG2/tmp/qa/reports/3101-rangekey-snapshot.md)
  - [3100-error-failure-snapshot.md](D:/Projects/FG/fg/FG2/tmp/qa/reports/3100-error-failure-snapshot.md)
  - [3101-error-failure-snapshot.md](D:/Projects/FG/fg/FG2/tmp/qa/reports/3101-error-failure-snapshot.md)

## Playbook Reminder

YES. Эта сессия требовала обновления [FG_CHART_ENGINE_PLAYBOOK.md](D:/Projects/FG/fg/FG2/docs/domain/FG_CHART_ENGINE_PLAYBOOK.md), потому что были приняты новые engine/runtime invariants:
- accepted active-path `currentCandleType` ownership truth
- accepted `ChartContainer` transform/handoff boundary rule
- accepted chart failure contract, включая explicit `selection-change failure` invariant


