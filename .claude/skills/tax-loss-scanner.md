---
triggers:
  - "tax loss harvest"
  - "tax-loss"
  - "superficial loss"
  - "capital losses"
  - "harvest losses"
  - "tax loss opportunities"
---

# Tax-Loss Harvest Scanner

Scan the portfolio for Canadian tax-loss harvesting opportunities, respecting the superficial loss rule.

## Instructions

1. Read `data/holdings.json` for all positions
2. Read `data/trades.json` for recent buy dates (needed for superficial loss rule check)
3. Read `data/profile.json` for province (to calculate marginal tax rate)
4. Use Yahoo Finance MCP to fetch current prices for all holdings
5. Identify positions in **non-registered accounts only** with unrealized losses >10%
   - TFSA/RRSP/FHSA/RESP gains and losses are tax-sheltered — no tax-loss harvesting needed
6. For each candidate:
   - Calculate unrealized loss ($ and %)
   - Estimate tax savings at the user's marginal rate
   - Check for **Canadian superficial loss rule** violations using `trades.json`:
     - Cannot repurchase the **same or identical security** within 30 days before OR after the sale
     - This applies across ALL accounts (including spouse's TFSA, RRSP, etc.)
     - Check `trades.json` for any buy of the same symbol within the last 30 days — if found, WARN
     - Check if the same symbol exists in any registered account in `holdings.json` — if so, WARN the user
   - Suggest substitute securities (e.g., sell VFV.TO, buy XUS.TO — similar exposure, different fund)
7. Also show YTD realized gains/losses from `data/trades.json` as context — harvested losses offset realized gains

## Canadian Superficial Loss Rule
The superficial loss rule is STRICTER than the US wash sale rule:
- 30 days BEFORE and 30 days AFTER the sale (61-day window)
- Applies to purchases by the taxpayer, spouse, or a corporation controlled by either
- Applies across ALL account types (non-registered, TFSA, RRSP, etc.)
- If violated, the loss is DENIED and added to the cost basis of the repurchased shares

## Capital Gains Inclusion Rate
- First $250,000 of net capital gains: 50% inclusion rate
- Above $250,000: 66.67% inclusion rate
- Tax savings = loss × inclusion rate × marginal tax rate

## Output Format
Present a clear table of opportunities sorted by potential tax savings (highest first).
Include a disclaimer that this is educational information, not tax advice.

## Follow-up
After presenting findings:

1. Check `data/profile.json` for the `email` field
2. Ask:

> "Would you like me to:
> 1. **Email these findings**
> 2. **Generate a full tax optimization report**
> 3. **Both**
> 4. **Nothing, thanks**"

3. If the user chooses email (1 or 3):
   - **If `email` is set in profile** → confirm: "I'll send this to **[email]** — correct, or different address?"
   - **If `email` is not set** → ask: "What email should I use? I can save it to your profile for future use."
   - If user wants address saved, update `email` in `data/profile.json`
