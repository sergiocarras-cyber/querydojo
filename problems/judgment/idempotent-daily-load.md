---
id: crit-011
slug: idempotent-daily-load
title: "The Job Ran Twice"
section: judgment
difficulty: Medium
topics: [Data engineering, Idempotency, Incremental loads]
company: Moviq Rides
answer_type: choice
answer: 3
---

## Statement

**Moviq Rides** has a nightly job that reads yesterday's trips from the app database and
**appends** them (`INSERT INTO trips_daily SELECT …`) to the warehouse. Last night the job failed half
way, the scheduler retried it automatically, and yesterday's revenue now appears **1.5 times**.

How should the job be redesigned?

## Options

- Disable automatic retries and have an engineer rerun it by hand after checking.
- Run a deduplication query on the whole table once a week.
- Add `SELECT DISTINCT` to the insert query.
- Make the load idempotent: delete-and-insert yesterday's partition in one transaction (or `MERGE` on the trip id), so running it twice gives the same result.

## Hints

### Hint 1

Failures and retries will happen. What property should the job have so a rerun is harmless?

## Explanation

The job isn't **idempotent**: running it twice changes the result. In data pipelines, retries, backfills
and manual reruns are normal, so every load should produce the same final state no matter how many
times it runs for the same date.

Standard patterns:

- **Overwrite the partition:** in one transaction, `DELETE` the rows for that date and `INSERT` them
  again (or replace the date partition).
- **Upsert:** `MERGE` / `INSERT … ON CONFLICT` on the natural key (`trip_id`).

Disabling retries (A) slows recovery and still relies on humans. A weekly clean-up (B) leaves wrong
numbers for up to a week. `DISTINCT` inside the query (C) only removes duplicates within one run, not
rows already loaded by the previous attempt.
