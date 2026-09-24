// A1.0 — auth adapter matrix. Web keeps HttpOnly cookies and never touches a
// token; native keeps Supabase tokens in SecureStorage only, sends Bearer,
// rotates the refresh token and clears everything on logout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/core/api/api-client.js';
import { ApiError, ApiErrorKind } from '../src/core/api/api-errors.js';
import { assertAuthAdapter } from '../src/core/auth/auth-adapter.js';
import { AuthErrorCode, mapAuthError } from '../src/core/auth/auth-errors.js';
import { createNativeAuthAdapter, createAtomurusTokenTransport, EXPIRY_SKEW_MS } from '../src/core/auth/native-auth-adapter.js';
import { createWebAuthAdapter } from '../src/core/auth/web-auth-adapter.js';
import { resolveRuntimeConfig } from '../src/core/config/runtime-config.js';
import { memorySecureStorage, assertSecureBackend } from '../src/core/storage/secure-storage.js';
import { SECURE_KEYS } from '../src/core/storage/storage-policy.js';

const USER = { id: '11111111-2222-4333-8444-555555555555', email: 'a@b.c', isPro: false };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function fakeLocalStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
    _map: map
  };
}

/* ---------------------------------------------------------------- web ---- */

function webServer() {
  const calls = [];
  let signedIn = false;
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url === '/api/auth/login') { signedIn = true; return json(200, { ok: true, user: USER }); }
    if (url === '/api/auth/me') return signedIn ? json(200, { ok: true, user: USER }) : json(401, { ok: false, code: 'session_expired' });
    if (url === '/api/auth/refresh') return signedIn ? json(200, { ok: true, user: USER }) : json(401, { ok: false });
    if (url === '/api/auth/logout') { signedIn = false; return json(200, { ok: true }); }
    return json(404, { ok: false });
  };
  return { fetchImpl, calls };
}

test('web: login / refresh / logout over HttpOnly cookies; no tokens in JS or storage', async () => {
  const storage = fakeLocalStorage();
  globalThis.localStorage = storage;
  const server = webServer();
  const transport = createApiClient({ config: resolveRuntimeConfig({ platform: 'web' }), fetchImpl: server.fetchImpl });
  const auth = assertAuthAdapter(createWebAuthAdapter({ transport }));
  const changes = [];
  auth.onChange((s) => changes.push(s.signedIn));

  assert.deepEqual(await auth.getSession(), { signedIn: false, user: null });
  const login = await auth.login({ identifier: 'a@b.c', password: 'x' });
  assert.equal(login.user.id, USER.id);
  assert.equal(auth.isAuthenticated(), true);
  assert.equal(await auth.getAuthorization(), null, 'web never exposes a bearer token');
  assert.equal((await auth.refresh()).signedIn, true);
  await auth.logout();
  assert.equal(auth.isAuthenticated(), false);
  assert.deepEqual(changes, [false, true, false]);

  for (const call of server.calls) {
    assert.equal(call.init.credentials, 'include', 'cookies continue to carry the session');
    assert.equal(call.init.headers.Authorization, undefined);
  }
  assert.equal(storage.length, 0, 'web auth writes nothing to localStorage');
  assert.equal(await auth.refreshAfterUnauthorized(), false, 'server already refreshed from the cookie; 401 is final');
  delete globalThis.localStorage;
});

test('web adapter refuses bearer mode (web auth is not weakened for Android)', () => {
  const transport = createApiClient({ config: resolveRuntimeConfig({ platform: 'android' }) });
  assert.throws(() => createWebAuthAdapter({ transport }), /cookie auth mode/);
});

/* ------------------------------------------------------------- native ---- */

function nativeTransport({ clock }) {
  const state = { grants: 0, refreshes: 0, revoked: [], validRefresh: new Set(), fail: null };
  let n = 0;
  function issue() {
    n += 1;
    const refreshToken = `refresh-${n}`;
    state.validRefresh.add(refreshToken);
    return { accessToken: `access-${n}`, refreshToken, expiresIn: 3600, user: USER };
  }
  return {
    state,
    async passwordGrant({ identifier, password }) {
      if (password !== 'correct') throw new ApiError(ApiErrorKind.UNAUTHORIZED, { status: 401 });
      state.grants += 1;
      return issue();
    },
    async refreshGrant(token) {
      state.refreshes += 1;
      if (state.fail === 'offline') throw new ApiError(ApiErrorKind.NETWORK_ERROR);
      if (state.fail === '500') throw new ApiError(ApiErrorKind.SERVER_ERROR, { status: 500 });
      /* Supabase rotates: a refresh token works once. */
      if (!state.validRefresh.has(token)) throw new ApiError(ApiErrorKind.CLIENT_ERROR, { status: 400, code: 'invalid_grant' });
      state.validRefresh.delete(token);
      return issue();
    },
    async revoke(token) { state.revoked.push(token); },
    async me() { return USER; },
    clock
  };
}

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}

