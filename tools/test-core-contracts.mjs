// A1.0 — storage classes, cache, sync conflict policy, routes and deep links,
// entitlement, perf instruments, services composition (web vs native).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_REGISTRY, StorageClass, classify, looksLikeCredentialKey } from '../src/core/storage/storage-policy.js';
import { createPreferencesStorage, memoryBackend } from '../src/core/storage/preferences-storage.js';
import { createCacheStorage } from '../src/core/storage/cache-storage.js';
import { ConflictPolicy, DOMAIN_POLICY, optimisticMutation, policyFor, resolveConflict } from '../src/core/sync/sync-contract.js';
import { MAX_PRIMARY_DESTINATIONS, PRIMARY_NAV, ROUTES, SECONDARY_NAV, getRoute, primaryDestinations, primaryFor, resolveDeepLink, webUrlFor } from '../src/core/routing/routes.js';
import { createEntitlement, PaymentSource } from '../src/core/entitlement/entitlement.js';
import { createPerf, LONG_TASK_MS } from '../src/core/perf/perf.js';
import { ApiError, ApiErrorKind } from '../src/core/api/api-errors.js';
import { createNativeServices } from '../src/app/bootstrap/services.js';
import { createCapacitorAdapter } from '../src/adapters/capacitor/capacitor-adapter.js';
import { createCapacitorSecureStorage } from '../src/adapters/capacitor/secure-storage-adapter.js';
import { FEATURE_REGISTRY } from '../src/app/router/feature-registry.js';
import { parseHash, hashFor } from '../src/app/router/router.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'propostas', 'hanzi-logic', 'test-results', 'playwright-report'].includes(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|html)$/.test(name)) out.push(full);
  }
  return out;
}

test('every web-storage key in the product is registered and classified', () => {
  const unknown = new Set();
  const KEY_RE = /(?:local|session)Storage\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g;
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file);
    if (rel.startsWith('tools') || rel.startsWith('e2e') || rel.startsWith('scripts')) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(KEY_RE)) {
      if (!classify(m[1])) unknown.add(`${m[1]} (${rel})`);
      assert.ok(!looksLikeCredentialKey(m[1]), `credential-like key in web storage: ${m[1]} (${rel})`);
    }
  }
  assert.deepEqual(Array.from(unknown), [], 'register new keys in src/core/storage/storage-policy.js');
  assert.ok(Object.values(STORAGE_REGISTRY).every((e) => e.cls !== StorageClass.SECURE), 'no SECURE key lives in web storage');
});

test('preferences refuse credential and unregistered keys', async () => {
  const prefs = createPreferencesStorage(memoryBackend());
  await prefs.set('atomurus-theme', 'dark');
  assert.equal(await prefs.get('atomurus-theme'), 'dark');
  await assert.rejects(prefs.set('atomurus-access-token', 'x'), /credential/);
  await assert.rejects(prefs.set('random-key', 'x'), /not a registered preference/);
});

test('cache: fresh, stale-while-revalidate, offline fallback, version bump', async () => {
  let t = 0;
  const backend = memoryBackend();
  const cache = createCacheStorage({ backend, version: 'v1', now: () => t });
  let calls = 0;
  const fetcher = async () => { calls += 1; return { n: calls }; };
  assert.deepEqual(await cache.getOrFetch('els', fetcher, { ttlMs: 100 }), { value: { n: 1 }, source: 'network', stale: false });
  assert.deepEqual(await cache.getOrFetch('els', fetcher, { ttlMs: 100 }), { value: { n: 1 }, source: 'cache', stale: false });
  t = 500;
  const stale = await cache.getOrFetch('els', async () => { throw new ApiError(ApiErrorKind.OFFLINE); }, { ttlMs: 100 });
  assert.deepEqual(stale, { value: { n: 1 }, source: 'cache', stale: true }, 'offline still opens cached content');
  const bumped = createCacheStorage({ backend, version: 'v2', now: () => t });
  assert.equal(await bumped.get('els'), null, 'a new data version ignores old entries');
  await assert.rejects(bumped.getOrFetch('els', async () => { throw new ApiError(ApiErrorKind.OFFLINE); }), (e) => e.kind === 'OFFLINE');
  assert.ok(Array.from(backend._map.keys()).every((k) => k.startsWith('atomurus-cache:')));
});

test('sync: every domain has an explicit conflict rule; cloud wins for critical data', async () => {
  assert.equal(policyFor('study.reviews'), ConflictPolicy.CLOUD_WINS);
  assert.equal(policyFor('account.entitlement'), ConflictPolicy.CLOUD_WINS);
  assert.equal(policyFor('preferences.theme'), ConflictPolicy.LOCAL_WINS);
  assert.throws(() => policyFor('study.mystery'), /No conflict policy/);
  assert.deepEqual(resolveConflict('study.progress', { local: 1, server: 2 }), { value: 2, conflict: false });
  assert.deepEqual(resolveConflict('study.sets', { local: { t: 'a' }, server: { updatedAt: 'v2' }, baseVersion: 'v1' }), { value: { updatedAt: 'v2' }, conflict: true, reason: 'stale_base_version' });
  assert.ok(Object.values(DOMAIN_POLICY).every((p) => Object.values(ConflictPolicy).includes(p)));

  const state = { title: 'old' };
  await assert.rejects(optimisticMutation({
    domain: 'study.sets',
    apply: () => { const prev = state.title; state.title = 'new'; return () => { state.title = prev; }; },
    send: async () => { throw new ApiError(ApiErrorKind.OFFLINE); }
  }));
  assert.equal(state.title, 'old', 'failed optimistic write rolls back');
  await optimisticMutation({
    domain: 'study.sets',
    apply: () => { state.title = 'mine'; return () => {}; },
    send: async () => ({ set: { title: 'server' } }),
    reconcile: (server) => { state.title = server.set.title; }
  });
  assert.equal(state.title, 'server', 'server answer reconciles');
});

