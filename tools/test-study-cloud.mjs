import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertNoClientUserId,
  normalizeTags,
  publicStudyItem,
  safeStudyHref,
  STUDY_LIMITS
} from '../netlify/lib/study-cloud.mjs';
import overviewHandler from '../netlify/functions/study-overview.mjs';
import itemsHandler from '../netlify/functions/study-items.mjs';
import itemHandler from '../netlify/functions/study-item.mjs';
import historyHandler from '../netlify/functions/study-calculator-history.mjs';
import progressHandler from '../netlify/functions/study-progress.mjs';
import dashboardHandler from '../netlify/functions/private-dashboard.mjs';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function jsonRes(status, body, extraHeaders = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        const key = String(name).toLowerCase();
        if (extraHeaders[key] != null) return extraHeaders[key];
        if (extraHeaders[name] != null) return extraHeaders[name];
        return null;
      }
    },
    text: async () => (body === undefined ? '' : JSON.stringify(body))
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

function sessionCookie(token) {
  return `atm_access=${token}; atm_refresh=refresh-${token}`;
}

async function readJson(res) {
  return JSON.parse(await res.text());
}

function cookieHeadersOf(res) {
  return typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
}

function clearsSessionCookies(res) {
  return cookieHeadersOf(res).some((header) => header.includes('Max-Age=0'));
}

function assertPrivate(res, json) {
  assert.match(res.headers.get('Cache-Control') || '', /no-store/);
  const text = JSON.stringify(json);
  assert.doesNotMatch(text, /accessToken|access_token|"eyJ/);
  assert.equal(clearsSessionCookies(res), false);
}

function nowIso() {
  return new Date().toISOString();
}

function demoUsers() {
  const old = '2026-01-01T00:00:00.000Z';
  const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    'access-pro-a': {
      id: 'user-a',
      email: 'alice@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { atomurus_plan: 'paid', subscription_status: 'active' },
      user_metadata: { username: 'alice' },
      role: 'authenticated'
    },
    'access-pro-b': {
      id: 'user-b',
      email: 'bob@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { atomurus_plan: 'paid', subscription_status: 'active' },
      user_metadata: { username: 'bob' },
      role: 'authenticated'
    },
    'access-free': {
      id: 'user-free',
      email: 'free@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: {},
      user_metadata: {},
      role: 'authenticated'
    },
    'access-trial': {
      id: 'user-trial',
      email: 'trial@atomurus.com',
      created_at: recent,
      email_confirmed_at: recent,
      app_metadata: {},
      user_metadata: {},
      role: 'authenticated'
    },
    'access-admin': {
      id: 'user-admin',
      email: 'admin@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { roles: ['admin'] },
      user_metadata: {},
      role: 'admin'
    },
    'access-cancelled': {
      id: 'user-a',
      email: 'alice@atomurus.com',
      created_at: old,
      email_confirmed_at: old,
      app_metadata: { atomurus_plan: 'free', subscription_status: 'canceled' },
      user_metadata: { username: 'alice' },
      role: 'authenticated'
    }
  };
}

function parseQuery(href) {
  const raw = String(href).split('?')[1] || '';
  return raw.split('&').filter(Boolean).map((part) => {
    const split = part.indexOf('=');
    if (split < 0) return [decodeURIComponent(part), ''];
    return [decodeURIComponent(part.slice(0, split)), decodeURIComponent(part.slice(split + 1))];
  });
}

function param(params, key) {
  const found = params.find((entry) => entry[0] === key);
  return found ? found[1] : null;
}

function matchesFilters(row, params) {
  for (const [key, raw] of params) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'on_conflict') continue;
    if (key === 'and') {
      if (String(raw).includes('note.neq') && !String(row.note || '').trim()) return false;
      continue;
    }
    if (key === 'tags' && String(raw).startsWith('cs.')) {
      let inner = String(raw).slice(3);
      if (inner.startsWith('{') && inner.endsWith('}')) inner = inner.slice(1, -1);
      let tag = inner;
      try { tag = JSON.parse(inner); } catch (_err) {}
      const tags = Array.isArray(row.tags) ? row.tags : [];
      if (!tags.includes(tag)) return false;
      continue;
    }
    const eq = /^eq\.(.*)$/.exec(raw);
    const neq = /^neq\.(.*)$/.exec(raw);
    const lt = /^lt\.(.*)$/.exec(raw);
    if (eq && String(row[key]) !== eq[1]) return false;
    if (neq && String(row[key]) === neq[1]) return false;
    if (lt && !(Number(row[key]) < Number(lt[1]))) return false;
  }
  return true;
}

