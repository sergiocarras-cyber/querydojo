---
id: algo-015
slug: best-sales-window
title: "Best Sales Window"
section: algorithms
difficulty: Easy
topics: [Sliding window, Arrays]
company: Loomly Home
function: best_window
comparator: exact
complexity: { time: "O(n)", space: "O(1)" }
---

## Statement

`sales[i]` is **Loomly Home**'s net sales on day `i` (it can be negative because of returns). Find
the best run of exactly `k` **consecutive** days: return the maximum possible sum.

```python
def best_window(sales: list[int], k: int) -> int:
```

### Examples

```
sales = [3, 1, 4, 1, 5, 9, 2, 6], k = 3  -> 17   # 9 + 2 + 6
sales = [5, 5], k = 2                    -> 10
sales = [-2, -1, -3], k = 1              -> -1
```

### Constraints

- `1 <= k <= len(sales) <= 100 000`
- Hidden tests use `k = 50 000` on 100 000 days: recomputing every window from scratch is too slow.

## Starter

```python
def best_window(sales: list[int], k: int) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        3,
        1,
        4,
        1,
        5,
        9,
        2,
        6
      ],
      3
    ],
    "expected": 17
  },
  {
    "args": [
      [
        5,
        5
      ],
      2
    ],
    "expected": 10
  },
  {
    "args": [
      [
        -2,
        -1,
        -3
      ],
      1
    ],
    "expected": -1
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        1,
        2,
        3
      ],
      3
    ],
    "expected": 6
  },
  {
    "args": [
      [
        -5,
        -2,
        -9,
        -1
      ],
      2
    ],
    "expected": -7
  },
  {
    "args": [
      [
        0,
        0,
        7,
        0
      ],
      1
    ],
    "expected": 7
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(15)
    sales = [rng.randint(-1000, 1000) for _ in range(100_000)]
    yield [sales, 50_000]
    yield [sales, 1]
```

## Hints

### Hint 1

Moving the window one day to the right adds one day and removes one day.

### Hint 2

Keep a running sum: `window += sales[i] - sales[i - k]`.

## Solution

```python
def best_window(sales: list[int], k: int) -> int:
    window = sum(sales[:k])
    best = window
    for i in range(k, len(sales)):
        window += sales[i] - sales[i - k]
        best = max(best, window)
    return best
```

## Explanation

**Fixed-size sliding window:** two consecutive windows share `k − 1` days, so update the sum in
`O(1)` instead of re-adding `k` numbers.

1. Sum the first `k` days.
2. For each next day `i`, add `sales[i]` and subtract the day that leaves, `sales[i − k]`.
3. Track the maximum.

Total `O(n)` time and `O(1)` space; recomputing `sum(sales[i:i+k])` for every window is
`O(n·k)`, around 2.5 billion additions for the hidden case. Initialise `best` with the first window
(not 0), since every window can be negative.

## Wrong Answers

```python
def best_window(sales, k):
    return max(sum(sales[i:i + k]) for i in range(len(sales) - k + 1))
```

```python
def best_window(sales, k):
    window = sum(sales[:k])
    best = 0  # wrong start: every window may be negative
    for i in range(k, len(sales)):
        window += sales[i] - sales[i - k]
        best = max(best, window)
    return best
```
