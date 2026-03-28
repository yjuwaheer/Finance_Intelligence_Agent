# Personal Finance Intelligence Agent - Project Specification

## Overview

A Personal Finance Intelligence Agent that automates investment monitoring, expense tracking, and financial reporting — with a **Canadian-first focus**. The agent reads local portfolio data, fetches live market data, and generates self-contained HTML reports that can be opened directly in a browser. Reports include risk alerts, rebalancing suggestions, and tax-loss harvesting opportunities. Reports can optionally be emailed via Resend.

Beyond automated reporting, the agent also serves as a **general Canadian finance advisor** — helping both newcomers to Canada (immigrants) and established Canadians navigate the Canadian financial system, including registered accounts (TFSA, RRSP, FHSA, RESP), tax obligations, benefits programs, credit building, and investment strategies optimized for Canadian tax law.

**All components run locally.** The agent is powered by a local Claude Code subscription — no separate API key or cloud deployment needed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Trigger                                     │
│     (Web UI chat / manual CLI / Claude Code session / local cron)  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Claude Code (local subscription) + Agent SDK                │
│                    Headless Batch Processor                         │
│                                                                     │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  ┌────────┐ │
│  │Sub-Agent │ │ Sub-Agent │ │ Sub-Agent │ │ Sub-Agent │  │Sub-Agt │ │
│  │ Market   │ │ Portfolio │ │ Expense   │ │ Canadian  │  │ Report │ │
│  │ Data     │ │ Analysis  │ │ Analysis  │ │ Advisor   │  │ Gen    │ │
│  └────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  └───┬────┘ │
│       │             │             │             │            │      │
└───────┼─────────────┼─────────────┼─────────────┼────────────┼──────┘
        │             │             │             │            │
        ▼             ▼             ▼             ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────────┐
│  MCP Servers │ │  Local   │ │  Knowledge   │ │     Output         │
│              │ │  JSON    │ │              │ │                    │
│ - Yahoo Fin  │ │  Files   │ │- CRA rules   │ │ - HTML reports     │
│ - Resend     │ │- holdings│ │- Provincial  │ │ - Resend (email)   │
│              │ │- watchl. │ │- Newcomer    │ │ - Web UI chat      │
│              │ │- txns    │ │  guides      │ │                    │
│              │ │- profile │ │              │ │                    │
└──────────────┘ └──────────┘ └──────────────┘ └────────────────────┘
```

### Interactive Mode (Web UI)
```
User (browser chat interface — ui/)
  "How does TFSA work for newcomers?"
  "What is the stock price for MSFT?"
  "Generate my weekly report"
        │
        ▼
  Express Server (ui/server.ts)
  SSE streaming endpoint + session history
        │
        ▼
  Agent SDK (ui/lib/agent.ts)
  System prompt + skills + data context
        │
        ▼
  Response streamed back to browser
  Tool calls shown inline; follow-up quick-reply buttons rendered
```

### Interactive Mode (CLI / Ad-hoc)
```
User (in Claude Code terminal)
  "How does TFSA work for newcomers?"
  "What is the stock price for MSFT?"
  "Generate my weekly report"
        │
        ▼
  Claude Code (with MCP servers + custom skills)
        │
        ▼
  Response in terminal + optional HTML file saved to reports/
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------||
| **Agent Runtime** | Claude Code (local subscription) + Agent SDK | Interactive use + headless batch processing |
| **Language** | TypeScript | Batch processor scripts + Web UI server |
| **Web UI** | Express + ES module frontend | Browser-based chat interface and data management |
| **Market Data** | Yahoo Finance MCP Server | Stock prices, financials, news, options, analyst recs |
| **Data Storage** | Local JSON files | Portfolio, watchlist, transactions, user profile |
| **Email** | Resend MCP Server | Send HTML reports as email |
| **Reports** | Self-contained HTML/CSS files | Open directly in browser, no server needed |
| **Evals** | Custom test suite *(planned, not yet built)* | Validate agent accuracy and behavior |

---

## Local Data Model (JSON Files)

All data lives in a `data/` directory as JSON files. The agent reads and writes these directly.