function sortRows(rows, params) {
  const order = param(params, 'order') || '';
  if (order.includes('updated_at.desc')) {
    return [...rows].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || String(b.id).localeCompare(String(a.id)));
  }
  return rows;
}

function createStudyStore() {
  const items = [];
  const progress = [];
  let seq = 0;
  function nextId() {
    seq += 1;
    return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
  }
  function tableRows(table) {
    if (table === 'study_items') return items;
    if (table === 'study_progress') return progress;
    return [];
  }
  return {
    items,
    progress,
    handle(href, method, options, user) {
      const url = String(href);
      const table = url.includes('/study_items')
        ? 'study_items'
        : url.includes('/study_progress')
          ? 'study_progress'
          : url.includes('/profiles')
            ? 'profiles'
            : null;
      if (!table) return jsonRes(404, { message: 'not found' });
      const params = parseQuery(url);
      const prefer = String(options.headers?.Prefer || options.headers?.prefer || '');
      const body = options.body ? JSON.parse(options.body) : null;
      const rows = tableRows(table);

      if (table === 'profiles') {
        return jsonRes(200, [{ id: user.id, email: user.email || null }]);
      }

      if (method === 'GET') {
        const matched = sortRows(rows.filter((row) => row.user_id === user.id && matchesFilters(row, params)), params);
        const limit = Number(param(params, 'limit') || matched.length);
        if (prefer.includes('count=exact')) {
          return jsonRes(200, matched.slice(0, 1), { 'content-range': `0-0/${matched.length}` });
        }
        return jsonRes(200, matched.slice(0, limit), { 'content-range': `0-${Math.max(0, matched.length - 1)}/${matched.length}` });
      }

      if (method === 'POST' && prefer.includes('merge-duplicates')) {
        const conflict = (param(params, 'on_conflict') || '').split(',');
        const existing = rows.find((row) => conflict.every((key) => String(row[key]) === String(body[key])));
        if (existing && existing.user_id !== user.id) {
          return jsonRes(401, { message: 'RLS' });
        }
        if (body.user_id !== user.id) return jsonRes(401, { message: 'RLS' });
        const stamp = nowIso();
        if (existing) {
          Object.assign(existing, body, { updated_at: stamp });
          return jsonRes(200, [existing]);
        }
        const created = {
          id: nextId(),
          created_at: stamp,
          updated_at: stamp,
          title: '',
          href: '',
          note: '',
          tags: [],
          payload: {},
          ...body
        };
        rows.push(created);
        return jsonRes(201, [created]);
      }

      if (method === 'POST') {
        if (body.user_id !== user.id) return jsonRes(401, { message: 'RLS' });
        const stamp = nowIso();
        const created = {
          id: nextId(),
          created_at: stamp,
          updated_at: stamp,
          title: '',
          href: '',
          note: '',
          tags: [],
          payload: {},
          ...body
        };
        rows.push(created);
        return jsonRes(201, [created]);
      }

      if (method === 'DELETE') {
        const matched = rows.filter((row) => row.user_id === user.id && matchesFilters(row, params));
        matched.forEach((row) => {
          const index = rows.indexOf(row);
          if (index >= 0) rows.splice(index, 1);
        });
        return jsonRes(200, matched);
      }

      return jsonRes(405, { message: 'method' });
    }
  };
}

function bearerToken(options) {
  const header = options.headers?.Authorization || options.headers?.authorization || '';
  return String(header).replace(/^Bearer\s+/i, '').trim();
}

