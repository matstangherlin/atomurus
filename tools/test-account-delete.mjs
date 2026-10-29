// POST /api/account/delete (prompt 29, M12-b). Two halves:
// 1. The cascade is a contract: every table with user_id references
//    profiles(id) ON DELETE CASCADE, and profiles references auth.users(id)
//    ON DELETE CASCADE — read from supabase/migrations, not assumed.
// 2. The handler, with the auth provider faked in-process (no real Supabase).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler, {
  ACCOUNT_DELETE_MODE, ACCOUNT_DELETE_MODES, CONFIRM_PHRASES, createAccountDeleteHandler, deleteLimiter, subscriptionBlocksDeletion
} from '../netlify/functions/account-delete.mjs';
import { EXPORT_TABLES } from '../netlify/functions/account-export.mjs';
import { supabaseAdminDeleteUser } from '../netlify/lib/supabase-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');

// ── 1. Cascade, proved from the migrations ──────────────────────────────────
function createTables(sql) {
  const out = [];
  const re = /create table if not exists public\.([a-z_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql))) {
    // The body runs to the parenthesis that closes the one after the name.
    let depth = 1;
    let i = re.lastIndex;
    for (; i < sql.length && depth; i += 1) {
      if (sql[i] === '(') depth += 1;
      else if (sql[i] === ')') depth -= 1;
    }
    out.push({ table: m[1].toLowerCase(), body: sql.slice(re.lastIndex, i - 1) });
  }
  return out;
}

const files = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const tables = new Map();
const userIdLater = [];
for (const file of files) {
  const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8').replace(/--[^\n]*/g, '');
  for (const t of createTables(sql)) tables.set(t.table, { ...t, file });
  // A user_id added by ALTER TABLE would escape the check below.
  if (/add column[^;]*\buser_id\b/i.test(sql)) userIdLater.push(file);
}
assert.deepEqual(userIdLater, [], 'no migration adds user_id after the table is created');

const profiles = tables.get('profiles');
assert.ok(profiles, 'profiles table');
assert.match(profiles.body, /\bid uuid primary key references auth\.users \(id\) on delete cascade/i,
  'profiles.id references auth.users(id) ON DELETE CASCADE: deleting the auth user deletes the profile');

const withUserId = [...tables.values()].filter((t) => /^\s*user_id\s/im.test(t.body));
const notCascading = withUserId.filter((t) => !/^\s*user_id uuid not null references public\.profiles \(id\) on delete cascade\s*,?\s*$/im.test(t.body));
// If this fails: stop and list the tables; never delete their rows by hand.
assert.deepEqual(notCascading.map((t) => `${t.table} (${t.file})`), [], 'every table with user_id cascades from profiles(id)');
const cascading = withUserId.map((t) => t.table).sort();
assert.deepEqual(cascading, [
  'pro_lab_sessions', 'study_cards', 'study_items', 'study_progress', 'study_review_events', 'study_set_items', 'study_sets'
], 'the user tables known today');

// Tables without user_id hold nobody's data (only the dedupe log today).
const others = [...tables.keys()].filter((t) => t !== 'profiles' && !cascading.includes(t)).sort();
assert.deepEqual(others, ['processed_stripe_events'], 'tables without user_id');
assert.doesNotMatch(tables.get('processed_stripe_events').body, /user|email|customer/i, 'the dedupe log keeps no personal data');

// The export covers exactly the tables the deletion removes.
assert.deepEqual(Object.values(EXPORT_TABLES).flat().sort(), cascading, 'export and deletion cover the same tables');

// The handler deletes nothing table by table: the cascade does it.
const source = fs.readFileSync(path.join(ROOT, 'netlify/functions/account-delete.mjs'), 'utf8');
assert.doesNotMatch(source, /rest\/v1|supabaseServiceRest|method:\s*'DELETE'/, 'no per-table deletes in the handler');

// ── 2. Handler, with a fake provider ────────────────────────────────────────
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const quiet = { info: console.info, warn: console.warn, error: console.error };
let logs = [];

function jsonRes(status, body) {
  const text = JSON.stringify(body);
  return { ok: status < 300, status, headers: new Headers({ 'content-type': 'application/json' }), text: async () => text, json: async () => body };
}

const BASE_USER = { id: 'user-a', email: 'alice@atomurus.com', created_at: '2020-01-01T00:00:00Z', app_metadata: {}, user_metadata: { username: 'alice' } };
const withApp = (app) => ({ ...BASE_USER, app_metadata: app });

