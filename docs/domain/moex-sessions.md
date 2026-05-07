# MOEX Trading Sessions

FG charts must respect MOEX trading sessions.

MOEX is not a 24/7 market.

## Main sessions

### Morning session
06:50 – 09:50

### Main session
10:00 – 18:45

### Evening session
19:00 – 23:50

## Domain rules

### Rule 1
Charts must not treat MOEX as a continuous 24/7 stream.

### Rule 2
Candle generation and aggregation must respect session boundaries.

### Rule 3
Time navigation must account for session gaps.

### Rule 4
Visible range calculations should behave consistently across session transitions.

## Why this matters

Ignoring session structure can cause:

- broken candle aggregation
- invalid range calculations
- misleading chart gaps
- incorrect navigation behavior