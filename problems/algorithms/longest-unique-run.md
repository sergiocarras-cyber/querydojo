---
id: algo-026
slug: longest-unique-run
title: "Longest Run Without Repeats"
section: algorithms
difficulty: Medium
topics: [Sliding window, Hash map]
company: Tunely
function: longest_unique
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

**Tunely** measures how long users listen without hearing a repeat. Given the sequence of track
ids `tracks`, return the length of the longest **contiguous** stretch in which **no track appears
twice**.

```python
def longest_unique(tracks: list[str]) -> int:
```

### Examples

```
["a", "b", "c", "a", "b", "b"]  -> 3
["x", "x"]                      -> 1
[]                              -> 0
```

### Constraints

- `0 <= len(tracks) <= 100 000`

## Starter

```python
def longest_unique(tracks: list[str]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        "a",
        "b",
        "c",
        "a",
        "b",
        "b"
      ]
    ],
    "expected": 3
  },
  {
    "args": [
      [
        "x",
        "x"
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      []
    ],
    "expected": 0
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        "p",
        "q",
        "r",
        "q",
        "s",
        "t"
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        "a",
        "b",
        "a",
        "c",
        "d",
        "a"
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        "z"
      ]
    ],
    "expected": 1
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(26)
    yield [["t" + str(i) for i in range(100_000)]]
    yield [["t" + str(rng.randint(0, 2000)) for _ in range(100_000)]]
```

## Hints

### Hint 1

Keep a window `[left, right]` with no repeats and remember the **last index** where each track was seen.

### Hint 2

When `tracks[right]` was last seen inside the window, jump `left` to just after that position.

## Solution

```python
def longest_unique(tracks: list[str]) -> int:
    last_seen = {}
    left = 0
    best = 0
    for right, track in enumerate(tracks):
        if track in last_seen and last_seen[track] >= left:
            left = last_seen[track] + 1
        last_seen[track] = right
        best = max(best, right - left + 1)
    return best
```

## Explanation

**Sliding window with last positions:**

- The window `[left, right]` never contains a repeat.
- When the new track was already seen **inside** the window (`last_seen >= left`), the window must
  start right after that earlier occurrence. Occurrences before `left` don't matter.
- Update the track's last position and the best length.

Each index is processed once: `O(n)`. Restarting the window from scratch at the repeated track
(`left = right`) loses valid elements: in `p q r q s t` the best window is `r q s t`.

## Wrong Answers

### Restarting at the repeated song

On a repeat, the window must restart just after the previous occurrence, not at the current song. `a b c b d` gives `c b d` (length 3), not `b d`.

```python
def longest_unique(tracks):
    seen, left, best = set(), 0, 0
    for right, t in enumerate(tracks):
        if t in seen:
            seen = {t}
            left = right
        else:
            seen.add(t)
        best = max(best, right - left + 1)
    return best
```

### Re-scanning from every start

Starting a new scan at every index is O(n²): correct, but too slow for the large hidden inputs. Keep the last index of each song and move the left edge forward.

```python
def longest_unique(tracks):
    best = 0
    for i in range(len(tracks)):
        seen = set()
        for j in range(i, len(tracks)):
            if tracks[j] in seen:
                break
            seen.add(tracks[j])
        best = max(best, len(seen))
    return best
```
