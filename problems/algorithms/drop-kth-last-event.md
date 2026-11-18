---
id: algo-030
slug: drop-kth-last-event
title: "Drop the K-th Last Event"
section: algorithms
difficulty: Medium
topics: [Linked list, Two pointers]
company: Habitly
function: drop_kth_last
comparator: exact
arg_types: [linked_list, null]
return_type: linked_list
complexity: { time: "O(n)", space: "O(1)" }
---

## Statement

**Habitly** keeps a user's events in a singly linked list, oldest first. Support sometimes needs to
delete the **k-th event counting from the end** (`k = 1` is the last event).

Remove that node and return the head of the list. `1 <= k <= length`.

```python
def drop_kth_last(head: Optional[ListNode], k: int) -> Optional[ListNode]:
```

### Examples

```
[1, 2, 3, 4, 5], k = 2  -> [1, 2, 3, 5]
[1], k = 1              -> []
[1, 2], k = 2           -> [2]
```

### Constraints

- Up to `20 000` events. Try a single pass.

## Starter

```python
def drop_kth_last(head: Optional[ListNode], k: int) -> Optional[ListNode]:
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
        4,
        5
      ],
      2
    ],
    "expected": [
      1,
      2,
      3,
      5
    ]
  },
  {
    "args": [
      [
        1
      ],
      1
    ],
    "expected": []
  },
  {
    "args": [
      [
        1,
        2
      ],
      2
    ],
    "expected": [
      2
    ]
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
      ],
      1
    ],
    "expected": [
      1
    ]
  },
  {
    "args": [
      [
        4,
        5,
        6,
        7
      ],
      4
    ],
    "expected": [
      5,
      6,
      7
    ]
  },
  {
    "args": [
      [
        9,
        9,
        9
      ],
      2
    ],
    "expected": [
      9,
      9
    ]
  }
]
```

## Generator

```python
def cases():
    yield [list(range(20_000)), 20_000]
    yield [list(range(20_000)), 1]
    yield [list(range(20_000)), 7_777]
```

## Hints

### Hint 1

Move a `fast` pointer `k` nodes ahead, then move `fast` and `slow` together until `fast` reaches the end.

### Hint 2

Start both pointers at a **dummy** node placed before the head, so removing the head needs no special case.

## Solution

```python
def drop_kth_last(head: Optional[ListNode], k: int) -> Optional[ListNode]:
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(k):
        fast = fast.next
    while fast.next:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next   # slow is just before the node to remove
    return dummy.next
```

## Explanation

**Two pointers with a gap of `k`:**

1. Advance `fast` `k` nodes from the dummy.
2. Move both pointers until `fast` is on the **last** node. The gap is preserved, so `slow` stops
   right **before** the k-th node from the end.
3. Unlink it with `slow.next = slow.next.next`.

The **dummy** node handles `k = length` (removing the head) without special cases. One pass,
`O(1)` extra space. Counting the length first and walking again also works in `O(n)`.

## Wrong Answers

### Counting from the front

Walking `k - 1` steps from the head removes the k-th event from the start. The k-th last needs two pointers `k` apart (or the list length).

```python
def drop_kth_last(head, k):
    dummy = ListNode(0, head)
    node = dummy
    for _ in range(k - 1):
        node = node.next
    node.next = node.next.next
    return dummy.next
```

### Removing the first event fails

Without a dummy node, when `k` equals the length the head itself must go, and this code removes the second event instead. Start both pointers at a dummy before the head.

```python
def drop_kth_last(head, k):
    fast = slow = head
    for _ in range(k):
        fast = fast.next
    while fast and fast.next:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next if slow.next else None
    return head
```
