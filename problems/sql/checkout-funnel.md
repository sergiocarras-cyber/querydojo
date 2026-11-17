---
id: sql-024
slug: checkout-funnel
title: Checkout Funnel
section: sql
difficulty: Medium
topics: [Funnel, LAG, VALUES, Conditional aggregation]
company: Cartwell Marketplace
order_matters: true
---

## Statement

**Cartwell**'s checkout funnel has four steps, in this order: `view` → `cart` → `checkout` →
`purchase`. A user **reached** a step if they have at least one event of that type.

Return one row per step, **in funnel order**:

| column | meaning |
| --- | --- |
| `step` | step name |
| `users` | distinct users who reached the step |
| `pct_of_previous` | `users` as a percentage of the previous step's `users`, rounded to 1 decimal; `NULL` for `view` |

Every step must appear, even if nobody reached it (with `users = 0`).

## Schema

```sql
CREATE TABLE events (
  event_id   INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'cart', 'checkout', 'purchase')),
  event_time TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO events VALUES
  (1,  1, 'view',     '2025-08-01 10:00'),
  (2,  1, 'cart',     '2025-08-01 10:02'),
  (3,  1, 'checkout', '2025-08-01 10:05'),
  (4,  1, 'purchase', '2025-08-01 10:06'),
  (5,  2, 'view',     '2025-08-01 11:00'),
  (6,  2, 'view',     '2025-08-01 11:30'),
  (7,  2, 'cart',     '2025-08-01 11:31'),
  (8,  3, 'view',     '2025-08-02 09:00'),
  (9,  4, 'view',     '2025-08-02 12:00'),
  (10, 4, 'cart',     '2025-08-02 12:01'),
  (11, 4, 'checkout', '2025-08-02 12:03'),
  (12, 4, 'cart',     '2025-08-02 12:04');
```

## Hidden Data

```sql
-- Nobody purchased: the purchase row must still appear with 0.
INSERT INTO events VALUES
  (1, 1, 'view', '2025-09-01 10:00'),
  (2, 1, 'cart', '2025-09-01 10:01'),
  (3, 2, 'view', '2025-09-01 10:02'),
  (4, 3, 'view', '2025-09-01 10:03');
```

## Starter

```sql
SELECT event_type, COUNT(DISTINCT user_id) AS users
FROM events
GROUP BY event_type;
```

## Hints

### Hint 1

Build the list of steps with their position: `(VALUES ('view', 1), ('cart', 2), ...) AS s(step, pos)`.

### Hint 2

`LEFT JOIN` the events onto that list so steps without events still appear, and count
`DISTINCT user_id`.

### Hint 3

`LAG(users) OVER (ORDER BY pos)` gives the previous step's count.

## Solution

```sql
WITH steps(step, pos) AS (
  VALUES ('view', 1), ('cart', 2), ('checkout', 3), ('purchase', 4)
),
reached AS (
  SELECT s.step, s.pos, COUNT(DISTINCT e.user_id) AS users
  FROM steps AS s
  LEFT JOIN events AS e ON e.event_type = s.step
  GROUP BY s.step, s.pos
)
SELECT
  step,
  users,
  ROUND(100.0 * users / NULLIF(LAG(users) OVER (ORDER BY pos), 0), 1) AS pct_of_previous
FROM reached
ORDER BY pos;
```

## Explanation

1. **Step order** isn't alphabetical, so it's encoded explicitly with a `VALUES` list.
2. **All steps appear:** starting from the list and `LEFT JOIN`ing events keeps steps with no
   events; `COUNT(DISTINCT e.user_id)` ignores the resulting `NULL` and returns 0.
3. **Distinct users:** user 2 viewed twice but counts once.
4. **Step conversion:** `LAG` reads the previous step's count. `NULLIF(..., 0)` avoids dividing by
   zero if an earlier step is empty.

Example: 4 users viewed, 3 added to cart (75.0 %), 2 reached checkout (66.7 %), 1 purchased
(50.0 %).

## Wrong Answers

```sql
SELECT event_type AS step, COUNT(*) AS users,
       ROUND(100.0 * COUNT(*) / LAG(COUNT(*)) OVER (ORDER BY MIN(event_id)), 1) AS pct_of_previous
FROM events GROUP BY event_type ORDER BY MIN(event_id);
```

```sql
WITH steps(step, pos) AS (VALUES ('view', 1), ('cart', 2), ('checkout', 3), ('purchase', 4)),
reached AS (
  SELECT s.step, s.pos, COUNT(DISTINCT e.user_id) AS users
  FROM steps s JOIN events e ON e.event_type = s.step GROUP BY s.step, s.pos
)
SELECT step, users, ROUND(100.0 * users / LAG(users) OVER (ORDER BY pos), 1) AS pct_of_previous
FROM reached ORDER BY pos;
```
