---
id: stats-002
slug: at-least-one-jackpot
title: "At Least One Jackpot"
section: stats
difficulty: Easy
topics: [Complement rule, Independence]
company: Fernplay Games
answer_type: numeric
answer: 0.5177
tolerance: 0.001
---

## Statement

A daily spin in **Fernplay Games** lands on the jackpot with probability **1/6**, independently
each day. A player spins once a day for **4 days**.

What is the probability that they hit the jackpot **at least once**?

## Hints

### Hint 1

"At least once" is easier through its complement: "never".

### Hint 2

The probability of missing on one day is 5/6. Independent days multiply.

## Verification

```python
def answer():
    return 1 - (5 / 6) ** 4
```

## Explanation

Use the **complement rule**: P(at least one) = 1 − P(none).

- P(miss on a given day) = 5/6.
- The days are independent, so P(miss all 4) = (5/6)⁴ = 625/1296 ≈ 0.4823.
- P(at least one jackpot) = 1 − 0.4823 ≈ **0.5177**.

Adding 1/6 four times (= 0.667) is wrong: it double-counts the outcomes with several jackpots.
As a sanity check, with 7 or more spins the sum would exceed 1, which is impossible for a
probability.
