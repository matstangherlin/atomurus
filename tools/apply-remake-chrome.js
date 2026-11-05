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
    // Sign-in keeps only the brand: no navigation, no account chip.
    html = html.replace('<header class="rm-header"', '<header class="rm-header rm-header--minimal"');
    const cut = html.indexOf('    <button class="rm-burger"');
    const end = html.lastIndexOf('  </div>\n</header>');
    if (cut !== -1 && end > cut) html = html.slice(0, cut) + html.slice(end);
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
  inner = removeAllWithClass(inner, 'aco-manage-wrap');
  inner = inner.replace(/<button type="button" class="aco-manage-cookies"[^>]*>[^<]*<\/button>\s*/g, '');
  return inner;
}

/* The periodic-table pages drive their element search from #search-input,
   which used to live in the legacy top bar: keep it, now in the page header. */
const PTABLE_SEARCH = `<div class="search-box rm-ptable-search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="search-input" type="search" placeholder="Name, symbol or number"
             data-i18n-attr="placeholder:ptable.searchPlaceholder; aria-label:ptable.searchPlaceholder" aria-label="Name, symbol or number"
             oninput="handleSearchInput(this.value)" onfocus="updateSearchSuggestions(this.value)" onkeydown="handleSearchKey(event)" autocomplete="off">
      <div class="search-suggestions" id="search-suggestions" role="listbox" aria-label="Search suggestions"></div>
    </div>`;

function ensurePtableSearch(html, rel) {
  if (!/^periodic-table(\.pt)?\.html$|^periodic-table\/(compare|heatmap|isotopes|trends)(\.pt)?\.html$/.test(rel)) return html;
  if (html.includes('id="search-input"')) return html;
  const desc = html.match(/<p class="ph-desc"[^>]*>[\s\S]*?<\/p>/);
  if (!desc) return html;
  const at = desc.index + desc[0].length;
  return html.slice(0, at) + '\n        ' + PTABLE_SEARCH + html.slice(at);
}

