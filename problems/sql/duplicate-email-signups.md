---
id: sql-012
slug: duplicate-email-signups
title: Duplicate Email Signups
section: sql
difficulty: Easy
topics: [String functions, GROUP BY, HAVING, Data cleaning]
company: Chirpnest
order_matters: true
---

## Statement

**Chirpnest** suspects that some people created several accounts with the same email typed
differently: `Ana@Mail.io` and `ana@mail.io` are the same address, and so are `ben@mail.io` and
`  ben@mail.io` (leading/trailing spaces).

Normalise emails by **trimming spaces and lower-casing**. Return the normalised `email` and the
number of `accounts` using it, for emails used by **more than one** account. Sort by `accounts`
descending, then `email`.

## Schema

```sql
CREATE TABLE accounts (
  account_id INTEGER PRIMARY KEY,
  email      TEXT NOT NULL,
  created_at DATE NOT NULL
);
```

## Data

```sql
INSERT INTO accounts VALUES
  (1, 'ana@mail.io',  '2025-01-02'),
  (2, 'Ana@Mail.io',  '2025-01-09'),
  (3, ' ben@mail.io', '2025-01-10'),
  (4, 'ben@mail.io',  '2025-02-01'),
  (5, 'cy@mail.io',   '2025-02-03'),
  (6, 'dee@mail.io',  '2025-02-05'),
  (7, 'DEE@mail.io',  '2025-02-06'),
  (8, 'dee@mail.io ', '2025-02-07');
```

## Hidden Data

```sql
INSERT INTO accounts VALUES
  (1, 'X@Shop.IO  ', '2025-03-01'),
  (2, 'x@shop.io',   '2025-03-02'),
  (3, 'y@shop.io',   '2025-03-03'),
  (4, 'Y@shop.io',   '2025-03-04'),
  (5, 'z@shop.io',   '2025-03-05');
```

## Starter

```sql
SELECT email, COUNT(*) AS accounts
FROM accounts
GROUP BY email;
```

## Hints

### Hint 1

`LOWER(TRIM(email))` normalises an address.

### Hint 2

Group by the normalised expression and keep groups with `HAVING COUNT(*) > 1`.

## Solution

```sql
SELECT LOWER(TRIM(email)) AS email, COUNT(*) AS accounts
FROM accounts
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY accounts DESC, email;
```

## Explanation

1. `TRIM` removes leading and trailing spaces and `LOWER` makes the comparison case-insensitive.
   Apply both, otherwise `'DEE@mail.io'` and `'dee@mail.io '` stay different.
2. Group by the normalised expression, not by the raw column.
3. `HAVING` filters groups after aggregation (`WHERE` can't use `COUNT`).

In PostgreSQL you could also `GROUP BY 1`. In production, enforce this with a unique index on
`LOWER(TRIM(email))` (or the `citext` type) so duplicates can't be created in the first place.

## Wrong Answers

```sql
SELECT LOWER(email) AS email, COUNT(*) AS accounts
FROM accounts GROUP BY LOWER(email) HAVING COUNT(*) > 1
ORDER BY accounts DESC, email;
```

```sql
SELECT TRIM(email) AS email, COUNT(*) AS accounts
FROM accounts GROUP BY TRIM(email) HAVING COUNT(*) > 1
ORDER BY accounts DESC, email;
```
