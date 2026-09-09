import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessCookieName, refreshCookieName, allSessionCookieNames } from '../netlify/lib/auth-cookies.mjs';
import { authProviderName, authRefresh, isAuthConfigured } from '../netlify/lib/auth-provider.mjs';
import { isPublicAuthPath, isProtectedPath, loginUrl, safeNextPath } from '../netlify/lib/auth-redirect.mjs';
import { hasSessionCookieHeader } from '../netlify/lib/session-cookie-flag.mjs';
import { logAuthEvent } from '../netlify/lib/auth-log.mjs';
import { classifySupabaseAuthError, normalizeSupabaseUser } from '../netlify/lib/supabase-auth.mjs';
import { upstreamFetch } from '../netlify/lib/upstream-fetch.mjs';

const original = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
}

function withEnv(overrides, fn) {
  restoreEnv();
  Object.assign(process.env, overrides);
  try {
    fn();
  } finally {
    restoreEnv();
  }
}

withEnv({ AUTH_PROVIDER: 'netlify-identity', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }, () => {
  assert.equal(authProviderName(), 'supabase');
  assert.equal(isAuthConfigured(), false);
});

withEnv({ AUTH_PROVIDER: '', SUPABASE_URL: 'https://demo.supabase.co', SUPABASE_ANON_KEY: 'anon' }, () => {
  assert.equal(authProviderName(), 'supabase');
  assert.equal(isAuthConfigured(), true);
});

withEnv({ AUTH_PROVIDER: 'supabase', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }, () => {
  assert.equal(authProviderName(), 'supabase');
  assert.equal(isAuthConfigured(), false);
});

withEnv({ NETLIFY_DEV: 'true' }, () => {
  assert.equal(accessCookieName(), 'atm_access');
  assert.equal(refreshCookieName(), 'atm_refresh');
  assert.ok(allSessionCookieNames().includes('atm_access'));
});

withEnv({ NETLIFY_DEV: '', CONTEXT: 'production' }, () => {
  assert.equal(accessCookieName(), '__Host-atm_access');
  assert.equal(refreshCookieName(), '__Host-atm_refresh');
});

withEnv({ NETLIFY_DEV: '', CONTEXT: 'deploy-preview' }, () => {
  assert.equal(accessCookieName(), '__Host-atm_access');
  assert.equal(refreshCookieName(), '__Host-atm_refresh');
});

const user = normalizeSupabaseUser({
  id: 'u1',
  email: 'a@b.com',
  created_at: '2026-01-01T00:00:00Z',
  email_confirmed_at: '2026-01-02T00:00:00Z',
  app_metadata: { atomurus_plan: 'paid' }
});
assert.equal(user.email, 'a@b.com');
assert.equal(user.confirmedAt, '2026-01-02T00:00:00Z');
assert.equal(user.appMetadata.atomurus_plan, 'paid');

assert.equal(safeNextPath('/pricing'), '/pricing');
assert.equal(safeNextPath('/app'), '/app');
assert.equal(safeNextPath('/app?section=billing'), '/app?section=billing');
assert.equal(safeNextPath('/app?section=account'), '/app?section=account');
assert.equal(safeNextPath('https://evil.example/phish'), '/app');
assert.equal(safeNextPath('https://evil.example'), '/app');
assert.equal(safeNextPath('//evil.example'), '/app');
assert.equal(safeNextPath('//evil.com'), '/app');
assert.equal(safeNextPath('%2F%2Fevil.com'), '/app');
assert.equal(safeNextPath('/%2F%2Fevil.com'), '/app');
assert.equal(safeNextPath('/%252F%252Fevil.com'), '/app');
assert.equal(safeNextPath('\\\\evil.com'), '/app');
assert.equal(safeNextPath('/\\\\evil.com'), '/app');
assert.equal(safeNextPath('/login'), '/app');
assert.equal(safeNextPath('/signup'), '/app');
assert.equal(safeNextPath('/signup?next=/app'), '/app');
assert.equal(safeNextPath('/forgot-password'), '/app');
assert.equal(safeNextPath('/login/reset'), '/app');
assert.equal(safeNextPath('/reset-password'), '/app');
assert.equal(safeNextPath('https://evil.com', ''), '');
assert.equal(loginUrl('/pricing'), '/login?next=%2Fpricing');
assert.equal(loginUrl('/app'), '/login?next=%2Fapp');
assert.equal(loginUrl('/app?section=billing'), '/login?next=%2Fapp%3Fsection%3Dbilling');
assert.equal(loginUrl('/app', 'https://atomurus.invalid', 'pt-BR'), '/login?next=%2Fapp&lang=pt-BR');
assert.equal(isPublicAuthPath('/login'), true);
assert.equal(isPublicAuthPath('/reset-password'), true);
assert.equal(isProtectedPath('/app'), false);
assert.equal(isProtectedPath('/app.html'), false);
assert.equal(isProtectedPath('/periodic-table'), false);

