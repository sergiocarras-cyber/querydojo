---
id: pandas-016
slug: fix-ai-vat
title: "Fix the AI: Add VAT to EU Orders"
section: pandas
difficulty: Easy
topics: [AI code review, Chained assignment, loc, Copy-on-Write]
company: Basketly
ai_review: true
function: add_gross
order_matters: true
---

## Statement

**Basketly** stores order amounts without tax (`net`). Orders shipped to the `EU` region pay
**21 % VAT**; other regions pay none. Finance needs the `gross` amount of each order.

An AI assistant wrote the function in the editor. It runs without errors, but `gross` always equals
`net`: no VAT is ever added.

**Find the bug and fix the function.** Return `order_id`, `net` and `gross` (rounded to 2 decimals),
sorted by `order_id`.

```python
def add_gross(orders: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

# Written by an AI assistant. It runs, but gross is always equal to net.
def add_gross(orders):
    orders["gross"] = orders["net"]
    orders[orders["region"] == "EU"]["gross"] = orders["net"] * 1.21
    return orders[["order_id", "net", "gross"]].round(2)
```

## Data

```python
import pandas as pd

def cases():
    orders = pd.DataFrame({
        "order_id": [1, 2, 3, 4],
        "region": ["EU", "US", "EU", "UK"],
        "net": [100.0, 50.0, 19.99, 10.0],
    })
    yield [orders]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Rows out of order, and only EU orders.
    yield [pd.DataFrame({
        "order_id": [9, 7, 8],
        "region": ["EU", "EU", "EU"],
        "net": [1.0, 250.5, 0.0],
    })]
```

## Hints

### Hint 1

`orders[mask]` returns a **new** DataFrame. What happens when you assign a column on that new object?

### Hint 2

Since pandas 3 (Copy-on-Write), chained assignment like `df[mask]["col"] = ...` never changes `df`.

### Hint 3

Select rows and column in one step: `df.loc[mask, "gross"] = ...`.

## Solution

```python
import pandas as pd

def add_gross(orders: pd.DataFrame) -> pd.DataFrame:
    out = orders.copy()
    out["gross"] = out["net"]
    eu = out["region"] == "EU"
    out.loc[eu, "gross"] = out.loc[eu, "net"] * 1.21
    out = out.sort_values("order_id")
    return out[["order_id", "net", "gross"]].round(2).reset_index(drop=True)
```

## Explanation

`orders[orders["region"] == "EU"]` builds a **new** DataFrame; `["gross"] = ...` then modifies that
temporary copy, which is thrown away. This is **chained assignment**. Older pandas sometimes modified
the original and printed a `SettingWithCopyWarning`; with Copy-on-Write (the default since pandas 3)
it never does.

`df.loc[mask, "gross"] = ...` selects rows and column in a single operation on the original
DataFrame, so the update sticks. `numpy.where` or `Series.where` work too.

AI assistants trained on older code still write the chained form often, so it's worth checking in
every review.

## Wrong Answers

### The AI's original function

Your result is the same as the AI's: `gross` is still equal to `net` for EU orders. Is the assignment
changing `orders`, or a temporary copy of it?

```python
import pandas as pd

def add_gross(orders):
    orders["gross"] = orders["net"]
    orders[orders["region"] == "EU"]["gross"] = orders["net"] * 1.21
    return orders[["order_id", "net", "gross"]].round(2)
```

### VAT applied to every order

Only orders from the `EU` region pay VAT. Apply the 1.21 factor to EU rows only.

```python
import pandas as pd

def add_gross(orders):
    out = orders.copy()
    out["gross"] = out["net"] * 1.21
    return out.sort_values("order_id")[["order_id", "net", "gross"]].round(2)
```
