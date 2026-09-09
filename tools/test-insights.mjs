import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_EASE,
  MASTERED_INTERVAL_DAYS
} from '../netlify/lib/review-scheduler.mjs';
import {
  buildInsightsPayload,
  compareWeakCards,
  needsAttention,
  parseInsightsRange,
  parseInsightsTimezone,
  pickWeakCards,
  weaknessScore
} from '../netlify/lib/study-insights.mjs';
import insightsHandler from '../netlify/functions/study-insights.mjs';
import queueHandler from '../netlify/functions/study-review-queue.mjs';
import reviewHandler from '../netlify/functions/study-review.mjs';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const FIXED_NOW = '2026-08-28T15:00:00.000Z';

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function freezeTime(iso) {
  const frozenMs = Date.parse(iso);
  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(frozenMs);
      else super(...args);
    }
    static now() {
      return frozenMs;
    }
  }
  FrozenDate.parse = RealDate.parse.bind(RealDate);
  FrozenDate.UTC = RealDate.UTC.bind(RealDate);
  globalThis.Date = FrozenDate;
  return () => {
    globalThis.Date = RealDate;
  };
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
  assert.doesNotMatch(text, /accuracy/i);
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
  if (order.includes('lapses.desc')) {
    return copy.sort(compareWeakCards);
  }
  if (order.includes('reviewed_at.asc')) {
    return copy.sort((a, b) => String(a.reviewed_at).localeCompare(String(b.reviewed_at)));
  }
  if (order.includes('due_at.asc')) {
    return copy.sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)) || String(a.id).localeCompare(String(b.id)));
  }
  return copy;
}

function createStore() {
  const tables = {
    study_sets: [],
    study_cards: [],
    study_review_events: []
  };
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
          id: `evt-${tables.study_review_events.length + 1}`,
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

      const table = ['study_review_events', 'study_cards', 'study_sets'].find((name) => url.includes(`/${name}`));
      if (!table) return jsonRes(404, { message: 'not found' });
      const params = parseQuery(url);
      const prefer = String(options.headers?.Prefer || options.headers?.prefer || '');
      const rows = tables[table];
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
  const thaw = freezeTime(FIXED_NOW);
  Object.assign(process.env, {
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    NETLIFY_DEV: 'true',
    AUTH_SITE_URL: 'https://atomurus.com'
  });
  const users = demoUsers();
  const store = createStore();
  installMock(store, users);
  try {
    await fn({ store, users });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
    thaw();
  }
}

const SET_A = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeaaaa';
const SET_B = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeebbbb';
const CARD_A = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const CARD_B = 'cccccccc-dddd-4eee-8fff-000000000000';
const CARD_C = 'dddddddd-eeee-4fff-8000-111111111111';
const CARD_D = 'eeeeeeee-ffff-4000-8000-222222222222';
const CARD_MASTER = 'ffffffff-0000-4000-8000-333333333333';

