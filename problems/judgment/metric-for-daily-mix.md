---
id: crit-002
slug: metric-for-daily-mix
title: "A Metric for the Daily Mix"
section: judgment
difficulty: Medium
topics: [Metrics, Product sense, Guardrail metrics]
company: Tunely
answer_type: choice
answer: 2
---

## Statement

**Tunely** launches **Daily Mix**, a personalised playlist on the home screen. The goal is to help
people discover music they enjoy so they keep using Tunely.

Which **primary metric** (with a guardrail) best measures whether Daily Mix works?

## Options

- Number of taps on the Daily Mix card per day.
- Number of songs started from Daily Mix.
- Minutes listened from Daily Mix per weekly active user, with overall listening time and 4-week retention as guardrails.
- Share of users who saw the Daily Mix card.

## Hints

### Hint 1

Taps and starts can go up even if people hate what they hear.

### Hint 2

A good metric reflects the value for the user and can't be improved by just moving attention around.

## Explanation

The goal is **enjoyable listening that keeps people coming back**. Option C measures sustained
listening from the feature, normalised per active user so it doesn't just grow with the user base.
The guardrails catch the two classic failure modes:

- **Cannibalisation:** Daily Mix minutes go up because people stop listening elsewhere, so total
  listening is flat. That's why overall listening time is a guardrail.
- **Short-term gain, long-term loss:** retention shows whether the recommendations make people stay.

The other options are **vanity metrics**. Taps (A) and song starts (B) rise with a bigger card or
clickbait covers even if users skip after 5 seconds. Exposure (D) measures the launch, not the value.
