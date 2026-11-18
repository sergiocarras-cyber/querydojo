---
id: sql-016
slug: net-spend-after-refunds
title: Net Spend after Refunds
section: sql
difficulty: Medium
topics: [CTE, LEFT JOIN, COALESCE, Fan-out]
company: Shelfie Books
order_matters: true
---

## Statement

**Shelfie Books** wants each customer's **net spend**: total payments minus total refunds.

- Customers with no payments or no refunds count those as `0`.
- Every customer appears, even with no activity.

Return `name` and `net_spend`, sorted by `net_spend` descending, then `name`.

## Schema

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL
);

CREATE TABLE payments (
  payment_id  INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  amount      NUMERIC(10, 2) NOT NULL
);

CREATE TABLE refunds (
  refund_id   INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  amount      NUMERIC(10, 2) NOT NULL
);
```

## Data

```sql
INSERT INTO customers VALUES (1, 'Iris'), (2, 'Omar'), (3, 'Pia'), (4, 'Quinn');

INSERT INTO payments VALUES
  (1, 1, 50.00),
  (2, 1, 30.00),
  (3, 2, 25.00),
  (4, 3, 12.00);

INSERT INTO refunds VALUES
  (1, 1, 10.00),
  (2, 1, 5.00),
  (3, 3, 12.00);
```

## Hidden Data

```sql
-- Refunds without payments (negative net), three payments and two refunds (fan-out 3 x 2).
INSERT INTO customers VALUES (1, 'Ada'), (2, 'Ben'), (3, 'Cal');

INSERT INTO payments VALUES
  (1, 2, 10.00),
  (2, 2, 20.00),
  (3, 2, 30.00);

INSERT INTO refunds VALUES
  (1, 1, 4.00),
  (2, 2, 1.00),
  (3, 2, 2.00);
```

## Starter

```sql
SELECT c.name, p.amount
FROM customers AS c
LEFT JOIN payments AS p ON p.customer_id = c.customer_id;
```

## Hints

### Hint 1

Try joining `customers`, `payments` and `refunds` together and look at customer 1: how many rows
do you get, and why?

### Hint 2

Aggregate payments per customer and refunds per customer **separately** (two CTEs), then join
those one-row-per-customer results.

### Hint 3

`COALESCE(x, 0)` turns the `NULL` of a missing side into zero.

## Solution

```sql
WITH paid AS (
  SELECT customer_id, SUM(amount) AS total
  FROM payments
  GROUP BY customer_id
),
refunded AS (
  SELECT customer_id, SUM(amount) AS total
  FROM refunds
  GROUP BY customer_id
)
SELECT
  c.name,
  COALESCE(p.total, 0) - COALESCE(r.total, 0) AS net_spend
FROM customers AS c
LEFT JOIN paid     AS p ON p.customer_id = c.customer_id
LEFT JOIN refunded AS r ON r.customer_id = c.customer_id
ORDER BY net_spend DESC, c.name;
```

## Explanation

**The fan-out trap.** Joining a customer with 2 payments and 2 refunds in one query produces
2 × 2 = 4 rows: every payment is paired with every refund. `SUM(p.amount)` then counts each payment
twice and `SUM(r.amount)` each refund twice: Iris would show 160 − 30 = 130 instead of 65.

**Fix:** reduce each child table to **one row per customer** before joining. After the CTEs,
joins are 1 : 1 and sums can't be inflated.

`LEFT JOIN` keeps customers with no rows on either side, and `COALESCE` replaces those `NULL`s
with 0 (otherwise `80 − NULL` is `NULL`).

This pattern matters whenever you combine two one-to-many relationships of the same parent.

## Wrong Answers

### Fan-out from joining two child tables

Joining payments and refunds in the same query produces every payment × refund combination, so both sums are inflated. Aggregate each table per customer first, then join.

```sql
SELECT c.name, COALESCE(SUM(p.amount), 0) - COALESCE(SUM(r.amount), 0) AS net_spend
FROM customers c
LEFT JOIN payments p ON p.customer_id = c.customer_id
LEFT JOIN refunds  r ON r.customer_id = c.customer_id
GROUP BY c.customer_id, c.name
ORDER BY net_spend DESC, c.name;
```

### Customers without payments disappear

The inner `JOIN paid` drops customers who never paid. Use `LEFT JOIN` and `COALESCE(..., 0)` on both totals.

```sql
WITH paid AS (SELECT customer_id, SUM(amount) AS total FROM payments GROUP BY customer_id),
refunded AS (SELECT customer_id, SUM(amount) AS total FROM refunds GROUP BY customer_id)
SELECT c.name, p.total - COALESCE(r.total, 0) AS net_spend
FROM customers c
JOIN paid p ON p.customer_id = c.customer_id
LEFT JOIN refunded r ON r.customer_id = c.customer_id
ORDER BY net_spend DESC, c.name;
```
