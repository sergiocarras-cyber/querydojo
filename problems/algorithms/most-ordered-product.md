---
id: algo-012
slug: most-ordered-product
title: "Most Ordered Product"
section: algorithms
difficulty: Easy
topics: [Arrays & Hashing, Counting]
company: Cartwell Marketplace
function: most_ordered
comparator: exact
complexity: { time: "O(n)", space: "O(k)" }
---

## Statement

`ids` lists the product id of every **Cartwell** order today. Return the product ordered **most
often**. If several products tie, return the **smallest** id.

```python
def most_ordered(ids: list[int]) -> int:
```

### Examples

```
[3, 1, 3, 2, 1, 3]  -> 3
[5, 4, 5, 4]        -> 4    # tie between 4 and 5: smallest id
[7]                 -> 7
```

### Constraints

- `1 <= len(ids) <= 200 000`; ids may be negative.

## Starter

```python
def most_ordered(ids: list[int]) -> int:
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
        3,
        2,
        1,
        3
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        5,
        4,
        5,
        4
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        7
      ]
    ],
    "expected": 7
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        2,
        2,
        1,
        1,
        3,
        3
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        -1,
        -1,
        0
      ]
    ],
    "expected": -1
  },
  {
    "args": [
      [
        9,
        8,
        7,
        8,
        9
      ]
    ],
    "expected": 8
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(12)
    yield [[rng.randint(1, 1000) for _ in range(200_000)]]
    yield [list(range(60_000, 0, -1)) * 2]
```

## Hints

### Hint 1

Count how many times each id appears in one pass with a dictionary.

### Hint 2

Then pick the id with the largest count; break ties by the smallest id, e.g. with a key like `(-count, id)`.

## Solution

```python
from collections import Counter

def most_ordered(ids: list[int]) -> int:
    counts = Counter(ids)
    return min(counts, key=lambda pid: (-counts[pid], pid))
```

## Explanation

1. `Counter(ids)` counts every id in `O(n)`.
2. `min` with the key `(-count, id)` prefers the **highest** count (smallest negative) and, among
   equal counts, the **smallest** id. One pass over the `k` distinct ids.

Pitfalls:

- `ids.count(x)` inside a loop is `O(n²)`: too slow for 200 000 orders.
- `Counter.most_common(1)` breaks ties by **first appearance**, not by the smallest id.

## Wrong Answers

```python
from collections import Counter

def most_ordered(ids):
    return Counter(ids).most_common(1)[0][0]
```

```python
def most_ordered(ids):
    best = None
    for x in ids:
        if best is None or (ids.count(x), -x) > (ids.count(best), -best):
            best = x
    return best
```
