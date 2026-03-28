---
triggers:
  - "stock price for"
  - "price of"
  - "what is * trading at"
  - "how much is * stock"
  - "check * price"
  - "quote for"
---

# Stock Price Lookup

Look up stock prices for the user. **Always return the regular market hours closing price by default.**

## Instructions

1. Use the Yahoo Finance MCP tool `get_stock_info` to fetch the stock data
2. **CRITICAL RULE:** Always show the **regular market close price**, NOT the after-hours/pre-market price
   - Use `regularMarketPrice` or `previousClose` from the data
   - Only show after-hours/extended hours data if the user EXPLICITLY asks for it (e.g., "what's the after-hours price")
3. For Canadian stocks (`.TO` suffix), show price in CAD
4. For US stocks, show price in USD and provide CAD equivalent
5. Include key context:
   - Daily change ($ and %)
   - 52-week high/low
   - Market cap
   - P/E ratio (if available)
   - Dividend yield (if applicable)
6. If the stock is in the user's `data/holdings.json`, mention their position and unrealized gain/loss
7. If the stock is in the user's `data/watchlist.json`, mention the target price and how far current price is from it

## Example Response Format
```
MSFT (Microsoft Corporation) — Regular Market Close
Price: $415.20 USD (~$572.96 CAD)
Change: +$3.45 (+0.84%)
52W Range: $362.90 - $468.35
P/E: 36.2 | Div Yield: 0.72%

📍 You hold 15 shares in RRSP (cost basis: $380.00)
   Unrealized gain: +$527.00 (+9.26%)
```
