---
id: stats-012
slug: halving-the-mde
title: "Halving the Detectable Effect"
section: stats
difficulty: Medium
topics: [A/B testing, Sample size, Power]
company: Tunely
answer_type: numeric
answer: 4
tolerance: 0.01
---

## Statement

**Tunely** planned an A/B test able to detect a **2 percentage point** lift in 7-day
retention, with α = 0.05 and 80 % power. Product now wants to detect a **1 percentage point**
lift instead, keeping α, power and the baseline rate the same.

By what **factor** does the required sample size per group change? (Answer with a number,
e.g. `2` means twice as many users.)

## Hints

### Hint 1

The standard error of a difference in means/proportions shrinks like 1/√n.

### Hint 2

To detect an effect δ you need δ to be a fixed multiple of the standard error.

## Verification

```python
def answer():
    old_mde, new_mde = 0.02, 0.01
    return (old_mde / new_mde) ** 2
```

## Explanation

For a two-sample test,

n ≈ (z₁₋α/₂ + z₁₋β)² · 2σ² / δ²

so the sample size scales with **1 / δ²** (δ = minimum detectable effect). Halving δ multiplies n
by (2)² = **4**.

Intuition: the standard error shrinks like 1/√n. To resolve an effect half as big, the standard
error must halve, which takes four times the data. This is why chasing tiny lifts gets
expensive fast.
