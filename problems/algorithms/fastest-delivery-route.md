---
id: algo-039
slug: fastest-delivery-route
title: "Fastest Delivery Route"
section: algorithms
difficulty: Hard
topics: [Graphs, Dijkstra, Heap, Shortest path]
company: Basketly
function: fastest_delivery
comparator: exact
time_limit_ms: 3000
complexity: { time: "O((V + E) log V)", space: "O(V + E)" }
---

## Statement

**Basketly** plans deliveries over a road network of `n` intersections (`0 … n−1`). Each road
`[u, v, minutes]` is **two-way** and takes `minutes` to drive (`minutes >= 1`).

Return the minimum driving time from `source` to `target`, or `-1` if it can't be reached.

```python
def fastest_delivery(n: int, roads: list[list[int]], source: int, target: int) -> int:
```

### Example

```
n = 4, roads = [[0, 1, 5], [1, 3, 5], [0, 2, 2], [2, 3, 9]], source = 0, target = 3  -> 10
```

### Constraints

- `1 <= n <= 20 000`, `0 <= len(roads) <= 100 000`, `1 <= minutes <= 1000`.

## Starter

```python
def fastest_delivery(n: int, roads: list[list[int]], source: int, target: int) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      4,
      [
        [
          0,
          1,
          5
        ],
        [
          1,
          3,
          5
        ],
        [
          0,
          2,
          2
        ],
        [
          2,
          3,
          9
        ]
      ],
      0,
      3
    ],
    "expected": 10
  },
  {
    "args": [
      3,
      [
        [
          0,
          1,
          1
        ]
      ],
      0,
      2
    ],
    "expected": -1
  },
  {
    "args": [
      1,
      [],
      0,
      0
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
      3,
      [
        [
          0,
          1,
          10
        ],
        [
          1,
          2,
          10
        ],
        [
          0,
          2,
          25
        ]
      ],
      0,
      2
    ],
    "expected": 20
  },
  {
    "args": [
      3,
      [
        [
          0,
          1,
          1
        ],
        [
          0,
          1,
          7
        ],
        [
          1,
          2,
          3
        ]
      ],
      2,
      0
    ],
    "expected": 4
  },
  {
    "args": [
      5,
      [
        [
          0,
          1,
          1
        ],
        [
          1,
          2,
          1
        ],
        [
          2,
          3,
          1
        ],
        [
          3,
          4,
          1
        ],
        [
          0,
          4,
          10
        ]
      ],
      0,
      4
    ],
    "expected": 4
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(39)
    n = 20_000
    roads = [[i, i + 1, rng.randint(1, 1000)] for i in range(n - 1)]
    for _ in range(80_000):
        a, b = rng.randrange(n), rng.randrange(n)
        roads.append([a, b, rng.randint(1, 1000)])
    yield [n, roads, 0, n - 1]
    # A long chain listed back to front: relaxing edges in input order advances one hop per pass.
    chain = [[i, i + 1, 1] for i in range(n - 1)][::-1]
    yield [n, chain, 0, n - 1]
```

## Hints

### Hint 1

With different road times, BFS (which counts roads) is not enough.

### Hint 2

Dijkstra: always expand the unvisited intersection with the smallest known time, using a min-heap of `(time, node)`.

### Hint 3

Skip heap entries that are older than the best time already recorded for that node.

## Solution

```python
import heapq

def fastest_delivery(n: int, roads: list[list[int]], source: int, target: int) -> int:
    graph = [[] for _ in range(n)]
    for u, v, w in roads:
        graph[u].append((v, w))
        graph[v].append((u, w))
    best = [float("inf")] * n
    best[source] = 0
    heap = [(0, source)]
    while heap:
        time, node = heapq.heappop(heap)
        if node == target:
            return time
        if time > best[node]:
            continue                      # stale entry
        for nxt, w in graph[node]:
            candidate = time + w
            if candidate < best[nxt]:
                best[nxt] = candidate
                heapq.heappush(heap, (candidate, nxt))
    return -1
```

## Explanation

**Dijkstra's algorithm** (non-negative weights):

1. Build an adjacency list; roads are two-way, so add both directions.
2. A min-heap yields the node with the smallest tentative time. When a node is popped with its
   current best time, that time is final: any other route would go through nodes with larger times.
3. **Relax** its roads: if going through it improves a neighbour, record and push it.
4. Python's `heapq` has no decrease-key, so we push duplicates and skip **stale** entries.

`O((V + E) log V)`. Returning when `target` is popped is safe and saves work.

BFS minimises the number of roads, not the time. Bellman–Ford is correct but `O(V · E)`, about two
billion steps here.

## Wrong Answers

```python
from collections import deque

def fastest_delivery(n, roads, source, target):
    graph = [[] for _ in range(n)]
    for u, v, w in roads:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = {source: 0}
    q = deque([source])
    while q:
        u = q.popleft()
        for v, w in graph[u]:
            if v not in dist:
                dist[v] = dist[u] + w
                q.append(v)
    return dist.get(target, -1)
```

```python
def fastest_delivery(n, roads, source, target):
    best = [float("inf")] * n
    best[source] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, w in roads:
            if best[u] + w < best[v]:
                best[v] = best[u] + w; changed = True
            if best[v] + w < best[u]:
                best[u] = best[v] + w; changed = True
        if not changed:
            break
    return best[target] if best[target] != float("inf") else -1
```
