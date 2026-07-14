# Phase 0 — Sprint Activation Checklist

## Status

`completed / source activation done`

## Purpose

Phase 0 activates the sprint at source-routing level.

This phase does not perform frontend discovery.

It only prepares the authoritative working context for the sprint.

## Completion Summary

Phase 0 source activation is completed.

Completed:

- authoritative current-state created;
- `FG_ACTIVE_SOURCE_PACK.md` updated;
- Codex source-chain prepared;
- active handoff routing connected.

Next safe entry:

`Phase 1 — Frontend System Map`

Mode:

`ANCHOR / READ-ONLY`

## Inputs

Required inputs:

- `docs/project/sprint/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_sprint_contract.md`
- `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
- `.claude/handoffs/README.md`
- `.claude/handoffs/active/FG_frontend_architecture_discovery_2026/`

## Tasks

### Task 0.1 — Confirm Sprint Folder

Confirm that the sprint folder exists:

`docs/project/sprint/FG_frontend_architecture_discovery_2026/`

Confirm that phase/task files exist.

### Task 0.2 — Create Active Current-State

Create new authoritative current-state file:

`docs/project/state/FG_frontend_architecture_discovery_current_state_2026-05-25.md`

The file must define:

- active sprint;
- current stop-point;
- source routing;
- closed previous sprint boundary;
- next safe entry;
- do-not-reopen zones;
- open frontiers;
- handoff routing;
- Phase 1 entry rule.

### Task 0.3 — Update Active Source Pack

Update:

`docs/project/state/FG_ACTIVE_SOURCE_PACK.md`

Required changes:

- current active sprint = `Frontend Architecture Discovery Pass`;
- current authoritative current-state = new frontend discovery current-state;
- sprint contract = sprint folder contract path;
- active handoff routing note = `.claude/handoffs/README.md`;
- active handoff folder = `.claude/handoffs/active/FG_frontend_architecture_discovery_2026/`;
- current next safe entry = `Phase 1 — Frontend System Map`.

### Task 0.4 — Prepare Codex Source-Chain

Expected Codex source-chain after activation:

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. `docs/project/state/FG_frontend_architecture_discovery_current_state_2026-05-25.md`
5. `docs/project/sprint/FG_frontend_architecture_discovery_2026/FG_frontend_architecture_discovery_sprint_contract.md`
6. `.claude/handoffs/README.md`
7. `.claude/handoffs/active/FG_frontend_architecture_discovery_2026/`
8. relevant domain pack only when needed
9. archived chart sprint closure / retrospective only as background
10. `gbrain` only as helper, not authority replacement

## DoD

Phase 0 is complete when:

- new current-state exists;
- `FG_ACTIVE_SOURCE_PACK.md` points to the new sprint;
- Codex source-chain is explicit;
- Phase 1 is declared as next safe entry;
- no frontend discovery was performed;
- no product code was changed.

Current result:

`Phase 0 DoD completed`

## Do-Not Rules

Do not:

- execute Phase 1;
- inspect frontend code for discovery;
- patch product code;
- run browser/runtime QA;
- move old handoff files;
- archive old handoff files;
- reopen closed chart sprint.
