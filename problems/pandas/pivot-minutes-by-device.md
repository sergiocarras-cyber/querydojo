---
id: pandas-008
slug: pivot-minutes-by-device
title: Minutes Watched by Device
section: pandas
difficulty: Medium
topics: [pivot_table, Reshaping]
company: Lumora Stream
function: minutes_by_device
order_matters: true
---

## Statement

**Lumora Stream** logs viewing sessions as rows (`user_id`, `device`, `minutes`). Product wants
a **wide** table: one row per user and one column per device.

- Columns: `user_id`, then one column per device that appears in the data, **in alphabetical
  order**, then `total`.
- Each device column holds the total minutes of that user on that device, `0` if none.
- `total` is the sum across devices.
- Sort by `user_id`.

```python
def minutes_by_device(plays: pd.DataFrame) -> pd.DataFrame:
```

### Example output

| user_id | mobile | tv | web | total |
| --- | --- | --- | --- | --- |
| 1 | 30 | 95 | 0 | 125 |

## Starter

```python
import pandas as pd

def minutes_by_device(plays: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return plays
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "user_id": [1, 1, 2, 1, 3, 2, 3],
        "device": ["tv", "mobile", "web", "tv", "tv", "web", "mobile"],
        "minutes": [60, 30, 45, 35, 120, 15, 20],
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # A different set of devices, and a user with a single session.
    yield [pd.DataFrame({
        "user_id": [9, 8, 9],
        "device": ["console", "tablet", "tablet"],
        "minutes": [50, 10, 5],
    })]
```

## Hints

### Hint 1

`pivot_table(index="user_id", columns="device", values="minutes", aggfunc="sum", fill_value=0)`.

### Hint 2

`pivot` (without `_table`) fails when a user has two sessions on the same device: it can't
aggregate.

### Hint 3

After pivoting, `reset_index()` turns `user_id` back into a column and
`df.columns.name = None` removes the leftover `device` label.

## Solution

```python
import pandas as pd

def minutes_by_device(plays: pd.DataFrame) -> pd.DataFrame:
    wide = plays.pivot_table(
        index="user_id", columns="device", values="minutes", aggfunc="sum", fill_value=0
    )
    devices = sorted(wide.columns)
    wide = wide[devices]
    wide["total"] = wide.sum(axis=1)
    wide = wide.reset_index()
    wide.columns.name = None
    return wide.sort_values("user_id").reset_index(drop=True)
```

## Explanation

`pivot_table` reshapes long → wide and aggregates duplicates in one step:

- `index` becomes the rows, `columns` the new column headers, `values` what fills the cells.
- `aggfunc="sum"` adds up repeated (user, device) pairs; `fill_value=0` replaces missing
  combinations, which would otherwise be `NaN`.
- The device columns come out sorted, but sorting explicitly documents the requirement.
- `sum(axis=1)` adds across columns for the `total`.

The inverse operation (wide → long) is `melt`.

## Wrong Answers

```python
import pandas as pd

def minutes_by_device(plays):
    wide = plays.pivot_table(index="user_id", columns="device", values="minutes", aggfunc="sum")
    wide["total"] = wide.sum(axis=1)
    wide = wide.reset_index()
    wide.columns.name = None
    return wide
```

```python
import pandas as pd

def minutes_by_device(plays):
    wide = plays.pivot_table(index="user_id", columns="device", values="minutes", aggfunc="max", fill_value=0)
    wide["total"] = wide.sum(axis=1)
    wide = wide.reset_index()
    wide.columns.name = None
    return wide
```
