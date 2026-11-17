---
id: sql-001
slug: minutes-watched-per-plan
title: Minutes Watched per Plan
section: sql
difficulty: Easy
topics: [JOIN, GROUP BY, Dates]
company: Lumora Stream
order_matters: true
---

## Statement

**Lumora Stream** sells three subscription plans: `basic`, `standard` and `premium`.
The growth team wants a quick read on how much each plan was used during **October 2025**.

For every plan that had **at least one viewing session** starting in October 2025 (UTC), return:

| column | meaning |
| --- | --- |
| `plan` | the plan name |
| `viewers` | number of **distinct** accounts on that plan with at least one session in October 2025 |
| `total_minutes` | sum of `minutes` across those sessions |

Sort by `total_minutes` descending, breaking ties by `plan` ascending.

### Example

With the sample data, the `premium` accounts 1 and 4 watched 95 + 40 + 120 minutes in October,
so `premium` appears with `viewers = 2` and `total_minutes = 255`. The session on
`2025-11-01` does not count.

## Schema

```sql
CREATE TABLE accounts (
  account_id  INTEGER PRIMARY KEY,
  plan        TEXT NOT NULL,
  signup_date DATE NOT NULL
);

CREATE TABLE viewing_sessions (
  session_id  INTEGER PRIMARY KEY,
  account_id  INTEGER NOT NULL REFERENCES accounts(account_id),
  started_at  TIMESTAMP NOT NULL,
  minutes     INTEGER NOT NULL
);
```

## Data

```sql
INSERT INTO accounts VALUES
  (1, 'premium',  '2024-03-11'),
  (2, 'basic',    '2025-01-20'),
  (3, 'standard', '2025-06-02'),
  (4, 'premium',  '2025-09-30'),
  (5, 'basic',    '2025-10-15');

INSERT INTO viewing_sessions VALUES
  (101, 1, '2025-10-01 20:15:00',  95),
  (102, 2, '2025-10-03 08:00:00',  30),
  (103, 1, '2025-10-12 21:40:00',  40),
  (104, 3, '2025-10-18 19:05:00', 150),
  (105, 4, '2025-10-25 22:30:00', 120),
  (106, 5, '2025-10-30 07:45:00',  25),
  (107, 3, '2025-11-01 00:10:00',  60),
  (108, 2, '2025-09-29 18:00:00',  45);
```

## Hidden Data

```sql
-- Boundaries: last second of October counts, first second of November does not.
-- A plan with only out-of-range sessions must disappear. Ties on total_minutes.
INSERT INTO accounts VALUES
  (1, 'basic',    '2025-01-01'),
  (2, 'standard', '2025-01-01'),
  (3, 'premium',  '2025-01-01'),
  (4, 'basic',    '2025-02-01');

INSERT INTO viewing_sessions VALUES
  (1, 1, '2025-10-01 00:00:00', 50),
  (2, 1, '2025-10-31 23:59:59', 50),
  (3, 4, '2025-10-15 12:00:00', 100),
  (4, 2, '2025-10-20 10:00:00', 200),
  (5, 3, '2025-11-01 00:00:00', 300),
  (6, 3, '2025-09-30 23:59:59', 300);
```

```sql
-- No sessions at all in October: the result must be empty.
INSERT INTO accounts VALUES (1, 'premium', '2025-01-01');
INSERT INTO viewing_sessions VALUES (1, 1, '2025-12-24 18:00:00', 90);
```

## Starter

```sql
-- Write your PostgreSQL query below
SELECT *
FROM accounts;
```

## Hints

### Hint 1

You need columns from both tables: join `viewing_sessions` to `accounts` on `account_id`.

### Hint 2

Filter October with a half-open range: `started_at >= '2025-10-01' AND started_at < '2025-11-01'`.
It is safer than `BETWEEN` with timestamps.

### Hint 3

`COUNT(DISTINCT a.account_id)` counts each account once even if it has several sessions.

## Solution

```sql
SELECT
  a.plan,
  COUNT(DISTINCT a.account_id) AS viewers,
  SUM(s.minutes)               AS total_minutes
FROM viewing_sessions AS s
JOIN accounts AS a
  ON a.account_id = s.account_id
WHERE s.started_at >= '2025-10-01'
  AND s.started_at <  '2025-11-01'
GROUP BY a.plan
ORDER BY total_minutes DESC, a.plan;
```

## Explanation

1. **Join** each session to its account so we know the plan behind every session.
2. **Filter** to October with a half-open interval `[2025-10-01, 2025-11-01)`. This includes
   `2025-10-31 23:59:59` and excludes `2025-11-01 00:00:00` without having to think about
   fractional seconds.
3. **Group by plan**. Because the filter runs *before* grouping, plans with no October
   sessions never form a group, which is exactly what the statement asks for.
4. `COUNT(DISTINCT account_id)` gives viewers; `SUM(minutes)` gives total minutes.
5. Order by `total_minutes DESC, plan` for a deterministic result.

**Common mistakes:** `COUNT(*)` counts sessions, not viewers; `started_at BETWEEN '2025-10-01' AND '2025-10-31'`
drops everything after midnight on the 31st.

## Wrong Answers

```sql
-- BETWEEN on dates drops the last day after midnight
SELECT a.plan, COUNT(DISTINCT a.account_id) AS viewers, SUM(s.minutes) AS total_minutes
FROM viewing_sessions s JOIN accounts a ON a.account_id = s.account_id
WHERE s.started_at BETWEEN '2025-10-01' AND '2025-10-31'
GROUP BY a.plan ORDER BY total_minutes DESC, a.plan;
```

```sql
-- Counts sessions instead of distinct viewers
SELECT a.plan, COUNT(*) AS viewers, SUM(s.minutes) AS total_minutes
FROM viewing_sessions s JOIN accounts a ON a.account_id = s.account_id
WHERE s.started_at >= '2025-10-01' AND s.started_at < '2025-11-01'
GROUP BY a.plan ORDER BY total_minutes DESC, a.plan;
```

```sql
-- Missing the tie-breaker on plan
SELECT a.plan, COUNT(DISTINCT a.account_id) AS viewers, SUM(s.minutes) AS total_minutes
FROM viewing_sessions s JOIN accounts a ON a.account_id = s.account_id
WHERE s.started_at >= '2025-10-01' AND s.started_at < '2025-11-01'
GROUP BY a.plan ORDER BY total_minutes DESC, a.plan DESC;
```
