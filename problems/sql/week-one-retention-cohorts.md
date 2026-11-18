---
id: sql-010
slug: week-one-retention-cohorts
title: Week-1 Retention by Signup Cohort
section: sql
difficulty: Hard
topics: [Cohorts, Retention, LEFT JOIN, Dates, CTE]
company: Habitly
order_matters: true
---

## Statement

**Habitly** is a habit-tracking app. Growth measures **week-1 retention**: a user is
*retained* if they log at least one event in the window
`[signed_up_at + 7 days, signed_up_at + 14 days)`, measured to the second from their own
signup time (start included, end excluded).

Users are grouped into **weekly signup cohorts**: the cohort is the Monday of the week they
signed up (`DATE_TRUNC('week', ...)`, weeks start on Monday).

For every cohort, return:

| column | meaning |
| --- | --- |
| `cohort_week` | Monday of the signup week (`DATE`) |
| `cohort_size` | users who signed up that week |
| `retained_users` | users of the cohort retained in week 1 |
| `retention_pct` | `retained_users / cohort_size * 100`, rounded to 1 decimal |

Cohorts where nobody was retained must still appear (with `0` and `0.0`). Sort by `cohort_week`.

## Schema

```sql
CREATE TABLE users (
  user_id      INTEGER PRIMARY KEY,
  signed_up_at TIMESTAMP NOT NULL
);

CREATE TABLE events (
  event_id   INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(user_id),
  event_at   TIMESTAMP NOT NULL,
  event_type TEXT NOT NULL
);
```

## Data

```sql
INSERT INTO users VALUES
  (1, '2025-09-01 09:00:00'),
  (2, '2025-09-03 22:00:00'),
  (3, '2025-09-07 23:30:00'),
  (4, '2025-09-08 08:00:00'),
  (5, '2025-09-10 12:00:00'),
  (6, '2025-09-15 10:00:00');

INSERT INTO events VALUES
  (1, 1, '2025-09-02 10:00:00', 'check_in'),
  (2, 1, '2025-09-09 10:00:00', 'check_in'),
  (3, 1, '2025-09-10 11:00:00', 'streak'),
  (4, 2, '2025-09-12 08:00:00', 'check_in'),
  (5, 3, '2025-09-08 10:00:00', 'check_in'),
  (6, 3, '2025-09-21 23:30:00', 'check_in'),
  (7, 4, '2025-09-15 08:00:00', 'check_in'),
  (8, 6, '2025-09-16 10:00:00', 'check_in');
```

## Hidden Data

```sql
-- A Sunday signup belongs to the previous Monday; exact +7d (in) and +14d (out) boundaries;
-- several events in the window for the same user.
INSERT INTO users VALUES
  (1, '2025-01-05 12:00:00'),
  (2, '2025-01-06 00:00:00'),
  (3, '2025-01-07 09:00:00');

INSERT INTO events VALUES
  (1, 1, '2025-01-12 12:00:00', 'check_in'),
  (2, 1, '2025-01-13 12:00:00', 'check_in'),
  (3, 1, '2025-01-14 12:00:00', 'streak'),
  (4, 2, '2025-01-20 00:00:00', 'check_in'),
  (5, 3, '2025-01-15 09:00:00', 'check_in'),
  (6, 3, '2025-01-16 09:00:00', 'check_in');
```

```sql
-- A cohort with no events at all.
INSERT INTO users VALUES
  (1, '2025-03-03 10:00:00'),
  (2, '2025-03-04 10:00:00');
```

## Starter

```sql
SELECT user_id, DATE_TRUNC('week', signed_up_at)::date AS cohort_week
FROM users;
```

## Hints

### Hint 1

Split it in two: (1) which users are retained, (2) aggregate users per cohort.

### Hint 2

Join events to users with the window in the `ON` clause:
`e.event_at >= u.signed_up_at + INTERVAL '7 days' AND e.event_at < u.signed_up_at + INTERVAL '14 days'`.

### Hint 3

A user with three events in the window must count once: get `DISTINCT user_id`s first.

### Hint 4

Start from `users` and `LEFT JOIN` the retained set so empty cohorts survive. `COUNT(column)`
ignores `NULL`s.

## Solution

