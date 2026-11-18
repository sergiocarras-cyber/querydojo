---
id: sql-032
slug: fix-ai-trial-conversion
title: "Fix the AI: Trial Conversion by Campaign"
section: sql
difficulty: Medium
topics: [AI code review, Integer division, LEFT JOIN, Conversion rate]
company: Habitly
ai_review: true
order_matters: true
---

## Statement

**Habitly** asked an AI assistant for the conversion rate of each signup campaign: the share of
signed-up users who made **at least one** payment. Subscribers pay every month, so a user can have
many payments.

The AI's query (in the editor) says every campaign converts at **0 %**, and the signup counts don't
match the CRM either.

**Find the bugs and fix the query.** For each `campaign` return:

- `signups`: number of users who signed up
- `paying_users`: users with at least one payment
- `conversion_pct`: `100 × paying_users / signups`, rounded to 1 decimal

Sort by `campaign`.

## Schema

```sql
CREATE TABLE signups (
  user_id      INTEGER PRIMARY KEY,
  campaign     TEXT NOT NULL,
  signed_up_at DATE NOT NULL
);

CREATE TABLE payments (
  payment_id INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  paid_at    DATE NOT NULL,
  amount     NUMERIC(8, 2) NOT NULL
);
```

## Data

```sql
INSERT INTO signups VALUES
  (1, 'spring',   '2025-03-01'),
  (2, 'spring',   '2025-03-02'),
  (3, 'spring',   '2025-03-02'),
  (4, 'spring',   '2025-03-05'),
  (5, 'podcast',  '2025-03-03'),
  (6, 'podcast',  '2025-03-04'),
  (7, 'podcast',  '2025-03-06'),
  (8, 'referral', '2025-03-07'),
  (9, 'referral', '2025-03-08');

INSERT INTO payments VALUES
  (1, 1, '2025-03-08', 4.99),
  (2, 1, '2025-04-08', 4.99),
  (3, 2, '2025-03-09', 4.99),
  (4, 7, '2025-03-13', 9.99),
  (5, 7, '2025-04-13', 9.99),
  (6, 7, '2025-05-13', 9.99);
```

## Hidden Data

```sql
-- Repeated payments and a fraction that needs real division (2/3).
INSERT INTO signups VALUES (1, 'tv', '2025-01-01'), (2, 'tv', '2025-01-02'), (3, 'tv', '2025-01-03'),
  (4, 'blog', '2025-01-04');
INSERT INTO payments VALUES (1, 1, '2025-01-10', 9.99), (2, 1, '2025-02-10', 9.99), (3, 3, '2025-01-12', 9.99),
  (4, 4, '2025-01-15', 9.99);
```

## Starter

```sql
-- Written by an AI assistant. It runs, but the numbers are wrong.
SELECT
  s.campaign,
  COUNT(*)         AS signups,
  COUNT(p.user_id) AS paying_users,
  ROUND(COUNT(p.user_id) / COUNT(*) * 100, 1) AS conversion_pct
FROM signups AS s
LEFT JOIN payments AS p ON p.user_id = s.user_id
GROUP BY s.campaign
ORDER BY s.campaign;
```

## Hints

### Hint 1

There are **two** separate problems. `spring` has 4 signups in the data; how many does the AI report?

### Hint 2

`COUNT(p.user_id) / COUNT(*)` divides two integers in PostgreSQL. What is `3 / 5`?

### Hint 3

Reduce payments to one row per paying user (`SELECT DISTINCT user_id FROM payments`) before joining,
and multiply by `100.0`.

## Solution

```sql
WITH paying AS (
  SELECT DISTINCT user_id
  FROM payments
)
SELECT
  s.campaign,
  COUNT(*)         AS signups,
  COUNT(p.user_id) AS paying_users,
  ROUND(100.0 * COUNT(p.user_id) / COUNT(*), 1) AS conversion_pct
FROM signups AS s
LEFT JOIN paying AS p ON p.user_id = s.user_id
GROUP BY s.campaign
ORDER BY s.campaign;
```

## Explanation

The AI's query has two independent bugs, and fixing only one of them still gives wrong numbers:

1. **Fan-out.** `LEFT JOIN payments` produces one row per payment, so a subscriber who paid three
   times counts as three signups and three paying users. Reduce payments to the grain you need (one
   row per paying user) **before** joining.
2. **Integer division.** In PostgreSQL `3 / 5` is `0`. Multiplying by 100 afterwards doesn't help.
   Use `100.0 * a / b` so the division happens in decimals.

Conversion questions are everywhere in product analytics; reviewers are expected to catch both
patterns quickly.

## Wrong Answers

### The AI's original query

Your result is the same as the AI's query. Check the signups of `spring` by hand, and work out what
PostgreSQL returns for an integer division like `3 / 5`.

```sql
SELECT s.campaign, COUNT(*) AS signups, COUNT(p.user_id) AS paying_users,
       ROUND(COUNT(p.user_id) / COUNT(*) * 100, 1) AS conversion_pct
FROM signups AS s
LEFT JOIN payments AS p ON p.user_id = s.user_id
GROUP BY s.campaign
ORDER BY s.campaign;
```

### Only the division is fixed

Decimals are right now, but the join still produces one row per payment: repeat subscribers inflate
both `signups` and `paying_users`. Count each user once.

```sql
SELECT s.campaign, COUNT(*) AS signups, COUNT(p.user_id) AS paying_users,
       ROUND(100.0 * COUNT(p.user_id) / COUNT(*), 1) AS conversion_pct
FROM signups s LEFT JOIN payments p ON p.user_id = s.user_id
GROUP BY s.campaign ORDER BY s.campaign;
```

### Only the duplicates are fixed

`COUNT(DISTINCT ...)` gives the right counts, but dividing two integers still truncates to 0. Use
`100.0 * ...` so the division keeps decimals.

```sql
SELECT s.campaign, COUNT(DISTINCT s.user_id) AS signups, COUNT(DISTINCT p.user_id) AS paying_users,
       ROUND(COUNT(DISTINCT p.user_id) / COUNT(DISTINCT s.user_id) * 100, 1) AS conversion_pct
FROM signups s LEFT JOIN payments p ON p.user_id = s.user_id
GROUP BY s.campaign ORDER BY s.campaign;
```
