---
id: sql-020
slug: median-order-value
title: Median Order Value per Month
section: sql
difficulty: Medium
topics: [PERCENTILE_CONT, Median, Dates, Aggregation]
company: Loomly Home
order_matters: true
---

## Statement

A few huge furniture orders distort **Loomly Home**'s average order value, so finance wants the
**median** too.

For each month, return:

- `month`: first day of the month (`DATE`)
- `median_total`: the median order `total` (for an even number of orders, the average of the two
  middle values), rounded to 2 decimals
- `mean_total`: the average `total`, rounded to 2 decimals

Sort by `month`.

## Schema

```sql
CREATE TABLE orders (
  order_id   INTEGER PRIMARY KEY,
  ordered_at TIMESTAMP NOT NULL,
  total      NUMERIC(10, 2) NOT NULL
);
```

## Data

```sql
INSERT INTO orders VALUES
  (1, '2025-01-03 10:00',   40.00),
  (2, '2025-01-09 12:00',   60.00),
  (3, '2025-01-15 09:00',   80.00),
  (4, '2025-01-28 19:00', 2400.00),
  (5, '2025-02-02 08:00',   35.00),
  (6, '2025-02-14 13:00',   55.00),
  (7, '2025-02-27 17:30',  900.00);
```

## Hidden Data

```sql
-- One order in a month; an even count whose middle values differ.
INSERT INTO orders VALUES
  (1, '2025-03-01 00:00', 10.00),
  (2, '2025-04-01 00:00', 1.00),
  (3, '2025-04-15 00:00', 2.00),
  (4, '2025-04-20 00:00', 4.00),
  (5, '2025-04-30 23:59', 100.00);
```

## Starter

```sql
SELECT DATE_TRUNC('month', ordered_at)::date AS month, total
FROM orders
ORDER BY 1, 2;
```

## Hints

### Hint 1

PostgreSQL computes medians with an **ordered-set aggregate**:
`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total)`.

### Hint 2

`PERCENTILE_DISC` returns an actual value from the data (no averaging), which is not what the
statement asks for with an even number of orders.

## Solution

```sql
SELECT
  DATE_TRUNC('month', ordered_at)::date AS month,
  ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total))::numeric, 2) AS median_total,
  ROUND(AVG(total), 2) AS mean_total
FROM orders
GROUP BY 1
ORDER BY 1;
```

## Explanation

- `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total)` interpolates: with 4 values it averages
  the 2nd and 3rd. It returns `double precision`, hence the cast to `numeric` before `ROUND`.
- `PERCENTILE_DISC(0.5)` would return the 2nd value instead (the first one whose cumulative share
  reaches 50 %).

In January the totals are 40, 60, 80, 2400: the median is (60 + 80) / 2 = 70 while the mean is
645, pulled up by one outlier. That gap is the reason to report medians for skewed metrics.

## Wrong Answers

### PERCENTILE_DISC picks a real value

With an even number of orders the median is the average of the two middle values. `PERCENTILE_DISC` returns one of them; `PERCENTILE_CONT(0.5)` interpolates.

```sql
SELECT DATE_TRUNC('month', ordered_at)::date AS month,
       ROUND((PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY total))::numeric, 2) AS median_total,
       ROUND(AVG(total), 2) AS mean_total
FROM orders GROUP BY 1 ORDER BY 1;
```

### The mean is not the median

`AVG` is pulled by large orders. The median needs `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total)`.

```sql
SELECT DATE_TRUNC('month', ordered_at)::date AS month,
       ROUND(AVG(total), 2) AS median_total,
       ROUND(AVG(total), 2) AS mean_total
FROM orders GROUP BY 1 ORDER BY 1;
```
