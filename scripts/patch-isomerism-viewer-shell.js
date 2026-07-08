// Align viewer/isomerism subpages shell with allotropes/molecules (Lab Console).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'viewer', 'isomerism');

const TOPBAR_TOOLS = `    <button class="theme-btn" data-i18n-toggle
            data-i18n-attr="title:common.langToggle; aria-label:common.langToggle"
            title="Switch language" aria-label="Switch language"
            style="margin-left:auto;width:auto;min-width:32px;padding:0 8px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.5px;">
      <span data-i18n-toggle-label>PT</span>
    </button>
    <button class="theme-btn" onclick="toggleTheme()"
            data-i18n-attr="title:common.themeToggle; aria-label:common.themeToggle"
            title="Toggle theme" aria-label="Toggle theme"
            style="margin-left:0;">
      <svg id="theme-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"></svg>
    </button>`;

const FOOTER_SCRIPT = `<script>
function applyTheme(isDark){
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('atomurus-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  window.dispatchEvent(new CustomEvent('atomurus:themechange',{detail:{isDark}}));
}
function toggleTheme(){ applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark'); }
function updateThemeIcon(isDark){
  const icon = document.getElementById('theme-icon'); if (!icon) return;
  icon.innerHTML = isDark
    ? '<path d="M7.5 1.5A6 6 0 1 0 13.5 7.5a4.5 4.5 0 0 1-6-6z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/>'
    : '<path d="M7.5 1v1M7.5 13v1M1 7.5H0M15 7.5h-1M2.93 2.93l.7.7M11.37 11.37l.7.7M2.93 12.07l.7-.7M11.37 3.63l.7-.7M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>';
}
(function initTheme(){
  const saved = localStorage.getItem('atomurus-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme((saved || (prefersDark ? 'dark' : 'light')) === 'dark');
})();
function toggleMobileSidebar(){
  const s = document.getElementById('sidebar'), o = document.getElementById('mobile-overlay');
  const open = s.classList.contains('mobile-open');
  s.classList.toggle('mobile-open', !open);
  o.classList.toggle('show', !open);
}
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
  document.querySelectorAll('.nav-expandable').forEach(el => {
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
    if (row) row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNavGroup(name); }
    });
  });
})();
</script>`;

const VZ_ICON_ATOMIC = '<svg class="vz-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(120 8 8)"/></svg>';
const VZ_ICON_MOL = '<svg class="vz-icon" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2" fill="currentColor"/><circle cx="12" cy="6" r="2" fill="currentColor" opacity=".7"/><circle cx="8" cy="12" r="2" fill="currentColor" opacity=".5"/><line x1="4" y1="4" x2="12" y2="6" stroke="currentColor" stroke-width="1"/><line x1="12" y1="6" x2="8" y2="12" stroke="currentColor" stroke-width="1"/><line x1="4" y1="4" x2="8" y2="12" stroke="currentColor" stroke-width="1"/></svg>';
const VZ_ICON_ALLO = '<svg class="vz-icon" viewBox="0 0 16 16" fill="none"><polygon points="8,2 14,6 12,13 4,13 2,6" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>';
const VZ_ICON_ISO = '<svg class="vz-icon" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2" fill="currentColor" opacity=".85"/><circle cx="12" cy="8" r="2" fill="currentColor" opacity=".85"/><line x1="4" y1="8" x2="4" y2="3.5" stroke="currentColor" stroke-width="1.1"/><line x1="12" y1="8" x2="12" y2="3.5" stroke="currentColor" stroke-width="1.1"/><line x1="4" y1="8" x2="4" y2="12.5" stroke="currentColor" stroke-width="1.1"/><line x1="12" y1="8" x2="12" y2="12.5" stroke="currentColor" stroke-width="1.1"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1.5" opacity=".5"/></svg>';

function buildVzTabs(isoHref) {
  return `      <nav class="vz-tabs" aria-label="Visualizador">
        <a class="vz-tab" href="../../atomic-models.html">
          <span class="vz-num">01</span>
          ${VZ_ICON_ATOMIC}
          <span data-i18n="atomicModels.tabAtomic">Atomic Models</span>
        </a>
        <a class="vz-tab" href="../../molecules.html">
          <span class="vz-num">02</span>
          ${VZ_ICON_MOL}
          <span data-i18n="atomicModels.tabMolecules">Molecules</span>
        </a>
        <a class="vz-tab" href="../../allotropes.html">
          <span class="vz-num">03</span>
          ${VZ_ICON_ALLO}
          <span data-i18n="atomicModels.tabAllotropes">Allotropes</span>
        </a>
        <a class="vz-tab active" href="${isoHref}" aria-current="page">
          <span class="vz-num">04</span>
          ${VZ_ICON_ISO}
          <span data-i18n="common.nav.isomerism">Isomerism</span>
        </a>
      </nav>`;
}

