import assert from 'node:assert/strict';
import { accessCookieName, refreshCookieName } from '../netlify/lib/auth-cookies.mjs';
import { authProviderName, authRefresh, isAuthConfigured } from '../netlify/lib/auth-provider.mjs';
import { normalizeSupabaseUser } from '../netlify/lib/supabase-auth.mjs';

const original = { ...process.env };
const originalFetch = globalThis.fetch;

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
  assert.equal(authProviderName(), 'netlify-identity');
  assert.equal(isAuthConfigured(), true);
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

console.log('test-auth-provider: ok');
