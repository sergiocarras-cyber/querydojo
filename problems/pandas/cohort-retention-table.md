---
id: pandas-015
slug: cohort-retention-table
title: Monthly Cohort Retention Table
section: pandas
difficulty: Hard
topics: [Cohorts, Retention, Dates, merge]
company: Lumora Stream
function: retention_table
order_matters: true
---

## Statement

**Lumora Stream** groups subscribers into **monthly cohorts** by signup month. A user is
**retained in month *k*** if they have at least one activity in the calendar month that is *k*
months after their signup month (signup in January → month 1 is February, month 2 is March).

For each cohort return:

| column | meaning |
| --- | --- |
| `cohort` | signup month, `"YYYY-MM"` |
| `cohort_size` | users who signed up that month |
| `month_1` | % of the cohort retained in month 1, rounded to 1 decimal |
| `month_2` | % of the cohort retained in month 2, rounded to 1 decimal |

Cohorts with no retained users show `0.0`. Sort by `cohort`.

```python
def retention_table(users: pd.DataFrame, activity: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

def retention_table(users: pd.DataFrame, activity: pd.DataFrame) -> pd.DataFrame:
    # Your code here
    return users
```

## Data

```python
import pandas as pd

def cases():
    users = pd.DataFrame({
        "user_id": [1, 2, 3, 4, 5],
        "signup_date": pd.to_datetime(["2025-01-05", "2025-01-28", "2025-01-31", "2025-02-10", "2025-02-11"]),
    })
    activity = pd.DataFrame({
        "user_id": [1, 1, 2, 3, 3, 4, 4, 1],
        "activity_date": pd.to_datetime(["2025-02-01", "2025-02-20", "2025-03-03", "2025-02-28",
                                         "2025-03-31", "2025-02-12", "2025-04-01", "2025-01-06"]),
    })
    yield [users, activity]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # Year boundary (Dec -> Jan, Feb) and a cohort with no activity at all.
    users = pd.DataFrame({
        "user_id": [1, 2, 3],
        "signup_date": pd.to_datetime(["2024-12-31", "2024-12-01", "2025-03-15"]),
    })
    activity = pd.DataFrame({
        "user_id": [1, 2, 2],
        "activity_date": pd.to_datetime(["2025-01-01", "2025-02-28", "2025-02-01"]),
    })
    yield [users, activity]
```

## Hints

### Hint 1

Calendar-month distance is `(year2 * 12 + month2) - (year1 * 12 + month1)`. Day counts like
"30 days" don't work: Jan 31 → Feb 1 is month 1.

### Hint 2

Attach each user's signup month to their activity rows with a merge, compute `k`, and collect
the **distinct** users with `k == 1` (and `k == 2`).

### Hint 3

Count retained users per cohort, divide by the cohort size, and use `fillna(0)` for cohorts
nobody came back to.

## Solution

```python
import pandas as pd

def retention_table(users: pd.DataFrame, activity: pd.DataFrame) -> pd.DataFrame:
    u = users.copy()
    u["cohort"] = u["signup_date"].dt.strftime("%Y-%m")
    u["signup_m"] = u["signup_date"].dt.year * 12 + u["signup_date"].dt.month
    a = activity.merge(u[["user_id", "signup_m"]], on="user_id")
    a["k"] = a["activity_date"].dt.year * 12 + a["activity_date"].dt.month - a["signup_m"]

    size = u.groupby("cohort")["user_id"].nunique()
    out = pd.DataFrame({"cohort": size.index, "cohort_size": size.to_numpy()})
    for k in (1, 2):
        retained_ids = a.loc[a["k"] == k, "user_id"].unique()
        retained = u[u["user_id"].isin(retained_ids)].groupby("cohort")["user_id"].nunique()
        out[f"month_{k}"] = (out["cohort"].map(retained).fillna(0) / out["cohort_size"] * 100).round(1)
    return out.sort_values("cohort").reset_index(drop=True)
```

## Explanation

1. **Cohort and month index.** `year * 12 + month` turns a date into a single month number, so
   the difference between two of them is the number of calendar months, across year ends too.
2. **Months since signup.** Merge activity with the user's signup month and compute `k`.
3. **Distinct retained users.** A user with many events in month 1 counts once: take the unique
   ids with `k == 1`, then count them per cohort.
4. **Percentages.** `map` aligns the counts to each cohort; cohorts nobody came back to get
   `NaN`, hence `fillna(0)`.

In the example, January's cohort has users 1, 2, 3: users 1 and 3 were active in February
(66.7 %) and users 2 and 3 in March (66.7 %).

## Wrong Answers

### Month offset from days / 30

Calendar months are not 30-day blocks. Compute `year * 12 + month` for both dates and subtract.

```python
import pandas as pd

def retention_table(users, activity):
    u = users.copy()
    u["cohort"] = u["signup_date"].dt.strftime("%Y-%m")
    a = activity.merge(u, on="user_id")
    a["k"] = (a["activity_date"] - a["signup_date"]).dt.days // 30
    size = u.groupby("cohort")["user_id"].nunique()
    out = pd.DataFrame({"cohort": size.index, "cohort_size": size.to_numpy()})
    for k in (1, 2):
        ids = a.loc[a["k"] == k, "user_id"].unique()
        r = u[u["user_id"].isin(ids)].groupby("cohort")["user_id"].nunique()
        out[f"month_{k}"] = (out["cohort"].map(r).fillna(0) / out["cohort_size"] * 100).round(1)
    return out
```

### Counting activity rows instead of users

`count()` counts activity rows, so a user active several times in the month counts several times. Count distinct users.

```python
import pandas as pd

def retention_table(users, activity):
    u = users.copy()
    u["cohort"] = u["signup_date"].dt.strftime("%Y-%m")
    u["signup_m"] = u["signup_date"].dt.year * 12 + u["signup_date"].dt.month
    a = activity.merge(u[["user_id", "signup_m", "cohort"]], on="user_id")
    a["k"] = a["activity_date"].dt.year * 12 + a["activity_date"].dt.month - a["signup_m"]
    size = u.groupby("cohort")["user_id"].nunique()
    out = pd.DataFrame({"cohort": size.index, "cohort_size": size.to_numpy()})
    for k in (1, 2):
        r = a[a["k"] == k].groupby("cohort")["user_id"].count()
        out[f"month_{k}"] = (out["cohort"].map(r).fillna(0) / out["cohort_size"] * 100).round(1)
    return out
```
