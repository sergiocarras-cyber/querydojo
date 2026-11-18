---
id: sql-002
slug: riders-who-never-rode
title: Riders Who Never Rode
section: sql
difficulty: Easy
topics: [LEFT JOIN, Anti-join, NULL handling]
company: Moviq Rides
order_matters: true
---

## Statement

**Moviq Rides** wants to send a welcome-back coupon to riders who created an account but have
**never completed a trip**. Riders whose trips were all cancelled still qualify.

Some trips are booked by corporate accounts; for those, `rider_id` is `NULL`.

Return `rider_id` and `full_name` of every qualifying rider, sorted by `rider_id`.

## Schema

```sql
CREATE TABLE riders (
  rider_id    INTEGER PRIMARY KEY,
  full_name   TEXT NOT NULL,
  signup_date DATE NOT NULL,
  city        TEXT NOT NULL
);

CREATE TABLE trips (
  trip_id      INTEGER PRIMARY KEY,
  rider_id     INTEGER REFERENCES riders(rider_id), -- NULL for corporate bookings
  requested_at TIMESTAMP NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('completed', 'cancelled'))
);
```

## Data

```sql
INSERT INTO riders VALUES
  (1, 'Ana Ruiz',    '2025-01-04', 'Austin'),
  (2, 'Ben Okafor',  '2025-02-11', 'Denver'),
  (3, 'Chloe Park',  '2025-02-20', 'Austin'),
  (4, 'Dev Patel',   '2025-03-02', 'Seattle'),
  (5, 'Elena Rossi', '2025-03-15', 'Denver');

INSERT INTO trips VALUES
  (1, 1,    '2025-03-01 08:10', 'completed'),
  (2, 2,    '2025-03-02 18:30', 'cancelled'),
  (3, 3,    '2025-03-03 07:55', 'completed'),
  (4, 2,    '2025-03-05 09:00', 'cancelled'),
  (5, NULL, '2025-03-06 12:00', 'cancelled'),
  (6, 1,    '2025-03-07 22:15', 'completed');
```

## Hidden Data

```sql
-- A completed corporate trip (rider_id NULL) breaks NOT IN; a rider with only cancellations.
INSERT INTO riders VALUES
  (1, 'Ivy Chen',   '2025-01-01', 'Boston'),
  (2, 'Jon Mbeki',  '2025-01-02', 'Boston'),
  (3, 'Kara Novak', '2025-01-03', 'Miami'),
  (4, 'Leo Santos', '2025-01-04', 'Miami');

INSERT INTO trips VALUES
  (1, NULL, '2025-02-01 10:00', 'completed'),
  (2, 1,    '2025-02-02 10:00', 'cancelled'),
  (3, 1,    '2025-02-03 10:00', 'cancelled'),
  (4, 2,    '2025-02-04 10:00', 'completed'),
  (5, 2,    '2025-02-05 10:00', 'cancelled');
```

## Starter

```sql
SELECT rider_id, full_name
FROM riders;
```

## Hints

### Hint 1

Think of it as "riders for which **no** completed trip exists".

### Hint 2

`NOT EXISTS (SELECT 1 FROM trips t WHERE t.rider_id = r.rider_id AND t.status = 'completed')` reads almost like the sentence above.

### Hint 3

Careful with `NOT IN (subquery)`: if the subquery returns a single `NULL`, `x NOT IN (...)` is never true.

## Solution

```sql
SELECT r.rider_id, r.full_name
FROM riders AS r
WHERE NOT EXISTS (
  SELECT 1
  FROM trips AS t
  WHERE t.rider_id = r.rider_id
    AND t.status = 'completed'
)
ORDER BY r.rider_id;
```

## Explanation

This is an **anti-join**: keep the rows of `riders` that have *no* matching row in `trips`.

1. The correlated subquery looks for a completed trip of the current rider.
2. `NOT EXISTS` keeps the rider only when that subquery finds nothing, so riders with
   zero trips and riders with only cancelled trips both qualify.
3. The `status = 'completed'` condition must live *inside* the subquery (or in the `ON` of a
   `LEFT JOIN`). Putting it in the outer `WHERE` would filter the riders instead.

**Why not `NOT IN`?** `rider_id NOT IN (SELECT rider_id FROM trips WHERE status = 'completed')`
looks equivalent, but corporate trips have `rider_id = NULL`. Comparing against a `NULL` gives
`UNKNOWN`, so the whole `NOT IN` is never `TRUE` and you get an empty result.

An equivalent `LEFT JOIN` version:

```sql
SELECT r.rider_id, r.full_name
FROM riders r
LEFT JOIN trips t ON t.rider_id = r.rider_id AND t.status = 'completed'
WHERE t.trip_id IS NULL
ORDER BY r.rider_id;
```

## Wrong Answers

### NOT IN with a NULL in the subquery

If any trip has a `NULL` `rider_id`, `x NOT IN (..., NULL)` is never true and the query returns nothing. `NOT EXISTS` does not have this trap.

```sql
SELECT rider_id, full_name FROM riders
WHERE rider_id NOT IN (SELECT rider_id FROM trips WHERE status = 'completed')
ORDER BY rider_id;
```

### Anti-join that ignores the trip status

`LEFT JOIN trips ... WHERE t.trip_id IS NULL` only finds riders with no trips at all. Riders whose trips were all cancelled never completed one either: filter `status = 'completed'` inside the join or the `NOT EXISTS`.

```sql
SELECT r.rider_id, r.full_name FROM riders r
LEFT JOIN trips t ON t.rider_id = r.rider_id
WHERE t.trip_id IS NULL
ORDER BY r.rider_id;
```
