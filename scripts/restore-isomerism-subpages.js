// Restore isomerism subpage body content from viewer/isomerism.html hub panels.
const fs = require('fs');
const path = require('path');

const HUB = fs.readFileSync(path.join(__dirname, '..', 'viewer', 'isomerism.html'), 'utf8');
const ROOT = path.join(__dirname, '..', 'viewer', 'isomerism');

const PAGES = [
  { file: 'constitutional/function.html', panel: 'panel-funcao', key: 'funcao', const: true, badge: 'C1', tab: 'tabFunction', dsSub: 'função', dsEx: 'C₂H₆O', mol3d: 'ethanol' },
  { file: 'constitutional/chain.html', panel: 'panel-cadeia', key: 'cadeia', const: true, badge: 'C2', tab: 'tabChain', dsSub: 'cadeia', dsEx: 'C₄H₁₀', mol3d: 'butane' },
  { file: 'constitutional/position.html', panel: 'panel-posicao', key: 'posicao', const: true, badge: 'C3', tab: 'tabPosition', dsSub: 'posição', dsEx: 'C₄H₈', mol3d: 'but1ene' },
  { file: 'constitutional/metamerism.html', panel: 'panel-metameria', key: 'metameria', const: true, badge: 'C4', tab: 'tabMetamerism', dsSub: 'metameria', dsEx: 'C₄H₁₀O', mol3d: 'dimethylether' },
  { file: 'constitutional/tautomerism.html', panel: 'panel-tautomeria', key: 'tautomeria', const: true, badge: 'C5', tab: 'tabTautomerism', dsSub: 'tautomeria', dsEx: 'C₃H₆O', mol3d: 'acetone' },
  { file: 'spatial/geometric.html', panel: 'panel-geometrica', key: 'geometrica', const: false, badge: 'E1', tab: 'tabGeometric', dsSub: 'geométrica (cis/trans)', dsEx: 'cis/trans · C₄H₈', mol3d: 'cis2butene' },
  { file: 'spatial/optical.html', panel: 'panel-optica', key: 'optica', const: false, badge: 'E2', tab: 'tabOptical', dsSub: 'óptica (R/S)', dsEx: 'CHFClBr', mol3d: 'chfclbr' },
];

const TAB_MAP = {
  funcao: { num: 'C1', file: 'function' },
  cadeia: { num: 'C2', file: 'chain' },
  posicao: { num: 'C3', file: 'position' },
  metameria: { num: 'C4', file: 'metamerism' },
  tautomeria: { num: 'C5', file: 'tautomerism' },
  geometrica: { num: 'E1', file: 'geometric' },
  optica: { num: 'E2', file: 'optical' },
};

const BADGE_MAP = {
  funcao: { num: 'C1', cls: 'iso-badge-green' },
  cadeia: { num: 'C2', cls: 'iso-badge-amber' },
  posicao: { num: 'C3', cls: 'iso-badge-blue' },
  metameria: { num: 'C4', cls: 'iso-badge-amber' },
  tautomeria: { num: 'C5', cls: 'iso-badge-green' },
  geometrica: { num: 'E1', cls: 'iso-badge-blue' },
  optica: { num: 'E2', cls: 'iso-badge-purple' },
};

function extractPanel(panelId) {
  const marker = `id="${panelId}"`;
  const startIdx = HUB.indexOf(marker);
  if (startIdx < 0) throw new Error('Panel not found: ' + panelId);
  const open = HUB.lastIndexOf('<div class="iso-panel', startIdx);
  if (open < 0) throw new Error('Panel open not found: ' + panelId);
  let depth = 0;
  let started = false;
  let end = open;
  for (let i = open; i < HUB.length; i++) {
    if (HUB.startsWith('<div', i)) {
      depth++;
      started = true;
    } else if (HUB.startsWith('</div>', i)) {
      depth--;
      if (started && depth === 0) {
        end = i + 6;
        break;
      }
    }
  }
  let html = HUB.slice(open, end);
  html = html.replace(/^<div class="iso-panel[^>]*>\s*/m, '');
  html = html.replace(/\s*<\/div>\s*$/, '');
  return html.trim();
}

function fixBadge(html, key) {
  const b = BADGE_MAP[key];
  if (!b) return html;
  return html.replace(
    /<span class="iso-badge[^"]*">[^<]+<\/span>/,
    `<span class="iso-badge ${b.cls}">${b.num}</span>`
  );
}

