#!/usr/bin/env node
// A1.0 — reproducible architecture audit. Every number in
// docs/reports/a1-0-architecture-mobile-readiness.md comes from this script
// (or from tools/perf-baseline.mjs). Nothing is estimated by hand.
//
//   node tools/audit-architecture.mjs            → markdown to stdout
//   node tools/audit-architecture.mjs --json     → JSON to stdout
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'dist', 'propostas', 'hanzi-logic', 'docs', 'tools', 'e2e', 'scripts', 'supabase', 'test-results', 'playwright-report', 'dev', 'netlify', 'templates']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const files = walk(ROOT);
/* Product runtime JS: hand-written client code (generated data files and
   the generated core bundle are excluded from pattern counts). */
const GENERATED = /^(assets\/element-content\/|assets\/i18n\/|assets\/core\/|home-preview-data\.js|elements-data(-en)?\.js|element-applications-data\.js|isotope-.*-data\.js|isotopes-data\.js|assets\/product-catalog\.js)/;
const js = files.filter((f) => f.endsWith('.js') && !GENERATED.test(rel(f)));
const html = files.filter((f) => f.endsWith('.html'));
/* When src/ui exists, assets/ui is its generated copy: count sources once. */
const hasSrcUi = files.some((f) => rel(f).startsWith('src/ui/'));
const css = files.filter((f) => f.endsWith('.css') && !(hasSrcUi && rel(f).startsWith('assets/ui/')));

function countBy(list, re, { perFile = true } = {}) {
  const rows = [];
  let total = 0;
  for (const f of list) {
    const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
    const n = (text.match(re) || []).length;
    if (n) { rows.push({ file: rel(f), count: n }); total += n; }
  }
  rows.sort((a, b) => b.count - a.count);
  return { total, files: rows.length, top: perFile ? rows.slice(0, 15) : [] };
}

const srcJs = js.filter((f) => rel(f).startsWith('src/'));
const legacyJs = js.filter((f) => !rel(f).startsWith('src/'));
/* Inline <script> in HTML pages is counted separately (theme/lang boot). */

