---
id: sql-015
slug: average-basket-by-country
title: Average Basket by Country
section: sql
difficulty: Easy
topics: [JOIN, GROUP BY, AVG, ROUND]
company: Basketly
order_matters: true
---

## Statement

**Basketly** operates in several countries. For each country with at least one **delivered**
order, return:

- `country`
- `orders`: number of delivered orders
- `avg_basket`: average `total` of those orders, rounded to 2 decimals

Sort by `avg_basket` descending, then `country`.

## Schema

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  country     TEXT NOT NULL
);

CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  total       NUMERIC(10, 2) NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('delivered', 'cancelled'))
);
```

## Data

```sql
INSERT INTO customers VALUES (1, 'ES'), (2, 'ES'), (3, 'PT'), (4, 'FR');

INSERT INTO orders VALUES
  (1, 1, 42.10, 'delivered'),
  (2, 1, 18.00, 'delivered'),
  (3, 2, 75.50, 'delivered'),
  (4, 3, 30.00, 'delivered'),
  (5, 3, 90.00, 'cancelled'),
  (6, 4, 61.25, 'delivered'),
  (7, 4, 11.00, 'cancelled');
```

## Hidden Data

```sql
-- A country with only cancelled orders; a tie on avg_basket; rounding.
INSERT INTO customers VALUES (1, 'IT'), (2, 'DE'), (3, 'NL');

INSERT INTO orders VALUES
  (1, 1, 10.00, 'delivered'),
  (2, 1, 10.01, 'delivered'),
  (3, 1, 10.01, 'delivered'),
  (4, 2, 50.00, 'cancelled'),
  (5, 3, 10.01, 'delivered'),
  (6, 3, 10.00, 'delivered'),
  (7, 3, 10.01, 'delivered');
```

## Starter

```sql
SELECT c.country, o.total
FROM orders AS o
JOIN customers AS c ON c.customer_id = o.customer_id;
```

## Hints

### Hint 1

Join orders to customers to get each order's country, and filter delivered orders in `WHERE`.

### Hint 2

`ROUND(AVG(o.total), 2)`.

## Solution

```sql
SELECT
  c.country,
  COUNT(*)               AS orders,
  ROUND(AVG(o.total), 2) AS avg_basket
FROM orders AS o
JOIN customers AS c ON c.customer_id = o.customer_id
WHERE o.status = 'delivered'
GROUP BY c.country
ORDER BY avg_basket DESC, c.country;
```

## Explanation

1. The join brings the customer's country to each order.
2. Filtering cancelled orders *before* grouping keeps them out of both the count and the
   average; a country with only cancelled orders produces no group at all.
3. `AVG` over a `NUMERIC` column is exact; round only for presentation.

Example: Spain has three delivered orders (42.10 + 18.00 + 75.50) / 3 = 45.20.

## Wrong Answers

```sql
SELECT c.country, COUNT(*) AS orders, ROUND(AVG(o.total), 2) AS avg_basket
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
GROUP BY c.country ORDER BY avg_basket DESC, c.country;
```

```sql
SELECT c.country, COUNT(*) AS orders, ROUND(AVG(o.total), 2) AS avg_basket
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status = 'delivered'
GROUP BY c.country ORDER BY avg_basket DESC, c.country DESC;
```
