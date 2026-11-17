---
id: algo-017
slug: locate-price-points
title: "Locate Price Points"
section: algorithms
difficulty: Easy
topics: [Binary search]
company: Cartwell Marketplace
function: locate_prices
comparator: exact
complexity: { time: "O(q · log n)", space: "O(q)" }
---

## Statement

`prices` is **Cartwell**'s catalogue of price points, **sorted in strictly increasing order**. For
each value in `queries`, return its index in `prices`, or `-1` if it isn't there.

```python
def locate_prices(prices: list[int], queries: list[int]) -> list[int]:
```

### Example

```
prices = [5, 9, 12, 20, 33], queries = [12, 5, 7, 33]  ->  [2, 0, -1, 4]
```

### Constraints

- `1 <= len(prices), len(queries) <= 100 000`
- Implement the search yourself (a linear scan per query is too slow).

## Starter

```python
def locate_prices(prices: list[int], queries: list[int]) -> list[int]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        5,
        9,
        12,
        20,
        33
      ],
      [
        12,
        5,
        7,
        33
      ]
    ],
    "expected": [
      2,
      0,
      -1,
      4
    ]
  },
  {
    "args": [
      [
        1
      ],
      [
        1,
        2
      ]
    ],
    "expected": [
      0,
      -1
    ]
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        -10,
        -3,
        0,
        8
      ],
      [
        -10,
        8,
        -4,
        9,
        -11
      ]
    ],
    "expected": [
      0,
      3,
      -1,
      -1,
      -1
    ]
  },
  {
    "args": [
      [
        2,
        4,
        6,
        8,
        10,
        12
      ],
      [
        6,
        7,
        12,
        2
      ]
    ],
    "expected": [
      2,
      -1,
      5,
      0
    ]
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(17)
    prices = sorted(rng.sample(range(10**7), 100_000))
    queries = [rng.choice(prices) if rng.random() < 0.5 else rng.randrange(10**7) for _ in range(100_000)]
    yield [prices, queries]
```

## Hints

### Hint 1

Keep a range `[lo, hi]` where the value could be, and look at the middle element.

### Hint 2

If the middle is too small, the answer is to the right: `lo = mid + 1`; if too big, `hi = mid - 1`.

## Solution

```python
def locate_prices(prices: list[int], queries: list[int]) -> list[int]:
    def find(target: int) -> int:
        lo, hi = 0, len(prices) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if prices[mid] == target:
                return mid
            if prices[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1

    return [find(q) for q in queries]
```

## Explanation

**Binary search** halves the candidate range at each step, so one lookup costs `O(log n)`
(about 17 comparisons for 100 000 prices) instead of `O(n)`.

Invariant: if `target` is in the list, it lies within `prices[lo..hi]`. Compare with the middle and
discard the half that can't contain it; when `lo > hi` the range is empty.

With `q` queries the total is `O(q log n)`. In Python you'd normally use `bisect.bisect_left`;
interviews often ask you to write the loop. (A dict `price -> index` also gives `O(1)` lookups at
the cost of `O(n)` memory.)

## Wrong Answers

```python
def locate_prices(prices, queries):
    out = []
    for q in queries:
        out.append(next((i for i, p in enumerate(prices) if p == q), -1))
    return out
```

```python
def locate_prices(prices, queries):
    def find(t):
        lo, hi = 0, len(prices) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if prices[mid] == t:
                return mid
            if prices[mid] < t:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1
    return [find(q) for q in queries]
```
