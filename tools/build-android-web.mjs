#!/usr/bin/env node
// Android web bundle: dist/android-web — the Capacitor webDir.
//
// The APK ships the whole static site (periodic table, lab, isomerism,
// calculators, 3D viewers, articles) so it opens offline and matches the
// website page for page. What changes inside the app:
//
//   - tools/android/android-app.js is the first script of every page
//     (routing for Capacitor's local server, no accounts, no API calls,
//     no ads/analytics) and tools/android/android-app.css hides sign-in,
//     account, plans, upgrades, save-to-account and the cookie banner;
//   - AdSense / Adcash / Google Analytics tags are removed from the HTML
//     (AdSense is not allowed inside apps; there are no ads in the app);
//   - build tooling, docs, tests, Netlify functions and SEO-only files stay out.
//
// The website itself is untouched: this only writes into dist/android-web.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist/android-web');

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', '.claude', '.agents', '.codex', '.netlify', 'dist', 'android', 'release',
  'netlify', 'tools', 'scripts', 'supabase', 'propostas', 'docs', 'dev', 'e2e', 'fixtures', 'templates',
  'src', 'test-results', 'playwright-report', 'blob-report', 'hanzi-logic'
]);
const SKIP_IN_ASSETS = new Set(['concepts']);
const SKIP_FILES = new Set([
  'package.json', 'package-lock.json', 'netlify.toml', 'playwright.config.js', 'capacitor.config.json',
  'robots.txt', 'sitemap.xml', 'ads.txt', 'manifest.json', '_redirects', '_headers',
  'bump-version.js', 'bump-version.ps1', 'build-i18n.js', 'patch.js', 'sync-en-meta.js', 'migrate-element-seo.js',
  'enrich-element-schema.js', 'ensure-elements-en.js', 'add-content-script.js', 'add-share-script.js',
  'fix-adsense-head.js', 'fix-element-i18n.js', 'fix-mobile-scroll.js', 'lazy-ads.js', 'ads-gate.js', 'recaptcha.js'
]);
const SKIP_JS_REWRITE = new Set();
const SKIP_EXT = new Set(['.md', '.zip', '.log', '.ps1', '.bak', '.map', '.example']);

function skipFile(rel, name) {
  if (SKIP_FILES.has(name) && !rel.includes('/')) return true;
  if (name.startsWith('.')) return true;
  if (SKIP_EXT.has(path.extname(name).toLowerCase())) return true;
  if (/\.bak/i.test(name)) return true;
  if (/^assets\/og-[^/]+\.png$/.test(rel)) return true;
  return false;
}

function walk(dir, rel, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!rel && SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      if (rel === 'assets' && SKIP_IN_ASSETS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), childRel, out);
    } else if (entry.isFile() && !skipFile(childRel, entry.name)) {
      out.push(childRel);
    }
  }
  return out;
}

