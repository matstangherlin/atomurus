// ───────────────────────────────────────────────────────────────────
// Atomurus — pre-render HTML variants per language for SEO
// ───────────────────────────────────────────────────────────────────
// Generates <page>.pt.html (and later <page>.es.html) next to each main
// HTML file, with title/description/og/twitter/locale already translated
// in the static HTML. Netlify's redirect rules serve the correct variant
// based on the ?lang= query param.
//
// Why: Google indexes the raw HTML it receives. Without this, the PT URL
// /?lang=pt-BR served the EN-default HTML, and PT translation only kicked
// in client-side via i18n.js — which made PT pages effectively invisible
// for Portuguese search queries (and broke WhatsApp/Facebook link previews
// which don't execute JS).
//
// Strategy: bake SEO-critical head tags and plain data-i18n text
// fallbacks into per-language HTML files at build. i18n.js still
// overwrites body copy client-side when the user switches language.
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const I18N_SOURCE_PATH = path.join(ROOT, 'tools', 'i18n-dict-source.js');

// Main pages that get pre-rendered variants. Element pages and viewer
// sub-pages are out of scope for this first pass.
const PAGES = [
  'index.html',
  'periodic-table.html',
  'calculators.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'config.html',
  'pricing.html',
  'viewer/allotropes.html',
  'viewer/molecules.html',
  'viewer/atomic-models.html',
  'viewer/atomic-models/bohr.html',
  'viewer/atomic-models/dalton.html',
  'viewer/atomic-models/quantum.html',
  'viewer/atomic-models/rutherford.html',
  'viewer/atomic-models/thomson.html',
  'periodic-table/heatmap.html',
  'periodic-table/trends.html',
  'periodic-table/compare.html',
  'periodic-table/isotopes.html',
];

// 122 element pages live in /periodic-table/<latin>.html. They follow a
// different pattern: HTML is hardcoded in Portuguese (no data-i18n on the
// meta tags), with all element data inlined. element-page.js swaps to EN
// client-side. Pre-render generates an .en.html variant per element so
// crawlers get English HTML directly when ?lang=en.
const ELEMENT_DIR = 'periodic-table';
// Files in periodic-table/ that are NOT element pages.
const ELEMENT_DIR_EXCLUDE = new Set([
  'heatmap.html', 'trends.html', 'compare.html', 'isotopes.html',
]);

// Languages other than the default to generate. Default ('en') stays as
// the source file untouched.
const TARGET_LANGS = ['pt'];

const HTML_LANG  = { en: 'en',     pt: 'pt-BR' };
const URL_LANG   = { en: 'en',     pt: 'pt-BR' };
const OG_LOCALE  = { en: 'en_US',  pt: 'pt_BR' };

// ── Literal extraction ─────────────────────────────────────────────
// Extracts a `const NAME = { ... };` or `const NAME = [ ... ];` literal
// from a JS source file without executing the file (which often depends
// on browser globals). String/comment-aware bracket counter.
function extractLiteral(code, declMarker) {
  const start = code.indexOf(declMarker);
  if (start < 0) return null;
  let i = start + declMarker.length;
  while (i < code.length && code[i] !== '{' && code[i] !== '[') i++;
  if (i >= code.length) return null;
  const open  = code[i];
  const close = open === '{' ? '}' : ']';
  const litStart = i;
  let depth = 0, s = 0; // s: 0=code, 1=', 2=", 3=`, 4=//, 5=/* */
  for (; i < code.length; i++) {
    const c = code[i], n = code[i + 1];
    if (s === 4) { if (c === '\n') s = 0; continue; }
    if (s === 5) { if (c === '*' && n === '/') { s = 0; i++; } continue; }
    if (s === 1) { if (c === '\\') { i++; continue; } if (c === "'") s = 0; continue; }
    if (s === 2) { if (c === '\\') { i++; continue; } if (c === '"') s = 0; continue; }
    if (s === 3) { if (c === '\\') { i++; continue; } if (c === '`') s = 0; continue; }
    if (c === '/' && n === '/') { s = 4; i++; continue; }
    if (c === '/' && n === '*') { s = 5; i++; continue; }
    if (c === "'") { s = 1; continue; }
    if (c === '"') { s = 2; continue; }
    if (c === '`') { s = 3; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return code.slice(litStart, i + 1);
    }
  }
  return null;
}

function loadDict() {
  delete require.cache[require.resolve(I18N_SOURCE_PATH)];
  return require(I18N_SOURCE_PATH).DICT;
}

