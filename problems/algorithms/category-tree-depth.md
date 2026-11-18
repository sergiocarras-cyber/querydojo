---
id: algo-020
slug: category-tree-depth
title: "Category Tree Depth"
section: algorithms
difficulty: Easy
topics: [Trees, BFS]
company: Shelfie Books
function: max_depth
comparator: exact
arg_types: [tree]
complexity: { time: "O(n)", space: "O(w)" }
---

## Statement

**Shelfie Books** organises genres in a binary tree. The **depth** of the tree is the number of
nodes on the longest path from the root down to a leaf. An empty tree has depth 0.

```python
def max_depth(root: Optional[TreeNode]) -> int:
```

Trees are written in level order with `null` for missing children.

### Examples

```
[3, 9, 20, null, null, 15, 7]  -> 3
[1, null, 2]                   -> 2
[]                             -> 0
```

### Constraints

- Up to `20 000` nodes; the tree can be a long chain (deep recursion fails).

## Starter

```python
def max_depth(root: Optional[TreeNode]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        3,
        9,
        20,
        null,
        null,
        15,
        7
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        1,
        null,
        2
      ]
    ],
    "expected": 2
  },
  {
    "args": [
      []
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
      [
        1
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        1,
        2,
        3,
        4,
        null,
        null,
        null,
        5
      ]
    ],
    "expected": 4
  }
]
```

## Generator

```python
def cases():
    chain = []
    for i in range(4_000):
        chain.append(i)
        if i < 3_999:
            chain.append(None)
    yield [chain]
    yield [list(range(2**14 - 1))]
```

## Hints

### Hint 1

Count levels with a breadth-first search: every round of the queue is one level.

### Hint 2

Or do a depth-first search with an explicit stack of `(node, depth)` pairs.

## Solution

```python
from collections import deque

def max_depth(root: Optional[TreeNode]) -> int:
    if root is None:
        return 0
    depth = 0
    queue = deque([root])
    while queue:
        depth += 1
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    return depth
```

## Explanation

The depth is the number of **levels**, which BFS counts directly: each iteration of the outer loop
consumes exactly one level from the queue.

`O(n)` time; the queue holds at most one level (`O(w)` space, `w` = maximum width).

The textbook recursion `1 + max(depth(left), depth(right))` is correct but needs one stack frame per
level, which overflows Python's ~1000-frame limit on a 4 000-node chain.

## Wrong Answers

### Recursion on a deep tree

A very deep (chain-like) category tree exceeds Python's recursion limit. Use iterative BFS by levels.

```python
def max_depth(root):
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

### Counting nodes instead of levels

Incrementing once per node counts nodes. Increment once per level: process the queue level by level.

```python
from collections import deque

def max_depth(root):
    if root is None:
        return 0
    depth, queue = 0, deque([root])
    while queue:
        node = queue.popleft()
        depth += 1
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return depth
```
