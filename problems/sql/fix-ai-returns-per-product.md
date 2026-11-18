---
id: sql-033
slug: fix-ai-returns-per-product
title: "Fix the AI: Returns per Product"
section: sql
difficulty: Easy
topics: [AI code review, LEFT JOIN, WHERE vs ON, NULL handling]
company: Cartwell Marketplace
ai_review: true
order_matters: true
---

## Statement

**Cartwell** wants a list of **every** product with its number of returns in 2025, including products
with **0** returns, to spot the ones that never come back.

An AI assistant wrote the query in the editor. It uses a `LEFT JOIN`, so it looks like it keeps every
product, but the products with zero returns are missing from the result.

**Find the bug and fix the query.** Return `name` and `returns_2025`, sorted by `returns_2025`
descending and then by `name`.

## Schema

```sql
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL
);

CREATE TABLE returns (
  return_id   INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL,
  returned_at DATE NOT NULL
);
```

## Data

```sql
INSERT INTO products VALUES (1, 'Desk lamp'), (2, 'Bookshelf'), (3, 'Rug'), (4, 'Mirror');

INSERT INTO returns VALUES
  (1, 1, '2025-02-01'),
  (2, 1, '2025-03-10'),
  (3, 2, '2024-12-30'),
  (4, 3, '2025-07-01');
```

## Hidden Data

```sql
-- Returns on the year boundaries; a product whose only returns are in 2026.
INSERT INTO products VALUES (1, 'Armchair'), (2, 'Blanket'), (3, 'Clock');
INSERT INTO returns VALUES (1, 1, '2025-12-31'), (2, 1, '2026-01-01'), (3, 2, '2026-03-01');
```

## Starter

```sql
-- Written by an AI assistant. It runs, but products with 0 returns are missing.
SELECT
  p.name,
  COUNT(r.return_id) AS returns_2025
FROM products AS p
LEFT JOIN returns AS r ON r.product_id = p.product_id
WHERE r.returned_at >= '2025-01-01'
  AND r.returned_at <  '2026-01-01'
GROUP BY p.product_id, p.name
ORDER BY returns_2025 DESC, p.name;
```

## Hints

### Hint 1

What is `r.returned_at` for a product that has no matching return after the `LEFT JOIN`?

### Hint 2

`NULL >= '2025-01-01'` is not true, so `WHERE` throws those rows away: the `LEFT JOIN` silently
becomes an inner join.

### Hint 3

Conditions on the right-hand table of a `LEFT JOIN` belong in the `ON` clause.

## Solution

```sql
SELECT
  p.name,
  COUNT(r.return_id) AS returns_2025
FROM products AS p
LEFT JOIN returns AS r
  ON  r.product_id = p.product_id
  AND r.returned_at >= '2025-01-01'
  AND r.returned_at <  '2026-01-01'
GROUP BY p.product_id, p.name
ORDER BY returns_2025 DESC, p.name;
```

## Explanation

A `WHERE` filter on a column of the right-hand table of a `LEFT JOIN` removes the rows where that
column is `NULL`, which are exactly the products without returns. The join becomes an inner join and
nobody notices, because the query still "works".

Moving the date filter into `ON` filters **which returns match**, while every product survives.
`COUNT(r.return_id)` counts only real matches, so products without 2025 returns get 0.

Common patches that don't work:

- `WHERE r.returned_at IS NULL OR ...` keeps products with no returns at all, but still drops products
  whose returns are all from other years (the Bookshelf).
- `COUNT(*)` instead of `COUNT(r.return_id)` counts the empty row, giving 1 instead of 0.

## Wrong Answers

### The AI's original query

Your result is the same as the AI's query. Look at which products are missing and at what the date
condition does to rows where the `LEFT JOIN` found no return.

```sql
SELECT p.name, COUNT(r.return_id) AS returns_2025
FROM products AS p
LEFT JOIN returns AS r ON r.product_id = p.product_id
WHERE r.returned_at >= '2025-01-01' AND r.returned_at < '2026-01-01'
GROUP BY p.product_id, p.name
ORDER BY returns_2025 DESC, p.name;
```

### `OR returned_at IS NULL` is not enough

Keeping `NULL` rows brings back products with no returns at all, but a product whose returns are all
from another year still disappears. Put the date condition in the `ON` clause instead.

```sql
SELECT p.name, COUNT(r.return_id) AS returns_2025
FROM products p LEFT JOIN returns r ON r.product_id = p.product_id
WHERE r.returned_at IS NULL OR (r.returned_at >= '2025-01-01' AND r.returned_at < '2026-01-01')
GROUP BY p.product_id, p.name ORDER BY returns_2025 DESC, p.name;
```

### COUNT(*) counts the empty row

With the filter in `ON`, a product without returns still has one row (with `NULL`s), and `COUNT(*)`
counts it as 1. Count a column of the right-hand table: `COUNT(r.return_id)`.

```sql
SELECT p.name, COUNT(*) AS returns_2025
FROM products p LEFT JOIN returns r
  ON r.product_id = p.product_id AND r.returned_at >= '2025-01-01' AND r.returned_at < '2026-01-01'
GROUP BY p.product_id, p.name ORDER BY returns_2025 DESC, p.name;
```
