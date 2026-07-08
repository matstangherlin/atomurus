import assert from 'node:assert/strict';
import { resolvePricingContext, normalizeBillingPeriod } from '../netlify/lib/geo-pricing.mjs';
import { billingPlanKey, checkoutTrialDays } from '../netlify/lib/billing-stripe.mjs';

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

function request(url, headers = {}) {
  return new Request(url, { headers });
}

const br = resolvePricingContext(request('https://atomurus.com/pricing', {
  'x-country': 'BR',
  'accept-language': 'en-US,en;q=0.9'
}));
assert.equal(br.currency, 'brl');
assert.equal(br.source, 'geo');

const ptFallback = resolvePricingContext(request('https://atomurus.com/pricing', {
  'accept-language': 'pt-BR,pt;q=0.9'
}));
assert.equal(ptFallback.currency, 'brl');
assert.equal(ptFallback.source, 'language');

const usd = resolvePricingContext(request('https://atomurus.com/pricing', {
  'x-country': 'US',
  'accept-language': 'en-US,en;q=0.9'
}));
assert.equal(usd.currency, 'usd');
assert.equal(billingPlanKey(usd.currency, 'annual'), 'pro_annual_usd');
assert.equal(normalizeBillingPeriod('monthly'), 'monthly');
assert.equal(normalizeBillingPeriod('anything'), 'monthly');

assert.equal(checkoutTrialDays({
  createdAt: daysAgo(2),
  planSource: 'trial',
  trialEndsAt: daysFromNow(28)
}), 28);

assert.equal(checkoutTrialDays({
  createdAt: daysAgo(2),
  planSource: 'trial',
  trialEndsAt: daysFromNow(28)
}, {
  created_at: daysAgo(2),
  app_metadata: {}
}), 28);

assert.equal(checkoutTrialDays({
  createdAt: daysAgo(40),
  planSource: 'free',
  subscriptionStatus: null
}), 0);

assert.equal(checkoutTrialDays({
  createdAt: daysAgo(5),
  planSource: 'trial',
  trialEndsAt: daysFromNow(25),
  subscriptionStatus: 'active'
}), 0);

assert.equal(checkoutTrialDays({
  createdAt: daysAgo(10),
  planSource: 'trial',
  trialEndsAt: daysFromNow(20)
}, {
  created_at: daysAgo(10),
  app_metadata: { stripe_subscription_id: 'sub_123' }
}), 0);

console.log('billing geo tests passed');
