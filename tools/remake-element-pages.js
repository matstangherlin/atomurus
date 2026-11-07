#!/usr/bin/env node
/**
 * Remake 2026 — element pages (periodic-table/<latin>.html, PT source).
 * Rewrites the page body (div.content inside main) into the remake layout:
 * hero tile + title + lead, allotropes, isotopes, rich content, pager, and
 * a data aside. Values are baked in PT from elements-data.js and
 * isotopes-data.js; element-page.js re-localizes them at runtime.
 * Idempotent: running again regenerates the same markup.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DICT } = require('./i18n-dict-source');
const { findElementWithClass } = require('./inject-ui-chrome');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'periodic-table');
const PT = DICT.pt;
const EN = DICT.en;
const ATOM = require('../assets/chem/atom-structure.js');
const PROPS = require('../assets/chem/element-props.js');
const APPEARANCE = require('../assets/chem/element-appearance.js');

function loadData() {
  const ctx = { window: {}, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const code = fs.readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8') +
    '\n;globalThis.__out = { ELEMENTS, ELEMENT_LATIN, getExtra, getExtra2, getIonization };';
  vm.runInContext(code, ctx);
  const iso = { window: {} };
  iso.self = iso.window;
  vm.createContext(iso);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'isotopes-data.js'), 'utf8'), iso);
  const isotopes = iso.window.ISOTOPES || iso.ISOTOPES || {};
  const lite = { window: {} };
  vm.createContext(lite);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'remake', 'elements-lite.js'), 'utf8'), lite);
  return Object.assign({}, ctx.__out, { ISOTOPES: isotopes, RM: lite.window });
}

const ALLOTROPES = {
  6: ['carbon', ['graphite', 'diamond', 'graphene', 'fullerene']],
  8: ['oxygen', ['o2', 'ozone']],
  15: ['phosphorus', ['p_white', 'p_red', 'p_black']],
  16: ['sulfur', ['s_rhombic', 's_mono', 's_plastic']]
};

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ptNum = (s) => String(s).replace(/\./g, ',');

/* Half-lives are stored as "2.60 y", "5,730 y", "1.39 My", "1.5e17 y",
   "14.28 d"… Spell them out per language: "2,60 anos" / "2.60 years". */
const SUPDIG = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const HL_UNITS = {
  y: { pt: ['ano', 'anos'], en: ['year', 'years'] },
  ky: { pt: ['mil anos', 'mil anos'], en: ['thousand years', 'thousand years'] },
  My: { pt: ['milhão de anos', 'milhões de anos'], en: ['million years', 'million years'] },
  Gy: { pt: ['bilhão de anos', 'bilhões de anos'], en: ['billion years', 'billion years'] },
  Ty: { pt: ['trilhão de anos', 'trilhões de anos'], en: ['trillion years', 'trillion years'] },
  d: { pt: ['dia', 'dias'], en: ['day', 'days'] },
  h: { pt: ['hora', 'horas'], en: ['hour', 'hours'] },
  min: { pt: ['min', 'min'], en: ['min', 'min'] },
  s: { pt: ['s', 's'], en: ['s', 's'] },
  ms: { pt: ['ms', 'ms'], en: ['ms', 'ms'] }
};
function localNum(str, lang) {
  const [int, frac] = str.split('.');
  const grouped = int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'pt' ? '.' : ',') : int;
  return grouped + (frac ? (lang === 'pt' ? ',' : '.') + frac : '');
}
function halfLifeText(raw, lang) {
  const m = String(raw).trim().match(/^([\d.,]+)(?:e([+-]?\d+))?\s*(ky|My|Gy|Ty|min|ms|y|d|h|s)$/);
  if (!m || !HL_UNITS[m[3]]) return String(raw);
  const mant = m[1].replace(/,/g, '');
  const value = Number(mant) * (m[2] ? Math.pow(10, Number(m[2])) : 1);
  const words = HL_UNITS[m[3]][lang];
  // "1 ano", but "1,39 milhão de anos": in Portuguese the large-number words stay singular below 2
  const big = /^(My|Gy|Ty)$/.test(m[3]);
  const unit = (value === 1 || (lang === 'pt' && big && value < 2 && !m[2])) ? words[0] : words[1];
  const exp = m[2] ? ' × 10' + String(Number(m[2])).split('').map((c) => (c === '-' ? '⁻' : SUPDIG[c])).join('') : '';
  return `${localNum(mant, lang)}${exp} ${unit}`;
}

