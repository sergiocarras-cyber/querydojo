---
id: algo-019
slug: reverse-the-playlist
title: "Reverse the Playlist"
section: algorithms
difficulty: Easy
topics: [Linked list]
company: Tunely
function: reverse_playlist
comparator: exact
arg_types: [linked_list]
return_type: linked_list
complexity: { time: "O(n)", space: "O(1)" }
---

## Statement

A **Tunely** playlist is stored as a singly linked list of track ids. Reverse it **in place** and
return the new head.

```python
def reverse_playlist(head: Optional[ListNode]) -> Optional[ListNode]:
```

In the tests, `[1, 2, 3]` means `1 → 2 → 3`.

### Examples

```
[1, 2, 3, 4]  -> [4, 3, 2, 1]
[9]           -> [9]
[]            -> []
```

### Constraints

- Up to `20 000` tracks: a recursive solution exceeds Python's recursion limit.

## Starter

```python
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

def reverse_playlist(head: Optional[ListNode]) -> Optional[ListNode]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        1,
        2,
        3,
        4
      ]
    ],
    "expected": [
      4,
      3,
      2,
      1
    ]
  },
  {
    "args": [
      [
        9
      ]
    ],
    "expected": [
      9
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
      2,
      1
    ]
  },
  {
    "args": [
      [
        5,
        5,
        6
      ]
    ],
    "expected": [
      6,
      5,
      5
    ]
  }
]
```

## Generator

```python
def cases():
    yield [list(range(20_000))]
```

## Hints

### Hint 1

Walk the list once, keeping a pointer to the previous node.

### Hint 2

For each node: remember `next`, point `node.next` to `prev`, then advance both pointers.

## Solution

```python
def reverse_playlist(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    node = head
    while node:
        nxt = node.next
        node.next = prev
        prev = node
        node = nxt
    return prev
```

## Explanation

Reverse the arrows one node at a time:

1. Save `nxt = node.next` before overwriting it.
2. Point the current node back to `prev`.
3. Move `prev` and `node` one step forward.

When `node` becomes `None`, `prev` is the old tail, which is the new head. `O(n)` time, `O(1)` extra
space, no new nodes.

The recursive version is a nice one-liner but uses one stack frame per node.

## Wrong Answers

```python
def reverse_playlist(head):
    if head is None or head.next is None:
        return head
    new_head = reverse_playlist(head.next)
    head.next.next = head
    head.next = None
    return new_head
```

```python
def reverse_playlist(head):
    prev, node = None, head
    while node and node.next:
        nxt = node.next
        node.next = prev
        prev, node = node, nxt
    return prev
```
