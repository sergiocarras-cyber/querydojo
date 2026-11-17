---
id: stats-020
slug: many-metrics-false-positives
title: "Too Many Metrics"
section: stats
difficulty: Medium
topics: [Multiple testing, Type I and II errors]
company: Chirpnest
answer_type: numeric
answer: 0.5367
tolerance: 0.001
---

## Statement

A **Chirpnest** experiment tracks **15 independent metrics**, each tested at α = 0.05. Suppose
the change truly affects **none** of them.

What is the probability that **at least one** metric comes out "significant" anyway?

## Hints

### Hint 1

For each metric, P(no false positive) = 0.95.

### Hint 2

Use independence and the complement rule.

## Verification

```python
def answer():
    return 1 - 0.95 ** 15
```

## Explanation

Each test has a 5 % false positive rate, so P(no false positives across 15 independent tests) =
0.95¹⁵ ≈ 0.4633 and

P(at least one false positive) = 1 − 0.4633 ≈ **0.537**.

More likely than not, some metric "wins" by pure chance. Remedies:

- pick **one primary metric** before the test;
- correct for multiple comparisons: **Bonferroni** (test each at α/15 ≈ 0.0033) or
  **Benjamini–Hochberg** to control the false discovery rate;
- treat secondary-metric wins as hypotheses for a follow-up test.