function buildSidebar(activeHref, isPt) {
  const isoLink = activeHref;
  return `<aside class="sidebar" id="sidebar">
  <a class="logo-wrap" href="../../../index.html" title="Atomurus home" style="text-decoration:none;color:inherit;">
    <div class="logo-mark">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
        <ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/>
        <ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(60 8 8)"/>
        <ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(120 8 8)"/>
      </svg>
    </div>
    <div><div class="logo-text">Atomurus</div><div class="logo-tag">v1.11</div></div>
  </a>
  <div class="sidebar-scroll">
    <div class="nav-section" style="margin-bottom:6px;">
      <a class="nav-item" href="../../../index.html" style="opacity:.7;font-size:12px;">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2l6 6M3 7v7h10V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        <span data-i18n="common.nav.home">Home</span>
      </a>
    </div>
    <div class="nav-section">
      <div class="nav-label"><span class="nl-no">00</span><span data-i18n="common.nav.laboratory">Laboratory</span></div>
      <a class="nav-item" href="../../../periodic-table.html">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/></svg>
        <span data-i18n="common.nav.periodic">Periodic Table</span>
      </a>
      <div class="nav-expandable" data-expand="visualizador">
        <div class="nav-row" onclick="toggleNavGroup('visualizador')" role="button" tabindex="0" aria-expanded="false">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(120 8 8)"/></svg>
          <span data-i18n="common.nav.visualizador">Visualizador</span>
          <svg class="nav-chevron" viewBox="0 0 11 11" fill="none"><path d="M3.5 1.5l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="nav-children">
          <a class="nav-item" href="../../atomic-models.html">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/></svg>
            <span data-i18n="common.nav.atomicModels">Atomic Models</span>
          </a>
          <a class="nav-item" href="../../molecules.html">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2" fill="currentColor"/><circle cx="12" cy="6" r="2" fill="currentColor" opacity=".7"/><circle cx="8" cy="12" r="2" fill="currentColor" opacity=".5"/><line x1="4" y1="4" x2="12" y2="6" stroke="currentColor" stroke-width="1"/></svg>
            <span data-i18n="common.nav.molecules">Molecules</span>
          </a>
          <a class="nav-item" href="../../allotropes.html">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><polygon points="8,2 14,6 12,13 4,13 2,6" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
            <span data-i18n="common.nav.allotropes">Allotropes</span>
          </a>
          <a class="nav-item active" href="${isoLink}" aria-current="page">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="2" fill="currentColor" opacity=".85"/>
              <circle cx="12" cy="8" r="2" fill="currentColor" opacity=".85"/>
              <line x1="4" y1="8" x2="4" y2="3.5" stroke="currentColor" stroke-width="1.1"/>
              <line x1="12" y1="8" x2="12" y2="3.5" stroke="currentColor" stroke-width="1.1"/>
              <line x1="4" y1="8" x2="4" y2="12.5" stroke="currentColor" stroke-width="1.1"/>
              <line x1="12" y1="8" x2="12" y2="12.5" stroke="currentColor" stroke-width="1.1"/>
              <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1.5" opacity=".5"/>
            </svg>
            <span data-i18n="common.nav.isomerism">Isomerism</span>
          </a>
        </div>
      </div>
      <a class="nav-item" href="../../../calculators.html">
        <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"/><line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" stroke-width="1.1"/><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1"/><line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" stroke-width="1"/></svg>
        <span data-i18n="common.nav.calc">Calculators</span>
      </a>
    </div>
  </div>
  <div class="sidebar-foot">
    <a class="nav-item" href="../../../config.html">
      <svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      <span data-i18n="common.nav.settings">Settings</span>
    </a>
  </div>
</aside>`;
}

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const base = path.basename(filePath);
  const isPt = base.endsWith('.pt.html');
  const fileName = base.replace('.pt.html', '.html').replace('.html', '') + (isPt ? '.pt.html' : '.html');
  const inSpatial = filePath.includes(path.sep + 'spatial' + path.sep);
  const isoHref = inSpatial
    ? (isPt ? 'geometric.pt.html' : 'geometric.html')
    : (isPt ? 'function.pt.html' : 'function.html');
  const constEntry = isPt ? '../constitutional/function.pt.html' : '../constitutional/function.html';
  const espEntry = isPt ? '../spatial/geometric.pt.html' : '../spatial/geometric.html';

  // Head: lab-console order like molecules
  if (!html.includes('lc-statusbar-spacing-applied')) {
    html = html.replace(
      /<link rel="stylesheet" href="\.\.\/\.\.\/\.\.\/atomurus-lab-console\.css[^"]*">\s*\n<script src="\.\.\/\.\.\/\.\.\/lazy-ads\.js[^"]*" defer><\/script>/,
      `<style id="lc-statusbar-spacing-applied">
  .main, body.lc-app-main { padding-bottom: 22px; }
</style>
<link rel="stylesheet" href="../../../atomurus-lab-console.css?v=202605250345">
<script src="../../../lazy-ads.js?v=202605250345" defer></script>`
    );
  }

  // Sidebar
  const sidebarMatch = html.match(/<aside class="sidebar"[\s\S]*?<\/aside>/);
  if (sidebarMatch) {
    html = html.replace(sidebarMatch[0], buildSidebar(fileName, isPt));
  }

  // Topbar
  const bcChev = '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="opacity:.35"><path d="M3.5 1.5l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  let bcMiddle = inSpatial
    ? `<span data-i18n="isomerism.groupEspacial">Isomeria Espacial</span>`
    : `<span data-i18n="isomerism.groupConstitucional">Isomeria Constitucional</span>`;
  const currentMatch = html.match(/<span class="current">([^<]*)<\/span>/);
  const currentLabel = currentMatch ? currentMatch[1] : '';

  const topbarNew = `  <div class="topbar">
    <button class="mobile-menu-btn" onclick="toggleMobileSidebar()" aria-label="Abrir menu">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="4.5" x2="14" y2="4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="2" y1="11.5" x2="14" y2="11.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>
    <div class="breadcrumb">
      Workspace
      ${bcChev}
      <span data-i18n="common.nav.isomerism">Isomerism</span>
      ${bcChev}
      ${bcMiddle}
      ${bcChev}
      <span class="current">${currentLabel}</span>
    </div>
${TOPBAR_TOOLS}
  </div>`;

  html = html.replace(/<div class="topbar">[\s\S]*?<\/div>\s*\n\s*<div class="data-strip">/, topbarNew + '\n\n  <div class="data-strip">');

  // data-strip module i18n
  html = html.replace(
    /<span class="ds-k">módulo<\/span><span class="ds-v ds-hi">[^<]*<\/span>/,
    '<span class="ds-k">module</span><span class="ds-v ds-hi" data-i18n="isomerism.dsModule">organic chemistry</span>'
  );

  // Reorder content: extract blocks
  const innerMatch = html.match(/<div class="content-inner">([\s\S]*?)<\/div>\s*<\/div>\s*<\/main>/);
  if (!innerMatch) {
    console.warn('No content-inner:', filePath);
    return;
  }
  let inner = innerMatch[1];

  const extract = (re) => {
    const m = inner.match(re);
    if (!m) return '';
    inner = inner.replace(m[0], '');
    return m[0].trim();
  };

  const vzOld = extract(/<nav class="vz-tabs"[\s\S]*?<\/nav>/);
  const isoGroup = extract(/<div class="iso-group-toggle"[\s\S]*?<\/div>\s*\n/);
  const phKicker = extract(/<div class="ph-kicker"[\s\S]*?<\/div>|<!--[\s\S]*?-->\s*\n\s*<div class="ph-kicker"[\s\S]*?<\/div>/);
  const phTitle = extract(/<h1 class="ph-title"[\s\S]*?<\/h1>/);
  const phDesc = extract(/<p class="ph-desc"[\s\S]*?<\/p>/);
  const avSub = extract(/<div class="av-substrip"[\s\S]*?<\/div>/);
  const subTabs = extract(/<nav class="sub-tabs"[\s\S]*?<\/nav>/);

  const vzNew = buildVzTabs(fileName);
  const constActive = inSpatial ? '' : ' active';
  const espActive = inSpatial ? ' active' : '';

  const isoGroupFixed = `      <div class="iso-group-toggle" role="group" aria-label="Grupo de Isomeria">
        <a class="iso-group-btn grp-const${constActive}" href="${constEntry}">
          <svg class="iso-group-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="5" height="8" rx="2" stroke="currentColor" stroke-width="1.2" fill="none"/><rect x="9" y="4" width="5" height="8" rx="2" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="7" y1="8" x2="9" y2="8" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.5,1" stroke-linecap="round"/></svg>
          <div class="iso-group-label">
            <span class="iso-group-name" data-i18n="isomerism.groupConstitucional">Isomeria Constitucional</span>
            <span class="iso-group-count">função · cadeia · posição · metameria · tautomeria</span>
          </div>
        </a>
        <a class="iso-group-btn grp-esp${espActive}" href="${espEntry}">
          <svg class="iso-group-icon" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="11" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1.5" opacity=".6"/></svg>
          <div class="iso-group-label">
            <span class="iso-group-name" data-i18n="isomerism.groupEspacial">Isomeria Espacial</span>
            <span class="iso-group-count">geométrica · óptica</span>
          </div>
        </a>
      </div>`;

  const reordered = [
    phKicker,
    phTitle,
    phDesc,
    vzNew,
    isoGroupFixed,
    avSub,
    subTabs,
    inner.trim(),
  ].filter(Boolean).join('\n\n      ');

  html = html.replace(
    /<div class="content-inner">[\s\S]*?<\/div>\s*<\/div>\s*<\/main>/,
    `<div class="content-inner">\n      ${reordered}\n\n    </div>\n  </div>\n</main>`
  );

  // Footer scripts
  html = html.replace(/<script>\s*function applyTheme[\s\S]*?<\/script>\s*(?=<\/body>)/, FOOTER_SCRIPT + '\n');

  // page-share campaign for isomerism paths
  if (!html.includes('isomerism_share')) {
    // page-share-init handles generic path; optional future
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Patched', path.relative(ROOT, filePath));
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) patchFile(p);
  }
}

walk(ROOT);
console.log('Done.');
