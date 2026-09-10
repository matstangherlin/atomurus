import assert from 'node:assert/strict';
import { billingAppMetadataPatch, HANDLED_STRIPE_EVENTS, subscriptionPeriodEndIso } from '../netlify/lib/billing-lifecycle.mjs';
import { accessForUser, publicUser, isPaidSubscriptionStatus } from '../netlify/lib/plan-access.mjs';
import { createPortalSession, portalReturnUrl, stripeCustomerIdFromUser } from '../netlify/lib/billing-stripe.mjs';

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

assert.equal(isPaidSubscriptionStatus('active'), true);
assert.equal(isPaidSubscriptionStatus('trialing'), true);
assert.equal(isPaidSubscriptionStatus('past_due'), true);
assert.equal(isPaidSubscriptionStatus('canceled'), false);
assert.equal(isPaidSubscriptionStatus('unpaid'), false);
assert.equal(isPaidSubscriptionStatus('incomplete'), false);
assert.equal(isPaidSubscriptionStatus('incomplete_expired'), false);
assert.equal(isPaidSubscriptionStatus('paused'), false);

const pastDue = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { subscription_status: 'past_due', stripe_customer_id: 'cus_1' }
});
assert.equal(pastDue.plan, 'paid');
assert.equal(pastDue.canManageBilling, true);
assert.equal(pastDue.hasStripeCustomer, true);

const canceled = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'canceled', stripe_customer_id: 'cus_1' }
});
assert.equal(canceled.plan, 'free');
assert.equal(canceled.features.studyCloud, false);
assert.equal(canceled.canManageBilling, false);

const cancelScheduled = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: {
    subscription_status: 'active',
    cancel_at_period_end: true,
    current_period_end: daysFromNow(12),
    stripe_customer_id: 'cus_1',
    subscription_interval: 'annual',
    subscription_currency: 'brl'
  }
});
assert.equal(cancelScheduled.plan, 'paid');
assert.equal(cancelScheduled.cancelAtPeriodEnd, true);
assert.ok(cancelScheduled.currentPeriodEnd);
assert.equal(cancelScheduled.canManageBilling, true);

const autoTrial = accessForUser({ createdAt: daysAgo(2), email: 't@x.com' });
assert.equal(autoTrial.planSource, 'trial');
assert.equal(autoTrial.canManageBilling, false);
assert.equal(autoTrial.hasStripeCustomer, false);

const billingTrial = accessForUser({
  createdAt: daysAgo(2),
  appMetadata: { subscription_status: 'trialing', stripe_customer_id: 'cus_trial' }
});
assert.equal(billingTrial.planSource, 'billing_trial');
assert.equal(billingTrial.canManageBilling, true);

const unpaid = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { subscription_status: 'unpaid' }
});
assert.equal(unpaid.plan, 'free');

const pub = publicUser({
  id: 'u1',
  role: 'authenticated',
  email: 'p@x.com',
  createdAt: daysAgo(40),
  appMetadata: { subscription_status: 'active', stripe_customer_id: 'cus_secret', stripe_subscription_id: 'sub_secret' }
});
assert.equal(pub.hasStripeCustomer, true);
assert.equal(pub.canManageBilling, true);
assert.equal(pub.stripeCustomerId, null);
assert.equal(pub.stripeSubscriptionId, null);

const reactivated = accessForUser({
  createdAt: daysAgo(40),
  appMetadata: { subscription_status: 'active', stripe_customer_id: 'cus_1' }
});
assert.equal(reactivated.features.studyCloud, true);
assert.equal(reactivated.features.smartReview, true);

const periodEnd = Math.floor(Date.now() / 1000) + 86400;
const patch = billingAppMetadataPatch({
  id: 'sub_1',
  status: 'active',
  customer: 'cus_1',
  cancel_at_period_end: true,
  current_period_end: periodEnd,
  metadata: { atomurus_user_id: 'user-a', atomurus_currency: 'brl', atomurus_interval: 'annual', atomurus_plan_key: 'pro_annual_brl' }
}, { now: '2026-08-28T00:00:00.000Z' });
assert.equal(patch.atomurus_plan, 'paid');
assert.equal(patch.cancel_at_period_end, true);
assert.equal(patch.stripe_customer_id, 'cus_1');
assert.equal(patch.billing_updated_at, '2026-08-28T00:00:00.000Z');
assert.ok(HANDLED_STRIPE_EVENTS.includes('invoice.paid'));
assert.ok(HANDLED_STRIPE_EVENTS.includes('customer.subscription.deleted'));

const canceledPatch = billingAppMetadataPatch({
  id: 'sub_1',
  status: 'canceled',
  customer: 'cus_1',
  cancel_at_period_end: false,
  metadata: { atomurus_user_id: 'user-a' }
});
assert.equal(canceledPatch.atomurus_plan, 'free');
assert.equal(canceledPatch.subscription_status, 'canceled');

const again = billingAppMetadataPatch({
  id: 'sub_1',
  status: 'canceled',
  customer: 'cus_1',
  metadata: { atomurus_user_id: 'user-a' }
});
assert.deepEqual(
  { ...canceledPatch, billing_updated_at: null },
  { ...again, billing_updated_at: null }
);

assert.equal(stripeCustomerIdFromUser({ app_metadata: {} }), null);
assert.equal(stripeCustomerIdFromUser({ app_metadata: { stripe_customer_id: 'cus_abc' } }), 'cus_abc');
const portalRequest = new Request('https://atomurus.com/api/billing/portal');
assert.match(portalReturnUrl(portalRequest), /\/account\?tab=plan$/);

await assert.rejects(
  () => createPortalSession({
    request: portalRequest,
    rawUser: { app_metadata: {} }
  }),
  (err) => err.code === 'billing_customer_missing'
);

const expectedReturn = portalReturnUrl(portalRequest);
const fakeStripe = {
  billingPortal: {
    sessions: {
      create: async (args) => {
        assert.equal(args.customer, 'cus_abc');
        assert.equal(args.return_url, expectedReturn);
        assert.equal(Object.prototype.hasOwnProperty.call(args, 'customer_email'), false);
        return { url: 'https://billing.stripe.com/session/test' };
      }
    }
  }
};
const portal = await createPortalSession({
  request: portalRequest,
  rawUser: { app_metadata: { stripe_customer_id: 'cus_abc' } },
  stripe: fakeStripe
});
assert.equal(portal.url, 'https://billing.stripe.com/session/test');

assert.ok(subscriptionPeriodEndIso({ current_period_end: periodEnd }));

console.log('billing lifecycle tests passed');
