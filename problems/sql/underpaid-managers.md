---
id: sql-023
slug: underpaid-managers
title: Underpaid Managers
section: sql
difficulty: Medium
topics: [Self-join, GROUP BY, HAVING]
company: Habitly
order_matters: true
---

## Statement

**Habitly**'s HR team suspects some managers earn **less than the average salary of their direct
reports**.

`employees.manager_id` points to the employee's manager (`NULL` for the CEO). Return, for each
such manager:

- `manager`: the manager's name
- `manager_salary`
- `avg_report_salary`: average salary of their **direct** reports, rounded to 2 decimals

Only managers whose salary is **strictly lower** than that average. Sort by `manager`.

## Schema

```sql
CREATE TABLE employees (
  employee_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  manager_id  INTEGER REFERENCES employees(employee_id),
  salary      INTEGER NOT NULL
);
```

## Data

```sql
INSERT INTO employees VALUES
  (1, 'Noor',   NULL, 210000),
  (2, 'Elias',  1,    140000),
  (3, 'Maya',   1,    115000),
  (4, 'Tariq',  2,    160000),
  (5, 'Lena',   2,    130000),
  (6, 'Sven',   3,    110000),
  (7, 'Aiko',   3,    125000),
  (8, 'Bruno',  4,    90000);
```

## Hidden Data

```sql
-- Equal to the average is not "lower"; indirect reports don't count.
INSERT INTO employees VALUES
  (1, 'Ana', NULL, 100),
  (2, 'Ben', 1,    100),
  (3, 'Cleo', 1,   100),
  (4, 'Dan', 2,    500),
  (5, 'Eve', 4,    10);
```

## Starter

```sql
SELECT e.name, e.manager_id, e.salary
FROM employees AS e;
```

## Hints

### Hint 1

Join `employees` to itself: one copy plays the **manager**, the other the **report**
(`r.manager_id = m.employee_id`).

### Hint 2

Group by the manager and compare `m.salary` with `AVG(r.salary)` in `HAVING`.

## Solution

```sql
SELECT
  m.name   AS manager,
  m.salary AS manager_salary,
  ROUND(AVG(r.salary), 2) AS avg_report_salary
FROM employees AS m
JOIN employees AS r ON r.manager_id = m.employee_id
GROUP BY m.employee_id, m.name, m.salary
HAVING m.salary < AVG(r.salary)
ORDER BY m.name;
```

## Explanation

1. **Self-join:** `m` and `r` are two aliases of `employees`. The join condition pairs each
   manager with each of their **direct** reports; managers without reports simply don't appear.
2. **Aggregate per manager:** group by the manager's columns and average the reports' salaries.
3. **Filter groups:** `HAVING m.salary < AVG(r.salary)`, using strict `<` as required.

In the example, Elias (140 000) manages Tariq and Lena (avg 145 000) and Maya (115 000) manages
Sven and Aiko (avg 117 500): both are underpaid. Noor (210 000, reports avg 127 500) and Tariq
(160 000, one report at 90 000) are not.

Indirect reports (reports of reports) would need a recursive CTE.

## Wrong Answers

```sql
SELECT m.name AS manager, m.salary AS manager_salary, ROUND(AVG(r.salary), 2) AS avg_report_salary
FROM employees m JOIN employees r ON r.manager_id = m.employee_id
GROUP BY m.employee_id, m.name, m.salary
HAVING m.salary <= AVG(r.salary)
ORDER BY m.name;
```

```sql
SELECT m.name AS manager, m.salary AS manager_salary, ROUND(AVG(r.salary), 2) AS avg_report_salary
FROM employees m JOIN employees r ON m.manager_id = r.employee_id
GROUP BY m.employee_id, m.name, m.salary
HAVING m.salary < AVG(r.salary)
ORDER BY m.name;
```
