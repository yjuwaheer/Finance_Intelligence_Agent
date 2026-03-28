// ─────────────────────────────────────────────────────────────────────────────
// tools.js — Tool call indicators in the agent message's tool log
//
// Manages the lifecycle of each tool line:
//   showTool()    — adds a "running" entry when a tool starts
//   completeTool() — marks it "done" and triggers the composing indicator
//                    once all in-flight tools finish
// ─────────────────────────────────────────────────────────────────────────────

import { activeTools, currentTools } from './state.js';
import { toolLabel }                 from './state.js';
import { scrollToBottom }            from './messages.js';
import { setStatus, showComposing }  from './typewriter.js';

/**
 * Appends a running tool line to the tool log.
 * Removes any stale composing indicator first (a new tool started mid-compose).
 */
export function showTool(id, name) {
  if (!currentTools) return;
  document.getElementById('composing-line')?.remove();

  const label = toolLabel(name);
  const line  = document.createElement('div');
  line.className = 'tool-line running';
  line.innerHTML = `
    <span class="tl-prompt">›</span>
    <span class="tl-name">${label}</span>
    <span class="tl-dots"><span>.</span><span>.</span><span>.</span></span>`;
  currentTools.appendChild(line);
  activeTools.set(id, line);
  setStatus(label);
  scrollToBottom();
}

/**
 * Marks a tool line as done.
 * When the active-tool map drains to zero, shows the composing indicator.
 */
export function completeTool(id) {
  const line = activeTools.get(id);
  if (!line) return;
  line.classList.replace('running', 'done');
  line.querySelector('.tl-prompt').textContent = '✓';
  activeTools.delete(id);
  if (activeTools.size === 0) showComposing(currentTools);
}
