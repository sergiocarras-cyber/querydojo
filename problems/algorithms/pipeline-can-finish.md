---
id: algo-032
slug: pipeline-can-finish
title: "Can the Pipeline Finish?"
section: algorithms
difficulty: Medium
topics: [Graphs, Topological sort]
company: Lumora Stream
function: can_finish
comparator: exact
complexity: { time: "O(V + E)", space: "O(V + E)" }
---

## Statement

**Lumora Stream**'s encoding pipeline has `n` jobs numbered `0 … n−1`. Each pair `[a, b]` in `deps`
means job `a` can only start **after** job `b` has finished.

Return `True` if there is an order that runs every job, i.e. the dependencies contain **no cycle**.

```python
def can_finish(n: int, deps: list[list[int]]) -> bool:
```

### Examples

```
n = 2, deps = [[1, 0]]           -> True
n = 2, deps = [[1, 0], [0, 1]]   -> False
n = 3, deps = []                 -> True
```

### Constraints

- `1 <= n <= 100 000`, `0 <= len(deps) <= 100 000`. Dependency chains can be very long.

## Starter

```python
def can_finish(n: int, deps: list[list[int]]) -> bool:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      2,
      [
        [
          1,
          0
        ]
      ]
    ],
    "expected": true
  },
  {
    "args": [
      2,
      [
        [
          1,
          0
        ],
        [
          0,
          1
        ]
      ]
    ],
    "expected": false
  },
  {
    "args": [
      3,
      []
    ],
    "expected": true
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      1,
      [
        [
          0,
          0
        ]
      ]
    ],
    "expected": false
  },
  {
    "args": [
      4,
      [
        [
          1,
          0
        ],
        [
          2,
          1
        ],
        [
          3,
          2
        ],
        [
          1,
          3
        ]
      ]
    ],
    "expected": false
  },
  {
    "args": [
      4,
      [
        [
          1,
          0
        ],
        [
          2,
          0
        ],
        [
          3,
          1
        ],
        [
          3,
          2
        ]
      ]
    ],
    "expected": true
  }
]
```

## Generator

```python
def cases():
    n = 100_000
    chain = [[i + 1, i] for i in range(n - 1)]
    yield [n, chain]
    yield [n, chain + [[0, n - 1]]]
```

## Hints

### Hint 1

Count, for each job, how many unfinished dependencies it has (its in-degree).

### Hint 2

Repeatedly run jobs with in-degree 0 (Kahn's algorithm). If some jobs never reach 0, there's a cycle.

## Solution

```python
from collections import deque

def can_finish(n: int, deps: list[list[int]]) -> bool:
    unlocks = [[] for _ in range(n)]
    pending = [0] * n
    for job, before in deps:
        unlocks[before].append(job)
        pending[job] += 1
    ready = deque(j for j in range(n) if pending[j] == 0)
    done = 0
    while ready:
        job = ready.popleft()
        done += 1
        for nxt in unlocks[job]:
            pending[nxt] -= 1
            if pending[nxt] == 0:
                ready.append(nxt)
    return done == n
```

## Explanation

Jobs and dependencies form a **directed graph**; a valid order exists iff it is **acyclic**.

**Kahn's algorithm (BFS topological sort):**

1. Build adjacency lists `before → jobs it unlocks` and the in-degree of every job.
2. Start with all jobs that have no pending dependencies.
3. "Run" a job: decrement the in-degree of the jobs it unlocks; those reaching 0 become ready.
4. If every job ran, there's no cycle. Jobs on a cycle never reach in-degree 0.

`O(V + E)` time and space, and no recursion (a recursive DFS would need 100 000 nested calls on the
chain). A DFS with white/grey/black colouring is the other standard approach.

## Wrong Answers

### Only two-job cycles detected

Looking for `a -> b` and `b -> a` misses longer cycles like `0 -> 1 -> 2 -> 0`. Use topological sort (Kahn) or DFS with colours.

```python
def can_finish(n, deps):
    pairs = {(a, b) for a, b in deps}
    return not any((b, a) in pairs for a, b in deps)
```

### Recursive DFS on a long chain

A long chain of dependencies exceeds Python's recursion limit. Use Kahn's algorithm with a queue.

```python
def can_finish(n, deps):
    graph = [[] for _ in range(n)]
    for a, b in deps:
        graph[b].append(a)
    state = [0] * n
    def dfs(u):
        state[u] = 1
        for v in graph[u]:
            if state[v] == 1 or (state[v] == 0 and not dfs(v)):
                return False
        state[u] = 2
        return True
    return all(state[u] or dfs(u) for u in range(n))
```