function installStudyMock(store, users) {
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const method = String(options.method || 'GET').toUpperCase();
    const token = bearerToken(options);
    if (method === 'GET' && href.endsWith('/user')) {
      const user = users[token];
      if (!user) return jsonRes(401, { message: 'expired' });
      return jsonRes(200, user);
    }
    if (href.includes('/rest/v1/')) {
      const user = users[token];
      if (!user) return jsonRes(401, { message: 'expired' });
      return store.handle(href, method, options, user);
    }
    throw new Error(`Unexpected fetch ${method} ${href}`);
  };
}

async function withStudyEnv(fn) {
  restoreEnv();
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    NETLIFY_DEV: 'true',
    AUTH_SITE_URL: 'https://atomurus.com'
  });
  const users = demoUsers();
  const store = createStudyStore();
  installStudyMock(store, users);
  try {
    await fn({ store, users });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
}

assert.throws(() => assertNoClientUserId({ user_id: 'other' }));
assert.throws(() => safeStudyHref('https://evil.example'));
assert.equal(safeStudyHref('/periodic-table/aurum'), '/periodic-table/aurum');
assert.equal(normalizeTags(['Lab', 'lab', '  ']).join(','), 'Lab');
assert.equal(publicStudyItem({
  id: '1',
  item_type: 'element',
  item_key: 'aurum',
  title: '<b>x</b>',
  href: '/periodic-table/aurum',
  note: '<img src=x onerror=alert(1)>',
  tags: ['lab'],
  payload: {},
  created_at: 't',
  updated_at: 't'
}).note, '<img src=x onerror=alert(1)>');
assert.equal(STUDY_LIMITS.note, 5000);

await withStudyEnv(async () => {
  const unsigned = await overviewHandler(cookieRequest('https://atomurus.com/api/study/overview'));
  const unsignedJson = await readJson(unsigned);
  assert.equal(unsigned.status, 401);
  assert.equal(unsignedJson.code, 'session_expired');
  assertPrivate(unsigned, unsignedJson);
});

await withStudyEnv(async () => {
  const free = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-free'),
    body: { itemType: 'element', itemKey: 'aurum', title: 'Gold' }
  }));
  const freeJson = await readJson(free);
  assert.equal(free.status, 403);
  assert.equal(freeJson.code, 'feature_locked');
  assert.equal(freeJson.feature, 'studyCloud');
  assert.equal(freeJson.upgradeUrl, '/pricing');
  assertPrivate(free, freeJson);
});

await withStudyEnv(async ({ store }) => {
  for (const token of ['access-pro-a', 'access-trial', 'access-admin']) {
    const saved = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
      method: 'PUT',
      cookies: sessionCookie(token),
      body: { itemType: 'element', itemKey: `key-${token}`, title: 'Saved', href: '/periodic-table/aurum' }
    }));
    const json = await readJson(saved);
    assert.equal(saved.status, 200, token);
    assert.equal(json.ok, true);
    assert.ok(json.item.id);
    assertPrivate(saved, json);
  }
  assert.equal(store.items.length, 3);
});

await withStudyEnv(async () => {
  const savedA = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'aurum', title: 'Alice gold', note: 'private-a' }
  }));
  const aJson = await readJson(savedA);
  await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-b'),
    body: { itemType: 'element', itemKey: 'aurum', title: 'Bob gold', note: 'private-b' }
  }));

  const listB = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items', {
    cookies: sessionCookie('access-pro-b')
  }));
  const listBJson = await readJson(listB);
  assert.equal(listBJson.items.length, 1);
  assert.equal(listBJson.items[0].note, 'private-b');
  assert.equal(listBJson.items[0].title, 'Bob gold');

  const steal = await itemHandler(cookieRequest(`https://atomurus.com/api/study/item?id=${aJson.item.id}`, {
    method: 'DELETE',
    cookies: sessionCookie('access-pro-b')
  }));
  assert.equal(steal.status, 404);

  const listA = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items', {
    cookies: sessionCookie('access-pro-a')
  }));
  const listAJson = await readJson(listA);
  assert.equal(listAJson.items.length, 1);
  assert.equal(listAJson.items[0].note, 'private-a');
});