test('native: mock login stores the session in SecureStorage only and sends Bearer', async () => {
  const c = clock();
  const secure = memorySecureStorage();
  const storage = fakeLocalStorage();
  globalThis.localStorage = storage;
  const transport = nativeTransport({ clock: c });
  const auth = assertAuthAdapter(createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now }));

  await assert.rejects(auth.login({ identifier: 'a', password: 'wrong' }), (e) => mapAuthError(e, { phase: 'login' }) === AuthErrorCode.INVALID_CREDENTIALS);
  const s = await auth.login({ identifier: 'a', password: 'correct' });
  assert.equal(s.user.id, USER.id, 'same Supabase user id as the web');
  assert.equal(await auth.getAuthorization(), 'Bearer access-1');
  const stored = JSON.parse(await secure.get(SECURE_KEYS.session));
  assert.equal(stored.refreshToken, 'refresh-1');
  assert.equal(storage.length, 0, 'no token may reach localStorage');
  delete globalThis.localStorage;
});

test('native: refresh rotates the refresh token and is single-flight', async () => {
  const c = clock();
  const secure = memorySecureStorage();
  const transport = nativeTransport({ clock: c });
  const auth = createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now });
  await auth.login({ identifier: 'a', password: 'correct' });

  await Promise.all([auth.refresh(), auth.refresh(), auth.refresh()]);
  assert.equal(transport.state.refreshes, 1, 'concurrent refreshes share one grant');
  const stored = JSON.parse(await secure.get(SECURE_KEYS.session));
  assert.equal(stored.refreshToken, 'refresh-2', 'the rotated refresh token must be persisted');
  assert.equal(await auth.getAuthorization(), 'Bearer access-2');
  await auth.refresh();
  assert.equal(await auth.getAuthorization(), 'Bearer access-3', 'second refresh works because the token was renewed');
});

test('native: expired access token refreshes before the request leaves', async () => {
  const c = clock();
  const transport = nativeTransport({ clock: c });
  const auth = createNativeAuthAdapter({ transport, secureStorage: memorySecureStorage(), now: c.now });
  await auth.login({ identifier: 'a', password: 'correct' });
  c.advance(3600 * 1000 - EXPIRY_SKEW_MS + 1);
  assert.equal(await auth.getAuthorization(), 'Bearer access-2');
});

test('native: expired/revoked refresh token signs out and clears SecureStorage', async () => {
  const c = clock();
  const secure = memorySecureStorage();
  const transport = nativeTransport({ clock: c });
  const auth = createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now });
  await auth.login({ identifier: 'a', password: 'correct' });
  transport.state.validRefresh.clear();
  const result = await auth.refresh();
  assert.equal(result.signedIn, false);
  assert.equal(mapAuthError(result.error, { phase: 'refresh' }), AuthErrorCode.REFRESH_EXPIRED);
  assert.equal(auth.isAuthenticated(), false);
  assert.equal(secure.size(), 0);
});

test('native: offline or 5xx during refresh keeps the session (no surprise logout)', async () => {
  for (const mode of ['offline', '500']) {
    const c = clock();
    const secure = memorySecureStorage();
    const transport = nativeTransport({ clock: c });
    const auth = createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now });
    await auth.login({ identifier: 'a', password: 'correct' });
    transport.state.fail = mode;
    await assert.rejects(auth.refresh());
    assert.equal(auth.isAuthenticated(), true, `${mode}: session kept`);
    assert.equal(secure.size(), 1);
    assert.equal(await auth.refreshAfterUnauthorized(), false);
  }
});

