// ─────────────────────────────────────────────────────────────────────────────
// palette.js — ⌘K command palette
//
// Opens a filterable command palette. Commands fall into two categories:
//   - Quick-send prompts  (fire a message into the chat)
//   - App actions         (new session, navigate)
//
// Keyboard: ⌘K to open · ↑↓ to navigate · Enter to run · Escape to close
// ─────────────────────────────────────────────────────────────────────────────

const COMMANDS = [
  {
    id: 'portfolio',
    label: 'Portfolio Snapshot',
    desc: 'Live prices · performance · alerts',
    type: 'prompt',
    prompt: 'What does my portfolio look like right now? Fetch live prices for all holdings.',
  },
  {
    id: 'tax-loss',
    label: 'Tax Loss Scanner',
    desc: 'Superficial loss rule · opportunities',
    type: 'prompt',
    prompt: 'Scan my portfolio for tax-loss harvesting opportunities using the Canadian superficial loss rule.',
  },
  {
    id: 'expenses',
    label: 'Expense Analysis',
    desc: 'Breakdown · savings rate · flags',
    type: 'prompt',
    prompt: 'Analyze my recent expenses and give me a savings rate breakdown.',
  },
  {
    id: 'advisory',
    label: 'Finance Advisory',
    desc: 'TFSA · RRSP · FHSA · CRA guidance',
    type: 'prompt',
    prompt: 'What Canadian finance actions should I take or be aware of this month?',
  },
  {
    id: 'tax-calendar',
    label: 'Tax Calendar',
    desc: 'Upcoming CRA deadlines',
    type: 'prompt',
    prompt: 'What are my upcoming CRA tax deadlines?',
  },
  {
    id: 'email-report',
    label: 'Email Report',
    desc: 'Send comprehensive finance report',
    type: 'prompt',
    prompt: 'Send me a comprehensive general finance report to my email.',
  },
  {
    id: 'new-session',
    label: 'New Session',
    desc: 'Start a fresh conversation',
    type: 'action',
    shortcut: '⌥N',
    action: () => document.dispatchEvent(new CustomEvent('app:newChat')),
  },
  {
    id: 'manage-data',
    label: 'Manage Data',
    desc: 'Edit portfolio, trades, profile',
    type: 'action',
    action: () => { window.location.href = '/data'; },
  },
];

// ── State ─────────────────────────────────────────────────────────────────────

let activeIdx  = 0;
let filtered   = [];

// ── DOM refs (resolved on first open) ─────────────────────────────────────────

let overlay, input, list;

function resolve() {
  overlay = document.getElementById('palette-overlay');
  input   = document.getElementById('palette-input');
  list    = document.getElementById('palette-list');
}

// ── Render ────────────────────────────────────────────────────────────────────

function render(query) {
  const q = query.toLowerCase();
  filtered = q
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
    : COMMANDS;

  activeIdx = 0;

  list.innerHTML = filtered.map((cmd, i) => `
    <button class="pal-item${i === 0 ? ' pal-active' : ''}" data-idx="${i}">
      <span class="pal-label">${esc(cmd.label)}</span>
      <span class="pal-desc">${esc(cmd.desc)}</span>
      ${cmd.shortcut ? `<kbd class="pal-kbd">${esc(cmd.shortcut)}</kbd>` : ''}
    </button>`).join('');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setActive(idx) {
  const items = list.querySelectorAll('.pal-item');
  items[activeIdx]?.classList.remove('pal-active');
  activeIdx = Math.max(0, Math.min(idx, filtered.length - 1));
  const next = items[activeIdx];
  next?.classList.add('pal-active');
  next?.scrollIntoView({ block: 'nearest' });
}

// ── Run a command ─────────────────────────────────────────────────────────────

function run(cmd) {
  close();
  if (cmd.type === 'prompt') {
    document.dispatchEvent(new CustomEvent('app:quickSend', { detail: cmd.prompt }));
  } else {
    cmd.action();
  }
}

// ── Open / close ──────────────────────────────────────────────────────────────

function open() {
  if (!overlay) resolve();
  render('');
  input.value = '';
  overlay.hidden = false;
  input.focus();
}

function close() {
  if (!overlay) return;
  overlay.hidden = true;
}

// ── Keyboard handling inside the palette ──────────────────────────────────────

function onKeydown(e) {
  if (e.key === 'Escape')     { e.preventDefault(); close(); return; }
  if (e.key === 'ArrowDown')  { e.preventDefault(); setActive(activeIdx + 1); return; }
  if (e.key === 'ArrowUp')    { e.preventDefault(); setActive(activeIdx - 1); return; }
  if (e.key === 'Enter')      { e.preventDefault(); if (filtered[activeIdx]) run(filtered[activeIdx]); }
}

// ── Public init ───────────────────────────────────────────────────────────────

export function initPalette() {
  resolve();

  // Filter as user types
  input.addEventListener('input', () => render(input.value));

  // Keyboard nav
  input.addEventListener('keydown', onKeydown);

  // Click on item
  list.addEventListener('click', e => {
    const btn = e.target.closest('.pal-item');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (filtered[idx]) run(filtered[idx]);
  });

  // Hover → update active
  list.addEventListener('mousemove', e => {
    const btn = e.target.closest('.pal-item');
    if (btn) setActive(parseInt(btn.dataset.idx, 10));
  });

  // Click backdrop to close
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  // ⌘K (or Ctrl+K on non-Mac) to open/close from anywhere
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
      e.preventDefault();
      overlay?.hidden === false ? close() : open();
    }
  });
}
