---
id: algo-006
slug: minimum-upload-capacity
title: Minimum Daily Upload Capacity
section: algorithms
difficulty: Medium
topics: [Binary search, Greedy]
company: Lumora Stream
function: min_daily_capacity
comparator: exact
complexity: { time: "O(n · log(sum))", space: "O(1)" }
---

## Statement

**Lumora Stream** must upload a season of episodes to a partner CDN. The files must go up **in
the given order**, and each day the pipeline uploads a **consecutive** group of files whose total
size does not exceed the daily capacity `C`. A file can't be split across days.

Given `sizes` (file sizes in GB, in upload order) and `days`, return the **minimum** integer
capacity `C` that uploads everything within `days` days.

```python
def min_daily_capacity(sizes: list[int], days: int) -> int:
```

### Example

```
sizes = [4, 8, 2, 6, 5], days = 3  ->  11
    # C = 11: [4] [8, 2] [6, 5]  (3 days)
    # C = 10: [4] [8, 2] [6] [5] (4 days, too many)
```

### Constraints

- `1 <= len(sizes) <= 100 000`
- `1 <= sizes[i] <= 10 000`
- `1 <= days <= len(sizes)`

## Starter

```python
def min_daily_capacity(sizes: list[int], days: int) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [[4, 8, 2, 6, 5], 3], "expected": 11 },
  { "args": [[1, 1, 1, 1], 4], "expected": 1 },
  { "args": [[7], 1], "expected": 7 }
]
```

## Hidden Tests

```json
[
  { "args": [[3, 2, 2, 4, 1, 4], 3], "expected": 6 },
  { "args": [[1, 2, 3, 4, 5], 1], "expected": 15 },
  { "args": [[1, 2, 3, 4, 5], 5], "expected": 5 },
  { "args": [[10, 1, 1, 1, 10], 2], "expected": 12 },
  { "args": [[5, 5, 5, 5], 3], "expected": 10 }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(99)
    sizes = [rng.randint(1, 10_000) for _ in range(100_000)]
    yield [sizes, 7]
    yield [sizes, 50_000]
    yield [[10_000] * 100_000, 3]
```

## Hints

### Hint 1

For a fixed capacity `C` you can count the days needed greedily: keep adding files to today
until the next one doesn't fit.

### Hint 2

If capacity `C` works, any larger capacity also works. The answer is the **smallest** `C` that
works, a monotonic yes/no question.

### Hint 3

Binary search `C` between `max(sizes)` (smaller can't fit the biggest file) and `sum(sizes)`
(everything in one day).

## Solution

```python
def min_daily_capacity(sizes: list[int], days: int) -> int:
    def days_needed(capacity: int) -> int:
        used, load = 1, 0
        for size in sizes:
            if load + size > capacity:
                used += 1
                load = 0
            load += size
        return used

    lo, hi = max(sizes), sum(sizes)
    while lo < hi:
        mid = (lo + hi) // 2
        if days_needed(mid) <= days:
            hi = mid        # mid works: maybe something smaller works too
        else:
            lo = mid + 1    # mid is too small
    return lo
```

## Explanation

This is **binary search on the answer**:

1. **Feasibility check.** Given a capacity, the greedy count (fill each day as much as
   possible) gives the minimum number of days for that capacity: `O(n)`.
2. **Monotonicity.** More capacity never needs more days, so the feasible capacities form a
   range `[answer, sum]`.
3. **Search.** Binary search over `[max(sizes), sum(sizes)]` finds the first feasible value
   with `O(log(sum))` checks.

Total `O(n · log(sum(sizes)))` time, `O(1)` extra space. Trying every capacity from
`max(sizes)` upwards is `O(n · sum)`, far too slow for the hidden cases.

The `lo < hi` / `hi = mid` / `lo = mid + 1` template finds the **first** value where the
condition becomes true; it is worth memorising.

## Wrong Answers

### Trying every capacity

Increasing the capacity one by one can take millions of steps: correct, but too slow for the large hidden inputs. Binary-search the capacity between `max(sizes)` and `sum(sizes)`.

```python
def min_daily_capacity(sizes, days):
    capacity = max(sizes)
    while True:
        used, load = 1, 0
        for s in sizes:
            if load + s > capacity:
                used += 1
                load = 0
            load += s
        if used <= days:
            return capacity
        capacity += 1
```

### Average-based formula

`ceil(total / days)` assumes files can be split across days. Whole files must fit in a day, so the answer can be larger: simulate the greedy packing for each candidate.

```python
def min_daily_capacity(sizes, days):
    import math
    return max(max(sizes), math.ceil(sum(sizes) / days))
```
