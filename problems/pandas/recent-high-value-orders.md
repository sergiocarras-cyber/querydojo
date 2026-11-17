---
id: pandas-004
slug: recent-high-value-orders
title: Recent High-Value Orders
section: pandas
difficulty: Easy
topics: [Filtering, Dates]
company: Loomly Home
function: recent_high_value
order_matters: true
---

## Statement

**Loomly Home** wants to call customers who placed a **high-value** order recently.

Given `orders` and a reference date `as_of` (a string `"YYYY-MM-DD"`), return the orders that:

- were placed in the **30 days up to and including `as_of`**, i.e. `as_of - 29 days <= order_date <= as_of`
  (dates only, no times), and
- have `total >= 500`.

Return `order_id`, `customer_id`, `total`, sorted by `total` descending, then `order_id`.

```python
def recent_high_value(orders: pd.DataFrame, as_of: str) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def recent_high_value(orders: pd.DataFrame, as_of: str) -> pd.DataFrame:
    # Your code here
    return orders
```

## Data

```python
import pandas as pd

def cases():
    orders = pd.DataFrame({
        "order_id": [1, 2, 3, 4, 5],
        "customer_id": [7, 8, 7, 9, 8],
        "order_date": pd.to_datetime(["2025-05-01", "2025-05-20", "2025-06-10", "2025-06-14", "2025-06-15"]),
        "total": [900.0, 650.0, 499.99, 1200.0, 500.0],
    })
    yield [orders, "2025-06-15"]
```

## Hidden Data

```python
import pandas as pd

def cases():
    orders = pd.DataFrame({
        "order_id": [1, 2, 3, 4],
        "customer_id": [1, 2, 3, 4],
        "order_date": pd.to_datetime(["2025-02-28", "2025-03-01", "2025-03-30", "2025-03-31"]),
        "total": [700.0, 700.0, 800.0, 999.0],
    })
    # Window is 2025-03-01 .. 2025-03-30: first day in, day before out, day after out.
    yield [orders, "2025-03-30"]
```

## Hints

### Hint 1

`pd.Timestamp(as_of) - pd.Timedelta(days=29)` gives the start of the window.

### Hint 2

`Series.between(start, end)` is inclusive on both sides by default.

## Solution

```python
import pandas as pd

def recent_high_value(orders: pd.DataFrame, as_of: str) -> pd.DataFrame:
    end = pd.Timestamp(as_of)
    start = end - pd.Timedelta(days=29)
    mask = orders["order_date"].between(start, end) & (orders["total"] >= 500)
    out = orders.loc[mask, ["order_id", "customer_id", "total"]]
    return out.sort_values(["total", "order_id"], ascending=[False, True]).reset_index(drop=True)
```

## Explanation

1. Convert `as_of` to a `Timestamp` and subtract 29 days: a 30-day window includes both ends.
2. Combine boolean masks with `&` (each condition in parentheses because of operator
   precedence).
3. Select columns with `.loc[mask, cols]` and sort.

Off-by-one errors in date windows are very common in interviews: say out loud whether each
end is inclusive.

## Wrong Answers

```python
import pandas as pd

def recent_high_value(orders, as_of):
    end = pd.Timestamp(as_of)
    mask = (orders["order_date"] > end - pd.Timedelta(days=30)) & (orders["order_date"] < end) & (orders["total"] >= 500)
    out = orders.loc[mask, ["order_id", "customer_id", "total"]]
    return out.sort_values(["total", "order_id"], ascending=[False, True])
```

```python
import pandas as pd

def recent_high_value(orders, as_of):
    end = pd.Timestamp(as_of)
    mask = orders["order_date"].between(end - pd.Timedelta(days=30), end) & (orders["total"] >= 500)
    out = orders.loc[mask, ["order_id", "customer_id", "total"]]
    return out.sort_values(["total", "order_id"], ascending=[False, True])
```
