---
id: algo-025
slug: zero-sum-triples
title: "Zero-Sum Triples"
section: algorithms
difficulty: Medium
topics: [Two pointers, Sorting]
company: Pennywise Pay
function: zero_triples
comparator: unordered_deep
complexity: { time: "O(n²)", space: "O(1) extra" }
---

## Statement

To detect circular transfers, **Pennywise Pay** looks for three balance changes that cancel out.
Return all **unique** triples of values `[a, b, c]` taken from **different positions** of `nums`
with `a + b + c == 0`.

Two triples are the same if they contain the same values. Return them in any order (and the values
inside each triple in any order).

```python
def zero_triples(nums: list[int]) -> list[list[int]]:
```

### Example

```
[-2, 0, 1, 1, 2, -1]  ->  [[-2, 0, 2], [-2, 1, 1], [-1, 0, 1]]
```

### Constraints

- `3 <= len(nums) <= 3000`; checking every triple (`O(n³)`) is too slow.

## Starter

```python
def zero_triples(nums: list[int]) -> list[list[int]]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        -2,
        0,
        1,
        1,
        2,
        -1
      ]
    ],
    "expected": [
      [
        -2,
        0,
        2
      ],
      [
        -2,
        1,
        1
      ],
      [
        -1,
        0,
        1
      ]
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
    "expected": []
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
        0,
        0
      ]
    ],
    "expected": [
      [
        0,
        0,
        0
      ]
    ]
  },
  {
    "args": [
      [
        -1,
        -1,
        2,
        2
      ]
    ],
    "expected": [
      [
        -1,
        -1,
        2
      ]
    ]
  },
  {
    "args": [
      [
        3,
        -6,
        3,
        3,
        -6
      ]
    ],
    "expected": [
      [
        -6,
        3,
        3
      ]
    ]
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(25)
    yield [[rng.randint(-150, 150) for _ in range(3000)]]
```

## Hints

### Hint 1

Sort the list first. Fix the first value `nums[i]` and look for two values summing to `-nums[i]`.

### Hint 2

In a sorted array, a pair with a given sum is found with two pointers moving towards each other.

### Hint 3

Skip equal neighbours (for `i` and for the pointers) to avoid duplicate triples.

## Solution

```python
def zero_triples(nums: list[int]) -> list[list[int]]:
    nums = sorted(nums)
    n = len(nums)
    out = []
    for i in range(n - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1
    return out
```

## Explanation

1. **Sort** (`O(n log n)`). Equal values become neighbours, which makes de-duplication easy.
2. **Fix** the smallest element `nums[i]`; skip it if equal to the previous one.
3. **Two pointers** on the rest: if the sum is too small, move `lo` right; too big, move `hi` left;
   zero → record and move both, skipping repeated `lo` values.
4. Once `nums[i] > 0`, no triple can sum to zero.

Each `i` costs `O(n)`, so `O(n²)` total. The brute force over all triples is `O(n³)` (4.5 billion
for 3000 numbers), and without the skips you'd return duplicates.

## Wrong Answers

### Duplicate triples

Without skipping repeated values, the same triple is reported several times. Skip equal neighbours for the first number and after each match.

```python
def zero_triples(nums):
    nums = sorted(nums)
    out = []
    for i in range(len(nums) - 2):
        lo, hi = i + 1, len(nums) - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
    return out
```

### Every combination of three

`combinations(nums, 3)` is O(n³): correct, but too slow for the large hidden inputs. Sort, fix one number and use two pointers for the other two.

```python
from itertools import combinations

def zero_triples(nums):
    return [list(t) for t in {tuple(sorted(c)) for c in combinations(nums, 3) if sum(c) == 0}]
```
