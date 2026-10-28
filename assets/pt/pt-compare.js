/* ─────────────────────────────────────────────────────────────
 * Atomurus — Periodic Table · compare
 * Element comparison: picker, similarity, applications, atomic-model view.
 * Moved unchanged out of periodic-table.js (prompt 24). Classic script: it
 * shares the global scope with periodic-table.js and must load AFTER it.
 * Loaded by: periodic-table/compare(.pt).html
 * ─────────────────────────────────────────────────────────── */

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