function buildVzTabs(activeFile) {
  return `      <nav class="vz-tabs" aria-label="Visualizador">
        <a class="vz-tab" href="../../atomic-models.html">
          <span class="vz-num">01</span>
          <svg class="vz-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(120 8 8)"/></svg>
          <span data-i18n="atomicModels.tabAtomic">Atomic Models</span>
        </a>
        <a class="vz-tab" href="../../molecules.html">
          <span class="vz-num">02</span>
          <svg class="vz-icon" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2" fill="currentColor"/><circle cx="12" cy="6" r="2" fill="currentColor" opacity=".7"/><circle cx="8" cy="12" r="2" fill="currentColor" opacity=".5"/><line x1="4" y1="4" x2="12" y2="6" stroke="currentColor" stroke-width="1"/><line x1="12" y1="6" x2="8" y2="12" stroke="currentColor" stroke-width="1"/><line x1="4" y1="4" x2="8" y2="12" stroke="currentColor" stroke-width="1"/></svg>
          <span data-i18n="atomicModels.tabMolecules">Molecules</span>
        </a>
        <a class="vz-tab" href="../../allotropes.html">
          <span class="vz-num">03</span>
          <svg class="vz-icon" viewBox="0 0 16 16" fill="none"><polygon points="8,2 14,6 12,13 4,13 2,6" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>
          <span data-i18n="atomicModels.tabAllotropes">Allotropes</span>
        </a>
        <a class="vz-tab active" href="${activeFile}" aria-current="page">
          <span class="vz-num">04</span>
          <svg class="vz-icon" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2" fill="currentColor" opacity=".85"/><circle cx="12" cy="8" r="2" fill="currentColor" opacity=".85"/><line x1="4" y1="8" x2="4" y2="3.5" stroke="currentColor" stroke-width="1.1"/><line x1="12" y1="8" x2="12" y2="3.5" stroke="currentColor" stroke-width="1.1"/><line x1="4" y1="8" x2="4" y2="12.5" stroke="currentColor" stroke-width="1.1"/><line x1="12" y1="8" x2="12" y2="12.5" stroke="currentColor" stroke-width="1.1"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1.5" opacity=".5"/></svg>
          <span data-i18n="common.nav.isomerism">Isomerism</span>
        </a>
      </nav>`;
}

function buildGroupToggle(isConst) {
  const constHref = '../constitutional/function.html';
  const espHref = '../spatial/geometric.html';
  const ca = isConst ? ' active' : '';
  const ea = isConst ? '' : ' active';
  return `      <div class="iso-group-toggle" role="group" aria-label="Grupo de Isomeria">
        <a class="iso-group-btn grp-const${ca}" href="${constHref}">
          <svg class="iso-group-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="5" height="8" rx="2" stroke="currentColor" stroke-width="1.2" fill="none"/><rect x="9" y="4" width="5" height="8" rx="2" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="7" y1="8" x2="9" y2="8" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.5,1" stroke-linecap="round"/></svg>
          <div class="iso-group-label">
            <span class="iso-group-name" data-i18n="isomerism.groupConstitucional">Isomeria Constitucional</span>
            <span class="iso-group-count" data-i18n="isomerism.groupConstCount">função · cadeia · posição · metameria · tautomeria</span>
          </div>
        </a>
        <a class="iso-group-btn grp-esp${ea}" href="${espHref}">
          <svg class="iso-group-icon" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="11" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1.5" opacity=".6"/></svg>
          <div class="iso-group-label">
            <span class="iso-group-name" data-i18n="isomerism.groupEspacial">Isomeria Espacial</span>
            <span class="iso-group-count" data-i18n="isomerism.groupEspCount">geométrica · óptica</span>
          </div>
        </a>
      </div>`;
}

function buildSubTabs(isConst, activeKey) {
  const ext = '.html';
  const tabs = isConst
    ? ['funcao', 'cadeia', 'posicao', 'metameria', 'tautomeria']
    : ['geometrica', 'optica'];
  const tabKeys = {
    funcao: 'tabFunction', cadeia: 'tabChain', posicao: 'tabPosition',
    metameria: 'tabMetamerism', tautomeria: 'tabTautomerism',
    geometrica: 'tabGeometric', optica: 'tabOptical',
  };
  const labels = {
    funcao: 'Função', cadeia: 'Cadeia', posicao: 'Posição',
    metameria: 'Metameria', tautomeria: 'Tautomeria',
    geometrica: 'Geométrica', optica: 'Óptica',
  };
  const lines = tabs.map((t) => {
    const tm = TAB_MAP[t];
    const active = t === activeKey;
    const cls = active ? (isConst ? 'sub-tab active' : 'sub-tab active-esp') : 'sub-tab';
    const href = tm.file + ext;
    return `        <a class="${cls}" href="${href}"><span class="sub-num">${tm.num}</span><span data-i18n="isomerism.${tabKeys[t]}">${labels[t]}</span></a>`;
  });
  const ariaKey = isConst ? 'isomerism.groupConstitucional' : 'isomerism.groupEspacial';
  return `      <nav class="sub-tabs" role="tablist" data-i18n-attr="aria-label:${ariaKey}" aria-label="Isomerism">\n${lines.join('\n')}\n      </nav>`;
}

