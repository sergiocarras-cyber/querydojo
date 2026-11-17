---
id: sql-022
slug: monthly-plays-by-device
title: Monthly Plays by Device (Pivot)
section: sql
difficulty: Medium
topics: [Pivot, Conditional aggregation, FILTER, Dates]
company: Tunely
order_matters: true
---

## Statement

**Tunely** wants a monthly dashboard with **one column per device**. For each month that has at
least one play, return:

| column | meaning |
| --- | --- |
| `month` | first day of the month (`DATE`) |
| `mobile` | plays on `mobile` |
| `desktop` | plays on `desktop` |
| `smart_tv` | plays on `smart_tv` |

Months where a device had no plays show `0`. Sort by `month`.

## Schema

```sql
CREATE TABLE plays (
  play_id   INTEGER PRIMARY KEY,
  device    TEXT NOT NULL CHECK (device IN ('mobile', 'desktop', 'smart_tv')),
  played_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO plays VALUES
  (1, 'mobile',   '2025-01-02 08:00'),
  (2, 'mobile',   '2025-01-15 21:00'),
  (3, 'desktop',  '2025-01-20 10:00'),
  (4, 'smart_tv', '2025-01-31 22:30'),
  (5, 'smart_tv', '2025-02-01 19:00'),
  (6, 'smart_tv', '2025-02-14 20:00'),
  (7, 'mobile',   '2025-03-05 07:45');
```

## Hidden Data

```sql
INSERT INTO plays VALUES
  (1, 'desktop', '2025-06-01 00:00'),
  (2, 'desktop', '2025-06-30 23:59'),
  (3, 'desktop', '2025-06-15 12:00');
```

## Starter

```sql
SELECT DATE_TRUNC('month', played_at)::date AS month, device, COUNT(*) AS plays
FROM plays
GROUP BY 1, 2
ORDER BY 1, 2;
```

## Hints

### Hint 1

Group by month only, and compute one aggregate per device column.

### Hint 2

`COUNT(*) FILTER (WHERE device = 'mobile')` counts only mobile plays.

### Hint 3

Careful: `COUNT(device = 'mobile')` counts every row, because `false` is not `NULL`.

## Solution

```sql
SELECT
  DATE_TRUNC('month', played_at)::date AS month,
  COUNT(*) FILTER (WHERE device = 'mobile')   AS mobile,
  COUNT(*) FILTER (WHERE device = 'desktop')  AS desktop,
  COUNT(*) FILTER (WHERE device = 'smart_tv') AS smart_tv
FROM plays
GROUP BY 1
ORDER BY 1;
```

## Explanation

Pivoting long rows into fixed columns is **conditional aggregation**: one group per month, and
one filtered count per output column. Counts over no rows are `0`, so missing combinations
need no extra work.

The portable form is `SUM(CASE WHEN device = 'mobile' THEN 1 ELSE 0 END)`.

A classic bug is `COUNT(device = 'mobile')`: `COUNT(expr)` counts non-`NULL` values, and
`false` is not `NULL`, so every column would show the total number of plays.

## Wrong Answers

```sql
SELECT DATE_TRUNC('month', played_at)::date AS month,
       COUNT(device = 'mobile') AS mobile,
       COUNT(device = 'desktop') AS desktop,
       COUNT(device = 'smart_tv') AS smart_tv
FROM plays GROUP BY 1 ORDER BY 1;
```

```sql
SELECT EXTRACT(MONTH FROM played_at) AS month,
       COUNT(*) FILTER (WHERE device = 'mobile') AS mobile,
       COUNT(*) FILTER (WHERE device = 'desktop') AS desktop,
       COUNT(*) FILTER (WHERE device = 'smart_tv') AS smart_tv
FROM plays GROUP BY 1 ORDER BY 1;
```
