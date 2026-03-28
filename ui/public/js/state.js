// ─────────────────────────────────────────────────────────────────────────────
// state.js — Shared mutable state + constants
//
// All runtime state lives here so every module reads the same values.
// Reads:  import the exported `let` binding — ES modules give a live reference.
// Writes: call the provided setter so updates are consistent and debuggable.
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

export const TYPEWRITER_MS       = 8;        // ms between tokens in the typewriter effect
export const FINALIZE_POLL_MS    = 30;       // polling interval while draining the typewriter queue
export const TEXTAREA_MAX_HEIGHT = 150;      // px — max height for the input textarea
export const MOBILE_BREAKPOINT   = 767;      // px — viewport width at which mobile layout kicks in
export const TICKER_REFRESH_MS   = 2 * 60_000; // ms — live price auto-refresh interval

export const MAX_MSGS_STORED    = 40;        // max message elements persisted in localStorage
export const SESSIONS_INDEX_KEY = 'fin-sessions';
export const MAX_SESSIONS       = 20;

/** Maps internal MCP tool names to human-readable status labels. */
export const TOOL_LABELS = {
  'mcp__yahoo-finance__get_stock_info':              'fetching stock info',
  'mcp__yahoo-finance__get_historical_stock_prices': 'loading price history',
  'mcp__yahoo-finance__get_yahoo_finance_news':      'fetching market news',
  'mcp__yahoo-finance__get_financial_statement':     'loading financial data',
  'mcp__yahoo-finance__get_holder_info':             'fetching holder info',
  'mcp__yahoo-finance__get_option_chain':            'loading options chain',
  'mcp__yahoo-finance__get_recommendations':         'fetching analyst ratings',
  'mcp__yahoo-finance__get_stock_actions':           'loading dividends & splits',
  'mcp__resend__send-email':                         'sending email',
  'mcp__resend__send-batch-emails':                  'sending emails',
};

/** Returns a readable label for a tool name, falling back to the bare tool name. */
export const toolLabel = (name) =>
  TOOL_LABELS[name] ?? name.replace(/^mcp__[^_]+__/, '').replace(/_/g, ' ');

// ── Session identity ──────────────────────────────────────────────────────────

let _sid = sessionStorage.getItem('fin-sid') || '';
if (!_sid) { _sid = crypto.randomUUID(); sessionStorage.setItem('fin-sid', _sid); }

export let sessionId   = _sid;
export let msgStoreKey = `fin-msgs-${_sid}`;

/** Updates the active session ID and its derived localStorage key. */
export function setSession(id) {
  sessionId   = id;
  msgStoreKey = `fin-msgs-${id}`;
  sessionStorage.setItem('fin-sid', id);
}

// ── Streaming state ───────────────────────────────────────────────────────────

export let isStreaming     = false;
export let abortController = null;  // AbortController for the active SSE fetch
export let currentBubble   = null;  // .msg-agent-body element being streamed into
export let currentTools    = null;  // .tool-log container for the active message

export function setIsStreaming(v)      { isStreaming     = v; }
export function setAbortController(v) { abortController = v; }
export function setCurrentBubble(el)  { currentBubble   = el; }
export function setCurrentTools(el)   { currentTools    = el; }

// ── Typewriter state ──────────────────────────────────────────────────────────

export let streamText = '';   // accumulated markdown for the in-progress render
export let typeQueue  = [];   // pending text chunks waiting to be typed
export let isTyping   = false;

export function setStreamText(v)  { streamText = v; }
export function setIsTyping(v)    { isTyping   = v; }
export function pushToQueue(v)    { typeQueue.push(v); }
export function shiftFromQueue()  { return typeQueue.shift(); }

export function resetTypewriterState() {
  streamText = '';
  typeQueue  = [];
  isTyping   = false;
}

// ── Tool tracking ─────────────────────────────────────────────────────────────

/** Maps toolId → .tool-line DOM element for in-progress tool calls. */
export const activeTools = new Map();
