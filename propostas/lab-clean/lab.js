/* ═══════════════════════════════════════════════════════════════
   ATOMURUS — "Lab Clean" UI/UX prototype · shared interactions
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ─── theme ─── */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('atomurus-proto-theme', t); } catch (e) {}
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(cur);
    toast(cur === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado');
  }

  /* ─── toast ─── */
  let toastTimer;
  function toast(msg) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ─── sidebar ─── */
  function initSidebar() {
    const railBtn = $('#sb-rail-btn');
    if (railBtn) railBtn.addEventListener('click', () => {
      document.body.classList.toggle('rail');
      document.body.classList.remove('menu-open');
    });
    const menuBtn = $('#sb-menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
      document.body.classList.remove('rail');
    });
    const overlay = $('.sb-overlay');
    if (overlay) overlay.addEventListener('click', () => document.body.classList.remove('menu-open'));
  }

  /* ─── dropdowns ─── */
  function initDropdowns() {
    $$('.dropdown').forEach(dd => {
      const btn = dd.querySelector('.dd-trigger');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = dd.classList.contains('open');
        $$('.dropdown.open').forEach(o => o.classList.remove('open'));
        if (!wasOpen) dd.classList.add('open');
      });
      $$('.dd-item', dd).forEach(item => {
        item.addEventListener('click', () => {
          dd.classList.remove('open');
        });
      });
    });
    document.addEventListener('click', () => $$('.dropdown.open').forEach(o => o.classList.remove('open')));
  }

  /* ─── element categories config ─── */
  const CATS = [
    { key: 'nonmetal',   label: 'Não metais diatômicos', pt: 'Não metais' },
    { key: 'noble',      label: 'Gases nobres',          pt: 'Gases nobres' },
    { key: 'alkali',     label: 'Metais alcalinos',      pt: 'Metais alcalinos' },
    { key: 'alkaline',   label: 'Alcalino-terrosos',     pt: 'Alcalino-terrosos' },
    { key: 'metalloid',  label: 'Metaloides',            pt: 'Metaloides' },
    { key: 'polyatomic', label: 'Não metais poliatômicos', pt: 'Poliatômicos' },
    { key: 'posttrans',  label: 'Metais pós-transição',  pt: 'Pós-transição' },
    { key: 'transition', label: 'Metais de transição',   pt: 'Transição' },
    { key: 'lanthanide', label: 'Lantanídeos',           pt: 'Lantanídeos' },
    { key: 'actinide',   label: 'Actinídeos',            pt: 'Actinídeos' },
  ];
  const catLabel = k => { const c = CATS.find(c => c.key === k); return c ? c.pt : k; };

  /* ─── periodic table rendering ─── */
  let selected = null;
  let activeFilter = null;
  let pinned = [];           // pinned elements for compare strip
  let viewMode = 'category'; // 'category' | 'heatmap'
  let heatKey = 'electronegativity';

  function elColor(el) {
    const c = '--c-' + el.cat;
    const bg = getComputedStyle(document.documentElement).getPropertyValue(c).trim();
    const t  = getComputedStyle(document.documentElement).getPropertyValue(c + '-t').trim();
    const b  = getComputedStyle(document.documentElement).getPropertyValue(c + '-b').trim();
    return { bg, t, b };
  }

  function heatValue(el) {
    if (heatKey === 'electronegativity') return typeof el.en === 'number' ? el.en : null;
    if (heatKey === 'atomic_radius') {
      const r = ELEMENTS.find(e => e.z === el.z);
      return r && typeof r.radius === 'number' ? r.radius : null;
    }
    if (heatKey === 'ionization') {
      const r = ELEMENTS.find(e => e.z === el.z);
      return r && typeof r.ion === 'number' ? r.ion : null;
    }
    return null;
  }

  function heatColor(el) {
    // escala verde → âmbar
    const lo = heatMin[heatKey] || 0, hi = heatMax[heatKey] || 1;
    let v = heatValue(el);
    if (v == null) return 'var(--surface-3)';
    const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
    const r = Math.round(30 + 190 * t);
    const g = Math.round(106 + (217 - 106) * t * .35);
    const b = Math.round(80 + (119 - 80) * t * .2);
    return `rgb(${r},${g},${b})`;
  }
  const heatMin = { electronegativity: 0.7, atomic_radius: 25, ionization: 370 };
  const heatMax = { electronegativity: 4,   atomic_radius: 260, ionization: 2400 };

  const FBLOCK_ROWS = { lanthanide: 9, actinide: 10 };

  function renderTable() {
    const wrap = $('#ptable');
    if (!wrap || typeof ELEMENTS === 'undefined') return;
    wrap.innerHTML = '';

    const byPos = {};
    ELEMENTS.forEach(el => {
      if ((el.cat === 'lanthanide' || el.cat === 'actinide') && el.z !== 57 && el.z !== 89) {
        // f-block: lanthanides at row 9 (cols 4-17), actinides row 10
        const r = FBLOCK_ROWS[el.cat];
        byPos[r + '-' + el.col] = el;
      } else {
        byPos[el.row + '-' + el.col] = el;
      }
    });

    // La (57) e Ac (89) ficam na tabela principal; os demais vão para as linhas f
    const mainEls = ELEMENTS.filter(e => !(e.cat === 'lanthanide' || e.cat === 'actinide') || e.z === 57 || e.z === 89);

    const grid = document.createElement('div');
    grid.className = 'ptable';
    wrap.appendChild(grid);

    mainEls.forEach(el => {
      const c = elColor(el);
      const cell = document.createElement('button');
      cell.className = 'el';
      cell.dataset.z = el.z;
      cell.style.gridRow = el.row;
      cell.style.gridColumn = el.col;
      cell.style.setProperty('--el-bg', c.bg);
      cell.style.setProperty('--el-t', c.t);
      cell.style.setProperty('--el-b', c.b);
      cell.setAttribute('aria-label', `${el.name}, número atômico ${el.z}`);
      cell.innerHTML = `<span class="el-z">${String(el.z).padStart(3, '0')}</span>
                        <span class="el-sym">${el.sym}</span>
                        <span class="el-mass">${el.mass}</span>
                        <span class="el-pin"></span>`;
      cell.addEventListener('click', (e) => { e.stopPropagation(); openDrawer(el); });
      grid.appendChild(cell);
    });

    // f-block rows with labels (sem La/Ac, que ficam na tabela principal)
    ['lanthanide', 'actinide'].forEach(cat => {
      const rowWrap = document.createElement('div');
      rowWrap.className = 'ptable-rows';
      const label = document.createElement('div');
      label.className = 'frow-label';
      label.textContent = cat === 'lanthanide' ? 'lantanídeos' : 'actinídeos';
      rowWrap.appendChild(label);
      const sub = document.createElement('div');
      sub.className = 'ptable';
      rowWrap.appendChild(sub);
      ELEMENTS.filter(e => e.cat === cat && e.z !== 57 && e.z !== 89).forEach(el => {
        const c = elColor(el);
        const cell = document.createElement('button');
        cell.className = 'el';
        cell.dataset.z = el.z;
        cell.style.gridColumn = el.col;
        cell.style.setProperty('--el-bg', c.bg);
        cell.style.setProperty('--el-t', c.t);
        cell.style.setProperty('--el-b', c.b);
        cell.setAttribute('aria-label', `${el.name}, número atômico ${el.z}`);
        cell.innerHTML = `<span class="el-z">${String(el.z).padStart(3, '0')}</span>
                          <span class="el-sym">${el.sym}</span>
                          <span class="el-mass">${el.mass}</span>
                          <span class="el-pin"></span>`;
        cell.addEventListener('click', (e) => { e.stopPropagation(); openDrawer(el); });
        sub.appendChild(cell);
      });
      wrap.appendChild(rowWrap);
    });

    applyTableState();
  }

  function applyTableState() {
    const cells = $$('.el');
    cells.forEach(cell => {
      const z = parseInt(cell.dataset.z, 10);
      const el = ELEMENTS.find(e => e.z === z);
      if (!el) return;

      // filter
      const out = activeFilter && el.cat !== activeFilter;
      cell.classList.toggle('filtered-out', !!out);

      // selection
      cell.classList.toggle('selected', selected && selected.z === z);

      // pin
      cell.classList.toggle('pinned', pinned.includes(z));

      // heatmap coloring
      if (viewMode === 'heatmap') {
        cell.style.setProperty('--el-bg', heatColor(el));
        cell.style.setProperty('--el-t', 'var(--text-1)');
        cell.style.setProperty('--el-b', 'transparent');
      } else {
        const c = elColor(el);
        cell.style.setProperty('--el-bg', c.bg);
        cell.style.setProperty('--el-t', c.t);
        cell.style.setProperty('--el-b', c.b);
      }
    });

    document.body.classList.toggle('filtering', !!activeFilter);
    const clearBtn = $('#chips-clear');
    if (clearBtn) clearBtn.style.display = activeFilter ? 'inline-flex' : 'none';
  }

  /* ─── chips ─── */
  function renderChips() {
    const box = $('#chips');
    if (!box) return;
    box.innerHTML = '';
    CATS.forEach(cat => {
      const n = ELEMENTS.filter(e => e.cat === cat.key).length;
      const chip = document.createElement('button');
      chip.className = 'chip' + (activeFilter === cat.key ? ' active' : '');
      const c = getComputedStyle(document.documentElement).getPropertyValue('--c-' + cat.key).trim();
      chip.innerHTML = `<span class="dot" style="background:${c};border-color:var(--c-${cat.key}-b)"></span>${cat.pt}<span class="count">${n}</span>`;
      chip.addEventListener('click', () => {
        activeFilter = activeFilter === cat.key ? null : cat.key;
        renderChips();
        applyTableState();
        updateStatus();
      });
      box.appendChild(chip);
    });
  }

  function updateStatus() {
    const cnt = $('.f-count');
    if (cnt) cnt.textContent = activeFilter
      ? `${ELEMENTS.filter(e => e.cat === activeFilter).length} / ${ELEMENTS.length}`
      : `${ELEMENTS.length} / ${ELEMENTS.length}`;
    const sel = $('.f-selected');
    if (sel) sel.textContent = selected ? `${selected.sym} · ${selected.name}` : '—';
    const filt = $('.f-filter');
    if (filt) filt.textContent = activeFilter ? catLabel(activeFilter) : 'todas';
  }

  /* ─── drawer ─── */
  function openDrawer(el) {
    selected = el;
    const d = $('#drawer');
    if (!d) return;
    document.body.classList.add('drawer-open');
    fillDrawer(el);
    applyTableState();
    updateStatus();
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
  }

  function fillDrawer(el) {
    const c = elColor(el);
    const badge = $('#dw-badge');
    badge.style.setProperty('--el-bg', c.bg);
    badge.style.setProperty('--el-t', c.t);
    badge.style.setProperty('--el-b', c.b);
    $('#dw-z').textContent = String(el.z).padStart(3, '0');
    $('#dw-sym').textContent = el.sym;
    $('#dw-name').textContent = el.name;
    $('#dw-cat').textContent = catLabel(el.cat);

    // overview
    $('#dw-name').textContent = el.name;
    const lg = $('#dw-name-lg'); if (lg) lg.textContent = el.name;
    $('#ov-desc').textContent = el.desc || '';
    $('#ov-mass').textContent = el.mass;
    $('#ov-en').textContent = typeof el.en === 'number' ? el.en.toFixed(2) : '—';
    $('#ov-state').textContent = el.state || '—';
    const gp = $('#ov-gp'); if (gp) gp.textContent = (el.group || '—') + ' / ' + (el.period || '—');
    const og = $('#ov-group'); if (og) og.textContent = el.group || '—';
    const op = $('#ov-period'); if (op) op.textContent = el.period || '—';
    const oy = $('#ov-year'); if (oy) oy.textContent = typeof el.year === 'number' ? el.year : (el.year || '—');
    const od = $('#ov-disc'); if (od) od.textContent = el.disc || '—';

    // model + uses
    const nuc = $('#model-nucleus'); if (nuc) nuc.textContent = el.z;
    const uses = $('#uses-text'); if (uses) uses.textContent = usesText(el);
    const ud = $('#uses-desc'); if (ud) ud.textContent = el.desc || '';

    // properties tab
    $('#pr-state').textContent = el.state || '—';
    $('#pr-en').textContent = typeof el.en === 'number' ? el.en.toFixed(2) : '—';
    $('#pr-group').textContent = el.group || '—';
    $('#pr-period').textContent = el.period || '—';
    $('#pr-config').textContent = electronConfig(el);
    $('#pr-cat').textContent = catLabel(el.cat);

    // bohr
    const bohr = $('#bohr-svg');
    if (bohr) bohr.innerHTML = bohrSvg(el);

    // nav arrows
    const idx = ELEMENTS.findIndex(e => e.z === el.z);
    const prev = ELEMENTS[(idx - 1 + ELEMENTS.length) % ELEMENTS.length];
    const next = ELEMENTS[(idx + 1) % ELEMENTS.length];
    $('#dw-prev').onclick = () => openDrawer(prev);
    $('#dw-next').onclick = () => openDrawer(next);
    $('#dw-pos').textContent = `${String(el.z).padStart(3, '0')} / 118`;

    // link 3D aponta para o visualizador do elemento
    const dw3d = $('#dw-3d');
    if (dw3d) dw3d.href = 'viewer3d.html?z=' + el.z;

    // pin state
    const pinBtn = $('#dw-pin');
    if (pinBtn) {
      const isPinned = pinned.includes(el.z);
      const lbl = $('#dw-pin-label');
      if (lbl) lbl.textContent = isPinned ? 'Remover da comparação' : 'Fixar para comparar';
      pinBtn.classList.toggle('primary', !isPinned);
    }

    const cmpBtn = $('#dw-compare');
    if (cmpBtn) cmpBtn.style.display = pinned.length ? 'inline-flex' : 'none';
    $('#dw-cmp-count').textContent = pinned.length;
  }

  function usesText(el) {
    const map = {
      nonmetal: 'Presente na atmosfera e nos seres vivos; combina-se facilmente para formar compostos essenciais à vida e à indústria.',
      noble: 'Inerte e estável; usado em iluminação, criogenia, soldagem e atmosferas protetoras.',
      alkali: 'Reativo e macio; presente em sais, baterias e processos biológicos como o sódio e o potássio.',
      alkaline: 'Metais leves e reativos; essenciais em ossos, materiais de construção e ligas leves.',
      metalloid: 'Comportamento intermediário entre metal e não metal; base da eletrônica e dos semicondutores.',
      polyatomic: 'Forma moléculas com vários átomos (O₂, N₂, P₄, S₈); essenciais à vida e à indústria química.',
      posttrans: 'Metais comuns e versáteis; usados em embalagens, construção, fiação e ligas do dia a dia.',
      transition: 'Metais que formam ligas resistentes, catalisam reações e dão cor aos compostos.',
      lanthanide: 'Metais de terras raras; usados em ímãs, telas, lasers e catalisadores modernos.',
      actinide: 'Elementos pesados, em grande parte radioativos; aplicações em energia nuclear e medicina.'
    };
    return map[el.cat] || 'Elemento com aplicações variadas em ciência e indústria.';
  }

  function togglePin(el) {
    const i = pinned.indexOf(el.z);
    if (i >= 0) pinned.splice(i, 1); else if (pinned.length < 4) pinned.push(el.z);
    else { toast('Máximo de 4 elementos na comparação'); return; }
    renderPinStrip();
    if ($('#cmp-slots')) renderCompare();
    applyTableState();
    if (selected && selected.z === el.z) fillDrawer(el);
  }

  function renderPinStrip() {
    const strip = $('#pin-strip');
    if (!strip) return;
    const box = $('#pin-list');
    box.innerHTML = '';
    pinned.forEach(z => {
      const el = ELEMENTS.find(e => e.z === z);
      const c = elColor(el);
      const pill = document.createElement('span');
      pill.className = 'pin';
      pill.style.background = c.bg;
      pill.style.color = c.t;
      pill.style.borderColor = c.b;
      pill.innerHTML = `${el.sym} <button aria-label="remover ${el.name}">✕</button>`;
      pill.querySelector('button').addEventListener('click', () => togglePin(el));
      box.appendChild(pill);
    });
    const go = $('#pin-go');
    if (go) go.style.display = pinned.length >= 2 ? 'inline-flex' : 'none';
    document.body.classList.toggle('has-pins', pinned.length > 0);
    if (pinned.length === 0 && document.body.classList.contains('drawer-open') && selected) fillDrawer(selected);
  }

  /* ─── search ─── */
  function initSearch() {
    const input = $('#search-input');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const cells = $$('.el');
      cells.forEach(cell => {
        const z = parseInt(cell.dataset.z, 10);
        const el = ELEMENTS.find(e => e.z === z);
        if (!el) return;
        const match = !q || el.name.toLowerCase().includes(q) || el.sym.toLowerCase() === q || String(el.z) === q;
        cell.classList.toggle('filtered-out', !match);
      });
      if (q) document.body.classList.add('filtering'); else document.body.classList.remove('filtering');
    });
    // keyboard: Enter abre o primeiro
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim().toLowerCase();
        const el = ELEMENTS.find(e => e.name.toLowerCase().includes(q) || e.sym.toLowerCase() === q || String(e.z) === q);
        if (el) { openDrawer(el); }
      }
    });
  }

  /* ─── view mode (category / heatmap) via dropdown ─── */
  const VIEW_LABELS = {
    category: 'Categoria',
    electronegativity: 'Eletronegatividade',
    atomic_radius: 'Raio atômico',
    ionization: 'Energia de ionização'
  };

  function syncViewUI() {
    $$('[data-view]').forEach(b => {
      const active = b.dataset.view === viewMode && (!b.dataset.heat || b.dataset.heat === heatKey);
      b.classList.toggle('active', active);
    });
    const lbl = $('#view-label-text');
    if (lbl) lbl.textContent = VIEW_LABELS[viewMode === 'heatmap' ? heatKey : 'category'];
  }

  function initViewSeg() {
    $$('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        if (btn.dataset.heat) heatKey = btn.dataset.heat;
        syncViewUI();
        applyTableState();
      });
    });
    syncViewUI();
  }

  /* ─── focus mode ─── */
  function initFocus() {
    const btn = $('#focus-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const active = document.body.classList.toggle('focus');
      btn.classList.toggle('active', active);
      const cmd = $('.commandbar');
      if (cmd) cmd.style.display = active ? 'none' : '';
      const head = $('.page-head');
      if (head) head.style.display = active ? 'none' : '';
      toast(active ? 'Modo foco — somente a tabela' : 'Modo foco desativado');
    });
  }

  /* ─── drawer tabs ─── */
  function initDrawerTabs() {
    $$('.dw-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.dw-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        $$('.dw-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(tab.dataset.panel);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ─── chips collapse ─── */
  function initChipsCollapse() {
    const btn = $('#chips-collapse');
    if (!btn) return;
    btn.addEventListener('click', () => {
      document.body.classList.toggle('hide-chips');
    });
  }

  /* ─── bohr model svg ─── */
  function electronConfig(el) {
    // simplificado: configuração em camadas
    const shells = bohrShells(el.z);
    return shells.map((n, i) => `${i + 1}²·${n}`).join('  ');
  }

  function bohrShells(z) {
    const caps = [2, 8, 18, 32, 32, 18, 8];
    const out = [];
    let rest = z;
    for (let i = 0; i < caps.length && rest > 0; i++) {
      const n = Math.min(caps[i], rest);
      out.push(n); rest -= n;
    }
    return out;
  }

  function bohrSvg(el) {
    const shells = bohrShells(el.z);
    const cx = 100, cy = 100;
    let s = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Modelo de Bohr do ${el.name}">`;
    // núcleo
    s += `<circle cx="${cx}" cy="${cy}" r="14" fill="var(--accent)" opacity=".85"/>`;
    s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--accent-ink)" font-family="monospace">${el.z}</text>`;
    // camadas
    const color = 'var(--text-2)';
    const dotFill = 'var(--text-1)';
    shells.forEach((n, i) => {
      const r = 26 + i * 18;
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1" opacity=".35"/>`;
      const ang = i % 2 === 0 ? -90 : -90 + 18;
      for (let k = 0; k < n; k++) {
        const a = ang + (360 / n) * k;
        const rad = a * Math.PI / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${dotFill}" opacity=".8"/>`;
      }
    });
    s += `</svg>`;
    return s;
  }

  /* ─── compare page ─── */
  const CMP_PROPS = [
    { key: 'mass', label: 'Massa atômica', unit: 'u', desc: 'CODATA 2022' },
    { key: 'en', label: 'Eletronegatividade', unit: 'Pauling', desc: 'escala de Pauling' },
    { key: 'period', label: 'Período', unit: '', desc: 'camada de valência' },
    { key: 'group', label: 'Grupo', unit: '', desc: 'coluna da tabela' },
    { key: 'state', label: 'Estado físico', unit: '', desc: 'a 298 K', text: true },
  ];

  function cmpVal(el, key) {
    if (key === 'mass') return parseFloat(el.mass) || 0;
    if (key === 'en') return typeof el.en === 'number' ? el.en : 0;
    if (key === 'period') return el.period || 0;
    if (key === 'group') return el.group || 0;
    if (key === 'state') return el.state || '—';
    return 0;
  }

  function renderCompare() {
    const slots = $('#cmp-slots');
    const rows = $('#cmp-rows');
    if (!slots) return;
    slots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const z = pinned[i];
      const slot = document.createElement('div');
      slot.className = 'cmp-slot' + (z ? ' filled' : '');
      if (z) {
        const el = ELEMENTS.find(e => e.z === z);
        const c = elColor(el);
        slot.style.background = c.bg;
        slot.style.borderColor = c.b;
        slot.innerHTML = `<button class="cmp-x" aria-label="remover">✕</button>
          <div class="el-big">
            <span class="csym" style="color:${c.t}">${el.sym}</span>
            <span class="cname">${el.name}</span>
            <span class="cname" style="font-family:var(--font-mono);font-size:10px;opacity:.7">Z ${el.z} · ${catLabel(el.cat)}</span>
          </div>`;
        slot.querySelector('.cmp-x').addEventListener('click', () => togglePin(el));
        slot.addEventListener('click', (e) => { if (e.target === slot) openDrawer(el); });
      } else {
        slot.innerHTML = `<span>Clique em “Fixar”<br>no painel de um elemento</span>`;
      }
      slots.appendChild(slot);
    }

    // rows
    rows.innerHTML = '';
    if (pinned.length < 1) {
      rows.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:var(--text-3);text-align:center;padding:40px">
        <div><div style="font-size:34px;margin-bottom:8px">⚗️</div>
        Fixe 2 a 4 elementos na tabela periódica para comparar propriedades lado a lado.</div></div>`;
      return;
    }
    const els = pinned.map(z => ELEMENTS.find(e => e.z === z)).filter(Boolean);
    CMP_PROPS.forEach(prop => {
      const row = document.createElement('div');
      row.className = 'cmp-row';
      let rk = `<div class="rk">${prop.label}<small>${prop.desc}</small></div>`;
      let bars = '<div class="cmp-bars">';
      if (prop.text) {
        els.forEach(el => {
          const c = elColor(el);
          bars += `<div class="cmp-bar"><div class="bl" style="color:${c.t}"><span>${el.sym}</span><b>${cmpVal(el, prop.key)}</b></div></div>`;
        });
      } else {
        const vals = els.map(el => cmpVal(el, prop.key));
        const max = Math.max(...vals, 1);
        els.forEach((el, i) => {
          const c = elColor(el);
          bars += `<div class="cmp-bar"><div class="bl"><span style="color:${c.t}">${el.sym}</span><b>${vals[i]}${prop.unit ? ' ' + prop.unit : ''}</b></div>
            <div class="track"><i style="width:${(vals[i] / max) * 100}%;background:${c.bg};border:1px solid ${c.b};"></i></div></div>`;
        });
      }
      bars += '</div>';
      row.innerHTML = rk + bars;
      rows.appendChild(row);
    });
  }

  /* ─── trends page ─── */
  function renderTrends() {
    const grid = $('#trend-grid');
    const legend = $('#heat-legend');
    if (!grid || !legend) return;
    const activeCard = $('.vs-card.active');
    const label = activeCard ? activeCard.dataset.label : 'Eletronegatividade';

    legend.querySelector('.heat-label').textContent = label;
    legend.querySelector('.lo').textContent = heatMin[heatKey];
    legend.querySelector('.hi').textContent = heatMax[heatKey];

    grid.innerHTML = '';
    const byPos = {};
    ELEMENTS.forEach(el => {
      let r, c;
      if (el.z === 57) { r = 6; c = 3; }
      else if (el.z === 89) { r = 7; c = 3; }
      else if (el.cat === 'lanthanide' || el.cat === 'actinide') { r = FBLOCK_ROWS[el.cat]; c = el.col; }
      else { r = el.row; c = el.col; }
      byPos[r + '-' + c] = el;
    });
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 18; col++) {
        const el = byPos[row + '-' + col];
        const cell = document.createElement('button');
        cell.className = 'el heat';
        if (el) {
          const bg = heatColor(el);
          cell.style.background = bg;
          cell.style.borderColor = 'transparent';
          cell.dataset.z = el.z;
          cell.innerHTML = `<span class="el-z">${String(el.z).padStart(3, '0')}</span><span class="el-sym">${el.sym}</span>`;
          cell.addEventListener('click', () => openDrawer(el));
        } else {
          cell.style.visibility = 'hidden';
        }
        grid.appendChild(cell);
      }
    }
  }

  function initTrends() {
    const cards = $$('.vs-card');
    if (!cards.length) return;
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        heatKey = card.dataset.key;
        renderTrends();
      });
    });
  }

  /* ─── shared page init ─── */
  function init() {
    initSidebar();
    initDropdowns();

    if (typeof ELEMENTS !== 'undefined' && $('#ptable')) {
      renderTable();
      renderChips();
      updateStatus();
      initViewSeg();
      initFocus();
      initChipsCollapse();
    }
    initSearch();

    if ($('#drawer')) {
      $('#dw-close').addEventListener('click', closeDrawer);
      $('.drawer-backdrop').addEventListener('click', closeDrawer);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
      $('#dw-pin').addEventListener('click', () => { if (selected) togglePin(selected); });
      const pin2 = $('#dw-pin2');
      if (pin2) pin2.addEventListener('click', () => { if (selected) togglePin(selected); });
      const cmpBtn = $('#dw-compare');
      if (cmpBtn) cmpBtn.addEventListener('click', () => {
        if (location.pathname.indexOf('compare.html') !== -1) {
          const t = $('#cmp-slots');
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          location.href = 'compare.html';
        }
      });
      initDrawerTabs();
    }
    if ($('#pin-strip')) {
      renderPinStrip();
      const go = $('#pin-go');
      if (go) go.addEventListener('click', () => {
        if (location.pathname.indexOf('compare.html') !== -1) {
          const t = $('#cmp-slots');
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          location.href = 'compare.html';
        }
      });
    }

    if ($('#cmp-slots')) {
      renderCompare();
      const clearBtn = $('#cmp-clear');
      if (clearBtn) clearBtn.addEventListener('click', () => { pinned = []; renderPinStrip(); renderCompare(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
    }

    if ($('#trend-grid')) {
      renderTrends();
      initTrends();
    }

    // theme fab
    const fab = $('#theme-fab');
    if (fab) fab.addEventListener('click', toggleTheme);

    // expose for inline handlers
    window.proto = { toggleTheme, togglePin, openDrawer, closeDrawer, toast };
  }

  /* ─── theme init ─── */
  (function initTheme() {
    let t = null;
    try { t = localStorage.getItem('atomurus-proto-theme'); } catch (e) {}
    if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
