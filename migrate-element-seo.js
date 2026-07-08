// ───────────────────────────────────────────────────────────────────
// Atomurus — one-time SEO migration for element pages (PT source)
// ───────────────────────────────────────────────────────────────────
// Rewrites <title>, <meta name="description">, og:title/description,
// twitter:title/description on every PT source file
// /periodic-table/<latin>.html with an SEO-optimized template that
// includes the element name + symbol + atomic number + keywords like
// "Propriedades", "Aplicações", "Tabela Periódica".
//
// Reasoning: the previous title `Arsênio (As) — Atomurus` had poor CTR
// because the snippet looked generic. The new template surfaces
// long-tail search intent ("propriedades", "massa atômica", "elemento").
//
// EN counterparts are regenerated automatically by build-i18n.js using
// the matching template in buildElementEnVariant().
//
// Run: `node migrate-element-seo.js` (idempotent — safe to re-run).
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIR  = path.join(ROOT, 'periodic-table');
const EXCLUDE = new Set([
  'heatmap.html', 'trends.html', 'compare.html', 'isotopes.html',
]);

// ── Load ELEMENTS array from elements-data.js without executing it ─
// Same bracket-walker trick used by build-i18n.js to stay browser-free.
function extractLiteral(code, declMarker) {
  const start = code.indexOf(declMarker);
  if (start < 0) return null;
  let i = start + declMarker.length;
  while (i < code.length && code[i] !== '{' && code[i] !== '[') i++;
  if (i >= code.length) return null;
  const open = code[i], close = open === '{' ? '}' : ']';
  const litStart = i;
  let depth = 0, s = 0;
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
    else if (c === close) { depth--; if (depth === 0) return code.slice(litStart, i + 1); }
  }
  return null;
}

function loadElements() {
  const code = fs.readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const lit  = extractLiteral(code, 'const ELEMENTS = ');
  if (!lit) throw new Error('ELEMENTS not found in elements-data.js');
  /* eslint-disable no-eval */
  return eval('(' + lit + ')');
  /* eslint-enable no-eval */
}

// ── PT category labels (mirrors ptable.cat* keys in i18n.js) ───────
const CAT_PT = {
  nonmetal:   'Não metal',
  noble:      'Gás nobre',
  alkali:     'Metal alcalino',
  alkaline:   'Metal alcalino-terroso',
  metalloid:  'Metaloide',
  polyatomic: 'Não metal poliatômico',
  posttrans:  'Metal pós-transição',
  transition: 'Metal de transição',
  lanthanide: 'Lantanídeo',
  actinide:   'Actinídeo',
  unknown:    'Propriedades desconhecidas',
};

// ── SEO templates (PT) ─────────────────────────────────────────────
// Keep titles under ~70 chars and descriptions under ~160 chars so
// Google shows them fully in the SERP. Long names (Praseodímio,
// Rutherfórdio) end up around 72 chars — still safe.
function ptTitle(el) {
  return `${el.name} (${el.sym}): Elemento ${el.z}, Propriedades e Aplicações | Atomurus`;
}
function ptDescription(el) {
  return `Conheça o ${el.name} (${el.sym}), elemento ${el.z} da tabela periódica: massa atômica ${el.mass} u, propriedades, aplicações, configuração eletrônica e curiosidades no Atomurus.`;
}
function ptOgDescription(el) {
  const cat = CAT_PT[el.cat] || el.cat;
  return `${el.name} (${el.sym}) — elemento ${el.z}, massa atômica ${el.mass} u. ${cat}.`;
}

// ── HTML escaping for attribute context ────────────────────────────
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

// ── Rewriter ───────────────────────────────────────────────────────
function rewriteFile(absPath, el) {
  const src = fs.readFileSync(absPath, 'utf8');
  let out = src;

  const title  = ptTitle(el);
  const desc   = ptDescription(el);
  const ogDesc = ptOgDescription(el);

  // <title>...</title>
  out = out.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escText(title)}</title>`
  );

  // <meta name="description" content="...">
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*">/,
    `<meta name="description" content="${escAttr(desc)}">`
  );

  // og:title / og:description
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*">/,
    `<meta property="og:title" content="${escAttr(title)}">`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escAttr(ogDesc)}">`
  );

  // twitter:title / twitter:description
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*">/,
    `<meta name="twitter:title" content="${escAttr(title)}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escAttr(ogDesc)}">`
  );

  if (out === src) return false;
  fs.writeFileSync(absPath, out, 'utf8');
  return true;
}

// ── Main ───────────────────────────────────────────────────────────
function listElementPages() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.html') &&
                 !f.endsWith('.en.html') &&
                 !f.endsWith('.pt.html') &&
                 !EXCLUDE.has(f))
    .map(f => path.join(DIR, f));
}

function main() {
  const elements = loadElements();
  const byZ = new Map(elements.map(e => [e.z, e]));
  const files = listElementPages();

  let updated = 0, skipped = 0, missing = 0;

  for (const abs of files) {
    const src = fs.readFileSync(abs, 'utf8');
    const zM  = src.match(/window\.PAGE_Z\s*=\s*(\d+)\s*;/);
    if (!zM) { console.warn(`  skip (no PAGE_Z): ${path.basename(abs)}`); skipped++; continue; }
    const z  = parseInt(zM[1], 10);
    const el = byZ.get(z);
    if (!el) { console.warn(`  skip (no ELEMENTS entry for Z=${z}): ${path.basename(abs)}`); missing++; continue; }

    const ok = rewriteFile(abs, el);
    if (ok) updated++; else skipped++;
  }

  console.log(`Updated=${updated}  Skipped=${skipped}  Missing=${missing}  Total=${files.length}`);
}

main();