const unconfirmed = classifySupabaseAuthError(Object.assign(new Error('Email not confirmed'), {
  status: 400,
  code: 'email_not_confirmed'
}));
assert.equal(unconfirmed.code, 'email_not_confirmed');
assert.equal(unconfirmed.status, 401);

const timedOut = classifySupabaseAuthError(Object.assign(new Error('Authentication provider timed out'), {
  name: 'TimeoutError',
  code: 'upstream_timeout'
}));
assert.equal(timedOut.code, 'upstream_timeout');
assert.equal(timedOut.status, 503);

const aborted = classifySupabaseAuthError(Object.assign(new Error('The operation was aborted'), {
  name: 'AbortError'
}));
assert.equal(aborted.code, 'upstream_timeout');
assert.equal(aborted.status, 503);

const logs = [];
const originalWarn = console.warn;
console.warn = (line) => logs.push(String(line));
try {
  logAuthEvent('auth-login', {
    ok: false,
    email: 'a@b.com',
    access_token: 'secret-token',
    password: 'hunter2',
    refresh_token: 'refresh-secret',
    errorType: 'invalid_credentials'
  });
} finally {
  console.warn = originalWarn;
}
assert.equal(logs.length, 1);
assert.match(logs[0], /invalid_credentials/);
assert.doesNotMatch(logs[0], /secret-token|hunter2|refresh-secret|access_token|password/);
assert.doesNotMatch(logs[0], /a@b\.com/);

for (const file of ['auth-client.js', 'auth-login.js', 'auth-app.js', 'auth-sync.js', 'ads-gate.js', 'login.html', 'app.html', 'study-client.js', 'study-save.js', 'study-progress.js', 'study-boot.js']) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/);
}