function seed(store) {
  const stamp = FIXED_NOW;
  store.tables.study_sets.push(
    { id: SET_A, user_id: 'user-a', title: 'Metals', description: '', created_at: stamp, updated_at: stamp, archived_at: null },
    { id: SET_B, user_id: 'user-b', title: 'Bob set', description: '', created_at: stamp, updated_at: stamp, archived_at: null }
  );
  store.tables.study_cards.push(
    {
      id: CARD_A, user_id: 'user-a', study_set_id: SET_A, source_item_id: null,
      front: 'Periodic trend: atomic radius', back: 'Increases down a group',
      card_type: 'manual', template_key: 'manual', due_at: '2026-08-27T12:00:00.000Z',
      interval_days: 0.5, ease_factor: 1.5, repetitions: 0, lapses: 5,
      review_state: 'learning', version: 3, suspended: false, created_at: stamp, updated_at: stamp
    },
    {
      id: CARD_B, user_id: 'user-a', study_set_id: SET_A, source_item_id: null,
      front: 'Symbol for iron', back: 'Fe',
      card_type: 'manual', template_key: 'manual', due_at: '2026-08-28T10:00:00.000Z',
      interval_days: 6, ease_factor: 2.5, repetitions: 2, lapses: 0,
      review_state: 'review', version: 2, suspended: false, created_at: stamp, updated_at: stamp
    },
    {
      id: CARD_C, user_id: 'user-a', study_set_id: SET_A, source_item_id: null,
      front: 'Suspended card', back: 'hidden',
      card_type: 'manual', template_key: 'manual', due_at: '2026-08-20T00:00:00.000Z',
      interval_days: 0.01, ease_factor: 1.3, repetitions: 0, lapses: 9,
      review_state: 'learning', version: 4, suspended: true, created_at: stamp, updated_at: stamp
    },
    {
      id: CARD_MASTER, user_id: 'user-a', study_set_id: SET_A, source_item_id: null,
      front: 'Mastered card', back: 'ok',
      card_type: 'manual', template_key: 'manual', due_at: '2026-09-20T00:00:00.000Z',
      interval_days: MASTERED_INTERVAL_DAYS, ease_factor: 2.6, repetitions: 8, lapses: 0,
      review_state: 'review', version: 5, suspended: false, created_at: stamp, updated_at: stamp
    },
    {
      id: CARD_D, user_id: 'user-b', study_set_id: SET_B, source_item_id: null,
      front: 'Bob only', back: 'secret',
      card_type: 'manual', template_key: 'manual', due_at: '2026-08-28T00:00:00.000Z',
      interval_days: 0.2, ease_factor: 1.4, repetitions: 0, lapses: 8,
      review_state: 'learning', version: 1, suspended: false, created_at: stamp, updated_at: stamp
    }
  );
  store.tables.study_review_events.push(
    { id: 'e1', user_id: 'user-a', card_id: CARD_A, client_event_id: '11111111-1111-4111-8111-111111111111', rating: 'again', reviewed_at: '2026-08-28T11:00:00.000Z' },
    { id: 'e2', user_id: 'user-a', card_id: CARD_A, client_event_id: '22222222-2222-4222-8222-222222222222', rating: 'hard', reviewed_at: '2026-08-27T11:00:00.000Z' },
    { id: 'e3', user_id: 'user-a', card_id: CARD_B, client_event_id: '33333333-3333-4333-8333-333333333333', rating: 'good', reviewed_at: '2026-08-26T11:00:00.000Z' },
    { id: 'e4', user_id: 'user-a', card_id: CARD_B, client_event_id: '44444444-4444-4444-8444-444444444444', rating: 'easy', reviewed_at: '2026-08-10T11:00:00.000Z' },
    { id: 'e5', user_id: 'user-b', card_id: CARD_D, client_event_id: '55555555-5555-4555-8555-555555555555', rating: 'again', reviewed_at: '2026-08-28T11:00:00.000Z' }
  );
}

assert.equal(parseInsightsRange(null), '30d');
assert.equal(parseInsightsRange('7d'), '7d');
assert.throws(() => parseInsightsRange('90d'));
assert.equal(parseInsightsTimezone('America/Sao_Paulo'), 'America/Sao_Paulo');
assert.equal(parseInsightsTimezone('not a zone; drop table'), 'UTC');

const cardA = { id: CARD_A, lapses: 5, ease_factor: 1.5, due_at: '2026-08-27T12:00:00.000Z', interval_days: 0.5, review_state: 'learning', suspended: false };
const cardB = { id: CARD_B, lapses: 0, ease_factor: 2.5, due_at: '2026-08-28T10:00:00.000Z', interval_days: 6, review_state: 'review', suspended: false };
const suspended = { id: CARD_C, lapses: 9, ease_factor: 1.3, due_at: '2026-08-20T00:00:00.000Z', suspended: true, review_state: 'learning' };
assert.ok(needsAttention(cardA, Date.parse(FIXED_NOW)));
assert.ok(!needsAttention(cardB, Date.parse(FIXED_NOW)));
assert.ok(needsAttention({
  id: 'learn-only', lapses: 0, ease_factor: 2.5, due_at: '2026-08-28T10:00:00.000Z',
  interval_days: 0.1, review_state: 'learning', suspended: false
}, Date.parse(FIXED_NOW)));
assert.ok(compareWeakCards(cardA, cardB) < 0);
assert.ok(weaknessScore(cardA, Date.parse(FIXED_NOW)) > weaknessScore(cardB, Date.parse(FIXED_NOW)));
assert.equal(pickWeakCards([cardA, cardB, suspended], { nowMs: Date.parse(FIXED_NOW) })[0].id, CARD_A);
assert.ok(!pickWeakCards([cardA, cardB, suspended], { nowMs: Date.parse(FIXED_NOW) }).some((row) => row.id === CARD_B));
assert.ok(!pickWeakCards([cardA, cardB, suspended], { nowMs: Date.parse(FIXED_NOW) }).some((row) => row.id === CARD_C));

