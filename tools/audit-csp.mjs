// Content-Security-Policy inventory. Read-only, no dependencies.
//
//   node tools/audit-csp.mjs                    → docs/security/csp-inventario.{md,json}
//   node tools/audit-csp.mjs --emit-report-only → print the stage-2 Report-Only policy
//   node tools/audit-csp.mjs --root <dir> --out <dir>   (used by the tests)
//
// What it counts, over the HTML the site publishes:
//   • inline <script> bodies (executable ones only: no JSON-LD, importmap or
//     other data types), grouped by the sha256 a CSP hash source would carry;
//   • inline event handlers (on*=) by attribute;
//   • <style> blocks and style= attributes;
//   • external origins in src/href of resource tags, url()/@import in CSS, and
//     absolute URLs written literally in the site's own JavaScript.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function arg(name, fallback) {
  const at = args.indexOf(name);
  return at !== -1 ? args[at + 1] : fallback;
}
const ROOT = path.resolve(arg('--root', path.join(HERE, '..')));
const OUT = path.resolve(arg('--out', path.join(ROOT, 'docs', 'security')));

// Same folders tools/validate-site.js leaves out of the published HTML, plus
// the test and report folders a local run can leave behind.
export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase',
  'hanzi-logic', 'propostas', 'dev', 'docs', 'templates', 'src', 'dist',
  'e2e', 'test-results', 'playwright-report', 'fixtures'
]);
const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript']);
const RESOURCE_TAGS = new Set(['script', 'link', 'img', 'iframe', 'source', 'video', 'audio', 'embed', 'object', 'track', 'image', 'use']);
// Navigation and metadata links are not fetched as page resources.
const NON_RESOURCE_RELS = new Set(['canonical', 'alternate', 'author', 'license', 'help', 'manifest-link', 'me', 'next', 'prev', 'search']);

function walk(dir, ext, skip, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skip.has(entry.name)) continue;
      walk(full, ext, skip, out);
    } else if (ext.some((suffix) => entry.name.endsWith(suffix))) {
      out.push(full);
    }
  }
  return out;
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('base64');
}

function attrOf(attrs, name) {
  const m = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(attrs);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? '';
}

