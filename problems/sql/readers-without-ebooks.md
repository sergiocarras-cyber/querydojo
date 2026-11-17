---
id: sql-019
slug: readers-without-ebooks
title: E-Reader Owners Without E-Books
section: sql
difficulty: Medium
topics: [Anti-join, EXISTS, HAVING, bool_or]
company: Shelfie Books
order_matters: true
---

## Statement

**Shelfie Books** wants to email customers who **bought an e-reader** (`category = 'ereader'`)
but have **never bought an e-book** (`category = 'ebook'`), at any time.

Return `customer_id`, sorted ascending.

## Schema

```sql
CREATE TABLE purchases (
  purchase_id  INTEGER PRIMARY KEY,
  customer_id  INTEGER NOT NULL,
  category     TEXT NOT NULL,
  purchased_at DATE NOT NULL
);
```

## Data

```sql
INSERT INTO purchases VALUES
  (1, 1, 'ereader',   '2025-01-10'),
  (2, 1, 'ebook',     '2025-01-11'),
  (3, 2, 'ereader',   '2025-02-01'),
  (4, 2, 'paperback', '2025-02-03'),
  (5, 3, 'ebook',     '2025-02-05'),
  (6, 4, 'ereader',   '2025-03-01'),
  (7, 4, 'ereader',   '2025-03-02'),
  (8, 5, 'paperback', '2025-03-03');
```

## Hidden Data

```sql
-- An e-book bought BEFORE the e-reader still disqualifies the customer.
INSERT INTO purchases VALUES
  (1, 7, 'ebook',     '2024-12-01'),
  (2, 7, 'ereader',   '2025-01-01'),
  (3, 8, 'ereader',   '2025-01-02'),
  (4, 8, 'audiobook', '2025-01-03');
```

## Starter

```sql
SELECT customer_id, category
FROM purchases;
```

## Hints

### Hint 1

A condition like `category = 'ereader' AND category <> 'ebook'` is evaluated **per row**, so it
can't see a customer's other purchases.

### Hint 2

Either group by customer and test the whole group (`HAVING`), or use `NOT EXISTS` to look for an
e-book purchase of the same customer.

### Hint 3

PostgreSQL's `bool_or(condition)` is true if the condition holds for at least one row of the group.

## Solution

```sql
SELECT customer_id
FROM purchases
GROUP BY customer_id
HAVING bool_or(category = 'ereader')
   AND NOT bool_or(category = 'ebook')
ORDER BY customer_id;
```

## Explanation

The question is about each **customer's set of purchases**, so it needs a per-customer view:

- `bool_or(category = 'ereader')`: the customer bought at least one e-reader.
- `NOT bool_or(category = 'ebook')`: none of their purchases is an e-book.

Portable equivalents:

```sql
-- conditional counts
HAVING COUNT(*) FILTER (WHERE category = 'ereader') > 0
   AND COUNT(*) FILTER (WHERE category = 'ebook') = 0

-- anti-join
SELECT DISTINCT p.customer_id FROM purchases p
WHERE p.category = 'ereader'
  AND NOT EXISTS (SELECT 1 FROM purchases e
                  WHERE e.customer_id = p.customer_id AND e.category = 'ebook')
```

Filtering rows with `WHERE category <> 'ebook'` only removes the e-book *rows*, leaving the
customer's e-reader row behind.

## Wrong Answers

```sql
SELECT DISTINCT customer_id FROM purchases
WHERE category = 'ereader' AND category <> 'ebook'
ORDER BY customer_id;
```

```sql
SELECT DISTINCT p.customer_id FROM purchases p
WHERE p.category = 'ereader'
  AND NOT EXISTS (SELECT 1 FROM purchases e
                  WHERE e.customer_id = p.customer_id AND e.category = 'ebook'
                    AND e.purchased_at > p.purchased_at)
ORDER BY p.customer_id;
```
