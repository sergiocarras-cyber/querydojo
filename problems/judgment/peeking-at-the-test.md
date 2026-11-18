---
id: crit-003
slug: peeking-at-the-test
title: "Peeking at the A/B Test"
section: judgment
difficulty: Medium
topics: [A/B testing, Peeking, Type I and II errors]
company: Basketly
answer_type: choice
answer: 0
---

## Statement

**Basketly** planned a two-week A/B test of a new checkout button (α = 0.05). The analyst checked the
p-value every morning and **stopped the test on day 3**, the first day p dropped below 0.05, declaring
the new button the winner.

What is the main problem?

## Options

- Checking repeatedly and stopping at the first p < 0.05 makes a false positive much more likely than 5 %.
- Three days is not enough data, so the p-value is not valid at all.
- The p-value should have been compared with 0.01 because it's a checkout change.
- There's no problem: if p < 0.05 the result is significant whenever you look.

## Hints

### Hint 1

Even with no real effect, the p-value wanders up and down over time.

### Hint 2

If you give yourself many chances to cross 0.05 and stop at the first one, how often do you cross it by
luck?

## Explanation

This is **peeking** (optional stopping). Under the null hypothesis the p-value drifts randomly while
data accumulates. With a daily check over 14 days and "stop at the first p < 0.05", the chance of
declaring a winner when there is **no effect** can be several times the nominal 5 %.

How to fix it:

- Decide the sample size (or duration) in advance with a power calculation, and analyse once at the end.
- If you need to look early, use a **sequential test** (or alpha spending) designed for repeated looks.
- Run full weeks anyway, because weekday and weekend behaviour differ.

Option B is wrong: a p-value from 3 days is a valid p-value, the problem is how the stopping rule was
chosen. Changing α (C) doesn't address peeking. D is precisely the misconception.