// XML namespaces are identifiers, not fetches; template placeholders are not hosts.
const NOT_FETCHED = /^(?:www\.w3\.org|.*\$\{.*)$/;

function originOf(url) {
  const m = /^(?:https?:)?\/\/([^/?#'"\s)]+)/i.exec(String(url || '').trim());
  if (!m || NOT_FETCHED.test(m[1])) return null;
  const scheme = /^http:/i.test(url) ? 'http' : 'https';
  return scheme + '://' + m[1].toLowerCase();
}

// IDs (ad zones, publisher and measurement IDs) never reach the report.
export function redact(text) {
  return String(text)
    .replace(/(zoneId\s*:\s*)(['"])[^'"]*\2/gi, "$1$2…$2")
    .replace(/(data-ad-(?:client|slot)\s*=\s*)(['"])[^'"]*\2/gi, "$1$2…$2")
    .replace(/ca-pub-\d+/g, 'ca-pub-…')
    .replace(/\bG-[A-Z0-9]{6,}\b/g, 'G-…')
    .replace(/\d{5,}/g, '…');
}

function preview(body) {
  return redact(body.replace(/\s+/g, ' ').trim()).slice(0, 90);
}

export function scanHtml(html) {
  const scripts = [];
  const externalScripts = [];
  const handlers = {};
  const styles = [];
  let styleAttrs = 0;
  const origins = [];

  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let m;
  while ((m = scriptRe.exec(withoutComments))) {
    const attrs = m[1];
    const src = attrOf(attrs, 'src');
    const type = (attrOf(attrs, 'type') || '').trim().toLowerCase();
    if (src != null) {
      externalScripts.push(src);
      continue;
    }
    if (!JS_TYPES.has(type)) continue;
    scripts.push(m[2]);
    scanJs(m[2]).forEach((origin) => origins.push({ origin, tag: 'script', attr: 'inline', rel: '' }));
  }
  // Handlers and style= live in tags, not in script or style bodies.
  const tagsOnly = withoutComments
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, (s) => s.slice(0, s.indexOf('>') + 1))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, (s) => {
      styles.push(s.slice(s.indexOf('>') + 1, s.lastIndexOf('<')));
      return '';
    });
  const tagRe = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  while ((m = tagRe.exec(tagsOnly))) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const onRe = /\s(on[a-z]+)\s*=/gi;
    let h;
    while ((h = onRe.exec(attrs))) {
      const name = h[1].toLowerCase();
      handlers[name] = (handlers[name] || 0) + 1;
    }
    if (/\sstyle\s*=/i.test(attrs)) styleAttrs += 1;
    if (!RESOURCE_TAGS.has(tag)) continue;
    if (tag === 'link') {
      const rel = (attrOf(attrs, 'rel') || '').toLowerCase().split(/\s+/);
      if (rel.every((r) => NON_RESOURCE_RELS.has(r))) continue;
    }
    for (const key of ['src', 'href', 'data', 'poster', 'srcset']) {
      const value = attrOf(attrs, key);
      if (!value) continue;
      const parts = key === 'srcset' ? value.split(',').map((v) => v.trim().split(/\s+/)[0]) : [value];
      parts.forEach((part) => {
        const origin = originOf(part);
        if (origin) origins.push({ origin, tag, attr: key, rel: tag === 'link' ? (attrOf(attrs, 'rel') || '') : '' });
      });
    }
  }
  return { scripts, externalScripts, handlers, styles, styleAttrs, origins };
}

export function scanCss(css) {
  const out = [];
  const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"]/gi;
  let m;
  while ((m = re.exec(css))) {
    const origin = originOf(m[1] || m[2]);
    if (origin) out.push(origin);
  }
  return out;
}

export function scanJs(js) {
  const out = new Set();
  const noComments = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
  const re = /['"`](https?:\/\/[^'"`\s]+)/g;
  let m;
  while ((m = re.exec(noComments))) {
    const origin = originOf(m[1]);
    if (origin) out.add(origin);
  }
  return [...out];
}

// Files the Netlify build deletes before publishing (tools/scrub-publish-tree.js).
function scrubbed(root) {
  const file = path.join(root, 'tools', 'scrub-publish-tree.js');
  if (!fs.existsSync(file)) return new Set();
  const block = /REMOVE_PATHS\s*=\s*\[([\s\S]*?)\];/.exec(fs.readFileSync(file, 'utf8'));
  return new Set(block ? [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : []);
}

export function inventory(root) {
  const removed = scrubbed(root);
  const published = (rel) => ![...removed].some((item) => rel === item || rel.startsWith(item + '/'));
  const htmlFiles = walk(root, ['.html'], SKIP_DIRS).filter((file) => published(path.relative(root, file).split(path.sep).join('/')));
  const groups = new Map();
  const handlerTotals = {};
  const handlerPages = {};
  const styleGroups = new Map();
  let styleAttrTotal = 0;
  let styleAttrPages = 0;
  let inlineTotal = 0;
  const origins = new Map();

  function noteOrigin(origin, where, how) {
    if (!origins.has(origin)) origins.set(origin, { origin, files: new Set(), uses: new Set() });
    const row = origins.get(origin);
    row.files.add(where);
    row.uses.add(how);
  }

  for (const file of htmlFiles) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const scan = scanHtml(fs.readFileSync(file, 'utf8'));
    scan.scripts.forEach((body) => {
      inlineTotal += 1;
      const hash = sha256(body);
      if (!groups.has(hash)) groups.set(hash, { hash, bytes: Buffer.byteLength(body, 'utf8'), preview: preview(body), pages: new Set(), count: 0 });
      const g = groups.get(hash);
      g.count += 1;
      g.pages.add(rel);
    });
    Object.entries(scan.handlers).forEach(([name, n]) => {
      handlerTotals[name] = (handlerTotals[name] || 0) + n;
      if (!handlerPages[name]) handlerPages[name] = new Set();
      handlerPages[name].add(rel);
    });
    scan.styles.forEach((body) => {
      const hash = sha256(body);
      if (!styleGroups.has(hash)) styleGroups.set(hash, { hash, pages: new Set() });
      styleGroups.get(hash).pages.add(rel);
    });
    styleAttrTotal += scan.styleAttrs;
    if (scan.styleAttrs) styleAttrPages += 1;
    scan.externalScripts.forEach((src) => {
      const origin = originOf(src);
      if (origin) noteOrigin(origin, rel, 'script src');
    });
    scan.origins.forEach((row) => noteOrigin(row.origin, rel, row.tag + (row.rel ? '[rel=' + row.rel + ']' : '') + ' ' + row.attr));
  }

  for (const file of walk(root, ['.css'], SKIP_DIRS)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (!published(rel)) continue;
    scanCss(fs.readFileSync(file, 'utf8')).forEach((origin) => noteOrigin(origin, rel, 'css url()/@import'));
  }
  for (const file of walk(root, ['.js', '.mjs'], SKIP_DIRS)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (/\.min\.js$/.test(rel) || !published(rel)) continue;
    scanJs(fs.readFileSync(file, 'utf8')).forEach((origin) => noteOrigin(origin, rel, 'js literal'));
  }

  const handlerPagesAll = new Set();
  Object.values(handlerPages).forEach((set) => set.forEach((page) => handlerPagesAll.add(page)));
  const scripts = [...groups.values()]
    .map((g) => ({ hash: g.hash, bytes: g.bytes, count: g.count, pages: g.pages.size, preview: g.preview, samplePages: [...g.pages].sort().slice(0, 3) }))
    .sort((a, b) => b.pages - a.pages || b.count - a.count || a.hash.localeCompare(b.hash));
  return {
    htmlFiles: htmlFiles.length,
    inlineScripts: { total: inlineTotal, distinct: scripts.length, groups: scripts },
    handlers: {
      total: Object.values(handlerTotals).reduce((a, b) => a + b, 0),
      pages: handlerPagesAll.size,
      byAttribute: Object.fromEntries(Object.entries(handlerTotals).sort((a, b) => b[1] - a[1]).map(([name, n]) => [name, { count: n, pages: handlerPages[name].size }]))
    },
    styles: {
      blocks: [...styleGroups.values()].reduce((a, g) => a + g.pages.size, 0),
      distinctBlocks: styleGroups.size,
      styleAttributes: styleAttrTotal,
      pagesWithStyleAttributes: styleAttrPages
    },
    origins: [...origins.values()]
      .map((row) => ({ origin: row.origin, files: row.files.size, uses: [...row.uses].sort(), sampleFiles: [...row.files].sort().slice(0, 4) }))
      .sort((a, b) => a.origin.localeCompare(b.origin))
  };
}

// ── The policies ────────────────────────────────────────────────────────────
// Sources by purpose: what the code that loads each third party requests,
// checked against Google's published CSP lists for GA4 (Tag Platform, «Use a
// Content Security Policy») and reCAPTCHA (FAQ). netlify.toml carries the
// result; tools/test-audit-csp.mjs fails if the two drift.
export const SOURCES = {
  // lazy-ads.js, after measurement consent: gtag.js from googletagmanager,
  // hits to the regional google-analytics / analytics.google hosts.
  analytics: {
    script: ['https://*.googletagmanager.com'],
    connect: ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com']
  },
  // recaptcha.js on the contact form: api.js from www.google.com, its code
  // from www.gstatic.com, the challenge frame and the api2 calls back.
  // script-src and frame-src keep the whole www.google.com / www.gstatic.com
  // hosts from stage 0, because the ad loaders may use them too; narrowing to
  // /recaptcha/ is a step for when ads are off for good.
  recaptcha: {
    script: ['https://www.google.com', 'https://www.gstatic.com'],
    connect: ['https://www.google.com/recaptcha/'],
    frame: ['https://www.google.com', 'https://recaptcha.google.com/recaptcha/']
  },
  // ads-gate.js, only after ads consent and only for plans that show ads
  // (prompt 04). Unchanged from stage 0: the owner decides whether ads stay.
  ads: {
    script: ['https://pagead2.googlesyndication.com', 'https://www.googletagservices.com', 'https://acscdn.com', 'https://ep1.adtrafficquality.google', 'https://ep2.adtrafficquality.google'],
    connect: ['https://pagead2.googlesyndication.com', 'https://acscdn.com', 'https://ep1.adtrafficquality.google', 'https://ep2.adtrafficquality.google', 'https://googleads.g.doubleclick.net', 'https://stats.g.doubleclick.net'],
    frame: ['https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com', 'https://ep1.adtrafficquality.google', 'https://ep2.adtrafficquality.google']
  },
  // Chart.js and its zoom plugin (periodic-table.js, trends) from jsdelivr;
  // Three.js r128 (viewer/load-three.js), html2canvas and jsPDF from cdnjs.
  libraries: { script: ['https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'] }
};

function uniq(list) {
  return [...new Set(list)];
}

function collect(kind) {
  return uniq(Object.values(SOURCES).flatMap((row) => row[kind] || []));
}

function directive(name, sources) {
  return [name].concat(sources).join(' ');
}

export function buildPolicy({ scriptHashes = null } = {}) {
  const strict = Array.isArray(scriptHashes);
  const script = strict
    ? ["'self'"].concat(scriptHashes.map((h) => `'sha256-${h}'`), collect('script'))
    : ["'self'", "'unsafe-inline'"].concat(collect('script'));
  return [
    "default-src 'self'",
    directive('script-src', script),
    strict ? "script-src-attr 'none'" : null,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: https:",
    directive('connect-src', ["'self'"].concat(collect('connect'))),
    directive('frame-src', ["'self'"].concat(collect('frame'))),
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].filter(Boolean).join('; ');
}

// Stage 2 carries hashes for the most widely used inline scripts only, so the
// header stays under the budget; the rest are the externalisation work list.
export const REPORT_ONLY_BUDGET = 4096;

export function reportOnlyPolicy(inv, budget = REPORT_ONLY_BUDGET) {
  const chosen = [];
  for (const group of inv.inlineScripts.groups) {
    const next = buildPolicy({ scriptHashes: chosen.concat(group.hash) });
    if (Buffer.byteLength(next, 'utf8') > budget) break;
    chosen.push(group.hash);
  }
  const policy = buildPolicy({ scriptHashes: chosen });
  const covered = inv.inlineScripts.groups.filter((g) => chosen.includes(g.hash));
  const coveredUses = covered.reduce((a, g) => a + g.count, 0);
  return {
    policy,
    bytes: Buffer.byteLength(policy, 'utf8'),
    hashes: chosen.length,
    coveredUses,
    uncoveredGroups: inv.inlineScripts.distinct - chosen.length,
    uncoveredUses: inv.inlineScripts.total - coveredUses
  };
}

function markdown(inv, ro) {
  const lines = [];
  lines.push('# Inventário de CSP');
  lines.push('');
  lines.push('Gerado por `node tools/audit-csp.mjs` (somente leitura). Os IDs de anúncio e de medição são ocultados nas prévias.');
  lines.push('');
  lines.push('## Resumo');
  lines.push('');
  lines.push('| Item | Quantidade |');
  lines.push('|---|---|');
  lines.push(`| Páginas HTML publicáveis | ${inv.htmlFiles} |`);
  lines.push(`| Scripts inline executáveis | ${inv.inlineScripts.total} |`);
  lines.push(`| Scripts inline distintos (sha256) | ${inv.inlineScripts.distinct} |`);
  lines.push(`| Manipuladores \`on*=\` | ${inv.handlers.total} em ${inv.handlers.pages} páginas |`);
  lines.push(`| Blocos \`<style>\` | ${inv.styles.blocks} (${inv.styles.distinctBlocks} distintos) |`);
  lines.push(`| Atributos \`style=\` | ${inv.styles.styleAttributes} em ${inv.styles.pagesWithStyleAttributes} páginas |`);
  lines.push(`| Origens externas | ${inv.origins.length} |`);
  lines.push('');
  lines.push('## Manipuladores inline por atributo');
  lines.push('');
  lines.push('| Atributo | Ocorrências | Páginas |');
  lines.push('|---|---|---|');
  Object.entries(inv.handlers.byAttribute).forEach(([name, row]) => lines.push(`| \`${name}\` | ${row.count} | ${row.pages} |`));
  lines.push('');
  lines.push('## Scripts inline mais repetidos');
  lines.push('');
  lines.push('| # | Páginas | Usos | Bytes | sha256 | Prévia |');
  lines.push('|---|---|---|---|---|---|');
  inv.inlineScripts.groups.slice(0, 25).forEach((g, i) => {
    lines.push(`| ${i + 1} | ${g.pages} | ${g.count} | ${g.bytes} | \`${g.hash.slice(0, 12)}…\` | \`${g.preview.replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`);
  });
  const single = inv.inlineScripts.groups.filter((g) => g.pages === 1).length;
  lines.push('');
  lines.push(`${single} dos ${inv.inlineScripts.distinct} scripts distintos aparecem em uma única página. Lista completa (com o hash inteiro) em \`csp-inventario.json\`.`);
  lines.push('');
  lines.push('## Origens externas');
  lines.push('');
  lines.push('| Origem | Arquivos | Como aparece | Exemplos |');
  lines.push('|---|---|---|---|');
  inv.origins.forEach((row) => lines.push(`| ${row.origin} | ${row.files} | ${row.uses.join(', ')} | ${row.sampleFiles.join(', ')} |`));
  lines.push('');
  lines.push('Atenção: «js literal» inclui URLs que só aparecem em texto (links, documentação, mensagens). Uma origem só precisa estar na CSP se a página **carregar** algo dela; veja a tabela por finalidade em `csp-plano.md`.');
  lines.push('');
  lines.push('## Report-Only (etapa 2)');
  lines.push('');
  lines.push(`- Cabeçalho: ${ro.bytes} bytes (orçamento ${REPORT_ONLY_BUDGET}).`);
  lines.push(`- Hashes incluídos: ${ro.hashes} (cobrem ${ro.coveredUses} dos ${inv.inlineScripts.total} usos de script inline).`);
  lines.push(`- Fora do orçamento: ${ro.uncoveredGroups} scripts distintos (${ro.uncoveredUses} usos) — vão aparecer como violação no Report-Only e são a lista de externalização.`);
  lines.push('');
  return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const inv = inventory(ROOT);
  const ro = reportOnlyPolicy(inv);
  if (args.includes('--emit-report-only')) {
    process.stdout.write(ro.policy + '\n');
  } else if (args.includes('--emit-policy')) {
    process.stdout.write(buildPolicy() + '\n');
  } else {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'csp-inventario.json'), JSON.stringify({ ...inv, reportOnly: { bytes: ro.bytes, hashes: ro.hashes, coveredUses: ro.coveredUses, uncoveredGroups: ro.uncoveredGroups, uncoveredUses: ro.uncoveredUses } }, null, 2) + '\n');
    fs.writeFileSync(path.join(OUT, 'csp-inventario.md'), markdown(inv, ro));
    console.log(`csp inventory: ${inv.htmlFiles} pages, ${inv.inlineScripts.total} inline scripts (${inv.inlineScripts.distinct} distinct), ${inv.handlers.total} handlers, ${inv.origins.length} origins; report-only ${ro.bytes} bytes, ${ro.hashes} hashes`);
  }
}
