---
id: stats-007
slug: support-tickets-poisson
title: "Support Tickets per Hour"
section: stats
difficulty: Medium
topics: [Poisson distribution, Complement rule]
company: Chirpnest
answer_type: numeric
answer: 0.8009
tolerance: 0.001
---

## Statement

**Chirpnest**'s support inbox receives tickets at an average rate of **3 per hour**, arriving
independently (model the hourly count as Poisson).

What is the probability that **at least 2** tickets arrive in a given hour?

## Hints

### Hint 1

For a Poisson(λ) count, P(N = k) = e^(−λ)·λ^k / k!.

### Hint 2

P(N ≥ 2) = 1 − P(N = 0) − P(N = 1).

## Verification

```python
from math import exp

def answer():
    lam = 3
    return 1 - exp(-lam) * (1 + lam)
```

## Explanation

With λ = 3:

- P(N = 0) = e⁻³ ≈ 0.0498
- P(N = 1) = 3·e⁻³ ≈ 0.1494

P(N ≥ 2) = 1 − 0.0498 − 0.1494 ≈ **0.8009**.

The Poisson distribution models counts of independent events in a fixed interval with a
constant average rate. Its mean and variance are both λ, a quick check you can make on real
data (if the variance is much larger, events are "clumpy" and Poisson underestimates the
tails).
