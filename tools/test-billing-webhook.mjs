// Stripe webhook (prompt 29, B05): dedupe by event.id, generic errors, no
// effect repeated. Stripe and Supabase are fakes; nothing leaves the process.
import assert from 'node:assert/strict';
import { createWebhookHandler } from '../netlify/functions/billing-webhook.mjs';
import { memoryProcessedEvents, processedEventsStore, supabaseProcessedEvents } from '../netlify/lib/processed-events.mjs';

const subscription = {
  id: 'sub_1',
  status: 'active',
  customer: 'cus_1',
  metadata: { atomurus_user_id: 'user-1' },
  items: { data: [{ price: { id: 'price_1', recurring: { interval: 'month' }, currency: 'brl' } }] },
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400
};

function request(body, { signature = 'sig', method = 'POST' } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (signature) headers['stripe-signature'] = signature;
  return new Request('https://atomurus.com/api/billing/webhook', { method, headers, body: method === 'POST' ? JSON.stringify(body) : undefined });
}

function harness({ failPatch = false, store = memoryProcessedEvents() } = {}) {
  const calls = { patch: 0, retrieve: 0, logs: [] };
  const handler = createWebhookHandler({
    constructEvent: (payload, signature) => {
      if (signature !== 'sig') {
        const err = new Error('No signatures found matching the expected signature for payload. Secret: whsec_internal');
        err.type = 'StripeSignatureVerificationError';
        throw err;
      }
      return JSON.parse(payload);
    },
    stripe: () => ({ subscriptions: { retrieve: async () => { calls.retrieve += 1; return subscription; } } }),
    patchAppMetadata: async (userId, patch) => {
      calls.patch += 1;
      assert.equal(userId, 'user-1');
      assert.equal(typeof patch, 'object');
      if (failPatch) throw new Error('Supabase admin 500: connection reset at db-internal-7');
    },
    processedEvents: store,
    log: (...args) => calls.logs.push(args.map(String).join(' '))
  });
  return { handler, calls, store };
}

const updated = { id: 'evt_1', type: 'customer.subscription.updated', data: { object: subscription } };

// Same event twice: one effect, the second answer says duplicate.
{
  const { handler, calls } = harness();
  const first = await handler(request(updated));
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true });
  const second = await handler(request(updated));
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), { ok: true, duplicate: true });
  assert.equal(calls.patch, 1, 'the duplicate does not patch the metadata again');
  const other = await handler(request({ ...updated, id: 'evt_2' }));
  assert.equal(other.status, 200);
  assert.equal(calls.patch, 2, 'a different event still runs');
}

// Internal failure: 500 with a generic body; the claim is released so Stripe's retry runs.
{
  const store = memoryProcessedEvents();
  const failing = harness({ failPatch: true, store });
  const res = await failing.handler(request(updated));
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.deepEqual(body, { ok: false, error: 'Webhook handling failed' });
  assert.doesNotMatch(JSON.stringify(body), /connection reset|db-internal/, 'no internal message to the caller');
  assert.ok(failing.calls.logs.some((line) => /connection reset/.test(line)), 'the detail is logged');
  const retry = harness({ store });
  const again = await retry.handler(request(updated));
  assert.equal(again.status, 200, 'not recorded after a failure: the retry processes it');
  assert.equal(retry.calls.patch, 1);
}

// Invalid or missing signature: 400, generic, no secret echoed, nothing processed.
{
  const { handler, calls } = harness();
  const bad = await handler(request(updated, { signature: 'forged' }));
  assert.equal(bad.status, 400);
  const badBody = await bad.json();
  assert.deepEqual(badBody, { ok: false, error: 'Webhook handling failed' });
  assert.doesNotMatch(JSON.stringify(badBody), /whsec|signature/i);
  const missing = await handler(request(updated, { signature: '' }));
  assert.equal(missing.status, 400);
  assert.equal(calls.patch, 0);
  assert.equal((await handler(request(null, { method: 'GET' }))).status, 405);
}

// Invoice events read the current subscription from Stripe.
{
  const { handler, calls } = harness();
  const paid = await handler(request({ id: 'evt_inv', type: 'invoice.paid', data: { object: { subscription: 'sub_1' } } }));
  assert.equal(paid.status, 200);
  assert.equal(calls.retrieve, 1);
  assert.equal(calls.patch, 1);
  const ignored = await handler(request({ id: 'evt_other', type: 'charge.refunded', data: { object: {} } }));
  assert.equal(ignored.status, 200);
  assert.equal(calls.patch, 1, 'unhandled types do nothing');
}

// A dedupe store that is down does not block the webhook.
{
  const broken = { claim: async () => { throw new Error('store down'); }, commit: async () => { throw new Error('store down'); }, release: async () => {} };
  const { handler, calls } = harness({ store: broken });
  const res = await handler(request(updated));
  assert.equal(res.status, 200);
  assert.equal(calls.patch, 1);
}

// Memory store: TTL and size cap.
{
  let t = 0;
  const store = memoryProcessedEvents({ ttlMs: 1000, max: 2, now: () => t });
  assert.equal(await store.claim('a'), true);
  assert.equal(await store.claim('a'), false, 'in flight');
  await store.commit('a');
  assert.equal(await store.claim('a'), false, 'done');
  t = 5000;
  assert.equal(await store.claim('a'), true, 'forgotten after the TTL');
  await store.release('a');
  assert.equal(await store.claim('a'), true, 'released claims can be taken again');
  await store.claim('b');
  await store.claim('c');
  assert.equal(await store.claim('a'), true, 'the oldest is dropped past the cap');
}

// Supabase store: insert-or-ignore claims, delete releases. Fake PostgREST.
{
  const rows = new Set();
  const calls = [];
  const rest = async (path, init) => {
    calls.push(`${init.method} ${path}`);
    if (init.method === 'POST') {
      const id = JSON.parse(init.body).event_id;
      assert.match(init.headers.Prefer, /ignore-duplicates/);
      if (rows.has(id)) return [];
      rows.add(id);
      return [{ event_id: id }];
    }
    if (init.method === 'DELETE') {
      rows.delete(decodeURIComponent(path.split('eq.')[1]));
      return null;
    }
    throw new Error('unexpected ' + init.method);
  };
  const store = supabaseProcessedEvents({ rest });
  assert.equal(await store.claim('evt_9'), true);
  assert.equal(await store.claim('evt_9'), false);
  await store.release('evt_9');
  assert.equal(await store.claim('evt_9'), true);
  assert.ok(calls.every((c) => c.includes('/processed_stripe_events')));
}

// The store is chosen by STRIPE_EVENT_DEDUPE; without it, memory.
assert.equal(processedEventsStore({}).kind, 'memory');
assert.equal(processedEventsStore({ STRIPE_EVENT_DEDUPE: 'supabase' }).kind, 'supabase');
assert.equal(processedEventsStore({}), processedEventsStore({}), 'one memory store per instance');

console.log('test-billing-webhook: ok');
