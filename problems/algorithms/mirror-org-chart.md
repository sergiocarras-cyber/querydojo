---
id: algo-021
slug: mirror-org-chart
title: "Mirror the Org Chart"
section: algorithms
difficulty: Easy
topics: [Trees, DFS]
company: Habitly
function: mirror
comparator: exact
arg_types: [tree]
return_type: tree
complexity: { time: "O(n)", space: "O(h)" }
---

## Statement

**Habitly**'s right-to-left (Arabic, Hebrew) interface shows the org chart **mirrored**: every
node's left and right children are swapped, at every level.

Mirror the binary tree in place and return its root.

```python
def mirror(root: Optional[TreeNode]) -> Optional[TreeNode]:
```

### Examples

```
[4, 2, 7, 1, 3, 6, 9]  -> [4, 7, 2, 9, 6, 3, 1]
[2, 1, 3]              -> [2, 3, 1]
[]                     -> []
```

## Starter

```python
def mirror(root: Optional[TreeNode]) -> Optional[TreeNode]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        4,
        2,
        7,
        1,
        3,
        6,
        9
      ]
    ],
    "expected": [
      4,
      7,
      2,
      9,
      6,
      3,
      1
    ]
  },
  {
    "args": [
      [
        2,
        1,
        3
      ]
    ],
    "expected": [
      2,
      3,
      1
    ]
  },
  {
    "args": [
      []
    ],
    "expected": []
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        1,
        2
      ]
    ],
    "expected": [
      1,
      null,
      2
    ]
  },
  {
    "args": [
      [
        1,
        null,
        2,
        3
      ]
    ],
    "expected": [
      1,
      2,
      null,
      null,
      3
    ]
  },
  {
    "args": [
      [
        1
      ]
    ],
    "expected": [
      1
    ]
  }
]
```

## Generator

```python
def cases():
    yield [list(range(2**13 - 1))]
```

## Hints

### Hint 1

Swapping the children of **one** node is a one-liner: `node.left, node.right = node.right, node.left`.

### Hint 2

Do it for every node: visit them all with a stack or queue.

## Solution

```python
def mirror(root: Optional[TreeNode]) -> Optional[TreeNode]:
    stack = [root] if root else []
    while stack:
        node = stack.pop()
        node.left, node.right = node.right, node.left
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)
    return root
```

## Explanation

Mirroring = swapping left and right **at every node**. The order of visits doesn't matter, so any
traversal works; here an explicit stack (iterative DFS).

`O(n)` time, `O(h)` extra space for the stack (`h` = height).

Recursive version, fine for balanced trees:

```python
def mirror(root):
    if root:
        root.left, root.right = mirror(root.right), mirror(root.left)
    return root
```

Swapping only the root's children is the common mistake: the subtrees keep their original
orientation.

## Wrong Answers

```python
def mirror(root):
    if root:
        root.left, root.right = root.right, root.left
    return root
```
