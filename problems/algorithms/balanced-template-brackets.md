---
id: algo-003
slug: balanced-template-brackets
title: Balanced Template Brackets
section: algorithms
difficulty: Easy
topics: [Stack, Strings]
company: Chirpnest
function: is_balanced
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

**Chirpnest** lets users write post templates such as `Hi {name}, see [link](url)!`. Before
rendering, the server checks that all brackets are balanced.

A template is balanced when every `(`, `[` and `{` is closed by the matching `)`, `]`, `}` in the
correct order. All other characters are ignored.

Return `True` if `template` is balanced.

```python
def is_balanced(template: str) -> bool:
```

### Examples

```
"Hi {name}, see [link](url)!"  -> True
"({[]})"                        -> True
"(]"                            -> False
"([)]"                          -> False   # right brackets, wrong order
"no brackets at all"            -> True
```

### Constraints

- `0 <= len(template) <= 200 000`

## Starter

```python
def is_balanced(template: str) -> bool:
    # Your code here
    pass
```

## Tests

```json
[
  { "args": ["Hi {name}, see [link](url)!"], "expected": true },
  { "args": ["({[]})"], "expected": true },
  { "args": ["(]"], "expected": false },
  { "args": ["([)]"], "expected": false },
  { "args": ["no brackets at all"], "expected": true }
]
```

## Hidden Tests

```json
[
  { "args": [""], "expected": true },
  { "args": ["("], "expected": false },
  { "args": [")("], "expected": false },
  { "args": ["}"], "expected": false },
  { "args": ["{[()()]}[]"], "expected": true },
  { "args": ["(()"], "expected": false },
  { "args": ["a)b(c"], "expected": false }
]
```

## Generator

```python
def cases():
    yield ["(" * 100_000 + ")" * 100_000]
    yield ["{[(" * 30_000 + ")]}" * 30_000]
    yield ["([" * 50_000 + ")]" * 50_000]
```

## Hints

### Hint 1

The most recently opened bracket is the first one that must be closed: last in, first out.

### Hint 2

Push opening brackets on a stack. On a closing bracket, the top of the stack must be its pair.

### Hint 3

Don't forget the end: leftover opening brackets mean the template is not balanced.

## Solution

```python
def is_balanced(template: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in template:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack
```

## Explanation

Brackets nest, so the bracket that must close next is always the **most recent unclosed** one,
which is exactly what a **stack** gives you.

1. Opening bracket → push it.
2. Closing bracket → the stack must be non-empty and its top must be the matching opener; pop it.
3. At the end the stack must be empty (nothing left open).

Counting brackets is not enough: `"([)]"` has matching counts but the wrong order, and `")("`
has a zero balance but closes before opening.

Time `O(n)`; space `O(n)` in the worst case (`"(((((..."`).

## Wrong Answers

```python
def is_balanced(template):
    return all(template.count(o) == template.count(c) for o, c in ["()", "[]", "{}"])
```

```python
def is_balanced(template):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in template:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return True
```
