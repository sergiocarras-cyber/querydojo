---
id: pandas-009
slug: top-products-per-category
title: Top Products per Category
section: pandas
difficulty: Medium
topics: [groupby, rank, Top-N per group]
company: Cartwell Marketplace
function: top_products
order_matters: true
---

## Statement

`sales` has one row per sale line (`product`, `category`, `units`); a product can appear many
times. **Cartwell** wants the **top 2 products per category** by total units.

- Rank products inside each category by total units, highest first. Ties share the same rank
  and ranks have **no gaps** (1, 1, 2…). Keep ranks 1 and 2.
- Return `category`, `product`, `units` (total), `rank` (integer), sorted by `category`,
  `rank`, `product`.

```python
def top_products(sales: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def top_products(sales: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return sales
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "product": ["mug", "kettle", "mug", "pan", "lamp", "rug", "lamp", "vase"],
        "category": ["kitchen", "kitchen", "kitchen", "kitchen", "decor", "decor", "decor", "decor"],
        "units": [4, 10, 6, 3, 2, 9, 1, 5],
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Three-way tie for first place, then a single product.
    yield [pd.DataFrame({
        "product": ["a", "b", "c", "d", "e"],
        "category": ["x", "x", "x", "x", "y"],
        "units": [5, 5, 5, 1, 7],
    })]
```

## Hints

### Hint 1

Aggregate first: `groupby(["category", "product"], as_index=False)["units"].sum()`.

### Hint 2

`groupby("category")["units"].rank(method="dense", ascending=False)` ranks within each category.

### Hint 3

`rank` returns floats; convert with `.astype(int)`.

## Solution

```python
import pandas as pd

def top_products(sales: pd.DataFrame) -> pd.DataFrame:
    totals = sales.groupby(["category", "product"], as_index=False)["units"].sum()
    totals["rank"] = (
        totals.groupby("category")["units"].rank(method="dense", ascending=False).astype(int)
    )
    top = totals[totals["rank"] <= 2]
    return top.sort_values(["category", "rank", "product"]).reset_index(drop=True)
```

## Explanation

The pandas version of SQL's `DENSE_RANK() OVER (PARTITION BY category ORDER BY units DESC)`:

1. Sum units per product first: ranking raw sale lines would rank rows, not products.
2. `groupby(...).rank(method="dense", ascending=False)` ranks within each category.
   `method` controls ties: `"min"` gives 1, 1, 3; `"first"` breaks ties by position; `"dense"`
   gives 1, 1, 2.
3. Filter, then sort as requested.

In the kitchen example, kettle and mug both total 10 units (rank 1) and pan has 3 (rank 2).

## Wrong Answers

```python
import pandas as pd

def top_products(sales):
    totals = sales.groupby(["category", "product"], as_index=False)["units"].sum()
    totals["rank"] = totals.groupby("category")["units"].rank(method="min", ascending=False).astype(int)
    top = totals[totals["rank"] <= 2]
    return top.sort_values(["category", "rank", "product"])
```

```python
import pandas as pd

def top_products(sales):
    s = sales.copy()
    s["rank"] = s.groupby("category")["units"].rank(method="dense", ascending=False).astype(int)
    top = s[s["rank"] <= 2][["category", "product", "units", "rank"]]
    return top.sort_values(["category", "rank", "product"])
```