function loadElementsContext(dict) {
  const dataCode = fs.readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const enCode   = fs.readFileSync(path.join(ROOT, 'elements-data-en.js'), 'utf8');
  const elemLit  = extractLiteral(dataCode, 'const ELEMENTS = ');
  const namesLit = extractLiteral(dataCode, 'const _elNamesEN = ');
  const descLit  = extractLiteral(enCode,   'const _DESC_EN = ');
  if (!elemLit || !namesLit || !descLit) {
    throw new Error('Failed to extract ELEMENTS / _elNamesEN / _DESC_EN');
  }
  /* eslint-disable no-eval */
  return {
    elements: eval('(' + elemLit + ')'),
    namesEN:  eval('(' + namesLit + ')'),
    descEN:   eval('(' + descLit + ')'),
    dict,
  };
  /* eslint-enable no-eval */
}

function resolveKey(dict, lang, key) {
  const parts = key.split('.');
  let cur = dict[lang];
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// ── HTML helpers ───────────────────────────────────────────────────
// Translations are plain text from the DICT — they may contain `&` from
// names like "Cookies & Privacy". Escape for attribute and text contexts.
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
function escText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Bake data-i18n text nodes so .pt.html fallbacks stay in the target
// language after rebuild. Runtime i18n.js still overwrites these.
// Only elements whose children are plain text (no nested tags).
function bakeDataI18nText(html, lang, dict) {
  return html.replace(
    /(<([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    function (full, open, _tag, key, _inner, close) {
      const val = resolveKey(dict, lang, key);
      if (typeof val !== 'string') return full;
      if (/[<>]/.test(val)) return full;
      return open + escText(val) + close;
    }
  );
}

function buildVariant(srcAbs, dstAbs, lang, dict) {
  const src = fs.readFileSync(srcAbs, 'utf8');

  const titleM = src.match(/<title\s+data-i18n="([^"]+)">[^<]*<\/title>/);
  // Match either attribute order:
  //   data-i18n-attr="content:KEY" content="..."   (most pages)
  //   content="..." data-i18n-attr="content:KEY"   (viewer/* pages)
  const descM =
    src.match(/<meta\s+name="description"\s+data-i18n-attr="content:([^"]+)"\s+content="[^"]*">/) ||
    src.match(/<meta\s+name="description"\s+content="[^"]*"\s+data-i18n-attr="content:([^"]+)">/);
  if (!titleM || !descM) {
    console.warn(`  skip (no data-i18n title/desc): ${path.basename(srcAbs)}`);
    return false;
  }
  const titleKey = titleM[1];
  const descKey  = descM[1];
  const title    = resolveKey(dict, lang, titleKey);
  const desc     = resolveKey(dict, lang, descKey);
  if (title == null || desc == null) {
    console.warn(`  skip (missing ${lang} translation for ${titleKey} or ${descKey}): ${path.basename(srcAbs)}`);
    return false;
  }

  let out = src;

  // <html lang="..."> — keep extra attributes such as data-ps-chrome
  out = out.replace(/(<html\b[^>]*)\blang="[^"]*"/, `$1lang="${HTML_LANG[lang]}"`);

  // <title data-i18n="...">...</title>
  out = out.replace(
    /<title\s+data-i18n="[^"]+">[^<]*<\/title>/,
    `<title data-i18n="${titleKey}">${escText(title)}</title>`
  );

  // <meta name="description" ...> — match either attribute order
  out = out.replace(
    /<meta\s+name="description"\s+data-i18n-attr="content:[^"]+"\s+content="[^"]*">/,
    `<meta name="description" data-i18n-attr="content:${descKey}" content="${escAttr(desc)}">`
  );
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s+data-i18n-attr="content:[^"]+">/,
    `<meta name="description" content="${escAttr(desc)}" data-i18n-attr="content:${descKey}">`
  );

  // Open Graph + Twitter mirrors
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*">/,
    `<meta property="og:title" content="${escAttr(title)}">`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escAttr(desc)}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*">/,
    `<meta name="twitter:title" content="${escAttr(title)}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escAttr(desc)}">`
  );

  // og:locale + alternate (swap)
  const altLang = lang === 'pt' ? 'en' : 'pt';
  out = out.replace(
    /<meta\s+property="og:locale"\s+content="[^"]*">/,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}">`
  );
  out = out.replace(
    /<meta\s+property="og:locale:alternate"\s+content="[^"]*">/,
    `<meta property="og:locale:alternate" content="${OG_LOCALE[altLang]}">`
  );

  out = bakeDataI18nText(out, lang, dict);

  // og:url and canonical — point variant at its language-specific URL so
  // each variant is self-canonical. EN keeps clean URLs (x-default).
  if (lang !== 'en') {
    const langParam = `lang=${URL_LANG[lang]}`;
    out = out.replace(
      /<meta\s+property="og:url"\s+content="(https:\/\/atomurus\.com[^"]*)">/,
      (_m, url) => {
        const sep = url.includes('?') ? '&' : '?';
        return `<meta property="og:url" content="${url}${sep}${langParam}">`;
      }
    );
    out = out.replace(
      /<link\s+rel="canonical"\s+href="(https:\/\/atomurus\.com[^"]*)">/,
      (_m, url) => {
        const sep = url.includes('?') ? '&' : '?';
        return `<link rel="canonical" href="${url}${sep}${langParam}">`;
      }
    );
  }

  fs.writeFileSync(dstAbs, out, 'utf8');
  return true;
}

// ── Element page builder (PT → EN) ─────────────────────────────────
// Element pages don't use data-i18n on meta tags. Their HTML is hardcoded
// in Portuguese with element data inlined. We mirror element-page.js's
// runtime formula here to build the English title/desc/og at build time.
//
// Formula (from element-page.js render()):
//   title     = `${name} (${sym}) — Atomurus`
//   shortDesc = `${name} — Element ${z}. Mass: ${mass} u. ${category}.`
//   longDesc  = `${name} (${sym}) — Element ${z}. ${desc}`
const STATE_KEY = { 'Sólido': 'stateSolid', 'Líquido': 'stateLiquid', 'Gasoso': 'stateGas' };

function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function buildElementEnVariant(srcAbs, ctx) {
  const src = fs.readFileSync(srcAbs, 'utf8');
  const rel = path.relative(ROOT, srcAbs).replace(/\\/g, '/');

  const zM = src.match(/window\.PAGE_Z\s*=\s*(\d+)\s*;/);
  if (!zM) { console.warn(`  skip (no PAGE_Z): ${rel}`); return false; }
  const z = parseInt(zM[1], 10);

  const el = ctx.elements.find(e => e.z === z);
  if (!el) { console.warn(`  skip (no ELEMENTS entry for Z=${z}): ${rel}`); return false; }

  const nameEN = ctx.namesEN[z - 1];
  const descEN = ctx.descEN[z];
  if (!nameEN || !descEN) {
    console.warn(`  skip (missing EN name/desc for Z=${z}): ${rel}`);
    return false;
  }

  const catEN   = resolveKey(ctx.dict, 'en', 'ptable.cat' + capFirst(el.cat)) || el.cat;
  const stateK  = STATE_KEY[el.state];
  const stateEN = stateK ? (resolveKey(ctx.dict, 'en', 'ptable.' + stateK) || el.state) : el.state;
  const periodicEN = resolveKey(ctx.dict, 'en', 'common.nav.periodic') || 'Periodic Table';

  // SEO-optimized title/description (mirror of migrate-element-seo.js for PT).
  // Keep title under ~70 chars and longDesc under ~160 chars so Google
  // shows them fully in the SERP. Surfaces long-tail queries: "properties",
  // "atomic mass", "applications", "element <Z>".
  const title     = `${nameEN} (${el.sym}): Element ${z}, Properties and Applications | Atomurus`;
  const shortDesc = `${nameEN} (${el.sym}) — element ${z}, atomic mass ${el.mass} u. ${catEN}.`;
  const longDesc  = `Discover ${nameEN} (${el.sym}), element ${z} of the periodic table: atomic mass ${el.mass} u, properties, applications, electron configuration and curiosities at Atomurus.`;
  const breadcrumb3 = `${nameEN} (${el.sym})`;

  let out = src;

  out = out.replace(/(<html\b[^>]*)\blang="[^"]*"/, '$1lang="en"');
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escText(title)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*">/,
    `<meta name="description" content="${escAttr(longDesc)}">`
  );

  // OG / Twitter (these are static in element pages — element-page.js
  // also rewrites them client-side, but for crawlers we bake them).
  out = out.replace(/<meta\s+property="og:title"\s+content="[^"]*">/,
    `<meta property="og:title" content="${escAttr(title)}">`);
  out = out.replace(/<meta\s+property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escAttr(shortDesc)}">`);
  out = out.replace(/<meta\s+name="twitter:title"\s+content="[^"]*">/,
    `<meta name="twitter:title" content="${escAttr(title)}">`);
  out = out.replace(/<meta\s+name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escAttr(shortDesc)}">`);

  // Locale
  out = out.replace(/<meta\s+property="og:locale"\s+content="[^"]*">/,
    '<meta property="og:locale" content="en_US">');
  if (/og:locale:alternate/.test(out)) {
    out = out.replace(/<meta\s+property="og:locale:alternate"\s+content="[^"]*">/,
      '<meta property="og:locale:alternate" content="pt_BR">');
  } else {
    out = out.replace(/(<meta\s+property="og:locale"\s+content="en_US">)/,
      `$1\n<meta property="og:locale:alternate" content="pt_BR">`);
  }

  // og:url + canonical → ?lang=en variant (self-canonical)
  out = out.replace(
    /<meta\s+property="og:url"\s+content="(https:\/\/atomurus\.com[^"]*)">/,
    (_m, url) => {
      const sep = url.includes('?') ? '&' : '?';
      return `<meta property="og:url" content="${url}${sep}lang=en">`;
    }
  );
  out = out.replace(
    /<link\s+rel="canonical"\s+href="(https:\/\/atomurus\.com[^"]*)">/,
    (_m, url) => {
      const sep = url.includes('?') ? '&' : '?';
      return `<link rel="canonical" href="${url}${sep}lang=en">`;
    }
  );

  // JSON-LD field-level updates. Each regex is scoped to make it idempotent
  // and avoid hitting the wrong block.
  // ChemicalSubstance.name (first "name" after that @type)
  out = out.replace(
    /("@type":\s*"ChemicalSubstance"[\s\S]*?"name":\s*)"[^"]*"/,
    `$1"${escAttr(nameEN)}"`
  );
  // alternateName: ["PT","latin"] → ["EN","latin"] (keep latin)
  out = out.replace(
    /("alternateName":\s*\[\s*)"[^"]*"(\s*,\s*"[^"]+"\s*\])/,
    `$1"${escAttr(nameEN)}"$2`
  );
  // ChemicalSubstance.description
  out = out.replace(
    /("@type":\s*"ChemicalSubstance"[\s\S]*?"description":\s*)"[^"]*"/,
    `$1"${escAttr(descEN)}"`
  );
  // Category PropertyValue
  out = out.replace(
    /("name"\s*:\s*"Category"\s*,\s*"value"\s*:\s*)"[^"]*"/,
    `$1"${escAttr(catEN)}"`
  );
  // State PropertyValue
  out = out.replace(
    /("name"\s*:\s*"State"\s*,\s*"value"\s*:\s*)"[^"]*"/,
    `$1"${escAttr(stateEN)}"`
  );
  // BreadcrumbList positions 2 (Periodic Table) and 3 (Element (sym))
  out = out.replace(
    /(\{"@type":"ListItem","position":2,"name":)"[^"]*"/,
    `$1"${escAttr(periodicEN)}"`
  );
  out = out.replace(
    /(\{"@type":"ListItem","position":3,"name":)"[^"]*"/,
    `$1"${escAttr(breadcrumb3)}"`
  );

  const dstAbs = srcAbs.replace(/\.html$/, '.en.html');
  fs.writeFileSync(dstAbs, out, 'utf8');
  return true;
}

