---
id: sql-017
slug: rolling-three-day-posts
title: Rolling 3-Day Post Average
section: sql
difficulty: Medium
topics: [Window functions, generate_series, Moving average, Dates]
company: Chirpnest
order_matters: true
---

## Statement

**Chirpnest** charts posting activity. Build one row per **calendar day** from the first to the last
day with posts (**including days with no posts**), with:

- `day` (`DATE`)
- `posts`: posts that day
- `avg_3d`: average of `posts` over that day and the **two previous days**, rounded to 2
  decimals (on the first days, average over the days available)

Sort by `day`.

## Schema

```sql
CREATE TABLE posts (
  post_id   INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL,
  posted_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO posts VALUES
  (1, 10, '2025-07-01 08:00'),
  (2, 11, '2025-07-01 20:30'),
  (3, 10, '2025-07-02 09:15'),
  (4, 12, '2025-07-04 23:59'),
  (5, 13, '2025-07-04 07:00'),
  (6, 10, '2025-07-04 12:00'),
  (7, 11, '2025-07-05 10:10');
```

## Hidden Data

```sql
-- A long empty gap.
INSERT INTO posts VALUES
  (1, 1, '2025-01-01 10:00'),
  (2, 1, '2025-01-01 11:00'),
  (3, 1, '2025-01-01 12:00'),
  (4, 1, '2025-01-06 10:00');
```

## Starter

```sql
SELECT posted_at::date AS day, COUNT(*) AS posts
FROM posts
GROUP BY 1
ORDER BY 1;
```

## Hints

### Hint 1

`generate_series(start_date, end_date, INTERVAL '1 day')` produces every day in a range.
`LEFT JOIN` the posts onto it so empty days get `0`.

### Hint 2

`AVG(posts) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` is a 3-row moving
average.

### Hint 3

Without an explicit frame, `OVER (ORDER BY day)` averages from the **first** day to the current
one (a cumulative average).

## Solution

```sql
WITH days AS (
  SELECT generate_series(MIN(posted_at)::date, MAX(posted_at)::date, INTERVAL '1 day')::date AS day
  FROM posts
),
daily AS (
  SELECT d.day, COUNT(p.post_id) AS posts
  FROM days AS d
  LEFT JOIN posts AS p ON p.posted_at::date = d.day
  GROUP BY d.day
)
SELECT
  day,
  posts,
  ROUND(AVG(posts) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS avg_3d
FROM daily
ORDER BY day;
```

## Explanation

1. **Calendar spine.** A moving average over *rows* is only a moving average over *days* if
   every day has a row. `generate_series` builds the spine; the `LEFT JOIN` and
   `COUNT(p.post_id)` (which ignores `NULL`s) give 0 for empty days.
2. **Explicit frame.** `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` looks at exactly 3 rows. On
   the first two days the frame simply has fewer rows, which matches "average over the days
   available".
3. With the default frame (`RANGE UNBOUNDED PRECEDING`) you'd get a running average from the
   start, not a 3-day one.

In the example, 2025-07-03 has 0 posts and its average is (2 + 1 + 0) / 3 = 1.00.

## Wrong Answers

```sql
WITH daily AS (SELECT posted_at::date AS day, COUNT(*) AS posts FROM posts GROUP BY 1)
SELECT day, posts,
       ROUND(AVG(posts) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS avg_3d
FROM daily ORDER BY day;
```

```sql
WITH days AS (
  SELECT generate_series(MIN(posted_at)::date, MAX(posted_at)::date, INTERVAL '1 day')::date AS day FROM posts
), daily AS (
  SELECT d.day, COUNT(p.post_id) AS posts FROM days d LEFT JOIN posts p ON p.posted_at::date = d.day GROUP BY d.day
)
SELECT day, posts, ROUND(AVG(posts) OVER (ORDER BY day), 2) AS avg_3d FROM daily ORDER BY day;
```
