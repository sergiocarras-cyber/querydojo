---
id: algo-022
slug: group-anagram-tags
title: "Group Anagram Tags"
section: algorithms
difficulty: Medium
topics: [Arrays & Hashing, Hash map, Strings]
company: Chirpnest
function: group_tags
comparator: unordered_deep
complexity: { time: "O(n · k log k)", space: "O(n · k)" }
---

## Statement

**Chirpnest** wants to merge hashtags that are **anagrams** of each other (same letters, same
counts, any order). Group the tags so that each group contains all tags that are anagrams of one
another. Duplicated tags stay duplicated.

Return the groups **in any order**, with the tags inside each group **in any order**.

```python
def group_tags(tags: list[str]) -> list[list[str]]:
```

### Example

```
["stop", "pots", "cat", "tops", "act", "dog"]
-> [["stop", "pots", "tops"], ["cat", "act"], ["dog"]]
```

### Constraints

- Up to `50 000` tags of lowercase letters, each at most 12 characters (possibly empty).

## Starter

```python
def group_tags(tags: list[str]) -> list[list[str]]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        "stop",
        "pots",
        "cat",
        "tops",
        "act",
        "dog"
      ]
    ],
    "expected": [
      [
        "stop",
        "pots",
        "tops"
      ],
      [
        "cat",
        "act"
      ],
      [
        "dog"
      ]
    ]
  },
  {
    "args": [
      [
        "solo"
      ]
    ],
    "expected": [
      [
        "solo"
      ]
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
        ""
      ]
    ],
    "expected": [
      [
        ""
      ]
    ]
  },
  {
    "args": [
      [
        "aab",
        "abb",
        "bab",
        "aba"
      ]
    ],
    "expected": [
      [
        "aab",
        "aba"
      ],
      [
        "abb",
        "bab"
      ]
    ]
  },
  {
    "args": [
      [
        "aa",
        "aa",
        "a"
      ]
    ],
    "expected": [
      [
        "aa",
        "aa"
      ],
      [
        "a"
      ]
    ]
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(22)
    tags = ["".join(rng.choice("abcde") for _ in range(rng.randint(0, 8))) for _ in range(50_000)]
    yield [tags]
```

## Hints

### Hint 1

Two tags are anagrams if they become identical after **sorting their letters**.

### Hint 2

Use a dictionary from that canonical key to the list of tags: `groups[''.join(sorted(tag))].append(tag)`.

## Solution

```python
from collections import defaultdict

def group_tags(tags: list[str]) -> list[list[str]]:
    groups = defaultdict(list)
    for tag in tags:
        groups["".join(sorted(tag))].append(tag)
    return list(groups.values())
```

## Explanation

Give every tag a **canonical key** shared by all its anagrams and nobody else: the sorted letters
(`"pots"` → `"opst"`). A hash map from key to list groups them in one pass.

Cost: sorting each tag of length `k` is `O(k log k)`, so `O(n · k log k)` overall. With a small
alphabet you can use a letter-count tuple as the key for `O(n · k)`.

Comparing every pair of tags is `O(n²)`. Using `frozenset(tag)` as the key is wrong: `"aab"` and
`"abb"` have the same letters but different counts.

## Wrong Answers

### Sets ignore letter counts

`frozenset('aab') == frozenset('ab')`, so tags with different letter counts land in the same group. Use the sorted string as the key.

```python
from collections import defaultdict

def group_tags(tags):
    groups = defaultdict(list)
    for t in tags:
        groups[frozenset(t)].append(t)
    return list(groups.values())
```

### Only the first tag of each group

`setdefault` keeps only the first tag per key and every group comes out with one element. Append every tag to its group.

```python
def group_tags(tags):
    groups = {}
    for t in tags:
        groups.setdefault("".join(sorted(t)), t)
    return [[t] for t in groups.values()]
```
