---
id: algo-009
slug: closest-drivers
title: K Closest Drivers
section: algorithms
difficulty: Medium
topics: [Heap, Sorting]
company: Moviq Rides
function: closest_drivers
comparator: custom
complexity: { time: "O(n · log k)", space: "O(k)" }
---

## Statement

When a rider opens **Moviq Rides**, the app pings the `k` drivers **closest** to them. Positions
are integer coordinates `[x, y]` relative to the rider, who stands at `[0, 0]`. Distance is the
usual straight-line (Euclidean) distance.

Return any `k` closest drivers, **in any order**. If several drivers are tied at the cut-off
distance, any of them may be chosen. Each driver can be returned at most once (duplicate
positions are different drivers).

```python
def closest_drivers(drivers: list[list[int]], k: int) -> list[list[int]]:
```

### Examples

```
drivers = [[3, 4], [1, -1], [-2, 0], [6, 1]], k = 2  ->  [[1, -1], [-2, 0]]
drivers = [[0, 5], [5, 0], [1, 1]], k = 3             ->  all three, any order
```

### Constraints

- `1 <= k <= len(drivers) <= 100 000`
- `-10^4 <= x, y <= 10^4`

## Starter

```python
def closest_drivers(drivers: list[list[int]], k: int) -> list[list[int]]:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [[[3, 4], [1, -1], [-2, 0], [6, 1]], 2], "expected": [[1, -1], [-2, 0]] },
  { "args": [[[0, 5], [5, 0], [1, 1]], 3], "expected": [[1, 1], [0, 5], [5, 0]] },
  { "args": [[[2, 2]], 1], "expected": [[2, 2]] }
]
```

## Hidden Tests

```json
[
  { "args": [[[1, 0], [0, 1], [-1, 0], [0, -1], [5, 5]], 2] },
  { "args": [[[2, 2], [2, 2], [3, 3]], 2] },
  { "args": [[[10, 0], [0, 9], [7, 7]], 1] },
  { "args": [[[-3, -4], [4, 3], [0, 0]], 1] }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(17)
    pts = [[rng.randint(-10_000, 10_000), rng.randint(-10_000, 10_000)] for _ in range(100_000)]
    yield [pts, 10]
    yield [pts, 50_000]
    yield [[[rng.randint(-3, 3), rng.randint(-3, 3)] for _ in range(1_000)], 37]
```

## Checker

```python
def check(got, expected, drivers, k):
    """Valid if `got` is k drivers taken from the input, all within the k-th smallest distance."""
    if not isinstance(got, (list, tuple)) or len(got) != k:
        return False
    pool = {}
    for x, y in drivers:
        pool[(x, y)] = pool.get((x, y), 0) + 1
    for p in got:
        if not isinstance(p, (list, tuple)) or len(p) != 2:
            return False
        key = (p[0], p[1])
        if pool.get(key, 0) == 0:
            return False
        pool[key] -= 1
    cutoff = sorted(x * x + y * y for x, y in drivers)[k - 1]
    return all(x * x + y * y <= cutoff for x, y in got)
```

## Hints

### Hint 1

Compare **squared** distances `x² + y²`: same order, no square roots, no floats.

### Hint 2

Sorting all drivers works in `O(n log n)`. Can you do better when `k` is small?

### Hint 3

Keep a **max-heap of size `k`** with the closest drivers seen so far. Python's `heapq` is a
min-heap, so push `-distance`.

## Solution

```python
import heapq

def closest_drivers(drivers: list[list[int]], k: int) -> list[list[int]]:
    heap = []  # (-squared_distance, index); the farthest kept driver is at heap[0]
    for i, (x, y) in enumerate(drivers):
        d = x * x + y * y
        if len(heap) < k:
            heapq.heappush(heap, (-d, i))
        elif d < -heap[0][0]:
            heapq.heapreplace(heap, (-d, i))
    return [drivers[i] for _, i in heap]
```

## Explanation

We only need *the k smallest*, not a full ordering, which is what a bounded heap is good at.

1. Keep a heap of the `k` closest drivers seen so far, keyed by `-distance`, so the root is the
   **farthest** of them (a max-heap built on Python's min-heap).
2. For each new driver: if the heap isn't full, push it. Otherwise, if it is closer than the
   current farthest, replace the root (`heapreplace` pops and pushes in one step).
3. At the end the heap holds `k` closest drivers.

Each driver costs at most one `O(log k)` heap operation: `O(n log k)` time, `O(k)` space. Storing
the index rather than the point keeps duplicate positions as distinct drivers.

Alternatives: `sorted(drivers, key=...)[:k]` is `O(n log n)` and perfectly fine to mention;
`heapq.nsmallest(k, drivers, key=...)` does the heap trick for you. Quickselect gives average
`O(n)`.

## Wrong Answers

### Manhattan distance

Closeness is straight-line distance: compare `x² + y²`, not `|x| + |y|`.

```python
def closest_drivers(drivers, k):
    return sorted(drivers, key=lambda p: abs(p[0]) + abs(p[1]))[:k]
```

### Duplicates removed

Two drivers at the same position are different drivers. Converting to a set drops one of them.

```python
def closest_drivers(drivers, k):
    unique = sorted({(x, y) for x, y in drivers}, key=lambda p: p[0] ** 2 + p[1] ** 2)
    return [list(p) for p in unique[:k]]
```
