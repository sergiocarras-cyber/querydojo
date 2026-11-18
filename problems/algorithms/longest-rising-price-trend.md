---
id: algo-040
slug: longest-rising-price-trend
title: "Longest Rising Price Trend"
section: algorithms
difficulty: Hard
topics: [Dynamic programming, Binary search]
company: Pennywise Pay
function: longest_rising
comparator: exact
complexity: { time: "O(n log n)", space: "O(n)" }
---

## Statement

**Pennywise Pay**'s analysts look for the longest **rising trend** in a price series: a subsequence
(not necessarily contiguous, order preserved) where each price is **strictly higher** than the
previous one. Return its length.

```python
def longest_rising(prices: list[int]) -> int:
```

### Examples

```
[3, 10, 2, 1, 20]               -> 3    # 3, 10, 20
[7, 7, 7]                       -> 1
[2, 5, 3, 7, 11, 8, 10, 13, 6]  -> 6    # 2, 3, 7, 8, 10, 13
```

### Constraints

- `0 <= len(prices) <= 100 000`. The classic `O(n²)` DP is too slow.

## Starter

```python
def longest_rising(prices: list[int]) -> int:
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
        10,
        2,
        1,
        20
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        7,
        7,
        7
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        2,
        5,
        3,
        7,
        11,
        8,
        10,
        13,
        6
      ]
    ],
    "expected": 6
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      []
    ],
    "expected": 0
  },
  {
    "args": [
      [
        1,
        3,
        2,
        4
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        5,
        4,
        3
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        1,
        2,
        2,
        3
      ]
    ],
    "expected": 3
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(40)
    yield [[rng.randint(0, 10**6) for _ in range(100_000)]]
    yield [list(range(50_000)) + list(range(50_000))]
```

## Hints

### Hint 1

Classic DP: `best[i] = 1 + max(best[j])` for `j < i` with `prices[j] < prices[i]`. Correct, but `O(n²)`.

### Hint 2

Keep `tails[L]` = the smallest possible last price of a rising trend of length `L + 1`. This list is always increasing.

### Hint 3

For each price, binary-search (`bisect_left`) the first tail `>=` price and replace it, or append if none.

## Solution

```python
from bisect import bisect_left

def longest_rising(prices: list[int]) -> int:
    tails = []  # tails[L] = smallest last value of a strictly rising subsequence of length L + 1
    for p in prices:
        i = bisect_left(tails, p)
        if i == len(tails):
            tails.append(p)
        else:
            tails[i] = p
    return len(tails)
```

## Explanation

**Longest increasing subsequence in `O(n log n)` ("patience sorting"):**

`tails[L]` stores the smallest value that can end a rising subsequence of length `L + 1`. A smaller
ending is always better, because it leaves more room to extend later.

For each price `p`:

- if `p` is larger than every tail, it extends the longest trend: append;
- otherwise it becomes a better (smaller) ending for some length: replace the first tail `>= p`.

`tails` stays sorted, so finding the spot is a binary search: `O(log n)` per price. The length of
`tails` is the answer (its contents are not necessarily a real subsequence).

`bisect_left` gives **strictly** increasing trends; `bisect_right` would allow equal prices
(`[7, 7, 7]` → 3). The `O(n²)` DP is the standard first answer in an interview; mention it, then
optimise.

## Wrong Answers

### Quadratic DP

Comparing each price with every earlier one is O(n²): correct, but too slow for the large hidden inputs. Keep the smallest tail of each length and binary-search it (O(n log n)).

```python
def longest_rising(prices):
    if not prices:
        return 0
    best = [1] * len(prices)
    for i in range(len(prices)):
        for j in range(i):
            if prices[j] < prices[i] and best[j] + 1 > best[i]:
                best[i] = best[j] + 1
    return max(best)
```

### `bisect_right` allows equal prices

The trend must be strictly rising. `bisect_right` lets an equal price extend a sequence; use `bisect_left`.

```python
from bisect import bisect_right

def longest_rising(prices):
    tails = []
    for p in prices:
        i = bisect_right(tails, p)
        if i == len(tails):
            tails.append(p)
        else:
            tails[i] = p
    return len(tails)
```
