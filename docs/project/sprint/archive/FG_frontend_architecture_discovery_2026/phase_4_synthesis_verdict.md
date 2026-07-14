# Phase 4 — Synthesis / Verdict

## Status

`completed / final verdict accepted`

## Final Verdict

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

Preferred next-line name:

`Bounded Frontend Contract Hardening Sprint`

## Final Synthesis Summary

FG frontend is not globally broken.

Near-term model remains:

single analytical workspace UX
+ modular frontend domain architecture
+ thin App shell

Accepted completion notes:

- Phase 1 completed / anchor accepted.
- Phase 2 completed / anchor accepted.
- Phase 3 completed / anchor accepted.
- Phase 4 completed / final verdict accepted.
- Product code changed: no.
- Browser / runtime QA run: no.
- Cleanup implementation started: no.
- Chart internals reopened: no.
- AI / Summary is deferred / test surface / out of current product scope.

## Three-Bucket Classification

### A. Stable enough before product/design

- `App.js` shell / orchestration.
- `Results.js` composition.
- `Results -> Chart` mount / relay.
- `Header` / `Overlay` / shared layout.
- Closed chart internals.
- Basic ticker / result / metrics display flow.
- API config as endpoint registry.

### B. Needs bounded cleanup before product/design

- Search suggestions single owner / contract.
- App / Chart transport ownership contract before new chart modes.
- News legacy boundary decision / isolation if News remains visible or enters design scope.

### C. Later frontier / can wait

- AI / Summary deferred test surface.
- `DashboardColumn` if dashboard is not in next design.
- Dividends dormant fetch contract.
- Broader frontend service-layer cleanup.
- Broad App rewrite.
- Route / page architecture migration.

## Non-goals

- No broad frontend rewrite.
- No product code patch.
- No chart internals reopen.
- No AI / Summary work.
- No dashboard build.
- No News product redesign.

## Mode

`DECISION`

## Main Question

Можно ли FG идти в следующий product/design этап, или сначала нужен bounded frontend cleanup?

## Purpose

Phase 4 synthesizes evidence from previous phases and produces the final route verdict.

This phase decides the next path.

It does not patch code.

## Inputs

Expected inputs:

- Phase 1 frontend system map;
- Phase 2 ownership / boundary map;
- Phase 3 cross-domain coupling / leakage map;
- active sprint contract;
- active current-state.

## Required Outputs

### 1. Final Frontend Architecture Snapshot

Compact map of:

- frontend domains;
- top-level shell;
- ownership zones;
- integration boundaries.

### 2. Final Frontend Risk Map

Compact map of:

- stable areas;
- weak boundaries;
- leakage risks;
- growth-risk frontiers.

### 3. Three-Bucket Classification

Every important area must land in one bucket:

1. `Stable enough before product/design`
2. `Needs bounded cleanup before product/design`
3. `Later frontier / can wait`

### 4. Final Verdict

Allowed verdicts:

`READY FOR NEXT PRODUCT/DESIGN PHASE`

or:

`NEEDS BOUNDED FRONTEND CLEANUP SPRINT FIRST`

If cleanup is needed, list only bounded cleanup candidates.

## DoD

Phase 4 is complete when:

- final verdict is explicit;
- cleanup candidates are bounded;
- later frontiers are separated from blockers;
- recommendation is evidence-backed;
- no product code is changed.

## Do-Not Rules

Do not:

- patch code;
- invent cleanup candidates without evidence;
- reopen closed chart sprint;
- treat later frontiers as blockers without proof;
- output vague refactor advice.