```sql
WITH cohorts AS (
  SELECT user_id, signed_up_at,
         DATE_TRUNC('week', signed_up_at)::date AS cohort_week
  FROM users
),
retained AS (
  SELECT DISTINCT c.user_id
  FROM cohorts AS c
  JOIN events AS e
    ON  e.user_id  = c.user_id
    AND e.event_at >= c.signed_up_at + INTERVAL '7 days'
    AND e.event_at <  c.signed_up_at + INTERVAL '14 days'
)
SELECT
  c.cohort_week,
  COUNT(*)          AS cohort_size,
  COUNT(r.user_id)  AS retained_users,
  ROUND(COUNT(r.user_id) * 100.0 / COUNT(*), 1) AS retention_pct
FROM cohorts AS c
LEFT JOIN retained AS r ON r.user_id = c.user_id
GROUP BY c.cohort_week
ORDER BY c.cohort_week;
```

## Explanation

1. **Cohorts.** `DATE_TRUNC('week', ts)` returns the Monday 00:00 of the week, so a Sunday
   signup lands in the cohort that started six days earlier.
2. **Retained users.** The join keeps events inside each user's own week-1 window. Using a
   half-open interval avoids counting an event at exactly `+14 days`. `DISTINCT` collapses
   users with several qualifying events.
3. **Aggregate from users.** Starting from `cohorts` and `LEFT JOIN`ing `retained` keeps every
   user. `COUNT(*)` counts the cohort, and `COUNT(r.user_id)` counts only matched (retained)
   users because unmatched rows have `NULL` there.
4. `* 100.0` forces a `NUMERIC` division (integer division would truncate to `0`).

**Typical traps:** an inner join with `events` (empty cohorts vanish and `cohort_size` counts
events), `BETWEEN 7 AND 14 days` (includes the `+14d` edge), or calendar-day windows instead
of exact timestamps.

## Wrong Answers

### BETWEEN includes day 14

Week 1 is the half-open window `[signup + 7 days, signup + 14 days)`. `BETWEEN` also includes an event at exactly 14 days.

```sql
WITH cohorts AS (
  SELECT user_id, signed_up_at, DATE_TRUNC('week', signed_up_at)::date AS cohort_week FROM users
), retained AS (
  SELECT DISTINCT c.user_id FROM cohorts c JOIN events e ON e.user_id = c.user_id
   AND e.event_at BETWEEN c.signed_up_at + INTERVAL '7 days' AND c.signed_up_at + INTERVAL '14 days'
)
SELECT c.cohort_week, COUNT(*) AS cohort_size, COUNT(r.user_id) AS retained_users,
       ROUND(COUNT(r.user_id) * 100.0 / COUNT(*), 1) AS retention_pct
FROM cohorts c LEFT JOIN retained r ON r.user_id = c.user_id
GROUP BY c.cohort_week ORDER BY c.cohort_week;
```

### Inner join drops users without events

Joining `events` removes users who never came back from the cohort, so `cohort_size` is too small. Start from all users and `LEFT JOIN` the retained ones.

```sql
SELECT DATE_TRUNC('week', u.signed_up_at)::date AS cohort_week,
       COUNT(DISTINCT u.user_id) AS cohort_size,
       COUNT(DISTINCT u.user_id) FILTER (
         WHERE e.event_at >= u.signed_up_at + INTERVAL '7 days'
           AND e.event_at <  u.signed_up_at + INTERVAL '14 days') AS retained_users,
       ROUND(COUNT(DISTINCT u.user_id) FILTER (
         WHERE e.event_at >= u.signed_up_at + INTERVAL '7 days'
           AND e.event_at <  u.signed_up_at + INTERVAL '14 days') * 100.0 / COUNT(DISTINCT u.user_id), 1) AS retention_pct
FROM users u JOIN events e ON e.user_id = u.user_id
GROUP BY 1 ORDER BY 1;
```

### Counting events instead of users

The `LEFT JOIN` to `events` produces one row per event in the window, so a user with three events counts three times in both columns. Collect retained users with `DISTINCT` first.

```sql
WITH cohorts AS (
  SELECT user_id, signed_up_at, DATE_TRUNC('week', signed_up_at)::date AS cohort_week FROM users
)
SELECT c.cohort_week, COUNT(*) AS cohort_size, COUNT(e.user_id) AS retained_users,
       ROUND(COUNT(e.user_id) * 100.0 / COUNT(*), 1) AS retention_pct
FROM cohorts c LEFT JOIN events e ON e.user_id = c.user_id
  AND e.event_at >= c.signed_up_at + INTERVAL '7 days' AND e.event_at < c.signed_up_at + INTERVAL '14 days'
GROUP BY c.cohort_week ORDER BY c.cohort_week;
```
