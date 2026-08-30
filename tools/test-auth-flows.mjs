import assert from 'node:assert/strict';
import { authConfirm, authLogin, authLogout, authRecover, authRefresh, authReset, authSession, authSignup } from '../netlify/lib/auth-provider.mjs';
import { isProtectedPath, safeNextPath } from '../netlify/lib/auth-redirect.mjs';
import { loginIdentifierLimiter, refreshIpLimiter, resetAuthRateLimiters } from '../netlify/lib/auth-rate-limit.mjs';
import { usernameFromEmail, usernameCandidates, validUsername } from '../netlify/lib/netlify-identity-utils.mjs';
import { resetRefreshFlights } from '../netlify/lib/supabase-auth.mjs';
import loginHandler from '../netlify/functions/auth-login.mjs';
import meHandler from '../netlify/functions/auth-me.mjs';
import logoutHandler from '../netlify/functions/auth-logout.mjs';
import refreshHandler from '../netlify/functions/auth-refresh.mjs';
import recoverHandler from '../netlify/functions/auth-recover.mjs';
import signupHandler from '../netlify/functions/auth-signup.mjs';
import confirmHandler from '../netlify/functions/auth-confirm.mjs';
import resetHandler from '../netlify/functions/auth-reset.mjs';
import dashboardHandler from '../netlify/functions/private-dashboard.mjs';
import adsConfigHandler from '../netlify/functions/ads-config.mjs';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalLog = {
  info: console.info,
  warn: console.warn,
  error: console.error
};

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function silenceLogs() {
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

function restoreLogs() {
  console.info = originalLog.info;
  console.warn = originalLog.warn;
  console.error = originalLog.error;
}

function jsonRes(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body)
  };
}

function demoUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'alice@atomurus.com',
    created_at: '2026-01-01T00:00:00Z',
    email_confirmed_at: '2026-01-02T00:00:00Z',
    last_sign_in_at: '2026-08-01T00:00:00Z',
    app_metadata: {},
    user_metadata: { username: 'alice', full_name: 'Alice Atom' },
    role: 'authenticated',
    ...overrides
  };
}

function sessionBody(user = demoUser()) {
  return {
    access_token: 'access-live',
    refresh_token: 'refresh-live',
    expires_in: 3600,
    user
  };
}

function cookieRequest(url, { method = 'GET', cookies = '', body, headers = {} } = {}) {
  const init = {
    method,
    headers: {
      origin: 'https://atomurus.com',
      accept: 'application/json',
      cookie: cookies,
      ...headers
    }
  };
  if (body != null) {
    init.headers['content-type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return new Request(url, init);
}

function sessionRequest(extra = {}) {
  return {
    headers: {
      get(name) {
        const key = String(name).toLowerCase();
        if (key === 'cookie') return extra.cookie || 'atm_access=access-live; atm_refresh=refresh-live';
        if (key === 'origin') return 'https://atomurus.com';
        return extra[key] || null;
      }
    }
  };
}

async function readJson(res) {
  return JSON.parse(await res.text());
}

function cookieHeadersOf(resOrList) {
  if (Array.isArray(resOrList)) return resOrList;
  return resOrList.headers.getSetCookie();
}

function clearsSessionCookies(resOrList) {
  return cookieHeadersOf(resOrList).some((header) => header.includes('Max-Age=0'));
}

function installSupabaseMock(handlers) {
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const method = String(options.method || 'GET').toUpperCase();
    for (const handler of handlers) {
      if (handler.match(href, method, options)) {
        return handler.respond(href, method, options);
      }
    }
    throw new Error(`Unexpected fetch ${method} ${href}`);
  };
}

async function withAuthEnv(fn) {
  restoreEnv();
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    NETLIFY_DEV: 'true',
    AUTH_SITE_URL: 'https://atomurus.com'
  });
  silenceLogs();
  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
    restoreLogs();
    restoreEnv();
  }
}