// ── Main ───────────────────────────────────────────────────────────
function listElementPages() {
  const dir = path.join(ROOT, ELEMENT_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html') &&
                 !f.endsWith('.en.html') &&
                 !f.endsWith('.pt.html') &&
                 !ELEMENT_DIR_EXCLUDE.has(f))
    .map(f => path.join(dir, f));
}

function main() {
  const dict = loadDict();
  let generated = 0;
  let skipped = 0;

  // Phase 1: pages with data-i18n in title/desc — generate PT variants.
  for (const lang of TARGET_LANGS) {
    if (!dict[lang]) {
      console.warn(`No dictionary for lang=${lang}, skipping`);
      continue;
    }
    console.log(`Building ${lang} variants (data-i18n pages):`);
    for (const page of PAGES) {
      const srcAbs = path.join(ROOT, page);
      if (!fs.existsSync(srcAbs)) {
        console.warn(`  source missing: ${page}`);
        skipped++;
        continue;
      }
      const base   = page.replace(/\.html$/, '');
      const dstAbs = path.join(ROOT, `${base}.${lang}.html`);
      const ok = buildVariant(srcAbs, dstAbs, lang, dict);
      if (ok) {
        console.log(`  wrote ${path.relative(ROOT, dstAbs).replace(/\\/g, '/')}`);
        generated++;
      } else {
        skipped++;
      }
    }
  }

  // Phase 2: element pages (PT-default sources) — generate EN variants.
  const ctx = loadElementsContext(dict);
  const elementPages = listElementPages();
  console.log(`Building en variants (element pages, ${elementPages.length} total):`);
  for (const srcAbs of elementPages) {
    const ok = buildElementEnVariant(srcAbs, ctx);
    if (ok) generated++;
    else skipped++;
  }
  console.log(`  ${elementPages.length - skipped} element variants written`);

  console.log(`Done. Generated=${generated}  Skipped=${skipped}`);
}

main();
