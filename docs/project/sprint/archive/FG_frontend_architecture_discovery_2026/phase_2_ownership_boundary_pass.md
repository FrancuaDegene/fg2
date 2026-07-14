# Phase 2 — Ownership & Boundary Pass

## Status

`completed / anchor accepted`

## Accepted Result

Phase 2 completed the ownership and boundary pass.

Accepted findings:

- `App.js` is large but not proven structurally risky as a whole.
- `App.js` has suspicious ownership concentration around chart socket / cache / inflight / error / ownership.
- Search boundary is suspicious because suggestions logic appears in `SearchForm.js` and `useSearch.js`.
- `Results -> News` is a concrete structurally risky / contract-drift boundary.
- AI / Summary is a disabled / test surface, not a mature product domain.
- `DashboardColumn` mixes real chart data and mock data.
- No final sprint verdict was made in Phase 2.
- No product code changed.

Preferred next-line name after final sprint verdict:

`Bounded Frontend Contract Hardening Sprint`

## Evidence Gaps

Phase 2 did not make the final sprint verdict, did not produce a cleanup implementation plan, and did not classify cross-domain leakage as the final pass.

## Mode

`ANCHOR / READ-ONLY`

## Main Question

Кто чем владеет, и где ответственность начинает размываться?

## Purpose

Phase 2 maps ownership and boundaries across the frontend.

The goal is to separate normal orchestration from real authority / mutation / failure risk.

## Scope

Inspect:

- top-level owners;
- state owners;
- authority surfaces;
- identity surfaces;
- mutation points;
- failure ownership;
- relay-only layers;
- accidental logic inside relay layers;
- `App` as normal shell orchestration vs overloaded authority surface;
- frontend ↔ backend data boundary.

## Expected Output

- ownership map;
- boundary map;
- list of clean boundaries;
- list of suspicious boundaries;
- list of structurally risky boundaries.

## Required Classification

Each important finding should be classified as:

1. `clean boundary`
2. `suspicious boundary`
3. `structurally risky boundary`
4. `needs more evidence`

## DoD

Phase 2 is complete when:

- owner / authority / mutation / failure surfaces are mapped;
- `App` is not called overloaded without concrete evidence;
- relay-only layers are separated from logic-owning layers;
- risky findings have file-level evidence;
- no product code is changed.

## Do-Not Rules

Do not:

- patch code;
- turn findings into cleanup plan yet;
- call prop drilling a defect without ownership risk;
- confuse normal shell orchestration with accidental logic leakage.
