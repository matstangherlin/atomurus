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

function formatElementGroup(el) {
  if (!el) return '\u2014';
  // IUPAC group is null for the whole f-block. `col` is only the drawing slot.
  if (el.cat === 'lanthanide' || el.cat === 'actinide') {
    const lang = (document.documentElement.lang || '').toLowerCase();
    return _T('ptable.fBlockGroup', lang.indexOf('pt') === 0 ? 'bloco f' : 'f-block');
  }
  if (el.group == null || el.group === '') return '\u2014';
  return String(el.group);
}

function setElementCardMeta(card, el) {
  const extra = getExtra(el.z);
  const extra2 = getExtra2(el.z);
  const nm = elName(el);
  const shells = (extra.shells || []).join('·');
  const rows = [
    [_T('ptable.mState', 'Physical State'), stateName(el.state)],
    [_T('ptable.mPeriod', 'Period'), el.period || '—'],
    [_T('ptable.mGroup', 'Group'), formatElementGroup(el)],
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



// ── Modal focus (a11y): the closed overlay is inert and hidden from screen
// readers; opening it moves focus inside, Tab stays inside, and closing it
// gives focus back to what opened it (or to the current element's cell).
let modalReturnFocus = null;
function setModalHidden(overlay, hidden) {
  if (hidden) {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
  } else {
    overlay.removeAttribute('aria-hidden');
    overlay.removeAttribute('inert');
  }
}
function modalFocusables(modal) {
  return Array.from(modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('modal');
  if (!overlay || !modal || !overlay.classList.contains('open')) return;
  const items = modalFocusables(modal);
  if (!items.length) { e.preventDefault(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  if (!modal.contains(document.activeElement)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

function openModal(el) {
  currentElement = el;
  // Lab Console — update data strip selected indicator
  try {
    const ds = document.getElementById('ds-selected');
    if (ds) ds.textContent = 'Z=' + el.z + ' · ' + el.sym;
  } catch(e){}
  const overlay = document.getElementById('overlay');
  if (!overlay) return;
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
  document.getElementById('m-group').textContent  = formatElementGroup(el);

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

  const wasOpen = overlay.classList.contains('open');
  if (!wasOpen) modalReturnFocus = document.activeElement;
  setModalHidden(overlay, false);
  overlay.classList.add('open');
  if (!wasOpen) {
    const close = overlay.querySelector('.modal-close-corner');
    if (close) close.focus({ preventScroll: true });
  }
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
  const overlay = document.getElementById('overlay');
  const wasOpen = overlay.classList.contains('open');
  overlay.classList.remove('open');
  setModalHidden(overlay, true);
  if (wasOpen) {
    let back = modalReturnFocus;
    if (!back || !back.isConnected || back === document.body) {
      back = currentElement ? document.querySelector(`.el[data-z="${currentElement.z}"]`) : null;
    }
    modalReturnFocus = null;
    if (back && typeof back.focus === 'function') back.focus({ preventScroll: true });
  }
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

// ════════════ EXPORT (loaded on demand) ════════════
// The element PDF/PNG and the table PNG/PDF live in assets/pt/pt-export.js and
// are fetched the first time someone exports. Until then downloadElement and
// downloadTablePDF are stubs on window; the module's own function declarations
// replace them when it loads (prompt 24).
const PT_CORE_SRC = (document.currentScript && document.currentScript.src) || '';
let _ptExportPromise = null;

function loadPtExport() {
  if (_ptExportPromise) return _ptExportPromise;
  const root = document.documentElement;
  root.classList.add('pt-export-loading');
  _ptExportPromise = new Promise((resolve, reject) => {
    const version = (PT_CORE_SRC.match(/\?v=[^&#]*/) || [''])[0];
    const script = document.createElement('script');
    script.src = new URL('assets/pt/pt-export.js' + version, PT_CORE_SRC || location.href).href;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load pt-export'));
    document.head.appendChild(script);
  }).finally(() => root.classList.remove('pt-export-loading'));
  _ptExportPromise.catch(() => { _ptExportPromise = null; });
  return _ptExportPromise;
}

function ptExportStub(name) {
  const stub = function () {
    const args = arguments;
    return loadPtExport().then(() => {
      if (window[name] === stub) throw new Error('pt-export did not define ' + name);
      return window[name].apply(window, args);
    }, () => {
      window.alert(_T('ptable.exportLoadError', 'Could not load the export tool. Check your connection and try again.'));
    });
  };
  return stub;
}
window.downloadElement = ptExportStub('downloadElement');
window.downloadTablePDF = ptExportStub('downloadTablePDF');

function overlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

document.addEventListener('keydown', e => {
  // Don't intercept while typing in an input/textarea/select
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === 'Escape') {
    const cmpPicker = document.getElementById('cmp-picker-overlay');
    if (cmpPicker && cmpPicker.classList.contains('open') && typeof closeCompPicker === 'function') { closeCompPicker(); return; }
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
    return { label: 'Group ' + group, test: e => e.group != null && Number(e.group) === group };
  }
  const periodMatch = nq.match(/^(p|periodo|period|periodo)\s*(\d)$/);
  if (periodMatch) {
    const period = Number(periodMatch[2]);
    return { label: 'Period ' + period, test: e => Number(e.period) === period };
  }
  // Category aliases only for a query of 3+ letters that equals the term
  // or is a prefix of it. Never the other way: "na" must not hit "nao metal".
  if (nq.length < 3) return undefined;
  return SEARCH_ALIASES.find(alias => alias.terms.some(t => t === nq || t.startsWith(nq)));
}

function elementSearchNames(el) {
  const names = [];
  if (el.name) names.push(normSearch(el.name));
  if (typeof _elNamesEN !== 'undefined' && _elNamesEN[el.z - 1]) names.push(normSearch(_elNamesEN[el.z - 1]));
  if (typeof elName === 'function') {
    const current = normSearch(elName(el));
    if (current) names.push(current);
  }
  return names;
}

// Lower rank wins. null means the element is not a hit.
// 0 symbol, 1 atomic number, 2 exact name (PT and EN), 3 name prefix,
// 4 category alias, 5 substring fallback.
function searchRank(el, nq) {
  if (!nq) return 0;
  const sym = normSearch(el.sym);
  const names = elementSearchNames(el);
  let rank = null;
  if (sym === nq) rank = 0;
  else if (String(el.z) === nq) rank = 1;
  else if (names.some(n => n === nq)) rank = 2;
  else if (nq.length >= 2 && names.some(n => n.startsWith(nq))) rank = 3;

  const alias = getAliasMatcher(nq);
  if (alias) {
    // A category or group query is that set. Substring fallback stays off
    // so "alkali" does not also swallow "alkaline".
    if (alias.test(el)) rank = rank == null ? 4 : Math.min(rank, 4);
    return rank;
  }

  if (rank == null && nq.length >= 3) {
    const hay = normSearch([
      el.name,
      (typeof _elNamesEN !== 'undefined' && _elNamesEN[el.z - 1]) || '',
      (typeof elName === 'function' ? elName(el) : ''),
      el.cat,
      (typeof catName === 'function' ? catName(el) : ''),
      el.state,
      (typeof stateName === 'function' ? stateName(el.state) : '')
    ].join(' '));
    if (hay.includes(nq)) rank = 5;
  }
  return rank;
}

function elementMatchesSearch(el, nq) {
  if (!nq) return true;
  return searchRank(el, nq) != null;
}

function getSearchResults(q, limit) {
  const nq = normSearch(q);
  if (!nq) return [];
  return ELEMENTS
    .map(el => ({ el, rank: searchRank(el, nq) }))
    .filter(item => item.rank != null)
    .sort((a, b) => (a.rank - b.rank) || (a.el.z - b.el.z))
    .slice(0, limit || 8)
    .map(item => item.el);
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

  const ranked = [];
  document.querySelectorAll('.el').forEach(card => {
    const z    = card.dataset.z;
    const elem = ELEMENTS.find(e => String(e.z) === z);
    if (!elem) return;
    const rank = searchRank(elem, q);
    if (rank == null) {
      card.classList.add('dim');
      return;
    }
    card.classList.add('shine');
    ranked.push({ card, rank, z: elem.z });
  });
  ranked.sort((a, b) => a.rank - b.rank || a.z - b.z);
  if (ranked[0]) ranked[0].card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  // Page modules (assets/pt/*.js) are only on their own pages.
  if (tab === 'comparar' && typeof initCompare === 'function') {
    initCompare();
  }
  
  if (tab === 'grupos' && typeof renderTrendChart === 'function') {
    setTimeout(renderTrendChart, 100);
  }
  
  if (tab === 'isotopos' && typeof initIsotopes === 'function') {
    initIsotopes();
  }

  document.querySelectorAll('.pt-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  const tc = document.getElementById('tab-' + tab);
  if (tc) tc.classList.add('active');
}

// ─── HEATMAP LOGIC ───
// Numeric value for a heatmap property, or null when the element has no datum.
// atomic_radius is the settings-panel name for the same scale as radius.
function heatmapPropValue(z, prop) {
  const el = ELEMENTS.find(e => e.z === z);
  if (!el) return null;
  const key = prop === 'atomic_radius' ? 'radius' : prop;
  if (key === 'state' || key === 'category') return null;
  const ex = (typeof getExtra === 'function' ? getExtra(z) : {}) || {};
  const ex2 = (typeof getExtra2 === 'function' ? getExtra2(z) : {}) || {};
  let val = NaN;
  if (key === 'electronegativity') val = parseFloat(el.en);
  else if (key === 'radius') val = parseFloat(ex2.radius);
  else if (key === 'melt') val = parseFloat(ex.melt);
  else if (key === 'boil') val = parseFloat(ex.boil);
  else if (key === 'density') val = parseFloat(ex2.density);
  else if (key === 'mass') val = parseFloat(String(el.mass).replace(/[^0-9.]/g, ''));
  else if (key === 'ionization') {
    const raw = (typeof getIonization === 'function') ? getIonization(z) : undefined;
    val = typeof raw === 'number' ? raw : NaN;
  }
  return Number.isFinite(val) ? val : null;
}

// Physical state at 25 °C. Categorical — not a continuous scale.
function heatmapStateKey(el) {
  const s = normSearch(el && el.state);
  if (!s) return 'unknown';
  if (s.indexOf('solido') !== -1 || s === 'solid') return 'solid';
  if (s.indexOf('liquido') !== -1 || s === 'liquid') return 'liquid';
  if (s.indexOf('gas') !== -1) return 'gas';
  return 'unknown';
}

const HM_STATE_COLORS = {
  solid: '#8C6A3D',
  liquid: '#2F6FDB',
  gas: '#C45A28',
  unknown: ''
};

function heatmapStateLabel(key) {
  const table = {
    solid: ['ptable.hmStateSolid', 'Solid', 'Sólido'],
    liquid: ['ptable.hmStateLiquid', 'Liquid', 'Líquido'],
    gas: ['ptable.hmStateGas', 'Gas', 'Gás'],
    unknown: ['ptable.hmStateUnknown', 'Unknown', 'Desconhecido']
  };
  const row = table[key] || table.unknown;
  const lang = (document.documentElement.lang || '').toLowerCase();
  return _T(row[0], lang.indexOf('pt') === 0 ? row[2] : row[1]);
}

function paintHeatmapMissing(card) {
  card.style.background = 'var(--surface)';
  card.style.color = 'var(--text-3)';
  card.style.borderColor = 'var(--border)';
  card.removeAttribute('data-state');
}

function syncHeatmapLegend(prop) {
  document.querySelectorAll('.heatmap-legend').forEach(legend => {
    if (legend.classList.contains('hm-settings-legend')) legend.hidden = false;
    const scale = legend.querySelector('.heatmap-scale');
    if (!scale) return;
    let stateBox = legend.querySelector('.hm-state-legend');
    if (prop === 'state') {
      scale.hidden = true;
      if (!stateBox) {
        stateBox = document.createElement('div');
        stateBox.className = 'hm-state-legend';
        stateBox.setAttribute('role', 'list');
        scale.insertAdjacentElement('afterend', stateBox);
      }
      stateBox.hidden = false;
      stateBox.textContent = '';
      ['solid', 'liquid', 'gas', 'unknown'].forEach(key => {
        const item = document.createElement('span');
        item.className = 'hm-state-item';
        item.setAttribute('role', 'listitem');
        const sw = document.createElement('span');
        sw.className = 'hm-state-swatch';
        sw.dataset.state = key;
        if (HM_STATE_COLORS[key]) sw.style.background = HM_STATE_COLORS[key];
        const label = document.createElement('span');
        label.textContent = heatmapStateLabel(key);
        item.appendChild(sw);
        item.appendChild(label);
        stateBox.appendChild(item);
      });
      return;
    }
    scale.hidden = false;
    if (stateBox) stateBox.hidden = true;
    let unit = scale.querySelector('.hm-unit');
    if (!unit) {
      unit = document.createElement('span');
      unit.className = 'hm-unit';
      scale.appendChild(unit);
    }
    unit.textContent = prop === 'ionization' ? _T('ptable.hmUnitKj', 'kJ/mol') : '';
  });
}

function applyHeatmap(prop) {
  const cards = document.querySelectorAll('.el:not(.el-ph)');
  syncHeatmapLegend(prop);

  if (prop === 'state') {
    cards.forEach(card => {
      const z = parseInt(card.dataset.z, 10);
      if (!z) return;
      const el = ELEMENTS.find(e => e.z === z);
      const key = heatmapStateKey(el);
      if (!HM_STATE_COLORS[key]) {
        paintHeatmapMissing(card);
        card.dataset.state = 'unknown';
        return;
      }
      card.dataset.state = key;
      card.style.background = HM_STATE_COLORS[key];
      card.style.color = '#fff';
      card.style.borderColor = HM_STATE_COLORS[key];
    });
    return;
  }

  let min = Infinity, max = -Infinity;
  const values = {};
  cards.forEach(card => {
    const z = parseInt(card.dataset.z, 10);
    if (!z) return;
    const val = heatmapPropValue(z, prop);
    values[z] = val;
    if (val != null) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
  });

  cards.forEach(card => {
    const z = parseInt(card.dataset.z, 10);
    if (!z) return;
    const val = values[z];
    card.removeAttribute('data-state');
    if (val == null) {
      paintHeatmapMissing(card);
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
    card.removeAttribute('data-state');
  });
  document.querySelectorAll('.heatmap-legend').forEach(legend => {
    const scale = legend.querySelector('.heatmap-scale');
    const stateBox = legend.querySelector('.hm-state-legend');
    const unit = legend.querySelector('.hm-unit');
    if (scale) scale.hidden = false;
    if (stateBox) stateBox.hidden = true;
    if (unit) unit.textContent = '';
  });
  document.querySelectorAll('.hm-settings-legend').forEach(legend => { legend.hidden = true; });
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
  // f-block group is null (the drawing column is `col`, not an IUPAC group).
  // Omit it here; the category already says lanthanide or actinide.
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

// f-block elements keep group: null, so a numeric group filter does not include
// them. This guard still drops an f-block element if one is ever given a group
// above 3. Group 3 stays Sc and Y until the owner chooses Lu/Lr or La/Ac.
// The f-block stays fully reachable via the dedicated Lanthanides/Actinides filters.
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
  if (tabSel) {
    const mapped = prop === 'atomic_radius' ? 'radius' : prop;
    const has = Array.prototype.some.call(tabSel.options, o => o.value === mapped);
    if (has) tabSel.value = mapped;
  }
  if (prop === 'category') {
    removeHeatmap();
  } else if (document.getElementById('ptable')) {
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

  // Restore the settings-panel heatmap and paint it when the table is on the page.
  const hm = localStorage.getItem('atomurus-heatmap');
  const hmSettings = document.getElementById('heatmap-select');
  if (hmSettings && hm && Array.prototype.some.call(hmSettings.options, o => o.value === hm)) {
    hmSettings.value = hm;
  }
  if (hm && hm !== 'category' && document.getElementById('ptable')) applyHeatmap(hm);

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
  // The page's module (assets/pt/*.js) is a later deferred script, so route
  // once every deferred script has run: DOMContentLoaded (with load as a backup).
  const ptTab = document.body.getAttribute('data-pt-tab');
  if (ptTab && ptTab !== 'tabela') {
    let routed = false;
    const routeSubpage = () => {
      if (routed) return;
      routed = true;
      const btn = document.querySelector('.pt-tab[data-tab="' + ptTab + '"]');
      if (typeof switchTab === 'function') switchTab(ptTab, btn);
    };
    if (document.readyState === 'complete') routeSubpage();
    else {
      document.addEventListener('DOMContentLoaded', routeSubpage, { once: true });
      window.addEventListener('load', routeSubpage, { once: true });
    }
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
