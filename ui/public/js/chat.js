// ─────────────────────────────────────────────────────────────────────────────
// chat.js — Message sending, SSE streaming, and new-chat orchestration
//
// This is the main entry point for the application (loaded as type="module").
// It imports all other modules, wires up event listeners, and handles the
// full send → stream → finalize lifecycle.
// ─────────────────────────────────────────────────────────────────────────────

import {
  sessionId, msgStoreKey, setSession,
  isStreaming, setIsStreaming,
  abortController, setAbortController,
  setCurrentBubble, setCurrentTools,
  activeTools,
  resetTypewriterState, streamText,
  TEXTAREA_MAX_HEIGHT,
} from './state.js';
import { appendUserMessage, createAgentMessage,
         showWelcome, showError, scrollToBottom } from './messages.js';
import { appendChunk, finalizeMessage, setStatus } from './typewriter.js';
import { showTool, completeTool }                  from './tools.js';
import {
  touchSession, saveMessages, ensureSessionEntry,
  cleanupOrphanedMessages, restoreMessages, renderSessionList,
} from './sessions.js';
import { initTicker }  from './ticker.js';
import { initSidebar } from './sidebar.js';
import { initSpeech }   from './speech.js';
import { initPalette }  from './palette.js';

// Configure marked (global CDN script loaded before this module)
marked.setOptions({ breaks: true, gfm: true });

// ── Send message ──────────────────────────────────────────────────────────────

export async function sendMessage(text) {
  if (isStreaming || !text.trim()) return;

  setIsStreaming(true);
  setAbortController(new AbortController());
  // Capture the key now — the session may switch mid-stream
  const myMsgKey = msgStoreKey;

  const input   = document.getElementById('input');
  const sendBtn = document.getElementById('send-btn');
  input.value       = '';
  input.style.height = 'auto';
  sendBtn.disabled  = true;

  // Render user message + update session metadata
  appendUserMessage(text);
  touchSession(text);
  saveMessages();
  renderSessionList();

  // Create the agent message skeleton and set stream targets
  const { bubble, toolLog } = createAgentMessage();
  setCurrentBubble(bubble);
  setCurrentTools(toolLog);
  setStatus('thinking');

  try {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: text, sessionId }),
      signal:  abortController.signal,
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    // Silence detector — shows "working…" when agent pauses mid-stream for >1.5s
    // (e.g. while composing a long HTML email before calling the send tool)
    let silenceTimer = null;
    const armSilence   = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => { if (isStreaming) setStatus('working…'); }, 1500);
    };
    const disarmSilence = () => { clearTimeout(silenceTimer); silenceTimer = null; };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep any incomplete line for next iteration

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }

        if (evt.type === 'text') {
          disarmSilence();
          appendChunk(bubble, evt.content);
          armSilence(); // re-arm — if text pauses again, show "working…"
        } else if (evt.type === 'tool_start') {
          disarmSilence(); showTool(evt.id, evt.name);
        } else if (evt.type === 'tool_end')  { completeTool(evt.id); }
        else if  (evt.type === 'done')       { disarmSilence(); await finalizeMessage(bubble); saveMessages(myMsgKey); }
        else if  (evt.type === 'error')      { disarmSilence(); await finalizeMessage(bubble); showError(evt.message); }
      }
    }
    disarmSilence();
  } catch (err) {
    if (err.name === 'AbortError') {
      // Intentional cancel (session switch / new chat) — clean up quietly
      resetTypewriterState();
      document.getElementById('composing-line')?.remove();
      if (bubble) {
        bubble.classList.remove('streaming');
        bubble.innerHTML = streamText ? marked.parse(streamText) : '';
      }
    } else {
      if (bubble) await finalizeMessage(bubble);
      showError(err.message || 'Failed to connect.');
    }
  } finally {
    setIsStreaming(false);
    sendBtn.disabled = false;
    setCurrentBubble(null);
    setCurrentTools(null);
    resetTypewriterState();
    activeTools.clear();
    setStatus(null);
    renderSessionList();
    input.focus();
  }
}

// ── New chat ──────────────────────────────────────────────────────────────────

export async function newChat() {
  abortController?.abort();
  await fetch(`/api/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  setSession(crypto.randomUUID());
  ensureSessionEntry();
  document.getElementById('messages').innerHTML = '';
  showWelcome();
  renderSessionList();
}

// ── Input handlers ────────────────────────────────────────────────────────────

function handleSend() {
  const text = document.getElementById('input').value.trim();
  if (text) sendMessage(text);
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  // Restore any previous session from localStorage
  cleanupOrphanedMessages();
  ensureSessionEntry();
  restoreMessages();
  renderSessionList();

  // Ticker strip + sidebar event listeners
  initTicker();
  initSidebar();

  // Speech: mic button (STT) + speak buttons (TTS)
  initSpeech(text => { if (text.trim()) sendMessage(text); });

  // Command palette (⌘K)
  initPalette();

  // Send button
  document.getElementById('send-btn')
    ?.addEventListener('click', handleSend);

  // Textarea auto-resize + Enter to send
  const inputEl = document.getElementById('input');
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, TEXTAREA_MAX_HEIGHT) + 'px';
  });
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  // ⌥N → new chat  (use e.code so Option+N works on Mac regardless of composed char)
  document.addEventListener('keydown', e => {
    if (e.altKey && e.code === 'KeyN') { e.preventDefault(); newChat(); }
  });

  // Warn before navigating away mid-stream
  window.addEventListener('beforeunload', e => {
    if (isStreaming) { e.preventDefault(); e.returnValue = ''; }
  });

  // CustomEvents fired by sidebar.js to avoid a circular import
  document.addEventListener('app:newChat',   ()  => newChat());
  document.addEventListener('app:quickSend', e   => sendMessage(e.detail));

  // Delegated listener for welcome-screen cards and agent quick-reply buttons
  document.getElementById('messages')
    ?.addEventListener('click', e => {
      const card = e.target.closest('[data-action="quick-send"]');
      if (card) { sendMessage(card.dataset.prompt); return; }
      const qr = e.target.closest('.quick-replies [data-prompt]');
      if (qr) sendMessage(qr.dataset.prompt);
    });

  // Refresh "Xm ago" timestamps in the sidebar every minute
  setInterval(renderSessionList, 60_000);

  inputEl.focus();
}

init();
