---
id: sql-009
slug: month-over-month-revenue
title: Month-over-Month Revenue Growth
section: sql
difficulty: Medium
topics: [CTE, Dates, LAG, Self-join, ROUND]
company: Loomly Home
order_matters: true
---

## Statement

**Loomly Home** sells furniture online. For each calendar month that has at least one order,
the board wants to see revenue and growth versus the **previous calendar month**.

| column | meaning |
| --- | --- |
| `month` | first day of the month (`DATE`) |
| `revenue` | sum of `total` for orders in that month |
| `prev_revenue` | revenue of the previous calendar month, or `NULL` if that month had no orders |
| `growth_pct` | `(revenue - prev_revenue) / prev_revenue * 100`, rounded to 1 decimal; `NULL` when `prev_revenue` is `NULL` |

"Previous calendar month" means literally the month before: the month before March is
February, even if February had no orders. Order totals are always positive.

Sort by `month`.

### Example

January has revenue 1000 and February 1250, so February's `growth_pct` is `25.0`.

## Schema

```sql
CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  ordered_at  TIMESTAMP NOT NULL,
  total       NUMERIC(10, 2) NOT NULL
);
```

## Data

```sql
INSERT INTO orders VALUES
  (1, 1, '2025-01-03 10:00:00',  400.00),
  (2, 2, '2025-01-20 15:30:00',  600.00),
  (3, 3, '2025-02-01 00:00:00',  250.00),
  (4, 1, '2025-02-14 12:00:00', 1000.00),
  (5, 2, '2025-03-09 09:00:00', 1000.00),
  (6, 4, '2025-04-02 18:45:00',  700.00),
  (7, 3, '2025-04-30 23:59:59',  400.00);
```

## Hidden Data

```sql
-- February is missing: March must not be compared with January.
INSERT INTO orders VALUES
  (1, 1, '2025-01-31 23:00:00', 200.00),
  (2, 1, '2025-03-01 00:00:00', 300.00),
  (3, 2, '2025-04-15 10:00:00', 100.00),
  (4, 2, '2025-04-20 10:00:00',  50.00);
```

```sql
-- A year boundary and a growth that needs rounding.
INSERT INTO orders VALUES
  (1, 1, '2024-12-10 10:00:00', 300.00),
  (2, 1, '2025-01-10 10:00:00', 400.00),
  (3, 1, '2025-02-10 10:00:00', 300.00);
```

## Starter

```sql
SELECT DATE_TRUNC('month', ordered_at)::date AS month, total
FROM orders;
```

## Hints

### Hint 1

Start with a CTE that computes revenue per month.

### Hint 2

`LAG(revenue) OVER (ORDER BY month)` returns the previous **row**, which is not always the
previous **month**. What happens when a month is missing?

### Hint 3

Join the monthly CTE to itself on `prev.month = cur.month - INTERVAL '1 month'`, or keep `LAG` but
also check the month it came from.

## Solution

```sql
WITH monthly AS (
  SELECT DATE_TRUNC('month', ordered_at)::date AS month,
         SUM(total) AS revenue
  FROM orders
  GROUP BY 1
)
SELECT
  cur.month,
  cur.revenue,
  prev.revenue AS prev_revenue,
  ROUND((cur.revenue - prev.revenue) * 100 / prev.revenue, 1) AS growth_pct
FROM monthly AS cur
LEFT JOIN monthly AS prev
  ON prev.month = (cur.month - INTERVAL '1 month')::date
ORDER BY cur.month;
```

## Explanation

1. `monthly` collapses orders into one row per month.
2. The `LEFT JOIN` looks up the row for exactly one calendar month earlier. If it doesn't exist,
   `prev.revenue` is `NULL`, and any arithmetic with `NULL` gives `NULL`, so `growth_pct` is
   `NULL` too, as required.
3. Multiplying by `100` before dividing keeps `NUMERIC` precision; `ROUND(..., 1)` formats the
   result.

**Why not just `LAG`?** `LAG(revenue) OVER (ORDER BY month)` is the most common answer, but it
compares March with January when February is empty. An equivalent fix with `LAG`:

```sql
CASE WHEN LAG(month) OVER (ORDER BY month) = (month - INTERVAL '1 month')::date
     THEN LAG(revenue) OVER (ORDER BY month) END
```

## Wrong Answers

### LAG skips over missing months

`LAG` returns the previous row, not the previous calendar month. If a month has no orders, growth is computed against two months back (it should be `NULL`). Join each month with `month - INTERVAL '1 month'`.

```sql
WITH monthly AS (
  SELECT DATE_TRUNC('month', ordered_at)::date AS month, SUM(total) AS revenue
  FROM orders GROUP BY 1
)
SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
       ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) * 100 / LAG(revenue) OVER (ORDER BY month), 1) AS growth_pct
FROM monthly ORDER BY month;
```

### Growth not rounded

`growth_pct` must be rounded to one decimal with `ROUND(..., 1)`.

```sql
WITH monthly AS (
  SELECT DATE_TRUNC('month', ordered_at)::date AS month, SUM(total) AS revenue
  FROM orders GROUP BY 1
)
SELECT cur.month, cur.revenue, prev.revenue AS prev_revenue,
       (cur.revenue - prev.revenue) * 100 / prev.revenue AS growth_pct
FROM monthly cur
LEFT JOIN monthly prev ON prev.month = (cur.month - INTERVAL '1 month')::date
ORDER BY cur.month;
```
