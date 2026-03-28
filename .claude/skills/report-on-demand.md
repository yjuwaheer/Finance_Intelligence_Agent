---
triggers:
  - "generate report"
  - "create report"
  - "build report"
  - "make a report"
  - "daily report"
  - "weekly report"
  - "monthly report"
  - "financial report"
---

# Report on Demand

Generate a self-contained HTML financial report and save it locally.

## Instructions

1. Read all data files:
   - `data/holdings.json` — portfolio positions
   - `data/watchlist.json` — price targets
   - `data/transactions.json` — expenses/income
   - `data/profile.json` — user profile
   - `data/properties.json` — real estate
2. Use Yahoo Finance MCP to fetch current prices for all holdings and watchlist items
3. Determine report type (daily/weekly/monthly) from user request or default to daily
4. Generate a self-contained HTML file with inline CSS
5. Save to `reports/YYYY-MM-DD-{type}.html`
6. Tell the user the file path so they can open it in a browser

## Report Sections

### Daily Report
- Portfolio value and daily change (CAD)
- Top movers (biggest gainers/losers)
- Watchlist alerts (price vs target)
- Relevant news headlines
- Flagged transactions
- Canadian tip of the day

### Weekly Report (includes daily +)
- Allocation drift
- Sector breakdown
- Rebalancing suggestions
- Expense summary by category
- CAD/USD exposure
- Registered account contribution room tracker

### Monthly Report (includes weekly +)
- Full performance attribution
- Tax-loss harvesting opportunities
- Real estate performance
- Net worth trend
- Benchmark comparison (S&P/TSX, S&P 500)
- Tax optimization suggestions
- Newcomer milestones (if applicable)

## HTML Requirements
- **Self-contained** — all CSS must be inline or in a `<style>` tag
- **No external dependencies** — no CDN links, no JavaScript frameworks
- **Responsive** — readable on both desktop and mobile
- **Print-friendly** — should look good when printed
- **Professional styling** — clean, modern design with a financial theme
- **Color coding** — green for gains, red for losses
- **CAD by default** — show USD equivalent where applicable
- **Disclaimer** — include at the bottom: "This report is for educational purposes only. It does not constitute professional financial advice."

## Email Variant
If sending via Resend MCP, generate a simpler version:
- All styles must be inline (no `<style>` tag — email clients strip it)
- Simpler layout, no complex CSS grid
- Same content, just simpler formatting
