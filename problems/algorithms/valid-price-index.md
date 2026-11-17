---
id: algo-031
slug: valid-price-index
title: "Valid Price Index"
section: algorithms
difficulty: Medium
topics: [Trees, Binary search tree, DFS]
company: Cartwell Marketplace
function: is_valid_index
comparator: exact
arg_types: [tree]
complexity: { time: "O(n)", space: "O(h)" }
---

## Statement

**Cartwell** indexes prices in a **binary search tree**. The index is valid when, for **every**
node, all values in its **left subtree are strictly smaller** and all values in its **right subtree
are strictly larger** (no duplicates allowed).

Return `True` if the tree is a valid BST.

```python
def is_valid_index(root: Optional[TreeNode]) -> bool:
```

### Examples

```
[8, 3, 10, 1, 6, null, 14]          -> True
[10, 5, 15, null, null, 6, 20]      -> False   # 6 is in 10's right subtree
[]                                  -> True
```

### Constraints

- Up to `10 000` nodes; the tree may be a long chain.

## Starter

```python
def is_valid_index(root: Optional[TreeNode]) -> bool:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        8,
        3,
        10,
        1,
        6,
        null,
        14
      ]
    ],
    "expected": true
  },
  {
    "args": [
      [
        10,
        5,
        15,
        null,
        null,
        6,
        20
      ]
    ],
    "expected": false
  },
  {
    "args": [
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
      [
        2,
        2
      ]
    ],
    "expected": false
  },
  {
    "args": [
      [
        2,
        null,
        2
      ]
    ],
    "expected": false
  },
  {
    "args": [
      [
        5,
        4,
        8,
        3
      ]
    ],
    "expected": true
  },
  {
    "args": [
      [
        5,
        1,
        8,
        null,
        6
      ]
    ],
    "expected": false
  }
]
```

## Generator

```python
def cases():
    chain = []
    for i in range(5_000):
        chain.append(i)
        if i < 4_999:
            chain.append(None)
    yield [chain]
    broken = chain[:]
    broken[-1] = -1
    yield [broken]
```

## Hints

### Hint 1

Checking each node against its **direct** children isn't enough: the rule involves every ancestor.

### Hint 2

Carry an allowed range `(low, high)` down the tree: going left narrows `high`, going right narrows `low`.

### Hint 3

Alternatively, an in-order traversal of a valid BST is strictly increasing. Do it iteratively for deep trees.

## Solution

```python
def is_valid_index(root: Optional[TreeNode]) -> bool:
    stack = [(root, float("-inf"), float("inf"))]
    while stack:
        node, low, high = stack.pop()
        if node is None:
            continue
        if not (low < node.val < high):
            return False
        stack.append((node.left, low, node.val))
        stack.append((node.right, node.val, high))
    return True
```

## Explanation

Every node must respect bounds inherited from **all** its ancestors, not just its parent:

- the root may be anything: `(-∞, +∞)`;
- its left child must be in `(low, root.val)`, its right child in `(root.val, high)`;
- and so on recursively.

Each node is checked once against its bounds: `O(n)` time. Using an explicit stack instead of
recursion keeps a 5 000-node chain from hitting the recursion limit.

The classic mistake compares only with direct children: `[10, 5, 15, null, null, 6, 20]` passes
that check, but 6 sits in 10's right subtree.

## Wrong Answers

```python
def is_valid_index(root):
    stack = [root] if root else []
    while stack:
        node = stack.pop()
        if node.left:
            if node.left.val >= node.val:
                return False
            stack.append(node.left)
        if node.right:
            if node.right.val <= node.val:
                return False
            stack.append(node.right)
    return True
```

```python
def is_valid_index(root):
    def ok(node, low, high):
        if node is None:
            return True
        return low < node.val < high and ok(node.left, low, node.val) and ok(node.right, node.val, high)
    return ok(root, float("-inf"), float("inf"))
```
