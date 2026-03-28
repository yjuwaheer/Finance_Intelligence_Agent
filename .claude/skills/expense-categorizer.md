---
triggers:
  - "categorize expenses"
  - "categorize transactions"
  - "sort my spending"
  - "expense categories"
  - "spending summary"
  - "expense report"
  - "where is my money going"
---

# Expense Categorizer

Categorize uncategorized transactions and provide spending analysis.

## Instructions

1. Read `data/transactions.json`
2. Find entries where `category` is `null`
3. Categorize each based on the `description` and `merchant` fields
4. Write updated categories back to `data/transactions.json`
5. Flag unusual spending:
   - Single transaction >$500 (set `is_flagged: true` with reason)
   - Category spending >2x the average for that category
6. Provide a spending summary

## Categories
Use these standard categories:
- **Housing** — Rent, mortgage, property tax, condo fees
- **Food** — Groceries, restaurants, coffee shops, food delivery
- **Transport** — Transit pass, gas, car insurance, Uber, parking
- **Utilities** — Hydro, water, gas, internet, phone
- **Healthcare** — Pharmacy, dental, medical, insurance premiums
- **Entertainment** — Movies, concerts, streaming, bars, sports
- **Shopping** — Clothing, electronics, household items, furniture
- **Subscriptions** — Netflix, Spotify, gym, software subscriptions
- **Income** — Salary, freelance, dividends, interest
- **Savings** — Transfers to savings, investments, TFSA/RRSP contributions
- **Other** — Anything that doesn't fit the above

## Output Format
After categorizing, show:
1. Number of transactions categorized
2. Any flagged transactions with reasons
3. Spending summary by category (total and % of expenses)
4. Comparison to previous period if data is available
