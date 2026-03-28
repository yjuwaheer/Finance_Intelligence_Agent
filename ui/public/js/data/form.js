// ─────────────────────────────────────────────────────────────────────────────
// js/data/form.js — Form field rendering, data collection, conditional logic
//
// Pure DOM helpers — no fetch, no global state.
// All functions accept explicit arguments so they can be called from any context.
// ─────────────────────────────────────────────────────────────────────────────

import { esc } from './schemas.js';

/**
 * Returns an HTML string for a single form field.
 * `value` is the current value to pre-fill (may be undefined / null).
 */
export function renderField(field, value) {
  const val    = value ?? '';
  const hidden = field.dependsOn ? ' style="display:none"' : '';
  const hint   = field.hint ? `<div class="field-hint">${esc(field.hint)}</div>` : '';

  let input;
  if (field.type === 'select') {
    const opts = field.options.map(o =>
      `<option value="${esc(o.v)}" ${String(val) === String(o.v) ? 'selected' : ''}>${esc(o.l)}</option>`
    ).join('');
    input = `<select name="${field.key}" class="field-input">${opts}</select>`;

  } else if (field.type === 'checkbox') {
    input = `<label class="toggle-label">
      <input type="checkbox" name="${field.key}" ${val ? 'checked' : ''} class="toggle-input">
      <span class="toggle-track"><span class="toggle-thumb"></span></span>
    </label>`;

  } else if (field.type === 'textarea') {
    input = `<textarea name="${field.key}" class="field-input field-textarea" rows="2" placeholder="${esc(field.placeholder ?? '')}">${esc(val)}</textarea>`;

  } else {
    const extras = [
      field.min  != null ? `min="${field.min}"` : '',
      field.step != null ? `step="${field.step}"` : '',
      field.placeholder ? `placeholder="${esc(field.placeholder)}"` : '',
    ].filter(Boolean).join(' ');
    input = `<input type="${field.type}" name="${field.key}" value="${esc(val)}" class="field-input" ${extras} ${field.required ? 'required' : ''}>`;
  }

  return `
    <div class="field-group ${field.dependsOn ? 'conditional-field' : ''}" data-depends-on="${field.dependsOn ?? ''}"${hidden}>
      <label class="field-label">${esc(field.label)}${field.required ? ' <span class="required-star">*</span>' : ''}</label>
      ${input}
      ${hint}
    </div>`;
}

/**
 * Reads all field values from a <form> element and returns a plain object.
 * Applies optional transforms (e.g. toUpperCase) defined in the field schema.
 */
export function collectFormData(form, fields) {
  const data = {};
  for (const f of fields) {
    const el = form.querySelector(`[name="${f.key}"]`);
    if (!el) continue;
    if (f.type === 'checkbox') {
      data[f.key] = el.checked;
    } else if (f.type === 'number') {
      const v = el.value.trim();
      data[f.key] = v === '' ? null : parseFloat(v);
    } else {
      let v = el.value.trim();
      if (f.transform) v = f.transform(v);
      data[f.key] = v === '' ? null : v;
    }
  }
  return data;
}

/**
 * Wires up show/hide for fields that have a dependsOn key.
 * Must be called after the form HTML has been inserted into the DOM.
 */
export function bindConditionalFields(formId, fields) {
  const form = document.getElementById(formId);
  if (!form) return;
  fields.filter(f => f.type === 'checkbox').forEach(f => {
    const cb = form.querySelector(`[name="${f.key}"]`);
    if (!cb) return;
    const toggle = () => {
      form.querySelectorAll(`[data-depends-on="${f.key}"]`).forEach(el => {
        el.style.display = cb.checked ? '' : 'none';
      });
    };
    cb.addEventListener('change', toggle);
    toggle(); // set initial visibility
  });
}
