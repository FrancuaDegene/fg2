# FG Skills Audit Decision Record - 2026-06-01

## 1. Purpose

This document records the owner decision after the read-only audit of existing FG Codex/OpenAI skills and skill-like workflow surfaces.

It is a skill governance decision record. It does not change runtime behavior, does not add or remove any skill, and does not modify skill loading, MCP configuration, source code, dependency files, tests, or Dockerfiles.

This file is safe to commit separately as docs-only.

## 2. Scope

Audited surfaces:

- `skills/`
- `.agents/skills/`
- `skills-lock.json`
- `.codex/config.toml`
- `agents/openai.yaml` files under skill folders

Out of scope:

- editing `.agents/skills/*`
- editing `skills/*`
- editing `skills-lock.json`
- editing `.codex/config.toml`
- editing `AGENTS.md`
- editing `CODEX_RULES.md`
- adding new skills
- deleting or archiving skills
- adding MCP
- adding subagents
- touching frontend/backend source code
- touching package files, lockfiles, Dockerfiles, or tests

## 3. Authority boundary

Skills are supporting workflow helpers, not authority.

Authority remains:

1. `AGENTS.md`
2. `CODEX_RULES.md`
3. `docs/project/state/FG_ACTIVE_SOURCE_PACK.md`
4. active current-state resolved through `FG_ACTIVE_SOURCE_PACK.md`
5. domain docs
6. active policy / handoff / sprint docs

If a skill conflicts with Project Sources, current-state, domain docs, or explicit Owner direction, the skill loses.

## 4. Inventory summary

The audit found:

- one root skill under `skills/`: `skills/fg-chart-architect/SKILL.md`
- multiple `.agents` skills under `.agents/skills/`
- generic toolkit skills tracked in `skills-lock.json`
- `.codex/config.toml` with `gbrain` MCP configuration
- one `agents/openai.yaml` under `.agents/skills/fg-owner-flow-trace/agents/openai.yaml`

Important inventory note:

`skills/fg-chart-architect/SKILL.md` and `.agents/skills/fg-chart-architect/SKILL.md` share the same skill name, while the `.agents` version is richer and more FG-specific.

## 5. Keep

Keep as currently useful, bounded, and aligned with FG workflow:

- `.agents/skills/fg-chart-architect`
- `.agents/skills/fg-owner-flow-trace`
- `.agents/skills/fg-deprecation-migration`
- `.agents/skills/fg-adr`
- `.agents/skills/commit-work`

Reasons:

- `fg-chart-architect` is useful for chart runtime/navigation analysis, provided closed chart boundaries are respected.
- `fg-owner-flow-trace` is aligned with FG authority-first analysis and patch-readiness gates.
- `fg-deprecation-migration` is narrowly scoped to legacy/migration/replacement-proof decisions and explicitly excludes generic monthly dependency audit work.
- `fg-adr` has a decision gate and refuses trivial architecture records.
- `commit-work` is narrow and user-triggered.

## 6. Keep with boundary

Keep with explicit boundary:

- `.agents/skills/session-handoff`

Reason:

The Owner actively uses this skill to create handoff files after completed work or chat sessions.

Boundary:

- user-triggered only
- do not auto-create handoffs
- do not replace active current-state
- do not mix handoff generation with bootstrap, runtime checks, patching, or follow-up orchestration
- handoffs remain supporting continuity only, not authority

## 7. Revise

Revise later if these skills continue to cause over-triggering or scope expansion:

- `.agents/skills/fg-c4-system-map`
- `.agents/skills/requirements-clarity`
- `.agents/skills/qa-test-planner`

Revision intent:

- make trigger boundaries sharper
- prevent broad architecture/design expansion
- keep `qa-test-planner` supporting-only for FG runtime/QA work
- prevent `requirements-clarity` from generating PRD/docs without explicit docs-only `EXECUTE`
- keep `fg-c4-system-map` for genuinely architecture-relevant mapping, not local code patch tasks

## 8. Archive candidates

Archive candidates:

- `.agents/skills/agent-md-refactor`
- `.agents/skills/naming-analyzer`
- `.agents/skills/reducing-entropy`

Reasons:

- `agent-md-refactor` can touch root instruction / authority surfaces and is rarely needed in current FG work.
- `naming-analyzer` has a broad rename/refactor trigger and weak connection to the current FG frontier.
- `reducing-entropy` is deletion-biased and can conflict with FG no-broad-cleanup and closed-zone discipline.

Boundary:

These are candidates only. Do not archive or delete them without a later explicit `EXECUTE` step.

## 9. Delete candidate

Delete candidate:

- `skills/fg-chart-architect/SKILL.md`

Reason:

It is a duplicate of the richer `.agents/skills/fg-chart-architect/SKILL.md`.

Boundary:

Do not delete yet. Before deletion, inspect `skills-lock.json` and confirm the active skill loading path. Any actual deletion must be a later one-file-at-a-time `EXECUTE` step.

## 10. Scope-expansion risks

High-risk generic triggers:

- broad instruction refactor
- broad rename cleanup
- deletion-biased cleanup
- PRD generation from ambiguous prompts
- full QA/test plan generation when a narrow verification note is enough
- C4 mapping for local one-file tasks

FG-specific risk:

Any skill that touches chart architecture must respect accepted chart boundaries and closed zones. Do not reopen chart internals without genuinely new runtime or code evidence.

Dependency Radar risk:

Do not create `fg-dependency-radar` skill yet. `docs/project/process/FG_DEPENDENCY_RADAR_POLICY.md` says the process must run several real sessions before being promoted to a skill.

## 11. Decisions

- Do not create new skills now.
- Do not create `fg-dependency-radar` skill yet.
- Prefer fewer, sharper skills.
- Keep skills as supporting workflow helpers, not authority.
- Keep `.agents/skills/session-handoff` with the Owner-defined boundary.
- Do not use generic cleanup / rename / deletion skills during the upcoming frontend sprint unless explicitly requested.
- Do not mix skill cleanup with frontend sprint work.
- Any actual skill cleanup must be done later as one-file-at-a-time `EXECUTE` steps.

## 12. Next safe cleanup steps

No immediate cleanup is required.

If the Owner later chooses to clean up skills, use this sequence:

1. Inspect active skill loading path and `skills-lock.json`.
2. Decide whether root `skills/fg-chart-architect/SKILL.md` is actually unused.
3. If confirmed unused, delete only that duplicate skill file in a dedicated one-file `EXECUTE` step.
4. Separately revise broad-trigger skills only if they demonstrably cause over-triggering.
5. Keep all cleanup separate from `Bounded Frontend Contract Hardening Sprint` implementation work.

## 13. Explicitly forbidden actions

Forbidden as part of this record:

- do not edit `.agents/skills/*`
- do not edit `skills/*`
- do not edit `skills-lock.json`
- do not edit `.codex/config.toml`
- do not edit `AGENTS.md`
- do not edit `CODEX_RULES.md`
- do not create new skills
- do not delete or archive skills
- do not add MCP
- do not add subagents
- do not touch frontend/backend source code
- do not touch package files, lockfiles, Dockerfiles, or tests
- do not run dependency commands
- do not run runtime/browser checks
