// ─────────────────────────────────────────────────────────────────────────────
// js/data/app.js — Data management page entry point
//
// Orchestrates tab switching, table rendering, modal, profile form,
// sidebar toggling, toast notifications, and all API calls.
// Imports all pure helpers from schemas.js and form.js.
// ─────────────────────────────────────────────────────────────────────────────

import { SCHEMAS, esc }                                        from './schemas.js';
import { renderField, collectFormData, bindConditionalFields } from './form.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 767; // max viewport width (px) for mobile layout

// ── State ─────────────────────────────────────────────────────────────────────

let activeTab    = 'profile';
let editingIndex = null; // null = adding new, number = editing existing row

// ── Sidebar ───────────────────────────────────────────────────────────────────

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-backdrop').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('visible');
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab) {
  activeTab = tab;
  const schema = SCHEMAS[tab];

  document.getElementById('section-eyebrow').textContent      = schema.eyebrow;
  document.getElementById('section-title').textContent        = schema.sectionTitle;
  document.getElementById('section-ticker-label').textContent = schema.sectionTitle;

  document.getElementById('add-btn').style.display = schema.kind === 'array' ? '' : 'none';

  document.querySelectorAll('#s-nav .s-btn').forEach(b => {
    b.classList.toggle('active-section', b.dataset.tab === tab);
  });

  loadTab();
  if (window.innerWidth <= MOBILE_BREAKPOINT) closeSidebar();
}

async function loadTab() {
  const schema  = SCHEMAS[activeTab];
  const content = document.getElementById('data-content');
  content.innerHTML = '<div class="data-loading">Loading…</div>';

  try {
    const json = await (await fetch('/api/data')).json();

    if (schema.kind === 'object') {
      renderProfileForm(json.profile ?? {});
    } else {
      let notice = '';
      if (activeTab === 'trades') {
        notice = `<div class="tab-notice">
          <span class="tab-notice-icon">◆</span>
          Adding a trade here automatically updates your <strong>Holdings</strong>.
          Editing or deleting a trade record does <em>not</em> reverse the holdings change —
          use chat to correct complex trade errors.
        </div>`;
      }
      content.innerHTML = notice;
      renderTable(json[schema.resource] ?? [], schema);
    }
  } catch (err) {
    content.innerHTML = `<div class="data-error">Failed to load data: ${esc(String(err))}</div>`;
  }
}

// ── Profile form ──────────────────────────────────────────────────────────────

function renderProfileForm(data) {
  const schema  = SCHEMAS.profile;
  const content = document.getElementById('data-content');

  // Group contribution room fields into a single 3-column row
  const roomKeys     = ['tfsa_contribution_room', 'rrsp_contribution_room', 'fhsa_contribution_room'];
  const singleFields = schema.fields.filter(f => !roomKeys.includes(f.key));
  const roomFields   = schema.fields.filter(f =>  roomKeys.includes(f.key));

  const singleHtml = singleFields.map(f => renderField(f, data[f.key])).join('');
  const roomHtml   = `<div class="profile-form-row">${roomFields.map(f => renderField(f, data[f.key])).join('')}</div>`;

  content.innerHTML = `
    <form class="profile-form" id="profile-form">
      ${singleHtml}
      ${roomHtml}
      <div class="form-actions">
        <button type="button" class="btn-gold" id="profile-save-btn">Save Changes</button>
      </div>
    </form>`;

  document.getElementById('profile-save-btn').addEventListener('click', saveProfile);
  bindConditionalFields('profile-form', schema.fields);
}

