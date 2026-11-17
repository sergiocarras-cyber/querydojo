---
id: stats-008
slug: late-deliveries-normal
title: "Late Deliveries"
section: stats
difficulty: Medium
topics: [Normal distribution, z-scores]
company: Basketly
answer_type: numeric
answer: 0.0668
tolerance: 0.001
---

## Statement

**Basketly** delivery times are approximately **Normal** with mean **32** minutes and standard
deviation **6** minutes. A delivery is "late" if it takes **more than 41 minutes**.

What fraction of deliveries is late? Use Φ(1.5) ≈ 0.9332 if you need it.

## Hints

### Hint 1

Standardise: z = (x − μ) / σ.

### Hint 2

P(X > 41) = P(Z > z) = 1 − Φ(z).

## Verification

```python
from math import erf, sqrt

def answer():
    z = (41 - 32) / 6
    return 1 - 0.5 * (1 + erf(z / sqrt(2)))
```

## Explanation

Standardise the threshold: z = (41 − 32) / 6 = **1.5**, i.e. 1.5 standard deviations above
the mean.

P(X > 41) = P(Z > 1.5) = 1 − Φ(1.5) ≈ 1 − 0.9332 = **0.0668**, about 6.7 % of deliveries.

Useful anchors for the standard normal: about 68 % within ±1σ, 95 % within ±1.96σ, 99.7 %
within ±3σ. Delivery times are usually right-skewed in reality, so a Normal model tends to
*underestimate* very late deliveries; worth mentioning in an interview.
