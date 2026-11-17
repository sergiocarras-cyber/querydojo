---
id: stats-009
slug: ab-test-z-score
title: "A/B Test z-Statistic"
section: stats
difficulty: Medium
topics: [A/B testing, Hypothesis testing, Two-proportion z-test]
company: Cartwell Marketplace
answer_type: numeric
answer: 2.0914
tolerance: 0.005
---

## Statement

**Cartwell** tests a new checkout button.

| group | visitors | purchases |
| --- | --- | --- |
| control | 10 000 | 400 |
| treatment | 10 000 | 460 |

Compute the **two-proportion z-statistic** using the **pooled** proportion. Give at least 2 decimals.

## Hints

### Hint 1

p̂₁ = 0.040, p̂₂ = 0.046. The pooled proportion is total purchases / total visitors.

### Hint 2

SE = √(p̂(1 − p̂)(1/n₁ + 1/n₂)) with the pooled p̂.

### Hint 3

z = (p̂₂ − p̂₁) / SE.

## Verification

```python
from math import sqrt

def answer():
    n1 = n2 = 10_000
    p1, p2 = 400 / n1, 460 / n2
    p = (400 + 460) / (n1 + n2)
    se = sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    return (p2 - p1) / se
```

## Explanation

Under H₀ (no difference) both groups share one conversion rate, estimated by pooling:

- p̂ = 860 / 20 000 = 0.043
- SE = √(0.043 · 0.957 · (1/10 000 + 1/10 000)) ≈ 0.002869
- z = (0.046 − 0.040) / 0.002869 ≈ **2.09**

Since |z| > 1.96, the difference is significant at the 5 % level (two-sided p ≈ 0.036).

Statistical significance is not the end of the story: the lift is +0.6 percentage points
(+15 % relative); check whether that's practically meaningful, whether the test ran its planned
duration (no peeking), and guardrail metrics.
