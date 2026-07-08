// Merge isomerism panel translations into i18n.js and annotate hub panels.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TRANS = JSON.parse(fs.readFileSync(path.join(__dirname, 'isomerism-translations.json'), 'utf8'));
const I18N_PATH = path.join(ROOT, 'i18n.js');
const HUB_PATH = path.join(ROOT, 'viewer', 'isomerism.html');

function jsStr(s) {
  return JSON.stringify(s);
}

function mergeTypeBlock(isoBlock, typeName, lang) {
  const data = TRANS[typeName][lang];
  const start = isoBlock.indexOf(`${typeName}: {`);
  if (start < 0) throw new Error(`type ${typeName} not found`);
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

function mergeIntoI18n() {
  let src = fs.readFileSync(I18N_PATH, 'utf8');
  for (const lang of ['en', 'pt']) {
    const langMarker = lang === 'en' ? '    en: {' : '    pt: {';
    const langStart = src.indexOf(langMarker);
    const isoStart = src.indexOf('      isomerism: {', langStart);
    const isoEnd = src.indexOf('\n      atomModel: {', isoStart);
    let isoBlock = src.slice(isoStart, isoEnd);

    const shared = TRANS.shared[lang];
    for (const [prop, val] of Object.entries(shared)) {
      const line = `\n        ${prop}: ${jsStr(val)},`;
      const propRe = new RegExp(`\\n        ${prop}:\\s*[^\\n]+,?`);
      if (propRe.test(isoBlock)) isoBlock = isoBlock.replace(propRe, line);
      else {
        const ins = isoBlock.indexOf('\n        bondLegendTitle:');
        isoBlock = isoBlock.slice(0, ins) + line + isoBlock.slice(ins);
      }
    }

    for (const typeName of Object.keys(TRANS)) {
      if (typeName === 'shared') continue;
      isoBlock = mergeTypeBlock(isoBlock, typeName, lang);
    }
    src = src.slice(0, isoStart) + isoBlock + src.slice(isoEnd);
  }
  fs.writeFileSync(I18N_PATH, src, 'utf8');
  console.log('Updated i18n.js');
}

function annotatePanelHtml(html, key) {
  const p = `isomerism.${key}`;
  if (!html.includes(`${p}.desc`)) {
    html = html.replace('<p class="iso-desc">', `<p class="iso-desc" data-i18n-html="${p}.desc">`);
  }
  let card = 0;
  html = html.replace(/<div class="mol-card-tag">/g, () => {
    card++;
    return `<div class="mol-card-tag" data-i18n="${p}.${card === 1 ? 'aTag' : 'bTag'}">`;
  });
  card = 0;
  html = html.replace(/<div class="mol-card-name">/g, () => {
    card++;
    return `<div class="mol-card-name" data-i18n="${p}.${card === 1 ? 'aName' : 'bName'}">`;
  });
  if (key === 'optica') {
    html = html.replace(
      /<div class="mol-card-formula">/g,
      (match, offset, str) => {
        const before = str.slice(0, offset);
        const n = (before.match(/mol-card-name/g) || []).length;
        const k = n <= 1 ? 'aFormula' : 'bFormula';
        return `<div class="mol-card-formula" data-i18n="${p}.${k}">`;
      }
    );
  }
  card = 0;
  html = html.replace(/<div class="mol-card-fact">/g, () => {
    card++;
    return `<div class="mol-card-fact" data-i18n-html="${p}.${card === 1 ? 'aFact' : 'bFact'}">`;
  });
  html = html.replace(/<div class="(iso-callout[^"]*)">/g, (m, cls) => {
    if (m.includes('data-i18n')) return m;
    return `<div class="${cls}" data-i18n-html="${p}.callout">`;
  });

  if (key === 'optica') {
    html = html.replace(
      /(<button class="mirror-btn"[^>]*)\s+title="[^"]*"/,
      `$1 data-i18n-attr="title:${p}.mirrorTitle; aria-label:${p}.mirrorTitle"`
    );
    const svgLabels = ['aSvgFront', 'aSvgBack', 'bSvgFront', 'bSvgBack'];
    let li = 0;
    html = html.replace(
      /<text([^>]*font-size="9"[^>]*)>([^<]+)<\/text>/g,
      (m, attrs, text) => {
        if (!/frente|front|atrás|behind/i.test(text)) return m;
        const k = svgLabels[li++] || 'bSvgBack';
        return `<text${attrs} data-i18n-attr="textContent:${p}.${k}">${text}</text>`;
      }
    );
    const bondKeys = ['bondWedge', 'bondDash', 'bondPlane'];
    let bi = 0;
    html = html.replace(
      /<span><b style="color:var\(--text-1\)">[^<]*<\/b>[^<]*<\/span>/g,
      (m) => {
        const k = bondKeys[bi++];
        if (!k) return m;
        return `<span data-i18n="${p}.${k}">${m.replace(/^<span>/, '').replace(/<\/span>$/, '')}</span>`;
      }
    );
  } else {
    let svgN = 0;
    html = html.replace(
      /<text([^>]*font-size="10"[^>]*)>([^<]+)<\/text>/g,
      (m, attrs, text) => {
        if (/^CH₃|^H$|^O$|^C$/.test(text.trim())) return m;
        svgN++;
        const k = svgN === 1 ? 'aSvg' : 'bSvg';
        return `<text${attrs} data-i18n-attr="textContent:${p}.${k}">${text}</text>`;
      }
    );
  }

  if (key === 'posicao' || key === 'metameria' || key === 'tautomeria') {
    html = html.replace(
      /<div class="iso-section-title">/,
      `<div class="iso-section-title" data-i18n="isomerism.${key}.title">`
    );
    html = html.replace(
      /<div class="iso-section-sub">/,
      `<div class="iso-section-sub" data-i18n="isomerism.${key}.sub">`
    );
  }
  return html;
}

function annotateHub() {
  let hub = fs.readFileSync(HUB_PATH, 'utf8');
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
    const startIdx = hub.indexOf(`id="${panelId}"`);
    const open = hub.lastIndexOf('<div class="iso-panel', startIdx);
    const slice = hub.slice(open);
    const nextComment = slice.search(/\n\s*<!-- ══ PAINEL/);
    const endPanels = slice.indexOf('<!-- ── END PANELS');
    let end = slice.length;
    if (nextComment > 0) end = nextComment;
    else if (endPanels > 0) end = endPanels;
    let panel = annotatePanelHtml(slice.slice(0, end), key);
    hub = hub.slice(0, open) + panel + hub.slice(open + end);
  }
  fs.writeFileSync(HUB_PATH, hub, 'utf8');
  console.log('Annotated viewer/isomerism.html');
}

mergeIntoI18n();
annotateHub();
