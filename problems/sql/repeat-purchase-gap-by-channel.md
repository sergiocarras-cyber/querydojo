---
id: sql-021
slug: repeat-purchase-gap-by-channel
title: Repeat Purchase Gap by Channel
section: sql
difficulty: Medium
topics: [Window functions, ROW_NUMBER, LEAD, CTE]
company: Basketly
order_matters: true
---

## Statement

**Basketly** acquires customers through several `channel`s (ads, referral, organic…). Which
channel brings customers who come back fastest?

For every customer with **at least two orders**, compute the days between their **first** and
**second** order (orders sorted by `ordered_at`, ties broken by `order_id`). Then, per channel,
return:

- `channel`
- `repeat_customers`: customers of that channel with at least two orders
- `avg_days_to_second`: average of those gaps, rounded to 1 decimal

Channels with no repeat customers are omitted. Sort by `channel`.

## Schema

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  channel     TEXT NOT NULL
);

CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  ordered_at  DATE NOT NULL
);
```

## Data

```sql
INSERT INTO customers VALUES (1, 'ads'), (2, 'ads'), (3, 'referral'), (4, 'organic'), (5, 'referral');

INSERT INTO orders VALUES
  (1, 1, '2025-01-01'),
  (2, 1, '2025-01-11'),
  (3, 1, '2025-03-01'),
  (4, 2, '2025-01-05'),
  (5, 2, '2025-01-09'),
  (6, 3, '2025-02-01'),
  (7, 3, '2025-02-02'),
  (8, 4, '2025-02-10'),
  (9, 5, '2025-02-20');
```

## Hidden Data

```sql
-- Two orders on the same first day (gap 0); third orders must be ignored.
INSERT INTO customers VALUES (1, 'tv'), (2, 'tv');

INSERT INTO orders VALUES
  (1, 1, '2025-05-01'),
  (2, 1, '2025-05-01'),
  (3, 1, '2025-06-30'),
  (4, 2, '2025-05-01'),
  (5, 2, '2025-05-04'),
  (6, 2, '2025-05-30');
```

## Starter

```sql
SELECT o.customer_id, c.channel, o.order_id, o.ordered_at
FROM orders AS o
JOIN customers AS c ON c.customer_id = o.customer_id
ORDER BY o.customer_id, o.ordered_at;
```

## Hints

### Hint 1

`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id)` numbers each
customer's orders 1, 2, 3…

### Hint 2

Alternatively, `LEAD(ordered_at) OVER (...)` on the first order gives the date of the second one.

### Hint 3

Subtracting two `DATE`s in PostgreSQL gives an integer number of days.

## Solution

```sql
WITH numbered AS (
  SELECT
    customer_id,
    ordered_at,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id) AS n,
    LEAD(ordered_at) OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id) AS next_at
  FROM orders
),
gaps AS (
  SELECT customer_id, next_at - ordered_at AS days
  FROM numbered
  WHERE n = 1 AND next_at IS NOT NULL
)
SELECT
  c.channel,
  COUNT(*)              AS repeat_customers,
  ROUND(AVG(g.days), 1) AS avg_days_to_second
FROM gaps AS g
JOIN customers AS c ON c.customer_id = g.customer_id
GROUP BY c.channel
ORDER BY c.channel;
```

## Explanation

1. In `numbered`, each order gets its position `n` in the customer's history and the date of the
   **next** order via `LEAD`.
2. The row with `n = 1` holds the first order; its `next_at` is the second order. `NULL` means
   the customer never came back, so those rows are dropped.
3. `DATE - DATE` returns days as an integer. Aggregate per channel.

In the example, ads customers took 10 and 4 days (avg 7.0) and the only referral repeat took 1
day.

**Trap:** `MAX(ordered_at) - MIN(ordered_at)` measures first-to-**last** order (59 days for
customer 1).

## Wrong Answers

### First-to-last instead of first-to-second

`MAX - MIN` measures until the last order, which differs for customers with three or more orders. Use the gap between the first and second order only.

```sql
WITH spans AS (
  SELECT customer_id, MAX(ordered_at) - MIN(ordered_at) AS days
  FROM orders GROUP BY customer_id HAVING COUNT(*) >= 2
)
SELECT c.channel, COUNT(*) AS repeat_customers, ROUND(AVG(s.days), 1) AS avg_days_to_second
FROM spans s JOIN customers c ON c.customer_id = s.customer_id
GROUP BY c.channel ORDER BY c.channel;
```

### Averaging every gap

`LAG` over all orders also includes the gap between the 2nd and 3rd order, and so on. Keep only each customer's first gap.

```sql
WITH numbered AS (
  SELECT customer_id, ordered_at,
         LAG(ordered_at) OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id) AS prev_at
  FROM orders
)
SELECT c.channel, COUNT(DISTINCT n.customer_id) AS repeat_customers,
       ROUND(AVG(n.ordered_at - n.prev_at), 1) AS avg_days_to_second
FROM numbered n JOIN customers c ON c.customer_id = n.customer_id
WHERE n.prev_at IS NOT NULL
GROUP BY c.channel ORDER BY c.channel;
```
