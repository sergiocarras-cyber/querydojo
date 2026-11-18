---
id: crit-010
slug: slow-events-query
title: "Speeding Up the Events Query"
section: judgment
difficulty: Medium
topics: [Performance, Indexes, EXPLAIN]
company: Chirpnest
answer_type: choice
answer: 2
---

## Statement

**Chirpnest**'s `events` table has 200 million rows. This query, used by the support tool, takes
40 seconds:

```sql
SELECT event_type, created_at
FROM events
WHERE user_id = 812345
  AND created_at >= '2025-11-01' AND created_at < '2025-11-08'
ORDER BY created_at;
```

`EXPLAIN` shows `Seq Scan on events` with a filter on `user_id` and `created_at`. Each user has a few
thousand events; there is no index on the table besides the primary key `event_id`.

What's the most effective fix?

## Options

- An index on `created_at`.
- An index on `event_type`.
- A composite index on `(user_id, created_at)`.
- Add `LIMIT 1000` to the query.

## Hints

### Hint 1

Which condition is the most selective: one user, or one week of the whole platform?

### Hint 2

An index can serve an equality on its first column and a range on the next one, already sorted.

## Explanation

A **sequential scan** reads all 200 million rows. The most selective condition is `user_id = …` (a few
thousand rows), followed by a range on `created_at`.

A composite index on **`(user_id, created_at)`** lets PostgreSQL jump to that user's entries and read
only the requested week, **already in `created_at` order**, so the `ORDER BY` costs nothing. The query
goes from 40 s to milliseconds.

- An index on `created_at` alone still has to visit one week of *every* user's events: millions of rows.
- `event_type` isn't in the `WHERE` clause.
- `LIMIT` doesn't help a sequential scan that has to filter and sort first, and it changes the result.

Column order matters: equality columns first, then the range column.
