---
id: stats-001
slug: two-dice-high-roll
title: "Two Dice, High Roll"
section: stats
difficulty: Easy
topics: [Probability basics, Counting]
company: Fernplay Games
answer_type: numeric
answer: 0.1667
tolerance: 0.001
---

## Statement

In **Fernplay Games**' board-game app, a player rolls **two fair six-sided dice** and gets a
bonus if the **sum is at least 10**.

What is the probability of getting the bonus? Give a decimal (e.g. `0.25`) or a fraction.

## Hints

### Hint 1

List the outcomes: two dice have 6 × 6 = 36 equally likely ordered results.

### Hint 2

Count the pairs that sum to 10, 11 and 12. Remember that (4, 6) and (6, 4) are different outcomes.

## Verification

```python
from itertools import product

def answer():
    hits = sum(1 for a, b in product(range(1, 7), repeat=2) if a + b >= 10)
    return hits / 36
```

## Explanation

All 36 ordered outcomes are equally likely. Sums of at least 10:

| sum | outcomes | count |
| --- | --- | --- |
| 10 | (4,6) (5,5) (6,4) | 3 |
| 11 | (5,6) (6,5) | 2 |
| 12 | (6,6) | 1 |

That is 6 favourable outcomes, so P = 6/36 = **1/6 ≈ 0.1667**.

**Common mistake:** counting unordered pairs ({4,6} once) undercounts, because the 21 unordered
pairs are *not* equally likely.
