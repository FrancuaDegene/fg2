# Chart Component Architecture

## Overview
This directory contains a refactored chart component system with clear separation of concerns. The implementation follows a modern React architecture pattern with context-based state management and modular components.

## Component Structure

### Main Entry Point
- **[Chart.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js)** - Main component that wraps everything in the ChartContainer

### Core Components
- **[ChartContainer.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js)** - Container component that provides context and manages state
- **[ChartContent.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.jsx)** - Main content component that uses context hooks
- **[ChartRenderer.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js)** - Lightweight Charts rendering component
- **[ChartToolbar.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartToolbar.js)** - Toolbar with controls for intervals, timeframes, and chart types
- **[ActiveIndicators.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ActiveIndicators.js)** - Component for displaying active indicators
- **[ChartWrapper.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartWrapper.js)** - Wrapper component for styling

### State Management
- **[ChartContext.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartContext.js)** - React Context with useReducer for state management

### Utilities
- **[utils/chartUtils.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/utils/chartUtils.js)** - Utility functions for chart calculations and data preparation

## Data Flow

1. **[Chart.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/Chart.js)** receives props from parent components
2. **[ChartContainer.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartContainer.js)** provides context with initial data
3. **[ChartContent.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartContent.jsx)** consumes context and renders toolbar and chart
4. **[ChartToolbar.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartToolbar.js)** allows user interaction and updates context
5. **[ChartRenderer.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ChartRenderer.js)** renders the actual chart using lightweight-charts library
6. **[ActiveIndicators.js](file:///C:/Users/FrancuaDegene/Desktop/%D0%A0%D0%B5%D0%B7%D0%B5%D1%80%D0%B2%D0%B0%D0%BD%D0%B0%D1%8F%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82%D0%B0%20FG/27.08.2025/FG2/fingineerwebapp/src/components/Results/Chart/ActiveIndicators.js)** displays active indicators from context

## Key Features

- **Separation of Concerns**: Each component has a single responsibility
- **Context-based State Management**: Centralized state management using React Context and useReducer
- **Modular Design**: Utility functions separated into dedicated module
- **Responsive UI**: Supports expanded/collapsed modes
- **Performance Optimized**: Uses React hooks for efficient rendering
- **Extensible**: Easy to add new chart types and indicators

## Chart Types Supported

- Japanese Candlesticks
- Hollow Candlesticks
- Bars
- Volume Candles
- Line Charts
- Area Charts
- Baseline Charts
- Histograms
- Heikin Ashi
- Renko
- And many more...

## Usage

```jsx
import Chart from './Chart';

<Chart
  chartData={chartData}
  isChartLoading={isChartLoading}
  currentInterval="1m"
  currentTimeframe="1d"
  onIntervalChange={handleIntervalChange}
  onTimeframeChange={handleTimeframeChange}
  query="AAPL"
  isExpanded={false}
  onToggleExpand={handleToggleExpand}
  onToggleSearch={handleToggleSearch}
  onSearch={handleSearch}
/>
```