---
name: fg-chart-architect
description: Analyze and guide changes in the FG chart engine involving lightweight-charts navigation, custom pan/zoom logic, visible range ownership, bar spacing stability, timeframe switching, and MOEX session-aware time handling.
---

# FG Chart Architect

## Purpose

This skill analyzes the FG chart engine architecture and helps guide safe modifications to navigation behavior.

Focus areas:

- lightweight-charts integration
- custom pan/zoom control
- visibleRange ownership
- barSpacing stability
- timeframe switching
- MOEX session-aware time model

## When to use

Use this skill when working on:

- chart navigation
- custom pan logic
- zoom behavior
- oversized candles issues
- timeframe switching bugs
- chart state architecture

## When NOT to use

Do not use this skill for:

- generic React UI
- backend API logic
- deployment or infrastructure tasks

## Core invariants

- lightweight-charts is a rendering foundation, not the owner of FG product behavior
- navigation behavior may be implemented in FG control layers
- do not introduce hidden barSpacing resets
- keep minimal diffs
- one file at a time unless necessary

## Workflow

1. Identify ownership of chart navigation state
2. Check if logic lives in:

   - React state
   - refs
   - lightweight-charts internal state

3. List risks and invariants
4. Propose the smallest safe change
5. Provide exact edit points

## Output format

- Findings
- Risks
- Recommendation
- Exact edit point
- Verification steps