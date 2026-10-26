// Measure horizontal overflow and cramped headers before/after the mobile fix.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT || 4174);
const BASE = `http://127.0.0.1:${PORT}`;
const label = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : 'before';

const PAGES = [
  '/',
  '/index.pt.html',
  '/periodic-table.html',
  '/periodic-table.pt.html',
  '/periodic-table/heatmap.html',
  '/periodic-table/trends.html',
  '/calculators.html',
  '/calculators.pt.html',
  '/explore.html',
  '/explore.pt.html',
  '/explore/what-is-an-atom.html',
  '/explore/what-is-an-atom.pt.html',
  '/explore/what-is-chemical-bonding.html',
  '/explore/what-is-chemical-bonding.pt.html',
  '/explore/what-is-the-periodic-table.html',
  '/explore/what-is-the-periodic-table.pt.html',
  '/explore/what-are-isotopes.html',
  '/explore/bhopal-disaster.html',
  '/explore/chernobyl-disaster.pt.html',
  '/viewer/molecules.html',
  '/viewer/atomic-models.html',
  '/viewer/isomerism/constitutional/function.html',
  '/login',
  '/pricing',
  '/pricing.pt.html',
  '/contact.html',
  '/periodic-table/actinium.html',
  '/periodic-table/actinium.en.html',
  '/periodic-table/lithium.html',
  '/periodic-table/lithium.en.html',
  '/periodic-table/helium.html',
  '/periodic-table/helium.en.html',
  '/periodic-table/lanthanum.html',
  '/periodic-table/lanthanum.en.html',
  '/periodic-table/rutherfordium.html',
  '/periodic-table/rutherfordium.en.html'
];

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 }
];

function probe(port) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/login', timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function ensureServer() {
  if (await probe(PORT)) return null;
  const child = spawn(process.execPath, ['tools/e2e-serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, E2E_PORT: String(PORT) },
    stdio: 'ignore'
  });
  for (let i = 0; i < 40; i += 1) {
    if (await probe(PORT)) return child;
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error('e2e server did not start');
}

