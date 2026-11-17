---
id: pandas-007
slug: monthly-active-users
title: Monthly Active Users
section: pandas
difficulty: Medium
topics: [Dates, groupby, nunique]
company: Habitly
function: monthly_active_users
order_matters: true
---

## Statement

**Habitly** logs every app event in `events` (`user_id`, `event_time`). A user is **active**
in a month if they have at least one event that month.

Return `month` (a string `"YYYY-MM"`) and `active_users` (number of distinct active users),
sorted by `month`.

```python
def monthly_active_users(events: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def monthly_active_users(events: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return events
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "user_id": [1, 1, 2, 3, 1, 2, 2],
        "event_time": pd.to_datetime([
            "2025-01-03 08:00", "2025-01-20 21:10", "2025-01-31 23:59",
            "2025-02-01 00:00", "2025-02-14 12:00", "2025-03-02 09:30", "2025-03-28 18:45",
        ]),
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Same month in different years must not be merged.
    yield [pd.DataFrame({
        "user_id": [1, 2, 1, 1],
        "event_time": pd.to_datetime(["2024-12-31 23:00", "2025-12-01 10:00", "2025-12-15 10:00", "2025-12-16 10:00"]),
    })]
```

## Hints

### Hint 1

`events["event_time"].dt.strftime("%Y-%m")` (or `.dt.to_period("M")`) gives the month key.

### Hint 2

`nunique()` counts distinct values; `count()` or `size()` would count events.

## Solution

```python
import pandas as pd

def monthly_active_users(events: pd.DataFrame) -> pd.DataFrame:
    month = events["event_time"].dt.strftime("%Y-%m")
    out = (
        events.assign(month=month)
        .groupby("month", as_index=False)["user_id"].nunique()
        .rename(columns={"user_id": "active_users"})
    )
    return out.sort_values("month").reset_index(drop=True)
```

## Explanation

1. Build a month key that includes the **year** (`"%Y-%m"`); `dt.month` alone would mix
   December 2024 with December 2025.
2. Group by it and count **distinct** users with `nunique`.
3. `"YYYY-MM"` strings sort chronologically, so a plain `sort_values` works.

## Wrong Answers

```python
import pandas as pd

def monthly_active_users(events):
    month = events["event_time"].dt.strftime("%Y-%m")
    out = events.assign(month=month).groupby("month", as_index=False)["user_id"].count()
    return out.rename(columns={"user_id": "active_users"})
```

```python
import pandas as pd

def monthly_active_users(events):
    month = events["event_time"].dt.month.map(lambda m: f"2025-{m:02d}")
    out = events.assign(month=month).groupby("month", as_index=False)["user_id"].nunique()
    return out.rename(columns={"user_id": "active_users"})
```
