---
triggers:
  - "add * shares"
  - "bought *"
  - "sold *"
  - "remove * from"
  - "move * to"
  - "update my holdings"
  - "add to watchlist"
  - "remove from watchlist"
  - "add transaction"
  - "add property"
  - "update my profile"
---

# Portfolio Manager

You manage the user's financial data stored in local JSON files. Handle all CRUD operations via natural language.

## Data Files
- `data/holdings.json` — Current portfolio positions
- `data/trades.json` — Complete trade history (every buy and sell)
- `data/watchlist.json` — Price alert targets
- `data/transactions.json` — Income/expense records
- `data/profile.json` — User financial profile
- `data/properties.json` — Real estate holdings

## Instructions

1. Read the relevant JSON file before making changes
2. Parse the user's natural language request to determine the operation (add/update/remove)
3. For holdings: include symbol, asset_type, quantity, cost_basis, purchase_date, account, currency
4. **For buys:** add/update `holdings.json` AND append a trade record to `trades.json` with `action: "buy"`, `realized_gain_loss: 0`
5. **For sells:** reduce or remove the position from `holdings.json` AND append a trade record to `trades.json` with:
   - `action: "sell"`
   - `cost_basis_per_share`: the ACB from the holding being sold
   - `realized_gain_loss`: `(sale_price - cost_basis_per_share) × quantity` (negative = loss)
   - Also add a transaction record (positive amount) to `transactions.json` for the cash proceeds
6. Write all updated JSON files back
7. Confirm the change to the user with a summary including any realized gain/loss

## Account Types
Canadian registered accounts: `tfsa`, `rrsp`, `fhsa`, `resp`, `non_registered`, `lira`, `corporate`

## Currency
Default to `CAD`. Use `USD` for US-listed securities (no `.TO` suffix). Symbols ending in `.TO` are TSX-listed (CAD).

## Examples
- "Add 50 shares of SHOP.TO to my TFSA at $105.20 purchased today" → add to holdings.json
- "I sold 10 MSFT at $420 from my RRSP" → reduce quantity in holdings, add transaction
- "Add NVDA to my watchlist at $800 target" → add to watchlist.json
- "I spent $85 at Loblaws today on groceries" → add to transactions.json
- "Update my TFSA contribution room to $27,000" → update profile.json
