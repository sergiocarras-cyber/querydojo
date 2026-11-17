---
id: stats-006
slug: exactly-three-conversions
title: "Exactly Three Conversions"
section: stats
difficulty: Easy
topics: [Binomial distribution]
company: Loomly Home
answer_type: numeric
answer: 0.2013
tolerance: 0.001
---

## Statement

**Loomly Home** shows a discount banner to **10** independent visitors. Each one buys with
probability **0.2**.

What is the probability that **exactly 3** of them buy?

## Hints

### Hint 1

The number of buyers is Binomial(n = 10, p = 0.2).

### Hint 2

P(X = k) = C(n, k)·p^k·(1 − p)^(n − k).

## Verification

```python
from math import comb

def answer():
    return comb(10, 3) * 0.2 ** 3 * 0.8 ** 7
```

## Explanation

The number of buyers X counts successes in 10 independent trials with the same p, so
X ~ **Binomial(10, 0.2)**:

P(X = 3) = C(10, 3) · 0.2³ · 0.8⁷ = 120 · 0.008 · 0.2097 ≈ **0.2013**.

- C(10, 3) = 120 counts *which* 3 visitors buy.
- 0.2³ is the probability that those 3 buy, 0.8⁷ that the other 7 don't.

The expected number of buyers is n·p = 2, and the most likely value is 2 (≈ 0.302); 3 is the
second most likely.
