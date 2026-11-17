---
id: stats-015
slug: colliding-promo-codes
title: "Colliding Promo Codes"
section: stats
difficulty: Medium
topics: [Birthday problem, Complement rule]
company: Basketly
answer_type: numeric
answer: 0.5464
tolerance: 0.002
---

## Statement

**Basketly** hands out promo codes by picking uniformly at random (with replacement) from
**1 000** possible codes. **40** customers each receive one code.

What is the probability that **at least two customers get the same code**?

## Hints

### Hint 1

Compute the probability that all 40 codes are different, then use the complement.

### Hint 2

The i-th customer (starting at 0) must avoid the i codes already used: probability (1000 − i)/1000.

## Verification

```python
def answer():
    all_distinct = 1.0
    for i in range(40):
        all_distinct *= (1000 - i) / 1000
    return 1 - all_distinct
```

## Explanation

This is the **birthday problem** in disguise.

P(all different) = (1000/1000)·(999/1000)·(998/1000)···(961/1000) ≈ 0.4536

P(at least one collision) = 1 − 0.4536 ≈ **0.546**.

Collisions become likely surprisingly early because what matters is the number of **pairs**:
40 customers form C(40, 2) = 780 pairs, each colliding with probability 1/1000. A quick
approximation is 1 − e^(−780/1000) ≈ 0.54.

That's why unique ids are drawn from huge spaces (or checked for duplicates).
