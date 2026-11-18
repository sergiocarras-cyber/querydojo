---
id: crit-008
slug: country-at-time-of-purchase
title: "Country at the Time of Purchase"
section: judgment
difficulty: Hard
topics: [Data modeling, Slowly changing dimensions, SCD type 2]
company: Nestaway Stays
answer_type: choice
answer: 1
---

## Statement

**Nestaway Stays** keeps a `customers` table with one row per customer and their **current** country of
residence. When a customer moves, the row is updated in place. Finance needs **bookings revenue by the
customer's country at the time of booking**, also for past years.

What's the best modelling change?

## Options

- Keep updating in place, and add an `updated_at` column to know when the country changed.
- Keep a history of customer versions with `valid_from` / `valid_to` (SCD type 2) and join each booking to the version valid on its booking date, or store the country on the booking row when it's created.
- Recompute past reports every time a customer moves so they use the new country.
- Ask finance to accept the current country, because people rarely move.

## Hints

### Hint 1

If a customer moved from Spain to France last month, where does their 2023 booking count after an
in-place update?

### Hint 2

You need to know what was true **then**, not only what is true **now**.

## Explanation

An in-place update (SCD type 1) **overwrites history**: the 2023 booking of someone who moved to
France last month suddenly counts as French revenue, and last year's reports change after they were
published.

Two standard fixes:

- **SCD type 2:** each change adds a new version row with `valid_from` / `valid_to` (and often a
  surrogate key). Facts join to the version that was valid at the event date.
- **Snapshot the attribute on the fact:** store `country` on the booking when it's created. Simple, and
  enough when you only need that attribute at event time.

`updated_at` (A) only tells you *when* the last change happened, not what the value was before.
Recomputing (C) is exactly what finance doesn't want: published numbers must not move. D ignores a
stated requirement.
