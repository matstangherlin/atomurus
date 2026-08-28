import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_EASE,
  MASTERED_INTERVAL_DAYS,
  MAX_EASE,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  MIN_INTERVAL_DAYS,
  scheduleReview,
  SchedulerError
} from '../netlify/lib/review-scheduler.mjs';
import { generateCanonicalCards, lookupElement, lookupMolecule } from '../netlify/lib/canonical-catalog.mjs';
import { STUDY_SET_LIMITS } from '../netlify/lib/study-sets.mjs';
import setsHandler from '../netlify/functions/study-sets.mjs';
import setHandler from '../netlify/functions/study-set.mjs';
import setItemHandler from '../netlify/functions/study-set-item.mjs';
import cardHandler from '../netlify/functions/study-card.mjs';
import generateHandler from '../netlify/functions/study-cards-generate.mjs';
import overviewHandler from '../netlify/functions/study-review-overview.mjs';
import queueHandler from '../netlify/functions/study-review-queue.mjs';
import reviewHandler from '../netlify/functions/study-review.mjs';
import itemHandler from '../netlify/functions/study-item.mjs';
import dashboardHandler from '../netlify/functions/private-dashboard.mjs';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const FIXED_NOW = '2026-08-28T12:00:00.000Z';

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

function assertPrivate(res, json) {
  assert.match(res.headers.get('Cache-Control') || '', /no-store/);
  const text = JSON.stringify(json);
  assert.doesNotMatch(text, /accessToken|access_token|"eyJ/);
  assert.equal(cookieHeadersOf(res).some((header) => header.includes('Max-Age=0')), false);
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

function compareBound(row, key, op, bound) {
  const left = row[key];
  if (key.endsWith('_at')) {
    const a = String(left || '');
    if (op === 'lte') return a <= bound;
    if (op === 'gte') return a >= bound;
    if (op === 'lt') return a < bound;
    return false;
  }
  const n = Number(left);
  const m = Number(bound);
  if (op === 'lte') return n <= m;
  if (op === 'gte') return n >= m;
  if (op === 'lt') return n < m;
  return false;
}

function matchesFilters(row, params) {
  for (const [key, raw] of params) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'on_conflict') continue;
    if (key === 'and') continue;
    const inMatch = /^in\.\((.*)\)$/.exec(raw);
    if (inMatch) {
      const values = inMatch[1].split(',').map((value) => value.trim());
      if (!values.includes(String(row[key]))) return false;
      continue;
    }
    const eq = /^eq\.(.*)$/.exec(raw);
    const neq = /^neq\.(.*)$/.exec(raw);
    const lt = /^lt\.(.*)$/.exec(raw);
    const lte = /^lte\.(.*)$/.exec(raw);
    const gte = /^gte\.(.*)$/.exec(raw);
    if (eq && String(row[key]) !== eq[1]) return false;
    if (neq && String(row[key]) === neq[1]) return false;
    if (lt && !compareBound(row, key, 'lt', lt[1])) return false;
    if (lte && !compareBound(row, key, 'lte', lte[1])) return false;
    if (gte && !compareBound(row, key, 'gte', gte[1])) return false;
  }
  return true;
}

function sortRows(rows, params) {
  const order = param(params, 'order') || '';
  const copy = [...rows];
  if (order.includes('due_at.asc')) {
    return copy.sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)) || String(a.id).localeCompare(String(b.id)));
  }
  if (order.includes('created_at.desc')) {
    return copy.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || String(b.id).localeCompare(String(a.id)));
  }
  if (order.includes('updated_at.desc')) {
    return copy.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || String(b.id).localeCompare(String(a.id)));
  }
  if (order.includes('reviewed_at.desc')) {
    return copy.sort((a, b) => String(b.reviewed_at).localeCompare(String(a.reviewed_at)) || String(b.id).localeCompare(String(a.id)));
  }
  return copy;
}

