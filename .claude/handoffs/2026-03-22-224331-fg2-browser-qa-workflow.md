# Handoff: FG2 browser QA workflow and validation discipline

## Session Metadata
- Created: 2026-03-22 22:43:31
- Project: `d:\Projects\FG\fg\FG2`
- Branch: `fix/toolbar-range-contrast`
- Session duration: several focused QA and validation iterations
- Handoff location note: the intended project-level handoff storage is D:\Projects\FG\fg\FG2\handoffs; the current skill default path is .claude/handoffs/, so the project-specific storage path must be respected explicitly.

## Current State Summary

This session established a stable and usable browser-QA workflow for `FG2`. The main outcome is a clear split between autonomous runtime validation through `Codex + Playwright MCP` and manual breakpoint/debug work through `VS Code integrated browser`. The session also confirmed that runtime validation is now part of the definition of done for UI work, that product constraints must not be mislabeled as bugs without domain evidence, and that partial matrix knowledge must not be documented as a full contract. A repository-oriented QA structure now exists, and `docs/qa/playwright/README.md` was created as the current source of truth for that structure.

## Architecture Overview

`FG2` now has two distinct browser validation paths that serve different purposes. `Codex + Playwright MCP` is the autonomous path for repeatable runtime browser checks, evidence collection, screenshots, `console`, and `network`. `VS Code integrated browser` is the manual path for breakpoint-driven debugging inside the editor. Validation must match the task layer: runtime claims require runtime evidence, while editor debugging is for manual trace and inspection. For chart work, the browser-QA path is now strong enough to validate search, compact-to-expanded transition, chart type changes, hover, resize survival, and constraint behavior when a timeframe disables an interval.

## Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `AGENTS.md` | Repository operating model | Defines ownership-first reasoning and chart-session rules |
| `CODEX_RULES.md` | Session and execution guidance | Complements repository behavior and validation expectations |
| `.vscode/settings.json` | Workspace browser/debug behavior | Session context says it was part of the stable integrated-browser setup |
| `.vscode/launch.json` | Manual debug launch targets | Defines the `editor-browser` launch and attach flow for `http://localhost:3000` |
| `.github/skills/fg-frontend-debug/SKILL.md` | Narrow chart-debug guidance | Was verified as part of the FG2 VS Code setup |
| `docs/qa/playwright/README.md` | QA structure source of truth | Documents the new permanent QA layout and execution rules |
| `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md` | Chart engine playbook | Relevant for deciding whether this session changed chart-engine workflow enough to update the playbook |

## Key Patterns Discovered

- Runtime validation is not optional for UI claims; reasoning alone is not enough.
- Browser QA and manual breakpoint debugging are complementary, not interchangeable.
- Product constraints can surface as disabled UI options and must not be labeled as bugs without domain evidence.
- A partial runtime sample is enough to validate a constraint example, but not enough to document a full timeframe × interval matrix.
- QA assets should be split between permanent repository documents and temporary runtime artifacts.

## Work Completed

## Tasks Finished

- [x] Strengthened session-level validation guidance so that browser QA and definition-of-done expectations are explicit
- [x] Established two distinct browser workflows: `Codex + Playwright MCP` for autonomous runtime QA and `VS Code integrated browser` for manual breakpoint/debug work
- [x] Verified the FG2 VS Code setup around `.vscode/settings.json`, `.vscode/launch.json`, and `.github/skills/fg-frontend-debug/SKILL.md`
- [x] Captured and resolved the integrated-browser stability issue tied to `workbench.browser.enableChatTools`
- [x] Proved autonomous browser access through `Playwright MCP` with navigate, snapshot, `console`, `network`, type, click, screenshot, and evidence collection
- [x] Ran successful browser-driven chart checks for `SBER`, compact chart, expanded chart, timeframe switch, valid interval switch, chart type switch, hover, resize survival, and screenshot verification
- [x] Identified a valid product/runtime constraint: timeframe and interval are not independent, and a disabled interval can be correct behavior inside a given timeframe
- [x] Created the permanent QA folder structure under `docs/qa/playwright` and `tmp/qa`
- [x] Created `docs/qa/playwright/README.md` as the current source of truth for the new QA structure

## Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `.vscode/settings.json` | Session context says integrated-browser stability was restored by removing or disabling `workbench.browser.enableChatTools` | Prevent unstable or non-interactive editor browser behavior |
| `docs/qa/playwright/README.md` | Created the new QA structure README | Make the browser-QA workflow explicit and repository-oriented |

.vscode/launch.json and .github/skills/fg-frontend-debug/SKILL.md were verified during the session but are not listed here because this recorded session work did not directly modify them.

## Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| Treat `Codex + Playwright MCP` as the default runtime UI validation path | Reasoning-only validation, manual-only validation, autonomous runtime validation | Runtime claims need reproducible browser evidence |
| Keep `VS Code integrated browser` as a separate manual debug path | Use one browser path for everything, or split runtime QA and manual debugging | Breakpoint work and autonomous validation solve different problems |
| Do not label disabled interval options as bugs without domain evidence | Assume broken UI, assume valid constraint, or gather runtime evidence first | Runtime evidence showed a valid matrix-style constraint |
| Do not create a full timeframe-interval matrix document yet | Document partial guesses now, or wait for broader coverage | Only fully understood contracts should be documented |
| Treat validation as part of done | Optional verification, reasoning-only closure, or required evidence before closure | Prevent fake verification and layer mismatch in conclusions |

## Pending Work

## Immediate Next Steps

1. Keep using `docs/qa/playwright/README.md` as the source of truth for future browser-QA assets and flows.
2. Reuse the validated browser-QA flow for future FG2 chart checks instead of relying on reasoning alone.
3. Continue separating happy-path acceptance, constraint validation, and chart bug evidence collection when testing chart behavior.
4. Defer any full timeframe-interval matrix document until there is materially broader runtime coverage.

## Blockers/Open Questions

- [ ] Open question: what is the full valid timeframe × interval matrix for FG2 charts? Needs: broader runtime coverage across combinations before documenting a stable contract.
- [ ] Open question: should older screenshots from earlier runtime runs be normalized from `tmp/screenshots` into the new `tmp/qa/screenshots` convention, or should the new convention apply only going forward? Needs: one explicit team decision.

## Deferred Items

- Full timeframe × interval matrix documentation (deferred because current evidence is partial)
- Permanent stress and constraint prompt files under `docs/qa/playwright/prompts` (deferred because the structure now exists, but the permanent prompt set should be added deliberately)
- Permanent matrix scenario file under `docs/qa/playwright/test-scenarios` (deferred until enough valid runtime coverage exists)

## Context for Resuming Agent

## Important Context

The key outcome of this session is process, not just isolated checks. Browser QA is now a real working part of the FG2 engineering process. The stable workflow is: use `Codex + Playwright MCP` for autonomous runtime UI validation and evidence collection, and use `VS Code integrated browser` only for manual breakpoint/debug work. Validation is required before treating work as done; reasoning alone is not enough for runtime claims. When chart behavior is tested, the next agent must explicitly separate happy-path acceptance, constraint validation, and chart bug evidence collection. A disabled interval inside a timeframe can be valid product behavior, so product constraints must not be mislabeled as bugs without domain evidence. Also important: the repository now has a QA structure and README, but the full timeframe × interval matrix is still unknown and must not be documented from partial evidence.

## Assumptions Made

- `Playwright MCP` remains configured and available in the Codex environment for future sessions.
- The FG2 frontend dev server remains expected at `http://localhost:3000` when runtime browser QA is requested.
- The chart matrix behavior observed in this session is treated as a valid constraint example unless future domain evidence proves otherwise.

## Potential Gotchas

- `console` and `network` output from browser tools is cumulative for the current page session unless explicitly isolated.
- A disabled interval option is not automatically a bug; check whether the current timeframe makes that combination invalid.
- Do not create a full timeframe-interval matrix document from one or two observed constraints.
- The integrated-browser stabilization finding matters only for the manual debug path; it should not be conflated with autonomous `Playwright MCP` QA.
- Older runtime screenshots were created before the new QA folder convention; future artifacts should follow the new `tmp/qa` structure.

## Environment State

## Tools/Services Used

- `Codex + Playwright MCP`: autonomous browser runtime checks and evidence capture
- `VS Code integrated browser`: manual breakpoint/debug path
- `git`: branch and worktree inspection
- `apply_patch`: repository documentation edits

## Active Processes

- Frontend dev server was expected and reachable at `http://localhost:3000` during runtime QA
- No long-running process was started or managed by this handoff step itself

## Environment Variables

- No session-critical environment variable names were added during this session

## Playbook Update Check

Does this session require updating docs/domain/FG_CHART_ENGINE_PLAYBOOK.md?

NO.

Rationale: this session established a repo-level browser QA process and handoff discipline, but it did not change the chart-engine-specific architecture, observability surfaces, safety mechanisms, or investigation workflow described in that playbook.

## Related Resources

- `AGENTS.md`
- `CODEX_RULES.md`
- `.vscode/settings.json`
- `.vscode/launch.json`
- `.github/skills/fg-frontend-debug/SKILL.md`
- `docs/qa/playwright/README.md`
- `docs/domain/FG_CHART_ENGINE_PLAYBOOK.md`
