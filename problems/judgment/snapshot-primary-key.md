---
id: crit-009
slug: snapshot-primary-key
title: "Primary Key of a Daily Snapshot"
section: judgment
difficulty: Easy
topics: [Data modeling, Primary keys, Snapshots]
company: Habitly
answer_type: choice
answer: 0
---

## Statement

**Habitly** builds a table `subscription_daily` with **one row per subscription per day**, recording
its plan, status and price on that day. It's rebuilt every night for the previous day.

Which **primary key** should the table have?

## Options

- `(subscription_id, snapshot_date)`
- `subscription_id`
- `(user_id, plan)`
- An auto-increment `id` column only, with no other uniqueness constraint.

## Hints

### Hint 1

The primary key should match the grain: "one row per … per …".

## Explanation

The grain is **one row per subscription per day**, so the natural key is
**`(subscription_id, snapshot_date)`**. Declaring it (or at least testing it as unique) catches the most
common bug in snapshot tables: the nightly job running twice and duplicating a day.

- `subscription_id` alone allows only one day per subscription.
- `(user_id, plan)` breaks when a user has two subscriptions of the same plan, and says nothing about
  the date.
- A surrogate `id` alone makes every row unique by construction, so duplicated days go unnoticed.
  You can add one, but keep a unique constraint on the natural key.
