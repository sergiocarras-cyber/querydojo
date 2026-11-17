---
id: algo-038
slug: largest-billboard
title: "Largest Billboard on the Skyline"
section: algorithms
difficulty: Hard
topics: [Stack, Monotonic stack]
company: Loomly Home
function: largest_billboard
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

**Loomly Home** wants to paint a rectangular ad across a row of adjacent buildings of width 1.
`heights[i]` is the height of building `i`. The ad must be an axis-aligned rectangle resting on the
ground, spanning **consecutive** buildings, and no taller than the **shortest** building it covers.

Return the **largest possible area**.

```python
def largest_billboard(heights: list[int]) -> int:
```

### Examples

```
[3, 1, 4, 4, 2]  -> 8    # height 4 over the two 4s
[2, 2, 2]        -> 6
[5]              -> 5
```

### Constraints

- `1 <= len(heights) <= 100 000`, `0 <= heights[i] <= 10 000`.

## Starter

```python
def largest_billboard(heights: list[int]) -> int:
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
        1,
        4,
        4,
        2
      ]
    ],
    "expected": 8
  },
  {
    "args": [
      [
        2,
        2,
        2
      ]
    ],
    "expected": 6
  },
  {
    "args": [
      [
        5
      ]
    ],
    "expected": 5
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        0,
        0
      ]
    ],
    "expected": 0
  },
  {
    "args": [
      [
        1,
        2,
        3,
        4,
        5
      ]
    ],
    "expected": 9
  },
  {
    "args": [
      [
        5,
        4,
        3,
        2,
        1
      ]
    ],
    "expected": 9
  },
  {
    "args": [
      [
        4,
        1,
        4
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        2,
        3,
        1,
        3,
        2
      ]
    ],
    "expected": 5
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(38)
    yield [list(range(1, 100_001))]
    yield [[rng.randint(0, 10_000) for _ in range(100_000)]]
```

## Hints

### Hint 1

For each building, the best rectangle **using its height** extends left and right until a shorter building.

### Hint 2

Keep a stack of indices with increasing heights. When a shorter building arrives, it ends the rectangles of the taller buildings popped from the stack.

### Hint 3

Add a sentinel of height 0 at the end so every building gets popped.

## Solution

```python
def largest_billboard(heights: list[int]) -> int:
    stack = []  # indices with increasing heights
    best = 0
    for i, h in enumerate(heights + [0]):        # sentinel flushes the stack
        while stack and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            left = stack[-1] + 1 if stack else 0  # first index the rectangle can start at
            best = max(best, height * (i - left))
        stack.append(i)
    return best
```

## Explanation

The best rectangle has the height of some building `j` and extends as far as possible to both sides
while buildings are at least that tall.

**Monotonic stack:** keep indices whose heights increase from bottom to top.

- When building `i` is not taller than the top, the top building `j` can't extend past `i`: pop it.
  The new top (if any) is the nearest shorter building on the left, so the rectangle of height
  `heights[j]` spans from `left = new_top + 1` to `i − 1`, width `i − left`.
- A trailing sentinel of height 0 pops everything at the end.

Each index is pushed and popped once: `O(n)`. Trying every pair of boundaries is `O(n²)`, five
billion steps for 100 000 buildings.

## Wrong Answers

```python
def largest_billboard(heights):
    best = 0
    for i in range(len(heights)):
        low = heights[i]
        for j in range(i, len(heights)):
            low = min(low, heights[j])
            best = max(best, low * (j - i + 1))
    return best
```

```python
def largest_billboard(heights):
    return max(h * sum(1 for x in heights if x >= h) for h in heights)
```
