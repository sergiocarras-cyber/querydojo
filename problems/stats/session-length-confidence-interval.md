---
id: stats-013
slug: session-length-confidence-interval
title: "Confidence Interval for Session Length"
section: stats
difficulty: Medium
topics: [Confidence intervals, Standard error]
company: Habitly
answer_type: numeric
answer: 13.38
tolerance: 0.01
---

## Statement

A random sample of **100** Habitly sessions has a mean length of **12.4 minutes** and a
standard deviation of **5 minutes**.

Using the normal approximation (z = 1.96), what is the **upper bound** of the 95 % confidence
interval for the mean session length?

## Hints

### Hint 1

The standard error of the mean is s / √n.

### Hint 2

CI = mean ± 1.96 · SE.

## Verification

```python
from math import sqrt

def answer():
    return 12.4 + 1.96 * 5 / sqrt(100)
```

## Explanation

- Standard error: SE = s / √n = 5 / √100 = 0.5 minutes.
- Margin of error: 1.96 × 0.5 = 0.98.
- 95 % CI: 12.4 ± 0.98 = [11.42, **13.38**].

Interpretation: if we repeated the sampling many times, about 95 % of intervals built this way
would contain the true mean. It is *not* "95 % of sessions last between 11.4 and 13.4 minutes";
individual sessions vary much more (σ = 5).

With n = 100 the t-distribution (t ≈ 1.984) would give almost the same answer.