await withAuthEnv(async () => {
  // 1. login correto
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async (_url, _method, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.email, 'alice@atomurus.com');
      assert.equal(body.password, 'Correct#Pass');
      return jsonRes(200, sessionBody());
    }
  }]);
  const loggedIn = await authLogin('alice@atomurus.com', 'Correct#Pass');
  assert.equal(loggedIn.user.email, 'alice@atomurus.com');
  assert.ok(loggedIn.cookieHeaders.some((header) => header.startsWith('atm_access=')));
  assert.ok(loggedIn.cookieHeaders.some((header) => header.startsWith('atm_refresh=')));

  const loginRes = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    body: { identifier: 'alice@atomurus.com', password: 'Correct#Pass' }
  }));
  const loginJson = await readJson(loginRes);
  assert.equal(loginRes.status, 200);
  assert.equal(loginJson.ok, true);
  assert.equal(loginJson.user.email, 'alice@atomurus.com');
  assert.ok(loginRes.headers.getSetCookie().length >= 2);
});

await withAuthEnv(async () => {
  // 2. senha incorreta + usuário inexistente (mesma resposta segura)
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async () => jsonRes(400, { error: 'invalid_grant', msg: 'Invalid login credentials' })
  }]);
  const wrong = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    body: { identifier: 'missing@atomurus.com', password: 'Wrong#Pass' }
  }));
  const wrongJson = await readJson(wrong);
  assert.equal(wrong.status, 401);
  assert.equal(wrongJson.error, 'Invalid email or password');
  assert.equal(wrongJson.code, undefined);
});

await withAuthEnv(async () => {
  // 3 + 4. reload / persistência via access token; reopen via refresh
  installSupabaseMock([{
    match: (url, method) => method === 'GET' && url.endsWith('/user'),
    respond: async (_url, _method, options) => {
      const authz = options.headers.Authorization;
      if (authz === 'Bearer access-live') return jsonRes(200, demoUser());
      return jsonRes(401, { message: 'expired' });
    }
  }]);
  const restored = await authSession(sessionRequest());
  assert.equal(restored.user.email, 'alice@atomurus.com');

  const meRes = await meHandler(cookieRequest('https://atomurus.com/api/auth/me', {
    cookies: 'atm_access=access-live; atm_refresh=refresh-live'
  }));
  const meJson = await readJson(meRes);
  assert.equal(meRes.status, 200);
  assert.equal(meJson.user.email, 'alice@atomurus.com');
});

await withAuthEnv(async () => {
  // 4b. close/open with expired access, valid refresh
  installSupabaseMock([
    {
      match: (url, method) => method === 'GET' && url.endsWith('/user'),
      respond: async () => jsonRes(401, { message: 'expired' })
    },
    {
      match: (url, method) => method === 'POST' && url.includes('/token?grant_type=refresh_token'),
      respond: async (_url, _method, options) => {
        const body = JSON.parse(options.body);
        assert.equal(body.refresh_token, 'refresh-live');
        return jsonRes(200, sessionBody());
      }
    }
  ]);
  const restored = await authSession(sessionRequest({ cookie: 'atm_access=expired; atm_refresh=refresh-live' }));
  assert.equal(restored.user.email, 'alice@atomurus.com');
  assert.ok(restored.cookieHeaders.some((header) => header.startsWith('atm_access=')));
});

await withAuthEnv(async () => {
  // 5. rota/função protegida sem login
  installSupabaseMock([]);
  const meRes = await meHandler(cookieRequest('https://atomurus.com/api/auth/me'));
  const meJson = await readJson(meRes);
  assert.equal(meRes.status, 401);
  assert.equal(meJson.code, 'session_expired');
  assert.equal(clearsSessionCookies(meRes), false);

  const dash = await dashboardHandler(cookieRequest('https://atomurus.com/api/private/dashboard'));
  assert.equal(dash.status, 401);
  assert.equal(clearsSessionCookies(dash), false);
  assert.equal(isProtectedPath('/app'), false);
});

