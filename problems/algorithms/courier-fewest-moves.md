---
id: algo-033
slug: courier-fewest-moves
title: "Courier's Fewest Moves"
section: algorithms
difficulty: Medium
topics: [Graphs, BFS, Grid, Shortest path]
company: Basketly
function: fewest_moves
comparator: exact
time_limit_ms: 3000
complexity: { time: "O(rows · cols)", space: "O(rows · cols)" }
---

## Statement

A **Basketly** courier robot moves on a warehouse grid: `'S'` is the start, `'E'` the exit, `'#'` a
shelf (blocked) and `'.'` free floor. Each move goes one cell **up, down, left or right**.

Return the minimum number of moves from `S` to `E`, or `-1` if `E` can't be reached. There is exactly
one `S` and one `E`.

```python
def fewest_moves(grid: list[str]) -> int:
```

### Example

```
["S.#",
 ".##",
 "..E"]   -> 4
```

### Constraints

- Grid up to `250 × 250`.

## Starter

```python
def fewest_moves(grid: list[str]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        "S.#",
        ".##",
        "..E"
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        "S#E"
      ]
    ],
    "expected": -1
  },
  {
    "args": [
      [
        "SE"
      ]
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
        "S...",
        "###.",
        "E..."
      ]
    ],
    "expected": 8
  },
  {
    "args": [
      [
        "S.",
        ".E"
      ]
    ],
    "expected": 2
  },
  {
    "args": [
      [
        "S.....",
        ".####.",
        ".#E...",
        ".#####",
        "......"
      ]
    ],
    "expected": 10
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(33)
    n = 250
    rows = []
    for r in range(n):
        rows.append("".join("#" if rng.random() < 0.25 else "." for _ in range(n)))
    rows[0] = "S" + rows[0][1:]
    rows[-1] = rows[-1][:-1] + "E"
    yield [rows]
    open_grid = ["." * n for _ in range(n)]
    open_grid[0] = "S" + "." * (n - 1)
    open_grid[-1] = "." * (n - 1) + "E"
    yield [open_grid]
```

## Hints

### Hint 1

In a grid where every move costs 1, **breadth-first search** finds shortest paths.

### Hint 2

Store the distance of each cell when you first discover it, and never enqueue a cell twice.

## Solution

```python
from collections import deque

def fewest_moves(grid: list[str]) -> int:
    rows, cols = len(grid), len(grid[0])
    start = next((r, c) for r in range(rows) for c in range(cols) if grid[r][c] == "S")
    dist = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if grid[r][c] == "E":
            return dist[(r, c)]
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1
                queue.append((nr, nc))
    return -1
```

## Explanation

With unit-cost moves, **BFS** explores cells in order of distance: everything 1 move away, then 2,
and so on. The first time it reaches `E`, that distance is the minimum.

- Mark cells as discovered when enqueuing (here, by storing their distance) so each cell is
  processed once: `O(rows · cols)`.
- If the queue empties without reaching `E`, it's unreachable.

A DFS finds *a* path, not the shortest one, and exploring all paths is exponential. With
different move costs you'd switch to Dijkstra.

## Wrong Answers

```python
def fewest_moves(grid):
    rows, cols = len(grid), len(grid[0])
    start = next((r, c) for r in range(rows) for c in range(cols) if grid[r][c] == "S")
    stack, seen = [(start, 0)], {start}
    while stack:
        (r, c), d = stack.pop()
        if grid[r][c] == "E":
            return d
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                stack.append(((nr, nc), d + 1))
    return -1
```
