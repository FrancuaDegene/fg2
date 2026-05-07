---
name: fg-owner-flow-trace
description: Use for FG architecture-first analysis before any patch when the task requires Project Sources, supporting gbrain context, and Serena live-code synthesis. Use to return owner/authority structure, phase split, conflict boundary, closed/open status, next anchors, and patch readiness. Do not use for direct chart runtime debugging, cosmetic edits, trivial local refactors, or pure implementation-only requests with no architecture uncertainty.
---

# FG Owner Flow Trace

## Purpose

Use this skill to restore architectural truth in FG before any code change.

This skill is for:
- accepted context retrieval
- owner and authority analysis
- init/runtime split
- mutation and failure path tracing
- conflict boundary detection
- closed/open frontier framing
- patch-readiness gating

This skill is not just owner tracing.
Its main job is to combine:
- Project Sources first: current-state, stable docs, and sprint file
- supporting / narrowing context from `gbrain`
- live-code evidence from Serena for symbols, references, and anchors
- a decision-safe architectural synthesis before patch

It is not the direct chart-engine debugging skill.
For chart runtime issues like `barSpacing`, `visibleRange`, pan/zoom instability, hidden resets, or oversized candles, prefer `fg-chart-architect`.
For pure code-truth tracing with no accepted-context need, prefer Serena directly.

## When to use

Use this skill when:
- the task touches owner / authority / identity / phase / mutation / failure
- the task involves handoff boundaries, closed/open frontiers, or accepted contracts
- a patch is being considered but the canonical owner is not yet proven
- the task needs a decision-safe anchor before implementation
- the task spans both architecture memory and live code truth

## When NOT to use

Do not use this skill for:
- direct chart runtime debugging that belongs to `fg-chart-architect`
- simple cosmetic edits
- trivial one-file implementation tasks with no ownership uncertainty
- backend / infra / deployment work unrelated to FG architecture
- patch execution itself

## Required routing

1. If the task needs accepted architecture, current stop-point, or closed/open frontier:
   - read Project Sources first
   - current-state is authoritative for stop-point and what-next-now
   - stable docs are architecture authority
   - sprint file is roadmap / phase tracking only

2. If the task needs live code truth:
   - use Serena as live-code evidence for symbols, references, owners, and anchors
   - start with `search_for_pattern`, then narrow to symbol
   - return concrete code-level facts only

3. If supporting context is needed after Project Sources:
   - use `gbrain` only as supporting / narrowing
   - `gbrain` cannot override local repo truth
   - handoffs are supporting evidence only

4. Do not propose a patch unless owner/conflict evidence is strong enough.

## Required method

1. Identify the primary object or layer first.
2. Read Project Sources before tool or handoff context when the task touches accepted contracts, current stop-point, or closed/open frontier.
3. Retrieve only the minimal supporting context from `gbrain` when narrowing accepted context, handoff lineage, or cross-doc search is still needed.
4. Retrieve live code truth from Serena when the task needs readers, writers, symbols, call-flow, data-flow, mutation points, or failure paths.
5. Keep Project Sources, supporting context, and live code truth separate until synthesis.
6. State the raw code-only ambiguity before using accepted context to resolve it.
7. Trace explicitly:
   - owner
   - authority
   - identity
   - phase
   - mutation
   - failure
8. Separate init-time behavior from runtime behavior.
9. Name canonical owner candidates, passive readers / mirrors, and forbidden writers or unstable multi-writer zones.
10. State whether accepted context and live code truth:
   - match
   - partially match
   - diverge
11. Mark the layer as:
   - closed
   - open
   - provisional
12. Name the exact conflict or uncertainty.
13. List the next files / symbols / anchors to inspect before any patch.
14. Return patch readiness as yes / no.
15. Return synthesis confidence as high / medium / low.
16. Do not propose a patch unless owner/conflict evidence is strong enough.

## Output format

Return:

- Scope
- Layer / object
- Accepted context anchors
- Live code anchors
- Code-only ambiguity before synthesis
- Owner map
- Authority chain
- Identity / phase split
- Mutation / failure path
- Passive readers / mirrors
- Forbidden writers or unstable multi-writer zone
- Accepted context vs live code: match / partial match / divergence
- Closed vs open status
- Next anchors
- Patch readiness: yes/no
- Synthesis confidence: high / medium / low

## FG-specific constraints

- Explicitly consider reliability, performance, and flexibility.
- Prefer minimal and reversible changes.
- One file at a time.
- Readability over cleverness.
- Do not reopen closed slices without genuinely new evidence.
- Prefer authoritative current-state over handoff history.
- Handoffs are supporting evidence only.
- `gbrain` is supporting / narrowing only and cannot override local repo truth.
- Do not mix current state with timeline/history unless the distinction is explicit.

## Language

Respond in Russian.
Use English only for file paths, code identifiers, and exact anchors.
