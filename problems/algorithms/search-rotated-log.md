---
id: algo-029
slug: search-rotated-log
title: "Search a Rotated Log"
section: algorithms
difficulty: Medium
topics: [Binary search]
company: Lumora Stream
function: find_rotated
comparator: exact
complexity: { time: "O(q · log n)", space: "O(q)" }
---

## Statement

**Lumora Stream**'s log ids were sorted in increasing order, but the log file was **rotated**: it
was cut at some unknown point and the two parts swapped (e.g. `[10, 20, 30, 40, 50, 60]` became
`[40, 50, 60, 10, 20, 30]`). All ids are distinct.

For each value in `queries`, return its index in `log`, or `-1`.

```python
def find_rotated(log: list[int], queries: list[int]) -> list[int]:
```

### Example

```
log = [40, 50, 60, 10, 20, 30], queries = [20, 55, 40]  ->  [4, -1, 0]
```

### Constraints

- `1 <= len(log), len(queries) <= 100 000`. Each lookup must be `O(log n)`.

## Starter

```python
def find_rotated(log: list[int], queries: list[int]) -> list[int]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        40,
        50,
        60,
        10,
        20,
        30
      ],
      [
        20,
        55,
        40
      ]
    ],
    "expected": [
      4,
      -1,
      0
    ]
  },
  {
    "args": [
      [
        7
      ],
      [
        7,
        8
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
        1,
        2,
        3,
        4,
        5
      ],
      [
        1,
        5,
        3,
        6
      ]
    ],
    "expected": [
      0,
      4,
      2,
      -1
    ]
  },
  {
    "args": [
      [
        5,
        1,
        2,
        3,
        4
      ],
      [
        5,
        1,
        4,
        0
      ]
    ],
    "expected": [
      0,
      1,
      4,
      -1
    ]
  },
  {
    "args": [
      [
        2,
        3,
        4,
        5,
        1
      ],
      [
        1,
        2,
        6
      ]
    ],
    "expected": [
      4,
      0,
      -1
    ]
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(29)
    base = sorted(rng.sample(range(10**8), 100_000))
    cut = 61_234
    log = base[cut:] + base[:cut]
    queries = [rng.choice(base) if rng.random() < 0.7 else rng.randrange(10**8) for _ in range(100_000)]
    yield [log, queries]
```

## Hints

### Hint 1

After picking `mid`, at least one of the halves `[lo, mid]` or `[mid, hi]` is sorted normally.

### Hint 2

Check whether the target lies inside the **sorted** half; if yes search there, otherwise search the other half.

## Solution

```python
def find_rotated(log: list[int], queries: list[int]) -> list[int]:
    def find(target: int) -> int:
        lo, hi = 0, len(log) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if log[mid] == target:
                return mid
            if log[lo] <= log[mid]:                  # left half sorted
                if log[lo] <= target < log[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:                                    # right half sorted
                if log[mid] < target <= log[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1

    return [find(q) for q in queries]
```

## Explanation

A rotated sorted array is two sorted runs. For any `mid`, **one side is sorted**:

- if `log[lo] <= log[mid]`, the left half `[lo, mid]` is sorted;
- otherwise the right half `[mid, hi]` is.

For the sorted half we can check in `O(1)` whether the target is inside its range. If it is, search
there; if not, it can only be in the other half. Each step halves the range: `O(log n)` per query.

A plain binary search fails because comparisons with `mid` no longer tell you which side the target
is on. Alternatives: first binary-search the rotation point, then search the right run.

## Wrong Answers

```python
def find_rotated(log, queries):
    def find(t):
        lo, hi = 0, len(log) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if log[mid] == t:
                return mid
            if log[mid] < t:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1
    return [find(q) for q in queries]
```

```python
def find_rotated(log, queries):
    return [log.index(q) if q in log else -1 for q in queries]
```
