---
id: pandas-006
slug: fill-missing-ratings
title: Fill Missing Ratings
section: pandas
difficulty: Medium
topics: [Data cleaning, groupby, transform, fillna]
company: Shelfie Books
function: fill_ratings
---

## Statement

**Shelfie Books** imports reviews from partners, and some ratings arrive empty (`NaN`).
Before training a model, fill them in:

1. A missing rating gets the **mean rating of its category** (computed from the known ratings).
2. If a category has **no known ratings at all**, use the **overall mean** of all known ratings.
3. Round every rating (filled or not) to **2 decimals**.

Return `review_id` and `rating`. Row order doesn't matter.

```python
def fill_ratings(reviews: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def fill_ratings(reviews: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return reviews
```

## Data

```python
import numpy as np
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "review_id": [1, 2, 3, 4, 5, 6],
        "category": ["sci-fi", "sci-fi", "sci-fi", "poetry", "poetry", "history"],
        "rating": [4.0, np.nan, 5.0, 3.0, np.nan, np.nan],
    })]
```

## Hidden Data

```python
import numpy as np
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "review_id": [1, 2, 3, 4, 5],
        "category": ["a", "a", "a", "b", "c"],
        "rating": [1.0, 2.0, np.nan, 4.5, np.nan],
    })]
```

## Hints

### Hint 1

`groupby("category")["rating"].transform("mean")` returns a Series aligned with the original
rows: each row gets its category's mean.

### Hint 2

`fillna` accepts a Series: `rating.fillna(category_mean)`. Chain a second `fillna` with the
overall mean for categories that are entirely missing.

## Solution

```python
import pandas as pd

def fill_ratings(reviews: pd.DataFrame) -> pd.DataFrame:
    category_mean = reviews.groupby("category")["rating"].transform("mean")
    overall_mean = reviews["rating"].mean()
    rating = reviews["rating"].fillna(category_mean).fillna(overall_mean).round(2)
    return pd.DataFrame({"review_id": reviews["review_id"], "rating": rating})
```

## Explanation

- `transform("mean")` computes the mean per group but **broadcasts it back** to the original
  shape (unlike `agg`, which returns one row per group). Means ignore `NaN` by default.
- For a category with only `NaN` ratings, its mean is `NaN` too, so a second `fillna` with the
  overall mean covers that case.
- Rounding at the end applies to all values.

In the example, sci-fi's mean is 4.5, poetry's 3.0 and history has no known rating, so it gets
the overall mean (4 + 5 + 3) / 3 = 4.0.

## Wrong Answers

```python
import pandas as pd

def fill_ratings(reviews):
    rating = reviews["rating"].fillna(reviews["rating"].mean()).round(2)
    return pd.DataFrame({"review_id": reviews["review_id"], "rating": rating})
```

```python
import pandas as pd

def fill_ratings(reviews):
    category_mean = reviews.groupby("category")["rating"].transform("mean")
    rating = reviews["rating"].fillna(category_mean).round(2)
    return pd.DataFrame({"review_id": reviews["review_id"], "rating": rating})
```
