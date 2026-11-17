---
id: pandas-005
slug: customers-who-never-ordered
title: Customers Who Never Ordered
section: pandas
difficulty: Easy
topics: [Anti-join, merge, isin]
company: Basketly
function: never_ordered
order_matters: true
---

## Statement

Find **Basketly** customers who have **never placed an order**.

Return `customer_id` and `name`, sorted by `customer_id`.

```python
def never_ordered(customers: pd.DataFrame, orders: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def never_ordered(customers: pd.DataFrame, orders: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return customers
```

## Data

```python
import pandas as pd

def cases():
    customers = pd.DataFrame({"customer_id": [3, 1, 2, 4], "name": ["Ines", "Joe", "Kim", "Leo"]})
    orders = pd.DataFrame({"order_id": [10, 11, 12], "customer_id": [1, 3, 1]})
    yield [customers, orders]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Orders reference an unknown customer; one customer has many orders.
    yield [
        pd.DataFrame({"customer_id": [5, 6, 7], "name": ["Ana", "Bo", "Cy"]}),
        pd.DataFrame({"order_id": [1, 2, 3, 4], "customer_id": [6, 6, 6, 99]}),
    ]
```

## Hints

### Hint 1

`customers["customer_id"].isin(orders["customer_id"])` is `True` for customers with orders.

### Hint 2

Negate a boolean mask with `~`.

## Solution

```python
import pandas as pd

def never_ordered(customers: pd.DataFrame, orders: pd.DataFrame) -> pd.DataFrame:
    has_order = customers["customer_id"].isin(orders["customer_id"])
    out = customers.loc[~has_order, ["customer_id", "name"]]
    return out.sort_values("customer_id").reset_index(drop=True)
```

## Explanation

An **anti-join** keeps rows of one table with no match in another.

- `isin` checks membership for each customer; `~` keeps the ones *not* in `orders`.
- Alternative: `customers.merge(orders, how="left", indicator=True)` and keep
  `_merge == "left_only"` (then drop duplicates and the helper column).

Note that `isin` is unaffected by orders pointing to unknown customers or by customers with
many orders.

## Wrong Answers

```python
import pandas as pd

def never_ordered(customers, orders):
    out = customers.merge(orders, on="customer_id", how="left")
    return out[["customer_id", "name"]].sort_values("customer_id")
```
