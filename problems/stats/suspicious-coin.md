---
id: stats-019
slug: suspicious-coin
title: "The Suspicious Coin"
section: stats
difficulty: Hard
topics: [Bayes' theorem, Bayesian updating]
company: Fernplay Games
answer_type: numeric
answer: 0.8
tolerance: 0.001
---

## Statement

A **Fernplay Games** puzzle: a box holds **3 coins**: **2 fair** coins and **1 double-headed**
coin. You pick a coin at random and flip it **3 times**: it lands **heads all 3 times**.

What is the probability that you picked the **double-headed** coin?

## Hints

### Hint 1

Prior: P(double) = 1/3, P(fair) = 2/3.

### Hint 2

Likelihood of HHH: 1 for the double-headed coin, (1/2)³ = 1/8 for a fair coin.

### Hint 3

Posterior ∝ prior × likelihood; normalise.

## Verification

```python
def answer():
    prior_double, prior_fair = 1 / 3, 2 / 3
    like_double, like_fair = 1.0, 0.5 ** 3
    num = prior_double * like_double
    return num / (num + prior_fair * like_fair)
```

## Explanation

Bayes' theorem:

P(double | HHH) = P(HHH | double)·P(double) / P(HHH)

- P(HHH | double)·P(double) = 1 · 1/3 = 1/3
- P(HHH | fair)·P(fair) = 1/8 · 2/3 = 1/12
- P(HHH) = 1/3 + 1/12 = 5/12

P(double | HHH) = (1/3) / (5/12) = 4/5 = **0.8**.

Each head multiplies the odds of "double-headed vs fair" by 2. Prior odds are 1 : 2; after three
heads they're 8 : 2 = 4 : 1, i.e. 80 %. Thinking in **odds × likelihood ratios** makes sequential
updates very quick.
