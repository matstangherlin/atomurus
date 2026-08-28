import { isPaidSubscriptionStatus } from './plan-access.mjs';

function normalizeSubscriptionInterval(value) {
  const interval = String(value || '').trim().toLowerCase();
  return interval === 'year' || interval === 'annual' ? 'annual' : 'monthly';
}

export function planFromSubscriptionMetadata(metadata = {}, subscription) {
  const planKey = String(metadata.atomurus_plan_key || '').trim();
  const currency = String(
    metadata.atomurus_currency ||
    subscription?.currency ||
    ''
  ).trim().toLowerCase();
  const interval = normalizeSubscriptionInterval(
    metadata.atomurus_interval ||
    subscription?.items?.data?.[0]?.price?.recurring?.interval
  );
  return {
    planKey: planKey || (currency ? `pro_${interval}_${currency}` : null),
    currency: currency || null,
    interval
  };
}

export function subscriptionPeriodEndUnix(subscription) {
  const top = Number(subscription?.current_period_end);
  if (Number.isFinite(top) && top > 0) return top;
  const item = Number(subscription?.items?.data?.[0]?.current_period_end);
  if (Number.isFinite(item) && item > 0) return item;
  return null;
}

export function subscriptionPeriodEndIso(subscription) {
  const unix = subscriptionPeriodEndUnix(subscription);
  return unix ? new Date(unix * 1000).toISOString() : null;
}

/**
 * Metadata patch applied for every handled Stripe billing event.
 * Re-processing the same event rewrites the same keys with the same values
 * (last-write-wins). That is naturally idempotent: it does not increment
 * counters or append lists.
 */
export function billingAppMetadataPatch(subscription, overrides = {}) {
  const metadata = {
    ...(subscription?.metadata || {}),
    ...(overrides.metadata || {})
  };
  const plan = planFromSubscriptionMetadata(metadata, subscription);
  const status = String(overrides.status || subscription?.status || '').trim().toLowerCase();
  const trialEnd = subscription?.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;
  const customer = subscription?.customer
    ? String(subscription.customer)
    : (overrides.customer ? String(overrides.customer) : null);

  return {
    atomurus_plan: isPaidSubscriptionStatus(status) ? 'paid' : 'free',
    subscription_status: status || null,
    subscription_interval: plan.interval,
    subscription_currency: plan.currency,
    atomurus_plan_key: plan.planKey,
    stripe_customer_id: customer,
    stripe_subscription_id: subscription?.id ? String(subscription.id) : null,
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    current_period_end: subscriptionPeriodEndIso(subscription),
    atomurus_trial_ends_at: status === 'trialing' ? trialEnd : null,
    billing_updated_at: overrides.now || new Date().toISOString()
  };
}

export function stripeUserIdFromMetadata(subscription, overrides = {}) {
  const metadata = {
    ...(subscription?.metadata || {}),
    ...(overrides.metadata || {})
  };
  return String(metadata.atomurus_user_id || '').trim();
}

export const HANDLED_STRIPE_EVENTS = Object.freeze([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
]);
