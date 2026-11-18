---
id: sql-018
slug: category-revenue-share
title: Category Share of Revenue
section: sql
difficulty: Medium
topics: [Window functions, SUM OVER, Percent of total]
company: Cartwell Marketplace
order_matters: true
---

## Statement

For **Cartwell**'s Q2 report, compute each category's revenue and its **share of total
revenue**, considering only items with `sold_at` in **Q2 2025** (April 1 – June 30).

Return `category`, `revenue` and `pct_of_total` (percentage of total Q2 revenue, rounded to 1
decimal). Sort by `revenue` descending, then `category`.

## Schema

```sql
CREATE TABLE order_items (
  item_id  INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  amount   NUMERIC(10, 2) NOT NULL,
  sold_at  DATE NOT NULL
);
```

## Data

```sql
INSERT INTO order_items VALUES
  (1, 'garden',  120.00, '2025-04-03'),
  (2, 'kitchen',  80.00, '2025-04-10'),
  (3, 'garden',   60.00, '2025-05-21'),
  (4, 'toys',     40.00, '2025-06-30'),
  (5, 'kitchen', 100.00, '2025-07-01'),
  (6, 'toys',     50.00, '2025-03-31');
```

## Hidden Data

```sql
-- Shares that need rounding; a category only active outside Q2.
INSERT INTO order_items VALUES
  (1, 'a', 1.00, '2025-04-01'),
  (2, 'b', 1.00, '2025-05-01'),
  (3, 'c', 1.00, '2025-06-01'),
  (4, 'd', 9.00, '2025-07-15');
```

## Starter

```sql
SELECT category, SUM(amount) AS revenue
FROM order_items
GROUP BY category;
```

## Hints

### Hint 1

`SUM(...) OVER ()` with an empty window adds up the whole result set, and can be used next to
grouped columns.

### Hint 2

In a grouped query you can nest aggregates inside a window: `SUM(SUM(amount)) OVER ()`.

## Solution

```sql
SELECT
  category,
  SUM(amount) AS revenue,
  ROUND(100 * SUM(amount) / SUM(SUM(amount)) OVER (), 1) AS pct_of_total
FROM order_items
WHERE sold_at >= '2025-04-01' AND sold_at < '2025-07-01'
GROUP BY category
ORDER BY revenue DESC, category;
```

## Explanation

1. `WHERE` keeps Q2 rows; `GROUP BY` produces revenue per category.
2. Window functions run **after** grouping, so `SUM(SUM(amount)) OVER ()` sums the per-category
   revenues across all groups: the Q2 total.
3. Divide and multiply by 100. `amount` is `NUMERIC`, so there's no integer division issue.

Alternative without nesting: compute per-category revenue in a CTE, then
`revenue / SUM(revenue) OVER ()` in the outer query.

In the example, Q2 total is 300, so garden (180) is 60.0 %, kitchen 26.7 %, toys 13.3 %.

## Wrong Answers

### Share of the all-time total

The subquery sums every order, not just Q2, so the percentages are too small. Use `SUM(SUM(amount)) OVER ()` on the filtered rows.

```sql
SELECT category, SUM(amount) AS revenue,
       ROUND(100 * SUM(amount) / (SELECT SUM(amount) FROM order_items), 1) AS pct_of_total
FROM order_items
WHERE sold_at >= '2025-04-01' AND sold_at < '2025-07-01'
GROUP BY category ORDER BY revenue DESC, category;
```

### Fraction instead of percentage

`revenue / total` gives 0.42, not 42. Multiply by 100.

```sql
SELECT category, SUM(amount) AS revenue,
       ROUND(SUM(amount) / SUM(SUM(amount)) OVER (), 1) AS pct_of_total
FROM order_items
WHERE sold_at >= '2025-04-01' AND sold_at < '2025-07-01'
GROUP BY category ORDER BY revenue DESC, category;
```
