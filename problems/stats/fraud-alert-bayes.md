---
id: stats-003
slug: fraud-alert-bayes
title: "Is the Fraud Alert Real?"
section: stats
difficulty: Medium
topics: [Bayes' theorem, Conditional probability, Base rates]
company: Pennywise Pay
answer_type: numeric
answer: 0.141
tolerance: 0.002
---

## Statement

**Pennywise Pay**'s fraud model flags transactions:

- **0.5 %** of transactions are actually fraudulent;
- the model flags **98 %** of fraudulent transactions (sensitivity);
- it also flags **3 %** of legitimate transactions (false positive rate).

A transaction has just been flagged. What is the probability that it is **actually fraud**?
Give a decimal with at least 3 decimals.

## Hints

### Hint 1

You want P(fraud | flag), not P(flag | fraud). Bayes' theorem connects them.

### Hint 2

P(flag) = P(flag | fraud)·P(fraud) + P(flag | legit)·P(legit).

### Hint 3

Try it with 100 000 transactions: how many are fraud and flagged, and how many are legit and flagged?

## Verification

```python
def answer():
    p_fraud = 0.005
    tp = 0.98 * p_fraud
    fp = 0.03 * (1 - p_fraud)
    return tp / (tp + fp)
```

## Explanation

**Bayes' theorem:**

P(fraud | flag) = P(flag | fraud)·P(fraud) / P(flag)

- P(flag | fraud)·P(fraud) = 0.98 × 0.005 = 0.0049
- P(flag | legit)·P(legit) = 0.03 × 0.995 = 0.02985
- P(flag) = 0.0049 + 0.02985 = 0.03475

P(fraud | flag) = 0.0049 / 0.03475 ≈ **0.141**.

**Natural frequencies** make it intuitive: out of 100 000 transactions, 500 are fraud and 490 of
them get flagged; 99 500 are legit and 2 985 of them get flagged. Only 490 of the 3 475 flags
(14 %) are real fraud.

Even a "98 % accurate" model produces mostly false alarms when the **base rate** is tiny. In an
interview, this is the point to make: precision depends on prevalence.