### `data/holdings.json`
```json
[
  {
    "symbol": "XEQT.TO",
    "asset_type": "etf",
    "quantity": 150,
    "cost_basis": 25.40,
    "purchase_date": "2024-03-15",
    "account": "tfsa",
    "currency": "CAD",
    "notes": "All-in-one equity ETF"
  },
  {
    "symbol": "MSFT",
    "asset_type": "stock",
    "quantity": 10,
    "cost_basis": 380.00,
    "purchase_date": "2023-11-01",
    "account": "rrsp",
    "currency": "USD",
    "notes": "US dividend stock in RRSP to avoid withholding tax"
  }
]
```

Account types: `tfsa`, `rrsp`, `fhsa`, `resp`, `non_registered`, `lira`, `corporate`

### `data/trades.json`
Complete trade history — every buy and sell. Updated alongside `holdings.json` on every trade.

```json
[
  {
    "date": "2024-03-15",
    "action": "buy",
    "symbol": "XEQT.TO",
    "quantity": 150,
    "price": 25.40,
    "total": 3810.00,
    "fees": 0,
    "account": "tfsa",
    "currency": "CAD",
    "cost_basis_per_share": null,
    "realized_gain_loss": 0,
    "notes": ""
  }
]
```

For sells: `cost_basis_per_share` = ACB of the position; `realized_gain_loss` = (price − cost_basis_per_share) × quantity.

### `data/watchlist.json`
```json
[
  {
    "symbol": "SHOP.TO",
    "target_price": 100.00,
    "alert_condition": "below",
    "notes": "Buy if it dips below $100"
  }
]
```

### `data/transactions.json`
```json
[
  {
    "date": "2025-03-01",
    "amount": -85.50,
    "description": "Loblaws grocery",
    "merchant": "Loblaws",
    "category": null,
    "is_flagged": false,
    "flag_reason": null
  }
]
```

Positive `amount` = income; negative = expense. `category` is null until categorized by the expense-categorizer skill.

### `data/profile.json`
```json
{
  "name": "User",
  "email": "user@example.com",
  "residency_status": "permanent_resident",
  "province": "ON",
  "arrival_date": "2022-06-15",
  "annual_income_bracket": "100k_150k",
  "tfsa_contribution_room": 34000,
  "rrsp_contribution_room": 28000,
  "fhsa_contribution_room": 8000,
  "has_employer_match": true,
  "employer_match_details": "50% match up to 5% of salary"
}
```

### `data/properties.json`
```json
[
  {
    "address": "123 Main St, Toronto, ON",
    "purchase_price": 550000,
    "current_value": 620000,
    "monthly_rental_income": 2800,
    "monthly_expenses": 1950,
    "purchase_date": "2021-09-01",
    "notes": "Rental condo"
  }
]
```

### Trade Recording Rules

Every buy or sell must update TWO files:
- **Buy:** add/update `holdings.json` (weighted-average cost basis) + append to `trades.json` (`action: "buy"`, `realized_gain_loss: 0`)
- **Sell:** reduce/remove from `holdings.json` + append to `trades.json` (`action: "sell"`, `cost_basis_per_share` from the holding, `realized_gain_loss: (price - acb) × qty`) + add proceeds to `transactions.json`

---

## Agent Pipeline (Sub-Agent Architecture)

The batch processor orchestrates multiple sub-agents in sequence:

### Stage 1: Market Data Collection Sub-Agent
**Tools:** Yahoo Finance MCP
- Fetch current prices for all holdings from `data/holdings.json`
- Fetch closing prices (not after-hours, unless specified)
- Pull relevant news for held tickers and watchlist
- Get analyst recommendations and upgrades/downgrades
- Fetch macro indicators (interest rates, sector performance)
- Output: `data/_market_data_cache.json`

