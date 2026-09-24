#!/usr/bin/env node
// A1.0 — performance baseline. Measures representative screens in headless
// Chromium (mobile 390×844) against a local static server of a checkout:
//
//   node tools/perf-baseline.mjs --root <checkout> --label before|after
//
// Records, per page (median of RUNS): transferred bytes by type, request
// count, DOM nodes, load/FCP, long tasks (>50ms), script/layout time, JS heap,
// and rendered FPS on viewer pages. Third-party hosts are blocked (ads,
// analytics); cdnjs Three.js is served from node_modules so viewers run.
// Numbers are lab numbers from this machine — compare before/after, do not
// read them as field data.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const ROOT = path.resolve(args.root || HERE);
const LABEL = args.label || 'after';
const PORT = Number(args.port || 4301);
const RUNS = Number(args.runs || 3);
const BASE = `http://127.0.0.1:${PORT}`;
const THREE_MIN = path.join(HERE, 'node_modules/three/build/three.min.js');

const PAGES = [
  { id: 'home', label: 'Home', url: '/' },
  { id: 'periodic', label: 'Periodic Table', url: '/periodic-table.html' },
  { id: 'app', label: 'App (/app)', url: '/app' },
  { id: 'study', label: 'Study', url: '/app?section=study' },
  { id: 'review', label: 'Review', url: '/app?section=review' },
  { id: 'prolab', label: 'Pro Lab', url: '/app?section=lab&panel=analysis' },
  { id: 'molecules', label: 'Molecules', url: '/viewer/molecules.html', viewer: '#viewer3d' },
  { id: 'atomic', label: 'Atomic Models', url: '/viewer/atomic-models.html', viewer: '#viewer3d' },
  { id: 'shell-home', label: 'AppShell · Home', url: '/dev/app-shell.html#/home', requires: 'dev/app-shell.html' },
  { id: 'shell-study', label: 'AppShell · Study', url: '/dev/app-shell.html#/study', requires: 'dev/app-shell.html' },
  { id: 'shell-periodic', label: 'AppShell · Periodic', url: '/dev/app-shell.html#/periodic-table', requires: 'dev/app-shell.html' },
  { id: 'shell-molecules', label: 'AppShell · Molecules', url: '/dev/app-shell.html#/molecules', requires: 'dev/app-shell.html', viewer: '.viewer-canvas' }
];

function median(values) {
  const v = values.filter((x) => typeof x === 'number').sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
}

async function measure(browser, page) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await context.route(/googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|adtrafficquality|acscdn|jsdelivr|fonts\.googleapis/, (r) => r.abort());
  await context.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: readFileSync(THREE_MIN) }));
  const tab = await context.newPage();
  await tab.addInitScript(() => {
    window.__lt = [];
    try {
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true });
    } catch (_e) { /* ignore */ }
  });
  const cdp = await context.newCDPSession(tab);
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  const types = new Map();
  const bytes = {};
  let requests = 0;
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
  cdp.on('Network.loadingFinished', (e) => {
    const t = (types.get(e.requestId) || 'Other').toLowerCase();
    bytes[t] = (bytes[t] || 0) + e.encodedDataLength;
    requests += 1;
  });
  await tab.goto(BASE + page.url, { waitUntil: 'load', timeout: 30000 });
  if (page.viewer) {
    await tab.locator(page.viewer).first().scrollIntoViewIfNeeded().catch(() => {});
  }
  await tab.waitForTimeout(2500);
  const data = await tab.evaluate(async (hasViewer) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    let fps = null;
    if (hasViewer) {
      fps = await new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        (function tick() { frames += 1; if (performance.now() - start < 2000) requestAnimationFrame(tick); else resolve(Math.round(frames / 2)); })();
      });
    }
    return {
      domNodes: document.getElementsByTagName('*').length,
      loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      fcpMs: fcp ? Math.round(fcp.startTime) : null,
      longTasks: window.__lt.length,
      longTaskMs: Math.round(window.__lt.reduce((s, d) => s + d, 0)),
      rafFps: fps,
      three: Boolean(window.THREE) || Array.from(document.scripts).some((s) => /three/.test(s.src)) || performance.getEntriesByType('resource').some((r) => /three(\.module|\.min)?\.js/.test(r.name))
    };
  }, Boolean(page.viewer));
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  await context.close();
  const total = Object.values(bytes).reduce((s, b) => s + b, 0);
  return {
    ...data,
    requests,
    transferKB: Math.round(total / 102.4) / 10,
    scriptKB: Math.round((bytes.script || 0) / 102.4) / 10,
    cssKB: Math.round((bytes.stylesheet || 0) / 102.4) / 10,
    imageKB: Math.round((bytes.image || 0) / 102.4) / 10,
    fontKB: Math.round((bytes.font || 0) / 102.4) / 10,
    scriptMs: Math.round((m.ScriptDuration || 0) * 1000),
    layoutMs: Math.round((m.LayoutDuration || 0) * 1000),
    heapMB: Math.round(((m.JSHeapUsedSize || 0) / 1048576) * 10) / 10
  };
}

async function main() {
  const server = spawn(process.execPath, [path.join(ROOT, 'tools/e2e-serve.mjs')], { cwd: ROOT, env: { ...process.env, E2E_PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch(process.env.PW_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PW_CHROMIUM_EXECUTABLE } : {});
  const out = { label: LABEL, root: path.relative(HERE, ROOT) || '.', viewport: '390x844@2x mobile', runs: RUNS, measuredAt: new Date().toISOString(), pages: {} };
  try {
    for (const page of PAGES) {
      if (page.requires && !existsSync(path.join(ROOT, page.requires))) continue;
      const runs = [];
      for (let i = 0; i < RUNS; i += 1) runs.push(await measure(browser, page));
      const keys = Object.keys(runs[0]);
      out.pages[page.id] = { label: page.label, url: page.url, ...Object.fromEntries(keys.map((k) => [k, typeof runs[0][k] === 'boolean' ? runs.some((r) => r[k]) : median(runs.map((r) => r[k]))])) };
      process.stderr.write(`${LABEL} ${page.id} done\n`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
  const dir = path.join(HERE, 'docs/reports');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `a1-0-perf-${LABEL}.json`), `${JSON.stringify(out, null, 2)}\n`);
  const cols = ['transferKB', 'scriptKB', 'cssKB', 'imageKB', 'requests', 'domNodes', 'fcpMs', 'loadMs', 'longTasks', 'longTaskMs', 'scriptMs', 'heapMB', 'rafFps', 'three'];
  console.log(`| page | ${cols.join(' | ')} |\n| --- | ${cols.map(() => '---:').join(' | ')} |`);
  for (const p of Object.values(out.pages)) console.log(`| ${p.label} | ${cols.map((c) => (p[c] == null ? '—' : p[c])).join(' | ')} |`);
}

main().catch((err) => { console.error(err); process.exit(1); });