function request({ body = { confirm: 'EXCLUIR', password: 'correct horse' }, cookie = 'atm_access=access-a', origin = 'https://atomurus.com', method = 'POST', raw } = {}) {
  const headers = { 'content-type': 'application/json', accept: 'application/json', cookie };
  if (origin) headers.origin = origin;
  const init = { method, headers };
  if (method !== 'GET' && method !== 'OPTIONS') init.body = raw ?? JSON.stringify(body);
  return new Request('https://atomurus.com/api/account/delete', init);
}

function fakes({ user = BASE_USER, deleteResult = { deleted: true, missing: false }, deleteError = null, passwordError = null } = {}) {
  const calls = { deleted: [], verified: [] };
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const auth = options.headers?.Authorization || options.headers?.authorization;
    if (href.endsWith('/auth/v1/user')) return auth === 'Bearer access-a' ? jsonRes(200, user) : jsonRes(401, { message: 'expired' });
    throw new Error('unexpected fetch ' + href);
  };
  const h = createAccountDeleteHandler({
    deleteUser: async (id) => { calls.deleted.push(id); if (deleteError) throw deleteError; return deleteResult; },
    verifyPassword: async (email, password) => {
      calls.verified.push(email);
      if (passwordError) throw passwordError;
      if (password !== 'correct horse') throw Object.assign(new Error('Invalid login credentials'), { status: 400 });
      return { ok: true };
    }
  });
  return { h, calls };
}

async function run(fn) {
  Object.assign(process.env, { SUPABASE_URL: 'https://demo.supabase.co', SUPABASE_ANON_KEY: 'anon-key', NETLIFY_DEV: 'true', AUTH_SITE_URL: 'https://atomurus.com' });
  logs = [];
  console.info = console.warn = console.error = (line) => { logs.push(String(line)); };
  deleteLimiter.reset();
  try { await fn(); } finally {
    globalThis.fetch = originalFetch;
    Object.assign(console, quiet);
    for (const k of Object.keys(process.env)) if (!(k in originalEnv)) delete process.env[k];
    Object.assign(process.env, originalEnv);
  }
}

const bodyOf = async (res) => JSON.parse(await res.text());
const setCookies = (res) => (typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || '']).join('\n');

assert.equal(ACCOUNT_DELETE_MODE, 'require-no-active-subscription', 'the conservative mode is the default');
assert.deepEqual(ACCOUNT_DELETE_MODES, ['require-no-active-subscription', 'cancel-then-delete', 'immediate']);
assert.deepEqual({ ...CONFIRM_PHRASES }, { pt: 'EXCLUIR', en: 'DELETE' });

// Access: method, origin, session.
await run(async () => {
  const { h, calls } = fakes();
  assert.equal((await h(request({ method: 'GET' }))).status, 405);
  assert.equal((await h(request({ origin: 'https://evil.example' }))).status, 403, 'cross-site → 403');
  const anon = await h(request({ cookie: '' }));
  assert.equal(anon.status, 401, 'no session → 401');
  assert.deepEqual(calls.deleted, []);
});

// Friction: phrase and password are both required; a wrong password is 401.
await run(async () => {
  const { h, calls } = fakes();
  for (const body of [{ password: 'correct horse' }, { confirm: 'excluir', password: 'correct horse' }, { confirm: 'EXCLUA', password: 'correct horse' }]) {
    const res = await h(request({ body }));
    assert.equal(res.status, 400);
    assert.equal((await bodyOf(res)).code, 'confirm_phrase', `phrase ${JSON.stringify(body.confirm)}`);
  }
  const noPassword = await h(request({ body: { confirm: 'DELETE' } }));
  assert.equal(noPassword.status, 400);
  assert.equal((await bodyOf(noPassword)).code, 'password_required');
  assert.equal((await h(request({ raw: 'not json' }))).status, 400);
  assert.equal((await h(request({ raw: JSON.stringify({ confirm: 'DELETE', password: 'x'.repeat(5000) }) }))).status, 413, 'body over 4 KB');
  assert.deepEqual(calls.verified, [], 'no password check before the phrase is right');
  assert.deepEqual(calls.deleted, []);
});

await run(async () => {
  const { h, calls } = fakes();
  const res = await h(request({ body: { confirm: 'EXCLUIR', password: 'wrong' } }));
  assert.equal(res.status, 401, 'wrong password → 401');
  assert.equal((await bodyOf(res)).code, 'reauth_failed');
  assert.deepEqual(calls.deleted, [], 'nothing deleted');
});