const audit = {
  generatedAt: new Date().toISOString(),
  directFetch: {
    legacyApi: countBy(legacyJs, /fetch\(\s*['"`]\/api\//g),
    legacyAny: countBy(legacyJs, /\bfetch\s*\(/g),
    src: countBy(srcJs.filter((f) => !/src\/core\/api\//.test(rel(f))), /\bfetch\s*\(/g)
  },
  globalListeners: {
    window: countBy(legacyJs, /window\.addEventListener\(/g),
    document: countBy(legacyJs, /document\.addEventListener\(/g),
    removeWindowOrDocument: countBy(legacyJs, /(window|document)\.removeEventListener\(/g),
    setInterval: countBy(legacyJs, /\bsetInterval\(/g),
    clearInterval: countBy(legacyJs, /\bclearInterval\(/g),
    setTimeout: countBy(legacyJs, /\bsetTimeout\(/g),
    requestAnimationFrame: countBy(legacyJs, /requestAnimationFrame\(/g),
    cancelAnimationFrame: countBy(legacyJs, /cancelAnimationFrame\(/g),
    MutationObserver: countBy(legacyJs, /new MutationObserver\(/g),
    ResizeObserver: countBy(legacyJs, /new ResizeObserver\(/g),
    IntersectionObserver: countBy(legacyJs, /new IntersectionObserver\(/g),
    disconnect: countBy(legacyJs, /\.disconnect\(\)/g)
  },
  fullPageNavigation: (() => {
    const re = /(?:window\.)?location\.(?:href\s*=(?!=)|replace\(|assign\()|window\.location\s*=(?!=)/g;
    const rows = [];
    for (const f of legacyJs) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!re.test(line)) return;
        re.lastIndex = 0;
        let kind = 'legacy-migrable';
        if (/login|signup|logout|auth|next=/.test(line)) kind = 'auth';
        else if (/https?:\/\//.test(line) || /stripe|checkout|portal|billing|url\b/i.test(line)) kind = 'external/billing';
        else if (/section=account|\/account/.test(line)) kind = 'account-redirect';
        else if (/lang|\.pt\.html|langUrl|swap/i.test(line)) kind = 'i18n-page-swap';
        rows.push({ file: rel(f), line: i + 1, kind });
      });
    }
    const byKind = rows.reduce((acc, r) => { acc[r.kind] = (acc[r.kind] || 0) + 1; return acc; }, {});
    const byFile = rows.reduce((acc, r) => { acc[r.file] = (acc[r.file] || 0) + 1; return acc; }, {});
    return { total: rows.length, byKind, byFile: Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 15) };
  })(),
  webStorage: {
    local: countBy(legacyJs, /localStorage\.(getItem|setItem|removeItem)\(/g),
    session: countBy(legacyJs, /sessionStorage\.(getItem|setItem|removeItem)\(/g),
    inlineHtml: countBy(html, /localStorage\.(getItem|setItem)\(/g, { perFile: false })
  },
  important: (() => {
    const rows = css.map((f) => ({ file: rel(f), count: (readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g) || []).length, bytes: statSync(f).size }))
      .filter((r) => r.count).sort((a, b) => b.count - a.count);
    return { total: rows.reduce((s, r) => s + r.count, 0), files: rows };
  })(),
  appHtmlLayers: (() => {
    const text = readFileSync(path.join(ROOT, 'app.html'), 'utf8');
    const sheets = Array.from(text.matchAll(/<link rel="stylesheet" href="([^"?]+)/g)).map((m) => m[1]);
    const scripts = Array.from(text.matchAll(/<script src="([^"?]+)/g)).map((m) => m[1]);
    const size = (p) => { try { return statSync(path.join(ROOT, p.replace(/^\//, ''))).size; } catch (_e) { return null; } };
    return { stylesheets: sheets.map((p) => ({ path: p, bytes: size(p) })), scripts: scripts.map((p) => ({ path: p, bytes: size(p) })) };
  })(),
  largestJs: files.filter((f) => f.endsWith('.js')).map((f) => ({ file: rel(f), bytes: statSync(f).size })).sort((a, b) => b.bytes - a.bytes).slice(0, 15),
  largestCss: css.map((f) => ({ file: rel(f), bytes: statSync(f).size })).sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  images: (() => {
    const imgs = files.filter((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f)).map((f) => ({ file: rel(f), bytes: statSync(f).size }));
    const og = imgs.filter((i) => /\/og-/.test(i.file));
    return {
      count: imgs.length,
      totalBytes: imgs.reduce((s, i) => s + i.bytes, 0),
      ogCount: og.length,
      ogBytes: og.reduce((s, i) => s + i.bytes, 0),
      over200k: imgs.filter((i) => i.bytes > 200 * 1024).sort((a, b) => b.bytes - a.bytes)
    };
  })(),
  pages: { html: html.length, pt: html.filter((f) => f.endsWith('.pt.html')).length }
};

function table(rows, cols) {
  if (!rows.length) return '_none_\n';
  return `| ${cols.join(' | ')} |\n| ${cols.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${cols.map((c) => r[c]).join(' | ')} |`).join('\n')}\n`;
}

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
} else {
  const g = audit.globalListeners;
  const out = [];
  out.push(`## Audit (${audit.generatedAt})\n`);
  out.push(`HTML pages: ${audit.pages.html} (${audit.pages.pt} PT)\n`);
  out.push(`### Direct fetch\n\nLegacy \`fetch('/api/…')\`: **${audit.directFetch.legacyApi.total}** in ${audit.directFetch.legacyApi.files} files; any \`fetch(\` in legacy JS: ${audit.directFetch.legacyAny.total}; in src/ outside core/api: ${audit.directFetch.src.total}.\n`);
  out.push(table(audit.directFetch.legacyAny.top, ['file', 'count']));
  out.push('### Global listeners / timers / observers (legacy JS)\n');
  out.push(table(Object.entries(g).map(([k, v]) => ({ api: k, total: v.total, files: v.files })), ['api', 'total', 'files']));
  out.push('Top files by `window.addEventListener`:\n');
  out.push(table(g.window.top.slice(0, 10), ['file', 'count']));
  out.push(`### Full page navigation (location.*): ${audit.fullPageNavigation.total}\n`);
  out.push(table(Object.entries(audit.fullPageNavigation.byKind).map(([kind, count]) => ({ kind, count })), ['kind', 'count']));
  out.push(table(audit.fullPageNavigation.byFile.map(([file, count]) => ({ file, count })), ['file', 'count']));
  out.push(`### Web storage\n\nlocalStorage calls: ${audit.webStorage.local.total} in ${audit.webStorage.local.files} files; sessionStorage: ${audit.webStorage.session.total}; inline in HTML: ${audit.webStorage.inlineHtml.total} in ${audit.webStorage.inlineHtml.files} pages.\n`);
  out.push(`### !important: ${audit.important.total}\n`);
  out.push(table(audit.important.files.slice(0, 15), ['file', 'count', 'bytes']));
  out.push('### /app layers\n');
  out.push(table(audit.appHtmlLayers.stylesheets, ['path', 'bytes']));
  out.push(table(audit.appHtmlLayers.scripts, ['path', 'bytes']));
  out.push('### Largest JS\n');
  out.push(table(audit.largestJs, ['file', 'bytes']));
  out.push('### Largest CSS\n');
  out.push(table(audit.largestCss, ['file', 'bytes']));
  out.push(`### Images\n\n${audit.images.count} images, ${audit.images.totalBytes} bytes; OG images: ${audit.images.ogCount} (${audit.images.ogBytes} bytes).\n`);
  out.push(table(audit.images.over200k, ['file', 'bytes']));
  process.stdout.write(out.join('\n'));
}
