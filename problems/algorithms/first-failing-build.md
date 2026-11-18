---
id: algo-018
slug: first-failing-build
title: "First Failing Build"
section: algorithms
difficulty: Easy
topics: [Binary search]
company: Lumora Stream
function: first_failing
comparator: exact
complexity: { time: "O(log n)", space: "O(1)" }
---

## Statement

**Lumora Stream** builds its player app on every commit. A bug slipped in at some point: every
build **from that commit on** fails, and every build before it passes.

`failed[i]` is `True` if build `i` failed. Return the index of the **first failing build**, or `-1`
if all builds pass.

```python
def first_failing(failed: list[bool]) -> int:
```

### Examples

```
[False, False, True, True]  -> 2
[True, True]                -> 0
[False, False]              -> -1
```

### Constraints

- `1 <= len(failed) <= 1 000 000`; the list is always `False…False True…True`.
- Aim for `O(log n)` checks: in real life each check is a slow build.

## Starter

```python
def first_failing(failed: list[bool]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        false,
        false,
        true,
        true
      ]
    ],
    "expected": 2
  },
  {
    "args": [
      [
        true,
        true
      ]
    ],
    "expected": 0
  },
  {
    "args": [
      [
        false,
        false
      ]
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
        true
      ]
    ],
    "expected": 0
  },
  {
    "args": [
      [
        false
      ]
    ],
    "expected": -1
  },
  {
    "args": [
      [
        false,
        true
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        false,
        false,
        false,
        false,
        true
      ]
    ],
    "expected": 4
  }
]
```

## Generator

```python
def cases():
    n = 1_000_000
    yield [[False] * 777_777 + [True] * (n - 777_777)]
    yield [[False] * (n - 1) + [True]]
```

## Hints

### Hint 1

The list is monotonic: once a build fails, all later ones fail. Find the boundary.

### Hint 2

Binary search for the first `True`: if `failed[mid]` is `True`, the answer is `mid` or earlier.

## Solution

```python
def first_failing(failed: list[bool]) -> int:
    lo, hi = 0, len(failed)  # answer in [lo, hi]; hi == len means "none"
    while lo < hi:
        mid = (lo + hi) // 2
        if failed[mid]:
            hi = mid
        else:
            lo = mid + 1
    return lo if lo < len(failed) else -1
```

## Explanation

This is **binary search for a boundary** (like `git bisect`):

- Keep `[lo, hi)` such that everything before `lo` passes and everything from `hi` on fails.
- If `failed[mid]` is `True`, the first failure is at `mid` or before → `hi = mid`.
- Otherwise it's after `mid` → `lo = mid + 1`.

When `lo == hi` that's the first failing index; if it equals `len(failed)`, nothing failed.

Only `O(log n)` checks (about 20 for a million builds). A linear scan works on a list, but when
each check is a 10-minute build, the difference is 20 builds vs a million.

## Wrong Answers

### No failing build returns the last index

When no build failed the answer is -1, but this search returns the last index. Search over `[0, len]` and map `len` to -1.

```python
def first_failing(failed):
    lo, hi = 0, len(failed) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if failed[mid]:
            hi = mid
        else:
            lo = mid + 1
    return lo
```
