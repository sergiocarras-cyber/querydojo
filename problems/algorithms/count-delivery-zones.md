---
id: algo-008
slug: count-delivery-zones
title: Count Delivery Zones
section: algorithms
difficulty: Medium
topics: [Graphs, BFS, Grid]
company: Moviq Rides
function: count_zones
comparator: exact
time_limit_ms: 3000
complexity: { time: "O(rows · cols)", space: "O(rows · cols)" }
---

## Statement

**Moviq Rides** is launching food delivery. The city map is a grid of strings where `'#'` is a
block with active couriers and `'.'` is a block without any.

A **delivery zone** is a group of `'#'` blocks connected **horizontally or vertically** (not
diagonally). Return the number of zones.

```python
def count_zones(grid: list[str]) -> int:
```

### Example

```
grid = [
  "##..#",
  "#...#",
  "..#..",
  "....#",
]
-> 4    # top-left, right column (rows 0-1), the single center block, bottom-right
```

### Constraints

- `0 <= rows, cols <= 200`
- A single zone can cover the whole grid (40 000 blocks): a recursive flood fill can exceed
  Python's recursion limit.

## Starter

```python
def count_zones(grid: list[str]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [["##..#", "#...#", "..#..", "....#"]], "expected": 4 },
  { "args": [["...", "..."]], "expected": 0 },
  { "args": [["#"]], "expected": 1 }
]
```

## Hidden Tests

```json
[
  { "args": [[]], "expected": 0 },
  { "args": [["#.#", ".#.", "#.#"]], "expected": 5 },
  { "args": [["###", "#.#", "###"]], "expected": 1 },
  { "args": [["#.#.#.#"]], "expected": 4 },
  { "args": [["#", "#", ".", "#"]], "expected": 2 }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(3)
    yield [["#" * 200 for _ in range(200)]]
    yield [["".join("#" if rng.random() < 0.45 else "." for _ in range(200)) for _ in range(200)]]
    # A long snake-shaped zone.
    rows = []
    for r in range(200):
        if r % 2 == 0:
            rows.append("#" * 200)
        elif r % 4 == 1:
            rows.append("." * 199 + "#")
        else:
            rows.append("#" + "." * 199)
    yield [rows]
```

## Hints

### Hint 1

Treat every `'#'` as a node with edges to its four neighbours. You are counting **connected
components**.

### Hint 2

Scan the grid. Each time you find a `'#'` that hasn't been visited, that's a new zone: flood
fill it to mark all of its blocks as visited.

### Hint 3

Do the flood fill with an explicit stack or queue instead of recursion.

## Solution

```python
from collections import deque

def count_zones(grid: list[str]) -> int:
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = [[False] * cols for _ in range(rows)]
    zones = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "#" or seen[r][c]:
                continue
            zones += 1
            seen[r][c] = True
            queue = deque([(r, c)])
            while queue:
                y, x = queue.popleft()
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < rows and 0 <= nx < cols and grid[ny][nx] == "#" and not seen[ny][nx]:
                        seen[ny][nx] = True
                        queue.append((ny, nx))
    return zones
```

## Explanation

The grid is an implicit **graph**: cells are nodes and adjacent `'#'` cells are connected.

1. Scan every cell. An unvisited `'#'` starts a new component, so increase the counter.
2. **Flood fill** from it with BFS, marking each reached `'#'` as visited so it is never counted
   again. Mark cells *when you enqueue them*, not when you pop them, so a cell can't enter the
   queue twice.
3. When the scan finishes, the counter is the number of zones.

Each cell is visited a constant number of times: `O(rows · cols)` time and `O(rows · cols)` space
for `seen` and the queue.

A recursive DFS is the same algorithm, but a 40 000-cell zone means 40 000 nested calls, which
raises `RecursionError` in Python. An explicit `deque` (BFS) or list (DFS) avoids that.

## Wrong Answers

### Recursive flood fill

Recursive filling of a big zone exceeds Python's recursion limit. Use BFS with a queue or an explicit stack.

```python
def count_zones(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = set()
    def fill(r, c):
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != "#" or (r, c) in seen:
            return
        seen.add((r, c))
        fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1)
    zones = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "#" and (r, c) not in seen:
                zones += 1
                fill(r, c)
    return zones
```

### Counting top-left corners

Counting cells with no `#` above or to the left fails for zones shaped like a U or an L, which have several such corners. Flood-fill each zone and count fills.

```python
def count_zones(grid):
    zones = 0
    for r, row in enumerate(grid):
        for c, ch in enumerate(row):
            if ch == "#" and (r == 0 or grid[r - 1][c] != "#") and (c == 0 or row[c - 1] != "#"):
                zones += 1
    return zones
```