function ensureHeadAssets(html) {
  if (!/assets\/remake\/remake\.css/.test(html)) {
    html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="${CSS_HREF}">\n</head>`);
  }
  if (!/assets\/remake\/site-nav\.js/.test(html)) {
    html = html.replace(/<\/head>/i, `<script src="${JS_SRC}" defer></script>\n</head>`);
  }
  html = html.replace(/<link rel="preload" href="\/assets\/fonts\/instrument-serif-[^"]+"[^>]*>\n?/g, '');
  // iOS fills a transparent home-screen icon with black: use the opaque one.
  html = html.replace(/<link rel="apple-touch-icon" href="[^"]*atomurus-logo\.png[^"]*">/g, '<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">');
  html = html.replace(/<link rel="preload" href="\/assets\/fonts\/inter-tight-normal-latin\.woff2"[^>]*>/g, FIGTREE_PRELOAD);
  return html;
}

function applyRemake(html, file) {
  const rel = relOf(file);
  const shell = findElementWithClass(html, 'ps-shell');
  if (!shell || !/id=["']ps-shell["']/.test(shell.html.slice(0, shell.html.indexOf('>') + 1))) {
    return applyRemakeUnbalanced(html, rel);
  }
  const openEnd = shell.html.indexOf('>') + 1;
  const closeStart = shell.html.lastIndexOf('</div>');
  const open = shell.html.slice(0, openEnd);
  const inner = stripLegacyChrome(shell.html.slice(openEnd, closeStart));
  const footer = isMinimal(rel) ? '' : readTpl('site-footer.html') + '\n';
  const nextShell = open + '\n' + headerFor(rel) + '\n' + inner.trim() + '\n' + footer + '</div>';
  let next = html.slice(0, shell.start) + nextShell + html.slice(shell.end);
  next = ensurePtableSearch(next, rel);
  next = addBodyClass(next, 'rm');
  next = addHtmlAttr(next, 'data-rm', '1');
  next = ensureHeadAssets(next);
  return { html: next, status: next === html ? 'unchanged' : 'remade' };
}


/* Some hand-written pages leave a <div> open inside #ps-shell, so the shell
   cannot be cut out as one balanced element. Work element by element instead:
   strip the legacy chrome, put the header right after the shell's opening
   tag and the footer right after </main>. */
function applyRemakeUnbalanced(html, rel) {
  const open = html.match(/<div\b[^>]*\bid=["']ps-shell["'][^>]*>/);
  if (!open) return { html, status: 'skip-no-shell' };
  const at = open.index + open[0].length;
  let head = html.slice(0, at);
  let body = stripLegacyChrome(html.slice(at));
  const footer = isMinimal(rel) ? '' : readTpl('site-footer.html') + '\n';
  const mainEnd = body.indexOf('</main>');
  if (footer && mainEnd !== -1) {
    const cut = mainEnd + '</main>'.length;
    body = body.slice(0, cut) + '\n' + footer + body.slice(cut).replace(/^\s*\n/, '');
  }
  let next = head + '\n' + headerFor(rel) + '\n' + body.replace(/^\s*/, '');
  next = addBodyClass(next, 'rm');
  next = addHtmlAttr(next, 'data-rm', '1');
  next = ensureHeadAssets(next);
  return { html: next, status: next === html ? 'unchanged' : 'remade' };
}

/* Signed-in workspace pages keep the workspace chrome (sidebar), like /app. */
const WORKSPACE_PAGES = new Set([]);

/* Standalone pages (no #ps-shell, no i18n runtime): the compact 3D viewer
   linked from the Bhopal article. Swap its own bar and footer for the remake
   chrome, with the copy baked in the page's language. */
const STANDALONE_PAGES = new Set(['explore/viewer/methyl-isocyanate.html', 'explore/viewer/methyl-isocyanate.pt.html']);

function bakeCopy(html, lang) {
  const { DICT } = require('./i18n-dict-source');
  const dict = DICT[lang] || DICT.en;
  const get = (key) => key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), dict);
  return html.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)(<)/g, (m, open, key, text, lt) => {
    const v = get(key);
    return typeof v === 'string' ? open + v + lt : m;
  });
}

function applyStandalone(html, rel) {
  const lang = /\.pt\.html$/.test(rel) ? 'pt' : 'en';
  let next = html;
  const bar = findElementWithClass(next, 'mvwr-top');
  let back = '';
  if (bar) {
    const link = bar.html.match(/<a class="mvwr-back"[\s\S]*?<\/a>/);
    if (link) back = '<nav class="rm-crumbs rm-back-crumb">' + link[0].replace('class="mvwr-back"', 'class="mvwr-back rm-back-link"') + '</nav>\n';
    next = next.slice(0, bar.start) + next.slice(bar.end);
  }
  const kept = next.match(/<nav class="rm-crumbs rm-back-crumb">[\s\S]*?<\/nav>\n?/);
  if (!back && kept) back = kept[0].replace(/\n?$/, '\n');
  next = removeAllWithClass(next, 'rm-header', 'header');
  next = removeAllWithClass(next, 'rm-footer', 'footer');
  next = removeAllWithClass(next, 'lc-footer', 'footer');
  next = removeAllWithClass(next, 'aco-manage-wrap');
  next = next.replace(/<nav class="rm-crumbs rm-back-crumb">[\s\S]*?<\/nav>\n?/, '');
  next = next.replace(/<body([^>]*)>\s*/i, (m) => m.trimEnd() + '\n' + bakeCopy(headerFor(rel), lang) + '\n\n');
  next = next.replace(/(<main class="mvwr-shell"[^>]*>)\s*/, '$1\n' + back);
  next = next.replace(/<\/main>\s*/, '</main>\n' + bakeCopy(readTpl('site-footer.html'), lang) + '\n');
  next = addBodyClass(next, 'rm');
  next = addHtmlAttr(next, 'data-rm', '1');
  next = ensureHeadAssets(next);
  return { html: next, status: next === html ? 'unchanged' : 'remade' };
}

/* Signed-in workspace (/app, /account): keeps its own chrome and sidebar,
   but takes the remake skin (html[data-rm-ws] section of remake.css). */
// The workspace top bar carries the same site navigation as the public
// header (with "Lab" marked current), so /app reads as part of the site and
// the left drawer is only needed on phones.
function workspaceSiteNav() {
  const link = (href, key, label, extra) => `    <a class="rm-ws-link" href="${href}"${extra || ''}><span data-i18n="${key}">${label}</span></a>`;
  return [
    '<nav class="rm-ws-sitenav" aria-label="Main" data-i18n-attr="aria-label:common.rm.mainNav" data-rm-ws-sitenav>',
    link('/periodic-table.html', 'common.rm.periodic', 'Periodic table'),
    link('/viewer/atomic-models.html', 'common.rm.models3d', '3D models'),
    link('/calculators.html', 'common.rm.calculators', 'Calculators'),
    link('/app?section=lab', 'common.rm.lab', 'Lab', ' data-rm-ws-lab'),
    link('/explore.html', 'common.rm.articles', 'Articles'),
    link('/pricing.html', 'common.rm.plans', 'Plans'),
    '  </nav>'
  ].join('\n');
}

function injectWorkspaceSiteNav(html) {
  let next = html.replace(/\n?\s*<nav class="rm-ws-sitenav"[\s\S]*?<\/nav>/, '');
  next = next.replace(/(<a class="ws-brand"[\s\S]*?<\/a>)/, (m) => `${m}\n    ${workspaceSiteNav()}`);
  // Guests get the same "Sign in" link as the public header (CSS shows it
  // only while the account chip is the guest CTA).
  next = next.replace(/\n?\s*<a class="rm-ws-signin"[^>]*>[^<]*<\/a>/, '');
  next = next.replace(/(<div class="ws-topbar-actions">)/, '$1\n      <a class="rm-ws-signin" href="/login?next=%2Fapp" data-i18n="common.rm.signIn">Sign in</a>');
  // Site footer under the workspace content (design: lab page footer).
  next = next.replace(/\n?\s*<footer class="rm-ws-foot"[\s\S]*?<\/footer>/, '');
  next = next.replace(/(<div class="ws-private" id="app-study"[^>]*><\/div>\s*<\/div>)/, `$1
    <footer class="rm-ws-foot" data-rm-ws-foot>
      <span>© 2026 Atomurus</span>
      <nav aria-label="Footer" data-i18n-attr="aria-label:common.rm.footerNav">
        <a href="/about.html" data-i18n="common.rm.about">About</a>
        <a href="/contact.html" data-i18n="common.rm.contact">Contact</a>
        <a href="/privacy.html" data-i18n="common.rm.privacy">Privacy</a>
        <a href="/terms.html" data-i18n="common.rm.terms">Terms</a>
      </nav>
    </footer>`);
  return next;
}

function applyWorkspace(html, isApp) {
  // Appended after the existing attributes: tests pin `<html lang=… data-theme=…`.
  // /app also gets data-rm-app: the Lab design (site top bar, no desktop
  // sidebar) applies there only; /account keeps its own column.
  const extra = isApp ? ' data-rm-ws="1" data-rm-app="1"' : ' data-rm-ws="1"';
  let next = html.replace(/<html\b([^>]*)>/i, (m, attrs) =>
    `<html${attrs.replace(/\s*data-rm-ws="1"/, '').replace(/\s*data-rm-app="1"/, '')}${extra}>`);
  if (!/assets\/remake\/remake\.css/.test(next)) {
    next = next.replace(/<\/head>/i, `<link rel="stylesheet" href="${CSS_HREF}">\n</head>`);
  }
  next = injectWorkspaceSiteNav(next);
  next = next.replace(/<link rel="preload" href="\/assets\/fonts\/instrument-serif-[^"]+"[^>]*>\n?/g, '');
  next = next.replace(/<link rel="apple-touch-icon" href="[^"]*atomurus-logo\.png[^"]*">/g, '<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">');
  return next;
}

function applyFile(file) {
  if (path.basename(file) === 'app.html' || WORKSPACE_PAGES.has(relOf(file))) {
    const original = fs.readFileSync(file, 'utf8');
    const next = applyWorkspace(original, path.basename(file) === 'app.html');
    if (next !== original) fs.writeFileSync(file, next);
    return { status: 'workspace', changed: next !== original };
  }
  if (STANDALONE_PAGES.has(relOf(file))) {
    const original = fs.readFileSync(file, 'utf8');
    const r = applyStandalone(original, relOf(file));
    if (r.html !== original) fs.writeFileSync(file, r.html);
    return { status: r.status, changed: r.html !== original };
  }
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
