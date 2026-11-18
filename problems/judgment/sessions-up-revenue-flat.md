---
id: crit-001
slug: sessions-up-revenue-flat
title: "Sessions Up, Revenue Flat"
section: judgment
difficulty: Easy
topics: [Metrics, Data quality, Root cause analysis]
company: Cartwell Marketplace
answer_type: choice
answer: 1
---

## Statement

On Monday, **Cartwell**'s dashboard shows **sessions up 20 %** week over week. Orders, revenue and
signups are flat. The product manager wants to announce that the new homepage is a success.

What should you check **first**?

## Options

- Whether the conversion rate dropped, and A/B test the homepage to recover it.
- Whether the extra sessions are real: a tracking change, a new session definition, bots or a single traffic source.
- Whether revenue will catch up next week, because purchases lag behind visits.
- Whether the increase is statistically significant with a two-proportion z-test.

## Hints

### Hint 1

A metric that jumps while every related metric stays still is suspicious.

### Hint 2

Before explaining a change, make sure the change is real.

## Explanation

When one metric moves and all the metrics that should move with it don't, the most likely cause is
**the measurement**, not user behaviour. Typical culprits:

- A new tracking library, or a tag firing twice.
- A changed definition of "session" (for example, a shorter timeout).
- Bot or crawler traffic, often from a single source, country or user agent.

So the first step is to **segment the increase** (by source, device, country, user agent, new vs
returning) and check recent releases of the tracking code.

The other options all assume the 20 % is real. Testing significance (D) doesn't help: a tracking bug is
perfectly "significant". Waiting (C) or redesigning (A) wastes time if the metric is broken.

In an interview, saying "first I'd validate the data" before building a story is exactly what's
being evaluated.
