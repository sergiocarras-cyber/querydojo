---
id: stats-011
slug: shipping-a-dud
title: "Shipping a Dud"
section: stats
difficulty: Easy
topics: [Hypothesis testing, Type I and II errors]
company: Habitly
answer_type: choice
answer: 0
---

## Statement

**Habitly** A/B-tests a new onboarding flow. The test comes out "significant" and the team
ships it. Months later, a much larger study shows the new flow has **no effect at all**.

What kind of error did the original test make?

## Options

- Type I error (false positive)
- Type II error (false negative)
- Sampling bias
- No error: significance guarantees a real effect

## Hints

### Hint 1

Was the null hypothesis ("no effect") true or false?

### Hint 2

Did the test reject it?

## Explanation

The null hypothesis ("the new flow has no effect") was **true**, but the test **rejected** it.
Rejecting a true null is a **Type I error**, a false positive. Its probability is controlled by α
(e.g. 5 %).

A **Type II error** is the opposite: the effect is real but the test fails to detect it (a false
negative), with probability β; power = 1 − β.

Significance never *guarantees* a real effect: with α = 5 %, about 1 in 20 tests of features
that do nothing will still come out significant.
