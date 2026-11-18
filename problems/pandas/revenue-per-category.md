---
id: pandas-002
slug: revenue-per-category
title: Revenue per Category
section: pandas
difficulty: Easy
topics: [merge, groupby, sort_values]
company: Cartwell Marketplace
function: revenue_per_category
order_matters: true
---

## Statement

Compute **Cartwell**'s revenue per product category. Revenue of a sale is
`price × quantity`, with `price` taken from `products`.

Return `category` and `revenue` for categories with at least one sale, sorted by `revenue`
descending and then by `category` ascending.

```python
def revenue_per_category(products: pd.DataFrame, sales: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def revenue_per_category(products: pd.DataFrame, sales: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return products
```

## Data

```python
import pandas as pd

def cases():
    products = pd.DataFrame({
        "product_id": [1, 2, 3, 4],
        "category": ["kitchen", "garden", "kitchen", "toys"],
        "price": [12.0, 30.0, 5.5, 8.0],
    })
    sales = pd.DataFrame({
        "sale_id": [10, 11, 12, 13, 14],
        "product_id": [1, 3, 2, 1, 3],
        "quantity": [2, 4, 1, 1, 2],
    })
    yield [products, sales]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Tie on revenue -> alphabetical; quantity matters.
    yield [
        pd.DataFrame({"product_id": [1, 2, 3], "category": ["b", "a", "c"], "price": [10.0, 5.0, 100.0]}),
        pd.DataFrame({"sale_id": [1, 2, 3], "product_id": [1, 2, 3], "quantity": [3, 6, 1]}),
    ]
```

## Hints

### Hint 1

Merge `sales` with `products` on `product_id` to bring in `price` and `category`.

### Hint 2

Create a `revenue` column, then `groupby("category", as_index=False)["revenue"].sum()`.

### Hint 3

`sort_values(["revenue", "category"], ascending=[False, True])`.

## Solution

```python
import pandas as pd

def revenue_per_category(products: pd.DataFrame, sales: pd.DataFrame) -> pd.DataFrame:
    df = sales.merge(products, on="product_id")
    df["revenue"] = df["price"] * df["quantity"]
    out = df.groupby("category", as_index=False)["revenue"].sum()
    return out.sort_values(["revenue", "category"], ascending=[False, True]).reset_index(drop=True)
```

## Explanation

1. The inner merge attaches price and category to each sale (products without sales vanish,
   as required).
2. Revenue per row is `price × quantity`.
3. `groupby(..., as_index=False)` returns `category` as a normal column instead of the index.
4. Sorting by two keys with different directions needs a list in `ascending`.

## Wrong Answers

### Summing prices instead of revenue

Revenue is `price * quantity` per sale. Summing `price` ignores how many units were sold.

```python
import pandas as pd

def revenue_per_category(products, sales):
    df = sales.merge(products, on="product_id")
    out = df.groupby("category", as_index=False)["price"].sum().rename(columns={"price": "revenue"})
    return out.sort_values(["revenue", "category"], ascending=[False, True])
```

### Categories without sales appear

Starting from `products` with a left merge adds categories with revenue 0. Only categories with sales belong in the result: start from `sales`.

```python
import pandas as pd

def revenue_per_category(products, sales):
    # Starts from products: categories without sales show up with revenue 0.
    df = products.merge(sales, on="product_id", how="left")
    df["revenue"] = (df["price"] * df["quantity"]).fillna(0)
    out = df.groupby("category", as_index=False)["revenue"].sum()
    return out.sort_values(["revenue", "category"], ascending=[False, True])
```