function massLabel(m) {
  const s = String(m);
  return s.indexOf('.') === -1 ? `[${s}]` : s;
}

function tempLabel(v) {
  if (!v || v === '—' || v === '—') return null;
  const m = String(v).match(/^\s*(-?[\d.,]+)\s*°?\s*C?\s*(.*)$/);
  if (!m) return String(v);
  const n = m[1].replace(/^-/, '−');
  return `${n} °C${m[2] ? ' ' + m[2] : ''}`;
}

function i(key, text, tag = 'span', extra = '') {
  return `<${tag} data-i18n="${key}"${extra}>${esc(text)}</${tag}>`;
}

function factRow(key, label, valueHtml, mono) {
  return `<div><dt data-i18n="el.rm.${key}">${esc(label)}</dt><dd${mono ? ' class="rm-mono"' : ''}>${valueHtml}</dd></div>`;
}

function numSpan(raw, suffix) {
  return `<span data-rm-num="${esc(raw)}">${esc(ptNum(raw))}</span>${suffix ? esc(suffix) : ''}`;
}

function isotopesSection(z, sym, data) {
  const list = data.ISOTOPES[z];
  if (!list || !list.length) return '';
  const natural = list.filter((x) => x.ab != null && x.ab > 0).sort((a, b) => b.ab - a.ab).slice(0, 4);
  const radio = list.filter((x) => x.hlf && x.hlf !== 'stable').slice(0, natural.length ? 2 : 3);
  const L = PT.el.rm;
  let rows = '';
  natural.forEach((x) => {
    const pct = x.ab * 100;
    const shown = pct >= 10 ? pct.toFixed(1) : pct >= 1 ? pct.toFixed(1) : pct >= 0.01 ? pct.toFixed(2) : pct.toExponential(1);
    const width = Math.max(pct, 0.6).toFixed(2);
    const status = x.hlf === 'stable' ? 'stable' : 'radioactive';
    rows += `
          <div class="rm-iso">
            <div class="rm-iso-row"><span><strong>${sup(x.a)}${esc(sym)}</strong> <span class="rm-muted" data-i18n="el.rm.${status}">${esc(L[status])}</span></span><span class="rm-iso-pct" data-rm-num="${shown}%">${esc(ptNum(shown))}%</span></div>
            <div class="rm-iso-bar"><span style="width:${width}%"></span></div>
          </div>`;
  });
  let notes = '';
  if (radio.length) {
    const items = radio.map((x) => `<strong>${sup(x.a)}${esc(sym)}</strong> <span data-i18n="el.rm.halfLife">${esc(L.halfLife)}</span> <span class="rm-hl" data-hl-pt="${esc(halfLifeText(x.hlf, 'pt'))}" data-hl-en="${esc(halfLifeText(x.hlf, 'en'))}">${esc(halfLifeText(x.hlf, 'pt'))}</span>`).join(' · ');
    notes = natural.length
      ? `\n          <p class="rm-iso-note"><span data-i18n="el.rm.radioactive">${esc(L.radioactive)}</span>: ${items}</p>`
      : `\n          <p class="rm-iso-note"><span data-i18n="el.rm.noStable">${esc(L.noStable)}</span> ${items}</p>`;
  }
  if (!rows && !notes) return '';
  return `
      <section class="rm-el-sec" aria-labelledby="rm-iso-h">
        <h2 id="rm-iso-h" data-i18n="el.rm.isotopes">${esc(L.isotopes)}</h2>
        <div class="rm-iso-list">${rows}${notes}
        </div>
      </section>`;
}

/* Bohr diagram of the neutral atom: nucleus with the symbol, one ring per
   shell, electrons spaced evenly (K at the top). Colours come from CSS. */
const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
function shellSvg(sym, shells) {
  const size = 240, c = size / 2, r0 = 34, rMax = 112;
  const step = shells.length > 1 ? Math.min(26, (rMax - r0) / (shells.length - 1)) : 0;
  const dot = shells.length > 5 ? 3.2 : shells.length > 3 ? 3.8 : 4.6;
  let rings = '', dots = '';
  shells.forEach((n, i) => {
    const r = r0 + step * i;
    rings += `<circle class="rm-shell-ring" cx="${c}" cy="${c}" r="${r.toFixed(1)}"/>`;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (k / n) * Math.PI * 2 + i * 0.35;
      dots += `<circle class="rm-shell-e" cx="${(c + Math.cos(a) * r).toFixed(1)}" cy="${(c + Math.sin(a) * r).toFixed(1)}" r="${dot}"/>`;
    }
  });
  return `<svg class="rm-shell-svg" viewBox="0 0 ${size} ${size}" role="img" aria-labelledby="rm-shells-h">${rings}<circle class="rm-shell-nuc" cx="${c}" cy="${c}" r="20"/><text class="rm-shell-sym" x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central">${esc(sym)}</text>${dots}</svg>`;
}

