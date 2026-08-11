/* ═══════════════════════════════════════════════════════════════
   ATOMURUS — "Lab Clean" · Visualizador 3D (protótipo)
   Renderer próprio em Canvas 2D com projeção 3D (sem dependências,
   funciona offline). Modelos: Bohr, Rutherford e Quantum.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const E = (typeof ELEMENTS !== 'undefined') ? ELEMENTS : null;
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  if (!E || !$('#v3d-canvas')) return;

  /* ─── estado ─── */
  const state = {
    z: 6,
    model: 'bohr',          // 'bohr' | 'rutherford' | 'quantum'
    speed: 1,
    tilt: 0.55,             // inclinação da câmera (X)
    rotY: 0,                // rotação automática (Y)
    zoom: 1,
    dragX: 0, dragY: 0,     // rotação manual acumulada
    showOrbits: true,
    showTrails: true,
    showLabels: false,
    showNucleus: true,
    paused: false,
    hovering: null
  };

  const canvas = $('#v3d-canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let electrons = [];   // { shell, r, ang, w, phase }
  let trails = [];      // arrays de pontos projetados
  let cloud = [];       // pontos da nuvem quântica

  /* ─── utilidades ─── */
  function shellsOf(z) {
    const caps = [2, 8, 18, 32, 32, 18, 8];
    const out = []; let rest = z;
    for (let i = 0; i < caps.length && rest > 0; i++) {
      const n = Math.min(caps[i], rest);
      out.push(n); rest -= n;
    }
    return out;
  }

  const elColor = (el) => {
    const cs = getComputedStyle(document.documentElement);
    return {
      bg: cs.getPropertyValue('--c-' + el.cat).trim(),
      t:  cs.getPropertyValue('--c-' + el.cat + '-t').trim()
    };
  };

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function elByZ(z) { return E.find(e => e.z === z); }
  const accented = (hsl) => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  /* ─── geometria ─── */
  function build(z) {
    const shells = shellsOf(z);
    electrons = [];
    const baseR = Math.min(64, 46 + shells.length * 6), gap = 38;
    shells.forEach((n, i) => {
      const r = baseR + i * gap;
      for (let k = 0; k < n; k++) {
        electrons.push({
          shell: i, r,
          ang: (Math.PI * 2 / n) * k + i * 0.83,
          w: (0.55 + i * 0.16) * (i % 2 ? -1 : 1) * (0.9 + (k % 3) * 0.12),
          phase: Math.random() * Math.PI * 2
        });
      }
    });
    trails = electrons.map(() => []);

    // nuvem quântica: pontos de probabilidade em torno de cada camada
    cloud = [];
    const ptsPerShell = z > 40 ? 10 : 16;
    shells.forEach((n, i) => {
      const r = baseR + i * gap;
      for (let k = 0; k < n * ptsPerShell; k++) {
        const gauss = (Math.random() + Math.random() + Math.random()) / 3; // 0..1 centralizado
        const rad = r * (0.72 + gauss * 0.56);
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;
        cloud.push({
          x: rad * Math.sin(theta) * Math.cos(phi),
          y: rad * Math.sin(theta) * Math.sin(phi),
          z: rad * Math.cos(theta),
          wob: Math.random() * Math.PI * 2,
          ws: 0.3 + Math.random() * 0.5
        });
      }
    });
  }

  /* ─── projeção ─── */
  function project(x, y, z) {
    const ry = state.rotY + state.dragY;
    const tx = clamp(state.tilt + state.dragX, -1.35, 1.35);
    const x1 =  x * Math.cos(ry) + z * Math.sin(ry);
    const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    const y1 =  y * Math.cos(tx) - z1 * Math.sin(tx);
    const z2 =  y * Math.sin(tx) + z1 * Math.cos(tx);
    const p = 1100 / (1100 + z2 * 0.6);
    return {
      x: W / 2 + x1 * p * state.zoom,
      y: H / 2 - y1 * p * state.zoom,
      z: z2, p
    };
  }

  function ringPts(r, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = (Math.PI * 2 / n) * i;
      pts.push(project(r * Math.cos(a), 0, r * Math.sin(a)));
    }
    return pts;
  }

  /* ─── desenho ─── */
  const SHELL_COLORS = ['#34A872', '#D97706', '#3D7BD9', '#B055C0', '#D9534F', '#6BBF59', '#8A6D3B'];

  function shellColor(i) {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return dark ? SHELL_COLORS[i % SHELL_COLORS.length] : SHELL_COLORS[i % SHELL_COLORS.length];
  }

  function drawNucleus(z, rScale) {
    if (!state.showNucleus) return;
    const p = project(0, 0, 0);
    const r = 15 * rScale * state.zoom * p.p;
    // halo
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    halo.addColorStop(0, 'rgba(217,119,6,.28)');
    halo.addColorStop(1, 'rgba(217,119,6,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
    // corpo
    const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, 0, p.x, p.y, r);
    g.addColorStop(0, '#FFE3B8');
    g.addColorStop(0.45, '#F0A83A');
    g.addColorStop(1, '#B5651D');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120,70,20,.6)';
    ctx.stroke();
    // Z no centro
    ctx.fillStyle = 'rgba(20,14,8,.9)';
    ctx.font = `700 ${Math.max(7, r * 0.72)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(z), p.x, p.y + 0.5);
  }

  function drawElectron(p, color, r) {
    const radius = Math.max(2.2, r * state.zoom * p.p);
    const g = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.3, 0, p.x, p.y, radius);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.35, color);
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
    // brilho
    ctx.globalAlpha = 0.22;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2.8);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(p.x, p.y, radius * 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawTrails(i, color) {
    const tr = trails[i];
    if (tr.length < 2) return;
    ctx.lineCap = 'round';
    for (let k = 1; k < tr.length; k++) {
      const a = (k / tr.length) * 0.35;
      ctx.globalAlpha = a;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 + (k / tr.length) * 1.4;
      ctx.beginPath();
      ctx.moveTo(tr[k - 1].x, tr[k - 1].y);
      ctx.lineTo(tr[k].x, tr[k].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBohrFrame(time) {
    // anéis (órbitas projetadas)
    const shells = new Set(electrons.map(e => e.shell));
    if (state.showOrbits) {
      shells.forEach(i => {
        const r = electrons.find(e => e.shell === i).r;
        const pts = ringPts(r, 72);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.strokeStyle = shellColor(i);
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }

    // atualizar elétrons
    const items = electrons.map((e, i) => {
      e.ang += e.w * 0.02 * state.speed;
      const p = project(e.r * Math.cos(e.ang), 0, e.r * Math.sin(e.ang));
      if (state.showTrails) {
        trails[i].push({ x: p.x, y: p.y });
        if (trails[i].length > 22) trails[i].shift();
      } else trails[i] = [];
      return { i, e, p };
    });

    // profundidade: mais distante primeiro
    items.sort((a, b) => b.p.z - a.p.z);

    items.forEach(({ i, e, p }) => {
      const color = shellColor(e.shell);
      if (state.showTrails) drawTrails(i, color);
      drawElectron(p, color, 4.4);
      if (state.showLabels) {
        ctx.fillStyle = cssVar('--text-2');
        ctx.font = `9px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(String(e.shell + 1), p.x, p.y - 9);
      }
    });

    drawNucleus(elByZ(state.z).z, 1);
  }

  function drawRutherfordFrame(time) {
    // átomo quase vazio: núcleo minúsculo, elétrons distantes
    const shells = new Set(electrons.map(e => e.shell));
    const SCALE = 1.5;
    if (state.showOrbits) {
      shells.forEach(i => {
        const r = electrons.find(e => e.shell === i).r * SCALE;
        const pts = ringPts(r, 72);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.strokeStyle = shellColor(i);
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }
    const items = electrons.map((e, i) => {
      e.ang += e.w * 0.02 * state.speed;
      const p = project(e.r * SCALE * Math.cos(e.ang), 0, e.r * SCALE * Math.sin(e.ang));
      return { i, e, p };
    });
    items.sort((a, b) => b.p.z - a.p.z);
    items.forEach(({ e, p }) => drawElectron(p, shellColor(e.shell), 3.4));
    drawNucleus(elByZ(state.z).z, 0.32);
  }

  function drawQuantumFrame(time) {
    const ry = state.rotY + state.dragY;
    const tx = clamp(state.tilt + state.dragX, -1.35, 1.35);
    const pts = [];
    for (let i = 0; i < cloud.length; i++) {
      const c = cloud[i];
      const t = time * 0.00012 * state.speed;
      // leve vibração individual
      const wobX = Math.sin(t * c.ws * 10 + c.wob) * 3;
      const wobY = Math.cos(t * c.ws * 8 + c.wob) * 3;
      const x1 = (c.x + wobX) * Math.cos(ry) + (c.z + wobY) * Math.sin(ry);
      const z1 = -(c.x + wobX) * Math.sin(ry) + (c.z + wobY) * Math.cos(ry);
      const y1 = c.y * Math.cos(tx) - z1 * Math.sin(tx);
      const z2 = c.y * Math.sin(tx) + z1 * Math.cos(tx);
      const p = 1100 / (1100 + z2 * 0.6);
      pts.push({
        x: W / 2 + x1 * p * state.zoom,
        y: H / 2 - y1 * p * state.zoom,
        z: z2, p
      });
    }
    pts.sort((a, b) => b.z - a.z);
    const accent = accented();
    ctx.fillStyle = accent;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const alpha = clamp(0.08 + (1 - (a.z + 300) / 600) * 0.5, 0.04, 0.55);
      ctx.globalAlpha = alpha;
      const size = Math.max(1, 1.7 * state.zoom * a.p);
      ctx.beginPath();
      ctx.arc(a.x, a.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawNucleus(elByZ(state.z).z, 0.9);
  }

  /* ─── loop principal ─── */
  let raf = null;
  function frame(time) {
    ctx.clearRect(0, 0, W, H);
    if (!state.paused) {
      state.rotY += 0.0045 * state.speed;
    }
    if (state.model === 'bohr') drawBohrFrame(time);
    else if (state.model === 'rutherford') drawRutherfordFrame(time);
    else drawQuantumFrame(time);
    raf = requestAnimationFrame(frame);
  }

  /* ─── UI ─── */
  function fillUI() {
    const el = elByZ(state.z);
    if (!el) return;
    const c = elColor(el);
    const badge = $('#vp-badge');
    if (badge) {
      badge.style.setProperty('--el-bg', c.bg);
      badge.style.setProperty('--el-t', c.t);
      badge.style.setProperty('--el-b', 'transparent');
      $('#vp-z').textContent = String(el.z).padStart(3, '0');
      $('#vp-sym').textContent = el.sym;
      $('#vp-nm').textContent = el.name;
    }
    $('#vp-title').textContent = el.name;
    $('#vp-meta').textContent = `Z ${el.z} · ${el.mass} u · ${el.state || '—'}`;
    const cat = $('#vp-cat');
    if (cat) {
      cat.textContent = catLabel(el.cat);
      cat.style.background = c.bg;
      cat.style.color = c.t;
    }
    $('#vp-pos').textContent = String(el.z).padStart(3, '0') + ' / 118';

    // overlay
    const ov = $('#v3d-overlay');
    if (ov) {
      $('#ov-z').textContent = 'Z ' + String(el.z).padStart(3, '0');
      $('#ov-sym').textContent = el.sym;
      $('#ov-name').textContent = el.name + ' · ' + catLabel(el.cat);
      const ovCat = $('#ov-cat');
      if (ovCat) { ovCat.textContent = catLabel(el.cat); ovCat.style.background = c.bg; ovCat.style.color = c.t; }
    }

    // configuração
    const cfg = $('#vp-config');
    if (cfg) {
      const shells = shellsOf(el.z);
      cfg.innerHTML = shells.map((n, i) =>
        `<span class="shell-chip" style="color:${shellColor(i)}">${i + 1}ª camada · <b>${n}</b> e⁻</span>`
      ).join(' ');
    }
    $('#vp-elec').textContent = `${el.z} prótons · ${el.z} elétrons`;
    $('#vp-shells').textContent = `${shellsOf(el.z).length} camadas`;

    // chips rápidos
    $$('#vp-quick button').forEach(b => b.classList.toggle('active', parseInt(b.dataset.z, 10) === el.z));
  }

  function setElement(z) {
    if (!elByZ(z)) return;
    state.z = z;
    build(z);
    fillUI();
  }

  function setModel(m) {
    state.model = m;
    $$('#vp-seg button').forEach(b => b.classList.toggle('active', b.dataset.model === m));
    const mn = $('#vp-model-name');
    if (mn) mn.textContent = m === 'bohr' ? 'Bohr · 1913' : m === 'rutherford' ? 'Rutherford · 1911' : 'Quantum · Schrödinger';
    const hint = $('#v3d-hint');
    if (hint) {
      hint.innerHTML = m === 'bohr' ? 'arraste para girar · roda para zoom'
        : m === 'rutherford' ? 'núcleo minúsculo, átomo vazio — arraste para girar'
        : 'nuvem de probabilidade — arraste para girar';
    }
  }

  function catLabel(k) {
    const map = {
      nonmetal: 'Não metal', noble: 'Gás nobre', alkali: 'Metal alcalino',
      alkaline: 'Alcalino-terroso', metalloid: 'Metaloide', polyatomic: 'Poliatômico',
      posttrans: 'Pós-transição', transition: 'Transição', lanthanide: 'Lantanídeo',
      actinide: 'Actinídeo'
    };
    return map[k] || k;
  }

  /* ─── eventos ─── */
  function initEvents() {
    // drag
    let dragging = false, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; lx = e.clientX; ly = e.clientY;
      canvas.classList.add('dragging');
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      state.dragY += (e.clientX - lx) * 0.005;
      state.dragX += (e.clientY - ly) * 0.004;
      lx = e.clientX; ly = e.clientY;
    });
    const end = () => { dragging = false; canvas.classList.remove('dragging'); };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    // zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.zoom = clamp(state.zoom * (e.deltaY < 0 ? 1.08 : 0.92), 0.35, 3);
    }, { passive: false });
    // duplo clique reseta
    canvas.addEventListener('dblclick', () => {
      state.dragX = 0; state.dragY = 0; state.zoom = 1; state.tilt = 0.55;
    });

    // controles
    $$('#vp-seg button').forEach(b => b.addEventListener('click', () => setModel(b.dataset.model)));
    $('#vp-speed').addEventListener('input', (e) => { state.speed = parseFloat(e.target.value); });
    $('#vp-tilt').addEventListener('input', (e) => { state.tilt = parseFloat(e.target.value); });
    $('#vp-zoom').addEventListener('input', (e) => { state.zoom = parseFloat(e.target.value); });
    const bindToggle = (id, key) => {
      const el = $('#' + id);
      if (el) el.addEventListener('change', (e) => { state[key] = e.target.checked; });
    };
    bindToggle('vp-orbits', 'showOrbits');
    bindToggle('vp-trails', 'showTrails');
    bindToggle('vp-labels', 'showLabels');
    bindToggle('vp-nucleus', 'showNucleus');
    const pause = $('#vp-pause');
    if (pause) pause.addEventListener('click', () => {
      state.paused = !state.paused;
      pause.classList.toggle('active', state.paused);
      pause.title = state.paused ? 'Retomar rotação' : 'Pausar rotação';
    });

    // navegação de elemento
    $('#vp-prev').addEventListener('click', () => {
      const idx = E.findIndex(e => e.z === state.z);
      setElement(E[(idx - 1 + E.length) % E.length].z);
    });
    $('#vp-next').addEventListener('click', () => {
      const idx = E.findIndex(e => e.z === state.z);
      setElement(E[(idx + 1) % E.length].z);
    });
    $$('#vp-quick button').forEach(b => b.addEventListener('click', () => setElement(parseInt(b.dataset.z, 10))));

    // busca
    const input = $('#search-input');
    if (input) {
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (!q) return;
        const el = E.find(e =>
          e.name.toLowerCase().includes(q) || e.sym.toLowerCase() === q || String(e.z) === q);
        if (el) setElement(el.z);
      });
    }

    window.addEventListener('resize', () => { resize(); });
    // observa mudança de tema para repintar
    new MutationObserver(() => { fillUI(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ─── init ─── */
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  (function init() {
    const params = new URLSearchParams(location.search);
    const z = parseInt(params.get('z'), 10);
    state.z = elByZ(z) ? z : 6;
    resize();
    build(state.z);
    fillUI();
    setModel(state.model);
    initEvents();
    raf = requestAnimationFrame(frame);
  })();
})();