async function saveProfile() {
  const schema = SCHEMAS.profile;
  const form   = document.getElementById('profile-form');
  const data   = collectFormData(form, schema.fields);

  try {
    const res = await fetch('/api/data/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    toast('Profile saved', 'success');
  } catch (err) {
    toast('Save failed: ' + err.message, 'error');
  }
}

// ── Array table ───────────────────────────────────────────────────────────────

function renderTable(rows, schema) {
  const content = document.getElementById('data-content');

  if (!rows.length) {
    content.innerHTML += `<div class="data-empty">No ${schema.sectionTitle.toLowerCase()} yet. Click <strong>+ Add</strong> to create one.</div>`;
    return;
  }

  const headers = [...schema.columns, ''].map(c =>
    `<th class="${c === '' ? 'col-actions' : ''}">${esc(c)}</th>`
  ).join('');

  const bodyRows = rows.map((row, i) => {
    const cells = schema.rowCells(row).map(c => `<td>${c}</td>`).join('');
    return `
      <tr>
        ${cells}
        <td class="col-actions" id="actions-${i}">
          <button class="act-btn" title="Edit"   data-action="edit"   data-index="${i}">✎</button>
          <button class="act-btn act-delete" title="Delete" data-action="delete" data-index="${i}">✕</button>
        </td>
      </tr>`;
  }).join('');

  content.innerHTML += `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

function confirmDelete(index) {
  const cell = document.getElementById(`actions-${index}`);
  if (!cell) return;
  cell.innerHTML = `
    <span class="del-confirm">Delete?</span>
    <button class="act-btn act-danger" data-action="do-delete"     data-index="${index}">Yes</button>
    <button class="act-btn"            data-action="cancel-delete">No</button>`;
}

async function doDelete(index) {
  const schema = SCHEMAS[activeTab];
  try {
    const res = await fetch(`/api/data/${schema.resource}/${index}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    toast('Deleted successfully', 'success');
    loadTab();
  } catch (err) {
    toast('Delete failed: ' + err.message, 'error');
    loadTab();
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openAddModal() {
  editingIndex = null;
  document.getElementById('modal-title').textContent = `Add ${singularTitle(activeTab)}`;
  buildModalForm({});
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.add('open');
  backdrop.querySelector('input,select,textarea')?.focus();
}

async function openEditModal(index) {
  editingIndex = index;
  const schema = SCHEMAS[activeTab];
  const json   = await (await fetch('/api/data')).json();
  const item   = (json[schema.resource] ?? [])[index];
  if (!item) return;

  document.getElementById('modal-title').textContent = `Edit ${singularTitle(activeTab)}`;
  buildModalForm(item);
  document.getElementById('modal-backdrop').classList.add('open');
}

function buildModalForm(data) {
  const schema = SCHEMAS[activeTab];
  const form   = document.getElementById('modal-form');
  form.innerHTML = schema.fields.map(f => renderField(f, data[f.key])).join('');
  bindConditionalFields('modal-form', schema.fields);
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  editingIndex = null;
}

async function saveModal() {
  const schema = SCHEMAS[activeTab];
  const form   = document.getElementById('modal-form');
  const data   = collectFormData(form, schema.fields);

  for (const f of schema.fields) {
    if (f.required && !data[f.key] && data[f.key] !== 0) {
      toast(`"${f.label}" is required`, 'error');
      form.querySelector(`[name="${f.key}"]`)?.focus();
      return;
    }
  }

  try {
    let res;
    if (editingIndex === null) {
      res = await fetch(`/api/data/${schema.resource}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
    } else {
      res = await fetch(`/api/data/${schema.resource}/${editingIndex}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
    }
    if (!res.ok) throw new Error(await res.text());
    toast(editingIndex === null ? 'Added successfully' : 'Saved successfully', 'success');
    closeModal();
    loadTab();
  } catch (err) {
    toast('Save failed: ' + err.message, 'error');
  }
}

// ── Toast notifications ───────────────────────────────────────────────────────

function toast(message, type = 'success') {
  const stack = document.getElementById('toast-stack');
  const el    = document.createElement('div');
  el.className  = `toast toast-${type}`;
  el.textContent = message;
  stack.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 350);
  }, 3500);

  // Cap at 4 visible toasts
  const toasts = stack.querySelectorAll('.toast');
  if (toasts.length > 4) toasts[0].remove();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function singularTitle(tab) {
  const map = {
    holdings: 'Holding', watchlist: 'Watchlist Entry',
    transactions: 'Transaction', trades: 'Trade', properties: 'Property',
  };
  return map[tab] ?? tab;
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  // Date in ticker strip
  document.getElementById('ticker-date').textContent =
    new Date().toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Mobile sidebar toggle
  document.getElementById('menu-toggle')
    ?.addEventListener('click', toggleSidebar);

  // Sidebar backdrop click
  document.getElementById('sidebar-backdrop')
    ?.addEventListener('click', closeSidebar);

  // Nav buttons (delegated — handles active state + switchTab)
  document.getElementById('s-nav')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('.s-btn[data-tab]');
      if (btn) switchTab(btn.dataset.tab);
    });

  // Add button
  document.getElementById('add-btn')
    ?.addEventListener('click', openAddModal);

  // Modal: close on backdrop click, × button, Cancel button, Save button
  document.getElementById('modal-backdrop')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal-backdrop')) closeModal();
    });
  document.querySelector('.modal-close')
    ?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')
    ?.addEventListener('click', closeModal);
  document.getElementById('modal-save')
    ?.addEventListener('click', saveModal);

  // Table row actions (delegated — rows are rendered dynamically)
  document.getElementById('data-content')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.index, 10);
      switch (btn.dataset.action) {
        case 'edit':          openEditModal(idx); break;
        case 'delete':        confirmDelete(idx); break;
        case 'do-delete':     doDelete(idx);      break;
        case 'cancel-delete': loadTab();          break;
      }
    });

  // Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  switchTab('profile');
}

init();