await withStudyEnv(async () => {
  const rejected = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'aurum', user_id: 'user-b', title: 'steal' }
  }));
  const rejectedJson = await readJson(rejected);
  assert.equal(rejected.status, 400);
  assert.equal(rejectedJson.code, 'invalid_request');

  const saved = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'aurum', title: 'Gold' }
  }));
  const savedJson = await readJson(saved);
  assert.equal(savedJson.item.itemKey, 'aurum');
  const overview = await overviewHandler(cookieRequest('https://atomurus.com/api/study/overview', {
    cookies: sessionCookie('access-pro-a')
  }));
  const overviewJson = await readJson(overview);
  assert.equal(overviewJson.recentItems[0].itemKey, 'aurum');
  assert.equal(overviewJson.counts.element, 1);
});

await withStudyEnv(async () => {
  const xss = '<script>alert(1)</script><img src=x onerror=alert(1)>';
  const saved = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'article', itemKey: 'atom', title: xss, note: xss, tags: [xss.slice(0, 32)] }
  }));
  const json = await readJson(saved);
  assert.equal(saved.status, 200);
  assert.equal(json.item.note, xss);
  assert.equal(json.item.title, xss);
  assert.equal(typeof json.item.note, 'string');
  assertPrivate(saved, json);
});

await withStudyEnv(async () => {
  const tooLongNote = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'h', note: 'n'.repeat(5001) }
  }));
  assert.equal(tooLongNote.status, 400);

  const hugeTitle = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'h', title: 't'.repeat(200) }
  }));
  assert.equal(hugeTitle.status, 400);

  const hugePayload = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'h', payload: { blob: 'x'.repeat(9000) } }
  }));
  assert.equal(hugePayload.status, 413);

  const manyTags = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'h', tags: Array.from({ length: 100 }, (_, i) => `t${i}`) }
  }));
  assert.equal(manyTags.status, 400);

  const badType = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'podcast', itemKey: 'h' }
  }));
  assert.equal(badType.status, 400);

  const external = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'h', href: 'https://evil.example/phish' }
  }));
  assert.equal(external.status, 400);

  const malformed = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: '{not-json'
  }));
  assert.equal(malformed.status, 400);

  const tooBig = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: JSON.stringify({ itemType: 'element', itemKey: 'h', note: 'n'.repeat(33000) })
  }));
  assert.equal(tooBig.status, 413);
});

await withStudyEnv(async () => {
  const saved = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'molecule', itemKey: 'water', title: 'Water', note: 'keep-me' }
  }));
  assert.equal(saved.status, 200);

  const cancelled = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items', {
    cookies: sessionCookie('access-cancelled')
  }));
  const cancelledJson = await readJson(cancelled);
  assert.equal(cancelled.status, 403);
  assert.equal(cancelledJson.code, 'feature_locked');

  const restored = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items', {
    cookies: sessionCookie('access-pro-a')
  }));
  const restoredJson = await readJson(restored);
  assert.equal(restored.status, 200);
  assert.equal(restoredJson.items.length, 1);
  assert.equal(restoredJson.items[0].note, 'keep-me');
});

