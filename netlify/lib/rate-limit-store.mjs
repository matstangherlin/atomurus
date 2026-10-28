import { MemoryAuthRateStore, digestKey } from './auth-rate-limit.mjs';

/**
 * Async rate-limit store for the contact form.
 * Memory is the default and is per isolate. A Redis-HTTP pipeline is used
 * only when RATE_LIMIT_STORE=rest and the URL and token are set.
 * Keys are hashed. The raw identifier never becomes the storage key.
 */

function retryAfterSeconds(oldest, windowMs, now) {
  return Math.max(1, Math.ceil((Number(oldest) + windowMs - now) / 1000));
}

function resultAt(payload, index) {
  const row = payload && payload[index];
  if (row && typeof row === 'object' && Object.prototype.hasOwnProperty.call(row, 'result')) return row.result;
  return row;
}

export class AsyncMemoryRateStore {
  constructor(options = {}) {
    this.memory = options.memory || new MemoryAuthRateStore({ maxKeys: options.maxKeys });
  }

  storageKey(raw) {
    return digestKey(raw, 'rate');
  }

  async peek(raw, now, windowMs) {
    const times = this.memory.peek(this.storageKey(raw), now, windowMs);
    return { count: times.length, oldest: times.length ? times[0] : now };
  }

  async hit(raw, now, windowMs) {
    const times = this.memory.hit(this.storageKey(raw), now, windowMs);
    return { count: times.length, oldest: times[0] };
  }
}

export class RestRateStore {
  constructor({ url, token, fetchImpl, timeoutMs = 800 } = {}) {
    this.url = url;
    this.token = token;
    this.fetchImpl = fetchImpl || globalThis.fetch;
    this.timeoutMs = timeoutMs;
  }

  async command(commands) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commands),
        signal: ctrl.signal
      });
      if (!res || res.ok === false) {
        const status = res && res.status ? res.status : 0;
        throw new Error(`rate store HTTP ${status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  fail() {
    console.warn('[rate-limit] store unavailable; continuing');
    return { count: 0, oldest: Date.now(), failed: true };
  }

  async peek(raw, now, windowMs) {
    try {
      const key = digestKey(raw, 'rate');
      const data = await this.command([['GET', key], ['PTTL', key]]);
      const count = Number(resultAt(data, 0)) || 0;
      const ttl = Number(resultAt(data, 1));
      const oldest = ttl > 0 ? now - Math.max(0, windowMs - ttl) : now;
      return { count, oldest };
    } catch (_err) {
      return this.fail();
    }
  }

  async hit(raw, now, windowMs) {
    try {
      const key = digestKey(raw, 'rate');
      const seconds = Math.max(1, Math.ceil(windowMs / 1000));
      const data = await this.command([
        ['INCR', key],
        ['EXPIRE', key, String(seconds), 'NX']
      ]);
      const count = Number(resultAt(data, 0)) || 0;
      return { count, oldest: now };
    } catch (_err) {
      return this.fail();
    }
  }
}

export function createRateStore(env = process.env, options = {}) {
  if (env && env.RATE_LIMIT_STORE === 'rest' && env.RATE_LIMIT_REST_URL && env.RATE_LIMIT_REST_TOKEN) {
    return new RestRateStore({
      url: env.RATE_LIMIT_REST_URL,
      token: env.RATE_LIMIT_REST_TOKEN,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs
    });
  }
  return new AsyncMemoryRateStore(options);
}

export function createAsyncRateLimiter({
  windowMs,
  limit,
  store,
  now = () => Date.now()
} = {}) {
  if (!Number.isFinite(windowMs) || windowMs <= 0) throw new Error('windowMs required');
  if (!Number.isFinite(limit) || limit <= 0) throw new Error('limit required');

  async function check(raw) {
    const ts = now();
    const snap = await store.peek(String(raw || ''), ts, windowMs);
    if (snap.failed) return { allowed: true, retryAfter: 0, degraded: true };
    if (snap.count >= limit) {
      return { allowed: false, retryAfter: retryAfterSeconds(snap.oldest, windowMs, ts) };
    }
    return { allowed: true, retryAfter: 0, remaining: limit - snap.count };
  }

  async function hit(raw) {
    const decision = await check(raw);
    if (!decision.allowed || decision.degraded) return decision;
    const ts = now();
    const snap = await store.hit(String(raw || ''), ts, windowMs);
    if (snap.failed) return { allowed: true, retryAfter: 0, degraded: true };
    if (snap.count > limit) {
      return { allowed: false, retryAfter: retryAfterSeconds(snap.oldest, windowMs, ts) };
    }
    return { allowed: true, retryAfter: 0 };
  }

  return { check, hit };
}
