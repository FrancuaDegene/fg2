# Phase 1 — Frontend System Map

## Status

`completed / anchor accepted`

## Accepted Result

Phase 1 completed the first frontend-wide system map.

Accepted findings:

- FG frontend appears as a single top-level analytical workspace, not route/page architecture.
- `App.js` is the top-level shell / orchestration surface.
- Main frontend domains identified:
  - Search;
  - Ticker / Instrument;
  - Results;
  - Chart;
  - News;
  - Dividends;
  - Metrics;
  - Shared Layout / Panels;
  - Frontend API boundary.
- Chart was included only as one frontend domain.
- Phase 1 did not prove `App.js` is overloaded.
- No cleanup recommendation was made in Phase 1.
- No product code changed.

Preferred next-line name after final sprint verdict:

`Bounded Frontend Contract Hardening Sprint`

## Evidence Gaps

Phase 1 did not make ownership conclusions, cleanup decisions, runtime claims, or final sprint verdict.

## Mode

`ANCHOR / READ-ONLY`

## Main Question

Как текущий frontend FG устроен как система?

## Purpose

Phase 1 builds the first frontend-wide system map.

The goal is to identify the real frontend domains, top-level shell, page-level orchestration zones, and first integration boundaries.

This phase does not classify cleanup needs yet.

## Scope

Inspect:

- `App`;
- upper frontend shell;
- page-level orchestration;
- main UI domains;
- search;
- ticker;
- results;
- news;
- summary;
- shared panels;
- chart as one domain;
- frontend ↔ backend integration surfaces.

## Expected Output

- `Frontend architecture snapshot v1`;
- list of main frontend domains;
- list of top-level shell / orchestration surfaces;
- first list of integration boundaries;
- notes where evidence is insufficient.

## DoD

Phase 1 is complete when:

- main frontend domains are named;
- top-level shell is mapped;
- chart is included only as one domain;
- integration boundaries are identified at high level;
- no cleanup plan is produced without evidence;
- no product code is changed.

## Do-Not Rules

Do not:

- patch code;
- do refactor;
- do cleanup;
- over-focus on chart-domain;
- perform full inventory of every frontend file;
- make Phase 2 ownership conclusions too early.
