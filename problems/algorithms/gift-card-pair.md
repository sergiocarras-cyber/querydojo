---
id: algo-001
slug: gift-card-pair
title: Gift Card Pair
section: algorithms
difficulty: Easy
topics: [Arrays & Hashing, Hash map]
company: Cartwell Marketplace
function: gift_card_pair
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

A **Cartwell** customer has a gift card worth exactly `budget` and wants to spend all of it on
**two different items**.

Given the list `prices` (item prices, in catalogue order) and `budget`, return the indices
`[i, j]` with `i < j` such that `prices[i] + prices[j] == budget`.

The input always has **exactly one** valid pair.

```python
def gift_card_pair(prices: list[int], budget: int) -> list[int]:
```

### Examples

```
prices = [12, 5, 30, 8], budget = 20   ->  [0, 3]    # 12 + 8
prices = [4, 4], budget = 8            ->  [0, 1]
prices = [-3, 10, 7, 1], budget = 4    ->  [0, 2]    # refunds can make prices negative
```

### Constraints

- `2 <= len(prices) <= 40 000`
- `-10^7 <= prices[k], budget <= 2·10^7`
- Hidden tests include inputs with 40 000 items: an `O(n²)` scan will run out of time.

## Starter

```python
def gift_card_pair(prices: list[int], budget: int) -> list[int]:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": [[12, 5, 30, 8], 20], "expected": [0, 3] },
  { "args": [[4, 4], 8], "expected": [0, 1] },
  { "args": [[-3, 10, 7, 1], 4], "expected": [0, 2] }
]
```

## Hidden Tests

```json
[
  { "args": [[5, 1, 5], 10], "expected": [0, 2] },
  { "args": [[0, 2, -2, 9], 0], "expected": [1, 2] },
  { "args": [[1, 2, 3, 4, 5, 6], 11], "expected": [4, 5] },
  { "args": [[7, 3], 10], "expected": [0, 1] }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(2024)
    # All other prices are even and distinct; only one odd price exists, so the
    # pair is unique. The pair sits at the very end to punish an O(n^2) scan.
    for n, pair_at_end in ((40_000, True), (10_000, False)):
        evens = rng.sample(range(0, 10_000_000, 2), n - 1)
        partner = evens.pop(rng.randrange(len(evens)))
        odd = 1_000_001
        if pair_at_end:
            prices = evens + [partner, odd]
        else:
            prices = evens[:]
            prices.insert(rng.randrange(len(prices) + 1), partner)
            prices.insert(rng.randrange(len(prices) + 1), odd)
        yield [prices, partner + odd]
```

## Hints

### Hint 1

For each price `p` you need to know whether `budget - p` appeared **earlier** in the list.

### Hint 2

A dictionary `price -> index` answers "have I seen this value, and where?" in `O(1)`.

### Hint 3

Check for the complement **before** storing the current price, so an item never pairs with itself.

## Solution

```python
def gift_card_pair(prices: list[int], budget: int) -> list[int]:
    seen = {}  # price -> index of its first occurrence
    for j, price in enumerate(prices):
        need = budget - price
        if need in seen:
            return [seen[need], j]
        if price not in seen:
            seen[price] = j
    return []  # unreachable: a pair is guaranteed
```

## Explanation

**Brute force** tries every pair `(i, j)`: `O(n²)` time. With 40 000 items that is ~800 million
comparisons, too slow.

**One pass with a hash map:**

1. Walk the list once. At position `j`, the only partner that works is `need = budget - price`.
2. If `need` was stored earlier, we found the pair: `[seen[need], j]`. Because the stored index
   is earlier, `i < j` holds automatically.
3. Otherwise store `price -> j`. We keep the *first* index of each price, which is what makes
   `[5, 1, 5]` with budget `10` return `[0, 2]`.

Each element is looked up and inserted once, so time is `O(n)`; the dictionary uses `O(n)` space.

This "remember what you've seen in a hash map" idea is the core of the *Arrays & Hashing*
pattern: trade memory for speed.

## Wrong Answers

```python
def gift_card_pair(prices, budget):
    for i in range(len(prices)):
        for j in range(i + 1, len(prices)):
            if prices[i] + prices[j] == budget:
                return [i, j]
```

```python
def gift_card_pair(prices, budget):
    seen = {}
    for j, price in enumerate(prices):
        seen[price] = j  # stored before checking: an item can pair with itself
        if budget - price in seen:
            return [seen[budget - price], j]
```