await withAuthEnv(async () => {
  // 6. login e retorno à URL original + open-redirect blocked
  assert.equal(safeNextPath('/pricing'), '/pricing');
  assert.equal(safeNextPath('/app'), '/app');
  assert.equal(safeNextPath('/app?section=billing'), '/app?section=billing');
  assert.equal(safeNextPath('/login'), '/app');
  assert.equal(safeNextPath('/signup'), '/app');
  assert.equal(safeNextPath('/forgot-password'), '/app');
  assert.equal(safeNextPath('/login/reset'), '/app');
  assert.equal(safeNextPath('https://evil.test'), '/app');
  assert.equal(safeNextPath('https://evil.example'), '/app');
  assert.equal(safeNextPath('//evil.com'), '/app');
  assert.equal(safeNextPath('%2F%2Fevil.com'), '/app');
  assert.equal(safeNextPath('/%2F%2Fevil.com'), '/app');
  assert.equal(safeNextPath('\\\\evil.com'), '/app');
});

await withAuthEnv(async () => {
  // 7. logout realmente invalida
  let loggedOut = false;
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.endsWith('/logout'),
    respond: async (_url, _method, options) => {
      loggedOut = options.headers.Authorization === 'Bearer access-live';
      return jsonRes(204, {});
    }
  }]);
  const cookies = await authLogout(sessionRequest());
  assert.equal(loggedOut, true);
  assert.ok(cookies.every((header) => header.includes('Max-Age=0')));

  const res = await logoutHandler(cookieRequest('https://atomurus.com/api/auth/logout', {
    method: 'POST',
    cookies: 'atm_access=access-live; atm_refresh=refresh-live',
    body: {}
  }));
  assert.equal(res.status, 200);
  assert.ok(res.headers.getSetCookie().every((header) => header.includes('Max-Age=0')));
});

await withAuthEnv(async () => {
  // 8. Voltar depois do logout: sessão morta continua 401 (bfcache recheck)
  installSupabaseMock([{
    match: (url) => url.endsWith('/user') || url.includes('refresh_token'),
    respond: async () => jsonRes(401, { message: 'expired' })
  }]);
  const meRes = await meHandler(cookieRequest('https://atomurus.com/api/auth/me', {
    cookies: 'atm_access=stale; atm_refresh=stale'
  }));
  assert.equal(meRes.status, 401);
  assert.equal(clearsSessionCookies(meRes), false);

  const ads = await adsConfigHandler(cookieRequest('https://atomurus.com/api/ads-config', {
    cookies: 'atm_access=stale; atm_refresh=stale'
  }));
  const adsJson = await readJson(ads);
  assert.equal(ads.status, 200);
  assert.equal(adsJson.signedIn, false);
  assert.equal(clearsSessionCookies(ads), false);
});

await withAuthEnv(async () => {
  // 9. opportunistic restore miss must not clear cookies (refresh race)
  installSupabaseMock([
    {
      match: (url, method) => method === 'GET' && url.endsWith('/user'),
      respond: async () => jsonRes(401, { message: 'expired' })
    },
    {
      match: (url, method) => method === 'POST' && url.includes('refresh_token'),
      respond: async () => jsonRes(401, { message: 'Invalid Refresh Token' })
    }
  ]);
  const expired = await authSession(sessionRequest({ cookie: 'atm_access=dead; atm_refresh=dead' }));
  assert.equal(expired.user, null);
  assert.equal(expired.cookieHeaders.length, 0);
  assert.equal(clearsSessionCookies(expired.cookieHeaders), false);
});

await withAuthEnv(async () => {
  // 10. refresh da sessão
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=refresh_token'),
    respond: async () => jsonRes(200, sessionBody())
  }]);
  const refreshed = await authRefresh(sessionRequest({ cookie: 'atm_refresh=refresh-live' }));
  assert.equal(refreshed.user.email, 'alice@atomurus.com');
  const res = await refreshHandler(cookieRequest('https://atomurus.com/api/auth/refresh', {
    method: 'POST',
    cookies: 'atm_refresh=refresh-live',
    body: {}
  }));
  assert.equal(res.status, 200);
});

