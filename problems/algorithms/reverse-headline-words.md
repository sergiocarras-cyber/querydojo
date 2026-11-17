---
id: algo-014
slug: reverse-headline-words
title: "Reverse Headline Words"
section: algorithms
difficulty: Easy
topics: [Two pointers, Strings]
company: Chirpnest
function: reverse_words
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

For a teaser animation, **Chirpnest** shows headlines **word by word in reverse order**.

Given `headline`, return its words in reverse order, separated by **single spaces**, with no leading
or trailing spaces. Words are maximal runs of non-space characters (the input may contain several
spaces between words).

```python
def reverse_words(headline: str) -> str:
```

### Examples

```
"Big sale today"       -> "today sale Big"
"  hello   world  "    -> "world hello"
"single"               -> "single"
```

## Starter

```python
def reverse_words(headline: str) -> str:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      "Big sale today"
    ],
    "expected": "today sale Big"
  },
  {
    "args": [
      "  hello   world  "
    ],
    "expected": "world hello"
  },
  {
    "args": [
      "single"
    ],
    "expected": "single"
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      "   "
    ],
    "expected": ""
  },
  {
    "args": [
      ""
    ],
    "expected": ""
  },
  {
    "args": [
      "a  b c"
    ],
    "expected": "c b a"
  },
  {
    "args": [
      "Don't   stop!"
    ],
    "expected": "stop! Don't"
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(14)
    words = ["w" + str(rng.randint(0, 999)) for _ in range(50_000)]
    yield ["   ".join(words) + "  "]
```

## Hints

### Hint 1

`str.split()` with **no argument** splits on runs of whitespace and drops empty strings.

### Hint 2

`' '.join(reversed(words))` builds the answer.

## Solution

```python
def reverse_words(headline: str) -> str:
    return " ".join(reversed(headline.split()))
```

## Explanation

- `headline.split()` (no argument) splits on any run of whitespace and ignores leading/trailing
  spaces, so `"  hello   world  "` → `["hello", "world"]`.
- `reversed` + `" ".join` rebuilds the sentence with single spaces.

`split(" ")` (with an explicit space) keeps empty strings between consecutive spaces, producing
double spaces in the output. Reversing the whole string (`headline[::-1]`) reverses the letters
too.

If the interviewer forbids `split`, scan with two pointers to extract words from the end.

## Wrong Answers

```python
def reverse_words(headline):
    return " ".join(reversed(headline.split(" ")))
```

```python
def reverse_words(headline):
    return headline.strip()[::-1]
```
