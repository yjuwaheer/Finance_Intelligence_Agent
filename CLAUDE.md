# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Finance Intelligence Agent with a Canadian-first focus. Automates investment monitoring, expense tracking, and financial reporting. Also serves as a general Canadian finance advisor for newcomers and established Canadians.

## Architecture

- **Agent runtime:** Claude Code (local subscription) + Agent SDK for headless batch processing
- **Data storage:** Local JSON files in `data/` (no database)
- **Reports:** Self-contained HTML/CSS files in `reports/`, opened directly in browser
- **MCP Servers:** Yahoo Finance (market data), Resend (email)
- **Skills:** Custom Claude Code skills in `.claude/skills/`
- **Knowledge base:** Canadian finance reference data in `agent/src/knowledge/`

## Key Commands

```bash
npm run report:daily     # Generate daily report
npm run report:weekly    # Generate weekly report
npm run report:monthly   # Generate monthly report
```

## Data Files

All portfolio/financial data lives in `data/`:
- `holdings.json` — Current portfolio positions (symbol, quantity, cost basis, account type, currency)
- `trades.json` — Complete trade history: every buy and sell, with realized gain/loss per trade
- `watchlist.json` — Price alert targets
- `transactions.json` — Income/expense records
- `profile.json` — User profile (province, residency status, contribution room)
- `properties.json` — Real estate holdings

## Trade Recording Rules

Every buy or sell must update TWO files:
- **Buy:** add/update `holdings.json` + append to `trades.json` (`action: "buy"`, `realized_gain_loss: 0`)
- **Sell:** reduce/remove from `holdings.json` + append to `trades.json` (`action: "sell"`, `cost_basis_per_share` from the holding, `realized_gain_loss: (price - acb) × qty`) + add proceeds to `transactions.json`

Account types are Canadian: `tfsa`, `rrsp`, `fhsa`, `resp`, `non_registered`, `lira`, `corporate`

## Canadian Finance Rules

- **Stock prices:** Always return regular market hours closing price, NOT after-hours, unless user explicitly requests extended analysis
- **Tax-loss harvesting:** Use Canadian superficial loss rule (30 days before/after, across all accounts including spouse's) — NOT US wash sale rule
- **Currency:** Display in CAD by default. For USD holdings, show both USD and CAD equivalent
- **Tax context:** Use CRA terminology, Income Tax Act references. Never use IRS/IRC terms.
- **Capital gains:** 50% inclusion rate on first $250K, 66.7% above that (for individuals)
- **Advisory disclaimer:** Always include disclaimer that this is educational, not professional financial advice

## Report Generation

Reports must be self-contained HTML with inline CSS. No external dependencies. Must render correctly when opened as a local file in any browser. Email-compatible variant uses simpler layout with inline styles only.

## MCP Servers

Configured in `.mcp.json` (project-scoped, committed to git):
- **yahoo-finance:** Local Python MCP server in `mcp-servers/yahoo-finance-mcp/`
- **resend:** Email delivery via `npx resend-mcp` — requires `RESEND_API_KEY` env var

## Email Rules

- **`from` address:** Always read from `REPORT_EMAIL_FROM` in the project's `.env` file. Never hardcode a sender address.
- **HTML emails:** Pass the HTML string to the `html` parameter ONLY — never to the `text` parameter. Putting HTML in `text` causes the raw HTML source to display as unformatted characters in the inbox. Omit `text` entirely. Do not wrap in `<![CDATA[...]]>`.

## Skills

13 custom skills in `.claude/skills/`:
- **Finance:** portfolio-manager, portfolio-snapshot, stock-price-lookup, tax-loss-scanner, expense-categorizer, canadian-finance-advisor, canadian-tax-calendar, report-on-demand
- **Frontend/Reports:** open-report, report-component, report-theme, accessibility-check, frontend-design

## Web UI Architecture

The UI server (`ui/`) is split into focused modules:
- `server.ts` — Express route wiring only (thin)
- `lib/agent.ts` — system prompt builder + in-memory session history
- `lib/data.ts` — JSON file I/O + holdings sync on trades
- `lib/ticker.ts` — live price fetching + server-side 2-minute cache
- `lib/env.ts` — `.env` loader

Frontend is ES modules loaded via `<script type="module">`:
- `js/chat.js` — entry point for the chat page
- `js/data/app.js` — entry point for the `/data` management page
- Shared CSS in `style.css`; page-specific in `chat.css` and `data.css`

## Follow-up Behaviour

After delivering a substantial analysis (portfolio snapshot, expense breakdown, finance advisory, tax-loss scan), offer the user follow-up options using the `<div class="quick-replies">` button format defined in the system prompt — never a numbered list. The buttons are clickable in the Web UI and send a complete self-contained prompt when clicked.
