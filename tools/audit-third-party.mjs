#!/usr/bin/env node
/**
 * Record third-party hosts before any product change (and again after).
 * External requests are aborted. Only hostnames are stored — no ad or
 * analytics identifiers.
 *
 *   node tools/audit-third-party.mjs --label before
 *   node tools/audit-third-party.mjs --label after
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT || 4174);
const BASE = `http://127.0.0.1:${PORT}`;
const WAIT_MS = Number(process.env.AUDIT_WAIT_MS || 8000);
const CHROME = process.env.PW_CHROMIUM_EXECUTABLE
  || '/home/ubuntu/.cache/ms-playwright/chromium-1187/chrome-linux/chrome';

const AD_HOST = /pagead2|googlesyndication|googletagmanager|google-analytics|doubleclick|acscdn|adtrafficquality|googleadservices/i;

const PAGE_SPECS = [
  { url: '/', file: 'index.html', pt: 'index.pt.html' },
  { url: '/periodic-table.html', file: 'periodic-table.html', pt: 'periodic-table.pt.html' },
  { url: '/periodic-table/actinium.html', file: 'periodic-table/actinium.html', pt: 'periodic-table/actinium.pt.html' },
  { url: '/periodic-table/trends.html', file: 'periodic-table/trends.html', pt: 'periodic-table/trends.pt.html' },
  { url: '/calculators.html', file: 'calculators.html', pt: 'calculators.pt.html' },
  { url: '/explore.html', file: 'explore.html', pt: 'explore.pt.html' },
  { url: '/explore/what-is-an-atom.html', file: 'explore/what-is-an-atom.html', pt: 'explore/what-is-an-atom.pt.html' },
  { url: '/viewer/molecules.html', file: 'viewer/molecules.html', pt: 'viewer/molecules.pt.html', viewer: true },
  { url: '/viewer/atomic-models.html', file: 'viewer/atomic-models.html', pt: 'viewer/atomic-models.pt.html', viewer: true },
  { url: '/viewer/isomerism/constitutional/function.html', file: 'viewer/isomerism/constitutional/function.html', pt: 'viewer/isomerism/constitutional/function.pt.html', viewer: true },
  { url: '/pricing', file: 'pricing.html', pt: 'pricing.pt.html' },
  { url: '/login', file: 'login.html', pt: 'login.pt.html' },
  { url: '/contact.html', file: 'contact.html', pt: 'contact.pt.html' }
];

function argLabel() {
  const i = process.argv.indexOf('--label');
  const label = i >= 0 ? process.argv[i + 1] : 'before';
  if (label !== 'before' && label !== 'after') {
    console.error('Use --label before or --label after');
    process.exit(1);
  }
  return label;
}

function pages() {
  const filter = process.argv.includes('--pages')
    ? process.argv[process.argv.indexOf('--pages') + 1].split(',')
    : null;
  const list = [];
  function add(url, file, viewer) {
    if (filter && !filter.includes(url)) return;
    list.push({ url, file, viewer: !!viewer });
  }
  for (const spec of PAGE_SPECS) {
    add(spec.url, spec.file, spec.viewer);
    if (spec.pt && fs.existsSync(path.join(ROOT, spec.pt))) {
      add('/' + spec.pt.replace(/\\/g, '/'), spec.pt, spec.viewer);
    }
  }
  return list;
}

function hostOf(raw) {
  try { return new URL(raw).hostname; } catch { return ''; }
}

function classify(bag) {
  const hosts = bag.hosts || [];
  const ads = hosts.filter((host) => AD_HOST.test(host));
  const other = hosts.filter((host) => !AD_HOST.test(host));
  return {
    ads: [...new Set(ads)].sort(),
    other: [...new Set(other)].sort(),
    three: !!bag.three,
    hammer: !!bag.hammer,
    chart: !!bag.chart,
    recaptcha: !!bag.recaptcha
  };
}

function noteRequest(bag, raw) {
  const host = hostOf(raw);
  if (!host || host === '127.0.0.1' || host === 'localhost') return;
  bag.hosts.push(host);
  if (/three(?:\.min)?\.js/i.test(raw)) bag.three = true;
  if (/hammer(?:\.min)?\.js/i.test(raw)) bag.hammer = true;
  if (/chart(?:\.min)?\.js/i.test(raw)) bag.chart = true;
  if (/recaptcha/i.test(raw)) bag.recaptcha = true;
}

function snapshot(bag) {
  return {
    hosts: [...new Set(bag.hosts)].sort(),
    three: bag.three,
    hammer: bag.hammer,
    chart: bag.chart,
    recaptcha: bag.recaptcha
  };
}

function staticLinks(relFile) {
  const full = path.join(ROOT, relFile);
  if (!fs.existsSync(full)) return [];
  const html = fs.readFileSync(full, 'utf8');
  const found = [];
  const re = /<link\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const rel = (tag.match(/\brel=["']([^"']+)["']/i) || [])[1] || '';
    if (!/preconnect|dns-prefetch|preload/i.test(rel)) continue;
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1] || '';
    found.push({ rel, href: href.replace(/[?#].*$/, '') });
  }
  return found;
}

function syncExternalScripts() {
  const skip = new Set(['node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase', 'hanzi-logic', 'propostas', 'dev', 'docs', 'templates', 'src', 'dist']);
  const hits = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skip.has(entry.name)) continue;
        walk(full);
      } else if (entry.name.endsWith('.html')) {
        const html = fs.readFileSync(full, 'utf8');
        const re = /<script\b[^>]*>/gi;
        let match;
        while ((match = re.exec(html))) {
          const tag = match[0];
          const src = (tag.match(/\bsrc=["'](https?:\/\/[^"']+)["']/i) || [])[1];
          if (!src) continue;
          if (/\b(?:async|defer)\b/i.test(tag)) continue;
          if (/google\.com\/recaptcha\/api\.js/i.test(src)) continue;
          hits.push({
            file: path.relative(ROOT, full).replace(/\\/g, '/'),
            host: hostOf(src)
          });
        }
      }
    }
  }
  walk(ROOT);
  return hits;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function ensureServer() {
  if (await portOpen(PORT)) return null;
  const child = spawn(process.execPath, ['tools/e2e-serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, E2E_PORT: String(PORT) },
    stdio: 'ignore'
  });
  const started = Date.now();
  while (Date.now() - started < 15000) {
    if (await portOpen(PORT)) return child;
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error('e2e server did not start');
}

async function arm(page) {
  const bag = { hosts: [], three: false, hammer: false, recaptcha: false };
  await page.route('**/*', async (route) => {
    const raw = route.request().url();
    const host = hostOf(raw);
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      noteRequest(bag, raw);
      await route.abort();
      return;
    }
    const url = new URL(raw);
    if (url.pathname === '/api/ads-config') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, adsEnabled: true, signedIn: false, isPro: false, user: null, features: {} })
      });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false}' });
      return;
    }
    await route.continue();
  });
  return bag;
}

