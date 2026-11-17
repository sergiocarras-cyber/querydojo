---
id: stats-010
slug: what-a-p-value-means
title: "What a p-value Means"
section: stats
difficulty: Medium
topics: [Hypothesis testing, p-values]
company: Lumora Stream
answer_type: choice
answer: 2
---

## Statement

**Lumora Stream** ran an A/B test on its autoplay preview. The analyst reports
**p = 0.03** for the difference in watch time (two-sided test, α = 0.05).

Which statement is **correct**?

## Options

- There is a 3 % probability that the null hypothesis is true.
- There is a 97 % probability that the new autoplay increases watch time.
- If autoplay truly had no effect, a difference at least this large would appear in about 3 % of experiments like this one.
- The effect of autoplay is large and important for the business.
- If we repeated the experiment, 97 % of the repetitions would be significant.

## Hints

### Hint 1

A p-value is computed *assuming* the null hypothesis is true.

### Hint 2

It is a statement about the data given H₀, not about H₀ given the data.

## Explanation

The p-value is **P(data at least this extreme | H₀ is true)**. Option C says exactly that.

Why the others are wrong:

- **A / B** flip the conditional: they talk about P(H₀ | data). Getting that requires a prior
  and Bayes' theorem; a p-value alone can't give it.
- **D** confuses significance with effect size. A tiny effect can be very significant with
  enough users; look at the estimate and its confidence interval.
- **E** is about replication probability (power), which depends on the true effect size, not
  on the observed p-value.