/* Ads and analytics tags, wherever a page carries them. */
const AD_PATTERNS = [
  /<script\b[^>]*\bsrc=["'][^"']*(googlesyndication|googletagmanager|google-analytics|acscdn|adtrafficquality|doubleclick)[^"']*["'][^>]*>\s*<\/script>\s*/gi,
  /<script\b[^>]*>\s*\(adsbygoogle\s*=\s*window\.adsbygoogle[\s\S]*?<\/script>\s*/gi,
  /<script\b[^>]*\bsrc=["'](?:[^"']*\/)?(ads-gate|lazy-ads|fix-adsense-head|recaptcha)\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
  /<ins\b[^>]*class=["'][^"']*adsbygoogle[^"']*["'][^>]*>\s*<\/ins>\s*/gi,
  /<meta\b[^>]*name=["']google-adsense-account["'][^>]*>\s*/gi,
  /<link\b[^>]*\brel=["'](preconnect|dns-prefetch)["'][^>]*(googlesyndication|googletagmanager|google-analytics|doubleclick|adtrafficquality)[^>]*>\s*/gi
];

function stripAds(html) {
  let out = html;
  for (const re of AD_PATTERNS) out = out.replace(re, '');
  return out;
}

/* Libraries the website loads from CDNs ship inside the APK instead, so the
   3D viewers, charts and PDF export work offline and the app makes no
   requests to third-party servers. Versions match the site's CDN URLs. */
const VENDOR = [
  { cdn: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', from: 'node_modules/three/build/three.min.js', to: 'vendor/three.min.js' },
  { cdn: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js', from: 'node_modules/chart.js/dist/chart.umd.js', to: 'vendor/chart.umd.js' },
  { cdn: 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/dist/chartjs-plugin-zoom.min.js', from: 'node_modules/chartjs-plugin-zoom/dist/chartjs-plugin-zoom.min.js', to: 'vendor/chartjs-plugin-zoom.min.js' },
  { cdn: 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js', from: 'node_modules/hammerjs/hammer.min.js', to: 'vendor/hammer.min.js' },
  { cdn: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', from: 'node_modules/html2canvas/dist/html2canvas.min.js', to: 'vendor/html2canvas.min.js' },
  { cdn: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', from: 'node_modules/jspdf/dist/jspdf.umd.min.js', to: 'vendor/jspdf.umd.min.js' }
];

function localiseVendors(text) {
  let out = text;
  for (const v of VENDOR) out = out.split(v.cdn).join('/' + v.to);
  return out;
}

export const REMOTE_CODE = /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|googlesyndication|googletagmanager|google-analytics|acscdn\.com|recaptcha\/api/;

function injectAppLayer(html, version) {
  const tag = `<script src="/assets/android/android-app.js?v=${version}"></script>` +
    `<link rel="stylesheet" href="/assets/android/android-app.css?v=${version}">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, (m) => `${m}\n${tag}`);
  return tag + html;
}

export function buildAndroidWeb({ quiet = false } = {}) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const files = walk(ROOT, '', []);
  const pages = {};
  const version = Date.now().toString(36);
  let bytes = 0;
  let stripped = 0;
  for (const rel of files) {
    const from = path.join(ROOT, rel);
    const to = path.join(OUT, rel);
    mkdirSync(path.dirname(to), { recursive: true });
    if (rel.endsWith('.html')) {
      pages['/' + rel] = 1;
      const src = readFileSync(from, 'utf8');
      const clean = localiseVendors(stripAds(src));
      if (clean !== src) stripped += 1;
      const html = injectAppLayer(clean, version);
      writeFileSync(to, html);
      bytes += Buffer.byteLength(html);
    } else if (rel.endsWith('.js') && !SKIP_JS_REWRITE.has(rel)) {
      const src = readFileSync(from, 'utf8');
      const js = localiseVendors(src);
      writeFileSync(to, js);
      bytes += Buffer.byteLength(js);
    } else {
      cpSync(from, to);
      bytes += statSync(from).size;
    }
  }
  for (const v of VENDOR) {
    const dest = path.join(OUT, v.to);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(path.join(ROOT, v.from), dest);
    bytes += statSync(dest).size;
  }
  mkdirSync(path.join(OUT, 'assets/android'), { recursive: true });
  const js = readFileSync(path.join(ROOT, 'tools/android/android-app.js'), 'utf8')
    .replace('/*__PAGES__*/{}', JSON.stringify(pages));
  writeFileSync(path.join(OUT, 'assets/android/android-app.js'), js);
  cpSync(path.join(ROOT, 'tools/android/android-app.css'), path.join(OUT, 'assets/android/android-app.css'));
  if (!existsSync(path.join(OUT, 'index.html'))) throw new Error('index.html missing from the Android bundle');
  const summary = { files: files.length + 2 + VENDOR.length, pages: Object.keys(pages).length, megabytes: +(bytes / 1048576).toFixed(1), adsStrippedFrom: stripped };
  writeFileSync(path.join(OUT, 'android-build.json'), JSON.stringify(summary, null, 2));
  if (!quiet) console.log(`android web bundle → dist/android-web (${summary.pages} pages, ${summary.files} files, ${summary.megabytes} MB, ads removed from ${stripped} pages)`);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildAndroidWeb();
