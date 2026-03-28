// ─────────────────────────────────────────────────────────────────────────────
// messages.js — DOM factories for chat messages
//
// Pure DOM rendering only — no session logic, no streaming state.
// The welcome screen cards use data-action/data-prompt attributes;
// chat.js wires up the delegated click listener on #messages.
// ─────────────────────────────────────────────────────────────────────────────

// ── Utilities ─────────────────────────────────────────────────────────────────

export function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function scrollToBottom() {
  const el = document.getElementById('messages');
  if (el) el.scrollTop = el.scrollHeight;
}

export function hideWelcome() {
  document.getElementById('welcome')?.remove();
}

// ── Message elements ──────────────────────────────────────────────────────────

/** Appends a user bubble to the messages container. */
export function appendUserMessage(text) {
  hideWelcome();
  const msgs = document.getElementById('messages');
  const el   = document.createElement('div');
  el.className = 'msg-user';
  el.innerHTML = `<div class="msg-user-inner">${escapeHtml(text)}</div>`;
  msgs.appendChild(el);
  scrollToBottom();
}

/**
 * Creates the agent message skeleton (header + tool log + streaming body)
 * and appends it to the messages container.
 * Returns references to the two live-updated child elements.
 */
export function createAgentMessage() {
  const msgs    = document.getElementById('messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-agent';
  wrapper.innerHTML = `
    <div class="msg-agent-header">
      <span class="msg-agent-badge">Finance Agent</span>
      <span class="msg-agent-rule"></span>
    </div>
    <div class="tool-log"></div>
    <div class="msg-agent-body streaming">
      <div class="stream-thinking"><span></span><span></span><span></span></div>
    </div>`;
  msgs.appendChild(wrapper);
  scrollToBottom();
  return {
    bubble:  wrapper.querySelector('.msg-agent-body'),
    toolLog: wrapper.querySelector('.tool-log'),
  };
}

/** Replaces the messages pane with the welcome screen. */
export function showWelcome() {
  document.getElementById('messages').innerHTML = `
    <div class="welcome" id="welcome">
      <div class="w-eyebrow">PERSONAL FINANCE INTELLIGENCE — CANADA</div>
      <h1 class="w-title"><em>Your money,</em><br>understood.</h1>
      <div class="w-rule"></div>
      <p class="w-sub">Portfolio analysis, tax optimization, and Canadian finance guidance — powered by your own Claude subscription.</p>
      <div class="w-grid">
        <button class="w-card" data-action="quick-send"
          data-prompt="What does my portfolio look like right now? Fetch live prices for all holdings.">
          <span class="wc-num">01</span>
          <span class="wc-title">Portfolio Snapshot</span>
          <span class="wc-desc">Live prices · Performance · Alerts</span>
        </button>
        <button class="w-card" data-action="quick-send"
          data-prompt="Scan my portfolio for tax-loss harvesting opportunities using the Canadian superficial loss rule.">
          <span class="wc-num">02</span>
          <span class="wc-title">Tax Loss Scanner</span>
          <span class="wc-desc">Superficial loss rule · Opportunities</span>
        </button>
        <button class="w-card" data-action="quick-send"
          data-prompt="Analyze my recent expenses and give me a savings rate breakdown.">
          <span class="wc-num">03</span>
          <span class="wc-title">Expense Analysis</span>
          <span class="wc-desc">Breakdown · Savings rate · Flags</span>
        </button>
        <button class="w-card" data-action="quick-send"
          data-prompt="What Canadian finance actions should I take or be aware of this month?">
          <span class="wc-num">04</span>
          <span class="wc-title">Finance Advisory</span>
          <span class="wc-desc">TFSA · RRSP · FHSA · CRA guidance</span>
        </button>
      </div>
    </div>`;
}

/** Appends an error toast to the messages container. */
export function showError(message) {
  const msgs = document.getElementById('messages');
  const el   = document.createElement('div');
  el.className = 'msg-error';
  el.innerHTML = `<div class="msg-error-inner">⚠ ${escapeHtml(message)}</div>`;
  msgs.appendChild(el);
  scrollToBottom();
}
