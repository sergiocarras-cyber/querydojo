---
id: algo-041
slug: fix-ai-pages-by-user
title: "Fix the AI: Pages by User"
section: algorithms
difficulty: Easy
topics: [AI code review, Mutable default argument, Hash map]
company: Chirpnest
ai_review: true
function: pages_by_user
comparator: exact
complexity: { time: "O(n · p)", space: "O(n)" }
---

## Statement

**Chirpnest** logs page views as `[user, page]` pairs in time order. For each user it needs the
**distinct pages they visited, in order of first visit**.

An AI assistant wrote the function in the editor. The developer tried it once and it worked, so it
was shipped. In production, users start showing pages they never visited.

**Find the bug and fix the function.**

```python
def pages_by_user(events: list[list[str]]) -> dict[str, list[str]]:
```

### Example

```
[["ana", "home"], ["bo", "search"], ["ana", "cart"], ["ana", "home"]]
  ->  {"ana": ["home", "cart"], "bo": ["search"]}
```

An empty list of events returns `{}`.

## Starter

```python
# Written by an AI assistant. Worked when we tried it once...
def pages_by_user(events, result={}):
    for user, page in events:
        pages = result.setdefault(user, [])
        if page not in pages:
            pages.append(page)
    return result
```

## Tests

```json
[
  { "args": [[["ana", "home"], ["bo", "search"], ["ana", "cart"], ["ana", "home"]]], "expected": { "ana": ["home", "cart"], "bo": ["search"] } },
  { "args": [[["cy", "b"], ["cy", "a"], ["cy", "b"]]], "expected": { "cy": ["b", "a"] } },
  { "args": [[]], "expected": {} }
]
```

## Hidden Tests

```json
[
  { "args": [[["ana", "home"]]], "expected": { "ana": ["home"] } },
  { "args": [[["x", "p1"], ["y", "p1"], ["x", "p2"], ["y", "p0"], ["x", "p1"]]], "expected": { "x": ["p1", "p2"], "y": ["p1", "p0"] } },
  { "args": [[]], "expected": {} }
]
```

## Hints

### Hint 1

The function works the first time it's called. What happens on the **second** call?

### Hint 2

In Python, default argument values are created **once**, when the function is defined, not on every
call. A `{}` default is shared by all calls.

### Hint 3

Use `result=None` and create a new dict inside the function (or don't take the parameter at all).

## Solution

```python
def pages_by_user(events: list[list[str]]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for user, page in events:
        pages = result.setdefault(user, [])
        if page not in pages:
            pages.append(page)
    return result
```

## Explanation

The logic of the AI's function is fine; the signature isn't. `def f(events, result={})` creates **one**
dict when Python defines the function, and every call that doesn't pass `result` reuses it. The first
call returns correct data; the second call starts with the first call's users already inside.

That's why "I tried it once and it worked" is not a test. The tests here call the function several
times in the same process, like a real service does.

The fix is to create the dict inside the function. If a caller really needs to pass one, use
`result=None` and `if result is None: result = {}`.

## Wrong Answers

### The AI's original function

Your function behaves like the AI's: the first test passes and the later ones fail. What is different
between the first call and the second?

```python
def pages_by_user(events, result={}):
    for user, page in events:
        pages = result.setdefault(user, [])
        if page not in pages:
            pages.append(page)
    return result
```

### Sorted instead of first-visit order

The pages must keep the order of first visit, not alphabetical order. Append pages as they appear and
skip the ones already seen.

```python
def pages_by_user(events):
    seen = {}
    for user, page in events:
        seen.setdefault(user, set()).add(page)
    return {user: sorted(pages) for user, pages in seen.items()}
```

### Repeated pages kept

Each page should appear once per user. Check whether the page is already in the user's list before
appending.

```python
def pages_by_user(events):
    result = {}
    for user, page in events:
        result.setdefault(user, []).append(page)
    return result
```
