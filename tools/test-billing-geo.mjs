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

// Currency follows country, not language: Portuguese outside Brazil pays in
// dollars, English inside Brazil pays in reais.
const ptAbroad = resolvePricingContext(request('https://atomurus.com/pricing?lang=pt-BR', {
  'x-country': 'PT',
  'accept-language': 'pt-PT,pt;q=0.9'
}));
assert.equal(ptAbroad.currency, 'usd');
const viaContext = resolvePricingContext(request('https://atomurus.com/pricing', { 'accept-language': 'en' }), {}, { geo: { country: { code: 'BR' } } });
assert.equal(viaContext.currency, 'brl');
assert.equal(viaContext.country, 'BR');
const viaGeoHeader = resolvePricingContext(request('https://atomurus.com/pricing', {
  'x-nf-geo': Buffer.from(JSON.stringify({ country: { code: 'JP' } })).toString('base64'),
  'accept-language': 'pt-BR'
}));
assert.equal(viaGeoHeader.currency, 'usd');
assert.equal(viaGeoHeader.country, 'JP');
// A client-sent currency is ignored; only the country decides.
assert.equal(resolvePricingContext(request('https://atomurus.com/pricing', { 'x-country': 'US' }), { currency: 'brl' }).currency, 'usd');
console.log('billing geo country rule ok');

// Edge function: cookie hint for the display currency.
const { default: geoEdge } = await import('../netlify/edge-functions/geo-currency.js');
async function edgeCookie(code, cookie = '') {
  const res = await geoEdge(new Request('https://atomurus.com/pricing', { headers: { cookie } }), {
    geo: code ? { country: { code } } : {},
    next: async () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
  });
  return res.headers.get('set-cookie');
}
assert.match(await edgeCookie('BR'), /^atomurus-geo=BR\.brl;/);
assert.match(await edgeCookie('DE'), /^atomurus-geo=DE\.usd;/);
assert.equal(await edgeCookie(''), null);
assert.equal(await edgeCookie('BR', 'atomurus-geo=BR.brl'), null);
console.log('geo edge cookie ok');