function extractBlock(startMarker, endMarker) {
  const start = HUB.indexOf(startMarker);
  if (start < 0) return '';
  const end = HUB.indexOf(endMarker, start);
  if (end < 0) return '';
  return HUB.slice(start + startMarker.length, end).trim();
}

function buildExampleSelector(page) {
  const href = page.mol3d
    ? `../../molecules.html?mol=${page.mol3d}`
    : '../../molecules.html';
  const disabled = page.mol3d ? '' : ' aria-disabled="true"';
  return `      <section class="iso-selector" data-iso-selector>
        <div class="iso-selector-title" data-i18n="isomerism.selectorTitle">Study helpers</div>
        <div class="iso-selector-actions">
          <button type="button" class="iso-selector-btn" data-iso-action="ex1" data-i18n="isomerism.selectorEx1">See example 1</button>
          <button type="button" class="iso-selector-btn" data-iso-action="ex2" data-i18n="isomerism.selectorEx2">See example 2</button>
          <button type="button" class="iso-selector-btn" data-iso-action="compare" data-i18n="isomerism.selectorCompare">Compare side by side</button>
          <a class="iso-selector-link${page.mol3d ? '' : ' is-disabled'}" href="${href}"${disabled} data-i18n="isomerism.selector3d">Open in 3D viewer</a>
        </div>
      </section>`;
}

const OVERVIEW_HTML = extractBlock('<!-- ISO_OVERVIEW -->', '<!-- /ISO_OVERVIEW -->');
const QUIZ_HTML = extractBlock('<!-- ISO_QUIZ -->', '<!-- /ISO_QUIZ -->');

const QUIZ_SCRIPT = `
<script>
(function initIsoQuiz(){
  function msg(ok){
    if(!window.I18N) return ok ? 'Correct!' : 'Not quite.';
    return I18N.t(ok ? 'isomerism.quiz.feedbackCorrect' : 'isomerism.quiz.feedbackWrong');
  }
  document.querySelectorAll('.iso-quiz-item').forEach(function(item){
    var ans=item.getAttribute('data-answer');
    var fb=item.querySelector('.iso-quiz-feedback');
    item.querySelectorAll('button[data-opt]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var ok=btn.getAttribute('data-opt')===ans;
        if(fb){ fb.hidden=false; fb.textContent=msg(ok); fb.className='iso-quiz-feedback '+(ok?'ok':'bad'); }
        item.querySelectorAll('button').forEach(function(b){ b.disabled=true; });
      });
    });
  });
  if(window.I18N&&I18N.onChange) I18N.onChange(function(){ document.querySelectorAll('.iso-quiz-feedback').forEach(function(f){ f.hidden=true; }); document.querySelectorAll('.iso-quiz-item button').forEach(function(b){ b.disabled=false; }); });
})();
</script>`;

const SELECTOR_SCRIPT = `
<script>
(function initIsoSelector(){
  var wrap = document.querySelector('[data-iso-selector]');
  var pair = document.querySelector('.mol-pair');
  if(!wrap || !pair) return;
  var cards = pair.querySelectorAll('.mol-card');
  var buttons = wrap.querySelectorAll('[data-iso-action]');

  function focusCard(idx){
    if(!cards[idx]) return;
    cards.forEach(function(c){ c.classList.remove('iso-card-focus'); });
    cards[idx].classList.add('iso-card-focus');
    cards[idx].scrollIntoView({ behavior:'smooth', block:'center' });
  }

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var act = btn.getAttribute('data-iso-action');
      if(act === 'ex1') focusCard(0);
      if(act === 'ex2') focusCard(1);
      if(act === 'compare') pair.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  });
})();
</script>`;

