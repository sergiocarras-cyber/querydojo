---
id: pandas-012
slug: days-to-second-purchase
title: Days to Second Purchase
section: pandas
difficulty: Medium
topics: [groupby, cumcount, Dates]
company: Loomly Home
function: days_to_second
---

## Statement

How quickly do **Loomly Home** customers come back? For every customer with **at least two
orders**, compute the number of days between their **first** and **second** order.

Orders are ordered by `order_date`; when two orders share a date, the smaller `order_id` comes
first. Return `customer_id` and `days_between` (integer days). Row order doesn't matter.

```python
def days_to_second(orders: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def days_to_second(orders: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return orders
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "order_id": [1, 2, 3, 4, 5, 6, 7],
        "customer_id": [10, 11, 10, 12, 10, 11, 13],
        "order_date": pd.to_datetime(["2025-01-05", "2025-01-06", "2025-01-20", "2025-02-01",
                                      "2025-03-01", "2025-01-06", "2025-02-02"]),
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Unsorted input; the third order must be ignored.
    yield [pd.DataFrame({
        "order_id": [9, 3, 5, 4],
        "customer_id": [1, 1, 1, 2],
        "order_date": pd.to_datetime(["2025-06-30", "2025-06-01", "2025-06-11", "2025-06-01"]),
    })]
```

## Hints

### Hint 1

Sort by `customer_id`, `order_date`, `order_id`, then number each customer's orders with
`groupby("customer_id").cumcount()` (0, 1, 2…).

### Hint 2

Rows with number 0 are first orders and rows with number 1 are second orders. Align them by
`customer_id` and subtract.

### Hint 3

The difference of two dates is a `Timedelta`; `.dt.days` gives whole days.

## Solution

```python
import pandas as pd

def days_to_second(orders: pd.DataFrame) -> pd.DataFrame:
    o = orders.sort_values(["customer_id", "order_date", "order_id"]).copy()
    o["n"] = o.groupby("customer_id").cumcount()
    first = o[o["n"] == 0].set_index("customer_id")["order_date"]
    second = o[o["n"] == 1].set_index("customer_id")["order_date"]
    days = (second - first.reindex(second.index)).dt.days
    return pd.DataFrame({"customer_id": second.index, "days_between": days.to_numpy()})
```

## Explanation

1. Sorting makes each customer's orders chronological; `cumcount()` numbers them, like SQL's
   `ROW_NUMBER() - 1`.
2. Customers with a single order have no row with `n == 1`, so they disappear naturally.
3. Indexing both Series by `customer_id` aligns first and second orders; subtracting gives a
   `Timedelta`, and `.dt.days` turns it into an integer.

**Trap:** `max - min` measures first-to-**last** order, which differs as soon as a customer
has three orders.

## Wrong Answers

```python
import pandas as pd

def days_to_second(orders):
    g = orders.groupby("customer_id")["order_date"].agg(["min", "max", "count"])
    g = g[g["count"] >= 2]
    return pd.DataFrame({"customer_id": g.index, "days_between": (g["max"] - g["min"]).dt.days.to_numpy()})
```

```python
import pandas as pd

def days_to_second(orders):
    o = orders.copy()
    o["n"] = o.groupby("customer_id").cumcount()
    first = o[o["n"] == 0].set_index("customer_id")["order_date"]
    second = o[o["n"] == 1].set_index("customer_id")["order_date"]
    days = (second - first.reindex(second.index)).dt.days
    return pd.DataFrame({"customer_id": second.index, "days_between": days.to_numpy()})
```
