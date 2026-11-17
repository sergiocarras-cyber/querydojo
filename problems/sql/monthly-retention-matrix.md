---
id: sql-027
slug: monthly-retention-matrix
title: Monthly Retention Matrix
section: sql
difficulty: Hard
topics: [Cohorts, Retention, Dates, Conditional aggregation, LEFT JOIN]
company: Tunely
order_matters: true
---

## Statement

**Tunely** groups listeners into monthly cohorts by signup month. A user is **retained in month
*k*** if they were active at least once during the calendar month *k* months after their signup
month (signed up in January → month 1 is February).

Return one row per cohort:

| column | meaning |
| --- | --- |
| `cohort_month` | first day of the signup month (`DATE`) |
| `cohort_size` | users who signed up that month |
| `m1_pct`, `m2_pct`, `m3_pct` | % of the cohort retained in months 1, 2, 3, rounded to 1 decimal |

Cohorts nobody came back to show `0.0`. Sort by `cohort_month`.

## Schema

```sql
CREATE TABLE users (
  user_id      INTEGER PRIMARY KEY,
  signed_up_at DATE NOT NULL
);

CREATE TABLE activity (
  activity_id INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(user_id),
  active_on   DATE NOT NULL
);
```

## Data

```sql
INSERT INTO users VALUES
  (1, '2025-01-04'), (2, '2025-01-19'), (3, '2025-01-31'), (4, '2025-02-02'), (5, '2025-02-25');

INSERT INTO activity VALUES
  (1, 1, '2025-02-01'),
  (2, 1, '2025-02-15'),
  (3, 1, '2025-04-10'),
  (4, 2, '2025-03-03'),
  (5, 3, '2025-02-01'),
  (6, 3, '2025-03-31'),
  (7, 4, '2025-03-01'),
  (8, 5, '2025-02-26');
```

## Hidden Data

```sql
-- Year boundary, and a cohort with no activity at all.
INSERT INTO users VALUES (1, '2024-11-30'), (2, '2024-12-15'), (3, '2025-05-01');

INSERT INTO activity VALUES
  (1, 1, '2024-12-01'),
  (2, 1, '2025-02-28'),
  (3, 2, '2025-01-01'),
  (4, 2, '2025-01-02');
```

## Starter

```sql
SELECT user_id, DATE_TRUNC('month', signed_up_at)::date AS cohort_month
FROM users;
```

## Hints

### Hint 1

Turn dates into a single month number, `EXTRACT(YEAR FROM d) * 12 + EXTRACT(MONTH FROM d)`. The
difference between two such numbers is the number of calendar months between them.

### Hint 2

Start from `users` (so every cohort and user is kept) and `LEFT JOIN` each user's activity with
its month offset `k`.

### Hint 3

`COUNT(DISTINCT user_id) FILTER (WHERE k = 1)` counts retained users without double counting
users active several times.

## Solution

```sql
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signed_up_at)::date AS cohort_month,
    EXTRACT(YEAR FROM signed_up_at) * 12 + EXTRACT(MONTH FROM signed_up_at) AS signup_m
  FROM users
),
offsets AS (
  SELECT
    c.user_id,
    EXTRACT(YEAR FROM a.active_on) * 12 + EXTRACT(MONTH FROM a.active_on) - c.signup_m AS k
  FROM cohorts AS c
  JOIN activity AS a ON a.user_id = c.user_id
)
SELECT
  c.cohort_month,
  COUNT(DISTINCT c.user_id) AS cohort_size,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 1) / COUNT(DISTINCT c.user_id), 1) AS m1_pct,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 2) / COUNT(DISTINCT c.user_id), 1) AS m2_pct,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 3) / COUNT(DISTINCT c.user_id), 1) AS m3_pct
FROM cohorts AS c
LEFT JOIN offsets AS o ON o.user_id = c.user_id
GROUP BY c.cohort_month
ORDER BY c.cohort_month;
```

## Explanation

1. **Month arithmetic.** `year × 12 + month` maps dates to consecutive integers per month, so
   January 31 → February 1 is offset 1, and December → January works across years. Day-based
   rules like "30 days later" don't match calendar months.
2. **Offsets per activity.** Each activity row gets its `k`. The same user can have many rows.
3. **Keep every cohort.** Grouping from `cohorts` with a `LEFT JOIN` keeps users (and cohorts)
   with no activity. `COUNT(DISTINCT c.user_id)` is the cohort size despite the duplicated rows
   the join creates.
4. **Pivot with `FILTER`.** One distinct count per offset gives the matrix columns.

In the example, the January cohort (3 users) has users 1 and 3 back in February (66.7 %), users 2
and 3 in March (66.7 %) and user 1 in April (33.3 %).

## Wrong Answers

```sql
WITH cohorts AS (
  SELECT user_id, signed_up_at, DATE_TRUNC('month', signed_up_at)::date AS cohort_month FROM users
), offsets AS (
  SELECT c.user_id, (a.active_on - c.signed_up_at) / 30 AS k
  FROM cohorts c JOIN activity a ON a.user_id = c.user_id
)
SELECT c.cohort_month, COUNT(DISTINCT c.user_id) AS cohort_size,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 1) / COUNT(DISTINCT c.user_id), 1) AS m1_pct,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 2) / COUNT(DISTINCT c.user_id), 1) AS m2_pct,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 3) / COUNT(DISTINCT c.user_id), 1) AS m3_pct
FROM cohorts c LEFT JOIN offsets o ON o.user_id = c.user_id
GROUP BY c.cohort_month ORDER BY c.cohort_month;
```

```sql
WITH cohorts AS (
  SELECT user_id, DATE_TRUNC('month', signed_up_at)::date AS cohort_month,
         EXTRACT(YEAR FROM signed_up_at) * 12 + EXTRACT(MONTH FROM signed_up_at) AS signup_m FROM users
), offsets AS (
  SELECT c.user_id, c.cohort_month,
         EXTRACT(YEAR FROM a.active_on) * 12 + EXTRACT(MONTH FROM a.active_on) - c.signup_m AS k
  FROM cohorts c JOIN activity a ON a.user_id = c.user_id
)
SELECT o.cohort_month, COUNT(DISTINCT o.user_id) AS cohort_size,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 1) / COUNT(DISTINCT o.user_id), 1) AS m1_pct,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 2) / COUNT(DISTINCT o.user_id), 1) AS m2_pct,
  ROUND(100.0 * COUNT(DISTINCT o.user_id) FILTER (WHERE o.k = 3) / COUNT(DISTINCT o.user_id), 1) AS m3_pct
FROM offsets o GROUP BY o.cohort_month ORDER BY o.cohort_month;
```
