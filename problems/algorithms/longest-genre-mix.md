---
id: algo-005
slug: longest-genre-mix
title: Longest Genre Mix
section: algorithms
difficulty: Medium
topics: [Sliding window, Hash map]
company: Tunely
function: longest_mix
comparator: exact
complexity: { time: "O(n)", space: "O(k)" }
---

## Statement

**Tunely** wants to cut a "focused mix" out of a user's listening history: a **contiguous**
stretch of songs that uses **at most `k` different genres**.

Given `genres` (the genre of each song, in listening order) and `k`, return the length of the
longest such stretch.

```python
def longest_mix(genres: list[str], k: int) -> int:
```

### Examples

```
genres = ["pop", "rock", "pop", "jazz", "jazz", "pop"], k = 2  ->  4
    # ["pop", "jazz", "jazz", "pop"]
genres = ["lofi", "lofi", "lofi"], k = 1                       ->  3
genres = ["a", "b", "c"], k = 5                                ->  3
genres = [], k = 2                                             ->  0
```

### Constraints

- `0 <= len(genres) <= 100 000`
- `1 <= k <= 50`

## Starter

```python
def longest_mix(genres: list[str], k: int) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [["pop", "rock", "pop", "jazz", "jazz", "pop"], 2], "expected": 4 },
  { "args": [["lofi", "lofi", "lofi"], 1], "expected": 3 },
  { "args": [["a", "b", "c"], 5], "expected": 3 },
  { "args": [[], 2], "expected": 0 }
]
```

## Hidden Tests

```json
[
  { "args": [["a"], 1], "expected": 1 },
  { "args": [["a", "b", "a", "b", "c", "c", "c", "c"], 1], "expected": 4 },
  { "args": [["a", "b", "c", "a", "b", "c"], 2], "expected": 2 },
  { "args": [["x", "y", "x", "z", "x", "y", "y"], 2], "expected": 3 },
  { "args": [["r", "r", "s", "t", "t", "t", "s", "u"], 2], "expected": 5 }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(42)
    # Long two-genre stretches make an O(n^2) "restart from every i" scan too slow.
    yield [["a", "b"] * 25_000 + ["c", "d"] * 25_000, 2]
    yield [[rng.choice("abcdefghij") for _ in range(100_000)], 3]
    yield [["g" + str(i % 7) for i in range(100_000)], 7]
```

## Hints

### Hint 1

Keep a window `[left, right]`. Grow it to the right one song at a time.

### Hint 2

Track how many times each genre appears **inside the window** with a dictionary. The number of
keys is the number of distinct genres.

### Hint 3

When the window has more than `k` genres, move `left` forward (decrementing counts and deleting
keys that reach zero) until it is valid again.

## Solution

```python
def longest_mix(genres: list[str], k: int) -> int:
    counts = {}
    left = 0
    best = 0
    for right, genre in enumerate(genres):
        counts[genre] = counts.get(genre, 0) + 1
        while len(counts) > k:
            old = genres[left]
            counts[old] -= 1
            if counts[old] == 0:
                del counts[old]
            left += 1
        best = max(best, right - left + 1)
    return best
```

## Explanation

**Variable-size sliding window:**

1. `right` extends the window one song at a time and the song's genre count increases.
2. If the window now has more than `k` distinct genres, `left` advances, shrinking it until it is
   valid again. Removing keys whose count drops to zero keeps `len(counts)` equal to the number
   of distinct genres.
3. After each step the window is the longest valid one ending at `right`; keep the maximum.

Each index enters the window once and leaves it at most once, so the total work is `O(n)`
even with the inner `while`. The dictionary never holds more than `k + 1` genres: `O(k)` space.

The brute-force alternative (restart a scan from every `i`) is `O(n²)` when valid stretches are
long, which the hidden tests include.

## Wrong Answers

### Re-scanning from every start

Restarting from each index is O(n²): correct, but too slow for the large hidden inputs. Use a sliding window with a counter of genres.

```python
def longest_mix(genres, k):
    best = 0
    for i in range(len(genres)):
        seen = set()
        for j in range(i, len(genres)):
            seen.add(genres[j])
            if len(seen) > k:
                break
            best = max(best, j - i + 1)
    return best
```

### Zero counts never removed

When a genre's count drops to 0 it stays in the dict, so `len(counts)` never decreases and the window keeps shrinking. Delete keys whose count reaches 0.

```python
def longest_mix(genres, k):
    counts = {}
    left = best = 0
    for right, g in enumerate(genres):
        counts[g] = counts.get(g, 0) + 1
        while len(counts) > k:
            counts[genres[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
```
