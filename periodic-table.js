/* ─────────────────────────────────────────────────────────────
 * Atomurus — Periodic Table app logic
 * Depends on: elements-data.js (loaded first)
 * Lazy-loads: chart.js, chartjs-plugin-zoom, html2canvas, jspdf
 * ─────────────────────────────────────────────────────────── */

// ════════════ ELEMENT DATA ════════════
// Data + helpers (ELEMENTS, EXTRA, getExtra, EXTRA2, getExtra2, CAT_NAMES,
// catName, stateName, _elNamesEN/ES, elName, ELEMENT_LATIN) live in
// elements-data.js — loaded before this <script> block via
// <script src="elements-data.js"></script>.

// ════════════ I18N HELPER ════════════
// Compact accessor for the global I18N dictionary, with a Portuguese fallback
// (matches the original hard-coded values so first-paint never shows raw keys).
function _T(key, fallback) {
  if (window.I18N) {
    var v = I18N.t(key);
    if (v && v !== key) return v;
  }
  return fallback != null ? fallback : key;
}

const PERIODIC_REMOTE_DEPS = {
  chart: 'https://cdn.jsdelivr.net/npm/chart.js',
  chartZoom: 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js',
  html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
};

const _periodicDepPromises = Object.create(null);

function loadScriptOnce(key, src, isReady) {
  if (isReady && isReady()) return Promise.resolve();
  if (_periodicDepPromises[key]) return _periodicDepPromises[key];
  _periodicDepPromises[key] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-atomurus-dep="${key}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${key}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.atomurusDep = key;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${key}`));
    document.head.appendChild(script);
  }).then(() => {
    if (isReady && !isReady()) throw new Error(`${key} loaded but did not initialize`);
  });
  return _periodicDepPromises[key];
}

function ensureChartJs() {
  return loadScriptOnce('chart', PERIODIC_REMOTE_DEPS.chart, () => !!window.Chart);
}

function ensureChartZoom() {
  return ensureChartJs().then(() =>
    loadScriptOnce('chartZoom', PERIODIC_REMOTE_DEPS.chartZoom, () => !!(window.ChartZoom || window.chartjsPluginZoom))
      .catch(() => null)
  );
}

function ensureHtml2Canvas() {
  return loadScriptOnce('html2canvas', PERIODIC_REMOTE_DEPS.html2canvas, () => typeof window.html2canvas === 'function');
}

function ensureJsPdf() {
  return loadScriptOnce('jspdf', PERIODIC_REMOTE_DEPS.jspdf, () => !!(window.jspdf && window.jspdf.jsPDF));
}

// \u2500\u2500\u2500 BOHR ANIMATION \u2500\u2500\u2500
const bohrAnims = {};
const bohrPaused = {};
const bohrElements = {};

function toggleAnimations(btn) {
  btn.classList.toggle('active');
  const on = btn.classList.contains('active');
  document.body.classList.toggle('no-anim', !on);
  localStorage.setItem('atomurus-anim', on ? '1' : '0');
}

function toggleMass(btn) {
  btn.classList.toggle('active');
  const show = btn.classList.contains('active');
  document.querySelectorAll('.el-mass').forEach(el => {
    el.style.display = show ? 'block' : 'none';
  });
  localStorage.setItem('atomurus-mass', show ? '1' : '0');
}

// Toggle pause/resume — also updates the play/pause icon in the main viewer controls
function handleBohrClick(canvasId) {
  bohrPaused[canvasId] = !bohrPaused[canvasId];
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  // If unpausing and the animation loop is not running, restart it explicitly.
  // The frame() loop exits whenever it renders a static frame, so toggling
  // bohrPaused alone won't resume animation on its own.
  if (!bohrPaused[canvasId] && !bohrAnims[canvasId] && bohrElements[canvasId]) {
    drawBohr(bohrElements[canvasId], canvasId);
  }
  const wrap = canvas.closest('.bohr-wrap');
  if (wrap) {
    wrap.classList.toggle('paused', !!bohrPaused[canvasId]);
    // Also toggle on outer frame (fallback for browsers without :has())
    const frame = wrap.closest('.bohr-frame');
    if (frame) frame.classList.toggle('paused', !!bohrPaused[canvasId]);
    const icon = document.getElementById('bohr-play-icon');
    if (icon && canvasId === 'bohr-canvas') {
      if (bohrPaused[canvasId]) {
        // Currently paused — show "play" (triangle)
        icon.innerHTML = '<path d="M5 4 L12 8 L5 12 Z"/>';
      } else {
        // Currently animating — show "pause" (two bars)
        icon.innerHTML = '<rect x="5" y="4" width="2" height="8" rx=".5"/><rect x="9" y="4" width="2" height="8" rx=".5"/>';
      }
    }
  }
}

function drawBohr(el, canvasId = 'bohr-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  bohrElements[canvasId] = el;

  // Attach event listeners once per canvas
  if (!canvas._bohrBound) {
    canvas._bohrBound = true;
    // All canvases: only click-to-pause, no zoom/pan
    canvas.addEventListener('click', () => handleBohrClick(canvasId));
    canvas.style.cursor = 'pointer';
  }

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const extra = getExtra(el.z);
  const shells = extra.shells;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const orbitColor        = isDark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)';
  const orbitColorStatic  = isDark ? 'rgba(255,255,255,.16)' : 'rgba(26,24,20,.22)';
  const nucleusColor      = isDark ? '#f87171' : '#dc2626';
  const electronColor     = isDark ? '#93c5fd' : '#2563eb';
  const electronColorStatic = isDark ? '#bfdbfe' : '#1d4ed8';
  const labelColor        = isDark ? 'rgba(240,237,232,.55)' : 'rgba(26,24,20,.5)';

  if (bohrAnims[canvasId]) cancelAnimationFrame(bohrAnims[canvasId]);

  // Adaptive sizing
  const scale = Math.min(W, H) / 148;
  const nucleusR = Math.max(3.5, 5 * scale);
  const electronR = Math.max(1.5, 2.2 * scale);
  const orbitWidth = Math.max(0.5, 0.8 * scale);
  const minOrbitR = 8 * scale + nucleusR;

  // Canonical (deterministic) electron angles: first electron at the top (-π/2),
  // evenly distributed — matches textbook Bohr diagrams when paused.
  const baseAngles = shells.map((n) => Array.from({length:n}, (_, j) => -Math.PI/2 + (2*Math.PI*j/n)));
  const radii = shells.map((_, i) => minOrbitR + (i+1) * (Math.min(cx,cy) - minOrbitR - 4*scale) / (shells.length + .5));

  let t = 0;
  function frame() {
    ctx.clearRect(0,0,W,H);
    const globalPaused = document.body.classList.contains('no-anim');
    const localPaused = bohrPaused[canvasId];
    const isAnimating = !globalPaused && !localPaused;
    if (isAnimating) {
      t += 0.006; // Slow, elegant rotation
    }

    // ── Orbits ──
    shells.forEach((n,i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radii[i], 0, Math.PI*2);
      if (isAnimating) {
        ctx.strokeStyle = orbitColor;
        ctx.lineWidth = orbitWidth;
      } else {
        // Original/static Bohr representation: thin clean solid orbits
        ctx.strokeStyle = orbitColorStatic;
        ctx.lineWidth = orbitWidth * 1.1;
      }
      ctx.setLineDash([]);
      ctx.stroke();
    });

    // ── Nucleus ──
    ctx.beginPath();
    ctx.arc(cx, cy, nucleusR, 0, Math.PI*2);
    ctx.fillStyle = nucleusColor;
    if (isAnimating) {
      ctx.shadowColor = nucleusColor;
      ctx.shadowBlur = 6 * scale;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // When paused: render the atomic number (Z) inside the nucleus — canonical textbook style
    if (!isAnimating && nucleusR >= 5 && el && typeof el.z === 'number') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 ' + Math.max(7, Math.round(6.5 * scale)) + "px 'DM Mono', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(el.z), cx, cy + 0.5);
    }

    // ── Electrons ──
    shells.forEach((n, i) => {
      const speed = 1 / (i + 1);
      for (let j=0; j<n; j++) {
        const angle = isAnimating
          ? baseAngles[i][j] + t * speed
          : baseAngles[i][j]; // Fixed canonical positions when paused
        const ex = cx + Math.cos(angle) * radii[i];
        const ey = cy + Math.sin(angle) * radii[i];
        ctx.beginPath();
        ctx.arc(ex, ey, electronR, 0, Math.PI*2);
        ctx.fillStyle = isAnimating ? electronColor : electronColorStatic;
        if (isAnimating) {
          ctx.shadowColor = electronColor;
          ctx.shadowBlur = 4 * scale;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // ── Shell electron-count labels (paused state only, on the main/large viewer) ──
    if (!isAnimating && W >= 130) {
      ctx.fillStyle = labelColor;
      ctx.font = '500 ' + Math.max(8, Math.round(8 * scale)) + "px 'DM Mono', monospace";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      shells.forEach((n, i) => {
        const lx = cx + radii[i] + 3 * scale;
        const ly = cy - 1;
        if (lx + 10 * scale < W) {
          ctx.fillText(String(n), lx, ly);
        }
      });
    }

    if (isAnimating) {
      bohrAnims[canvasId] = requestAnimationFrame(frame);
    } else {
      bohrAnims[canvasId] = null;
    }
  }
  frame();
}

// ─── NUCLEUS VISUALIZATION (protons + neutrons) ──────────────────────────────
// Draws A nucleons in a hexagonally-packed cluster. Proton positions are
// scrambled deterministically per isotope, so the same (Z, A) always renders
// identically. Used standalone in the iso-details pane and embedded inside
// drawAtomicModel() for the per-isotope mini cards.
function drawNucleus(z, a, canvasId = 'nucleus-iso') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!Number.isFinite(a) || a < 1 || !Number.isFinite(z) || z < 0) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  drawNucleusAt(ctx, W / 2, H / 2, Math.min(W, H) / 2 - 2, z, a, isDark);
}

// Renders the nucleus inline at a given (cx, cy) within `maxR` pixels of half
// the cluster diameter. Pulled out of drawNucleus so the atomic-model row can
// draw the nucleus at the center of each electron-orbit card.
function drawNucleusAt(ctx, cx, cy, maxR, z, a, isDark) {
  if (!Number.isFinite(a) || a < 1 || !Number.isFinite(z) || z < 0) return;

  const protonColor  = isDark ? '#f87171' : '#dc2626';
  const neutronColor = isDark ? '#9ca3af' : '#6b7280';

  // Nucleon radius — chosen so the cluster diameter ≈ 2*maxR.
  const r = Math.max(1.4, 0.84 * maxR / Math.sqrt(a));
  const d = r * 2;

  // 1) Generate hex-grid candidate positions sorted by distance from center.
  const sqrt3 = Math.sqrt(3);
  const positions = [];
  const bound = Math.ceil(Math.sqrt(a) + 2);
  for (let q = -bound; q <= bound; q++) {
    for (let row = -bound; row <= bound; row++) {
      const x = (q + row / 2) * d;
      const y = row * d * (sqrt3 / 2);
      positions.push({ x, y, dist: x * x + y * y });
    }
  }
  positions.sort((p1, p2) => p1.dist - p2.dist);
  positions.length = a;

  // Re-center the cluster on (0, 0). When A nucleons are picked from a hex
  // lattice by nearest-distance, the centroid is biased toward whichever
  // ring direction the iteration order favours (here: lower q values first).
  // For small A this offset is visible — e.g. Deuterium's two nucleons would
  // sit left of canvas centre because the picked neighbour is at (-d, 0).
  // Subtracting the centroid forces every isotope to be geometrically centred.
  let cmX = 0, cmY = 0;
  positions.forEach(p => { cmX += p.x; cmY += p.y; });
  cmX /= positions.length;
  cmY /= positions.length;
  positions.forEach(p => { p.x -= cmX; p.y -= cmY; });

  // 2) Deterministic Fisher-Yates shuffle (seed = z*1000+a); first `z` → protons.
  const isProton = new Array(a).fill(false);
  const order = positions.map((_, i) => i);
  let seed = (z * 1000 + a) | 0;
  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) | 0;
    const u = ((seed >>> 0) % 233280) / 233280;
    const j = Math.floor(u * (i + 1));
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  for (let i = 0; i < z && i < a; i++) isProton[order[i]] = true;

  // 3) Draw — sort by y so back nucleons are drawn first for a subtle depth effect.
  const drawList = positions.map((p, i) => ({ x: p.x, y: p.y, isP: isProton[i] }));
  drawList.sort((p1, p2) => p1.y - p2.y);

  drawList.forEach(p => {
    ctx.beginPath();
    ctx.arc(cx + p.x, cy + p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.isP ? protonColor : neutronColor;
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  });

  // Textbook-style "p"/"n" labels — only when nucleons are big enough to stay
  // legible (avoids cluttered soup of letters on heavy nuclei).
  if (r >= 6.5) {
    const fontSize = Math.max(8, Math.round(r * 0.95));
    ctx.font = `700 ${fontSize}px 'DM Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    drawList.forEach(p => {
      ctx.fillText(p.isP ? 'p' : 'n', cx + p.x, cy + p.y + 0.5);
    });
  }
}

// ─── ATOMIC MODEL (combined Bohr orbits + nucleus, textbook style) ───────────
// Renders the full atomic model for a specific isotope: outer shell(s) +
// electrons (labeled "e" when there's enough room) + nucleus (with p/n labels
// when the cluster radius allows it). Designed for the per-isotope mini cards
// below the table — one card per isotope of the current element.
function drawAtomicModel(z, a, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  // Electron must clearly stand out from the (thin, translucent) orbit ring.
  // In dark mode we use a brighter saturated blue for the electrons and a
  // softer/desaturated tone for the orbit.
  const orbitColor    = isDark ? 'rgba(96,140,210,0.55)' : 'rgba(140,170,235,0.70)';
  const electronColor = isDark ? '#60a5fa' : '#3b82f6';

  // Layout: nucleus occupies the inner 32%, orbits live in the 48–94% band.
  const maxR = Math.min(W, H) / 2 - 4;
  const nucleusBound = maxR * 0.32;
  const orbitInner   = maxR * 0.50;
  const orbitOuter   = maxR * 0.94;

  // Pull electron shells from the element-data helpers; fall back to a single
  // shell holding all electrons if the data isn't loaded.
  const extra = (typeof getExtra === 'function') ? getExtra(z) : null;
  const shells = (extra && extra.shells && extra.shells.length) ? extra.shells : [Math.max(1, z)];

  // 1) Orbits (drawn first, behind everything else).
  ctx.strokeStyle = orbitColor;
  ctx.lineWidth = 1.3;
  shells.forEach((n, i) => {
    const r = shells.length === 1
      ? orbitOuter
      : (orbitInner + i * (orbitOuter - orbitInner) / (shells.length - 1));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 2) Electrons — radius bumps up when there are few total electrons so the
  //    "e" label fits inside (textbook style); shrinks for heavy elements.
  const totalE = shells.reduce((s, n) => s + n, 0);
  const electronR = totalE <= 4 ? Math.min(11, maxR * 0.16)
                                 : Math.max(2.4, maxR * 0.055);
  const showElectronLabel = electronR >= 7;
  shells.forEach((n, i) => {
    const r = shells.length === 1
      ? orbitOuter
      : (orbitInner + i * (orbitOuter - orbitInner) / (shells.length - 1));
    // Stagger each shell by half a slot so electrons don't line up radially
    const offset = -Math.PI / 2 + (i * Math.PI / Math.max(n, 6));
    for (let j = 0; j < n; j++) {
      const angle = offset + (2 * Math.PI * j / n);
      const ex = cx + Math.cos(angle) * r;
      const ey = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(ex, ey, electronR, 0, Math.PI * 2);
      ctx.fillStyle = electronColor;
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      if (showElectronLabel) {
        ctx.font = `700 ${Math.round(electronR * 1.05)}px 'DM Mono', monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('e', ex, ey + 0.5);
      }
    }
  });

  // 3) Nucleus at center (reuses the shared helper).
  drawNucleusAt(ctx, cx, cy, nucleusBound, z, a, isDark);
}

function setElementCardMeta(card, el) {
  const extra = getExtra(el.z);
  const extra2 = getExtra2(el.z);
  const nm = elName(el);
  const shells = (extra.shells || []).join('·');
  const rows = [
    [_T('ptable.mState', 'Physical State'), stateName(el.state)],
    [_T('ptable.mPeriod', 'Period'), el.period || '—'],
    [_T('ptable.mGroup', 'Group'), el.group || '—'],
    [_T('ptable.mEn', 'Electronegativity'), el.en || '—'],
    [_T('ptable.mRadius', 'Atomic Radius'), extra2.radius || '—'],
    [_T('ptable.mEconfig', 'Electron Configuration'), extra.econfig || '—']
  ];

  card.title = `${nm} (${el.sym}) · Z=${el.z} · ${el.mass} u · ${stateName(el.state)} · ${shells || '—'}`;
  card.setAttribute('aria-label', `${nm}, ${el.sym}, Z ${el.z}`);
  card.dataset.tipTitle = `${el.z} · ${el.sym} · ${nm}`;
  card.dataset.tipSubtitle = `${catName(el)} · ${el.mass} u`;
  card.dataset.tipRows = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
}

let elementTooltipEl = null;
let elementTooltipTarget = null;

function ensureElementTooltip() {
  if (elementTooltipEl) return elementTooltipEl;
  elementTooltipEl = document.createElement('div');
  elementTooltipEl.className = 'ptable-tooltip';
  elementTooltipEl.setAttribute('role', 'status');
  elementTooltipEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(elementTooltipEl);
  return elementTooltipEl;
}

function paintElementTooltip(card) {
  const tip = ensureElementTooltip();
  tip.textContent = '';

  const title = document.createElement('div');
  title.className = 'ptable-tooltip-title';
  title.textContent = card.dataset.tipTitle || '';
  tip.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.className = 'ptable-tooltip-sub';
  subtitle.textContent = card.dataset.tipSubtitle || '';
  tip.appendChild(subtitle);

  const rows = document.createElement('div');
  rows.className = 'ptable-tooltip-rows';
  (card.dataset.tipRows || '').split('\n').filter(Boolean).forEach(line => {
    const splitAt = line.indexOf(':');
    const labelText = splitAt >= 0 ? line.slice(0, splitAt) : line;
    const valueText = splitAt >= 0 ? line.slice(splitAt + 1).trim() : '';
    const label = document.createElement('span');
    label.className = 'ptable-tooltip-label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'ptable-tooltip-value';
    value.textContent = valueText || '—';
    rows.appendChild(label);
    rows.appendChild(value);
  });
  tip.appendChild(rows);
}

function moveElementTooltip(e) {
  if (!elementTooltipEl || !elementTooltipEl.classList.contains('show')) return;
  const gap = 16;
  const pad = 10;
  const rect = elementTooltipEl.getBoundingClientRect();
  let x = e.clientX + gap;
  let y = e.clientY + gap;
  if (x + rect.width + pad > window.innerWidth) x = e.clientX - rect.width - gap;
  if (y + rect.height + pad > window.innerHeight) y = e.clientY - rect.height - gap;
  elementTooltipEl.style.left = Math.max(pad, x) + 'px';
  elementTooltipEl.style.top = Math.max(pad, y) + 'px';
}

function showElementTooltip(e, card) {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
  if (elementTooltipTarget !== card) {
    elementTooltipTarget = card;
    paintElementTooltip(card);
  }
  ensureElementTooltip().classList.add('show');
  moveElementTooltip(e);
}

function hideElementTooltip() {
  if (elementTooltipEl) elementTooltipEl.classList.remove('show');
  elementTooltipTarget = null;
}

function getCardByZ(z) {
  return document.querySelector(`.el[data-z="${z}"]`);
}

function focusElementCard(z, shouldScroll = true) {
  const card = getCardByZ(z);
  if (!card) return false;
  card.focus({ preventScroll: true });
  document.querySelectorAll('.el.kbd-focus').forEach(el => el.classList.remove('kbd-focus'));
  card.classList.add('kbd-focus');
  if (shouldScroll) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  return true;
}

function findElementAt(row, col) {
  return ELEMENTS.find(e => Number(e.row) === row && Number(e.col) === col);
}

function getKeyboardBaseElement() {
  const active = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.el') : null;
  if (active) return ELEMENTS.find(e => String(e.z) === active.dataset.z);
  const shined = document.querySelector('.el.shine');
  if (shined) return ELEMENTS.find(e => String(e.z) === shined.dataset.z);
  return ELEMENTS[0];
}

function navTableByKeyboard(dx, dy) {
  const base = getKeyboardBaseElement();
  if (!base) return false;

  if (dx) {
    let col = Number(base.col);
    const row = Number(base.row);
    for (let step = 0; step < 18; step++) {
      col += dx;
      const hit = findElementAt(row, col);
      if (hit) return focusElementCard(hit.z);
      if (col < 1 || col > 18) break;
    }
    const sorted = ELEMENTS.slice().sort((a, b) => a.z - b.z);
    const idx = sorted.findIndex(e => e.z === base.z);
    const fallback = sorted[idx + dx];
    return fallback ? focusElementCard(fallback.z) : false;
  }

  if (dy) {
    let row = Number(base.row);
    const col = Number(base.col);
    for (let step = 0; step < 10; step++) {
      row += dy;
      const hit = findElementAt(row, col);
      if (hit) return focusElementCard(hit.z);
      if (row < 1 || row > 10) break;
    }
  }
  return false;
}

function bindElementTooltips() {
  const table = document.getElementById('ptable');
  if (!table || table.dataset.tooltipBound) return;
  table.dataset.tooltipBound = '1';
  table.addEventListener('mouseover', e => {
    const card = e.target.closest ? e.target.closest('.el') : null;
    if (card && table.contains(card)) showElementTooltip(e, card);
  });
  table.addEventListener('mousemove', e => {
    if (elementTooltipTarget) moveElementTooltip(e);
  });
  table.addEventListener('mouseout', e => {
    const card = e.target.closest ? e.target.closest('.el') : null;
    if (!card) return;
    if (!card.contains(e.relatedTarget)) hideElementTooltip();
  });
  table.addEventListener('click', hideElementTooltip);
}

function buildTable() {
  const table = document.getElementById('ptable');
  // Sub-pages (compare, trends, isotopes) no longer embed the full table — skip silently.
  if (!table) return;

  const grid = {};
  ELEMENTS.forEach(e => { grid[`${e.row}-${e.col}`] = e; });

  for (let row = 1; row <= 10; row++) {
    if (row === 8) {
      // Spacer
      const sp = document.createElement('div');
      sp.className = 'row-spacer';
      table.appendChild(sp);
      continue;
    }

    for (let col = 1; col <= 18; col++) {

      // f-block row labels (cols 1-2 of rows 9 & 10)
      if ((row === 9 || row === 10) && col <= 2) {
        if (col === 1) {
          const lbl = document.createElement('div');
          lbl.className = 'f-label fblock-row';
          lbl.style.gridColumn = '1 / span 2';
          lbl.style.gridRow = row;
          lbl.textContent = row === 9 ? '↳ La' : '↳ Ac';
          table.appendChild(lbl);
        }
        continue;
      }

      // Placeholder for La/Ac in main table
      if ((row === 6 || row === 7) && col === 3) {
        const ph = document.createElement('div');
        ph.className = 'el-ph';
        ph.style.gridColumn = col;
        ph.style.gridRow = row;
        ph.title = row === 6
          ? _T('ptable.fblockLanthanides', 'Lantanídeos (57–71)')
          : _T('ptable.fblockActinides',   'Actinídeos (89–103)');
        ph.innerHTML = `<span style="font-family:'DM Mono';font-size:9px">${row === 6 ? '57–71' : '89–103'}</span>`;
        table.appendChild(ph);
        continue;
      }

      const key = `${row}-${col}`;
      const el = grid[key];

      if (!el) {
        const empty = document.createElement('div');
        empty.style.gridColumn = col;
        empty.style.gridRow = row;
        table.appendChild(empty);
        continue;
      }

      const card = document.createElement('div');
      card.className = `el c-${el.cat}` + ((row === 9 || row === 10) ? ' fblock-row' : '');
      card.dataset.cat = el.cat;
      card.dataset.z   = el.z;
      card.dataset.row = el.row;
      card.dataset.col = el.col;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.style.gridColumn = col;
      card.style.gridRow    = row;
      const nm = elName(el);
      const nmShort = nm.length > 10 ? nm.substring(0, 9) + '…' : nm;
      const shells = (getExtra(el.z).shells || []).join('·');
      const stAbbr = stateAbbr(el.state);
      setElementCardMeta(card, el);
      card.innerHTML =
        `<span class="el-z">${el.z}</span>` +
        `<span class="el-shells" aria-label="electron shells">${shells}</span>` +
        (stAbbr ? `<span class="el-state" aria-label="physical state">${stAbbr}</span>` : '') +
        `<span class="el-sym">${el.sym}</span>` +
        `<span class="el-mass">${el.mass}</span>` +
        `<span class="el-name">${nmShort}</span>`;
      card.addEventListener('click', () => openModal(el));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(el);
        }
      });
      table.appendChild(card);
    }
  }
  bindElementTooltips();
}


// ════════════ MODAL ════════════



function openModal(el) {
  currentElement = el;
  // Lab Console — update data strip selected indicator
  try {
    const ds = document.getElementById('ds-selected');
    if (ds) ds.textContent = 'Z=' + el.z + ' · ' + el.sym;
  } catch(e){}
  const overlay = document.getElementById('overlay');
  document.getElementById('m-z').textContent    = el.z;
  document.getElementById('m-sym').textContent  = el.sym;
  document.getElementById('m-nm').textContent   = elName(el);
  document.getElementById('m-mass').textContent = el.mass + ' u';
  const exploreLink = document.getElementById('m-explore-link');
  if (exploreLink) {
    // Clean URLs only — Netlify pretty_urls serves periodic-table/<latin>.html
    // when /periodic-table/<latin> is requested. Drop .html so the URL bar
    // never shows the extension.
    const inPtFolder = /\/periodic-table\/.+$/.test(location.pathname);
    const latin = ELEMENT_LATIN[el.z] || el.sym.toLowerCase();
    exploreLink.href = (inPtFolder ? '' : 'periodic-table/') + latin;
  }
  document.getElementById('m-desc').textContent = (typeof elDesc === 'function' ? elDesc(el) : el.desc);
  document.getElementById('m-disc').textContent = (typeof elDisc === 'function' ? elDisc(el) : el.disc);
  document.getElementById('m-year').textContent = el.year;
  document.getElementById('m-en').textContent   = el.en;
  document.getElementById('m-state').textContent  = stateName(el.state);
  document.getElementById('m-period').textContent = el.period;
  document.getElementById('m-group').textContent  = el.group;

  const extra  = getExtra(el.z);
  const extra2 = getExtra2(el.z);

  document.getElementById('m-melt').textContent    = extra.melt;
  document.getElementById('m-boil').textContent    = extra.boil;
  document.getElementById('m-density').textContent = extra2.density;
  document.getElementById('m-radius').textContent  = extra2.radius;
  document.getElementById('m-econfig').textContent = extra.econfig;

  // Oxidation states
  const oxEl = document.getElementById('m-oxidation');
  if (extra2.oxidation && extra2.oxidation.length > 0) {
    oxEl.innerHTML = extra2.oxidation.map(o =>
      `<span class="m-ox-badge${o.c?' common':''}">${o.v}</span>`
    ).join('');
  } else {
    oxEl.innerHTML = '<span class="m-ox-badge">—</span>';
  }

  // Valence bar
  const valNum = typeof extra2.valence === 'number' ? extra2.valence : 0;
  const pct = Math.min(100, (valNum / 8) * 100);
  document.getElementById('m-valence-fill').style.width = pct + '%';
  document.getElementById('m-valence-num').textContent  = valNum + (valNum > 0 ? ' e⁻' : '—');

  // Shells
  const shellNames = ['K','L','M','N','O','P','Q'];
  const shellsEl = document.getElementById('m-shells');
  shellsEl.innerHTML = extra.shells.map((n,i) => `
    <div class="m-shell-badge">
      <span class="m-shell-lbl">${shellNames[i]}</span>
      <span class="m-shell-val">${n}</span>
    </div>`).join('');

  // Occurrence (translation-aware via elOccurrence)
  const occList = (typeof elOccurrence === 'function') ? elOccurrence(el.z) : extra2.occurrence;
  const occEl = document.getElementById('m-occurrence');
  occEl.innerHTML = (occList || []).map(o =>
    `<span class="m-occur-tag"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".5"/><circle cx="4.5" cy="4.5" r="1.5" fill="currentColor" opacity=".6"/></svg>${o}</span>`
  ).join('');

  // Apps (translation-aware via elApps)
  const appsList = (typeof elApps === 'function') ? elApps(el.z) : extra.apps;
  const appsEl = document.getElementById('m-apps');
  appsEl.innerHTML = (appsList || []).map(a => `<span class="m-app-tag">${a}</span>`).join('');

  // Fun fact (translation-aware via elFunfact)
  const funfactText = (typeof elFunfact === 'function') ? elFunfact(el.z) : extra2.funfact;
  const ffWrap = document.getElementById('m-funfact-wrap');
  const ffEl   = document.getElementById('m-funfact');
  if (funfactText) {
    ffEl.textContent = funfactText;
    ffWrap.style.display = '';
  } else {
    ffWrap.style.display = 'none';
  }

  const cat = document.getElementById('m-cat');
  cat.textContent = catName(el);
  cat.className   = `modal-cat c-${el.cat}`;

  const left = document.getElementById('modal-l');
  left.className = `modal-l c-${el.cat}`;

  overlay.classList.add('open');
  // Reflect navigation availability (prev disabled at Z=1, next disabled at Z=118)
  updateNavButtons();

  // Start paused (stable original state) on every new element
  bohrPaused['bohr-canvas'] = true;
  const mainWrap = document.getElementById('bohr-wrap-main');
  if (mainWrap) {
    mainWrap.classList.add('paused');
    const frame = mainWrap.closest('.bohr-frame');
    if (frame) frame.classList.add('paused');
    const icon = document.getElementById('bohr-play-icon');
    if (icon) icon.innerHTML = '<path d="M5 4 L12 8 L5 12 Z"/>';
  }

  drawBohr(el);
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  // Stop the main viewer's animation loop (using the per-canvas registry)
  if (bohrAnims['bohr-canvas']) {
    cancelAnimationFrame(bohrAnims['bohr-canvas']);
    bohrAnims['bohr-canvas'] = null;
  }
}

// ── Modal v2 ──
// Navigate to the previous (-1) / next (+1) element by atomic number.
// Stops at Z=1 and Z=118 (buttons disabled there). Scrolls the modal back to top.
function navElement(dir) {
  if (!currentElement) return;
  const targetZ = currentElement.z + dir;
  if (targetZ < 1 || targetZ > 118) return;
  const next = (typeof ELEMENTS !== 'undefined') ? ELEMENTS.find(e => e.z === targetZ) : null;
  if (!next) return;
  openModal(next);
  const modalR = document.getElementById('modal-r') || document.querySelector('.modal-r');
  if (modalR) modalR.scrollTop = 0;
}
function updateNavButtons() {
  const prev = document.getElementById('m-nav-prev');
  const next = document.getElementById('m-nav-next');
  if (!currentElement) return;
  if (prev) prev.disabled = currentElement.z <= 1;
  if (next) next.disabled = currentElement.z >= 118;
}

// Add the currently displayed element to the next available compare slot.
// On compare.html: writes to cmpSelection directly + re-renders (user sees it instantly).
// On other pages: persists to localStorage AND navigates to compare.html (so the user
// actually lands somewhere where the slot picker is visible).
function addCurrentToCompare() {
  if (!currentElement) return;
  const z = currentElement.z;
  const onComparePage = /\/compare(\.html|$|\?)/.test(location.pathname + location.search);

  if (onComparePage && typeof cmpSelection !== 'undefined' && cmpSelection !== null) {
    const slot1 = cmpSelection[1];
    const slot2 = cmpSelection[2];
    if (slot1 !== z && slot2 !== z) {
      const target = (slot1 == null) ? 1 : (slot2 == null ? 2 : (cmpLastTouched === 1 ? 2 : 1));
      cmpSelection[target] = z;
      cmpLastTouched = target;
      if (typeof renderCompare === 'function') renderCompare();
    }
    const btn = document.getElementById('m-nav-compare');
    if (btn) {
      btn.classList.add('flash-success');
      setTimeout(() => btn.classList.remove('flash-success'), 600);
    }
    return;
  }

  // Other pages: queue + navigate. Compare page's initCompare() will hydrate from the queue.
  try {
    const queue = JSON.parse(localStorage.getItem('atomurus-compare-queue') || '[]');
    const filtered = queue.filter(zz => zz !== z);
    filtered.push(z);
    while (filtered.length > 2) filtered.shift();
    localStorage.setItem('atomurus-compare-queue', JSON.stringify(filtered));
  } catch(e){}

  // Pick the right relative path: we may be at root (/periodic-table) or in /periodic-table/<sub>
  const inSubPage = /\/periodic-table\/[^/]+(\.html)?$/.test(location.pathname);
  // Production (Netlify) serves the extensionless URL via pretty_urls; local file:// and dev
  // servers without rewrites need the .html. We probe by current pathname.
  const usesHtml = /\.html(\?|$)/.test(location.pathname + location.search);
  const target = (inSubPage ? 'compare' : 'periodic-table/compare') + (usesHtml ? '.html' : '');
  location.href = target;
}
// Track which slot was filled most recently so we can rotate fairly on overflow
let cmpLastTouched = 2;

// ════════════ PDF — ELEMENT ════════════
function downloadElementPDF() { downloadElement('pdf'); }

// Renders a self-contained element card to canvas (NOT a screenshot of the modal).
// Includes all properties, configuration, Bohr model and atomurus.com branding.
function renderElementCard(el) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const extra  = getExtra(el.z);
  const extra2 = getExtra2(el.z);
  const PAL = isDark ? {
    bg:'#111210', surface:'#1A1918', border:'#2E2C29', borderSoft:'#26241F',
    fg:'#F0EDE8', fg2:'#9A948C', fg3:'#6B665E', accent:'#34A872',
    callout:'rgba(52,168,114,.10)'
  } : {
    bg:'#FFFEFC', surface:'#F6F3ED', border:'#DDD8CE', borderSoft:'#E8E3DB',
    fg:'#1A1814', fg2:'#5A5550', fg3:'#9A948C', accent:'#1E6A50',
    callout:'rgba(30,106,80,.07)'
  };
  const CAT_BG = isDark
    ? { nonmetal:'#1A3A1A', noble:'#332E00', alkali:'#2E1010', alkaline:'#2E1E00',
        metalloid:'#1A1430', polyatomic:'#0C2030', posttrans:'#142010',
        transition:'#201E18', lanthanide:'#280C22', actinide:'#280C14' }
    : { nonmetal:'#D2EDD2', noble:'#FFF0C0', alkali:'#FFD4D4', alkaline:'#FFE4C0',
        metalloid:'#E4DEFF', polyatomic:'#D4ECFA', posttrans:'#E4EED8',
        transition:'#EAE5DC', lanthanide:'#F4DCED', actinide:'#F0DDE4' };
  const CAT_TX = isDark
    ? { nonmetal:'#7ECC7E', noble:'#D4AA30', alkali:'#E08080', alkaline:'#E0A860',
        metalloid:'#A898F0', polyatomic:'#70C0E8', posttrans:'#88C868',
        transition:'#B0A888', lanthanide:'#D088C0', actinide:'#D08098' }
    : { nonmetal:'#1E5C1E', noble:'#7A5500', alkali:'#8B1818', alkaline:'#7A4200',
        metalloid:'#3A2680', polyatomic:'#0E4E70', posttrans:'#2E520E',
        transition:'#3E3820', lanthanide:'#680056', actinide:'#6A1830' };

  const S = 2; // 2x scale for retina
  const W = 1200 * S;
  const PAD = 56 * S;
  const HDR_H = 320 * S;
  const COL_GAP = 32 * S;
  const RIGHT_W = 360 * S;
  const LEFT_W = W - PAD*2 - RIGHT_W - COL_GAP;

  // Pre-measure to determine total height
  const tmp = document.createElement('canvas');
  const m = tmp.getContext('2d');
  function wrap(text, font, maxW) {
    m.font = font;
    const words = String(text || '').split(/\s+/);
    const lines = []; let line = '';
    for (var i=0;i<words.length;i++){
      var t = line ? line + ' ' + words[i] : words[i];
      if (m.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  const _desc = (typeof elDesc === 'function' ? elDesc(el) : el.desc) || '';
  const descLines = wrap(_desc, 'normal ' + (14*S) + "px 'DM Sans', sans-serif", LEFT_W);
  const ff = (typeof elFunfact === 'function' ? elFunfact(el.z) : extra2.funfact) || '';
  const ffLines = ff ? wrap(ff, 'italic ' + (13*S) + "px 'DM Sans', sans-serif", LEFT_W - 24*S) : [];

  // Section heights
  const SEC_GAP = 22 * S;
  const LBL_H = 22 * S;
  let leftH = 0;
  leftH += SEC_GAP + LBL_H + descLines.length * 19*S; // description
  leftH += SEC_GAP + LBL_H + 18*S;                    // discovery
  leftH += SEC_GAP + LBL_H + 4 * (24*S);              // properties grid (4 rows)
  leftH += SEC_GAP + LBL_H + 32*S;                    // oxidation
  leftH += SEC_GAP + LBL_H + 24*S;                    // econfig
  leftH += SEC_GAP + LBL_H + 32*S;                    // shells
  leftH += SEC_GAP + LBL_H + 32*S;                    // occurrence
  leftH += SEC_GAP + LBL_H + 32*S;                    // apps
  if (ffLines.length) leftH += SEC_GAP + LBL_H + 16*S + ffLines.length * 18*S + 16*S; // funfact callout

  const rightH = RIGHT_W + 40*S; // Bohr + Z label
  const bodyH  = Math.max(leftH, rightH) + PAD;
  const FOOT_H = 56 * S;
  const H = HDR_H + bodyH + FOOT_H;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, W, H);

  // Header strip — colored by category
  const catBg = CAT_BG[el.cat] || PAL.surface;
  const catTx = CAT_TX[el.cat] || PAL.accent;
  ctx.fillStyle = catBg;
  ctx.fillRect(0, 0, W, HDR_H);

  // Logo (small atom mark) top-left
  (function drawLogo(){
    const cx = PAD + 18*S, cy = PAD + 18*S, r = 14*S;
    ctx.strokeStyle = catTx; ctx.lineWidth = 1.2*S;
    for (let i=0;i<3;i++){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * Math.PI/3);
      ctx.beginPath();
      ctx.ellipse(0,0,r,r*0.45,0,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = catTx;
    ctx.beginPath(); ctx.arc(cx, cy, 3*S, 0, Math.PI*2); ctx.fill();
    ctx.font = '600 ' + (12*S) + "px 'DM Mono', monospace";
    ctx.fillStyle = catTx;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('ATOMURUS', cx + r + 12*S, cy);
  })();

  // Z (top-right of header)
  ctx.font = "500 " + (16*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = catTx; ctx.globalAlpha = 0.55;
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('Z ' + el.z, W - PAD, PAD);
  ctx.globalAlpha = 1;

  // Symbol — huge serif
  ctx.font = '400 ' + (180*S) + "px 'DM Serif Display', serif";
  ctx.fillStyle = catTx;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(el.sym, PAD, HDR_H - 70*S);

  // Element name
  ctx.font = '400 ' + (34*S) + "px 'DM Serif Display', serif";
  ctx.fillStyle = catTx;
  ctx.fillText(elName(el), PAD, HDR_H - 28*S);

  // Mass — top-right of header (below Z)
  ctx.textAlign = 'right';
  ctx.font = '500 ' + (10*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = catTx; ctx.globalAlpha = 0.55;
  ctx.fillText(_T('ptable.canvasAtomicMass', 'ATOMIC MASS'), W - PAD, PAD + 30*S);
  ctx.globalAlpha = 1;
  ctx.font = '500 ' + (22*S) + "px 'DM Mono', monospace";
  ctx.fillText(el.mass + ' u', W - PAD, PAD + 50*S);

  // Category badge
  const catLbl = (typeof catName === 'function' ? catName(el) : (CAT_NAMES[el.cat] || el.cat));
  ctx.font = '600 ' + (11*S) + "px 'DM Mono', monospace";
  const cw = ctx.measureText(catLbl.toUpperCase()).width + 24*S;
  const ch = 22*S;
  const cx = W - PAD - cw, cy = HDR_H - 40*S;
  ctx.strokeStyle = catTx; ctx.lineWidth = 1.5*S;
  ctx.beginPath();
  roundRectPath(ctx, cx, cy, cw, ch, ch/2);
  ctx.stroke();
  ctx.fillStyle = catTx;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(catLbl.toUpperCase(), cx + cw/2, cy + ch/2 + 1);

  // ── BODY ──
  let y = HDR_H + PAD;
  const leftX = PAD;

  function sectionLabel(text) {
    ctx.font = '600 ' + (10*S) + "px 'DM Mono', monospace";
    ctx.fillStyle = PAL.fg3;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(text.toUpperCase(), leftX, y);
    // Underline
    ctx.strokeStyle = PAL.borderSoft; ctx.lineWidth = 1*S;
    ctx.beginPath();
    ctx.moveTo(leftX, y + 16*S);
    ctx.lineTo(leftX + LEFT_W, y + 16*S);
    ctx.stroke();
    y += LBL_H;
  }

  // 1. Description
  sectionLabel(_T('ptable.mDescription', 'Descrição'));
  ctx.font = 'normal ' + (14*S) + "px 'DM Sans', sans-serif";
  ctx.fillStyle = PAL.fg;
  descLines.forEach((line) => { ctx.fillText(line, leftX, y); y += 19*S; });
  y += SEC_GAP;

  // 2. Discovery
  sectionLabel(_T('ptable.mDiscovery', 'Descoberta'));
  ctx.font = '500 ' + (14*S) + "px 'DM Sans', sans-serif";
  ctx.fillStyle = PAL.fg;
  ctx.fillText((el.disc || '—') + '  ·  ' + (el.year || '—'), leftX, y);
  y += 18*S + SEC_GAP;

  // 3. Properties grid (2 columns x 4 rows)
  sectionLabel(_T('ptable.mProperties', 'Propriedades'));
  const props = [
    [_T('ptable.mEn',     'Eletronegatividade'), el.en],
    [_T('ptable.mState',  'Estado físico'),      stateName(el.state)],
    [_T('ptable.mPeriod', 'Período'),            el.period],
    [_T('ptable.mGroup',  'Grupo'),              el.group],
    [_T('ptable.mMelt',   'Ponto de fusão'),     extra.melt],
    [_T('ptable.mBoil',   'Ponto de ebulição'),  extra.boil],
    [_T('ptable.mDensity','Densidade'),          extra2.density],
    [_T('ptable.mRadius', 'Raio atômico'),       extra2.radius],
  ];
  const colW = (LEFT_W - 16*S) / 2;
  for (let i=0;i<props.length;i++){
    const col = i % 2, row = Math.floor(i/2);
    const px = leftX + col * (colW + 16*S);
    const py = y + row * (24*S);
    ctx.font = 'normal ' + (11.5*S) + "px 'DM Sans', sans-serif";
    ctx.fillStyle = PAL.fg2;
    ctx.textAlign = 'left';
    ctx.fillText(props[i][0], px, py);
    ctx.font = '500 ' + (12*S) + "px 'DM Mono', monospace";
    ctx.fillStyle = PAL.fg;
    ctx.textAlign = 'right';
    ctx.fillText(String(props[i][1] == null ? '—' : props[i][1]), px + colW, py);
  }
  y += 4 * (24*S) + SEC_GAP;

  // Helper for chip rows
  function drawChips(items, bg, border, color) {
    let cx2 = leftX, cy2 = y;
    ctx.font = '500 ' + (11*S) + "px 'DM Mono', monospace";
    items.forEach(t => {
      const txt = String(t);
      const cw = ctx.measureText(txt).width + 18*S;
      const ch = 24*S;
      if (cx2 + cw > leftX + LEFT_W) { cx2 = leftX; cy2 += ch + 6*S; }
      ctx.fillStyle = bg;
      roundRect(ctx, cx2, cy2, cw, ch, 6*S);
      ctx.strokeStyle = border; ctx.lineWidth = 1*S;
      roundRectStroke(ctx, cx2, cy2, cw, ch, 6*S);
      ctx.fillStyle = color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, cx2 + cw/2, cy2 + ch/2 + 1);
      cx2 += cw + 6*S;
    });
    y = cy2 + 32*S;
  }

  // 4. Oxidation states
  sectionLabel(_T('ptable.mOxidation', 'Estados de oxidação'));
  drawChips(
    (extra2.oxidation && extra2.oxidation.length) ? extra2.oxidation : ['—'],
    PAL.surface, PAL.borderSoft, PAL.fg
  );
  y += SEC_GAP - 10*S;

  // 5. Electron configuration
  sectionLabel(_T('ptable.mEconfig', 'Configuração eletrônica'));
  ctx.font = '500 ' + (14*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = PAL.fg;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(extra.econfig || '—', leftX, y);
  y += 24*S + SEC_GAP;

  // 6. Shells
  sectionLabel(_T('ptable.mShells', 'Distribuição por camada'));
  const shellLabels = ['K','L','M','N','O','P','Q'];
  drawChips((extra.shells || []).map((n, i) => shellLabels[i] + ' ' + n), PAL.surface, PAL.borderSoft, PAL.fg);
  y += SEC_GAP - 10*S;

  // 7. Occurrence
  sectionLabel(_T('ptable.mOccurrence', 'Onde é encontrado'));
  var _occ = (typeof elOccurrence === 'function') ? elOccurrence(el.z) : extra2.occurrence;
  drawChips((_occ && _occ.length) ? _occ : ['—'],
    PAL.surface, PAL.borderSoft, PAL.fg2);
  y += SEC_GAP - 10*S;

  // 8. Apps
  sectionLabel(_T('ptable.mApps', 'Aplicações reais'));
  var _apps = (typeof elApps === 'function') ? elApps(el.z) : extra.apps;
  drawChips((_apps && _apps.length) ? _apps : ['—'],
    PAL.surface, PAL.borderSoft, PAL.fg2);
  y += SEC_GAP - 10*S;

  // 9. Fun fact callout
  if (ffLines.length) {
    sectionLabel(_T('ptable.mFunfact', 'Curiosidade'));
    const boxH = ffLines.length * 18*S + 24*S;
    ctx.fillStyle = PAL.callout;
    roundRect(ctx, leftX, y, LEFT_W, boxH, 8*S);
    // Accent stripe
    ctx.fillStyle = PAL.accent;
    ctx.fillRect(leftX, y, 3*S, boxH);
    ctx.font = 'italic ' + (13*S) + "px 'DM Sans', sans-serif";
    ctx.fillStyle = PAL.fg;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let ty = y + 12*S;
    ffLines.forEach(line => { ctx.fillText(line, leftX + 14*S, ty); ty += 18*S; });
    y += boxH + SEC_GAP;
  }

  // ── RIGHT COLUMN: Bohr model ──
  const rx = W - PAD - RIGHT_W;
  const ry = HDR_H + PAD;
  ctx.font = '600 ' + (10*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = PAL.fg3;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(_T('ptable.canvasBohrModel', 'MODELO DE BOHR'), rx, ry);

  // Render Bohr to offscreen and composite
  const bSize = RIGHT_W;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = bSize; bCanvas.height = bSize;
  const bCtx = bCanvas.getContext('2d');
  drawBohrInto(bCtx, bSize, bSize, el, extra, isDark);
  ctx.drawImage(bCanvas, rx, ry + 24*S);

  // ── FOOTER ──
  const fy = H - FOOT_H;
  ctx.fillStyle = PAL.surface;
  ctx.fillRect(0, fy, W, FOOT_H);
  ctx.strokeStyle = PAL.borderSoft; ctx.lineWidth = 1*S;
  ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke();

  ctx.font = '600 ' + (14*S) + "px 'DM Sans', sans-serif";
  ctx.fillStyle = PAL.accent;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('atomurus.com', PAD, fy + FOOT_H/2);

  ctx.font = '500 ' + (11*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = PAL.fg3;
  ctx.textAlign = 'right';
  ctx.fillText('Z = ' + el.z + '  ·  ' + el.sym + '  ·  ' + elName(el), W - PAD, fy + FOOT_H/2);

  return canvas;
}

// Rounded rect helpers
function roundRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
function roundRect(ctx, x, y, w, h, r){ roundRectPath(ctx, x, y, w, h, r); ctx.fill(); }
function roundRectStroke(ctx, x, y, w, h, r){ roundRectPath(ctx, x, y, w, h, r); ctx.stroke(); }

// Static Bohr renderer for export (paused canonical state, textbook style)
function drawBohrInto(ctx, W, H, el, extra, isDark){
  const cx = W/2, cy = H/2;
  const shells = extra.shells || [];
  const orbitColor   = isDark ? 'rgba(255,255,255,.16)' : 'rgba(26,24,20,.22)';
  const nucleusColor = isDark ? '#f87171' : '#dc2626';
  const electronColor= isDark ? '#bfdbfe' : '#1d4ed8';
  const labelColor   = isDark ? 'rgba(240,237,232,.55)' : 'rgba(26,24,20,.5)';
  const scale = Math.min(W, H) / 148;
  const nucleusR = Math.max(8, 6 * scale);
  const electronR= Math.max(3, 2.6 * scale);
  const minOrbitR= 8 * scale + nucleusR;
  const baseAngles = shells.map((n) => Array.from({length:n}, (_, j) => -Math.PI/2 + (2*Math.PI*j/n)));
  const radii = shells.map((_, i) => minOrbitR + (i+1) * (Math.min(cx,cy) - minOrbitR - 8*scale) / (shells.length + .5));

  ctx.clearRect(0,0,W,H);
  // Orbits
  shells.forEach((_, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radii[i], 0, Math.PI*2);
    ctx.strokeStyle = orbitColor;
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
  });
  // Nucleus
  ctx.beginPath(); ctx.arc(cx, cy, nucleusR, 0, Math.PI*2);
  ctx.fillStyle = nucleusColor; ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '600 ' + Math.max(10, Math.round(7 * scale)) + "px 'DM Mono', monospace";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(el.z), cx, cy + 0.5);
  // Electrons + shell labels
  shells.forEach((n, i) => {
    for (let j=0;j<n;j++){
      const angle = baseAngles[i][j];
      const ex = cx + Math.cos(angle) * radii[i];
      const ey = cy + Math.sin(angle) * radii[i];
      ctx.beginPath(); ctx.arc(ex, ey, electronR, 0, Math.PI*2);
      ctx.fillStyle = electronColor; ctx.fill();
    }
    // Count label
    ctx.fillStyle = labelColor;
    ctx.font = '500 ' + Math.max(9, Math.round(8 * scale)) + "px 'DM Mono', monospace";
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const lx = cx + radii[i] + 3 * scale;
    if (lx + 10 * scale < W) ctx.fillText(String(n), lx, cy - 1);
  });
}

async function downloadElement(fmt) {
  if (!currentElement) return;
  const el = currentElement;
  const canvas = renderElementCard(el);
  const fname = 'atomurus-' + el.sym.toLowerCase();
  if (fmt === 'pdf') {
    await ensureJsPdf();
    const { jsPDF } = window.jspdf;
    const w = canvas.width, h = canvas.height;
    const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit:'px', format:[w,h] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
    pdf.setProperties({ title:'Atomurus — ' + (elName(el) || el.sym), author:'Atomurus · atomurus.com' });
    pdf.save(fname + '.pdf');
  } else {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = fname + '.png';
    a.click();
  }
}

// ════════════ PNG — FULL TABLE (Canvas renderer) ════════════
function downloadTablePDF() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // ── Palette ──────────────────────────────────────────────
  const PAL = isDark ? {
    bg:      '#111210', surface: '#1A1918', border: '#2E2C29',
    fg:      '#F0EDE8', fg2:     '#9A948C', accent: '#34A872',
    catBg: { nonmetal:'#1A3A1A', noble:'#332E00', alkali:'#2E1010', alkaline:'#2E1E00',
             metalloid:'#1A1430', polyatomic:'#0C2030', posttrans:'#142010',
             transition:'#201E18', lanthanide:'#280C22', actinide:'#280C14' },
    catTx: { nonmetal:'#7ECC7E', noble:'#D4AA30', alkali:'#E08080', alkaline:'#E0A860',
             metalloid:'#A898F0', polyatomic:'#70C0E8', posttrans:'#88C868',
             transition:'#B0A888', lanthanide:'#D088C0', actinide:'#D08098' },
  } : {
    bg:      '#FFFFFF', surface: '#F4F1EC', border: '#DDD8CE',
    fg:      '#1A1814', fg2:     '#6B6560', accent: '#1E6A50',
    catBg: { nonmetal:'#D2EDD2', noble:'#FFF0C0', alkali:'#FFD4D4', alkaline:'#FFE4C0',
             metalloid:'#E4DEFF', polyatomic:'#D4ECFA', posttrans:'#E4EED8',
             transition:'#EAE5DC', lanthanide:'#F4DCED', actinide:'#F0DDE4' },
    catTx: { nonmetal:'#1E5C1E', noble:'#7A5500', alkali:'#8B1818', alkaline:'#7A4200',
             metalloid:'#3A2680', polyatomic:'#0E4E70', posttrans:'#2E520E',
             transition:'#3E3820', lanthanide:'#680056', actinide:'#6A1830' },
  };

  // ── Layout constants ─────────────────────────────────────
  const S   = 2;          // scale (2x = retina quality)
  const CS  = 52 * S;     // cell size px
  const GAP = 3 * S;      // gap between cells
  const R   = 5 * S;      // corner radius
  const PAD = 24 * S;     // outer padding

  const COLS = 18, MAIN_ROWS = 7, F_COLS = 15, F_ROWS = 2;

  // Header area
  const HDR_H   = 52 * S;
  // Main table height
  const MAIN_H  = MAIN_ROWS * CS + (MAIN_ROWS - 1) * GAP;
  // Gap between main table and f-block
  const SEP_H   = 38 * S;
  // f-block rows
  const F_H     = F_ROWS * CS + (F_ROWS - 1) * GAP;
  // Legend row
  const LEG_ROW = 5;
  const LEG_H   = Math.ceil(Object.keys(CAT_NAMES).length / LEG_ROW) * (14 * S) + 8 * S;
  // Footer
  const FOOT_H  = 22 * S;

  const TOTAL_W = PAD * 2 + COLS * CS + (COLS - 1) * GAP;
  const TOTAL_H = PAD + HDR_H + MAIN_H + SEP_H + F_H + 14 * S + LEG_H + FOOT_H + PAD;

  const canvas = document.createElement('canvas');
  canvas.width  = TOTAL_W;
  canvas.height = TOTAL_H;
  const ctx = canvas.getContext('2d');

  // ── Helpers ───────────────────────────────────────────────
  function hexToRgba(hex, a = 1) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawCell(x, y, w, h, el) {
    const bg  = PAL.catBg[el.cat] || PAL.surface;
    const txt = PAL.catTx[el.cat] || PAL.fg;

    // Background
    ctx.fillStyle = bg;
    roundRect(x, y, w, h, R);
    ctx.fill();

    // Border (subtle)
    ctx.strokeStyle = hexToRgba(txt, 0.28);
    ctx.lineWidth = 1 * S;
    roundRect(x, y, w, h, R);
    ctx.stroke();

    // Atomic number
    ctx.fillStyle = hexToRgba(txt, 0.65);
    ctx.font = `${9 * S}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(String(el.z), x + 4 * S, y + 11 * S);

    // Symbol
    ctx.fillStyle = txt;
    ctx.font = `bold ${19 * S}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(el.sym, x + w / 2, y + h * 0.62);

    // Name (truncated)
    const nm = elName(el).length > 9 ? elName(el).substring(0, 8) + '…' : elName(el);
    ctx.fillStyle = hexToRgba(txt, 0.75);
    ctx.font = `${7.5 * S}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(nm, x + w / 2, y + h - 6 * S);
  }

  function drawPlaceholder(x, y, w, h, label) {
    ctx.fillStyle = PAL.surface;
    roundRect(x, y, w, h, R);
    ctx.fill();
    ctx.strokeStyle = PAL.border;
    ctx.lineWidth = 1 * S;
    ctx.setLineDash([3 * S, 3 * S]);
    roundRect(x, y, w, h, R);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PAL.fg2;
    ctx.font = `${8 * S}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 3 * S);
  }

  function colX(col) { return PAD + (col - 1) * (CS + GAP); }
  function rowY(row, baseY) { return baseY + (row - 1) * (CS + GAP); }

  // ── Build element lookup ──────────────────────────────────
  const grid = {};
  ELEMENTS.forEach(e => { grid[`${e.row}-${e.col}`] = e; });

  // ── Background ───────────────────────────────────────────
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);

  let curY = PAD;

  // ── Header ───────────────────────────────────────────────
  // Logo
  ctx.font = `bold ${22 * S}px Georgia, serif`;
  ctx.fillStyle = PAL.accent;
  ctx.textAlign = 'left';
  ctx.fillText('Atomurus', PAD, curY + 24 * S);

  ctx.font = `${10 * S}px Arial, sans-serif`;
  ctx.fillStyle = PAL.fg2;
  ctx.fillText(_T('ptable.canvasHeader', 'Periodic Table · 118 Elementos IUPAC') + ' · ' + new Date().getFullYear(), PAD, curY + 42 * S);

  // Divider line
  ctx.strokeStyle = PAL.border;
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(PAD, curY + HDR_H);
  ctx.lineTo(TOTAL_W - PAD, curY + HDR_H);
  ctx.stroke();

  curY += HDR_H + 14 * S;

  // ── Main table (rows 1-7) ────────────────────────────────
  const mainBaseY = curY;

  for (let row = 1; row <= 7; row++) {
    for (let col = 1; col <= 18; col++) {
      const x = colX(col);
      const y = rowY(row, mainBaseY);

      // f-block placeholders at col 3 rows 6 & 7
      if (col === 3 && row === 6) { drawPlaceholder(x, y, CS, CS, '57–71'); continue; }
      if (col === 3 && row === 7) { drawPlaceholder(x, y, CS, CS, '89–103'); continue; }

      const el = grid[`${row}-${col}`];
      if (el) drawCell(x, y, CS, CS, el);
    }
  }

  curY += MAIN_H;

  // f-block Y positions
  const fBlockBaseY = curY + SEP_H;
  const actBaseY    = fBlockBaseY + CS + GAP;

  // ── Connector bracket: purple L-shape ────────────────────
  const bracketColor  = hexToRgba('#9B5CF6', 0.85);
  const bracketColor2 = hexToRgba('#C4B5FD', 0.70);

  const ph6Left = colX(3);
  const ph6Bot  = rowY(6, mainBaseY) + CS;
  const ph7Left = colX(3);
  const ph7Bot  = rowY(7, mainBaseY) + CS;

  const laLeft  = colX(4);
  const laY     = fBlockBaseY + CS / 2;
  const acLeft  = colX(4);
  const acY     = actBaseY   + CS / 2;

  const col2Right = colX(2) + CS;
  const spineX    = col2Right + (ph6Left - col2Right) / 2;

  ctx.strokeStyle = bracketColor;
  ctx.lineWidth   = 1.8 * S;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([]);

  // Main vertical spine: from ph6 bottom down to acY
  ctx.beginPath();
  ctx.moveTo(spineX, ph6Bot);
  ctx.lineTo(spineX, acY);
  ctx.stroke();

  // Horizontal: ph6 bottom-left → spine
  ctx.beginPath();
  ctx.moveTo(ph6Left, ph6Bot);
  ctx.lineTo(spineX,  ph6Bot);
  ctx.stroke();

  // Horizontal: ph7 bottom-left → spine
  ctx.beginPath();
  ctx.moveTo(ph7Left, ph7Bot);
  ctx.lineTo(spineX,  ph7Bot);
  ctx.stroke();

  // Horizontal arm → La
  ctx.beginPath();
  ctx.moveTo(spineX, laY);
  ctx.lineTo(laLeft, laY);
  ctx.stroke();
  // Arrowhead at La
  ctx.fillStyle = bracketColor;
  ctx.beginPath();
  ctx.moveTo(laLeft, laY);
  ctx.lineTo(laLeft - 6*S, laY - 3.5*S);
  ctx.lineTo(laLeft - 6*S, laY + 3.5*S);
  ctx.closePath(); ctx.fill();

  // Horizontal arm → Ac
  ctx.beginPath();
  ctx.moveTo(spineX, acY);
  ctx.lineTo(acLeft, acY);
  ctx.stroke();
  // Arrowhead at Ac
  ctx.beginPath();
  ctx.moveTo(acLeft, acY);
  ctx.lineTo(acLeft - 6*S, acY - 3.5*S);
  ctx.lineTo(acLeft - 6*S, acY + 3.5*S);
  ctx.closePath(); ctx.fill();

  // Labels just right of the spine, above each arm
  ctx.font = `italic ${8 * S}px Arial, sans-serif`;
  ctx.fillStyle = bracketColor2;
  ctx.textAlign = 'left';
  ctx.fillText(_T('ptable.fblockLanthanides', 'Lantanídeos (57–71)'), spineX + 4 * S, laY - 4 * S);
  ctx.fillText(_T('ptable.fblockActinides',   'Actinídeos (89–103)'), spineX + 4 * S, acY - 4 * S);

  // ── f-block cells (La–Lu row 9, Ac–Lr row 10) ───────────
  // La at col:3 → fc=0, Ce at col:4 → fc=1 … Lu at col:17 → fc=14
  const fEls = ELEMENTS.filter(e => e.row === 9 || e.row === 10);

  fEls.forEach(e => {
    const fc = e.col - 3;                       // col3→0, col4→1, …col17→14
    const fr = e.row - 8;                       // row9→1, row10→2
    const x  = colX(3) + fc * (CS + GAP);
    const y  = fBlockBaseY + (fr - 1) * (CS + GAP);
    drawCell(x, y, CS, CS, e);
  });

  curY = fBlockBaseY + F_H;

  // ── Legend ───────────────────────────────────────────────
  curY += 18 * S;
  const legEntries = Object.entries(CAT_NAMES);
  const DOT = 11 * S;
  const LEG_ITEM_W = 168 * S;
  ctx.font = `${9 * S}px Arial, sans-serif`;

  legEntries.forEach(([cat, label], i) => {
    const lx = PAD + (i % LEG_ROW) * LEG_ITEM_W;
    const ly = curY + Math.floor(i / LEG_ROW) * (14 * S);
    const bg_ = PAL.catBg[cat] || PAL.surface;
    const tx_ = PAL.catTx[cat] || PAL.fg;

    ctx.fillStyle = bg_;
    roundRect(lx, ly, DOT, DOT, 2 * S);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(tx_, 0.5);
    ctx.lineWidth = 1 * S;
    roundRect(lx, ly, DOT, DOT, 2 * S);
    ctx.stroke();

    ctx.fillStyle = PAL.fg2;
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + DOT + 5 * S, ly + DOT - 1 * S);
  });

  curY += LEG_H;

  // ── Footer ───────────────────────────────────────────────
  ctx.strokeStyle = PAL.border;
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(PAD, curY);
  ctx.lineTo(TOTAL_W - PAD, curY);
  ctx.stroke();

  curY += 8 * S;
  ctx.font = `${9 * S}px Arial, sans-serif`;
  ctx.fillStyle = PAL.fg2;
  ctx.textAlign = 'left';
  ctx.fillText(_T('ptable.canvasBrand', 'Atomurus — Plataforma de Química Interativa'), PAD, curY + 12 * S);
  ctx.textAlign = 'right';
  ctx.fillText(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · atomurus.com`, TOTAL_W - PAD, curY + 12 * S);

  // ── Download ──────────────────────────────────────────────
  try {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atomurus-tabela-periodica-${isDark ? 'dark' : 'light'}-${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
  } catch(e) {
    // Fallback: open in new tab
    window.open(canvas.toDataURL('image/png'), '_blank');
  }
}

function overlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

document.addEventListener('keydown', e => {
  // Don't intercept while typing in an input/textarea/select
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === 'Escape') {
    const cmpPicker = document.getElementById('cmp-picker-overlay');
    if (cmpPicker && cmpPicker.classList.contains('open')) { closeCompPicker(); return; }
    const overlay = document.getElementById('overlay');
    if (overlay && overlay.classList.contains('open')) { closeModal(); return; }
    if (document.body.classList.contains('fs-table')) toggleFullTable();
    return;
  }

  // Arrow keys navigate prev/next element while the modal is open
  const overlay = document.getElementById('overlay');
  if (overlay && overlay.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); navElement(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); navElement(1);  return; }
  }

  if (e.key === '/') {
    const search = document.getElementById('search-input');
    if (search && !search.disabled) {
      e.preventDefault();
      search.focus();
      search.select();
    }
    return;
  }

  const tableKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  if (tableKeys.includes(e.key)) {
    const dir = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[e.key];
    if (navTableByKeyboard(dir[0], dir[1])) e.preventDefault();
  }
});

// ════════════ FULLSCREEN TABLE MODE ════════════
// Real fullscreen via Fullscreen API on body — modal overlay still works because
// it lives in the same DOM tree. If the API is unavailable (or denied), fall back
// to a CSS-only "fake fullscreen" via body.fs-table class.
function toggleFullTable() {
  const inFs = document.fullscreenElement || document.webkitFullscreenElement;
  if (inFs) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  const req = document.body.requestFullscreen || document.body.webkitRequestFullscreen;
  if (req) {
    try {
      req.call(document.body);
      document.body.classList.add('fs-table');
      return;
    } catch (e) { /* fall through to CSS-only mode */ }
  }
  // CSS-only fallback
  document.body.classList.toggle('fs-table');
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) document.body.classList.remove('fs-table');
});
document.addEventListener('webkitfullscreenchange', () => {
  if (!document.webkitFullscreenElement) document.body.classList.remove('fs-table');
});

// ════════════ FILTER ════════════
let activeFilters = new Set();
let currentElement = null;

function filterCat(cat) {
  if (!cat) { clearFilter(); return; }

  // Toggle: if already selected, remove; else add
  if (activeFilters.has(cat)) {
    activeFilters.delete(cat);
  } else {
    activeFilters.add(cat);
  }

  applyFilter();
}

function clearFilter() {
  activeFilters.clear();
  applyFilter();
}

function applyFilter() {
  const hasSel = activeFilters.size > 0;

  // Show/hide "Remover seleção" button
  const clearBtn = document.getElementById('legend-clear-btn');
  if (clearBtn) clearBtn.style.display = hasSel ? 'flex' : 'none';

  // Dim/highlight elements
  document.querySelectorAll('.el').forEach(el => {
    el.classList.remove('dim');
    if (hasSel && !activeFilters.has(el.dataset.cat)) {
      el.classList.add('dim');
    }
  });

  // Update legend item states
  document.querySelectorAll('.legend-item').forEach(item => {
    item.classList.remove('active-filter', 'dimmed');
    if (!hasSel) return;
    if (activeFilters.has(item.dataset.cat)) {
      item.classList.add('active-filter');
    } else if (item.dataset.cat) {
      item.classList.add('dimmed');
    }
  });
}

// ════════════ SEARCH ════════════
let _searchTimer;
let _searchSuggestIndex = -1;

function normSearch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEARCH_ALIASES = [
  { terms:['halogenio','halogenios','halogen','halogens'], label:'Group 17 · Halogens', test:e => Number(e.group) === 17 },
  { terms:['gas nobre','gases nobres','noble gas','noble gases'], label:'Group 18 · Noble gases', test:e => e.cat === 'noble' },
  { terms:['metal alcalino','metais alcalinos','alkali','alkali metal','alkali metals'], label:'Group 1 · Alkali metals', test:e => e.cat === 'alkali' },
  { terms:['alcalino terroso','alcalino terrosos','metais alcalino terrosos','alkaline earth','alkaline earth metals'], label:'Group 2 · Alkaline earth metals', test:e => e.cat === 'alkaline' },
  { terms:['metal de transicao','metais de transicao','transition','transition metals'], label:'Transition metals', test:e => e.cat === 'transition' },
  { terms:['lantanideo','lantanideos','lanthanide','lanthanides'], label:'Lanthanides', test:e => e.cat === 'lanthanide' },
  { terms:['actinideo','actinideos','actinide','actinides'], label:'Actinides', test:e => e.cat === 'actinide' },
  { terms:['metaloide','metaloides','metalloid','metalloids'], label:'Metalloids', test:e => e.cat === 'metalloid' },
  { terms:['nao metal','nao metais','nonmetal','nonmetals'], label:'Nonmetals', test:e => e.cat === 'nonmetal' || e.cat === 'polyatomic' },
  { terms:['solido','solidos','solid','solids'], label:'Solid elements', test:e => normSearch(e.state).includes('solido') || normSearch(e.state).includes('solid') },
  { terms:['liquido','liquidos','liquid','liquids'], label:'Liquid elements', test:e => normSearch(e.state).includes('liquido') || normSearch(e.state).includes('liquid') },
  { terms:['gas','gases','gasoso','gasosos'], label:'Gaseous elements', test:e => normSearch(e.state).includes('gas') }
];

function getAliasMatcher(nq) {
  const groupMatch = nq.match(/^(g|grupo|group)\s*(\d{1,2})$/);
  if (groupMatch) {
    const group = Number(groupMatch[2]);
    return { label: 'Group ' + group, test: e => Number(e.group) === group };
  }
  const periodMatch = nq.match(/^(p|periodo|period|periodo)\s*(\d)$/);
  if (periodMatch) {
    const period = Number(periodMatch[2]);
    return { label: 'Period ' + period, test: e => Number(e.period) === period };
  }
  return SEARCH_ALIASES.find(alias => alias.terms.some(t => nq === t || t.startsWith(nq) || nq.startsWith(t)));
}

function elementMatchesSearch(el, nq) {
  if (!nq) return true;
  const alias = getAliasMatcher(nq);
  if (alias) return alias.test(el);
  const haystack = normSearch([
    el.name,
    elName(el),
    el.sym,
    el.z,
    el.cat,
    catName(el),
    el.state,
    stateName(el.state),
    'grupo ' + el.group,
    'group ' + el.group,
    'periodo ' + el.period,
    'period ' + el.period
  ].join(' '));
  return haystack.includes(nq);
}

function getSearchResults(q, limit) {
  const nq = normSearch(q);
  if (!nq) return [];
  return ELEMENTS
    .filter(el => elementMatchesSearch(el, nq))
    .sort((a, b) => {
      const aExact = normSearch(a.sym) === nq || String(a.z) === nq || normSearch(elName(a)) === nq;
      const bExact = normSearch(b.sym) === nq || String(b.z) === nq || normSearch(elName(b)) === nq;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return a.z - b.z;
    })
    .slice(0, limit || 8);
}

function handleSearchInput(val) {
  doSearch(val);
  updateSearchSuggestions(val);
}

function doSearch(val) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() { _doSearchNow(val); }, 120);
}
function _doSearchNow(val) {
  const q = normSearch(val);
  document.querySelectorAll('.el').forEach(card => {
    card.classList.remove('shine', 'dim');
  });
  if (!q) return;

  let first = true;
  document.querySelectorAll('.el').forEach(card => {
    const z    = card.dataset.z;
    const elem = ELEMENTS.find(e => String(e.z) === z);
    if (!elem) return;
    const hit = elementMatchesSearch(elem, q);
    if (hit) {
      card.classList.add('shine');
      if (first) { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); first = false; }
    } else {
      card.classList.add('dim');
    }
  });
}

function updateSearchSuggestions(val) {
  const box = document.getElementById('search-suggestions');
  if (!box) return;
  const results = getSearchResults(val, 8);
  _searchSuggestIndex = -1;
  box.textContent = '';
  if (!results.length) {
    box.classList.remove('open');
    return;
  }
  results.forEach(el => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-suggestion';
    btn.setAttribute('role', 'option');
    btn.dataset.z = el.z;
    btn.innerHTML =
      `<span class="ss-z">${el.z}</span>` +
      `<span class="ss-sym">${el.sym}</span>` +
      `<span class="ss-name">${elName(el)}</span>` +
      `<span class="ss-cat">${catName(el)}</span>`;
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => selectSearchSuggestion(el.z, false));
    box.appendChild(btn);
  });
  box.classList.add('open');
}

function closeSearchSuggestions() {
  const box = document.getElementById('search-suggestions');
  if (box) box.classList.remove('open');
  _searchSuggestIndex = -1;
}

function markSearchSuggestion(index) {
  const box = document.getElementById('search-suggestions');
  if (!box || !box.classList.contains('open')) return;
  const items = Array.from(box.querySelectorAll('.search-suggestion'));
  if (!items.length) return;
  _searchSuggestIndex = (index + items.length) % items.length;
  items.forEach((item, i) => item.classList.toggle('active', i === _searchSuggestIndex));
}

function selectSearchSuggestion(z, openIt) {
  const el = ELEMENTS.find(e => e.z === Number(z));
  if (!el) return;
  const input = document.getElementById('search-input');
  if (input) input.value = el.sym;
  closeSearchSuggestions();
  _doSearchNow(el.sym);
  focusElementCard(el.z);
  if (openIt) openModal(el);
}

function handleSearchKey(e) {
  const box = document.getElementById('search-suggestions');
  const isOpen = box && box.classList.contains('open');
  const items = isOpen ? Array.from(box.querySelectorAll('.search-suggestion')) : [];

  if (e.key === 'ArrowDown' && items.length) {
    e.preventDefault();
    markSearchSuggestion(_searchSuggestIndex + 1);
    return;
  }
  if (e.key === 'ArrowUp' && items.length) {
    e.preventDefault();
    markSearchSuggestion(_searchSuggestIndex - 1);
    return;
  }
  if (e.key === 'Enter') {
    const selected = items[_searchSuggestIndex] || items[0];
    if (selected) {
      e.preventDefault();
      selectSearchSuggestion(selected.dataset.z, true);
    }
    return;
  }
  if (e.key === 'Escape') {
    closeSearchSuggestions();
    e.currentTarget.blur();
  }
}

document.addEventListener('click', e => {
  const box = document.querySelector('.search-box');
  if (box && !box.contains(e.target)) closeSearchSuggestions();
});

// ════════════ TABS ════════════
function switchTab(tab, el) {
  const legendEl = document.getElementById('legend');
  const heatmapLegendEl = document.getElementById('heatmap-legend');
  const hmSelectEl = document.getElementById('hm-select');

  try { const ds = document.getElementById('ds-colormap'); if (ds) ds.textContent = tab; } catch(e){}
  if (tab === 'heatmap') {
    document.querySelectorAll('.pt-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tableTab = document.getElementById('tab-tabela');
    if (tableTab) tableTab.classList.add('active'); 
    
    if (legendEl) legendEl.style.display = 'none';
    if (heatmapLegendEl) heatmapLegendEl.style.display = 'flex';
    if (hmSelectEl) applyHeatmap(hmSelectEl.value);
    return;
  }
  
  if (tab === 'tabela') {
    if (legendEl) legendEl.style.display = 'flex';
    if (heatmapLegendEl) heatmapLegendEl.style.display = 'none';
    removeHeatmap();
  }

  if (tab === 'comparar') {
    initCompare();
  }
  
  if (tab === 'grupos') {
    setTimeout(renderTrendChart, 100);
  }
  
  if (tab === 'isotopos') {
    initIsotopes();
  }

  document.querySelectorAll('.pt-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  const tc = document.getElementById('tab-' + tab);
  if (tc) tc.classList.add('active');
}

// ─── HEATMAP LOGIC ───
function applyHeatmap(prop) {
  const cards = document.querySelectorAll('.el:not(.el-ph)');
  let min = Infinity, max = -Infinity;
  const values = {};

  cards.forEach(card => {
    const z = parseInt(card.dataset.z);
    if (!z) return;
    const el = ELEMENTS.find(e => e.z === z);
    const ex = getExtra(z);
    const ex2 = getExtra2(z);
    let val = NaN;

    if (prop === 'electronegativity') val = parseFloat(el.en);
    if (prop === 'radius') val = parseFloat(ex2.radius);
    if (prop === 'melt') val = parseFloat(ex.melt);
    if (prop === 'boil') val = parseFloat(ex.boil);
    if (prop === 'density') val = parseFloat(ex2.density);
    if (prop === 'mass') val = parseFloat(el.mass.replace(/[^0-9.]/g,''));

    values[z] = val;
    if (!isNaN(val)) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
  });

  cards.forEach(card => {
    const z = parseInt(card.dataset.z);
    if (!z) return;
    const val = values[z];
    if (isNaN(val)) {
      card.style.background = 'var(--surface)';
      card.style.color = 'var(--text-3)';
      card.style.borderColor = 'var(--border)';
    } else {
      let pct = (val - min) / (max - min);
      if (max === min) pct = 0.5;
      const hue = 240 - (pct * 240); // 240=blue, 0=red
      card.style.background = `hsl(${hue}, 80%, 45%)`;
      card.style.color = '#fff';
      card.style.borderColor = `hsl(${hue}, 80%, 35%)`;
    }
  });
}

function removeHeatmap() {
  document.querySelectorAll('.el:not(.el-ph)').forEach(card => {
    card.style.background = '';
    card.style.color = '';
    card.style.borderColor = '';
  });
}

// ─── COMPARAR LOGIC ───
let compareInited = false;
let cmpSelection = { 1: null, 2: null }; // {1: z, 2: z}
let cmpPickerTargetSlot = null;
let cmpStickyObserver = null;
let cmpStickyCardsVisible = true;
let cmpStickyScrollRAF = null;
let cmpStickyListenersWired = false;

function initCompare() {
  if (compareInited) return;
  compareInited = true;

  // Build picker grid once
  const grid = document.getElementById('cmp-picker-grid');
  grid.innerHTML = ELEMENTS
    .slice()
    .sort((a, b) => a.z - b.z)
    .map(e => `
      <button class="cmp-picker-cell c-${e.cat}" data-z="${e.z}" data-name="${(e.name + ' ' + (typeof _elNamesEN !== 'undefined' && _elNamesEN[e.z-1] ? _elNamesEN[e.z-1] : '')).toLowerCase()}" data-sym="${e.sym.toLowerCase()}" onclick="selectCompElement(${e.z})">
        <span class="pc-z">${e.z}</span>
        <span class="pc-sym">${e.sym}</span>
        <span class="pc-nm">${elName(e)}</span>
      </button>
    `).join('');

  // Hydrate from the localStorage queue (set by addCurrentToCompare on other pages).
  // Empty/missing → start with both slots empty.
  cmpSelection = { 1: null, 2: null };
  try {
    const queue = JSON.parse(localStorage.getItem('atomurus-compare-queue') || '[]');
    if (Array.isArray(queue) && queue.length) {
      if (queue[0] != null) cmpSelection[1] = queue[0];
      if (queue[1] != null) cmpSelection[2] = queue[1];
      // Consume the queue so refreshing doesn't re-hydrate forever
      localStorage.removeItem('atomurus-compare-queue');
    }
  } catch(e){}
  cmpSetupStickyHeader();
  renderCompare();
}

// Cell-list cache (118 elements) so we don't re-query the DOM on every interaction
let _cmpPickerCells = null;
function _getCompPickerCells() {
  if (!_cmpPickerCells || _cmpPickerCells.length === 0) {
    _cmpPickerCells = Array.from(document.querySelectorAll('.cmp-picker-cell'));
  }
  return _cmpPickerCells;
}

function openCompPicker(slot) {
  cmpPickerTargetSlot = slot;
  const overlay = document.getElementById('cmp-picker-overlay');
  const title = document.getElementById('cmp-picker-title');
  const search = document.getElementById('cmp-picker-search');
  title.textContent = _T('ptable.cmpPickerSlot', 'Selecionar Elemento {n}').replace('{n}', slot);

  const selectedZ = cmpSelection[slot];
  const otherZ = cmpSelection[slot === 1 ? 2 : 1];

  // Single pass to update selection + disabled state via classes (no inline styles → no reflow storm)
  const cells = _getCompPickerCells();
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const z = +c.dataset.z;
    c.classList.toggle('selected', selectedZ != null && z === selectedZ);
    c.classList.toggle('disabled', otherZ != null && z === otherZ);
  }

  search.value = '';
  _applyCompPickerFilter('');
  overlay.classList.add('open');
  // requestAnimationFrame avoids the 50ms timer delay while still letting the
  // browser commit the opacity transition before stealing focus.
  requestAnimationFrame(() => search.focus());
}

function closeCompPicker() {
  document.getElementById('cmp-picker-overlay').classList.remove('open');
  cmpPickerTargetSlot = null;
}

function closeCompPickerBg(e) {
  if (e.target.id === 'cmp-picker-overlay') closeCompPicker();
}

// Debounced wrapper to avoid running the 118-cell filter on every keystroke
let _cmpFilterTimer = null;
function filterCompPicker() {
  if (_cmpFilterTimer) clearTimeout(_cmpFilterTimer);
  _cmpFilterTimer = setTimeout(() => {
    const q = (document.getElementById('cmp-picker-search').value || '').trim().toLowerCase();
    _applyCompPickerFilter(q);
  }, 60);
}
function _applyCompPickerFilter(q) {
  const cells = _getCompPickerCells();
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (!q) { c.classList.remove('hidden'); continue; }
    const name = c.dataset.name || '';
    const sym  = c.dataset.sym  || '';
    const z    = c.dataset.z    || '';
    const hit = name.includes(q) || sym.includes(q) || z === q;
    c.classList.toggle('hidden', !hit);
  }
}
function __unused_filterCompPicker_legacy() {
  const q = (document.getElementById('cmp-picker-search').value || '').trim().toLowerCase();
  document.querySelectorAll('.cmp-picker-cell').forEach(c => {
    if (!q) { c.classList.remove('hidden'); return; }
    const z = c.dataset.z;
    const nm = c.dataset.name;
    const sym = c.dataset.sym;
    const matches = z === q || sym.startsWith(q) || nm.includes(q) || ('' + z).startsWith(q);
    c.classList.toggle('hidden', !matches);
  });
}

function selectCompElement(z) {
  if (cmpPickerTargetSlot == null) return;
  cmpSelection[cmpPickerTargetSlot] = z;
  closeCompPicker();
  renderCompare();
}

function clearCompSlot(slot) {
  cmpSelection[slot] = null;
  renderCompare();
}

function cmpLang() {
  const r = (window.I18N && I18N.lang) || document.documentElement.lang || 'en';
  return String(r).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
}

function cmpText(key, en, pt) {
  return _T(key, cmpLang() === 'pt' ? (pt || en) : en);
}

function cmpEsc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function cmpAttr(s) {
  return cmpEsc(s).replace(/'/g, '&#39;');
}

function cmpHasValue(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return !!s && s !== '\u2014' && s !== '&mdash;' && s !== 'â€”';
}

function cmpDash() {
  return '<span class="cmp-missing">&mdash;</span>';
}

function cmpDisplay(v, unit) {
  if (!cmpHasValue(v)) return cmpDash();
  return cmpEsc(v) + (unit ? ` ${cmpEsc(unit)}` : '');
}

function cmpNumericValue(el, key) {
  if (!el) return null;
  let raw;
  if (key === 'z') raw = el.z;
  else if (key === 'group') raw = el.group;
  else if (key === 'period') raw = el.period;
  else if (key === 'mass') raw = typeof el.mass === 'string' ? el.mass.replace(/[^0-9.\-]/g, '') : el.mass;
  else if (key === 'en') raw = el.en;
  else if (key === 'radius') raw = (getExtra2(el.z) || {}).radius;
  else if (key === 'melt') raw = (getExtra(el.z) || {}).melt;
  else if (key === 'boil') raw = (getExtra(el.z) || {}).boil;
  else if (key === 'valence') raw = (getExtra2(el.z) || {}).valence;
  else if (key === 'density') {
    raw = (getExtra2(el.z) || {}).density;
    let n = parseFloat(raw);
    if (!Number.isFinite(n)) return null;
    if (/g\s*\/\s*l/i.test(String(raw))) n /= 1000;
    return n;
  } else {
    return null;
  }
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function cmpFormatNumber(n, dec) {
  if (n == null || !Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  let places = dec == null ? 2 : dec;
  if (abs > 0 && abs < 0.01) places = Math.max(places, 5);
  return String(+n.toFixed(places));
}

function cmpSigned(n, dec) {
  if (n == null || !Number.isFinite(n)) return cmpDash();
  if (Math.abs(n) < 1e-12) return cmpFormatNumber(0, dec);
  const sign = n > 0 ? '+' : '&minus;';
  return sign + cmpFormatNumber(Math.abs(n), dec);
}

function cmpAnalyzeDelta(prop, el1, el2) {
  if (!prop.numeric || !el1 || !el2) return null;
  const a = cmpNumericValue(el1, prop.key);
  const b = cmpNumericValue(el2, prop.key);
  if (a == null || b == null) return null;
  const delta = a - b;
  const abs = Math.abs(delta);
  const pct = Math.abs(b) > 0 ? (delta / Math.abs(b)) * 100 : null;
  const relation = abs < 1e-10 ? 'tie' : delta > 0 ? 'positive' : 'negative';
  const higher = relation === 'tie' ? null : delta > 0 ? 1 : 2;
  const lower = relation === 'tie' ? null : delta > 0 ? 2 : 1;
  return { a, b, delta, abs, pct, relation, higher, lower };
}

function cmpClamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function cmpValueBar(prop, analysis, side) {
  if (!analysis || !prop.numeric) return null;
  let a = analysis.a;
  let b = analysis.b;
  if (prop.key === 'melt' || prop.key === 'boil') {
    a += 273.15;
    b += 273.15;
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max <= 0) return null;
  const raw = side === 1 ? a : b;
  const pct = cmpClamp((Math.abs(raw) / max) * 100, raw === 0 ? 0 : 5, 100);
  return { pct };
}

function cmpRenderValue(value, side, analysis, bar) {
  const classes = ['cmp-value'];
  let badge = '';
  let barHtml = '';
  if (bar && Number.isFinite(bar.pct)) {
    classes.push('cmp-value-with-bar');
    barHtml = `<span class="cmp-mini-bar" aria-hidden="true"><span style="width:${cmpFormatNumber(cmpClamp(bar.pct, 0, 100), 1)}%"></span></span>`;
  }
  if (analysis) {
    if (analysis.higher === side) {
      classes.push('cmp-value-higher');
      badge = `<span class="cmp-rank-badge cmp-rank-high">&#9650; ${cmpText('ptable.cmpHigher', 'Higher', 'Maior')}</span>`;
    } else if (analysis.lower === side) {
      classes.push('cmp-value-lower');
      badge = `<span class="cmp-rank-badge cmp-rank-low">&#9660; ${cmpText('ptable.cmpLower', 'Lower', 'Menor')}</span>`;
    } else if (analysis.relation === 'tie') {
      classes.push('cmp-value-tie');
      badge = `<span class="cmp-rank-badge cmp-rank-tie">${cmpText('ptable.cmpEqual', 'Equal', 'Igual')}</span>`;
    }
  }
  return `<div class="${classes.join(' ')}"><span class="cmp-value-main">${value}</span>${badge}${barHtml}</div>`;
}

function cmpRenderDiff(prop, analysis, el1, el2) {
  if (!analysis) return `<span class="cmp-diff-empty">${cmpDash()}</span>`;
  const dec = prop.dec == null ? 2 : prop.dec;
  const unit = prop.unit ? ` <span class="cmp-diff-unit">${cmpEsc(prop.unit)}</span>` : '';
  const pct = analysis.pct == null ? cmpDash() : cmpSigned(analysis.pct, 1) + '%';
  const arrow = analysis.relation === 'positive' ? '&#9650;' : analysis.relation === 'negative' ? '&#9660;' : '&minus;';
  const winner = analysis.higher === 1 ? el1 : analysis.higher === 2 ? el2 : null;
  const winnerLabel = winner
    ? `<span class="cmp-winner"><span class="cmp-trophy">&#127942;</span>${cmpEsc(elName(winner))}</span>`
    : `<span class="cmp-winner cmp-winner-tie">${cmpText('ptable.cmpSameValue', 'Same value', 'Mesmo valor')}</span>`;
  return `
    <div class="cmp-diff cmp-diff-${analysis.relation}">
      <div class="cmp-diff-main"><span class="cmp-diff-arrow">${arrow}</span><span>${cmpSigned(analysis.delta, dec)}${unit}</span></div>
      <div class="cmp-diff-meta">
        <span>${cmpText('ptable.cmpAbsolute', 'Abs', 'Abs')}: ${cmpFormatNumber(analysis.abs, dec)}${unit}</span>
        <span>${pct}</span>
      </div>
      ${winnerLabel}
    </div>
  `;
}

function cmpElementBlock(el) {
  if (!el) return '';
  if (el.cat === 'lanthanide' || el.cat === 'actinide') return 'f';
  const g = +el.group;
  if (el.z === 2 || g === 1 || g === 2) return 's';
  if (g >= 13 && g <= 18) return 'p';
  if (g >= 3 && g <= 12) return 'd';
  return '';
}

function cmpElementBlockLabel(el) {
  const b = cmpElementBlock(el);
  return b ? `${b}-block` : cmpDash();
}

function cmpMetallicKey(el) {
  if (!el) return '';
  if (['alkali', 'alkaline', 'transition', 'posttrans', 'lanthanide', 'actinide'].includes(el.cat)) return 'metallic';
  if (el.cat === 'metalloid') return 'intermediate';
  return 'nonmetallic';
}

function cmpMetallicScore(el) {
  const k = cmpMetallicKey(el);
  if (k === 'metallic') return 1;
  if (k === 'intermediate') return 0.5;
  if (k === 'nonmetallic') return 0;
  return null;
}

function cmpCharacterLabel(level) {
  if (level === 'high') return cmpText('ptable.cmpCharHigh', 'High', 'Alto');
  if (level === 'intermediate') return cmpText('ptable.cmpCharIntermediate', 'Intermediate', 'Intermediario');
  return cmpText('ptable.cmpCharLow', 'Low', 'Baixo');
}

function cmpMetallicCharacter(el) {
  const k = cmpMetallicKey(el);
  if (!k) return cmpDash();
  if (k === 'metallic') return cmpCharacterLabel('high');
  if (k === 'intermediate') return cmpCharacterLabel('intermediate');
  return cmpCharacterLabel('low');
}

function cmpNonmetallicCharacter(el) {
  const k = cmpMetallicKey(el);
  if (!k) return cmpDash();
  if (k === 'nonmetallic') return cmpCharacterLabel('high');
  if (k === 'intermediate') return cmpCharacterLabel('intermediate');
  return cmpCharacterLabel('low');
}

function cmpBondingBehavior(el) {
  if (!el) return cmpDash();
  const en = cmpNumericValue(el, 'en');
  if (el.cat === 'noble') return cmpText('ptable.cmpBondNoble', 'Mostly inert; weak intermolecular interactions', 'Majoritariamente inerte; interacoes intermoleculares fracas');
  if (el.cat === 'alkali' || el.cat === 'alkaline') return cmpText('ptable.cmpBondIonic', 'Predominantly ionic bonding', 'Ligacao predominantemente ionica');
  if (el.cat === 'metalloid') return cmpText('ptable.cmpBondMetalloid', 'Covalent/network bonding; semiconducting behavior', 'Ligacao covalente/em rede; comportamento semicondutor');
  if (['transition', 'lanthanide', 'actinide', 'posttrans'].includes(el.cat)) return cmpText('ptable.cmpBondMetal', 'Metallic bonding; ionic/covalent compounds', 'Ligacao metalica; compostos ionicos/covalentes');
  if (Number.isFinite(en) && en >= 2.5) return cmpText('ptable.cmpBondPolarCovalent', 'Covalent bonding; often polar with metals', 'Ligacao covalente; frequentemente polar com metais');
  return cmpText('ptable.cmpBondCovalent', 'Predominantly covalent bonding', 'Ligacao predominantemente covalente');
}

function cmpShellsDisplay(extra) {
  const shells = extra && Array.isArray(extra.shells) ? extra.shells : null;
  return shells && shells.length ? cmpEsc(shells.join(' / ')) : cmpDash();
}

function cmpOxidationDisplay(extra2) {
  const ox = extra2 && Array.isArray(extra2.oxidation) ? extra2.oxidation : [];
  if (!ox.length) return cmpDash();
  return ox.map(o => `<span class="${o.c ? 'cmp-ox-common' : 'cmp-ox'}">${cmpEsc(o.v)}</span>`).join(' ');
}

function cmpElementCategory(el) {
  if (!el) return cmpDash();
  if (typeof trendChemicalFamilyLabel === 'function') return cmpDisplay(trendChemicalFamilyLabel(el));
  return cmpDisplay(catName(el));
}

function cmpEnsureSimilarityPanel(result) {
  let panel = document.getElementById('cmp-similarity');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'cmp-similarity';
    panel.className = 'cmp-similarity';
    const table = result.querySelector('.compare-table');
    result.insertBefore(panel, table || result.firstChild);
  }
  return panel;
}

function cmpSimilarityScore(el1, el2) {
  if (!el1 || !el2) return null;
  const factors = [];
  let score = 0;
  let max = 0;
  const add = (key, label, weight, ratio, good) => {
    if (!Number.isFinite(ratio)) return;
    const r = cmpClamp(ratio, 0, 1);
    score += weight * r;
    max += weight;
    factors.push({ key, label, score: r, good: !!good });
  };

  const g1 = cmpNumericValue(el1, 'group');
  const g2 = cmpNumericValue(el2, 'group');
  if (g1 != null && g2 != null) add('group', cmpText('ptable.mGroup', 'Group', 'Grupo'), 14, g1 === g2 ? 1 : Math.max(0, 0.45 - Math.abs(g1 - g2) * 0.08), g1 === g2);

  const p1 = cmpNumericValue(el1, 'period');
  const p2 = cmpNumericValue(el2, 'period');
  if (p1 != null && p2 != null) add('period', cmpText('ptable.mPeriod', 'Period', 'Periodo'), 9, p1 === p2 ? 1 : Math.max(0, 0.5 - Math.abs(p1 - p2) * 0.16), p1 === p2);

  const b1 = cmpElementBlock(el1);
  const b2 = cmpElementBlock(el2);
  add('block', cmpText('ptable.cmpBlock', 's/p/d/f Block', 'Bloco s/p/d/f'), 14, b1 && b2 && b1 === b2 ? 1 : 0, b1 && b2 && b1 === b2);

  const f1 = typeof trendChemicalFamilyKey === 'function' ? trendChemicalFamilyKey(el1) : el1.cat;
  const f2 = typeof trendChemicalFamilyKey === 'function' ? trendChemicalFamilyKey(el2) : el2.cat;
  add('series', cmpText('ptable.cmpSeries', 'Chemical Series', 'Serie Quimica'), 14, f1 && f2 && f1 === f2 ? 1 : 0, f1 && f2 && f1 === f2);

  const en1 = cmpNumericValue(el1, 'en');
  const en2 = cmpNumericValue(el2, 'en');
  if (en1 != null && en2 != null) {
    const diff = Math.abs(en1 - en2);
    add('en', _T('ptable.mEn', 'Electronegativity'), 15, 1 - Math.min(diff / 2.8, 1), diff <= 0.45);
  }

  const r1 = cmpNumericValue(el1, 'radius');
  const r2 = cmpNumericValue(el2, 'radius');
  if (r1 != null && r2 != null) {
    const diff = Math.abs(r1 - r2);
    add('radius', _T('ptable.mRadius', 'Atomic Radius'), 12, 1 - Math.min(diff / 190, 1), diff <= 25);
  }

  add('state', _T('ptable.mState', 'Physical State'), 8, el1.state && el2.state && el1.state === el2.state ? 1 : 0, el1.state && el2.state && el1.state === el2.state);

  const m1 = cmpMetallicScore(el1);
  const m2 = cmpMetallicScore(el2);
  if (m1 != null && m2 != null) add('metallic', cmpText('ptable.cmpMetallicCharacter', 'Metallic Character', 'Carater Metalico'), 14, 1 - Math.abs(m1 - m2), Math.abs(m1 - m2) <= 0.01);

  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const level = pct >= 72 ? 'high' : pct >= 44 ? 'medium' : 'low';
  const levelLabel = level === 'high'
    ? cmpText('ptable.cmpHighSimilarity', 'High Similarity', 'Alta Similaridade')
    : level === 'medium'
      ? cmpText('ptable.cmpMediumSimilarity', 'Medium Similarity', 'Similaridade Media')
      : cmpText('ptable.cmpLowSimilarity', 'Low Similarity', 'Baixa Similaridade');
  return { pct, level, levelLabel, factors };
}

function cmpSimilarityExplanation(sim, el1, el2) {
  if (!sim) return '';
  const lang = cmpLang();
  const phrases = [];
  if (cmpElementBlock(el1) && cmpElementBlock(el1) === cmpElementBlock(el2)) {
    phrases.push(lang === 'pt' ? `ambos pertencem ao ${cmpElementBlock(el1)}-block` : `both belong to the ${cmpElementBlock(el1)}-block`);
  }
  const fam1 = typeof trendChemicalFamilyKey === 'function' ? trendChemicalFamilyKey(el1) : el1.cat;
  const fam2 = typeof trendChemicalFamilyKey === 'function' ? trendChemicalFamilyKey(el2) : el2.cat;
  if (fam1 && fam1 === fam2) {
    const fam = typeof trendChemicalFamilyLabel === 'function' ? trendChemicalFamilyLabel(el1) : catName(el1);
    phrases.push(lang === 'pt' ? `compartilham a familia ${fam}` : `share the ${fam} family`);
  }
  const en1 = cmpNumericValue(el1, 'en');
  const en2 = cmpNumericValue(el2, 'en');
  if (en1 != null && en2 != null && Math.abs(en1 - en2) <= 0.45) {
    phrases.push(lang === 'pt' ? 'exibem eletronegatividade comparavel' : 'exhibit comparable electronegativity');
  }
  const r1 = cmpNumericValue(el1, 'radius');
  const r2 = cmpNumericValue(el2, 'radius');
  if (r1 != null && r2 != null && Math.abs(r1 - r2) <= 25) {
    phrases.push(lang === 'pt' ? 'tem raios atomicos proximos' : 'have close atomic radii');
  }
  if (el1.state && el1.state === el2.state) {
    phrases.push(lang === 'pt' ? 'tem o mesmo estado fisico' : 'share the same physical state');
  }
  if (cmpMetallicKey(el1) === cmpMetallicKey(el2)) {
    phrases.push(lang === 'pt' ? 'mostram carater metalico semelhante' : 'show similar metallic character');
  }

  if (!phrases.length) {
    return lang === 'pt'
      ? `${sim.levelLabel} porque os elementos diferem em grupo, bloco, serie quimica e carater metalico.`
      : `${sim.levelLabel} because the elements differ across group, block, chemical series and metallic character.`;
  }
  const selected = phrases.slice(0, 3).join(lang === 'pt' ? ', ' : ', ');
  return lang === 'pt'
    ? `${sim.levelLabel} porque ${selected}.`
    : `${sim.levelLabel} because ${selected}.`;
}

function cmpRenderSimilarity(el1, el2) {
  if (!el1 || !el2) {
    return `
      <div class="cmp-sim-card cmp-sim-pending">
        <div class="cmp-sim-head">
          <span>${cmpText('ptable.cmpSimilarityScore', 'Similarity Score', 'Pontuacao de Similaridade')}</span>
          <strong>${cmpText('ptable.cmpSimilarityPending', 'Select two elements', 'Selecione dois elementos')}</strong>
        </div>
        <p>${cmpText('ptable.cmpSimilarityPendingText', 'Choose a second element to run chemical similarity analysis.', 'Escolha um segundo elemento para executar a analise de similaridade quimica.')}</p>
      </div>
    `;
  }
  const sim = cmpSimilarityScore(el1, el2);
  const explanation = cmpSimilarityExplanation(sim, el1, el2);
  const good = sim.factors.filter(f => f.good).slice(0, 5);
  return `
    <div class="cmp-sim-card cmp-sim-${sim.level}">
      <div class="cmp-sim-head">
        <span>${cmpText('ptable.cmpSimilarityScore', 'Similarity Score', 'Pontuacao de Similaridade')}</span>
        <strong>${sim.levelLabel}</strong>
        <em>${sim.pct}%</em>
      </div>
      <div class="cmp-sim-track" aria-hidden="true"><span style="width:${sim.pct}%"></span></div>
      <p>${cmpEsc(explanation)}</p>
      <div class="cmp-sim-factors">
        ${good.length ? good.map(f => `<span>${cmpEsc(f.label)}</span>`).join('') : `<span>${cmpText('ptable.cmpNoStrongMatches', 'No strong shared factors', 'Sem fatores fortes em comum')}</span>`}
      </div>
    </div>
  `;
}

function cmpEnsureStickyHeader() {
  let header = document.getElementById('cmp-sticky-header');
  if (header) return header;
  header = document.createElement('div');
  header.id = 'cmp-sticky-header';
  header.className = 'cmp-sticky-header';
  header.setAttribute('aria-hidden', 'true');
  document.body.appendChild(header);
  return header;
}

function cmpRenderStickyElement(el, slot) {
  const empty = slot === 1
    ? cmpText('ptable.cmpEl1', 'Element 1', 'Elemento 1')
    : cmpText('ptable.cmpEl2', 'Element 2', 'Elemento 2');
  if (!el) {
    return `
      <div class="cmp-sticky-el cmp-sticky-el-${slot} cmp-sticky-empty">
        <span class="cmp-sticky-sym">&mdash;</span>
        <span class="cmp-sticky-name">${cmpEsc(empty)}</span>
      </div>
    `;
  }
  return `
    <div class="cmp-sticky-el cmp-sticky-el-${slot} c-${cmpEsc(el.cat)}">
      <span class="cmp-sticky-sym">${cmpEsc(el.sym)}</span>
      <span class="cmp-sticky-name">${cmpEsc(elName(el))}</span>
    </div>
  `;
}

function cmpStickySimilarity(el1, el2) {
  if (!el1 || !el2) {
    return {
      pct: null,
      level: 'pending',
      label: cmpText('ptable.cmpSimilarityPending', 'Select two elements', 'Selecione dois elementos')
    };
  }
  const sim = cmpSimilarityScore(el1, el2);
  return sim || { pct: null, level: 'pending', label: cmpText('ptable.cmpSimilarityPending', 'Select two elements', 'Selecione dois elementos') };
}

function cmpUpdateStickyHeader(el1, el2) {
  const header = cmpEnsureStickyHeader();
  const hasAny = !!(el1 || el2);
  header.classList.toggle('has-selection', hasAny);
  if (!hasAny) {
    header.classList.remove('visible');
    header.setAttribute('aria-hidden', 'true');
    header.innerHTML = '';
    return;
  }
  const sim = cmpStickySimilarity(el1, el2);
  const level = cmpEsc(sim.level || 'pending');
  // Optical balance: the similarity is the CENTER of the composition (the
  // relationship core on the bar's vertical axis), not a right-side badge,
  // so it can never pull the layout right. Element chips flank it as mirrored
  // equals, joined by connector lines that emanate from the core.
  const readout = sim.pct == null
    ? `<em class="cmp-sticky-lvl">${cmpEsc(sim.label || '')}</em>`
    : `<strong class="cmp-sticky-pct">${sim.pct}%</strong><em class="cmp-sticky-lvl">${cmpEsc(sim.levelLabel || '')}</em>`;
  header.innerHTML = `
    <div class="cmp-sticky-inner cmp-lvl-${level}">
      <div class="cmp-sticky-side cmp-sticky-side-1">
        ${cmpRenderStickyElement(el1, 1)}
        <span class="cmp-sticky-link" aria-hidden="true"></span>
      </div>
      <div class="cmp-sticky-core" role="status" aria-label="${cmpText('ptable.cmpSimilarityShort', 'Similarity', 'Similaridade')}">
        <span class="cmp-sticky-vs" aria-hidden="true">&#8596;</span>
        <span class="cmp-sticky-readout">${readout}</span>
      </div>
      <div class="cmp-sticky-side cmp-sticky-side-2">
        <span class="cmp-sticky-link" aria-hidden="true"></span>
        ${cmpRenderStickyElement(el2, 2)}
      </div>
    </div>
  `;
  cmpSyncStickyHeader();
}

function cmpPositionStickyHeader() {
  const header = document.getElementById('cmp-sticky-header');
  const wrap = document.querySelector('.compare-wrap');
  if (!header || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  if (!rect.width) return;
  const gutter = window.matchMedia && window.matchMedia('(max-width: 719px)').matches ? 16 : 28;
  const maxWidth = Math.max(280, window.innerWidth - gutter);
  const width = Math.min(rect.width, maxWidth);
  header.style.setProperty('--cmp-sticky-left', `${rect.left + rect.width / 2}px`);
  header.style.setProperty('--cmp-sticky-width', `${width}px`);
}

function cmpShouldShowStickyHeader() {
  const header = document.getElementById('cmp-sticky-header');
  if (!header || !header.classList.contains('has-selection')) return false;
  const selectors = document.querySelector('.compare-selectors');
  if (!selectors) return false;
  const rect = selectors.getBoundingClientRect();
  return rect.bottom <= 72;
}

function cmpSetStickyVisible(show) {
  const header = document.getElementById('cmp-sticky-header');
  if (!header) return;
  header.classList.toggle('visible', !!show);
  header.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function cmpSyncStickyHeader() {
  cmpPositionStickyHeader();
  cmpSetStickyVisible(!cmpStickyCardsVisible && cmpShouldShowStickyHeader());
}

function cmpScheduleStickySync() {
  if (cmpStickyScrollRAF) return;
  cmpStickyScrollRAF = requestAnimationFrame(() => {
    cmpStickyScrollRAF = null;
    cmpStickyCardsVisible = !cmpShouldShowStickyHeader();
    cmpSyncStickyHeader();
  });
}

function cmpSetupStickyHeader() {
  cmpEnsureStickyHeader();
  const selectors = document.querySelector('.compare-selectors');
  if (!selectors) return;
  cmpPositionStickyHeader();
  if (!cmpStickyListenersWired) {
    cmpStickyListenersWired = true;
    const scroller = document.querySelector('.content') || window;
    scroller.addEventListener('scroll', cmpScheduleStickySync, { passive: true });
    window.addEventListener('resize', cmpScheduleStickySync, { passive: true });
  }
  if ('IntersectionObserver' in window && !cmpStickyObserver) {
    cmpStickyObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      cmpStickyCardsVisible = !!(entry && entry.isIntersecting);
      cmpSyncStickyHeader();
    }, {
      root: null,
      threshold: 0,
      rootMargin: '-72px 0px 0px 0px'
    });
    cmpStickyObserver.observe(selectors);
  }
}

function renderCompareLegacy() {
  const z1 = cmpSelection[1];
  const z2 = cmpSelection[2];

  // ── Slot 1 UI ──
  paintCompSlot(1, z1);
  // ── Slot 2 UI ──
  paintCompSlot(2, z2);

  // ── Empty state vs results ──
  const empty = document.getElementById('cmp-empty-state');
  const result = document.getElementById('compare-result');
  if (!z1 && !z2) {
    cmpUpdateStickyHeader(null, null);
    empty.style.display = 'flex';
    result.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  result.style.display = 'block';

  // ── Build table (works with 1 OR 2 elements) ──
  const el1 = z1 ? ELEMENTS.find(e => e.z === z1) : null;
  const el2 = z2 ? ELEMENTS.find(e => e.z === z2) : null;
  const ex1 = z1 ? getExtra(z1) : null,  ex2 = z2 ? getExtra(z2) : null;
  const ex2_1 = z1 ? getExtra2(z1) : null, ex2_2 = z2 ? getExtra2(z2) : null;

  // Headers
  const th1 = document.getElementById('comp-th-1');
  const th2 = document.getElementById('comp-th-2');
  th1.innerHTML = el1
    ? `<div style="font-size:24px;font-family:'DM Serif Display';color:var(--accent)">${el1.sym}</div>${elName(el1)}`
    : `<span style="color:var(--text-3);font-weight:400;font-size:13px;">— vazio —</span>`;
  th2.innerHTML = el2
    ? `<div style="font-size:24px;font-family:'DM Serif Display';color:var(--accent)">${el2.sym}</div>${elName(el2)}`
    : `<span style="color:var(--text-3);font-weight:400;font-size:13px;">— vazio —</span>`;

  // Render Bohr canvas for whichever slots are filled (start in stable/paused state)
  bohrPaused['bohr-comp-1'] = true;
  bohrPaused['bohr-comp-2'] = true;
  if (el1) drawBohr(el1, 'bohr-comp-1');
  if (el2) drawBohr(el2, 'bohr-comp-2');

  // Build property rows
  const dash = '<span style="color:var(--text-3)">—</span>';
  const props = [
    { label: _T('ptable.cmpAtomicNumber', 'Número Atômico'), v1: el1 ? el1.z : dash, v2: el2 ? el2.z : dash },
    { label: _T('ptable.cmpSeries',       'Série Química'),  v1: el1 ? catName(el1) : dash, v2: el2 ? catName(el2) : dash },
    { label: _T('ptable.mAtomicMass',     'Massa Atômica'),  v1: el1 ? (el1.mass + ' u') : dash, v2: el2 ? (el2.mass + ' u') : dash },
    { label: _T('ptable.mEn',             'Eletronegatividade'), v1: el1 ? el1.en : dash, v2: el2 ? el2.en : dash },
    { label: _T('ptable.mRadius',         'Raio Atômico'),   v1: ex2_1 ? ex2_1.radius : dash, v2: ex2_2 ? ex2_2.radius : dash },
    { label: _T('ptable.mMelt',           'Ponto de Fusão'), v1: ex1 ? ex1.melt : dash, v2: ex2 ? ex2.melt : dash },
    { label: _T('ptable.mBoil',           'Ponto de Ebulição'), v1: ex1 ? ex1.boil : dash, v2: ex2 ? ex2.boil : dash },
    { label: _T('ptable.mDensity',        'Densidade'),      v1: ex2_1 ? ex2_1.density : dash, v2: ex2_2 ? ex2_2.density : dash },
    { label: _T('ptable.mYear',           'Ano de Descoberta'), v1: el1 ? el1.year : dash, v2: el2 ? el2.year : dash }
  ];

  // Render as grid rows: property label spans both value cells as a header,
  // values sit on row 2 in cells perfectly aligned with the slot cards above.
  const tbody = document.getElementById('comp-tbody');
  if (tbody) {
    tbody.innerHTML = props.map(p => `
      <tr class="ct-prop-row"><td colspan="3">${p.label}</td></tr>
      <tr class="ct-val-row"><td></td><td>${p.v1}</td><td>${p.v2}</td></tr>
    `).join('');
  }
}

function renderCompare() {
  if (document.body && document.body.getAttribute('data-compare-canonical') === 'pro-lab') return;
  const z1 = cmpSelection[1];
  const z2 = cmpSelection[2];

  paintCompSlot(1, z1);
  paintCompSlot(2, z2);

  const empty = document.getElementById('cmp-empty-state');
  const result = document.getElementById('compare-result');
  if (!z1 && !z2) {
    empty.style.display = 'flex';
    result.style.display = 'none';
    cmpUpdateModelUI(null, null);
    return;
  }
  empty.style.display = 'none';
  result.style.display = 'block';

  const el1 = z1 ? ELEMENTS.find(e => e.z === z1) : null;
  const el2 = z2 ? ELEMENTS.find(e => e.z === z2) : null;
  const ex1 = z1 ? getExtra(z1) : null;
  const ex2 = z2 ? getExtra(z2) : null;
  const ex2_1 = z1 ? getExtra2(z1) : null;
  const ex2_2 = z2 ? getExtra2(z2) : null;
  cmpUpdateStickyHeader(el1, el2);
  cmpUpdateModelUI(el1, el2);
  const simPanel = cmpEnsureSimilarityPanel(result);
  simPanel.innerHTML = cmpRenderSimilarity(el1, el2);

  const th1 = document.getElementById('comp-th-1');
  const th2 = document.getElementById('comp-th-2');
  const thDiff = document.getElementById('comp-th-diff');
  th1.innerHTML = el1
    ? `<div class="ct-head-symbol">${cmpEsc(el1.sym)}</div>${cmpEsc(elName(el1))}`
    : `<span class="ct-head-empty">${cmpText('ptable.cmpEmptySlot', 'Empty', 'Vazio')}</span>`;
  th2.innerHTML = el2
    ? `<div class="ct-head-symbol">${cmpEsc(el2.sym)}</div>${cmpEsc(elName(el2))}`
    : `<span class="ct-head-empty">${cmpText('ptable.cmpEmptySlot', 'Empty', 'Vazio')}</span>`;
  if (thDiff) thDiff.textContent = cmpText('ptable.cmpDifference', 'Difference', 'Diferenca');

  bohrPaused['bohr-comp-1'] = true;
  bohrPaused['bohr-comp-2'] = true;
  if (el1) drawBohr(el1, 'bohr-comp-1');
  if (el2) drawBohr(el2, 'bohr-comp-2');

  const el1Label = el1 ? elName(el1) : cmpText('ptable.cmpEl1', 'Element 1', 'Elemento 1');
  const el2Label = el2 ? elName(el2) : cmpText('ptable.cmpEl2', 'Element 2', 'Elemento 2');
  const propLabel = _T('ptable.cmpProperty', 'Property');
  const diffLabel = cmpText('ptable.cmpDifference', 'Difference', 'Diferenca');
  const props = [
    { key: 'z',       numeric: true,  dec: 0, unit: '',        label: _T('ptable.cmpAtomicNumber', 'Atomic Number'), v1: el1 ? cmpDisplay(el1.z) : cmpDash(), v2: el2 ? cmpDisplay(el2.z) : cmpDash() },
    { key: 'group',   numeric: true,  dec: 0, unit: '',        label: _T('ptable.mGroup',          'Group'), v1: el1 ? cmpDisplay(el1.group) : cmpDash(), v2: el2 ? cmpDisplay(el2.group) : cmpDash() },
    { key: 'period',  numeric: true,  dec: 0, unit: '',        label: _T('ptable.mPeriod',         'Period'), v1: el1 ? cmpDisplay(el1.period) : cmpDash(), v2: el2 ? cmpDisplay(el2.period) : cmpDash() },
    { key: 'block',   numeric: false,                         label: cmpText('ptable.cmpBlock', 's/p/d/f Block', 'Bloco s/p/d/f'), v1: el1 ? cmpElementBlockLabel(el1) : cmpDash(), v2: el2 ? cmpElementBlockLabel(el2) : cmpDash() },
    { key: 'series',  numeric: false,                         label: _T('ptable.cmpSeries',       'Chemical Series'), v1: el1 ? cmpDisplay(catName(el1)) : cmpDash(), v2: el2 ? cmpDisplay(catName(el2)) : cmpDash() },
    { key: 'category', numeric: false,                         label: cmpText('ptable.cmpElementCategory', 'Element Category', 'Categoria do Elemento'), v1: el1 ? cmpElementCategory(el1) : cmpDash(), v2: el2 ? cmpElementCategory(el2) : cmpDash() },
    { key: 'mass',    numeric: true,  dec: 3, unit: 'u',       label: _T('ptable.mAtomicMass',     'Atomic Mass'), v1: el1 ? cmpDisplay(el1.mass, 'u') : cmpDash(), v2: el2 ? cmpDisplay(el2.mass, 'u') : cmpDash() },
    { key: 'econfig', numeric: false,                          label: _T('ptable.mEconfig',        'Electron Configuration'), v1: ex1 ? cmpDisplay(ex1.econfig) : cmpDash(), v2: ex2 ? cmpDisplay(ex2.econfig) : cmpDash() },
    { key: 'shells',  numeric: false,                          label: _T('ptable.mShells',         'Shell Distribution'), v1: ex1 ? cmpShellsDisplay(ex1) : cmpDash(), v2: ex2 ? cmpShellsDisplay(ex2) : cmpDash() },
    { key: 'valence', numeric: true,  dec: 0, unit: '',        label: _T('ptable.mValence',        'Valence Electrons'), v1: ex2_1 ? cmpDisplay(ex2_1.valence) : cmpDash(), v2: ex2_2 ? cmpDisplay(ex2_2.valence) : cmpDash() },
    { key: 'oxidation', numeric: false,                        label: _T('ptable.mOxidation',      'Oxidation States'), v1: ex2_1 ? cmpOxidationDisplay(ex2_1) : cmpDash(), v2: ex2_2 ? cmpOxidationDisplay(ex2_2) : cmpDash() },
    { key: 'en',      numeric: true,  dec: 2, unit: 'Pauling', label: _T('ptable.mEn',             'Electronegativity'), v1: el1 ? cmpDisplay(el1.en) : cmpDash(), v2: el2 ? cmpDisplay(el2.en) : cmpDash() },
    { key: 'radius',  numeric: true,  dec: 0, unit: 'pm',      label: _T('ptable.mRadius',         'Atomic Radius'), v1: ex2_1 ? cmpDisplay(ex2_1.radius) : cmpDash(), v2: ex2_2 ? cmpDisplay(ex2_2.radius) : cmpDash() },
    { key: 'state',   numeric: false,                          label: _T('ptable.mState',          'Physical State'), v1: el1 ? cmpDisplay(stateName(el1.state)) : cmpDash(), v2: el2 ? cmpDisplay(stateName(el2.state)) : cmpDash() },
    { key: 'metallic', numeric: false,                         label: cmpText('ptable.cmpMetallicCharacter', 'Metallic Character', 'Carater Metalico'), v1: el1 ? cmpDisplay(cmpMetallicCharacter(el1)) : cmpDash(), v2: el2 ? cmpDisplay(cmpMetallicCharacter(el2)) : cmpDash() },
    { key: 'nonmetallic', numeric: false,                      label: cmpText('ptable.cmpNonmetallicCharacter', 'Nonmetallic Character', 'Carater Nao Metalico'), v1: el1 ? cmpDisplay(cmpNonmetallicCharacter(el1)) : cmpDash(), v2: el2 ? cmpDisplay(cmpNonmetallicCharacter(el2)) : cmpDash() },
    { key: 'bonding', numeric: false,                          label: cmpText('ptable.cmpBondingBehavior', 'Probable Bonding Behavior', 'Comportamento de Ligacao Provavel'), v1: el1 ? cmpDisplay(cmpBondingBehavior(el1)) : cmpDash(), v2: el2 ? cmpDisplay(cmpBondingBehavior(el2)) : cmpDash() },
    { key: 'melt',    numeric: true,  dec: 1, unit: '\u00b0C', label: _T('ptable.mMelt',           'Melting Point'), v1: ex1 ? cmpDisplay(ex1.melt) : cmpDash(), v2: ex2 ? cmpDisplay(ex2.melt) : cmpDash() },
    { key: 'boil',    numeric: true,  dec: 1, unit: '\u00b0C', label: _T('ptable.mBoil',           'Boiling Point'), v1: ex1 ? cmpDisplay(ex1.boil) : cmpDash(), v2: ex2 ? cmpDisplay(ex2.boil) : cmpDash() },
    { key: 'density', numeric: true,  dec: 3, unit: 'g/cm\u00b3', label: _T('ptable.mDensity',      'Density'), v1: ex2_1 ? cmpDisplay(ex2_1.density) : cmpDash(), v2: ex2_2 ? cmpDisplay(ex2_2.density) : cmpDash() },
    { key: 'year',    numeric: false,                         label: _T('ptable.mYear',           'Discovery Year'), v1: el1 ? cmpDisplay(el1.year) : cmpDash(), v2: el2 ? cmpDisplay(el2.year) : cmpDash() }
  ];

  const tbody = document.getElementById('comp-tbody');
  if (tbody) {
    tbody.innerHTML = props.map(p => {
      const analysis = cmpAnalyzeDelta(p, el1, el2);
      const bar1 = cmpValueBar(p, analysis, 1);
      const bar2 = cmpValueBar(p, analysis, 2);
      return `
        <tr class="ct-val-row${analysis ? ' ct-numeric-row' : ''}">
          <td class="ct-property" data-label="${cmpAttr(propLabel)}">${cmpEsc(p.label)}</td>
          <td class="ct-element ct-element-a" data-label="${cmpAttr(el1Label)}">${cmpRenderValue(p.v1, 1, analysis, bar1)}</td>
          <td class="ct-element ct-element-b" data-label="${cmpAttr(el2Label)}">${cmpRenderValue(p.v2, 2, analysis, bar2)}</td>
          <td class="ct-difference" data-label="${cmpAttr(diffLabel)}">${cmpRenderDiff(p, analysis, el1, el2)}</td>
        </tr>
      `;
    }).join('');
  }

  // Applications comparison (curated 4-category, side-by-side; hides when no data).
  renderCompareApplications(el1, el2);
}

// ─── COMPARE: APPLICATIONS (4 sector categories, side-by-side) ───────────────
// Curated real-world uses (element-applications-data.js → ELEMENT_APPLICATIONS),
// grouped into Industrial / Technological / Biological / Laboratory. Shown only
// when at least one selected element has data; each category row appears only
// where data exists ("when available"). Bilingual via cmpText; nothing invented.
const CMP_APP_CATS = [
  { key: 'industrial',    en: 'Industrial',    pt: 'Industrial' },
  { key: 'technological', en: 'Technological', pt: 'Tecnológico' },
  { key: 'biological',    en: 'Biological',    pt: 'Biológico' },
  { key: 'laboratory',    en: 'Laboratory',    pt: 'Laboratório' }
];

function renderCompareApplications(el1, el2) {
  const host = document.getElementById('cmp-applications');
  if (!host) return;
  const A = (typeof ELEMENT_APPLICATIONS !== 'undefined' && ELEMENT_APPLICATIONS) || {};
  const d1 = el1 ? A[el1.z] : null;
  const d2 = el2 ? A[el2.z] : null;
  if (!d1 && !d2) { host.hidden = true; host.innerHTML = ''; return; }

  const pt = cmpLang() === 'pt';
  const pick = it => (pt ? (it.pt || it.en) : it.en);
  const col = items => (items && items.length)
    ? `<ul class="cmp-app-chips">${items.map(it => `<li class="cmp-app-chip">${cmpEsc(pick(it))}</li>`).join('')}</ul>`
    : `<span class="cmp-app-none">${cmpText('ptable.cmpAppNone', 'No notable use', 'Sem uso notável')}</span>`;

  let rows = '';
  CMP_APP_CATS.forEach(cat => {
    const c1 = (d1 && d1[cat.key]) || [];
    const c2 = (d2 && d2[cat.key]) || [];
    if (!c1.length && !c2.length) return;       // category hidden when neither has data
    rows += `
      <div class="cmp-app-row cmp-app-${cat.key}">
        <div class="cmp-app-cat"><span class="cmp-app-dot"></span>${cmpEsc(pt ? cat.pt : cat.en)}</div>
        <div class="cmp-app-col">${col(c1)}</div>
        <div class="cmp-app-col">${col(c2)}</div>
      </div>`;
  });
  if (!rows) { host.hidden = true; host.innerHTML = ''; return; }

  const title = cmpText('ptable.cmpAppsTitle', 'Applications', 'Aplicações');
  const n1 = el1 ? cmpEsc(elName(el1)) : '—';
  const n2 = el2 ? cmpEsc(elName(el2)) : '—';
  host.hidden = false;
  host.innerHTML =
    `<h3 class="cmp-app-title">${cmpEsc(title)}</h3>` +
    `<div class="cmp-app-table">` +
      `<div class="cmp-app-row cmp-app-headrow"><div class="cmp-app-cat-h"></div><div class="cmp-app-name">${n1}</div><div class="cmp-app-name">${n2}</div></div>` +
      rows +
    `</div>`;
}

function paintCompSlot(slot, z) {
  const pickBtn = document.getElementById('cmp-pick-' + slot);
  const filled = document.getElementById('cmp-filled-' + slot);
  if (!z) {
    pickBtn.style.display = 'flex';
    filled.style.display = 'none';
    return;
  }
  const el = ELEMENTS.find(e => e.z === z);
  if (!el) return;
  pickBtn.style.display = 'none';
  filled.style.display = 'flex';
  const card = document.getElementById('cmp-card-' + slot);
  card.className = 'cmp-slot-card c-' + el.cat;
  document.getElementById('cmp-z-' + slot).textContent = el.z;
  document.getElementById('cmp-sym-' + slot).textContent = el.sym;
  document.getElementById('cmp-nm-' + slot).textContent = elName(el);

  // Premium contextual navigation → full element page. Clean URL (Netlify serves
  // /periodic-table/<latin>.html); compare.html already lives in that folder.
  const exp = document.getElementById('cmp-explore-' + slot);
  if (exp) {
    exp.href = (typeof ELEMENT_LATIN !== 'undefined' && ELEMENT_LATIN[el.z]) || el.sym.toLowerCase();
    exp.title = cmpText('ptable.cmpOpenElementTip', 'Open full element page', 'Ver página completa do elemento');
    exp.setAttribute('aria-label', exp.title + ' — ' + elName(el));
    const t = exp.querySelector('.cmp-explore-txt');
    if (t) t.textContent = cmpText('ptable.cmpOpenElement', 'Open profile', 'Ver perfil');
  }
}

// ─── COMPARE: ATOMIC-MODEL VIEW (normal shells ↔ comparative scale) ──────────
// "Normal" keeps the per-element Bohr canvases. "Comparative Scale" hides them
// and draws both atoms as circles whose sizes are proportional to the real
// atomic radius (so the size gap is obvious), with proton / approximate-neutron
// / electron counts beneath each. All values come from ELEMENTS + cmpNumericValue
// — nothing invented; radius "n/a" shown when an element lacks the datum.
let cmpModelMode = 'normal';

function setCmpModelMode(mode) {
  cmpModelMode = mode === 'scale' ? 'scale' : 'normal';
  const scaleOn = cmpModelMode === 'scale';
  document.querySelectorAll('.cmp-mode-btn').forEach(b => {
    const on = b.dataset.mode === cmpModelMode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.cmp-bohr-wrap').forEach(w => { w.style.display = scaleOn ? 'none' : ''; });
  const sv = document.getElementById('cmp-scale-view');
  if (sv) sv.hidden = !scaleOn;
  if (scaleOn) drawCmpScaleModel();
}

function cmpUpdateModelUI(el1, el2) {
  const bar = document.getElementById('cmp-model-bar');
  const sv = document.getElementById('cmp-scale-view');
  const any = !!(el1 || el2);
  if (bar) bar.hidden = !any;
  // Localize the toggle labels here so PT works without new i18n keys.
  const nb = document.querySelector('.cmp-mode-btn[data-mode="normal"] span');
  const sb = document.querySelector('.cmp-mode-btn[data-mode="scale"] span');
  if (nb) nb.textContent = cmpText('ptable.cmpModeNormal', 'Normal Atomic Model', 'Modelo Atômico Normal');
  if (sb) sb.textContent = cmpText('ptable.cmpModeScale', 'Comparative Scale Model', 'Modelo em Escala Comparativa');
  if (!any) {                       // nothing selected → reset to normal, hide
    cmpModelMode = 'normal';
    document.querySelectorAll('.cmp-bohr-wrap').forEach(w => { w.style.display = ''; });
    if (sv) sv.hidden = true;
    document.querySelectorAll('.cmp-mode-btn').forEach(b => {
      const on = b.dataset.mode === 'normal';
      b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    return;
  }
  const scaleOn = cmpModelMode === 'scale';
  document.querySelectorAll('.cmp-bohr-wrap').forEach(w => { w.style.display = scaleOn ? 'none' : ''; });
  if (sv) sv.hidden = !scaleOn;
  if (scaleOn) drawCmpScaleModel();
}

function cmpScaleAtom(z) {
  if (!z) return null;
  const el = ELEMENTS.find(e => e.z === z);
  if (!el) return null;
  const radius = cmpNumericValue(el, 'radius');
  const mass = cmpNumericValue(el, 'mass');
  return {
    el,
    radius,
    protons: el.z,
    electrons: el.z,
    neutrons: (mass != null) ? Math.max(0, Math.round(mass) - el.z) : null
  };
}

function drawCmpScaleModel() {
  const canvas = document.getElementById('cmp-scale-canvas');
  if (!canvas) return;
  const atoms = [cmpScaleAtom(cmpSelection[1]), cmpScaleAtom(cmpSelection[2])].filter(Boolean);

  const cs = getComputedStyle(document.documentElement);
  const cvar = (n, fb) => ((cs.getPropertyValue(n) || '').trim() || fb);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const text1  = cvar('--text-1', isDark ? '#F2EFE9' : '#12100E');
  const text3  = cvar('--text-3', isDark ? '#52504A' : '#9A948C');
  const accent = cvar('--accent', isDark ? '#34A872' : '#1E6A50');
  const fill   = isDark ? 'rgba(52,168,114,0.16)' : 'rgba(30,106,80,0.10)';

  const cssW = canvas.clientWidth || 640;
  const cssH = 280;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!atoms.length) return;

  const radii = atoms.map(a => a.radius).filter(r => r != null && r > 0);
  const maxRadius = radii.length ? Math.max.apply(null, radii) : null;
  const MAXR = Math.min(94, cssH * 0.30), MINR = 30;
  const colW = cssW / atoms.length, baseY = cssH * 0.54;

  atoms.forEach((a, i) => {
    const cx = colW * (i + 0.5);
    const rpx = (a.radius != null && maxRadius) ? Math.max(MINR, (a.radius / maxRadius) * MAXR) : MINR;
    ctx.fillStyle = text1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = "12px 'DM Sans', Arial, sans-serif";
    ctx.fillText(elName(a.el), cx, 20);
    ctx.beginPath(); ctx.arc(cx, baseY, rpx, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = accent; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, baseY, Math.max(3, rpx * 0.10), 0, Math.PI * 2);
    ctx.fillStyle = accent; ctx.fill();
    ctx.fillStyle = text1;
    ctx.font = "600 " + Math.round(Math.min(30, rpx * 0.7)) + "px 'DM Serif Display', Georgia, serif";
    ctx.fillText(a.el.sym, cx, baseY);
    ctx.fillStyle = text3; ctx.font = "11px 'DM Mono', monospace";
    ctx.fillText(a.radius != null ? (a.radius + ' pm')
      : cmpText('ptable.cmpScaleNoRadius', 'radius n/a', 'raio n/d'), cx, baseY + rpx + 16);
  });

  const statsHost = document.getElementById('cmp-scale-stats');
  if (statsHost) {
    const Lp = cmpText('ptable.cmpScaleProtons',  'protons',            'prótons');
    const Ln = cmpText('ptable.cmpScaleNeutrons', 'neutrons (approx.)', 'nêutrons (aprox.)');
    const Le = cmpText('ptable.cmpScaleElectrons', 'electrons',         'elétrons');
    statsHost.innerHTML = atoms.map(a => `
      <div class="cmp-scale-stat">
        <div class="cmp-scale-stat-sym">${cmpEsc(a.el.sym)}<span>${cmpEsc(elName(a.el))}</span></div>
        <ul class="cmp-scale-counts">
          <li class="cmp-pne cmp-pne-p"><b>${a.protons}</b> ${cmpEsc(Lp)}</li>
          <li class="cmp-pne cmp-pne-n"><b>${a.neutrons != null ? a.neutrons : '—'}</b> ${cmpEsc(Ln)}</li>
          <li class="cmp-pne cmp-pne-e"><b>${a.electrons}</b> ${cmpEsc(Le)}</li>
        </ul>
      </div>`).join('');
  }
}

// ─── TENDÊNCIAS LOGIC ──────────────────────────────────────────────────────
let trendChart = null;
let trendNavChart = null;     // bottom overview / minimap chart
let trendNavWired = false;    // pointer handlers attached only once
let trendNavRAF = null;       // shared rAF id for momentum / eased transitions
let trendAutoY = true;        // auto-scale the Y axis to the visible X slice
const TREND_X_MIN_RANGE = 2;
const TREND_STATE_KEY = 'atomurus-trends-state-v2';
let trendRestoreState = null;
let trendRestoreApplied = false;
let trendStatsRAF = null;

// Resolves the active UI language for JS-built strings (EN default, PT).
function trendLang() {
  const r = (window.I18N && I18N.lang) || document.documentElement.lang || 'en';
  return String(r).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
}

function trendMissingLabel() {
  return trendLang() === 'pt' ? 'Indisponivel' : 'Not available';
}

function readTrendStoredState() {
  try {
    const raw = sessionStorage.getItem(TREND_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || Date.now() - (state.ts || 0) > 24 * 60 * 60 * 1000) return null;
    return state;
  } catch (_) { return null; }
}

function applyTrendStoredControlsOnce() {
  if (trendRestoreApplied) return;
  trendRestoreApplied = true;
  trendRestoreState = readTrendStoredState();
  if (!trendRestoreState) return;
  const propEl = document.getElementById('trend-prop');
  const filterEl = document.getElementById('trend-group');
  if (propEl && trendRestoreState.prop && Array.from(propEl.options).some(o => o.value === trendRestoreState.prop)) {
    propEl.value = trendRestoreState.prop;
  }
  if (trendRestoreState.filter === 'fam-nonmetal') trendRestoreState.filter = 'fam-reactive-nonmetal';
  if (filterEl && trendRestoreState.filter && Array.from(filterEl.options).some(o => o.value === trendRestoreState.filter)) {
    filterEl.value = trendRestoreState.filter;
  }
}

function saveTrendState(reason) {
  if (!trendChart || !trendChart.scales || !trendChart.scales.x) return;
  try {
    const y = trendChart.scales.y || {};
    const x = trendChart.scales.x || {};
    sessionStorage.setItem(TREND_STATE_KEY, JSON.stringify({
      prop: document.getElementById('trend-prop')?.value || trendChart.$trendProp || 'en',
      filter: document.getElementById('trend-group')?.value || trendChart.$trendFilter || 'all',
      xMin: x.min,
      xMax: x.max,
      yMin: y.min,
      yMax: y.max,
      autoY: trendAutoY,
      reason: reason || 'update',
      ts: Date.now()
    }));
  } catch (_) {}
}

function restoreTrendViewportIfNeeded(prop, filter) {
  if (!trendChart || !trendRestoreState) return false;
  const state = trendRestoreState;
  trendRestoreState = null;
  if (state.prop !== prop || state.filter !== filter) return false;
  trendAutoY = state.autoY !== false;
  if (Number.isFinite(state.xMin) && Number.isFinite(state.xMax)) {
    setTrendXRange(state.xMin, state.xMax, { skipSave: true });
  } else {
    fitTrendXToData('none');
  }
  if (!trendAutoY && Number.isFinite(state.yMin) && Number.isFinite(state.yMax)) {
    trendChart.options.scales.y.min = state.yMin;
    trendChart.options.scales.y.max = state.yMax;
    trendChart.update('none');
  } else {
    applyAutoY();
  }
  updateAutoBtn();
  updateNavWindow();
  return true;
}

function trendElementUrl(el) {
  const latin = (typeof ELEMENT_LATIN !== 'undefined' && ELEMENT_LATIN[el.z]) || el.sym.toLowerCase();
  const inPtFolder = /\/periodic-table\/[^/]*(\.html)?$/i.test(location.pathname);
  const needsHtml = location.protocol === 'file:' || /\.html(\?|$)/i.test(location.pathname + location.search);
  return (inPtFolder ? '' : 'periodic-table/') + latin + (needsHtml ? '.html' : '');
}

function trackTrendElementClick(el, prop) {
  const payload = {
    action: 'trend_chart_element_click',
    element: elName(el),
    property: trendPropLabel(prop)
  };
  try {
    if (typeof gtag === 'function') {
      gtag('event', payload.action, {
        event_category: 'Periodic Trends',
        element: payload.element,
        property: payload.property
      });
    }
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: payload.action, ...payload });
    if (typeof window.plausible === 'function') window.plausible(payload.action, { props: { element: payload.element, property: payload.property } });
    window.dispatchEvent(new CustomEvent('atomurus:analytics', { detail: payload }));
  } catch (_) {}
}

function trendPointPixel(chart, index) {
  if (!chart || !chart.scales || !chart.scales.x) return null;
  const x = chart.scales.x.getPixelForValue(index);
  const real = chart.data.datasets[0]?.data?.[index];
  if (real != null && Number.isFinite(real) && chart.scales.y) {
    return { x, y: chart.scales.y.getPixelForValue(real), real: true };
  }
  const bridge = chart.$trendBridge && chart.$trendBridge[index];
  if (bridge != null && Number.isFinite(bridge) && chart.scales.y) {
    return { x, y: chart.scales.y.getPixelForValue(bridge), real: false };
  }
  const a = chart.chartArea;
  return a ? { x, y: (a.top + a.bottom) / 2, real: false } : null;
}

function trendHitFromEvent(chart, evt, maxDistance) {
  if (!chart || !chart.$trendElements || !chart.scales || !chart.scales.x) return null;
  const native = evt && evt.native ? evt.native : evt;
  const x = Number.isFinite(evt?.x) ? evt.x : native?.offsetX;
  const y = Number.isFinite(evt?.y) ? evt.y : native?.offsetY;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const a = chart.chartArea;
  if (!a || x < a.left || x > a.right || y < a.top || y > a.bottom) return null;
  const index = Math.round(chart.scales.x.getValueForPixel(x));
  if (index < 0 || index >= chart.$trendElements.length) return null;
  const point = trendPointPixel(chart, index);
  if (!point) return null;
  const dist = Math.hypot(point.x - x, point.y - y);
  const dense = chart.$trendElements.length > 40;
  const threshold = maxDistance || (dense ? 15 : 20);
  return dist <= threshold ? { index, el: chart.$trendElements[index], point } : null;
}

function navigateTrendElement(hit, nativeEvent) {
  if (!hit || !hit.el) return;
  saveTrendState('element-navigation');
  trackTrendElementClick(hit.el, trendChart?.$trendProp || document.getElementById('trend-prop')?.value || 'en');
  const url = trendElementUrl(hit.el);
  const openNew = nativeEvent && (nativeEvent.button === 1 || nativeEvent.ctrlKey || nativeEvent.metaKey);
  if (openNew) {
    const win = window.open(url, '_blank', 'noopener');
    if (win) win.opener = null;
  } else {
    window.location.href = url;
  }
}

function ensureTrendA11yStatus() {
  let node = document.getElementById('trend-a11y-status');
  if (!node) {
    node = document.createElement('span');
    node.id = 'trend-a11y-status';
    node.className = 'trend-sr-only';
    node.setAttribute('aria-live', 'polite');
    const wrap = document.querySelector('.trend-chart-wrap') || document.body;
    wrap.appendChild(node);
  }
  return node;
}

function updateTrendKeyboardFocus(index, announce) {
  if (!trendChart || !trendChart.$trendElements?.length) return;
  const n = trendChart.$trendElements.length;
  index = Math.max(0, Math.min(n - 1, Number.isFinite(index) ? index : 0));
  trendChart.$trendKeyboardIndex = index;
  const el = trendChart.$trendElements[index];
  const label = `${elName(el)} (${el.sym}), Z=${el.z}. ${trendLang() === 'pt' ? 'Pressione Enter para abrir.' : 'Press Enter to open.'}`;
  const canvas = document.getElementById('trend-chart');
  if (canvas) canvas.setAttribute('aria-label', label);
  if (announce) ensureTrendA11yStatus().textContent = label;
  trendChart.update('none');
}

window.addEventListener('pagehide', () => saveTrendState('pagehide'));

// Registers chartjs-plugin-zoom once. The CDN UMD build may or may not self-
// register depending on version, so we do it defensively. No-op (and the chart
// still renders, just without pan/zoom) if the plugin script didn't load.
function ensureZoomPlugin() {
  try {
    if (window.Chart && Chart.registry && !Chart.registry.plugins.get('zoom')) {
      const z = window.ChartZoom || window.chartjsPluginZoom;
      if (z) Chart.register(z);
    }
  } catch (e) {}
}

// Returns the chart to its full extent — wired to the reset button and a
// double-click on the canvas.
function resetTrendZoom() {
  if (trendChart) {
    trendAutoY = true;                                   // fit-to-data: full X + auto Y
    trendChart.options.scales.y.min = undefined;
    trendChart.options.scales.y.max = undefined;
    fitTrendXToData('none');
    applyAutoY();
    updateNavWindow();
    updateAutoBtn();
    updateTrendStatsFromChart();
    saveTrendState('reset');
  }
  const b = document.getElementById('trend-reset');
  if (b) b.hidden = true;
}

function trendFullXBounds(chart) {
  const c = chart || trendChart;
  const n = c && c.data && c.data.labels ? c.data.labels.length : 0;
  const max = Math.max(0, n - 1);
  return { min: 0, max, span: max };
}

function clampTrendXRange(min, max, chart) {
  const b = trendFullXBounds(chart);
  if (b.span <= 0) return { min: b.min, max: b.max };
  min = Number.isFinite(min) ? min : b.min;
  max = Number.isFinite(max) ? max : b.max;
  if (max < min) { const t = min; min = max; max = t; }

  const minSpan = Math.min(TREND_X_MIN_RANGE, b.span);
  let span = max - min;
  if (span < minSpan) {
    const center = (min + max) / 2;
    min = center - minSpan / 2;
    max = center + minSpan / 2;
    span = minSpan;
  }
  if (span > b.span) {
    min = b.min;
    max = b.max;
    span = b.span;
  }
  if (min < b.min) { max += b.min - min; min = b.min; }
  if (max > b.max) { min -= max - b.max; max = b.max; }
  min = Math.max(b.min, min);
  max = Math.min(b.max, max);
  return { min, max };
}

function setChartXRange(chart, min, max, mode) {
  if (!chart) return;
  const r = clampTrendXRange(min, max, chart);
  if (typeof chart.zoomScale === 'function') {
    chart.zoomScale('x', { min: r.min, max: r.max }, mode || 'none');
  } else {
    chart.options.scales.x.min = r.min;
    chart.options.scales.x.max = r.max;
    chart.update(mode || 'none');
  }
}

function fitTrendXToData(mode) {
  if (!trendChart) return;
  const b = trendFullXBounds(trendChart);
  setChartXRange(trendChart, b.min, b.max, mode || 'none');
}

function clampTrendViewport() {
  if (!trendChart || !trendChart.scales || !trendChart.scales.x) return;
  const sx = trendChart.scales.x;
  const r = clampTrendXRange(sx.min, sx.max, trendChart);
  if (Math.abs(r.min - sx.min) > 0.001 || Math.abs(r.max - sx.max) > 0.001) {
    setChartXRange(trendChart, r.min, r.max, 'none');
  }
}

// Display units per property — drives Y-axis titles, tooltips and CSV headers.
const TREND_UNITS = { en: '', radius: 'pm', melt: '°C', boil: '°C', mass: 'u', density: 'g/cm³', ionization: 'kJ/mol' };

// ─── DYNAMIC SCIENTIFIC INSIGHT ENGINE ─────────────────────────────────────
// Curated, scientifically-vetted explanations per property — NEVER generated at
// runtime. Each property carries, in EN and PT:
//   def    — what the property is (the lead line)
//   trend  — the main periodic trend, in one sentence
//   why    — the scientific reason behind that trend
//   interp — a short educational takeaway (the extremes)
//   period — context line shown when a single period is filtered (← → trend)
//   group  — context line shown when a single group is filtered (↓ trend)
//   fblock — context line for the lanthanide / actinide series
// The highest/lowest *values* are computed live from the data (renderTrendStatsUI),
// so the qualitative text and the quantitative grid stay in sync with any filter.
const TREND_INSIGHTS = {
  en: {
    en: {
      def: 'Electronegativity measures how strongly a bonded atom attracts the shared electrons of a chemical bond (Pauling scale).',
      trend: 'Increases across a period (left → right) and decreases down a group.',
      why: 'Across a period the nuclear charge grows while electrons stay in the same shell, so the atom pulls bonding electrons more tightly. Down a group, added shells and shielding place the outer electrons farther from the nucleus, weakening that pull.',
      interp: 'Fluorine, at the top-right, is the most electronegative element; the heavy alkali metals at the bottom-left are the least.',
      period: 'Across this period, electronegativity rises toward the right.',
      group: 'Down this group, electronegativity falls as the atoms grow larger.',
      fblock: 'Across this inner-transition series, electronegativity stays low and nearly constant.'
    },
    pt: {
      def: 'A eletronegatividade mede o quanto um átomo ligado atrai os elétrons compartilhados de uma ligação química (escala de Pauling).',
      trend: 'Aumenta ao longo de um período (esquerda → direita) e diminui ao descer um grupo.',
      why: 'Ao longo de um período, a carga nuclear cresce enquanto os elétrons permanecem na mesma camada, então o átomo atrai os elétrons de ligação com mais força. Ao descer um grupo, camadas extras e a blindagem afastam os elétrons externos do núcleo, enfraquecendo essa atração.',
      interp: 'O flúor, no canto superior direito, é o elemento mais eletronegativo; os metais alcalinos pesados, no canto inferior esquerdo, são os menos.',
      period: 'Neste período, a eletronegatividade cresce para a direita.',
      group: 'Neste grupo, a eletronegatividade cai conforme os átomos ficam maiores.',
      fblock: 'Nesta série de transição interna, a eletronegatividade permanece baixa e quase constante.'
    }
  },
  radius: {
    en: {
      def: 'Atomic radius estimates the size of an atom — roughly the distance from the nucleus to its outermost electrons.',
      trend: 'Decreases across a period (left → right) and increases down a group.',
      why: 'Across a period the rising nuclear charge draws the same-shell electrons inward, so atoms shrink. Down a group each new period adds an electron shell, so atoms get larger.',
      interp: 'The largest atoms are the heavy alkali metals (bottom-left, such as caesium); the smallest sit toward the top-right.',
      period: 'Across this period, atoms shrink toward the right.',
      group: 'Down this group, atoms grow as electron shells are added.',
      fblock: 'Across this series the radius shrinks only slightly — the lanthanide/actinide contraction, caused by weak f-electron shielding.'
    },
    pt: {
      def: 'O raio atômico estima o tamanho do átomo — aproximadamente a distância do núcleo aos seus elétrons mais externos.',
      trend: 'Diminui ao longo de um período (esquerda → direita) e aumenta ao descer um grupo.',
      why: 'Ao longo de um período, o aumento da carga nuclear puxa os elétrons da mesma camada para dentro, então os átomos encolhem. Ao descer um grupo, cada novo período adiciona uma camada, então os átomos ficam maiores.',
      interp: 'Os maiores átomos são os metais alcalinos pesados (canto inferior esquerdo, como o césio); os menores ficam em direção ao canto superior direito.',
      period: 'Neste período, os átomos encolhem para a direita.',
      group: 'Neste grupo, os átomos crescem com a adição de camadas.',
      fblock: 'Nesta série o raio diminui só gradualmente — a contração lantanídica/actinídica, pela blindagem fraca dos elétrons f.'
    }
  },
  melt: {
    en: {
      def: 'Melting point is the temperature at which a solid becomes a liquid.',
      trend: 'No simple periodic trend — it peaks where atomic bonding is strongest.',
      why: 'Melting breaks the bonds holding atoms in the solid lattice. Strong metallic and covalent networks (carbon, tungsten) resist this up to very high temperatures, while molecular solids and the noble gases melt extremely low.',
      interp: 'Carbon and refractory metals like tungsten melt highest; helium and the noble gases melt near absolute zero.',
      period: 'Across this period it climbs toward the strongly-bonded centre, then drops toward the gases.',
      group: 'Down this group the trend depends on bonding type — alkali metals fall, while several nonmetal groups rise.',
      fblock: 'Across this metallic series the melting points stay high and fairly uniform.'
    },
    pt: {
      def: 'O ponto de fusão é a temperatura em que um sólido se torna líquido.',
      trend: 'Sem tendência periódica simples — é máximo onde a ligação atômica é mais forte.',
      why: 'A fusão quebra as ligações que prendem os átomos na rede do sólido. Redes metálicas e covalentes fortes (carbono, tungstênio) resistem até temperaturas altíssimas, enquanto sólidos moleculares e gases nobres fundem muito baixo.',
      interp: 'Carbono e metais refratários como o tungstênio fundem mais alto; o hélio e os gases nobres fundem perto do zero absoluto.',
      period: 'Neste período, sobe até o centro de ligação forte e depois cai em direção aos gases.',
      group: 'Neste grupo a tendência depende do tipo de ligação — metais alcalinos caem, enquanto vários grupos de não-metais sobem.',
      fblock: 'Nesta série metálica os pontos de fusão permanecem altos e bastante uniformes.'
    }
  },
  boil: {
    en: {
      def: 'Boiling point is the temperature at which a liquid becomes a gas.',
      trend: 'Like melting point, it has no simple periodic trend — it follows how strongly atoms are bound.',
      why: 'Boiling fully separates atoms or molecules, so it scales with bond strength: strongly-bonded metals boil hottest, while the noble gases — held by only weak forces — boil just above absolute zero.',
      interp: 'Refractory metals such as tungsten and rhenium boil highest; helium boils lowest of all elements.',
      period: 'Across this period it rises toward the strongly-bonded metals, then falls toward the gases.',
      group: 'Down this group the trend depends on bonding type and intermolecular forces.',
      fblock: 'Across this metallic series the boiling points stay very high.'
    },
    pt: {
      def: 'O ponto de ebulição é a temperatura em que um líquido se torna gás.',
      trend: 'Como o ponto de fusão, não tem tendência periódica simples — acompanha quão fortemente os átomos estão ligados.',
      why: 'A ebulição separa completamente átomos ou moléculas, então acompanha a força da ligação: metais de ligação forte fervem mais quente, enquanto os gases nobres — presos por forças fracas — fervem logo acima do zero absoluto.',
      interp: 'Metais refratários como tungstênio e rênio fervem mais alto; o hélio ferve mais baixo que todos os elementos.',
      period: 'Neste período, sobe em direção aos metais de ligação forte e depois cai em direção aos gases.',
      group: 'Neste grupo a tendência depende do tipo de ligação e das forças intermoleculares.',
      fblock: 'Nesta série metálica os pontos de ebulição permanecem altíssimos.'
    }
  },
  mass: {
    en: {
      def: 'Atomic mass is the average mass of an atom of the element, in unified atomic mass units (u).',
      trend: 'Increases steadily with atomic number — so it rises across a period and down a group.',
      why: 'Each step to the next element adds protons and, on average, neutrons to the nucleus. Since nucleons carry almost all the mass, atomic mass climbs almost monotonically with Z.',
      interp: 'Hydrogen is the lightest element; the synthetic superheavy elements at the end of the table are the heaviest.',
      period: 'Across this period, mass rises with each added proton.',
      group: 'Down this group, mass rises as the nuclei grow heavier.',
      fblock: 'Across this series, mass increases steadily with atomic number.'
    },
    pt: {
      def: 'A massa atômica é a massa média de um átomo do elemento, em unidades de massa atômica (u).',
      trend: 'Aumenta de forma contínua com o número atômico — então cresce ao longo de um período e ao descer um grupo.',
      why: 'Cada passo para o próximo elemento adiciona prótons e, em média, nêutrons ao núcleo. Como os núcleons carregam quase toda a massa, a massa atômica cresce de forma quase monotônica com Z.',
      interp: 'O hidrogênio é o elemento mais leve; os elementos superpesados sintéticos no fim da tabela são os mais pesados.',
      period: 'Neste período, a massa cresce a cada próton adicionado.',
      group: 'Neste grupo, a massa cresce conforme os núcleos ficam mais pesados.',
      fblock: 'Nesta série, a massa aumenta de forma contínua com o número atômico.'
    }
  },
  density: {
    en: {
      def: 'Density is how much mass is packed into a given volume (g/cm³ for solids and liquids; gases are far lower).',
      trend: 'No simple left-to-right trend — it peaks among the heavy transition metals.',
      why: 'Density depends on both atomic mass and how tightly atoms pack. The heavy d-block metals combine large masses with compact crystal packing, making them densest; gases, with atoms far apart, are least dense.',
      interp: 'Osmium and iridium are the densest elements; hydrogen and helium are the lightest.',
      period: 'Across this period, density peaks near the centre (transition metals) and falls toward the gases.',
      group: 'Down this group, density generally increases as the atoms get heavier.',
      fblock: 'Across this series, density rises gradually as mass increases.'
    },
    pt: {
      def: 'A densidade é quanta massa cabe em um dado volume (g/cm³ para sólidos e líquidos; gases são bem menores).',
      trend: 'Sem tendência simples de esquerda para a direita — é máxima entre os metais de transição pesados.',
      why: 'A densidade depende da massa atômica e de quão compactamente os átomos se empacotam. Os metais pesados do bloco d combinam grande massa com empacotamento cristalino compacto, sendo os mais densos; gases, com átomos distantes, são os menos densos.',
      interp: 'Ósmio e irídio são os elementos mais densos; hidrogênio e hélio são os mais leves.',
      period: 'Neste período, a densidade é máxima perto do centro (metais de transição) e cai em direção aos gases.',
      group: 'Neste grupo, a densidade geralmente aumenta conforme os átomos ficam mais pesados.',
      fblock: 'Nesta série, a densidade cresce gradualmente com o aumento da massa.'
    }
  },
  ionization: {
    en: {
      def: 'First ionization energy is the energy needed to remove the most loosely held electron from a neutral gaseous atom.',
      trend: 'Increases across a period (left → right) and decreases down a group.',
      why: 'Across a period the rising nuclear charge binds the outer electrons more tightly, so more energy is required. Down a group the outermost electron lies farther out and is better shielded, so it is removed more easily.',
      interp: 'Helium and the noble gases require the most energy; the heavy alkali metals lose an electron most easily.',
      period: 'Across this period, ionization energy rises toward the noble gas.',
      group: 'Down this group, ionization energy falls as the outer electron moves farther out.',
      fblock: 'Across this series, ionization energy changes only slowly.'
    },
    pt: {
      def: 'A primeira energia de ionização é a energia necessária para remover o elétron mais fracamente ligado de um átomo gasoso neutro.',
      trend: 'Aumenta ao longo de um período (esquerda → direita) e diminui ao descer um grupo.',
      why: 'Ao longo de um período, o aumento da carga nuclear prende os elétrons externos com mais força, exigindo mais energia. Ao descer um grupo, o elétron mais externo fica mais distante e mais blindado, sendo removido com mais facilidade.',
      interp: 'O hélio e os gases nobres exigem mais energia; os metais alcalinos pesados perdem um elétron com mais facilidade.',
      period: 'Neste período, a energia de ionização cresce em direção ao gás nobre.',
      group: 'Neste grupo, a energia de ionização cai conforme o elétron externo se afasta.',
      fblock: 'Nesta série, a energia de ionização muda muito pouco.'
    }
  }
};

// Resolves a single (element, property) pair to a finite number, or null when
// data is unavailable. null (never 0) is essential: 0 °C is a real temperature,
// and synthetic elements carrying "—" must read as "no data" — a gap in the
// line — instead of plunging the curve to 0 (which produced the false 0-plateau
// and spike artifacts for melt/boil on Z≥104). The line gaps (spanGaps:false)
// and the caption's highest/lowest scan both key off null.
function trendNum(el, prop) {
  if (!el) return null;
  let raw, n;
  switch (prop) {
    case 'en':         raw = el.en; break;
    case 'mass':       raw = (typeof el.mass === 'string' ? el.mass.replace(/[^0-9.]/g, '') : el.mass); break;
    case 'radius':     raw = (getExtra2(el.z) || {}).radius; break;
    case 'melt':       raw = (getExtra(el.z)  || {}).melt; break;
    case 'boil':       raw = (getExtra(el.z)  || {}).boil; break;
    case 'ionization': raw = (typeof getIonization === 'function') ? getIonization(el.z) : undefined; break;
    case 'density':
      // Density mixes units in the source data: gases (and a couple of
      // superheavy predictions like Cn/Fl) are stored in g/L, solids in g/cm³.
      // Normalize everything to g/cm³ so one element doesn't blow out the scale.
      raw = (getExtra2(el.z) || {}).density;
      n = parseFloat(raw);
      if (!Number.isFinite(n)) return null;
      if (/g\s*\/\s*l/i.test(String(raw))) n /= 1000;
      return n;
    default: return null;
  }
  n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// Builds the "missing-data bridge": a parallel series, on the SAME Y axis as the
// real line, that turns gaps into a continuous dashed continuation instead of
// loose markers on a separate layer. For each index it returns:
//   • a real value, only where that point borders a gap (an anchor, so the dashed
//     line meets the solid line exactly);
//   • a linearly-interpolated value across an interior gap (held flat for a
//     leading/trailing gap that has just one neighbour) — purely visual, never
//     stored as data and never shown in a tooltip;
//   • null on the interior of a fully-measured run, so the dashed layer never
//     overdraws the solid line.
// `isMissing[i]` flags the genuinely-unknown elements (null / non-finite) — used
// to place the discreet markers and to label them "Not available". No zeros, no
// invented numbers: the real series stays untouched.
function buildTrendBridge(values) {
  const n = values.length;
  const isReal = v => v != null && Number.isFinite(v);
  const bridge = new Array(n).fill(null);
  const isMissing = values.map(v => !isReal(v));
  let hasReal = false;
  for (let i = 0; i < n; i++) { if (isReal(values[i])) { hasReal = true; break; } }
  if (!hasReal) return { bridge, isMissing, hasReal: false };
  for (let i = 0; i < n; i++) {
    if (isReal(values[i])) {
      const bordersGap = (i > 0 && !isReal(values[i - 1])) || (i < n - 1 && !isReal(values[i + 1]));
      bridge[i] = bordersGap ? values[i] : null;          // anchor only next to a gap
    } else {
      let l = i - 1; while (l >= 0 && !isReal(values[l])) l--;
      let r = i + 1; while (r < n && !isReal(values[r])) r++;
      const hasL = l >= 0, hasR = r < n;
      if (hasL && hasR)      bridge[i] = values[l] + (values[r] - values[l]) * (i - l) / (r - l);
      else if (hasL)         bridge[i] = values[l];        // trailing gap → hold flat
      else if (hasR)         bridge[i] = values[r];        // leading gap → hold flat
    }
  }
  return { bridge, isMissing, hasReal: true };
}

// Resolves the i18n-translated display name of a property (uses option text).
function trendPropLabel(prop) {
  const opt = Array.from(document.getElementById('trend-prop').options).find(o => o.value === prop);
  return opt ? opt.text : prop;
}

function trendEscapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ─── TRENDS TOOLTIP — compact scientific info card ─────────────────────────
// Per-property formatting for the rich hover card. Each property resolves to a
// display value with its natural, auto-adapted unit (pm · °C + K · u · g/cm³ or
// g/L · kJ/mol + eV · Pauling). Returns { available:false } when the element has
// no value for that property, so the card can omit it (rule: show only what
// exists) — the only fabrication-free way to keep the layout honest.
function fmtTrendNum(v, dec) {
  if (v == null || !Number.isFinite(v)) return '';
  return String(+v.toFixed(dec == null ? 2 : dec));   // round, then drop trailing zeros
}

function formatTrendProp(el, prop) {
  const label = trendPropLabel(prop);
  if (!el) return { label, available: false };
  // Density keeps its SOURCE unit (gases g/L, solids g/cm³) — far more readable
  // than the g/cm³-normalised value the chart plots (e.g. H → 0.0000899).
  if (prop === 'density') {
    const raw = (getExtra2(el.z) || {}).density;
    if (raw == null || !/\d/.test(String(raw))) return { label, available: false };
    const m = String(raw).match(/^\s*([\d.]+)\s*(.*)$/);
    return { label, available: true, value: m ? m[1] : String(raw).trim(), unit: m ? m[2].trim() : '' };
  }
  // Atomic mass: source string preserves precision and [bracketed] mass numbers.
  if (prop === 'mass') {
    if (el.mass == null || el.mass === '—') return { label, available: false };
    return { label, available: true, value: String(el.mass).trim(), unit: 'u' };
  }
  const n = trendNum(el, prop);
  if (n == null) return { label, available: false };
  if (prop === 'en')         return { label, available: true, value: fmtTrendNum(n, 2), desc: 'Pauling' };
  if (prop === 'radius')     return { label, available: true, value: fmtTrendNum(n, 0), unit: 'pm' };
  if (prop === 'melt' || prop === 'boil')
                             return { label, available: true, value: fmtTrendNum(n, 1), unit: '°C', alt: Math.round(n + 273.15) + ' K' };
  if (prop === 'ionization') return { label, available: true, value: fmtTrendNum(n, 0), unit: 'kJ/mol', alt: (n / 96.485).toFixed(2) + ' eV' };
  return { label, available: true, value: fmtTrendNum(n, 2), unit: TREND_UNITS[prop] || '' };
}

// Builds the card markup for one element. The plotted property is emphasised at
// the top; every other available trend property follows as a compact context
// row. Identity meta (Z · period · group · category) sits under the name.
function buildTrendCard(el, prop) {
  if (!el) return '';
  const lang = trendLang();
  const T = lang === 'pt'
    ? { z: 'Número atômico', period: 'Período', group: 'Grupo' }
    : { z: 'Atomic number', period: 'Period', group: 'Group' };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let meta = `<span>${T.z}</span><b>${el.z}</b>`;
  if (Number.isFinite(+el.period)) meta += `<span>${T.period}</span><b>${esc(el.period)}</b>`;
  // f-block elements carry a column-index group in the dataset, not a real IUPAC
  // group (3–12); omit it so the card never shows a misleading "Group 4" for a
  // lanthanide. Period + the Lanthanide/Actinide category already place them.
  const isFBlock = el.cat === 'lanthanide' || el.cat === 'actinide';
  if (!isFBlock && el.group != null && el.group !== '' && Number.isFinite(+el.group)) meta += `<span>${T.group}</span><b>${esc(el.group)}</b>`;
  const cat = trendChemicalFamilyLabel(el);
  const p = formatTrendProp(el, prop);
  let primary;
  if (p.available) {
    const tail = p.unit ? `<span class="tt-unit">${esc(p.unit)}</span>`
               : p.desc ? `<span class="tt-unit">${esc(p.desc)}</span>` : '';
    const alt  = p.alt ? `<span class="tt-alt">· ${esc(p.alt)}</span>` : '';
    primary = `<div class="tt-primary"><div class="tt-plbl">${esc(p.label)}</div>` +
              `<div class="tt-pval">${esc(p.value)}${tail}${alt}</div></div>`;
  } else {
    primary = `<div class="tt-primary is-missing"><div class="tt-plbl">${esc(p.label)}</div>` +
              `<div class="tt-pval">${esc(trendMissingLabel())}</div></div>`;
  }
  // Up to 4 context rows, by priority — keeps the card compact (the plotted
  // property is already emphasised above). Most-fundamental periodic properties
  // first; bulk physical ones (density/melt/boil) fill remaining slots.
  let rows = '', shown = 0;
  ['en', 'radius', 'mass', 'ionization', 'density', 'melt', 'boil'].some(k => {
    if (k === prop) return false;
    const f = formatTrendProp(el, k);
    if (!f.available) return false;
    const u = f.unit ? ' ' + esc(f.unit) : (f.desc ? ' ' + esc(f.desc) : '');
    rows += `<div class="tt-row"><span class="tt-rlbl">${esc(f.label)}</span>` +
            `<span class="tt-rval">${esc(f.value)}${u}</span></div>`;
    return ++shown >= 4;
  });
  return `<div class="tt-head"><span class="tt-name">${esc(elName(el))}</span>` +
           `<span class="tt-sym">${esc(el.sym)}</span></div>` +
         (cat ? `<span class="tt-cat">${esc(cat)}</span>` : '') +
         `<div class="tt-meta">${meta}</div>` +
         `<div class="tt-sep"></div>` +
         primary +
         (rows ? `<div class="tt-rows">${rows}</div>` : '');
}

// Filters ELEMENTS by group selector value: 'all', 'gN', 'lanthanides',
// 'actinides'. Period filtering is applied as a separate AND-step in
// trendFilterAll so users can combine group × period freely.
function trendFilterGroup(group) {
  if (!group || group === 'all') return ELEMENTS.slice();
  if (group === 'lanthanides')   return ELEMENTS.filter(e => e.z >= 57 && e.z <= 71);
  if (group === 'actinides')     return ELEMENTS.filter(e => e.z >= 89 && e.z <= 103);
  if (group.startsWith('g'))     { const g = +group.slice(1); return ELEMENTS.filter(e => +e.group === g); }
  return ELEMENTS.slice();
}

// Applies the unified filter dropdown value. Selector value is one of:
//   'all'                          → every element (Z 1–118)
//   'pN'                           → period N (1–7)
//   'gN'                           → group N (1–18)
//   'fam-<cat>'                    → chemical family (by element category)
//   'lanthanides' / 'actinides'    → f-block sub-series
// Handling everything from a single string keeps the UI clean: one dropdown,
// one source of truth. New filters slot in here (and in TREND_SCOPE) with no
// other change required.
function trendFilterElements(filterValue) {
  if (!filterValue || filterValue === 'all') return ELEMENTS.slice();
  if (filterValue === 'lanthanides')         return ELEMENTS.filter(e => e.z >= 57 && e.z <= 71);
  if (filterValue === 'actinides')           return ELEMENTS.filter(e => e.z >= 89 && e.z <= 103);
  if (filterValue.indexOf('fam-') === 0)     return trendFilterFamily(filterValue.slice(4));
  if (filterValue.startsWith('p'))           { const p = +filterValue.slice(1); return ELEMENTS.filter(e => +e.period === p); }
  if (filterValue.startsWith('g'))           { const g = +filterValue.slice(1); return ELEMENTS.filter(e => +e.group === g && trendGroupKeepsFBlock(g, e)); }
  return ELEMENTS.slice();
}

// The dataset assigns f-block elements a column-index "group" (Ce→4 … Lu→17),
// which leaks lanthanides/actinides into the d/p-block group filters (e.g. Ce in
// "Group 4", Lu/Lr in "Group 17"). Groups 4–18 are exclusively d/p-block, so we
// drop the f-block there; group 3 keeps La/Ac (a legitimate boundary). The
// f-block stays fully reachable via the dedicated Lanthanides/Actinides filters.
function trendGroupKeepsFBlock(g, e) {
  return g <= 3 || (e.cat !== 'lanthanide' && e.cat !== 'actinide');
}

const TREND_FAMILY_DEFS = [
  { key: 'alkali',            value: 'fam-alkali',            en: 'Alkali Metals',          pt: 'Metais Alcalinos' },
  { key: 'alkaline',          value: 'fam-alkaline',          en: 'Alkaline Earth Metals',  pt: 'Metais Alcalino-Terrosos' },
  { key: 'transition',        value: 'fam-transition',        en: 'Transition Metals',      pt: 'Metais de Transição' },
  { key: 'posttrans',         value: 'fam-posttrans',         en: 'Post-Transition Metals', pt: 'Metais de Pós-Transição' },
  { key: 'metalloid',         value: 'fam-metalloid',         en: 'Metalloids',             pt: 'Metaloides' },
  { key: 'reactive-nonmetal', value: 'fam-reactive-nonmetal', en: 'Reactive Nonmetals',     pt: 'Não-metais Reativos', aliases: ['nonmetal', 'fam-nonmetal'] },
  { key: 'halogen',           value: 'fam-halogen',           en: 'Halogens',               pt: 'Halogênios' },
  { key: 'noble',             value: 'fam-noble',             en: 'Noble Gases',            pt: 'Gases Nobres' },
  { key: 'lanthanide',        value: 'fam-lanthanide',        en: 'Lanthanides',            pt: 'Lantanídeos' },
  { key: 'actinide',          value: 'fam-actinide',          en: 'Actinides',              pt: 'Actinídeos' }
];

function trendFamilyDef(key) {
  return TREND_FAMILY_DEFS.find(f => f.key === key || f.value === key || (f.aliases || []).includes(key));
}

function trendChemicalFamilyKey(el) {
  if (!el) return '';
  if (el.cat === 'lanthanide') return 'lanthanide';
  if (el.cat === 'actinide') return 'actinide';
  if (+el.group === 17) return 'halogen';
  if (+el.group === 18 || el.cat === 'noble') return 'noble';
  if (el.cat === 'alkali') return 'alkali';
  if (el.cat === 'alkaline') return 'alkaline';
  if (el.cat === 'transition') return 'transition';
  if (el.cat === 'posttrans') return 'posttrans';
  if (el.cat === 'metalloid') return 'metalloid';
  if (el.cat === 'nonmetal' || el.cat === 'polyatomic') return 'reactive-nonmetal';
  return el.cat || '';
}

function trendChemicalFamilyLabel(el) {
  const def = trendFamilyDef(trendChemicalFamilyKey(el));
  return def ? trendSelStr(def, trendLang()) : catName(el);
}

function trendFilterFamilyModern(fam) {
  const def = trendFamilyDef(fam);
  const key = def ? def.key : fam;
  return ELEMENTS.filter(e => trendChemicalFamilyKey(e) === key);
}

// Chemical-family filters go through trendChemicalFamilyKey() so every element
// has one accepted family even when the raw dataset category is broader.
function trendFilterFamily(fam) {
  return trendFilterFamilyModern(fam);
}

// ─── TRENDS SCOPE SELECTOR (custom accessible listbox) ─────────────────────
// Single source of truth for the scope dropdown's structure + bilingual labels.
// To add a future filter: drop an item into the right section here and handle
// its value in trendFilterElements — the UI, the native <select> mirror, the
// caption label and the export all pick it up automatically.
const TREND_SCOPE = [
  { header: { en: 'All elements', pt: 'Todos os elementos' }, items: [
    { v: 'all', en: 'All Elements (Z 1–118)', pt: 'Todos os Elementos (Z 1–118)' }
  ]},
  { header: { en: 'Periods', pt: 'Períodos' }, items: [
    { v: 'p1', en: 'Period 1', pt: 'Período 1' }, { v: 'p2', en: 'Period 2', pt: 'Período 2' },
    { v: 'p3', en: 'Period 3', pt: 'Período 3' }, { v: 'p4', en: 'Period 4', pt: 'Período 4' },
    { v: 'p5', en: 'Period 5', pt: 'Período 5' }, { v: 'p6', en: 'Period 6', pt: 'Período 6' },
    { v: 'p7', en: 'Period 7', pt: 'Período 7' }
  ]},
  { header: { en: 'Main groups', pt: 'Grupos principais' }, items: [
    { v: 'g1',  en: 'Group 1 (Alkali Metals)',         pt: 'Grupo 1 (Metais Alcalinos)' },
    { v: 'g2',  en: 'Group 2 (Alkaline Earth Metals)', pt: 'Grupo 2 (Metais Alcalino-Terrosos)' },
    { v: 'g13', en: 'Group 13 (Boron Family)',         pt: 'Grupo 13 (Família do Boro)' },
    { v: 'g14', en: 'Group 14 (Carbon Family)',        pt: 'Grupo 14 (Família do Carbono)' },
    { v: 'g15', en: 'Group 15 (Pnictogens)',           pt: 'Grupo 15 (Pnictogênios)' },
    { v: 'g16', en: 'Group 16 (Chalcogens)',           pt: 'Grupo 16 (Calcogênios)' },
    { v: 'g17', en: 'Group 17 (Halogens)',             pt: 'Grupo 17 (Halogênios)' },
    { v: 'g18', en: 'Group 18 (Noble Gases)',          pt: 'Grupo 18 (Gases Nobres)' }
  ]},
  { header: { en: 'Transition metals', pt: 'Metais de transição' }, items: [
    { v: 'g3',  en: 'Group 3',  pt: 'Grupo 3' },  { v: 'g4',  en: 'Group 4',  pt: 'Grupo 4' },
    { v: 'g5',  en: 'Group 5',  pt: 'Grupo 5' },  { v: 'g6',  en: 'Group 6',  pt: 'Grupo 6' },
    { v: 'g7',  en: 'Group 7',  pt: 'Grupo 7' },  { v: 'g8',  en: 'Group 8',  pt: 'Grupo 8' },
    { v: 'g9',  en: 'Group 9',  pt: 'Grupo 9' },  { v: 'g10', en: 'Group 10', pt: 'Grupo 10' },
    { v: 'g11', en: 'Group 11', pt: 'Grupo 11' }, { v: 'g12', en: 'Group 12', pt: 'Grupo 12' }
  ]},
  { header: { en: 'Chemical families', pt: 'Famílias químicas' },
    items: TREND_FAMILY_DEFS.map(f => ({ v: f.value, en: f.en, pt: f.pt })) },
  { header: { en: 'f-block', pt: 'Bloco f' }, items: [
    { v: 'lanthanides', en: 'Lanthanides', pt: 'Lantanídeos' },
    { v: 'actinides',   en: 'Actinides',   pt: 'Actinídeos' }
  ]}
];

// Property selector sections (drives #trend-prop) — same shape as TREND_SCOPE.
// Labels mirror the i18n property names so axis titles / tooltips / insight stay
// identical. Add a future property by dropping it into the right section here.
const TREND_PROP_GROUPS = [
  { header: { en: 'Atomic properties', pt: 'Propriedades atômicas' }, items: [
    { v: 'radius',  en: 'Atomic Radius', pt: 'Raio Atômico' },
    { v: 'mass',    en: 'Atomic Mass',   pt: 'Massa Atômica' },
    { v: 'density', en: 'Density',       pt: 'Densidade' }
  ]},
  { header: { en: 'Electronic properties', pt: 'Propriedades eletrônicas' }, items: [
    { v: 'en',         en: 'Electronegativity', pt: 'Eletronegatividade' },
    { v: 'ionization', en: 'Ionization Energy',  pt: 'Energia de Ionização' }
  ]},
  { header: { en: 'Thermal properties', pt: 'Propriedades térmicas' }, items: [
    { v: 'melt', en: 'Melting Point', pt: 'Ponto de Fusão' },
    { v: 'boil', en: 'Boiling Point', pt: 'Ponto de Ebulição' }
  ]}
];

// ─── TRENDS CUSTOM SELECT — shared Atomurus dropdown component ──────────────
// ONE accessible listbox component. Both the scope and property selectors are
// instances of it (same markup, CSS, keyboard model), so they read as one
// component family. Each instance progressively enhances a hidden native
// <select> (the source of truth for .value/.options/onchange). State lives on
// the instance, so multiple dropdowns coexist cleanly.
const TREND_SELECTS = {
  prop:  { name: 'prop',  selectId: 'trend-prop',  sections: TREND_PROP_GROUPS,
           aria: { en: 'Property to plot', pt: 'Propriedade para plotar' },
           built: false, lang: null, open: false, active: -1, typeahead: { str: '', t: 0 } },
  scope: { name: 'scope', selectId: 'trend-group', sections: TREND_SCOPE,
           aria: { en: 'Filter elements', pt: 'Filtrar elementos' },
           searchable: true, search: '',
           built: false, lang: null, open: false, active: -1, typeahead: { str: '', t: 0 } }
};

function trendSelStr(o, lang) { return (o && (o[lang] || o.en)) || ''; }
function trendSelOpts(inst, visibleOnly) {
  if (!inst.list) return [];
  const opts = Array.from(inst.list.querySelectorAll('.trend-select-opt'));
  if (!visibleOnly) return opts;
  return opts.filter(o => !o.hidden && !(o.closest('.trend-select-section') || {}).hidden);
}

// (Re)builds the hidden <select> mirror + the custom listbox from the instance's
// section config in the current language, preserving the selected value.
// Idempotent and cheap — called at the top of every renderTrendChart.
function buildTrendSelect(inst) {
  const sel = document.getElementById(inst.selectId);
  if (!sel) return;
  const lang = trendLang();
  const needStructure = !inst.built || inst.lang !== lang;
  if (needStructure) {
    const prev = sel.value;
    sel.innerHTML = '';
    inst.sections.forEach(group => {
      const og = document.createElement('optgroup');
      og.label = trendSelStr(group.header, lang);
      group.items.forEach(it => {
        const o = document.createElement('option');
        o.value = it.v;
        o.textContent = trendSelStr(it, lang);
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    if (prev) sel.value = prev;
    if (!sel.value && sel.options.length) sel.value = sel.options[0].value;   // previous value gone → safe default
  }
  ensureTrendSelectUI(inst, sel, lang, needStructure);
  inst.built = true;
  inst.lang  = lang;
  syncTrendSelectButton(inst);
}

// Creates the combobox + listbox once; rebuilds the list markup when the
// structure (language) changes. Events are wired a single time.
function ensureTrendSelectUI(inst, sel, lang, rebuildList) {
  if (!inst.wrap) {
    const popId = 'ts-' + inst.name + '-pop';
    const listId = 'ts-' + inst.name + '-list';
    const wrap = document.createElement('div');
    wrap.className = 'trend-select' + (inst.searchable ? ' has-search' : '');
    const searchHtml = inst.searchable
      ? '<div class="trend-select-search-row">' +
          '<input class="trend-select-search" type="search" autocomplete="off" spellcheck="false">' +
        '</div>'
      : '';
    wrap.innerHTML =
      '<div class="trend-select-combo hm-select" role="combobox" tabindex="0" ' +
        'aria-haspopup="listbox" aria-expanded="false" aria-controls="' + listId + '">' +
        '<span class="trend-select-value"></span>' +
        '<svg class="trend-select-caret" viewBox="0 0 10 6" width="11" height="7" aria-hidden="true">' +
          '<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>' +
      '<div class="trend-select-pop" id="' + popId + '" hidden>' +
        searchHtml +
        '<div class="trend-select-options" id="' + listId + '" role="listbox" tabindex="-1"></div>' +
        '<div class="trend-select-empty" role="status" hidden></div>' +
      '</div>';
    sel.style.display = 'none';
    sel.setAttribute('aria-hidden', 'true');
    sel.tabIndex = -1;
    sel.parentNode.insertBefore(wrap, sel.nextSibling);
    inst.wrap    = wrap;
    inst.combo   = wrap.querySelector('.trend-select-combo');
    inst.pop     = wrap.querySelector('.trend-select-pop');
    inst.list    = wrap.querySelector('.trend-select-options');
    inst.searchEl = wrap.querySelector('.trend-select-search');
    inst.emptyEl = wrap.querySelector('.trend-select-empty');
    inst.valueEl = wrap.querySelector('.trend-select-value');
    wireTrendSelect(inst);
    rebuildList = true;
  }
  // aria-label tracks the (translatable) select title
  const lbl = sel.getAttribute('title') || trendSelStr(inst.aria, lang);
  inst.combo.setAttribute('aria-label', lbl);
  inst.list.setAttribute('aria-label', lbl);
  renderTrendSelectSearchState(inst);

  if (rebuildList) {
    const esc = trendEscapeHtml;
    let html = '';
    inst.sections.forEach((group, gi) => {
      if (gi > 0) html += '<div class="trend-select-sep" role="presentation"></div>';
      const gid = 'ts-' + inst.name + '-g' + gi;
      html += '<div class="trend-select-section" role="group" aria-labelledby="' + gid + '">';
      html += '<div class="trend-select-head" id="' + gid + '" aria-hidden="true">' + esc(trendSelStr(group.header, lang)) + '</div>';
      group.items.forEach(it => {
        html += '<div class="trend-select-opt" role="option" id="ts-' + inst.name + '-' + esc(it.v) + '" data-value="' + esc(it.v) + '" aria-selected="false">' +
                  esc(trendSelStr(it, lang)) + '</div>';
      });
      html += '</div>';
    });
    inst.list.innerHTML = html;
    renderTrendSelectSearchState(inst);
  }
}

function trendSearchLabels() {
  return trendLang() === 'pt'
    ? { placeholder: 'Buscar filtro...', none: 'Nenhum filtro encontrado' }
    : { placeholder: 'Search scope...', none: 'No matching filters' };
}

function trendNormalizeSearch(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function trendSearchTokens(s) {
  return trendNormalizeSearch(s).split(/[^a-z0-9]+/).filter(Boolean);
}

function trendSearchMatches(text, query) {
  const qTokens = trendSearchTokens(query);
  if (!qTokens.length) return true;
  const tokens = trendSearchTokens(text);
  for (let i = 0; i <= tokens.length - qTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < qTokens.length; j++) {
      if (!tokens[i + j] || !tokens[i + j].startsWith(qTokens[j])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

function filterTrendSelectOptions(inst, query) {
  if (!inst || !inst.list) return 0;
  let visibleCount = 0;
  Array.from(inst.list.querySelectorAll('.trend-select-section')).forEach(section => {
    let sectionMatches = 0;
    Array.from(section.querySelectorAll('.trend-select-opt')).forEach(opt => {
      const hay = (opt.textContent || '') + ' ' + (opt.dataset.value || '');
      const match = trendSearchMatches(hay, query);
      opt.hidden = !match;
      opt.classList.remove('active');
      if (match) { sectionMatches++; visibleCount++; }
    });
    section.hidden = sectionMatches === 0;
  });
  let seenSection = false, pendingSep = null;
  Array.from(inst.list.children).forEach(node => {
    if (node.classList && node.classList.contains('trend-select-sep')) {
      node.hidden = true;
      pendingSep = node;
      return;
    }
    if (node.classList && node.classList.contains('trend-select-section') && !node.hidden) {
      if (seenSection && pendingSep) pendingSep.hidden = false;
      seenSection = true;
    }
  });
  return visibleCount;
}

function renderTrendSelectSearchState(inst) {
  if (!inst || !inst.searchable || !inst.searchEl || !inst.list) return;
  const labels = trendSearchLabels();
  inst.searchEl.placeholder = labels.placeholder;
  if (inst.searchEl.value !== inst.search) inst.searchEl.value = inst.search || '';
  if (inst.emptyEl) inst.emptyEl.textContent = labels.none;
  const visibleCount = filterTrendSelectOptions(inst, inst.search);
  if (inst.emptyEl) inst.emptyEl.hidden = visibleCount !== 0;
  const opts = trendSelOpts(inst, true);
  if (!opts.length) {
    inst.active = -1;
    inst.activeValue = null;
    inst.combo.removeAttribute('aria-activedescendant');
    return;
  }
  const activeIdx = inst.activeValue ? opts.findIndex(o => o.dataset.value === inst.activeValue) : -1;
  if (activeIdx >= 0) {
    setTrendSelectActive(inst, activeIdx, false);
    return;
  }
  const sel = document.getElementById(inst.selectId);
  const selected = sel ? opts.findIndex(o => o.dataset.value === sel.value) : -1;
  setTrendSelectActive(inst, selected >= 0 ? selected : 0, false);
}

// Mirrors the <select> state onto the custom UI: button label + aria-selected.
function syncTrendSelectButton(inst) {
  const sel = document.getElementById(inst.selectId);
  if (!sel || !inst.valueEl) return;
  const opt = sel.options[sel.selectedIndex];
  inst.valueEl.textContent = opt ? opt.text : '';
  trendSelOpts(inst).forEach(o => o.setAttribute('aria-selected', o.dataset.value === sel.value ? 'true' : 'false'));
}

function openTrendSelect(inst) {
  if (!inst.combo || !inst.pop || inst.open) return;
  inst.open = true;
  inst.pop.hidden = false;
  inst.combo.setAttribute('aria-expanded', 'true');
  inst.wrap.classList.add('open');
  renderTrendSelectSearchState(inst);
  const opts = trendSelOpts(inst, true);
  const sel  = document.getElementById(inst.selectId);
  const cur  = opts.findIndex(o => o.dataset.value === sel.value);
  setTrendSelectActive(inst, cur < 0 ? 0 : cur, true);
  if (inst.searchEl) setTimeout(() => inst.searchEl.focus(), 0);
  if (!inst._outside) inst._outside = e => { if (inst.wrap && !inst.wrap.contains(e.target)) closeTrendSelect(inst, false); };
  setTimeout(() => document.addEventListener('pointerdown', inst._outside, true), 0);
}

function closeTrendSelect(inst, focusCombo) {
  if (!inst.open) return;
  inst.open = false;
  inst.pop.hidden = true;
  inst.combo.setAttribute('aria-expanded', 'false');
  inst.combo.removeAttribute('aria-activedescendant');
  inst.wrap.classList.remove('open');
  inst.active = -1;
  inst.activeValue = null;
  trendSelOpts(inst).forEach(o => o.classList.remove('active'));
  if (inst._outside) document.removeEventListener('pointerdown', inst._outside, true);
  if (focusCombo) inst.combo.focus();
}

function setTrendSelectActive(inst, idx, scroll) {
  const opts = trendSelOpts(inst, true);
  if (!opts.length) {
    inst.active = -1;
    inst.activeValue = null;
    inst.combo.removeAttribute('aria-activedescendant');
    return;
  }
  idx = Math.max(0, Math.min(idx, opts.length - 1));
  inst.active = idx;
  inst.activeValue = opts[idx].dataset.value;
  trendSelOpts(inst).forEach(o => o.classList.toggle('active', o === opts[idx]));
  inst.combo.setAttribute('aria-activedescendant', opts[idx].id);
  if (scroll) opts[idx].scrollIntoView({ block: 'nearest' });
}

// Commits an option: drives the hidden <select> and fires its change event, so
// the existing behaviour (onchange="renderTrendChart()") runs unchanged.
function chooseTrendSelect(inst, idx) {
  const opts = trendSelOpts(inst, true);
  const o = opts[idx];
  const sel = document.getElementById(inst.selectId);
  if (!o || !sel) return;
  const changed = sel.value !== o.dataset.value;
  sel.value = o.dataset.value;
  syncTrendSelectButton(inst);
  if (inst.searchable) {
    inst.search = '';
    if (inst.searchEl) inst.searchEl.value = '';
    renderTrendSelectSearchState(inst);
  }
  closeTrendSelect(inst, true);
  if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
}

function trendSelectType(inst, ch) {
  if (inst.searchable && inst.searchEl) {
    if (!inst.open) openTrendSelect(inst);
    inst.search += ch;
    renderTrendSelectSearchState(inst);
    inst.searchEl.focus();
    return;
  }
  const now = Date.now();
  if (now - inst.typeahead.t > 700) inst.typeahead.str = '';
  inst.typeahead.t = now;
  inst.typeahead.str += ch.toLowerCase();
  const opts = trendSelOpts(inst, true);
  let m = opts.findIndex(o => o.textContent.trim().toLowerCase().startsWith(inst.typeahead.str));
  if (m < 0 && inst.typeahead.str.length > 1) {            // restart match on the latest key
    inst.typeahead.str = ch.toLowerCase();
    m = opts.findIndex(o => o.textContent.trim().toLowerCase().startsWith(inst.typeahead.str));
  }
  if (m >= 0) setTrendSelectActive(inst, m, true);
}

function wireTrendSelect(inst) {
  const combo = inst.combo, list = inst.list;
  if (inst.searchEl) {
    inst.searchEl.addEventListener('input', e => {
      inst.search = e.target.value;
      renderTrendSelectSearchState(inst);
    });
    inst.searchEl.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setTrendSelectActive(inst, inst.active < 0 ? 0 : inst.active + 1, true);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTrendSelectActive(inst, inst.active < 0 ? trendSelOpts(inst, true).length - 1 : inst.active - 1, true);
          break;
        case 'Enter':
          if (inst.active >= 0) { e.preventDefault(); chooseTrendSelect(inst, inst.active); }
          break;
        case 'Escape':
          e.preventDefault();
          if (inst.searchEl.value) {
            inst.search = '';
            inst.searchEl.value = '';
            renderTrendSelectSearchState(inst);
          } else {
            closeTrendSelect(inst, true);
          }
          break;
        case 'Tab':
          closeTrendSelect(inst, false);
          break;
      }
    });
    inst.searchEl.addEventListener('click', e => e.stopPropagation());
  }
  combo.addEventListener('click', () => { inst.open ? closeTrendSelect(inst, true) : openTrendSelect(inst); });
  combo.addEventListener('keydown', e => {
    const k = e.key;
    if (!inst.open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); openTrendSelect(inst); }
      else if (k.length === 1 && /\S/.test(k)) { openTrendSelect(inst); trendSelectType(inst, k); }
      return;
    }
    switch (k) {
      case 'ArrowDown': e.preventDefault(); setTrendSelectActive(inst, inst.active + 1, true); break;
      case 'ArrowUp':   e.preventDefault(); setTrendSelectActive(inst, inst.active - 1, true); break;
      case 'Home':      e.preventDefault(); setTrendSelectActive(inst, 0, true); break;
      case 'End':       e.preventDefault(); setTrendSelectActive(inst, trendSelOpts(inst, true).length - 1, true); break;
      case 'Enter':
      case ' ':
      case 'Spacebar':  e.preventDefault(); chooseTrendSelect(inst, inst.active); break;
      case 'Escape':
        e.preventDefault();
        if (inst.searchable && inst.search) {
          inst.search = '';
          if (inst.searchEl) inst.searchEl.value = '';
          renderTrendSelectSearchState(inst);
        } else {
          closeTrendSelect(inst, true);
        }
        break;
      case 'Tab':       closeTrendSelect(inst, false); break;
      default:          if (k.length === 1 && /\S/.test(k)) { e.preventDefault(); trendSelectType(inst, k); }
    }
  });
  list.addEventListener('click', e => {
    const opt = e.target.closest('.trend-select-opt');
    if (opt) chooseTrendSelect(inst, trendSelOpts(inst, true).indexOf(opt));
  });
  list.addEventListener('pointermove', e => {
    const opt = e.target.closest('.trend-select-opt');
    if (!opt) return;
    const i = trendSelOpts(inst, true).indexOf(opt);
    if (i >= 0 && i !== inst.active) setTrendSelectActive(inst, i, false);
  });
  inst.wrap.addEventListener('focusout', e => {
    if (!inst.wrap.contains(e.relatedTarget)) closeTrendSelect(inst, false);
  });
}

// Build / sync both trend dropdowns (property + scope). Called from renderTrendChart.
function buildTrendSelects() { buildTrendSelect(TREND_SELECTS.prop); buildTrendSelect(TREND_SELECTS.scope); }
function syncTrendSelectButtons() { syncTrendSelectButton(TREND_SELECTS.prop); syncTrendSelectButton(TREND_SELECTS.scope); }

async function renderTrendChart() {
  await ensureChartZoom();
  if (!window.Chart) { setTimeout(renderTrendChart, 200); return; }
  buildTrendSelects();               // (re)build BOTH dropdowns' <select> mirrors + custom listboxes (language-aware)
  applyTrendStoredControlsOnce();    // restore persisted prop/filter — options now all exist
  syncTrendSelectButtons();          // reflect the resolved values on the custom combos
  const prop   = document.getElementById('trend-prop').value;
  const filter = document.getElementById('trend-group').value;
  const ctx = document.getElementById('trend-chart').getContext('2d');

  const dataEls = trendFilterElements(filter);
  if (trendChart) { trendChart.destroy(); trendChart = null; }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const color     = isDark ? '#34A872' : '#1E6A50';
  const gridColor = isDark ? '#2E2C29' : '#e6e0d6';
  const textColor = isDark ? '#F0EDE8' : '#1A1814';

  // ── LINE chart: X = element (Z order), Y = prop ─────────────────────────────
  const labels = dataEls.map(e => e.sym);
  // null (not 0) for missing data — prevents the false 0-plateau / spike-to-0
  // that plotting 0 would cause. The dashed "bridge" dataset (below) turns those
  // gaps into a continuous dashed continuation on the SAME axis, so the trend
  // reads as one line and missing points sit on the path — not on a layer below.
  const values = dataEls.map(e => trendNum(e, prop));
  const { bridge, isMissing, hasReal } = buildTrendBridge(values);
  const missingCount = isMissing.reduce((n, m) => n + (m ? 1 : 0), 0);
  // Tooltip metadata (Z + full name) — used for richer hover info.
  const meta   = dataEls.map(e => ({ z: e.z, name: elName(e) }));
  const unit   = TREND_UNITS[prop] || '';
  const big    = dataEls.length > 40;
  const xLimitMax = Math.max(0, labels.length - 1);
  const zoomXLimits = { min: 0, max: xLimitMax };
  if (xLimitMax > 0) zoomXLimits.minRange = Math.min(TREND_X_MIN_RANGE, xLimitMax);
  const missingColor = isDark ? 'rgba(240,237,232,0.64)' : 'rgba(26,24,20,0.48)';
  const missingFill  = isDark ? '#161513' : '#FFFEFC';
  const bridgeColor  = color + (isDark ? 'B0' : 'A0');   // dashed bridge: the accent green, slightly muted
  trendAutoY = true;                          // each (re)render starts in auto-fit Y mode

  const datasets = [{
    label: trendPropLabel(prop),
    data: values,
    borderColor: color,
    // Vertical gradient fill (accent → transparent) for a cleaner look than a
    // flat block. Resolved lazily off chartArea so it survives layout/resizes.
    backgroundColor: c => {
      const { ctx: cx, chartArea } = c.chart;
      if (!chartArea) return color + '22';
      const g = cx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, color + '40');
      g.addColorStop(1, color + '00');
      return g;
    },
    borderWidth: 2,
    pointBackgroundColor: color,
    pointBorderColor: color,
    // A visible dot on every element that has data (gaps stay empty). Dots
    // shrink slightly on the dense full-table view so 118 markers don't crowd
    // the line — keeps the clean "connected points" look across every filter.
    pointRadius: c => { const v = c.dataset.data[c.dataIndex]; return (v == null || !Number.isFinite(v)) ? 0 : (big ? 2.4 : 3.5); },
    pointHoverRadius: 6,
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: isDark ? '#0E0D0C' : '#FFFFFF',
    pointHoverBorderWidth: 2,
    clip: false,
    fill: true,
    tension: 0.35,
    spanGaps: false
  }];
  // Missing-data bridge: a dashed green continuation of the same curve, on the
  // main Y axis, drawn only across gaps (anchored to the bordering real points).
  // Discreet hollow markers mark each unknown element, sitting on the dashed
  // path itself — so "there is an element here, value unknown" reads cleanly
  // without loose diamonds or a separate baseline layer.
  if (missingCount && hasReal) {
    datasets.push({
      label: trendMissingLabel(),
      data: bridge,
      borderColor: bridgeColor,
      backgroundColor: 'transparent',
      borderWidth: 1.6,
      borderDash: [5, 5],
      fill: false,
      tension: 0.35,
      spanGaps: false,
      pointRadius: c => (isMissing[c.dataIndex] ? (big ? 1.8 : 2.6) : 0),
      pointHoverRadius: c => (isMissing[c.dataIndex] ? 5 : 0),
      pointStyle: 'circle',
      pointBackgroundColor: missingFill,
      pointBorderColor: missingColor,
      pointBorderWidth: 1.4,
      pointHoverBackgroundColor: missingFill,
      pointHoverBorderColor: missingColor,
      clip: false,
      isMissingBridge: true,
      _isMissing: isMissing
    });
  }

  // Pan/zoom turns the static chart into a navigable space (TradingView-style).
  // Registered defensively; the chart still works if the plugin script is absent.
  ensureZoomPlugin();
  const lang = trendLang();
  const crossColor = isDark ? 'rgba(240,237,232,0.28)' : 'rgba(26,24,20,0.24)';

  // Crosshair: dashed guide lines through the hovered point — the cue that makes
  // the chart feel like an explorable space rather than a flat picture.
  const crosshairPlugin = {
    id: 'trendCrosshair',
    afterDatasetsDraw(chart) {
      const act = (chart.tooltip && chart.tooltip.getActiveElements) ? chart.tooltip.getActiveElements() : [];
      if (!act.length) return;
      const idx = act[0].index;
      const realData = chart.data.datasets[0].data;
      const real = realData[idx] != null && Number.isFinite(realData[idx]);
      // Anchor the crosshair to a positioned element: the real point if the value
      // is known, otherwise the dashed-bridge point at the missing element.
      let el = null;
      const m0 = chart.getDatasetMeta(0);
      if (real && m0 && m0.data[idx]) el = m0.data[idx];
      else {
        const bi = chart.data.datasets.findIndex(d => d.isMissingBridge);
        if (bi >= 0) { const mb = chart.getDatasetMeta(bi); if (mb && mb.data[idx]) el = mb.data[idx]; }
      }
      if (!el) return;
      const a = chart.chartArea, cx = chart.ctx;
      cx.save();
      cx.lineWidth = 1; cx.setLineDash([4, 4]); cx.strokeStyle = crossColor;
      cx.beginPath();
      cx.moveTo(el.x, a.top); cx.lineTo(el.x, a.bottom);     // vertical: always (marks the element)
      if (real) { cx.moveTo(a.left, el.y); cx.lineTo(a.right, el.y); }  // horizontal: only when the value is known
      cx.stroke();
      cx.restore();
    }
  };

  // Progressive detail: when zoomed in close, print each visible element's value
  // above its point — analytical precision that surfaces only as you approach.
  const progressiveLabels = {
    id: 'trendProgressiveLabels',
    afterDatasetsDraw(chart) {
      const sx = chart.scales.x;
      if (sx.max - sx.min > 22) return;          // only on close zoom
      const m = chart.getDatasetMeta(0), data = chart.data.datasets[0].data;
      const bridgeIndex = chart.data.datasets.findIndex(ds => ds.isMissingBridge);
      const bridgeMeta  = bridgeIndex >= 0 ? chart.getDatasetMeta(bridgeIndex) : null;
      if (!m || !m.data) return;
      const cx = chart.ctx;
      cx.save();
      cx.font = '600 9px "DM Mono", monospace';
      cx.fillStyle = textColor; cx.textAlign = 'center'; cx.textBaseline = 'bottom';
      const lo = Math.max(0, Math.floor(sx.min)), hi = Math.min(data.length - 1, Math.ceil(sx.max));
      for (let i = lo; i <= hi; i++) {
        const v = data[i], pt = m.data[i];
        if (v != null && Number.isFinite(v) && pt) {
          cx.fillStyle = textColor;
          cx.fillText(String(Math.round(v * 100) / 100), pt.x, pt.y - 9);
        } else if (bridgeMeta && bridgeMeta.data[i]) {       // unknown → label sits on the dashed path
          const mp = bridgeMeta.data[i];
          cx.fillStyle = missingColor;
          cx.fillText(lang === 'pt' ? 'N/D' : 'N/A', mp.x, mp.y - 7);
        }
      }
      cx.restore();
    }
  };

  // When a whole selection has no measured data (e.g. Electronegativity for the
  // noble gases — undefined for that group), there is nothing to plot and nothing
  // to interpolate. Rather than a blank canvas, state it plainly so the chart is
  // never just "empty". (We never fabricate values to fill it.)
  const emptyStatePlugin = {
    id: 'trendEmptyState',
    afterDraw(chart) {
      if (hasReal) return;
      const a = chart.chartArea, cx = chart.ctx;
      if (!a) return;
      cx.save();
      cx.fillStyle = missingColor;
      cx.font = '500 13px "DM Sans", system-ui, sans-serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      const msg = lang === 'pt' ? 'Sem dados disponíveis para esta seleção' : 'No data available for this selection';
      cx.fillText(msg, (a.left + a.right) / 2, (a.top + a.bottom) / 2);
      cx.restore();
    }
  };

  // Subtle brand watermark sitting in the chart background (above the grid, below
  // the data line so it never competes with the curve). Scales with the plot and
  // flows into the exported PNG automatically — the attribution mark for any
  // embed/share of this chart. Kept very low-alpha so it reads as a quiet hint.
  const watermarkPlugin = {
    id: 'trendWatermark',
    beforeDatasetsDraw(chart) {
      const a = chart.chartArea, cx = chart.ctx;
      if (!a) return;
      const w = a.right - a.left, h = a.bottom - a.top;
      cx.save();
      cx.globalAlpha = isDark ? 0.08 : 0.06;
      cx.fillStyle = textColor;
      cx.font = `600 ${Math.max(15, Math.min(46, w * 0.062))}px "DM Mono", ui-monospace, monospace`;
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('atomurus.com', a.left + w / 2, a.top + h / 2);
      cx.restore();
    }
  };

  const interactivePointPlugin = {
    id: 'trendInteractivePoint',
    afterDatasetsDraw(chart) {
      const isHover = Number.isFinite(chart.$trendHoverIndex);
      const index = isHover ? chart.$trendHoverIndex : chart.$trendKeyboardIndex;
      if (!Number.isFinite(index)) return;
      const p = trendPointPixel(chart, index);
      if (!p) return;
      const age = isHover && Number.isFinite(chart.$trendHoverSince)
        ? Math.min(1, (performance.now() - chart.$trendHoverSince) / 140)
        : 1;
      const ease = 1 - Math.pow(1 - age, 2);
      const glowRadius = (p.real ? 5.5 : 4.5) + (p.real ? 2.5 : 1.5) * ease;
      const cx = chart.ctx;
      cx.save();
      cx.shadowColor = color;
      cx.shadowBlur = (p.real ? 8 : 6) + (p.real ? 6 : 4) * ease;
      cx.fillStyle = p.real ? color + '40' : missingColor;
      cx.beginPath();
      cx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      cx.fill();
      if (Number.isFinite(chart.$trendKeyboardIndex) && chart.$trendKeyboardIndex === index) {
        cx.shadowBlur = 0;
        cx.lineWidth = 2;
        cx.setLineDash([3, 3]);
        cx.strokeStyle = isDark ? '#F0EDE8' : '#1A1814';
        cx.beginPath();
        cx.arc(p.x, p.y, p.real ? 10 : 8, 0, Math.PI * 2);
        cx.stroke();
      }
      cx.restore();
      if (isHover && age < 1) requestAnimationFrame(() => { if (chart.$trendHoverIndex === index) chart.draw(); });
    }
  };

  // Reveal the reset affordance once the view has been moved off its full extent.
  const showReset = () => { const b = document.getElementById('trend-reset'); if (b) b.hidden = false; };

  // Custom external tooltip → the compact scientific card. Replaces the canvas
  // tooltip (enabled:false). It reuses ONE DOM node and rebuilds its content only
  // when the hovered element or property changes (so there's no per-frame work
  // and no flicker); the caret is followed via left/top, while the fade+scale is
  // a pure CSS transition. One card per hover ⇒ cost is independent of dataset
  // size, even at 118 points.
  const tooltipExternal = (context) => {
    const { chart, tooltip } = context;
    const wrap = chart.canvas.parentNode;
    if (!wrap) return;
    let tip = document.getElementById('trend-tooltip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'trend-tooltip'; wrap.appendChild(tip); }
    if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints || !tooltip.dataPoints.length) {
      tip.classList.remove('is-visible');                 // fade out, keep the node (no flicker on re-entry)
      return;
    }
    const idx = tooltip.dataPoints[0].dataIndex;
    if (tip._idx !== idx || tip._prop !== prop) {          // rebuild only on change
      tip._idx = idx; tip._prop = prop;
      tip.innerHTML = buildTrendCard(dataEls[idx], prop);
    }
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = tooltip.caretX + 16;
    if (x + tw > cw - 6) x = tooltip.caretX - tw - 16;     // flip left near the right edge
    let y = tooltip.caretY - th / 2;
    x = Math.max(6, Math.min(x, cw - tw - 6));             // clamp inside the wrap (overflow:hidden)
    y = Math.max(6, Math.min(y, ch - th - 6));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('is-visible');
  };

  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    plugins: [watermarkPlugin, interactivePointPlugin, crosshairPlugin, progressiveLabels, emptyStatePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // sync paint — keeps pan/zoom instant (no tween lag)
      interaction: { mode: 'index', intersect: false },
      transitions: { active: { animation: { duration: 140, easing: 'easeOutQuad' } } },
      onHover: (evt) => {
        const canvas = document.getElementById('trend-chart');
        const hit = trendHitFromEvent(trendChart, evt);
        if (canvas) canvas.style.cursor = hit ? 'pointer' : 'crosshair';
        const next = hit ? hit.index : null;
        if (trendChart && trendChart.$trendHoverIndex !== next) {
          trendChart.$trendHoverIndex = next;
          trendChart.$trendHoverSince = Number.isFinite(next) ? performance.now() : 0;
          trendChart.update('none');
        }
      },
      onClick: (evt) => {
        const canvas = document.getElementById('trend-chart');
        if (canvas && canvas._trendSuppressClick) return;
        const hit = trendHitFromEvent(trendChart, evt, 22);
        if (hit) navigateTrendElement(hit, evt.native || evt);
      },
      layout: { padding: { left: 0, right: 0, top: 4, bottom: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,                 // canvas tooltip off — the external card renders instead
          external: tooltipExternal,
          // One dataPoint per index drives the card. Keep the bridge from adding a
          // phantom point at real anchors, so a missing element resolves cleanly.
          filter: item => {
            if (item.dataset && item.dataset.isMissingBridge) {
              const im = item.dataset._isMissing;
              return !!(im && im[item.dataIndex]);
            }
            return item.parsed.y != null;
          }
        },
        zoom: {
          // X is what you navigate; Y auto-fits to the visible slice (afterDataLimits
          // below). The Y-axis gutter is reserved for manual Y scaling, so onPanStart
          // rejects pans that begin there. Stays anchored to the data via limits.
          pan:  { enabled: true, mode: 'x', threshold: 5,
                  onPanStart: c => !(c && c.point && trendChart && c.point.x < trendChart.chartArea.left),
                  onPan: () => { clampTrendViewport(); applyAutoY(); updateNavWindow(); scheduleTrendStatsUpdate(); },
                  onPanComplete: () => { clampTrendViewport(); showReset(); applyAutoY(); updateNavWindow(); updateTrendStatsFromChart(); saveTrendState('pan'); } },
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x',
                  onZoom: () => { clampTrendViewport(); applyAutoY(); updateNavWindow(); scheduleTrendStatsUpdate(); },
                  onZoomComplete: () => { clampTrendViewport(); showReset(); applyAutoY(); updateNavWindow(); updateTrendStatsFromChart(); saveTrendState('zoom'); } },
          limits: { x: zoomXLimits }
        }
      },
      scales: {
        x: {
          min: 0,
          max: xLimitMax,
          bounds: 'data',
          offset: false,             // edge-clamped: first/last visible points hug the frame
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: big ? 9 : 11 },
            maxRotation: big ? 90 : 0,
            autoSkip: true,           // adaptive: more element labels surface as you zoom in
            autoSkipPadding: 8
          }
        },
        y: {
          // Y range is driven by applyAutoY() (auto-fit to the visible X slice, +8%
          // padding) or by manual Y-axis dragging — see those handlers. Declarative
          // config stays minimal so those imperatively-set min/max win cleanly.
          title: { display: true, text: unit ? `${trendPropLabel(prop)} (${unit})` : trendPropLabel(prop), color: textColor, font: { size: 11 } },
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  });
  trendChart.$trendElements = dataEls;
  trendChart.$trendProp = prop;
  trendChart.$trendFilter = filter;
  trendChart.$trendBridge = bridge;
  trendChart.$trendIsMissing = isMissing;
  fitTrendXToData('none');

  // Double-click anywhere on the plot resets the view (familiar zoom gesture).
  ctx.canvas.ondblclick = () => resetTrendZoom();

  // Nav hint + reset button start fresh on every (re)render.
  const hintEl = document.getElementById('trend-nav-hint');
  if (hintEl) hintEl.textContent = lang === 'pt'
    ? 'scroll: zoom · arraste: mover · 2 cliques: resetar'
    : 'scroll: zoom · drag: pan · double-click: reset';
  const resetEl = document.getElementById('trend-reset');
  if (resetEl) { resetEl.hidden = true; resetEl.title = lang === 'pt' ? 'Restaurar / ajustar aos dados' : 'Reset / fit to data'; }
  const autoEl = document.getElementById('trend-auto');
  if (autoEl) autoEl.title = lang === 'pt' ? 'Escala Y automática (clique p/ alternar)' : 'Auto Y-scale (click to toggle)';

  // Bottom navigator (overview minimap) + physical navigation. The minimap
  // mirrors the full series; its window mirrors the main viewport and drives it
  // back — a two-way "camera" with momentum and eased jumps.
  renderTrendNavigator(labels, values, color, isDark);
  wireTrendNavigator();
  wireMainPanMomentum();
  wireManualYScale();
  wireTrendPointNavigation();
  if (!restoreTrendViewportIfNeeded(prop, filter)) applyAutoY();  // initial vertical fit to the full range
  updateAutoBtn();
  requestAnimationFrame(updateNavWindow);   // after layout settles

  // Drop any lingering tooltip + cache so the next hover rebuilds with the new
  // property / language / theme rather than showing a stale card.
  const _tip = document.getElementById('trend-tooltip');
  if (_tip) { _tip._idx = -1; _tip._prop = null; _tip.classList.remove('is-visible'); }

  updateTrendCaption(prop, dataEls);
}

// ─── TRENDS NAVIGATOR (overview minimap + range selector) ──────────────────

// Maps a client X (screen px) to a fractional data index on the minimap.
function trendNavIndexFromClientX(clientX) {
  if (!trendNavChart) return 0;
  const ov = document.getElementById('trend-nav-overlay');
  return trendNavChart.scales.x.getValueForPixel(clientX - ov.getBoundingClientRect().left);
}

// The single choke-point for "move the camera": set the main chart's visible X
// range (instant) and reflect it in the reset button + navigator window.
function setTrendXRange(min, max) {
  if (!trendChart) return;
  const range = clampTrendXRange(min, max, trendChart);
  const full = trendFullXBounds(trendChart);
  setChartXRange(trendChart, range.min, range.max, 'none');
  const rb = document.getElementById('trend-reset');
  if (rb) rb.hidden = (range.min <= full.min + 0.01 && range.max >= full.max - 0.01);
  applyAutoY();
  updateNavWindow();
  scheduleTrendStatsUpdate();
}

// Auto-fit the Y axis to the values inside the *current* visible X range, with
// 8% padding (so points/labels aren't clipped). The single source of truth for
// "the curve should breathe to fill the height". No-op while auto is OFF.
function applyAutoY() {
  if (!trendChart || !trendAutoY) return;
  // arr is the REAL series only (datasets[0]); the dashed bridge never influences
  // the scale. Only finite numbers count — null/undefined/NaN are skipped, so
  // missing data can never collapse or break the Y range.
  const sx = trendChart.scales.x, arr = trendChart.data.datasets[0].data;
  const lo = Math.max(0, Math.floor(sx.min)), hi = Math.min(arr.length - 1, Math.ceil(sx.max));
  const scan = (from, to) => {
    let mn = Infinity, mx = -Infinity;
    for (let i = from; i <= to; i++) {
      const v = arr[i];
      if (v == null || !Number.isFinite(v)) continue;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    return mn === Infinity ? null : { mn, mx };
  };
  const bounds = scan(lo, hi) || scan(0, arr.length - 1);
  if (!bounds) return;                                   // nothing finite to fit — leave Y untouched
  let { mn, mx } = bounds;
  let pad = (mx - mn) * 0.08; if (!pad) pad = Math.abs(mx) * 0.08 || 1;
  if (!Number.isFinite(pad)) pad = 1;
  trendChart.options.scales.y.min = mn - pad;
  trendChart.options.scales.y.max = mx + pad;
  trendChart.update('none');
}

// Positions the navigator window + side masks to mirror the main viewport.
function updateNavWindow() {
  if (!trendChart || !trendNavChart) return;
  const win = document.getElementById('trend-nav-window');
  const ml = document.getElementById('trend-nav-mask-l');
  const mr = document.getElementById('trend-nav-mask-r');
  const ov = document.getElementById('trend-nav-overlay');
  if (!win || !ov) return;
  const W = ov.clientWidth;
  const nx = trendNavChart.scales.x, sx = trendChart.scales.x;
  let l = Math.max(0, Math.min(W, nx.getPixelForValue(sx.min)));
  let r = Math.max(0, Math.min(W, nx.getPixelForValue(sx.max)));
  if (r - l < 6) r = Math.min(W, l + 6);
  win.style.left = l + 'px';
  win.style.width = (r - l) + 'px';
  if (ml) ml.style.width = l + 'px';
  if (mr) { mr.style.left = r + 'px'; mr.style.width = Math.max(0, W - r) + 'px'; }
}

function cancelTrendMomentum() { if (trendNavRAF) cancelAnimationFrame(trendNavRAF); trendNavRAF = null; }

// easeOutCubic glide of the main X range toward a target (minimap taps).
function easeTrendXRange(tMin, tMax, dur) {
  cancelTrendMomentum();
  const sx = trendChart.scales.x, fMin = sx.min, fMax = sx.max, t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  (function step(now) {
    const t = Math.min(1, (now - t0) / (dur || 220)), e = ease(t);
    setTrendXRange(fMin + (tMin - fMin) * e, fMax + (tMax - fMax) * e);
    if (t < 1) trendNavRAF = requestAnimationFrame(step);
  })(performance.now());
}

// Inertia after flinging the navigator window: keep gliding with decay.
function startNavMomentum(samples) {
  if (!samples || samples.length < 2) return;
  const a = samples[0], b = samples[samples.length - 1], dt = (b.t - a.t) || 16;
  let v = (b.c - a.c) / dt * 16;                 // index per ~frame
  if (Math.abs(v) < 0.05) return;
  const N = trendChart.data.labels.length;
  (function step() {
    const sx = trendChart.scales.x, w = sx.max - sx.min;
    let min = sx.min + v, max = sx.max + v;
    if (min < 0) { min = 0; max = w; v = 0; }
    if (max > N - 1) { max = N - 1; min = N - 1 - w; v = 0; }
    setTrendXRange(min, max);
    v *= 0.9;
    if (Math.abs(v) > 0.03) trendNavRAF = requestAnimationFrame(step);
  })();
}

// (Re)builds the minimap chart mirroring the full series, sans axes/tooltips.
function renderTrendNavigator(labels, values, color, isDark) {
  const cv = document.getElementById('trend-nav-chart');
  if (!cv || !window.Chart) return;
  if (trendNavChart) { trendNavChart.destroy(); trendNavChart = null; }
  const xLimitMax = Math.max(0, labels.length - 1);
  const { bridge, hasReal } = buildTrendBridge(values);
  const missingCount = values.reduce((n, v) => n + ((v == null || !Number.isFinite(v)) ? 1 : 0), 0);
  const navDatasets = [{
    data: values, borderColor: color, borderWidth: 1, pointRadius: 0,
    backgroundColor: c => {
      const { ctx: cx, chartArea } = c.chart;
      if (!chartArea) return color + '14';
      const g = cx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, color + '33'); g.addColorStop(1, color + '00');
      return g;
    },
    fill: true, tension: 0.35, spanGaps: false
  }];
  if (missingCount && hasReal) {                  // mirror the dashed bridge so the overview stays continuous too
    navDatasets.push({
      data: bridge,
      borderColor: color + (isDark ? '88' : '77'),
      borderWidth: 1, borderDash: [4, 4],
      pointRadius: 0, fill: false, tension: 0.35, spanGaps: false
    });
  }
  trendNavChart = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: navDatasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      events: [],                                 // minimap itself is non-interactive
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false, offset: false, min: 0, max: xLimitMax, bounds: 'data' },
        y: { display: false, grace: '6%' }
      },
      layout: { padding: 0 }
    }
  });
}

// Wires the navigator overlay once: drag window = pan, drag handles = resize,
// tap a dimmed mask = eased jump. Pointer capture + window-level listeners keep
// the drag alive even if the cursor leaves the strip.
function wireTrendNavigator() {
  if (trendNavWired) return;
  const ov = document.getElementById('trend-nav-overlay');
  if (!ov) return;
  trendNavWired = true;
  let mode = null, startX = 0, startMin = 0, startMax = 0, samples = [];

  const move = e => {
    if (!mode || !trendChart) return;
    const N = trendChart.data.labels.length;
    const d = trendNavIndexFromClientX(e.clientX) - trendNavIndexFromClientX(startX);
    if (mode === 'pan') {
      const w = startMax - startMin; let min = startMin + d, max = startMax + d;
      if (min < 0) { min = 0; max = w; } if (max > N - 1) { max = N - 1; min = N - 1 - w; }
      setTrendXRange(min, max);
      samples.push({ t: performance.now(), c: (min + max) / 2 }); if (samples.length > 6) samples.shift();
    } else if (mode === 'l') {
      setTrendXRange(Math.min(startMin + d, startMax - 2), startMax);
    } else if (mode === 'r') {
      setTrendXRange(startMin, Math.max(startMax + d, startMin + 2));
    }
  };
  const up = e => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    try { ov.releasePointerCapture(e.pointerId); } catch (_) {}
    if (mode === 'pan') startNavMomentum(samples);
    saveTrendState('navigator');
    mode = null;
  };
  ov.addEventListener('pointerdown', e => {
    if (!trendChart) return;
    cancelTrendMomentum();
    startX = e.clientX; startMin = trendChart.scales.x.min; startMax = trendChart.scales.x.max; samples = [];
    const t = e.target;
    if (t.classList.contains('trend-nav-handle')) {
      mode = t.dataset.edge === 'l' ? 'l' : 'r';
    } else if (t.closest('#trend-nav-window')) {
      mode = 'pan';
    } else {
      // tap on the dimmed area → glide the viewport to be centred there
      const N = trendChart.data.labels.length, w = startMax - startMin;
      let c = trendNavIndexFromClientX(e.clientX), min = c - w / 2, max = c + w / 2;
      if (min < 0) { min = 0; max = w; } if (max > N - 1) { max = N - 1; min = N - 1 - w; }
      easeTrendXRange(min, max, 240);
      return;
    }
    e.preventDefault();
    try { ov.setPointerCapture(e.pointerId); } catch (_) {}
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

// Adds inertia to the MAIN plot's drag-pan: we passively track pointer velocity
// (the zoom plugin owns the live drag) and, on release, keep panning with decay.
function wireMainPanMomentum() {
  const cv = document.getElementById('trend-chart');
  if (!cv || cv._momWired) return;
  cv._momWired = true;
  let down = false, last = null, vx = 0, startX = 0, moved = false;
  cv.addEventListener('pointerdown', e => {
    cancelTrendMomentum();
    // Y-axis gutter is reserved for manual Y scaling — no X momentum there.
    if (trendChart && e.offsetX < trendChart.chartArea.left) { down = false; return; }
    down = true; last = e.clientX; startX = e.clientX; vx = 0; moved = false;
  });
  cv.addEventListener('pointermove', e => {
    if (!down || last == null) return;
    if (Math.abs(e.clientX - startX) > 6) moved = true;
    vx = e.clientX - last; last = e.clientX;
  });
  const end = () => {
    if (!down) return; down = false;
    if (moved) {
      cv._trendSuppressClick = true;
      setTimeout(() => { cv._trendSuppressClick = false; }, 80);
    }
    if (!trendChart || typeof trendChart.pan !== 'function' || Math.abs(vx) < 3) return;
    (function step() {            // X-only inertia (Y auto-scales to match)
      if (Math.abs(vx) < 0.4) { applyAutoY(); updateNavWindow(); saveTrendState('momentum'); return; }
      try { trendChart.pan({ x: vx }, undefined, 'none'); } catch (_) {}
      clampTrendViewport();
      applyAutoY(); updateNavWindow();
      vx *= 0.9;
      trendNavRAF = requestAnimationFrame(step);
    })();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

function wireTrendPointNavigation() {
  const cv = document.getElementById('trend-chart');
  if (!cv || cv._trendNavWired) return;
  cv._trendNavWired = true;
  cv.tabIndex = 0;
  cv.setAttribute('role', 'application');
  cv.setAttribute('aria-describedby', 'trend-a11y-status');
  cv.setAttribute('aria-label', trendLang() === 'pt'
    ? 'Grafico de tendencias periodicas. Use as setas para escolher um elemento e Enter para abrir.'
    : 'Periodic trends chart. Use arrow keys to choose an element and Enter to open it.');
  ensureTrendA11yStatus();

  cv.addEventListener('auxclick', e => {
    if (e.button !== 1 || !trendChart) return;
    const rect = cv.getBoundingClientRect();
    const hit = trendHitFromEvent(trendChart, { x: e.clientX - rect.left, y: e.clientY - rect.top, native: e }, 24);
    if (!hit) return;
    e.preventDefault();
    navigateTrendElement(hit, e);
  });

  cv.addEventListener('mouseleave', () => {
    if (!trendChart) return;
    trendChart.$trendHoverIndex = null;
    cv.style.cursor = 'crosshair';
    trendChart.update('none');
  });

  cv.addEventListener('focus', () => {
    if (!trendChart || !trendChart.$trendElements?.length) return;
    const sx = trendChart.scales.x;
    const start = Math.max(0, Math.min(trendChart.$trendElements.length - 1, Math.round(sx.min || 0)));
    updateTrendKeyboardFocus(Number.isFinite(trendChart.$trendKeyboardIndex) ? trendChart.$trendKeyboardIndex : start, true);
  });

  cv.addEventListener('blur', () => {
    if (!trendChart) return;
    trendChart.$trendKeyboardIndex = null;
    trendChart.update('none');
  });

  cv.addEventListener('keydown', e => {
    if (!trendChart || !trendChart.$trendElements?.length) return;
    const n = trendChart.$trendElements.length;
    let i = Number.isFinite(trendChart.$trendKeyboardIndex)
      ? trendChart.$trendKeyboardIndex
      : Math.max(0, Math.min(n - 1, Math.round(trendChart.scales.x.min || 0)));
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Enter') {
      e.preventDefault();
      navigateTrendElement({ index: i, el: trendChart.$trendElements[i] }, e);
      return;
    } else {
      return;
    }
    e.preventDefault();
    next = Math.max(0, Math.min(n - 1, next));
    updateTrendKeyboardFocus(next, true);
    const sx = trendChart.scales.x;
    if (next < sx.min || next > sx.max) {
      const width = sx.max - sx.min;
      setTrendXRange(next - width / 2, next + width / 2);
    }
  });
}

// Reflects the auto-scale state on the "AUTO" button.
function updateAutoBtn() {
  const b = document.getElementById('trend-auto');
  if (b) b.classList.toggle('is-on', trendAutoY);
}

// Toggles vertical auto-scale. ON → Y fits the visible X range (afterDataLimits
// drives). OFF → freeze Y at its current extent so values stay comparable while
// you pan X. Manual Y-axis dragging also flips this OFF.
function toggleTrendAutoY(force) {
  if (!trendChart) return;
  trendAutoY = (force != null) ? !!force : !trendAutoY;
  if (trendAutoY) {
    applyAutoY();                                                               // refit Y to the visible slice
  } else {
    const y = trendChart.options.scales.y;                                      // freeze the current view
    y.min = trendChart.scales.y.min; y.max = trendChart.scales.y.max;
    trendChart.update('none');
  }
  updateAutoBtn();
  saveTrendState('auto-y');
}

// Manual Y scaling, TradingView-style: drag in the Y-axis gutter to expand /
// compress the vertical scale about its centre. Doing so switches auto OFF
// (re-enable with the AUTO button or a reset).
function wireManualYScale() {
  const cv = document.getElementById('trend-chart');
  if (!cv || cv._yWired) return;
  cv._yWired = true;
  let dragging = false, startY = 0, cMin = 0, cMax = 0;
  cv.addEventListener('pointerdown', e => {
    if (!trendChart || e.offsetX >= trendChart.chartArea.left) return;   // only the Y gutter
    dragging = true; startY = e.clientY;
    cMin = trendChart.scales.y.min; cMax = trendChart.scales.y.max;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', e => {
    if (!dragging) return;
    const center = (cMin + cMax) / 2, half = (cMax - cMin) / 2;
    const nh = Math.max(half * Math.exp((e.clientY - startY) / 160), 1e-9);   // drag down → zoom Y out
    trendAutoY = false;
    trendChart.options.scales.y.min = center - nh;
    trendChart.options.scales.y.max = center + nh;
    trendChart.update('none');
    updateAutoBtn();
  });
  const end = e => {
    if (dragging) {
      dragging = false;
      saveTrendState('manual-y');
      try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

function trendStatsUnit(prop) {
  if (prop === 'en') return 'Pauling';
  return TREND_UNITS[prop] || '';
}

function trendStatDecimals(prop, value) {
  if (prop === 'radius' || prop === 'ionization') return 0;
  if (prop === 'melt' || prop === 'boil') return 1;
  if (prop === 'en') return 2;
  if (prop === 'mass') return 3;
  if (prop === 'density') {
    const a = Math.abs(value || 0);
    if (a < 0.01) return 5;
    if (a < 1) return 4;
    return 3;
  }
  return 2;
}

function formatTrendStatValue(value, prop) {
  if (value == null || !Number.isFinite(value)) return '—';
  const unit = trendStatsUnit(prop);
  const s = fmtTrendNum(value, trendStatDecimals(prop, value));
  return unit ? `${s} ${unit}` : s;
}

function calculateTrendStats(dataEls, prop, chart) {
  const n = dataEls ? dataEls.length : 0;
  if (!n) return { prop, unit: trendStatsUnit(prop), count: 0, totalVisible: 0 };
  let lo = 0, hi = n - 1;
  if (chart && chart.scales && chart.scales.x) {
    const sx = chart.scales.x;
    lo = Math.max(0, Math.ceil((sx.min == null ? 0 : sx.min) - 1e-6));
    hi = Math.min(n - 1, Math.floor((sx.max == null ? n - 1 : sx.max) + 1e-6));
  }
  const points = [];
  for (let i = lo; i <= hi; i++) {
    const e = dataEls[i];
    const v = trendNum(e, prop);
    if (v != null && Number.isFinite(v)) points.push({ e, v, index: i });
  }
  if (!points.length) return { prop, unit: trendStatsUnit(prop), count: 0, totalVisible: Math.max(0, hi - lo + 1), lo, hi };
  points.sort((a, b) => a.v - b.v);
  const values = points.map(p => p.v);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const lowest = points[0];
  const highest = points[points.length - 1];
  return {
    prop,
    unit: trendStatsUnit(prop),
    count: points.length,
    totalVisible: Math.max(0, hi - lo + 1),
    highest,
    lowest,
    average: sum / points.length,
    median,
    range: highest.v - lowest.v,
    lo,
    hi
  };
}

function renderTrendStatsUI(stats) {
  const statsEl = document.getElementById('trend-caption-stats');
  if (!statsEl) return;
  statsEl.setAttribute('aria-live', 'polite');
  const lang = trendLang();
  const L = lang === 'pt'
    ? { summary: 'Resumo estatístico', analyzed: 'Elementos analisados', highest: 'Maior', lowest: 'Menor', average: 'Média', median: 'Mediana', range: 'Amplitude', noData: 'Sem valores medidos no intervalo visível' }
    : { summary: 'Statistical summary', analyzed: 'Elements analyzed', highest: 'Highest', lowest: 'Lowest', average: 'Average', median: 'Median', range: 'Range', noData: 'No measured values in the visible range' };
  const sig = stats && stats.count
    ? [lang, stats.prop, stats.lo, stats.hi, stats.count, stats.highest.index, stats.lowest.index, stats.average, stats.median, stats.range].join('|')
    : [lang, stats && stats.prop, 0, stats && stats.lo, stats && stats.hi].join('|');
  if (statsEl._trendStatsSig === sig) return;
  statsEl._trendStatsSig = sig;
  if (!stats || !stats.count) {
    statsEl.innerHTML =
      `<div class="trend-stats-grid trend-stats-empty" role="status" aria-label="${trendEscapeHtml(L.summary)}">` +
        `<div class="trend-stat-card trend-stat-count">` +
          `<span class="trend-stat-k">${trendEscapeHtml(L.analyzed)}</span>` +
          `<strong class="trend-stat-main">0</strong>` +
        `</div>` +
        `<div class="trend-stat-card trend-stat-message">${trendEscapeHtml(L.noData)}</div>` +
      `</div>`;
    return;
  }
  const card = (label, main, sub, cls) =>
    `<div class="trend-stat-card ${cls || ''}">` +
      `<span class="trend-stat-k">${trendEscapeHtml(label)}</span>` +
      `<strong class="trend-stat-main">${trendEscapeHtml(main)}</strong>` +
      (sub ? `<span class="trend-stat-sub">${trendEscapeHtml(sub)}</span>` : '') +
    `</div>`;
  statsEl.innerHTML =
    `<div class="trend-stats-grid" role="group" aria-label="${trendEscapeHtml(L.summary)}">` +
      card(L.analyzed, stats.count, '', 'trend-stat-count') +
      card(L.highest, elName(stats.highest.e), formatTrendStatValue(stats.highest.v, stats.prop), 'trend-stat-hi') +
      card(L.lowest, elName(stats.lowest.e), formatTrendStatValue(stats.lowest.v, stats.prop), 'trend-stat-lo') +
      card(L.average, formatTrendStatValue(stats.average, stats.prop), '', 'trend-stat-avg') +
      card(L.median, formatTrendStatValue(stats.median, stats.prop), '', 'trend-stat-median') +
      card(L.range, formatTrendStatValue(stats.range, stats.prop), '', 'trend-stat-range') +
    `</div>`;
}

function updateTrendStatsFromChart() {
  if (!trendChart || !trendChart.$trendElements) return;
  renderTrendStatsUI(calculateTrendStats(trendChart.$trendElements, trendChart.$trendProp || 'en', trendChart));
}

function scheduleTrendStatsUpdate() {
  if (typeof requestAnimationFrame !== 'function') { updateTrendStatsFromChart(); return; }
  if (trendStatsRAF) return;
  trendStatsRAF = requestAnimationFrame(() => {
    trendStatsRAF = null;
    updateTrendStatsFromChart();
  });
}

// Scientific insight panel under the chart: a curated, structured explainer for
// the selected property (definition · periodic trend · scientific reason ·
// educational takeaway) that adapts a context line to the active filter, plus
// the live quantitative summary (highest/lowest/average/…). Bilingual (EN/PT);
// all prose is curated (see TREND_INSIGHTS), never generated at runtime.
function updateTrendCaption(prop, dataEls) {
  const descEl = document.getElementById('trend-caption-desc');
  const captionEl = document.getElementById('trend-caption');
  if (!descEl || !captionEl) return;

  const lang = trendLang();
  const info = (TREND_INSIGHTS[prop] || {})[lang] || (TREND_INSIGHTS[prop] || {}).en || {};
  const esc = (typeof trendEscapeHtml === 'function')
    ? trendEscapeHtml
    : (s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])));

  // (1) Definition — the lead line (keeps the accent-bordered "quote" style).
  descEl.textContent = info.def || '';

  // (2) Structured insight block — created once, kept between the lead and the
  //     stats grid so it works on both trends.html and trends.pt.html.
  let insightEl = document.getElementById('trend-insight');
  if (!insightEl) {
    insightEl = document.createElement('div');
    insightEl.id = 'trend-insight';
    captionEl.insertBefore(insightEl, document.getElementById('trend-caption-stats') || null);
  }
  const L = lang === 'pt'
    ? { trend: 'Tendência periódica', why: 'Por que acontece' }
    : { trend: 'Periodic trend', why: 'Why it happens' };

  // Filter-aware context: which sub-trend is the current selection actually
  // showing? Period → left/right; group → down a column; f-block → the series.
  const fEl = document.getElementById('trend-group');
  const fVal = fEl ? fEl.value : 'all';
  const fLabel = fEl ? ((Array.from(fEl.options).find(o => o.value === fVal) || {}).text || '') : '';
  let ctxNote = '';
  if (fVal === 'lanthanides' || fVal === 'actinides') ctxNote = info.fblock || '';
  else if (fVal.indexOf('fam-') === 0) {
    // Column-like families follow the down-a-group trend; block-like families
    // (transition/post-transition/metalloid/reactive nonmetal) span the table
    // with no single clean trend, so they get no context line.
    const fam = fVal.slice(4);
    if (fam === 'alkali' || fam === 'alkaline' || fam === 'halogen' || fam === 'noble') ctxNote = info.group || '';
  }
  else if (fVal && fVal.charAt(0) === 'p' && fVal !== 'all') ctxNote = info.period || '';
  else if (fVal && fVal.charAt(0) === 'g') ctxNote = info.group || '';   // 'all' → no context line

  let html = '';
  if (info.trend || info.why) {
    html += '<div class="trend-insight-grid">';
    if (info.trend) html += `<div class="trend-insight-block"><span class="trend-insight-k">${esc(L.trend)}</span><p class="trend-insight-t">${esc(info.trend)}</p></div>`;
    if (info.why)   html += `<div class="trend-insight-block"><span class="trend-insight-k">${esc(L.why)}</span><p class="trend-insight-t">${esc(info.why)}</p></div>`;
    html += '</div>';
  }
  if (ctxNote) {
    html += `<div class="trend-insight-context"><span class="trend-insight-chip">${esc(fLabel)}</span><span class="trend-insight-ctext">${esc(ctxNote)}</span></div>`;
  }
  if (info.interp) html += `<p class="trend-insight-interp">${esc(info.interp)}</p>`;
  insightEl.innerHTML = html;

  // (3) Live quantitative companion (highest / lowest / average / median / range).
  renderTrendStatsUI(calculateTrendStats(dataEls, prop, trendChart));
}

// ─── TRENDS EXPORT — BRANDED PNG ───────────────────────────────────────────
// Composites the chart onto a larger canvas with header (title + subtitle)
// and footer (atomurus.com watermark + metadata). This makes the downloaded
// image shareable — not just a "screenshot of the website" but a self-
// contained visualization carrying its own context.
function exportTrendPNG() {
  if (!trendChart) return;
  const chartCanvas = document.getElementById('trend-chart');
  const sourceUrl   = chartCanvas.toDataURL('image/png');

  const prop   = document.getElementById('trend-prop').value;
  const filter = document.getElementById('trend-group').value;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // The unified filter dropdown carries both periods and groups — its <option>
  // text is the human-readable label we want in the subtitle.
  const filterLabel = (Array.from(document.getElementById('trend-group').options).find(o => o.value === filter) || {}).text || filter;
  const subtitle    = trendPropLabel(prop);
  const filterLine  = filterLabel;

  const W = 1280, H = 800;
  const PAD = 48;
  const HEADER_H = 110;
  const FOOTER_H = 60;
  const CHART_TOP = PAD + HEADER_H;
  const CHART_W = W - 2 * PAD;
  const CHART_H = H - CHART_TOP - FOOTER_H - PAD;

  const bg     = isDark ? '#0E0D0C' : '#F0EDE6';
  const card   = isDark ? '#161513' : '#FFFEFC';
  const border = isDark ? '#2A2824' : '#DDD8CE';
  const text1  = isDark ? '#F2EFE9' : '#12100E';
  const text2  = isDark ? '#928C84' : '#5A5550';
  const text3  = isDark ? '#52504A' : '#9A948C';
  const accent = isDark ? '#34A872' : '#1E6A50';

  const out = document.createElement('canvas');
  out.width  = W; out.height = H;
  const c = out.getContext('2d');

  // Background gradient
  const grd = c.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, bg);
  grd.addColorStop(1, card);
  c.fillStyle = grd;
  c.fillRect(0, 0, W, H);

  // Header: logo mark + brand name (atomurus.com lives ONLY in the footer to
  // avoid the previous overlap bug where measureText() ran before fonts loaded).
  c.fillStyle = accent;
  c.beginPath(); c.arc(PAD + 18, PAD + 22, 16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(PAD + 18, PAD + 22, 4, 0, Math.PI * 2); c.fill();
  // Three Bohr-like ellipses inside the mark
  c.strokeStyle = '#fff'; c.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) {
    c.save();
    c.translate(PAD + 18, PAD + 22);
    c.rotate(k * Math.PI / 3);
    c.beginPath(); c.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  c.fillStyle = text1;
  c.font = '600 22px "DM Serif Display", serif';
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('Atomurus', PAD + 44, PAD + 22);

  // Chart title (translated)
  c.fillStyle = text1;
  c.font = '700 32px "DM Serif Display", serif';
  c.fillText(_T('ptable.trChartTitle', 'Periodic Trends'), PAD, PAD + 68);

  // Subtitle: properties + filter (group + period)
  c.fillStyle = text2;
  c.font = '500 14px "DM Sans", sans-serif';
  c.fillText(`${subtitle}  ·  ${filterLine}`, PAD, PAD + 96);

  // Card background behind chart
  c.fillStyle = card;
  c.strokeStyle = border;
  c.lineWidth = 1;
  const r = 14;
  const cx = PAD - 8, cy = CHART_TOP - 8, cw = CHART_W + 16, ch = CHART_H + 16;
  c.beginPath();
  c.moveTo(cx + r, cy);
  c.lineTo(cx + cw - r, cy);
  c.quadraticCurveTo(cx + cw, cy, cx + cw, cy + r);
  c.lineTo(cx + cw, cy + ch - r);
  c.quadraticCurveTo(cx + cw, cy + ch, cx + cw - r, cy + ch);
  c.lineTo(cx + r, cy + ch);
  c.quadraticCurveTo(cx, cy + ch, cx, cy + ch - r);
  c.lineTo(cx, cy + r);
  c.quadraticCurveTo(cx, cy, cx + r, cy);
  c.closePath();
  c.fill(); c.stroke();

  // Footer: brand + element count + date
  const dateStr = new Date().toISOString().slice(0, 10);
  c.fillStyle = text3;
  c.font = '500 11px "DM Mono", monospace';
  c.textAlign = 'left';
  c.fillText(_T('ptable.trChartFooter', 'Generated by Atomurus · atomurus.com'), PAD, H - PAD + 4);
  c.textAlign = 'right';
  const elCount = (trendChart && trendChart.data && (trendChart.data.labels || trendChart.data.datasets[0].data)).length || 0;
  c.fillText(`n=${elCount}  ·  ${dateStr}`, W - PAD, H - PAD + 4);

  // Draw the chart canvas into the card area. Use an Image so we can scale up
  // from the source bitmap (toDataURL preserves the chart layout exactly).
  const img = new Image();
  img.onload = () => {
    c.drawImage(img, PAD, CHART_TOP, CHART_W, CHART_H);
    const link = document.createElement('a');
    link.href = out.toDataURL('image/png');
    link.download = `atomurus-trends-${prop}-${filter}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.onerror = () => {
    // Fallback: download just the chart canvas if compositing fails
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.download = `atomurus-trends-${prop}-${filter}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.src = sourceUrl;
}

// Exports the rendered dataset as CSV (Z, Symbol, Name, value).
function exportTrendCSV() {
  const prop   = document.getElementById('trend-prop').value;
  const filter = document.getElementById('trend-group').value;
  const dataEls = trendFilterElements(filter);
  const csvEscape = s => (s == null ? '' : (/[",\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s)));

  // null → empty cell, so missing data reads as blank rather than a fake 0.
  const cell = v => (v == null ? '' : v);
  const header = ['Z', 'Symbol', 'Name', trendPropLabel(prop)];
  const rows = dataEls.map(e => [e.z, e.sym, elName(e), cell(trendNum(e, prop))]);
  const csv = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `atomurus-trends-${prop}-${filter}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── ISOTOPOS LOGIC ───
let isoInited = false;
let currentIsoZ = 1;          // Tracks which element's isotopes are on screen,
                              // so the language-change re-render can restore it.
function renderIsoElementList() {
  const list = document.getElementById('iso-list');
  if (!list) return;
  const massLabel = _T('ptable.isoItemMass', 'Massa');
  list.innerHTML = ELEMENTS.map(e => `
    <div class="iso-item" data-z="${e.z}" onclick="showIsotopes(${e.z})">
      <div class="iso-item-name">${e.z}. ${elName(e)} (${e.sym})</div>
      <div class="iso-item-mass">${massLabel}: ${e.mass} u</div>
    </div>
  `).join('');
}
function initIsotopes() {
  if (isoInited) return;
  isoInited = true;
  renderIsoElementList();
  // Re-render the element list (name + mass label) whenever the language
  // toggles, so users see the translated names without reloading the page.
  if (window.I18N && typeof I18N.onChange === 'function') {
    I18N.onChange(() => {
      renderIsoElementList();
      // Re-show the currently-selected element so its row gets the active
      // highlight back and the detail pane refreshes with translated labels.
      showIsotopes(currentIsoZ || 1);
    });
  }
  showIsotopes(1); // Hydrogen by default
}

function filterIsoList() {
  const q = document.getElementById('iso-search').value.toLowerCase();
  document.querySelectorAll('.iso-item').forEach(item => {
    if (item.textContent.toLowerCase().includes(q)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

function showIsotopes(z) {
  initIsoTooltips();           // wire the shared isotope tooltip once (idempotent)
  currentIsoZ = z;             // Remember selection for the i18n re-render hook
  document.querySelectorAll('.iso-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`.iso-item[data-z="${z}"]`);
  if (activeItem) activeItem.classList.add('active');

  const el = ELEMENTS.find(e => e.z === z);
  document.getElementById('iso-details-pane').style.display = 'block';
  document.getElementById('iso-z').textContent = el.z;
  document.getElementById('iso-sym').textContent = el.sym;
  document.getElementById('iso-name').textContent = elName(el);

  // Update the Explore link target to the current element's page.
  // The isotopes view always lives inside /periodic-table/, so we link to a
  // sibling latin-named page (e.g. /periodic-table/hydrogenium).
  const exploreLink = document.getElementById('iso-explore-link');
  if (exploreLink) {
    const latin = (typeof ELEMENT_LATIN !== 'undefined' && ELEMENT_LATIN[el.z]) || el.sym.toLowerCase();
    exploreLink.href = latin;
  }

  bohrPaused['bohr-iso'] = true;
  drawBohr(el, 'bohr-iso');

  // i18n labels used when raw values aren't representable as numbers
  const T_traces = _T('ptable.isoTraces',      'Traços');
  const T_stable = _T('ptable.isoStable',      'Estável');
  const T_none   = _T('ptable.isoNone',        'Nenhum');
  const T_pending = _T('ptable.isoPending',    'Dataset em construção — Z não coberto ainda');

  // Pull from curated dataset (see isotopes-data.js).
  // Missing entry → graceful empty state, NO fake fallback (was the audit finding).
  const isosRaw = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || null;
  const tbody = document.getElementById('iso-tbody');

  if (!isosRaw || isosRaw.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="padding:18px 10px;color:var(--text-3);text-align:center;font-size:12.5px">${T_pending}</td></tr>
    `;
    // Clear abundance chart + model row + decay filter + half-life chart
    const row = document.getElementById('iso-model-row');
    if (row) row.innerHTML = '';
    const filterHost = document.getElementById('iso-decay-filter');
    if (filterHost) filterHost.innerHTML = '';
    drawAbundanceChart(z);
    drawHalfLifeChart(z);
    renderIsotopeInsight(z);   // clears the panel when Z has no dataset entry
    renderIsotopeApplications(z);
    renderIsoHero(z, el, null);   // atomic data only; isotope summary hidden
    return;
  }

  // Pick the default highlighted isotope: most abundant naturally-occurring,
  // falling back to the longest-lived radioisotope if nothing is primordial.
  const primary = isosRaw.find(i => i.ab != null && i.ab > 0.5)
              || isosRaw.find(i => i.ab != null)
              || isosRaw.slice().sort((a, b) => (b.hl || 0) - (a.hl || 0))[0]
              || isosRaw[0];
  // Scientific hero summary (atomic data + isotope counts + most-abundant +
  // relevant chips). Built from the dataset, so it re-runs on element switch.
  renderIsoHero(z, el, isosRaw);
  drawAbundanceChart(z);
  renderIsoModelRow(z, isosRaw, primary);
  // Decay-mode filter chips + half-life log chart (depend on the dataset
  // for this element, so they re-render here).
  renderDecayFilter(isosRaw);

  // Contextual "Isotope Insight" panel — curated narrative when available,
  // deterministic fact-only summary otherwise (see renderIsotopeInsight).
  renderIsotopeInsight(z);
  // Real-world "Applications" section — curated; hidden when no data exists.
  renderIsotopeApplications(z);

  tbody.innerHTML = isosRaw.map(iso => {
    // Display name: "Sym-A" (optionally "Sym-Am" for metastable isomers like Tc-99m)
    //   with optional alias parenthetical ("H-2 (Deutério)")
    const aliasKey = iso.alias && _T('ptable.isoAlias_' + iso.alias.toLowerCase(), iso.alias);
    const baseName = `${el.sym}-${iso.a}${iso.m ? 'm' : ''}`;
    const displayName = aliasKey ? `${baseName} (${aliasKey})` : baseName;

    // Abundance: number → "x.xxx%", null → "traces" label
    let abText, abBarPct;
    if (iso.ab == null) {
      abText = T_traces;
      abBarPct = 0;          // bar invisible for synthetic / cosmogenic-only
    } else {
      abText = (typeof formatAbundance === 'function')
        ? (formatAbundance(iso.ab) || T_traces)
        : (iso.ab * 100).toFixed(3) + '%';
      abBarPct = Math.max(0, Math.min(100, iso.ab * 100));
    }

    // Half-life: hl seconds → formatted; null → stable label
    const halfText = iso.hl == null
      ? (iso.hlf || T_stable)
      : (typeof formatHalfLife === 'function' ? formatHalfLife(iso.hl, T_stable) : iso.hlf);

    // Decay modes: array → joined; empty → "none"
    const decText = (iso.dec && iso.dec.length) ? iso.dec.join(' / ') : T_none;

    const isActive = (iso.a === primary.a && !!iso.m === !!primary.m);
    return `
    <tr class="iso-row${isActive ? ' active' : ''}" data-z="${z}" data-a="${iso.a}" data-m="${iso.m ? '1' : '0'}" tabindex="0" role="button" aria-label="${displayName}"
        style="border-bottom:1px solid var(--border-soft);cursor:pointer;transition:background .12s">
      <td style="padding:12px 10px;font-family:'DM Mono',monospace;color:var(--accent);font-weight:600">${displayName}</td>
      <td style="padding:12px 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:var(--border-soft);border-radius:3px;overflow:hidden">
            <div style="width:${abBarPct}%;height:100%;background:var(--accent);border-radius:3px"></div>
          </div>
          <span style="font-size:12px;width:60px;text-align:right">${abText}</span>
        </div>
      </td>
      <td style="padding:12px 10px;font-family:'DM Mono',monospace;font-size:12px">${halfText}</td>
      <td style="padding:12px 10px;font-family:'DM Mono',monospace;font-size:12px">${decText}</td>
    </tr>
  `}).join('');

  // Wire click + keyboard activation on isotope rows so users can swap the
  // nucleus visualization between isotopes of the same element.
  Array.from(tbody.querySelectorAll('tr.iso-row')).forEach(tr => {
    const handler = () => {
      const a = Number(tr.dataset.a);
      const zRow = Number(tr.dataset.z);
      const m = tr.dataset.m === '1';
      tbody.querySelectorAll('tr.iso-row.active').forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      // Sync atom-card highlight too (the model row mirrors the table)
      const modelRow = document.getElementById('iso-model-row');
      if (modelRow) {
        modelRow.querySelectorAll('.atom-card.active').forEach(c => c.classList.remove('active'));
        const matchingCard = modelRow.querySelector(`.atom-card[data-a="${a}"][data-m="${m ? '1' : '0'}"]`);
        if (matchingCard) matchingCard.classList.add('active');
      }
    };
    tr.addEventListener('click', handler);
    tr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  // Re-apply the current filter after every isotope surface exists: main rows,
  // atom cards, and the half-life chart.
  applyDecayFilter();
}

// ─── ATOMIC MODEL ROW (per-isotope textbook cards) ───────────────────────────
// Generates one mini card per isotope (canvas + isotope notation + alias).
// Cards are clickable / keyboard-activatable, mirroring the table-row swap
// behaviour so users can pick any isotope from either UI element.
function renderIsoModelRow(z, isos, primary) {
  const row = document.getElementById('iso-model-row');
  if (!row || !isos) return;
  const el = ELEMENTS.find(e => e.z === z);
  if (!el) { row.innerHTML = ''; return; }

  row.innerHTML = isos.map((iso, idx) => {
    const aliasKey = iso.alias && _T('ptable.isoAlias_' + iso.alias.toLowerCase(), iso.alias);
    const isActive = (iso.a === primary.a && !!iso.m === !!primary.m);
    // Build chemistry-style notation: superscript A, subscript Z, then symbol.
    // Metastable isomers get an "m" appended to A (e.g., ⁹⁹ᵐTc).
    const aText = `${iso.a}${iso.m ? 'm' : ''}`;
    return `
      <div class="atom-card${isActive ? ' active' : ''}" data-z="${z}" data-a="${iso.a}" data-m="${iso.m ? '1' : '0'}" data-idx="${idx}"
           tabindex="0" role="button" aria-label="${el.sym}-${aText}${aliasKey ? ' (' + aliasKey + ')' : ''}">
        <canvas width="128" height="128"></canvas>
        <div class="atom-card-notation"><sup>${aText}</sup><sub>${z}</sub>${el.sym}</div>
        <div class="atom-card-alias">${aliasKey || ''}</div>
      </div>
    `;
  }).join('');

  // Render each canvas + wire interaction
  Array.from(row.querySelectorAll('.atom-card')).forEach(card => {
    const a = Number(card.dataset.a);
    const m = card.dataset.m === '1';
    // The canvas inherits no ID, so target it by reference; drawAtomicModel
    // looks up by ID — give each card a unique transient ID.
    const canvas = card.querySelector('canvas');
    const id = `iso-model-${z}-${a}-${m ? 'm' : 'g'}`;
    canvas.id = id;
    drawAtomicModel(z, a, id);

    const handler = () => {
      // Sync visual highlight across cards + table rows
      row.querySelectorAll('.atom-card.active').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const tbody = document.getElementById('iso-tbody');
      if (tbody) {
        tbody.querySelectorAll('tr.iso-row.active').forEach(r => r.classList.remove('active'));
        const matchingRow = tbody.querySelector(`tr.iso-row[data-a="${a}"][data-m="${m ? '1' : '0'}"]`);
        if (matchingRow) matchingRow.classList.add('active');
      }
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}

// ─── SCIENTIFIC HERO SUMMARY ─────────────────────────────────────────────────
// Renders the per-element hero: core atomic data (number, mass) plus an isotope
// profile (known / stable / radioactive counts, the most-abundant isotope, and
// a compact "most relevant" chip list). Every value comes straight from
// ELEMENTS / ISOTOPES — nothing is invented. Any metric whose data is missing
// is omitted (e.g. synthetic-only elements show no "most abundant"). Labels go
// through _T so EN/PT switch live with the rest of the page.
function isoStatCard(num, label, cls) {
  return `
    <div class="iso-stat ${cls}">
      <div class="iso-stat-num">${num}</div>
      <div class="iso-stat-lbl">${label}</div>
    </div>`;
}

function renderIsoHero(z, el, isos) {
  if (!el) return;

  // Core atomic data — always available from ELEMENTS; an item hides if missing.
  const atomicHost = document.getElementById('iso-hero-atomic');
  if (atomicHost) {
    const items = [];
    if (el.z != null) {
      items.push(`<span class="iso-atomic"><span class="iso-atomic-lbl">${_T('ptable.heroAtomicNumber', 'Atomic number')}</span><span class="iso-atomic-val">${el.z}</span></span>`);
    }
    if (el.mass != null && el.mass !== '') {
      items.push(`<span class="iso-atomic"><span class="iso-atomic-lbl">${_T('ptable.heroAtomicMass', 'Atomic mass')}</span><span class="iso-atomic-val">${el.mass} u</span></span>`);
    }
    atomicHost.innerHTML = items.join('<span class="iso-atomic-sep">·</span>');
  }

  const statsHost    = document.getElementById('iso-hero-stats');
  const relevantHost = document.getElementById('iso-hero-relevant');

  // No dataset for this element → identity + atomic data only.
  if (!isos || !isos.length) {
    if (statsHost)    { statsHost.innerHTML = ''; statsHost.style.display = 'none'; }
    if (relevantHost) relevantHost.innerHTML = '';
    return;
  }

  const stable  = isos.filter(i => i.hl == null);
  const radio   = isos.filter(i => i.hl != null);
  const natural = isos.filter(i => i.ab != null && i.ab > 0);
  const mostAb  = natural.slice().sort((a, b) => b.ab - a.ab)[0] || null;

  // Stat cards: known / stable / radioactive counts (+ most-abundant when it exists).
  if (statsHost) {
    statsHost.style.display = '';
    let html =
      isoStatCard(isos.length,   _T('ptable.heroKnown',       'Known'),       '') +
      isoStatCard(stable.length, _T('ptable.heroStable',      'Stable'),      'iso-stat--stable') +
      isoStatCard(radio.length,  _T('ptable.heroRadioactive', 'Radioactive'), 'iso-stat--radio');

    if (mostAb) {
      const aliasKey = mostAb.alias && _T('ptable.isoAlias_' + mostAb.alias.toLowerCase(), mostAb.alias);
      const name = aliasKey || `${el.sym}-${mostAb.a}`;
      const pct = (typeof formatAbundance === 'function' ? formatAbundance(mostAb.ab) : null) || (mostAb.ab * 100).toFixed(3) + '%';
      html += `
        <div class="iso-stat iso-stat--abundant" data-iso-tip="${el.z}-${mostAb.a}-${mostAb.m ? '1' : '0'}" tabindex="0">
          <div class="iso-stat-lbl">${_T('ptable.heroMostAbundant', 'Most abundant')}</div>
          <div class="iso-stat-abundant-val">${name}<span class="iso-stat-abundant-pct">${pct}</span></div>
        </div>`;
    }
    statsHost.innerHTML = html;
  }

  // Most-relevant chips: naturally-occurring (by abundance) + notable radioisotopes.
  if (relevantHost) {
    const picks = [];
    const seen = new Set();
    const key = i => i.a + (i.m ? 'm' : '');
    const add = i => { if (i && !seen.has(key(i))) { seen.add(key(i)); picks.push(i); } };
    natural.slice().sort((a, b) => b.ab - a.ab).forEach(add);
    radio.filter(i => i.alias).forEach(add);
    radio.slice().sort((a, b) => (b.hl || 0) - (a.hl || 0)).forEach(i => { if (picks.length < 4) add(i); });

    const shown = picks.slice(0, 4);
    if (!shown.length) {
      relevantHost.innerHTML = '';
    } else {
      const chips = shown.map(i => {
        const aliasKey = i.alias && _T('ptable.isoAlias_' + i.alias.toLowerCase(), i.alias);
        const notation = `${el.sym}-${i.a}${i.m ? 'm' : ''}`;
        const label = aliasKey ? `${notation} ${aliasKey}` : notation;
        return `<span class="iso-hero-chip" data-iso-tip="${el.z}-${i.a}-${i.m ? '1' : '0'}" tabindex="0">${label}</span>`;
      }).join('');
      const moreN = isos.length - shown.length;
      const more = moreN > 0 ? `<span class="iso-hero-chip iso-hero-chip--more">+${moreN}</span>` : '';
      relevantHost.innerHTML =
        `<span class="iso-hero-relevant-lbl">${_T('ptable.heroMostRelevant', 'Most relevant')}</span>` +
        `<span class="iso-hero-chips">${chips}${more}</span>`;
    }
  }
}

// ─── ISOTOPE INSIGHT PANEL ───────────────────────────────────────────────────
// Turns the raw isotope table into understandable science. Two content sources,
// in priority order:
//   1. CURATED — hand-written, human-reviewed bilingual explanations from
//      isotope-insights-data.js (window.ISOTOPE_INSIGHTS). Preferred.
//   2. FALLBACK — a deterministic, FACT-ONLY summary built from the dataset
//      (composition = Z protons + (A−Z) neutrons, abundance, half-life, decay).
//      Never invents uses or history; only states numbers already in ISOTOPES.
// No explanatory prose is ever generated at runtime by AI.
//
// Stable / radioactive / rare badges are derived from the real dataset entry
// (single source of truth) so the panel can never contradict the table.

function isoInsightLang() {
  return (window.I18N && I18N.lang === 'pt') ? 'pt' : 'en';
}

// Match a curated/fallback item to its dataset row and classify it.
function isoInsightStatus(z, item) {
  const ds = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  const match = ds.find(i => i.a === item.a && (!!i.m === !!item.m));
  if (!match) return { primary: null, rare: false };
  const radioactive = match.hl != null;
  // "rare" = naturally occurring but scarce (<1% abundance). Purely synthetic
  // isotopes (ab == null) are already conveyed by the radioactive badge.
  const rare = (match.ab != null && match.ab > 0 && match.ab < 0.01);
  return { primary: radioactive ? 'radioactive' : 'stable', rare };
}

// "11 protons and 12 neutrons." — grammar-safe (singular/plural) in both langs.
function isoCompositionPhrase(p, n, lang) {
  if (lang === 'pt') {
    const pp = p === 1 ? '1 próton'  : p + ' prótons';
    const nn = n === 1 ? '1 nêutron' : n + ' nêutrons';
    return pp + ' e ' + nn + '.';
  }
  const pp = p === 1 ? '1 proton'  : p + ' protons';
  const nn = n === 1 ? '1 neutron' : n + ' neutrons';
  return pp + ' and ' + nn + '.';
}

// One fact-only sentence for an isotope in the fallback path.
function isoFallbackItemText(z, iso, lang, mostAb) {
  const comp = isoCompositionPhrase(z, iso.a - z, lang);
  const pct = (iso.ab != null)
    ? ((typeof formatAbundance === 'function' ? formatAbundance(iso.ab) : null) || (iso.ab * 100).toFixed(3) + '%')
    : null;
  let sig;
  if (iso.hl != null) {
    const hl = (typeof formatHalfLife === 'function') ? formatHalfLife(iso.hl) : (iso.hlf || '');
    const modes = (iso.dec && iso.dec.length) ? iso.dec.join(' / ') : (lang === 'pt' ? 'decaimento' : 'decay');
    sig = (lang === 'pt')
      ? 'Radioativo — meia-vida de ' + hl + ', decaindo por ' + modes + '.'
      : 'Radioactive — half-life ' + hl + ', decaying by ' + modes + '.';
  } else if (iso === mostAb && iso.ab != null && iso.ab >= 0.9999) {
    sig = (lang === 'pt') ? 'Praticamente a única forma natural (cerca de 100%).'
                          : 'Essentially the only natural form (about 100%).';
  } else if (iso === mostAb && pct) {
    sig = (lang === 'pt') ? 'Forma mais comum — cerca de ' + pct + ' de abundância natural.'
                          : 'Most common form — about ' + pct + ' natural abundance.';
  } else if (pct && iso.ab < 0.01) {
    sig = (lang === 'pt') ? 'Estável, porém raro — apenas ' + pct + '.'
                          : 'Stable but rare — only ' + pct + '.';
  } else if (pct) {
    sig = (lang === 'pt') ? 'Isótopo estável, ' + pct + ' de abundância natural.'
                          : 'Stable isotope, ' + pct + ' natural abundance.';
  } else {
    sig = (lang === 'pt') ? 'Isótopo estável.' : 'Stable isotope.';
  }
  return comp + ' ' + sig;
}

// Build a {lead, items} block from dataset facts when no curated entry exists.
function buildFallbackInsight(z) {
  const el = ELEMENTS.find(e => e.z === z);
  const ds = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  if (!el || !ds.length) return null;
  const lang = isoInsightLang();
  const nStable = ds.filter(i => i.hl == null).length;

  const lead = (lang === 'pt')
    ? (nStable === 0
        ? 'Este elemento não possui isótopos estáveis — todos os listados são radioativos. Destaques:'
        : 'Destaques dos isótopos conhecidos deste elemento:')
    : (nStable === 0
        ? 'This element has no stable isotopes — all listed here are radioactive. Highlights:'
        : 'Highlights of this element’s known isotopes:');

  const natural = ds.filter(i => i.ab != null && i.ab > 0);
  const stable  = ds.filter(i => i.hl == null);
  const radio   = ds.filter(i => i.hl != null);

  const picks = [];
  const seen = new Set();
  const key = i => i.a + (i.m ? 'm' : '');
  const add = i => { if (i && !seen.has(key(i))) { seen.add(key(i)); picks.push(i); } };

  const mostAb = natural.slice().sort((a, b) => b.ab - a.ab)[0] || stable[0];
  add(mostAb);                                            // most abundant
  add(natural.filter(i => i.hl == null && i.ab < 0.01)    // a genuinely rare stable one
            .sort((a, b) => a.ab - b.ab)[0]);
  radio.filter(i => i.alias).forEach(add);                // named radioisotopes first
  radio.slice().sort((a, b) => (b.hl || 0) - (a.hl || 0)) // then longest-lived
       .forEach(i => { if (picks.length < 4) add(i); });

  const chosen = picks.slice(0, 4)
    .sort((a, b) => (a.a - b.a) || ((a.m ? 1 : 0) - (b.m ? 1 : 0)));

  return {
    lead,
    items: chosen.map(i => ({ a: i.a, m: !!i.m, text: isoFallbackItemText(z, i, lang, mostAb) }))
  };
}

function renderIsotopeInsight(z) {
  const host = document.getElementById('iso-insight');
  if (!host) return;
  const el = ELEMENTS.find(e => e.z === z);
  const lang = isoInsightLang();

  // Prefer curated content (current language, falling back to EN), then the
  // deterministic dataset summary.
  let data = null;
  const block = (typeof ISOTOPE_INSIGHTS !== 'undefined' && ISOTOPE_INSIGHTS[z]) || null;
  if (block) data = block[lang] || block.en;
  if (!data) data = buildFallbackInsight(z);

  if (!el || !data || !data.items || !data.items.length) {
    host.innerHTML = '';
    host.style.display = 'none';
    return;
  }
  host.style.display = '';

  const title   = _T('ptable.isoInsightTitle', 'Understanding these isotopes');
  const level   = _T('ptable.isoInsightLevel', 'High-school · intro chemistry');
  const L_stable = _T('ptable.isoBadgeStable',      'Stable');
  const L_radio  = _T('ptable.isoBadgeRadioactive', 'Radioactive');
  const L_rare   = _T('ptable.isoBadgeRare',        'Rare');

  const itemsHtml = data.items.map(item => {
    const st = isoInsightStatus(z, item);
    const badges = [];
    if (st.primary === 'stable')      badges.push(`<span class="iso-badge iso-badge--stable">${L_stable}</span>`);
    if (st.primary === 'radioactive') badges.push(`<span class="iso-badge iso-badge--radioactive">${L_radio}</span>`);
    if (st.rare)                      badges.push(`<span class="iso-badge iso-badge--rare">${L_rare}</span>`);
    const aText = `${item.a}${item.m ? 'm' : ''}`;
    const nameHtml = item.name ? `<span class="iso-insight-name">${item.name}</span>` : '';
    const tipAttrs = st.primary ? ` data-iso-tip="${z}-${item.a}-${item.m ? '1' : '0'}" tabindex="0"` : '';
    return `
      <li class="iso-insight-item"${tipAttrs}>
        <div class="iso-insight-item-head">
          <span class="iso-insight-notation"><sup>${aText}</sup><sub>${z}</sub>${el.sym}</span>
          ${nameHtml}
          <span class="iso-badges">${badges.join('')}</span>
        </div>
        <p class="iso-insight-text">${item.text}</p>
      </li>`;
  }).join('');

  host.innerHTML = `
    <div class="iso-insight-head">
      <h3 class="iso-insight-title">${title}</h3>
      <span class="iso-insight-level">${level}</span>
    </div>
    <p class="iso-insight-lead">${data.lead}</p>
    <ul class="iso-insight-items">${itemsHtml}</ul>
  `;
}

// ─── ISOTOPE APPLICATIONS PANEL ──────────────────────────────────────────────
// Real-world uses of specific isotopes, grouped into sector categories with
// colour-coded visual tags. Content is fully curated (isotope-applications-
// data.js, window.ISOTOPE_APPLICATIONS); never generated at runtime. The whole
// section is hidden for any element without a curated entry (display only when
// information exists).
const ISO_APP_CATS = ['industrial', 'medical', 'scientific', 'energy', 'nuclear'];

function isoAppCatLabel(cat) {
  switch (cat) {
    case 'industrial': return _T('ptable.appCatIndustrial', 'Industrial');
    case 'medical':    return _T('ptable.appCatMedical',    'Medicine');
    case 'scientific': return _T('ptable.appCatScientific', 'Research');
    case 'energy':     return _T('ptable.appCatEnergy',     'Energy');
    case 'nuclear':    return _T('ptable.appCatNuclear',    'Nuclear');
    default:           return cat;
  }
}

function renderIsotopeApplications(z) {
  const host = document.getElementById('iso-applications');
  if (!host) return;
  const el = ELEMENTS.find(e => e.z === z);
  const data = (typeof ISOTOPE_APPLICATIONS !== 'undefined' && ISOTOPE_APPLICATIONS[z]) || null;

  if (!el || !data || !data.length) {        // no curated uses → hide entirely
    host.innerHTML = '';
    host.style.display = 'none';
    return;
  }
  const lang = isoInsightLang();
  const ds = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];

  const blocks = data.map(entry => {
    const apps = (entry.apps || []).filter(ap => ap && (ap[lang] || ap.en));
    if (!apps.length) return '';
    // Alias (Protium…) pulled from the dataset so it matches the table.
    const dsRow = ds.find(i => i.a === entry.a && (!!i.m === !!entry.m));
    const aliasKey = dsRow && dsRow.alias && _T('ptable.isoAlias_' + dsRow.alias.toLowerCase(), dsRow.alias);
    const aText = `${entry.a}${entry.m ? 'm' : ''}`;
    const nameHtml = aliasKey ? `<span class="iso-insight-name">${aliasKey}</span>` : '';
    const tipAttrs = dsRow ? ` data-iso-tip="${z}-${entry.a}-${entry.m ? '1' : '0'}" tabindex="0"` : '';

    const items = apps.map(ap => {
      const cat = ISO_APP_CATS.indexOf(ap.cat) >= 0 ? ap.cat : 'scientific';
      const label = ap[lang] || ap.en;
      return `<li class="iso-apps-item">
                <span class="app-tag app-tag--${cat}">${isoAppCatLabel(cat)}</span>
                <span class="iso-apps-label">${label}</span>
              </li>`;
    }).join('');

    return `
      <li class="iso-apps-iso"${tipAttrs}>
        <div class="iso-apps-iso-head">
          <span class="iso-insight-notation"><sup>${aText}</sup><sub>${z}</sub>${el.sym}</span>
          ${nameHtml}
        </div>
        <ul class="iso-apps-items">${items}</ul>
      </li>`;
  }).filter(Boolean).join('');

  if (!blocks) {
    host.innerHTML = '';
    host.style.display = 'none';
    return;
  }
  host.style.display = '';
  const title = _T('ptable.isoAppsTitle', 'Applications');
  host.innerHTML = `
    <div class="iso-apps-head"><h3 class="iso-apps-title">${title}</h3></div>
    <ul class="iso-apps-list">${blocks}</ul>
  `;
}

// ─── DECAY-MODE COLOR PALETTE ────────────────────────────────────────────────
// Shared by the half-life chart bars and (visually-consistent) decay filter
// chips. Light-mode tones first; dark-mode variants follow when applicable.
const DECAY_COLOR_MAP = {
  'α':       { light: '#ec4899', dark: '#f472b6' },
  'β-':      { light: '#f97316', dark: '#fb923c' },
  'β+':      { light: '#3b82f6', dark: '#60a5fa' },
  'EC':      { light: '#8b5cf6', dark: '#a78bfa' },
  'IT':      { light: '#06b6d4', dark: '#22d3ee' },
  'γ':       { light: '#facc15', dark: '#fde047' },
  'SF':      { light: '#dc2626', dark: '#f87171' },
  '2β-':     { light: '#a16207', dark: '#d97706' },
  '2EC':     { light: '#5b21b6', dark: '#7c3aed' }
};
function decayColor(mode, isDark) {
  const c = DECAY_COLOR_MAP[mode];
  if (!c) return isDark ? '#9ca3af' : '#6b7280'; // unknown mode → gray
  return isDark ? c.dark : c.light;
}

// ─── DECAY-MODE FILTER CHIPS + STATE ─────────────────────────────────────────
// Single source of truth for which decay modes are visible. 'all' shows
// everything; 'stable' shows only stable isotopes; any other string is a
// specific decay mode (e.g. 'α', 'β-').
let currentDecayFilter = 'all';

function renderDecayFilter(isos) {
  const host = document.getElementById('iso-decay-filter');
  if (!host) return;

  // Count isotopes per decay mode + "stable" + "all"
  const counts = { all: isos.length, stable: 0 };
  isos.forEach(iso => {
    if (iso.hl == null) {
      counts.stable += 1;
    } else if (iso.dec && iso.dec.length) {
      iso.dec.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
    }
  });

  // If the previously-selected filter no longer applies (e.g. user switched
  // elements), reset to 'all'.
  if (currentDecayFilter !== 'all' && !counts[currentDecayFilter]) {
    currentDecayFilter = 'all';
  }

  // Build chip list: All → Stable (if any) → each decay mode (sorted by count desc)
  const decayModes = Object.keys(counts).filter(k => k !== 'all' && k !== 'stable');
  decayModes.sort((a, b) => counts[b] - counts[a]);
  const chips = [
    { id: 'all',    label: _T('ptable.isoFilterAll',    'all')    },
    ...(counts.stable ? [{ id: 'stable', label: _T('ptable.isoFilterStable', 'stable') }] : []),
    ...decayModes.map(m => ({ id: m, label: m }))
  ];

  host.innerHTML = chips.map(c => `
    <button type="button" class="iso-decay-chip${c.id === currentDecayFilter ? ' active' : ''}" data-mode="${c.id}">
      <span>${c.label}</span>
      <span class="iso-decay-chip-count">${counts[c.id] || 0}</span>
    </button>
  `).join('');

  host.querySelectorAll('.iso-decay-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentDecayFilter = chip.dataset.mode;
      host.querySelectorAll('.iso-decay-chip.active').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyDecayFilter();
    });
  });
}

// Whether an isotope passes the active decay-mode filter chip. 'all' → every
// isotope; 'stable' → only stable ones (no half-life); any other value is a
// decay mode the isotope must list. Shared by the table rows and atom cards.
function isotopeMatchesDecayFilter(iso) {
  if (!iso) return false;
  if (currentDecayFilter === 'all') return true;
  if (currentDecayFilter === 'stable') return iso.hl == null;
  return !!(iso.dec && iso.dec.indexOf(currentDecayFilter) !== -1);
}

// Applies currentDecayFilter to table rows, atom cards, and the half-life
// chart. Abundance chart stays unfiltered (it inherently filters out radio-
// active isotopes already, since ab=null on most of them).
function applyDecayFilter() {
  // Filter table rows
  document.querySelectorAll('#iso-tbody tr.iso-row').forEach(tr => {
    const a = Number(tr.dataset.a);
    const m = tr.dataset.m === '1';
    const z = Number(tr.dataset.z);
    const iso = (ISOTOPES[z] || []).find(i => i.a === a && !!i.m === m);
    tr.classList.toggle('filtered-out', !(iso && isotopeMatchesDecayFilter(iso)));
  });
  // Filter atom-cards
  document.querySelectorAll('#iso-model-row .atom-card').forEach(card => {
    const a = Number(card.dataset.a);
    const m = card.dataset.m === '1';
    const z = Number(card.dataset.z);
    const iso = (ISOTOPES[z] || []).find(i => i.a === a && !!i.m === m);
    card.classList.toggle('filtered-out', !(iso && isotopeMatchesDecayFilter(iso)));
  });
  // Redraw half-life chart with filtered subset
  if (typeof currentIsoZ === 'number') drawHalfLifeChart(currentIsoZ);
}

// ─── HALF-LIFE LOG CHART (Chart.js) ──────────────────────────────────────────
// Bar chart on a logarithmic Y axis spanning microseconds → gigayears. Stable
// isotopes are omitted (no half-life to plot). Bar color encodes primary decay
// mode so the chart and the filter chips visually align.
let isoHalfLifeChart = null;
async function drawHalfLifeChart(z) {
  const canvas = document.getElementById('iso-halflife-chart');
  const emptyMsg = document.getElementById('iso-halflife-empty');
  if (!canvas) return;
  await ensureChartJs();
  if (typeof Chart === 'undefined') return;

  const isos = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  // Only radioactive isotopes; honour current decay-mode filter (except
  // 'stable' which would yield nothing on a half-life chart).
  const filterMatch = (iso) => {
    if (currentDecayFilter === 'all') return true;
    if (currentDecayFilter === 'stable') return false;
    return iso.dec && iso.dec.indexOf(currentDecayFilter) !== -1;
  };
  const radio = isos.filter(i => i.hl != null && i.hl > 0 && filterMatch(i));

  if (isoHalfLifeChart) { isoHalfLifeChart.destroy(); isoHalfLifeChart = null; }

  if (radio.length === 0) {
    canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }
  canvas.style.display = 'block';
  if (emptyMsg) emptyMsg.hidden = true;

  const sorted = radio.slice().sort((p, q) => p.a - q.a);
  const el = ELEMENTS.find(e => e.z === z);
  const sym = el ? el.sym : 'X';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor   = isDark ? '#2E2C29' : '#e6e0d6';
  const textColor   = isDark ? '#928C84' : '#5A5550';
  const tooltipBg   = isDark ? 'rgba(20,20,18,.95)' : 'rgba(255,254,252,.97)';
  const tooltipText = isDark ? '#F2EFE9' : '#12100E';

  const labels = sorted.map(i => `${sym}-${i.a}${i.m ? 'm' : ''}`);
  const values = sorted.map(i => i.hl);
  const colors = sorted.map(i => decayColor((i.dec && i.dec[0]) || '', isDark));

  isoHalfLifeChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: _T('ptable.isoHalfLifeYAxis', 'Half-life (s, log)'),
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 3,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: ctx => isoChartTooltipExternal(ctx, sorted, el) }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Mono, monospace', size: 10.5 } }
        },
        y: {
          type: 'logarithmic',
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'DM Mono, monospace', size: 10 },
            callback: function (v) {
              // Render log ticks as compact powers of ten with a unit hint
              // when one is unambiguous (microseconds → gigayears).
              if (v <= 0) return '';
              const log = Math.log10(v);
              if (Math.abs(log - Math.round(log)) > 0.01) return '';
              return formatHalfLife(v, '');
            }
          }
        }
      }
    }
  });
}

// ─── ABUNDANCE BAR CHART (Chart.js) ──────────────────────────────────────────
// Renders abundances of all naturally-occurring (ab != null) isotopes of an
// element as a bar chart. Synthetic-only elements (Tc, Pm, transuranics) show
// the empty-state message instead.
let isoAbundanceChart = null;
async function drawAbundanceChart(z) {
  const canvas = document.getElementById('iso-abundance-chart');
  const emptyMsg = document.getElementById('iso-abundance-empty');
  if (!canvas) return;
  await ensureChartJs();
  if (typeof Chart === 'undefined') return;

  const isos = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  const natural = isos.filter(i => i.ab != null && i.ab > 0);

  if (isoAbundanceChart) { isoAbundanceChart.destroy(); isoAbundanceChart = null; }

  if (natural.length === 0) {
    canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }
  canvas.style.display = 'block';
  if (emptyMsg) emptyMsg.hidden = true;

  // Sort by mass number for a left-to-right chronological reading
  const sorted = natural.slice().sort((p, q) => p.a - q.a);
  const el = ELEMENTS.find(e => e.z === z);
  const sym = el ? el.sym : 'X';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const stableColor    = isDark ? '#34A872' : '#1E6A50';
  const radioColor     = isDark ? '#F59E0B' : '#D97706';
  const gridColor      = isDark ? '#2E2C29' : '#e6e0d6';
  const textColor      = isDark ? '#928C84' : '#5A5550';
  const tooltipBg      = isDark ? 'rgba(20,20,18,.95)' : 'rgba(255,254,252,.97)';
  const tooltipText    = isDark ? '#F2EFE9' : '#12100E';

  const labels = sorted.map(i => `${sym}-${i.a}${i.m ? 'm' : ''}`);
  const values = sorted.map(i => +(i.ab * 100).toFixed(5));
  const colors = sorted.map(i => i.hl == null ? stableColor : radioColor);

  isoAbundanceChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: _T('ptable.isoAbundanceTooltip', 'Abundance'),
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 3,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // Chart.js animation occasionally never completes in some embed contexts
      // (the animation rAF can be starved when the page is also driving Bohr's
      // rAF loop). Disable animation; the chart paints synchronously on init.
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: ctx => isoChartTooltipExternal(ctx, sorted, el) }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Mono, monospace', size: 10.5 } }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'DM Mono, monospace', size: 10 },
            callback: v => v + '%'
          }
        }
      }
    }
  });
}


// ─── ISOTOPE TOOLTIP — shared premium scientific card ─────────────────────────
// One reused floating node powers every isotope surface: table rows, model
// cards, the abundance + half-life charts, and any future element carrying the
// data hooks (.iso-row / .atom-card with data-z/a/m, or a generic
// [data-iso-tip="z-a-m"]). Content is built on demand from ELEMENTS + ISOTOPES
// only — every field is real or omitted, nothing invented. Desktop hover,
// keyboard focus and mobile tap; a fade with no flicker (single node, rebuilt
// only when the isotope changes, pointer-events:none so it never steals input).
function isoTipText(en, pt) { return trendLang() === 'pt' ? pt : en; }

function isoTipFind(z, a, m) {
  const list = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || null;
  return list ? (list.find(i => i.a === a && !!i.m === !!m) || null) : null;
}

// Resolve { el, iso, key } from a DOM trigger.
function isoTipResolve(node) {
  if (!node || !node.dataset) return null;
  let z, a, m;
  if (node.dataset.z != null && node.dataset.a != null) {
    z = +node.dataset.z; a = +node.dataset.a; m = node.dataset.m === '1';
  } else if (node.dataset.isoTip) {
    const p = String(node.dataset.isoTip).split('-');
    z = +p[0]; a = +p[1]; m = p[2] === '1' || p[2] === 'm';
  } else return null;
  const el = ELEMENTS.find(e => e.z === z), iso = isoTipFind(z, a, m);
  return (el && iso) ? { el, iso, key: z + '-' + a + '-' + (m ? 'm' : 'g') } : null;
}

const ISO_DECAY_PRETTY = { 'β-': 'β−', 'β+': 'β+', 'β−': 'β−', '2β-': '2β−' };
function isoTipDecay(dec, noneLabel) {
  if (!Array.isArray(dec)) return null;
  if (!dec.length) return noneLabel;
  return dec.map(d => ISO_DECAY_PRETTY[d] || d).join(' · ');
}

function isoTipHas(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function isoTipAbundance(iso) {
  if (!isoTipHas(iso, 'ab')) return null;
  if (iso.ab == null) return isoTipText('Trace', 'Traços');
  const f = (typeof formatAbundance === 'function') ? formatAbundance(iso.ab) : (iso.ab * 100).toFixed(3) + '%';
  return (!f || f === 'trace') ? isoTipText('Trace', 'Traços') : f;
}

function isoTipHalfLife(iso, stableLabel) {
  if (!isoTipHas(iso, 'hl') && !isoTipHas(iso, 'hlf')) return null;
  if (iso.hl == null) return iso.hlf && iso.hlf !== 'stable' ? iso.hlf : stableLabel;
  return (typeof formatHalfLife === 'function') ? formatHalfLife(iso.hl, iso.hlf || '') : (iso.hlf || null);
}

function isoTipCompositionRows(el, iso, labels) {
  const rows = [];
  const z = Number(el.z), a = Number(iso.a);
  if (Number.isFinite(z)) rows.push([labels.protons, z]);
  if (Number.isFinite(a) && Number.isFinite(z) && a >= z) rows.push([labels.neutrons, a - z]);
  if (Number.isFinite(z)) rows.push([labels.electrons, z]);
  return rows;
}

// Builds the card markup for one isotope. Only fields backed by the dataset or
// derived directly from Z/A render; missing source keys stay hidden.
function buildIsotopeCard(el, iso) {
  const esc = trendEscapeHtml;
  const aTxt = iso.a + (iso.m ? 'm' : '');
  const alias = iso.alias ? _T('ptable.isoAlias_' + iso.alias.toLowerCase(), iso.alias) : '';
  const stable = (iso.hl == null);

  const L = {
    comp: isoTipText('Composition', 'Composição'),
    protons: isoTipText('Protons', 'Prótons'),
    neutrons: isoTipText('Neutrons', 'Nêutrons'),
    electrons: isoTipText('Electrons', 'Elétrons'),
    ab: isoTipText('Natural Abundance', 'Abundância Natural'), hl: isoTipText('Half-Life', 'Meia-Vida'),
    dec: isoTipText('Decay', 'Decaimento'), stab: isoTipText('Stability', 'Estabilidade'),
    none: isoTipText('None', 'Nenhum'),
    stable: isoTipText('Stable', 'Estável'),
    radioactive: isoTipText('Radioactive', 'Radioativo')
  };
  const row = (k, v) => `<div class="iso-tip-row"><span class="iso-tip-k">${esc(k)}</span><span class="iso-tip-v">${esc(v)}</span></div>`;
  const compRows = isoTipCompositionRows(el, iso, L).map(([k, v]) => row(k, v)).join('');
  const abVal = isoTipAbundance(iso);
  const halfVal = isoTipHalfLife(iso, L.stable);
  const decVal = isoTipDecay(iso.dec, L.none);
  const stabVal = stable ? L.stable : L.radioactive;

  let dataRows = '';
  if (abVal) dataRows += row(L.ab, abVal);
  if (halfVal) dataRows += row(L.hl, halfVal);
  if (decVal) dataRows += row(L.dec, decVal);
  dataRows += `<div class="iso-tip-row"><span class="iso-tip-k">${esc(L.stab)}</span>` +
              `<span class="iso-tip-badge ${stable ? 'is-stable' : 'is-radio'}">${esc(stabVal)}</span></div>`;

  return `<div class="iso-tip-title-row">` +
           `<div><div class="iso-tip-title">${esc(elName(el))}-${esc(aTxt)}</div>` +
           (alias ? `<div class="iso-tip-alias">${esc(alias)}</div>` : '') +
           `</div><div class="iso-tip-notation">${esc(el.sym)}-${esc(aTxt)}</div>` +
         `</div>` +
         (compRows ? `<div class="iso-tip-sep"></div><div class="iso-tip-section"><div class="iso-tip-comp-k">${esc(L.comp)}</div><div class="iso-tip-rows iso-tip-comp-rows">${compRows}</div></div>` : '') +
         (dataRows ? `<div class="iso-tip-sep"></div><div class="iso-tip-rows">${dataRows}</div>` : '');
}

let isoTipNode = null, isoTipKey = null, isoTipWired = false;
function isoTipGetNode() {
  if (isoTipNode && document.body.contains(isoTipNode)) return isoTipNode;
  isoTipNode = document.createElement('div');
  isoTipNode.id = 'iso-tip';
  isoTipNode.setAttribute('role', 'tooltip');
  isoTipNode.setAttribute('aria-hidden', 'true');
  document.body.appendChild(isoTipNode);
  return isoTipNode;
}
// Fixed-positioned (so no scroll-container clipping); placed below the anchor,
// flipping above when there's no room, centred and clamped to the viewport.
function positionIsoTip(rect) {
  const tip = isoTipGetNode();
  const vw = window.innerWidth, vh = window.innerHeight, m = 8, gap = 8;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let top = rect.bottom + gap;
  if (top + th > vh - m) { const above = rect.top - gap - th; top = above >= m ? above : Math.max(m, vh - th - m); }
  let left = rect.left + rect.width / 2 - tw / 2;
  left = Math.max(m, Math.min(left, vw - tw - m));
  tip.style.left = Math.round(left) + 'px';
  tip.style.top  = Math.round(top) + 'px';
}
function showIsoTipFor(node) {
  const r = isoTipResolve(node);
  if (!r) return;
  const tip = isoTipGetNode();
  if (isoTipKey !== r.key) { tip.innerHTML = buildIsotopeCard(r.el, r.iso); isoTipKey = r.key; }
  if (node.setAttribute) node.setAttribute('aria-describedby', 'iso-tip');
  positionIsoTip(node.getBoundingClientRect());
  tip.setAttribute('aria-hidden', 'false');
  tip.classList.add('visible');
}
function showIsoTipAtRect(el, iso, rect) {
  if (!el || !iso) return;
  const tip = isoTipGetNode();
  const key = el.z + '-' + iso.a + '-' + (iso.m ? 'm' : 'g');
  if (isoTipKey !== key) { tip.innerHTML = buildIsotopeCard(el, iso); isoTipKey = key; }
  positionIsoTip(rect);
  tip.setAttribute('aria-hidden', 'false');
  tip.classList.add('visible');
}
function hideIsoTip() {
  if (!isoTipNode) return;
  isoTipNode.classList.remove('visible');
  isoTipNode.setAttribute('aria-hidden', 'true');
}

// Chart.js external tooltip → the shared card (used by the abundance + half-life
// charts). isos is the per-chart sorted isotope array; dataIndex maps into it.
function isoChartTooltipExternal(context, isos, el) {
  const tooltip = context.tooltip;
  if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints || !tooltip.dataPoints.length) { hideIsoTip(); return; }
  const iso = isos[tooltip.dataPoints[0].dataIndex];
  if (!iso || !el) { hideIsoTip(); return; }
  const r = context.chart.canvas.getBoundingClientRect();
  const x = r.left + tooltip.caretX, y = r.top + tooltip.caretY;
  showIsoTipAtRect(el, iso, { left: x, right: x, top: y - 8, bottom: y + 8, width: 0, height: 16 });
}

// Wire the delegated hover / focus / tap handlers once. Document-level
// delegation = O(1) listeners regardless of how many isotopes are on screen.
function initIsoTooltips() {
  if (isoTipWired) return;
  isoTipWired = true;
  const TRIG = '.iso-row[data-a], .atom-card[data-a], [data-iso-tip]';
  const closestTrig = n => (n && n.closest) ? n.closest(TRIG) : null;

  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;          // touch handled on tap
    const t = closestTrig(e.target);
    if (t) showIsoTipFor(t);
  });
  document.addEventListener('pointerout', e => {
    if (e.pointerType === 'touch') return;
    const t = closestTrig(e.target);
    if (!t) return;
    const rel = e.relatedTarget;
    if (rel && (closestTrig(rel) || (isoTipNode && isoTipNode.contains(rel)))) return;  // moving to another trigger → let pointerover swap (no flicker)
    hideIsoTip();
  });
  document.addEventListener('focusin', e => { const t = closestTrig(e.target); if (t) showIsoTipFor(t); });
  document.addEventListener('focusout', e => { if (closestTrig(e.target)) hideIsoTip(); });
  document.addEventListener('click', e => {
    const t = closestTrig(e.target);
    if (t) showIsoTipFor(t);                          // tap shows; the element's own click still selects
    else if (isoTipNode && isoTipNode.classList.contains('visible')) hideIsoTip();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideIsoTip(); });
  window.addEventListener('scroll', hideIsoTip, true);
  window.addEventListener('resize', hideIsoTip);
}

// ════════════ NAVIGATION ════════════
const PAGE_NAMES = {
  periodic:     'Periodic Table',
  models:       'Visualizador',
  calc:         'Calculators',
  organic:      'Organic Chemistry',
  gases:        'Gas Laws',
  solutions:    'Solutions',
  coligativas:  'Colligative Properties',
  equilibrio:   'Ionic Equilibrium and pH',
  electroch:    'Electrochemistry',
  thermochem:   'Thermochemistry',
  nuclear:      'Radioactivity and Nuclear',
  polymers:     'Polymers',
  enviroment:   'Environmental Chemistry',
  biochem:      'Biochemistry',
  labvirtual:   'Virtual Laboratory',
  history:      'History of Chemistry',
  reactions:    'Reaction Balancer',
  stoich:       'Stoichiometry',
  flashcards:   'Flashcards',
  quiz:         'Exam Mocks',
  mindmap:      'Mind Map',
  settings:     'Settings'
};

const PAGE_ICONS = {
  periodic:     '🔬',
  models:       '⚛️',
  calc:         '🧮',
  organic:      '🌿',
  gases:        '💨',
  solutions:    '💧',
  coligativas:  '🧂',
  equilibrio:   '⚖️',
  electroch:    '⚡',
  thermochem:   '🔥',
  nuclear:      '☢️',
  polymers:     '🧱',
  enviroment:   '🌍',
  biochem:      '🧬',
  labvirtual:   '🔭',
  history:      '📜',
  reactions:    '⚗️',
  stoich:       '📐',
  flashcards:   '🃏',
  quiz:         '📝',
  mindmap:      '🧠'
};

function showPage(page, navEl) {
  try {
    const ds = document.getElementById('ds-scope');
    if (ds) {
      const map = { periodic:'PERIODIC.TBL', atomos:'ATOMIC.MOD', calc:'CALC.SUITE', organic:'ORGANIC.CHEM', gases:'GAS.LAWS', solutions:'SOLUTIONS', coligativas:'COLIGATIVE', equilibrio:'EQUILIBRIUM', history:'HISTORY', reactions:'REACTIONS', stoich:'STOICH', thermochem:'THERMOCHEM', electroch:'ELECTROCHEM', nuclear:'NUCLEAR', polymers:'POLYMERS', biochem:'BIOCHEM', enviroment:'ENVIRONMENT', labvirtual:'LAB.VIRT', flashcards:'FLASHCARDS', quiz:'QUIZ', mindmap:'MINDMAP', settings:'SETTINGS' };
      ds.textContent = map[page] || page.toUpperCase();
    }
    const dss = document.getElementById('ds-selected');
    if (dss) dss.textContent = '—';
  } catch(e){}
  // nav active
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  // breadcrumb
  document.getElementById('bc-current').textContent = PAGE_NAMES[page] || page;

  // pages
  const pgPeriodic = document.getElementById('pg-periodic');
  const pgOther    = document.getElementById('pg-other');
  const searchInput = document.getElementById('search-input');

  if (page === 'periodic') {
    pgPeriodic.style.display = 'flex';
    pgOther.classList.remove('show');
    pgOther.style.display = 'none';
    searchInput.disabled = false;
    searchInput.value = '';
    doSearch('');
    clearFilter();
  } else {
    pgPeriodic.style.display = 'none';
    pgOther.style.display = 'flex';
    pgOther.classList.add('show');
    searchInput.disabled = true;
    searchInput.value = '';
    document.getElementById('dev-title').textContent = PAGE_NAMES[page] + ' — Em breve';
    const icon = document.querySelector('.dev-icon');
    if (icon) icon.textContent = PAGE_ICONS[page] || '🔬';
  }
  return false;
}

// ════════════ DARK MODE ════════════
function applyTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('atomurus-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  // Update settings segmented buttons
  document.querySelectorAll('#theme-seg .seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === (isDark ? 'dark' : 'light'));
  });
  // Redraw Bohr if modal open
  if (currentElement && document.getElementById('overlay').classList.contains('open')) {
    drawBohr(currentElement);
  }
  requestAnimationFrame(() => requestAnimationFrame(drawFBlockConnectors));
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
}

function setTheme(val) {
  applyTheme(val === 'dark');
}

function updateThemeIcon(isDark) {
  const updateIcon = (icon) => {
    if (!icon) return;
    if (isDark) {
      icon.innerHTML = `<path d="M7.5 1.5A6 6 0 1 0 13.5 7.5a4.5 4.5 0 0 1-6-6z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
    } else {
      icon.innerHTML = `<path d="M7.5 1v1M7.5 13v1M1 7.5H0M15 7.5h-1M2.93 2.93l.7.7M11.37 11.37l.7.7M2.93 12.07l.7-.7M11.37 3.63l.7-.7M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`;
    }
  };
  updateIcon(document.getElementById('theme-icon'));
}

// ════════════ ELEMENT SIZE ════════════
function setElSize(size) {
  const root = document.documentElement;
  const sizes = {
    sm: { cell: '50px', sym: '16px' },
    md: { cell: '62px', sym: '22px' },
    lg: { cell: '76px', sym: '28px' }
  };
  const s = sizes[size] || sizes.md;
  root.style.setProperty('--el-cell',     s.cell);
  root.style.setProperty('--el-sym-size', s.sym);
  localStorage.setItem('atomurus-elsize', size);
  document.querySelectorAll('.settings-segmented').forEach(seg => {
    const btns = seg.querySelectorAll('.seg-btn');
    let isSize = false;
    btns.forEach(b => { if (b.getAttribute('onclick') && b.getAttribute('onclick').indexOf('setElSize') >= 0) isSize = true; });
    if (isSize) btns.forEach(b => {
      const oc = b.getAttribute('onclick') || '';
      b.classList.toggle('active', oc.indexOf("'" + size + "'") >= 0);
    });
  });
}

// ════════════ HEATMAP SELECT (settings panel) ════════════
function setHeatmap(prop) {
  localStorage.setItem('atomurus-heatmap', prop);
  const tabSel = document.getElementById('hm-select');
  if (tabSel) tabSel.value = prop === 'category' ? tabSel.value : prop;
  if (prop === 'category') {
    removeHeatmap();
  } else {
    applyHeatmap(prop);
  }
}

// ════════════ F-BLOCK TOGGLE ════════════
function setFblock(show, btn) {
  if (btn) btn.classList.toggle('active', show);
  localStorage.setItem('atomurus-fblock', show ? '1' : '0');
  const targets = document.querySelectorAll('#ptable .fblock-row, #ptable .row-spacer');
  targets.forEach(el => { el.style.display = show ? '' : 'none'; });
  const svg = document.getElementById('fblock-connector-svg');
  if (svg) svg.style.display = show ? '' : 'none';
}

// ════════════ INIT ════════════
(function init() {
  // Restore theme
  const saved = localStorage.getItem('atomurus-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme === 'dark');

  buildTable();

  // SearchAction target: honor ?q=... query param so external search-box
  // entry from Google's sitelinks search works.
  try {
    const qp = new URLSearchParams(location.search).get('q');
    if (qp) {
      const si = document.getElementById('search-input');
      if (si) { si.value = qp; doSearch(qp); }
    }
  } catch (e) {}

  // Restore element size (sm/md/lg)
  const sz = localStorage.getItem('atomurus-elsize') || 'md';
  setElSize(sz);

  // Restore heatmap select (settings panel) — don't auto-apply since
  // applyHeatmap only supports a subset of props
  const hm = localStorage.getItem('atomurus-heatmap');
  const hmSettings = document.getElementById('heatmap-select');
  if (hmSettings && hm) hmSettings.value = hm;

  const fblock = localStorage.getItem('atomurus-fblock');
  const fblockBtn = document.getElementById('toggle-fblock');
  setFblock(fblock !== '0', fblockBtn);

  // Atomic mass now ON by default — only hide if user explicitly turned off.
  const mass = localStorage.getItem('atomurus-mass');
  const massBtn = document.getElementById('toggle-mass');
  const showMass = mass !== '0';
  if (massBtn) massBtn.classList.toggle('active', showMass);
  document.querySelectorAll('.el-mass').forEach(el => {
    el.style.display = showMass ? '' : 'none';
  });

  const anim = localStorage.getItem('atomurus-anim');
  const animBtn = document.getElementById('toggle-anim');
  if (anim === '0' && animBtn && animBtn.classList.contains('active')) {
    toggleAnimations(animBtn);
  }

  // Hash-routing: allow other pages (e.g. modelos-atomicos.html)
  // to navigate to a specific sidebar entry via index.html#pageKey
  function routeFromHash() {
    const key = (location.hash || '').replace(/^#/, '');
    if (!key || !PAGE_NAMES[key]) return;
    const navEl = document.querySelector(`.nav-item[onclick*="showPage('${key}'"]`);
    showPage(key, navEl || null);
  }
  routeFromHash();
  window.addEventListener('hashchange', routeFromHash);

  // — Deep link: #q=Fe or #q=26 or #q=hydrogen focuses an element —
  function routeQueryFromHash() {
    const h = (location.hash || '').replace(/^#/, '');
    const m = h.match(/^q=(.+)$/);
    if (!m) return;
    const q = decodeURIComponent(m[1]).trim();
    if (!q) return;
    const lower = q.toLowerCase();
    // Find an exact match: by symbol, atomic number, or name
    let hit = (typeof ELEMENTS !== 'undefined' ? ELEMENTS : []).find(e =>
      String(e.z) === q ||
      e.sym.toLowerCase() === lower ||
      e.name.toLowerCase() === lower
    );
    if (!hit) {
      // fall back to a "starts with name" match
      hit = (typeof ELEMENTS !== 'undefined' ? ELEMENTS : []).find(e =>
        e.name.toLowerCase().startsWith(lower) ||
        e.sym.toLowerCase().startsWith(lower)
      );
    }
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = q;
      if (typeof doSearch === 'function') doSearch(q);
    }
    if (hit && typeof openModal === 'function') {
      setTimeout(() => openModal(hit), 80);
    }
  }
  // Run after element grid renders
  setTimeout(routeQueryFromHash, 200);
  window.addEventListener('hashchange', routeQueryFromHash);

  // Subpage routing: if body has data-pt-tab="<tab>", activate that tab.
  // Used by /periodic-table/heatmap, /periodic-table/trends, etc.
  // The CSS already prevents FOUC; this triggers the JS init (initCompare,
  // initIsotopes, renderTrendChart, applyHeatmap) for the active tab.
  const ptTab = document.body.getAttribute('data-pt-tab');
  if (ptTab && ptTab !== 'tabela') {
    const btn = document.querySelector('.pt-tab[data-tab="' + ptTab + '"]');
    if (typeof switchTab === 'function') switchTab(ptTab, btn);
  }
})();

// ════════════ F-BLOCK CONNECTOR LINES ════════════
function drawFBlockConnectors() {
  const svg     = document.getElementById('fblock-connector-svg');
  const wrapper = document.getElementById('table-with-connector');
  const ptable  = document.getElementById('ptable');
  if (!svg || !wrapper || !ptable) return;

  const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
  const color    = isDark ? 'rgba(148,100,210,0.85)' : 'rgba(100,50,180,0.75)';
  const textCol  = isDark ? 'rgba(190,160,240,0.9)'  : 'rgba(80,30,160,0.85)';

  svg.innerHTML = '';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const wRect  = wrapper.getBoundingClientRect();

  function rel(el) {
    const r = el.getBoundingClientRect();
    return {
      left:   r.left   - wRect.left,
      right:  r.right  - wRect.left,
      top:    r.top    - wRect.top,
      bottom: r.bottom - wRect.top,
      cx:     r.left + r.width  / 2 - wRect.left,
      cy:     r.top  + r.height / 2 - wRect.top,
      w: r.width, h: r.height
    };
  }

  // Find placeholders and La/Ac cards
  let phLa, phAc;
  ptable.querySelectorAll('.el-ph').forEach(el => {
    if (el.title.includes('57')) phLa = el;
    if (el.title.includes('89')) phAc = el;
  });
  const laCard = ptable.querySelector('[data-z="57"]');
  const acCard = ptable.querySelector('[data-z="89"]');
  if (!phLa || !phAc || !laCard || !acCard) return;

  const rPhLa = rel(phLa);
  const rPhAc = rel(phAc);
  const rLa   = rel(laCard);
  const rAc   = rel(acCard);

  // Size SVG to wrapper
  const W = wrapper.offsetWidth;
  const H = wrapper.offsetHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width',  W);
  svg.setAttribute('height', H);

  const SW     = 2.0;
  const spineX = rPhLa.left - 12;

  const entryLa = { x: rPhLa.left, y: rPhLa.bottom };
  const entryAc = { x: rPhAc.left, y: rPhAc.bottom };

  const armY_La = rLa.cy;
  const armY_Ac = rAc.cy;

  const spineTop = entryLa.y;
  const spineBot = armY_Ac;

  function seg(x1, y1, x2, y2) {
    const l = document.createElementNS(SVG_NS, 'line');
    l.setAttribute('x1', x1.toFixed(1)); l.setAttribute('y1', y1.toFixed(1));
    l.setAttribute('x2', x2.toFixed(1)); l.setAttribute('y2', y2.toFixed(1));
    l.setAttribute('stroke', color);
    l.setAttribute('stroke-width', SW);
    l.setAttribute('stroke-linecap', 'round');
    svg.appendChild(l);
  }

  function arrow(tx, ty) {
    const s = 5, w = 3.5;
    const path = document.createElementNS(SVG_NS, 'polygon');
    path.setAttribute('points', `${tx},${ty} ${tx-s},${ty-w} ${tx-s},${ty+w}`);
    path.setAttribute('fill', color);
    svg.appendChild(path);
  }

  function lbl(x, y, str) {
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', x.toFixed(1));
    t.setAttribute('y', y.toFixed(1));
    t.setAttribute('text-anchor', 'start');
    t.setAttribute('fill', textCol);
    t.setAttribute('font-size', '9.5');
    t.setAttribute('font-family', "'DM Mono', monospace");
    t.setAttribute('font-style', 'italic');
    t.setAttribute('font-weight', '500');
    t.textContent = str;
    svg.appendChild(t);
  }

  // Vertical spine
  seg(spineX, spineTop, spineX, spineBot);

  // Horizontal lead from phLa bottom-left → spine
  seg(entryLa.x, entryLa.y, spineX, entryLa.y);

  // Horizontal lead from phAc bottom-left → spine
  seg(entryAc.x, entryAc.y, spineX, entryAc.y);

  // Arm: spine → La (with arrowhead)
  seg(spineX, armY_La, rLa.left, armY_La);
  arrow(rLa.left, armY_La);

  // Arm: spine → Ac (with arrowhead)
  seg(spineX, armY_Ac, rAc.left, armY_Ac);
  arrow(rAc.left, armY_Ac);

  // Labels just to the right of the spine, above each arm
  lbl(spineX + 6, armY_La - 4, _T('ptable.fblockLanthanides', 'Lantanídeos (57–71)'));
  lbl(spineX + 6, armY_Ac - 4, _T('ptable.fblockActinides',   'Actinídeos (89–103)'));
}

// Re-draw connectors on theme change & resize
window.addEventListener('resize', () => {
  requestAnimationFrame(() => requestAnimationFrame(drawFBlockConnectors));
});

/* ─── DOWNLOAD STATE ─── */
let _dlFormat = 'png';

function dlSwitch(fmt) {
  _dlFormat = fmt;
  document.getElementById('dl-png-btn').classList.toggle('active', fmt === 'png');
  document.getElementById('dl-pdf-btn').classList.toggle('active', fmt === 'pdf');
  document.getElementById('dl-action-label').textContent = fmt === 'png' ? 'Baixar PNG' : 'Baixar PDF';
}

async function downloadTable() {
  const btn = document.getElementById('dl-action-btn');
  btn.classList.add('loading');
  document.getElementById('dl-action-label').textContent = 'Gerando…';

  try {
    await ensureHtml2Canvas();
    if (_dlFormat === 'pdf') await ensureJsPdf();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#111210' : '#F4F1EC';
    const surfaceColor = isDark ? '#1A1918' : '#FDFCFA';
    const borderColor = isDark ? '#2E2C29' : '#E6E0D6';
    const textColor = isDark ? '#F0EDE8' : '#1A1814';
    const text2Color = isDark ? '#9A948C' : '#6B6560';
    const accentColor = isDark ? '#34A872' : '#1E6A50';
    const scale = 3;

    // ── 1. Capture the table ──
    const target = document.getElementById('table-with-connector');
    const tableCanvas = await html2canvas(target, {
      scale,
      useCORS: true,
      backgroundColor: bgColor,
      logging: false,
      x: -8, y: -8,
      width: target.offsetWidth + 16,
      height: target.offsetHeight + 16,
    });

    // ── 2. Build the legend strip ──
    // Labels go through I18N so the rendered PNG matches the current language.
    // The plural ptable.legend* strings are reused (e.g. "Diatomic Nonmetals").
    const CATS = [
      { key: 'nonmetal',   label: _T('ptable.legendNonmetal',   'Não-Metais'),                bg: isDark ? '#1A3A1A' : '#D2EDD2', border: isDark ? '#2A5A2A' : '#B0D8B0', text: isDark ? '#7ECC7E' : '#1E5C1E' },
      { key: 'noble',      label: _T('ptable.legendNoble',      'Gases Nobres'),              bg: isDark ? '#2E2800' : '#FFF0C0', border: isDark ? '#4A4000' : '#E8D080', text: isDark ? '#D4AA30' : '#7A5500' },
      { key: 'alkali',     label: _T('ptable.legendAlkali',     'Metais Alcalinos'),          bg: isDark ? '#2E1010' : '#FFD4D4', border: isDark ? '#4A2020' : '#F0A0A0', text: isDark ? '#E08080' : '#8B1818' },
      { key: 'alkaline',   label: _T('ptable.legendAlkaline',   'Alcalino-Terrosos'),         bg: isDark ? '#2E1E00' : '#FFE4C0', border: isDark ? '#4A3000' : '#F0C080', text: isDark ? '#E0A860' : '#7A4200' },
      { key: 'metalloid',  label: _T('ptable.legendMetalloid',  'Metaloides'),                bg: isDark ? '#1A1430' : '#E4DEFF', border: isDark ? '#2C2050' : '#C0B0F8', text: isDark ? '#A898F0' : '#3A2680' },
      { key: 'polyatomic', label: _T('ptable.legendPolyatomic', 'Não-metais Poliatômicos'),   bg: isDark ? '#0C2030' : '#D4ECFA', border: isDark ? '#183040' : '#98CCEC', text: isDark ? '#70C0E8' : '#0E4E70' },
      { key: 'posttrans',  label: _T('ptable.legendPosttrans',  'Metais Pós-Transição'),      bg: isDark ? '#142010' : '#E4EED8', border: isDark ? '#203420' : '#B8D498', text: isDark ? '#88C868' : '#2E520E' },
      { key: 'transition', label: _T('ptable.legendTransition', 'Metais de Transição'),       bg: isDark ? '#201E18' : '#EAE5DC', border: isDark ? '#302E24' : '#CECAAA', text: isDark ? '#B0A888' : '#3E3820' },
      { key: 'lanthanide', label: _T('ptable.legendLanthanide', 'Lantanídeos'),               bg: isDark ? '#280C22' : '#F4DCED', border: isDark ? '#3C1438' : '#D8A8CC', text: isDark ? '#D088C0' : '#680056' },
      { key: 'actinide',   label: _T('ptable.legendActinide',   'Actinídeos'),                bg: isDark ? '#280C14' : '#F0DDE4', border: isDark ? '#3C1422' : '#D8A8B8', text: isDark ? '#D08098' : '#6A1830' },
    ];

    const TW = tableCanvas.width;
    const PAD = 28 * scale;
    const LEGEND_H = 110 * scale;
    const FOOTER_H = 44 * scale;
    const HEADER_H = 60 * scale;
    const TOTAL_H = HEADER_H + tableCanvas.height + LEGEND_H + FOOTER_H;

    const out = document.createElement('canvas');
    out.width  = TW + PAD * 2;
    out.height = TOTAL_H;
    const ctx = out.getContext('2d');

    // ── Background ──
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, out.width, out.height);

    // ── Header ──
    const hY = 0;
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(0, hY, out.width, HEADER_H);
    // bottom border of header
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(out.width, HEADER_H); ctx.stroke();

    // Logo atom icon (simplified circles)
    const lx = PAD + 18 * scale, ly = HEADER_H / 2;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath(); ctx.arc(lx, ly, 10 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx, ly, 10 * scale, 0, Math.PI * 2);
    ctx.save(); ctx.rotate(Math.PI / 3); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(lx, ly, 10 * scale, 0, Math.PI * 2);
    ctx.save(); ctx.rotate(-Math.PI / 3); ctx.stroke(); ctx.restore();
    ctx.fillStyle = accentColor;
    ctx.beginPath(); ctx.arc(lx, ly, 3 * scale, 0, Math.PI * 2); ctx.fill();

    // Title
    ctx.fillStyle = textColor;
    ctx.font = `600 ${17 * scale}px 'DM Serif Display', Georgia, serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('Atomurus', lx + 18 * scale, ly - 5 * scale);
    ctx.fillStyle = text2Color;
    ctx.font = `${9 * scale}px 'DM Sans', Arial, sans-serif`;
    ctx.fillText(_T('ptable.canvasFooterLong', 'Periodic Table dos Elementos · 118 elementos'), lx + 18 * scale, ly + 10 * scale);

    // Right: date + version (locale follows the current UI language)
    const _dateLocale = (window.I18N && I18N.lang === 'pt') ? 'pt-BR' : 'en-US';
    const dateStr = new Date().toLocaleDateString(_dateLocale, { day: '2-digit', month: 'long', year: 'numeric' });
    ctx.textAlign = 'right';
    ctx.fillStyle = text2Color;
    ctx.font = `${9 * scale}px 'DM Mono', monospace`;
    ctx.fillText(dateStr, out.width - PAD, ly - 5 * scale);
    ctx.font = `${8.5 * scale}px 'DM Sans', Arial, sans-serif`;
    ctx.fillText('atomurus.com · v5.0', out.width - PAD, ly + 9 * scale);
    ctx.textAlign = 'left';

    // ── Table image ──
    ctx.drawImage(tableCanvas, PAD, HEADER_H);

    // ── Legend panel ──
    const legY = HEADER_H + tableCanvas.height;
    // legend bg with top border
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(0, legY, out.width, LEGEND_H);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(0, legY); ctx.lineTo(out.width, legY); ctx.stroke();

    // "Legenda" label
    ctx.fillStyle = text2Color;
    ctx.font = `700 ${8 * scale}px 'DM Sans', Arial, sans-serif`;
    ctx.letterSpacing = `${1.2 * scale}px`;
    ctx.fillText(_T('ptable.canvasCatLegend', 'LEGENDA DE CATEGORIAS'), PAD, legY + 20 * scale);
    ctx.letterSpacing = '0px';

    // Draw category chips
    const CHIP_W  = 148 * scale;
    const CHIP_H  = 24 * scale;
    const CHIP_GAP_X = 10 * scale;
    const CHIP_GAP_Y = 8 * scale;
    const CHIP_R  = 6 * scale;
    const DOT_R   = 5 * scale;
    const COLS    = Math.floor((out.width - PAD * 2 + CHIP_GAP_X) / (CHIP_W + CHIP_GAP_X));
    const startLegX = PAD;
    const startLegY = legY + 32 * scale;

    CATS.forEach((cat, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx2 = startLegX + col * (CHIP_W + CHIP_GAP_X);
      const cy2 = startLegY + row * (CHIP_H + CHIP_GAP_Y);

      // chip background
      ctx.fillStyle = cat.bg;
      ctx.strokeStyle = cat.border;
      ctx.lineWidth = 1.2 * scale;
      roundRect(ctx, cx2, cy2, CHIP_W, CHIP_H, CHIP_R);
      ctx.fill(); ctx.stroke();

      // colored dot
      ctx.fillStyle = cat.text;
      ctx.beginPath();
      ctx.arc(cx2 + 10 * scale, cy2 + CHIP_H / 2, DOT_R, 0, Math.PI * 2);
      ctx.fill();

      // label
      ctx.fillStyle = cat.text;
      ctx.font = `500 ${8.5 * scale}px 'DM Sans', Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.label, cx2 + 20 * scale, cy2 + CHIP_H / 2);
    });

    // ── Footer ──
    const footY = legY + LEGEND_H;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, footY, out.width, FOOTER_H);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(0, footY); ctx.lineTo(out.width, footY); ctx.stroke();

    ctx.fillStyle = text2Color;
    ctx.font = `${8.5 * scale}px 'DM Sans', Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(_T('ptable.canvasFooter', '© 2025 Atomurus · Dados baseados em IUPAC 2021 · Massas atômicas em u (unidades de massa atômica)'), PAD, footY + FOOTER_H / 2);
    ctx.textAlign = 'right';
    ctx.fillText(_T('ptable.canvasGeneratedBy', 'Gerado por Atomurus · atomurus.com'), out.width - PAD, footY + FOOTER_H / 2);
    ctx.textAlign = 'left';

    // ── Output ──
    const imgData = out.toDataURL('image/png');

    const activeFilter = document.querySelector('.legend-item.active-filter');
    const _suffix = activeFilter && activeFilter.dataset.cat ? '-' + activeFilter.dataset.cat : '';
    const _baseName = ('atomurus-tabela-periodica' + _suffix)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    if (_dlFormat === 'png') {
      const link = document.createElement('a');
      link.download = _baseName + '.png';
      link.href = imgData;
      link.click();
    } else {
      const { jsPDF } = window.jspdf;
      const pxW = out.width  / scale;
      const pxH = out.height / scale;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pxW, pxH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pxW, pxH);

      // PDF metadata
      pdf.setProperties({
        title:    _T('ptable.pdfTitle',    'Periodic Table dos Elementos — Atomurus'),
        subject:  _T('ptable.pdfSubject',  '118 elementos com categorias, propriedades e legenda'),
        author:   'Atomurus · atomurus.com',
        keywords: _T('ptable.pdfKeywords', 'Periodic Table, química, elementos, atomurus'),
        creator:  'Atomurus v5.0'
      });

      pdf.save(_baseName + '.pdf');
    }
  } catch(e) {
    console.error('Download error:', e);
    alert('Erro ao gerar arquivo. Tente novamente.');
  }

  btn.classList.remove('loading');
  document.getElementById('dl-action-label').textContent = _dlFormat === 'png' ? 'Baixar PNG' : 'Baixar PDF';
}

// Helper: rounded rect path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── MOBILE SIDEBAR ──
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobile-overlay');
  const isOpen = sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

// ── Expandable nav group (Visualizador) ──
function toggleNavGroup(name){
  const el = document.querySelector('.nav-expandable[data-expand="'+name+'"]');
  if (!el) return;
  const open = !el.classList.contains('open');
  el.classList.toggle('open', open);
  const row = el.querySelector('.nav-row');
  if (row) row.setAttribute('aria-expanded', open ? 'true' : 'false');
  try { localStorage.setItem('atomurus-nav-' + name, open ? '1' : '0'); } catch(e){}
}
(function initExpandable(){
  document.querySelectorAll('.nav-expandable').forEach(function(el){
    const name = el.dataset.expand;
    const hasActive = !!el.querySelector('.nav-item.active, [aria-current="page"]');
    let stored = null;
    try { stored = localStorage.getItem('atomurus-nav-' + name); } catch(e){}
    if (hasActive || stored === '1') {
      el.classList.add('open');
      const row = el.querySelector('.nav-row');
      if (row) row.setAttribute('aria-expanded', 'true');
    }
    if (hasActive) el.classList.add('has-active');
    const row = el.querySelector('.nav-row');
    if (row) row.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNavGroup(name); }
    });
  });
})();

// Close mobile sidebar when a nav item is clicked on mobile
document.querySelectorAll('.nav-item').forEach(function(item) {
  item.addEventListener('click', function() {
    if (window.innerWidth <= 900) toggleMobileSidebar();
  });
});

// Show mobile scroll hint on small screens + init mobile features
(function() {
  var isMobile = window.innerWidth <= 768;
  var hint = document.getElementById('mobile-scroll-hint');
  var catBar = document.getElementById('mobile-cat-bar');
  var zoomCtrl = document.getElementById('mobile-zoom-controls');
  if (isMobile) {
    if (hint) hint.style.display = 'flex';
    if (catBar) catBar.style.display = 'flex';
    if (zoomCtrl) zoomCtrl.style.display = 'flex';
    if (hint) setTimeout(function() { hint.style.opacity = '0'; hint.style.transition = 'opacity .5s'; setTimeout(function(){ hint.style.display = 'none'; }, 500); }, 5000);
  }

// ── MOBILE ZOOM ──
var _mobileScale = window.innerWidth <= 420 ? 0.54 : 0.68;
var _scaleSteps  = [0.42, 0.50, 0.58, 0.68, 0.78, 0.90];

function _bestReadableMobileScale() {
  var wrap = document.querySelector('.table-wrap');
  var root = getComputedStyle(document.documentElement);
  var cell = parseFloat(root.getPropertyValue('--el-cell')) || 62;
  var tableW = cell * 18 + 3 * 17;
  if (!wrap || !tableW) return _mobileScale;
  var fit = (wrap.clientWidth - 18) / tableW;
  var target = Math.max(0.42, Math.min(0.90, fit));
  return _scaleSteps.reduce(function(best, step) {
    return Math.abs(step - target) < Math.abs(best - target) ? step : best;
  }, _scaleSteps[0]);
}

function _applyMobileScale(s) {
  var twc = document.getElementById('table-with-connector');
  if (!twc) return;
  var totalH = 58 * 10 + 3 * 9 + 44;
  twc.style.transform = 'scale(' + s + ')';
  twc.style.marginBottom = 'calc(' + totalH + 'px * ' + (-(1-s)) + ')';
  var lbl = document.getElementById('mzc-label');
  if (lbl) lbl.textContent = Math.round(s * 100) + '%';
  _mobileScale = s;
  var wrap = document.querySelector('.table-wrap');
  if (wrap) {
    wrap.scrollLeft = Math.min(wrap.scrollLeft, wrap.scrollWidth - wrap.clientWidth);
    wrap.addEventListener('scroll', function() {
      var max = wrap.scrollWidth - wrap.clientWidth;
      if (wrap.scrollLeft > max) wrap.scrollLeft = max;
      if (wrap.scrollLeft < 0)   wrap.scrollLeft = 0;
    }, { passive: true });
  }
}

window.mobileZoom = function(dir) {
  if (window.innerWidth > 768) return;
  var best = 0, bestDiff = Infinity;
  _scaleSteps.forEach(function(s,i){ if(Math.abs(s-_mobileScale)<bestDiff){bestDiff=Math.abs(s-_mobileScale);best=i;} });
  var next = best + dir;
  if (next < 0 || next >= _scaleSteps.length) return;
  _applyMobileScale(_scaleSteps[next]);
};

if (isMobile) {
  _applyMobileScale(_bestReadableMobileScale());
}

function _syncMobileChips() {
  var activeCat = null;
  document.querySelectorAll('.legend-item').forEach(function(li){
    if (li.classList.contains('active-filter')) activeCat = li.dataset.cat;
  });
  document.querySelectorAll('.mobile-cat-chip[data-cat]').forEach(function(chip){
    chip.classList.toggle('dimmed', !!activeCat && chip.dataset.cat !== activeCat);
  });
}
document.querySelectorAll('.legend-item').forEach(function(li){
  li.addEventListener('click', function(){ setTimeout(_syncMobileChips,50); });
});
document.querySelectorAll('.mobile-cat-chip').forEach(function(chip){
  chip.addEventListener('click', function(){ setTimeout(_syncMobileChips,50); });
});


// Legacy _i18n + _t + setLanguage block removed — all UI translation now flows
// through window.I18N (see i18n.js). The block previously spanned ~280 lines
// and duplicated dictionary data already migrated into ptable.* / config.* /
// common.* namespaces. The new bindI18n() IIFE below is the single source of
// language change behaviour for this page.

// ════════════ I18N RE-RENDER ON LANGUAGE CHANGE ════════════
// The global I18N module (i18n.js) handles persistence + DOM translation of
// elements carrying data-i18n attributes. But the periodic-table app builds a
// lot of content from JS — element names in cells, the modal body, the iso
// list/details, the compare table. When the user toggles language we need to
// re-run those renderers so they pick up the new strings.
(function bindI18n() {
  var saved = (window.I18N && I18N.lang) || localStorage.getItem('atomurus-lang') || 'en';
  var sel = document.getElementById('lang-select');
  if (sel) sel.value = saved;
  if (!window.I18N) return;

  function refreshAll(lang) {
    if (sel) sel.value = lang;

    // 1. Re-paint element cards (titles + name spans).
    document.querySelectorAll('.el').forEach(function (card) {
      var z = parseInt(card.dataset.z, 10);
      var el = ELEMENTS.find(function (e) { return e.z === z; });
      if (!el) return;
      var nm = elName(el);
      var nmShort = nm.length > 10 ? nm.substring(0, 9) + '…' : nm;
      var nameSpan = card.querySelector('.el-name');
      if (nameSpan) nameSpan.textContent = nmShort;
      setElementCardMeta(card, el);
    });

    // 2. Refresh the modal if it's open — re-run openModal() with the
    //    currently-displayed element. The overlay uses class 'open' (not
    //    'show'); the painter is openModal() (not showElement). Both were
    //    wrong in the original implementation, which silently swallowed the
    //    error via try/catch and left the modal frozen in the old language.
    var overlay = document.getElementById('overlay');
    if (typeof currentElement !== 'undefined' && currentElement &&
        overlay && overlay.classList.contains('open') &&
        typeof openModal === 'function') {
      try { openModal(currentElement); } catch (e) { console.warn('i18n modal refresh failed:', e); }
    }

    // 3. Refresh the isotope list and active detail pane.
    if (typeof renderIsoList === 'function') {
      try { renderIsoList(); } catch (_) {}
    }
    var activeIso = document.querySelector('.iso-item.active');
    if (activeIso && typeof showIsotopes === 'function') {
      try { showIsotopes(parseInt(activeIso.dataset.z, 10)); } catch (_) {}
    }

    // 4. Refresh the compare table if elements are selected.
    if (typeof renderCompare === 'function') {
      try { renderCompare(); } catch (_) {}
    }

    // 4c. Refresh the trends chart so axis labels + caption follow the language.
    if (typeof renderTrendChart === 'function' && document.getElementById('trend-chart')) {
      try { renderTrendChart(); } catch (_) {}
    }

    // 4b. Refresh the element picker grid (118 buttons): update each .pc-nm
    //     span and rebuild data-name so the search box matches both PT/EN.
    document.querySelectorAll('.cmp-picker-cell').forEach(function (cell) {
      var z = parseInt(cell.dataset.z, 10);
      var el = ELEMENTS.find(function (e) { return e.z === z; });
      if (!el) return;
      var nm = elName(el);
      var nmSpan = cell.querySelector('.pc-nm');
      if (nmSpan) nmSpan.textContent = nm;
      var enFallback = (typeof _elNamesEN !== 'undefined' && _elNamesEN[el.z - 1]) || '';
      cell.dataset.name = (el.name + ' ' + enFallback).toLowerCase();
    });

    // 5. Refresh the legend (data-i18n on .legend-item is handled by I18N
    //    itself, but the heatmap select labels and any JS-rendered fragments
    //    benefit from a forced re-apply).
    I18N.apply();
    var search = document.getElementById('search-input');
    if (search) updateSearchSuggestions(search.value);
  }

  I18N.onChange(refreshAll);
})();


})();