const emptyPayload = buildInsightsPayload({
  range: '30d',
  timeZone: 'UTC',
  now: FIXED_NOW,
  events: [],
  cards: [],
  sets: []
});
assert.equal(emptyPayload.summary.reviews, 0);
assert.equal(emptyPayload.summary.activeDays, 0);
assert.equal(emptyPayload.weakCards.length, 0);
assert.doesNotMatch(JSON.stringify(emptyPayload), /accuracy/i);

await withEnv(async ({ store }) => {
  seed(store);

  const guest = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights'));
  assert.equal(guest.status, 401);

  const free = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights', {
    cookies: sessionCookie('access-free')
  }));
  const freeJson = await readJson(free);
  assert.equal(free.status, 403);
  assert.equal(freeJson.feature, 'studyInsights');

  const trial = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights?range=7d', {
    cookies: sessionCookie('access-trial')
  }));
  assert.equal(trial.status, 200);

  const admin = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights', {
    cookies: sessionCookie('access-admin')
  }));
  assert.equal(admin.status, 200);

  const badRange = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights?range=90d', {
    cookies: sessionCookie('access-pro-a')
  }));
  assert.equal(badRange.status, 400);

  const seven = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights?range=7d&tz=UTC', {
    cookies: sessionCookie('access-pro-a')
  }));
  const sevenJson = await readJson(seven);
  assert.equal(seven.status, 200);
  assertPrivate(seven, sevenJson);
  assert.equal(sevenJson.range, '7d');
  assert.equal(sevenJson.summary.reviews, 3);
  assert.equal(sevenJson.ratings.again, 1);
  assert.equal(sevenJson.ratings.hard, 1);
  assert.equal(sevenJson.ratings.good, 1);
  assert.equal(sevenJson.ratings.easy, 0);
  assert.equal(sevenJson.summary.activeDays, 3);
  assert.equal(sevenJson.summary.masteredCards, 1);
  assert.ok(sevenJson.summary.dueNow >= 2);
  assert.equal(sevenJson.summary.confidentReviews, 1 / 3);
  assert.equal(sevenJson.activity.length, 7);
  assert.ok(sevenJson.dueForecast.length === 7);
  assert.equal(sevenJson.weakCards[0].id, CARD_A);
  assert.ok(!sevenJson.weakCards.some((row) => row.id === CARD_B));
  assert.ok(!sevenJson.weakCards.some((row) => row.id === CARD_C));
  assert.ok(!sevenJson.weakCards.some((row) => row.id === CARD_D));
  assert.ok(!JSON.stringify(sevenJson).includes('Bob only'));
  assert.ok(!('weakness' in (sevenJson.weakCards[0] || {})));
  assert.doesNotMatch(JSON.stringify(sevenJson), /accuracy/i);

  const thirty = await insightsHandler(cookieRequest('https://atomurus.com/api/study/insights?range=30d', {
    cookies: sessionCookie('access-pro-a')
  }));
  const thirtyJson = await readJson(thirty);
  assert.equal(thirtyJson.summary.reviews, 4);
  assert.equal(thirtyJson.activity.length, 30);
  assert.equal(thirtyJson.dueForecast.length, 7);
  assert.equal(thirtyJson.ratings.easy, 1);
  assert.equal(thirtyJson.sets[0].title, 'Metals');
  assert.equal(thirtyJson.sets[0].reviews, 4);
  assert.equal(thirtyJson.sets[0].mastered, 1);

  const filtered = await insightsHandler(cookieRequest(`https://atomurus.com/api/study/insights?range=30d&setId=${SET_A}`, {
    cookies: sessionCookie('access-pro-a')
  }));
  const filteredJson = await readJson(filtered);
  assert.equal(filtered.status, 200);
  assert.equal(filteredJson.setId, SET_A);
  assert.ok(!filteredJson.weakCards.some((row) => row.id === CARD_D));

  const crossSet = await insightsHandler(cookieRequest(`https://atomurus.com/api/study/insights?setId=${SET_B}`, {
    cookies: sessionCookie('access-pro-a')
  }));
  assert.equal(crossSet.status, 404);

  const freeQueue = await queueHandler(cookieRequest('https://atomurus.com/api/study/review/queue?mode=weak', {
    cookies: sessionCookie('access-free')
  }));
  const freeQueueJson = await readJson(freeQueue);
  assert.equal(freeQueue.status, 403);
  assert.equal(freeQueueJson.feature, 'focusReview');

  const guestQueue = await queueHandler(cookieRequest('https://atomurus.com/api/study/review/queue?mode=weak'));
  assert.equal(guestQueue.status, 401);

  const focus = await queueHandler(cookieRequest('https://atomurus.com/api/study/review/queue?mode=weak&limit=20', {
    cookies: sessionCookie('access-pro-a')
  }));
  const focusJson = await readJson(focus);
  assert.equal(focus.status, 200);
  assertPrivate(focus, focusJson);
  assert.equal(focusJson.mode, 'weak');
  assert.equal(focusJson.cards[0].id, CARD_A);
  assert.ok(focusJson.cards.every((card) => card.id !== CARD_B));
  assert.ok(focusJson.cards.every((card) => card.id !== CARD_C));
  assert.ok(focusJson.cards.every((card) => card.id !== CARD_D));
  assert.ok(focusJson.cards.length <= 20);

  const focusTrial = await queueHandler(cookieRequest('https://atomurus.com/api/study/review/queue?mode=weak', {
    cookies: sessionCookie('access-trial')
  }));
  assert.equal(focusTrial.status, 200);

  const otherSet = await queueHandler(cookieRequest(`https://atomurus.com/api/study/review/queue?mode=weak&setId=${SET_B}`, {
    cookies: sessionCookie('access-pro-a')
  }));
  assert.equal(otherSet.status, 404);

  const eventId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const first = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: CARD_A,
      rating: 'good',
      clientEventId: eventId,
      expectedVersion: 3
    }
  }));
  const firstJson = await readJson(first);
  assert.equal(first.status, 200);
  assert.equal(firstJson.idempotent, false);

  const again = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: CARD_A,
      rating: 'again',
      clientEventId: eventId,
      expectedVersion: 3
    }
  }));
  const againJson = await readJson(again);
  assert.equal(again.status, 200);
  assert.equal(againJson.idempotent, true);

  const conflict = await reviewHandler(cookieRequest('https://atomurus.com/api/study/review', {
    method: 'POST',
    cookies: sessionCookie('access-pro-a'),
    body: {
      cardId: CARD_A,
      rating: 'easy',
      clientEventId: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
      expectedVersion: 3
    }
  }));
  assert.equal(conflict.status, 409);
});

