---
id: algo-034
slug: top-hashtags
title: "Top K Hashtags"
section: algorithms
difficulty: Medium
topics: [Heap, Hash map, Sorting]
company: Chirpnest
function: top_hashtags
comparator: exact
complexity: { time: "O(n + m log k)", space: "O(m)" }
---

## Statement

**Chirpnest**'s trending panel shows the `k` most used hashtags. Return them ordered by **frequency
descending**; ties are broken **alphabetically** (ascending).

`k` is at most the number of distinct hashtags.

```python
def top_hashtags(tags: list[str], k: int) -> list[str]:
```

### Examples

```
["#ai", "#cats", "#ai", "#dogs", "#cats", "#ai"], k = 2  -> ["#ai", "#cats"]
["#b", "#a", "#b", "#a", "#c"], k = 2                     -> ["#a", "#b"]
```

### Constraints

- `1 <= len(tags) <= 200 000`

## Starter

```python
def top_hashtags(tags: list[str], k: int) -> list[str]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        "#ai",
        "#cats",
        "#ai",
        "#dogs",
        "#cats",
        "#ai"
      ],
      2
    ],
    "expected": [
      "#ai",
      "#cats"
    ]
  },
  {
    "args": [
      [
        "#b",
        "#a",
        "#b",
        "#a",
        "#c"
      ],
      2
    ],
    "expected": [
      "#a",
      "#b"
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
        "#z",
        "#y",
        "#x"
      ],
      3
    ],
    "expected": [
      "#x",
      "#y",
      "#z"
    ]
  },
  {
    "args": [
      [
        "#q"
      ],
      1
    ],
    "expected": [
      "#q"
    ]
  },
  {
    "args": [
      [
        "#m",
        "#n",
        "#n",
        "#m",
        "#o",
        "#o",
        "#p"
      ],
      3
    ],
    "expected": [
      "#m",
      "#n",
      "#o"
    ]
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(34)
    pool = ["#t" + str(i) for i in range(5_000)]
    yield [[rng.choice(pool) for _ in range(200_000)], 10]
```

## Hints

### Hint 1

Count with a dictionary first.

### Hint 2

`heapq.nsmallest(k, counts, key=lambda t: (-counts[t], t))` returns the `k` best by (frequency desc, name asc).

## Solution

```python
import heapq
from collections import Counter

def top_hashtags(tags: list[str], k: int) -> list[str]:
    counts = Counter(tags)
    return heapq.nsmallest(k, counts, key=lambda t: (-counts[t], t))
```

## Explanation

1. **Count** occurrences: `O(n)`.
2. **Select** the top `k` of the `m` distinct tags by the key `(-count, tag)`: higher counts first,
   then alphabetical. `heapq.nsmallest` keeps a heap of size `k`: `O(m log k)`, better than sorting
   all `m` tags when `k` is small. (Sorting everything is `O(m log m)` and also fine here.)

`Counter.most_common(k)` orders ties by **first appearance**, not alphabetically, a subtle source of
wrong answers.

## Wrong Answers

```python
from collections import Counter

def top_hashtags(tags, k):
    return [t for t, _ in Counter(tags).most_common(k)]
```

```python
from collections import Counter

def top_hashtags(tags, k):
    counts = Counter(tags)
    return sorted(counts, key=lambda t: (counts[t], t), reverse=True)[:k]
```
