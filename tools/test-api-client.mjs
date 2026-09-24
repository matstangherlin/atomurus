// A1.0 — canonical API client: success, every error class, timeout, offline,
// abort, malformed body, bounded retries, no automatic write replay, and the
// web/native base URL split.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/core/api/api-client.js';
import { ApiErrorKind } from '../src/core/api/api-errors.js';
import { HARD_MAX_RETRIES } from '../src/core/api/retry-policy.js';
import { resolveRuntimeConfig, apiUrl, PRODUCTION_ORIGIN } from '../src/core/config/runtime-config.js';

const web = resolveRuntimeConfig({ platform: 'web', overrides: { timeouts: { read: 60, write: 60 }, retry: { baseDelayMs: 1, maxDelayMs: 5 } } });
const native = resolveRuntimeConfig({ platform: 'android', overrides: { timeouts: { read: 60, write: 60 }, retry: { baseDelayMs: 1, maxDelayMs: 5 } } });

function json(status, body, headers = {}) {
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

function scripted(responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const next = responses.length > 1 ? responses.shift() : responses[0];
    if (typeof next === 'function') return next(url, init);
    if (next instanceof Error) throw next;
    return next.clone ? next.clone() : next;
  };
  return { fetchImpl, calls };
}

function hang(_url, init) {
  return new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      reject(err);
    });
  });
}

const noSleep = async () => {};

async function rejects(promise, kind, extra = {}) {
  try {
    await promise;
  } catch (err) {
    assert.equal(err.kind, kind, `expected ${kind}, got ${err.kind}: ${err.message}`);
    for (const [key, value] of Object.entries(extra)) assert.equal(err[key], value, `err.${key}`);
    return err;
  }
  assert.fail(`expected rejection with ${kind}`);
}

test('1. GET success returns parsed JSON and sends cookies on web', async () => {
  const { fetchImpl, calls } = scripted([json(200, { ok: true, sets: [1] })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  const data = await api.get('/api/study/sets', { query: { limit: 5, empty: '' } });
  assert.deepEqual(data, { ok: true, sets: [1] });
  assert.equal(calls[0].url, '/api/study/sets?limit=5');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers.Authorization, undefined, 'web never sends Authorization');
});

test('2. POST success serialises the body once', async () => {
  const { fetchImpl, calls } = scripted([json(201, { ok: true, set: { id: 'x' } })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  const data = await api.post('/api/study/sets', { title: 'Acids' });
  assert.equal(data.set.id, 'x');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, JSON.stringify({ title: 'Acids' }));
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
});

test('3. 401 → UNAUTHORIZED (not a generic error) and notifies the auth adapter', async () => {
  let notified = 0;
  const { fetchImpl } = scripted([json(401, { ok: false, code: 'session_expired', error: 'Session expired' })]);
  const events = [];
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep, auth: { onUnauthorized: () => { notified += 1; } }, onEvent: (e) => events.push(e.type) });
  const err = await rejects(api.get('/api/auth/me'), ApiErrorKind.UNAUTHORIZED, { status: 401, code: 'session_expired' });
  assert.equal(err.isAuthError, true);
  assert.equal(notified, 1);
  assert.ok(events.includes('unauthorized'));
});

