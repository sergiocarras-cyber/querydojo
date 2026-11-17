---
id: pandas-011
slug: rolling-signups
title: 7-Day Rolling Signups
section: pandas
difficulty: Medium
topics: [rolling, Dates, reindex, Window functions]
company: Chirpnest
function: rolling_signups
order_matters: true
---

## Statement

**Chirpnest** wants a smoothed signup chart. Given `signups` (`user_id`, `signup_date`):

1. Count signups per **calendar day**, from the first to the last signup date, **including days
   with zero signups**.
2. Add `avg_7d`: the mean of the daily counts over the last 7 days **including the current
   one**. For the first days, average over the days available so far.
3. Round `avg_7d` to 2 decimals.

Return `date`, `signups`, `avg_7d`, sorted by `date`.

```python
def rolling_signups(signups: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def rolling_signups(signups: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return signups
```

## Data

```python
import pandas as pd

def cases():
    dates = ["2025-04-01", "2025-04-01", "2025-04-02", "2025-04-04", "2025-04-04", "2025-04-04",
             "2025-04-07", "2025-04-08", "2025-04-09", "2025-04-09"]
    yield [pd.DataFrame({"user_id": range(1, len(dates) + 1), "signup_date": pd.to_datetime(dates)})]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # A long gap: the window must count the empty days as zeros.
    dates = ["2025-01-01"] * 7 + ["2025-01-10"]
    yield [pd.DataFrame({"user_id": range(len(dates)), "signup_date": pd.to_datetime(dates)})]
```

## Hints

### Hint 1

`groupby("signup_date").size()` counts per day, but days without signups are simply missing.

### Hint 2

`pd.date_range(start, end, freq="D")` plus `reindex(..., fill_value=0)` fills the gaps.

### Hint 3

`rolling(7, min_periods=1).mean()` averages the current row and the 6 before it.

## Solution

```python
import pandas as pd

def rolling_signups(signups: pd.DataFrame) -> pd.DataFrame:
    daily = signups.groupby(signups["signup_date"].dt.normalize()).size()
    days = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    daily = daily.reindex(days, fill_value=0)
    out = pd.DataFrame({"date": days, "signups": daily.to_numpy()})
    out["avg_7d"] = out["signups"].rolling(7, min_periods=1).mean().round(2)
    return out
```

## Explanation

1. **Count per day.** `dt.normalize()` drops any time component so all signups of a day group
   together.
2. **Fill missing days.** A rolling window over *rows* is only a window over *days* if every
   day has a row. `reindex` on a full `date_range` inserts the missing days with 0.
3. **Rolling mean.** `rolling(7)` looks at the current row and the 6 previous ones;
   `min_periods=1` allows partial windows at the start instead of returning `NaN`.

Alternative: with a `DatetimeIndex` you can use a time-based window, `rolling("7D")`, which
handles gaps by itself (but you still need the zero rows for the output).

## Wrong Answers

```python
import pandas as pd

def rolling_signups(signups):
    daily = signups.groupby("signup_date").size().reset_index(name="signups")
    daily = daily.rename(columns={"signup_date": "date"})
    daily["avg_7d"] = daily["signups"].rolling(7, min_periods=1).mean().round(2)
    return daily
```

```python
import pandas as pd

def rolling_signups(signups):
    daily = signups.groupby(signups["signup_date"].dt.normalize()).size()
    days = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    daily = daily.reindex(days, fill_value=0)
    out = pd.DataFrame({"date": days, "signups": daily.to_numpy()})
    out["avg_7d"] = out["signups"].rolling(7).mean().round(2)
    return out
```