await withAuthEnv(async () => {
  // explicit refresh of a dead session still clears cookies
  installSupabaseMock([
    {
      match: (url, method) => method === 'GET' && url.endsWith('/user'),
      respond: async () => jsonRes(401, { message: 'expired' })
    },
    {
      match: (url, method) => method === 'POST' && url.includes('refresh_token'),
      respond: async () => jsonRes(401, { message: 'Invalid Refresh Token' })
    }
  ]);
  const expired = await authRefresh(sessionRequest({ cookie: 'atm_access=dead; atm_refresh=dead' }));
  assert.equal(expired.user, null);
  assert.ok(expired.cookieHeaders.length > 0);
  assert.equal(clearsSessionCookies(expired.cookieHeaders), true);

  const res = await refreshHandler(cookieRequest('https://atomurus.com/api/auth/refresh', {
    method: 'POST',
    cookies: 'atm_access=dead; atm_refresh=dead',
    body: {}
  }));
  assert.equal(res.status, 401);
  assert.equal(clearsSessionCookies(res), true);
});

await withAuthEnv(async () => {
  // loser of a refresh-token rotation must not wipe the winner's cookies
  resetRefreshFlights();
  let refreshCalls = 0;
  installSupabaseMock([
    {
      match: (url, method) => method === 'GET' && url.endsWith('/user'),
      respond: async () => jsonRes(401, { message: 'expired' })
    },
    {
      match: (url, method) => method === 'POST' && url.includes('/token?grant_type=refresh_token'),
      respond: async () => {
        refreshCalls += 1;
        if (refreshCalls === 1) return jsonRes(200, sessionBody());
        return jsonRes(401, { message: 'Invalid Refresh Token' });
      }
    }
  ]);
  const winner = await authSession(sessionRequest({ cookie: 'atm_access=dead; atm_refresh=refresh-live' }));
  const loser = await authSession(sessionRequest({ cookie: 'atm_access=dead; atm_refresh=refresh-live' }));
  const ads = await adsConfigHandler(cookieRequest('https://atomurus.com/api/ads-config', {
    cookies: 'atm_access=dead; atm_refresh=refresh-live'
  }));
  const meRes = await meHandler(cookieRequest('https://atomurus.com/api/auth/me', {
    cookies: 'atm_access=dead; atm_refresh=refresh-live'
  }));
  assert.equal(winner.user.email, 'alice@atomurus.com');
  assert.ok(winner.cookieHeaders.some((header) => header.startsWith('atm_access=')));
  assert.equal(loser.user, null);
  assert.equal(clearsSessionCookies(loser.cookieHeaders), false);
  assert.equal(ads.status, 200);
  assert.equal(clearsSessionCookies(ads), false);
  assert.equal(meRes.status, 401);
  assert.equal(clearsSessionCookies(meRes), false);
});

await withAuthEnv(async () => {
  // 11. recuperação de senha — resposta genérica
  let recoveredEmail = null;
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.endsWith('/recover'),
    respond: async (_url, _method, options) => {
      const body = JSON.parse(options.body);
      recoveredEmail = body.email;
      assert.match(body.redirect_to, /reset-password$/);
      return jsonRes(200, {});
    }
  }]);
  await authRecover('alice@atomurus.com');
  assert.equal(recoveredEmail, 'alice@atomurus.com');
  const res = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
    method: 'POST',
    body: { email: 'unknown@atomurus.com' }
  }));
  const json = await readJson(res);
  assert.equal(res.status, 200);
  assert.equal(json.ok, true);
});

await withAuthEnv(async () => {
  // 12. redefinição de senha
  installSupabaseMock([
    {
      match: (url, method) => method === 'POST' && url.endsWith('/verify'),
      respond: async () => jsonRes(200, sessionBody())
    },
    {
      match: (url, method) => method === 'PUT' && url.endsWith('/user'),
      respond: async (_url, _method, options) => {
        const body = JSON.parse(options.body);
        assert.equal(body.password, 'NewPass#99');
        return jsonRes(200, demoUser());
      }
    }
  ]);
  const reset = await authReset('token-hash', 'NewPass#99', 'recovery');
  assert.equal(reset.user.email, 'alice@atomurus.com');
  const res = await resetHandler(cookieRequest('https://atomurus.com/api/auth/reset', {
    method: 'POST',
    body: { token: 'token-hash', password: 'NewPass#99', type: 'recovery' }
  }));
  assert.equal(res.status, 200);
});

