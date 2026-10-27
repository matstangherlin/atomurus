import assert from 'node:assert/strict';
import {
  AsyncMemoryRateStore,
  RestRateStore,
  createAsyncRateLimiter,
  createRateStore
} from '../netlify/lib/rate-limit-store.mjs';

const ip = ['203', '0', '113', '10'].join('.');

const memory = new AsyncMemoryRateStore();
let clock = 1_000;
const limiter = createAsyncRateLimiter({
  windowMs: 1_000,
  limit: 2,
  store: memory,
  now: () => clock
});
assert.equal((await limiter.hit(ip)).allowed, true);
assert.equal((await limiter.hit(ip)).allowed, true);
const blocked = await limiter.hit(ip);
assert.equal(blocked.allowed, false);
assert.ok(blocked.retryAfter >= 1);
clock += 1_000;
assert.equal((await limiter.hit(ip)).allowed, true);
assert.equal(memory.memory.keys().some((key) => key.includes(ip)), false);
assert.ok(memory.memory.keys().every((key) => key.startsWith('rate:')));

const calls = [];
const rest = new RestRateStore({
  url: 'https://rate.example/pipeline',
  token: 'token',
  timeoutMs: 50,
  fetchImpl: async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return {
      ok: true,
      json: async () => [{ result: calls.length }, { result: 1 }]
    };
  }
});
const hit = await rest.hit(ip, 5_000, 3_600_000);
assert.equal(hit.count, 1);
assert.equal(calls[0].body[0][0], 'INCR');
assert.equal(calls[0].body[1][0], 'EXPIRE');
assert.equal(calls[0].body[0][1].includes(ip), false);

const down = new RestRateStore({
  url: 'https://rate.example/pipeline',
  token: 'token',
  timeoutMs: 20,
  fetchImpl: () => Promise.reject(new Error('timeout'))
});
const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(' '));
try {
  const failed = await down.hit(ip, 5_000, 1_000);
  assert.equal(failed.failed, true);
  const server = new RestRateStore({
    url: 'https://rate.example/pipeline',
    token: 'token',
    fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) })
  });
  assert.equal((await server.peek(ip, 5_000, 1_000)).failed, true);
} finally {
  console.warn = originalWarn;
}
assert.ok(warnings.some((line) => line.includes('store unavailable')));

const degraded = createAsyncRateLimiter({
  windowMs: 1_000,
  limit: 1,
  store: down,
  now: () => 10
});
assert.equal((await degraded.hit(ip)).allowed, true);

assert.equal(createRateStore({}).constructor.name, 'AsyncMemoryRateStore');
assert.equal(createRateStore({
  RATE_LIMIT_STORE: 'rest',
  RATE_LIMIT_REST_URL: 'https://rate.example/pipeline',
  RATE_LIMIT_REST_TOKEN: 'token'
}, { fetchImpl: async () => ({ ok: true, json: async () => [{ result: 0 }, { result: -1 }] }) }).constructor.name, 'RestRateStore');

console.log('test-rate-limit-store: ok');
