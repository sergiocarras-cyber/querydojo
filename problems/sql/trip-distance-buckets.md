---
id: sql-011
slug: trip-distance-buckets
title: Trip Distance Buckets
section: sql
difficulty: Easy
topics: [CASE, GROUP BY, Histogram]
company: Moviq Rides
order_matters: true
---

## Statement

**Moviq Rides** groups **completed** trips into distance buckets:

| bucket | rule |
| --- | --- |
| `short` | `distance_km < 3` |
| `medium` | `3 <= distance_km < 10` |
| `long` | `distance_km >= 10` |

Return `bucket` and `trips` (number of completed trips in it) for buckets with at least one trip,
in the order **short, medium, long** (not alphabetical).

## Schema

```sql
CREATE TABLE trips (
  trip_id     INTEGER PRIMARY KEY,
  distance_km NUMERIC(6, 2) NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('completed', 'cancelled'))
);
```

## Data

```sql
INSERT INTO trips VALUES
  (1, 1.20, 'completed'),
  (2, 2.99, 'completed'),
  (3, 3.00, 'completed'),
  (4, 7.50, 'completed'),
  (5, 9.99, 'completed'),
  (6, 10.00, 'completed'),
  (7, 25.40, 'completed'),
  (8, 5.00, 'cancelled');
```

## Hidden Data

```sql
-- Only short trips are completed: long cancelled trips must not create a bucket.
INSERT INTO trips VALUES
  (1, 0.80, 'completed'),
  (2, 2.00, 'completed'),
  (3, 12.00, 'cancelled'),
  (4, 3.00, 'cancelled');
```

```sql
-- Exact boundaries.
INSERT INTO trips VALUES
  (1, 3.00, 'completed'),
  (2, 10.00, 'completed'),
  (3, 2.50, 'completed'),
  (4, 2.99, 'completed');
```

## Starter

```sql
SELECT trip_id, distance_km
FROM trips
WHERE status = 'completed';
```

## Hints

### Hint 1

A `CASE WHEN ... THEN 'short' WHEN ... END` expression assigns each trip to a bucket.

### Hint 2

`ORDER BY bucket` sorts alphabetically (long, medium, short). Sort by another `CASE` (or by the
minimum distance of each bucket) to get the natural order.

## Solution

```sql
SELECT
  CASE
    WHEN distance_km < 3  THEN 'short'
    WHEN distance_km < 10 THEN 'medium'
    ELSE 'long'
  END AS bucket,
  COUNT(*) AS trips
FROM trips
WHERE status = 'completed'
GROUP BY 1
ORDER BY MIN(distance_km);
```

## Explanation

1. `CASE` evaluates its branches in order and stops at the first match, so the second branch only
   sees trips with `distance_km >= 3`, which is why `< 10` is enough there.
2. `GROUP BY 1` groups by the first selected expression (the bucket).
3. To order buckets naturally, sort by `MIN(distance_km)`: every short trip is shorter than every
   medium trip, and so on. Another option is
   `ORDER BY CASE bucket WHEN 'short' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`.

## Wrong Answers

```sql
SELECT CASE WHEN distance_km < 3 THEN 'short' WHEN distance_km < 10 THEN 'medium' ELSE 'long' END AS bucket,
       COUNT(*) AS trips
FROM trips WHERE status = 'completed'
GROUP BY 1 ORDER BY bucket;
```

```sql
SELECT CASE WHEN distance_km <= 3 THEN 'short' WHEN distance_km <= 10 THEN 'medium' ELSE 'long' END AS bucket,
       COUNT(*) AS trips
FROM trips WHERE status = 'completed'
GROUP BY 1 ORDER BY MIN(distance_km);
```
