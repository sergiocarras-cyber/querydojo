---
id: algo-013
slug: squared-sorted-deltas
title: "Squared Sorted Deltas"
section: algorithms
difficulty: Easy
topics: [Two pointers, Arrays]
company: Pennywise Pay
function: squared_sorted
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

**Pennywise Pay**'s risk model receives daily balance changes `deltas`, already **sorted in
ascending order** (they can be negative). It needs the **squares** of those changes, also sorted
in ascending order.

```python
def squared_sorted(deltas: list[int]) -> list[int]:
```

### Examples

```
[-4, -1, 0, 3, 10]  -> [0, 1, 9, 16, 100]
[-7, -3, 2, 3, 11]  -> [4, 9, 9, 49, 121]
```

### Constraints

- `1 <= len(deltas) <= 200 000`, sorted ascending.
- Try for `O(n)` (without sorting again).

## Starter

```python
def squared_sorted(deltas: list[int]) -> list[int]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        -4,
        -1,
        0,
        3,
        10
      ]
    ],
    "expected": [
      0,
      1,
      9,
      16,
      100
    ]
  },
  {
    "args": [
      [
        -7,
        -3,
        2,
        3,
        11
      ]
    ],
    "expected": [
      4,
      9,
      9,
      49,
      121
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
        -5,
        -3,
        -1
      ]
    ],
    "expected": [
      1,
      9,
      25
    ]
  },
  {
    "args": [
      [
        0
      ]
    ],
    "expected": [
      0
    ]
  },
  {
    "args": [
      [
        1,
        2,
        3
      ]
    ],
    "expected": [
      1,
      4,
      9
    ]
  },
  {
    "args": [
      [
        -2,
        -2,
        2,
        2
      ]
    ],
    "expected": [
      4,
      4,
      4,
      4
    ]
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(13)
    yield [sorted(rng.randint(-10**4, 10**4) for _ in range(200_000))]
```

## Hints

### Hint 1

The largest square is at one of the two **ends** of the array (most negative or most positive).

### Hint 2

Use two pointers at both ends and fill the result from the back, taking the larger square each time.

## Solution

```python
def squared_sorted(deltas: list[int]) -> list[int]:
    n = len(deltas)
    out = [0] * n
    left, right = 0, n - 1
    for pos in range(n - 1, -1, -1):
        if abs(deltas[left]) > abs(deltas[right]):
            out[pos] = deltas[left] ** 2
            left += 1
        else:
            out[pos] = deltas[right] ** 2
            right -= 1
    return out
```

## Explanation

Squaring breaks the order only because of negative numbers: the squares are large at **both ends**
and small in the middle.

**Two pointers:** compare the absolute values at `left` and `right`, write the bigger square at the
**end** of the output, and move that pointer inward. Each element is placed once: `O(n)`.

`sorted(x * x for x in deltas)` is also correct (`O(n log n)`) and fine to mention; the two-pointer
version is what interviewers usually want to see.

## Wrong Answers

```python
def squared_sorted(deltas):
    return [d * d for d in deltas]
```
