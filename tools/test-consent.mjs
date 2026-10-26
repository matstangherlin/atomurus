import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function boot(seed) {
  const store = new Map(Object.entries(seed || {}));
  const events = [];
  const sandbox = {
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    },
    Date
  };
  sandbox.window = sandbox;
  sandbox.window.dispatchEvent = (event) => { events.push(event); };
  sandbox.window.addEventListener = () => {};
  vm.runInContext(readFileSync(new URL('../consent.js', import.meta.url), 'utf8'), vm.createContext(sandbox));
  return { api: sandbox.window.atomurusConsent, store, events };
}

const fresh = boot();
assert.equal(JSON.stringify(fresh.api.get()), JSON.stringify({ decided: false, analytics: false, ads: false, ts: 0 }));

const invalid = boot({ 'atomurus-cookie-consent-v2': '{"v":2,"analytics":"yes","ads":false}' });
assert.equal(invalid.api.get().decided, false);

const garbage = boot({ 'atomurus-cookie-consent-v2': 'not-json' });
assert.equal(garbage.api.get().decided, false);

const accepted = boot({ 'atomurus-cookie-consent': 'accepted' });
assert.equal(JSON.stringify(accepted.api.get()), JSON.stringify({ decided: true, analytics: true, ads: true, ts: 0 }));

const rejected = boot({ 'atomurus-cookie-consent': 'rejected' });
assert.equal(JSON.stringify(rejected.api.get()), JSON.stringify({ decided: true, analytics: false, ads: false, ts: 0 }));

const live = boot();
const seen = [];
live.api.onChange((detail) => seen.push(detail));
const saved = live.api.set({ analytics: true, ads: false });
assert.equal(saved.analytics, true);
assert.equal(saved.ads, false);
assert.equal(saved.decided, true);
assert.equal(seen.length, 1);
assert.equal(live.api.get().analytics, true);
assert.equal(live.api.get().ads, false);
assert.equal(live.store.get('atomurus-cookie-consent'), 'rejected');
const stored = JSON.parse(live.store.get('atomurus-cookie-consent-v2'));
assert.equal(stored.v, 2);
assert.equal(stored.analytics, true);
assert.equal(stored.ads, false);
assert.equal(live.events.some((event) => event.type === 'atomurus:consent'), true);

const both = boot();
both.api.set({ analytics: true, ads: true });
assert.equal(both.store.get('atomurus-cookie-consent'), 'accepted');

function htmlFiles(dir, out) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) htmlFiles(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const pages = htmlFiles(root, []);
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  assert.equal(
    /<link\b[^>]*preconnect[^>]*pagead2\.googlesyndication\.com/i.test(html),
    false,
    file
  );
}
const gate = readFileSync(new URL('../ads-gate.js', import.meta.url), 'utf8');
assert.match(gate, /choice\.ads !== true/);
assert.match(gate, /data-atomurus-ad-preconnect/);
assert.match(gate, /ensureAdPreconnect\(\)/);

console.log('test-consent: ok');