function shellsSection(el) {
  const subs = ATOM.groundState(el.z);
  const shells = ATOM.shells(subs);
  const L = PT.el.rm, LE = EN.el.rm;
  const list = shells.map((n, i) => `<li><b>${SHELL_LETTERS[i]}</b><span>${n}</span></li>`).join('');
  const outer = shells[shells.length - 1];
  const tplPt = L.shellsOuter.replace('{n}', outer).replace('{shell}', SHELL_LETTERS[shells.length - 1]);
  const tplEn = LE.shellsOuter.replace('{n}', outer).replace('{shell}', SHELL_LETTERS[shells.length - 1]);
  return `
      <section class="rm-el-sec rm-el-shells" aria-labelledby="rm-shells-h">
        <h2 id="rm-shells-h" data-i18n="el.rm.shellsTitle">${esc(L.shellsTitle)}</h2>
        <div class="rm-shells">
          ${shellSvg(el.sym, shells)}
          <div class="rm-shells-txt">
            <ol class="rm-shell-list" aria-label="${esc(L.shellsTitle)}" data-i18n-attr="aria-label:el.rm.shellsTitle">${list}</ol>
            <p class="rm-shells-conf"><span data-i18n="el.rm.config">${esc(L.config)}</span> <span class="rm-mono">${esc(ATOM.notation(subs, true))}</span></p>
            <p class="rm-shells-outer" data-l10n-pt="${esc(tplPt)}" data-l10n-en="${esc(tplEn)}">${esc(tplPt)}</p>
            <a class="rm-shells-link" href="/viewer/atomic-models.html?model=bohr&amp;el=${encodeURIComponent(el.sym)}" data-i18n="el.rm.shellsLink">${esc(L.shellsLink)}</a>
          </div>
        </div>
      </section>`;
}

/* A measured property with unit (element-props.js): PT and EN text, ≈ when predicted. */
function propRow(key, label, prop, z, raw) {
  const v = PROPS.value(prop, z, raw);
  if (v == null) return null;
  const unit = PROPS.PROPS[prop].unit;
  const pt = PROPS.format(prop, v, 'pt', z) + (unit ? ' ' + unit : '');
  const en = PROPS.format(prop, v, 'en', z) + (unit ? ' ' + unit : '');
  return factRow(key, label, `<span data-l10n-pt="${esc(pt)}" data-l10n-en="${esc(en)}">${esc(pt)}</span>`);
}

/* Real colour of the element at room conditions: swatch + PT/EN text
   (element-appearance.js). Unobserved colours get a hatched swatch. */
function appearanceRow(z, label) {
  const a = APPEARANCE.byZ(z);
  if (!a) return null;
  const swatch = `<span class="rm-swatch" style="background-color:${a.hex}" data-known="${a.known ? 'true' : 'false'}" aria-hidden="true"></span>`;
  return `<div><dt data-i18n="el.rm.appearance">${esc(label)}</dt><dd class="rm-appearance">${swatch}<span data-l10n-pt="${esc(a.pt)}" data-l10n-en="${esc(a.en)}">${esc(a.pt)}</span></dd></div>`;
}

function allotropesSection(z, namePt) {
  const entry = ALLOTROPES[z];
  if (!entry) return '';
  const [elem, forms] = entry;
  const L = PT.el.rm;
  const cards = forms.map((k) => {
    const a = L.allo[k];
    return `<a class="rm-allo" href="/viewer/allotropes.html?elem=${elem}&amp;form=${k}"><span class="rm-allo-n" data-i18n="el.rm.allo.${k}.n">${esc(a.n)}</span><span class="rm-allo-d" data-i18n="el.rm.allo.${k}.d">${esc(a.d)}</span></a>`;
  }).join('\n          ');
  return `
      <section class="rm-el-sec" aria-labelledby="rm-forms-h">
        <h2 id="rm-forms-h" data-rm-tpl="el.rm.formsTitle">${esc(L.formsTitle.replace('{name}', namePt.toLowerCase()))}</h2>
        <p class="rm-el-sec-lead" data-i18n="el.rm.formsLead">${esc(L.formsLead)}</p>
        <div class="rm-allo-grid">
          ${cards}
        </div>
      </section>`;
}

