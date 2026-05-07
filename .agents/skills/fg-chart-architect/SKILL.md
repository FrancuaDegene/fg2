---
name: fg-chart-architect
description: Analyze and guide changes in the FG chart engine involving lightweight-charts navigation, custom pan/zoom logic, visible range ownership, bar spacing stability, timeframe switching, and MOEX session-aware time handling.
---

## FG Domain Knowledge

Use the FG domain documentation as the source of truth when analyzing chart logic.

Relevant domain documents:

docs/domain/chart-state-model.md  
docs/domain/chart-navigation.md  
docs/domain/moex-sessions.md

These documents define the canonical model of the FG chart engine.
When analyzing code related to chart behavior (pan, zoom, visibleRange, barSpacing, sessions),
always interpret the code through this domain model.
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

## Chart Engine Debug Protocol

When diagnosing chart issues (oversized candles, zoom instability,
navigation jumps, or range resets), analyze the system using this protocol.

### Step 1 — Identify chart state ownership

Determine which module owns:

- visibleRange
- visibleLogicalRange
- barSpacing

Check if multiple systems write to the same state.

### Step 2 — Identify navigation writers

Locate all code paths modifying chart navigation:

- setVisibleRange
- setVisibleLogicalRange
- applyOptions
- fitContent
- scrollToRealTime

List the modules responsible for each write.

### Step 3 — Detect race conditions

Check if navigation state may be modified simultaneously by:

- pan handlers
- zoom handlers
- auto-scroll logic
- chart synchronization controllers

Multiple writers may cause navigation instability.

### Step 4 — Detect hidden resets

Check if lightweight-charts internally resets:

- barSpacing
- visibleRange
- timeScale options

Look for:

- applyOptions calls
- chart reinitialization
- series recreation

### Expected output

When debugging navigation issues, return:

- chart state ownership map
- list of navigation writers
- potential race conditions
- recommended minimal fix