async function choose(page, phase) {
  if (phase === 'A') return 'none';
  const id = phase === 'B' ? '#aco-cc-reject' : '#aco-cc-accept';
  const button = page.locator(id);
  if (await button.count()) {
    await button.click({ timeout: 3000 }).catch(() => {});
    return 'click';
  }
  await page.evaluate((name) => {
    if (!window.atomurusConsent) return;
    if (name === 'B') window.atomurusConsent.set({ analytics: false, ads: false });
    else window.atomurusConsent.set({ analytics: true, ads: true });
  }, phase);
  return 'set';
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(240, window.innerHeight || 800);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, height);
  });
}

async function visit(browser, pageSpec, phase) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const bag = await arm(page);
  const result = {
    url: pageSpec.url,
    phase,
    status: 0,
    choice: 'none',
    beforeScroll: snapshot(bag),
    after: snapshot(bag),
    error: ''
  };
  try {
    const response = await page.goto(BASE + pageSpec.url, { waitUntil: 'load', timeout: 20000 });
    result.status = response ? response.status() : 0;
    await page.waitForTimeout(1200);
    result.beforeScroll = snapshot(bag);
    result.choice = await choose(page, phase);
    const started = Date.now();
    await scrollPage(page);
    const left = WAIT_MS - (Date.now() - started);
    if (left > 0) await page.waitForTimeout(left);
    result.after = snapshot(bag);
  } catch (error) {
    result.error = error.message || String(error);
    result.after = snapshot(bag);
  }
  await context.close();
  return result;
}

