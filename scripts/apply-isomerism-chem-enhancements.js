// Apply chemist plan enhancements: i18n merge + hub panel patches.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHEM = JSON.parse(fs.readFileSync(path.join(__dirname, 'isomerism-chem-enhancements.json'), 'utf8'));
const I18N_PATH = path.join(ROOT, 'i18n.js');
const HUB_PATH = path.join(ROOT, 'viewer', 'isomerism.html');

function jsStr(s) {
  return JSON.stringify(s);
}

function mergeBlock(isoBlock, blockName, lang) {
  const data = CHEM[blockName][lang];
  if (blockName === 'overview' || blockName === 'quiz') {
    for (const [prop, val] of Object.entries(data)) {
      const line = `\n        ${prop}: ${jsStr(val)},`;
      const propRe = new RegExp(`\\n        ${prop}:\\s*[^\\n]+,?`);
      if (propRe.test(isoBlock)) isoBlock = isoBlock.replace(propRe, line);
      else {
        const ins = isoBlock.indexOf('\n        bondLegendTitle:');
        if (ins > 0) isoBlock = isoBlock.slice(0, ins) + line + isoBlock.slice(ins);
        else {
          const ins2 = isoBlock.indexOf('\n        funcao:');
          isoBlock = isoBlock.slice(0, ins2) + line + isoBlock.slice(ins2);
        }
      }
    }
    return isoBlock;
  }
  const start = isoBlock.indexOf(`${blockName}: {`);
  if (start < 0) return isoBlock;
  let depth = 0;
  let open = -1;
  let close = -1;
  for (let i = start; i < isoBlock.length; i++) {
    if (isoBlock[i] === '{') {
      if (depth === 0) open = i;
      depth++;
    } else if (isoBlock[i] === '}') {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  let inner = isoBlock.slice(open + 1, close);
  for (const [prop, val] of Object.entries(data)) {
    const line = `\n          ${prop}: ${jsStr(val)},`;
    const propRe = new RegExp(`\\n          ${prop}:\\s*[^\\n]+,?`);
    if (propRe.test(inner)) inner = inner.replace(propRe, line);
    else {
      if (!inner.trimEnd().endsWith(',')) inner = inner.replace(/(\S)\s*$/, '$1,');
      inner += line;
    }
  }
  return isoBlock.slice(0, open + 1) + inner + isoBlock.slice(close);
}

function mergeI18n() {
  let src = fs.readFileSync(I18N_PATH, 'utf8');
  for (const lang of ['en', 'pt']) {
    const langMarker = lang === 'en' ? '    en: {' : '    pt: {';
    const langStart = src.indexOf(langMarker);
    const isoStart = src.indexOf('      isomerism: {', langStart);
    const isoEnd = src.indexOf('\n      atomModel: {', isoStart);
    let isoBlock = src.slice(isoStart, isoEnd);
    isoBlock = mergeBlock(isoBlock, 'overview', lang);
    isoBlock = mergeBlock(isoBlock, 'quiz', lang);
    for (const key of ['funcao', 'cadeia', 'posicao', 'metameria', 'tautomeria', 'geometrica', 'optica']) {
      isoBlock = mergeBlock(isoBlock, key, lang);
    }
    src = src.slice(0, isoStart) + isoBlock + src.slice(isoEnd);
  }
  fs.writeFileSync(I18N_PATH, src, 'utf8');
  console.log('Merged chem enhancements into i18n.js');
}

function panelSlice(hub, panelId) {
  const marker = `id="${panelId}"`;
  const startIdx = hub.indexOf(marker);
  if (startIdx < 0) return null;
  const open = hub.lastIndexOf('<div class="iso-panel', startIdx);
  const slice = hub.slice(open);
  const nextComment = slice.search(/\n\s*<!-- ══ PAINEL/);
  const endPanels = slice.indexOf('<!-- ── END PANELS');
  const quizMarker = slice.indexOf('<!-- ISO_QUIZ -->');
  let end = slice.length;
  if (nextComment > 0) end = nextComment;
  if (endPanels > 0) end = Math.min(end, endPanels);
  if (quizMarker > 0) end = Math.min(end, quizMarker);
  return { open, end: open + end, html: slice.slice(0, end) };
}

function insertPanelExtras(hub, panelId, key) {
  const slice = panelSlice(hub, panelId);
  if (!slice) return hub;
  if (slice.html.includes(`isomerism.${key}.goldRule`)) return hub;
  const extras = panelExtras(key);
  const inner = slice.html.replace(/^<div class="iso-panel[^>]*>/, '').replace(/\s*<\/div>\s*$/, '');
  const patchedInner = inner + extras;
  const openTagMatch = slice.html.match(/^<div class="iso-panel[^>]*>/);
  const openTag = openTagMatch ? openTagMatch[0] : '<div class="iso-panel">';
  const replacement = openTag + '\n' + patchedInner.trim() + '\n      </div>';
  return hub.slice(0, slice.open) + replacement + hub.slice(slice.end);
}

function panelExtras(key) {
  let html = `
        <div class="iso-gold-rule iso-callout iso-callout-amber" data-i18n-html="isomerism.${key}.goldRule"></div>
        <div class="iso-in-practice iso-callout iso-callout-blue" data-i18n-html="isomerism.${key}.inPractice"></div>`;
  if (key === 'funcao') {
    html += `
        <p class="iso-mol3d-link"><a href="../../molecules.html" data-i18n="isomerism.funcao.mol3d">View ethanol in 3D →</a></p>`;
  }
  if (key === 'posicao') {
    html += `
        <div class="iso-crosslink iso-callout iso-callout-purple" data-i18n-html="isomerism.posicao.linkGeometric"></div>`;
  }
  if (key === 'metameria') {
    html += `
        <p class="iso-footnote" data-i18n="isomerism.metameria.footnote"></p>`;
  }
  if (key === 'geometrica') {
    html += `
        <div class="iso-crosslink iso-callout iso-callout-purple" data-i18n-html="isomerism.geometrica.linkPosition"></div>
        <div class="iso-extra-note iso-callout iso-callout-amber" data-i18n-html="isomerism.geometrica.diastereomerNote"></div>`;
  }
  if (key === 'tautomeria') {
    html += `
        <div class="iso-warning iso-callout iso-callout-amber" data-i18n-html="isomerism.tautomeria.notStatic"></div>
        <div class="iso-extra-box">
          <div class="iso-extra-box-title" data-i18n="isomerism.tautomeria.glucoseTitle">Glucose</div>
          <p data-i18n="isomerism.tautomeria.glucoseText"></p>
        </div>`;
  }
  if (key === 'optica') {
    html += `
        <div class="iso-extra-box">
          <div class="iso-extra-box-title" data-i18n="isomerism.optica.cipTitle">CIP</div>
          <p data-i18n-html="isomerism.optica.cipSteps"></p>
        </div>
        <div class="iso-extra-box">
          <div class="iso-extra-box-title" data-i18n="isomerism.optica.mesoTitle">Meso</div>
          <p data-i18n="isomerism.optica.mesoText"></p>
        </div>
        <div class="iso-extra-box">
          <div class="iso-extra-box-title" data-i18n="isomerism.optica.racemicTitle">Racemic</div>
          <p data-i18n="isomerism.optica.racemicText"></p>
        </div>
        <div class="iso-extra-note iso-callout iso-callout-purple" data-i18n-html="isomerism.optica.diastereomerText"></div>`;
  }
  return html;
}

function patchHub() {
  let hub = fs.readFileSync(HUB_PATH, 'utf8');

  const overview = `
      <!-- ISO_OVERVIEW -->
      <section class="iso-overview" id="iso-overview">
        <h2 class="iso-overview-title" data-i18n="isomerism.overview.defTitle">What is an isomer?</h2>
        <p class="iso-overview-def" data-i18n-html="isomerism.overview.defText"></p>
        <div class="iso-tree">
          <div class="iso-tree-title" data-i18n="isomerism.overview.treeTitle">Map</div>
          <div class="iso-tree-row"><span class="iso-tree-label" data-i18n="isomerism.overview.treeConst">Constitutional</span><span class="iso-tree-items">C1–C5</span></div>
          <div class="iso-tree-row"><span class="iso-tree-label" data-i18n="isomerism.overview.treeEsp">Spatial</span><span class="iso-tree-items">E1–E2</span></div>
        </div>
        <div class="iso-summary-table-wrap">
          <div class="iso-summary-title" data-i18n="isomerism.overview.tableTitle">Quick reference</div>
          <table class="iso-summary-table">
            <thead><tr>
              <th data-i18n="isomerism.overview.tableHeadType">Type</th>
              <th data-i18n="isomerism.overview.tableHeadChanges">Changes</th>
              <th data-i18n="isomerism.overview.tableHeadExample">Example</th>
              <th data-i18n="isomerism.overview.tableHeadLab">Lab</th>
            </tr></thead>
            <tbody>
              <tr><td data-i18n="isomerism.overview.rowFuncao">Function</td><td data-i18n="isomerism.overview.rowFuncaoCh"></td><td data-i18n="isomerism.overview.rowFuncaoEx"></td><td data-i18n="isomerism.overview.rowFuncaoLab"></td></tr>
              <tr><td data-i18n="isomerism.overview.rowCadeia">Chain</td><td data-i18n="isomerism.overview.rowCadeiaCh"></td><td data-i18n="isomerism.overview.rowCadeiaEx"></td><td data-i18n="isomerism.overview.rowCadeiaLab"></td></tr>
              <tr><td data-i18n="isomerism.overview.rowPosicao">Position</td><td data-i18n="isomerism.overview.rowPosicaoCh"></td><td data-i18n="isomerism.overview.rowPosicaoEx"></td><td data-i18n="isomerism.overview.rowPosicaoLab"></td></tr>
              <tr><td data-i18n="isomerism.overview.rowMetameria">Metamerism</td><td data-i18n="isomerism.overview.rowMetameriaCh"></td><td data-i18n="isomerism.overview.rowMetameriaEx"></td><td data-i18n="isomerism.overview.rowMetameriaLab"></td></tr>
              <tr><td data-i18n="isomerism.overview.rowTautomeria">Tautomerism</td><td data-i18n="isomerism.overview.rowTautomeriaCh"></td><td data-i18n="isomerism.overview.rowTautomeriaEx"></td><td data-i18n="isomerism.overview.rowTautomeriaLab"></td></tr>
              <tr><td data-i18n="isomerism.overview.rowGeometrica">Geometric</td><td data-i18n="isomerism.overview.rowGeometricaCh"></td><td data-i18n="isomerism.overview.rowGeometricaEx"></td><td data-i18n="isomerism.overview.rowGeometricaLab"></td></tr>
              <tr><td data-i18n="isomerism.overview.rowOptica">Optical</td><td data-i18n="isomerism.overview.rowOpticaCh"></td><td data-i18n="isomerism.overview.rowOpticaEx"></td><td data-i18n="isomerism.overview.rowOpticaLab"></td></tr>
            </tbody>
          </table>
        </div>
        <div class="iso-callout iso-callout-amber" data-i18n-html="isomerism.overview.tautomerWarning"></div>
      </section>
      <!-- /ISO_OVERVIEW -->
`;

  if (!hub.includes('ISO_OVERVIEW')) {
    hub = hub.replace(
      '<!-- ══ PAINEL C1: FUNÇÃO ══ -->',
      overview + '\n      <!-- ══ PAINEL C1: FUNÇÃO ══ -->'
    );
  }

  const panels = [
    ['panel-funcao', 'funcao'],
    ['panel-cadeia', 'cadeia'],
    ['panel-posicao', 'posicao'],
    ['panel-metameria', 'metameria'],
    ['panel-tautomeria', 'tautomeria'],
    ['panel-geometrica', 'geometrica'],
    ['panel-optica', 'optica'],
  ];

  for (const [panelId, key] of panels) {
    hub = insertPanelExtras(hub, panelId, key);
  }

  // funcao: dual formula lines
  hub = hub.replace(
    /<div class="mol-card-formula">C₂H₅OH<\/div>/,
    `<div class="mol-card-formula" data-i18n="isomerism.funcao.aFormula">C₂H₆O</div>
            <div class="mol-card-formula-sub" data-i18n="isomerism.funcao.aFormulaSub">C₂H₅OH</div>`
  );
  hub = hub.replace(
    /<div class="mol-card-formula">CH₃OCH₃<\/div>/,
    `<div class="mol-card-formula" data-i18n="isomerism.funcao.bFormula">C₂H₆O</div>
            <div class="mol-card-formula-sub" data-i18n="isomerism.funcao.bFormulaSub">CH₃OCH₃</div>`
  );

  // cadeia: IUPAC subnames
  hub = hub.replace(
    /<div class="mol-card-name" data-i18n="isomerism\.cadeia\.aName">[^<]*<\/div>/,
    `<div class="mol-card-name" data-i18n="isomerism.cadeia.aName">n-Butane</div>
            <div class="mol-card-name-sub" data-i18n="isomerism.cadeia.aNameSub">IUPAC: butane</div>`
  );
  hub = hub.replace(
    /<div class="mol-card-name" data-i18n="isomerism\.cadeia\.bName">[^<]*<\/div>/,
    `<div class="mol-card-name" data-i18n="isomerism.cadeia.bName">Isobutane</div>
            <div class="mol-card-name-sub" data-i18n="isomerism.cadeia.bNameSub">IUPAC: 2-methylpropane</div>`
  );

  const quiz = `
      <!-- ISO_QUIZ -->
      <section class="iso-quiz" id="iso-quiz">
        <h2 class="iso-quiz-title" data-i18n="isomerism.quiz.title">Quick check</h2>
        <div class="iso-quiz-item" data-quiz="1" data-answer="a">
          <p data-i18n="isomerism.quiz.q1">Q1</p>
          <div class="iso-quiz-options">
            <button type="button" data-opt="a" data-i18n="isomerism.quiz.q1a">A</button>
            <button type="button" data-opt="b" data-i18n="isomerism.quiz.q1b">B</button>
            <button type="button" data-opt="c" data-i18n="isomerism.quiz.q1c">C</button>
          </div>
          <p class="iso-quiz-feedback" hidden></p>
        </div>
        <div class="iso-quiz-item" data-quiz="2" data-answer="a">
          <p data-i18n="isomerism.quiz.q2">Q2</p>
          <div class="iso-quiz-options">
            <button type="button" data-opt="a" data-i18n="isomerism.quiz.q2a">A</button>
            <button type="button" data-opt="b" data-i18n="isomerism.quiz.q2b">B</button>
            <button type="button" data-opt="c" data-i18n="isomerism.quiz.q2c">C</button>
          </div>
          <p class="iso-quiz-feedback" hidden></p>
        </div>
        <div class="iso-quiz-item" data-quiz="3" data-answer="a">
          <p data-i18n="isomerism.quiz.q3">Q3</p>
          <div class="iso-quiz-options">
            <button type="button" data-opt="a" data-i18n="isomerism.quiz.q3a">A</button>
            <button type="button" data-opt="b" data-i18n="isomerism.quiz.q3b">B</button>
            <button type="button" data-opt="c" data-i18n="isomerism.quiz.q3c">C</button>
          </div>
          <p class="iso-quiz-feedback" hidden></p>
        </div>
      </section>
      <!-- /ISO_QUIZ -->
`;

  if (!hub.includes('ISO_QUIZ')) {
    hub = hub.replace('<!-- ── END PANELS ── -->', quiz + '\n      <!-- ── END PANELS ── -->');
  }

  fs.writeFileSync(HUB_PATH, hub, 'utf8');
  console.log('Patched viewer/isomerism.html');
}

mergeI18n();
patchHub();
