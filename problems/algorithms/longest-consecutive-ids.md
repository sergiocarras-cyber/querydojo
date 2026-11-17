---
id: algo-023
slug: longest-consecutive-ids
title: "Longest Run of Consecutive IDs"
section: algorithms
difficulty: Medium
topics: [Arrays & Hashing, Hash set]
company: Pennywise Pay
function: longest_run
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

**Pennywise Pay** audits invoice numbers. Given the list `ids` (unsorted, may contain duplicates),
return the length of the **longest run of consecutive integers** that are all present
(e.g. 30, 31, 32, 33).

```python
def longest_run(ids: list[int]) -> int:
```

### Examples

```
[31, 7, 30, 8, 33, 32, 6]  -> 4    # 30, 31, 32, 33
[5, 5, 5]                  -> 1
[]                         -> 0
```

### Constraints

- `0 <= len(ids) <= 200 000`; aim for `O(n)`.

## Starter

```python
def longest_run(ids: list[int]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        31,
        7,
        30,
        8,
        33,
        32,
        6
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        5,
        5,
        5
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      []
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
        1,
        2,
        2,
        3
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        -2,
        -1,
        0,
        5
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        10,
        30,
        20
      ]
    ],
    "expected": 1
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(23)
    ids = list(range(100_000)) + [rng.randint(-10**9, 10**9) for _ in range(100_000)]
    rng.shuffle(ids)
    yield [ids]
```

## Hints

### Hint 1

Put all ids in a set for `O(1)` membership checks.

### Hint 2

Only start counting from numbers that **begin** a run: `x` such that `x - 1` is not in the set. Then walk `x + 1, x + 2, …`.

## Solution

```python
def longest_run(ids: list[int]) -> int:
    present = set(ids)
    best = 0
    for x in present:
        if x - 1 not in present:          # x starts a run
            length = 1
            while x + length in present:
                length += 1
            best = max(best, length)
    return best
```

## Explanation

1. A set removes duplicates and answers "is `y` present?" in `O(1)`.
2. Walking forward from **every** number would be `O(n²)` on one long run. Walking only from run
   **starts** (`x − 1` absent) visits each number in at most one walk: `O(n)` total.

Sorting and scanning is `O(n log n)` and also acceptable, but duplicates must not break the run:
`[1, 2, 2, 3]` is a run of 3.

## Wrong Answers

```python
def longest_run(ids):
    if not ids:
        return 0
    s = sorted(ids)
    best = cur = 1
    for a, b in zip(s, s[1:]):
        cur = cur + 1 if b == a + 1 else 1
        best = max(best, cur)
    return best
```
