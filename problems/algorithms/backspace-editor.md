---
id: algo-016
slug: backspace-editor
title: "Backspace Editor"
section: algorithms
difficulty: Easy
topics: [Stack, Strings]
company: Shelfie Books
function: same_after_edits
comparator: exact
complexity: { time: "O(n + m)", space: "O(n + m)" }
---

## Statement

**Shelfie Books**' review editor records keystrokes as a string where `#` means **backspace**
(it deletes the previous character, if there is one).

Given two keystroke logs `a` and `b`, return `True` if they produce the **same final text**.

```python
def same_after_edits(a: str, b: str) -> bool:
```

### Examples

```
"ab#c", "ad#c"  -> True    # both "ac"
"a##b", "#b"    -> True    # both "b"
"abc#", "ab#c"  -> False   # "ab" vs "ac"
```

## Starter

```python
def same_after_edits(a: str, b: str) -> bool:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      "ab#c",
      "ad#c"
    ],
    "expected": true
  },
  {
    "args": [
      "a##b",
      "#b"
    ],
    "expected": true
  },
  {
    "args": [
      "abc#",
      "ab#c"
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
      "####",
      ""
    ],
    "expected": true
  },
  {
    "args": [
      "a#b#",
      "c#"
    ],
    "expected": true
  },
  {
    "args": [
      "xy#z",
      "xz"
    ],
    "expected": true
  },
  {
    "args": [
      "x#",
      "y"
    ],
    "expected": false
  },
  {
    "args": [
      "ab##c",
      "c"
    ],
    "expected": true
  }
]
```

## Generator

```python
import random

def cases():
    rng = random.Random(16)
    s = "".join(rng.choice("ab#") for _ in range(200_000))
    yield [s, s + "c#"]
```

## Hints

### Hint 1

Simulate the editor: a stack (Python list) is the text typed so far.

### Hint 2

On `#`, pop the last character if the stack is not empty; otherwise push the character.

## Solution

```python
def same_after_edits(a: str, b: str) -> bool:
    def build(keys: str) -> list[str]:
        text = []
        for ch in keys:
            if ch == "#":
                if text:
                    text.pop()
            else:
                text.append(ch)
        return text

    return build(a) == build(b)
```

## Explanation

Backspace removes the **most recent** character, so the text behaves like a **stack**:

- normal key → `append`;
- `#` → `pop` if there is something to delete (a backspace on empty text does nothing).

Build both final texts and compare: `O(n + m)` time and space.

Follow-up often asked: do it in `O(1)` extra space by walking both strings **backwards** and
counting pending backspaces.

## Wrong Answers

### Removing the # without applying it

Deleting the `#` characters ignores what they do. Each `#` erases the previous character: simulate it with a stack.

```python
def same_after_edits(a, b):
    return a.replace("#", "") == b.replace("#", "")
```

### Each # erases two characters

`text[:-2]` removes two characters per backspace. One `#` erases exactly one (and does nothing on empty text).

```python
def same_after_edits(a, b):
    def build(keys):
        text = []
        for ch in keys:
            if ch == "#":
                text = text[:-2]
            else:
                text.append(ch)
        return text
    return build(a) == build(b)
```
