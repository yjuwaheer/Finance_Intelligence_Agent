// ─────────────────────────────────────────────────────────────────────────────
// sidebar.js — Sidebar open/close + delegated event handling
//
// Attaches all event listeners for the sidebar:
//   - Hamburger toggle + backdrop close (mobile)
//   - Session list delegation (switch-session, delete-session)
//   - Quick-access nav + new-session button via CustomEvents
//     so chat.js can respond without a direct import dependency
// ─────────────────────────────────────────────────────────────────────────────

import { switchSession, deleteSession } from './sessions.js';

// ── Sidebar open/close ────────────────────────────────────────────────────────

export function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const open     = sidebar.classList.toggle('open');
  backdrop.classList.toggle('visible', open);
}

export function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-backdrop')?.classList.remove('visible');
}

// ── Event wiring ──────────────────────────────────────────────────────────────

export function initSidebar() {
  // Hamburger menu (mobile)
  document.getElementById('menu-toggle')
    ?.addEventListener('click', toggleSidebar);

  // Backdrop click closes sidebar
  document.getElementById('sidebar-backdrop')
    ?.addEventListener('click', closeSidebar);

  // Session list — delegated listener handles switch and delete clicks
  document.getElementById('sessions-list')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.sessionId;
      if (btn.dataset.action === 'switch-session') switchSession(id);
      else if (btn.dataset.action === 'delete-session') deleteSession(id);
    });

  // "New Session" button — dispatches a CustomEvent; chat.js listens
  document.querySelector('.s-new')
    ?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('app:newChat'));
      closeSidebar();
    });

  // Quick-access nav buttons — dispatch CustomEvents with the prompt text
  // The sidebar itself also closes; chat.js handles the actual send
  document.getElementById('s-nav')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="quick-send"]');
      if (!btn) return;
      document.dispatchEvent(
        new CustomEvent('app:quickSend', { detail: btn.dataset.prompt }),
      );
      closeSidebar();
    });
}
