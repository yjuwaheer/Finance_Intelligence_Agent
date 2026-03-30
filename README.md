# Personal Finance Intelligence Agent

A Canadian-focused personal finance agent powered by Claude Code. It monitors your portfolio, categorizes expenses, generates HTML reports, and serves as an interactive Canadian finance advisor — all running locally.

---

## UI Demo

<img src=".specs/demo/ui.gif" height="500" />

## Quick Start

### 1. Prerequisites

- [Claude Code](https://claude.ai/code) with an active subscription
- [Node.js](https://nodejs.org/) v18+
- [uv](https://docs.astral.sh/uv/) (Python package manager, for Yahoo Finance MCP)
- A [Resend](https://resend.com) API key (free tier, optional — only needed for email)

### 2. Install

```bash
# Clone and enter the project
cd ai-workshop-project

# Clone the Yahoo Finance MCP server (gitignored — must be set up separately)
mkdir -p mcp-servers
git clone https://github.com/Alex2Yang97/yahoo-finance-mcp.git mcp-servers/yahoo-finance-mcp
cd mcp-servers/yahoo-finance-mcp && uv sync && cd ../..

# Install the agent batch processor
cd agent && npm install && cd ..

# Install the local web UI
npm run ui:install
```

### 3. Configure your portfolio

Edit the JSON files in `data/` to reflect your actual holdings (or keep the sample data to try it out):

```bash
data/
├── holdings.json      # Your current portfolio positions
├── trades.json        # Complete trade history (every buy & sell)
├── watchlist.json     # Price alert targets
├── transactions.json  # Income and expenses
├── profile.json       # Your province, residency status, contribution room
└── properties.json    # Real estate holdings
```

### 4. Configure email sender (optional — needed for email delivery)

**Option A — Shell environment** (recommended, works for both CLI and Web UI):
```bash
export RESEND_API_KEY=re_...
export REPORT_EMAIL_FROM=you@yourdomain.com   # must be a verified Resend sender
# Add both to ~/.zshrc or ~/.bashrc to persist across sessions
```

**Option B — `.env` file** (Web UI only; the CLI reads `${RESEND_API_KEY}` from your shell):
```env
RESEND_API_KEY=re_...
REPORT_EMAIL_FROM=you@yourdomain.com   # must be a verified Resend sender
UI_PORT=3000                           # optional, defaults to 3000
```

The `.env` file approach works because the Web UI's `loadEnv()` only sets variables not already present in the environment, so shell variables always take precedence.

### 5. Start using it

**Option A — Web UI** (no terminal experience needed):
```bash
npm run ui
# Opens at http://localhost:3000
```

**Option B — Claude Code CLI** (full developer access):
```bash
claude
```

The skills and MCP servers are configured automatically via `.mcp.json`.

---

## Usage: Web UI

A browser-based chat interface for the finance agent. Designed for day-to-day use without needing the terminal.

```bash
npm run ui
```

Features:
- Chat with the agent naturally — ask about your portfolio, taxes, expenses, or get a report emailed to you
- **Live activity indicators** — see exactly which tool is running (fetching stock info, sending email, etc.) with a pinned status bar
- **Streaming responses** — text types out progressively as the agent composes its answer
- **Finance-only guardrails** — the agent will decline off-topic requests and redirect to finance questions
- **Responsive** — works on desktop and mobile (hamburger menu on small screens)
- **Quick actions** — sidebar shortcuts for Portfolio Snapshot, Tax Loss Scanner, Expense Analysis, and Finance Advisory
- **Manage Data** (`/data`) — browser-based editor for all data files (Profile, Holdings, Watchlist, Transactions, Properties, Trade History)

> **Note:** The web UI still uses your local Claude Code subscription — no API key required.

### Manage Data page (`/data`)

A dedicated data editor accessible from the sidebar. Each data file has its own tab with a table view, add/edit forms, and inline delete confirmation.

**Trade History tab behaviour:**
- Adding a trade via the form automatically updates `holdings.json` — buys increase (or create) the position with a weighted-average ACB; sells reduce or remove it
- Editing or deleting a trade record updates `trades.json` only — it does not reverse the holdings change. Use chat to correct complex trade errors (e.g. "I recorded a sale incorrectly, please fix it")
- Trades entered via chat are handled entirely by the agent, which updates all relevant files simultaneously

---

## Usage: Interactive Mode (Claude Code)

Open Claude Code in the project directory and talk to it naturally. The custom skills activate based on your questions.

### Portfolio Management

```
> Add 50 shares of SHOP.TO to my TFSA at $105.20 purchased today

> I sold 10 MSFT from my RRSP at $420

> Add NVDA to my watchlist with a target of $800

> I spent $85 at Loblaws today on groceries

> Update my TFSA contribution room to $27,000
```

The agent reads and writes your `data/*.json` files directly.

### Stock Price Lookup

```
> What is the stock price for MSFT?

> How is SHOP.TO doing?

> Check the price of AAPL
```

Always returns the **regular market close price** (not after-hours) unless you explicitly ask:

```
> What is the after-hours price for TSLA?
```

### Portfolio Snapshot

```
> How is my portfolio doing?

> Show me my holdings

> What's my net worth?

> Portfolio performance summary
```

Returns: total value, per-position gains/losses, allocation by account type, CAD/USD breakdown, contribution room status.

### Expense Tracking

```
> Categorize my expenses

> Where is my money going?

> Show me my spending summary
```

Automatically categorizes uncategorized transactions, flags unusual spending (>$500 single purchase, >2x category average), and identifies recurring subscriptions.

### Tax-Loss Harvesting

```
> Scan for tax-loss harvesting opportunities

> Any superficial loss candidates?

> What capital losses can I realize?
```

Only scans non-registered accounts. Checks the Canadian superficial loss rule (30-day window across all accounts) and suggests substitute securities.

### Canadian Finance Advisor

```
> I just moved to Canada, what should I do first financially?

> Should I contribute to RRSP or TFSA?

> How does FHSA work? Can I combine it with HBP?

> What's the US withholding tax situation for my RRSP?

> Explain the Canadian dividend tax credit

> What are the capital gains inclusion rates?

> I'm in Ontario making $120K — what's my marginal tax rate?
```

Answers are tailored to your profile in `data/profile.json` (province, residency status, arrival date).

### Tax Calendar

```
> What tax deadlines are coming up?

> When is the RRSP deadline?

> When do I need to file my taxes?
```

### Report Generation

```
> Generate my daily report

> Create a weekly report

> Build my monthly report
```

Generates a self-contained HTML file in `reports/` and tells you the path:

```
Report saved to: reports/2026-03-05-daily.html
Open it with: open reports/2026-03-05-daily.html
```

### Frontend / Reports UI

```
> Open the latest report

> Add a section to the report showing my top movers

> Change the report theme to dark mode

> Check accessibility of my report
```

- **Open report** — opens the most recently generated HTML report in your browser
- **Report component** — adds a new visual section (table, card, bar chart, heatmap) to an existing report
- **Report theme** — changes colors/styling (dark mode, high contrast, custom accent)
- **Accessibility check** — audits reports for WCAG AA compliance, missing alt text, contrast issues

### After any analysis, the agent will offer clickable options

After delivering a portfolio snapshot, expense breakdown, tax-loss scan, or advisory, the agent renders clickable follow-up buttons directly in the chat — no need to type a number or remember which option was which.

---

## Usage: Batch Mode (Headless)

Generate reports without an interactive session using the batch processor. This runs a 5-stage pipeline automatically:

```bash
# From the project root
npm run report:daily
npm run report:weekly
npm run report:monthly
```

### What the pipeline does

```
Stage 1: Market Data Collection
  → Fetches live prices for all holdings via Yahoo Finance MCP
  → Saves to data/_market_data_cache.json

Stage 2: Portfolio Analysis
  → Calculates performance, allocations, gains/losses
  → Canadian tax-loss harvesting scan (superficial loss rule)
  → Registered account contribution room tracking
  → Saves to data/_analysis.json

Stage 3: Expense Analysis
  → Categorizes uncategorized transactions
  → Flags unusual spending
  → Saves to data/_expense_analysis.json

Stage 4: Canadian Advisory
  → Generates contextual tips based on profile and time of year
  → Upcoming tax deadlines
  → Account optimization suggestions
  → Saves to data/_advisory.json

Stage 5: Report Generation
  → Produces a self-contained HTML report
  → Saves to reports/YYYY-MM-DD-{type}.html
```

### View a report

```bash
# macOS
open reports/2026-03-05-daily.html

# Linux
xdg-open reports/2026-03-05-daily.html

# Or just drag the file into your browser
```

---

## Data Format Reference

### holdings.json

```json
{
  "symbol": "XEQT.TO",       // .TO = TSX (CAD), no suffix = US (USD)
  "asset_type": "etf",        // stock, etf, crypto, bond, real_estate
  "quantity": 200,
  "cost_basis": 24.85,        // per-share cost
  "purchase_date": "2023-06-15",
  "account": "tfsa",          // tfsa, rrsp, fhsa, resp, non_registered, lira, corporate
  "currency": "CAD",          // CAD or USD
  "notes": "All-in-one equity ETF"
}
```

### trades.json

```json
{
  "date": "2026-03-13",
  "action": "sell",               // "buy" or "sell"
  "symbol": "MSFT",
  "quantity": 10,
  "price": 420.00,                // per share
  "total": 4200.00,               // quantity × price ± fees
  "fees": 0,
  "account": "rrsp",
  "currency": "USD",
  "cost_basis_per_share": 380.00, // ACB per share at time of sale (sells only)
  "realized_gain_loss": 400.00,   // (price − ACB) × qty — negative = loss (sells only)
  "notes": ""
}
```

Every buy and sell is recorded here in addition to updating `holdings.json`. This enables:
- YTD realized capital gains/losses for CRA reporting
- Superficial loss rule verification (30-day window around sells)
- Full ACB reconstruction history

### watchlist.json

```json
{
  "symbol": "SHOP.TO",
  "target_price": 80.00,
  "alert_condition": "below",  // below, above, percent_change
  "notes": "Buy if it dips below $80"
}
```

### transactions.json

```json
{
  "date": "2026-01-07",
  "amount": -92.45,            // negative = expense, positive = income
  "description": "Loblaws grocery run",
  "merchant": "Loblaws",
  "category": "Food",          // null = uncategorized (agent will fill in)
  "is_flagged": false,
  "flag_reason": null
}
```

### profile.json

```json
{
  "name": "Alex",
  "residency_status": "permanent_resident",  // citizen, permanent_resident, work_permit, student, newcomer
  "province": "ON",                           // ON, BC, AB, QC, etc.
  "arrival_date": "2022-06-15",               // for newcomers: TFSA room calc starts here
  "annual_income_bracket": "100k_150k",
  "tfsa_contribution_room": 34000,
  "rrsp_contribution_room": 28000,
  "fhsa_contribution_room": 8000,
  "has_employer_match": true,
  "employer_match_details": "50% match up to 5% of salary",
  "email": "alex@example.com"
}
```

### properties.json

```json
{
  "address": "123 Main St, Unit 101, Toronto, ON",
  "purchase_price": 550000,
  "current_value": 620000,
  "monthly_rental_income": 2800,
  "monthly_expenses": 1950,
  "purchase_date": "2021-09-01",
  "notes": "Rental condo"
}
```

---

## Project Structure

```
ai-workshop-project/
├── .mcp.json                      # MCP server config (committed, no secrets)
├── CLAUDE.md                      # Agent context file
├── .claude/
│   ├── settings.json              # Project-level permissions
│   └── skills/                    # 12 custom Claude Code skills
│       ├── portfolio-manager.md
│       ├── portfolio-snapshot.md
│       ├── stock-price-lookup.md
│       ├── tax-loss-scanner.md
│       ├── expense-categorizer.md
│       ├── report-on-demand.md
│       ├── canadian-finance-advisor.md
│       ├── canadian-tax-calendar.md
│       ├── open-report.md
│       ├── report-component.md
│       ├── report-theme.md
│       └── accessibility-check.md
├── agent/
│   └── src/
│       ├── batch-processor.ts     # Headless 5-stage pipeline
│       ├── config.ts              # Paths and MCP config
│       ├── prompts/               # System prompts for each sub-agent
│       └── knowledge/             # Canadian finance reference data
│           ├── tfsa-limits.ts
│           ├── rrsp-rules.ts
│           ├── fhsa-rules.ts
│           ├── tax-brackets.ts
│           ├── newcomer-checklist.ts
│           └── tax-calendar.ts
├── data/                          # Your financial data (JSON)
├── evals/                         # Test suites
├── mcp-servers/                   # Gitignored — clone separately (see Install)
│   └── yahoo-finance-mcp/
├── reports/                       # Generated HTML reports (gitignored)
├── ui/
│   ├── server.ts                  # Express entry point (route wiring only)
│   ├── lib/
│   │   ├── agent.ts               # System prompt builder + session history
│   │   ├── data.ts                # JSON file I/O + holdings sync
│   │   ├── env.ts                 # .env loader
│   │   └── ticker.ts              # Live price fetching + server-side cache
│   ├── package.json
│   └── public/
│       ├── index.html             # Chat UI
│       ├── data.html              # Manage Data page (/data)
│       ├── style.css              # Shared: tokens, sidebar, ticker, animations
│       ├── chat.css               # Chat page styles
│       ├── data.css               # Data management page styles
│       └── js/
│           ├── chat.js            # Entry point: sendMessage, SSE loop, init
│           ├── state.js           # Shared mutable state + constants
│           ├── messages.js        # DOM factories: bubbles, welcome, errors
│           ├── typewriter.js      # Streaming text reveal + status bar
│           ├── tools.js           # Tool call indicators (running / done)
│           ├── sessions.js        # Session management + localStorage
│           ├── ticker.js          # Watchlist ticker strip
│           ├── sidebar.js         # Sidebar toggle + event delegation
│           └── data/
│               ├── app.js         # Data page entry point
│               ├── form.js        # Form field rendering + data collection
│               └── schemas.js     # SCHEMAS config, formatters, helpers
└── README.md
```

---

## Evals

> **Coming soon.** The eval suite is planned but not yet implemented.

The planned eval suite will cover:

| File | What it tests |
|------|--------------|
| `stock-price.eval.ts` | Closing-price-by-default rule, TSX symbol classification, watchlist alerts |
| `portfolio-calc.eval.ts` | Gains/losses, CAD/USD conversion, concentration risk, cap rate |
| `tax-loss.eval.ts` | Superficial loss rule (30-day window, all accounts), inclusion rates |
| `categorization.eval.ts` | Category taxonomy, $500 flag threshold, 2× average anomaly rule |
| `report-completeness.eval.ts` | All sections present per report type, self-contained HTML, disclaimer |
| `canadian-advisor.eval.ts` | TFSA room calc, RRSP/FHSA limits, marginal rates, newcomer checklist |
| `canadian-tax-rules.eval.ts` | Capital gains inclusion, US withholding tax by account, dividend tax credit |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | For email | Your Resend API key — set in shell or `.env` |
| `REPORT_EMAIL_FROM` | For email | Verified sender address in Resend — set in shell or `.env` |
| `UI_PORT` | No | Port for the web UI (default: `3000`) — `.env` only |

No Anthropic API key needed — the agent uses your local Claude Code subscription.

---

## Key Rules

- **Closing prices only** — stock prices always show regular market hours close, never after-hours
- **Canadian by default** — all tax rules, account types, and advice assume Canadian jurisdiction
- **Currency in CAD** — USD holdings show both USD and CAD equivalent
- **Superficial loss rule** — tax-loss harvesting checks the 30-day window across all accounts (stricter than US wash sale)
- **Not financial advice** — all advisory responses include a disclaimer
