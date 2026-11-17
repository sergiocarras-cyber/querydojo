---
id: stats-005
slug: expected-max-of-two-dice
title: "Expected Maximum of Two Dice"
section: stats
difficulty: Medium
topics: [Expected value, Order statistics]
company: Fernplay Games
answer_type: numeric
answer: 4.4722
tolerance: 0.001
---

## Statement

In a **Fernplay Games** mini-game the player rolls two fair dice and **keeps the higher** value.

What is the expected value of the kept die? Give at least 3 decimals.

## Hints

### Hint 1

Find P(max = k) for k = 1…6. It's easier to start from P(max ≤ k).

### Hint 2

P(max ≤ k) = (k/6)², so P(max = k) = (k² − (k−1)²)/36 = (2k − 1)/36.

## Verification

```python
def answer():
    return sum(max(a, b) for a in range(1, 7) for b in range(1, 7)) / 36
```

## Explanation

Both dice are ≤ k with probability (k/6)², so

P(max = k) = P(max ≤ k) − P(max ≤ k−1) = (2k − 1)/36.

| k | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| P(max = k) | 1/36 | 3/36 | 5/36 | 7/36 | 9/36 | 11/36 |

E[max] = (1·1 + 2·3 + 3·5 + 4·7 + 5·9 + 6·11) / 36 = 161/36 ≈ **4.4722**.

Sanity check: it is above 3.5 (one die's mean), as keeping the better of two rolls should be.
The trick "work with P(max ≤ k)" generalises to the max of *n* variables.
