// ─────────────────────────────────────────────────────────────────────────────
// charts.js — Inline chart renderer
//
// The agent emits a fenced ```chart code block containing JSON.
// marked.parse() renders it as <pre><code class="language-chart">...</code></pre>.
// renderCharts(el) finds those code elements, parses the JSON, and replaces
// the <pre> with an inline SVG chart.
//
// Supported types: "bar" (horizontal), "donut", "line"
// JSON schema: { type, title?, labels[], values[], unit? }
// unit: "cad" | "usd" | "%" | "" (plain number)
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = [
  '#c9a84c', // gold
  '#4a9fc4', // blue
  '#4ac47d', // green
  '#c97a4a', // orange
  '#9a6cc9', // purple
  '#4ac4b0', // teal
  '#c44a6c', // rose
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(v, unit) {
  const n = Number(v);
  if (unit === 'cad') return 'CA$' + Math.abs(n).toLocaleString('en-CA', { maximumFractionDigits: 0 });
  if (unit === 'usd') return '$'   + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (unit === '%')   return n.toFixed(1) + '%';
  return n.toLocaleString('en-CA', { maximumFractionDigits: 2 });
}

/** Convert polar coordinates (degrees, 0° = top) to cartesian [x, y]. */
function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// ── Bar chart (horizontal) ────────────────────────────────────────────────────

function barChart(labels, values, { title, unit }) {
  const W        = 500;
  const labelEnd = 124;   // right edge of label column
  const barLeft  = 132;   // bar start x
  const barMaxW  = 240;   // max bar pixel width
  const valLeft  = barLeft + barMaxW + 10;
  const rowH     = 30;
  const titleH   = title ? 26 : 6;
  const padBot   = 8;
  const H        = titleH + labels.length * rowH + padBot;
  const absMax   = Math.max(...values.map(Math.abs));

  let out = '';

  if (title) {
    out += `<text x="0" y="17" class="cc-label" letter-spacing="2">${esc(title.toUpperCase())}</text>`;
  }

  labels.forEach((label, i) => {
    const cy   = titleH + i * rowH + rowH / 2;
    const neg  = values[i] < 0;
    const barW = absMax > 0 ? Math.max((Math.abs(values[i]) / absMax) * barMaxW, 2) : 2;
    const color = neg ? '#c94c4c' : COLORS[0];

    out += `
    <text x="${labelEnd}" y="${cy + 4.5}" class="cc-label" text-anchor="end">${esc(String(label).slice(0, 18))}</text>
    <rect x="${barLeft}" y="${cy - 7}" width="${barW.toFixed(1)}" height="14" fill="${color}" rx="1.5" opacity="0.85"/>
    <text x="${valLeft}" y="${cy + 4.5}" class="cc-value">${esc((neg ? '−' : '') + fmt(values[i], unit))}</text>`;
  });

  return svg(W, H, out);
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function donutChart(labels, values, { title, unit }) {
  const cx = 100, cy = 100;
  const outer = 80, inner = 48;
  const total = values.reduce((a, b) => a + b, 0);

  // Legend starts to the right of the donut
  const lx         = cx + outer + 24;
  const legendRowH  = 34;
  const legendStartY = title ? 22 : 10;

  const H = Math.max(cy + outer + 12, legendStartY + labels.length * legendRowH + 8);
  const W = lx + 190; // legend column width

  let segments = '', legendRows = '';
  let angle = 0;

  if (title) {
    legendRows += `<text x="${lx}" y="14" class="cc-label" letter-spacing="2" font-size="10">${esc(title.toUpperCase())}</text>`;
  }

  values.forEach((v, i) => {
    const sweep = total > 0 ? (v / total) * 360 : 0;
    const end   = angle + sweep;
    const color = COLORS[i % COLORS.length];
    const gap   = 0.8;

    if (sweep > gap * 2) {
      const [ox1, oy1] = polar(cx, cy, outer, angle + gap);
      const [ox2, oy2] = polar(cx, cy, outer, end   - gap);
      const [ix1, iy1] = polar(cx, cy, inner, angle + gap);
      const [ix2, iy2] = polar(cx, cy, inner, end   - gap);
      const large = (sweep - gap * 2) > 180 ? 1 : 0;
      const d = [
        `M ${ox1.toFixed(2)} ${oy1.toFixed(2)}`,
        `A ${outer} ${outer} 0 ${large} 1 ${ox2.toFixed(2)} ${oy2.toFixed(2)}`,
        `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
        `A ${inner} ${inner} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
        'Z',
      ].join(' ');
      segments += `<path d="${d}" fill="${color}"/>`;
    }

    const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
    const ly  = legendStartY + i * legendRowH;

    legendRows += `
    <rect x="${lx}" y="${ly + 2}" width="8" height="8" fill="${color}" rx="1.5"/>
    <text x="${lx + 14}" y="${ly + 10}" class="cc-label">${esc(String(labels[i]).slice(0, 18))}</text>
    <text x="${lx + 14}" y="${ly + 24}" class="cc-value" font-size="10.5">${esc(fmt(v, unit))}  ${pct}%</text>`;

    angle = end;
  });

  // Center total
  const center = `
    <text x="${cx}" y="${cy - 5}" class="cc-label" text-anchor="middle" font-size="9" letter-spacing="1">${esc(fmt(total, unit))}</text>
    <text x="${cx}" y="${cy + 9}" class="cc-value" text-anchor="middle" font-size="11">${esc(unit ? unit.toUpperCase() : 'TOTAL')}</text>`;

  return svg(W, H, segments + center + legendRows);
}

// ── Line chart ────────────────────────────────────────────────────────────────

function lineChart(labels, values, { title, unit }) {
  const W    = 500;
  const padL = 72, padR = 16, padT = title ? 46 : 24, padB = 32;
  const plotW = W - padL - padR;
  const plotH = 100;
  const H     = padT + plotH + padB;
  const N     = values.length;

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || 1;

  const xOf = i => padL + i * (plotW / Math.max(N - 1, 1));
  const yOf = v => padT + plotH - ((v - minV) / span) * plotH;

  const points    = values.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  const areaClose = ` ${xOf(N - 1).toFixed(1)},${(padT + plotH).toFixed(1)} ${padL},${(padT + plotH).toFixed(1)}`;

  // Axis lines
  const axisX = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" class="cc-axis"/>`;
  const axisY = `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" class="cc-axis"/>`;

  // Y labels
  const yLabels = `
    <text x="${padL - 6}" y="${padT + 4}" class="cc-label" text-anchor="end" font-size="10">${esc(fmt(maxV, unit))}</text>
    <text x="${padL - 6}" y="${padT + plotH + 4}" class="cc-label" text-anchor="end" font-size="10">${esc(fmt(minV, unit))}</text>`;

  // X labels — show up to 6, always include first and last
  const step = Math.ceil(N / 6);
  let xLabels = '';
  labels.forEach((l, i) => {
    if (i % step !== 0 && i !== N - 1) return;
    xLabels += `<text x="${xOf(i).toFixed(1)}" y="${H - 6}" class="cc-label" text-anchor="middle" font-size="10">${esc(String(l).slice(0, 8))}</text>`;
  });

  // Dots
  const dots = values.map((v, i) =>
    `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="3" fill="${COLORS[0]}"/>`
  ).join('');

  const titleEl = title
    ? `<text x="${W / 2}" y="16" class="cc-label" text-anchor="middle" letter-spacing="2">${esc(title.toUpperCase())}</text>`
    : '';

  const out = `
    ${titleEl}
    ${axisX}${axisY}${yLabels}${xLabels}
    <polyline points="${points + areaClose}" fill="${COLORS[0]}" opacity="0.1"/>
    <polyline points="${points}" fill="none" stroke="${COLORS[0]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}`;

  return svg(W, H, out);
}

// ── SVG wrapper ────────────────────────────────────────────────────────────────

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h.toFixed(0)}" class="chart-svg" aria-hidden="true">${body}</svg>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Finds all ```chart code blocks inside containerEl and replaces them with
 * rendered SVG chart wrappers. Called after finalizeMessage() completes.
 */
export function renderCharts(containerEl) {
  containerEl.querySelectorAll('code.language-chart').forEach(codeEl => {
    let data;
    try {
      data = JSON.parse(codeEl.textContent);
    } catch {
      return; // invalid JSON — leave the code block as-is
    }

    const { type = 'bar', title = '', labels = [], values = [], unit = '' } = data;

    if (!labels.length || !values.length || labels.length !== values.length) return;

    const nums = values.map(Number);
    let svgHtml;
    if      (type === 'donut' || type === 'pie') svgHtml = donutChart(labels, nums, { title, unit });
    else if (type === 'line')                    svgHtml = lineChart(labels, nums, { title, unit });
    else                                         svgHtml = barChart(labels, nums, { title, unit });

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-container';
    wrapper.innerHTML = svgHtml;
    codeEl.closest('pre').replaceWith(wrapper);
  });
}
