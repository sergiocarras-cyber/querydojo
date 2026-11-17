---
id: sql-007
slug: first-overdraft-day
title: First Overdraft Day
section: sql
difficulty: Medium
topics: [Window functions, Running total, CTE]
company: Pennywise Pay
order_matters: true
---

## Statement

Every **Pennywise Pay** wallet starts with a balance of `0`. The `ledger` table stores every
movement: positive amounts are deposits and negative amounts are payments. Entries must be
applied in **`entry_id` order** (several entries can share the same `entry_date`).

Risk wants to know when each user went into overdraft for the **first time**, i.e. the first
entry after which their balance is **strictly below zero**.

Return `user_id`, `overdraft_date` (the `entry_date` of that entry) and `balance_after` (the
balance right after it). Users who never went below zero are not included. Sort by `user_id`.

### Example

User 1: `+100 → 100`, `-40 → 60`, `-75 → -15`. The first overdraft is on `2025-05-04` with a
balance of `-15.00`. The later dip on `2025-05-11` is ignored.

## Schema

```sql
CREATE TABLE ledger (
  entry_id   INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  amount     NUMERIC(10, 2) NOT NULL
);
```

## Data

```sql
INSERT INTO ledger VALUES
  (1,  1, '2025-05-01', 100.00),
  (2,  1, '2025-05-03', -40.00),
  (3,  2, '2025-05-01',  50.00),
  (4,  1, '2025-05-04', -75.00),
  (5,  2, '2025-05-06', -20.00),
  (6,  3, '2025-05-02',  30.00),
  (7,  1, '2025-05-08',  60.00),
  (8,  3, '2025-05-09', -30.00),
  (9,  2, '2025-05-10', -45.00),
  (10, 1, '2025-05-11', -90.00);
```

## Hidden Data

```sql
-- Same-day entries (payment before deposit), a balance landing exactly on zero, a one-cent dip.
INSERT INTO ledger VALUES
  (1, 7, '2025-06-01', -50.00),
  (2, 7, '2025-06-01', 100.00),
  (3, 8, '2025-06-01',  10.00),
  (4, 8, '2025-06-02', -10.00),
  (5, 9, '2025-06-03',  20.00),
  (6, 9, '2025-06-04', -20.01),
  (7, 9, '2025-06-05',  -5.00);
```

## Starter

```sql
SELECT user_id, entry_id, entry_date, amount
FROM ledger
ORDER BY user_id, entry_id;
```

## Hints

### Hint 1

A running balance is `SUM(amount) OVER (PARTITION BY user_id ORDER BY ...)`.

### Hint 2

Order the window by `entry_id`, not by `entry_date`. With `ORDER BY entry_date`, entries on the
same date are *peers* and get the same running total.

### Hint 3

Once you have the balance per entry, keep the negative ones and pick the first per user
(`ROW_NUMBER()` or `DISTINCT ON`).

## Solution

```sql
WITH running AS (
  SELECT
    user_id, entry_id, entry_date,
    SUM(amount) OVER (PARTITION BY user_id ORDER BY entry_id) AS balance
  FROM ledger
),
negatives AS (
  SELECT
    user_id, entry_date, balance,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY entry_id) AS rn
  FROM running
  WHERE balance < 0
)
SELECT user_id, entry_date AS overdraft_date, balance AS balance_after
FROM negatives
WHERE rn = 1
ORDER BY user_id;
```

## Explanation

1. **Running total.** `SUM(amount) OVER (PARTITION BY user_id ORDER BY entry_id)` adds up every
   entry of the user up to and including the current one, which is the balance after the entry.
2. **Why `entry_id`?** With an `ORDER BY` in a window, the default frame is
   `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which includes all *peers* (rows with the
   same sort value). Ordering by `entry_date` would make a payment and a deposit on the same day
   share one total, hiding an intraday overdraft.
3. **First negative.** Keep entries with `balance < 0` (a balance of exactly `0` is not an
   overdraft) and take the earliest per user with `ROW_NUMBER()`.

A compact alternative for the last step is PostgreSQL's
`SELECT DISTINCT ON (user_id) ... ORDER BY user_id, entry_id`.

## Wrong Answers

```sql
WITH running AS (
  SELECT user_id, entry_id, entry_date,
         SUM(amount) OVER (PARTITION BY user_id ORDER BY entry_date) AS balance
  FROM ledger
), negatives AS (
  SELECT user_id, entry_date, balance,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY entry_id) AS rn
  FROM running WHERE balance < 0
)
SELECT user_id, entry_date AS overdraft_date, balance AS balance_after
FROM negatives WHERE rn = 1 ORDER BY user_id;
```

```sql
WITH running AS (
  SELECT user_id, entry_id, entry_date,
         SUM(amount) OVER (PARTITION BY user_id ORDER BY entry_id) AS balance
  FROM ledger
), negatives AS (
  SELECT user_id, entry_date, balance,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY entry_id) AS rn
  FROM running WHERE balance <= 0
)
SELECT user_id, entry_date AS overdraft_date, balance AS balance_after
FROM negatives WHERE rn = 1 ORDER BY user_id;
```