await withAuthEnv(async () => {
  // 13. cadastro
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/signup'),
    respond: async () => jsonRes(200, { user: demoUser({ email_confirmed_at: null }) })
  }]);
  const signed = await authSignup('alice@atomurus.com', 'Correct#Pass', {
    fullName: 'Alice Atom',
    username: 'alice'
  });
  assert.equal(signed.needsConfirmation, true);
  assert.equal(signed.signedIn, false);

  const res = await signupHandler(cookieRequest('https://atomurus.com/api/auth/signup', {
    method: 'POST',
    body: {
      fullName: 'Alice Atom',
      username: 'alice',
      email: 'alice@atomurus.com',
      password: 'Correct#Pass',
      passwordConfirm: 'Correct#Pass'
    }
  }));
  const json = await readJson(res);
  assert.equal(res.status, 200);
  assert.equal(json.needsConfirmation, true);
});

await withAuthEnv(async () => {
  // 14. confirmação de email
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.endsWith('/verify'),
    respond: async (_url, _method, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.token_hash, 'confirm-hash');
      assert.equal(body.type, 'signup');
      return jsonRes(200, sessionBody());
    }
  }]);
  const confirmed = await authConfirm('confirm-hash', 'signup');
  assert.equal(confirmed.user.email, 'alice@atomurus.com');
  const res = await confirmHandler(cookieRequest('https://atomurus.com/api/auth/confirm', {
    method: 'POST',
    body: { token: 'confirm-hash', type: 'signup' }
  }));
  assert.equal(res.status, 200);
});

await withAuthEnv(async () => {
  // email não confirmado
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async () => jsonRes(400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' })
  }]);
  const res = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    body: { identifier: 'alice@atomurus.com', password: 'Correct#Pass' }
  }));
  const json = await readJson(res);
  assert.equal(res.status, 401);
  assert.equal(json.code, 'email_not_confirmed');
});

await withAuthEnv(async () => {
  const lines = [];
  console.warn = (line) => lines.push(String(line));
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async () => jsonRes(400, { error: 'invalid_grant', msg: 'Invalid login credentials' })
  }]);
  const res = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.9' },
    body: { identifier: 'alice@atomurus.com', password: 'Wrong#Pass99' }
  }));
  assert.equal(res.status, 401);
  const blob = lines.join('\n');
  assert.match(blob, /Rejected credential attempt from 203\.0\.113\.9: 401/);
  assert.doesNotMatch(blob, /alice@atomurus\.com/);
  assert.doesNotMatch(blob, /Wrong#Pass99/);
});

