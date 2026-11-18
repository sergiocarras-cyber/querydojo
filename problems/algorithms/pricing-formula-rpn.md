---
id: algo-028
slug: pricing-formula-rpn
title: "Pricing Formula Calculator"
section: algorithms
difficulty: Medium
topics: [Stack, Parsing]
company: Loomly Home
function: eval_formula
comparator: exact
complexity: { time: "O(n)", space: "O(n)" }
---

## Statement

**Loomly Home** stores pricing formulas in **Reverse Polish Notation**: operands come first and each
operator applies to the two most recent values. For example `["3", "4", "+", "2", "*"]` is
`(3 + 4) * 2`.

Evaluate `tokens`. Operators are `+`, `-`, `*`, `/`. Division between integers **truncates toward
zero** (`-7 / 2 = -3`). The formula is always valid and never divides by zero.

```python
def eval_formula(tokens: list[str]) -> int:
```

### Examples

```
["3", "4", "+", "2", "*"]                         -> 14
["8", "2", "5", "*", "+", "1", "3", "2", "*", "+", "/"] -> 2    # (8 + 10) / (1 + 6)
["-7", "2", "/"]                                  -> -3
```

## Starter

```python
def eval_formula(tokens: list[str]) -> int:
    # Your code here
    pass
```

## Tests

```json
[
  {
    "args": [
      [
        "3",
        "4",
        "+",
        "2",
        "*"
      ]
    ],
    "expected": 14
  },
  {
    "args": [
      [
        "8",
        "2",
        "5",
        "*",
        "+",
        "1",
        "3",
        "2",
        "*",
        "+",
        "/"
      ]
    ],
    "expected": 2
  },
  {
    "args": [
      [
        "-7",
        "2",
        "/"
      ]
    ],
    "expected": -3
  }
]
```

## Hidden Tests

```json
[
  {
    "args": [
      [
        "42"
      ]
    ],
    "expected": 42
  },
  {
    "args": [
      [
        "10",
        "3",
        "-"
      ]
    ],
    "expected": 7
  },
  {
    "args": [
      [
        "7",
        "-2",
        "/"
      ]
    ],
    "expected": -3
  },
  {
    "args": [
      [
        "2",
        "9",
        "/"
      ]
    ],
    "expected": 0
  },
  {
    "args": [
      [
        "5",
        "1",
        "2",
        "+",
        "4",
        "*",
        "+",
        "3",
        "-"
      ]
    ],
    "expected": 14
  }
]
```

## Generator

```python
def cases():
    tokens = ["1"]
    for i in range(50_000):
        tokens += [str(i % 7 + 1), "+" if i % 2 else "-"]
    yield [tokens]
```

## Hints

### Hint 1

Push numbers on a stack. On an operator, pop the **right** operand first, then the left one.

### Hint 2

Python's `//` floors (`-7 // 2 == -4`). Use `int(a / b)` to truncate toward zero.

## Solution

```python
def eval_formula(tokens: list[str]) -> int:
    stack = []
    for tok in tokens:
        if tok in ("+", "-", "*", "/"):
            right = stack.pop()
            left = stack.pop()
            if tok == "+":
                stack.append(left + right)
            elif tok == "-":
                stack.append(left - right)
            elif tok == "*":
                stack.append(left * right)
            else:
                stack.append(int(left / right))  # truncate toward zero
        else:
            stack.append(int(tok))
    return stack[0]
```

## Explanation

RPN is designed for a **stack**:

- number → push;
- operator → pop the right operand, then the left one, compute, push the result.

At the end the stack holds the result. Two classic bugs:

1. **Operand order:** the first pop is the *right* operand; `10 3 -` is `10 − 3`, not `3 − 10`.
2. **Division semantics:** Python's `//` floors toward −∞. The statement asks for truncation toward
   zero, which `int(left / right)` gives (fine for these magnitudes; for huge integers use
   `-(-a // b)` style logic).

`O(n)` time and space.

## Wrong Answers

### Floor division with negatives

`//` rounds toward minus infinity: `-7 // 2 == -4`. The formula truncates toward zero: `int(a / b)` gives -3.

```python
def eval_formula(tokens):
    stack = []
    for t in tokens:
        if t in "+-*/" and len(t) == 1:
            b, a = stack.pop(), stack.pop()
            stack.append({"+": a + b, "-": a - b, "*": a * b, "/": a // b}[t] if t != "/" else a // b)
        else:
            stack.append(int(t))
    return stack[0]
```

### Operands popped in the wrong order

The first pop is the right operand. `a, b = pop(), pop()` swaps them, so `-` and `/` give the wrong result.

```python
def eval_formula(tokens):
    stack = []
    for t in tokens:
        if t in ("+", "-", "*", "/"):
            a, b = stack.pop(), stack.pop()
            stack.append(a + b if t == "+" else a - b if t == "-" else a * b if t == "*" else int(a / b))
        else:
            stack.append(int(t))
    return stack[0]
```
