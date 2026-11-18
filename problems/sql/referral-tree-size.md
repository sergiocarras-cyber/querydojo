---
id: sql-030
slug: referral-tree-size
title: Referral Tree Size
section: sql
difficulty: Hard
topics: [Recursive CTE, Hierarchies, Trees]
company: Pennywise Pay
order_matters: true
---

## Statement

**Pennywise Pay** gives bonuses for referrals. `users.referred_by` is the user who invited them
(`NULL` if they joined on their own). People invited by someone you invited also count as part of
your **referral tree**.

For every user who referred **at least one** person, return:

- `name`
- `total_referred`: number of people in their tree (direct and indirect, any depth)
- `depth`: how many levels deep the tree goes (only direct referrals → 1)

Sort by `total_referred` descending, then `name`.

## Schema

```sql
CREATE TABLE users (
  user_id     INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  referred_by INTEGER REFERENCES users(user_id)
);
```

## Data

```sql
INSERT INTO users VALUES
  (1, 'Ava',   NULL),
  (2, 'Bilal', 1),
  (3, 'Chen',  1),
  (4, 'Dora',  2),
  (5, 'Emil',  4),
  (6, 'Faye',  NULL),
  (7, 'Gus',   6);
```

## Hidden Data

```sql
-- A long chain: every link must count the whole chain below it.
INSERT INTO users VALUES
  (1, 'a', NULL),
  (2, 'b', 1),
  (3, 'c', 2),
  (4, 'd', 3),
  (5, 'e', 4),
  (6, 'f', 1);
```

## Starter

```sql
SELECT r.name, COUNT(*) AS direct_referrals
FROM users AS u
JOIN users AS r ON r.user_id = u.referred_by
GROUP BY r.name;
```

## Hints

### Hint 1

A plain self-join only reaches one level. To follow chains of any length you need
`WITH RECURSIVE`.

### Hint 2

Anchor: every direct referral as `(root = referred_by, member = user_id, level = 1)`.
Recursive step: people referred by a `member` join the same `root` at `level + 1`.

### Hint 3

Once the tree rows exist, group by `root`: `COUNT(*)` is the tree size and `MAX(level)` its depth.

## Solution

```sql
WITH RECURSIVE tree AS (
  SELECT referred_by AS root, user_id AS member, 1 AS level
  FROM users
  WHERE referred_by IS NOT NULL

  UNION ALL

  SELECT t.root, u.user_id, t.level + 1
  FROM tree AS t
  JOIN users AS u ON u.referred_by = t.member
)
SELECT
  r.name,
  COUNT(*)     AS total_referred,
  MAX(t.level) AS depth
FROM tree AS t
JOIN users AS r ON r.user_id = t.root
GROUP BY r.user_id, r.name
ORDER BY total_referred DESC, r.name;
```

## Explanation

A **recursive CTE** has an anchor query and a recursive query joined with `UNION ALL`. PostgreSQL
runs the anchor, then repeatedly runs the recursive part on the rows produced in the previous
round, until a round produces nothing.

- **Anchor:** each user with a referrer becomes a member of their referrer's tree at level 1.
- **Recursive step:** for every `(root, member)` already found, the people `member` referred join
  the same root one level deeper.

So every user appears once in the tree of **each** of their ancestors. Grouping by `root` gives
the size and depth of each tree.

In the example, Ava's tree is Bilal, Chen, Dora, Emil (4 people, depth 3), Bilal's is Dora and
Emil (depth 2), and Dora, Faye each have one.

Referral graphs here are trees; if cycles were possible you would need to track visited ids to
stop the recursion.

## Wrong Answers

### Only direct referrals

Counting `referred_by = r.user_id` finds direct referrals only. The tree includes referrals of referrals at any depth: use `WITH RECURSIVE`.

```sql
SELECT r.name, COUNT(*) AS total_referred, 1 AS depth
FROM users u JOIN users r ON r.user_id = u.referred_by
GROUP BY r.user_id, r.name ORDER BY total_referred DESC, r.name;
```

### Fixed depth of two levels

Two self-joins reach grandchildren but miss deeper chains. A recursive CTE follows the tree to any depth.

```sql
SELECT r.name,
       COUNT(DISTINCT u1.user_id) + COUNT(DISTINCT u2.user_id) AS total_referred,
       CASE WHEN COUNT(u2.user_id) > 0 THEN 2 ELSE 1 END AS depth
FROM users r
JOIN users u1 ON u1.referred_by = r.user_id
LEFT JOIN users u2 ON u2.referred_by = u1.user_id
GROUP BY r.user_id, r.name ORDER BY total_referred DESC, r.name;
```
