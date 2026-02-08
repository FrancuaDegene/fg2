# AGENTS.md

This file defines how AI coding agents (Codex, Copilot, etc.) should reason and operate within the FG codebase.
It complements README.md (for humans) and strict policy files (for safety boundaries).

The goal is predictable, architecture-aware, minimal-risk collaboration.

---

## Project Overview (FG)

FG is an investment analytics web application with:
- Compact charts (sparkline-style, quick overview)
- Expanded charts (deep analysis, pan/zoom, indicators)

Charts are built on Lightweight Charts (LWC), with known architectural limitations.
Several design decisions are intentional and **must not be revisited by default**.

---

## Core Reasoning Skills (Mandatory)

### 1. Clarification-First Reasoning
Before proposing any plan, solution, or optimization, the agent must ask clarifying questions
whenever UX, performance, or architecture may be affected.

Do **not** assume intent.
Do **not** skip this step.

---

### 2. Invariant-Preserving Optimization
Optimization is allowed **only** if observable behavior remains identical.

UX invariants include (but are not limited to):
- visible ranges
- pan / zoom behavior
- auto-follow logic
- tooltip behavior
- loadMore / history fetching
- Compact ↔ Expanded consistency

If behavior might change, stop and ask.

---

### 3. Locality of Change (One-File Discipline)
Prefer minimal, localized changes.

Rules:
- One file per patch by default
- No wide refactors unless explicitly approved
- No “while we are here” improvements

If more than one file seems required — explain why and wait for confirmation.

---

### 4. FG Architecture Awareness
The agent must be aware of and respect the following architectural decisions:

- Lightweight Charts has known limitations around pan/zoom and barSpacing.
- Custom navigation layers (FG Time Navigation Layer) are intentional.
- Compact charts and Expanded charts serve different UX roles.
- Not every problem should be solved by toggling LWC options or upgrading libraries.

Do not propose alternative architectures unless explicitly asked.

---

### 5. Trade-off Explicitness
Every proposal must state trade-offs explicitly:
- What improves
- What stays the same
- What could regress
- Why this option is chosen over others

Avoid “free improvements” narratives.

---

### 6. Decision Gating
Work must follow this sequence strictly:

1. Questions
2. Plan (with anchors)
3. Explicit confirmation
4. Execution (patch)

Skipping steps is not allowed.

---

## Chart-Specific Domain Knowledge

Agents working on chart-related code must account for:

- barSpacing sensitivity in low pixel-density regimes
- visibleLogicalRange side effects
- rounding artifacts around ~0.5–1.0 px per bar
- differences between conflated and non-conflated rendering
- why custom pan logic may be required for strict UX contracts

Compact charts:
- No pan
- Native LWC interaction is acceptable

Expanded charts:
- Pan and zoom are UX-critical
- Custom control may be required to preserve invariants

---

## What This File Is NOT

- Not a place for safety or permission rules (those live elsewhere)
- Not a substitute for explicit approval
- Not a license to modify code freely

This file defines **how to think**, not **what you are allowed to do**.

---

## Final Rule

When in doubt:
- Ask
- Explain
- Wait

Predictability and UX stability are more important than cleverness.