const source = readFileSync(new URL('../netlify/lib/study-insights.mjs', import.meta.url), 'utf8');
assert.match(source, /MASTERED_INTERVAL_DAYS/);
assert.match(source, /lapses \* 100/);
assert.doesNotMatch(source, /Accuracy 87/);
assert.doesNotMatch(source, /knowledge score/i);

const queueSrc = readFileSync(new URL('../netlify/functions/study-review-queue.mjs', import.meta.url), 'utf8');
assert.match(queueSrc, /mode === 'weak'/);
assert.match(queueSrc, /focusReview/);
assert.match(queueSrc, /apply_study_review|smartReview/);
assert.doesNotMatch(queueSrc, /apply_focus_review/);

const client = readFileSync(new URL('../study-client.js', import.meta.url), 'utf8');
assert.match(client, /\/api\/study\/insights/);
assert.match(client, /reviewQueue/);

const app = readFileSync(new URL('../auth-app.js', import.meta.url), 'utf8');
assert.match(app, /section=insights/);
assert.match(app, /mode=weak/);
assert.match(app, /renderLockedInsights/);
assert.match(app, /data-insight-range/);
assert.match(app, /tCount|pickCountKey/);
assert.match(app, /tCount\('reviewEstimate', 'reviewEstimateOne'/);
assert.match(app, /focusLandingBody/);
assert.match(app, /ws-sparkline|is-sparkline/);
assert.doesNotMatch(app, /Accuracy 87/);
assert.doesNotMatch(app, /Knowledge score/);
assert.doesNotMatch(app, /location\.reload\s*\(/);
assert.doesNotMatch(app, /location\.replace\(next\)/);

console.log('insights tests passed');
