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

resetAuthRateLimiters();
const { default: resendHandler } = await import('../netlify/functions/auth-resend-confirmation.mjs');
const originalFetch = globalThis.fetch;
process.env.SUPABASE_URL = 'https://demo.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.AUTH_SITE_URL = 'https://atomurus.com';
globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': 'application/json' }),
  text: async () => '{}',
  json: async () => ({})
});

function resendRequest(email, ip) {
  return new Request('https://atomurus.com/api/auth/resend-confirmation', {
    method: 'POST',
    headers: {
      origin: 'https://atomurus.com',
      'content-type': 'application/json',
      'x-forwarded-for': ip
    },
    body: JSON.stringify({ email })
  });
}

const known = await resendHandler(resendRequest('known@atomurus.com', '203.0.113.10'));
const unknown = await resendHandler(resendRequest('unknown@atomurus.com', '203.0.113.11'));
const knownBody = JSON.parse(await known.text());
const unknownBody = JSON.parse(await unknown.text());
assert.equal(known.status, 200);
assert.equal(unknown.status, 200);
assert.deepEqual(knownBody, unknownBody);
assert.deepEqual(knownBody, { ok: true });

let blocked = null;
for (let i = 0; i < 12; i += 1) {
  blocked = await resendHandler(resendRequest(`spray${i}@atomurus.com`, '203.0.113.12'));
}
assert.equal(blocked.status, 429);
const blockedBody = JSON.parse(await blocked.text());
assert.equal(blockedBody.ok, false);
assert.doesNotMatch(JSON.stringify(blockedBody), /spray|@atomurus/);

globalThis.fetch = originalFetch;
console.log('test-auth-rate-limit: ok');
