// GET /api/account/export (prompt 29, M12-a). Supabase is a fake: the auth
// endpoint and PostgREST are answered in-process; nothing leaves the machine.
import assert from 'node:assert/strict';
import handler, { EXPORT_PAGE_SIZE, EXPORT_TABLES, exportLimiter, exportFileName } from '../netlify/functions/account-export.mjs';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const quiet = { info: console.info, warn: console.warn, error: console.error };

function jsonRes(status, body, headers = {}) {
  const text = JSON.stringify(body);
  return { ok: status < 300, status, headers: new Headers({ 'content-type': 'application/json', ...headers }), text: async () => text, json: async () => body };
}

const ALICE = {
  id: 'user-a', email: 'alice@atomurus.com', created_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2026-01-02T00:00:00Z',
  app_metadata: { atomurus_plan: 'paid', subscription_status: 'active', stripe_customer_id: 'cus_secret_1', stripe_subscription_id: 'sub_secret_1' },
  user_metadata: { username: 'alice', full_name: 'Alice Atom' }, role: 'authenticated'
};

// Rows of two users in every table; RLS is simulated by the user_id filter,
// and one row of Bob «leaks» to prove the handler checks each row again.
function tableRows(table, count) {
  const rows = [];
  for (let i = 0; i < count; i += 1) rows.push({ id: `${table}-a-${String(i).padStart(4, '0')}`, user_id: 'user-a', note: `alice ${table} ${i}` });
  rows.push({ id: `${table}-b-0`, user_id: 'user-b', note: 'bob private' });
  return rows;
}

function install({ sizes = {}, huge = false } = {}) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const auth = options.headers?.Authorization || options.headers?.authorization;
    if (href.endsWith('/auth/v1/user')) {
      return auth === 'Bearer access-a' ? jsonRes(200, ALICE) : jsonRes(401, { message: 'expired' });
    }
    const m = /\/rest\/v1\/([a-z_]+)\?(.*)$/.exec(href);
    if (!m) throw new Error('unexpected fetch ' + href);
    calls.push({ table: m[1], query: decodeURIComponent(m[2]), auth });
    assert.equal(auth, 'Bearer access-a', 'reads with the user\'s own session (RLS)');
    const q = new URLSearchParams(m[2]);
    const offset = Number(q.get('offset')) || 0;
    const limit = Number(q.get('limit')) || 1000;
    if (m[1] === 'profiles') return jsonRes(200, offset ? [] : [{ id: 'user-a', email: 'alice@atomurus.com', plan: 'paid' }, { id: 'user-b', email: 'bob@x.com' }]);
    let rows = tableRows(m[1], sizes[m[1]] ?? 2);
    if (huge) rows = rows.map((r) => ({ ...r, note: 'x'.repeat(40000) }));
    return jsonRes(200, rows.slice(offset, offset + limit));
  };
  return calls;
}

function request({ cookie = 'atm_access=access-a', origin = 'https://atomurus.com', method = 'GET' } = {}) {
  const headers = { accept: 'application/json', cookie };
  if (origin) headers.origin = origin;
  return new Request('https://atomurus.com/api/account/export', { method, headers });
}

async function run(fn) {
  Object.assign(process.env, { SUPABASE_URL: 'https://demo.supabase.co', SUPABASE_ANON_KEY: 'anon-key', NETLIFY_DEV: 'true', AUTH_SITE_URL: 'https://atomurus.com' });
  console.info = console.warn = console.error = () => {};
  exportLimiter.reset();
  try { await fn(); } finally {
    globalThis.fetch = originalFetch;
    Object.assign(console, quiet);
    for (const k of Object.keys(process.env)) if (!(k in originalEnv)) delete process.env[k];
    Object.assign(process.env, originalEnv);
  }
}

await run(async () => {
  install();
  const anon = await handler(request({ cookie: '' }));
  assert.equal(anon.status, 401, 'no session → 401');
  assert.equal((await handler(request({ method: 'POST' }))).status, 405);
  assert.equal((await handler(request({ origin: 'https://evil.example' }))).status, 403);
});

await run(async () => {
  const calls = install({ sizes: { study_items: EXPORT_PAGE_SIZE + 3 } });
  const res = await handler(request());
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-disposition'), /^attachment; filename="atomurus-dados-\d{4}-\d{2}-\d{2}\.json"$/);
  const text = await res.text();
  const data = JSON.parse(text);
  assert.equal(data.schemaVersion, 1);
  assert.match(data.exportedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.ok(data.notes.pt.length && data.notes.en.length, 'says what is not included, in both languages');
  assert.deepEqual(Object.keys(data), ['schemaVersion', 'exportedAt', 'site', 'notes', 'account', 'profile', 'study', 'lab', 'billing']);
  assert.equal(data.account.email, 'alice@atomurus.com');
  assert.equal(data.profile.id, 'user-a');
  for (const [section, tables] of Object.entries(EXPORT_TABLES)) {
    for (const table of tables) {
      assert.ok(Array.isArray(data[section][table]), `${section}.${table}`);
      assert.ok(data[section][table].every((row) => row.user_id === 'user-a'), `${table}: only the caller's rows`);
    }
  }
  assert.equal(data.study.study_items.length, EXPORT_PAGE_SIZE + 3, 'paged: every row, past the first page');
  assert.doesNotMatch(text, /user-b|bob/, 'user A\'s export never holds user B\'s data');
  assert.doesNotMatch(text, /cus_secret|sub_secret|access-a|anon-key|password/i, 'no Stripe ids, tokens or keys');
  assert.equal(data.billing.plan, 'paid');
  assert.equal(data.billing.subscriptionStatus, 'active');
  assert.ok(calls.filter((c) => c.table !== 'profiles').every((c) => c.query.includes('user_id=eq.user-a')), 'every query is scoped to the caller');
  assert.ok(calls.some((c) => c.table === 'profiles' && c.query.includes('id=eq.user-a')));

  // Three per hour per user.
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request())).status, 200);
  const limited = await handler(request());
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});

await run(async () => {
  install({ huge: true, sizes: { study_items: 140 } });
  const res = await handler(request());
  assert.equal(res.status, 413, 'over 5 MB → 413 with guidance');
  const body = await res.json();
  assert.equal(body.code, 'export_too_large');
  assert.match(body.error, /contato@atomurus\.com/);
});

await run(async () => {
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/auth/v1/user')) return jsonRes(200, ALICE);
    return jsonRes(500, { message: 'relation "study_items" does not exist at db-node-3' });
  };
  const res = await handler(request());
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.code, 'export_failed');
  assert.doesNotMatch(JSON.stringify(body), /relation|db-node/, 'no internal message');
});

assert.equal(exportFileName(new Date('2026-10-28T23:59:00Z')), 'atomurus-dados-2026-10-28.json');
console.log('test-account-export: ok');
