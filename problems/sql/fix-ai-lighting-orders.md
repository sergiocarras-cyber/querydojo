---
id: sql-031
slug: fix-ai-lighting-orders
title: "Fix the AI: Lighting Orders by Channel"
section: sql
difficulty: Medium
topics: [AI code review, Fan-out, JOIN, EXISTS]
company: Loomly Home
ai_review: true
order_matters: true
---

## Statement

**Loomly Home** asked an AI assistant for a quick report: for each acquisition `channel`, how many
orders contained **at least one** item of category `'lighting'`, and how much revenue those orders
brought in (`orders.total`).

The AI's query (in the editor) runs without errors, and the marketing team already put the numbers in
a slide. Something is off: the lighting revenue is larger than the revenue of some whole channels.

**Find the bug and fix the query.** Return:

- `channel`
- `lighting_orders`: number of orders with at least one lighting item
- `revenue`: sum of `total` of those orders

Channels without lighting orders don't appear. Sort by `revenue` descending, then `channel`.

## Schema

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  channel     TEXT NOT NULL
);

CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  total       NUMERIC(10, 2) NOT NULL
);

CREATE TABLE order_items (
  item_id  INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  category TEXT NOT NULL
);
```

## Data

```sql
INSERT INTO customers VALUES (1, 'ads'), (2, 'organic'), (3, 'ads'), (4, 'email');

INSERT INTO orders VALUES
  (10, 1, 120.00),
  (11, 2,  45.50),
  (12, 3,  80.00),
  (13, 4,  30.00),
  (14, 2, 200.00);

INSERT INTO order_items VALUES
  (100, 10, 'lighting'),
  (101, 10, 'lighting'),
  (102, 10, 'rugs'),
  (103, 11, 'lighting'),
  (104, 12, 'rugs'),
  (105, 13, 'lighting'),
  (106, 14, 'lighting'),
  (107, 14, 'lighting'),
  (108, 14, 'lighting');
```

## Hidden Data

```sql
-- Two different orders with the same total; an order with two lighting items; a channel without lighting.
INSERT INTO customers VALUES (1, 'ads'), (2, 'ads'), (3, 'social'), (4, 'email');
INSERT INTO orders VALUES (1, 1, 50.00), (2, 2, 50.00), (3, 3, 99.90), (4, 4, 10.00);
INSERT INTO order_items VALUES
  (1, 1, 'lighting'), (2, 2, 'lighting'), (3, 3, 'lighting'), (4, 3, 'lighting'), (5, 4, 'rugs');
```

## Starter

```sql
-- Written by an AI assistant. It runs, but the numbers are wrong.
SELECT
  c.channel,
  COUNT(o.order_id) AS lighting_orders,
  SUM(o.total)      AS revenue
FROM customers AS c
JOIN orders AS o      ON o.customer_id = c.customer_id
JOIN order_items AS i ON i.order_id = o.order_id
WHERE i.category = 'lighting'
GROUP BY c.channel
ORDER BY revenue DESC, c.channel;
```

## Hints

### Hint 1

Count by hand how many lighting orders `organic` has in the sample data, and compare with the AI's
result.

### Hint 2

After `JOIN order_items`, an order appears once **per matching item**. Every column of `orders` is
repeated on each of those rows.

### Hint 3

Decide "does this order contain lighting?" without multiplying rows: `WHERE EXISTS (...)`.

## Solution

```sql
SELECT
  c.channel,
  COUNT(*)     AS lighting_orders,
  SUM(o.total) AS revenue
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.customer_id
WHERE EXISTS (
  SELECT 1
  FROM order_items AS i
  WHERE i.order_id = o.order_id
    AND i.category = 'lighting'
)
GROUP BY c.channel
ORDER BY revenue DESC, c.channel;
```

## Explanation

This is the classic **fan-out** bug. Joining a child table (`order_items`) repeats the parent row
(`orders`) once per child. Order 14 has three lighting items, so the AI counts it three times and
adds its 200.00 three times.

`EXISTS` answers the yes/no question per order without changing the number of rows, so `COUNT(*)`
and `SUM(total)` see each order exactly once.

Patches that only look right:

- `COUNT(DISTINCT o.order_id)` fixes the count, but `SUM(o.total)` is still inflated.
- `SUM(DISTINCT o.total)` removes duplicates **by value**, so two different orders of 50.00 count once.

Reviewing AI-generated SQL: whenever a query joins a one-to-many table and then sums a column of the
"one" side, check the grain of the rows before trusting the totals.

## Wrong Answers

### The AI's original query

Your result is the same as the AI's query. Compare it with a hand count of the sample data: which
orders are being counted more than once?

```sql
SELECT c.channel, COUNT(o.order_id) AS lighting_orders, SUM(o.total) AS revenue
FROM customers AS c
JOIN orders AS o      ON o.customer_id = c.customer_id
JOIN order_items AS i ON i.order_id = o.order_id
WHERE i.category = 'lighting'
GROUP BY c.channel
ORDER BY revenue DESC, c.channel;
```

### COUNT(DISTINCT) fixes only the count

`COUNT(DISTINCT o.order_id)` gives the right number of orders, but the join still repeats each order
once per lighting item, so `SUM(o.total)` is inflated. Remove the duplication itself, for example
with `EXISTS`.

```sql
SELECT c.channel, COUNT(DISTINCT o.order_id) AS lighting_orders, SUM(o.total) AS revenue
FROM customers c JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items i ON i.order_id = o.order_id
WHERE i.category = 'lighting'
GROUP BY c.channel ORDER BY revenue DESC, c.channel;
```

### SUM(DISTINCT) removes equal totals

`SUM(DISTINCT o.total)` de-duplicates by **value**: two different orders that both cost 50.00 are
added once. De-duplicate orders, not amounts.

```sql
SELECT c.channel, COUNT(DISTINCT o.order_id) AS lighting_orders, SUM(DISTINCT o.total) AS revenue
FROM customers c JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items i ON i.order_id = o.order_id
WHERE i.category = 'lighting'
GROUP BY c.channel ORDER BY revenue DESC, c.channel;
```
