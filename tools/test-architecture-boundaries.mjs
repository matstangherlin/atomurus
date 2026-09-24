// A1.0 — architecture boundaries. Static gates that keep the shared core
// shared: no Capacitor in core, no direct fetch in features, one API origin,
// no tokens in web storage, no legacy CSS in new components, generated
// assets in sync with their sources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

const srcJs = walk(path.join(ROOT, 'src'), ['.js']);
const read = (p) => readFileSync(p, 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('src/core does not know Capacitor or Android', () => {
  for (const file of srcJs.filter((f) => rel(f).startsWith('src/core/'))) {
    const code = stripComments(read(file));
    assert.ok(!/capacitor/i.test(code), `${rel(file)} references Capacitor`);
    assert.ok(!/android/i.test(code) || rel(file) === 'src/core/config/runtime-config.js', `${rel(file)} references Android`);
    assert.ok(!/from\s+['"][^'"]*adapters\//.test(code), `${rel(file)} imports a platform adapter`);
  }
});

test('features and app code never import platform adapters directly', () => {
  for (const file of srcJs.filter((f) => /^src\/(features|app|ui)\//.test(rel(f)))) {
    /* Composition roots are the only modules that choose an adapter. */
    if (['src/app/bootstrap/services.js', 'src/app/bootstrap/app-main.js'].includes(rel(file))) continue;
    const code = stripComments(read(file));
    assert.ok(!/adapters\/capacitor/.test(code), `${rel(file)} imports the Capacitor adapter`);
    assert.ok(!/window\.Capacitor|globalThis\.Capacitor/.test(code), `${rel(file)} touches Capacitor globals`);
  }
});

test('no direct fetch outside the API layer (src + migrated clients)', () => {
  const allowed = new Set(['src/core/api/api-client.js', 'src/core/api/static-loader.js']);
  for (const file of srcJs) {
    if (allowed.has(rel(file))) continue;
    assert.ok(!/\bfetch\s*\(/.test(stripComments(read(file))), `${rel(file)} calls fetch directly — use the API client`);
  }
  for (const legacy of ['study-client.js', 'pro-lab-client.js']) {
    assert.ok(!/\bfetch\s*\(/.test(stripComments(read(path.join(ROOT, legacy)))), `${legacy} was migrated; it must not fetch directly`);
  }
});

test('one canonical production origin', () => {
  for (const file of srcJs) {
    if (rel(file) === 'src/core/config/runtime-config.js') continue;
    const code = stripComments(read(file));
    assert.ok(!/['"`]https:\/\/(www\.)?atomurus\.com/.test(code), `${rel(file)} hard-codes the production origin — import PRODUCTION_ORIGIN`);
  }
});

test('the API client keeps its timeout and bounded retries', () => {
  const client = read(path.join(ROOT, 'src/core/api/api-client.js'));
  assert.match(client, /new AbortController\(\)/);
  assert.match(client, /setTimeout\(/);
  assert.match(client, /ApiErrorKind\.TIMEOUT/);
  const policy = read(path.join(ROOT, 'src/core/api/retry-policy.js'));
  assert.match(policy, /HARD_MAX_RETRIES = [1-5];/);
});

test('no token or credential ever touches web storage from src/', () => {
  for (const file of srcJs) {
    const code = stripComments(read(file));
    const storageCalls = code.match(/(localStorage|sessionStorage)\.(setItem|getItem)\(([^)]*)\)/g) || [];
    for (const call of storageCalls) {
      assert.ok(!/token|refresh|session/i.test(call), `${rel(file)}: ${call}`);
    }
  }
  const native = read(path.join(ROOT, 'src/core/auth/native-auth-adapter.js'));
  assert.ok(!/localStorage|sessionStorage/.test(stripComments(native)), 'native auth adapter must use SecureStorage only');
});

test('bottom navigation has at most five destinations', async () => {
  const { PRIMARY_NAV, MAX_PRIMARY_DESTINATIONS } = await import('../src/core/routing/routes.js');
  assert.ok(PRIMARY_NAV.length <= MAX_PRIMARY_DESTINATIONS);
  assert.equal(MAX_PRIMARY_DESTINATIONS, 5);
});

test('new V2 components do not depend on legacy CSS and add no !important', () => {
  const css = walk(path.join(ROOT, 'src/ui'), ['.css']);
  const LEGACY = /--(lc|ws|ps)-|\.(lc|ws|ps)-[a-z]/;
  for (const file of css) {
    const name = rel(file);
    const text = read(file);
    if (name !== 'src/ui/components/compat.css') {
      assert.ok(!LEGACY.test(text.replace(/\/\*[\s\S]*?\*\//g, '')), `${name} depends on legacy lc/ws/ps CSS`);
    }
    const important = (text.replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g) || []).length;
    /* base.css keeps its pre-A1.0 [hidden] + reduced-motion guards (4). */
    const budget = name === 'src/ui/components/base.css' ? 4 : 0;
    assert.ok(important <= budget, `${name} has ${important} !important (budget ${budget})`);
  }
  const shell = read(path.join(ROOT, 'src/ui/layouts/app-shell.css'));
  assert.match(shell, /--app-safe-top/);
  assert.match(shell, /--app-safe-bottom/);
});

test('login in the app shell uses the shared primitives, not its own tokens', () => {
  const account = read(path.join(ROOT, 'src/features/account/index.js'));
  for (const cls of ['ui-input', 'ui-btn', 'ui-field', 'ui-label']) assert.ok(account.includes(cls), `login uses ${cls}`);
  assert.ok(!/style\s*:|--[a-z]+-[a-z]+\s*:/.test(account), 'login defines no local styles/tokens');
});

test('generated assets are in sync with src/', () => {
  for (const script of ['tools/build-core-bundle.mjs', 'tools/build-ui.mjs', 'tools/build-app-data.mjs']) {
    execFileSync(process.execPath, [path.join(ROOT, script), '--check'], { stdio: 'pipe' });
  }
});
