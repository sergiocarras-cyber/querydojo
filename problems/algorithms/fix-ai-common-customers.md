---
id: algo-042
slug: fix-ai-common-customers
title: "Fix the AI: Customers in Both Lists"
section: algorithms
difficulty: Easy
topics: [AI code review, Performance, Hash set]
company: Pennywise Pay
ai_review: true
function: common_ids
comparator: exact
complexity: { time: "O(n log n)", space: "O(n)" }
---

## Statement

**Pennywise Pay**'s fraud team has two lists of customer ids: customers who changed their phone number
this week (`a`) and customers who made an international transfer (`b`). They need the ids that appear
in **both**, sorted ascending and without duplicates.

An AI assistant wrote the function in the editor. It returns the right answer on the examples, but the
nightly job with 60 000 ids per list never finishes.

**Find the problem and fix the function.**

```python
def common_ids(a: list[int], b: list[int]) -> list[int]:
```

### Examples

```
a = [30, 5, 12, 5], b = [12, 5, 99]   ->  [5, 12]
a = [1, 2], b = [3]                    ->  []
```

### Constraints

- `0 <= len(a), len(b) <= 60 000`
- Hidden tests include two lists of 60 000 ids: the AI's version runs out of time.

## Starter

```python
# Written by an AI assistant. Correct on the examples, but the nightly job never finishes.
def common_ids(a, b):
    return sorted({x for x in a if x in b})
```

## Tests

```json
[
  { "args": [[30, 5, 12, 5], [12, 5, 99]], "expected": [5, 12] },
  { "args": [[1, 2], [3]], "expected": [] },
  { "args": [[], [1]], "expected": [] }
]
```

## Hidden Tests

```json
[
  { "args": [[7, 7, 7], [7]], "expected": [7] },
  { "args": [[-3, 0, 4, 9], [9, -3, 4, 0]], "expected": [-3, 0, 4, 9] }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(42)
    for n in (60_000, 60_000):
        a = [rng.randrange(1_000_000) for _ in range(n)]
        b = [rng.randrange(1_000_000) for _ in range(n)]
        yield [a, b]
```

## Hints

### Hint 1

The answer is correct. How long does `x in b` take when `b` is a list?

### Hint 2

`x in some_list` scans the list: O(m). Doing it for every `x` in `a` is O(n · m), about 3.6 billion
steps here.

### Hint 3

Membership in a `set` is O(1) on average.

## Solution

```python
def common_ids(a: list[int], b: list[int]) -> list[int]:
    return sorted(set(a) & set(b))
```

## Explanation

The AI's version is **correct but quadratic**: `x in b` on a list scans `b` every time, so the work is
`len(a) × len(b)`. With 60 000 ids each that's 3.6 billion comparisons, and the job never finishes.

Turning both lists into sets makes each membership test O(1) on average. The intersection is O(n + m),
and sorting the result costs O(k log k).

AI assistants often produce code like this: short, readable and correct on the examples. Checking
complexity against the real data size is part of the review.

## Wrong Answers

### The AI's original function

Your function is still too slow for the large lists, like the AI's. What does `x in b` cost when `b` is
a list?

```python
def common_ids(a, b):
    return sorted({x for x in a if x in b})
```

### Duplicates kept

Fast now, but ids that appear several times in `a` are repeated in the result. The output must contain
each id once.

```python
def common_ids(a, b):
    in_b = set(b)
    return sorted(x for x in a if x in in_b)
```

### Not sorted

The intersection of two sets has no guaranteed order. The result must be sorted ascending.

```python
def common_ids(a, b):
    return list(set(a) & set(b))
```
