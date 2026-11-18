---
id: sql-005
slug: monthly-transfer-volume
title: Monthly Transfer Volume
section: sql
difficulty: Easy
topics: [Dates, DATE_TRUNC, Aggregation, ROUND]
company: Pennywise Pay
order_matters: true
---

## Statement

**Pennywise Pay** is a peer-to-peer payments app. Finance wants a monthly report of
**completed** transfers made **in 2025**.

For every month of 2025 with at least one completed transfer, return:

| column | meaning |
| --- | --- |
| `month` | first day of the month, as a `DATE` (e.g. `2025-01-01`) |
| `transfers` | number of completed transfers |
| `volume` | total completed amount |
| `avg_amount` | average completed amount, rounded to 2 decimals |

Sort by `month`.

## Schema

```sql
CREATE TABLE transfers (
  transfer_id INTEGER PRIMARY KEY,
  sender_id   INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'pending')),
  created_at  TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO transfers VALUES
  (1, 1, 2,  250.00, 'completed', '2025-01-04 09:12'),
  (2, 2, 3,   80.00, 'completed', '2025-01-19 14:40'),
  (3, 1, 3, 1200.00, 'failed',    '2025-01-25 16:00'),
  (4, 3, 1,   45.50, 'completed', '2025-02-02 08:30'),
  (5, 2, 1,  300.00, 'pending',   '2025-02-27 21:10'),
  (6, 4, 2,   99.99, 'completed', '2025-02-28 23:59'),
  (7, 4, 1,   15.00, 'completed', '2025-03-01 00:00');
```

## Hidden Data

```sql
-- Year edges, a month with only failed transfers, an average that needs rounding.
INSERT INTO transfers VALUES
  (1, 1, 2, 100.00, 'completed', '2024-12-31 23:59:59'),
  (2, 1, 2,  10.00, 'completed', '2025-01-01 00:00:00'),
  (3, 1, 2,  20.00, 'completed', '2025-01-31 23:59:59'),
  (4, 1, 2, 500.00, 'failed',    '2025-02-10 10:00'),
  (5, 1, 2,   1.00, 'completed', '2025-03-15 10:00'),
  (6, 1, 2,   2.00, 'completed', '2025-03-16 10:00'),
  (7, 1, 2,   2.00, 'completed', '2025-03-17 10:00'),
  (8, 1, 2,   7.00, 'completed', '2026-01-01 00:00:00');
```

## Starter

```sql
SELECT created_at, amount
FROM transfers
WHERE status = 'completed';
```

## Hints

### Hint 1

`DATE_TRUNC('month', created_at)` maps every timestamp to the first instant of its month.
Cast it with `::date` to get a `DATE`.

### Hint 2

`ROUND(AVG(amount), 2)` works directly because `amount` is `NUMERIC`.

## Solution

```sql
SELECT
  DATE_TRUNC('month', created_at)::date AS month,
  COUNT(*)                              AS transfers,
  SUM(amount)                           AS volume,
  ROUND(AVG(amount), 2)                 AS avg_amount
FROM transfers
WHERE status = 'completed'
  AND created_at >= '2025-01-01'
  AND created_at <  '2026-01-01'
GROUP BY 1
ORDER BY 1;
```

## Explanation

1. Filter completed transfers of 2025 with a half-open range.
2. `DATE_TRUNC('month', ...)` buckets timestamps by month; the `::date` cast drops the
   `00:00:00` time part.
3. `GROUP BY 1` / `ORDER BY 1` refer to the first column in the `SELECT` list, which saves
   repeating the expression.
4. `AVG` on a `NUMERIC` column is exact, and `ROUND(..., 2)` rounds half away from zero
   (`72.745 → 72.75`).

Months with no completed transfers simply produce no group, so they don't appear.

## Wrong Answers

### Non-completed transfers included

Failed and pending transfers must not count. Add `status = 'completed'`.

```sql
SELECT DATE_TRUNC('month', created_at)::date AS month, COUNT(*) AS transfers,
       SUM(amount) AS volume, ROUND(AVG(amount), 2) AS avg_amount
FROM transfers
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'
GROUP BY 1 ORDER BY 1;
```

### Missing the year filter

Transfers from other years show up as extra months. Restrict `created_at` to 2025.

```sql
SELECT DATE_TRUNC('month', created_at)::date AS month, COUNT(*) AS transfers,
       SUM(amount) AS volume, ROUND(AVG(amount), 2) AS avg_amount
FROM transfers
WHERE status = 'completed'
GROUP BY 1 ORDER BY 1;
```
