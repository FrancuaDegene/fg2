# FG Chart State Model

This document defines the canonical chart state model used in FG.

The chart state is the foundation for navigation, rendering, synchronization,
and future chart features.

## Core state

### symbol
The selected instrument or ticker currently displayed on the chart.

### timeframe
The user-selected historical range.
Examples: 1D, 3D, 1M, 3M, 6M, 1Y.

### resolution
The candle interval or aggregation step.
Examples: 1m, 5m, 15m, 1h, 1d.

### visibleRange
The current visible time range shown on the chart.

### visibleLogicalRange
The internal lightweight-charts logical range used for navigation and scaling.

### barSpacing
The visual width / spacing of bars on the chart.
This directly affects zoom perception and navigation stability.

### chartType
The active chart type.
Examples: candlestick, line, area.

## Derived / analytical state

### indicators
The list of active technical indicators.

### indicatorSettings
The configuration of each indicator.

### compareSymbols
Additional instruments overlaid for comparison.

### drawings
User-created chart drawings.

## Layout state

### paneLayout
The structure of panes in a multi-pane chart.

### chartLayout
The overall chart layout mode and arrangement.

## Visual state

### theme
The active chart theme.

### crosshair
Crosshair behavior and visibility.

### cursorState
The current cursor interaction mode.

## Ownership principle

Each important chart state property should have a clear ownership source.

Critical ownership-sensitive properties:
- visibleRange
- visibleLogicalRange
- barSpacing

Multiple writers to the same property can cause:
- unstable zoom
- bar jumps
- oversized candles
- inconsistent navigation behavior