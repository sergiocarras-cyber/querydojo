---
id: algo-004
slug: merge-sorted-feeds
title: Merge Two Sorted Feeds
section: algorithms
difficulty: Easy
topics: [Linked list, Two pointers]
company: Chirpnest
function: merge_feeds
comparator: exact
arg_types: [linked_list, linked_list]
return_type: linked_list
complexity: { time: "O(n + m)", space: "O(1)" }
---

## Statement

**Chirpnest** builds the home feed by merging two feeds, each stored as a **singly linked list**
of post timestamps sorted in **ascending** order.

Merge them into a single ascending linked list and return its head. Reuse the existing nodes
(don't build new ones). Equal timestamps may appear in either order relative to each other.

Each node is a `ListNode` with fields `val` and `next` (the class is already defined for you).
An empty feed is `None`.

```python
def merge_feeds(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
```

In the tests, linked lists are written as Python lists: `[1, 4, 9]` means `1 → 4 → 9`.

### Examples

```
a = [1, 4, 9],  b = [2, 4, 10]  ->  [1, 2, 4, 4, 9, 10]
a = [],         b = [3]         ->  [3]
a = [],         b = []          ->  []
```

### Constraints

- Each feed has up to `20 000` nodes.
- Deep recursion (one call per node) exceeds Python's recursion limit on large feeds.

## Starter

```python
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

def merge_feeds(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [[1, 4, 9], [2, 4, 10]], "expected": [1, 2, 4, 4, 9, 10] },
  { "args": [[], [3]], "expected": [3] },
  { "args": [[], []], "expected": [] }
]
```

## Hidden Tests

```json
[
  { "args": [[5], []], "expected": [5] },
  { "args": [[1, 2, 3], [4, 5, 6]], "expected": [1, 2, 3, 4, 5, 6] },
  { "args": [[4, 5, 6], [1, 2, 3]], "expected": [1, 2, 3, 4, 5, 6] },
  { "args": [[1, 1, 1], [1, 1]], "expected": [1, 1, 1, 1, 1] },
  { "args": [[-5, 0, 7], [-6, 8]], "expected": [-6, -5, 0, 7, 8] }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(5)
    a = sorted(rng.randrange(10**9) for _ in range(20_000))
    b = sorted(rng.randrange(10**9) for _ in range(20_000))
    yield [a, b]
    yield [list(range(0, 40_000, 2)), list(range(1, 40_000, 2))]
```

## Hints

### Hint 1

Keep one pointer in each list and always take the smaller head.

### Hint 2

A **dummy** node at the start avoids special-casing the head of the result: append to
`tail.next` and return `dummy.next`.

### Hint 3

When one list runs out, attach the rest of the other one in a single step.

## Solution

```python
def merge_feeds(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next
```

## Explanation

This is the merge step of merge sort, on linked lists:

1. A `dummy` node acts as a fixed starting point; `tail` always points to the last node of the
   merged list.
2. While both lists have nodes, move the smaller head to `tail.next` and advance in that list.
3. When one list is exhausted, the other is already sorted: link it with `tail.next = a or b`.

We relink existing nodes instead of creating new ones: `O(n + m)` time, `O(1)` extra space.

The recursive version (`a.next = merge_feeds(a.next, b)`) is elegant but uses one stack frame per
node; with 40 000 nodes it hits Python's recursion limit (~1000), so iterate.

## Wrong Answers

### Recursion on long feeds

One recursive call per node exceeds Python's recursion limit (about 1000) on long feeds. Merge iteratively with a dummy head.

```python
def merge_feeds(a, b):
    if not a or not b:
        return a or b
    if a.val <= b.val:
        a.next = merge_feeds(a.next, b)
        return a
    b.next = merge_feeds(a, b.next)
    return b
```

### Leftover nodes dropped

When one feed runs out, the rest of the other is never attached. Finish with `tail.next = a or b`.

```python
def merge_feeds(a, b):
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    return dummy.next
```