function buildBody(page) {
  const panelHtml = fixBadge(extractPanel(page.panel), page.key);
  const titleAttr = page.key === 'geometrica' || page.key === 'optica' ? 'data-i18n-html' : 'data-i18n';
  const activeFile = TAB_MAP[page.key].file + '.html';
  const groupI18n = page.const ? 'isomerism.avGroupConst' : 'isomerism.avGroupEsp';
  const overviewBlock = page.key === 'funcao' && OVERVIEW_HTML ? `\n${OVERVIEW_HTML}\n` : '';
  const quizBlock = page.key === 'funcao' && QUIZ_HTML ? `\n${QUIZ_HTML}\n` : '';

  return `      <div class="ph-kicker" data-i18n="isomerism.kicker">§ 04 · Visualization</div>

      <h1 class="ph-title" ${titleAttr}="isomerism.${page.key}.title">Title</h1>

      <p class="ph-desc" data-i18n-html="isomerism.${page.key}.desc">Desc</p>

${buildVzTabs(activeFile)}

${buildGroupToggle(page.const)}

      <div class="av-substrip">
        <span class="av-k" data-i18n="isomerism.avGroup">group</span><span class="av-v" data-i18n="${groupI18n}">constitutional</span>
        <span class="av-sep"></span>
        <span class="av-k" data-i18n="isomerism.avType">type</span><span class="av-v" data-i18n="isomerism.${page.key}.avType">function</span>
        <span class="av-sep"></span>
        <span class="av-k" data-i18n="isomerism.avLevel">level</span><span class="av-v" data-i18n="isomerism.avLevelVal">high school · college prep</span>
      </div>

${buildSubTabs(page.const, page.key)}
${buildExampleSelector(page)}
${overviewBlock}
      ${panelHtml}
${quizBlock}`;
}

