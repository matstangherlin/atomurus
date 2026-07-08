import assert from 'node:assert/strict';
import { accessForUser, publicUser, trialEndsAtForUser } from '../netlify/lib/plan-access.mjs';

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

const fresh = accessForUser({ createdAt: daysAgo(2), email: 'a@b.com' });
assert.equal(fresh.plan, 'paid');
assert.equal(fresh.planSource, 'trial');
assert.equal(fresh.adsFree, true);
assert.ok(fresh.trialEndsAt);

const expired = accessForUser({ createdAt: daysAgo(40), email: 'a@b.com' });
assert.equal(expired.plan, 'free');
assert.equal(expired.adsFree, false);

const paid = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'active' }
});
assert.equal(paid.plan, 'paid');
assert.equal(paid.planSource, 'paid');
assert.equal(paid.features.premiumLessons, true);

const admin = accessForUser({ role: 'admin', createdAt: daysAgo(100) });
assert.equal(admin.plan, 'admin');
assert.equal(admin.adsFree, true);

const pub = publicUser({
  id: '1',
  email: 'x@y.com',
  confirmedAt: daysAgo(1),
  createdAt: daysAgo(1)
});
assert.equal(pub.isPro, true);
assert.equal(pub.features.adsFree, true);

assert.ok(trialEndsAtForUser({ appMetadata: { atomurus_trial_ends_at: daysFromNow(10) } }));

console.log('plan-access tests passed');
