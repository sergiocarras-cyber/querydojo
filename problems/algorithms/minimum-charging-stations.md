---
id: algo-035
slug: minimum-charging-stations
title: "Minimum Charging Stations"
section: algorithms
difficulty: Medium
topics: [Heap, Intervals, Sweep line]
company: Moviq Rides
function: min_stations
comparator: exact
complexity: { time: "O(n log n)", space: "O(n)" }
---

## Statement

**Moviq Rides**' electric fleet books charging sessions `[start, end)` (minutes, `end` excluded).
One station charges one car at a time. What is the **minimum number of stations** needed so that
every session can be served?

A session ending at minute `t` frees its station for a session starting at `t`.

```python
def min_stations(sessions: list[list[int]]) -> int:
```

### Examples

```
[[0, 30], [5, 10], [15, 20]]  -> 2
[[1, 5], [5, 10]]             -> 1
[[2, 4]]                      -> 1
```

### Constraints

- `1 <= len(sessions) <= 100 000`, `0 <= start < end <= 10^9`.

## Starter

```python
def min_stations(sessions: list[list[int]]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        [
          0,
          30
        ],
        [
          5,
          10
        ],
        [
          15,
          20
        ]
      ]
    ],
    "expected": 2
  },
  {
    "args": [
      [
        [
          1,
          5
        ],
        [
          5,
          10
        ]
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        [
          2,
          4
        ]
      ]
    ],
    "expected": 1
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        [
          1,
          10
        ],
        [
          2,
          9
        ],
        [
          3,
          8
        ],
        [
          4,
          7
        ]
      ]
    ],
    "expected": 4
  },
  {
    "args": [
      [
        [
          5,
          6
        ],
        [
          1,
          2
        ],
        [
          3,
          4
        ]
      ]
    ],
    "expected": 1
  },
  {
    "args": [
      [
        [
          0,
          5
        ],
        [
          5,
          10
        ],
        [
          0,
          10
        ]
      ]
    ],
    "expected": 2
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(35)
    s = []
    for _ in range(100_000):
        a = rng.randint(0, 10**6)
        s.append([a, a + rng.randint(1, 500)])
    yield [s]
```

## Hints

### Hint 1

Process sessions by start time. Keep the **end times** of sessions currently charging.

### Hint 2

With a min-heap of end times, the earliest-finishing station is at the top: reuse it if it's free by the new start.

## Solution

```python
import heapq

def min_stations(sessions: list[list[int]]) -> int:
    busy_until = []  # min-heap of end times of occupied stations
    for start, end in sorted(sessions):
        if busy_until and busy_until[0] <= start:
            heapq.heapreplace(busy_until, end)   # reuse the station that frees up first
        else:
            heapq.heappush(busy_until, end)       # open a new station
    return len(busy_until)
```

## Explanation

The answer is the **maximum number of overlapping sessions** at any moment.

**Greedy with a min-heap:**

1. Sort sessions by start.
2. The heap holds the end time of each station's current session; the top is the station that frees
   up first.
3. If that station is free by the new start (`end <= start`, since `end` is excluded), reuse it;
   otherwise open a new station.

The heap size at the end is the number of stations: `O(n log n)`.

Sweep-line alternative: sort all starts and ends, walk them in order (ends before starts on ties),
and track the running count. Treating `end` as inclusive (`<` instead of `<=`) over-counts
back-to-back sessions.

## Wrong Answers

### A free station is not reused at the same minute

A station whose session ends at time `t` can serve one starting at `t`. Use `<=` when checking `busy_until[0]`.

```python
import heapq

def min_stations(sessions):
    heap = []
    for s, e in sorted(sessions):
        if heap and heap[0] < s:
            heapq.heapreplace(heap, e)
        else:
            heapq.heappush(heap, e)
    return len(heap)
```

### Counting overlaps for every session

Comparing every pair of sessions is O(n²): correct, but too slow for the large hidden inputs. Sort by start and keep a min-heap of end times.

```python
def min_stations(sessions):
    best = 0
    for s, _ in sessions:
        best = max(best, sum(1 for a, b in sessions if a <= s < b))
    return best
```
