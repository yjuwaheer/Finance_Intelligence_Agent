// ─────────────────────────────────────────────────────────────────────────────
// js/data/schemas.js — Data schema definitions for the Manage Data page
//
// Pure configuration — no DOM, no fetch, no state.
// Each schema entry drives the sidebar nav, table columns, and form fields
// for its resource. Changing a schema here automatically updates every part
// of the UI that renders that resource.
// ─────────────────────────────────────────────────────────────────────────────

export const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];

export const ACCOUNTS = [
  { v: 'tfsa',           l: 'TFSA — Tax-Free Savings Account' },
  { v: 'rrsp',           l: 'RRSP — Registered Retirement Savings Plan' },
  { v: 'fhsa',           l: 'FHSA — First Home Savings Account' },
  { v: 'resp',           l: 'RESP — Registered Education Savings Plan' },
  { v: 'non_registered', l: 'Non-Registered (Taxable)' },
  { v: 'lira',           l: 'LIRA — Locked-In Retirement Account' },
  { v: 'corporate',      l: 'Corporate Account' },
];

export const CATEGORIES = [
  'Housing','Food','Transport','Healthcare','Utilities',
  'Subscriptions','Income','Entertainment','Personal','Other',
];

// ── Helpers used inside schema definitions ────────────────────────────────────

/** Returns the short account label (e.g. "TFSA") for a given account value. */
export function acctLabel(v) {
  return ACCOUNTS.find(a => a.v === v)?.l.split(' — ')[0] ?? (v ?? '—');
}

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ── Formatters ────────────────────────────────────────────────────────────────

