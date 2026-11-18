---
id: algo-036
slug: fewest-coupons
title: "Fewest Coupons"
section: algorithms
difficulty: Medium
topics: [Dynamic programming]
company: Shelfie Books
function: fewest_coupons
comparator: exact
complexity: { time: "O(amount · c)", space: "O(amount)" }
---

## Statement

**Shelfie Books** issues gift coupons with fixed values (`values`, unlimited supply of each). What is
the **minimum number of coupons** that add up **exactly** to `amount`? Return `-1` if it's
impossible; `0` coupons are needed for amount `0`.

```python
def fewest_coupons(values: list[int], amount: int) -> int:
```

### Examples

```
values = [1, 5, 6, 9], amount = 11  -> 2    # 5 + 6 (greedy 9 + 1 + 1 uses 3)
values = [2], amount = 3            -> -1
values = [1], amount = 0            -> 0
```

### Constraints

- `1 <= len(values) <= 20`, `1 <= values[i] <= 10 000`, `0 <= amount <= 10 000`.

## Starter

```python
def fewest_coupons(values: list[int], amount: int) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        1,
        5,
        6,
        9
      ],
      11
    ],
    "expected": 2
  },
  {
    "args": [
      [
        2
      ],
      3
    ],
    "expected": -1
  },
  {
    "args": [
      [
        1
      ],
      0
    ],
    "expected": 0
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        3,
        7
      ],
      12
    ],
    "expected": 4
  },
  {
    "args": [
      [
        3,
        7
      ],
      13
    ],
    "expected": 3
  },
  {
    "args": [
      [
        25,
        10,
        1
      ],
      30
    ],
    "expected": 3
  },
  {
    "args": [
      [
        7
      ],
      7
    ],
    "expected": 1
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(36)
    yield [rng.sample(range(2, 500), 20), 10_000]
    yield [[37, 41, 53], 9_999]
```

## Hints

### Hint 1

Greedy (always take the biggest coupon) fails: see the first example.

### Hint 2

Let `best[x]` be the fewest coupons for amount `x`. Then `best[x] = 1 + min(best[x - v])` over coupon values `v <= x`.

### Hint 3

Fill `best` from 0 up to `amount`; use infinity for unreachable amounts.

## Solution

```python
def fewest_coupons(values: list[int], amount: int) -> int:
    INF = float("inf")
    best = [0] + [INF] * amount
    for x in range(1, amount + 1):
        for v in values:
            if v <= x and best[x - v] + 1 < best[x]:
                best[x] = best[x - v] + 1
    return best[amount] if best[amount] != INF else -1
```

## Explanation

This is the **coin change** problem.

**Why not greedy?** With values `1, 5, 6, 9` and amount 11, greedy takes 9 + 1 + 1 (3 coupons) but
5 + 6 needs only 2.

**DP:** the last coupon used for amount `x` has some value `v`, and the rest must be an optimal way
to pay `x − v`:

`best[x] = 1 + min(best[x − v])` for every `v <= x`, with `best[0] = 0`.

Filling the table bottom-up costs `O(amount · c)` for `c` coupon values. Plain recursion without
memoisation recomputes the same amounts exponentially many times.

## Wrong Answers

### Greedy, biggest coupon first

Taking the largest coupon first is not always optimal: with values 3 and 7, 12 = 3 + 3 + 3 + 3 but greedy gets stuck. Use DP over amounts.

```python
def fewest_coupons(values, amount):
    count = 0
    for v in sorted(values, reverse=True):
        count += amount // v
        amount %= v
    return count if amount == 0 else -1
```

### Plain recursion

Trying every combination recursively is exponential. Use DP over amounts from 0 to `amount`.

```python
def fewest_coupons(values, amount):
    def go(x):
        if x == 0:
            return 0
        if x < 0:
            return float("inf")
        return 1 + min(go(x - v) for v in values)
    r = go(amount)
    return -1 if r == float("inf") else r
```
