---
id: pandas-017
slug: fix-ai-paid-per-country
title: "Fix the AI: Revenue per Country"
section: pandas
difficulty: Medium
topics: [AI code review, Fan-out, merge, groupby]
company: Fernplay Games
ai_review: true
function: paid_per_country
order_matters: true
---

## Statement

**Fernplay Games** wants, for each `country`, the number of players and the total they paid for in-game
purchases. Countries with players but no purchases must appear with `0`.

An AI assistant wrote the function in the editor. It runs, but the totals are several times larger
than what the payment provider reports.

**Find the bug and fix the function.** Return `country`, `players` and `total_paid`, sorted by
`total_paid` descending and then `country`.

```python
def paid_per_country(players: pd.DataFrame, sessions: pd.DataFrame, purchases: pd.DataFrame) -> pd.DataFrame:
```

## Starter

```python
import pandas as pd

# Written by an AI assistant. It runs, but total_paid is far too high.
def paid_per_country(players, sessions, purchases):
    df = (
        players.merge(sessions, on="player_id", how="left")
        .merge(purchases, on="player_id", how="left")
    )
    out = df.groupby("country").agg(players=("player_id", "nunique"), total_paid=("amount", "sum"))
    return out.reset_index().sort_values(["total_paid", "country"], ascending=[False, True])
```

## Data

```python
import pandas as pd

def cases():
    players = pd.DataFrame({
        "player_id": [1, 2, 3, 4],
        "country": ["ES", "ES", "MX", "JP"],
    })
    sessions = pd.DataFrame({
        "session_id": [10, 11, 12, 13, 14, 15],
        "player_id": [1, 1, 1, 2, 3, 3],
        "minutes": [30, 12, 45, 5, 60, 20],
    })
    purchases = pd.DataFrame({
        "purchase_id": [100, 101, 102],
        "player_id": [1, 1, 3],
        "amount": [4.99, 9.99, 1.99],
    })
    yield [players, sessions, purchases]
```

## Hidden Data

```python
import pandas as pd

def cases():
    # A player with purchases but no sessions; a country without purchases.
    players = pd.DataFrame({"player_id": [1, 2, 3], "country": ["BR", "BR", "CA"]})
    sessions = pd.DataFrame({"session_id": [1, 2], "player_id": [2, 2], "minutes": [10, 10]})
    purchases = pd.DataFrame({"purchase_id": [1, 2, 3], "player_id": [1, 2, 2], "amount": [5.0, 2.5, 2.5]})
    yield [players, sessions, purchases]
```

## Hints

### Hint 1

Player 1 has 3 sessions and 2 purchases. How many rows does player 1 have after both merges?

### Hint 2

Merging two child tables on the same key multiplies them: 3 sessions × 2 purchases = 6 rows, and every
purchase amount is repeated 3 times.

### Hint 3

Does the question need `sessions` at all? Sum purchases per player first, then join to players.

## Solution

```python
import pandas as pd

def paid_per_country(players: pd.DataFrame, sessions: pd.DataFrame, purchases: pd.DataFrame) -> pd.DataFrame:
    paid = purchases.groupby("player_id", as_index=False)["amount"].sum()
    df = players.merge(paid, on="player_id", how="left")
    df["amount"] = df["amount"].fillna(0.0)
    out = (
        df.groupby("country", as_index=False)
        .agg(players=("player_id", "nunique"), total_paid=("amount", "sum"))
    )
    return out.sort_values(["total_paid", "country"], ascending=[False, True]).reset_index(drop=True)
```

## Explanation

This is the **fan-out** bug in pandas. `sessions` and `purchases` are both one-to-many with `players`;
merging both on `player_id` creates every session × purchase combination for each player. Player 1 ends
up with 6 rows, so each of their purchases is summed 3 times.

`nunique` hides the problem for the `players` column, which makes the bug easy to miss in a review.

The question doesn't need sessions at all. Aggregate purchases to one row per player, then `merge` with
`how="left"` so players without purchases keep a total of 0.

## Wrong Answers

### The AI's original function

Your result is the same as the AI's. Count how many rows one player gets after merging both `sessions`
and `purchases`.

```python
import pandas as pd

def paid_per_country(players, sessions, purchases):
    df = players.merge(sessions, on="player_id", how="left").merge(purchases, on="player_id", how="left")
    out = df.groupby("country").agg(players=("player_id", "nunique"), total_paid=("amount", "sum"))
    return out.reset_index().sort_values(["total_paid", "country"], ascending=[False, True])
```

### Inner merge drops countries without purchases

The totals are right, but `merge` without `how="left"` drops players without purchases, so their
countries (or their player counts) disappear. Keep every player.

```python
import pandas as pd

def paid_per_country(players, sessions, purchases):
    df = players.merge(purchases, on="player_id")
    out = df.groupby("country").agg(players=("player_id", "nunique"), total_paid=("amount", "sum"))
    return out.reset_index().sort_values(["total_paid", "country"], ascending=[False, True])
```
