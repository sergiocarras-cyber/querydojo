---
id: sql-008
slug: mutual-follows
title: Mutual Follows
section: sql
difficulty: Medium
topics: [Self-join, JOIN, GREATEST]
company: Chirpnest
order_matters: true
---

## Statement

On **Chirpnest**, a social network, following is one-directional. Two users are **mutuals**
when each follows the other. A pair *became* mutual at the moment the second of the two follows
happened.

Return one row per mutual pair:

| column | meaning |
| --- | --- |
| `handle_a` | the alphabetically smaller handle of the pair |
| `handle_b` | the alphabetically larger handle |
| `mutual_since` | timestamp at which the pair became mutual |

Sort by `mutual_since`, then `handle_a`.

## Schema

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  handle  TEXT NOT NULL UNIQUE
);

CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(user_id),
  followee_id INTEGER NOT NULL REFERENCES users(user_id),
  followed_at TIMESTAMP NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
```

## Data

```sql
INSERT INTO users VALUES
  (1, 'ana_draws'),
  (2, 'byte_bao'),
  (3, 'cosmo_k'),
  (4, 'dune_runner'),
  (5, 'echo_lin');

INSERT INTO follows VALUES
  (1, 2, '2025-02-01 10:00'),
  (2, 1, '2025-02-03 09:30'),
  (1, 3, '2025-02-02 12:00'),
  (3, 4, '2025-02-04 08:00'),
  (4, 3, '2025-02-04 08:00'),
  (5, 1, '2025-02-05 20:00'),
  (2, 4, '2025-02-06 11:11'),
  (4, 2, '2025-02-01 07:00');
```

## Hidden Data

```sql
-- Alphabetical order differs from id order; two pairs become mutual at the same instant.
INSERT INTO users VALUES
  (10, 'zed_ok'),
  (11, 'amy_q'),
  (12, 'kai_m'),
  (13, 'bo_v');

INSERT INTO follows VALUES
  (10, 11, '2025-03-01 10:00'),
  (11, 10, '2025-03-02 10:00'),
  (12, 13, '2025-03-02 10:00'),
  (13, 12, '2025-03-01 09:00'),
  (12, 10, '2025-03-05 00:00');
```

## Starter

```sql
SELECT f.follower_id, f.followee_id, f.followed_at
FROM follows AS f;
```

## Hints

### Hint 1

Join `follows` to itself: row `f1` is "A follows B", row `f2` must be "B follows A".

### Hint 2

Each mutual pair is found twice (once from each side). A condition like `handle_a < handle_b`
keeps exactly one copy *and* puts the handles in the right order.

### Hint 3

`GREATEST(x, y)` returns the later of two timestamps.

## Solution

```sql
SELECT
  ua.handle AS handle_a,
  ub.handle AS handle_b,
  GREATEST(f1.followed_at, f2.followed_at) AS mutual_since
FROM follows AS f1
JOIN follows AS f2
  ON  f2.follower_id = f1.followee_id
  AND f2.followee_id = f1.follower_id
JOIN users AS ua ON ua.user_id = f1.follower_id
JOIN users AS ub ON ub.user_id = f1.followee_id
WHERE ua.handle < ub.handle
ORDER BY mutual_since, handle_a;
```

## Explanation

1. **Self-join.** `f1` and `f2` are two copies of `follows`. The join condition swaps follower
   and followee, so a match means the follow goes both ways.
2. **Deduplicate.** For the pair (A, B) the join produces (A→B, B→A) and (B→A, A→B). Keeping
   only rows where `ua.handle < ub.handle` leaves one of them, with the handles already sorted
   alphabetically. Comparing ids instead would order the pair by id, not by handle.
3. **When it became mutual.** The relationship is mutual only once both follows exist, which is
   the *later* of the two timestamps: `GREATEST(...)`.

## Wrong Answers

```sql
SELECT ua.handle AS handle_a, ub.handle AS handle_b,
       GREATEST(f1.followed_at, f2.followed_at) AS mutual_since
FROM follows f1
JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id
JOIN users ua ON ua.user_id = f1.follower_id
JOIN users ub ON ub.user_id = f1.followee_id
WHERE f1.follower_id < f1.followee_id
ORDER BY mutual_since, handle_a;
```

```sql
SELECT ua.handle AS handle_a, ub.handle AS handle_b,
       LEAST(f1.followed_at, f2.followed_at) AS mutual_since
FROM follows f1
JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id
JOIN users ua ON ua.user_id = f1.follower_id
JOIN users ub ON ub.user_id = f1.followee_id
WHERE ua.handle < ub.handle
ORDER BY mutual_since, handle_a;
```
