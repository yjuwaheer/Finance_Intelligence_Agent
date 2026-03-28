// ─────────────────────────────────────────────────────────────────────────────
// ticker.js — Watchlist ticker strip
//
// Responsibilities:
//   - Show watchlist symbols immediately on load (no price, just labels)
//   - Enrich with live prices + day-change % from /api/ticker
//   - Highlight symbols that have triggered or are near their alert target
//   - Auto-refresh prices every TICKER_REFRESH_MS
// ─────────────────────────────────────────────────────────────────────────────

import { TICKER_REFRESH_MS } from './state.js';

// ── HTML builder ──────────────────────────────────────────────────────────────

/**
 * Builds the repeating marquee HTML from an array of TickerItems.
 * Items without a price show symbol only; items with a price show
 * price + day-change % with colour coding and alert highlighting.
 */
function buildTickerContent(items) {
  const parts = items.map(item => {
    const alertCls = item.alertState === 'triggered' ? ' t-alert'
                   : item.alertState === 'near'      ? ' t-near'
                   : '';
    if (item.price == null) {
      return `<span class="t-item${alertCls}">${item.symbol}</span><span class="t-sep">·</span>`;
    }
    const sign   = item.changePercent >= 0 ? '▲' : '▼';
    const chgCls = item.changePercent >= 0 ? 't-up' : 't-down';
    const price  = item.price.toFixed(2);
    const pct    = Math.abs(item.changePercent).toFixed(2);
    return (
      `<span class="t-item${alertCls}">` +
      `<span class="t-sym">${item.symbol}</span> ` +
      `<span class="t-price">${price}</span> ` +
      `<span class="${chgCls}">${sign}${pct}%</span>` +
      `</span><span class="t-sep">·</span>`
    );
  }).join('');
  return `<span class="t-badge">WATCHLIST</span>${parts}`.repeat(4);
}

// ── Live refresh ──────────────────────────────────────────────────────────────

/** Fetches live prices from /api/ticker and updates the strip. */
function refreshTicker() {
  fetch('/api/ticker')
    .then(r => r.json())
    .then(items => {
      document.getElementById('ticker-track').innerHTML =
        items.length ? buildTickerContent(items) : '';
    })
    .catch(() => {});
}

// ── Init ──────────────────────────────────────────────────────────────────────

/** Initialises the ticker: sets the date display, shows symbols, then enriches with prices. */
export function initTicker() {
  // Date display (top-right of the ticker strip)
  const d = new Date();
  document.getElementById('ticker-date').textContent =
    d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Show symbols immediately so the strip isn't blank while prices load
  fetch('/api/data')
    .then(r => r.json())
    .then(data => {
      const watchlist = data.watchlist || [];
      if (!watchlist.length) return;

      const basicItems = watchlist.map(w => ({
        symbol: w.symbol, price: null, changePercent: null, alertState: null,
      }));
      document.getElementById('ticker-track').innerHTML = buildTickerContent(basicItems);

      // Enrich with live prices in the background, then keep refreshing
      refreshTicker();
      setInterval(refreshTicker, TICKER_REFRESH_MS);
    })
    .catch(() => {});
}