test('routes: ≤5 primary destinations, secondary nav, web URLs, deep links', () => {
  assert.ok(PRIMARY_NAV.length <= MAX_PRIMARY_DESTINATIONS);
  assert.deepEqual(primaryDestinations().map((r) => r.id), ['home', 'explore', 'lab', 'study', 'account']);
  assert.ok(SECONDARY_NAV.study.includes('study/review'));
  assert.equal(primaryFor('study/review'), 'study');
  assert.equal(primaryFor('molecules'), 'explore');
  assert.equal(webUrlFor('study/review'), '/app?section=review');
  assert.equal(webUrlFor('study/sets', { set: 'abc' }), '/app?section=sets&set=abc');

  assert.deepEqual(resolveDeepLink('atomurus://study/review'), { id: 'study/review', params: {} });
  assert.deepEqual(resolveDeepLink('https://atomurus.com/study/review'), { id: 'study/review', params: {} });
  assert.deepEqual(resolveDeepLink('https://www.atomurus.com/app?section=review&start=1'), { id: 'study/review', params: { start: '1' } });
  assert.deepEqual(resolveDeepLink('https://atomurus.com/periodic-table/aurum'), { id: 'periodic-table', params: { element: 'aurum' } });
  assert.equal(resolveDeepLink('https://evil.example/study/review'), null);
  assert.equal(resolveDeepLink('javascript:alert(1)'), null);
  for (const route of ROUTES) {
    if (route.feature) assert.ok(FEATURE_REGISTRY[route.feature], `route ${route.id} → feature ${route.feature} is registered`);
    assert.equal(parseHash(hashFor(route.id)).id, route.id);
  }
  assert.equal(getRoute('nope'), null);
});

test('entitlement: ask for features, not for Stripe', () => {
  const guest = createEntitlement(null);
  assert.equal(guest.isPro(), false);
  assert.equal(guest.paymentSource, PaymentSource.NONE);
  const stripePro = createEntitlement({ id: 'u', isPro: true, plan: 'paid', planSource: 'paid', hasStripeCustomer: true, features: { smartReview: true } });
  assert.equal(stripePro.hasFeature('smartReview'), true);
  assert.equal(stripePro.hasFeature('nonexistent'), false);
  assert.equal(stripePro.manageChannel(), 'stripe-portal');
  const playPro = createEntitlement({ id: 'u', isPro: true, plan: 'paid', billingProvider: 'google_play', features: {} }, { platform: 'android' });
  assert.equal(playPro.paymentSource, PaymentSource.GOOGLE_PLAY);
  assert.equal(playPro.manageChannel(), 'google-play');
  assert.equal(playPro.upgradeChannel(), 'google-play', 'the app never routes digital purchases to web checkout');
  assert.equal(createEntitlement({ id: 'u', isPro: true, planSource: 'trial' }).paymentSource, PaymentSource.TRIAL);
});

test('perf instruments are inert unless enabled', () => {
  const marks = [];
  const off = createPerf({ enabled: false, performanceImpl: { mark: (n) => marks.push(n) } });
  off.mark('x');
  assert.equal(marks.length, 0);
  const on = createPerf({ enabled: true, performanceImpl: { mark: (n) => marks.push(n), measure: () => ({ duration: 5 }) } });
  on.mark('bootstrap:start');
  assert.equal(on.measure('bootstrap'), 5);
  assert.deepEqual(marks, ['atomurus:bootstrap:start']);
  assert.equal(LONG_TASK_MS, 50);
});

test('native services: absolute API base, bearer auth over secure storage, same shape as web', async () => {
  const secureMap = new Map();
  const plugin = {
    get: async ({ key }) => ({ value: secureMap.get(key) ?? null }),
    set: async ({ key, value }) => { secureMap.set(key, value); },
    remove: async ({ key }) => { secureMap.delete(key); }
  };
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, auth: init.headers.Authorization, credentials: init.credentials });
    if (url.endsWith('/api/auth/token')) {
      return new Response(JSON.stringify({ ok: true, accessToken: 'A1', refreshToken: 'R1', expiresIn: 3600, user: { id: 'same-supabase-id' } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true, sets: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const services = createNativeServices({
    platformAdapter: createCapacitorAdapter({ Capacitor: { getPlatform: () => 'android' } }, { navigator: { onLine: true } }),
    secureStorage: createCapacitorSecureStorage(plugin),
    fetchImpl,
    win: undefined
  });
  assert.equal(services.config.apiBase, 'https://atomurus.com');
  assert.equal(services.config.authMode, 'bearer');
  assert.equal(services.webHref('/pricing'), 'https://atomurus.com/pricing');
  const s = await services.auth.login({ identifier: 'a', password: 'b' });
  assert.equal(s.user.id, 'same-supabase-id');
  await services.api.get('/api/study/sets');
  const last = calls[calls.length - 1];
  assert.equal(last.url, 'https://atomurus.com/api/study/sets');
  assert.equal(last.auth, 'Bearer A1');
  assert.equal(last.credentials, 'omit');
  assert.ok(secureMap.has('atomurus.auth.session'));
  for (const key of ['config', 'platform', 'lifecycle', 'network', 'api', 'auth', 'perf', 'webHref', 'cache']) assert.ok(key in services);
});