await withStudyEnv(async () => {
  const run = await historyHandler(cookieRequest('https://atomurus.com/api/study/calculator-history', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { calculator: 'molar', title: 'H2O', result: '18.015', href: '/calculators' }
  }));
  const runJson = await readJson(run);
  assert.equal(run.status, 200);
  assert.match(runJson.item.itemKey, /^run_/);
  assert.equal(runJson.item.itemType, 'calculator');
  assert.equal(runJson.item.payload.result, '18.015');

  const tagged = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'n', title: 'N', tags: ['lab'], note: 'noted' }
  }));
  assert.equal(tagged.status, 200);

  const byTag = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items?tag=lab', {
    cookies: sessionCookie('access-pro-a')
  }));
  const byTagJson = await readJson(byTag);
  assert.equal(byTagJson.items.length, 1);

  const notes = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items?hasNote=1', {
    cookies: sessionCookie('access-pro-a')
  }));
  const notesJson = await readJson(notes);
  assert.equal(notesJson.items.length, 1);

  const progress = await progressHandler(cookieRequest('https://atomurus.com/api/study/progress', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { contentType: 'article', contentKey: 'what-is-an-atom', progress: 40, lastPosition: '/explore/what-is-an-atom' }
  }));
  const progressJson = await readJson(progress);
  assert.equal(progress.status, 200);
  assert.equal(progressJson.progress.status, 'in_progress');
  assertPrivate(progress, progressJson);

  const dash = await dashboardHandler(cookieRequest('https://atomurus.com/api/private/dashboard', {
    cookies: sessionCookie('access-pro-a')
  }));
  const dashJson = await readJson(dash);
  const library = dashJson.dashboard.modules.find((item) => item.id === 'study-library');
  assert.equal(library.state, 'available');

  const listed = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items?limit=40', {
    cookies: sessionCookie('access-pro-a')
  }));
  const listedJson = await readJson(listed);
  assert.ok(listedJson.items.some((item) => item.itemType === 'calculator'));
  assert.ok(listedJson.items.some((item) => item.itemType === 'element'));

  const libraryOnly = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items?exclude=calculator&limit=40', {
    cookies: sessionCookie('access-pro-a')
  }));
  const libraryOnlyJson = await readJson(libraryOnly);
  assert.equal(libraryOnly.status, 200);
  assert.ok(libraryOnlyJson.items.length >= 1);
  assert.equal(libraryOnlyJson.items.some((item) => item.itemType === 'calculator'), false);
  assert.ok(libraryOnlyJson.items.every((item) => item.itemType === 'element' || item.itemType === 'molecule' || item.itemType === 'article'));

  const byKey = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items?type=element&itemKey=n', {
    cookies: sessionCookie('access-pro-a')
  }));
  const byKeyJson = await readJson(byKey);
  assert.equal(byKey.status, 200);
  assert.equal(byKeyJson.items.length, 1);
  assert.equal(byKeyJson.items[0].itemKey, 'n');
  assert.equal(byKeyJson.items[0].itemType, 'element');

  const missingKey = await itemsHandler(cookieRequest('https://atomurus.com/api/study/items?itemKey=does-not-exist', {
    cookies: sessionCookie('access-pro-a')
  }));
  const missingKeyJson = await readJson(missingKey);
  assert.equal(missingKeyJson.items.length, 0);
});

const studyClient = readFileSync(new URL('../study-client.js', import.meta.url), 'utf8');
assert.doesNotMatch(studyClient, /\/api\/auth\/me/);
assert.doesNotMatch(studyClient, /localStorage|sessionStorage|BroadcastChannel/);
assert.doesNotMatch(studyClient, /SERVICE_ROLE|service_role|withRefresh/);
assert.match(studyClient, /\/api\/study\/overview/);

const studySave = readFileSync(new URL('../study-save.js', import.meta.url), 'utf8');
assert.doesNotMatch(studySave, /innerHTML/);
assert.doesNotMatch(studySave, /\/api\/auth\/me/);
assert.doesNotMatch(studySave, /SERVICE_ROLE|service_role/);
assert.doesNotMatch(studySave, /querySelector\(['"]\[data-mol\]['"]\)/);
assert.match(studySave, /\/viewer\/molecules/);
assert.match(studySave, /\.calc-panel/);
assert.match(studySave, /insertBefore\(host, panel\.firstChild\)/);

const studyBoot = readFileSync(new URL('../study-boot.js', import.meta.url), 'utf8');
assert.match(studyBoot, /onload/);
assert.match(studyBoot, /study-client\.js/);
assert.match(studyBoot, /study-save\.js/);
assert.match(studyBoot, /study-progress\.js/);

const studyProgress = readFileSync(new URL('../study-progress.js', import.meta.url), 'utf8');
assert.match(studyProgress, /feature_locked/);
assert.match(studyProgress, /session_expired/);

const authApp = readFileSync(new URL('../auth-app.js', import.meta.url), 'utf8');
assert.match(authApp, /\/api\/study\/overview|api\.overview/);
assert.match(authApp, /exclude:\s*'calculator'/);
assert.doesNotMatch(authApp, /startRefreshTimer\s*\(/);

console.log('study-cloud tests passed');
