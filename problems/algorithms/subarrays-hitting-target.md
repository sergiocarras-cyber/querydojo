---
id: algo-024
slug: subarrays-hitting-target
title: "Subarrays Hitting the Target"
section: algorithms
difficulty: Medium
topics: [Arrays & Hashing, Prefix sums]
company: Pennywise Pay
function: count_subarrays
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

`amounts` is a sequence of **Pennywise Pay** wallet movements (positive and negative). Count how many
**contiguous** subarrays sum exactly to `target`.

```python
def count_subarrays(amounts: list[int], target: int) -> int:
```

### Examples

```
amounts = [1, 2, 3], target = 3        -> 2    # [1, 2] and [3]
amounts = [1, -1, 1, -1], target = 0   -> 4
amounts = [5], target = 5              -> 1
```

### Constraints

- `1 <= len(amounts) <= 40 000`; values between `-1000` and `1000`.
- Negative values mean a sliding window doesn't work; `O(n²)` is too slow.

## Starter

```python
def count_subarrays(amounts: list[int], target: int) -> int:
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
        2,
        3
      ],
      3
    ],
    "expected": 2
  },
  {
    "args": [
      [
        1,
        -1,
        1,
        -1
      ],
      0
    ],
    "expected": 4
  },
  {
    "args": [
      [
        5
      ],
      5
    ],
    "expected": 1
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        0,
        0,
        0
      ],
      0
    ],
    "expected": 6
  },
  {
    "args": [
      [
        3,
        -3,
        3
      ],
      3
    ],
    "expected": 3
  },
  {
    "args": [
      [
        1,
        2
      ],
      4
    ],
    "expected": 0
  },
  {
    "args": [
      [
        -2,
        5,
        -1,
        2
      ],
      4
    ],
    "expected": 2
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(24)
    yield [[rng.randint(-3, 3) for _ in range(40_000)], 2]
```

## Hints

### Hint 1

The sum of `amounts[i:j]` equals `prefix[j] - prefix[i]`, where `prefix[k]` is the sum of the first `k` elements.

### Hint 2

A subarray ending at `j` hits the target when some earlier prefix equals `prefix[j] - target`.

### Hint 3

Keep a dictionary counting how many times each prefix sum has been seen (start with `{0: 1}`).

## Solution

```python
def count_subarrays(amounts: list[int], target: int) -> int:
    seen = {0: 1}   # prefix sum -> how many times it occurred
    prefix = 0
    count = 0
    for x in amounts:
        prefix += x
        count += seen.get(prefix - target, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
```

## Explanation

**Prefix sums + hash map:**

- `sum(amounts[i:j]) = P[j] − P[i]`. For a subarray ending at the current position with sum
  `target`, we need an earlier prefix equal to `P[j] − target`.
- The dictionary stores how many earlier prefixes had each value, so we add all matches at once.
- `{0: 1}` represents the empty prefix, which lets subarrays starting at index 0 be counted.

One pass: `O(n)` time and space. A two-pointer/sliding window only works when all values are
positive; with negatives the window sum isn't monotonic.

## Wrong Answers

```python
def count_subarrays(amounts, target):
    count = 0
    for i in range(len(amounts)):
        s = 0
        for j in range(i, len(amounts)):
            s += amounts[j]
            if s == target:
                count += 1
    return count
```

```python
def count_subarrays(amounts, target):
    count = left = window = 0
    for right, x in enumerate(amounts):
        window += x
        while window > target and left <= right:
            window -= amounts[left]
            left += 1
        if window == target:
            count += 1
    return count
```
