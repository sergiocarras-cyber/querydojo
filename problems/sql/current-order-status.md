---
id: sql-025
slug: current-order-status
title: Current Order Status
section: sql
difficulty: Medium
topics: [DISTINCT ON, ROW_NUMBER, Latest row per group]
company: Basketly
order_matters: true
---

## Statement

Every status change of a **Basketly** order is logged in `order_events`. An order's **current
status** is the status of its **latest** event (`created_at`; if two events of the same order
share a timestamp, the larger `event_id` is the latest).

Return each `status` and the number of `orders` currently in it, sorted by `orders` descending,
then `status`.

## Schema

```sql
CREATE TABLE order_events (
  event_id   INTEGER PRIMARY KEY,
  order_id   INTEGER NOT NULL,
  status     TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO order_events VALUES
  (1, 100, 'placed',    '2025-09-01 10:00'),
  (2, 100, 'packed',    '2025-09-01 12:00'),
  (3, 100, 'delivered', '2025-09-02 09:00'),
  (4, 101, 'placed',    '2025-09-01 11:00'),
  (5, 101, 'cancelled', '2025-09-01 11:20'),
  (6, 102, 'placed',    '2025-09-02 08:00'),
  (7, 102, 'packed',    '2025-09-02 10:00'),
  (8, 103, 'placed',    '2025-09-02 15:00');
```

## Hidden Data

```sql
-- Same timestamp twice: the larger event_id wins. Alphabetically largest status is not the latest.
INSERT INTO order_events VALUES
  (1, 1, 'placed',  '2025-10-01 10:00'),
  (2, 1, 'shipped', '2025-10-01 11:00'),
  (3, 1, 'packed',  '2025-10-01 11:00'),
  (4, 2, 'placed',  '2025-10-01 09:00'),
  (5, 2, 'packed',  '2025-10-01 09:30');
```

## Starter

```sql
SELECT order_id, status, created_at
FROM order_events
ORDER BY order_id, created_at;
```

## Hints

### Hint 1

First find the latest event of each order, then count orders per status.

### Hint 2

PostgreSQL's `SELECT DISTINCT ON (order_id) ... ORDER BY order_id, created_at DESC, event_id DESC`
keeps exactly the first row of each order in that order.

### Hint 3

The portable alternative is `ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC, event_id DESC) = 1`.

## Solution

```sql
WITH latest AS (
  SELECT DISTINCT ON (order_id) order_id, status
  FROM order_events
  ORDER BY order_id, created_at DESC, event_id DESC
)
SELECT status, COUNT(*) AS orders
FROM latest
GROUP BY status
ORDER BY orders DESC, status;
```

## Explanation

"Latest row per group" appears constantly in data work:

1. `DISTINCT ON (order_id)` keeps one row per order: the first according to the `ORDER BY`, which
   must start with the `DISTINCT ON` columns. Sorting by `created_at DESC, event_id DESC` makes
   that row the latest event, with the tie-breaker the statement asks for.
2. Count orders per current status.

Pitfalls:

- `MAX(status)` gives the alphabetically largest status, not the latest one.
- Joining back on `MAX(created_at)` returns **two** rows when timestamps tie.

## Wrong Answers

### MAX(status) is alphabetical

`MAX(status)` returns the alphabetically last status, not the most recent one. Pick the latest event per order (for example `DISTINCT ON` with `ORDER BY created_at DESC`).

```sql
WITH latest AS (SELECT order_id, MAX(status) AS status FROM order_events GROUP BY order_id)
SELECT status, COUNT(*) AS orders FROM latest GROUP BY status ORDER BY orders DESC, status;
```

### Ties on the latest timestamp

When two events share the latest `created_at`, both survive and the order is counted twice. Break the tie with `event_id`.

```sql
WITH last_ts AS (SELECT order_id, MAX(created_at) AS ts FROM order_events GROUP BY order_id),
latest AS (
  SELECT e.order_id, e.status FROM order_events e
  JOIN last_ts l ON l.order_id = e.order_id AND l.ts = e.created_at
)
SELECT status, COUNT(*) AS orders FROM latest GROUP BY status ORDER BY orders DESC, status;
```