await withAuthEnv(async () => {
  let called = false;
  installSupabaseMock([{
    match: () => {
      called = true;
      return true;
    },
    respond: async () => jsonRes(500, {})
  }]);
  const res = await resetHandler(cookieRequest('https://atomurus.com/api/auth/reset', {
    method: 'POST',
    body: { token: 'token-hash', password: 'short', type: 'recovery' }
  }));
  const json = await readJson(res);
  assert.equal(res.status, 400);
  assert.match(json.error, /9 characters/);
  assert.equal(called, false);
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.endsWith('/recover'),
    respond: async () => jsonRes(200, {})
  }]);

  for (let i = 0; i < 10; i += 1) {
    const res = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.20' },
      body: { email: `spray${i}@atomurus.com` }
    }));
    assert.equal(res.status, 200);
  }
  const ipBlocked = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.20' },
    body: { email: 'still-more@atomurus.com' }
  }));
  assert.equal(ipBlocked.status, 429);
  assert.ok(Number(ipBlocked.headers.get('Retry-After')) >= 1);
  assert.match(ipBlocked.headers.get('Cache-Control') || '', /no-store/);
  const ipJson = await readJson(ipBlocked);
  assert.equal(ipJson.ok, false);
  assert.doesNotMatch(JSON.stringify(ipJson), /spray0@atomurus\.com/);
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  const lines = [];
  console.warn = (line) => lines.push(String(line));
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.endsWith('/recover'),
    respond: async () => jsonRes(200, {})
  }]);

  for (let i = 0; i < 5; i += 1) {
    const res = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
      method: 'POST',
      headers: { 'x-forwarded-for': `198.51.100.${30 + i}` },
      body: { email: 'same-account@atomurus.com' }
    }));
    assert.equal(res.status, 200);
  }
  const emailBlocked = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.99' },
    body: { email: 'same-account@atomurus.com' }
  }));
  assert.equal(emailBlocked.status, 429);
  assert.ok(Number(emailBlocked.headers.get('Retry-After')) >= 1);
  assert.match(emailBlocked.headers.get('Cache-Control') || '', /no-store/);
  const blob = lines.join('\n');
  assert.match(blob, /auth_recovery_rate_limited/);
  assert.doesNotMatch(blob, /same-account@atomurus\.com/);
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.endsWith('/recover'),
    respond: async () => jsonRes(200, {})
  }]);
  const known = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.40' },
    body: { email: 'alice@atomurus.com' }
  }));
  const unknown = await recoverHandler(cookieRequest('https://atomurus.com/api/auth/recover', {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.41' },
    body: { email: 'missing@atomurus.com' }
  }));
  const knownJson = await readJson(known);
  const unknownJson = await readJson(unknown);
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  assert.deepEqual(knownJson, unknownJson);
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async () => jsonRes(400, { error: 'invalid_grant', msg: 'Invalid login credentials' })
  }]);
  const res = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.80' },
    body: { identifier: 'alice@atomurus.com', password: 'Wrong#Pass99' }
  }));
  assert.equal(res.status, 401);
  assert.equal(loginIdentifierLimiter.keys().some((key) => key.includes('@') || key.includes('alice')), false);
  assert.ok(loginIdentifierLimiter.keys().every((key) => key.startsWith('identifier:')));
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async () => jsonRes(400, { error: 'invalid_grant', msg: 'Invalid login credentials' })
  }]);
  for (let i = 0; i < 6; i += 1) {
    const res = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': `203.0.113.${100 + i}` },
      body: { identifier: 'rate.limit@atomurus.com', password: 'Wrong#Pass99' }
    }));
    assert.equal(res.status, 401);
  }
  const blocked = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.120' },
    body: { identifier: 'rate.limit@atomurus.com', password: 'Wrong#Pass99' }
  }));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('Retry-After')) >= 1);
  assert.match(blocked.headers.get('Cache-Control') || '', /no-store/);
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/signup'),
    respond: async () => jsonRes(200, { user: demoUser({ email: 'new@atomurus.com', email_confirmed_at: null }) })
  }]);
  for (let i = 0; i < 4; i += 1) {
    const res = await signupHandler(cookieRequest('https://atomurus.com/api/auth/signup', {
      method: 'POST',
      headers: { 'x-forwarded-for': `198.51.100.${60 + i}` },
      body: {
        fullName: 'New Atom',
        username: `newatom${i}`,
        email: 'new@atomurus.com',
        password: 'Correct#Pass',
        passwordConfirm: 'Correct#Pass'
      }
    }));
    assert.equal(res.status, 200);
  }
  const blocked = await signupHandler(cookieRequest('https://atomurus.com/api/auth/signup', {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.70' },
    body: {
      fullName: 'New Atom',
      username: 'newatomx',
      email: 'new@atomurus.com',
      password: 'Correct#Pass',
      passwordConfirm: 'Correct#Pass'
    }
  }));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('Retry-After')) >= 1);
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=refresh_token'),
    respond: async () => jsonRes(200, sessionBody())
  }]);
  assert.equal(refreshIpLimiter.limit, 60);
  for (let i = 0; i < refreshIpLimiter.limit; i += 1) {
    refreshIpLimiter.hit('ip:203.0.113.200');
  }
  const blocked = await refreshHandler(cookieRequest('https://atomurus.com/api/auth/refresh', {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.200' },
    cookies: 'atm_refresh=refresh-live',
    body: {}
  }));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('Retry-After')) >= 1);
  assert.match(blocked.headers.get('Cache-Control') || '', /no-store/);
});

