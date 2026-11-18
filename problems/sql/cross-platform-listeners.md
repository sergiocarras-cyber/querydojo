---
id: sql-013
slug: cross-platform-listeners
title: Cross-Platform Listeners
section: sql
difficulty: Easy
topics: [GROUP BY, HAVING, FILTER]
company: Tunely
order_matters: true
---

## Statement

**Tunely** has apps for `ios`, `android` and `web`. Marketing wants the users who listened on
**both `ios` and `android`** (using `web` as well doesn't matter).

Return `user_id`, sorted ascending.

## Schema

```sql
CREATE TABLE sessions (
  session_id INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  started_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO sessions VALUES
  (1, 1, 'ios',     '2025-04-01 08:00'),
  (2, 1, 'android', '2025-04-02 09:00'),
  (3, 2, 'ios',     '2025-04-01 10:00'),
  (4, 2, 'web',     '2025-04-03 11:00'),
  (5, 3, 'android', '2025-04-01 12:00'),
  (6, 3, 'android', '2025-04-05 13:00'),
  (7, 4, 'web',     '2025-04-02 14:00'),
  (8, 4, 'android', '2025-04-02 15:00'),
  (9, 4, 'ios',     '2025-04-04 16:00');
```

## Hidden Data

```sql
-- android + web only must not count; many ios sessions alone must not count.
INSERT INTO sessions VALUES
  (1, 7, 'android', '2025-05-01 08:00'),
  (2, 7, 'web',     '2025-05-01 09:00'),
  (3, 8, 'ios',     '2025-05-01 10:00'),
  (4, 8, 'ios',     '2025-05-02 10:00'),
  (5, 9, 'ios',     '2025-05-03 10:00'),
  (6, 9, 'android', '2025-05-04 10:00');
```

## Starter

```sql
SELECT user_id, platform
FROM sessions;
```

## Hints

### Hint 1

Count the **distinct** mobile platforms each user has used.

### Hint 2

`COUNT(DISTINCT platform) FILTER (WHERE platform IN ('ios', 'android'))` ignores web sessions.

## Solution

```sql
SELECT user_id
FROM sessions
WHERE platform IN ('ios', 'android')
GROUP BY user_id
HAVING COUNT(DISTINCT platform) = 2
ORDER BY user_id;
```

## Explanation

1. Keep only mobile sessions, so web can't help a user reach "two platforms".
2. Per user, count **distinct** platforms: several android sessions still count as one platform.
3. A count of 2 means the user has both.

Alternatives: `INTERSECT` of the ios users and the android users, or two `EXISTS` subqueries.
`HAVING COUNT(DISTINCT platform) >= 2` without the `WHERE` would wrongly accept android + web.

## Wrong Answers

### Any two platforms count

Without `WHERE platform IN ('ios', 'android')`, a user on web and iOS also qualifies.

```sql
SELECT user_id FROM sessions
GROUP BY user_id HAVING COUNT(DISTINCT platform) >= 2
ORDER BY user_id;
```

### Counting sessions instead of platforms

`COUNT(*) >= 2` is true for two iOS sessions. Count distinct platforms: `COUNT(DISTINCT platform) = 2`.

```sql
SELECT user_id FROM sessions
WHERE platform IN ('ios', 'android')
GROUP BY user_id HAVING COUNT(*) >= 2
ORDER BY user_id;
```
