---
id: sql-003
slug: sellers-above-the-bar
title: Sellers Above the Bar
section: sql
difficulty: Easy
topics: [GROUP BY, HAVING, Filtering]
company: Cartwell Marketplace
order_matters: true
---

## Statement

**Cartwell** is a marketplace for independent shops. A shop earns the *Trusted Seller* badge
when, **during calendar year 2025**, it has:

- at least **3 delivered** orders, and
- delivered revenue of at least **500.00**.

Refunded orders count for nothing.

Return `shop_name`, `delivered_orders` and `revenue` (sum of delivered `amount` in 2025) for
every shop that earns the badge. Sort by `revenue` descending, then `shop_name` ascending.

## Schema

```sql
CREATE TABLE sellers (
  seller_id INTEGER PRIMARY KEY,
  shop_name TEXT NOT NULL,
  country   TEXT NOT NULL
);

CREATE TABLE orders (
  order_id   INTEGER PRIMARY KEY,
  seller_id  INTEGER NOT NULL REFERENCES sellers(seller_id),
  ordered_at DATE NOT NULL,
  amount     NUMERIC(10, 2) NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('delivered', 'refunded'))
);
```

## Data

```sql
INSERT INTO sellers VALUES
  (10, 'Fernwood Ceramics', 'US'),
  (11, 'Pixel Pantry',      'CA'),
  (12, 'Northloop Bikes',   'US'),
  (13, 'Tidal Threads',     'UK');

INSERT INTO orders VALUES
  (1,  10, '2025-01-05', 120.00, 'delivered'),
  (2,  10, '2025-02-11', 230.50, 'delivered'),
  (3,  10, '2025-03-20', 180.00, 'delivered'),
  (4,  11, '2025-01-15',  90.00, 'delivered'),
  (5,  11, '2025-02-01',  75.25, 'delivered'),
  (6,  11, '2025-04-03',  60.00, 'delivered'),
  (7,  11, '2025-04-09', 400.00, 'refunded'),
  (8,  12, '2025-05-10', 899.99, 'delivered'),
  (9,  12, '2025-06-12', 349.00, 'delivered'),
  (10, 12, '2025-06-30', 129.00, 'delivered'),
  (11, 12, '2024-12-28', 500.00, 'delivered'),
  (12, 13, '2025-07-07', 300.00, 'delivered'),
  (13, 13, '2025-07-08', 300.00, 'delivered');
```

## Hidden Data

```sql
-- Exact thresholds, a revenue tie, refunded orders padding the count, 2024 orders padding revenue.
INSERT INTO sellers VALUES
  (1, 'Bramble Books', 'US'),
  (2, 'Amber Atelier', 'FR'),
  (3, 'Cobalt Cables', 'DE'),
  (4, 'Dune Decor',    'US'),
  (5, 'Echo Audio',    'UK');

INSERT INTO orders VALUES
  (1,  1, '2025-01-10', 200.00, 'delivered'),
  (2,  1, '2025-02-10', 150.00, 'delivered'),
  (3,  1, '2025-12-31', 150.00, 'delivered'),
  (4,  2, '2025-03-01', 100.00, 'delivered'),
  (5,  2, '2025-03-02', 100.00, 'delivered'),
  (6,  2, '2025-03-03', 300.00, 'delivered'),
  (7,  3, '2025-04-01', 400.00, 'delivered'),
  (8,  3, '2025-04-02', 400.00, 'delivered'),
  (9,  3, '2025-04-03', 100.00, 'refunded'),
  (10, 4, '2025-05-01', 124.99, 'delivered'),
  (11, 4, '2025-05-02', 125.00, 'delivered'),
  (12, 4, '2025-05-03', 125.00, 'delivered'),
  (13, 4, '2025-05-04', 125.00, 'delivered'),
  (14, 5, '2025-06-01', 150.00, 'delivered'),
  (15, 5, '2025-06-02', 150.00, 'delivered'),
  (16, 5, '2025-06-03', 150.00, 'delivered'),
  (17, 5, '2024-06-04', 300.00, 'delivered');
```

## Starter

```sql
SELECT s.shop_name
FROM sellers AS s;
```

## Hints

### Hint 1

Filter rows (status and year) in `WHERE`, *before* grouping.

### Hint 2

Conditions on aggregates such as `COUNT(*)` or `SUM(amount)` go in `HAVING`.

### Hint 3

"At least" means `>=`. Check both thresholds with values exactly equal to them.

## Solution

```sql
SELECT
  s.shop_name,
  COUNT(*)      AS delivered_orders,
  SUM(o.amount) AS revenue
FROM orders AS o
JOIN sellers AS s ON s.seller_id = o.seller_id
WHERE o.status = 'delivered'
  AND o.ordered_at >= '2025-01-01'
  AND o.ordered_at <  '2026-01-01'
GROUP BY s.seller_id, s.shop_name
HAVING COUNT(*) >= 3
   AND SUM(o.amount) >= 500
ORDER BY revenue DESC, s.shop_name;
```

## Explanation

1. `WHERE` keeps only delivered orders from 2025. Doing this before grouping means refunded
   or 2024 orders never reach the counts.
2. `GROUP BY` the seller (grouping by `seller_id` too protects against two shops sharing a name).
3. `HAVING` applies both badge rules to each group. Both use `>=` because the rule says
   "at least".
4. Sort by revenue, breaking ties by shop name.

**Typical traps:** putting `status = 'delivered'` only inside `SUM(CASE ...)` but still using
`COUNT(*)` (refunds inflate the count), forgetting the year filter, or using `>` instead of `>=`.

## Wrong Answers

```sql
SELECT s.shop_name, COUNT(*) AS delivered_orders, SUM(o.amount) AS revenue
FROM orders o JOIN sellers s ON s.seller_id = o.seller_id
WHERE o.status = 'delivered' AND o.ordered_at >= '2025-01-01' AND o.ordered_at < '2026-01-01'
GROUP BY s.shop_name
HAVING COUNT(*) >= 3 AND SUM(o.amount) > 500
ORDER BY revenue DESC, s.shop_name;
```

```sql
SELECT s.shop_name, COUNT(*) AS delivered_orders,
       SUM(CASE WHEN o.status = 'delivered' THEN o.amount ELSE 0 END) AS revenue
FROM orders o JOIN sellers s ON s.seller_id = o.seller_id
WHERE o.ordered_at >= '2025-01-01' AND o.ordered_at < '2026-01-01'
GROUP BY s.shop_name
HAVING COUNT(*) >= 3 AND SUM(CASE WHEN o.status = 'delivered' THEN o.amount ELSE 0 END) >= 500
ORDER BY revenue DESC, s.shop_name;
```

```sql
SELECT s.shop_name, COUNT(*) AS delivered_orders, SUM(o.amount) AS revenue
FROM orders o JOIN sellers s ON s.seller_id = o.seller_id
WHERE o.status = 'delivered'
GROUP BY s.shop_name
HAVING COUNT(*) >= 3 AND SUM(o.amount) >= 500
ORDER BY revenue DESC, s.shop_name;
```
