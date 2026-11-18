---
id: algo-037
slug: minimum-window-all-tags
title: "Smallest Window With All Tags"
section: algorithms
difficulty: Hard
topics: [Sliding window, Hash map, Strings]
company: Chirpnest
function: min_window
comparator: exact
complexity: { time: "O(n + m)", space: "O(k)" }
---

## Statement

**Chirpnest**'s moderation tool scans a stream of single-character event codes `feed`. Given the
codes in `required` (which may repeat), find the **shortest contiguous substring** of `feed` that
contains every character of `required` **at least as many times** as it appears there.

Return that substring, the **leftmost** one if several have the minimum length, or `""` if none
exists.

```python
def min_window(feed: str, required: str) -> str:
```

### Examples

```
feed = "XAYBZCAB", required = "ABC"  -> "CAB"
feed = "aa", required = "aa"         -> "aa"
feed = "a", required = "b"           -> ""
```

### Constraints

- `1 <= len(required) <= len(feed) <= 100 000`

## Starter

```python
def min_window(feed: str, required: str) -> str:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      "XAYBZCAB",
      "ABC"
    ],
    "expected": "CAB"
  },
  {
    "args": [
      "aa",
      "aa"
    ],
    "expected": "aa"
  },
  {
    "args": [
      "a",
      "b"
    ],
    "expected": ""
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      "aab",
      "aab"
    ],
    "expected": "aab"
  },
  {
    "args": [
      "bba",
      "ab"
    ],
    "expected": "ba"
  },
  {
    "args": [
      "xyzzyx",
      "zz"
    ],
    "expected": "zz"
  },
  {
    "args": [
      "abcabc",
      "cb"
    ],
    "expected": "bc"
  },
  {
    "args": [
      "aaab",
      "aab"
    ],
    "expected": "aab"
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(37)
    feed = "".join(rng.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(100_000))
    yield [feed, "zyxwvutsrqponmlk"]
    yield ["a" * 99_998 + "bc", "abc"]
```

## Hints

### Hint 1

Expand a window to the right until it contains everything required; then shrink it from the left while it still does.

### Hint 2

Track `need[c]` (how many more of `c` the window needs) and a counter of characters still missing.

### Hint 3

Record the window each time it is valid and minimal from the left; keep the first shortest one.

## Solution

```python
from collections import Counter

def min_window(feed: str, required: str) -> str:
    need = Counter(required)
    missing = len(required)
    left = 0
    best = (float("inf"), 0, 0)  # (length, start, end)
    for right, ch in enumerate(feed):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:                       # window [left, right] is valid
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right + 1)
            out = feed[left]
            need[out] += 1
            if need[out] > 0:
                missing += 1
            left += 1
    return "" if best[0] == float("inf") else feed[best[1]:best[2]]
```

## Explanation

**Variable sliding window with counts:**

- `need[c]` = how many more copies of `c` the window still needs; it goes negative for surplus
  copies. `missing` = total characters still needed (counting multiplicity).
- **Expand:** each new character that was still needed decrements `missing`.
- **Shrink:** while `missing == 0`, the window is valid. Record it if it's the shortest so far (a
  strict `<` keeps the leftmost on ties), then drop the left character; if it was needed, the window
  becomes invalid again.

Each character enters and leaves the window once: `O(n + m)` time; the counter holds at most `k`
distinct characters.

Using a **set** of required characters ignores multiplicity (`"aab"` needs two `a`s), and checking
every substring is `O(n²)` or worse.

## Wrong Answers

### Required tags as a set

A set ignores repeated required tags: if `required` has two `a`, the window needs two. Count them with a `Counter`.

```python
def min_window(feed, required):
    need = set(required)
    best = ""
    for i in range(len(feed)):
        seen = set()
        for j in range(i, len(feed)):
            if feed[j] in need:
                seen.add(feed[j])
            if seen == need:
                if not best or j - i + 1 < len(best):
                    best = feed[i:j + 1]
                break
    return best
```

### Every start position

Restarting from each index is O(n²): correct, but too slow for the large hidden inputs. Use a sliding window that tracks how many required tags are still missing.

```python
from collections import Counter

def min_window(feed, required):
    need = Counter(required)
    best = ""
    for i in range(len(feed)):
        window = Counter()
        for j in range(i, len(feed)):
            window[feed[j]] += 1
            if all(window[c] >= n for c, n in need.items()):
                if not best or j - i + 1 < len(best):
                    best = feed[i:j + 1]
                break
    return best
```