test('native: logout clears storage even offline, then revokes best-effort', async () => {
  const c = clock();
  const secure = memorySecureStorage();
  const transport = nativeTransport({ clock: c });
  transport.revoke = async () => { throw new ApiError(ApiErrorKind.OFFLINE); };
  const auth = createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now });
  await auth.login({ identifier: 'a', password: 'correct' });
  await auth.logout();
  assert.equal(auth.isAuthenticated(), false);
  assert.equal(secure.size(), 0);
  assert.equal(await auth.getAuthorization(), null);
});

test('native: session survives an app restart (reload from SecureStorage)', async () => {
  const c = clock();
  const secure = memorySecureStorage();
  const transport = nativeTransport({ clock: c });
  const first = createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now });
  await first.login({ identifier: 'a', password: 'correct' });
  const second = createNativeAuthAdapter({ transport, secureStorage: secure, now: c.now });
  const s = await second.getSession();
  assert.equal(s.user.id, USER.id);
  assert.equal(await second.getAuthorization(), 'Bearer access-1');
});

test('native: invalid token end-to-end → one refresh, replay with the new token', async () => {
  const c = clock();
  const transport = nativeTransport({ clock: c });
  const auth = createNativeAuthAdapter({ transport, secureStorage: memorySecureStorage(), now: c.now });
  await auth.login({ identifier: 'a', password: 'correct' });
  const seen = [];
  const fetchImpl = async (_url, init) => {
    seen.push(init.headers.Authorization);
    return init.headers.Authorization === 'Bearer access-1' ? json(401, { ok: false, code: 'session_expired' }) : json(200, { ok: true });
  };
  const api = createApiClient({ config: resolveRuntimeConfig({ platform: 'android' }), fetchImpl, auth, sleep: async () => {} });
  assert.deepEqual(await api.get('/api/study/sets'), { ok: true });
  assert.deepEqual(seen, ['Bearer access-1', 'Bearer access-2']);
});

test('native adapter refuses window storage as its secure backend', () => {
  const transport = nativeTransport({ clock: clock() });
  assert.throws(() => createNativeAuthAdapter({ transport, secureStorage: fakeLocalStorage() }), /localStorage/);
  assert.throws(() => assertSecureBackend({ get() {}, set() {}, remove() {}, persistsToWebStorage: true }), /localStorage/);
});

test('HTTP token transport speaks the documented contract', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: init.body && JSON.parse(init.body), auth: init.headers.Authorization });
    if (url.endsWith('/api/auth/me')) return json(200, { ok: true, user: USER });
    return json(200, { ok: true, accessToken: 'a', refreshToken: 'r', expiresIn: 3600, user: USER });
  };
  const api = createApiClient({ config: resolveRuntimeConfig({ platform: 'android' }), fetchImpl });
  const t = createAtomurusTokenTransport(api);
  await t.passwordGrant({ identifier: 'a', password: 'p' });
  await t.refreshGrant('r0');
  await t.revoke('a0');
  assert.equal((await t.me('a1')).id, USER.id);
  assert.deepEqual(calls[0].body, { grant_type: 'password', identifier: 'a', password: 'p' });
  assert.deepEqual(calls[1].body, { grant_type: 'refresh_token', refresh_token: 'r0' });
  assert.equal(calls[2].auth, 'Bearer a0');
  assert.equal(calls[3].auth, 'Bearer a1');
  assert.ok(calls.every((call) => call.url.startsWith('https://atomurus.com/api/auth/')));
});

test('auth error mapping', () => {
  assert.equal(mapAuthError(new ApiError(ApiErrorKind.OFFLINE)), AuthErrorCode.OFFLINE);
  assert.equal(mapAuthError(new ApiError(ApiErrorKind.TIMEOUT)), AuthErrorCode.TIMEOUT);
  assert.equal(mapAuthError(new ApiError(ApiErrorKind.SERVER_ERROR, { status: 500 })), AuthErrorCode.SERVER_UNAVAILABLE);
  assert.equal(mapAuthError(new ApiError(ApiErrorKind.RATE_LIMITED, { status: 429 })), AuthErrorCode.RATE_LIMITED);
  assert.equal(mapAuthError(new ApiError(ApiErrorKind.UNAUTHORIZED, { status: 401, code: 'email_not_confirmed' }), { phase: 'login' }), AuthErrorCode.EMAIL_NOT_CONFIRMED);
  assert.equal(mapAuthError(new ApiError(ApiErrorKind.UNAUTHORIZED, { status: 401 })), AuthErrorCode.SESSION_EXPIRED);
});
