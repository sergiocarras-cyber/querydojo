---
id: sql-014
slug: weekend-ride-share
title: Weekend Ride Share by City
section: sql
difficulty: Easy
topics: [Dates, EXTRACT, Conditional aggregation]
company: Moviq Rides
order_matters: true
---

## Statement

For each city, **Moviq Rides** wants to know how much of its demand happens at the weekend.

Return `city`, `total_rides` and `weekend_pct`: the percentage of the city's rides that started on
a **Saturday or Sunday**, rounded to 1 decimal. Sort by `city`.

## Schema

```sql
CREATE TABLE rides (
  ride_id    INTEGER PRIMARY KEY,
  city       TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL
);
```

## Data

```sql
-- 2025-03-01 is a Saturday and 2025-03-02 a Sunday.
INSERT INTO rides VALUES
  (1, 'Austin', '2025-03-01 22:10'),
  (2, 'Austin', '2025-03-02 11:00'),
  (3, 'Austin', '2025-03-03 08:30'),
  (4, 'Austin', '2025-03-04 18:45'),
  (5, 'Denver', '2025-03-02 23:59'),
  (6, 'Denver', '2025-03-05 07:15'),
  (7, 'Denver', '2025-03-06 12:00');
```

## Hidden Data

```sql
-- Only Sundays in one city, only weekdays in another.
INSERT INTO rides VALUES
  (1, 'Reno',  '2025-03-09 10:00'),
  (2, 'Reno',  '2025-03-16 10:00'),
  (3, 'Tampa', '2025-03-10 10:00'),
  (4, 'Tampa', '2025-03-14 23:59');
```

## Starter

```sql
SELECT city, started_at, EXTRACT(DOW FROM started_at) AS dow
FROM rides;
```

## Hints

### Hint 1

`EXTRACT(ISODOW FROM ts)` returns 1 (Monday) … 7 (Sunday). `EXTRACT(DOW ...)` returns 0 for
Sunday and 6 for Saturday. Pick one and be careful.

### Hint 2

`COUNT(*) FILTER (WHERE ...)` counts only the rows matching a condition. Multiply by `100.0` to
avoid integer division.

## Solution

```sql
SELECT
  city,
  COUNT(*) AS total_rides,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM started_at) IN (6, 7)) / COUNT(*),
    1
  ) AS weekend_pct
FROM rides
GROUP BY city
ORDER BY city;
```

## Explanation

1. `ISODOW` numbers days Monday = 1 … Sunday = 7, so the weekend is `IN (6, 7)`.
2. `COUNT(*) FILTER (WHERE ...)` is **conditional aggregation**: it counts weekend rides within
   each city group. The portable equivalent is `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`.
3. `100.0 * ...` forces a numeric division; with integers, `2 / 4` would be `0`.

**Trap:** with `EXTRACT(DOW ...)` the weekend is `IN (0, 6)`. Writing `IN (6, 7)` there silently
drops every Sunday.

## Wrong Answers

### DOW numbers Sunday as 0

`EXTRACT(DOW ...)` returns 0 for Sunday and 6 for Saturday, so `IN (6, 7)` misses Sundays. Use `ISODOW` (Saturday 6, Sunday 7) or `DOW IN (0, 6)`.

```sql
SELECT city, COUNT(*) AS total_rides,
       ROUND(100.0 * COUNT(*) FILTER (WHERE EXTRACT(DOW FROM started_at) IN (6, 7)) / COUNT(*), 1) AS weekend_pct
FROM rides GROUP BY city ORDER BY city;
```

### Integer division

`100 * COUNT(*) / COUNT(*)` divides integers in PostgreSQL and truncates before `ROUND`. Use `100.0` to get decimals.

```sql
SELECT city, COUNT(*) AS total_rides,
       ROUND(100 * COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM started_at) IN (6, 7)) / COUNT(*), 1) AS weekend_pct
FROM rides GROUP BY city ORDER BY city;
```
