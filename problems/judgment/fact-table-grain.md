---
id: crit-007
slug: fact-table-grain
title: "Choosing the Grain of the Sales Table"
section: judgment
difficulty: Medium
topics: [Data modeling, Star schema, Fact table grain]
company: Loomly Home
answer_type: choice
answer: 2
---

## Statement

**Loomly Home** is building its analytics warehouse. An order can contain several products, and
discounts are applied **per product line** (for example, 20 % off one lamp in a three-item order).
Analysts need revenue by product, by category, by order and by customer.

What should be the **grain** (one row per …) of the main sales fact table?

## Options

- One row per order, with a JSON column listing its products.
- One row per customer per day, with total revenue.
- One row per order line (order × product), with quantity, price and the line's discount.
- One row per product per day, with units sold and revenue.

## Hints

### Hint 1

Which grain still lets you answer "revenue by product" **and** "revenue by order"?

### Hint 2

You can always aggregate a fine grain up; you can never split a coarse grain back down.

## Explanation

Choose the **finest grain at which the business events and their measures exist**. Here the discount
lives on the order line, so the fact table should be **one row per order line**: `order_id`,
`product_id`, `customer_id`, date, quantity, unit price, discount, net amount.

From that grain you can get revenue by order (sum lines per order), by product, by category (join the
product dimension) and by customer, all with correct discounts.

- **A** hides the products in JSON: every product question needs parsing, and discounts are hard to
  allocate.
- **B** and **D** are useful *aggregates* built from the line-level table, but they've lost
  information: you can't recover per-order revenue from B or per-customer revenue from D.

This is the first question in almost every data modelling interview: *what is the grain?*
