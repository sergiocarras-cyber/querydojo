---
id: crit-005
slug: feature-users-retain-better
title: "Feature Users Retain Better"
section: judgment
difficulty: Medium
topics: [Causal inference, Selection bias, Product sense]
company: Habitly
answer_type: choice
answer: 1
---

## Statement

An analysis at **Habitly** shows that users who set up **reminders** in their first week have **twice
the 3-month retention** of users who don't. The team proposes forcing every new user through reminder
setup during onboarding to double retention.

What's the most important caveat?

## Options

- The sample may be too small; collect three more months of data first.
- Users who choose to set reminders are probably more motivated already, so the gap isn't necessarily caused by reminders. Test it with an experiment.
- Retention should be measured at 6 months, not 3.
- Reminders could annoy users; ask them in a survey whether they like reminders.

## Hints

### Hint 1

Who decides to set reminders in their first week?

### Hint 2

Correlation between a behaviour and an outcome doesn't tell you what happens if you force the behaviour.

## Explanation

This is **selection bias**: users who set up reminders are self-selected. They are likely more
motivated, or have a habit they care about more, and they would retain better even without
reminders. Part (or all) of the 2× gap comes from *who* they are, not from the feature.

Forcing everyone through setup changes the population: unmotivated users set reminders too, and they
won't suddenly behave like the motivated ones. The real effect could be much smaller, zero, or even
negative (a longer onboarding loses people).

The right step is a **randomised experiment**: show the reminder step to a random half of new users
and compare retention. More data (A) or a longer horizon (C) doesn't remove the bias. A survey (D)
measures opinion, not retention.
