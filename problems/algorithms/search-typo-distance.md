---
id: algo-010
slug: search-typo-distance
title: Search Typo Distance
section: algorithms
difficulty: Hard
topics: [Dynamic programming, Strings]
company: Cartwell Marketplace
function: typo_distance
comparator: exact
time_limit_ms: 4000
complexity: { time: "O(n · m)", space: "O(m)" }
---

## Statement

**Cartwell**'s search box suggests corrections for misspelled queries. To rank suggestions it
needs the **minimum number of single-character edits** that turn the typed text `a` into a
candidate `b`. An edit is one of:

- **insert** a character,
- **delete** a character,
- **replace** a character with another.

```python
def typo_distance(a: str, b: str) -> int:
```

### Examples

```
"flour", "flower"  ->  2   # replace 'u' with 'w', insert 'e'
"", "abc"          ->  3   # three inserts
"same", "same"     ->  0
"abc", "yabd"      ->  2   # insert 'y', replace 'c' with 'd'
```

### Constraints

- `0 <= len(a), len(b) <= 1000`
- Lowercase letters, digits and spaces.

## Starter

```python
def typo_distance(a: str, b: str) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": ["flour", "flower"], "expected": 2 },
  { "args": ["", "abc"], "expected": 3 },
  { "args": ["same", "same"], "expected": 0 },
  { "args": ["abc", "yabd"], "expected": 2 }
]
```

## Hidden Tests

```json
[
  { "args": ["", ""], "expected": 0 },
  { "args": ["abc", ""], "expected": 3 },
  { "args": ["ab", "ba"], "expected": 2 },
  { "args": ["a", "b"], "expected": 1 },
  { "args": ["intention", "execution"], "expected": 5 },
  { "args": ["back pack", "backpack"], "expected": 1 }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(1)
    letters = "abcdef"
    a = "".join(rng.choice(letters) for _ in range(1_000))
    b = "".join(rng.choice(letters) for _ in range(1_000))
    yield [a, b]
    yield [a, a[::-1]]
    yield ["x" * 900, "y" * 950]
```

## Hints

### Hint 1

Let `D[i][j]` be the distance between the first `i` characters of `a` and the first `j`
characters of `b`. What are `D[i][0]` and `D[0][j]`?

### Hint 2

If `a[i-1] == b[j-1]`, the last characters match for free: `D[i][j] = D[i-1][j-1]`.

### Hint 3

Otherwise the last edit was a delete, an insert or a replace:
`D[i][j] = 1 + min(D[i-1][j], D[i][j-1], D[i-1][j-1])`.

### Hint 4

Row `i` only needs row `i - 1`, so you can keep two rows (`O(m)` memory). Avoid recursion: the
inputs are long.

## Solution

```python
def typo_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))  # D[0][j] = j inserts
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)     # D[i][0] = i deletes
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j],      # delete a[i-1]
                                 cur[j - 1],   # insert b[j-1]
                                 prev[j - 1])  # replace
        prev = cur
    return prev[len(b)]
```

## Explanation

This is the **edit (Levenshtein) distance**, a classic 2-D dynamic programming problem.

**State.** `D[i][j]` is the minimum number of edits to turn `a[:i]` into `b[:j]`.

**Base cases.** `D[0][j] = j` (insert `j` characters), `D[i][0] = i` (delete `i` characters).

**Transition.** Look at the last characters:

- equal → no edit needed: `D[i-1][j-1]`;
- different → one edit plus the best of
  - delete `a[i-1]`: `D[i-1][j]`,
  - insert `b[j-1]`: `D[i][j-1]`,
  - replace: `D[i-1][j-1]`.

**Order.** Fill row by row; each cell depends only on the row above and the cell to its left, so
two rows of length `m + 1` are enough.

Time `O(n · m)` (one million cells for 1000×1000), space `O(m)`.

A plain recursive solution recomputes the same subproblems exponentially many times; even with
`@lru_cache` it needs recursion depth up to `n + m`, which overflows on long strings. Bottom-up
tables avoid both issues.

## Wrong Answers

```python
def typo_distance(a, b):
    if not a or not b:
        return len(a) + len(b)
    if a[-1] == b[-1]:
        return typo_distance(a[:-1], b[:-1])
    return 1 + min(typo_distance(a[:-1], b), typo_distance(a, b[:-1]), typo_distance(a[:-1], b[:-1]))
```

```python
def typo_distance(a, b):
    # Longest common subsequence based guess: not the same thing as edit distance.
    n, m = len(a), len(b)
    prev = [0] * (m + 1)
    for i in range(1, n + 1):
        cur = [0] * (m + 1)
        for j in range(1, m + 1):
            cur[j] = prev[j - 1] + 1 if a[i - 1] == b[j - 1] else max(prev[j], cur[j - 1])
        prev = cur
    return max(n, m) - prev[m]
```
