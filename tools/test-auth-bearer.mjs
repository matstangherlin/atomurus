// A1.0 — backend dual auth. Web (cookie) and native (Bearer) must reach the
// same requireUser() and the same Supabase user.id, with no parallel rules.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { readBearerCredential } from '../netlify/lib/auth-cookies.mjs';
import { authLogout, authSession } from '../netlify/lib/auth-provider.mjs';
import { requireUser } from '../netlify/lib/require-user.mjs';
import { requireFeature } from '../netlify/lib/require-feature.mjs';
import { resetRefreshFlights } from '../netlify/lib/supabase-auth.mjs';
import meHandler from '../netlify/functions/auth-me.mjs';
import logoutHandler from '../netlify/functions/auth-logout.mjs';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalInfo = console.info;
const originalWarn = console.warn;

const USER_ID = '11111111-2222-4333-8444-555555555555';
const SUPABASE_USER = {
  id: USER_ID,
  email: 'student@example.com',
  created_at: '2020-01-01T00:00:00Z',
  email_confirmed_at: '2020-01-01T00:00:00Z',
  user_metadata: { username: 'student' },
  app_metadata: {}
};
const VALID = {
  cookieAccess: 'cookie-access-token',
  bearer: 'eyJhbGciOiJIUzI1NiJ9.native-access.sig'
};

function jsonRes(status, body) {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => text,
    json: async () => body
  };
}

let calls = [];
function installFetch() {
  calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    const auth = options.headers?.Authorization || '';
    calls.push({ url: u, method: options.method || 'GET', auth });
    if (u.endsWith('/auth/v1/user')) {
      if (auth === `Bearer ${VALID.cookieAccess}` || auth === `Bearer ${VALID.bearer}`) {
        return jsonRes(200, SUPABASE_USER);
      }
      return jsonRes(401, { msg: 'invalid JWT' });
    }
    if (u.includes('/auth/v1/token?grant_type=refresh_token')) {
      return jsonRes(200, {
        access_token: VALID.cookieAccess,
        refresh_token: 'rotated-refresh',
        expires_in: 3600,
        user: SUPABASE_USER
      });
    }
    if (u.endsWith('/auth/v1/logout')) return jsonRes(204, {});
    throw new Error(`unexpected fetch ${u}`);
  };
}

function req(url, headers = {}, method = 'GET') {
  return new Request(url, { method, headers });
}