test('4. 403 feature_locked → FORBIDDEN with upgrade info', async () => {
  const { fetchImpl } = scripted([json(403, { ok: false, code: 'feature_locked', feature: 'smartReview', upgradeUrl: '/pricing' })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  const err = await rejects(api.get('/api/study/review/queue'), ApiErrorKind.FORBIDDEN, { code: 'feature_locked', feature: 'smartReview' });
  assert.equal(err.upgradeUrl, '/pricing');
});

test('5. 404 → NOT_FOUND, never retried', async () => {
  const { fetchImpl, calls } = scripted([json(404, { ok: false, code: 'not_found' })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  await rejects(api.get('/api/study/set', { query: { id: 'x' } }), ApiErrorKind.NOT_FOUND);
  assert.equal(calls.length, 1);
});

test('6. 429 → RATE_LIMITED; short Retry-After is honoured on GET, long one is surfaced', async () => {
  const { fetchImpl, calls } = scripted([json(429, { ok: false, code: 'rate_limited' }, { 'retry-after': '0' }), json(200, { ok: true })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  assert.deepEqual(await api.get('/api/x'), { ok: true });
  assert.equal(calls.length, 2);

  const long = scripted([json(429, { ok: false, code: 'rate_limited' }, { 'retry-after': '120' })]);
  const api2 = createApiClient({ config: web, fetchImpl: long.fetchImpl, sleep: noSleep });
  const err = await rejects(api2.get('/api/x'), ApiErrorKind.RATE_LIMITED);
  assert.equal(err.retryAfterMs, 120000);
  assert.equal(long.calls.length, 1);
});

test('7. 500 → SERVER_ERROR; GET retries a bounded number of times', async () => {
  const { fetchImpl, calls } = scripted([json(500, { ok: false, error: 'boom' })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  await rejects(api.get('/api/study/overview'), ApiErrorKind.SERVER_ERROR, { status: 500 });
  assert.equal(calls.length, 1 + web.retry.maxRetries);
});

test('8. timeout → TIMEOUT: no request waits forever', async () => {
  const { fetchImpl } = scripted([hang]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  const started = Date.now();
  await rejects(api.post('/api/study/review', { cardId: 'c', rating: 'good' }), ApiErrorKind.TIMEOUT, { code: 'timeout' });
  assert.ok(Date.now() - started < 2000);
});

test('9. offline → OFFLINE immediately, fetch never called', async () => {
  const { fetchImpl, calls } = scripted([json(200, { ok: true })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep, platform: { isOnline: () => false } });
  await rejects(api.get('/api/study/sets'), ApiErrorKind.OFFLINE, { code: 'network', status: 0 });
  assert.equal(calls.length, 0);
});

test('10. caller abort → ABORTED (AbortError name), not retried', async () => {
  const { fetchImpl, calls } = scripted([hang]);
  const api = createApiClient({ config: resolveRuntimeConfig({ platform: 'web' }), fetchImpl, sleep: noSleep });
  const controller = new AbortController();
  const p = api.get('/api/study/items', { signal: controller.signal });
  setTimeout(() => controller.abort(), 5);
  const err = await rejects(p, ApiErrorKind.ABORTED);
  assert.equal(err.name, 'AbortError');
  assert.equal(calls.length, 1);
});

test('11. malformed 200 body → MALFORMED_RESPONSE', async () => {
  const { fetchImpl } = scripted([new Response('<html>oops</html>', { status: 200, headers: { 'content-type': 'text/html' } })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  await rejects(api.get('/api/study/sets'), ApiErrorKind.MALFORMED_RESPONSE);

  const broken = scripted([new Response('{"ok":tru', { status: 200, headers: { 'content-type': 'application/json' } })]);
  const api2 = createApiClient({ config: web, fetchImpl: broken.fetchImpl, sleep: noSleep });
  await rejects(api2.get('/api/study/sets'), ApiErrorKind.MALFORMED_RESPONSE);
});

test('network failure → NETWORK_ERROR with legacy code "network"', async () => {
  const { fetchImpl } = scripted([new TypeError('Failed to fetch')]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep, retry: 0 });
  await rejects(api.get('/api/x', { retry: false }), ApiErrorKind.NETWORK_ERROR, { code: 'network', status: 0 });
});

test('{ ok:false } with 200 is still an error (Functions contract)', async () => {
  const { fetchImpl } = scripted([json(200, { ok: false, code: 'invalid_request', error: 'bad' })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  await rejects(api.post('/api/study/item', {}), ApiErrorKind.CLIENT_ERROR, { code: 'invalid_request' });
});

test('writes are NEVER replayed automatically (checkout, sets, review, pro-lab, account)', async () => {
  for (const [method, path] of [['POST', '/api/billing/checkout'], ['POST', '/api/study/sets'], ['POST', '/api/study/review'], ['POST', '/api/pro-lab/sessions'], ['PUT', '/api/study/set'], ['DELETE', '/api/study/set']]) {
    const { fetchImpl, calls } = scripted([new TypeError('Failed to fetch')]);
    const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
    await rejects(api.request(method, path, { body: {}, retry: 3 }), ApiErrorKind.NETWORK_ERROR);
    assert.equal(calls.length, 1, `${method} ${path} must not be replayed`);
  }
  const { fetchImpl, calls } = scripted([json(503, { ok: false })]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  await rejects(api.post('/api/study/review', {}), ApiErrorKind.SERVER_ERROR);
  assert.equal(calls.length, 1);
});

test('an idempotency key allows at most one replay of a write, and is sent', async () => {
  const { fetchImpl, calls } = scripted([new TypeError('Failed to fetch')]);
  const api = createApiClient({ config: web, fetchImpl, sleep: noSleep });
  await rejects(api.post('/api/study/sets', {}, { idempotencyKey: 'k-1', retry: 4 }), ApiErrorKind.NETWORK_ERROR);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.headers['Idempotency-Key'], 'k-1');
});

test('retries are hard-capped whatever the config says (no infinite retry)', async () => {
  const cfg = resolveRuntimeConfig({ platform: 'web', overrides: { retry: { maxRetries: 1e9, baseDelayMs: 1, maxDelayMs: 2 }, timeouts: { read: 50 } } });
  const { fetchImpl, calls } = scripted([new TypeError('Failed to fetch')]);
  const api = createApiClient({ config: cfg, fetchImpl, sleep: noSleep });
  await rejects(api.get('/api/x'), ApiErrorKind.NETWORK_ERROR);
  assert.equal(calls.length, 1 + HARD_MAX_RETRIES);
  /* Absolute ceiling, not relative to the constant: a GET is tried at most 5 times. */
  assert.ok(HARD_MAX_RETRIES <= 4, `HARD_MAX_RETRIES=${HARD_MAX_RETRIES}`);
  assert.ok(calls.length <= 5, `${calls.length} attempts`);
});

test('native: absolute production base, Bearer header, cookies omitted', async () => {
  const { fetchImpl, calls } = scripted([json(200, { ok: true })]);
  const api = createApiClient({ config: native, fetchImpl, sleep: noSleep, auth: { getAuthorization: async () => 'Bearer abc' } });
  await api.get('/api/study/sets');
  assert.equal(calls[0].url, `${PRODUCTION_ORIGIN}/api/study/sets`);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer abc');
  assert.equal(calls[0].init.credentials, 'omit');
});

test('native: a 401 refreshes once and replays once, then gives up', async () => {
  let refreshes = 0;
  let token = 'old';
  const { fetchImpl, calls } = scripted([
    (_u, init) => (init.headers.Authorization === 'Bearer new' ? json(200, { ok: true, fresh: true }) : json(401, { ok: false, code: 'session_expired' }))
  ]);
  const auth = {
    getAuthorization: async () => `Bearer ${token}`,
    refreshAfterUnauthorized: async () => { refreshes += 1; token = 'new'; return true; }
  };
  const api = createApiClient({ config: native, fetchImpl, sleep: noSleep, auth });
  assert.deepEqual(await api.post('/api/study/review', { rating: 'good' }), { ok: true, fresh: true });
  assert.equal(refreshes, 1);
  assert.equal(calls.length, 2);

  const dead = scripted([json(401, { ok: false })]);
  let tries = 0;
  const api2 = createApiClient({ config: native, fetchImpl: dead.fetchImpl, sleep: noSleep, auth: { getAuthorization: async () => 'Bearer x', refreshAfterUnauthorized: async () => { tries += 1; return true; } } });
  await rejects(api2.get('/api/x'), ApiErrorKind.UNAUTHORIZED);
  assert.equal(tries, 1, 'refresh at most once per request');
  assert.equal(dead.calls.length, 2);
});

test('native config refuses relative or localhost API bases', () => {
  assert.throws(() => resolveRuntimeConfig({ platform: 'android', overrides: { apiBase: '' } }), /absolute apiBase/);
  assert.throws(() => resolveRuntimeConfig({ platform: 'android', overrides: { apiBase: 'https://localhost' } }), /localhost/);
  assert.throws(() => resolveRuntimeConfig({ platform: 'android', overrides: { apiBase: 'http://atomurus.com' } }), /https/);
  assert.equal(resolveRuntimeConfig({ platform: 'web' }).apiBase, '');
  assert.equal(apiUrl(web, '/api/a'), '/api/a');
  assert.throws(() => apiUrl(web, 'https://evil.example/api'), /relative/);
});