export const fmt = {
  currency: v => v == null
    ? '—'
    : new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(v),
  // Append T00:00:00 so the Date is parsed as local time, not UTC midnight
  // (which would shift the day by one in negative-offset timezones)
  date: v => v
    ? new Date(v + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—',
  num: v => v == null ? '—' : Number(v).toLocaleString('en-CA'),
};

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Schema map ────────────────────────────────────────────────────────────────

/**
 * Each key maps to a resource's complete schema:
 *   kind          — 'object' (single record) or 'array' (list)
 *   resource      — API path segment and data key (arrays only)
 *   sectionTitle  — H2 heading in the content area
 *   eyebrow       — small caps label above the heading
 *   columns       — table column headers (arrays only)
 *   rowCells(row) — returns an array of HTML strings for each row (arrays only)
 *   fields        — field definitions used by renderField() and collectFormData()
 */
export const SCHEMAS = {
  profile: {
    kind: 'object',
    sectionTitle: 'Your Profile',
    eyebrow: 'PROFILE',
    fields: [
      { key: 'name',                   label: 'Full Name',                    type: 'text',     required: true,  placeholder: 'Your legal name' },
      { key: 'email',                  label: 'Email Address',                type: 'email',    required: true,  placeholder: 'you@example.com' },
      { key: 'province',               label: 'Province / Territory',         type: 'select',   options: PROVINCES.map(p => ({ v: p, l: p })) },
      { key: 'residency_status',       label: 'Residency Status',             type: 'select',   options: [
        { v: 'citizen',            l: 'Canadian Citizen' },
        { v: 'permanent_resident', l: 'Permanent Resident' },
        { v: 'work_permit',        l: 'Work Permit Holder' },
        { v: 'student',            l: 'Student Visa' },
        { v: 'newcomer',           l: 'Newcomer (< 1 year)' },
      ]},
      { key: 'arrival_date',           label: 'Arrival Date in Canada',       type: 'date',     hint: 'Leave blank if born in Canada' },
      { key: 'annual_income_bracket',  label: 'Annual Income Range',          type: 'select',   options: [
        { v: 'under_50k',  l: 'Under $50K' },
        { v: '50k_100k',   l: '$50K – $100K' },
        { v: '100k_150k',  l: '$100K – $150K' },
        { v: '150k_250k',  l: '$150K – $250K' },
        { v: 'over_250k',  l: 'Over $250K' },
      ]},
      { key: 'tfsa_contribution_room', label: 'TFSA Contribution Room ($)',   type: 'number',   min: 0, step: 500 },
      { key: 'rrsp_contribution_room', label: 'RRSP Contribution Room ($)',   type: 'number',   min: 0, step: 100 },
      { key: 'fhsa_contribution_room', label: 'FHSA Contribution Room ($)',   type: 'number',   min: 0, step: 8000 },
      { key: 'has_employer_match',     label: 'Has Employer RRSP Match?',     type: 'checkbox' },
      { key: 'employer_match_details', label: 'Employer Match Details',       type: 'text',     placeholder: 'e.g. 50% match up to 5% of salary', dependsOn: 'has_employer_match' },
    ],
  },

  holdings: {
    kind: 'array',
    resource: 'holdings',
    sectionTitle: 'Holdings',
    eyebrow: 'PORTFOLIO',
    columns: ['Symbol', 'Account', 'Qty', 'Cost Basis', 'Currency', 'Type', 'Purchased'],
    rowCells: h => [
      `<span class="mono-badge">${esc(h.symbol)}</span>`,
      acctLabel(h.account),
      fmt.num(h.quantity),
      fmt.currency(h.cost_basis),
      esc(h.currency ?? 'CAD'),
      capitalize(h.asset_type ?? ''),
      fmt.date(h.purchase_date),
    ],
    fields: [
      { key: 'symbol',        label: 'Ticker Symbol',      type: 'text',   required: true, placeholder: 'XEQT.TO', transform: v => v.toUpperCase() },
      { key: 'asset_type',    label: 'Asset Type',         type: 'select', options: [
        { v: 'stock', l: 'Stock' }, { v: 'etf', l: 'ETF' }, { v: 'bond', l: 'Bond' },
        { v: 'crypto', l: 'Crypto' }, { v: 'cash', l: 'Cash' },
      ]},
      { key: 'quantity',      label: 'Quantity (Shares)',   type: 'number', required: true, min: 0, step: '0.001' },
      { key: 'cost_basis',    label: 'Cost Per Share',      type: 'number', required: true, min: 0, step: '0.01', placeholder: '0.00' },
      { key: 'purchase_date', label: 'Purchase Date',       type: 'date' },
      { key: 'account',       label: 'Account Type',        type: 'select', options: ACCOUNTS },
      { key: 'currency',      label: 'Currency',            type: 'select', options: [{ v: 'CAD', l: 'CAD' }, { v: 'USD', l: 'USD' }] },
      { key: 'notes',         label: 'Notes',               type: 'textarea', placeholder: 'Optional notes…' },
    ],
  },

  watchlist: {
    kind: 'array',
    resource: 'watchlist',
    sectionTitle: 'Watchlist',
    eyebrow: 'PRICE ALERTS',
    columns: ['Symbol', 'Alert Price', 'Condition', 'Notes'],
    rowCells: w => [
      `<span class="mono-badge">${esc(w.symbol)}</span>`,
      fmt.currency(w.target_price),
      w.alert_condition === 'above' ? 'Above target'
        : w.alert_condition === 'below' ? 'Below target'
        : esc(w.alert_condition ?? ''),
      `<span class="cell-muted">${esc(w.notes ?? '—')}</span>`,
    ],
    fields: [
      { key: 'symbol',          label: 'Ticker Symbol',      type: 'text',   required: true, placeholder: 'SHOP.TO', transform: v => v.toUpperCase() },
      { key: 'target_price',    label: 'Alert Price ($)',     type: 'number', required: true, min: 0, step: '0.01' },
      { key: 'alert_condition', label: 'Alert When Price Is', type: 'select', options: [
        { v: 'below', l: 'Below target price' },
        { v: 'above', l: 'Above target price' },
      ]},
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes…' },
    ],
  },

  transactions: {
    kind: 'array',
    resource: 'transactions',
    sectionTitle: 'Transactions',
    eyebrow: 'INCOME & EXPENSES',
    columns: ['Date', 'Description', 'Merchant', 'Category', 'Amount'],
    rowCells: t => {
      const amt    = parseFloat(t.amount) || 0;
      const colour = amt >= 0 ? 'var(--up)' : 'var(--down)';
      const sign   = amt >= 0 ? '+' : '';
      return [
        fmt.date(t.date),
        esc(t.description ?? ''),
        `<span class="cell-muted">${esc(t.merchant ?? '—')}</span>`,
        t.category
          ? `<span class="cat-pill">${esc(t.category)}</span>`
          : `<span class="cell-muted">Uncategorized</span>`,
        `<span style="color:${colour};font-family:var(--mono)">${sign}${fmt.currency(Math.abs(amt))}</span>`,
      ];
    },
    fields: [
      { key: 'date',        label: 'Date',              type: 'date',   required: true },
      { key: 'amount',      label: 'Amount ($)',         type: 'number', required: true, step: '0.01', hint: 'Negative for expenses (e.g. -92.45), positive for income' },
      { key: 'description', label: 'Description',       type: 'text',   required: true, placeholder: 'e.g. Loblaws grocery run' },
      { key: 'merchant',    label: 'Merchant / Payee',  type: 'text',   placeholder: 'e.g. Loblaws' },
      { key: 'category',    label: 'Category',          type: 'select', options: [{ v: '', l: '— Uncategorized —' }, ...CATEGORIES.map(c => ({ v: c, l: c }))] },
      { key: 'is_flagged',  label: 'Flag for Review?',  type: 'checkbox' },
      { key: 'flag_reason', label: 'Flag Reason',       type: 'text',   placeholder: 'Why is this flagged?', dependsOn: 'is_flagged' },
    ],
  },

  trades: {
    kind: 'array',
    resource: 'trades',
    sectionTitle: 'Trade History',
    eyebrow: 'REALIZED GAINS & LOSSES',
    columns: ['Date', 'Action', 'Symbol', 'Qty', 'Price', 'Total', 'Realized G/L', 'Account'],
    rowCells: t => {
      const action  = t.action === 'buy' ? 'buy' : 'sell';
      const acColor = action === 'buy' ? 'var(--up)' : 'var(--down)';
      const gl      = parseFloat(t.realized_gain_loss) || 0;
      const glColor = gl > 0 ? 'var(--up)' : gl < 0 ? 'var(--down)' : 'var(--text-3)';
      const glText  = action === 'buy'
        ? '<span style="color:var(--text-3)">—</span>'
        : `<span style="color:${glColor};font-family:var(--mono)">${gl >= 0 ? '+' : ''}${fmt.currency(gl)}</span>`;
      return [
        fmt.date(t.date),
        `<span style="color:${acColor};font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase">${esc(action)}</span>`,
        `<span class="mono-badge">${esc(t.symbol)}</span>`,
        fmt.num(t.quantity),
        `<span style="font-family:var(--mono)">${fmt.currency(t.price)}</span>`,
        `<span style="font-family:var(--mono)">${fmt.currency(t.total)}</span>`,
        glText,
        acctLabel(t.account),
      ];
    },
    fields: [
      { key: 'date',                 label: 'Trade Date',                  type: 'date',     required: true },
      { key: 'action',               label: 'Action',                      type: 'select',   required: true, options: [{ v: 'buy', l: 'Buy' }, { v: 'sell', l: 'Sell' }] },
      { key: 'symbol',               label: 'Ticker Symbol',               type: 'text',     required: true, placeholder: 'MSFT', transform: v => v.toUpperCase() },
      { key: 'quantity',             label: 'Quantity (Shares)',            type: 'number',   required: true, min: 0, step: '0.001' },
      { key: 'price',                label: 'Price Per Share',              type: 'number',   required: true, min: 0, step: '0.01' },
      { key: 'total',                label: 'Total Proceeds / Cost ($)',    type: 'number',   min: 0, step: '0.01', hint: 'quantity × price ± fees' },
      { key: 'fees',                 label: 'Fees / Commission ($)',        type: 'number',   min: 0, step: '0.01' },
      { key: 'account',              label: 'Account',                      type: 'select',   options: ACCOUNTS },
      { key: 'currency',             label: 'Currency',                     type: 'select',   options: [{ v: 'CAD', l: 'CAD' }, { v: 'USD', l: 'USD' }] },
      { key: 'cost_basis_per_share', label: 'ACB Per Share (sells only)',   type: 'number',   min: 0, step: '0.01', hint: 'Your adjusted cost base per share at time of sale. Leave blank for buys.' },
      { key: 'realized_gain_loss',   label: 'Realized Gain / Loss ($)',     type: 'number',   step: '0.01', hint: 'Auto-calculated: (price − ACB) × qty. Negative = loss. Leave blank for buys.' },
      { key: 'notes',                label: 'Notes',                        type: 'textarea', placeholder: 'Optional notes…' },
    ],
  },

  properties: {
    kind: 'array',
    resource: 'properties',
    sectionTitle: 'Properties',
    eyebrow: 'REAL ESTATE',
    columns: ['Address', 'Purchase Price', 'Current Value', 'Net Monthly'],
    rowCells: p => {
      const net    = (parseFloat(p.monthly_rental_income) || 0) - (parseFloat(p.monthly_expenses) || 0);
      const colour = net >= 0 ? 'var(--up)' : 'var(--down)';
      return [
        esc(p.address ?? ''),
        fmt.currency(p.purchase_price),
        fmt.currency(p.current_value),
        `<span style="color:${colour};font-family:var(--mono)">${fmt.currency(net)}</span>`,
      ];
    },
    fields: [
      { key: 'address',               label: 'Property Address',               type: 'text',   required: true, placeholder: '123 Main St, Unit 101, Toronto, ON' },
      { key: 'purchase_price',        label: 'Purchase Price ($)',              type: 'number', min: 0, step: 1000 },
      { key: 'current_value',         label: 'Estimated Current Value ($)',     type: 'number', min: 0, step: 1000 },
      { key: 'monthly_rental_income', label: 'Monthly Rental Income ($)',       type: 'number', min: 0, step: 50, hint: 'Enter 0 if owner-occupied' },
      { key: 'monthly_expenses',      label: 'Monthly Expenses ($)',            type: 'number', min: 0, step: 50, hint: 'Mortgage, condo fees, taxes, insurance, maintenance' },
      { key: 'purchase_date',         label: 'Purchase Date',                   type: 'date' },
      { key: 'notes',                 label: 'Notes',                           type: 'textarea', placeholder: 'Optional notes…' },
    ],
  },
};
