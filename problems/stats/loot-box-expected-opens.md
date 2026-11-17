---
id: stats-004
slug: loot-box-expected-opens
title: "Expected Loot Boxes"
section: stats
difficulty: Easy
topics: [Expected value, Geometric distribution]
company: Fernplay Games
answer_type: numeric
answer: 25
tolerance: 0.01
---

## Statement

Each loot box in **Fernplay Games** contains a legendary skin with probability **4 %**,
independently of other boxes.

On average, how many boxes does a player need to open to get their **first** legendary skin
(counting the box that contains it)?

## Hints

### Hint 1

The number of trials until the first success follows a geometric distribution.

### Hint 2

For success probability p, the expected number of trials is 1/p.

## Verification

```python
def answer():
    return 1 / 0.04
```

## Explanation

Let N be the number of boxes opened until the first legendary (inclusive). N is **geometric**
with p = 0.04, and E[N] = 1/p = **25**.

**Why 1/p?** Condition on the first box: with probability p you're done after 1 box; otherwise
you've used 1 box and the situation restarts:

E[N] = 1 + (1 − p)·E[N] ⇒ p·E[N] = 1 ⇒ E[N] = 1/p.

Note that the median is lower than the mean (about 17 boxes): the distribution has a long right
tail, and some unlucky players need far more than 25.
