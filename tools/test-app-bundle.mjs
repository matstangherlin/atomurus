// A1.0 — dist/app gates: a lean, local, app-only artifact.
// Run after tools/build-app-bundle.mjs (npm run test:app-bundle does both).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'dist/app');
const manifest = JSON.parse(readFileSync(path.join(APP, 'build-manifest.json'), 'utf8'));
const html = readFileSync(path.join(APP, 'index.html'), 'utf8');

/* Budgets (A1.0 baseline + headroom). Raising one is a reviewed decision. */
export const BUDGET = Object.freeze({ initialJsGzip: 30 * 1024, cssBytes: 48 * 1024, featureChunkBytes: 32 * 1024 });

test('app output is not the repository root', () => {
  const top = readdirSync(APP).sort();
  assert.deepEqual(top, ['app', 'assets', 'build-manifest.json', 'index.html', 'vendor']);
  for (const forbidden of ['netlify', 'tools', 'docs', 'supabase', 'node_modules', 'package.json', 'README.md', 'netlify.toml', 'sitemap.xml', 'robots.txt']) {
    assert.ok(!existsSync(path.join(APP, forbidden)), `${forbidden} must not ship in the app`);
  }
});

test('index.html carries no web-only SEO/social/ads/crawler baggage', () => {
  for (const pattern of [/og:/, /application\/ld\+json/, /rel="canonical"/, /twitter:/, /adsbygoogle|googlesyndication|googletagmanager/, /hreflang/, /cookie-consent/]) {
    assert.ok(!pattern.test(html), `index.html matches ${pattern}`);
  }
  assert.match(html, /viewport-fit=cover/, 'safe-area aware viewport');
  assert.match(html, /type="module"/);
  assert.ok(!/https?:\/\/(?!atomurus\.com)[a-z]/i.test(html.replace(/content-security-policy[^>]*>/i, '')), 'no third-party hosts in the shell');
});

test('Three.js is packaged locally and never part of the initial load', () => {
  assert.ok(existsSync(path.join(APP, 'vendor/three/three.module.js')), 'three vendored locally (no CDN in the app)');
  for (const file of manifest.initialJs.files) {
    const js = readFileSync(path.join(APP, file), 'utf8');
    assert.ok(!/WebGLRenderer|BufferGeometry|MeshStandardMaterial/.test(js), `${file} (initial) contains Three.js`);
  }
  const molecules = manifest.lazyChunks.find((c) => c.sources.includes('features/molecules/index.js'));
  assert.ok(molecules && !molecules.initial, 'molecule viewer is its own lazy chunk');
});

test('each feature is a lazy chunk; Study/Review are not in the bootstrap', () => {
  for (const feature of ['study', 'periodic-table', 'molecules', 'account', 'home', 'lab', 'explore']) {
    const chunk = manifest.lazyChunks.find((c) => c.sources.some((s) => s.startsWith(`features/${feature}/`)));
    assert.ok(chunk, `features/${feature} has a lazy chunk`);
    assert.ok(chunk.bytes <= BUDGET.featureChunkBytes, `features/${feature} chunk ${chunk.bytes} B over budget`);
  }
  const initialSources = manifest.initialJs.files.join(' ');
  assert.ok(!/study-|periodic-table-|molecules-/.test(initialSources));
});

test('performance budget: initial JS and CSS', () => {
  assert.ok(manifest.initialJs.gzip <= BUDGET.initialJsGzip, `initial JS ${manifest.initialJs.gzip} B gz > ${BUDGET.initialJsGzip}`);
  assert.ok(manifest.css.bytes <= BUDGET.cssBytes, `CSS ${manifest.css.bytes} B > ${BUDGET.cssBytes}`);
});

test('only the three app typefaces ship', () => {
  const fonts = readdirSync(path.join(APP, 'assets/fonts'));
  assert.ok(fonts.every((f) => f === 'fonts.css' || /^(instrument-serif|inter-tight|jetbrains-mono)/.test(f)), fonts.join(', '));
});

test('no remote-webview shortcut in the Capacitor preparation', () => {
  const doc = readFileSync(path.join(ROOT, 'docs/architecture/capacitor-preparation.md'), 'utf8');
  const example = JSON.parse((doc.match(/```json\n([\s\S]*?)\n```/) || [])[1]);
  assert.equal(example.webDir, 'dist/app');
  assert.ok(!example.server || !example.server.url, 'production must not point server.url at the website');
  assert.equal(example.appId, 'com.atomurus.app');
});