await withAuthEnv(async () => {
  resetRefreshFlights();
  let refreshCalls = 0;
  installSupabaseMock([
    {
      match: (url, method) => method === 'GET' && url.endsWith('/user'),
      respond: async () => jsonRes(401, { message: 'expired' })
    },
    {
      match: (url, method) => method === 'POST' && url.includes('/token?grant_type=refresh_token'),
      respond: async () => {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return jsonRes(200, sessionBody());
      }
    }
  ]);
  const req = sessionRequest({ cookie: 'atm_access=dead; atm_refresh=refresh-live' });
  const [first, second] = await Promise.all([authSession(req), authSession(req)]);
  assert.equal(refreshCalls, 1);
  assert.equal(first.user.email, 'alice@atomurus.com');
  assert.equal(second.user.email, 'alice@atomurus.com');
});

assert.equal(usernameFromEmail('foo+tag@atomurus.com'), 'foo');
assert.equal(usernameFromEmail('Matheus.Stan@atomurus.com'), 'matheus.stan');
assert.ok(validUsername(usernameFromEmail('a@atomurus.com')));
assert.ok(usernameCandidates('alice').includes('alice'));
assert.ok(usernameCandidates('alice').includes('alice2'));

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  let captured;
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/signup'),
    respond: async (_url, _method, options) => {
      captured = JSON.parse(options.body);
      return jsonRes(200, { user: demoUser({ email: 'onlymail@atomurus.com', email_confirmed_at: null, user_metadata: { username: captured.data.username } }) });
    }
  }]);
  const res = await signupHandler(cookieRequest('https://atomurus.com/api/auth/signup', {
    method: 'POST',
    body: {
      email: 'onlymail@atomurus.com',
      password: 'Correct#Pass',
      passwordConfirm: 'Correct#Pass'
    }
  }));
  const json = await readJson(res);
  assert.equal(res.status, 200);
  assert.equal(captured.data.username, 'onlymail');
  assert.equal(json.ok, true);
});

await withAuthEnv(async () => {
  // Hung GoTrue body read must fail closed instead of sitting on "Signing in…"
  resetAuthRateLimiters();
  process.env.SUPABASE_FETCH_TIMEOUT_MS = '40';
  process.env.SUPABASE_FETCH_RETRIES = '0';
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: () => new Promise(() => {})
  }]);
  const started = Date.now();
  const res = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    body: { identifier: 'alice@atomurus.com', password: 'Correct#Pass' }
  }));
  assert.ok(Date.now() - started < 1500);
  assert.equal(res.status, 503);
  const body = await readJson(res);
  assert.equal(body.ok, false);
  assert.equal(body.code, 'upstream_timeout');
});

await withAuthEnv(async () => {
  resetAuthRateLimiters();
  process.env.SUPABASE_FETCH_TIMEOUT_MS = '40';
  process.env.SUPABASE_FETCH_RETRIES = '1';
  let calls = 0;
  installSupabaseMock([{
    match: (url, method) => method === 'POST' && url.includes('/token?grant_type=password'),
    respond: async () => {
      calls += 1;
      if (calls === 1) return new Promise(() => {});
      return jsonRes(200, sessionBody());
    }
  }]);
  const res = await loginHandler(cookieRequest('https://atomurus.com/api/auth/login', {
    method: 'POST',
    body: { identifier: 'alice@atomurus.com', password: 'Correct#Pass' }
  }));
  assert.equal(calls, 2);
  assert.equal(res.status, 200);
  const body = await readJson(res);
  assert.equal(body.ok, true);
  assert.equal(body.user.email, 'alice@atomurus.com');
});

console.log('test-auth-flows: ok');
