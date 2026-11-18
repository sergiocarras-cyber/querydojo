---
id: crit-006
slug: fraud-rule-recall
title: "How Much Fraud Does the Rule Catch?"
section: judgment
difficulty: Medium
topics: [Metrics, Precision and recall, Fraud]
company: Pennywise Pay
answer_type: numeric
answer: 0.6
tolerance: 0.001
---

## Statement

**Pennywise Pay** has a fraud rule that flags **0.4 %** of all transactions. When investigators review
the flagged ones, **75 %** turn out to be real fraud (precision). Overall, **0.5 %** of all
transactions are fraudulent.

What share of all fraudulent transactions does the rule catch (its **recall**)? Answer as a decimal,
for example `0.25`.

## Hints

### Hint 1

Work per 100 000 transactions: how many are flagged, how many of those are fraud, how many frauds
exist in total?

### Hint 2

Recall = frauds caught / all frauds.

## Explanation

Per 100 000 transactions:

- Flagged: 0.4 % → **400**.
- Real fraud among the flagged: 75 % of 400 → **300** caught.
- All frauds: 0.5 % → **500**.

**Recall = 300 / 500 = 0.6**: the rule catches 60 % of fraud, and 40 % gets through.

In product terms, precision tells investigators how much of their time is well spent; recall tells
the business how much fraud still costs money. A rule with 75 % precision sounds excellent, yet it
misses 2 out of 5 frauds. Always ask for both numbers, and for the base rate.

## Verification

```python
def answer():
    n = 100_000
    flagged = 0.004 * n
    caught = 0.75 * flagged
    frauds = 0.005 * n
    return caught / frauds
```
