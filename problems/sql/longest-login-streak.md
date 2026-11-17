---
id: sql-026
slug: longest-login-streak
title: Longest Login Streak
section: sql
difficulty: Hard
topics: [Gaps and islands, Window functions, ROW_NUMBER, Dates]
company: Habitly
order_matters: true
---

## Statement

**Habitly** rewards streaks: consecutive **calendar days** with at least one login. Users can log
in several times a day.

For each user, return:

- `user_id`
- `longest_streak`: length in days of their longest streak
- `streak_start`: first day (`DATE`) of that streak; if several streaks tie, the **earliest**

Sort by `user_id`.

## Schema

```sql
CREATE TABLE logins (
  login_id INTEGER PRIMARY KEY,
  user_id  INTEGER NOT NULL,
  login_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO logins VALUES
  (1,  1, '2025-03-01 08:00'),
  (2,  1, '2025-03-01 21:00'),
  (3,  1, '2025-03-02 07:30'),
  (4,  1, '2025-03-03 23:59'),
  (5,  1, '2025-03-05 09:00'),
  (6,  1, '2025-03-06 09:00'),
  (7,  2, '2025-03-10 12:00'),
  (8,  2, '2025-03-12 12:00'),
  (9,  2, '2025-03-13 00:00'),
  (10, 3, '2025-02-27 10:00'),
  (11, 3, '2025-02-28 10:00'),
  (12, 3, '2025-03-01 10:00');
```

## Hidden Data

```sql
-- Two streaks of equal length: the earliest wins. Many logins per day (also inside a streak); month boundary.
INSERT INTO logins VALUES
  (1, 9, '2025-01-30 10:00'),
  (2, 9, '2025-01-30 11:00'),
  (3, 9, '2025-01-30 12:00'),
  (4, 9, '2025-01-31 10:00'),
  (5, 9, '2025-02-10 10:00'),
  (6, 9, '2025-02-11 10:00'),
  (7, 8, '2025-05-05 05:05'),
  (8, 10, '2025-06-01 08:00'),
  (9, 10, '2025-06-01 09:00'),
  (10, 10, '2025-06-02 08:00'),
  (11, 10, '2025-06-02 09:00'),
  (12, 10, '2025-06-03 08:00');
```

## Starter

```sql
SELECT DISTINCT user_id, login_at::date AS day
FROM logins
ORDER BY user_id, day;
```

## Hints

### Hint 1

Reduce the data to one row per user and day first (`DISTINCT`).

### Hint 2

Number each user's days with `ROW_NUMBER()`. For consecutive days, `day − row_number` is
**constant**: it identifies the streak ("island").

### Hint 3

Group by `(user_id, island)` to get each streak's length and start, then keep the best streak per
user (`DISTINCT ON` or `ROW_NUMBER`).

## Solution

```sql
WITH days AS (
  SELECT DISTINCT user_id, login_at::date AS day
  FROM logins
),
islands AS (
  SELECT
    user_id,
    day,
    day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::int AS island
  FROM days
),
streaks AS (
  SELECT user_id, MIN(day) AS streak_start, COUNT(*) AS streak_len
  FROM islands
  GROUP BY user_id, island
)
SELECT DISTINCT ON (user_id)
  user_id,
  streak_len AS longest_streak,
  streak_start
FROM streaks
ORDER BY user_id, streak_len DESC, streak_start;
```

## Explanation

This is the classic **gaps-and-islands** technique.

1. **One row per day.** Several logins on the same day would otherwise break the numbering.
2. **Island key.** Within a user, days are numbered 1, 2, 3… If days are consecutive, both the day
   and its number grow by 1, so `day − n` stays the same:

   | day | n | day − n |
   | --- | --- | --- |
   | 03-01 | 1 | 02-28 |
   | 03-02 | 2 | 02-28 |
   | 03-03 | 3 | 02-28 |
   | 03-05 | 4 | 03-01 |
   | 03-06 | 5 | 03-01 |

   A gap changes the key, starting a new island.
3. **Measure islands** with `COUNT(*)` and `MIN(day)`.
4. **Best per user:** `DISTINCT ON (user_id)` with `ORDER BY streak_len DESC, streak_start` keeps
   the longest, earliest one.

## Wrong Answers

```sql
WITH islands AS (
  SELECT user_id, login_at::date AS day,
         login_at::date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_at))::int AS island
  FROM logins
), streaks AS (
  SELECT user_id, MIN(day) AS streak_start, COUNT(*) AS streak_len FROM islands GROUP BY user_id, island
)
SELECT DISTINCT ON (user_id) user_id, streak_len AS longest_streak, streak_start
FROM streaks ORDER BY user_id, streak_len DESC, streak_start;
```

```sql
WITH days AS (SELECT DISTINCT user_id, login_at::date AS day FROM logins),
islands AS (
  SELECT user_id, day, day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::int AS island FROM days
), streaks AS (
  SELECT user_id, MIN(day) AS streak_start, COUNT(*) AS streak_len FROM islands GROUP BY user_id, island
)
SELECT DISTINCT ON (user_id) user_id, streak_len AS longest_streak, streak_start
FROM streaks ORDER BY user_id, streak_len DESC, streak_start DESC;
```
