---
id: sql-034
slug: fix-ai-average-order-value
title: "Fix the AI: Average Order Value"
section: sql
difficulty: Medium
topics: [AI code review, Metric definition, Average of averages, Aggregation]
company: Shelfie Books
ai_review: true
order_matters: true
---

## Statement

**Shelfie Books** defines **average order value (AOV)** as total revenue divided by the number of
orders. Finance asked for the AOV of each country.

An AI assistant wrote the query in the editor. It runs, and the numbers look plausible, but they don't
match the finance dashboard.

**Find the bug and fix the query.** Return `country` and `avg_order_value` (rounded to 2 decimals),
sorted by `country`.

## Schema

```sql
CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  country     TEXT NOT NULL,
  total       NUMERIC(8, 2) NOT NULL
);
```

## Data

```sql
INSERT INTO orders VALUES
  (1, 1, 'ES',  10.00),
  (2, 1, 'ES',  20.00),
  (3, 1, 'ES',  30.00),
  (4, 2, 'ES', 100.00),
  (5, 3, 'FR',  15.00);
```

## Hidden Data

```sql
-- Repeated order totals, and customers with different numbers of orders.
INSERT INTO orders VALUES
  (1, 5, 'DE', 25.00), (2, 5, 'DE', 25.00), (3, 5, 'DE', 50.00), (4, 6, 'DE', 100.00),
  (5, 7, 'IT', 12.50), (6, 8, 'IT', 12.50);
```

## Starter

```sql
-- Written by an AI assistant. It runs, but finance says the numbers are wrong.
WITH per_customer AS (
  SELECT country, customer_id, AVG(total) AS avg_total
  FROM orders
  GROUP BY country, customer_id
)
SELECT country, ROUND(AVG(avg_total), 2) AS avg_order_value
FROM per_customer
GROUP BY country
ORDER BY country;
```

## Hints

### Hint 1

Compute Spain's AOV by hand from the definition: total revenue / number of orders.

### Hint 2

The AI averages each customer's average. A customer with one order weighs as much as a customer with
three.

## Solution

```sql
SELECT
  country,
  ROUND(SUM(total) / COUNT(*), 2) AS avg_order_value
FROM orders
GROUP BY country
ORDER BY country;
```

## Explanation

Spain has 4 orders worth 160.00 in total, so its AOV is **40.00**. The AI's query returns 60.00:
customer 1 averages 20.00 over three orders and customer 2 averages 100.00 over one, and the query
averages those two numbers as if they had the same weight.

An **average of averages** is only correct when every group has the same size. Here the metric is
defined per order, so aggregate at the order level: `SUM(total) / COUNT(*)`, which is just
`AVG(total)`.

This bug is common in AI-written SQL because the extra CTE "looks thorough". In a review, always check
the result against the written definition of the metric.

## Wrong Answers

### The AI's original query

Your result is the same as the AI's query. Compute Spain's AOV by hand from the definition and compare.

```sql
WITH per_customer AS (
  SELECT country, customer_id, AVG(total) AS avg_total
  FROM orders GROUP BY country, customer_id
)
SELECT country, ROUND(AVG(avg_total), 2) AS avg_order_value
FROM per_customer GROUP BY country ORDER BY country;
```

### Revenue per customer instead of per order

Dividing revenue by the number of customers gives revenue per customer, a different metric. AOV
divides by the number of orders.

```sql
SELECT country, ROUND(SUM(total) / COUNT(DISTINCT customer_id), 2) AS avg_order_value
FROM orders GROUP BY country ORDER BY country;
```

### AVG(DISTINCT) skips repeated totals

`AVG(DISTINCT total)` averages the distinct amounts, so two orders of 25.00 count once. Every order
counts: `AVG(total)`.

```sql
SELECT country, ROUND(AVG(DISTINCT total), 2) AS avg_order_value
FROM orders GROUP BY country ORDER BY country;
```