### Stage 2: Portfolio Analysis Sub-Agent
**Tools:** Local JSON files
- Calculate portfolio performance (daily, WTD, MTD, YTD) in CAD
- Handle CAD/USD conversion for US-listed holdings
- Compute allocation percentages vs target allocation
- Calculate unrealized gains/losses per position
- **Canadian tax-loss harvesting** (superficial loss rule: 30 days before/after, applies to identical properties across all accounts including spouse's — stricter than US wash sale)
- Account-type-aware analysis: flag taxable events in non-registered accounts, note TFSA/RRSP gains are sheltered
- Calculate real estate ROI (cap rate, cash-on-cash return, appreciation) from `data/properties.json`
- Detect portfolio concentration risk (single position >15% of portfolio)
- Compare against benchmark (S&P/TSX Composite for Canadian, S&P 500 for US holdings)
- **RRSP/TFSA/FHSA contribution room tracking** — flag if approaching limits, suggest optimal account placement (e.g., US dividend stocks in RRSP to avoid 15% withholding tax)
- Output: `data/_analysis.json`

### Stage 3: Expense Analysis Sub-Agent
**Tools:** Local JSON files
- Read `data/transactions.json`
- Categorize uncategorized transactions (where `category` is null) using AI
- Write updated categories back to `data/transactions.json`
- Flag unusual spending (>2x average for category, or >$500 single transaction)
- Calculate spending trends vs previous period
- Identify recurring subscriptions
- Output: `data/_expense_analysis.json`

### Stage 4: Canadian Advisory Sub-Agent
**Tools:** Knowledge base files, Web Search (for CRA updates)
- Provide contextual Canadian finance tips based on `data/profile.json` and time of year
- **Newcomer guidance:** SIN application, first bank account, credit building (secured cards -> unsecured), TFSA room accumulation (starts from year of arrival as resident), first tax filing obligations
- **Tax calendar awareness:** RRSP deadline (60 days into new year), tax filing deadline (April 30), self-employed deadline (June 15), installment dates (March/June/Sept/Dec 15)
- **Registered account optimization:** TFSA vs RRSP decision based on marginal tax rate, FHSA for first-time home buyers, RESP for families with children (Canada Education Savings Grant matching)
- **Provincial considerations:** different tax brackets, provincial credits (e.g., Ontario Trillium Benefit, QC RRSP deduction differences)
- **Government benefits monitoring:** CCB, GST/HST credit, OAS, GIS eligibility changes
- Surface relevant CRA rule changes or federal budget impacts on holdings
- Output: `data/_advisory.json`

### Stage 5: Report Generation Sub-Agent
**Tools:** Local filesystem, Resend MCP
- Generate a self-contained HTML/CSS report file
- Save to `reports/YYYY-MM-DD-{type}.html` (e.g., `reports/2026-03-05-daily.html`)
- Include Canadian advisory section with timely tips
- Optionally send via Resend MCP to the email in `data/profile.json`
- Print the file path so the user can open it in their browser

---

## Report Contents

Reports are **self-contained HTML files** with inline CSS. No external dependencies. Open directly in any browser.

### Daily Report
- Portfolio value and daily change (CAD, with USD conversion where applicable)
- Top movers in portfolio (biggest gainers/losers)
- Watchlist price updates vs targets
- Breaking news relevant to holdings (TSX + US markets)
- Unusual transactions flagged
- **Canadian tip of the day** (contextual, e.g., "RRSP deadline in 12 days" in February)

### Weekly Report
- Everything in daily, plus:
- Week-over-week allocation drift
- Sector performance breakdown (TSX sectors + US exposure)
- Rebalancing suggestions (if drift > threshold)
- Expense summary by category
- **CAD/USD exposure breakdown** and forex impact on portfolio
- **Registered account contribution tracker** (TFSA/RRSP/FHSA room remaining for the year)

### Monthly Report
- Everything in weekly, plus:
- Full performance attribution
- **Canadian tax-loss harvesting** opportunities (superficial loss rule compliant) with specific action steps
- Real estate property performance
- Net worth snapshot and trend (in CAD)
- Benchmark comparison: S&P/TSX Composite and S&P 500 (CAD-adjusted)
- Spending trends and budget analysis
- **Tax optimization review:** account placement suggestions, RRSP deduction value at current marginal rate, TFSA vs RRSP analysis
- **Newcomer milestone tracker** (if applicable): credit score progress, account opening checklist, tax filing reminders

---

## Web UI Architecture

The Web UI (`ui/`) provides a browser-based interface for the agent. Run with `npm run ui`.

### Server Layer (`ui/`)
```
ui/
├── server.ts          — Express route wiring (thin router)
├── lib/
│   ├── agent.ts       — System prompt builder + in-memory session history
│   ├── data.ts        — JSON file I/O + holdings sync on trades
│   ├── ticker.ts      — Live price fetching + server-side 2-minute cache
│   └── env.ts         — .env loader
```

**Routes:**
- `GET /` — Main chat interface
- `GET /data` — Data management UI
- `GET /api/data` — Returns all data files
- `PUT /api/data/profile` — Update profile.json
- `POST /api/data/trades` — Add trade and auto-sync holdings.json
- `POST|PUT|DELETE /api/data/:resource` — Generic CRUD for array resources
- `GET /api/ticker` — Returns cached ticker prices with alert state
- `POST /api/chat` — SSE streaming chat endpoint
- `DELETE /api/session/:id` — Clear session history

**Key behaviors:**
- `lib/agent.ts` loads all skills from `.claude/skills/*.md` (strips YAML frontmatter), injects data context into the system prompt, and maintains per-session conversation history (10-message window, 2000-char cap per entry)
- `lib/data.ts` automatically syncs `holdings.json` on every trade write (weighted-average cost basis for buys, quantity reduction for sells)
- `lib/ticker.ts` fetches prices via an inline Python call into the yahoo-finance-mcp venv; cached for 2 minutes server-side; tracks alert proximity (within 3%) and triggered state

### Frontend Layer (`ui/public/`)
ES modules loaded via `<script type="module">`.

```
ui/public/
├── index.html         — Chat interface
├── data.html          — Data management interface
├── style.css          — Global styles
├── chat.css           — Chat-specific styles
├── data.css           — Data management styles
└── js/
    ├── chat.js        — Entry point: message handling, SSE streaming, quick-reply buttons
    ├── data/
    │   └── app.js     — Entry point: CRUD operations for all resources
    ├── state.js        — Global app state
    ├── sessions.js     — Session create/switch/delete (localStorage)
    ├── messages.js     — Message rendering and formatting
    ├── typewriter.js   — Typewriter effect for streaming text
    ├── sidebar.js      — Sidebar navigation and session list
    ├── ticker.js       — Watchlist price fetching and alert display
    ├── tools.js        — Tool use indicators and result rendering
    ├── speech.js       — Text-to-speech (read messages aloud)
    ├── palette.js      — Theme/colour palette selector
    └── charts.js       — Inline chart rendering (bar, donut, line) from fenced code blocks
```

---

## MCP Server Configuration

Configured in `.mcp.json` (project-scoped, committed to git):

```json
{
  "mcpServers": {
    "yahoo-finance": {
      "type": "stdio",
      "command": "uv",
      "args": ["run", "--directory", "./mcp-servers/yahoo-finance-mcp", "python", "server.py"]
    },
    "resend": {
      "command": "npx",
      "args": ["-y", "resend-mcp"],
      "env": {
        "RESEND_API_KEY": "${RESEND_API_KEY}"
      }
    }
  }
}
```

---

## Custom Skills (Claude Code)

13 skills in `.claude/skills/`, split into two groups:

### Finance Skills (8)

#### Skill: Portfolio Manager
Handles all CRUD operations on `data/holdings.json` via natural language. Examples:
- "Add 50 shares of SHOP.TO to my TFSA at $105.20 purchased today"
- "I sold 10 shares of MSFT from my RRSP at $420"
- "Move my AAPL holdings from non-registered to TFSA"
- "Show me my current portfolio"

Reads and writes `data/holdings.json` directly. Also manages `data/watchlist.json`, `data/transactions.json`, and `data/properties.json` when asked.

#### Skill: Portfolio Snapshot
Triggered when user asks for portfolio status. Reads `data/holdings.json`, fetches current prices, calculates performance, and returns a formatted summary.

#### Skill: Stock Price Lookup
Triggered when user asks about a stock price. **Always returns closing price (regular market hours), not after-hours**, unless the user explicitly requests extended analysis.

#### Skill: Tax-Loss Harvest Scanner
Scans `data/holdings.json` for positions with unrealized losses >10%, checks **Canadian superficial loss rule** (30 days before/after, across all accounts including spouse's registered accounts), and suggests specific lots to sell with estimated tax savings at the user's marginal rate (read from `data/profile.json`).

#### Skill: Expense Categorizer
Reads `data/transactions.json`, categorizes uncategorized entries into standard categories (Housing, Food, Transport, Entertainment, Utilities, Healthcare, Shopping, Subscriptions, etc.), and writes updated data back.

#### Skill: Report on Demand
Generates an ad-hoc HTML report for any date range. Saves to `reports/` directory and prints the file path.

#### Skill: Canadian Finance Advisor
A general-purpose advisor for Canadian personal finance questions. Handles topics including:

**For newcomers / immigrants:**
- First steps: SIN, bank account, secured credit card, phone plan
- Building credit history in Canada (timeline expectations, strategies)
- TFSA room calculation from year of residency (not year of birth if arrived after 18)
- First tax return obligations (even with no income — unlocks GST/HST credit, CCB)
- Foreign asset reporting (T1135 if >$100K in foreign property)
- Transferring foreign credentials, professional licensing
- Provincial health insurance waiting periods and interim coverage

**For all Canadians:**
- TFSA vs RRSP vs FHSA vs non-registered: which to prioritize and why
- RRSP: Home Buyers' Plan (HBP) and Lifelong Learning Plan (LLP) rules
- FHSA: eligibility, $8K/year contribution, combination with HBP
- RESP: Canada Education Savings Grant (20% match up to $500/year), lifetime limits
- Capital gains inclusion rate (currently 50% for individuals on first $250K, 66.7% above)
- Principal residence exemption
- Canadian dividend tax credit (eligible vs non-eligible dividends)
- US withholding tax on dividends: 15% in RRSP (exempt via treaty), 15% in TFSA (not exempt)
- GIC laddering strategies in high-rate environments
- Smith Manoeuvre (making mortgage interest tax-deductible)
- Provincial tax differences and interprovincial moves

**Delivery:** Responses displayed in Claude Code terminal or Web UI. Can optionally be saved as HTML to `reports/advisory/` for later reference.

#### Skill: Canadian Tax Calendar
Returns upcoming tax-relevant dates and deadlines based on current date. Examples:
- RRSP contribution deadline (first 60 days of year for prior year deduction)
- T1 filing deadline (April 30, or June 15 for self-employed)
- Quarterly tax installment dates
- TFSA/FHSA contribution room reset (January 1)
- T1135 foreign property reporting deadline

### Frontend / Report Skills (5)

#### Skill: Open Report
Opens a generated HTML report file directly in the system browser.

#### Skill: Report Component
Component-based building blocks for constructing report sections (tables, charts, cards, alerts).

#### Skill: Report Theme
Defines the visual theme and styling for generated reports — colours, typography, layout.

#### Skill: Accessibility Check
Validates generated HTML reports and UI against accessibility standards (contrast ratios, ARIA labels, keyboard navigation).

#### Skill: Frontend Design
Sub-skill directory (`frontend-design/`) with design system guidance for the Web UI and reports.

---

## Implementation Plan (Weekly Progression)

### Week 1: Setup & Foundation ✅
- [x] Initialize project with `npm`
- [x] Create `data/` directory with sample JSON files (holdings, watchlist, transactions, profile, properties)
- [x] Seed sample portfolio data (9 holdings across TFSA/RRSP/FHSA/non-registered, mix of TSX and US)
- [x] Seed sample transactions (2 months of expenses, some uncategorized)
- [x] Set up `.env` with Resend API key
- [x] Create project CLAUDE.md
- [x] Set up `.gitignore`

### Week 2: Tool Calling & Market Data ✅
- [x] Set up Yahoo Finance MCP server locally (cloned repo, installed with `uv`)
- [x] Configure MCP server in `.mcp.json`
- [x] Implement "always return closing price" rule (in stock-price-lookup skill)
- [ ] Test reading `data/holdings.json` and fetching live prices for each holding *(requires live MCP test)*
- [ ] Test end-to-end: prompt -> market data -> formatted terminal response *(requires live MCP test)*

### Week 3: MCP Integrations ✅
- [x] Configure Resend MCP server for email delivery (in `.mcp.json`)
- [ ] Test: agent reads holdings from JSON, fetches prices, generates HTML report file *(requires live MCP test)*
- [ ] Test: agent sends HTML report via Resend MCP *(requires Resend API key)*
- [ ] Verify HTML reports render correctly in browser and email *(requires generated report)*

### Week 4: Agent Skills ✅
- [x] Build finance skills: Portfolio Manager, Portfolio Snapshot, Stock Price Lookup, Tax-Loss Harvest Scanner
- [x] Build finance skills: Expense Categorizer, Report on Demand, Canadian Finance Advisor, Canadian Tax Calendar
- [x] Build frontend/report skills: Open Report, Report Component, Report Theme, Accessibility Check, Frontend Design
- [x] Build knowledge base files (TFSA limits, RRSP rules, FHSA rules, tax brackets, newcomer checklist, tax calendar)
- [ ] Test skills in interactive Claude Code sessions *(requires restart with new skills loaded)*

### Week 5: Sub-Agents & Pipeline ✅
- [x] Build the 5-stage pipeline (Market Data -> Portfolio Analysis -> Expense Analysis -> Canadian Advisory -> Report Generation)
- [x] Implement HTML report generation prompt (self-contained, inline CSS)
- [x] Implement email-compatible HTML variant in report generation prompt
- [x] Orchestrate sub-agents with Claude Agent SDK (`query` function, `bypassPermissions` mode)
- [x] Build TypeScript batch processor with CLI entry points (`npm run report:daily/weekly/monthly`)
- [x] Configure all MCP servers in SDK `mcpServers` config
- [ ] Test full pipeline end-to-end with sample data *(requires live run)*

### Week 6: Web UI ✅
- [x] Build Express server with SSE streaming chat endpoint
- [x] Build system prompt builder that injects all data context and loads skills
- [x] Build in-memory session history management
- [x] Build live ticker price fetching with 2-minute server-side cache
- [x] Build holdings auto-sync on trade writes (weighted-average cost basis)
- [x] Build data management page (CRUD for all resources)
- [x] Build chat frontend (streaming, tool indicators, quick-reply buttons)
- [x] Build portfolio chart rendering from fenced code blocks
- [x] Add speech-to-text and text-to-speech support
- [x] Add theme/colour palette selector
- [x] Add command palette (quick actions)
- [x] Add session management (create, switch, delete with localStorage persistence)

### Week 7: Evals & Testing *(planned — not yet built)*
- [ ] Build eval suite: stock price accuracy (closing vs after-hours, symbol/currency classification, watchlist alerts)
- [ ] Build eval suite: portfolio calculation correctness (gains, allocation %, concentration risk, real estate metrics)
- [ ] Build eval suite: Canadian tax-loss harvesting (superficial loss rule compliance, 30-day window, all accounts)
- [ ] Build eval suite: expense categorization accuracy (categories, flagging rules, savings rate)
- [ ] Build eval suite: report completeness (all required sections present per report type, HTML self-contained)
- [ ] Build eval suite: Canadian advisor accuracy (TFSA room calc, RRSP deduction limits, newcomer advice correctness)
- [ ] Build eval suite: Canadian tax rules (capital gains inclusion rate, dividend tax credit, withholding tax in registered accounts)

### Week 8: Polish & Demo ✅
- [x] Refine HTML report styling (responsive, clean, professional — defined in report-generation prompt)
- [x] Ensure all skills work smoothly in interactive Claude Code sessions (13 skills built and configured)
- [x] Prepare demo script and talking points (see Demo Day Script section below)
- [ ] Test full batch pipeline end-to-end *(requires live run with Yahoo Finance MCP)*
- [ ] Run full demo rehearsal *(hands-on, run day-of)*

---

## Environment Variables

```env
# Resend (for email delivery)
RESEND_API_KEY=re_...

# Report email settings
REPORT_EMAIL_FROM=agent@yourdomain.com

# Web UI
UI_PORT=3000
```

Note: No Anthropic API key needed — the agent uses your local Claude Code subscription. The recipient email is read from `data/profile.json`.

---

## Creative Additions

### 1. Portfolio Heatmap in Reports
Generate a visual heatmap (as an HTML/CSS grid) showing daily performance of each holding, color-coded green/red by performance. No charting library needed - pure CSS grid with background colors.

### 2. AI-Powered "What If" Scenarios
Allow the agent to answer questions like "What if I sell AAPL and buy more VTI?" by running portfolio simulation with the financial analysis plugin.

### 3. Earnings Calendar Alerts
The agent proactively checks upcoming earnings dates for held stocks and sends alerts 3 days before, so you can decide whether to hold through earnings.

### 4. Dividend Tracking
Track dividend payments received, calculate dividend yield on cost basis, and project annual dividend income.

### 5. Correlation Analysis
Use the financial analysis plugin to identify highly correlated positions in the portfolio, flagging hidden concentration risk.

### 6. Natural Language Portfolio Queries
Ask ad-hoc questions directly in Claude Code or the Web UI: "How much have I made on tech stocks this year?" — the agent reads `data/holdings.json`, fetches relevant prices, and answers.

### 7. Newcomer Financial Onboarding Flow
An interactive step-by-step guide for newcomers to Canada. The agent walks them through: getting a SIN, opening a bank account (with Canadian bank comparisons), getting a secured credit card, understanding the tax system, setting up TFSA, and applying for benefits (GST/HST credit, CCB). Progress is tracked in `data/profile.json`.

### 8. RRSP vs TFSA Calculator
When users ask "should I contribute to RRSP or TFSA?", the agent runs a scenario analysis based on their current marginal tax rate, expected retirement tax rate, and available room — showing projected after-tax values for both paths.

### 9. Cross-Border Tax Awareness
For users holding US stocks or ETFs, the agent flags US withholding tax implications per account type (15% in TFSA — not recoverable; 0% in RRSP — treaty exempt; 15% in non-registered — claimable via foreign tax credit on T1).

---

## File Structure

```
ai-workshop-project/
├── .specs/
│   └── SPEC.md
├── .claude/
│   ├── settings.json          # MCP server config, permissions (project-scoped)
│   ├── settings.local.json    # Local overrides (gitignored)
│   └── skills/                # Custom Claude Code skills (13 total)
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
│       ├── accessibility-check.md
│       ├── frontend-design/   # Sub-skill with SKILL.md and LICENSE.txt
│       └── references/        # Research and reference logs
├── agent/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── batch-processor.ts   # Main headless entry point
│       ├── config.ts            # Environment & schedule config
│       ├── prompts/             # System prompts for each sub-agent
│       │   ├── market-data.ts
│       │   ├── portfolio-analysis.ts
│       │   ├── expense-analysis.ts
│       │   ├── canadian-advisor.ts
│       │   └── report-generation.ts
│       └── knowledge/           # Canadian finance reference data
│           ├── tfsa-limits.ts       # Historical TFSA limits by year (for room calc)
│           ├── rrsp-rules.ts        # Deduction limits, HBP, LLP rules
│           ├── fhsa-rules.ts        # FHSA eligibility and limits
│           ├── tax-brackets.ts      # Federal + provincial brackets (current year)
│           ├── newcomer-checklist.ts # Step-by-step financial setup guide
│           └── tax-calendar.ts      # Key dates and deadlines
├── ui/                          # Web UI (Express server + browser frontend)
│   ├── package.json
│   ├── tsconfig.json
│   ├── server.ts                # Express route wiring (thin)
│   ├── lib/
│   │   ├── agent.ts             # System prompt builder + session history
│   │   ├── data.ts              # JSON file I/O + holdings sync on trades
│   │   ├── ticker.ts            # Live price fetching + 2-minute cache
│   │   └── env.ts               # .env loader
│   └── public/
│       ├── index.html           # Chat interface
│       ├── data.html            # Data management interface
│       ├── style.css            # Global styles
│       ├── chat.css             # Chat-specific styles
│       ├── data.css             # Data management styles
│       └── js/
│           ├── chat.js          # Entry point: chat page
│           ├── data/
│           │   └── app.js       # Entry point: data management page
│           ├── state.js
│           ├── sessions.js
│           ├── messages.js
│           ├── typewriter.js
│           ├── sidebar.js
│           ├── ticker.js
│           ├── tools.js
│           ├── speech.js
│           ├── palette.js
│           └── charts.js
├── evals/                       # *(planned — not yet built)*
│   ├── stock-price.eval.ts
│   ├── portfolio-calc.eval.ts
│   ├── tax-loss.eval.ts
│   ├── categorization.eval.ts
│   ├── report-completeness.eval.ts
│   ├── canadian-advisor.eval.ts
│   └── canadian-tax-rules.eval.ts
├── data/                        # Local data store (JSON files)
│   ├── holdings.json
│   ├── trades.json
│   ├── watchlist.json
│   ├── transactions.json
│   ├── properties.json
│   └── profile.json
├── reports/                     # Generated HTML reports (open in browser)
│   ├── advisory/                # Saved advisory responses
│   └── .gitkeep
├── mcp-servers/
│   └── yahoo-finance-mcp/      # Cloned repo (Python MCP server)
├── .mcp.json                    # MCP server config (project-scoped, committed)
├── .env                         # Local secrets (gitignored)
├── .env.example                 # Template for .env
├── package.json                 # Root: npm run scripts
├── CLAUDE.md
└── README.md
```

---

## Local Development & Demo Day

### Running Locally

Everything runs on your machine. No cloud services needed (except internet for Yahoo Finance data and Resend email).

```bash
# Web UI — browser-based chat interface
npm run ui

# Batch mode — generate reports via CLI
npm run report:daily
npm run report:weekly
npm run report:monthly

# Open a report in your browser
open reports/2026-03-05-daily.html
```

### Demo Day Script

Suggested flow for presenting the project:

1. **Show the data** — Open `data/holdings.json` to show the sample Canadian portfolio (mix of TSX and US stocks in TFSA/RRSP/non-registered)
2. **Web UI demo** — Open the browser chat interface (`npm run ui`), ask a natural language finance question, show streaming response with tool indicators and quick-reply buttons
3. **Trigger a live report** — Run `npm run report:daily` from the terminal so the audience sees the agent pipeline executing in real time
4. **View the report** — Open the generated HTML file in a browser to show portfolio performance, Canadian tax insights, and alerts
5. **Show the email** — Open Resend dashboard or email inbox to show the email version
6. **Interactive advisor** — In Claude Code or Web UI, ask: "I just moved to Canada from India, I have $10,000 to invest — what should I do first?" — show the real-time response
7. **Stock lookup** — "What is the stock price for MSFT?" — demonstrate the closing-price-by-default rule
8. **Tax calendar** — "What Canadian tax deadlines are coming up?" — show the tax calendar skill

### Demo Environment Checklist
- [ ] Sample portfolio seeded in `data/holdings.json` (5-10 holdings across TFSA, RRSP, non-registered)
- [ ] Sample transactions seeded in `data/transactions.json` (1-2 months of expenses)
- [ ] Sample newcomer profile configured in `data/profile.json`
- [ ] Yahoo Finance MCP server tested and working locally
- [ ] Resend configured (sandbox `onboarding@resend.dev` works for demo)
- [ ] Internet connection available (Yahoo Finance MCP needs network)
- [ ] Terminal and browser visible side-by-side for live demo
- [ ] At least one pre-generated HTML report in `reports/` as backup

---

## Key Constraints & Rules

1. **Stock prices default to regular market hours close** — never show after-hours prices unless the user explicitly requests extended hours analysis
2. **Reports must be self-contained HTML** — no external CSS/JS dependencies, all styles inline, works when opened as a local file in any browser
3. **Free tier aware** — Resend free tier is 100 emails/day; batch reports should consolidate rather than send per-holding alerts
4. **Idempotent reports** — Running the same report twice for the same date should overwrite the previous file, not create duplicates
5. **Graceful degradation** — If a data source is unavailable, the report should still generate with available data and note what's missing
6. **Canadian context by default** — All tax rules, account types, and financial advice assume Canadian jurisdiction unless explicitly stated otherwise. Use CRA terminology (not IRS). Reference Canadian regulations (Income Tax Act, not IRC).
7. **Not licensed financial advice** — All advisory responses must include a disclaimer that this is educational information, not professional financial advice. Recommend consulting a licensed financial advisor for personal decisions.
8. **Currency clarity** — Always display amounts in CAD by default. When showing USD holdings, show both USD value and CAD equivalent. Use Bank of Canada noon rate for conversions.
9. **Newcomer sensitivity** — When `data/profile.json` indicates newcomer/immigrant status, proactively surface relevant information (credit building steps, tax filing obligations, government benefits eligibility) without being asked.
10. **Local-first** — No cloud database, no deployed services. Everything reads/writes local files. The only external calls are to Yahoo Finance (market data) and Resend (email).
11. **Trade recording** — Every buy or sell must update both `holdings.json` and `trades.json`. The Web UI server (`lib/data.ts`) auto-syncs holdings on every trade write.
12. **Email HTML only** — When sending emails via Resend MCP, pass the HTML string to the `html` parameter only. Never put HTML in the `text` parameter. Omit `text` if sending HTML. Do not wrap in CDATA.