function patchHead(shell, page) {
  const k = page.key;
  const folder = page.const ? 'constitutional' : 'spatial';
  const file = TAB_MAP[k].file;
  let h = shell;
  h = h.replace(/<html lang="[^"]*"/, '<html lang="en"');
  // Faster PT reveal: i18n.js removes lang-pt-pending on init; 120ms is a safety net only.
  h = h.replace(
    /setTimeout\(function\(\)\{document\.documentElement\.classList\.remove\('lang-pt-pending'\);\},\d+\)/,
    "setTimeout(function(){document.documentElement.classList.remove('lang-pt-pending');},120)"
  );
  h = h.replace(
    /<title>[^<]*<\/title>/,
    `<title data-i18n="isomerism.${k}.metaTitle">Isomerism | Atomurus</title>`
  );
  h = h.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="Organic isomerism." data-i18n-attr="content:isomerism.${k}.metaDesc">`
  );
  // Dedupe hreflang alternates accumulated across restore runs.
  h = h.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
  const canonBlock = `<link rel="canonical" href="https://atomurus.com/viewer/isomerism/${folder}/${file}">
<link rel="alternate" hreflang="en" href="https://atomurus.com/viewer/isomerism/${folder}/${file}?lang=en">
<link rel="alternate" hreflang="pt-BR" href="https://atomurus.com/viewer/isomerism/${folder}/${file}?lang=pt-BR">
<link rel="alternate" hreflang="x-default" href="https://atomurus.com/viewer/isomerism/${folder}/${file}">`;
  h = h.replace(/<link rel="canonical" href="[^"]*">\n?/, canonBlock + '\n');
  if (!h.includes('rel="preload" href="../../../i18n.js')) {
    h = h.replace(
      /<meta charset="UTF-8">/,
      `<meta charset="UTF-8">
<link rel="preload" href="../../../i18n.js?v=202605250345" as="script">
<link rel="preload" href="../../../atomurus-lab-console.css?v=202605250345" as="style">
<link rel="stylesheet" href="../../../atomurus-lab-console.css?v=202605250345">`
    );
  }
  // Remove duplicate stylesheet link if hoisted above inline CSS.
  h = h.replace(/\n<link rel="stylesheet" href="\.\.\/\.\.\/\.\.\/atomurus-lab-console\.css[^"]*">\n(?=<style id="lc-statusbar)/, '\n');
  const scopeKey = page.const ? 'isomerism.dsScopeConst' : 'isomerism.dsScopeEsp';
  h = h.replace(
    /<div class="data-strip">[\s\S]*?<\/div>\s*\n\s*<div class="content">/,
    `<div class="data-strip">
    <span class="ds-k" data-i18n="isomerism.dsKScope">scope</span><span class="ds-v" data-i18n="${scopeKey}">VIEWER.ISOMERISM</span>
    <span class="ds-sep"></span>
    <span class="ds-k" data-i18n="isomerism.dsKSubtype">subtype</span><span class="ds-v" data-i18n="isomerism.${k}.dsSubtype">function</span>
    <span class="ds-sep"></span>
    <span class="ds-k" data-i18n="isomerism.dsKExample">example</span><span class="ds-v">${page.dsEx}</span>
    <span class="ds-spacer"></span>
    <span class="ds-k" data-i18n="isomerism.dsKModule">module</span><span class="ds-v ds-hi" data-i18n="isomerism.dsModule">organic chemistry</span>
  </div>

  <div class="content">`
  );
  const tabKey = {
    funcao: 'tabFunction', cadeia: 'tabChain', posicao: 'tabPosition',
    metameria: 'tabMetamerism', tautomeria: 'tabTautomerism',
    geometrica: 'tabGeometric', optica: 'tabOptical',
  }[k];
  const bcGroup = page.const ? 'isomerism.breadcrumbConst' : 'isomerism.breadcrumbEsp';
  const chev = '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" style="opacity:.35"><path d="M3.5 1.5l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const breadcrumb = `    <div class="breadcrumb">
      <span data-i18n="isomerism.breadcrumbWorkspace">Workspace</span>
      ${chev}
      <span data-i18n="common.nav.isomerism">Isomerism</span>
      ${chev}
      <span data-i18n="${bcGroup}">Group</span>
      ${chev}
      <span class="current" data-i18n="isomerism.${tabKey}">Tab</span>
    </div>`;
  h = h.replace(/<div class="breadcrumb">[\s\S]*?<\/div>/, breadcrumb);
  return h;
}

const PT_REDIRECT = (target) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<script>location.replace('${target}?lang=pt-BR'+location.hash);</script>
</head><body></body></html>
`;

const QUIZ_SCRIPT_RE = /<script>\s*\(function initIsoQuiz\(\)[\s\S]*?<\/script>\s*/;

function baseFooterFrom(filePath) {
  let footer = fs.readFileSync(filePath, 'utf8').split('</main>')[1] || '';
  return footer.replace(QUIZ_SCRIPT_RE, '');
}

for (const page of PAGES) {
  const rel = page.file;
  const filePath = path.join(ROOT, rel);
  const shell = fs.readFileSync(filePath, 'utf8');
  let head = patchHead(shell.split('<div class="content">')[0], page);
  const body = buildBody(page);
  let footer = baseFooterFrom(filePath);
  if (page.key === 'funcao' && !footer.includes('initIsoQuiz')) {
    footer = QUIZ_SCRIPT + footer;
  }
  if (!footer.includes('initIsoSelector')) {
    footer = SELECTOR_SCRIPT + footer;
  }
  const out = head + '<div class="content">\n    <div class="content-inner">\n' + body + '\n    </div>\n  </div>\n</main>' + footer;
  fs.writeFileSync(filePath, out, 'utf8');
  console.log('Restored', rel);

  const ptPath = filePath.replace('.html', '.pt.html');
  const base = path.basename(rel, '.html');
  fs.writeFileSync(ptPath, PT_REDIRECT(base + '.html'), 'utf8');
  console.log('Redirect', rel.replace('.html', '.pt.html'));
}

// Add mirror script for optical (EN + PT)
for (const opticalRel of ['spatial/optical.html', 'spatial/optical.pt.html']) {
  const opticalPath = path.join(ROOT, opticalRel);
  if (!fs.existsSync(opticalPath)) continue;
  let optical = fs.readFileSync(opticalPath, 'utf8');
  if (!optical.includes('function toggleMirror')) {
    optical = optical.replace('</main>', `<script>
function toggleMirror(){
  var btn=document.getElementById('mirror-btn');
  var cards=document.querySelectorAll('.mol-card');
  var on=btn&&btn.getAttribute('aria-pressed')==='true';
  cards.forEach(function(c){ c.style.transform=on?'':'scaleX(-1)'; });
  if(btn){ btn.setAttribute('aria-pressed',on?'false':'true'); }
  var label=document.getElementById('mirror-label');
  if(label&&window.I18N) label.textContent=I18N.t(on?'isomerism.mirrorBtn':'isomerism.mirrorRestore',on?'Espelhar':'Restaurar');
}
</script>
</main>`);
    fs.writeFileSync(opticalPath, optical, 'utf8');
    console.log('Added mirror script to', opticalRel);
  }
}

// Sync to repo-root isomerism/ copy
const ROOT_COPY = path.join(__dirname, '..', 'isomerism');
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else if (ent.name.endsWith('.html')) fs.copyFileSync(s, d);
  }
}
copyDir(ROOT, ROOT_COPY);
console.log('Synced viewer/isomerism → isomerism/');

console.log('Done restore.');
