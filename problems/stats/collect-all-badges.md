---
id: stats-014
slug: collect-all-badges
title: "Collect All the Badges"
section: stats
difficulty: Hard
topics: [Expected value, Coupon collector, Linearity of expectation]
company: Fernplay Games
answer_type: numeric
answer: 14.7
tolerance: 0.01
---

## Statement

Each **Fernplay Games** booster pack contains **one** of **6** badges, each equally likely and
independent of previous packs.

What is the expected number of packs a player must open to collect **all 6** badges?

## Hints

### Hint 1

Split the process into stages: waiting for the 1st new badge, then the 2nd new badge, and so on.

### Hint 2

When you already have k distinct badges, a pack gives a new one with probability (6 − k)/6.

### Hint 3

Each stage is geometric; add the expectations (linearity of expectation).

## Verification

```python
def answer():
    n = 6
    return sum(n / (n - k) for k in range(n))
```

## Explanation

This is the **coupon collector** problem.

With k badges already collected, each pack is new with probability (6 − k)/6, so the wait for
the next new badge is geometric with mean 6/(6 − k). By linearity of expectation:

E = 6/6 + 6/5 + 6/4 + 6/3 + 6/2 + 6/1 = 6 · (1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6) = 6 · 2.45 = **14.7**.

In general E = n·Hₙ ≈ n·ln n. Notice where the time goes: the last badge alone takes 6 packs on
average, as many as the first three combined, which is why games often add "pity" mechanics.
