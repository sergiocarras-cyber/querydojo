---
id: pandas-014
slug: sessionize-clickstream
title: Sessionize the Clickstream
section: pandas
difficulty: Hard
topics: [Sessionization, diff, cumsum, groupby]
company: Cartwell Marketplace
function: session_stats
---

## Statement

**Cartwell** logs every click (`user_id`, `ts`), unsorted. A **session** is a run of clicks
of the same user where consecutive clicks are **at most 30 minutes apart**; a gap of more than
30 minutes starts a new session.

The **length** of a session is the time between its first and last click, in minutes (a
single-click session lasts 0 minutes).

For each user return:

| column | meaning |
| --- | --- |
| `user_id` | the user |
| `sessions` | number of sessions |
| `avg_session_minutes` | mean session length, rounded to 1 decimal |

Row order doesn't matter.

```python
def session_stats(clicks: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def session_stats(clicks: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return clicks
```

## Data

```python
import pandas as pd

def cases():
    yield [pd.DataFrame({
        "user_id": [1, 1, 1, 1, 2, 2, 1],
        "ts": pd.to_datetime([
            "2025-05-01 10:00", "2025-05-01 10:10", "2025-05-01 10:25",
            "2025-05-01 11:30", "2025-05-01 09:00", "2025-05-01 09:45", "2025-05-01 11:40",
        ]),
    })]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Exactly 30 minutes keeps the session; 30 min 1 s splits it. Input is unsorted.
    yield [pd.DataFrame({
        "user_id": [7, 7, 7, 7, 8, 8, 8],
        "ts": pd.to_datetime(["2025-06-01 12:30:00", "2025-06-01 12:00:00", "2025-06-01 13:00:01", "2025-06-01 13:10:01",
                              "2025-06-02 10:00:00", "2025-06-02 11:00:00", "2025-06-02 10:20:00"]),
    })]
```

## Hints

### Hint 1

Sort by `user_id` and `ts`, then `groupby("user_id")["ts"].diff()` gives the gap to the
previous click of the same user (`NaT` for the first click).

### Hint 2

A click starts a new session when its gap is `NaT` or greater than 30 minutes. Turn that into
`1`/`0` and take a cumulative sum per user: that's a session number.

### Hint 3

Group by `(user_id, session)` to get each session's first and last click, then aggregate again
per user.

## Solution

```python
import pandas as pd

def session_stats(clicks: pd.DataFrame) -> pd.DataFrame:
    c = clicks.sort_values(["user_id", "ts"]).copy()
    gap = c.groupby("user_id")["ts"].diff()
    starts = (gap.isna() | (gap > pd.Timedelta(minutes=30))).astype(int)
    c["session"] = starts.groupby(c["user_id"]).cumsum()
    per_session = c.groupby(["user_id", "session"])["ts"].agg(["min", "max"])
    per_session["minutes"] = (per_session["max"] - per_session["min"]).dt.total_seconds() / 60
    out = (
        per_session.groupby("user_id")["minutes"]
        .agg(sessions="size", avg_session_minutes="mean")
        .reset_index()
    )
    out["avg_session_minutes"] = out["avg_session_minutes"].round(1)
    return out
```

## Explanation

**Sessionization** is the gaps-and-islands pattern applied to time:

1. **Gaps.** After sorting, `diff()` within each user gives the time since the previous click.
2. **Session starts.** A click begins a session if it's the user's first click (`NaT`) or the gap
   exceeds 30 minutes. Note the strict `>`: exactly 30 minutes stays in the same session.
3. **Session ids.** The cumulative sum of the start flags increases by one at every start, so all
   clicks of one session share a number.
4. **Aggregate twice.** First per session (first/last click → length), then per user (count and
   mean).

In the example, user 1 has sessions 10:00–10:25 (25 min) and 11:30–11:40 (10 min), so
`avg = 17.5`; user 2's clicks are 45 minutes apart, so two 0-minute sessions.

## Wrong Answers

```python
import pandas as pd

def session_stats(clicks):
    c = clicks.sort_values(["user_id", "ts"]).copy()
    gap = c.groupby("user_id")["ts"].diff()
    starts = (gap.isna() | (gap >= pd.Timedelta(minutes=30))).astype(int)
    c["session"] = starts.groupby(c["user_id"]).cumsum()
    s = c.groupby(["user_id", "session"])["ts"].agg(["min", "max"])
    s["minutes"] = (s["max"] - s["min"]).dt.total_seconds() / 60
    out = s.groupby("user_id")["minutes"].agg(sessions="size", avg_session_minutes="mean").reset_index()
    out["avg_session_minutes"] = out["avg_session_minutes"].round(1)
    return out
```

```python
import pandas as pd

def session_stats(clicks):
    c = clicks.copy()
    gap = c.groupby("user_id")["ts"].diff()
    starts = (gap.isna() | (gap > pd.Timedelta(minutes=30))).astype(int)
    c["session"] = starts.groupby(c["user_id"]).cumsum()
    s = c.groupby(["user_id", "session"])["ts"].agg(["min", "max"])
    s["minutes"] = (s["max"] - s["min"]).dt.total_seconds() / 60
    out = s.groupby("user_id")["minutes"].agg(sessions="size", avg_session_minutes="mean").reset_index()
    out["avg_session_minutes"] = out["avg_session_minutes"].round(1)
    return out
```