function build(el, data) {
  const z = el.z;
  const L = PT.el.rm;
  const rm = data.RM;
  const cat = rm.rmCatOf(z);
  const catInfo = rm.RM_CATS.find((c) => c.id === cat);
  const lite = rm.RM_ELEMENTS[z - 1];
  const fblock = cat === 'lan' || cat === 'act';
  const period = el.period || (lite[7] === 9 ? 6 : lite[7] === 10 ? 7 : lite[7]);
  const kicker = fblock
    ? `${catInfo.one[0]} · ${L.period} ${period}`
    : `${catInfo.one[0]} · ${L.group} ${el.group} · ${L.period} ${period}`;
  const ex = data.getExtra(z) || {};
  const ex2 = data.getExtra2(z) || {};
  const mass = massLabel(el.mass);
  const prev = z > 1 ? data.RM.RM_ELEMENTS[z - 2] : null;
  const next = z < 118 ? data.RM.RM_ELEMENTS[z] : null;

  const facts = [];
  facts.push(factRow('mass', L.mass, mass.startsWith('[') ? esc(mass) + ' u' : numSpan(String(el.mass), ' u')));
  if (ex.econfig && ex.econfig !== '—') facts.push(factRow('config', L.config, esc(ex.econfig), true));
  if (el.en != null && el.en !== '—' && el.en !== '') facts.push(factRow('en', L.en, numSpan(String(el.en))));
  facts.push(factRow('state', L.state, `<span data-page-field="state">${esc(el.state)}</span>`));
  const look = appearanceRow(z, L.appearance);
  if (look) facts.push(look);
  if (ex2.density && ex2.density !== '—') {
    const dm = String(ex2.density).match(/^([\d.]+)\s*(.*)$/);
    facts.push(factRow('density', L.density, dm ? numSpan(dm[1], ' ' + dm[2]) : esc(ex2.density)));
  }
  const melt = tempLabel(ex.melt);
  if (melt) facts.push(factRow('melt', L.melt, `<span data-rm-num="${esc(melt)}">${esc(ptNum(melt))}</span>`));
  const boil = tempLabel(ex.boil);
  if (boil) facts.push(factRow('boil', L.boil, `<span data-rm-num="${esc(boil)}">${esc(ptNum(boil))}</span>`));
  const extraProps = [
    propRow('covalent', L.covalent, 'covalent', z, {}),
    propRow('ionization', L.ionization, 'ionization', z, { ionization: data.getIonization(z) }),
    propRow('affinity', L.affinity, 'affinity', z, {})
  ].filter(Boolean);
  facts.push.apply(facts, extraProps);
  const disc = [el.disc, el.year].filter((v, idx, arr) => v && arr.indexOf(v) === idx).join(', ');
  if (disc) facts.push(factRow('discovered', L.discovered, `<span data-page-field="disc">${esc(disc)}</span>`));

  const pager = `
      <nav class="rm-pager" aria-label="${esc(L.neighbours)}" data-i18n-attr="aria-label:el.rm.neighbours">
        ${prev ? `<a class="rm-pager-link" href="${prev[5]}.html" data-rm-z="${prev[0]}"><span class="rm-pager-dir" data-i18n="el.rm.prev">${esc(L.prev)}</span><span class="rm-pager-name">${prev[0]} · <span data-rm-elname="${prev[0]}">${esc(prev[2])}</span></span></a>` : '<span></span>'}
        ${next ? `<a class="rm-pager-link rm-pager-next" href="${next[5]}.html" data-rm-z="${next[0]}"><span class="rm-pager-dir" data-i18n="el.rm.next">${esc(L.next)}</span><span class="rm-pager-name"><span data-rm-elname="${next[0]}">${esc(next[2])}</span> · ${next[0]}</span></a>` : '<span></span>'}
      </nav>`;

  return `<div class="content lc-el-page rm-el" data-rm-el="${z}">
    <nav class="rm-crumbs" aria-label="${esc(L.crumbs)}" data-i18n-attr="aria-label:el.rm.crumbs"><a href="../periodic-table.html" data-i18n="common.rm.periodic">${esc(PT.common.rm.periodic)}</a> <span aria-hidden="true">/</span> <span data-rm-cat="${cat}">${esc(catInfo.pt)}</span> <span aria-hidden="true">/</span> <span class="rm-crumbs-here" data-rm-elname="${z}">${esc(el.name)}</span></nav>

    <section class="rm-el-hero">
      <div class="rm-el-tile" data-cat="${cat}">
        <span class="rm-el-tile-z">${z}</span>
        <span class="rm-el-tile-sym">${esc(el.sym)}</span>
        <span class="rm-el-tile-mass">${mass.startsWith('[') ? esc(mass) : numSpan(String(el.mass))}</span>
      </div>
      <div class="rm-el-head">
        <p class="rm-kicker rm-el-kicker kicker" data-rm-kicker data-cat="${cat}" data-group="${fblock ? '' : el.group}" data-period="${period}">${esc(kicker)}</p>
        <h1 class="lc-el-name">${esc(el.name)}</h1>
        <p class="rm-el-lead desc" data-page-field="desc">${esc(el.desc)}</p>
      </div>
      <div class="rm-el-actions">
        <div class="rm-save-slot" data-rm-save-slot></div>
        <a class="rm-btn rm-btn-primary" href="/viewer/atomic-models.html?model=bohr&amp;el=${encodeURIComponent(el.sym)}" data-i18n="el.rm.view3d">${esc(L.view3d)}</a>
      </div>
    </section>

    <div class="rm-el-body">
      <div class="rm-el-main">${allotropesSection(z, el.name)}${shellsSection(el)}${isotopesSection(z, el.sym, data)}
        <div class="lc-el-desc-block" aria-hidden="true"></div>
${pager}
      </div>

      <aside class="rm-el-aside">
        <div class="rm-card rm-el-facts">
          <h2 data-i18n="el.rm.data">${esc(L.data)}</h2>
          <dl class="rm-dl">
            ${facts.join('\n            ')}
          </dl>
          <p class="rm-el-sources" data-i18n="el.rm.sources">${esc(L.sources)}</p>
        </div>
        <div class="rm-card-dark rm-el-cta">
          <p class="rm-el-cta-title" data-rm-tpl="el.rm.calcTitle">${esc(L.calcTitle.replace('{name}', el.name.toLowerCase()))}</p>
          <p class="rm-el-cta-copy" data-rm-tpl="el.rm.calcCopy">${esc(L.calcCopy.replace('{sym}', el.sym))}</p>
          <a href="/calculators.html?formula=${encodeURIComponent(el.sym)}#molar" data-i18n="el.rm.calcLink">${esc(L.calcLink)}</a>
        </div>
      </aside>
    </div>
  </div>`;
}

