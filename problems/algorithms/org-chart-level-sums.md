---
id: algo-007
slug: org-chart-level-sums
title: Org Chart Level Sums
section: algorithms
difficulty: Medium
topics: [Trees, BFS]
company: Habitly
function: level_sums
comparator: exact
arg_types: [tree]
complexity: { time: "O(n)", space: "O(w)" }
---

## Statement

**Habitly** stores its referral program as a **binary tree**: each node is a user and the value
is the number of habits they completed this week. HR wants the total per **level** of the tree
(the root is level 0, its children level 1, and so on).

Return a list where element `i` is the sum of the values on level `i`. An empty tree returns `[]`.

Nodes are `TreeNode` objects with `val`, `left` and `right` (the class is already defined).

```python
def level_sums(root: Optional[TreeNode]) -> list[int]:
```

In the tests, trees are written in **level order** with `null` for missing children:
`[3, 9, 20, null, null, 15, 7]` is

```
      3
     / \
    9   20
       /  \
      15   7
```

### Examples

```
[3, 9, 20, null, null, 15, 7]  ->  [3, 29, 22]
[1]                            ->  [1]
[]                             ->  []
```

### Constraints

- Up to `20 000` nodes; values between `-1000` and `1000`.
- The tree can be very **deep** (a long chain), so recursion may exceed Python's recursion limit.

## Starter

```python
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

def level_sums(root: Optional[TreeNode]) -> list[int]:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [[3, 9, 20, null, null, 15, 7]], "expected": [3, 29, 22] },
  { "args": [[1]], "expected": [1] },
  { "args": [[]], "expected": [] }
]
```

## Hidden Tests

```json
[
  { "args": [[1, 2, 3, 4, 5, 6, 7]], "expected": [1, 5, 22] },
  { "args": [[5, -5, null, 3, null, -3]], "expected": [5, -5, 3, -3] },
  { "args": [[0, 0, 0]], "expected": [0, 0] },
  { "args": [[1, null, 2, null, 3]], "expected": [1, 2, 3] }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(8)
    # Complete tree with 2^14 - 1 nodes.
    yield [[rng.randint(-1000, 1000) for _ in range(2**14 - 1)]]
    # Right-leaning chain of 5000 nodes: [v0, null, v1, null, v2, ...]
    chain = []
    for i in range(5_000):
        chain.append(i % 100)
        if i < 4_999:
            chain.append(None)
    yield [chain]
```

## Hints

### Hint 1

Visiting a tree **level by level** is breadth-first search (BFS) with a queue.

### Hint 2

At the start of each round, the queue holds exactly one level: process `len(queue)` nodes, sum
them, and enqueue their children.

### Hint 3

Use `collections.deque` so popping from the front is `O(1)`.

## Solution

```python
from collections import deque

def level_sums(root: Optional[TreeNode]) -> list[int]:
    if root is None:
        return []
    sums = []
    queue = deque([root])
    while queue:
        level_total = 0
        for _ in range(len(queue)):
            node = queue.popleft()
            level_total += node.val
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        sums.append(level_total)
    return sums
```

## Explanation

**Level-order traversal (BFS):**

1. Start with the root in a queue.
2. Each iteration of the outer loop handles one whole level: the queue's current length is the
   number of nodes on that level. Pop them, add their values, and push their children (which form
   the next level).
3. Append each level's total.

Every node is enqueued and dequeued once: `O(n)` time. The queue holds at most one level, so
space is `O(w)` where `w` is the maximum width of the tree.

A recursive DFS that passes the depth (`sums[depth] += node.val`) also works in principle, but
on a 5000-node chain it needs 5000 nested calls and Python raises `RecursionError`. BFS has no
such limit.

## Wrong Answers

```python
def level_sums(root):
    sums = []
    def dfs(node, depth):
        if node is None:
            return
        if depth == len(sums):
            sums.append(0)
        sums[depth] += node.val
        dfs(node.left, depth + 1)
        dfs(node.right, depth + 1)
    dfs(root, 0)
    return sums
```

```python
from collections import deque

def level_sums(root):
    if root is None:
        return []
    sums, queue = [], deque([root])
    while queue:
        node = queue.popleft()
        sums.append(node.val)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return sums
```
