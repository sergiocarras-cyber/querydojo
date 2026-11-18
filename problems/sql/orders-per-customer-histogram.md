---
id: sql-004
slug: orders-per-customer-histogram
title: Orders-per-Customer Histogram
section: sql
difficulty: Easy
topics: [Histogram, Subquery, GROUP BY, Dates]
company: Basketly
order_matters: true
---

## Statement

**Basketly** delivers groceries. The product team wants a histogram of how often customers
ordered **in 2025**.

For each number of orders `n`, return how many customers placed exactly `n` orders in 2025.
Only customers with at least one 2025 order appear.

| column | meaning |
| --- | --- |
| `orders_placed` | number of orders a customer placed in 2025 |
| `num_customers` | how many customers placed exactly that many |

Sort by `orders_placed` ascending.

### Example

Customer `104` ordered on `2024-12-31 23:50` and on `2025-01-01 00:05`: only the second order
counts, so they fall in the `orders_placed = 1` bucket.

## Schema

```sql
CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  placed_at   TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO orders VALUES
  (1,  101, '2025-01-03 10:00'),
  (2,  101, '2025-02-14 18:20'),
  (3,  102, '2025-02-15 09:05'),
  (4,  103, '2025-03-01 12:00'),
  (5,  103, '2025-03-08 12:30'),
  (6,  103, '2025-03-22 19:45'),
  (7,  104, '2024-12-31 23:50'),
  (8,  104, '2025-01-01 00:05'),
  (9,  105, '2025-04-10 08:00'),
  (10, 105, '2025-05-10 08:00');
```

## Hidden Data

```sql
-- Year boundaries on both sides.
INSERT INTO orders VALUES
  (1, 1, '2024-12-31 23:59:59'),
  (2, 1, '2025-01-01 00:00:00'),
  (3, 2, '2025-12-31 23:59:59'),
  (4, 2, '2026-01-01 00:00:00'),
  (5, 3, '2025-06-01 09:00'),
  (6, 3, '2025-06-02 09:00'),
  (7, 3, '2025-06-03 09:00'),
  (8, 3, '2025-06-04 09:00');
```

## Starter

```sql
SELECT customer_id, COUNT(*) AS orders_placed
FROM orders
GROUP BY customer_id;
```

## Hints

### Hint 1

Do it in two steps: first count orders **per customer**, then count customers **per order count**.

### Hint 2

Put the first step in a CTE (`WITH per_customer AS (...)`) or a subquery in `FROM`.

## Solution

```sql
WITH per_customer AS (
  SELECT customer_id, COUNT(*) AS orders_placed
  FROM orders
  WHERE placed_at >= '2025-01-01'
    AND placed_at <  '2026-01-01'
  GROUP BY customer_id
)
SELECT orders_placed, COUNT(*) AS num_customers
FROM per_customer
GROUP BY orders_placed
ORDER BY orders_placed;
```

## Explanation

A histogram is an **aggregation of an aggregation**:

1. The CTE groups by customer and counts their 2025 orders. The half-open range
   `[2025-01-01, 2026-01-01)` handles both year edges, including `2025-12-31 23:59:59`.
2. The outer query groups those per-customer counts and counts how many customers share each
   value.

Customers without any 2025 order never appear in the CTE, so there is no `0` bucket, which is
what the statement asks for. (If it did ask for a `0` bucket, you would need a customers table
and a `LEFT JOIN`.)

## Wrong Answers

### Missing the 2025 filter

Orders from every year are counted, so customers end up in the wrong bucket. Filter `placed_at` to 2025 before counting per customer.

```sql
WITH per_customer AS (
  SELECT customer_id, COUNT(*) AS orders_placed FROM orders GROUP BY customer_id
)
SELECT orders_placed, COUNT(*) AS num_customers
FROM per_customer GROUP BY orders_placed ORDER BY orders_placed;
```

### BETWEEN with timestamps

`BETWEEN '2025-01-01' AND '2025-12-31'` ends at midnight, dropping orders placed during December 31. Use `< '2026-01-01'`.

```sql
WITH per_customer AS (
  SELECT customer_id, COUNT(*) AS orders_placed FROM orders
  WHERE placed_at BETWEEN '2025-01-01' AND '2025-12-31'
  GROUP BY customer_id
)
SELECT orders_placed, COUNT(*) AS num_customers
FROM per_customer GROUP BY orders_placed ORDER BY orders_placed;
```
