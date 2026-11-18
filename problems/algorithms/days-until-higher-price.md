---
id: algo-027
slug: days-until-higher-price
title: "Days Until a Higher Price"
section: algorithms
difficulty: Medium
topics: [Stack, Monotonic stack]
company: Cartwell Marketplace
function: days_until_higher
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

A **Cartwell** price tracker tells shoppers how long to wait. For each day `i`, return how many
days until a **strictly higher** price appears, or `0` if it never does.

```python
def days_until_higher(prices: list[int]) -> list[int]:
```

### Example

```
[70, 72, 71, 69, 73, 72]  ->  [1, 3, 2, 1, 0, 0]
```

### Constraints

- `1 <= len(prices) <= 100 000`

## Starter

```python
def days_until_higher(prices: list[int]) -> list[int]:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        70,
        72,
        71,
        69,
        73,
        72
      ]
    ],
    "expected": [
      1,
      3,
      2,
      1,
      0,
      0
    ]
  },
  {
    "args": [
      [
        5
      ]
    ],
    "expected": [
      0
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
        3,
        3,
        4
      ]
    ],
    "expected": [
      2,
      1,
      0
    ]
  },
  {
    "args": [
      [
        9,
        8,
        7
      ]
    ],
    "expected": [
      0,
      0,
      0
    ]
  },
  {
    "args": [
      [
        1,
        2,
        3
      ]
    ],
    "expected": [
      1,
      1,
      0
    ]
  }
]
```

## Generator

```python
def cases():
    yield [list(range(100_000, 0, -1)) + [10**6]]
```

## Hints

### Hint 1

Keep a stack of days still **waiting** for a higher price; their prices are decreasing from bottom to top.

### Hint 2

When today's price is higher than the price at the top of the stack, that day's wait is over: pop it and record `today - day`.

## Solution

```python
def days_until_higher(prices: list[int]) -> list[int]:
    answer = [0] * len(prices)
    waiting = []  # indices with no higher price yet; their prices are non-increasing
    for today, price in enumerate(prices):
        while waiting and prices[waiting[-1]] < price:
            day = waiting.pop()
            answer[day] = today - day
        waiting.append(today)
    return answer
```

## Explanation

**Monotonic stack.** The stack holds days that haven't found a higher price yet; their prices never
increase going up the stack (otherwise the lower one would have been resolved).

For each new day, pop every waiting day with a strictly lower price: today is their answer. Then
push today. Days left on the stack at the end keep `0`.

Each day is pushed and popped at most once: `O(n)`. The brute force scans forward from every day:
`O(n²)` on a falling market (5 billion steps for 100 000 days). Equal prices must stay on the stack
(`<`, not `<=`).

## Wrong Answers

### Scanning ahead from every day

Looking ahead from each day is O(n²) on falling prices: correct, but too slow for the large hidden inputs. Keep a stack of days still waiting for a higher price.

```python
def days_until_higher(prices):
    out = []
    for i, p in enumerate(prices):
        j = i + 1
        while j < len(prices) and prices[j] <= p:
            j += 1
        out.append(j - i if j < len(prices) else 0)
    return out
```

### An equal price is not higher

`<=` pops days when the price is merely equal. Only a strictly higher price (`<`) answers a waiting day.

```python
def days_until_higher(prices):
    answer, waiting = [0] * len(prices), []
    for today, price in enumerate(prices):
        while waiting and prices[waiting[-1]] <= price:
            day = waiting.pop()
            answer[day] = today - day
        waiting.append(today)
    return answer
```
