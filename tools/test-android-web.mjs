// Android app (Capacitor): config, bundle and the in-app layer.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildAndroidWeb, REMOTE_CODE } from './build-android-web.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist/android-web');

// 1. Config: bundled assets, no remote WebView, one package id everywhere.
const cap = JSON.parse(readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
assert.equal(cap.webDir, 'dist/android-web');
assert.ok(!cap.server || !cap.server.url, 'the app ships its pages; it must not point server.url at the website');
assert.equal(cap.android.webContentsDebuggingEnabled, false);
const gradle = readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
assert.match(gradle, new RegExp(`applicationId "${cap.appId.replace(/\./g, '\\.')}"`), 'build.gradle applicationId matches capacitor.config.json');
assert.match(gradle, /signingConfig signingConfigs\.release/);
const gitignore = readFileSync(path.join(ROOT, 'android/.gitignore'), 'utf8');
for (const rule of ['*.jks', 'keystore.properties', 'keystore/']) assert.ok(gitignore.includes(rule), `android/.gitignore keeps ${rule} out of git`);
const netlifyIgnore = readFileSync(path.join(ROOT, '.netlifyignore'), 'utf8');
assert.match(netlifyIgnore, /^android\/$/m, 'the native project is never published with the site');

// 2. Bundle: every page carries the app layer first, no ads anywhere.
const summary = await buildAndroidWeb({ quiet: true });
assert.ok(summary.pages > 300, `expected the whole site, got ${summary.pages} pages`);
function html(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) html(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const pages = html(OUT);
for (const file of pages) {
  const src = readFileSync(file, 'utf8');
  const rel = path.relative(OUT, file);
  const head = src.slice(src.search(/<head[^>]*>/i));
  assert.match(head.slice(0, 400), /android-app\.js/, `${rel}: app layer is the first thing in <head>`);
  assert.doesNotMatch(src, /googlesyndication|googletagmanager|acscdn\.com/, `${rel}: no ad or analytics tags in the app`);
}
// Nothing is downloaded from third parties: CDN libraries ship in /vendor.
function files(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) { if (path.relative(OUT, p) !== 'vendor') files(p, ext, out); }
    else if (ext.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}
for (const file of files(OUT, ['.html', '.js'])) {
  assert.doesNotMatch(readFileSync(file, 'utf8'), REMOTE_CODE, `${path.relative(OUT, file)}: loads code from a third-party server`);
}
for (const lib of ['three.min.js', 'chart.umd.js', 'chartjs-plugin-zoom.min.js', 'hammer.min.js', 'html2canvas.min.js', 'jspdf.umd.min.js']) {
  assert.ok(statSync(path.join(OUT, 'vendor', lib)).size > 1000, `vendor/${lib} ships in the APK`);
}
for (const gone of ['ads-gate.js', 'recaptcha.js', 'lazy-ads.js']) {
  assert.throws(() => statSync(path.join(OUT, gone)), `${gone} must not ship in the APK`);
}
// Every local script and stylesheet a page loads is in the bundle.
const missing = new Set();
for (const file of pages) {
  const src = readFileSync(file, 'utf8');
  const refs = [...src.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi), ...src.matchAll(/<link\b[^>]*rel=["'](?:stylesheet|manifest)["'][^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:)?\/\//i.test(ref) || ref.startsWith('data:')) continue;
    // Resolve like the WebView does (extra ../ stop at the root).
    const pathname = decodeURIComponent(new URL(ref, 'https://localhost/' + path.relative(OUT, file).split(path.sep).join('/')).pathname);
    const abs = path.join(OUT, pathname);
    try { statSync(abs); } catch (_e) { missing.add(`${path.relative(OUT, file)} → ${ref}`); }
  }
}
assert.equal(missing.size, 0, `pages load files that are not in the APK:\n${[...missing].slice(0, 10).join('\n')}`);
for (const forbidden of ['netlify', 'tools', 'docs', 'e2e', 'node_modules', 'supabase', 'android', 'package.json', 'netlify.toml', 'README.md']) {
  assert.throws(() => statSync(path.join(OUT, forbidden)), `${forbidden} must not ship in the APK`);
}
const layer = readFileSync(path.join(OUT, 'assets/android/android-app.js'), 'utf8');
assert.doesNotMatch(layer, /\/\*__PAGES__\*\/\{\}/, 'page list filled in by the build');

// 3. Routing and the "no accounts" API answer, in a fake WebView.
function boot(pathname, search = '') {
  const replaced = [];
  const classes = new Set();
  const store = new Map();
  const sandbox = {
    document: {
      documentElement: { classList: { add: (...c) => c.forEach((x) => classes.add(x)) }, setAttribute() {} },
      addEventListener() {}
    },
    location: { pathname, search, hash: '', href: `https://localhost${pathname}${search}`, origin: 'https://localhost', replace: (u) => replaced.push(u), assign() {} },
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    navigator: {},
    fetch: async () => new Response('{"real":true}'),
    URL, Response, JSON, Promise, Date, Object, String,
    addEventListener() {}
  };
  sandbox.window = sandbox;
  vm.runInNewContext(layer, sandbox);
  return { replaced, classes, store, fetch: sandbox.window.fetch };
}
assert.deepEqual(boot('/app', '?section=lab').replaced, ['/app.html?section=lab']);
assert.deepEqual(boot('/periodic-table/ferrum').replaced, ['/periodic-table/ferrum.html']);
assert.deepEqual(boot('/login', '?next=%2Fapp').replaced, ['/'], 'sign-in sends you home');
assert.deepEqual(boot('/signup').replaced, ['/']);
assert.deepEqual(boot('/pricing').replaced, ['/'], 'no plans or prices in the app');
assert.deepEqual(boot('/account.html').replaced, ['/']);
assert.deepEqual(boot('/no-such-page').replaced, ['/']);
assert.deepEqual(boot('/').replaced, []);
assert.deepEqual(boot('/privacy.html', '?lang=en').replaced, ['/app-privacy.html?lang=en'], 'the in-app privacy link opens the app policy');
assert.deepEqual(boot('/privacy.pt.html', '?lang=pt-BR').replaced, ['/app-privacy.pt.html?lang=pt-BR']);
assert.deepEqual(boot('/app-privacy', '?lang=pt-BR').replaced, ['/app-privacy.pt.html?lang=pt-BR']);
assert.deepEqual(boot('/app-privacy.pt.html', '?lang=pt-BR').replaced, []);
assert.deepEqual(boot('/terms.html', '?lang=pt-BR').replaced, ['/app-terms.pt.html?lang=pt-BR'], 'the in-app terms link opens the app terms');
assert.deepEqual(boot('/terms', '?lang=en').replaced, ['/app-terms.html?lang=en']);
assert.deepEqual(boot('/calculators.html').replaced, []);
const app = boot('/');
assert.ok(app.classes.has('is-native-app') && app.classes.has('is-android-app'));
assert.equal(JSON.parse(app.store.get('atomurus-cookie-consent-v2')).ads, false, 'no ads, no banner');
const me = await app.fetch('/api/auth/me');
assert.equal(me.status, 401, 'the API answers "signed out" without a network call');
assert.deepEqual(await (await app.fetch('/assets/app/elements.json')).json(), { real: true }, 'other requests are untouched');
const mols = JSON.parse(readFileSync(path.join(OUT, 'assets/android/molecules.json'), 'utf8'));
assert.ok(Object.keys(mols).length >= 40 && Array.isArray(mols.water.atoms), 'molecule coordinates ship in the APK');

// 4. The CSS hides every account, plan and save-to-account entry.
const css = readFileSync(path.join(OUT, 'assets/android/android-app.css'), 'utf8');
for (const sel of ['#cform', '.rm-signin', 'a[href^="/login"]', 'a[href^="/signup"]', 'a[href^="/pricing"]', '[data-atomurus-account]', '#aco-cookie-banner', '#atomurus-study-save', '.rm-home-plans']) {
  assert.ok(css.includes(`html.is-native-app:not(#_a):not(#_b) ${sel}`), `android-app.css hides ${sel}`);
}

console.log(`android app tests passed (${summary.pages} pages, ${summary.megabytes} MB)`);
