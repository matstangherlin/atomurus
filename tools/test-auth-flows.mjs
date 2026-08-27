import assert from 'node:assert/strict';
import { authConfirm, authLogin, authLogout, authRecover, authRefresh, authReset, authSession, authSignup } from '../netlify/lib/auth-provider.mjs';
import { isProtectedPath, safeNextPath } from '../netlify/lib/auth-redirect.mjs';
import loginHandler from '../netlify/functions/auth-login.mjs';
import meHandler from '../netlify/functions/auth-me.mjs';
import logoutHandler from '../netlify/functions/auth-logout.mjs';
import refreshHandler from '../netlify/functions/auth-refresh.mjs';
import recoverHandler from '../netlify/functions/auth-recover.mjs';
import signupHandler from '../netlify/functions/auth-signup.mjs';
import confirmHandler from '../netlify/functions/auth-confirm.mjs';
import resetHandler from '../netlify/functions/auth-reset.mjs';
import dashboardHandler from '../netlify/functions/private-dashboard.mjs';

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
  assert.ok(meRes.headers.getSetCookie().some((header) => header.includes('Max-Age=0')));

  const dash = await dashboardHandler(cookieRequest('https://atomurus.com/api/private/dashboard'));
  assert.equal(dash.status, 401);
  assert.equal(isProtectedPath('/app'), true);
});

await withAuthEnv(async () => {
  // 6. login e retorno à URL original
  assert.equal(safeNextPath('/pricing'), '/pricing');
  assert.equal(safeNextPath('/login'), '/app');
  assert.equal(safeNextPath('https://evil.test'), '/app');
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
  assert.ok(meRes.headers.getSetCookie().some((header) => header.includes('Max-Age=0')));
});

await withAuthEnv(async () => {
  // 9. sessão expirada limpa cookies
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
  assert.ok(expired.cookieHeaders.every((header) => header.includes('Max-Age=0')));
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

console.log('test-auth-flows: ok');
