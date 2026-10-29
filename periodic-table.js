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

// ════════════ SHARED WITH PAGE MODULES ════════════
// Comparison (assets/pt/pt-compare.js), trends (pt-trends.js) and isotopes
// (pt-isotopes.js) live in their own files, loaded only by their pages.
// These helpers are used by more than one of them, so they stay here.
// Resolves the active UI language for JS-built strings (EN default, PT).
function trendLang() {
  const r = (window.I18N && I18N.lang) || document.documentElement.lang || 'en';
  return String(r).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
}

function trendEscapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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


function trendSelStr(o, lang) { return (o && (o[lang] || o.en)) || ''; }


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