async function run() {
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    NETLIFY_DEV: 'true',
    SUPABASE_FETCH_RETRIES: '0'
  });
  console.info = () => {};
  console.warn = () => {};
  installFetch();

  // --- header parsing -----------------------------------------------------
  assert.deepEqual(readBearerCredential(req('https://atomurus.com/api/auth/me')), { present: false, token: null });
  assert.deepEqual(readBearerCredential(req('https://atomurus.com/x', { Authorization: `Bearer ${VALID.bearer}` })), { present: true, token: VALID.bearer });
  assert.deepEqual(readBearerCredential(req('https://atomurus.com/x', { Authorization: 'Basic abc' })), { present: true, token: null });
  assert.deepEqual(readBearerCredential(req('https://atomurus.com/x', { Authorization: 'Bearer a b' })), { present: true, token: null });
  assert.equal(readBearerCredential(req('https://atomurus.com/x', { Authorization: `Bearer ${'a'.repeat(5000)}` })).token, null);

  // --- web cookie path unchanged -------------------------------------------
  const web = await requireUser(req('https://atomurus.com/api/auth/me', { cookie: `atm_access=${VALID.cookieAccess}` }));
  assert.equal(web.response, null);
  assert.equal(web.user.id, USER_ID);
  assert.equal(web.session.authMode, 'cookie');

  // Web refresh-from-cookie still works (expired access, valid refresh).
  resetRefreshFlights();
  const refreshed = await authSession(req('https://atomurus.com/api/auth/me', { cookie: 'atm_access=dead; atm_refresh=live-refresh' }));
  assert.equal(refreshed.user.id, USER_ID);
  assert.ok(refreshed.cookieHeaders.some((c) => c.startsWith('atm_access=')), 'web refresh must rotate cookies');

  // --- native bearer path: same requireUser, same user id ------------------
  const native = await requireUser(req('https://atomurus.com/api/study/sets', { Authorization: `Bearer ${VALID.bearer}` }));
  assert.equal(native.response, null);
  assert.equal(native.user.id, web.user.id, 'web and android must resolve to the same Supabase user.id');
  assert.equal(native.session.authMode, 'bearer');
  assert.equal(native.session.accessToken, VALID.bearer, 'user-scoped DB client must receive the bearer token');
  assert.deepEqual(native.session.cookieHeaders, [], 'bearer requests never receive Set-Cookie');

  // requireFeature reuses the same path (no requireAndroidUser).
  const feature = await requireFeature(req('https://atomurus.com/api/study/sets', { Authorization: `Bearer ${VALID.bearer}` }), 'studySets');
  assert.equal(feature.response, null);
  assert.equal(feature.user.id, USER_ID);

  // Invalid bearer → 401 and NO fallback to cookies that happen to be present.
  calls = [];
  const invalid = await requireUser(req('https://atomurus.com/api/study/sets', {
    Authorization: 'Bearer forged-or-expired',
    cookie: `atm_access=${VALID.cookieAccess}; atm_refresh=live-refresh`
  }));
  assert.ok(invalid.response, 'invalid bearer must be rejected');
  assert.equal(invalid.response.status, 401);
  const body = await invalid.response.json();
  assert.equal(body.code, 'session_expired');
  assert.equal(invalid.response.headers.get('set-cookie'), null);
  assert.ok(!calls.some((c) => c.url.includes('grant_type=refresh_token')), 'bearer path must not refresh from the cookie jar');
  assert.ok(!calls.some((c) => c.auth === `Bearer ${VALID.cookieAccess}`), 'bearer path must not try the cookie token');

  // Malformed Authorization header is a rejected bearer, not "no auth → cookie".
  const malformed = await requireUser(req('https://atomurus.com/api/study/sets', {
    Authorization: 'Token abc',
    cookie: `atm_access=${VALID.cookieAccess}`
  }));
  assert.equal(malformed.response.status, 401);

  // /api/auth/me over bearer returns the public user.
  const meRes = await meHandler(req('https://atomurus.com/api/auth/me', { Authorization: `Bearer ${VALID.bearer}` }));
  assert.equal(meRes.status, 200);
  const me = await meRes.json();
  assert.equal(me.user.id, USER_ID);
  assert.equal(meRes.headers.get('set-cookie'), null);

  // --- logout ----------------------------------------------------------------
  calls = [];
  const nativeLogout = await authLogout(req('https://atomurus.com/api/auth/logout', { Authorization: `Bearer ${VALID.bearer}` }, 'POST'));
  assert.deepEqual(nativeLogout, [], 'native logout must not clear browser cookies');
  assert.ok(calls.some((c) => c.url.endsWith('/auth/v1/logout') && c.auth === `Bearer ${VALID.bearer}`), 'native logout revokes the bearer token');

  const webLogout = await logoutHandler(req('https://atomurus.com/api/auth/logout', {
    cookie: `atm_access=${VALID.cookieAccess}`,
    origin: 'https://atomurus.com'
  }, 'POST'));
  assert.equal(webLogout.status, 200);
  assert.ok(String(webLogout.headers.get('set-cookie') || '').includes('Max-Age=0'), 'web logout still clears cookies');

  // --- web security posture unchanged -----------------------------------------
  const cookieSrc = readFileSync(new URL('../netlify/lib/auth-cookies.mjs', import.meta.url), 'utf8');
  for (const flag of ["'HttpOnly'", "'SameSite=Lax'", "parts.push('Secure')"]) {
    assert.ok(cookieSrc.includes(flag), `cookie flag ${flag} must remain`);
  }
  // No parallel Android-only guard anywhere in Functions.
  const libs = readdirSync(new URL('../netlify/lib/', import.meta.url)).map((f) => readFileSync(new URL(`../netlify/lib/${f}`, import.meta.url), 'utf8'));
  const fns = readdirSync(new URL('../netlify/functions/', import.meta.url)).map((f) => readFileSync(new URL(`../netlify/functions/${f}`, import.meta.url), 'utf8'));
  for (const src of [...libs, ...fns]) {
    assert.ok(!/require(Android|Native|Mobile)User/.test(src), 'no requireAndroidUser-style parallel guard');
  }

  console.log('auth-bearer tests passed');
}

try {
  await run();
} finally {
  globalThis.fetch = originalFetch;
  console.info = originalInfo;
  console.warn = originalWarn;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
}