function createReviewStore() {
  const tables = {
    study_items: [],
    study_sets: [],
    study_set_items: [],
    study_cards: [],
    study_review_events: [],
    study_progress: []
  };
  let seq = 0;
  function nextId() {
    seq += 1;
    return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
  }
  function cardDefaults(body, stamp) {
    return {
      id: nextId(),
      source_item_id: null,
      card_type: 'manual',
      template_key: 'manual',
      due_at: stamp,
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      lapses: 0,
      review_state: 'new',
      version: 1,
      suspended: false,
      created_at: stamp,
      updated_at: stamp,
      ...body
    };
  }
  return {
    tables,
    handle(href, method, options, user) {
      const url = String(href);
      if (url.includes('/rpc/apply_study_review')) {
        const args = options.body ? JSON.parse(options.body) : {};
        const existing = tables.study_review_events.find(
          (row) => row.user_id === user.id && row.client_event_id === args.p_client_event_id
        );
        if (existing) {
          const card = tables.study_cards.find((row) => row.id === existing.card_id && row.user_id === user.id) || null;
          return jsonRes(200, { ok: true, idempotent: true, eventId: existing.id, card });
        }
        const card = tables.study_cards.find((row) => row.id === args.p_card_id && row.user_id === user.id);
        if (!card) return jsonRes(400, { code: 'P0001', message: 'not_found' });
        if (card.suspended) return jsonRes(400, { code: 'P0003', message: 'card_suspended' });
        if (Number(card.version) !== Number(args.p_expected_version)) {
          return jsonRes(400, { code: 'P0002', message: 'review_conflict' });
        }
        const stamp = args.p_reviewed_at || new Date().toISOString();
        const event = {
          id: nextId(),
          user_id: user.id,
          card_id: card.id,
          client_event_id: args.p_client_event_id,
          rating: args.p_rating,
          previous_interval: args.p_previous_interval,
          next_interval: args.p_interval_days,
          previous_ease: args.p_previous_ease,
          next_ease: args.p_ease_factor,
          reviewed_at: stamp
        };
        tables.study_review_events.push(event);
        Object.assign(card, {
          due_at: args.p_due_at,
          interval_days: args.p_interval_days,
          ease_factor: args.p_ease_factor,
          repetitions: args.p_repetitions,
          lapses: args.p_lapses,
          review_state: args.p_review_state,
          version: card.version + 1,
          updated_at: stamp
        });
        return jsonRes(200, { ok: true, idempotent: false, eventId: event.id, card });
      }

      const table = [
        'study_review_events',
        'study_set_items',
        'study_cards',
        'study_sets',
        'study_items',
        'study_progress',
        'profiles'
      ].find((name) => url.includes(`/${name}`));
      if (!table) return jsonRes(404, { message: 'not found' });
      if (table === 'profiles') return jsonRes(200, [{ id: user.id, email: user.email || null }]);

      const params = parseQuery(url);
      const prefer = String(options.headers?.Prefer || options.headers?.prefer || '');
      const body = options.body ? JSON.parse(options.body) : null;
      const rows = tables[table];
      const stamp = new Date().toISOString();

      if (method === 'GET') {
        const matched = sortRows(rows.filter((row) => row.user_id === user.id && matchesFilters(row, params)), params);
        const limit = Number(param(params, 'limit') || matched.length);
        if (prefer.includes('count=exact')) {
          return jsonRes(200, matched.slice(0, 1), { 'content-range': `0-0/${matched.length}` });
        }
        return jsonRes(200, matched.slice(0, limit), {
          'content-range': `0-${Math.max(0, matched.length - 1)}/${matched.length}`
        });
      }

      if (method === 'POST' && prefer.includes('merge-duplicates')) {
        if (body.user_id && body.user_id !== user.id) return jsonRes(401, { message: 'RLS' });
        const conflict = (param(params, 'on_conflict') || 'id').split(',');
        const existing = rows.find((row) => conflict.every((key) => String(row[key]) === String(body[key])));
        if (existing) {
          Object.assign(existing, body, { updated_at: stamp });
          return jsonRes(200, [existing]);
        }
        const created = table === 'study_items'
          ? {
              id: nextId(),
              created_at: stamp,
              updated_at: stamp,
              title: '',
              href: '',
              note: '',
              tags: [],
              payload: {},
              ...body
            }
          : { id: body.id || nextId(), created_at: stamp, updated_at: stamp, ...body };
        rows.push(created);
        return jsonRes(200, [created]);
      }

      if (method === 'POST') {
        const payloads = Array.isArray(body) ? body : [body];
        const created = [];
        for (const item of payloads) {
          if (item.user_id !== user.id) return jsonRes(401, { message: 'RLS' });
          if (table === 'study_cards') {
            const set = tables.study_sets.find((row) => row.id === item.study_set_id);
            if (!set || set.user_id !== user.id) return jsonRes(409, { code: '23503', message: 'fk' });
            if (item.source_item_id) {
              const dup = rows.find((row) => (
                row.study_set_id === item.study_set_id
                && row.source_item_id === item.source_item_id
                && row.template_key === item.template_key
                && item.template_key !== 'manual'
              ));
              if (dup) return jsonRes(409, { code: '23505', message: 'duplicate generated card' });
            }
            created.push(cardDefaults(item, stamp));
          } else if (table === 'study_set_items') {
            const set = tables.study_sets.find((row) => row.id === item.study_set_id);
            const lib = tables.study_items.find((row) => row.id === item.item_id);
            if (!set || set.user_id !== user.id || !lib || lib.user_id !== user.id) {
              return jsonRes(409, { code: '23503', message: 'fk' });
            }
            const dup = rows.find((row) => row.study_set_id === item.study_set_id && row.item_id === item.item_id);
            if (dup) {
              created.push(dup);
              continue;
            }
            created.push({ id: nextId(), created_at: stamp, ...item });
          } else if (table === 'study_sets') {
            created.push({
              id: nextId(),
              description: '',
              archived_at: null,
              created_at: stamp,
              updated_at: stamp,
              ...item
            });
          } else if (table === 'study_items') {
            created.push({
              id: nextId(),
              created_at: stamp,
              updated_at: stamp,
              title: '',
              href: '',
              note: '',
              tags: [],
              payload: {},
              ...item
            });
          } else {
            created.push({ id: nextId(), created_at: stamp, ...item });
          }
          rows.push(created[created.length - 1]);
        }
        return jsonRes(201, created);
      }

      if (method === 'PATCH') {
        const matched = rows.filter((row) => row.user_id === user.id && matchesFilters(row, params));
        matched.forEach((row) => Object.assign(row, body, { updated_at: stamp }));
        return jsonRes(200, matched);
      }

      if (method === 'DELETE') {
        const matched = rows.filter((row) => row.user_id === user.id && matchesFilters(row, params));
        matched.forEach((row) => {
          const index = rows.indexOf(row);
          if (index >= 0) rows.splice(index, 1);
          if (table === 'study_sets') {
            tables.study_cards = tables.study_cards.filter((card) => card.study_set_id !== row.id);
            tables.study_set_items = tables.study_set_items.filter((link) => link.study_set_id !== row.id);
          }
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

function installMock(store, users) {
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

async function withEnv(fn) {
  restoreEnv();
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    NETLIFY_DEV: 'true',
    AUTH_SITE_URL: 'https://atomurus.com'
  });
  const users = demoUsers();
  const store = createReviewStore();
  installMock(store, users);
  try {
    await fn({ store, users });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
}

const now = new Date(FIXED_NOW);
const fresh = { easeFactor: DEFAULT_EASE, intervalDays: 0, repetitions: 0, lapses: 0, reviewState: 'new' };
const goodNew = scheduleReview(fresh, 'good', now);
assert.equal(goodNew.intervalDays, 1);
assert.equal(goodNew.repetitions, 1);
assert.equal(goodNew.reviewState, 'review');
assert.ok(Number.isFinite(Date.parse(goodNew.dueAt)));

const easyNew = scheduleReview(fresh, 'easy', now);
assert.ok(easyNew.intervalDays > goodNew.intervalDays);

const again = scheduleReview({ ...fresh, repetitions: 3, intervalDays: 10, lapses: 1, reviewState: 'review' }, 'again', now);
assert.equal(again.lapses, 2);
assert.equal(again.repetitions, 0);
assert.ok(again.intervalDays <= 1);
assert.ok(again.intervalDays >= MIN_INTERVAL_DAYS - 1e-9);
assert.equal(again.reviewState, 'learning');

const floor = scheduleReview({ easeFactor: MIN_EASE, intervalDays: 1, repetitions: 0, lapses: 0, reviewState: 'review' }, 'again', now);
assert.ok(floor.easeFactor >= MIN_EASE);

let easyState = { ...fresh };
for (let i = 0; i < 80; i += 1) {
  const scheduled = scheduleReview(easyState, 'easy', now);
  easyState = {
    easeFactor: scheduled.easeFactor,
    intervalDays: scheduled.intervalDays,
    repetitions: scheduled.repetitions,
    lapses: scheduled.lapses,
    reviewState: scheduled.reviewState
  };
}
assert.ok(easyState.intervalDays <= MAX_INTERVAL_DAYS);
assert.ok(easyState.easeFactor <= MAX_EASE);
assert.ok(Number.isFinite(easyState.intervalDays));
assert.ok(Number.isFinite(Date.parse(scheduleReview(easyState, 'easy', now).dueAt)));

assert.throws(() => scheduleReview(fresh, 'maybe', now), (err) => err instanceof SchedulerError && err.status === 400);

const normalized = scheduleReview({ easeFactor: 'nope', intervalDays: -4, repetitions: 'x', lapses: null, reviewState: 'weird' }, 'good', now);
assert.equal(normalized.intervalDays, 1);
assert.ok(normalized.easeFactor >= MIN_EASE);

assert.ok(MASTERED_INTERVAL_DAYS >= 21);

const iron = lookupElement('ferrum');
assert.ok(iron);
assert.equal(iron.sym, 'Fe');
assert.equal(iron.z, 26);
assert.equal(iron.enName, 'Iron');
const ironCards = generateCanonicalCards('element', 'ferrum');
assert.ok(ironCards.some((card) => card.templateKey === 'element_symbol' && card.back === 'Fe'));
assert.ok(ironCards.some((card) => card.templateKey === 'element_atomic_number' && card.back === '26'));
assert.equal(generateCanonicalCards('element', 'ferrum').length, generateCanonicalCards('element', '26').length);

const water = lookupMolecule('water');
assert.ok(water);
assert.match(water.formula, /H₂O|H2O/);
const waterCards = generateCanonicalCards('molecule', 'water');
assert.equal(waterCards.length, 2);
assert.equal(generateCanonicalCards('article', 'what-is-an-atom').length, 0);
assert.equal(generateCanonicalCards('calculator', 'run_1').length, 0);
assert.equal(STUDY_SET_LIMITS.maxSets, 50);
assert.equal(STUDY_SET_LIMITS.maxCards, 5000);

await withEnv(async () => {
  const unsigned = await setsHandler(cookieRequest('https://atomurus.com/api/study/sets'));
  const unsignedJson = await readJson(unsigned);
  assert.equal(unsigned.status, 401);
  assertPrivate(unsigned, unsignedJson);
});

await withEnv(async () => {
  const free = await overviewHandler(cookieRequest('https://atomurus.com/api/study/review/overview', {
    cookies: sessionCookie('access-free')
  }));
  const freeJson = await readJson(free);
  assert.equal(free.status, 403);
  assert.equal(freeJson.code, 'feature_locked');
  assert.equal(freeJson.feature, 'smartReview');
  assert.equal(freeJson.upgradeUrl, '/pricing');
  assertPrivate(free, freeJson);
});

await withEnv(async () => {
  for (const token of ['access-trial', 'access-pro-a', 'access-admin']) {
    const created = await setsHandler(cookieRequest('https://atomurus.com/api/study/sets', {
      method: 'POST',
      cookies: sessionCookie(token),
      body: { title: `Set ${token}` }
    }));
    const json = await readJson(created);
    assert.equal(created.status, 200, token);
    assert.equal(json.ok, true);
    assertPrivate(created, json);
  }
});

await withEnv(async () => {
  const created = await setsHandler(cookieRequest('https://atomurus.com/api/study/sets', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { title: 'Alice set', user_id: 'user-b' }
  }));
  const json = await readJson(created);
  assert.equal(created.status, 400);
  assert.equal(json.code, 'invalid_request');
});

await withEnv(async ({ store }) => {
  const created = await setsHandler(cookieRequest('https://atomurus.com/api/study/sets', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { title: 'Periodic Trends' }
  }));
  const json = await readJson(created);
  const steal = await setHandler(cookieRequest(`https://atomurus.com/api/study/set?id=${json.set.id}`, {
    cookies: sessionCookie('access-pro-b')
  }));
  assert.equal(steal.status, 404);
  const update = await setHandler(cookieRequest('https://atomurus.com/api/study/set', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-b'),
    body: { id: json.set.id, title: 'Hijacked' }
  }));
  assert.equal(update.status, 404);
  const remove = await setHandler(cookieRequest(`https://atomurus.com/api/study/set?id=${json.set.id}`, {
    method: 'DELETE',
    cookies: sessionCookie('access-pro-b')
  }));
  assert.equal(remove.status, 404);
  const card = await cardHandler(cookieRequest('https://atomurus.com/api/study/card', {
    method: 'POST',
    cookies: sessionCookie('access-pro-b'),
    body: { setId: json.set.id, front: 'x', back: 'y' }
  }));
  assert.equal(card.status, 404);
  assert.equal(store.tables.study_sets.length, 1);
  assert.equal(store.tables.study_cards.length, 0);
});

await withEnv(async ({ store }) => {
  const saved = await itemHandler(cookieRequest('https://atomurus.com/api/study/item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { itemType: 'element', itemKey: 'ferrum', title: 'Iron', payload: { sym: 'XX', z: 999 } }
  }));
  const itemJson = await readJson(saved);
  const set = await setsHandler(cookieRequest('https://atomurus.com/api/study/sets', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { title: 'ENEM — Química' }
  }));
  const setJson = await readJson(set);
  const linked = await setItemHandler(cookieRequest('https://atomurus.com/api/study/set-item', {
    method: 'PUT',
    cookies: sessionCookie('access-pro-a'),
    body: { setId: setJson.set.id, itemId: itemJson.item.id }
  }));
  const linkedJson = await readJson(linked);
  assert.equal(linked.status, 200);
  assert.equal(linkedJson.setTitle, 'ENEM — Química');

  const generated = await generateHandler(cookieRequest('https://atomurus.com/api/study/cards/generate', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { setId: setJson.set.id, itemId: itemJson.item.id }
  }));
  const generatedJson = await readJson(generated);
  assert.equal(generated.status, 200);
  assert.ok(generatedJson.created >= 3);
  assert.ok(generatedJson.cards.every((card) => card.back !== 'XX'));
  assert.ok(generatedJson.cards.some((card) => card.back === 'Fe'));

  const againGen = await generateHandler(cookieRequest('https://atomurus.com/api/study/cards/generate', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { setId: setJson.set.id, itemId: itemJson.item.id }
  }));
  const againJson = await readJson(againGen);
  assert.equal(againJson.created, 0);
  assert.ok(againJson.skipped >= 3);
  assert.equal(store.tables.study_cards.length, generatedJson.created);

  const xss = await cardHandler(cookieRequest('https://atomurus.com/api/study/card', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      setId: setJson.set.id,
      front: '<img src=x onerror=alert(1)>',
      back: '<script>alert(1)</script>'
    }
  }));
  const xssJson = await readJson(xss);
  assert.equal(xss.status, 200);
  assert.equal(xssJson.card.front, '<img src=x onerror=alert(1)>');
  assert.equal(xssJson.card.back, '<script>alert(1)</script>');

  const queue = await queueHandler(cookieRequest(`https://atomurus.com/api/study/review/queue?setId=${setJson.set.id}`, {
    cookies: sessionCookie('access-pro-a')
  }));
  const queueJson = await readJson(queue);
  assert.equal(queue.status, 200);
  assert.ok(queueJson.cards.length >= 1);
  const first = queueJson.cards[0];

  const eventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const reviewed = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: first.id,
      rating: 'good',
      clientEventId: eventId,
      expectedVersion: first.version,
      dueAt: '2099-01-01T00:00:00.000Z',
      intervalDays: 999999,
      easeFactor: 99
    }
  }));
  const reviewedJson = await readJson(reviewed);
  assert.equal(reviewed.status, 200);
  assert.equal(reviewedJson.idempotent, false);
  assert.notEqual(reviewedJson.card.dueAt, '2099-01-01T00:00:00.000Z');
  assert.ok(reviewedJson.card.intervalDays < 100);
  assert.ok(reviewedJson.card.easeFactor <= MAX_EASE);
  assert.equal(reviewedJson.card.version, first.version + 1);

  const replay = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: first.id,
      rating: 'good',
      clientEventId: eventId,
      expectedVersion: first.version
    }
  }));
  const replayJson = await readJson(replay);
  assert.equal(replay.status, 200);
  assert.equal(replayJson.idempotent, true);
  assert.equal(store.tables.study_review_events.length, 1);
  assert.equal(store.tables.study_cards.find((row) => row.id === first.id).version, first.version + 1);

  const conflict = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: first.id,
      rating: 'easy',
      clientEventId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      expectedVersion: first.version
    }
  }));
  const conflictJson = await readJson(conflict);
  assert.equal(conflict.status, 409);
  assert.equal(conflictJson.code, 'review_conflict');
  assert.equal(store.tables.study_review_events.length, 1);

  const invalidRating = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: first.id,
      rating: 'perfect',
      clientEventId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      expectedVersion: first.version + 1
    }
  }));
  assert.equal(invalidRating.status, 400);

  const stats = await overviewHandler(cookieRequest('https://atomurus.com/api/study/review/overview', {
    cookies: sessionCookie('access-pro-a')
  }));
  const statsJson = await readJson(stats);
  assert.equal(stats.status, 200);
  assert.ok('dueNow' in statsJson);
  assert.ok('newCards' in statsJson);
  assert.ok('totalCards' in statsJson);
  assert.ok('masteredCards' in statsJson);
  assert.ok('reviewsLast7Days' in statsJson);
  assert.ok(Array.isArray(statsJson.sets));

  const cancelled = await queueHandler(cookieRequest('https://atomurus.com/api/study/review/queue', {
    cookies: sessionCookie('access-cancelled')
  }));
  const cancelledJson = await readJson(cancelled);
  assert.equal(cancelled.status, 403);
  assert.equal(cancelledJson.code, 'feature_locked');
  assert.equal(store.tables.study_cards.length >= 3, true);
  assert.equal(store.tables.study_review_events.length, 1);

  const restored = await overviewHandler(cookieRequest('https://atomurus.com/api/study/review/overview', {
    cookies: sessionCookie('access-pro-a')
  }));
  const restoredJson = await readJson(restored);
  assert.equal(restored.status, 200);
  assert.equal(restoredJson.totalCards, store.tables.study_cards.length);
  assert.equal(restoredJson.reviewsLast7Days, 1);

  const dash = await dashboardHandler(cookieRequest('https://atomurus.com/api/private/dashboard', {
    cookies: sessionCookie('access-pro-a')
  }));
  const dashJson = await readJson(dash);
  assert.equal(dashJson.dashboard.modules.find((item) => item.id === 'study-sets').state, 'available');
  assert.equal(dashJson.dashboard.modules.find((item) => item.id === 'smart-review').state, 'available');

  const deleted = await setHandler(cookieRequest(`https://atomurus.com/api/study/set?id=${setJson.set.id}`, {
    method: 'DELETE',
    cookies: sessionCookie('access-pro-a')
  }));
  assert.equal(deleted.status, 200);
  assert.equal(store.tables.study_sets.length, 0);
  assert.equal(store.tables.study_cards.length, 0);
  assert.equal(store.tables.study_items.length, 1);
});