await run(async () => {
  const { h, calls } = fakes({ passwordError: Object.assign(new Error('upstream down'), { status: 502 }) });
  const res = await h(request());
  assert.equal(res.status, 503, 'provider down → 503, never a deletion');
  assert.deepEqual(calls.deleted, []);
});

// An active subscription blocks deletion in the default mode.
await run(async () => {
  const active = withApp({ stripe_customer_id: 'cus_test_1', subscription_status: 'active' });
  const { h, calls } = fakes({ user: active });
  const res = await h(request());
  assert.equal(res.status, 409);
  const body = await bodyOf(res);
  assert.equal(body.code, 'subscription_active');
  assert.match(body.error, /billing portal/);
  assert.doesNotMatch(JSON.stringify(body), /cus_test_1/);
  assert.deepEqual(calls.verified, [], 'refused before re-authentication');
  assert.deepEqual(calls.deleted, []);
});
assert.equal(subscriptionBlocksDeletion(withApp({ stripe_customer_id: 'cus_1', subscription_status: 'trialing' })), true);
assert.equal(subscriptionBlocksDeletion(withApp({ stripe_customer_id: 'cus_1', subscription_status: 'past_due' })), true);
assert.equal(subscriptionBlocksDeletion(withApp({ stripe_customer_id: 'cus_1', subscription_status: 'active', cancel_at_period_end: true })), false, 'already cancelled at period end: nothing more is billed');
assert.equal(subscriptionBlocksDeletion(withApp({ stripe_customer_id: 'cus_1', subscription_status: 'canceled' })), false);
assert.equal(subscriptionBlocksDeletion(BASE_USER), false, 'free account (even in the auto-trial)');

// Success: the auth user is deleted once, cookies cleared, audit log without PII.
await run(async () => {
  const { h, calls } = fakes();
  const res = await h(request());
  assert.equal(res.status, 200);
  assert.deepEqual(await bodyOf(res), { ok: true, deleted: true });
  assert.deepEqual(calls.deleted, ['user-a']);
  assert.deepEqual(calls.verified, ['alice@atomurus.com'], 're-authenticated with the current password');
  const cookies = setCookies(res);
  assert.match(cookies, /atm_access=;/);
  assert.match(cookies, /Max-Age=0/i);
  const audit = logs.filter((l) => l.startsWith('[account-delete]'));
  assert.equal(audit.length, 1);
  assert.match(audit[0], /"event":"account_deleted"/);
  assert.match(audit[0], /"userHash":"user:[0-9a-f]{8,}"/);
  assert.doesNotMatch(logs.join('\n'), /alice@|user-a\b|correct horse|access-a/, 'no e-mail, id, password or token in the logs');
});

// Idempotent: the user is already gone → still 200.
await run(async () => {
  const { h } = fakes({ deleteResult: { deleted: false, missing: true } });
  const res = await h(request({ body: { confirm: 'DELETE', password: 'correct horse' } }));
  assert.equal(res.status, 200);
  assert.deepEqual(await bodyOf(res), { ok: true, deleted: true });
});

// The provider fails → 500, generic, session kept (nothing was removed).
await run(async () => {
  const { h } = fakes({ deleteError: Object.assign(new Error('db timeout on node-7'), { status: 500 }) });
  const res = await h(request());
  assert.equal(res.status, 500);
  assert.doesNotMatch(await res.text(), /node-7|timeout/);
  assert.doesNotMatch(setCookies(res), /Max-Age=0/i);
});

// Three attempts a day per user.
await run(async () => {
  const { h } = fakes();
  for (let i = 0; i < 3; i += 1) assert.equal((await h(request({ body: { confirm: 'EXCLUIR', password: 'wrong' } }))).status, 401);
  const limited = await h(request());
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});

// The other modes stay behind the constant until the owner decides.
for (const mode of ['cancel-then-delete', 'immediate']) {
  await run(async () => {
    const calls = { deleted: [] };
    globalThis.fetch = async (url) => (String(url).endsWith('/auth/v1/user') ? jsonRes(200, BASE_USER) : jsonRes(500, {}));
    const h = createAccountDeleteHandler({ mode, deleteUser: async (id) => { calls.deleted.push(id); }, verifyPassword: async () => ({}) });
    const res = await h(request());
    assert.equal(res.status, 501, `${mode}: not implemented (TODO(owner))`);
    assert.deepEqual(calls.deleted, []);
  });
  console.log(`test-account-delete: skip — mode «${mode}» awaits the owner's decision`);
}

