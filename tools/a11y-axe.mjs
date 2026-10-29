// Optional axe-core run over a few pages, in the local Chromium from Playwright.
// axe-core is NOT a dependency of this repo (owner decision); this script only
// runs when it can find it, and otherwise says so and exits 0.
//
//   node tools/a11y-axe.mjs                       → axe from this repo or the cwd, if installed
//   node tools/a11y-axe.mjs --axe /tmp/axe        → a folder where `npm i axe-core` was run
//   node tools/a11y-axe.mjs --pages /,/calculators.html
//   node tools/a11y-axe.mjs --open-modal          → also audit the periodic table with the element modal open
//   node tools/a11y-axe.mjs --json out.json --strict
//
// See docs/a11y/README.md for the one-off setup.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const at = args.indexOf(name);
  return at !== -1 ? args[at + 1] : fallback;
};

// The rules the 2026 audit reported for M09 (prompt 23).
export const FOCUS_RULES = [
  'select-name', 'aria-required-children', 'aria-dialog-name',
  'label-content-name-mismatch', 'color-contrast', 'bypass', 'label'
];
const DEFAULT_PAGES = [
  '/index.html', '/calculators.html', '/calculators.pt.html',
  '/periodic-table.html', '/periodic-table.pt.html'
];

export function findAxe(hint) {
  const bases = [];
  if (hint) bases.push(path.resolve(hint, 'package.json'), path.resolve(hint, 'noop.js'));
  bases.push(path.join(process.cwd(), 'package.json'), path.join(ROOT, 'package.json'));
  for (const base of bases) {
    try {
      const file = createRequire(base).resolve('axe-core/axe.min.js');
      if (fs.existsSync(file)) return file;
    } catch (_err) {}
  }
  if (hint && /axe(\.min)?\.js$/.test(hint) && fs.existsSync(hint)) return path.resolve(hint);
  return null;
}

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_err) {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('local server did not start: ' + url);
}

async function main() {
  const axeFile = findAxe(arg('--axe', ''));
  if (!axeFile) {
    console.log('axe indisponível — pulado (veja docs/a11y/README.md para rodar localmente).');
    return 0;
  }
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (_err) {
    try {
      ({ chromium } = createRequire(path.join(ROOT, 'package.json'))('@playwright/test'));
    } catch (_err2) {
      console.log('playwright indisponível — pulado.');
      return 0;
    }
  }
  const port = Number(arg('--port', '4179'));
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [path.join(ROOT, 'tools', 'e2e-serve.mjs')], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { E2E_PORT: String(port) }),
    stdio: 'ignore'
  });
  const pages = String(arg('--pages', DEFAULT_PAGES.join(','))).split(',').filter(Boolean);
  const source = fs.readFileSync(axeFile, 'utf8');
  const report = [];
  let browser;
  try {
    await waitForServer(base + '/index.html');
    const exe = arg('--chromium', process.env.PW_CHROMIUM_EXECUTABLE || '');
    browser = await chromium.launch(exe ? { executablePath: exe } : {});
    const targets = pages.map((p) => ({ url: p, modal: false }));
    if (args.includes('--open-modal')) {
      pages.filter((p) => /periodic-table(\.pt)?\.html$/.test(p)).forEach((p) => targets.push({ url: p, modal: true }));
    }
    for (const target of targets) {
      for (const width of [1280, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        await context.addInitScript(() => {
          try { localStorage.setItem('atomurus-cookie-consent', 'rejected'); } catch (_err) {}
        });
        const page = await context.newPage();
        await page.goto(base + target.url, { waitUntil: 'load' });
        await page.waitForTimeout(400);
        if (target.modal) {
          await page.locator('.el[data-z="26"]').first().click().catch(() => {});
          await page.waitForTimeout(300);
        }
        await page.addScriptTag({ content: source });
        const violations = await page.evaluate(async () => {
          // label-content-name-mismatch is an experimental axe rule: turn it on.
          const res = await window.axe.run(document, {
            resultTypes: ['violations'],
            rules: { 'label-content-name-mismatch': { enabled: true } }
          });
          return res.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.length,
            sample: v.nodes.slice(0, 3).map((n) => n.target.join(' '))
          }));
        });
        report.push({ url: target.url + (target.modal ? ' (modal open)' : ''), width, violations });
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  const version = JSON.parse(fs.readFileSync(path.join(path.dirname(axeFile), 'package.json'), 'utf8')).version;
  console.log(`axe-core ${version}`);
  let focusTotal = 0;
  for (const row of report) {
    const focus = row.violations.filter((v) => FOCUS_RULES.includes(v.id));
    focusTotal += focus.reduce((a, v) => a + v.nodes, 0);
    const all = row.violations.map((v) => `${v.id}(${v.nodes})`).join(', ') || 'none';
    console.log(`${row.url} @${row.width}px → ${all}`);
  }
  console.log(`focus rules (${FOCUS_RULES.join(', ')}): ${focusTotal} nodes`);
  const out = arg('--json', '');
  if (out) fs.writeFileSync(out, JSON.stringify({ axe: version, report }, null, 2) + '\n');
  return args.includes('--strict') && focusTotal ? 1 : 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().then((code) => process.exit(code), (err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