await withEnv(async ({ store }) => {
  for (let i = 0; i < STUDY_SET_LIMITS.maxSets; i += 1) {
    store.tables.study_sets.push({
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      user_id: 'user-a',
      title: `Set ${i}`,
      description: '',
      created_at: FIXED_NOW,
      updated_at: FIXED_NOW,
      archived_at: null
    });
  }
  const extra = await setsHandler(cookieRequest('https://atomurus.com/api/study/sets', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: { title: 'Overflow' }
  }));
  const extraJson = await readJson(extra);
  assert.equal(extra.status, 409);
  assert.equal(extraJson.code, 'quota_exceeded');
});

const studyClient = readFileSync(new URL('../study-client.js', import.meta.url), 'utf8');
assert.doesNotMatch(studyClient, /\/api\/auth\/me/);
assert.doesNotMatch(studyClient, /localStorage|sessionStorage|IndexedDB/);
assert.match(studyClient, /\/api\/study\/review\/queue/);
assert.match(studyClient, /\/api\/study\/sets/);

const studySave = readFileSync(new URL('../study-save.js', import.meta.url), 'utf8');
assert.doesNotMatch(studySave, /innerHTML/);
assert.match(studySave, /Add to Study Set|addToSet/);
assert.match(studySave, /generateCards/);

const authApp = readFileSync(new URL('../auth-app.js', import.meta.url), 'utf8');
assert.match(authApp, /section=sets/);
assert.match(authApp, /data-review-front/);
assert.match(authApp, /textContent = card\.front/);
assert.match(authApp, /textContent = reviewSession\.revealed \? \(card\.back/);
assert.match(authApp, /crypto\.randomUUID/);
assert.match(authApp, /event\.key === '1'/);
assert.match(authApp, /data-add-to-set/);
assert.match(authApp, /section=review&start=1/);
assert.match(authApp, /nextCursor/);
assert.match(authApp, /Load more/);

const migration = readFileSync(new URL('../supabase/migrations/008_study_sets_smart_review.sql', import.meta.url), 'utf8');
assert.match(migration, /study_sets/);
assert.match(migration, /apply_study_review/);
assert.match(migration, /\(select auth\.uid\(\)\)/);
assert.match(migration, /unique \(user_id, client_event_id\)/);

console.log('review tests passed');
