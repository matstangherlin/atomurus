import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  consumeAuthLimits,
  createAuthRateLimiter,
  hashIdentifier,
  loginIdentifierLimiter,
  refreshIpLimiter,
  resetAuthRateLimiters
} from '../netlify/lib/auth-rate-limit.mjs';
import { createRateLimit } from '../netlify/lib/netlify-identity-utils.mjs';

resetAuthRateLimiters();

const hashed = hashIdentifier('alice@atomurus.com');
assert.match(hashed, /^identifier:[a-f0-9]{16}$/);
assert.equal(hashed.includes('@'), false);
assert.equal(hashed.includes('alice'), false);
assert.equal(
  hashed,
  `identifier:${createHash('sha256').update('alice@atomurus.com').digest('hex').slice(0, 16)}`
);

let clock = 1_000_000;
const limiter = createAuthRateLimiter({
  windowMs: 1_000,
  limit: 2,
  maxKeys: 4,
  now: () => clock
});

assert.equal(limiter.hit('ip:1').allowed, true);
assert.equal(limiter.hit('ip:1').allowed, true);
const denied = limiter.hit('ip:1');
assert.equal(denied.allowed, false);
assert.ok(denied.retryAfter >= 1);

clock += 1_001;
assert.equal(limiter.hit('ip:1').allowed, true);

const crowded = createAuthRateLimiter({
  windowMs: 60_000,
  limit: 5,
  maxKeys: 1000,
  now: () => 5_000_000
});
for (let i = 0; i < 1500; i += 1) {
  assert.equal(crowded.hit(`ip:${i}`).allowed, true);
}
assert.ok(crowded.size() <= 1000);
assert.equal(crowded.keys().some((key) => key.includes('@')), false);

const wrapped = createRateLimit({ windowMs: 60_000, limit: 3, maxKeys: 1000 });
for (let i = 0; i < 1500; i += 1) {
  assert.equal(wrapped(`ip:${i}`), true);
}
assert.ok(wrapped.size() <= 1000);

const ipLimiter = createAuthRateLimiter({ windowMs: 10_000, limit: 1, now: () => 9_000_000 });
const emailLimiter = createAuthRateLimiter({ windowMs: 10_000, limit: 1, now: () => 9_000_000 });
assert.equal(consumeAuthLimits([
  { limiter: ipLimiter, key: 'ip:a' },
  { limiter: emailLimiter, key: hashIdentifier('a@b.com') }
]).allowed, true);
const second = consumeAuthLimits([
  { limiter: ipLimiter, key: 'ip:a' },
  { limiter: emailLimiter, key: hashIdentifier('c@d.com') }
]);
assert.equal(second.allowed, false);
assert.ok(second.retryAfter >= 1);
assert.equal(emailLimiter.keys().join(' ').includes('@'), false);

loginIdentifierLimiter.hit(hashIdentifier('secret.user@atomurus.com'));
assert.equal(loginIdentifierLimiter.keys().some((key) => /secret\.user@|@atomurus/.test(key)), false);

assert.equal(refreshIpLimiter.limit, 60);
assert.equal(refreshIpLimiter.windowMs, 15 * 60 * 1000);

console.log('test-auth-rate-limit: ok');