function migrate(file, data) {
  const html = fs.readFileSync(file, 'utf8');
  const zm = html.match(/window\.PAGE_Z\s*=\s*(\d+)/);
  if (!zm) return 'skip-no-z';
  const z = Number(zm[1]);
  const el = data.ELEMENTS.find((e) => e.z === z);
  if (!el) return 'skip-no-data';
  const main = findElementWithClass(html, 'main');
  if (!main) return 'skip-no-main';
  const content = findElementWithClass(main.html, 'content');
  if (!content) return 'skip-no-content';
  const start = main.start + content.start;
  const end = main.start + content.end;
  let next = html.slice(0, start) + build(el, data) + html.slice(end);
  if (!/assets\/remake\/elements-lite\.js/.test(next)) {
    next = next.replace(/(<script src="[^"]*element-page\.js[^"]*"[^>]*><\/script>)/,
      '<script src="/assets/remake/elements-lite.js?v=202611041200" defer></script>\n$1');
  }
  if (next !== html) fs.writeFileSync(file, next);
  return next !== html ? 'remade' : 'unchanged';
}

if (require.main === module) {
  const data = loadData();
  const files = fs.readdirSync(DIR)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.en.html') && !f.endsWith('.pt.html'))
    .map((f) => path.join(DIR, f));
  const counts = {};
  files.forEach((f) => {
    const r = migrate(f, data);
    counts[r] = (counts[r] || 0) + 1;
  });
  console.log('remake element pages:', counts);
}

module.exports = { build, loadData, halfLifeText };
