---
id: sql-006
slug: top-tracks-per-genre
title: Top Tracks per Genre
section: sql
difficulty: Medium
topics: [Window functions, DENSE_RANK, Top-N per group, CTE]
company: Tunely
order_matters: true
---

## Statement

**Tunely** is a music streaming service. Editors want the **top 2 tracks of each genre** by
number of plays during **November 2025**, to build "Best of the month" playlists.

Rank tracks inside each genre by their November play count, highest first. Tracks with the
same play count **share a rank**, and ranks have **no gaps** (1, 1, 2, …). Return every track
whose rank is 1 or 2 — this can be more than two tracks per genre when there are ties.
Tracks with no November plays are ignored.

Return `genre`, `title`, `plays` and `genre_rank`, sorted by `genre`, then `genre_rank`, then
`title`.

## Schema

```sql
CREATE TABLE tracks (
  track_id INTEGER PRIMARY KEY,
  title    TEXT NOT NULL,
  genre    TEXT NOT NULL
);

CREATE TABLE plays (
  play_id   INTEGER PRIMARY KEY,
  track_id  INTEGER NOT NULL REFERENCES tracks(track_id),
  user_id   INTEGER NOT NULL,
  played_at TIMESTAMP NOT NULL
);
```

## Data

```sql
INSERT INTO tracks VALUES
  (1, 'Neon Harbor',    'synthwave'),
  (2, 'Glass Arcade',   'synthwave'),
  (3, 'Midnight Relay', 'synthwave'),
  (4, 'Copper Field',   'folk'),
  (5, 'Low Tide Hymn',  'folk'),
  (6, 'Paper Lanterns', 'folk'),
  (7, 'Static Bloom',   'indie');

INSERT INTO plays VALUES
  (1,  1, 11, '2025-11-01 08:00'),
  (2,  1, 12, '2025-11-03 21:15'),
  (3,  1, 13, '2025-11-09 19:40'),
  (4,  1, 11, '2025-11-20 07:30'),
  (5,  2, 14, '2025-11-02 12:00'),
  (6,  2, 15, '2025-11-12 22:05'),
  (7,  2, 11, '2025-11-28 18:45'),
  (8,  3, 16, '2025-11-05 09:10'),
  (9,  3, 12, '2025-11-15 16:20'),
  (10, 3, 13, '2025-11-30 23:00'),
  (11, 4, 17, '2025-11-04 10:00'),
  (12, 4, 18, '2025-11-18 11:00'),
  (13, 5, 17, '2025-11-06 20:30'),
  (14, 5, 19, '2025-11-25 06:50'),
  (15, 6, 18, '2025-11-11 13:13'),
  (16, 7, 20, '2025-11-21 17:00'),
  (17, 6, 11, '2025-10-02 09:00'),
  (18, 6, 12, '2025-10-15 09:00'),
  (19, 6, 13, '2025-10-30 09:00');
```

## Hidden Data

```sql
-- Month edges, a three-way tie at rank 1, a genre whose only plays are in December.
INSERT INTO tracks VALUES
  (1, 'Blue Hour',  'jazz'),
  (2, 'Bright Fog', 'pop'),
  (3, 'Candy Wire', 'pop'),
  (4, 'Daydrift',   'pop'),
  (5, 'Echo Park',  'pop'),
  (6, 'Faultline',  'rock');

INSERT INTO plays VALUES
  (1,  1, 1, '2025-11-30 23:59:59'),
  (2,  2, 1, '2025-11-01 00:00:00'),
  (3,  2, 2, '2025-11-02 10:00'),
  (4,  3, 1, '2025-11-03 10:00'),
  (5,  3, 2, '2025-11-04 10:00'),
  (6,  4, 1, '2025-11-05 10:00'),
  (7,  4, 2, '2025-11-06 10:00'),
  (8,  5, 1, '2025-11-07 10:00'),
  (9,  5, 2, '2025-12-01 00:00:00'),
  (10, 5, 3, '2025-12-01 10:00'),
  (11, 5, 4, '2025-12-02 10:00'),
  (12, 6, 1, '2025-12-03 10:00'),
  (13, 6, 2, '2025-12-04 10:00');
```