const loginBoot = readFileSync(new URL('../auth-login.js', import.meta.url), 'utf8');
assert.match(loginBoot, /stripSensitiveAuthParams/);
assert.match(loginBoot, /authPageBooted/);
assert.match(loginBoot, /event\.persisted !== true/);
assert.match(loginBoot, /auth-login-ok[\s\S]*signupOk|signupOk[\s\S]*auth-login-ok/);
assert.match(loginBoot, /forgot-password\?|authScreenPath/);
assert.match(loginBoot, /handlePasswordResetSubmit[\s\S]*passwordPolicyError\(password\)/);
assert.match(loginBoot, /revealAuthPanels/);
assert.match(loginBoot, /setTimeout\(revealAuthPanels, 8000\)/);
assert.doesNotMatch(loginBoot, /addEventListener\(['"]load['"]/);
assert.doesNotMatch(loginBoot, /withRefresh\s*\(/);

const authClient = readFileSync(new URL('../auth-client.js', import.meta.url), 'utf8');
assert.match(authClient, /encodeURIComponent\(next\)/);
assert.match(authClient, /url\.origin !== location\.origin/);
assert.match(authClient, /sessionPromise/);
assert.match(authClient, /options\.force/);
assert.match(authClient, /AbortController/);
assert.match(authClient, /timeoutMs = 20000/);
assert.match(authClient, /isProtectedPath\(location\.pathname\)/);
assert.match(authClient, /publishSync\('signed-out'\)/);
assert.match(authClient, /publishSync\('signed-in'\)/);
assert.match(authClient, /action === 'revalidate'/);
assert.doesNotMatch(authClient, /withRefresh\s*\(/);

const authSync = readFileSync(new URL('../auth-sync.js', import.meta.url), 'utf8');
assert.doesNotMatch(authSync, /access_token|refresh_token|password|email/);

const authApp = readFileSync(new URL('../auth-app.js', import.meta.url), 'utf8');
assert.match(authApp, /getSession\(\{\s*force:\s*true\s*\}\)/);
assert.doesNotMatch(authApp, /startRefreshTimer\s*\(/);
assert.match(authApp, /AtomurusStudy|api\.overview/);
assert.match(authApp, /loadStudyCloud\(null\)/);

const studyClient = readFileSync(new URL('../study-client.js', import.meta.url), 'utf8');
assert.doesNotMatch(studyClient, /SERVICE_ROLE|service_role|SUPABASE_SERVICE/);
assert.doesNotMatch(studyClient, /\/api\/auth\/me/);
assert.doesNotMatch(studyClient, /localStorage|sessionStorage/);

const loginHtml = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
assert.match(loginHtml, /auth-sync\.js/);
assert.match(loginHtml, /class="auth-checking"/);
assert.match(loginHtml, /id="auth-session-boot"/);
assert.match(loginHtml, /checkingSession/);

const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
assert.doesNotMatch(appHtml, /requireSession\(\{/);
assert.match(appHtml, /auth-sync\.js/);
assert.doesNotMatch(appHtml, /html\.lc-loading body/);
assert.doesNotMatch(appHtml, /classList\.add\(['"]lc-loading['"]\)/);

const netlifyToml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
assert.doesNotMatch(netlifyToml, /function = "protect-app"/);
assert.match(netlifyToml, /SUPABASE_FETCH_TIMEOUT_MS/);

const upstreamSrc = readFileSync(new URL('../netlify/lib/upstream-fetch.mjs', import.meta.url), 'utf8');
assert.match(upstreamSrc, /ipv4first/);
assert.match(upstreamSrc, /controller\.abort/);

const supabaseConfig = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
assert.match(supabaseConfig, /atomurus\.com\/reset-password/);
assert.match(supabaseConfig, /localhost:8888\/reset-password/);

assert.equal(hasSessionCookieHeader(''), false);
assert.equal(hasSessionCookieHeader('atm_access='), false);
assert.equal(hasSessionCookieHeader('atm_access=; atm_refresh='), false);
assert.equal(hasSessionCookieHeader('theme=light'), false);
assert.equal(hasSessionCookieHeader('atm_access=live-token'), true);
assert.equal(hasSessionCookieHeader('__Host-atm_refresh=live-refresh'), true);

const rls = readFileSync(new URL('../supabase/migrations/004_rls_with_check.sql', import.meta.url), 'utf8');
assert.match(rls, /with check \(auth\.uid\(\) = id\)/i);
assert.match(rls, /with check \(auth\.uid\(\) = user_id\)/i);

const originalFetch = globalThis.fetch;
try {
  restoreEnv();
  Object.assign(process.env, {
    AUTH_PROVIDER: 'supabase',
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    NETLIFY_DEV: 'true'
  });

  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    headers: new Headers(),
    text: async () => JSON.stringify({ message: 'Invalid Refresh Token' })
  });

  const request = {
    headers: {
      get(name) {
        return String(name).toLowerCase() === 'cookie' ? 'atm_refresh=expired-refresh-token' : null;
      }
    }
  };

  const expired = await authRefresh(request);
  assert.equal(expired.user, null);
  assert.equal(expired.cookieHeaders.length, 4);
  assert.ok(expired.cookieHeaders.every((header) => header.includes('Max-Age=0')));
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
}

function abortError() {
  const err = new Error('The operation was aborted');
  err.name = 'AbortError';
  return err;
}

function hangUntilAbort(options = {}) {
  return new Promise((_, reject) => {
    const signal = options.signal;
    if (!signal) return;
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    signal.addEventListener('abort', () => reject(abortError()), { once: true });
  });
}

{
  restoreEnv();
  process.env.SUPABASE_FETCH_TIMEOUT_MS = '150';
  process.env.SUPABASE_FETCH_RETRIES = '0';
  const prevFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => hangUntilAbort(options);
  const started = Date.now();
  try {
    await upstreamFetch('https://demo.supabase.co/auth/v1/token', { method: 'POST' });
    assert.fail('expected upstream timeout');
  } catch (err) {
    assert.equal(err.code, 'upstream_timeout');
    assert.ok(Date.now() - started < 1500);
  } finally {
    globalThis.fetch = prevFetch;
    restoreEnv();
  }
}

{
  restoreEnv();
  process.env.SUPABASE_FETCH_TIMEOUT_MS = '150';
  process.env.SUPABASE_FETCH_RETRIES = '1';
  const prevFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    if (calls === 1) return hangUntilAbort(options);
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => JSON.stringify({ access_token: 'ok' })
    };
  };
  try {
    const res = await upstreamFetch('https://demo.supabase.co/auth/v1/token', { method: 'POST' });
    assert.equal(calls, 2);
    assert.equal(res.status, 200);
    assert.equal(await res.json().then((body) => body.access_token), 'ok');
  } finally {
    globalThis.fetch = prevFetch;
    restoreEnv();
  }
}

console.log('test-auth-provider: ok');