async function mock(context) {
  await context.route((url) => url.pathname.startsWith('/api/'), (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname === '/api/ads-config'
      ? { ok: true, signedIn: false, adsEnabled: false, isPro: false, user: null, features: {} }
      : { ok: false, code: 'not_found' };
    const status = url.pathname === '/api/ads-config' ? 200 : (url.pathname === '/api/auth/me' ? 401 : 404);
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await context.route(/googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|jsdelivr|cdnjs|recaptcha/, (route) => route.abort());
}

function measure() {
  const view = Math.round((window.visualViewport && window.visualViewport.width) || document.documentElement.clientWidth);
  const ih = innerHeight;
  function describe(el) {
    const cls = typeof el.className === 'string' ? el.className.trim().slice(0, 80) : '';
    return (el.tagName || '').toLowerCase() + (cls ? '.' + cls.split(/\s+/).slice(0, 3).join('.') : '');
  }
  const offenders = [];
  const nodes = document.querySelectorAll('body *');
  for (const el of nodes) {
    const style = getComputedStyle(el);
    if (style.position === 'fixed' || style.display === 'none' || style.visibility === 'hidden') continue;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;
    if (box.right <= view + 1) continue;
    let pan = false;
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      const pane = getComputedStyle(node);
      if ((pane.overflowX === 'auto' || pane.overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 1) {
        const host = node.getBoundingClientRect();
        if (host.right <= view + 1 && host.left >= -1) pan = true;
      }
    }
    if (pan) continue;
    const parent = el.parentElement;
    if (parent) {
      const parentBox = parent.getBoundingClientRect();
      if (parentBox.right > view + 1) continue;
    }
    offenders.push({
      tag: describe(el),
      width: Math.round(box.width),
      right: Math.round(box.right),
      ancestor: parent ? describe(parent) : ''
    });
    if (offenders.length >= 12) break;
  }
  function bar(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const kids = [...el.children].map((kid) => {
      const b = kid.getBoundingClientRect();
      const s = getComputedStyle(kid);
      return {
        tag: describe(kid),
        right: Math.round(b.right),
        top: Math.round(b.top),
        width: Math.round(b.width),
        hidden: s.display === 'none'
      };
    }).filter((kid) => !kid.hidden && kid.width > 0);
    const tops = [...new Set(kids.map((kid) => kid.top))];
    const needed = kids.reduce((sum, kid) => sum + kid.width, 0);
    return {
      width: Math.round(box.width),
      right: Math.round(box.right),
      needed,
      lines: tops.length,
      clipped: kids.filter((kid) => kid.right > view + 1).map((kid) => kid.tag)
    };
  }
  const banner = document.querySelector('#aco-cookie-banner');
  const bannerBox = banner ? banner.getBoundingClientRect() : null;
  const menu = document.querySelector('.lc-mobile-hamb, #ws-menu-btn, .mobile-menu-btn');
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: view,
    layoutWidth: innerWidth,
    innerHeight: ih,
    overflow: document.documentElement.scrollWidth > view + 1,
    menu: !!(menu && getComputedStyle(menu).display !== 'none'),
    offenders,
    topnav: bar('.lc-topnav'),
    topbar: bar('.ps-shell > .topbar'),
    bannerRatio: bannerBox && bannerBox.height > 0 ? Math.round((bannerBox.height / ih) * 100) : null
  };
}

function md(rows) {
  const lines = [
    `# Overflow ${label}`,
    '',
    `Medido em 360×740 e 390×844. Terceiros bloqueados. \`/api/*\` mockado.`,
    '',
    '| Página | Viewport | scrollWidth | innerWidth | Estoura | Causas | Topo |',
    '|---|---|---:|---:|---|---|---|'
  ];
  let overflows = 0;
  for (const row of rows) {
    if (row.error) {
      lines.push(`| \`${row.page}\` | ${row.viewport} | — | — | erro | ${row.error} | — |`);
      continue;
    }
    if (row.overflow) overflows += 1;
    const causes = row.offenders.length
      ? row.offenders.map((item) => `${item.tag} (${item.width}px)`).join('<br>')
      : (row.overflow ? 'scrollWidth sem nó raiz' : '—');
    const bars = [row.topnav, row.topbar].filter(Boolean).map((bar) => {
      const name = bar === row.topnav ? 'topnav' : 'topbar';
      return `${name} ${bar.lines} linha(s), preciso ${bar.needed}px / ${bar.width}px${bar.clipped.length ? ', corta ' + bar.clipped.join(', ') : ''}`;
    }).join('<br>') || '—';
    const banner = row.bannerRatio == null ? '' : `; banner ${row.bannerRatio}%`;
    const menu = row.page.includes('/periodic-table/') && !row.page.endsWith('heatmap.html') && !row.page.endsWith('trends.html')
      ? (row.menu ? '; menu sim' : '; menu não')
      : '';
    lines.push(`| \`${row.page}\` | ${row.viewport} | ${row.scrollWidth} | ${row.innerWidth} | ${row.overflow ? 'sim' : 'não'} | ${causes} | ${bars}${banner}${menu} |`);
  }
  lines.push('', `Páginas×viewport com overflow: **${overflows}** de ${rows.length}.`);
  return lines.join('\n') + '\n';
}

const server = await ensureServer();
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE || '/home/ubuntu/.cache/ms-playwright/chromium-1187/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const rows = [];
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await mock(context);
    const page = await context.newPage();
    for (const urlPath of PAGES) {
      try {
        const response = await page.goto(BASE + urlPath, { waitUntil: 'load', timeout: 20000 });
        await page.waitForTimeout(200);
        const data = await page.evaluate(measure);
        rows.push({
          page: urlPath,
          viewport: `${vp.width}×${vp.height}`,
          status: response ? response.status() : 0,
          ...data
        });
      } catch (error) {
        rows.push({ page: urlPath, viewport: `${vp.width}×${vp.height}`, error: String(error.message || error).slice(0, 180) });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  if (server) server.kill();
}

mkdirSync(path.join(ROOT, 'docs/mobile'), { recursive: true });
const out = path.join(ROOT, 'docs/mobile', `overflow-${label}.md`);
writeFileSync(out, md(rows));
const bad = rows.filter((row) => row.overflow || row.error).length;
console.log(`wrote ${out} (${rows.length} rows, ${bad} with overflow or error)`);
