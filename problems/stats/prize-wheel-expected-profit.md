---
id: stats-017
slug: prize-wheel-expected-profit
title: "Is the Prize Wheel Worth It?"
section: stats
difficulty: Medium
topics: [Expected value]
company: Fernplay Games
answer_type: numeric
answer: 1.0
tolerance: 0.01
---

## Statement

A **Fernplay Games** event charges **$3** per spin of a prize wheel that pays:

| prize | probability |
| --- | --- |
| $0 | 50 % |
| $5 | 30 % |
| $10 | 15 % |
| $20 | 5 % |

What is the player's **expected profit per spin** (prize minus the $3 cost)? Use a negative
number if the player loses money on average.

## Hints

### Hint 1

E[prize] = Σ prize × probability.

### Hint 2

Expected profit = E[prize] − cost (linearity of expectation).

## Verification

```python
def answer():
    prizes = {0: 0.50, 5: 0.30, 10: 0.15, 20: 0.05}
    return sum(v * p for v, p in prizes.items()) - 3
```

## Explanation

E[prize] = 0·0.50 + 5·0.30 + 10·0.15 + 20·0.05 = 0 + 1.5 + 1.5 + 1.0 = $4.00

Expected profit = 4.00 − 3.00 = **+$1.00** per spin, so the wheel favours the player on
average (and loses the game $1 per spin).

Expected value says nothing about risk: half of all spins lose $3. If asked whether to *play*,
mention variance and bankroll; if asked whether to *run* the event, the company should lower the
prizes or raise the price.
