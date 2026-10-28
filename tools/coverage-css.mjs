// CSS coverage of atomurus-lab-console.css (and the other stylesheets) per page
// family, at 1280 and 390 px, no third parties. Prompt 24: decide with numbers
// whether a block of the lab console stylesheet should move to its own file.
//
//   node tools/coverage-css.mjs [--md out.md] [--json out.json]
//
// Coverage counts a rule as used when it matched while the page loaded (both
// widths together). Hover, open menus and states reached only by interaction are
// not counted, so these numbers are a lower bound of what a family needs.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { isolate } = require('../e2e/pt-pages-helpers.js');
const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : '');
const TARGET = 'atomurus-lab-console.css';
const THREE_MIN = path.join(ROOT, 'node_modules/three/build/three.min.js');

export const FAMILIES = [
  { key: 'home', url: '/' },
  { key: 'tool', url: '/calculators.html' },
  { key: 'viewer', url: '/viewer/molecules.html' },
  { key: 'article', url: '/explore/what-is-an-atom.html' },
  { key: 'table', url: '/periodic-table.html' },
  { key: 'auth', url: '/login.html' }
];

// Sections of the stylesheet: banner comments (/* ═══ … title … */) and the
// short ALL-CAPS markers (/* SIDEBAR */). Returns [{ name, start, end }].
export function cssSections(text) {
  const marks = [];
  for (const m of text.matchAll(/\/\*([\s\S]*?)\*\//g)) {
    const body = m[1];
    let name = null;
    if (/═{6,}/.test(body)) {
      name = body.split('\n').map((l) => l.replace(/[═\s*]+/g, ' ').trim()).find((l) => l.length > 2) || null;
    } else if (/^\s*[A-Z][A-Z0-9 /&()—-]{2,}\s*$/.test(body)) {
      name = body.trim();
    }
    if (name) marks.push({ name: name.slice(0, 70), start: m.index });
  }
  if (!marks.length || marks[0].start > 0) marks.unshift({ name: '(top)', start: 0 });
  return marks.map((s, i) => ({ ...s, end: i + 1 < marks.length ? marks[i + 1].start : text.length }));
}

function usedMask(length, ranges) {
  const mask = new Uint8Array(length);
  for (const r of ranges) mask.fill(1, r.start, Math.min(r.end, length));
  return mask;
}

async function waitForServer(url) {
  for (let i = 0; i < 60; i += 1) {
    try { if ((await fetch(url)).ok) return; } catch (_err) {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
}

async function main() {
  const { chromium } = await import('playwright');
  const port = 4188;
  const server = spawn(process.execPath, [path.join(ROOT, 'tools', 'e2e-serve.mjs')], {
    cwd: ROOT, env: Object.assign({}, process.env, { E2E_PORT: String(port) }), stdio: 'ignore'
  });
  const base = `http://127.0.0.1:${port}`;
  const result = { families: {}, files: {} };
  let text = '';
  let browser;
  try {
    await waitForServer(base + '/index.html');
    const exe = process.env.PW_CHROMIUM_EXECUTABLE;
    browser = await chromium.launch(exe ? { executablePath: exe } : {});
    for (const fam of FAMILIES) {
      const masks = {};
      for (const width of [1280, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        await isolate(context, 'en');
        await context.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(THREE_MIN) }));
        const page = await context.newPage();
        await page.coverage.startCSSCoverage({ resetOnNavigation: false });
        await page.goto(base + fam.url, { waitUntil: 'load' });
        await page.waitForTimeout(700);
        const entries = await page.coverage.stopCSSCoverage();
        for (const e of entries) {
          const rel = new URL(e.url).pathname.replace(/^\//, '');
          if (!rel.endsWith('.css')) continue;
          const mask = usedMask(e.text.length, e.ranges);
          if (masks[rel]) for (let i = 0; i < mask.length; i += 1) masks[rel][i] |= mask[i];
          else masks[rel] = mask;
          if (rel === TARGET) text = e.text;
          result.files[rel] = e.text.length;
        }
        await context.close();
      }
      result.families[fam.key] = masks;
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  const pct = (mask, a = 0, b = mask.length) => {
    let u = 0;
    for (let i = a; i < b; i += 1) u += mask[i];
    return b > a ? Math.round((u / (b - a)) * 1000) / 10 : 0;
  };
  const fams = FAMILIES.map((f) => f.key);
  const lines = [];
  lines.push('### Stylesheets loaded, % of each used (1280 + 390 px)');
  lines.push('');
  lines.push('| Stylesheet | KB | ' + fams.join(' | ') + ' |');
  lines.push('|---|---:|' + fams.map(() => '---:').join('|') + '|');
  for (const [rel, len] of Object.entries(result.files).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${rel} | ${(len / 1024).toFixed(1)} | ` + fams.map((f) => (result.families[f][rel] ? pct(result.families[f][rel]) + '%' : '—')).join(' | ') + ' |');
  }
  lines.push('');
  const secs = cssSections(text);
  const sectionRows = secs.map((s) => ({
    name: s.name, kb: (s.end - s.start) / 1024,
    used: Object.fromEntries(fams.map((f) => [f, result.families[f][TARGET] ? pct(result.families[f][TARGET], s.start, s.end) : null]))
  }));
  lines.push(`### ${TARGET} by section (≥ 2 KB), % used per family`);
  lines.push('');
  lines.push('| Section | KB | ' + fams.join(' | ') + ' |');
  lines.push('|---|---:|' + fams.map(() => '---:').join('|') + '|');
  for (const r of sectionRows.filter((x) => x.kb >= 2)) {
    lines.push(`| ${r.name.replace(/\|/g, '/')} | ${r.kb.toFixed(1)} | ` + fams.map((f) => (r.used[f] == null ? '—' : r.used[f] + '%')).join(' | ') + ' |');
  }
  lines.push('');
  const md = lines.join('\n');
  if (arg('--md')) fs.writeFileSync(arg('--md'), md + '\n');
  if (arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify({ files: result.files, sections: sectionRows }, null, 2) + '\n');
  console.log(md);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((err) => { console.error(err); process.exit(1); });
