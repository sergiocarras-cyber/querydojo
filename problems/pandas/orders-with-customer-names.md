---
id: pandas-001
slug: orders-with-customer-names
title: Orders with Customer Names
section: pandas
difficulty: Easy
topics: [merge, fillna]
company: Basketly
function: orders_with_names
order_matters: true
---

## Statement

**Basketly** keeps orders and customers in two DataFrames. Support wants a single table with
the customer's name next to every order.

- Keep **every order**, even if its `customer_id` is not in `customers` (deleted accounts).
  For those, the name must be `"Unknown"`.
- Return the columns `order_id`, `name`, `amount`, sorted by `order_id`.

```python
def orders_with_names(orders: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def orders_with_names(orders: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return orders
```

## Data

```python
import pandas as pd

def cases():
    orders = pd.DataFrame({
        "order_id": [103, 101, 102, 104],
        "customer_id": [2, 1, 3, 1],
        "amount": [18.50, 42.00, 7.25, 63.10],
    })
    customers = pd.DataFrame({
        "customer_id": [1, 2],
        "name": ["Rosa Vidal", "Tom Becker"],
    })
    yield [orders, customers]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Nobody is known.
    yield [
        pd.DataFrame({"order_id": [2, 1], "customer_id": [9, 8], "amount": [1.0, 2.0]}),
        pd.DataFrame({"customer_id": [1], "name": ["Ann"]}),
    ]
    # Extra customers without orders must not create rows.
    yield [
        pd.DataFrame({"order_id": [5, 6, 7], "customer_id": [1, 1, 4], "amount": [10.0, 20.0, 30.0]}),
        pd.DataFrame({"customer_id": [1, 2, 3], "name": ["Lia", "Max", "Ivo"]}),
    ]
```

## Hints

### Hint 1

`orders.merge(customers, on="customer_id", how=...)`: which `how` keeps all rows of the left table?

### Hint 2

Unmatched rows get `NaN` in `name`; `fillna("Unknown")` fixes them.

## Solution

```python
import pandas as pd

def orders_with_names(orders: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
    merged = orders.merge(customers, on="customer_id", how="left")
    merged["name"] = merged["name"].fillna("Unknown")
    return merged.sort_values("order_id")[["order_id", "name", "amount"]].reset_index(drop=True)
```

## Explanation

1. `how="left"` keeps every order; customers only add information.
2. Orders without a matching customer get `NaN` in `name`, which `fillna("Unknown")` replaces.
3. Select the requested columns in the requested order and sort by `order_id`.

The SQL equivalent is a `LEFT JOIN` with `COALESCE(name, 'Unknown')`. With `how="inner"`
(the default), orders of deleted accounts would silently disappear.

## Wrong Answers

```python
import pandas as pd

def orders_with_names(orders, customers):
    merged = orders.merge(customers, on="customer_id")
    return merged.sort_values("order_id")[["order_id", "name", "amount"]]
```
