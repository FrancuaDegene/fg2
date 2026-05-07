# FG Chart Navigation Model

This document defines how chart navigation works in FG.

Navigation is not just a UI behavior.
It is part of the chart engine architecture.

## Navigation actions

### pan
Horizontal movement of the visible chart window.

### zoom
Change of visible scale through wheel or other zoom actions.

### scroll
Wheel-based horizontal / scale interaction depending on mode.

### drag
Pointer-based movement of the chart range.

## Core navigation state

The main navigation-sensitive state is:

- visibleRange
- visibleLogicalRange
- barSpacing

These values must be handled carefully and should not have uncontrolled writers.

## Navigation ownership model

FG may use two navigation models:

### 1. Native lightweight-charts navigation
The library manages pan / zoom behavior internally.

### 2. FG-owned navigation
FG disables or limits native navigation behavior and takes ownership
through custom navigation logic.

## Stability rules

### Rule 1
barSpacing must not change unexpectedly during pan.

### Rule 2
visibleLogicalRange updates must be consistent and mode-aware.

### Rule 3
Runtime navigation should avoid multiple concurrent writers.

### Rule 4
Initialization writes and runtime writes must be clearly separated.

## Risk areas

The highest-risk navigation bugs usually come from:

- split ownership of visibleLogicalRange
- hidden resets after timeframe switch
- fitContent / auto-scroll interfering with custom navigation
- synchronization layers writing range state
- library-native behavior remaining active when FG expects custom ownership