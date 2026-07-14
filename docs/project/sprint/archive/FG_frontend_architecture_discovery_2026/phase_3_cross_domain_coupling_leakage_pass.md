# Phase 3 — Cross-Domain Coupling / Leakage Pass

## Status

`completed / anchor accepted`

## Accepted Result

Phase 3 completed the cross-domain coupling / leakage pass.

Accepted findings:

- Frontend architecture is not globally broken.
- Normal base flow:
  - `Search -> App workspace shell -> Results composition -> Chart / News / Dividends / Metrics`.
- Real leakage risks:
  1. Search suggestions duplicated transport owner.
  2. Legacy News contract drift.
- Acceptable coupling with guardrails:
  - `App -> Results`;
  - `Results -> Chart`;
  - API config -> domain callers;
  - `ExpandedControls` as toolbar surface.
- Growth-risk frontiers:
  - App / Chart transport ownership;
  - `DashboardColumn` mock + real data merge;
  - Dividends dormant fetch contract;
  - News productization.
- AI / Summary is a deferred / test surface and not a blocker.
- No final sprint verdict was made in Phase 3.
- No product code changed.

Preferred next-line name after final sprint verdict:

`Bounded Frontend Contract Hardening Sprint`

## Evidence Gaps

Phase 3 did not make the final sprint verdict, did not create a cleanup implementation plan, and did not run browser / runtime QA.

## Mode

`ANCHOR / READ-ONLY`

## Main Question

Где frontend-слабость живёт между доменами, а не внутри одного домена?

## Purpose

Phase 3 investigates cross-domain coupling and leakage.

The goal is to identify whether frontend risks live between domains such as search, results, news, summary, shared panels, and chart.

## Scope

Inspect:

- `search -> results`;
- `results -> summary`;
- `news -> shared panels`;
- shared state surfaces;
- implicit dependencies;
- duplicated concepts;
- domain-to-domain data leakage;
- places where product growth may create breakage.

## Expected Output

- frontend coupling map;
- leakage risk list;
- growth-risk notes;
- classification of normal orchestration vs harmful coupling.

## Required Classification

Each important finding should be classified as:

1. `normal orchestration`
2. `acceptable coupling with guardrails`
3. `leakage risk`
4. `growth-risk frontier`
5. `needs more evidence`

## DoD

Phase 3 is complete when:

- cross-domain coupling is mapped;
- leakage risks are separated from normal orchestration;
- risks are tied to concrete boundaries;
- broad rewrite is not proposed;
- no product code is changed.

## Do-Not Rules

Do not:

- patch code;
- propose broad frontend rewrite;
- treat every shared surface as a defect;
- include backend rewrite;
- run browser/runtime QA unless explicitly required later.
