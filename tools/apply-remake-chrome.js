#!/usr/bin/env node
/**
 * Remake 2026 chrome: swap the legacy top bar + global sidebar for the
 * shared top navigation (templates/chrome/site-header.html) and footer
 * (templates/chrome/site-footer.html), and link the remake stylesheet and
 * nav script. Runs after inject-ui-chrome.js. Idempotent: a page that
 * already carries the remake chrome gets the current templates again.
 */
const fs = require('fs');
const path = require('path');
const {
  findElementWithClass,
  findAnyGlobalSidebar,
  addBodyClass,
  addHtmlAttr,
  walkDir,
  SKIP_FILES
} = require('./inject-ui-chrome');

const ROOT = path.resolve(__dirname, '..');
const TPL = path.join(ROOT, 'templates', 'chrome');
const CSS_HREF = '/assets/remake/remake.css?v=202611041200';
const JS_SRC = '/assets/remake/site-nav.js?v=202611041200';
const FIGTREE_PRELOAD = '<link rel="preload" href="/assets/fonts/figtree-normal-latin.woff2" as="font" type="font/woff2" crossorigin>';

function readTpl(name) {
  return fs.readFileSync(path.join(TPL, name), 'utf8').trim();
}

function relOf(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

/** Which top-level nav entry a page belongs to. */
function sectionFor(rel) {
  const r = rel.toLowerCase();
  if (/^periodic-table(\.pt)?\.html$/.test(r) || r.startsWith('periodic-table/')) return 'periodic';
  if (r.startsWith('viewer/') || /^isomerism(\.pt)?\.html$/.test(r) || r.startsWith('isomerism/')) return 'models';
  if (/^calculators(\.pt)?\.html$/.test(r)) return 'calculators';
  if (/^explore(\.pt)?\.html$/.test(r) || r.startsWith('explore/')) return 'explore';
  if (/^pricing(\.pt)?\.html$/.test(r)) return 'plans';
  return '';
}

function isMinimal(rel) {
  return /^login(\.pt)?\.html$/.test(rel);
}

function headerFor(rel) {
  let html = readTpl('site-header.html');
  const section = sectionFor(rel);
  if (section) {
    html = html.replace(
      new RegExp(`(<a class="rm-link)(" data-rm-section="${section}")`),
      '$1 is-active" aria-current="page$2'
    );
    html = html.replace(
      new RegExp(`<div class="rm-dd" data-rm-section="${section}">`),
      `<div class="rm-dd is-active" data-rm-section="${section}">`
    );
  }
  if (isMinimal(rel)) {
    html = html.replace('<header class="rm-header"', '<header class="rm-header rm-header--minimal"');
  }
  return html;
}

function removeElement(html, el) {
  return html.slice(0, el.start) + html.slice(el.end);
}

function removeAllWithClass(html, cls, tag) {
  let guard = 0;
  for (;;) {
    const el = findElementWithClass(html, cls);
    if (!el || (tag && el.tag !== tag) || guard++ > 20) return html;
    html = removeElement(html, el);
  }
}

function stripLegacyChrome(shellInner) {
  let inner = shellInner;
  inner = removeAllWithClass(inner, 'rm-header', 'header');
  inner = removeAllWithClass(inner, 'rm-footer', 'footer');
  const nav = findElementWithClass(inner, 'lc-topnav');
  if (nav && nav.tag === 'nav') inner = removeElement(inner, nav);
  const bar = findElementWithClass(inner, 'topbar');
  if (bar && (bar.tag === 'header' || bar.tag === 'div' || bar.tag === 'nav')) inner = removeElement(inner, bar);
  const aside = findAnyGlobalSidebar(inner);
  if (aside) inner = removeElement(inner, aside);
  inner = removeAllWithClass(inner, 'ws-drawer-backdrop');
  inner = removeAllWithClass(inner, 'mobile-overlay');
  inner = removeAllWithClass(inner, 'lc-footer', 'footer');
  return inner;
}

function ensureHeadAssets(html) {
  if (!/assets\/remake\/remake\.css/.test(html)) {
    html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="${CSS_HREF}">\n</head>`);
  }
  if (!/assets\/remake\/site-nav\.js/.test(html)) {
    html = html.replace(/<\/head>/i, `<script src="${JS_SRC}" defer></script>\n</head>`);
  }
  html = html.replace(/<link rel="preload" href="\/assets\/fonts\/instrument-serif-[^"]+"[^>]*>\n?/g, '');
  html = html.replace(/<link rel="preload" href="\/assets\/fonts\/inter-tight-normal-latin\.woff2"[^>]*>/g, FIGTREE_PRELOAD);
  return html;
}

function applyRemake(html, file) {
  const rel = relOf(file);
  const shell = findElementWithClass(html, 'ps-shell');
  if (!shell || !/id=["']ps-shell["']/.test(shell.html.slice(0, shell.html.indexOf('>') + 1))) {
    return { html, status: 'skip-no-shell' };
  }
  const openEnd = shell.html.indexOf('>') + 1;
  const closeStart = shell.html.lastIndexOf('</div>');
  const open = shell.html.slice(0, openEnd);
  const inner = stripLegacyChrome(shell.html.slice(openEnd, closeStart));
  const footer = isMinimal(rel) ? '' : readTpl('site-footer.html') + '\n';
  const nextShell = open + '\n' + headerFor(rel) + '\n' + inner.trim() + '\n' + footer + '</div>';
  let next = html.slice(0, shell.start) + nextShell + html.slice(shell.end);
  next = addBodyClass(next, 'rm');
  next = addHtmlAttr(next, 'data-rm', '1');
  next = ensureHeadAssets(next);
  return { html: next, status: next === html ? 'unchanged' : 'remade' };
}

function applyFile(file) {
  if (SKIP_FILES.has(path.basename(file))) return { status: 'skip-app', changed: false };
  const original = fs.readFileSync(file, 'utf8');
  const result = applyRemake(original, file);
  if (result.html !== original) fs.writeFileSync(file, result.html);
  return { status: result.status, changed: result.html !== original };
}

module.exports = { applyRemake, sectionFor, headerFor };

if (require.main === module) {
  const files = walkDir(ROOT, []);
  const counts = {};
  let changed = 0;
  for (const file of files) {
    const r = applyFile(file);
    counts[r.status] = (counts[r.status] || 0) + 1;
    if (r.changed) changed += 1;
  }
  console.log(`remake chrome applied on ${changed} / ${files.length} HTML files.`);
  Object.keys(counts).sort().forEach((k) => console.log(`  ${k}: ${counts[k]}`));
}
