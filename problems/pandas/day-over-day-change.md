---
id: pandas-010
slug: day-over-day-change
title: Day-over-Day Price Change
section: pandas
difficulty: Medium
topics: [shift, groupby, Window functions, Dates]
company: Pennywise Pay
function: daily_change
order_matters: true
---

## Statement

**Pennywise Pay** shows stock prices in its investing tab. `prices` holds daily closing prices
(`ticker`, `date`, `close`), **not sorted**.

For each ticker, compare every trading day with the **previous trading day of the same
ticker**:

- `change` = `close − previous close`, rounded to 2 decimals;
- `pct_change` = `change / previous close × 100`, rounded to 2 decimals.

The first day of each ticker has no previous day: leave it out. Return `ticker`, `date`,
`change`, `pct_change`, sorted by `ticker`, then `date`.

```python
def daily_change(prices: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def daily_change(prices: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return prices
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "ticker": ["NOVA", "KITE", "NOVA", "KITE", "NOVA", "KITE"],
        "date": pd.to_datetime(["2025-03-04", "2025-03-03", "2025-03-03", "2025-03-05", "2025-03-05", "2025-03-04"]),
        "close": [102.0, 50.0, 100.0, 49.5, 99.96, 51.0],
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Gaps between trading days, and a ticker with a single day.
    yield [pd.DataFrame({
        "ticker": ["A", "A", "A", "B"],
        "date": pd.to_datetime(["2025-01-10", "2025-01-02", "2025-01-06", "2025-01-02"]),
        "close": [30.0, 20.0, 25.0, 7.0],
    })]
```

## Hints

### Hint 1

Sort by `["ticker", "date"]` first: `shift` works on row order.

### Hint 2

`groupby("ticker")["close"].shift(1)` returns the previous close **of the same ticker**
(`NaN` on each ticker's first row).

## Solution

```python
import pandas as pd

def daily_change(prices: pd.DataFrame) -> pd.DataFrame:
    df = prices.sort_values(["ticker", "date"]).copy()
    prev = df.groupby("ticker")["close"].shift(1)
    df["change"] = (df["close"] - prev).round(2)
    df["pct_change"] = ((df["close"] - prev) / prev * 100).round(2)
    df = df[prev.notna()]
    return df[["ticker", "date", "change", "pct_change"]].reset_index(drop=True)
```

## Explanation

`shift` is pandas' `LAG`:

1. Sort so that each ticker's rows are consecutive and in date order.
2. `groupby("ticker")["close"].shift(1)` looks one row back **within each ticker**. Without the
   `groupby`, the first row of KITE would compare with the last row of the previous ticker.
3. Compute the change and percentage from the unrounded values and round at the end.
4. Drop rows whose previous close is `NaN` (the first day of each ticker).

"Previous trading day" means the previous row, not "date − 1 day", so weekends and holidays
need no special handling.

## Wrong Answers

```python
import pandas as pd

def daily_change(prices):
    df = prices.sort_values(["ticker", "date"]).copy()
    prev = df["close"].shift(1)
    df["change"] = (df["close"] - prev).round(2)
    df["pct_change"] = ((df["close"] - prev) / prev * 100).round(2)
    df = df[prev.notna()]
    return df[["ticker", "date", "change", "pct_change"]]
```

```python
import pandas as pd

def daily_change(prices):
    df = prices.copy()
    prev = df.groupby("ticker")["close"].shift(1)
    df["change"] = (df["close"] - prev).round(2)
    df["pct_change"] = ((df["close"] - prev) / prev * 100).round(2)
    df = df[prev.notna()]
    return df[["ticker", "date", "change", "pct_change"]].sort_values(["ticker", "date"])
```
