// ─────────────────────────────────────────────────────────────────────────────
// sessions.js — Session index + message persistence
//
// Owns everything that touches localStorage:
//   - The session index ("fin-sessions") — list of {id, title, timestamps}
//   - Per-session message snapshots ("fin-msgs-{id}")
//   - renderSessionList() — re-renders the sidebar session list
//
// Session switching (switchSession) also lives here since it coordinates
// session state, message persistence, and DOM teardown/restore.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SESSIONS_INDEX_KEY, MAX_SESSIONS, MAX_MSGS_STORED, MOBILE_BREAKPOINT,
  sessionId, msgStoreKey, setSession,
  isStreaming, abortController,
} from './state.js';
import { showWelcome, scrollToBottom } from './messages.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Session index CRUD ────────────────────────────────────────────────────────

export function loadSessionIndex() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_INDEX_KEY) || '[]'); }
  catch { return []; }
}

/**
 * Persists the session list, trimmed to MAX_SESSIONS.
 * Message data for sessions that fall off the list is cleaned up immediately.
 */
export function saveSessionIndex(list) {
  const pruned = list.slice(0, Math.max(0, list.length - MAX_SESSIONS));
  try { localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(list.slice(-MAX_SESSIONS))); }
  catch { /* quota exceeded */ }
  for (const s of pruned) localStorage.removeItem(`fin-msgs-${s.id}`);
}

/** Ensures the current session has an entry in the index. */
export function ensureSessionEntry() {
  const list = loadSessionIndex();
  if (!list.find(s => s.id === sessionId)) {
    list.push({
      id:            sessionId,
      title:         'New session',
      createdAt:     new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    });
    saveSessionIndex(list);
  }
}

/**
 * Updates the session title from the first user message (when still default)
 * and bumps lastMessageAt. Call after every user message.
 */
export function touchSession(text) {
  const list = loadSessionIndex();
  const idx  = list.findIndex(s => s.id === sessionId);
  if (idx < 0) return;
  if (list[idx].title === 'New session' && text) {
    list[idx].title = text.slice(0, 45).trim();
  }
  list[idx].lastMessageAt = new Date().toISOString();
  saveSessionIndex(list);
}

/** Removes any fin-msgs-* keys in localStorage with no matching session entry. */
export function cleanupOrphanedMessages() {
  const validIds = new Set(loadSessionIndex().map(s => s.id));
  const toDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('fin-msgs-') && !validIds.has(key.slice(9))) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) localStorage.removeItem(key);
}

// ── Message persistence ───────────────────────────────────────────────────────

/**
 * Snapshots rendered messages into localStorage.
 * Skips the welcome screen, error toasts, and still-streaming bubbles.
 * Does nothing for empty sessions (prevents orphan keys).
 */
export function saveMessages(key = msgStoreKey) {
  const container = document.getElementById('messages');
  const items = [];
  for (const el of container.children) {
    if (el.id === 'welcome') continue;
    if (el.classList.contains('msg-error')) continue;
    if (el.classList.contains('msg-agent') && el.querySelector('.streaming')) continue;
    items.push({ cls: el.className, html: el.innerHTML });
  }
  if (!items.length) return;
  try { localStorage.setItem(key, JSON.stringify(items.slice(-MAX_MSGS_STORED))); }
  catch { /* quota exceeded or private browsing */ }
}

/**
 * Restores previously saved messages into the DOM.
 * Suppresses the welcome screen when history exists.
 */
export function restoreMessages() {
  try {
    const raw = localStorage.getItem(msgStoreKey);
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!items.length) return;
    document.getElementById('welcome')?.remove();
    const container = document.getElementById('messages');
    for (const { cls, html } of items) {
      const el = document.createElement('div');
      el.className = cls;
      el.innerHTML = html;
      container.appendChild(el);
    }
    scrollToBottom();
  } catch { /* corrupt data */ }
}

// ── Session list rendering ────────────────────────────────────────────────────

/** Re-renders the sessions sidebar list. */
export function renderSessionList() {
  const el = document.getElementById('sessions-list');
  if (!el) return;
  const list = loadSessionIndex().slice().reverse(); // newest first
  if (!list.length) {
    el.innerHTML = '<div class="sessions-empty">No sessions yet</div>';
    return;
  }
  // IDs are UUIDs (hex + hyphens only) — safe in data attributes.
  el.innerHTML = list.map(s => {
    const active    = s.id === sessionId;
    const streaming = active && isStreaming;
    return (
      `<div class="session-item">` +
      `<button class="session-btn${active ? ' session-active' : ''}"` +
      ` data-action="switch-session" data-session-id="${s.id}">` +
      `<span class="session-dot${streaming ? ' session-dot-live' : ''}"></span>` +
      `<span class="session-title-text">${escapeHtml(s.title)}</span>` +
      `<span class="session-age">${timeAgo(s.lastMessageAt)}</span>` +
      `</button>` +
      `<button class="session-delete" data-action="delete-session"` +
      ` data-session-id="${s.id}" title="Delete session">×</button>` +
      `</div>`
    );
  }).join('');
}

// Inline escapeHtml used only for session titles in this module.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Session switching ─────────────────────────────────────────────────────────

/** Cancels any active stream, saves current messages, then loads the target session. */
export function switchSession(id) {
  if (id === sessionId) return;
  abortController?.abort();
  saveMessages();
  setSession(id);
  const container = document.getElementById('messages');
  container.innerHTML = '';
  restoreMessages();
  if (!container.querySelector('.msg-user, .msg-agent')) showWelcome();
  renderSessionList();
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('visible');
  }
}

/**
 * Deletes a session from the index and localStorage.
 * Emits 'app:newChat' when the last session is removed so chat.js can respond.
 */
export function deleteSession(id) {
  if (id === sessionId && isStreaming) return;
  const list = loadSessionIndex().filter(s => s.id !== id);
  saveSessionIndex(list);
  localStorage.removeItem(`fin-msgs-${id}`);
  if (id === sessionId) {
    if (list.length > 0) {
      switchSession(list[list.length - 1].id);
    } else {
      document.dispatchEvent(new CustomEvent('app:newChat'));
    }
  } else {
    renderSessionList();
  }
}
