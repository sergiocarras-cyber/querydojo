---
id: algo-002
slug: clean-palindrome-code
title: Palindromic Promo Code
section: algorithms
difficulty: Easy
topics: [Two pointers, Strings]
company: Basketly
function: is_clean_palindrome
comparator: exact
complexity: { time: "O(n)", space: "O(1)" }
---

## Statement

**Basketly** runs a contest: a promo code wins if it reads the same forwards and backwards once
you **ignore everything that is not a letter or a digit** and **ignore letter case**.

Return `True` if `code` is a winning code and `False` otherwise. An empty code (or one with no
letters or digits) counts as a palindrome.

```python
def is_clean_palindrome(code: str) -> bool:
```

### Examples

```
"Taco-Cat!"     -> True     # "tacocat"
"Promo 2 - 2 omorp" -> True # "promo22omorp"
"abca"          -> False
".,!"           -> True     # nothing left to compare
```

### Constraints

- `0 <= len(code) <= 200 000`
- Characters are printable ASCII.
- Try to solve it with `O(1)` extra space.

## Starter

```python
def is_clean_palindrome(code: str) -> bool:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": ["Taco-Cat!"], "expected": true },
  { "args": ["Promo 2 - 2 omorp"], "expected": true },
  { "args": ["abca"], "expected": false },
  { "args": [".,!"], "expected": true }
]
```

## Hidden Tests

```json
[
  { "args": [""], "expected": true },
  { "args": ["0P"], "expected": false },
  { "args": ["Ab1 1bA"], "expected": true },
  { "args": ["a.b,a"], "expected": true },
  { "args": ["ab2a"], "expected": false },
  { "args": ["x"], "expected": true }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(11)
    alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
    half = "".join(rng.choice(alphabet) for _ in range(100_000))
    word = half + half[::-1]
    yield [word.upper()]
    noisy = "".join(c + rng.choice(" -_.!") for c in word)
    yield [noisy]
    broken = word[:50_000] + ("z" if word[50_000] != "z" else "y") + word[50_001:]
    yield [broken]
```

## Hints

### Hint 1

Put one pointer at the start and one at the end, and move them towards each other.

### Hint 2

Skip characters for which `str.isalnum()` is `False`, then compare with `.lower()`.

## Solution

```python
def is_clean_palindrome(code: str) -> bool:
    left, right = 0, len(code) - 1
    while left < right:
        if not code[left].isalnum():
            left += 1
        elif not code[right].isalnum():
            right -= 1
        elif code[left].lower() != code[right].lower():
            return False
        else:
            left += 1
            right -= 1
    return True
```

## Explanation

**Two pointers** walk inwards from both ends:

1. If the left character is not alphanumeric, skip it; same for the right one.
2. When both point at letters or digits, compare them case-insensitively. A mismatch means it is
   not a palindrome.
3. If the pointers meet without a mismatch, it is a palindrome.

Every character is visited at most once: `O(n)` time and `O(1)` extra space.

A one-liner also works, `s = [c.lower() for c in code if c.isalnum()]; return s == s[::-1]`,
but it builds a filtered copy (`O(n)` extra memory). In an interview, mention both and explain
the trade-off.

**Trap:** `isalpha()` drops digits, so `"0P"` would wrongly become a palindrome.

## Wrong Answers

### Digits dropped

`isalpha()` throws away digits, but they are part of the code. Keep alphanumeric characters (`isalnum()`).

```python
def is_clean_palindrome(code):
    s = [c.lower() for c in code if c.isalpha()]
    return s == s[::-1]
```

### Case-sensitive comparison

`'A'` and `'a'` must match. Lower-case the characters before comparing.

```python
def is_clean_palindrome(code):
    s = [c for c in code if c.isalnum()]
    return s == s[::-1]
```
