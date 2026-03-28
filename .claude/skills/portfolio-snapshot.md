---
triggers:
  - "portfolio status"
  - "how is my portfolio"
  - "portfolio summary"
  - "show my holdings"
  - "portfolio performance"
  - "how are my investments"
  - "what's my portfolio worth"
  - "net worth"
---

# Portfolio Snapshot

Provide a comprehensive summary of the user's portfolio with current market data.

## Instructions

1. Read `data/holdings.json` to get all positions
2. Read `data/profile.json` for user context (province, account room, residency status)
3. Read `data/properties.json` for real estate holdings
4. Read `data/trades.json` for YTD realized gains/losses
4. Use the Yahoo Finance MCP tools to fetch current prices for each holding:
   - Use `get_stock_info` for current price and key metrics
   - Always use the **regular market close price**, NOT after-hours price
5. Calculate for each position:
   - Current market value (quantity × current price)
   - Unrealized gain/loss ($ and %)
   - For USD holdings: show both USD and CAD values
6. Calculate portfolio totals:
   - Total portfolio value (in CAD)
   - Total unrealized gain/loss
   - Allocation by account type (TFSA, RRSP, FHSA, non-registered)
   - Allocation by asset type (stocks, ETFs, bonds, real estate)
   - Allocation by geography (Canadian vs US vs International)
7. Include real estate value from properties.json in net worth
8. Show TFSA/RRSP/FHSA contribution room remaining from profile.json
9. Show YTD realized gains/losses from trades.json (sells only, current calendar year)

## Currency Conversion
For USD holdings, fetch the CAD/USD exchange rate to display CAD equivalents. Use the symbol `CADUSD=X` on Yahoo Finance for the rate.

## Output Format
Present as a clean, readable summary in the terminal. Use tables where helpful.

## Follow-up
After presenting the portfolio summary:

1. Check `data/profile.json` for the `email` field
2. Ask the user:

> "What would you like to do next?
> 1. **Generate a full HTML report** (saved to `reports/`)
> 2. **Email this summary**
> 3. **Do both**
> 4. **Nothing, thanks**"

3. If the user chooses email (2 or 3):
   - **If `email` is set in profile** → confirm first: "I'll send this to **[email]** — is that correct, or would you like to use a different address?"
   - **If `email` is not set in profile** → ask: "What email address should I send this to? I can also save it to your profile for next time."
   - If user provides a new address and wants it saved, update the `email` field in `data/profile.json`

Wait for the user's response before sending.