## Starter

```sql
SELECT t.genre, t.title, COUNT(*) AS plays
FROM plays AS p
JOIN tracks AS t ON t.track_id = p.track_id
GROUP BY t.genre, t.title;
```

## Hints

### Hint 1

First compute plays per track in November (a normal `GROUP BY`). Then rank on top of that result.

### Hint 2

A window function with `PARTITION BY genre ORDER BY plays DESC` restarts the ranking for every genre.

### Hint 3

`ROW_NUMBER`, `RANK` and `DENSE_RANK` treat ties differently. Only one of them gives `1, 1, 2`.

### Hint 4

You can't filter on a window function in the same `SELECT`'s `WHERE`; wrap it in a CTE first.

## Solution

```sql
WITH november AS (
  SELECT t.genre, t.title, COUNT(*) AS plays
  FROM plays AS p
  JOIN tracks AS t ON t.track_id = p.track_id
  WHERE p.played_at >= '2025-11-01'
    AND p.played_at <  '2025-12-01'
  GROUP BY t.track_id, t.genre, t.title
),
ranked AS (
  SELECT
    genre, title, plays,
    DENSE_RANK() OVER (PARTITION BY genre ORDER BY plays DESC) AS genre_rank
  FROM november
)
SELECT genre, title, plays, genre_rank
FROM ranked
WHERE genre_rank <= 2
ORDER BY genre, genre_rank, title;
```

## Explanation

This is the classic **top-N per group** pattern:

1. **Aggregate**: `november` counts plays per track inside the month (half-open range).
2. **Rank**: `DENSE_RANK() OVER (PARTITION BY genre ORDER BY plays DESC)` numbers tracks within
   each genre. With plays `2, 2, 1` it yields `1, 1, 2`.
3. **Filter**: window functions are computed after `WHERE`, so the filter on `genre_rank` must
   happen in an outer query.

How the three ranking functions differ on plays `2, 2, 1`:

| function | result |
| --- | --- |
| `ROW_NUMBER()` | 1, 2, 3 (ties broken arbitrarily) |
| `RANK()` | 1, 1, 3 (gaps after ties) |
| `DENSE_RANK()` | 1, 1, 2 (no gaps) |

The statement asks for shared ranks without gaps, so `DENSE_RANK` is the right tool.

## Wrong Answers

```sql
WITH november AS (
  SELECT t.genre, t.title, COUNT(*) AS plays
  FROM plays p JOIN tracks t ON t.track_id = p.track_id
  WHERE p.played_at >= '2025-11-01' AND p.played_at < '2025-12-01'
  GROUP BY t.track_id, t.genre, t.title
), ranked AS (
  SELECT genre, title, plays, RANK() OVER (PARTITION BY genre ORDER BY plays DESC) AS genre_rank
  FROM november
)
SELECT genre, title, plays, genre_rank FROM ranked WHERE genre_rank <= 2
ORDER BY genre, genre_rank, title;
```

```sql
WITH november AS (
  SELECT t.genre, t.title, COUNT(*) AS plays
  FROM plays p JOIN tracks t ON t.track_id = p.track_id
  WHERE p.played_at >= '2025-11-01' AND p.played_at < '2025-12-01'
  GROUP BY t.track_id, t.genre, t.title
), ranked AS (
  SELECT genre, title, plays,
         ROW_NUMBER() OVER (PARTITION BY genre ORDER BY plays DESC, title) AS genre_rank
  FROM november
)
SELECT genre, title, plays, genre_rank FROM ranked WHERE genre_rank <= 2
ORDER BY genre, genre_rank, title;
```

```sql
WITH totals AS (
  SELECT t.genre, t.title, COUNT(*) AS plays
  FROM plays p JOIN tracks t ON t.track_id = p.track_id
  GROUP BY t.track_id, t.genre, t.title
), ranked AS (
  SELECT genre, title, plays, DENSE_RANK() OVER (PARTITION BY genre ORDER BY plays DESC) AS genre_rank
  FROM totals
)
SELECT genre, title, plays, genre_rank FROM ranked WHERE genre_rank <= 2
ORDER BY genre, genre_rank, title;
```
