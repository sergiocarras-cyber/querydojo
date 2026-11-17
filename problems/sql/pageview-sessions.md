---
id: sql-029
slug: pageview-sessions
title: Pageview Sessions
section: sql
difficulty: Hard
topics: [Sessionization, LAG, Running total, Window functions]
company: Shelfie Books
order_matters: true
---

## Statement

**Shelfie Books** groups pageviews into **sessions**: consecutive pageviews of the same user
belong to the same session while the gap between them is **at most 30 minutes**; a longer gap
starts a new session.

For each user return:

- `user_id`
- `sessions`: number of sessions
- `avg_pages`: average number of pageviews per session, rounded to 2 decimals

Sort by `user_id`.

## Schema

```sql
CREATE TABLE pageviews (
  view_id   INTEGER PRIMARY KEY,
  user_id   INTEGER NOT NULL,
  viewed_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO pageviews VALUES
  (1, 1, '2025-10-01 09:00:00'),
  (2, 1, '2025-10-01 09:10:00'),
  (3, 1, '2025-10-01 09:40:00'),
  (4, 1, '2025-10-01 11:00:00'),
  (5, 2, '2025-10-01 09:00:00'),
  (6, 2, '2025-10-02 09:00:00'),
  (7, 2, '2025-10-02 09:05:00'),
  (8, 2, '2025-10-02 09:06:00'),
  (9, 3, '2025-10-03 20:00:00');
```

## Hidden Data

```sql
-- Exactly 30 minutes stays in the session; 30 min 1 s does not. Inserted out of order.
INSERT INTO pageviews VALUES
  (1, 5, '2025-11-01 10:00:00'),
  (2, 5, '2025-11-01 11:10:00'),
  (3, 5, '2025-11-01 10:30:00'),
  (4, 5, '2025-11-01 11:00:01'),
  (5, 5, '2025-11-01 11:20:00');
```

## Starter

```sql
SELECT user_id, viewed_at,
       LAG(viewed_at) OVER (PARTITION BY user_id ORDER BY viewed_at) AS prev_at
FROM pageviews;
```

## Hints

### Hint 1

Use `LAG(viewed_at)` to get the previous pageview of the same user.

### Hint 2

Flag a pageview with `1` when it starts a session (no previous view, or the gap is more than 30
minutes), else `0`.

### Hint 3

A running `SUM(flag) OVER (PARTITION BY user_id ORDER BY viewed_at)` turns the flags into
session numbers.

## Solution

```sql
WITH flagged AS (
  SELECT
    user_id,
    viewed_at,
    CASE
      WHEN LAG(viewed_at) OVER w IS NULL
        OR viewed_at - LAG(viewed_at) OVER w > INTERVAL '30 minutes'
      THEN 1 ELSE 0
    END AS new_session
  FROM pageviews
  WINDOW w AS (PARTITION BY user_id ORDER BY viewed_at)
),
numbered AS (
  SELECT
    user_id,
    SUM(new_session) OVER (PARTITION BY user_id ORDER BY viewed_at) AS session_no
  FROM flagged
),
per_session AS (
  SELECT user_id, session_no, COUNT(*) AS pages
  FROM numbered
  GROUP BY user_id, session_no
)
SELECT user_id, COUNT(*) AS sessions, ROUND(AVG(pages), 2) AS avg_pages
FROM per_session
GROUP BY user_id
ORDER BY user_id;
```

## Explanation

**Sessionization in SQL** has three steps:

1. **Detect boundaries.** `LAG` gives the previous pageview time. A view starts a session if
   there is no previous one or the gap is strictly greater than 30 minutes.
2. **Number sessions.** The running sum of start flags increases by one at each boundary, so every
   pageview in a session shares the same `session_no`. (`WINDOW w AS (...)` avoids repeating
   the window definition.)
3. **Aggregate twice.** Count pages per session, then sessions and the average per user.

User 1: 09:00, 09:10, 09:40 form one session (gaps of 10 and 30 minutes), then 11:00 starts
another: 2 sessions, (3 + 1) / 2 = 2.00 pages.

## Wrong Answers

```sql
WITH flagged AS (
  SELECT user_id, viewed_at,
         CASE WHEN LAG(viewed_at) OVER w IS NULL OR viewed_at - LAG(viewed_at) OVER w >= INTERVAL '30 minutes'
              THEN 1 ELSE 0 END AS new_session
  FROM pageviews WINDOW w AS (PARTITION BY user_id ORDER BY viewed_at)
), numbered AS (
  SELECT user_id, SUM(new_session) OVER (PARTITION BY user_id ORDER BY viewed_at) AS session_no FROM flagged
), per_session AS (
  SELECT user_id, session_no, COUNT(*) AS pages FROM numbered GROUP BY user_id, session_no
)
SELECT user_id, COUNT(*) AS sessions, ROUND(AVG(pages), 2) AS avg_pages
FROM per_session GROUP BY user_id ORDER BY user_id;
```

```sql
WITH flagged AS (
  SELECT user_id, viewed_at,
         CASE WHEN LAG(viewed_at) OVER (PARTITION BY user_id ORDER BY view_id) IS NULL
                OR viewed_at - LAG(viewed_at) OVER (PARTITION BY user_id ORDER BY view_id) > INTERVAL '30 minutes'
              THEN 1 ELSE 0 END AS new_session, view_id
  FROM pageviews
), numbered AS (
  SELECT user_id, SUM(new_session) OVER (PARTITION BY user_id ORDER BY view_id) AS session_no FROM flagged
), per_session AS (
  SELECT user_id, session_no, COUNT(*) AS pages FROM numbered GROUP BY user_id, session_no
)
SELECT user_id, COUNT(*) AS sessions, ROUND(AVG(pages), 2) AS avg_pages
FROM per_session GROUP BY user_id ORDER BY user_id;
```