// The default export is wired to the conservative mode.
assert.equal(typeof handler, 'function');

// supabaseAdminDeleteUser: DELETE on the admin endpoint; 404 counts as done.
await run(async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake';
  const seen = [];
  globalThis.fetch = async (url, options = {}) => {
    seen.push({ url: String(url), method: options.method });
    return String(url).includes('gone') ? jsonRes(404, { message: 'User not found' }) : jsonRes(200, {});
  };
  assert.deepEqual(await supabaseAdminDeleteUser('user-a'), { deleted: true, missing: false });
  assert.deepEqual(await supabaseAdminDeleteUser('gone'), { deleted: false, missing: true });
  assert.deepEqual(seen.map((s) => `${s.method} ${s.url}`), [
    'DELETE https://demo.supabase.co/auth/v1/admin/users/user-a',
    'DELETE https://demo.supabase.co/auth/v1/admin/users/gone'
  ]);
  await assert.rejects(() => supabaseAdminDeleteUser(''), /Missing user id/);
});

// ── 3. The page (assets/account-center.js) ─────────────────────────────────
const vm = await import('node:vm');
const { STORAGE_REGISTRY, StorageClass } = await import('../src/core/storage/storage-policy.js');
function fakeStorage(keys) {
  const map = new Map(keys.map((k) => [k, '1']));
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    keys: () => [...map.keys()].sort()
  };
}
const registryKeys = Object.keys(STORAGE_REGISTRY);
const local = fakeStorage([...registryKeys.filter((k) => STORAGE_REGISTRY[k].area === 'local'), 'atomurus-cache:elements', 'atomurus-nav-lab', 'other-site-key']);
const session = fakeStorage([...registryKeys.filter((k) => STORAGE_REGISTRY[k].area === 'session'), 'atomurus-iso-tab-benzene']);
const win = { localStorage: local, sessionStorage: session };
const pageCtx = {
  window: win,
  localStorage: local,
  sessionStorage: session,
  document: { readyState: 'complete', documentElement: { lang: 'en', classList: { add() {}, remove() {} } }, getElementById: () => null, addEventListener() {} },
  location: { search: '' },
  setTimeout: () => 0,
  URLSearchParams
};
vm.createContext(pageCtx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/account-center.js'), 'utf8'), pageCtx);
const page = win.AtomurusAccount;
assert.deepEqual({ ...page.CONFIRM_PHRASES }, { ...CONFIRM_PHRASES }, 'the page asks for the phrases the server accepts');
assert.deepEqual(Object.keys(page.COPY.pt).sort(), Object.keys(page.COPY.en).sort(), 'account copy: PT/EN parity');

// The page clears exactly the registry's non-preference keys, by area.
const expected = { local: [], session: [] };
for (const [key, entry] of Object.entries(STORAGE_REGISTRY)) {
  if (entry.cls === StorageClass.PREFERENCE || entry.cls === StorageClass.SECURE) continue;
  expected[entry.area].push(key);
}
assert.deepEqual([...page.LOCAL_DATA_KEYS.local].sort(), expected.local.sort(), 'local keys follow storage-policy.js');
assert.deepEqual([...page.LOCAL_DATA_KEYS.session].sort(), expected.session.sort(), 'session keys follow storage-policy.js');
for (const [key, entry] of Object.entries(STORAGE_REGISTRY)) {
  const isPrefix = /[-:]$/.test(key);
  assert.equal(isPrefix, Boolean(entry.prefix), `${key}: a prefix in the registry ends in '-' or ':' on the page`);
}
page.clearLocalData();
const keptLocal = local.keys();
assert.ok(keptLocal.includes('atomurus-theme') && keptLocal.includes('atomurus-lang') && keptLocal.includes('atomurus-cookie-consent-v2') && keptLocal.includes('atomurus-nav-lab'), 'preferences stay');
assert.ok(!keptLocal.includes('atomurus-lab-v1') && !keptLocal.includes('atomurus-compare-queue') && !keptLocal.includes('atomurus-cache:elements'), 'device work and caches go');
assert.ok(keptLocal.includes('other-site-key'), 'keys that are not ours are left alone');
assert.deepEqual(session.keys(), [], 'per-tab UI memory goes');

console.log(`test-account-delete: ok (cascade proved for ${cascading.length} tables)`);
