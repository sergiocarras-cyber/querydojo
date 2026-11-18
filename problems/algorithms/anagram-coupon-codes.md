---
id: algo-011
slug: anagram-coupon-codes
title: "Anagram Coupon Codes"
section: algorithms
difficulty: Easy
topics: [Arrays & Hashing, Counting]
company: Basketly
function: same_letters
comparator: exact
complexity: { time: "O(n)", space: "O(k)" }
---

## Statement

**Basketly** lets partners reshuffle coupon codes: a reshuffled code is valid if it uses **exactly
the same characters, the same number of times**, in any order (case-sensitive).

Return `True` if `b` is a reshuffle of `a`.

```python
def same_letters(a: str, b: str) -> bool:
```

### Examples

```
"SAVE20", "20EVAS"  -> True
"DEAL", "LEAD"      -> True
"BONUS", "BONUSS"   -> False   # different lengths
"aab", "abb"        -> False   # same letters, different counts
```

### Constraints

- `0 <= len(a), len(b) <= 200 000`

## Starter

```python
def same_letters(a: str, b: str) -> bool:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      "SAVE20",
      "20EVAS"
    ],
    "expected": true
  },
  {
    "args": [
      "DEAL",
      "LEAD"
    ],
    "expected": true
  },
  {
    "args": [
      "BONUS",
      "BONUSS"
    ],
    "expected": false
  },
  {
    "args": [
      "aab",
      "abb"
    ],
    "expected": false
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      "",
      ""
    ],
    "expected": true
  },
  {
    "args": [
      "a",
      "A"
    ],
    "expected": false
  },
  {
    "args": [
      "abc",
      "cab"
    ],
    "expected": true
  },
  {
    "args": [
      "xxy",
      "xyy"
    ],
    "expected": false
  },
  {
    "args": [
      "ab",
      "a"
    ],
    "expected": false
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(4)
    a = "".join(rng.choice("ABCDEFGH0123456789") for _ in range(200_000))
    b = list(a)
    rng.shuffle(b)
    yield [a, "".join(b)]
    b[0] = "Z"
    yield [a, "".join(b)]
```

## Hints

### Hint 1

Two strings are reshuffles of each other when every character appears the same number of times in both.

### Hint 2

Count characters with a dictionary (or `collections.Counter`) and compare the counts.

## Solution

```python
from collections import Counter

def same_letters(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False
    return Counter(a) == Counter(b)
```

## Explanation

Two strings are anagrams iff their **character counts** are equal.

1. Different lengths can't match: return early.
2. `Counter(a) == Counter(b)` builds two frequency tables in `O(n)` and compares them; the table
   has at most `k` distinct characters.

`sorted(a) == sorted(b)` is also correct, in `O(n log n)`.

**Trap:** `set(a) == set(b)` only checks *which* characters appear, not how many times:
`"aab"` and `"abb"` have the same set.

## Wrong Answers

### Sets ignore letter counts

`set('aab') == set('abb')`, but they are not anagrams. Compare letter counts (`Counter`) or sorted strings.

```python
def same_letters(a, b):
    return set(a) == set(b)
```

### Same length, same letters, different counts

Equal length plus equal sets still accepts `'aab'` vs `'abb'`. Compare the counts of each letter.

```python
def same_letters(a, b):
    return len(a) == len(b) and set(a) == set(b)
```
