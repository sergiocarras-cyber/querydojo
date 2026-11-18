---
id: crit-012
slug: late-arriving-events
title: "Late-Arriving Events"
section: judgment
difficulty: Hard
topics: [Data engineering, Late-arriving data, Incremental loads]
company: Fernplay Games
answer_type: choice
answer: 2
---

## Statement

**Fernplay Games** collects gameplay events from phones. Phones that are offline upload their events
when they reconnect, so about **8 % of events arrive 1 to 3 days late**. A nightly job computes
`daily_active_players` for **yesterday only** and never touches older days.

Analysts notice that every day's active players **creep up** for a few days after it is published.
What's the best design?

## Options

- Ignore late events: discard anything that arrives more than a day late.
- Compute each day 4 days later, so the number is final when published.
- Each night, recompute a trailing window (for example, the last 4 days) by event time, and mark days newer than 3 days as provisional.
- Count events by upload time instead of event time, so days never change.

## Hints

### Hint 1

Which date should a late event count for: when it happened, or when it arrived?

### Hint 2

You want fresh numbers every morning **and** correct numbers once the late data is in.

## Explanation

Late data is normal in mobile and IoT pipelines. The fix is to **re-process a trailing window**: each
night, recompute the last few days (at least as long as the lateness you accept) by **event time**,
replacing the old values idempotently. The dashboard flags the most recent days as provisional.

- **A** throws away 8 % of real activity and biases the metric low (especially for offline-heavy
  regions).
- **B** gives correct numbers, but four days late; most teams need yesterday's number this morning.
- **D** makes numbers stable but **wrong**: activity from Saturday counted on Monday distorts day-of-week
  patterns and any comparison with events.

The general principle is **event time vs processing time**, and a defined **lateness window** after
which a day is considered final.