function renderMarkdown(label, rows, scripts) {
  const lines = [];
  lines.push(`# Terceiros — ${label === 'before' ? 'antes' : 'depois'}`);
  lines.push('');
  lines.push('Auditoria local. Cada fase espera 8 s e rola a página. Pedidos a hosts que não são `127.0.0.1` são abortados; o relatório guarda só o hostname. `/api/ads-config` responde `adsEnabled: true` nas três fases, para o consentimento ser o que segura anúncio e medição.');
  lines.push('');
  lines.push('Fase A: sem escolha. Fase B: Recusar. Fase C: Aceitar.');
  lines.push('');
  lines.push('| Página | Fase | Anúncio/medição | Outros hosts | Three antes da rolagem | Hammer | Chart.js | reCAPTCHA |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const row of rows) {
    const kind = classify(row.after || { hosts: [] });
    const before = classify(row.beforeScroll || { hosts: [] });
    const ads = kind.ads.length ? kind.ads.join(', ') : '—';
    const other = kind.other.length ? kind.other.join(', ') : '—';
    lines.push(`| \`${row.url}\` | ${row.phase} | ${ads} | ${other} | ${before.three ? 'sim' : 'não'} | ${kind.hammer ? 'sim' : 'não'} | ${kind.chart ? 'sim' : 'não'} | ${kind.recaptcha ? 'sim' : 'não'} |`);
  }
  lines.push('');
  lines.push('## Links estáticos (preconnect, dns-prefetch, preload)');
  lines.push('');
  const seen = new Set();
  for (const row of rows) {
    if (row.phase !== 'A' || seen.has(row.file)) continue;
    seen.add(row.file);
    const links = staticLinks(row.file);
    if (!links.length) continue;
    lines.push(`- \`${row.file}\``);
    for (const link of links) lines.push(`  - ${link.rel}: ${link.href}`);
  }
  if (!seen.size) lines.push('Nenhum.');
  lines.push('');
  lines.push('## `<script src="https://…">` síncrono em HTML publicado');
  lines.push('');
  lines.push('reCAPTCHA (`google.com/recaptcha/api.js`) fica de fora desta lista de propósito.');
  lines.push('');
  if (!scripts.length) lines.push('Nenhum.');
  else {
    for (const hit of scripts) lines.push(`- \`${hit.file}\` → ${hit.host}`);
  }
  lines.push('');
  const adPhases = rows.filter((row) => row.phase !== 'C' && classify(row.after || { hosts: [] }).ads.length);
  lines.push(`Fases A/B com host de anúncio ou medição: ${adPhases.length}.`);
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const label = argLabel();
  const server = await ensureServer();
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox']
  });
  const rows = [];
  try {
    for (const spec of pages()) {
      for (const phase of ['A', 'B', 'C']) {
        process.stderr.write(`${spec.url} ${phase}\n`);
        const row = await visit(browser, spec, phase);
        row.file = spec.file;
        rows.push(row);
      }
    }
  } finally {
    await browser.close();
    if (server) server.kill();
  }
  const scripts = syncExternalScripts();
  const outDir = path.join(ROOT, 'docs', 'perf');
  fs.mkdirSync(outDir, { recursive: true });
  const stem = label === 'before' ? 'terceiros-antes' : 'terceiros-depois';
  fs.writeFileSync(path.join(outDir, `${stem}.json`), JSON.stringify({ label, waitMs: WAIT_MS, rows, scripts }, null, 2));
  fs.writeFileSync(path.join(outDir, `${stem}.md`), renderMarkdown(label, rows, scripts));
  console.log(`wrote docs/perf/${stem}.md (${rows.length} rows)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
