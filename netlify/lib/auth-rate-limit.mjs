import { createHash } from 'node:crypto';

/**
 * In-memory auth rate limiting for a single warm Netlify Function isolate.
 *
 * This is best-effort protection for that instance. It is NOT a distributed
 * or global rate limit. Concurrent isolates do not share this Map.
 *
 * Future step: swap MemoryAuthRateStore for a shared store (Redis / Upstash)
 * behind the same `store.hit(key, now, windowMs)` contract.
 */

const DEFAULT_MAX_KEYS = 2000;
const SWEEP_MS = 30_000;

export function digestKey(value, prefix = 'key') {
  const digest = createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);
  return `${prefix}:${digest}`;
}

export function hashIdentifier(value) {
  return digestKey(String(value || '').trim().toLowerCase(), 'identifier');
}

function retryAfterSeconds(oldest, windowMs, now) {
  return Math.max(1, Math.ceil((Number(oldest) + windowMs - now) / 1000));
}

export class MemoryAuthRateStore {
  constructor({ maxKeys = DEFAULT_MAX_KEYS } = {}) {
    this.maxKeys = Math.max(1, Number(maxKeys) || DEFAULT_MAX_KEYS);
    this.entries = new Map();
    this.lastSweep = 0;
  }

  peek(key, now, windowMs) {
    this.maybeSweep(now, windowMs);
    const entry = this.entries.get(key);
    if (!entry) return [];
    return entry.times.filter((time) => now - time < windowMs);
  }

  hit(key, now, windowMs) {
    const times = this.peek(key, now, windowMs).slice();
    times.push(now);
    this.entries.set(key, { times, last: now });
    this.enforceMaxKeys();
    return times;
  }

  size() {
    return this.entries.size;
  }

  keys() {
    return [...this.entries.keys()];
  }

  reset() {
    this.entries.clear();
    this.lastSweep = 0;
  }

  maybeSweep(now, windowMs) {
    if (now - this.lastSweep < SWEEP_MS) return;
    this.lastSweep = now;
    for (const [key, entry] of this.entries) {
      const times = (entry.times || []).filter((time) => now - time < windowMs);
      if (!times.length) this.entries.delete(key);
      else this.entries.set(key, { times, last: entry.last });
    }
    this.enforceMaxKeys();
  }

  enforceMaxKeys() {
    if (this.entries.size <= this.maxKeys) return;
    const ranked = [...this.entries.entries()].sort((a, b) => {
      if (a[1].last !== b[1].last) return a[1].last - b[1].last;
      return a[0] < b[0] ? -1 : 1;
    });
    const extra = this.entries.size - this.maxKeys;
    for (let i = 0; i < extra; i += 1) this.entries.delete(ranked[i][0]);
  }
}

export function createAuthRateLimiter({
  windowMs,
  limit,
  maxKeys = DEFAULT_MAX_KEYS,
  now = () => Date.now(),
  store
} = {}) {
  if (!Number.isFinite(windowMs) || windowMs <= 0) throw new Error('windowMs required');
  if (!Number.isFinite(limit) || limit <= 0) throw new Error('limit required');

  const memory = store || new MemoryAuthRateStore({ maxKeys });

  function check(key) {
    const ts = now();
    const times = memory.peek(String(key || ''), ts, windowMs);
    if (times.length >= limit) {
      return {
        allowed: false,
        retryAfter: retryAfterSeconds(times[0], windowMs, ts)
      };
    }
    return {
      allowed: true,
      retryAfter: 0,
      remaining: limit - times.length
    };
  }

  function hit(key) {
    const keyStr = String(key || '');
    const decision = check(keyStr);
    if (!decision.allowed) return decision;
    memory.hit(keyStr, now(), windowMs);
    return { allowed: true, retryAfter: 0 };
  }

  return {
    check,
    hit,
    size: () => memory.size(),
    keys: () => memory.keys(),
    reset: () => memory.reset(),
    windowMs,
    limit
  };
}

export function consumeAuthLimits(pairs) {
  let denied = null;
  for (const pair of pairs) {
    const decision = pair.limiter.check(pair.key);
    if (!decision.allowed && !denied) denied = decision;
  }
  if (denied) return denied;
  for (const pair of pairs) pair.limiter.hit(pair.key);
  return { allowed: true, retryAfter: 0 };
}

export const loginIpLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  maxKeys: 4000
});
export const loginIdentifierLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  maxKeys: 4000
});
export const signupIpLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  maxKeys: 4000
});
export const signupEmailLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 4,
  maxKeys: 4000
});
export const recoverIpLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  maxKeys: 4000
});
export const recoverEmailLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  maxKeys: 4000
});
export const resetIpLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  maxKeys: 2000
});
export const confirmIpLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  maxKeys: 2000
});
export const establishIpLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  maxKeys: 2000
});
export const refreshIpLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  maxKeys: 4000
});

const AUTH_LIMITERS = [
  loginIpLimiter,
  loginIdentifierLimiter,
  signupIpLimiter,
  signupEmailLimiter,
  recoverIpLimiter,
  recoverEmailLimiter,
  resetIpLimiter,
  confirmIpLimiter,
  establishIpLimiter,
  refreshIpLimiter
];

export function resetAuthRateLimiters() {
  AUTH_LIMITERS.forEach((limiter) => limiter.reset());
}
