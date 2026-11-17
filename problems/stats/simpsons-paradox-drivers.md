---
id: stats-016
slug: simpsons-paradox-drivers
title: "The Better Driver?"
section: stats
difficulty: Medium
topics: [Simpson's paradox, Confounding]
company: Moviq Rides
answer_type: choice
answer: 3
---

## Statement

**Moviq Rides** compares the on-time rate of two drivers:

| | Downtown | Suburbs | Overall |
| --- | --- | --- | --- |
| Driver A | 60 / 100 (60 %) | 18 / 20 (90 %) | 78 / 120 (65 %) |
| Driver B | 14 / 20 (70 %) | 95 / 100 (95 %) | 109 / 120 (91 %) |

Which statement is best supported by the data?

## Options

- Driver A is more punctual, because A wins in each area.
- Driver B is more punctual in both areas, so the overall numbers must be wrong.
- The data is contradictory, so nothing can be concluded.
- B is more punctual within each area too; B's overall lead is exaggerated because B mostly drives in the easier suburbs.
- Area doesn't matter; only the overall rate is meaningful.

## Hints

### Hint 1

Compare the drivers area by area before looking at the totals.

### Hint 2

Who drives mostly downtown, where being on time is harder?

## Explanation

Look within each area: B beats A downtown (70 % vs 60 %) **and** in the suburbs (95 % vs 90 %).
So B is the better driver; option D.

The overall gap (91 % vs 65 %) is much bigger than either within-area gap because of **mix**:
B drives 100 of 120 trips in the easy suburbs, while A drives 100 of 120 downtown. The area is a
**confounder**: it affects both who drives and how punctual trips are.

When the subgroup comparison even *reverses* the aggregate one, it's called **Simpson's
paradox**. Lesson: before comparing aggregates, check whether groups differ in composition, and
compare like with like (stratify or adjust).
