// ─────────────────────────────────────────────────────────────────────────────
// typewriter.js — Streaming text reveal + status bar + composing indicator
//
// Owns all state that changes while the agent is replying:
//   - The typewriter queue (chunk buffering + word-by-word rendering)
//   - The status bar (bottom activity indicator)
//   - The "composing response..." line shown after all tools complete
//   - finalizeMessage() which drains the queue and locks the bubble
// ─────────────────────────────────────────────────────────────────────────────

import {
  TYPEWRITER_MS,
  FINALIZE_POLL_MS,
  streamText, setStreamText,
  typeQueue,  pushToQueue, shiftFromQueue,
  isTyping,   setIsTyping,
} from './state.js';
import { scrollToBottom } from './messages.js';
import { addSpeakButton }  from './speech.js';
import { renderCharts }    from './charts.js';

// ── Status bar ────────────────────────────────────────────────────────────────

/**
 * Updates the always-visible status bar at the bottom of the chat.
 * Pass null/empty to hide it.
 */
export function setStatus(text, isComposing = false) {
  const bar   = document.getElementById('status-bar');
  const dot   = bar.querySelector('.status-dot');
  const label = document.getElementById('status-text');
  if (text) {
    label.textContent = text;
    dot.classList.toggle('composing', isComposing);
    bar.classList.add('active');
  } else {
    bar.classList.remove('active');
  }
}

// ── Composing indicator ───────────────────────────────────────────────────────

/**
 * Inserts the "composing response…" line into the tool log.
 * Called by tools.js when all pending tool calls finish.
 * Removed automatically when the first post-tool text chunk arrives.
 */
export function showComposing(toolLogEl) {
  if (!toolLogEl || document.getElementById('composing-line')) return;
  const line = document.createElement('div');
  line.className = 'tool-line composing';
  line.id = 'composing-line';
  line.innerHTML = `
    <span class="tl-prompt">◆</span>
    <span class="tl-name">composing response</span>
    <span class="tl-dots"><span>.</span><span>.</span><span>.</span></span>`;
  toolLogEl.appendChild(line);
  scrollToBottom();
  setStatus('composing response', true);
}

// ── Typewriter ────────────────────────────────────────────────────────────────

/** Pulls chunks off the queue and renders them word-by-word into the bubble. */
async function typewriterLoop(bubble) {
  setIsTyping(true);
  while (typeQueue.length > 0) {
    const chunk  = shiftFromQueue();
    const tokens = chunk.split(/(\s+)/); // split on whitespace, keep separators
    for (const token of tokens) {
      if (!token) continue;
      setStreamText(streamText + token);
      bubble.innerHTML = marked.parse(streamText) + '<span class="stream-cursor"></span>';
      scrollToBottom();
      await new Promise(r => setTimeout(r, TYPEWRITER_MS));
    }
  }
  setIsTyping(false);
}

/**
 * Buffers a text chunk from the SSE stream and feeds it to the typewriter.
 * Also handles setup on the first chunk (remove thinking dots) and
 * paragraph insertion when text resumes after tool calls.
 */
export function appendChunk(bubble, chunk) {
  // Always clear status when text arrives — dismisses "thinking", "working…", etc.
  setStatus(null);
  if (!streamText) {
    // First text of this response — remove thinking dots and any composing line
    bubble.querySelector('.stream-thinking')?.remove();
    document.getElementById('composing-line')?.remove();
  } else if (document.getElementById('composing-line')) {
    // Resuming text after tool calls — remove composing indicator and add a
    // paragraph break so pre-tool and post-tool text don't run together
    document.getElementById('composing-line').remove();
    setStatus(null);
    pushToQueue('\n\n');
  }
  pushToQueue(chunk);
  if (!isTyping) typewriterLoop(bubble);
}

/**
 * Waits for the typewriter to drain, then locks the bubble into its final state.
 * Always removes the composing line even if no post-tool text was emitted.
 */
export async function finalizeMessage(bubble) {
  while (isTyping || typeQueue.length > 0) {
    await new Promise(r => setTimeout(r, FINALIZE_POLL_MS));
  }
  document.getElementById('composing-line')?.remove();
  bubble.classList.remove('streaming');
  bubble.innerHTML = streamText ? marked.parse(streamText) : '';
  setStreamText('');
  setStatus(null);
  scrollToBottom();
  renderCharts(bubble);
  addSpeakButton(bubble.closest('.msg-agent'));
}
