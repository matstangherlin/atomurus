// JS coverage of periodic-table.js (and the files split out of it) on the five
// English periodic table pages: load, search «Fe», open the modal, the page's
// central action. No third parties (Chart.js is the test stub).
//
//   node tools/coverage-pt.mjs                    → table of % of each section executed per page
//   node tools/coverage-pt.mjs --md out.md --json out.json
//
// Needs Playwright's Chromium (PW_CHROMIUM_EXECUTABLE if the bundled one is missing).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { sections } from './analyze-pt-split.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { PT_PAGES, isolate, centralAct } = require('../e2e/pt-pages-helpers.js');
const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : '');

// Executed bytes from V8 block coverage: inner ranges override outer ones.
export function executedMask(source, functions) {
  const mask = new Uint8Array(source.length);
  const ranges = functions.flatMap((f) => f.ranges).sort((a, b) => a.startOffset - b.startOffset || b.endOffset - a.endOffset);
  for (const r of ranges) mask.fill(r.count > 0 ? 1 : 0, r.startOffset, Math.min(r.endOffset, source.length));
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
  const port = 4186;
  const server = spawn(process.execPath, [path.join(ROOT, 'tools', 'e2e-serve.mjs')], {
    cwd: ROOT, env: Object.assign({}, process.env, { E2E_PORT: String(port) }), stdio: 'ignore'
  });
  const base = `http://127.0.0.1:${port}`;
  const result = {};
  let browser;
  try {
    await waitForServer(base + '/index.html');
    const exe = process.env.PW_CHROMIUM_EXECUTABLE;
    browser = await chromium.launch(exe ? { executablePath: exe } : {});
    for (const spec of PT_PAGES) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await isolate(context, 'en');
      const page = await context.newPage();
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await page.goto(base + spec.en);
      await page.waitForFunction(() => typeof ELEMENTS !== 'undefined' && ELEMENTS.length === 118);
      await page.locator('#search-input').fill('Fe');
      await page.waitForTimeout(250);
      await page.evaluate(() => openModal(ELEMENTS.find((e) => e.z === 26)));
      await page.keyboard.press('Escape');
      await centralAct(page, spec.key);
      await page.waitForTimeout(300);
      const entries = await page.coverage.stopJSCoverage();
      const files = {};
      for (const entry of entries) {
        const rel = new URL(entry.url).pathname.replace(/^\//, '');
        if (!/(^|\/)periodic-table\.js$|^assets\/pt\//.test(rel)) continue;
        const mask = executedMask(entry.source, entry.functions);
        const secs = sections(entry.source);
        const bytes = Buffer.byteLength(entry.source);
        let used = 0;
        for (let i = 0; i < mask.length; i += 1) used += mask[i];
        // Functions (not the script's top level) that ran, by the section they start in.
        const fns = entry.functions.filter((f) => f.ranges[0].startOffset > 0 || f.ranges[0].endOffset < entry.source.length);
        const called = (s) => fns.filter((f) => f.ranges[0].startOffset >= s.at && f.ranges[0].startOffset < s.end && f.ranges[0].count > 0).length;
        const total = (s) => fns.filter((f) => f.ranges[0].startOffset >= s.at && f.ranges[0].startOffset < s.end).length;
        files[rel.replace(/^periodic-table\//, '')] = {
          bytes,
          usedPct: Math.round((used / entry.source.length) * 1000) / 10,
          sections: Object.fromEntries(secs.map((s) => {
            let u = 0;
            for (let i = s.at; i < s.end; i += 1) u += mask[i];
            return [s.name, Math.round((u / Math.max(1, s.end - s.at)) * 1000) / 10];
          })),
          called: Object.fromEntries(secs.map((s) => [s.name, `${called(s)}/${total(s)}`]))
        };
      }
      result[spec.key] = files;
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  const pages = PT_PAGES.map((p) => p.key);
  const lines = [];
  for (const file of [...new Set(pages.flatMap((p) => Object.keys(result[p])))]) {
    lines.push(`### ${file}`);
    lines.push('');
    lines.push('Each cell: functions that ran / functions in the section · % of the section\'s bytes executed (comments and top-level data count as executed when the script loads).');
    lines.push('');
    lines.push('| Section | ' + pages.join(' | ') + ' |');
    lines.push('|---|' + pages.map(() => '---:').join('|') + '|');
    const names = [...new Set(pages.flatMap((p) => Object.keys((result[p][file] || {}).sections || {})))];
    for (const name of names) {
      lines.push(`| ${name} | ` + pages.map((p) => {
        const f = result[p][file];
        if (!f || f.sections[name] == null) return '—';
        return `${f.called[name]} fn · ${f.sections[name]}%`;
      }).join(' | ') + ' |');
    }
    lines.push('| **whole file** | ' + pages.map((p) => (result[p][file] ? `**${result[p][file].usedPct}%**` : '—')).join(' | ') + ' |');
    lines.push('');
  }
  const md = lines.join('\n');
  if (arg('--md')) fs.writeFileSync(arg('--md'), md + '\n');
  if (arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(result, null, 2) + '\n');
  console.log(md);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((err) => { console.error(err); process.exit(1); });
