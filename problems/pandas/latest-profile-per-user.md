---
id: pandas-013
slug: latest-profile-per-user
title: Latest Profile per User
section: pandas
difficulty: Medium
topics: [Deduplication, sort_values, drop_duplicates]
company: Habitly
function: latest_profiles
---

## Statement

**Habitly** stores every profile change as a new row in `updates` (`update_id`, `user_id`,
`updated_at`, `email`, `plan`). Build the **current** profile of each user: their latest
update.

If two updates of the same user have the same `updated_at`, the one with the larger
`update_id` wins.

Return `user_id`, `email`, `plan`. Row order doesn't matter.

```python
def latest_profiles(updates: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def latest_profiles(updates: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return updates
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "update_id": [1, 2, 3, 4, 5],
        "user_id": [100, 101, 100, 102, 101],
        "updated_at": pd.to_datetime(["2025-01-01 10:00", "2025-01-02 09:00", "2025-02-15 08:30",
                                      "2025-02-20 12:00", "2025-01-01 07:00"]),
        "email": ["a@old.io", "b@site.io", "a@new.io", "c@site.io", "b@older.io"],
        "plan": ["free", "free", "pro", "pro", "free"],
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Same timestamp twice: the larger update_id wins, even though it comes first in the frame.
    yield [pd.DataFrame({
        "update_id": [8, 7, 6],
        "user_id": [5, 5, 5],
        "updated_at": pd.to_datetime(["2025-03-01 12:00", "2025-03-01 12:00", "2025-02-01 12:00"]),
        "email": ["winner@x.io", "loser@x.io", "old@x.io"],
        "plan": ["team", "pro", "free"],
    })]
```

## Hints

### Hint 1

Sort so that each user's preferred row comes **last** (or first), then use `drop_duplicates`.

### Hint 2

Sorting by `["user_id", "updated_at", "update_id"]` puts the winner last within each user.

## Solution

```python
import pandas as pd

def latest_profiles(updates: pd.DataFrame) -> pd.DataFrame:
    ordered = updates.sort_values(["user_id", "updated_at", "update_id"])
    latest = ordered.drop_duplicates("user_id", keep="last")
    return latest[["user_id", "email", "plan"]].reset_index(drop=True)
```

## Explanation

"Latest row per key" is a very common cleaning step:

1. Sort by key, then by recency, then by the tie-breaker.
2. `drop_duplicates(subset, keep="last")` keeps the last row of each key, which after the sort
   is the most recent one.

Equivalent alternatives: `updates.loc[updates.groupby("user_id")["updated_at"].idxmax()]` (but
`idxmax` ignores the tie-breaker), or a SQL-style `ROW_NUMBER` with
`groupby(...).cumcount(ascending=False) == 0`.

## Wrong Answers

### Not sorted before keeping the last

`drop_duplicates(keep='last')` keeps the last row in the current order, which is not necessarily the latest update. Sort by `updated_at` first.

```python
import pandas as pd

def latest_profiles(updates):
    latest = updates.drop_duplicates("user_id", keep="last")
    return latest[["user_id", "email", "plan"]]
```

### Ties on the timestamp

Two updates can share `updated_at`. Break the tie with `update_id` when sorting.

```python
import pandas as pd

def latest_profiles(updates):
    latest = updates.sort_values(["user_id", "updated_at"]).drop_duplicates("user_id", keep="last")
    return latest[["user_id", "email", "plan"]]
```
