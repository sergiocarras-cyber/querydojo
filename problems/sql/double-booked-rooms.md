---
id: sql-028
slug: double-booked-rooms
title: Double-Booked Rooms
section: sql
difficulty: Hard
topics: [Self-join, Interval overlap, Dates]
company: Nestaway Stays
order_matters: true
---

## Statement

**Nestaway Stays** rents rooms by the night. A booking occupies the nights from `check_in`
(included) to `check_out` (**excluded**): a guest leaving on the 5th and another arriving on the
5th do **not** conflict.

Find every pair of bookings of the **same room** whose stays overlap. Return:

- `room_id`
- `booking_a`, `booking_b`: the two booking ids, with `booking_a < booking_b`
- `overlap_nights`: number of nights both bookings claim

Sort by `room_id`, `booking_a`, `booking_b`.

## Schema

```sql
CREATE TABLE bookings (
  booking_id INTEGER PRIMARY KEY,
  room_id    INTEGER NOT NULL,
  check_in   DATE NOT NULL,
  check_out  DATE NOT NULL CHECK (check_out > check_in)
);
```

## Data

```sql
INSERT INTO bookings VALUES
  (1, 101, '2025-07-01', '2025-07-05'),
  (2, 101, '2025-07-04', '2025-07-08'),
  (3, 101, '2025-07-08', '2025-07-10'),
  (4, 102, '2025-07-01', '2025-07-10'),
  (5, 102, '2025-07-03', '2025-07-04'),
  (6, 103, '2025-07-01', '2025-07-02');
```

## Hidden Data

```sql
-- A long stay overlapping two others; identical stays; back-to-back stays; a later id that starts earlier.
INSERT INTO bookings VALUES
  (1, 7, '2025-08-01', '2025-08-31'),
  (2, 7, '2025-08-02', '2025-08-03'),
  (3, 7, '2025-08-30', '2025-09-02'),
  (4, 8, '2025-08-10', '2025-08-12'),
  (5, 8, '2025-08-10', '2025-08-12'),
  (6, 9, '2025-08-01', '2025-08-02'),
  (7, 9, '2025-08-02', '2025-08-03'),
  (8, 10, '2025-08-05', '2025-08-08'),
  (9, 10, '2025-08-01', '2025-08-06');
```

## Starter

```sql
SELECT a.booking_id, b.booking_id, a.room_id
FROM bookings AS a
JOIN bookings AS b ON b.room_id = a.room_id AND a.booking_id < b.booking_id;
```

## Hints

### Hint 1

Two half-open intervals `[s1, e1)` and `[s2, e2)` overlap exactly when `s1 < e2 AND s2 < e1`.

### Hint 2

The overlap runs from the later start to the earlier end: `LEAST(e1, e2) − GREATEST(s1, s2)` nights.

## Solution

```sql
SELECT
  a.room_id,
  a.booking_id AS booking_a,
  b.booking_id AS booking_b,
  LEAST(a.check_out, b.check_out) - GREATEST(a.check_in, b.check_in) AS overlap_nights
FROM bookings AS a
JOIN bookings AS b
  ON  b.room_id = a.room_id
  AND a.booking_id < b.booking_id
  AND a.check_in < b.check_out
  AND b.check_in < a.check_out
ORDER BY a.room_id, booking_a, booking_b;
```

## Explanation

1. **Self-join per room** with `a.booking_id < b.booking_id` so each pair appears once (and a
   booking is never paired with itself).
2. **Overlap test.** It's easier to describe when intervals *don't* overlap: one ends before (or
   exactly when) the other starts, `e1 <= s2 OR e2 <= s1`. Negating gives `s1 < e2 AND s2 < e1`.
   Strict `<` encodes the "check-out day is free" rule.
3. **Overlap length** = earliest end − latest start; date subtraction gives days.

Checks like `a.check_in BETWEEN b.check_in AND b.check_out` miss the case where one stay fully
contains the other and wrongly flag back-to-back stays.

PostgreSQL also has range types: `daterange(check_in, check_out) && daterange(...)`, and an
exclusion constraint can prevent double bookings at insert time.

## Wrong Answers

### Back-to-back stays counted as overlaps

If one guest checks out the day the next checks in, the room is not double-booked. Use strict comparisons: `a.check_in < b.check_out AND b.check_in < a.check_out`.

```sql
SELECT a.room_id, a.booking_id AS booking_a, b.booking_id AS booking_b,
       LEAST(a.check_out, b.check_out) - GREATEST(a.check_in, b.check_in) AS overlap_nights
FROM bookings a JOIN bookings b
  ON b.room_id = a.room_id AND a.booking_id < b.booking_id
 AND a.check_in <= b.check_out AND b.check_in <= a.check_out
ORDER BY a.room_id, booking_a, booking_b;
```

### Overlap checked in one direction only

Requiring `b.check_in >= a.check_in` misses the case where the booking with the higher id starts first. The symmetric test `a.check_in < b.check_out AND b.check_in < a.check_out` covers both.

```sql
SELECT a.room_id, a.booking_id AS booking_a, b.booking_id AS booking_b,
       LEAST(a.check_out, b.check_out) - GREATEST(a.check_in, b.check_in) AS overlap_nights
FROM bookings a JOIN bookings b
  ON b.room_id = a.room_id AND a.booking_id < b.booking_id
 AND b.check_in >= a.check_in AND b.check_in < a.check_out
ORDER BY a.room_id, booking_a, booking_b;
```
