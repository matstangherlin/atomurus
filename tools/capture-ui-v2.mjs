#!/usr/bin/env node
/**
 * Recapture UI V2 viewport screenshots (Prompt 15).
 *
 * Usage: node tools/capture-ui-v2.mjs
 * Env:
 *   E2E_PORT   static server port (default 4176)
 *   UI_V2_OUT  output directory (default docs/ui-v2-after)
 *
 * Does not run in CI. Pixel diffs stay qualitative in docs/ui-v2-report.md.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT || 4176);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.resolve(ROOT, process.env.UI_V2_OUT || 'docs/ui-v2-after');

export const ROUTES = [
  { id: 'home', path: '/index.html' },
  { id: 'login', path: '/login.html' },
  { id: 'pricing', path: '/pricing.html' },
  { id: 'about', path: '/about.html' },
  { id: 'periodic-table', path: '/periodic-table.html' },
  { id: 'calculators', path: '/calculators.html' },
  { id: 'explore', path: '/explore.html' },
  { id: 'viewer', path: '/viewer/atomic-models.html' },
  { id: 'app', path: '/app' },
  { id: 'ui-gallery', path: '/dev/ui' }
];

export const COMBOS = [
  { id: 'desktop-light', width: 1280, height: 800, theme: 'light' },
  { id: 'desktop-dark', width: 1280, height: 800, theme: 'dark' },
  { id: 'mobile-light', width: 390, height: 844, theme: 'light' },
  { id: 'mobile-dark', width: 390, height: 844, theme: 'dark' }
];

function gitCommit() {
  try {
    return fs.readFileSync(path.join(ROOT, '.git/HEAD'), 'utf8').trim();
  } catch {
    return '';
  }
}

function waitForHttp(url, timeoutMs = 20_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error(`server not ready: ${url}`));
        else setTimeout(tick, 120);
      });
    };
    tick();
  });
}

function settle(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPaint(page, routeId) {
  await page.waitForFunction(() => {
    const html = document.documentElement;
    return !html.classList.contains('lc-loading')
      && !html.classList.contains('ps-boot')
      && !html.classList.contains('auth-checking');
  }, { timeout: 15_000 });

  if (routeId === 'app') {
    await page.locator('#ws-nav-main a').first().waitFor({ state: 'visible', timeout: 20_000 });
    await page.locator('#app-loading').waitFor({ state: 'hidden', timeout: 20_000 });
  } else if (routeId === 'ui-gallery') {
    await page.locator('.ui-display').first().waitFor({ state: 'visible', timeout: 15_000 });
  } else if (routeId === 'login') {
    await page.locator('#auth-email').waitFor({ state: 'visible', timeout: 15_000 });
  } else {
    await page.locator('.ps-shell').waitFor({ state: 'visible', timeout: 15_000 });
  }

  if (routeId === 'home') {
    await page.locator('#preview-grid .lc-preview-cell').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }
  if (routeId === 'periodic-table') {
    await page.locator('.el[data-z="1"]').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  }
  if (routeId === 'calculators') {
    await page.locator('.calc-menu-item[data-target="molar"]').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }
  if (routeId === 'explore') {
    await page.locator('.ex-title').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }
  if (routeId === 'viewer') {
    await page.locator('.ph-title, #viewer3d').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }
  if (routeId === 'pricing') {
    await page.locator('.price-card').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }

  await page.evaluate(() => document.fonts && document.fonts.ready);
  await settle(350);
}

async function capture() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const combo of COMBOS) fs.mkdirSync(path.join(OUT, combo.id), { recursive: true });

  const child = spawn(process.execPath, [path.join(ROOT, 'tools/e2e-serve.mjs')], {
    cwd: ROOT,
    env: { ...process.env, E2E_PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverErr = '';
  child.stderr.on('data', (chunk) => { serverErr += String(chunk); });
  child.on('exit', (code) => {
    if (code && code !== 0 && serverErr) process.stderr.write(serverErr);
  });

  const shots = [];
  const browser = await chromium.launch({ headless: true });
  try {
    await waitForHttp(`${BASE}/index.html`);

    for (const combo of COMBOS) {
      const context = await browser.newContext({
        viewport: { width: combo.width, height: combo.height },
        locale: 'en-US',
        timezoneId: 'UTC',
        colorScheme: combo.theme === 'dark' ? 'dark' : 'light',
        deviceScaleFactor: 1
      });
      await context.route('**/*', (route) => {
        const url = route.request().url();
        if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) {
          return route.continue();
        }
        return route.abort();
      });
      await context.addInitScript(({ theme }) => {
        try {
          localStorage.setItem('atomurus-cookie-consent', 'rejected');
          localStorage.setItem('atomurus-lang', 'en');
          localStorage.setItem('atomurus-theme', theme);
        } catch (_err) {}
      }, { theme: combo.theme });

      const page = await context.newPage();
      for (const route of ROUTES) {
        const started = Date.now();
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPaint(page, route.id);
        const file = path.join(OUT, combo.id, `${route.id}.png`);
        await page.screenshot({ path: file, fullPage: false });
        const bytes = fs.statSync(file).size;
        shots.push({
          combo: combo.id,
          route: route.id,
          path: route.path,
          ms: Date.now() - started,
          bytes,
          ok: bytes > 2000
        });
        console.log(`${combo.id}/${route.id}.png ${bytes} bytes`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    child.kill('SIGTERM');
  }

  let commit = '';
  try {
    const { execFileSync } = await import('node:child_process');
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    commit = gitCommit();
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    commit,
    method: 'viewport screenshot, Chromium, cookie consent rejected, third-party requests aborted',
    shots
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const failed = shots.filter((s) => !s.ok);
  if (failed.length) {
    console.error(`capture failed: ${failed.length} empty shots`);
    process.exit(1);
  }
  console.log(`captured ${shots.length} shots → ${path.relative(ROOT, OUT)}`);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  capture().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
