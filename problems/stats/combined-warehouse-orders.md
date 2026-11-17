---
id: stats-018
slug: combined-warehouse-orders
title: "Combined Warehouse Volume"
section: stats
difficulty: Medium
topics: [Variance, Independence]
company: Basketly
answer_type: numeric
answer: 11.6619
tolerance: 0.01
---

## Statement

Two **Basketly** warehouses handle orders independently. Daily orders:

- Warehouse X: mean **100**, standard deviation **10**
- Warehouse Y: mean **80**, standard deviation **6**

What is the **standard deviation** of the **total** daily orders X + Y?

## Hints

### Hint 1

For independent variables, variances add: Var(X + Y) = Var(X) + Var(Y).

### Hint 2

Standard deviations do **not** add. Square, add, then take the square root.

## Verification

```python
from math import sqrt

def answer():
    return sqrt(10 ** 2 + 6 ** 2)
```

## Explanation

For **independent** X and Y, Var(X + Y) = Var(X) + Var(Y) = 10² + 6² = 136, so

SD(X + Y) = √136 ≈ **11.66** orders.

Adding standard deviations (10 + 6 = 16) is the classic mistake: it would only be right if X and
Y were perfectly positively correlated. In general
Var(X + Y) = Var(X) + Var(Y) + 2·Cov(X, Y). Independent fluctuations partly cancel out, which is
the statistical reason pooling demand reduces relative variability.
